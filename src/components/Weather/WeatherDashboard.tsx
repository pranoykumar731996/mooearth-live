// ============================================================
// MooEarth Live — Weather Dashboard
// ============================================================
// The central weather experience: 3D Interactive Earth Globe +
// Location Search + 8 Layer Selector + Animated Wind Particle System +
// Forecast Timeline Scrubber + Color Scales + Telemetry Panel.
// Desktop: side-by-side layout. Mobile: full-screen interactive globe with bottom sheet.

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import WeatherSearch from './WeatherSearch';
import WeatherLayerSelector from './WeatherLayerSelector';
import WeatherPanel from './WeatherPanel';
import WindParticleOverlay from './WindParticleOverlay';
import WeatherTimeline from './WeatherTimeline';
import WeatherLegend from './WeatherLegend';
import { useWeatherData } from '@/hooks/useWeatherData';
import type { GeocodingResult, UnitPreferences, ForecastResponse } from '@/services/weather/types';
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

export default function WeatherDashboard() {
  const weather = useWeatherData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [gridData, setGridData] = useState<GlobalWeatherGridResponse | null>(null);
  const [isGridLoading, setIsGridLoading] = useState(true);
  const globeApiRef = useRef<GlobeApi | null>(null);
  const initialUrlRestoredRef = useRef(false);

  // Helper: push location into URL query params for shareable links
  const updateUrlParams = useCallback((lat: number, lng: number, city?: string, country?: string) => {
    try {
      const params = new URLSearchParams();
      params.set('lat', lat.toFixed(4));
      params.set('lng', lng.toFixed(4));
      if (city) params.set('city', city);
      if (country) params.set('country', country);
      router.replace(`/weather?${params.toString()}`, { scroll: false });
    } catch {
      // Silently ignore URL update errors
    }
  }, [router]);

  // Helper: get flyTo duration respecting reduced-motion
  const getFlyDuration = useCallback((ms: number) => prefersReducedMotion() ? 0 : ms, []);

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

  // Restore location from URL query params on mount (shareable links)
  useEffect(() => {
    if (initialUrlRestoredRef.current) return;
    initialUrlRestoredRef.current = true;

    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';

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

          {/* Quick Links */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/"
              className="text-xs px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              ← Globe
            </Link>
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
        <div className="flex-1 relative w-full h-full min-h-0 bg-[#010106] overflow-hidden">
          {/* Direct 3D Interactive Earth Globe */}
          <div className="absolute inset-0 w-full h-full">
            <GlobeScene
              events={events}
              selectedEvent={null}
              onSelectEvent={() => {}}
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

          {/* Selected Location HUD Badge (Clickable to inspect telemetry details) */}
          {weather.selectedLocation && (
            <div className="absolute top-4 left-4 z-20 pointer-events-auto">
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
            </div>
          )}

          {/* Active Layer Legend (floating top-right) */}
          <div className="absolute top-4 right-4 z-20 pointer-events-auto max-w-[280px]">
            <WeatherLegend
              activeLayer={weather.activeLayer}
              units={weather.units}
              timestamp={gridData?.timestamps?.[timelineIndex] || currentForecast?.hourly?.time?.[timelineIndex]}
              isLoading={isGridLoading}
            />
          </div>

          {/* Forecast Timeline (floating along bottom of globe) */}
          {currentForecast?.hourly && (
            <div className="absolute bottom-4 left-4 right-4 lg:right-[396px] z-20 pointer-events-auto max-w-2xl mx-auto">
              <WeatherTimeline
                hourly={currentForecast.hourly}
                selectedIndex={timelineIndex}
                onSelectIndex={setTimelineIndex}
                timezone={currentForecast.timezone || 'UTC'}
                isPlaying={isTimelinePlaying}
                onTogglePlay={() => setIsTimelinePlaying(!isTimelinePlaying)}
                units={weather.units}
              />
            </div>
          )}

          {/* Mobile "Open Weather Sheet" floating CTA */}
          {hasData && !isPanelOpen && (
            <button
              type="button"
              data-testid="open-mobile-sheet"
              onClick={() => setIsPanelOpen(true)}
              className="lg:hidden absolute bottom-24 right-4 z-20 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-2xl shadow-cyan-500/30 active:scale-95 transition-transform cursor-pointer"
            >
              📊 Telemetry →
            </button>
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
                  className={`relative flex flex-col bg-[#070718]/98 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-2xl transition-all duration-300 z-10 ${
                    isPanelMinimized ? 'h-[85px]' : 'h-[75vh] max-h-[85vh]'
                  }`}
                >
                  <div className="flex justify-center pt-2.5 pb-1 shrink-0">
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
      </main>
    </div>
  );
}
