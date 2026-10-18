// ============================================================
// MooEarth Live — Weather Dashboard
// ============================================================
// The central weather experience: 3D Interactive Earth Globe +
// Location Search + 8 Layer Selector + Animated Wind Particle System +
// Forecast Timeline Scrubber + Color Scales + Telemetry Panel.
// Desktop: side-by-side layout. Mobile: full-screen interactive globe with bottom sheet.

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import WeatherSearch from './WeatherSearch';
import WeatherLayerSelector from './WeatherLayerSelector';
import WindyTimeScrubber from './WindyTimeScrubber';
import WindyLegendBar from './WindyLegendBar';
import WindyMapControls from './WindyMapControls';
import WeatherPanel from './WeatherPanel';
import WindParticleOverlay from './WindParticleOverlay';
import WeatherTimeline from './WeatherTimeline';
import WeatherLegend from './WeatherLegend';
import EventPopup from '@/components/Globe/EventPopup';
import RadarCoverageNotice from './RadarCoverageNotice';
import {
  isLocationCoveredByRadar,
  getActiveRadarMetadata,
  type RadarMetadataResponse,
} from '@/services/weather/radarAdapter';
import { getSatelliteMetadata } from '@/services/weather/satelliteImageryService';
import { getActiveTropicalCyclonesAsEvents } from '@/services/weather/cycloneTrackingService';
import { BASELINE_CYCLONE_EVENTS, BASELINE_LIGHTNING_EVENTS } from '@/components/Globe/WeatherLayers';
import { useWeatherData } from '@/hooks/useWeatherData';
import type { GeocodingResult, UnitPreferences, ForecastResponse, SatelliteSpectralMode } from '@/services/weather/types';
import type { GlobeApi } from '@/hooks/useGlobeControls';
import type { WorldEvent } from '@/types';
import { getCoordinatesForCountry } from '@/lib/constants';
import type { GlobalWeatherGridResponse } from '@/services/weather/globalGridService';
import { getWmoWeatherInfo } from '@/services/weather/forecastService';

// Check reduced-motion preference
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

// Synchronize displayed forecast and telemetry with the forecast timeline scrubber
function computeDisplayedForecast(
  forecast: ForecastResponse | null,
  timelineIndex: number
): ForecastResponse | null {
  if (!forecast) return null;
  if (timelineIndex === 0 || !forecast.hourly?.time?.[timelineIndex]) {
    return forecast;
  }
  const h = forecast.hourly;
  const time = h.time[timelineIndex];
  const wmo = getWmoWeatherInfo(h.weatherCode?.[timelineIndex] ?? 0);
  const curr = forecast.current;
  return {
    ...forecast,
    current: {
      ...curr,
      time,
      temperature: h.temperature2m?.[timelineIndex] ?? curr.temperature,
      apparentTemperature: h.apparentTemperature?.[timelineIndex] ?? curr.apparentTemperature,
      precipitation: h.precipitation?.[timelineIndex] ?? curr.precipitation,
      weatherCode: h.weatherCode?.[timelineIndex] ?? curr.weatherCode,
      weatherDescription: wmo.desc,
      weatherEmoji: wmo.emoji,
      surfacePressure: h.surfacePressure?.[timelineIndex] ?? curr.surfacePressure,
      windSpeed: h.windSpeed10m?.[timelineIndex] ?? curr.windSpeed,
      windDirection: h.windDirection10m?.[timelineIndex] ?? curr.windDirection,
      windGusts: h.windGusts10m?.[timelineIndex] ?? curr.windGusts,
      relativeHumidity: h.relativeHumidity2m?.[timelineIndex] ?? curr.relativeHumidity,
      cloudCover: h.cloudCover?.[timelineIndex] ?? curr.cloudCover,
      isDay: Boolean(h.isDay?.[timelineIndex] ?? curr.isDay),
    },
  };
}

// Dynamically import the primary 3D Globe Scene component with SSR disabled
const GlobeScene = dynamic(
  () => import('@/components/Globe/GlobeScene'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-[#020208] flex flex-col items-center justify-center text-cyan-400 font-mono text-xs tracking-wider animate-pulse">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-3" />
        <span>INITIALIZING 3D EARTH GLOBE...</span>
      </div>
    ),
  }
);

