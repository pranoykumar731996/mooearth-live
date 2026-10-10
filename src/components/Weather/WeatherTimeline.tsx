// ============================================================
// MooEarth Live — Weather Forecast Timeline Component
// ============================================================
// Touch-friendly interactive timeline scrubber for 24h/7d forecast.
// Includes play/pause, prev/next step buttons, slider scrubber,
// local time formatting, weather icons, and speed/temperature metrics.

'use client';

import React, { useEffect, useRef } from 'react';
import type { HourlyForecast } from '@/services/weather/types';
import { getWeatherDescription } from '@/services/weather/forecastService';

interface WeatherTimelineProps {
  hourly?: HourlyForecast | null;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  timezone?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  units?: 'celsius' | 'fahrenheit';
  className?: string;
}

export default function WeatherTimeline({
  hourly,
  selectedIndex,
  onSelectIndex,
  timezone = 'UTC',
  isPlaying = false,
  onTogglePlay,
  units = 'celsius',
  className = '',
}: WeatherTimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const times = hourly?.time || [];
  const maxIndex = Math.max(0, times.length - 1);

  // Play animation timer
  useEffect(() => {
    if (!isPlaying || times.length === 0) return;

    const interval = setInterval(() => {
      onSelectIndex((selectedIndex + 1) % times.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, selectedIndex, times.length, onSelectIndex]);

  if (!hourly || times.length === 0) return null;

  const currentTimeStr = times[selectedIndex] || '';
  const currentTemp = hourly.temperature2m?.[selectedIndex];
  const currentWeatherCode = hourly.weatherCode?.[selectedIndex] ?? 0;
  const currentPrecip = hourly.precipitation?.[selectedIndex] ?? 0;
  const currentWindSpeed = hourly.windSpeed10m?.[selectedIndex] ?? 0;
  const weatherInfo = getWeatherDescription(currentWeatherCode);

  // Format date and time
  const formatTime = (timeIso: string) => {
    try {
      const d = new Date(timeIso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return timeIso;
    }
  };

  const formatDate = (timeIso: string) => {
    try {
      const d = new Date(timeIso);
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const unitSymbol = units === 'fahrenheit' ? '°F' : '°C';
  const displayTemp = currentTemp !== undefined
    ? units === 'fahrenheit' ? Math.round((currentTemp * 9) / 5 + 32) : Math.round(currentTemp)
    : '--';

  return (
    <div
      ref={containerRef}
      className={`bg-[#050512]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl text-white ${className}`}
    >
      {/* Top Status & Controls */}
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        {/* Active Step Details */}
        <div className="flex items-center gap-2.5">
          <span className="text-2xl" role="img" aria-label={weatherInfo.description}>
            {weatherInfo.icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-cyan-300">
                {formatTime(currentTimeStr)}
              </span>
              <span className="text-[11px] text-white/50">
                {formatDate(currentTimeStr)}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">
                {timezone}
              </span>
            </div>
            <div className="text-xs text-white/70 flex items-center gap-3">
              <span>{weatherInfo.description}</span>
              <span className="font-semibold text-white">{displayTemp}{unitSymbol}</span>
              {currentWindSpeed > 0 && (
                <span className="text-cyan-300/80 text-[11px]">💨 {Math.round(currentWindSpeed)} km/h</span>
              )}
              {currentPrecip > 0 && (
                <span className="text-blue-300/80 text-[11px]">🌧️ {currentPrecip} mm</span>
              )}
            </div>
          </div>
        </div>

        {/* Playback & Step Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectIndex(Math.max(0, selectedIndex - 1))}
            disabled={selectedIndex === 0}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 flex items-center justify-center text-xs transition-colors"
            title="Previous hour"
          >
            ⏮
          </button>

          {onTogglePlay && (
            <button
              type="button"
              onClick={onTogglePlay}
              className="px-2.5 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 text-xs font-semibold transition-colors"
              title={isPlaying ? 'Pause animation' : 'Play forecast timeline'}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
              <span className="text-[10px] hidden sm:inline">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectIndex(Math.min(maxIndex, selectedIndex + 1))}
            disabled={selectedIndex >= maxIndex}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 flex items-center justify-center text-xs transition-colors"
            title="Next hour"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* Scrub Range Slider */}
      <div className="relative pt-1 pb-1">
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={selectedIndex}
          onChange={(e) => onSelectIndex(Number(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />
      </div>

      {/* Mini Scrubber Hour Markers Preview */}
      <div className="flex justify-between items-center text-[10px] text-white/40 font-mono px-1">
        <span>{formatTime(times[0])}</span>
        <span className="text-white/20">•</span>
        <span>{formatTime(times[Math.floor(times.length / 4)])}</span>
        <span className="text-white/20">•</span>
        <span>{formatTime(times[Math.floor(times.length / 2)])}</span>
        <span className="text-white/20">•</span>
        <span>{formatTime(times[Math.floor((times.length * 3) / 4)])}</span>
        <span className="text-white/20">•</span>
        <span>{formatTime(times[maxIndex])}</span>
      </div>
    </div>
  );
}
