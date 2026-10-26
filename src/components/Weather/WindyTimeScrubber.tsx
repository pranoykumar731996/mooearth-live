// ============================================================
// MooEarth Live — Windy-Style Cinematic Bottom Time Scrubber & Player
// ============================================================
// Bottom floating time-player matching Windy.com's signature design:
// - Circular Red Play/Pause button with smooth loop state
// - Historical & forecast time scrubber (24h ago -> Live -> Next 24h)
// - Live yellow pill badge with real-time timestamp
// - Satellite spectral mode pills: Blue | Visible | Infra
// - Overlay with radar checkbox toggle
// - Pressure isobars toggle & Particle animation toggle

'use client';

import React, { useState, useEffect } from 'react';
import type { SatelliteSpectralMode, WeatherLayerMode } from '@/services/weather/types';
import type { RadarFrame } from '@/services/weather/radarAdapter';

interface WindyTimeScrubberProps {
  activeLayer: WeatherLayerMode;
  spectralMode: SatelliteSpectralMode;
  onSelectSpectralMode: (mode: SatelliteSpectralMode) => void;
  overlayRadar: boolean;
  onToggleOverlayRadar: (enabled: boolean) => void;
  showPressureIsobars: boolean;
  onTogglePressureIsobars: (enabled: boolean) => void;
  particlesEnabled: boolean;
  onToggleParticles: (enabled: boolean) => void;
  showGraticules?: boolean;
  onToggleGraticules?: (enabled: boolean) => void;
  timelineIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  timestamps?: string[];
  className?: string;
  radarFrames?: RadarFrame[];
  activeRadarFrameIndex?: number;
  onSelectRadarFrameIndex?: (index: number) => void;
  radarAttribution?: string;
  satelliteObservationUtc?: string;
}

export const CYCLONE_TIMELINE_STEPS = [-24, -18, -12, -6, 0, 6, 12, 18, 24, 30, 36, 42, 48, 60, 72, 84, 96, 108, 120];
export const CYCLONE_LIVE_STEP_INDEX = 4; // Index 4 represents 0h (Live / Current Observed Position)