// Dynamically import the MapLibre GL JS City Map Viewer with SSR disabled
const CityMapViewer = dynamic(
  () => import('@/components/Map/CityMapViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] bg-[#020208] flex flex-col items-center justify-center text-cyan-400 font-mono text-xs tracking-wider animate-pulse">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-3" />
        <span>INITIALIZING INTERACTIVE CITY MAP...</span>
      </div>
    ),
  }
);

export default function WeatherDashboard() {
  const weather = useWeatherData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'globe' | 'city-map'>('globe');
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [spectralMode, setSpectralMode] = useState<SatelliteSpectralMode>('infra');
  const [overlayRadar, setOverlayRadar] = useState(false);
  const [showPressureIsobars, setShowPressureIsobars] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [gridData, setGridData] = useState<GlobalWeatherGridResponse | null>(null);
  const [isGridLoading, setIsGridLoading] = useState(true);
  const globeApiRef = useRef<GlobeApi | null>(null);
  const initialUrlRestoredRef = useRef(false);
  const [selectedDisasterEvent, setSelectedDisasterEvent] = useState<WorldEvent | null>(null);
  const [radarMetadata, setRadarMetadata] = useState<RadarMetadataResponse | null>(null);
  const [radarFrameIndex, setRadarFrameIndex] = useState<number>(11);

  // Active cyclones list for quick-tracking (official NOAA NHC, JTWC, and IMD feeds)
  const activeCyclones = useMemo(() => {
    return getActiveTropicalCyclonesAsEvents(events);
  }, [events]);

  // Active thunderstorms list for quick-tracking
  const activeThunderstorms = useMemo(() => {
    const fromEvents = events.filter((e) => {
      const t = (e.title || '').toLowerCase();
      return t.includes('lightning') || t.includes('thunderstorm') || t.includes('convective');
    });
    return fromEvents.length > 0 ? fromEvents : BASELINE_LIGHTNING_EVENTS;
  }, [events]);

  // Genuine satellite metadata & observation timestamp (NASA GIBS / NOAA GOES)
  const satelliteMeta = useMemo(() => {
    return getSatelliteMetadata(spectralMode, timelineIndex);
  }, [spectralMode, timelineIndex]);

  // Helper: push location and view mode into URL query params for shareable links
  const updateUrlParams = useCallback(
    (lat: number, lng: number, city?: string, country?: string, mode?: 'globe' | 'city-map') => {
      try {
        const params = new URLSearchParams();
        const currentMode = mode !== undefined ? mode : viewMode;
        if (currentMode === 'city-map') {
          params.set('view', 'city');
        }
        params.set('lat', lat.toFixed(4));
        params.set('lng', lng.toFixed(4));
        if (city) params.set('city', city);
        if (country) params.set('country', country);
        router.replace(`/weather?${params.toString()}`, { scroll: false });
      } catch {
        // Silently ignore URL update errors
      }
    },
    [router, viewMode]
  );

  // Daily streak for Games Hub badge
  const [dailyStreak, setDailyStreak] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const streakVal = parseInt(localStorage.getItem('mooearth_daily_streak') || '0', 10);
        setDailyStreak(streakVal);
      } catch {
        // Fallback
      }
    }
  }, []);

  // Helper: get flyTo duration respecting reduced-motion
  const getFlyDuration = useCallback((ms: number) => (prefersReducedMotion() ? 0 : ms), []);

  // Action: Explore City Map using MapLibre GL JS
  const handleExploreCity = useCallback(() => {
    if (!weather.selectedLocation) return;
    setViewMode('city-map');
    updateUrlParams(
      weather.selectedLocation.latitude,
      weather.selectedLocation.longitude,
      weather.selectedLocation.name,
      weather.selectedLocation.country,
      'city-map'
    );
  }, [weather.selectedLocation, updateUrlParams]);

  // Action: Return to 3D Earth Globe preserving coordinates, camera, and weather state
  const handleReturnToEarth = useCallback(() => {
    setViewMode('globe');
    if (weather.selectedLocation) {
      updateUrlParams(
        weather.selectedLocation.latitude,
        weather.selectedLocation.longitude,
        weather.selectedLocation.name,
        weather.selectedLocation.country,
        'globe'
      );
      globeApiRef.current?.flyTo(
        {
          lat: weather.selectedLocation.latitude,
          lng: weather.selectedLocation.longitude,
          altitude: 1.6,
        },
        getFlyDuration(1200)
      );
    }
  }, [weather.selectedLocation, updateUrlParams, getFlyDuration]);

  // Fetch live global events for radar/atmosphere integration
  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch global meteorological grid telemetry (48h wind vectors, temperature, precipitation)
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      temperature_unit: weather.units,
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
    });
    fetch(`/api/weather/grid?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load global grid');
        return res.json();
      })
      .then((data: GlobalWeatherGridResponse) => {
        if (!cancelled) {
          setGridData(data);
          setIsGridLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Weather grid fetch error:', err);
        if (!cancelled) setIsGridLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weather.units]);

  // Fetch Doppler radar frames when viewing radar or overlaying radar
  useEffect(() => {
    let cancelled = false;
    if (weather.activeLayer === 'radar' || overlayRadar) {
      fetch('/api/weather/radar/frames')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch radar frames');
          return res.json();
        })
        .then((data: RadarMetadataResponse) => {
          if (!cancelled && data && data.frames) {
            setRadarMetadata(data);
            setRadarFrameIndex(data.frames.length - 1);
          }
        })
        .catch(async () => {
          try {
            const fallback = await getActiveRadarMetadata();
            if (!cancelled && fallback) {
              setRadarMetadata(fallback);
              setRadarFrameIndex(fallback.frames.length - 1);
            }
          } catch {
            // Silently ignore
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [weather.activeLayer, overlayRadar]);

  // Restore location from URL query params on mount (shareable links)
  useEffect(() => {
    if (initialUrlRestoredRef.current) return;
    initialUrlRestoredRef.current = true;

    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';
    const view = searchParams.get('view');

    if (view === 'city') {
      setViewMode('city-map');
    }

    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      weather.fetchWeatherForLocation({
        latitude: lat,
        longitude: lng,
        name: city || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
        country: country || undefined,
        timezone: 'auto',
        source: 'url',
      });
      // Globe flyTo will happen in handleInitGlobeApi when the globe is ready
      return;
    } else if (country) {
      const coords = getCoordinatesForCountry(country);
      if (coords) {
        weather.fetchWeatherForLocation({
          latitude: coords.lat,
          longitude: coords.lng,
          name: country,
          country: country,
          timezone: 'auto',
          source: 'url',
        });
        return;
      }
    }

    // Default: load Tokyo
    if (!weather.selectedLocation) {
      weather.fetchWeatherForLocation({
        latitude: 35.6762,
        longitude: 139.6503,
        name: 'Tokyo',
        country: 'Japan',
        timezone: 'Asia/Tokyo',
        source: 'search',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle globe initialization callback
  const handleInitGlobeApi = useCallback((api: GlobeApi) => {
    globeApiRef.current = api;
    if (weather.selectedLocation) {
      api.flyTo({
        lat: weather.selectedLocation.latitude,
        lng: weather.selectedLocation.longitude,
        altitude: 1.8,
      });
    }
  }, [weather.selectedLocation]);

  // Search selection handler
  const handleSelectLocation = useCallback(
    (result: GeocodingResult) => {
      weather.fetchWeatherForLocation({
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country,
        timezone: result.timezone,
        source: 'search',
      });
      globeApiRef.current?.flyTo({
        lat: result.latitude,
        lng: result.longitude,
        altitude: 1.6,
      }, getFlyDuration(1500));
      updateUrlParams(result.latitude, result.longitude, result.name, result.country);
      setIsPanelMinimized(false);
      setTimelineIndex(0);
    },
    [weather, updateUrlParams, getFlyDuration]
  );

  // Globe country tap handler
  const handleCountrySelect = useCallback(
    (countryName: string | null) => {
      if (!countryName) return;
      const coords = getCoordinatesForCountry(countryName);
      if (coords) {
        weather.fetchWeatherForLocation({
          latitude: coords.lat,
          longitude: coords.lng,
          name: coords.city,
          country: coords.country,
          timezone: 'auto',
          source: 'globe-click',
        });
        globeApiRef.current?.flyTo({
          lat: coords.lat,
          lng: coords.lng,
          altitude: 1.6,
        }, getFlyDuration(1500));
        updateUrlParams(coords.lat, coords.lng, coords.city, coords.country);
      } else {
        weather.searchLocations(countryName).then((resp) => {
          if (resp?.results && resp.results.length > 0) {
            const first = resp.results[0];
            weather.fetchWeatherForLocation({
              latitude: first.latitude,
              longitude: first.longitude,
              name: first.name,
              country: first.country,
              timezone: first.timezone || 'auto',
              source: 'globe-click',
            });
            globeApiRef.current?.flyTo({
              lat: first.latitude,
              lng: first.longitude,
              altitude: 1.6,
            }, getFlyDuration(1500));
            updateUrlParams(first.latitude, first.longitude, first.name, first.country);
          }
        });
      }
      setIsPanelMinimized(false);
      setTimelineIndex(0);
    },
    [weather, updateUrlParams, getFlyDuration]
  );

  // Globe coordinate click handler (any point, ocean, island)
  const handleGlobeClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      const latStr = coords.lat >= 0 ? `${coords.lat.toFixed(2)}°N` : `${Math.abs(coords.lat).toFixed(2)}°S`;
      const lngStr = coords.lng >= 0 ? `${coords.lng.toFixed(2)}°E` : `${Math.abs(coords.lng).toFixed(2)}°W`;
      const name = `${latStr}, ${lngStr}`;
      weather.fetchWeatherForLocation({
        latitude: coords.lat,
        longitude: coords.lng,
        name,
        timezone: 'auto',
        source: 'globe-click',
      });
      globeApiRef.current?.flyTo({
        lat: coords.lat,
        lng: coords.lng,
        altitude: 1.6,
      }, getFlyDuration(1200));
      updateUrlParams(coords.lat, coords.lng, name);
      setIsPanelMinimized(false);
      setTimelineIndex(0);
    },
    [weather, updateUrlParams, getFlyDuration]
  );

  const handleZoomIn = useCallback(() => {
    if (globeApiRef.current?.zoomIn) {
      globeApiRef.current.zoomIn(0.5);
    } else if (typeof window !== 'undefined' && (window as any).__globeRef) {
      const pov = (window as any).__globeRef.pointOfView();
      if (pov && typeof pov.altitude === 'number') {
        (window as any).__globeRef.pointOfView({ ...pov, altitude: Math.max(0.12, Number((pov.altitude - 0.5).toFixed(2))) }, 300);
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (globeApiRef.current?.zoomOut) {
      globeApiRef.current.zoomOut(0.7);
    } else if (typeof window !== 'undefined' && (window as any).__globeRef) {
      const pov = (window as any).__globeRef.pointOfView();
      if (pov && typeof pov.altitude === 'number') {
        (window as any).__globeRef.pointOfView({ ...pov, altitude: Math.min(14.0, Number((pov.altitude + 0.7).toFixed(2))) }, 300);
      }
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (weather.selectedLocation) {
      globeApiRef.current?.flyTo({
        lat: weather.selectedLocation.latitude,
        lng: weather.selectedLocation.longitude,
        altitude: 2.2,
      }, 700);
    } else {
      globeApiRef.current?.flyTo({ lat: 20, lng: 0, altitude: 2.5 }, 700);
    }
  }, [weather.selectedLocation]);

  const hasData = weather.selectedLocation !== null;
  const currentForecast = weather.data.forecast;

  // Synchronize displayed forecast and telemetry with the forecast timeline scrubber
  const displayedForecast = computeDisplayedForecast(currentForecast, timelineIndex);

  const weatherUnitsObj: UnitPreferences = {
    temperature: weather.units,
    windSpeed: 'kmh',
    precipitation: 'mm',
  };

  const windSpeed = displayedForecast?.current?.windSpeed ?? 15;
  const windDirection = displayedForecast?.current?.windDirection ?? 45;
  const windGusts = displayedForecast?.current?.windGusts;

  return (
    <div className="w-full h-screen bg-[#020208] text-white relative overflow-hidden flex flex-col">
      {/* ── Top Header Bar ────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#020208]/90 backdrop-blur-xl border-b border-white/5 select-none">
        <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0 group">
            <span className="text-xl">🌍</span>
            <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors hidden md:inline">
              MooEarth
            </span>
            <span className="text-xs font-semibold text-cyan-400 px-1.5 sm:px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
              <span className="sm:hidden">Weather</span>
              <span className="hidden sm:inline">Weather Intelligence</span>
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-1 sm:mx-4 min-w-0">
            <WeatherSearch
              onSelectLocation={handleSelectLocation}
              placeholder="Search any city or place..."
              initialQuery={
                weather.selectedLocation
                  ? weather.selectedLocation.country &&
                    weather.selectedLocation.name.toLowerCase() !== weather.selectedLocation.country.toLowerCase() &&
                    !weather.selectedLocation.name.toLowerCase().includes(weather.selectedLocation.country.toLowerCase())
                    ? `${weather.selectedLocation.name}, ${weather.selectedLocation.country}`
                    : weather.selectedLocation.name
                  : ''
              }
            />
          </div>

          {/* Quick Links & View Mode Switch */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {weather.selectedLocation && (
              <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5">
                <button
                  type="button"
                  data-testid="header-earth-mode-btn"
                  onClick={handleReturnToEarth}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    viewMode === 'globe'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="View planetary 3D Earth globe"
                >
                  🌍 <span className="hidden sm:inline">Earth</span>
                </button>
                <button
                  type="button"
                  data-testid="header-city-map-btn"
                  onClick={handleExploreCity}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    viewMode === 'city-map'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Explore detailed 2D city map with MapLibre GL JS"
                >
                  🗺️ <span className="hidden sm:inline">City Map</span>
                </button>
              </div>
            )}
            {/* Two Primary Destinations Navigation */}
            <div role="navigation" aria-label="Primary destinations" className="flex items-center p-0.5 sm:p-1 rounded-xl bg-[#090d20]/80 border border-white/10 backdrop-blur-md shrink-0">
              <Link
                href="/"
                className="h-8 px-2 sm:px-3 rounded-lg flex items-center gap-1.5 font-black text-xs tracking-wider bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.5)] transition-all cursor-pointer"
                title="MooEarth Weather Radar (Homepage)"
                aria-label="Weather Radar"
              >
                <span>🌦️</span>
                <span className="hidden xs:inline">RADAR</span>
              </Link>
              <Link
                href="/games"
                className="h-8 px-2 sm:px-3 rounded-lg flex items-center gap-1.5 font-extrabold text-xs tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                title="MooEarth Games Hub"
                aria-label="Games Hub"
              >
                <span>🎮</span>
                <span className="hidden xs:inline">GAMES</span>
                {dailyStreak > 0 && (
                  <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 hidden sm:inline">
                    🔥{dailyStreak}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Layer Mode Selector ────────────────────── */}
      <div className="fixed top-[52px] left-0 right-0 z-30 bg-[#020208]/85 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-4 py-1.5">
          <WeatherLayerSelector
            activeLayer={weather.activeLayer}
            onSelectLayer={weather.setActiveLayer}
          />
        </div>
      </div>

      {/* ── Main Viewport Area ──────────────────────── */}
      <main className="fixed top-[98px] bottom-0 left-0 right-0 flex flex-col lg:flex-row overflow-hidden bg-[#010106]">
        {/* Globe Viewport */}
        <div className="flex-1 relative w-full h-full min-h-0 bg-[#010106] overflow-hidden isolate z-0">
          {/* Direct 3D Interactive Earth Globe & Overlays (preserved in DOM during city exploration) */}
          <div className={`absolute inset-0 w-full h-full ${viewMode === 'city-map' ? 'invisible pointer-events-none' : 'visible'}`}>
            <div className="absolute inset-0 w-full h-full">
              <GlobeScene
                events={events}
                allEvents={events}
                selectedEvent={selectedDisasterEvent}
                onSelectEvent={setSelectedDisasterEvent}
                selectedCountry={weather.selectedLocation?.country}
                onSelectCountry={handleCountrySelect}
                selectedLocation={
                  weather.selectedLocation
                    ? {
                        id: `weather-${weather.selectedLocation.name}`,
                        name: weather.selectedLocation.name,
                        type: 'city',
                        country: weather.selectedLocation.country || '',
                        countryCode: '',
                        lat: weather.selectedLocation.latitude,
                        lng: weather.selectedLocation.longitude,
                        population: 0,
                        timezone: weather.selectedLocation.timezone || 'UTC',
                        adminLevel: 2,
                      }
                    : null
                }
                activeCategory="weather"
                globeView="weather"
                weatherLayerMode={weather.activeLayer}
                weatherTimelineIndex={timelineIndex}
                weatherGridData={gridData}
                weatherUnits={weatherUnitsObj}
                satelliteSpectralMode={spectralMode}
                overlayRadar={overlayRadar}
                showPressureIsobars={showPressureIsobars}
                particlesEnabled={particlesEnabled}
                onGlobeClick={handleGlobeClick}
                onInitGlobeApi={handleInitGlobeApi}
              />
            </div>

            {/* Animated Wind Particles Overlay (2D disabled in favor of genuine 3D WebGL particle streamlines) */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <WindParticleOverlay
                windSpeed={windSpeed}
                windDirection={windDirection}
                windGusts={windGusts}
                isActive={false}
              />
            </div>

            {/* Floating Globe Zoom & Reset Controls */}
            <div className="absolute top-20 left-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
              <div className="flex flex-col rounded-2xl bg-[#050512]/90 backdrop-blur-xl border border-white/10 p-1 shadow-2xl">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-base font-bold cursor-pointer"
                  title="Zoom into Earth (+)"
                  aria-label="Zoom in"
                >
                  +
                </button>
                <div className="h-[1px] bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-lg font-bold cursor-pointer"
                  title="Zoom out of Earth (−)"
                  aria-label="Zoom out"
                >
                  −
                </button>
                <div className="h-[1px] bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-cyan-300 hover:bg-white/10 active:scale-95 transition-all text-xs font-mono cursor-pointer"
                  title="Reset Earth view"
                  aria-label="Reset view"
                >
                  ⟲
                </button>
              </div>
            </div>

            {/* Selected Location HUD Badge (Clickable to inspect telemetry details + Explore City button) */}
            {weather.selectedLocation && (
              <div className="absolute top-4 left-4 z-20 pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className="px-3.5 py-2 rounded-2xl bg-[#050512]/90 backdrop-blur-xl border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-2.5 shadow-2xl hover:border-cyan-400/60 transition-colors text-left cursor-pointer"
                  title="Click to view detailed meteorological panel"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">
                      {weather.selectedLocation.name}
                    </div>
                    <div className="text-[10px] text-white/50">
                      {weather.selectedLocation.country || 'Target Coordinates'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  data-testid="hud-explore-city-btn"
                  onClick={handleExploreCity}
                  className="px-3 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/40 backdrop-blur-xl border border-cyan-400/40 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 shadow-2xl transition-all cursor-pointer active:scale-95"
                  title="Explore detailed 2D city map with MapLibre GL JS"
                >
                  <span>🗺️</span>
                  <span className="hidden sm:inline">Explore City</span>
                </button>
              </div>
            )}

            {/* Honest Radar Coverage Notice when viewing areas outside terrestrial ground radar */}
            {weather.activeLayer === 'radar' &&
              weather.selectedLocation &&
              !isLocationCoveredByRadar(
                weather.selectedLocation.latitude,
                weather.selectedLocation.longitude
              ) && (
                <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-4 z-20 pointer-events-auto">
                  <RadarCoverageNotice
                    locationName={weather.selectedLocation.name}
                    onSwitchToPrecipitation={() => weather.setActiveLayer('precipitation')}
                    onSwitchToSatellite={() => weather.setActiveLayer('satellite')}
                    onRecenterRadar={() => {
                      globeApiRef.current?.flyTo({ lat: 38.5, lng: -96.0, altitude: 1.5 }, getFlyDuration(1200));
                      weather.fetchWeatherForLocation({
                        name: 'United States (NOAA NEXRAD)',
                        latitude: 38.5,
                        longitude: -96.0,
                        timezone: 'auto',
                        source: 'search',
                      });
                    }}
                  />
                </div>
              )}

            {/* Quick-Track Disaster Bar for Hurricane Tracker and Thunderstorms */}
            {(weather.activeLayer === 'hurricane' || weather.activeLayer === 'precipitation') && (
              <div className="absolute top-16 sm:top-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-20 pointer-events-auto sm:w-auto max-w-xl">
                <div className="rounded-2xl bg-[#060818]/92 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.7)] p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <div className="text-[11px] font-mono font-bold shrink-0 flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-white/80">
                    <span>{weather.activeLayer === 'hurricane' ? '🌀' : '⚡'}</span>
                    <span className="hidden xs:inline">{weather.activeLayer === 'hurricane' ? 'Cyclones' : 'Thunderstorms'}:</span>
                  </div>
                  {(weather.activeLayer === 'hurricane' ? activeCyclones : activeThunderstorms).map((storm) => {
                    const isSelected = selectedDisasterEvent?.id === storm.id;
                    return (
                      <button
                        key={storm.id}
                        type="button"
                        onClick={() => {
                          setSelectedDisasterEvent(storm);
                          setViewMode('globe');
                          globeApiRef.current?.flyTo({ lat: storm.lat, lng: storm.lng, altitude: 1.2 }, 1400);
                        }}
                        className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/25 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20'
                        }`}
                        title={`Click to view detailed disaster dossier for ${storm.title}`}
                      >
                        <span>{weather.activeLayer === 'hurricane' ? '🌀' : '⚡'}</span>
                        <span className="whitespace-nowrap font-medium text-[11px]">{storm.title.split('(')[0].trim()}</span>
                        {storm.planetaryTelemetry?.windSpeedKph && (
                          <span className="text-[9px] font-mono font-bold text-rose-300 px-1 py-0.2 rounded bg-rose-500/20">
                            {storm.planetaryTelemetry.windSpeedKph} km/h
                          </span>
                        )}
                        {storm.planetaryTelemetry?.lightningStrikeRatePerMin && (
                          <span className="text-[9px] font-mono font-bold text-amber-300 px-1 py-0.2 rounded bg-amber-500/20">
                            {storm.planetaryTelemetry.lightningStrikeRatePerMin}/min
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Windy Map Controls & 3D/2D Toggle (Offset to avoid overlapping side panel) */}
            <WindyMapControls
              viewMode={viewMode}
              onToggleViewMode={() => setViewMode(viewMode === 'globe' ? 'city-map' : 'globe')}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              className={hasData ? 'lg:right-[396px]' : ''}
              onGeolocate={(c) => {
                weather.fetchWeatherForLocation({
                  name: 'My Location',
                  latitude: c.lat,
                  longitude: c.lng,
                  timezone: 'auto',
                  source: 'search',
                });
              }}
            />

            {/* Windy Meteorological Dynamic Scale Legend (Offset to avoid overlapping side panel) */}
            <WindyLegendBar
              activeLayer={weather.activeLayer}
              spectralMode={spectralMode}
              units={weather.units}
              className={hasData ? 'lg:right-[396px]' : ''}
            />

            {/* Windy Cinematic Bottom Time Scrubber & Player Bar */}
            <WindyTimeScrubber
              activeLayer={weather.activeLayer}
              spectralMode={spectralMode}
              onSelectSpectralMode={setSpectralMode}
              overlayRadar={overlayRadar}
              onToggleOverlayRadar={setOverlayRadar}
              showPressureIsobars={showPressureIsobars}
              onTogglePressureIsobars={setShowPressureIsobars}
              particlesEnabled={particlesEnabled}
              onToggleParticles={setParticlesEnabled}
              timelineIndex={timelineIndex}
              onSelectIndex={setTimelineIndex}
              isPlaying={isTimelinePlaying}
              onTogglePlay={() => setIsTimelinePlaying(!isTimelinePlaying)}
              timestamps={gridData?.timestamps}
              radarFrames={radarMetadata?.frames || []}
              activeRadarFrameIndex={radarFrameIndex}
              onSelectRadarFrameIndex={setRadarFrameIndex}
              radarAttribution={radarMetadata?.attribution}
              satelliteObservationUtc={satelliteMeta.observationUtc}
              className={hasData ? 'lg:left-[calc(50%-190px)]' : ''}
            />

            {/* Mobile "Open Weather Sheet" floating CTA */}
            {hasData && !isPanelOpen && (
              <button
                type="button"
                data-testid="open-mobile-sheet"
                onClick={() => setIsPanelOpen(true)}
                className="lg:hidden absolute bottom-36 right-4 z-40 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-2xl shadow-cyan-500/30 active:scale-95 transition-transform cursor-pointer"
              >
                📊 Telemetry →
              </button>
            )}
          </div>

          {/* Dedicated Interactive 2D City Map (MapLibre GL JS) */}
          {viewMode === 'city-map' && (
            <div className="absolute inset-0 w-full h-full z-20">
              <CityMapViewer
                latitude={weather.selectedLocation?.latitude ?? 20}
                longitude={weather.selectedLocation?.longitude ?? 0}
                cityName={weather.selectedLocation?.name ?? 'World Map'}
                countryName={weather.selectedLocation?.country ?? ''}
                initialZoom={weather.selectedLocation ? 13 : 2.5}
                activeLayer={weather.activeLayer}
                radarTileUrl={radarMetadata?.frames?.[radarFrameIndex]?.tileUrl}
                satelliteTileUrl={satelliteMeta.tileUrlTemplate}
                satelliteObservationUtc={satelliteMeta.observationUtc}
                particlesEnabled={particlesEnabled}
                weatherSummary={
                  displayedForecast?.current
                    ? {
                        temperature: displayedForecast.current.temperature,
                        apparentTemperature: displayedForecast.current.apparentTemperature,
                        weatherDescription: displayedForecast.current.weatherDescription,
                        weatherEmoji: displayedForecast.current.weatherEmoji,
                        windSpeed: displayedForecast.current.windSpeed,
                        relativeHumidity: displayedForecast.current.relativeHumidity,
                        precipitation: displayedForecast.current.precipitation,
                        units: weather.units,
                      }
                    : null
                }
                onReturnToEarth={handleReturnToEarth}
                onOpenWeather={() => {
                  setIsPanelOpen(true);
                  setIsPanelMinimized(false);
                }}
              />
            </div>
          )}
        </div>

        {/* ── Weather Details Panel (Desktop: side panel / Mobile: bottom sheet) ── */}
        {hasData && (
          <>
            {/* Desktop Side Panel */}
            <div className="hidden lg:flex flex-col w-[380px] shrink-0 border-l border-white/5 bg-[#050510]/95 backdrop-blur-2xl overflow-hidden h-full z-20 shadow-2xl min-h-0">
              <WeatherPanel
                forecast={displayedForecast}
                airQuality={weather.data.airQuality}
                elevation={weather.data.elevation}
                flood={weather.data.flood}
                marine={weather.data.marine}
                location={weather.selectedLocation}
                activeLayer={weather.activeLayer}
                loading={weather.loading}
                errors={weather.errors}
                isMinimized={isPanelMinimized}
                onToggleMinimize={() => setIsPanelMinimized(!isPanelMinimized)}
                onExploreCity={handleExploreCity}
              />
            </div>

            {/* Mobile Bottom Sheet Modal */}
            {isPanelOpen && (
              <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col justify-end">
                {/* Backdrop overlay */}
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                  onClick={() => setIsPanelOpen(false)}
                />
                {/* Sheet Drawer */}
                <div
                  className={`relative flex flex-col bg-[#070718]/98 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300 z-10 overscroll-contain touch-pan-y ${
                    isPanelMinimized ? 'h-[85px]' : 'h-[75vh] max-h-[85vh]'
                  }`}
                >
                  <div
                    className="flex justify-center pt-2.5 pb-1 shrink-0 touch-none cursor-grab active:cursor-grabbing select-none"
                    onClick={() => setIsPanelMinimized(!isPanelMinimized)}
                  >
                    <div className="w-12 h-1.5 rounded-full bg-white/20" />
                  </div>
                  <button
                    type="button"
                    data-testid="close-mobile-sheet"
                    onClick={() => setIsPanelOpen(false)}
                    className="absolute top-3.5 right-4 w-7 h-7 rounded-full bg-white/5 text-white/50 hover:text-white flex items-center justify-center text-xs z-20 cursor-pointer"
                  >
                    ✕
                  </button>
                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    <WeatherPanel
                      forecast={displayedForecast}
                      airQuality={weather.data.airQuality}
                      elevation={weather.data.elevation}
                      flood={weather.data.flood}
                      marine={weather.data.marine}
                      location={weather.selectedLocation}
                      activeLayer={weather.activeLayer}
                      loading={weather.loading}
                      errors={weather.errors}
                      isMinimized={isPanelMinimized}
                      onToggleMinimize={() => setIsPanelMinimized(!isPanelMinimized)}
                      onExploreCity={handleExploreCity}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State Prompt (Desktop) */}
        {!hasData && (
          <div className="hidden lg:flex w-[380px] shrink-0 border-l border-white/5 bg-[#050510]/95 items-center justify-center p-8 text-center">
            <div>
              <div className="text-5xl mb-4 animate-bounce">🌐</div>
              <h3 className="text-base font-bold text-white mb-2">
                Explore Earth Weather
              </h3>
              <p className="text-xs text-white/50 leading-relaxed mb-4">
                Click any country or coordinate on the globe, or search for a city above to inspect live meteorological telemetry.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 text-[11px]">
                {['Tokyo', 'London', 'New York', 'Paris', 'Sydney', 'Mumbai'].map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => {
                      weather.searchLocations(cityName).then((resp) => {
                        if (resp?.results && resp.results.length > 0) handleSelectLocation(resp.results[0]);
                      });
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-colors"
                  >
                    {cityName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Disaster Telemetry Dossier Modal (Hurricanes, Cyclones, Thunderstorms) */}
        <EventPopup
          event={selectedDisasterEvent}
          onClose={() => setSelectedDisasterEvent(null)}
        />
      </main>
    </div>
  );
}
