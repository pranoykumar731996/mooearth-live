'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { WorldEvent } from '@/types';
import { fallbackEvents } from '@/data/events';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { COUNTRY_METADATA } from '@/data/questions/countryMetadata';

// Dynamically import GlobeScene to ensure bundle code-splitting
const GlobeScene = dynamic(() => import('@/components/Globe/GlobeScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] bg-[#030308] flex flex-col items-center justify-center text-cyan-400 font-mono text-sm tracking-widest animate-pulse">
      <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4" />
      <span>INITIALIZING 3D EARTH GLOBE...</span>
    </div>
  ),
});

interface WebGLGlobeViewerProps {
  initialView?: 'standard' | 'night' | 'weather' | 'satellite' | 'discovery';
  height?: string;
  showControls?: boolean;
  selectedCountry?: string | null;
  onCountrySelect?: (country: string | null) => void;
  className?: string;
}

export default function WebGLGlobeViewer({
  initialView = 'standard',
  height = '560px',
  showControls = true,
  selectedCountry = null,
  onCountrySelect,
  className = '',
}: WebGLGlobeViewerProps) {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);
  const [activeView, setActiveView] = useState<'standard' | 'night' | 'weather' | 'satellite' | 'discovery'>(initialView);
  const [currentCountry, setCurrentCountry] = useState<string | null>(selectedCountry);
  const [events, setEvents] = useState<WorldEvent[]>(fallbackEvents);
  const [selectedEvent, setSelectedEvent] = useState<WorldEvent | null>(null);

  useEffect(() => {
    // Detect WebGL capability safely in browser
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }

    // Fetch latest live events
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {
        // Fallback events already primed
      });
  }, []);

  const handleCountryClick = (country: string | null) => {
    setCurrentCountry(country);
    if (onCountrySelect) {
      onCountrySelect(country);
    }
  };

  // Preview countries for quick navigation
  const quickCountries = ['United States', 'Brazil', 'United Kingdom', 'France', 'Germany', 'Japan', 'India', 'Australia', 'South Africa'];

  return (
    <div 
      data-testid="webgl-globe-viewer"
      className={`relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#020208] shadow-[0_8px_32px_rgba(0,0,0,0.6)] ${className}`}
      style={{ height }}
    >
      {/* Viewport Control Bar */}
      {showControls && (
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-[#090915]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-white/80 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-white/60">LAYER:</span>
            <span className="text-cyan-400 capitalize">{activeView}</span>
          </div>

          <div className="flex items-center gap-1 bg-[#090915]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
            {(['standard', 'night', 'weather', 'discovery'] as const).map(viewMode => (
              <button
                key={viewMode}
                onClick={() => setActiveView(viewMode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                  activeView === viewMode
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {viewMode}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Country HUD Display */}
      {currentCountry && (
        <div className="absolute bottom-4 left-4 z-20 bg-[#090915]/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-cyan-500/30 text-xs text-white shadow-xl flex items-center gap-3">
          <div>
            <span className="text-white/40 block text-[10px] uppercase tracking-wider">SELECTED TARGET</span>
            <span className="font-bold text-cyan-400 text-sm">{currentCountry}</span>
          </div>
          <Link
            href={`/country/${encodeURIComponent(currentCountry.toLowerCase())}`}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold transition-colors border border-cyan-500/30 text-[11px]"
          >
            View Country Hub &rarr;
          </Link>
          <button
            onClick={() => handleCountryClick(null)}
            className="text-white/40 hover:text-white transition-colors"
            title="Clear selection"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Viewport Content */}
      {hasWebGL === null ? (
        // Initial Mount / SSR Skeleton
        <div className="w-full h-full flex flex-col items-center justify-center text-cyan-400/80 font-mono text-xs tracking-wider">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-3" />
          <span>CONNECTING TO SATELLITE TELEMETRY...</span>
        </div>
      ) : hasWebGL ? (
        // Full Interactive 3D WebGL Globe
        <GlobeScene
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
          selectedCountry={currentCountry}
          onSelectCountry={handleCountryClick}
          globeView={activeView}
        />
      ) : (
        // Graceful Meaningful WebGL Fallback (2D Projection Map)
        <div className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-[#050515] to-[#020208] text-white">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-center gap-2">
            <span>ℹ️</span>
            <span>WebGL 3D acceleration is not available in your browser. Displaying 2D interactive coordinate projection.</span>
          </div>

          <div className="my-auto text-center py-6">
            <div className="text-6xl mb-3 select-none">🗺️</div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-2">
              Interactive 2D World Coordinate Map
            </h3>
            <p className="text-xs text-white/60 max-w-md mx-auto mb-6">
              Select any sovereign nation below to explore regional news, local time, and geographical data.
            </p>

            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {quickCountries.map(country => (
                <button
                  key={country}
                  onClick={() => handleCountryClick(country)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    currentCountry === country
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30'
                  }`}
                >
                  {COUNTRY_METADATA[country]?.flag || '🌐'} {country}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-[11px] text-white/40">
            Switch devices or enable hardware acceleration to experience full 3D WebGL orbital rotation.
          </div>
        </div>
      )}
    </div>
  );
}