export default function WindyTimeScrubber({
  activeLayer,
  spectralMode,
  onSelectSpectralMode,
  overlayRadar,
  onToggleOverlayRadar,
  showPressureIsobars,
  onTogglePressureIsobars,
  particlesEnabled,
  onToggleParticles,
  showGraticules = false,
  onToggleGraticules,
  timelineIndex,
  onSelectIndex,
  isPlaying,
  onTogglePlay,
  timestamps = [],
  className = '',
  radarFrames = [],
  activeRadarFrameIndex,
  onSelectRadarFrameIndex,
  radarAttribution,
  satelliteObservationUtc,
}: WindyTimeScrubberProps) {
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isRadarMode = activeLayer === 'radar' && radarFrames.length > 0;
  const isCycloneMode = activeLayer === 'hurricane';
  const totalSteps = isRadarMode ? radarFrames.length : isCycloneMode ? CYCLONE_TIMELINE_STEPS.length : 24;
  const currentStep = isRadarMode
    ? Math.min(totalSteps - 1, Math.max(0, activeRadarFrameIndex ?? (timelineIndex % totalSteps)))
    : isCycloneMode
    ? Math.min(totalSteps - 1, Math.max(0, timelineIndex % totalSteps))
    : Math.min(totalSteps - 1, Math.max(0, timelineIndex % totalSteps));

  const cycloneHours = isCycloneMode ? CYCLONE_TIMELINE_STEPS[currentStep] : 0;
  const selectedRadarFrame = isRadarMode ? radarFrames[currentStep] : null;
  const isLiveRadar = isRadarMode && currentStep === totalSteps - 1;

  // Compute live relative time text
  const [liveTimeString, setLiveTimeString] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      setLiveTimeString(`${timeStr} · Live`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round((isRadarMode ? 800 : 1200) / playbackSpeed);
    const timer = setInterval(() => {
      const nextStep = (currentStep + 1) % totalSteps;
      if (isRadarMode && onSelectRadarFrameIndex) {
        onSelectRadarFrameIndex(nextStep);
      }
      onSelectIndex(nextStep);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, currentStep, totalSteps, isRadarMode, onSelectIndex, onSelectRadarFrameIndex]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isRadarMode && onSelectRadarFrameIndex) {
      onSelectRadarFrameIndex(val);
    }
    onSelectIndex(val);
  };

  // ── Collapsed Minimal Mode (Height: ~28px) ──
  if (isCollapsed) {
    return (
      <div
        className={`fixed bottom-2.5 left-3 right-3 sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2 sm:max-w-xl z-40 select-none pointer-events-auto transition-all ${className}`}
      >
        <div className="rounded-full bg-[#060816]/94 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] px-2.5 py-1 flex items-center justify-between gap-2.5 text-xs">
          {/* Mini Play / Pause */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shrink-0 cursor-pointer shadow active:scale-95 text-[10px]"
            title={isPlaying ? 'Pause animation' : 'Play animation'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>

          {/* Mini Range Scrubber */}
          <div className="flex-1 flex items-center min-w-0">
            <input
              type="range"
              min="0"
              max={totalSteps - 1}
              value={currentStep}
              onChange={handleSliderChange}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/15 accent-cyan-400 focus:outline-none"
            />
          </div>

          {/* Mini Live Pill */}
          <div
            className={`px-1.5 py-0.5 rounded-full text-black font-extrabold text-[9px] tracking-wide flex items-center gap-1 shrink-0 ${
              isCycloneMode
                ? cycloneHours < 0
                  ? 'bg-cyan-400/90'
                  : cycloneHours === 0
                  ? 'bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-emerald-400/90'
                : 'bg-amber-400/90'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCycloneMode && cycloneHours > 0 ? 'bg-emerald-800' : 'bg-red-600'
              } ${currentStep === (isCycloneMode ? CYCLONE_LIVE_STEP_INDEX : totalSteps - 1) ? 'animate-pulse' : ''}`}
            />
            <span className="truncate max-w-[95px] sm:max-w-none">
              {isRadarMode && selectedRadarFrame
                ? selectedRadarFrame.label
                : isCycloneMode
                ? cycloneHours < 0
                  ? `Observed (-${Math.abs(cycloneHours)}h)`
                  : cycloneHours === 0
                  ? 'Observed · Live'
                  : `Forecast (+${cycloneHours}h)`
                : liveTimeString || 'Live'}
            </span>
          </div>

          {/* Expand Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="Expand weather controls & layer toggles"
            aria-label="Expand weather controls"
          >
            <span>▲</span>
            <span className="hidden min-[420px]:inline">Expand</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Compact Expanded Mode (Height: ~55px) ──
  return (
    <div
      className={`fixed bottom-2.5 left-3 right-3 sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2 sm:max-w-2xl z-40 select-none pointer-events-auto transition-all ${className}`}
    >
      <div className="rounded-2xl bg-[#060816]/94 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-2 flex flex-col gap-1.5">
        {/* Top Row: Play/Pause Button + Scrubber Track + Speed + Minimize */}
        <div className="flex items-center gap-2">
          {/* Circular Red Play/Pause Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-lg transition-transform active:scale-95
              ${
                isPlaying
                  ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/50 ring-2 ring-rose-400 animate-pulse'
                  : 'bg-gradient-to-tr from-red-600 to-rose-500 text-white hover:from-red-500 hover:to-rose-400 shadow-red-500/30'
              }`}
            title={isPlaying ? 'Pause animation' : isRadarMode ? 'Play radar loop' : isCycloneMode ? 'Play 5-day forecast track' : 'Play 24h loop'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <span className="text-xs font-black">❚❚</span>
            ) : (
              <span className="text-xs ml-0.5">▶</span>
            )}
          </button>

          {/* Time Scrubber Track Container */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            {/* Timeline Tick Labels */}
            {isRadarMode ? (
              <div className="flex justify-between items-center text-[9px] font-mono text-white/50 px-1 mb-0.5">
                <span>-110m</span>
                <span>-50m</span>
                <span>-20m</span>
                {/* Live Pill Badge */}
                <div
                  className={`px-1.5 py-0.2 rounded-full font-extrabold text-[9px] tracking-wide flex items-center gap-1 shadow-sm transition-all ${
                    isLiveRadar
                      ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse'
                      : 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveRadar ? 'bg-red-600' : 'bg-cyan-400'}`} />
                  <span>
                    {selectedRadarFrame
                      ? `${selectedRadarFrame.formattedUtc} (${selectedRadarFrame.label})`
                      : liveTimeString || 'Live'}
                  </span>
                </div>
              </div>
            ) : isCycloneMode ? (
              <div className="flex justify-between items-center text-[9px] font-mono text-white/50 px-1 mb-0.5">
                <span className="text-cyan-400/90 font-bold">-24h</span>
                <span className="hidden sm:inline text-cyan-400/60">-12h</span>
                {/* Cyclone Status Pill Badge */}
                <div
                  className={`px-2 py-0.5 rounded-full font-mono font-extrabold text-[9px] tracking-wide flex items-center gap-1.5 shadow-sm transition-all ${
                    cycloneHours < 0
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                      : cycloneHours === 0
                      ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.8)] font-black animate-pulse'
                      : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      cycloneHours === 0 ? 'bg-red-600 animate-ping' : cycloneHours < 0 ? 'bg-cyan-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span>
                    {cycloneHours < 0
                      ? `Observed (-${Math.abs(cycloneHours)}h)`
                      : cycloneHours === 0
                      ? 'Observed Eye · Live'
                      : `Official Forecast (+${cycloneHours}h)`}
                  </span>
                </div>
                <span className="hidden sm:inline text-emerald-400/60">+48h</span>
                <span className="text-emerald-400/90 font-bold">+120h (5d)</span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-[9px] font-mono text-white/50 px-1 mb-0.5">
                <span>-24h</span>
                <span>-12h</span>
                <span>-6h</span>
                {/* Live Pill Badge */}
                <div className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-extrabold text-[9px] tracking-wide shadow-[0_0_8px_rgba(251,191,36,0.8)] flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span>{liveTimeString || 'Live'}</span>
                </div>
                <span className="hidden sm:inline">+24h</span>
              </div>
            )}

            {/* Range Scrubber Input */}
            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max={totalSteps - 1}
                value={currentStep}
                onChange={handleSliderChange}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/15 accent-cyan-400 hover:bg-white/25 transition-all focus:outline-none"
              />
            </div>

            {/* Compact 1-Line Layer Metadata */}
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-white/40 px-1 mt-0.5 truncate">
              {isRadarMode ? (
                <span className="text-cyan-300/80 truncate">📡 {radarAttribution || 'NOAA NEXRAD Doppler'} · Frame {currentStep + 1}/{totalSteps}</span>
              ) : activeLayer === 'satellite' ? (
                <span className="text-cyan-300/80 truncate">🛰️ NASA GIBS / NOAA GOES · {satelliteObservationUtc || 'UTC Active'}</span>
              ) : activeLayer === 'hurricane' ? (
                <span className="text-cyan-300/90 truncate flex items-center gap-1.5">
                  <span className="hidden sm:inline">🌀 Cyclone Track & Cone</span>
                  <span className={`px-1 rounded text-[8px] font-bold ${currentStep <= 4 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                    {currentStep <= 4 ? '🛰️ SATELLITE [OBS]' : '🔮 ECMWF MODEL [FCST]'}
                  </span>
                  <span>· Frame {currentStep + 1}/{totalSteps}</span>
                </span>
              ) : activeLayer === 'pressure' ? (
                <span className="text-cyan-300/80 truncate">🔵 Surface Pressure MSLP · 4 hPa Isobars</span>
              ) : activeLayer === 'marine' ? (
                <span className="text-cyan-300/80 truncate">🌊 Marine & Wave Vectors</span>
              ) : activeLayer === 'air-quality' ? (
                <span className="text-cyan-300/80 truncate">🍃 Copernicus CAMS Air Quality</span>
              ) : activeLayer === 'precipitation' ? (
                <span className="text-amber-300/80 truncate">🌧️ NWP Precipitation Forecast</span>
              ) : (
                <span className="text-white/40 truncate">Planetary Weather Telemetry</span>
              )}
            </div>
          </div>

          {/* Speed Selector (1x / 2x / 4x) */}
          <button
            type="button"
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 4 : 1)}
            className="px-1.5 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-cyan-300 text-[9px] font-mono font-bold transition-colors cursor-pointer shrink-0"
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>

          {/* Minimize / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="px-1.5 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[9px] font-mono font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-0.5"
            title="Minimize weather bar to reveal full Earth map"
            aria-label="Minimize weather scrubber"
          >
            <span>▼</span>
            <span className="hidden sm:inline">Hide</span>
          </button>
        </div>

        {/* Bottom Sub-Row: Satellite Spectral Modes & Overlay Toggles */}
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/5 flex-wrap text-[10px]">
          {/* Satellite Mode Switcher (Blue | Visible | Infra) */}
          {(activeLayer === 'satellite' || activeLayer === 'clouds' || activeLayer === 'radar') ? (
            <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10">
              {(['visible', 'blue', 'infra'] as SatelliteSpectralMode[]).map((mode) => {
                const isActive = spectralMode === mode;
                const label = mode === 'visible' ? 'Visible' : mode === 'blue' ? 'Blue' : 'Infra';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onSelectSpectralMode(mode)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer
                      ${
                        isActive
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-sm'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-[10px] text-white/50 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Layer: {activeLayer}</span>
            </div>
          )}

          {/* Right Group: Radar Overlay, Pressure, Particles, Grid */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Radar Overlay Toggle */}
            <label className="flex items-center gap-1 text-[10px] text-white/80 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overlayRadar}
                onChange={(e) => onToggleOverlayRadar(e.target.checked)}
                className="rounded accent-cyan-400 cursor-pointer w-3 h-3"
              />
              <span className="hidden min-[480px]:inline">Overlay</span>
              <span>radar</span>
            </label>

            {/* Isobar Pressure Toggle */}
            <button
              type="button"
              onClick={() => onTogglePressureIsobars(!showPressureIsobars)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-medium transition-colors border cursor-pointer
                ${
                  showPressureIsobars
                    ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              title="Toggle mean sea level pressure (MSLP) isobars"
            >
              <span>🌀</span>
              <span>pressure</span>
            </button>

            {/* Particle Flow Toggle */}
            <button
              type="button"
              onClick={() => onToggleParticles(!particlesEnabled)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-medium transition-colors border cursor-pointer
                ${
                  particlesEnabled
                    ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              title="Toggle animated particle streamlines (Nullschool wind)"
            >
              <span>💨</span>
              <span>particles</span>
            </button>

            {/* Graticule Grid Toggle */}
            <button
              type="button"
              onClick={() => onToggleGraticules?.(!showGraticules)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-medium transition-colors border cursor-pointer
                ${
                  showGraticules
                    ? 'bg-sky-500/25 border-sky-400/50 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              title="Toggle latitude / longitude coordinate graticules"
            >
              <span>🌐</span>
              <span>grid</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
