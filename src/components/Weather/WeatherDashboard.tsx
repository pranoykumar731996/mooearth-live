// ============================================================
// MooEarth Live — Weather Dashboard
// ============================================================
// The main weather experience. Globe + search + layer selector +
// weather panel. Mobile-first: full-screen globe with bottom sheet.
// Desktop: globe left, panel right.

'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import WeatherSearch from './WeatherSearch';
import WeatherLayerSelector from './WeatherLayerSelector';
import WeatherPanel from './WeatherPanel';
import { useWeatherData } from '@/hooks/useWeatherData';
import type { GeocodingResult } from '@/services/weather/types';

const WebGLGlobeViewer = dynamic(
  () => import('@/components/Globe/WebGLGlobeViewer'),
  { ssr: false, loading: () => null }
);

export default function WeatherDashboard() {
  const weather = useWeatherData();
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
    },
    [weather]
  );

  const hasData = weather.selectedLocation !== null;

  return (
    <div className="min-h-screen bg-[#020208] text-white relative overflow-hidden">
      {/* ── Header Bar ────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#020208]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
          >
            <span className="text-lg">🌍</span>
            <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors hidden sm:inline">
              MooEarth
            </span>
            <span className="text-xs font-semibold text-cyan-400 px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
              Weather
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto">
            <WeatherSearch onSelectLocation={handleSelectLocation} />
          </div>

          {/* Back to Globe */}
          <Link
            href="/"
            className="text-xs text-white/40 hover:text-white/70 transition-colors shrink-0 hidden sm:block"
          >
            ← Globe
          </Link>
        </div>
      </header>

      {/* ── Layer Selector ────────────────────── */}
      <div className="fixed top-[52px] left-0 right-0 z-30 bg-[#020208]/70 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-4 py-2">
          <WeatherLayerSelector
            activeLayer={weather.activeLayer}
            onSelectLayer={weather.setActiveLayer}
          />
        </div>
      </div>

      {/* ── Main Content ──────────────────────── */}
      <main className="pt-[100px] h-screen flex flex-col lg:flex-row">
        {/* Globe Area */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-0">
          <WebGLGlobeViewer
            selectedCountry={weather.selectedLocation?.country}
            height="100%"
          />

          {/* Globe overlay: selected location badge */}
          {weather.selectedLocation && (
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
              <div className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-cyan-400/30 text-xs font-mono text-cyan-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                {weather.selectedLocation.name}
                {weather.selectedLocation.country ? `, ${weather.selectedLocation.country}` : ''}
              </div>
            </div>
          )}

          {/* Active layer badge */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <div className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/60">
              {weather.activeLayer === 'overview' ? '🌤️ Overview' :
               weather.activeLayer === 'wind' ? '💨 Wind' :
               weather.activeLayer === 'temperature' ? '🌡️ Temperature' :
               weather.activeLayer === 'precipitation' ? '🌧️ Precipitation' :
               weather.activeLayer === 'air-quality' ? '🫁 Air Quality' :
               weather.activeLayer === 'flood' ? '🌊 Flood' :
               weather.activeLayer === 'marine' ? '⚓ Marine' :
               '⛰️ Elevation'}
            </div>
          </div>

          {/* Mobile: open panel button when panel is closed */}
          {hasData && !isPanelOpen && (
            <button
              type="button"
              onClick={() => setIsPanelOpen(true)}
              className="lg:hidden absolute bottom-4 right-4 z-20 px-4 py-2.5 rounded-2xl bg-cyan-500 text-black text-xs font-bold 
                         shadow-lg shadow-cyan-500/30 active:scale-95 transition-transform"
            >
              View Weather →
            </button>
          )}
        </div>

        {/* Weather Panel — Side panel on desktop, bottom sheet on mobile */}
        {hasData && (
          <>
            {/* Desktop: side panel */}
            <div className="hidden lg:block w-[380px] shrink-0 border-l border-white/5 bg-[#050510]/90 backdrop-blur-xl overflow-hidden">
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

            {/* Mobile: bottom sheet */}
            {isPanelOpen && (
              <div className="lg:hidden fixed inset-x-0 bottom-0 z-50">
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/40"
                  onClick={() => setIsPanelOpen(false)}
                />
                {/* Sheet */}
                <div
                  className={`relative bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl 
                              shadow-2xl shadow-black/60 overflow-hidden transition-all duration-300
                              ${isPanelMinimized ? 'max-h-[80px]' : 'max-h-[65vh]'}`}
                >
                  {/* Drag handle */}
                  <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                  </div>
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setIsPanelOpen(false)}
                    className="absolute top-3 right-3 text-white/30 hover:text-white/60 text-xs z-10"
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

        {/* No location selected — Prompt */}
        {!hasData && (
          <div className="hidden lg:flex w-[380px] shrink-0 border-l border-white/5 bg-[#050510]/90 items-center justify-center">
            <div className="text-center p-8">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-sm text-white/60 font-medium mb-2">
                Search for a city or location
              </p>
              <p className="text-xs text-white/30">
                Type in the search bar above to explore weather worldwide
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
