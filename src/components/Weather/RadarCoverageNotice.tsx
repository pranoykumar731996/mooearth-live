// ============================================================
// MooEarth Live — Radar Coverage & Honest Unavailable State
// ============================================================
// Displayed when the user inspects an oceanic or non-instrumented sector
// while in Doppler Weather Radar mode.
//
// Adheres strictly to the "Truth in Weather" standard:
// Never fakes or simulates radar over oceans or outside ground radar coverage.
// Clearly explains terrestrial radar physical constraints and offers
// 1-click transitions to Global Precipitation Forecast or Satellite feeds.

'use client';

import React, { useState } from 'react';

interface RadarCoverageNoticeProps {
  locationName?: string;
  onSwitchToPrecipitation: () => void;
  onSwitchToSatellite: () => void;
  onRecenterRadar?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function RadarCoverageNotice({
  locationName,
  onSwitchToPrecipitation,
  onSwitchToSatellite,
  onRecenterRadar,
  onDismiss,
  className = '',
}: RadarCoverageNoticeProps) {
  const [isInternalDismissed, setIsInternalDismissed] = useState(false);

  if (isInternalDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsInternalDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div
      data-testid="radar-unavailable-banner"
      className={`rounded-2xl bg-[#07091e]/95 backdrop-blur-xl border border-amber-400/30 p-3.5 shadow-2xl text-left pointer-events-auto max-w-md ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl shrink-0">📡⚠️</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wider">
              Terrestrial Doppler Radar Unavailable
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                PHYSICAL LIMIT
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-5 h-5 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold cursor-pointer"
                title="Dismiss notice"
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          </div>

          <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
            {locationName ? (
              <span className="font-semibold text-white">{locationName}</span>
            ) : (
              'This sector'
            )}{' '}
            lies outside the terrestrial Doppler radar network. Ground Doppler radar requires land-based tower installations and physically does not exist over open oceans.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              type="button"
              onClick={onSwitchToPrecipitation}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Switch to global Open-Meteo GFS/ECMWF numerical precipitation forecast"
            >
              <span>⛈️</span>
              <span>Precipitation Forecast</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToSatellite}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Switch to genuine NASA & NOAA satellite observation feeds"
            >
              <span>🛰️</span>
              <span>Satellite Observations</span>
            </button>

            {onRecenterRadar && (
              <button
                type="button"
                onClick={onRecenterRadar}
                className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[10px] font-mono transition-all cursor-pointer"
                title="Center view on Continental US Doppler network"
              >
                📍 View US Radar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
