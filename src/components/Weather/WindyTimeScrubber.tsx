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

  const isRadarMode = activeLayer === 'radar' && radarFrames.length > 0;
  const totalSteps = isRadarMode ? radarFrames.length : 24;
  const currentStep = isRadarMode
    ? Math.min(totalSteps - 1, Math.max(0, activeRadarFrameIndex ?? (timelineIndex % totalSteps)))
    : Math.min(totalSteps - 1, Math.max(0, timelineIndex % totalSteps));

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

  return (
    <div
      className={`fixed bottom-3 left-4 right-4 md:left-1/2 md:right-auto md:w-full md:-translate-x-1/2 md:max-w-3xl z-40 select-none pointer-events-auto ${className}`}
    >
      <div className="rounded-2xl bg-[#060816]/92 backdrop-blur-2xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.8)] p-2.5 flex flex-col gap-2">
        {/* Top Row: Play/Pause Button + Scrubber Rail */}
        <div className="flex items-center gap-3">
          {/* Circular Red Play/Pause Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-lg transition-transform active:scale-95
              ${
                isPlaying
                  ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-500/50 ring-2 ring-rose-400 animate-pulse'
                  : 'bg-gradient-to-tr from-red-600 to-rose-500 text-white hover:from-red-500 hover:to-rose-400 shadow-red-500/30'
              }`}
            title={isPlaying ? 'Pause animation' : isRadarMode ? 'Play radar loop' : 'Play 24h loop'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <span className="text-base font-black">❚❚</span>
            ) : (
              <span className="text-base ml-0.5">▶</span>
            )}
          </button>

          {/* Time Scrubber Track Container */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Timeline Tick Labels */}
            {isRadarMode ? (
              <div className="flex justify-between items-center text-[10px] font-mono text-white/50 px-1 mb-1">
                <span>-110m</span>
                <span>-80m</span>
                <span>-50m</span>
                <span>-20m</span>
                {/* Live Pill Badge */}
                <div
                  className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] tracking-wide flex items-center gap-1 shadow-md transition-all ${
                    isLiveRadar
                      ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse'
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
            ) : (
              <div className="flex justify-between items-center text-[10px] font-mono text-white/50 px-1 mb-1">
                <span>24h ago</span>
                <span>12h ago</span>
                <span>6h ago</span>
                <span>1h ago</span>
                {/* Live Pill Badge */}
                <div className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-[10px] tracking-wide shadow-[0_0_12px_rgba(251,191,36,0.8)] flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span>{liveTimeString || 'Live'}</span>
                </div>
                <span className="hidden sm:inline">Next 1h</span>
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
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-cyan-400 hover:bg-white/20 transition-all focus:outline-none"
              />
            </div>

            {/* Radar Truth-in-Weather Met Information Bar */}
            {isRadarMode && (
              <div className="flex items-center justify-between text-[9px] font-mono text-white/40 px-1 mt-1">
                <span className="flex items-center gap-1 text-cyan-300/80">
                  <span>📡</span>
                  <span className="truncate">{radarAttribution || 'NOAA NEXRAD Doppler Network'}</span>
                </span>
                <span className="hidden sm:inline text-white/40">
                  Terrestrial Radar • 10m Scans • Public Domain (17 U.S.C. § 105)
                </span>
                <span className="text-amber-400/90 font-bold shrink-0">
                  Frame {currentStep + 1}/{totalSteps}
                </span>
              </div>
            )}

            {/* Satellite Truth-in-Weather Information Bar */}
            {activeLayer === 'satellite' && (
              <div className="flex items-center justify-between text-[9px] font-mono text-white/40 px-1 mt-1">
                <span className="flex items-center gap-1 text-cyan-300/80">
                  <span>🛰️</span>
                  <span>NASA GIBS / NOAA GOES</span>
                </span>
                <span className="hidden sm:inline text-white/40">
                  Daily Global Composite • VIIRS/MODIS • Earth Science Open Data
                </span>
                <span className="text-cyan-300 font-bold shrink-0">
                  {satelliteObservationUtc || 'Observation UTC Active'}
                </span>
              </div>
            )}

            {/* Pressure Isobars Truth-in-Weather Information Bar */}
            {activeLayer === 'pressure' && (
              <div className="flex items-center justify-between text-[9px] font-mono text-white/40 px-1 mt-1">
                <span className="flex items-center gap-1 text-cyan-300/80">
                  <span>🔵</span>
                  <span>Surface Pressure (MSLP)</span>
                </span>
                <span className="hidden sm:inline text-white/40">
                  MSLP • Synoptic 4 hPa isobars • Planetary High (H) & Low (L) Centers
                </span>
                <span className="text-cyan-300 font-bold shrink-0">
                  Global GFS Model
                </span>
              </div>
            )}

            {/* Marine Truth-in-Weather Information Bar */}
            {activeLayer === 'marine' && (
              <div className="flex items-center justify-between text-[9px] font-mono text-white/40 px-1 mt-1">
                <span className="flex items-center gap-1 text-cyan-300/80">
                  <span>🌊</span>
                  <span>Marine & Ocean Currents</span>
                </span>
                <span className="hidden sm:inline text-white/40">
                  Significant Wave Height • Swell Vectors • Douglas Sea State Scale
                </span>
                <span className="text-cyan-300 font-bold shrink-0">
                  Marine Wave Model
                </span>
              </div>
            )}

            {/* Air Quality Information Bar */}
            {activeLayer === 'air-quality' && (
              <div className="flex items-center justify-between text-[9px] font-mono text-white/40 px-1 mt-1">
                <span className="flex items-center gap-1 text-cyan-300/80">
                  <span>🍃</span>
                  <span>Atmospheric Air Quality</span>
                </span>
                <span className="hidden sm:inline text-white/40">
                  PM2.5 / PM10 / Ozone / NO₂ • European & US AQI Standards
                </span>
                <span className="text-cyan-300 font-bold shrink-0">
                  Copernicus CAMS
                </span>
              </div>
            )}

            {/* Forecast Precipitation Truth-in-Weather Information Bar */}
            {activeLayer === 'precipitation' && (
              <div className="flex items-center justify-between text-[9px] font-mono text-white/40 px-1 mt-1">
                <span className="flex items-center gap-1 text-amber-300/80">
                  <span>🌧️</span>
                  <span>Precipitation Forecast</span>
                </span>
                <span className="hidden sm:inline text-white/40">
                  Numerical NWP model forecast • Precipitation Simulation • Not Observed Terrestrial Radar
                </span>
                <span className="text-amber-300 font-bold shrink-0">
                  ECMWF / GFS
                </span>
              </div>
            )}
          </div>

          {/* Speed Selector (1x / 2x / 4x) */}
          <button
            type="button"
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 4 : 1)}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-cyan-300 text-[10px] font-mono font-bold transition-colors cursor-pointer shrink-0"
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>
        </div>

        {/* Bottom Sub-Row: Satellite Spectral Modes & Overlay Toggles */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap text-xs">
          {/* Satellite Mode Switcher (Blue | Visible | Infra) */}
          {(activeLayer === 'satellite' || activeLayer === 'clouds' || activeLayer === 'radar') ? (
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
              {(['visible', 'blue', 'infra'] as SatelliteSpectralMode[]).map((mode) => {
                const isActive = spectralMode === mode;
                const label = mode === 'visible' ? 'Visible' : mode === 'blue' ? 'Blue' : 'Infra';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onSelectSpectralMode(mode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer
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
            <div className="text-[11px] text-white/50 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Layer: {activeLayer}</span>
            </div>
          )}

          {/* Radar Overlay Toggle */}
          <label className="flex items-center gap-1.5 text-[11px] text-white/80 hover:text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overlayRadar}
              onChange={(e) => onToggleOverlayRadar(e.target.checked)}
              className="rounded accent-cyan-400 cursor-pointer"
            />
            <span>Overlay with radar</span>
          </label>

          {/* Isobar Pressure Toggle */}
          <button
            type="button"
            onClick={() => onTogglePressureIsobars(!showPressureIsobars)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors border cursor-pointer
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors border cursor-pointer
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

          {/* Graticule Grid Toggle (Nullschool Mode) */}
          <button
            type="button"
            onClick={() => onToggleGraticules?.(!showGraticules)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors border cursor-pointer
              ${
                showGraticules
                  ? 'bg-sky-500/25 border-sky-400/50 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            title="Toggle latitude / longitude coordinate graticules (Nullschool grid)"
          >
            <span>🌐</span>
            <span>grid</span>
          </button>
        </div>
      </div>
    </div>
  );
}
