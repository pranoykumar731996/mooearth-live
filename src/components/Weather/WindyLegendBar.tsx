// ============================================================
// MooEarth Live — Windy-Style Dynamic Meteorological Legend Bar
// ============================================================
// Bottom-right floating color scale legend dynamically matching
// the active layer (Infrared Kelvin scale, Radar dBZ, Wind knots, etc.)

'use client';

import React from 'react';
import type { WeatherLayerMode, SatelliteSpectralMode } from '@/services/weather/types';

interface WindyLegendBarProps {
  activeLayer: WeatherLayerMode;
  spectralMode?: SatelliteSpectralMode;
  units?: 'celsius' | 'fahrenheit';
  className?: string;
}

export default function WindyLegendBar({
  activeLayer,
  spectralMode = 'infra',
  units = 'celsius',
  className = '',
}: WindyLegendBarProps) {
  // Render specific gradient & tick marks based on active layer
  const renderScaleContent = () => {
    if (activeLayer === 'satellite') {
      if (spectralMode === 'infra') {
        return {
          unit: 'K',
          title: 'Infrared Cloud Top Temperature (Kelvin)',
          ticks: ['250', '240', '230', '220', '210', '200'],
          gradient: 'linear-gradient(to right, #020617 0%, #0284c7 20%, #10b981 40%, #fbbf24 60%, #f43f5e 80%, #ffffff 100%)',
        };
      }
      if (spectralMode === 'blue') {
        return {
          unit: '%',
          title: 'Water Vapor / Moisture Saturation',
          ticks: ['10', '30', '50', '70', '90'],
          gradient: 'linear-gradient(to right, #082f49 0%, #0284c7 40%, #38bdf8 75%, #bae6fd 100%)',
        };
      }
      return {
        unit: 'Albedo',
        title: 'Visible Cloud Reflectance',
        ticks: ['0.1', '0.3', '0.5', '0.7', '0.9'],
        gradient: 'linear-gradient(to right, #0f172a 0%, #64748b 50%, #f8fafc 100%)',
      };
    }

    if (activeLayer === 'radar') {
      return {
        unit: 'dBZ',
        title: 'Doppler Radar Reflectivity (NOAA NEXRAD)',
        ticks: ['15', '25', '35', '45', '55', '65+'],
        gradient: 'linear-gradient(to right, #0284c7 0%, #22c55e 25%, #eab308 50%, #f97316 75%, #ec4899 100%)',
      };
    }

    if (activeLayer === 'wind') {
      return {
        unit: 'km/h',
        title: 'Surface Wind Speed (Open-Meteo)',
        ticks: ['10', '25', '40', '60', '80', '110+'],
        gradient: 'linear-gradient(to right, #00f0ff 0%, #10b981 25%, #facc15 50%, #f97316 75%, #ef4444 100%)',
      };
    }

    if (activeLayer === 'precipitation') {
      return {
        unit: 'mm/h',
        title: 'Precipitation Intensity (Model Forecast)',
        ticks: ['0.5', '2.0', '5.0', '15', '30', '50+'],
        gradient: 'linear-gradient(to right, #38bdf8 0%, #2563eb 25%, #16a34a 50%, #eab308 75%, #dc2626 100%)',
      };
    }

    if (activeLayer === 'temperature') {
      const u = units === 'fahrenheit' ? '°F' : '°C';
      const ticks = units === 'fahrenheit'
        ? ['-4°', '14°', '32°', '50°', '68°', '86°', '104°']
        : ['-20°', '-10°', '0°', '10°', '20°', '30°', '40°+'];
      return {
        unit: u,
        title: '2m Surface Air Temperature',
        ticks,
        gradient: 'linear-gradient(to right, #6366f1 0%, #06b6d4 25%, #10b981 45%, #eab308 65%, #f97316 85%, #dc2626 100%)',
      };
    }

    if (activeLayer === 'hurricane') {
      return {
        unit: 'Cat',
        title: 'Saffir-Simpson Hurricane Intensity',
        ticks: ['TD', 'TS', 'Cat 1', 'Cat 2', 'Cat 3', 'Cat 4', 'Cat 5'],
        gradient: 'linear-gradient(to right, #38bdf8 0%, #22c55e 20%, #eab308 40%, #f97316 60%, #ef4444 80%, #a855f7 100%)',
      };
    }

    if (activeLayer === 'marine') {
      return {
        unit: 'm',
        title: 'Significant Wave Height',
        ticks: ['0.5', '1.5', '2.5', '4.0', '6.0+'],
        gradient: 'linear-gradient(to right, #1e3a8a 0%, #0284c7 30%, #06b6d4 60%, #f43f5e 100%)',
      };
    }

    // Default / clouds
    return {
      unit: '%',
      title: 'Cloud Cover Fraction',
      ticks: ['10', '30', '50', '70', '90%'],
      gradient: 'linear-gradient(to right, #0f172a 0%, #475569 50%, #f8fafc 100%)',
    };
  };

  const scale = renderScaleContent();

  return (
    <div
      className={`fixed bottom-20 right-3 z-30 select-none pointer-events-auto ${className}`}
    >
      <div className="rounded-xl bg-[#070916]/85 backdrop-blur-xl border border-white/10 shadow-xl px-2.5 py-1.5 flex flex-col gap-1 min-w-[200px] max-w-[260px]">
        {/* Scale Header */}
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-white/70">
          <span className="truncate pr-1">{scale.title}</span>
          <span className="px-1 py-0.2 rounded bg-white/10 text-cyan-300 shrink-0">
            {scale.unit}
          </span>
        </div>

        {/* Gradient Color Bar */}
        <div
          className="w-full h-2 rounded-full shadow-inner border border-white/10"
          style={{ background: scale.gradient }}
        />

        {/* Tick Marks */}
        <div className="flex justify-between items-center text-[9px] font-mono text-white/50 px-0.5">
          {scale.ticks.map((t, idx) => (
            <span key={idx}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
