// ============================================================
// MooEarth Live — Windy-Style Right Floating Layer Dock
// ============================================================
// The signature Windy.com right-side vertical floating navigation dock.
// Displays circular layer icons with active glowing badges and labels.

'use client';

import React, { useState } from 'react';
import type { WeatherLayerMode } from '@/services/weather/types';

interface WindyLayerDockProps {
  activeLayer: WeatherLayerMode;
  onSelectLayer: (layer: WeatherLayerMode) => void;
  className?: string;
}

interface DockItem {
  id: WeatherLayerMode;
  name: string;
  iconEmoji: string;
  badge?: string;
  gradient: string;
  description: string;
}

const PRIMARY_DOCK_ITEMS: DockItem[] = [
  {
    id: 'satellite',
    name: 'Satellite',
    iconEmoji: '🛰️',
    gradient: 'from-blue-500/30 to-indigo-600/30 text-blue-300',
    description: 'High-res geostationary cloud cover, Visible & Infrared (Kelvin)',
  },
  {
    id: 'radar',
    name: 'Weather radar',
    iconEmoji: '📡',
    badge: 'NOAA',
    gradient: 'from-emerald-500/30 to-teal-600/30 text-emerald-300',
    description: 'Doppler radar reflectivity • High-resolution terrestrial network',
  },
  {
    id: 'wind',
    name: 'Wind',
    iconEmoji: '💨',
    gradient: 'from-cyan-500/30 to-blue-600/30 text-cyan-300',
    description: 'Animated particle streamlines & peak surface gusts',
  },
  {
    id: 'precipitation',
    name: 'Rain, thunder',
    iconEmoji: '⛈️',
    badge: 'MODEL',
    gradient: 'from-sky-500/30 to-blue-700/30 text-sky-300',
    description: 'Numerical forecast precipitation rate (mm/h) & convective cells',
  },
  {
    id: 'temperature',
    name: 'Temperature',
    iconEmoji: '🌡️',
    gradient: 'from-orange-500/30 to-rose-600/30 text-orange-300',
    description: 'Global 2m surface isotherms & thermal heatmaps',
  },
  {
    id: 'hurricane',
    name: 'Hurricane tracker',
    iconEmoji: '🌀',
    gradient: 'from-purple-500/30 to-fuchsia-600/30 text-purple-300',
    description: 'Real-time tropical cyclone vortices, eyes & track forecasts',
  },
  {
    id: 'clouds',
    name: 'Clouds',
    iconEmoji: '☁️',
    gradient: 'from-slate-400/30 to-slate-600/30 text-slate-200',
    description: 'Total cloud fraction, base height & optical depth',
  },
  {
    id: 'marine',
    name: 'Waves',
    iconEmoji: '🌊',
    gradient: 'from-teal-500/30 to-cyan-700/30 text-teal-300',
    description: 'Significant wave height, swell period & ocean gyres',
  },
];

const SECONDARY_LAYERS: { id: WeatherLayerMode; name: string; icon: string }[] = [
  { id: 'air-quality', name: 'Air Quality (AQI / PM2.5)', icon: '🫁' },
  { id: 'flood', name: 'Flood Risk (GloFAS)', icon: '🌊' },
  { id: 'elevation', name: 'Terrain Elevation', icon: '⛰️' },
  { id: 'overview', name: 'Overview Summary', icon: '🌤️' },
];

export default function WindyLayerDock({
  activeLayer,
  onSelectLayer,
  className = '',
}: WindyLayerDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <div
      className={`fixed right-3 top-20 z-40 flex flex-col items-end pointer-events-auto select-none ${className}`}
    >
      {/* Floating Vertical Dock */}
      <div className="relative rounded-2xl bg-[#070914]/90 backdrop-blur-2xl border border-white/10 shadow-[0_12px_45px_rgba(0,0,0,0.7)] p-1.5 flex flex-col gap-1 transition-all duration-300 max-w-[210px]">
        {/* Toggle Expand / Collapse header tab */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-white/5 mb-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-bold">
            Layers
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-5 h-5 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors text-xs"
            title={isExpanded ? 'Collapse labels' : 'Show layer labels'}
          >
            {isExpanded ? '›' : '‹'}
          </button>
        </div>

        {/* Primary Stack Items */}
        {PRIMARY_DOCK_ITEMS.map((item) => {
          const isActive = activeLayer === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectLayer(item.id)}
              className={`group flex items-center gap-2.5 p-1.5 rounded-xl transition-all duration-200 text-left cursor-pointer relative
                ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,229,255,0.25)] text-white'
                    : 'hover:bg-white/[0.08] text-white/70 hover:text-white border border-transparent'
                }`}
              title={item.description}
            >
              {/* Circular Icon Container */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg transition-transform duration-200 group-hover:scale-105 shadow-inner
                  ${
                    isActive
                      ? 'bg-cyan-400/20 ring-2 ring-cyan-400/80 shadow-[0_0_12px_rgba(0,240,255,0.5)]'
                      : 'bg-white/5 group-hover:bg-white/10'
                  }`}
              >
                <span>{item.iconEmoji}</span>
              </div>

              {/* Label & Optional Live Badge */}
              <div className={`flex flex-col min-w-0 pr-1 ${isExpanded ? 'block' : 'hidden sm:block'}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold truncate ${isActive ? 'text-cyan-300' : 'text-white/85'}`}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="px-1 py-0.2 rounded text-[8px] font-mono font-black bg-rose-500/80 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-white/40 truncate leading-none">
                  {isActive ? 'Active' : 'Click to view'}
                </span>
              </div>

              {/* Active selection indicator bar */}
              {isActive && (
                <div className="absolute right-1 top-2 bottom-2 w-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              )}
            </button>
          );
        })}

        {/* More layers trigger */}
        <div className="relative pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">
              <span>⋯</span>
            </div>
            <span className={`text-xs font-medium ${isExpanded ? 'block' : 'hidden sm:block'}`}>
              More layers...
            </span>
          </button>

          {/* Secondary Layers Popout Drawer */}
          {showMoreMenu && (
            <div className="absolute right-full top-0 mr-2 w-48 rounded-2xl bg-[#090b18]/95 backdrop-blur-2xl border border-white/15 p-2 shadow-2xl flex flex-col gap-1 z-50">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider font-bold px-2 py-1 border-b border-white/5">
                Additional Feeds
              </div>
              {SECONDARY_LAYERS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    onSelectLayer(sec.id);
                    setShowMoreMenu(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer
                    ${
                      activeLayer === sec.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <span className="text-sm">{sec.icon}</span>
                  <span className="truncate">{sec.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
