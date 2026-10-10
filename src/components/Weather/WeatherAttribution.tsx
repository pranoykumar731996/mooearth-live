// ============================================================
// MooEarth Live — Weather Attribution Component
// ============================================================
// Open-Meteo attribution as required by their terms.

'use client';

import React from 'react';

interface WeatherAttributionProps {
  className?: string;
  compact?: boolean;
}

export default function WeatherAttribution({
  className = '',
  compact = false,
}: WeatherAttributionProps) {
  if (compact) {
    return (
      <span className={`text-[10px] text-white/25 ${className}`}>
        Weather data by{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/40 transition-colors"
        >
          Open-Meteo.com
        </a>
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 ${className}`}>
      <div className="text-xs text-white/40">
        <p>
          Weather data provided by{' '}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400/70 underline hover:text-cyan-300 transition-colors"
          >
            Open-Meteo.com
          </a>
        </p>
        <p className="text-[10px] text-white/25 mt-0.5">
          Open data sources include national weather services (DWD, NOAA, MeteoFrance, etc.).
          Weather forecasts are model-generated estimates, not guaranteed predictions.
        </p>
      </div>
    </div>
  );
}
