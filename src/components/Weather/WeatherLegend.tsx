// ============================================================
// MooEarth Live — Weather Layer Legend Component
// ============================================================
// Visual color scale and legend for the active weather mode.
// Displays gradient bars, unit indicators, and official scale brackets.

'use client';

import React from 'react';
import type { WeatherLayerMode } from '@/services/weather/types';
import { WEATHER_LAYERS } from '@/services/weather/types';

interface WeatherLegendProps {
  activeLayer: WeatherLayerMode;
  units?: 'celsius' | 'fahrenheit';
  className?: string;
}

export default function WeatherLegend({
  activeLayer,
  units = 'celsius',
  className = '',
}: WeatherLegendProps) {
  const layerMeta = WEATHER_LAYERS.find(l => l.id === activeLayer);
  if (!layerMeta) return null;

  const tempMin = units === 'fahrenheit' ? '-4°F' : '-20°C';
  const tempMid = units === 'fahrenheit' ? '50°F' : '10°C';
  const tempMax = units === 'fahrenheit' ? '104°F' : '40°C';

  const unitLabel =
    activeLayer === 'temperature' ? (units === 'fahrenheit' ? '°F' : '°C') :
    activeLayer === 'wind' ? 'km/h' :
    activeLayer === 'precipitation' ? 'mm/h' :
    activeLayer === 'air-quality' ? 'AQI' :
    activeLayer === 'marine' ? 'Metres (Douglas Scale)' :
    activeLayer === 'flood' ? 'm³/s GloFAS' :
    activeLayer === 'elevation' ? 'Metres' : 'WMO Code';

  return (
    <div className={`bg-[#050512]/85 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2.5 shadow-xl text-white ${className}`}>
      <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
        <div className="flex items-center gap-1.5 font-bold">
          <span>{layerMeta.icon}</span>
          <span className="text-white/90">{layerMeta.name} Scale</span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
          {unitLabel}
        </span>
      </div>

      {/* Mode-specific Color Bar */}
      {activeLayer === 'temperature' && (
        <div>
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-purple-500 via-blue-500 via-emerald-400 via-yellow-400 via-orange-500 to-red-600 shadow-inner" />
          <div className="flex justify-between items-center text-[9px] font-mono text-white/50 mt-1">
            <span>{tempMin}</span>
            <span>{tempMid}</span>
            <span>{tempMax}</span>
          </div>
        </div>
      )}

      {activeLayer === 'wind' && (
        <div>
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-sky-300 via-cyan-400 via-emerald-400 via-yellow-400 via-orange-500 to-purple-600 shadow-inner" />
          <div className="flex justify-between items-center text-[9px] font-mono text-white/50 mt-1">
            <span>0 km/h (Calm)</span>
            <span>35 km/h (Breeze)</span>
            <span>75+ km/h (Gale)</span>
          </div>
        </div>
      )}

      {activeLayer === 'precipitation' && (
        <div>
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-cyan-200 via-blue-400 via-indigo-600 to-purple-700 shadow-inner" />
          <div className="flex justify-between items-center text-[9px] font-mono text-white/50 mt-1">
            <span>0 mm/h (Dry)</span>
            <span>5 mm/h (Moderate)</span>
            <span>25+ mm/h (Torrential)</span>
          </div>
        </div>
      )}

      {activeLayer === 'air-quality' && (
        <div>
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-emerald-500 via-yellow-400 via-orange-500 via-red-500 to-purple-700 shadow-inner" />
          <div className="flex justify-between items-center text-[9px] font-mono text-white/50 mt-1">
            <span className="text-emerald-400">Good (0-20)</span>
            <span className="text-yellow-400">Moderate</span>
            <span className="text-purple-400">Hazardous (100+)</span>
          </div>
        </div>
      )}

      {activeLayer === 'marine' && (
        <div>
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-cyan-400 via-blue-500 via-indigo-500 to-rose-600 shadow-inner" />
          <div className="flex justify-between items-center text-[9px] font-mono text-white/50 mt-1">
            <span>0 m (Calm)</span>
            <span>2.5 m (Moderate)</span>
            <span>6+ m (High / Rough)</span>
          </div>
        </div>
      )}

      {activeLayer === 'flood' && (
        <div>
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-blue-300 via-amber-400 via-orange-500 to-red-600 shadow-inner" />
          <div className="flex justify-between items-center text-[9px] font-mono text-white/50 mt-1">
            <span>Low / Baseflow</span>
            <span>Elevated</span>
            <span>High Discharge (GloFAS)</span>
          </div>
        </div>
      )}

      {activeLayer === 'elevation' && (
        <div>
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-emerald-600 via-yellow-600 via-amber-700 via-stone-500 to-white shadow-inner" />
          <div className="flex justify-between items-center text-[9px] font-mono text-white/50 mt-1">
            <span>0 m (Sea level)</span>
            <span>2,000 m</span>
            <span>6,000+ m (Alpine)</span>
          </div>
        </div>
      )}

      {activeLayer === 'overview' && (
        <div className="flex items-center justify-between text-[10px] text-white/70 pt-0.5">
          <span className="flex items-center gap-1">☀️ Clear</span>
          <span className="flex items-center gap-1">⛅ Clouds</span>
          <span className="flex items-center gap-1">🌧️ Rain</span>
          <span className="flex items-center gap-1">❄️ Snow</span>
          <span className="flex items-center gap-1">⚡ Storm</span>
        </div>
      )}
    </div>
  );
}
