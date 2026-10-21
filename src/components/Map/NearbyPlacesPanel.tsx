// ============================================================
// MooEarth Live — Nearby Places Discovery Panel
// ============================================================
// Displays famous landmarks, airports, parks, and natural features
// near the active map coordinates. 100% Free / Open-Data.

'use client';

import React, { useState, useEffect } from 'react';
import type { NearbyPlace, NearbyPlacesResponse } from '@/services/places/nearbyPlacesService';

interface NearbyPlacesPanelProps {
  latitude: number;
  longitude: number;
  onSelectPlace?: (place: NearbyPlace) => void;
  className?: string;
}

export default function NearbyPlacesPanel({
  latitude,
  longitude,
  onSelectPlace,
  className = '',
}: NearbyPlacesPanelProps) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/places/nearby?lat=${latitude.toFixed(4)}&lng=${longitude.toFixed(4)}&limit=6`
        );
        if (res.ok && !cancelled) {
          const data: NearbyPlacesResponse = await res.json();
          setPlaces(data.places || []);
        }
      } catch {
        // Silently handle
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPlaces();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  if (places.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 rounded-xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 text-[11px] font-mono text-white/80 hover:text-white flex items-center gap-1.5 shadow-xl transition-all cursor-pointer pointer-events-auto active:scale-95"
        title="Discover nearby landmarks, airports, and parks"
      >
        <span className="text-cyan-400">📍</span>
        <span className="font-semibold">Nearby Places</span>
        {places.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] border border-cyan-500/30">
            {places.length}
          </span>
        )}
        <span className="text-[9px] text-white/40">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Expanded POI List Card */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 rounded-2xl bg-[#060614]/98 backdrop-blur-2xl border border-white/10 shadow-2xl p-2.5 z-50 pointer-events-auto divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-1.5 pb-2 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>📍</span>
                <span>Nearby Landmarks</span>
              </div>
              <div className="text-[10px] text-white/40 font-mono">Within 10 km radius</div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white text-xs p-1"
              title="Close panel"
            >
              ✕
            </button>
          </div>

          <div className="py-1.5 space-y-1 max-h-60 overflow-y-auto overscroll-contain">
            {places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => {
                  onSelectPlace?.(place);
                  setIsOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/5 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm shrink-0">{place.icon}</span>
                  <span className="text-xs font-medium text-white/90 group-hover:text-cyan-300 truncate transition-colors">
                    {place.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400/80 shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
                  {place.formattedDistance}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-2 px-1 text-[9px] font-mono text-white/30 flex items-center justify-between">
            <span>Wikimedia Open Data</span>
            <span className="text-cyan-400/60">Click to explore</span>
          </div>
        </div>
      )}
    </div>
  );
}
