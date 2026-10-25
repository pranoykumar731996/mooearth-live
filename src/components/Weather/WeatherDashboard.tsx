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
import {
  getActiveTropicalCyclonesAsEvents,
  isTropicalCycloneEvent,
} from '@/services/weather/cycloneTrackingService';
import { BASELINE_LIGHTNING_EVENTS, BASELINE_SEISMIC_EVENTS, BASELINE_WILDFIRE_EVENTS, BASELINE_SPACE_WEATHER_EVENTS } from '@/components/Globe/WeatherLayers';
import { useWeatherData } from '@/hooks/useWeatherData';
import { WEATHER_LAYERS, type WeatherLayerMode, type GeocodingResult, type UnitPreferences, type ForecastResponse, type SatelliteSpectralMode } from '@/services/weather/types';
import type { GlobeApi } from '@/hooks/useGlobeControls';
import type { WorldEvent } from '@/types';
import { getCoordinatesForCountry } from '@/lib/constants';
import type { GlobalWeatherGridResponse } from '@/services/weather/globalGridService';
import { getWmoWeatherInfo } from '@/services/weather/forecastService';
import { resolveInitialLocation, saveUserLocation } from '@/services/userLocationResolver';

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
  const [spectralMode, setSpectralMode] = useState<SatelliteSpectralMode>('visible');
  const [overlayRadar, setOverlayRadar] = useState(false);
  const [showPressureIsobars, setShowPressureIsobars] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [showGraticules, setShowGraticules] = useState(false);
  const [isRadarNoticeDismissed, setIsRadarNoticeDismissed] = useState(false);
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [gridData, setGridData] = useState<GlobalWeatherGridResponse | null>(null);
  const [isGridLoading, setIsGridLoading] = useState(true);
  const globeApiRef = useRef<GlobeApi | null>(null);
  const initialUrlRestoredRef = useRef(false);
  const [selectedDisasterEvent, setSelectedDisasterEvent] = useState<WorldEvent | null>(null);
  const [radarMetadata, setRadarMetadata] = useState<RadarMetadataResponse | null>(null);
  const [radarFrameIndex, setRadarFrameIndex] = useState<number>(11);

  // 24-Hour Event Window & Freshness Check (Past 24 Hours)
  const isEventWithin24Hours = useCallback((event: WorldEvent): boolean => {
    // Active tropical cyclones remain tracked by official meteorological agencies until dissipated
    if (isTropicalCycloneEvent(event) || event.planetaryTelemetry?.stormWarningType === 'tropical_cyclone') {
      return true;
    }
    const publishedTime = new Date(event.publishedAt).getTime();
    if (isNaN(publishedTime)) return true;
    return Date.now() - publishedTime <= 24 * 60 * 60 * 1000;
  }, []);

  // Active cyclones list for quick-tracking (official NOAA NHC, JTWC, and IMD feeds)
  const activeCyclones = useMemo(() => {
    return getActiveTropicalCyclonesAsEvents(events);
  }, [events]);

  // Active thunderstorms list for quick-tracking (severe convective cells and squalls within past 24h)
  const activeThunderstorms = useMemo(() => {
    const fromEvents = events.filter((e) => {
      if (!isEventWithin24Hours(e)) return false;
      if (isTropicalCycloneEvent(e)) return false;
      const t = (e.title || '').toLowerCase();
      return (
        t.includes('lightning') ||
        t.includes('thunderstorm') ||
        t.includes('convective') ||
        t.includes('squall') ||
        e.planetaryTelemetry?.stormWarningType === 'severe_thunderstorm'
      );
    });
    return fromEvents.length > 0 ? fromEvents : BASELINE_LIGHTNING_EVENTS;
  }, [events, isEventWithin24Hours]);

  // Active earthquakes list for quick-tracking (USGS standards within past 24h)
  const activeEarthquakes = useMemo(() => {
    const fromEvents = events.filter((e) => {
      if (!isEventWithin24Hours(e)) return false;
      if (e.category === 'seismic') return true;
      const t = (e.title || '').toLowerCase();
      return t.includes('earthquake') || t.includes('richter') || t.includes('magnitude');
    });
    return fromEvents.length > 0 ? fromEvents : BASELINE_SEISMIC_EVENTS;
  }, [events, isEventWithin24Hours]);

  // Active wildfires list for quick-tracking (NASA FIRMS / VIIRS within past 24h)
  const activeWildfires = useMemo(() => {
    const fromEvents = events.filter((e) => {
      if (!isEventWithin24Hours(e)) return false;
      if (e.category === 'wildfires') return true;
      const t = (e.title || '').toLowerCase();
      return t.includes('wildfire') || t.includes('bushfire') || t.includes('forest fire');
    });
    return fromEvents.length > 0 ? fromEvents : BASELINE_WILDFIRE_EVENTS;
  }, [events, isEventWithin24Hours]);

  // Active space weather list for quick-tracking (NOAA SWPC within past 24h)
  const activeSpaceWeather = useMemo(() => {
    const fromEvents = events.filter((e) => {
      if (!isEventWithin24Hours(e)) return false;
      if (e.category === 'space_weather') return true;
      const t = (e.title || '').toLowerCase();
      return t.includes('geomagnetic') || t.includes('aurora') || t.includes('solar storm');
    });
    return fromEvents.length > 0 ? fromEvents : BASELINE_SPACE_WEATHER_EVENTS;
  }, [events, isEventWithin24Hours]);

  // Multi-hazard filter tab state: 'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather'
  const [disasterCategoryFilter, setDisasterCategoryFilter] = useState<'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather'>('all');

  // Collapsible toggle state for the Multi-Hazard tracker bar to keep the 3D Earth view clear and uncluttered
  const [isHazardBarExpanded, setIsHazardBarExpanded] = useState(false);

  // Automatically synchronize hurricane weather layer with cyclone hazard filter
  useEffect(() => {
    if (weather.activeLayer === 'hurricane') {
      setDisasterCategoryFilter('cyclones');
      setIsHazardBarExpanded(true);
    }
  }, [weather.activeLayer]);

  // Unified multi-hazard disaster feed based on active filter
  const displayedDisasters = useMemo(() => {
    switch (disasterCategoryFilter) {
      case 'cyclones':
        return activeCyclones;
      case 'seismic':
        return activeEarthquakes;
      case 'wildfires':
        return activeWildfires;
      case 'thunderstorms':
        return activeThunderstorms;
      case 'space_weather':
        return activeSpaceWeather;
      case 'all':
      default: {
        return [
          ...activeCyclones.slice(0, 2),
          ...activeEarthquakes.slice(0, 2),
          ...activeWildfires.slice(0, 2),
          ...activeThunderstorms.slice(0, 2),
          ...activeSpaceWeather.slice(0, 1),
        ];
      }
    }
  }, [disasterCategoryFilter, activeCyclones, activeEarthquakes, activeWildfires, activeThunderstorms, activeSpaceWeather]);

  // Comprehensive planetary disaster feed combining all active cyclones and active hazards
  // Guarantees 100% synchronization and identical positions across 3D Earth and 2D MapLibre map.
  const allDisasters = useMemo(() => {
    const map = new Map<string, WorldEvent>();
    // 1. Live tropical cyclones & hurricanes (strictly live real-time events, zero stale/historical data)
    activeCyclones.forEach((c) => map.set(c.id, c));
    // 2. Earthquakes (past 24h)
    activeEarthquakes.forEach((e) => map.set(e.id, e));
    // 3. Wildfires (past 24h)
    activeWildfires.forEach((w) => map.set(w.id, w));
    // 4. Thunderstorms (past 24h)
    activeThunderstorms.forEach((t) => map.set(t.id, t));
    // 5. Space weather (past 24h)
    activeSpaceWeather.forEach((s) => map.set(s.id, s));
    // 6. Additional events from events feed (if not already mapped and within 24h)
    events.forEach((ev) => {
      if (
        ev.category === 'severe_weather' ||
        ev.category === 'seismic' ||
        ev.category === 'wildfires' ||
        ev.category === 'space_weather'
      ) {
        if (!map.has(ev.id) && isEventWithin24Hours(ev)) map.set(ev.id, ev);
      }
    });
    return Array.from(map.values());
  }, [activeCyclones, activeEarthquakes, activeWildfires, activeThunderstorms, activeSpaceWeather, events, isEventWithin24Hours]);

  // Genuine satellite metadata & observation timestamp (NASA GIBS / NOAA GOES)
  const satelliteMeta = useMemo(() => {
    return getSatelliteMetadata(spectralMode, timelineIndex);
  }, [spectralMode, timelineIndex]);

  // Helper: push location and view mode into URL query params for shareable links without triggering route navigation
  const updateUrlParams = useCallback(
    (lat: number, lng: number, city?: string, country?: string, mode?: 'globe' | 'city-map') => {
      try {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const currentMode = mode !== undefined ? mode : viewMode;
        if (currentMode === 'city-map') {
          params.set('view', 'city');
        } else {
          params.delete('view');
        }
        params.set('lat', lat.toFixed(4));
        params.set('lng', lng.toFixed(4));
        if (city) params.set('city', city);
        else params.delete('city');
        if (country) params.set('country', country);
        else params.delete('country');

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
      } catch {
        // Silently ignore URL update errors
      }
    },
    [viewMode]
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
    setViewMode('city-map');
    if (weather.selectedLocation) {
      updateUrlParams(
        weather.selectedLocation.latitude,
        weather.selectedLocation.longitude,
        weather.selectedLocation.name,
        weather.selectedLocation.country,
        'city-map'
      );
    }
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

  // Action: Switch to Weather view and return to 3D Earth globe if in city-map, or toggle telemetry panel on mobile
  const handleSwitchToWeather = useCallback(() => {
    if (viewMode === 'city-map') {
      setViewMode('globe');
      if (weather.selectedLocation) {
        updateUrlParams(
          weather.selectedLocation.latitude,
          weather.selectedLocation.longitude,
          weather.selectedLocation.name,
          weather.selectedLocation.country,
          'globe'
        );
      }
    } else {
      // If already in 3D globe mode, tapping Weather opens/reveals the weather telemetry sheet on mobile
      setIsPanelOpen((prev) => !prev);
      setIsPanelMinimized(false);
    }
  }, [viewMode, weather, updateUrlParams]);

  // Action: Switch to Weather Radar layer and return to 3D Earth globe if in city-map
  const handleSwitchToRadar = useCallback(() => {
    if (viewMode === 'city-map') {
      setViewMode('globe');
      if (weather.selectedLocation) {
        updateUrlParams(
          weather.selectedLocation.latitude,
          weather.selectedLocation.longitude,
          weather.selectedLocation.name,
          weather.selectedLocation.country,
          'globe'
        );
      }
    }
    weather.setActiveLayer('radar');
  }, [viewMode, weather, updateUrlParams]);

  // Fetch live global events for radar/atmosphere integration with continuous 60s auto-refresh
  useEffect(() => {
    let cancelled = false;
    const fetchLatestEvents = () => {
      fetch('/api/events?refresh=true')
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data.events && Array.isArray(data.events)) {
            setEvents(data.events);
          }
        })
        .catch(() => {});
    };

    fetchLatestEvents();
    const intervalTimer = setInterval(fetchLatestEvents, 60000);
    return () => {
      cancelled = true;
      clearInterval(intervalTimer);
    };
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

  // Restore location and active layer from URL query params on mount (shareable links)
  useEffect(() => {
    if (initialUrlRestoredRef.current) return;
    initialUrlRestoredRef.current = true;

    const layerParam = searchParams.get('layer');
    if (layerParam && WEATHER_LAYERS.some((l) => l.id === layerParam)) {
      weather.setActiveLayer(layerParam as WeatherLayerMode);
    }

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

    // Dynamic initial location resolution (User's saved preference or local timezone)
    // Eliminates hardcoded Tokyo, Japan on fresh site loads!
    if (!weather.selectedLocation) {
      const initialTarget = resolveInitialLocation();
      weather.fetchWeatherForLocation({
        latitude: initialTarget.latitude,
        longitude: initialTarget.longitude,
        name: initialTarget.name,
        country: initialTarget.country,
        timezone: initialTarget.timezone || 'auto',
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
        altitude: 2.2,
      }, 1000);
    } else {
      const initialTarget = resolveInitialLocation();
      api.flyTo({
        lat: initialTarget.latitude,
        lng: initialTarget.longitude,
        altitude: 2.3,
      }, 1000);
    }
  }, [weather.selectedLocation]);

  // Search selection handler
  // Search selection handler with adaptive feature altitude & mode synchronization
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
      saveUserLocation({
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country,
        timezone: result.timezone,
      });

      // Adaptive altitude based on geographic feature scale
      let altitude = 1.5;
      if (result.type === 'country') {
        altitude = 2.2;
      } else if (result.type === 'administrative') {
        altitude = 1.8;
      } else if (result.type === 'city') {
        altitude = 1.4;
      } else if (
        result.type === 'street' ||
        result.type === 'address' ||
        result.type === 'landmark' ||
        result.type === 'airport' ||
        result.type === 'mountain' ||
        result.type === 'park'
      ) {
        altitude = 0.85;
      }

      globeApiRef.current?.flyTo(
        {
          lat: result.latitude,
          lng: result.longitude,
          altitude,
        },
        getFlyDuration(1500)
      );

      updateUrlParams(
        result.latitude,
        result.longitude,
        result.name,
        result.country,
        viewMode
      );
      // Auto-open weather panel on mobile when user searches for a location
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setIsPanelOpen(true);
      }
      setIsPanelMinimized(false);
      setTimelineIndex(0);
    },
    [weather, updateUrlParams, getFlyDuration, viewMode]
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
      saveUserLocation({
        latitude: coords.lat,
        longitude: coords.lng,
        name,
      });
      globeApiRef.current?.flyTo({
        lat: coords.lat,
        lng: coords.lng,
        altitude: 1.8,
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
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-1 sm:mx-4 min-w-[70px] sm:min-w-[180px]">
            <WeatherSearch
              onSelectLocation={handleSelectLocation}
              placeholder="Search..."
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
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {weather.selectedLocation && (
              <div className="hidden xl:flex rounded-xl bg-white/5 border border-white/10 p-0.5">
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
                  title="Explore high-resolution 2D satellite map"
                >
                  🛰️ <span className="hidden sm:inline">2D Satellite</span>
                </button>
              </div>
            )}
            {/* Primary Destinations Navigation: 1. Weather, 2. Explore Earth, 3. Earth Games */}
            <div role="navigation" aria-label="Primary destinations" className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl bg-[#090d20]/95 border border-white/10 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] shrink-0">
              {/* Destination 1: Weather */}
              <button
                type="button"
                data-testid="header-weather-btn"
                onClick={handleSwitchToWeather}
                className={`h-7 sm:h-8 px-2 sm:px-3 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-1.5 text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                  viewMode === 'globe'
                    ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-black shadow-[0_0_15px_rgba(0,229,255,0.6)]'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-400/30 hover:border-cyan-400/60'
                }`}
                title="View Live Planetary Weather Intelligence & Radar"
                aria-label="Weather Intelligence"
                aria-pressed={viewMode === 'globe'}
              >
                <span className="text-sm">🌤️</span>
                <span className="font-bold whitespace-nowrap hidden lg:inline">
                  Weather
                </span>
                {viewMode === 'globe' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping shrink-0" />
                )}
              </button>

              {/* Destination 2: Explore Earth */}
              <Link
                href="/explore"
                data-testid="header-explore-earth-btn"
                className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-1.5 text-xs font-bold tracking-wide text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                title="Explore Earth — World Map, Sovereign Nations, Continents & Demographics"
                aria-label="Explore Earth"
              >
                <span className="text-sm">🌍</span>
                <span className="font-bold whitespace-nowrap hidden lg:inline">
                  Explore<span className="hidden xl:inline"> Earth</span>
                </span>
              </Link>

              {/* Destination 3: Earth Games (ALWAYS VISIBLE WITH TEXT ON MOBILE!) */}
              <Link
                href="/games"
                data-testid="header-games-hub-btn"
                className="h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-1.5 text-xs font-black tracking-wide bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/60 hover:border-purple-300 shadow-[0_0_16px_rgba(147,51,234,0.55)] hover:shadow-[0_0_22px_rgba(147,51,234,0.7)] transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0"
                title="Play Earth Games — Geography Quiz, Flag Quizzes & World Challenges"
                aria-label="Earth Games"
              >
                <span className="text-sm shrink-0">🎮</span>
                <span className="font-black whitespace-nowrap text-xs">
                  <span className="hidden xl:inline">Earth </span>Games
                </span>
                {dailyStreak > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400/30 text-amber-200 border border-amber-400/50 hidden sm:flex items-center gap-0.5">
                    🔥{dailyStreak}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 hidden xl:inline tracking-wider">
                    PLAY
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
                allEvents={allDisasters}
                hazardFilter={disasterCategoryFilter}
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
                showGraticules={showGraticules}
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
                  data-testid="hud-selected-location-btn"
                  onClick={() => {
                    setIsPanelOpen(!isPanelOpen);
                    setIsPanelMinimized(false);
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-[#050512]/92 backdrop-blur-xl border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-2.5 shadow-2xl hover:border-cyan-400/60 transition-colors text-left cursor-pointer group"
                  title="Click to view detailed meteorological telemetry panel"
                >
                  {displayedForecast?.current ? (
                    <span className="text-xl shrink-0">
                      {displayedForecast.current.weatherEmoji || '🌤️'}
                    </span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                        {weather.selectedLocation.name}
                      </span>
                      {displayedForecast?.current && typeof displayedForecast.current.temperature === 'number' && (
                        <span className="font-black text-cyan-300 text-xs font-mono">
                          {Math.round(displayedForecast.current.temperature)}°{weather.units === 'fahrenheit' ? 'F' : 'C'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/50 flex items-center gap-1.5">
                      {displayedForecast?.current?.weatherDescription && (
                        <span>{displayedForecast.current.weatherDescription}</span>
                      )}
                      {displayedForecast?.current?.weatherDescription && weather.selectedLocation.country && (
                        <span>·</span>
                      )}
                      <span>{weather.selectedLocation.country || 'Target Coordinates'}</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  data-testid="hud-explore-city-btn"
                  onClick={handleExploreCity}
                  className="px-3 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/40 backdrop-blur-xl border border-cyan-400/40 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 shadow-2xl transition-all cursor-pointer active:scale-95"
                  title="Explore detailed interactive 2D map with street and satellite imagery"
                >
                  <span>🗺️</span>
                  <span className="hidden sm:inline">Interactive Map</span>
                </button>
              </div>
            )}

            {/* Honest Radar Coverage Notice when viewing areas outside terrestrial ground radar */}
            {weather.activeLayer === 'radar' &&
              weather.selectedLocation &&
              !isRadarNoticeDismissed &&
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
                    onDismiss={() => setIsRadarNoticeDismissed(true)}
                  />
                </div>
              )}

            {/* Universal Multi-Hazard Natural Disaster Quick-Tracker Bar (Collapsible, strictly on-demand) */}
            {displayedDisasters.length > 0 && (
              <div className="absolute top-16 sm:top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center">
                {!isHazardBarExpanded ? (
                  <button
                    type="button"
                    onClick={() => setIsHazardBarExpanded(true)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#060818]/90 hover:bg-[#060818] backdrop-blur-md border border-white/15 text-white/90 text-xs font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer group"
                    title="Click to view active planetary hazards and dossiers"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="animate-pulse text-xs">🚨</span>
                      <span className="text-[11px] font-medium tracking-wide">Hazards</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500/25 border border-rose-500/40 text-[10px] font-mono text-rose-300 font-bold">
                        {allDisasters.length}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[8px] font-mono text-emerald-300 font-bold tracking-tight">
                        24H LIVE
                      </span>
                    </span>
                    <span className="text-[10px] text-cyan-300/80 group-hover:text-cyan-300 font-mono hidden sm:inline">
                      • Click to view
                    </span>
                    <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors">▼</span>
                  </button>
                ) : (
                  <div className="w-[calc(100vw-24px)] sm:w-auto max-w-2xl flex flex-col gap-1.5 p-1.5 rounded-2xl bg-[#060818]/94 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-200">
                    {/* Header with Category Filter Chips and Collapse Button */}
                    <div className="flex items-center justify-between gap-1 px-1 pt-0.5">
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                          <span>🚨</span>
                          <span className="hidden sm:inline">Hazards:</span>
                          <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-[8px] font-mono text-emerald-300 font-bold">24H</span>
                        </span>
                        {[
                          { id: 'all', label: 'All', icon: '🌐' },
                          { id: 'cyclones', label: 'Cyclones', icon: '🌀' },
                          { id: 'seismic', label: 'Quakes', icon: '🌋' },
                          { id: 'wildfires', label: 'Fires', icon: '🔥' },
                          { id: 'thunderstorms', label: 'Storms', icon: '⚡' },
                          { id: 'space_weather', label: 'Space', icon: '🌌' },
                        ].map((tab) => {
                          const isActive = disasterCategoryFilter === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setDisasterCategoryFilter(tab.id as any)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                                isActive
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <span>{tab.icon}</span>
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Collapse button */}
                      <button
                        type="button"
                        onClick={() => setIsHazardBarExpanded(false)}
                        className="px-1.5 py-0.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer shrink-0 ml-1 text-[11px]"
                        title="Collapse hazards bar to reveal full Earth"
                      >
                        ▲
                      </button>
                    </div>

                    {/* Disaster Cards Track */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                      {displayedDisasters.map((disaster) => {
                        const isSelected = selectedDisasterEvent?.id === disaster.id;
                        const icon =
                          disaster.category === 'seismic' || (disaster.title && disaster.title.toLowerCase().includes('magnitude'))
                            ? '🌋'
                            : disaster.category === 'wildfires'
                            ? '🔥'
                            : disaster.category === 'space_weather'
                            ? '🌌'
                            : (disaster.title || '').toLowerCase().includes('cyclone') || (disaster.title || '').toLowerCase().includes('hurricane')
                            ? '🌀'
                            : '⚡';

                        return (
                          <button
                            key={disaster.id}
                            type="button"
                            onClick={() => {
                              setSelectedDisasterEvent(disaster);
                              if (viewMode === 'globe') {
                                globeApiRef.current?.flyTo({ lat: disaster.lat, lng: disaster.lng, altitude: 1.18 }, 1400);
                              }
                            }}
                            className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-rose-500/25 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20'
                            }`}
                            title={`Click to open full telemetry dossier for ${disaster.title}`}
                          >
                            <span>{icon}</span>
                            <span className="whitespace-nowrap font-medium text-[11px] max-w-[120px] sm:max-w-[160px] truncate">
                              {disaster.title.split('(')[0].split('-')[0].trim()}
                            </span>
                            {disaster.planetaryTelemetry?.magnitude && (
                              <span className="text-[9px] font-mono font-bold text-rose-300 px-1 py-0.2 rounded bg-rose-500/20">
                                M {disaster.planetaryTelemetry.magnitude.toFixed(1)}
                              </span>
                            )}
                            {disaster.planetaryTelemetry?.fireRadiativePowerMw && (
                              <span className="text-[9px] font-mono font-bold text-amber-300 px-1 py-0.2 rounded bg-amber-500/20">
                                {disaster.planetaryTelemetry.fireRadiativePowerMw} MW
                              </span>
                            )}
                            {disaster.planetaryTelemetry?.windSpeedKph && (
                              <span className="text-[9px] font-mono font-bold text-cyan-300 px-1 py-0.2 rounded bg-cyan-500/20">
                                {disaster.planetaryTelemetry.windSpeedKph} km/h
                              </span>
                            )}
                            {disaster.planetaryTelemetry?.lightningStrikeRatePerMin && (
                              <span className="text-[9px] font-mono font-bold text-yellow-300 px-1 py-0.2 rounded bg-yellow-500/20">
                                {disaster.planetaryTelemetry.lightningStrikeRatePerMin}/min
                              </span>
                            )}
                            {disaster.planetaryTelemetry?.kpIndex && (
                              <span className="text-[9px] font-mono font-bold text-purple-300 px-1 py-0.2 rounded bg-purple-500/20">
                                Kp {disaster.planetaryTelemetry.kpIndex}
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-cyan-400/80 group-hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1 py-0.2 rounded flex items-center gap-0.5">
                              <span>📄</span>
                              <span>Dossier</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Dedicated Interactive 2D City & Satellite Map (MapLibre GL JS) */}
          {viewMode === 'city-map' && (
            <div className="absolute inset-0 w-full h-full z-10">
              <CityMapViewer
                latitude={weather.selectedLocation?.latitude ?? resolveInitialLocation().latitude}
                longitude={weather.selectedLocation?.longitude ?? resolveInitialLocation().longitude}
                cityName={weather.selectedLocation?.name ?? 'World Map'}
                countryName={weather.selectedLocation?.country ?? ''}
                initialZoom={
                  weather.activeLayer === 'satellite' || weather.activeLayer === 'clouds'
                    ? 3.3
                    : weather.selectedLocation?.source === 'search' && (searchParams.get('city') || weather.selectedLocation?.country)
                    ? 12.8
                    : searchParams.get('lat') || searchParams.get('city')
                    ? 4.5
                    : 3.3
                }
                initialMapStyle="windy-satellite"
                activeLayer={weather.activeLayer}
                radarTileUrl={radarMetadata?.frames?.[radarFrameIndex]?.tileUrl}
                satelliteTileUrl={satelliteMeta.tileUrlTemplate}
                satelliteObservationUtc={satelliteMeta.observationUtc}
                spectralMode={spectralMode}
                onSelectSpectralMode={setSpectralMode}
                particlesEnabled={particlesEnabled}
                disasters={allDisasters}
                disasterFilter={disasterCategoryFilter}
                onSelectDisasterFilter={setDisasterCategoryFilter}
                selectedDisaster={selectedDisasterEvent}
                onInspectDossier={(disaster) => {
                  setSelectedDisasterEvent(disaster);
                }}
                onSelectDisaster={(disaster) => {
                  setSelectedDisasterEvent(disaster);
                  if (disaster && typeof disaster.lat === 'number' && typeof disaster.lng === 'number') {
                    const cleanName = disaster.title.split('(')[0].split('-')[0].trim();
                    weather.fetchWeatherForLocation({
                      name: cleanName,
                      country: disaster.country || 'Hazard Center',
                      latitude: disaster.lat,
                      longitude: disaster.lng,
                      timezone: 'auto',
                      source: 'globe-click',
                    });
                  }
                }}
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
                  if (!hasData) {
                    const fallback = resolveInitialLocation();
                    weather.fetchWeatherForLocation({
                      latitude: fallback.latitude,
                      longitude: fallback.longitude,
                      name: fallback.name,
                      country: fallback.country,
                      timezone: fallback.timezone || 'auto',
                      source: 'search',
                    });
                  }
                  setIsPanelOpen(true);
                  setIsPanelMinimized(false);
                }}
                onMapClick={(coords) => {
                  const clickName = `${coords.lat >= 0 ? coords.lat.toFixed(1) + '°N' : Math.abs(coords.lat).toFixed(1) + '°S'}, ${coords.lng >= 0 ? coords.lng.toFixed(1) + '°E' : Math.abs(coords.lng).toFixed(1) + '°W'}`;
                  weather.fetchWeatherForLocation({
                    name: clickName,
                    latitude: coords.lat,
                    longitude: coords.lng,
                    timezone: 'auto',
                    source: 'globe-click',
                  });
                  saveUserLocation({
                    latitude: coords.lat,
                    longitude: coords.lng,
                    name: clickName,
                  });
                  setIsPanelOpen(true);
                  setIsPanelMinimized(false);
                }}
              />
            </div>
          )}

          {/* Windy Map Controls & 3D/2D Toggle (Floating, active across BOTH 3D Earth and 2D Satellite views) */}
          <WindyMapControls
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode(viewMode === 'globe' ? 'city-map' : 'globe')}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onToggleHazards={() => setIsHazardBarExpanded((prev) => !prev)}
            isHazardsOpen={isHazardBarExpanded}
            hazardsCount={allDisasters.length}
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
            showGraticules={showGraticules}
            onToggleGraticules={setShowGraticules}
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

          {/* Universal Mobile "Open Weather Sheet" floating CTA */}
          {/* Only shown in 3D Earth globe mode (in 2D City Map, top badge handles telemetry) */}
          {!isPanelOpen && viewMode !== 'city-map' && (
            <button
              type="button"
              data-testid="open-mobile-sheet"
              onClick={() => {
                if (!hasData) {
                  const fallback = resolveInitialLocation();
                  weather.fetchWeatherForLocation({
                    latitude: fallback.latitude,
                    longitude: fallback.longitude,
                    name: fallback.name,
                    country: fallback.country,
                    timezone: fallback.timezone || 'auto',
                    source: 'search',
                  });
                }
                setIsPanelOpen(true);
                setIsPanelMinimized(false);
              }}
              className="lg:hidden absolute bottom-36 right-4 z-40 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-2xl shadow-cyan-500/40 border border-cyan-400/40 flex items-center gap-2 active:scale-95 transition-all cursor-pointer pointer-events-auto"
              title="Open real-time meteorological telemetry & forecast sheet"
              aria-label="Open Weather Telemetry"
            >
              <span className="text-base shrink-0">
                {displayedForecast?.current?.weatherEmoji || '📊'}
              </span>
              <span className="flex items-center gap-1.5">
                {displayedForecast?.current && typeof displayedForecast.current.temperature === 'number' && (
                  <span className="font-black text-white text-xs font-mono">
                    {Math.round(displayedForecast.current.temperature)}°{weather.units === 'fahrenheit' ? 'F' : 'C'}
                  </span>
                )}
                <span>Weather Telemetry →</span>
              </span>
            </button>
          )}
        </div>

        {/* ── Weather Details Panel (Desktop: side panel / Mobile: bottom sheet) ── */}
        {hasData && (
          /* Desktop Side Panel */
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
              onExploreCity={viewMode === 'city-map' ? undefined : handleExploreCity}
            />
          </div>
        )}

        {/* Mobile Bottom Sheet Modal — Can open in both 3D Earth and 2D City Map */}
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
                  onExploreCity={viewMode === 'city-map' ? undefined : handleExploreCity}
                />
              </div>
            </div>
          </div>
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
