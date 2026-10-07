'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';
import { WeatherStationHighlight } from '@/services/weatherService';

interface WeatherGlobeClientProps {
  stations: WeatherStationHighlight[];
  initialSelectedId?: string;
}

export default function WeatherGlobeClient({
  stations,
  initialSelectedId,
}: WeatherGlobeClientProps) {
  const [selectedStationId, setSelectedStationId] = useState<string>(
    initialSelectedId || stations[0]?.id || ''
  );
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedStation =
    stations.find(s => s.id === selectedStationId) || stations[0] || null;

  const filteredStations = stations.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      (s.telemetry?.weatherDescription || '').toLowerCase().includes(q)
    );
  });

  const formatTemp = (celsius?: number) => {
    if (typeof celsius !== 'number') return '—';
    if (unit === 'F') {
      const f = (celsius * 9) / 5 + 32;
      return `${Math.round(f)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  return (
    <div className="space-y-6" id="interactive-weather-map-viewport">
      {/* Search & Unit Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-cyan-300 font-semibold uppercase tracking-wider">
            Display Units:
          </span>
          <div className="inline-flex rounded-xl p-1 bg-black/60 border border-white/10">
            <button
              type="button"
              onClick={() => setUnit('C')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                unit === 'C'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              °C Celsius
            </button>
            <button
              type="button"
              onClick={() => setUnit('F')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                unit === 'F'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              °F Fahrenheit
            </button>
          </div>
        </div>

        <div className="relative min-w-[260px] max-w-sm">
          <input
            type="text"
            placeholder="Search weather station or condition..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-9 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <span className="absolute left-3 top-2.5 text-xs text-white/40">🔍</span>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D WebGL Globe Viewport */}
        <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-white/10 bg-[#020208] shadow-2xl relative min-h-[500px]">
          <WebGLGlobeViewer
            selectedCountry={selectedStation ? selectedStation.country : undefined}
            height="560px"
          />
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-cyan-300">
              ● {stations.length} Active Atmospheric Stations
            </div>
            <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/60">
              Rotatable 3D Globe
            </div>
          </div>
        </div>

        {/* Selected Weather Station Spotlight */}
        <div className="lg:col-span-4 space-y-4">
          {selectedStation && (
            <div className="p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-white/[0.04] to-black/80 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider">
                  📍 {selectedStation.name}, {selectedStation.country}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  LIVE TELEMETRY
                </span>
              </div>

              {selectedStation.telemetry ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        {formatTemp(selectedStation.telemetry.temperature)}
                      </div>
                      <p className="text-xs text-white/70 mt-1 capitalize flex items-center gap-1.5 font-medium">
                        <span>{selectedStation.telemetry.weatherEmoji}</span>
                        <span>{selectedStation.telemetry.weatherDescription}</span>
                      </p>
                    </div>
                    <div className="text-right text-xs font-mono text-white/60 space-y-1">
                      <div>Feels like {formatTemp(selectedStation.telemetry.apparentTemperature)}</div>
                      <div>{selectedStation.telemetry.isDay ? '☀️ Daylight' : '🌙 Night'}</div>
                    </div>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] uppercase font-mono text-white/40 block">Wind Speed</span>
                      <span className="font-bold text-white font-mono">{selectedStation.telemetry.windSpeed.toFixed(1)} km/h</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] uppercase font-mono text-white/40 block">Humidity</span>
                      <span className="font-bold text-white font-mono">{selectedStation.telemetry.relativeHumidity}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] uppercase font-mono text-white/40 block">Pressure</span>
                      <span className="font-bold text-white font-mono">{selectedStation.telemetry.surfacePressure.toFixed(0)} hPa</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] uppercase font-mono text-white/40 block">Precipitation</span>
                      <span className="font-bold text-white font-mono">{selectedStation.telemetry.precipitation} mm</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      href={`/weather/${selectedStation.countrySlug}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Explore {selectedStation.country} Weather Dossier</span>
                      <span>→</span>
                    </Link>
                    <Link
                      href={`/countries/${selectedStation.countrySlug}`}
                      className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-xs text-center border border-white/10 transition-colors"
                    >
                      View Sovereign Country Profile →
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 text-center text-xs text-white/60">
                  Telemetry currently synchronizing for this station...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Stations List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <span>📡</span> Global Weather Stations ({filteredStations.length})
          </h3>
          <span className="text-[11px] text-white/40 font-mono">
            Click to focus station on 3D globe
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredStations.map(station => {
            const isSelected = station.id === selectedStationId;
            return (
              <div
                key={station.id}
                onClick={() => setSelectedStationId(station.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-cyan-400 font-semibold truncate max-w-[70%]">
                    📍 {station.name}
                  </span>
                  <span className="text-white/40 font-mono text-[10px]">
                    {station.country}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xl font-bold text-white font-mono">
                    {formatTemp(station.telemetry?.temperature)}
                  </div>
                  <div className="text-xs text-white/70 flex items-center gap-1 font-medium">
                    <span>{station.telemetry?.weatherEmoji || '🌡️'}</span>
                    <span className="capitalize">{station.telemetry?.weatherDescription || 'Standby'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                  <span>{station.lat.toFixed(1)}°, {station.lng.toFixed(1)}°</span>
                  <span className="text-cyan-400 font-semibold">Inspect →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
