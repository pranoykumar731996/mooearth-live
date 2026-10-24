// ============================================================
// MooEarth Live — Windy-Style Map Controls & 3D/2D Toggle
// ============================================================
// Floating map control tool cluster matching Windy.com:
// - 3D Globe <-> 2D Flat Map projection switch
// - Zoom (+ / -)
// - Geolocation (my position)
// - Fullscreen toggle

'use client';

import React, { useState, useEffect } from 'react';

interface WindyMapControlsProps {
  viewMode: 'globe' | 'city-map';
  onToggleViewMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onGeolocate?: (coords: { lat: number; lng: number }) => void;
  onToggleHazards?: () => void;
  isHazardsOpen?: boolean;
  hazardsCount?: number;
  className?: string;
}

export default function WindyMapControls({
  viewMode,
  onToggleViewMode,
  onZoomIn,
  onZoomOut,
  onGeolocate,
  onToggleHazards,
  isHazardsOpen,
  hazardsCount,
  className = '',
}: WindyMapControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        if (onGeolocate) {
          onGeolocate({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('[WindyControls] Geolocation error:', err);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  return (
    <div
      className={`fixed right-3 bottom-36 z-30 flex flex-col gap-1.5 select-none pointer-events-auto ${className}`}
    >
      <div className="rounded-2xl bg-[#070916]/90 backdrop-blur-xl border border-white/10 shadow-2xl p-1 flex flex-col gap-1">
        {/* 3D / 2D Projection Toggle Button */}
        <button
          type="button"
          onClick={onToggleViewMode}
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs transition-all cursor-pointer active:scale-95
            ${
              viewMode === 'globe'
                ? 'bg-gradient-to-tr from-cyan-500/30 to-blue-600/30 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/20'
                : 'bg-gradient-to-tr from-amber-500/30 to-orange-600/30 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-500/20'
            }`}
          title={viewMode === 'globe' ? 'Switch to 2D Flat Map (Windy style)' : 'Switch to 3D Earth Globe'}
        >
          <span>{viewMode === 'globe' ? '3D' : '2D'}</span>
        </button>

        <div className="h-[1px] bg-white/10 mx-1" />

        {/* Zoom In (+) */}
        <button
          type="button"
          onClick={onZoomIn}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-base font-bold cursor-pointer"
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          +
        </button>

        {/* Zoom Out (−) */}
        <button
          type="button"
          onClick={onZoomOut}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-lg font-bold cursor-pointer"
          title="Zoom out (−)"
          aria-label="Zoom out"
        >
          −
        </button>

        <div className="h-[1px] bg-white/10 mx-1" />

        {/* Locate Me (Crosshair) */}
        <button
          type="button"
          onClick={handleLocateMe}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer active:scale-95
            ${
              isLocating
                ? 'text-cyan-400 animate-spin bg-cyan-500/20'
                : 'text-white/60 hover:text-cyan-300 hover:bg-white/10'
            }`}
          title="Locate my position (GPS)"
          aria-label="Locate me"
        >
          <span>⌖</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-xs cursor-pointer"
          title={isFullscreen ? 'Exit fullscreen' : 'Toggle fullscreen'}
          aria-label="Toggle fullscreen"
        >
          <span>{isFullscreen ? '⤢' : '⛶'}</span>
        </button>

        {/* Hazards Quick View Toggle */}
        {onToggleHazards && (
          <>
            <div className="h-[1px] bg-white/10 mx-1" />
            <button
              type="button"
              onClick={onToggleHazards}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-all cursor-pointer active:scale-95 relative
                ${
                  isHazardsOpen
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-400/50 shadow-md shadow-rose-500/20'
                    : 'text-white/70 hover:text-rose-300 hover:bg-white/10'
                }`}
              title={isHazardsOpen ? 'Hide active hazards list' : 'View active hazards & dossiers'}
              aria-label="Toggle active hazards"
            >
              <span>🚨</span>
              {typeof hazardsCount === 'number' && hazardsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-rose-600 text-[8px] font-mono text-white font-black leading-none shadow">
                  {hazardsCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
