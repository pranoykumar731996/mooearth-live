// ============================================================
// MooEarth Live — Weather Layer Selector
// ============================================================
// Mode switcher for the 8 weather layers. Horizontal scroll
// on mobile, grid on desktop.

'use client';

import React from 'react';
import { WEATHER_LAYERS } from '@/services/weather/types';
import type { WeatherLayerMode } from '@/services/weather/types';

interface WeatherLayerSelectorProps {
  activeLayer: WeatherLayerMode;
  onSelectLayer: (layer: WeatherLayerMode) => void;
}

export default function WeatherLayerSelector({
  activeLayer,
  onSelectLayer,
}: WeatherLayerSelectorProps) {
  return (
    <div className="w-full">
      {/* Mobile: horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:overflow-visible">
        {WEATHER_LAYERS.map(layer => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => onSelectLayer(layer.id)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold 
                         transition-all duration-200 border whitespace-nowrap
                ${isActive
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-white/[0.03] border-white/5 text-white/60 hover:bg-white/[0.06] hover:text-white/80 hover:border-white/10'
                }`}
              aria-pressed={isActive}
              title={layer.description}
            >
              <span className="text-base">{layer.icon}</span>
              <span>{layer.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
