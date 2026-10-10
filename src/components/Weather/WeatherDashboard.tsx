// ============================================================
// MooEarth Live — Weather Dashboard
// ============================================================
// The central weather experience: 3D Interactive Earth Globe +
// Location Search + 8 Layer Selector + Animated Wind Particle System +
// Forecast Timeline Scrubber + Color Scales + Telemetry Panel.
// Desktop: side-by-side layout. Mobile: full-screen globe with bottom sheet.

'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import WeatherSearch from './WeatherSearch';
import WeatherLayerSelector from './WeatherLayerSelector';
import WeatherPanel from './WeatherPanel';
import WindParticleOverlay from './WindParticleOverlay';
import WeatherTimeline from './WeatherTimeline';
import WeatherLegend from './WeatherLegend';
import { useWeatherData } from '@/hooks/useWeatherData';
import type { GeocodingResult } from '@/services/weather/types';
import { getCoordinatesForCountry } from '@/lib/constants';

const WebGLGlobeViewer = dynamic(
  () => import('@/components/Globe/WebGLGlobeViewer'),
  { ssr: false, loading: () => null }
);

export default function WeatherDashboard() {
  const weather = useWeatherData();
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);

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
      setIsPanelOpen(true);
      setIsPanelMinimized(false);
      setTimelineIndex(0);
    },
    [weather]
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
          }
        });
      }
      setIsPanelOpen(true);
      setIsPanelMinimized(false);
      setTimelineIndex(0);
    },
    [weather]
  );

  // Globe coordinate click handler (any point, ocean, island)
  const handleGlobeClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      const latStr = coords.lat >= 0 ? `${coords.lat.toFixed(2)}°N` : `${Math.abs(coords.lat).toFixed(2)}°S`;
      const lngStr = coords.lng >= 0 ? `${coords.lng.toFixed(2)}°E` : `${Math.abs(coords.lng).toFixed(2)}°W`;
      weather.fetchWeatherForLocation({
        latitude: coords.lat,
        longitude: coords.lng,
        name: `${latStr}, ${lngStr}`,
        timezone: 'auto',
        source: 'globe-click',
      });
      setIsPanelOpen(true);
      setIsPanelMinimized(false);
      setTimelineIndex(0);
    },
    [weather]
  );

  const hasData = weather.selectedLocation !== null;
  const currentForecast = weather.data.forecast;
  const windSpeed = currentForecast?.current?.windSpeed ?? 15;
  const windDirection = currentForecast?.current?.windDirection ?? 45;
  const windGusts = currentForecast?.current?.windGusts;

  return (
    <div className="min-h-screen bg-[#020208] text-white relative overflow-hidden flex flex-col">
      {/* ── Top Header Bar ────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#020208]/85 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <span className="text-xl">🌍</span>
            <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors hidden sm:inline">
              MooEarth
            </span>
            <span className="text-xs font-semibold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
              Weather Intelligence
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <WeatherSearch onSelectLocation={handleSelectLocation} />
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              ← Globe
            </Link>
          </div>
        </div>
      </header>

      {/* ── Layer Mode Selector ────────────────────── */}
      <div className="fixed top-[52px] left-0 right-0 z-30 bg-[#020208]/75 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-4 py-1.5">
          <WeatherLayerSelector
            activeLayer={weather.activeLayer}
            onSelectLayer={weather.setActiveLayer}
          />
        </div>
      </div>

      {/* ── Main Viewport Area ──────────────────────── */}
      <main className="pt-[98px] flex-1 h-[calc(100vh-98px)] flex flex-col lg:flex-row relative overflow-hidden">
        {/* Globe Viewport */}
        <div className="flex-1 relative w-full h-full min-h-[50vh] lg:min-h-0 bg-[#010106]">
          <WebGLGlobeViewer
            initialView="weather"
            selectedCountry={weather.selectedLocation?.country}
            onCountrySelect={handleCountrySelect}
            onGlobeClick={handleGlobeClick}
            height="100%"
          />

          {/* Animated Wind Particles (active in wind mode or when wind layer is selected) */}
          <WindParticleOverlay
            windSpeed={windSpeed}
            windDirection={windDirection}
            windGusts={windGusts}
            isActive={weather.activeLayer === 'wind' || (hasData && weather.activeLayer === 'overview')}
          />

          {/* Selected Location HUD Badge */}
          {weather.selectedLocation && (
            <div className="absolute top-4 left-4 z-20 pointer-events-auto">
              <div className="px-3.5 py-2 rounded-2xl bg-[#050512]/90 backdrop-blur-xl border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-2.5 shadow-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <div>
                  <div className="font-bold text-white text-xs">
                    {weather.selectedLocation.name}
                  </div>
                  <div className="text-[10px] text-white/50">
                    {weather.selectedLocation.country || 'Target Coordinates'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Layer Legend (floating) */}
          <div className="absolute top-4 right-4 z-20 pointer-events-auto max-w-[280px]">
            <WeatherLegend activeLayer={weather.activeLayer} units={weather.units} />
          </div>

          {/* Forecast Timeline (floating along bottom of globe on desktop and tablet) */}
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
              onClick={() => setIsPanelOpen(true)}
              className="lg:hidden absolute bottom-20 right-4 z-20 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-2xl shadow-cyan-500/30 active:scale-95 transition-transform"
            >
              📊 Telemetry Details →
            </button>
          )}
        </div>

        {/* ── Weather Details Panel (Desktop: side panel / Mobile: bottom sheet) ── */}
        {hasData && (
          <>
            {/* Desktop Side Panel */}
            <div className="hidden lg:block w-[380px] shrink-0 border-l border-white/5 bg-[#050510]/95 backdrop-blur-2xl overflow-hidden h-full z-20 shadow-2xl">
              <WeatherPanel
                forecast={weather.data.forecast}
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
              <div className="lg:hidden fixed inset-x-0 bottom-0 z-50">
                {/* Backdrop overlay */}
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setIsPanelOpen(false)}
                />
                {/* Sheet Drawer */}
                <div
                  className={`relative bg-[#070718]/98 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
                    isPanelMinimized ? 'max-h-[85px]' : 'max-h-[75vh]'
                  }`}
                >
                  <div className="flex justify-center pt-2.5 pb-1">
                    <div className="w-12 h-1.5 rounded-full bg-white/20" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPanelOpen(false)}
                    className="absolute top-3.5 right-4 w-7 h-7 rounded-full bg-white/5 text-white/50 hover:text-white flex items-center justify-center text-xs z-20"
                  >
                    ✕
                  </button>
                  <WeatherPanel
                    forecast={weather.data.forecast}
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
