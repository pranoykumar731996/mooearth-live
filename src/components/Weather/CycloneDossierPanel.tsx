// ============================================================
// MooEarth Live — Tropical Cyclone Forecast Dossier & Telemetry Panel
// ============================================================
// Displays rich meteorological intelligence for active tropical cyclones:
// - Observed vs. official forecast status and lead times (+6h, +12h, +24h, +48h, +72h, +120h)
// - Eyewall wind intensity, wind gusts, and central barometric pressure
// - Motion vectors (bearing degrees and forward translation speed)
// - Real-time distance to nearest coastline and transparent Landfall Outlook
// - Official 5-day cone of uncertainty explanation and safety disclaimers
// - Direct emergency links to official issuing agencies (IMD, NOAA NHC, JTWC)

'use client';

import React, { useState, useEffect } from 'react';
import type { TropicalCyclone } from '@/services/weather/cycloneTrackingService';
import { interpolateForecastPosition } from '@/services/weather/cycloneTrackingService';
import { findNearestCoastline } from '@/services/weather/coastlineProximity';

interface CycloneDossierPanelProps {
  cyclone: TropicalCyclone | null;
  timelineHoursAhead: number;
  onClose: () => void;
  className?: string;
}

export default function CycloneDossierPanel({
  cyclone,
  timelineHoursAhead,
  onClose,
  className = '',
}: CycloneDossierPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Keyboard Escape listener to dismiss observatory report
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!cyclone) return null;

  // Interpolate storm state for the active timeline frame
  const frame = interpolateForecastPosition(cyclone, timelineHoursAhead);
  const currentProximity = findNearestCoastline(frame.lat, frame.lng);

  const isForecast = frame.isForecast;
  const leadHours = frame.leadHours;

  const latFormatted = `${Math.abs(frame.lat).toFixed(2)}°${frame.lat >= 0 ? 'N' : 'S'}`;
  const lngFormatted = `${Math.abs(frame.lng).toFixed(2)}°${frame.lng >= 0 ? 'E' : 'W'}`;

  // Saffir-Simpson or IMD classification badge color
  const getCategoryColor = (kph: number) => {
    if (kph < 63) return { text: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.4)' };
    if (kph < 119) return { text: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)' };
    if (kph < 154) return { text: '#facc15', bg: 'rgba(250,204,21,0.15)', border: 'rgba(250,204,21,0.4)' };
    if (kph < 178) return { text: '#fb923c', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.4)' };
    if (kph < 209) return { text: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)' };
    if (kph < 252) return { text: '#ef4444', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.5)' };
    return { text: '#fda4af', bg: 'rgba(253,164,175,0.25)', border: 'rgba(253,164,175,0.6)' };
  };

  const catStyle = getCategoryColor(frame.windSpeedKph);

  return (
    <div
      className={`fixed top-[104px] sm:top-[112px] right-2 sm:right-5 z-40 max-w-[390px] w-[calc(100vw-16px)] sm:w-full select-none pointer-events-auto transition-all ${className}`}
      data-testid="cyclone-dossier-panel"
    >
      <div className="max-h-[calc(100vh-185px)] sm:max-h-[calc(100vh-170px)] rounded-2xl bg-[#060818]/96 backdrop-blur-2xl border border-white/15 shadow-[0_12px_45px_rgba(0,0,0,0.85)] p-3.5 sm:p-4 text-white flex flex-col font-sans overflow-hidden">
        {/* Sticky Pinned Header: Return Link + Title + Actions (Always visible!) */}
        <div className="shrink-0 border-b border-white/10 pb-2.5 mb-2.5 flex flex-col gap-1.5">
          {/* Top row: Return to Map button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1 transition-colors cursor-pointer group"
              title="Return to Map"
              aria-label="Return to Map"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform text-xs">←</span>
              <span className="font-semibold underline underline-offset-2">Return to Map</span>
            </button>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Observatory Report
            </span>
          </div>

          {/* Main header row: Name + Agency + Minimize/Close Crossbar buttons */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xl shrink-0">🌀</span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight truncate">
                  {cyclone.name}
                </h2>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 font-semibold mt-0.5 truncate">
                {cyclone.basin} Basin · {cyclone.agency}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                title={isMinimized ? 'Expand panel' : 'Minimize panel'}
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? '▼' : '▲'}
              </button>
              {/* Functional Crossbar Button */}
              <button
                type="button"
                onClick={onClose}
                data-testid="close-cyclone-dossier"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/30 text-white/80 hover:text-rose-100 border border-white/20 hover:border-rose-400/50 flex items-center justify-center text-sm font-black transition-all cursor-pointer shadow-lg active:scale-90"
                title="Close observatory report (Esc)"
                aria-label="Close observatory report"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Minimized Pill Preview */}
        {isMinimized ? (
          <div className="flex items-center justify-between text-xs font-mono py-1">
            <span style={{ color: catStyle.text }} className="font-extrabold truncate">
              {frame.stageName}
            </span>
            <span className="text-cyan-300 font-bold shrink-0">{frame.windSpeedKph} km/h</span>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 space-y-3 touch-pan-y scrollbar-thin scrollbar-thumb-white/20">
            {/* Timeline Frame Status Badge */}
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    !isForecast ? 'bg-cyan-400' : 'bg-amber-400 animate-pulse'
                  }`}
                />
                <span className="font-bold text-white/90">
                  {!isForecast ? 'Observed Position' : `Forecast Frame (+${leadHours}h)`}
                </span>
              </div>
              <span
                style={{
                  color: catStyle.text,
                  backgroundColor: catStyle.bg,
                  borderColor: catStyle.border,
                }}
                className="px-2 py-0.5 rounded-lg border text-[10px] font-extrabold"
              >
                {frame.stageName}
              </span>
            </div>

            {/* Core Meteorological Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {/* Max Sustained Winds */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  Sustained Winds
                </span>
                <span className="text-base font-black text-cyan-300 mt-0.5">
                  {frame.windSpeedKph}{' '}
                  <span className="text-xs font-normal text-white/60">km/h</span>
                </span>
                <span className="text-[10px] text-white/50">
                  {Math.round(frame.windSpeedKph / 1.852)} knots · gusts {Math.round(frame.windSpeedKph * 1.25)} km/h
                </span>
              </div>

              {/* Central Pressure */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  Central Pressure
                </span>
                <span className="text-base font-black text-cyan-200 mt-0.5">
                  {cyclone.pressureHpa ? `${cyclone.pressureHpa} hPa` : 'Unavailable'}
                </span>
                <span className="text-[10px] text-white/50">
                  {cyclone.pressureHpa ? `${(cyclone.pressureHpa * 0.02953).toFixed(2)} inHg` : 'Est. by satellite'}
                </span>
              </div>

              {/* Eye Coordinates */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  Eye Coordinates
                </span>
                <span className="text-xs font-bold text-white mt-1">
                  {latFormatted}, {lngFormatted}
                </span>
                <span className="text-[10px] text-cyan-400/80">
                  {frame.isInterpolated ? 'Interpolated frame' : 'Official waypoint'}
                </span>
              </div>

              {/* Motion Vector */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                  Storm Movement
                </span>
                <span className="text-xs font-bold text-white mt-1">
                  {cyclone.movementDirectionDeg}° at {cyclone.movementSpeedKph} km/h
                </span>
                <span className="text-[10px] text-white/50">
                  ~{Math.round(cyclone.movementSpeedKph / 1.852)} knots translation
                </span>
              </div>
            </div>

            {/* Coastline Proximity & Landfall Intelligence */}
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/25 flex flex-col gap-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>📍</span>
                  <span>Coastline Proximity</span>
                </span>
                <span className="text-[10px] text-white/50">Geographic metric</span>
              </div>
              <div className="text-xs text-white">
                <strong className="text-cyan-200">{currentProximity.distanceKm} km</strong> off{' '}
                <span className="text-white/90 font-semibold">{currentProximity.nearestPoint.name}</span>
                <span className="text-white/50"> ({currentProximity.nearestPoint.country})</span>
              </div>
              <span className="text-[9px] text-white/40 italic leading-tight">
                Straight-line distance to nearest coastal landmass. Does not imply landfall probability.
              </span>
            </div>

            {/* Transparent Landfall Outlook (if forecast track intersects coastline) */}
            {cyclone.landfallOutlook && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Landfall Outlook</span>
                  </span>
                  <span className="text-[9px] text-amber-400 font-bold">Estimated</span>
                </div>
                <div className="text-xs text-white">
                  <span className="text-white/70">Estimated Window: </span>
                  <strong className="text-amber-200">{cyclone.landfallOutlook.estimatedTimeWindow}</strong>
                </div>
                <div className="text-[11px] text-white/80">
                  <span className="text-white/50">Sector: </span>
                  <span className="font-semibold text-white">{cyclone.landfallOutlook.estimatedCoastlineName}</span>
                </div>
                <p className="text-[9px] text-amber-200/60 italic leading-tight border-t border-amber-500/20 pt-1 mt-0.5">
                  {cyclone.landfallOutlook.disclaimer}
                </p>
              </div>
            )}

            {/* Official Warnings Section */}
            {Array.isArray(cyclone.warnings) && cyclone.warnings.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                  Official Warnings Published
                </span>
                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                  {cyclone.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/25 border border-rose-500/30 text-[11px] font-mono text-rose-200 flex flex-col"
                    >
                      <span className="font-extrabold text-white">
                        🚨 {w.warningType}: {w.targetRegion}
                      </span>
                      <span className="text-[9px] text-rose-300/60 mt-0.5">
                        Issued by {w.agency} · {new Date(w.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cone of Uncertainty Safety Explanation */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[9px] text-white/50 font-mono leading-relaxed">
              <strong className="text-white/80 block mb-0.5">ℹ️ About the Forecast Cone:</strong>
              The cone represents the 67% probability track of the storm center. Hazardous winds, torrential rainfall, and coastal storm surge often extend far outside the cone.
            </div>

            {/* Footer: Official Advisory Links, Dismiss Button & Emergency Portal */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono gap-2 shrink-0">
              <span className="text-white/40 truncate text-[9px] sm:text-[10px]">
                {cyclone.advisoryNumber || 'Live Synoptic'}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Close observatory report"
                  aria-label="Close report"
                >
                  <span>✕</span>
                  <span>Close</span>
                </button>
                <a
                  href={cyclone.agencyUrl || 'https://www.nhc.noaa.gov'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold transition-colors flex items-center gap-1"
                >
                  <span>Official Portal</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
