// ============================================================
// MooEarth Live — Real-Time Hurricane Tracker Sidebar
// ============================================================
// Multi-storm selector and forecast model intelligence panel
// for real-time tropical cyclone tracking and analysis.

'use client';

import React, { useState } from 'react';
import type { TropicalCyclone } from '@/services/weather/cycloneTrackingService';

interface WindyHurricaneTrackerSidebarProps {
  cyclones: TropicalCyclone[];
  selectedCyclone: TropicalCyclone | null;
  onSelectCyclone: (cyclone: TropicalCyclone) => void;
  onOpenDossier?: (cyclone: TropicalCyclone) => void;
  onClose?: () => void;
  className?: string;
}

export default function WindyHurricaneTrackerSidebar({
  cyclones,
  selectedCyclone,
  onSelectCyclone,
  onOpenDossier,
  onClose,
  className = '',
}: WindyHurricaneTrackerSidebarProps) {
  const [selectedModel, setSelectedModel] = useState<'OFFICIAL' | 'IMD' | 'ECMWF' | 'GFS'>('OFFICIAL');
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (cyclones.length === 0) return null;

  // Category badge helper
  const getBadge = (cyclone: TropicalCyclone) => {
    const scale = cyclone.saffirSimpsonScale;
    const isTyphoon = cyclone.category.toLowerCase().includes('typhoon');
    if (scale >= 4) return { text: scale.toString(), bg: '#dc2626', border: '#ef4444' };
    if (scale >= 1) return { text: scale.toString(), bg: '#ea580c', border: '#f97316' };
    if (isTyphoon) return { text: 'T', bg: '#dc2626', border: '#ef4444' };
    return { text: 'S', bg: '#0284c7', border: '#38bdf8' };
  };

  return (
    <div
      className={`fixed top-14 sm:top-16 right-2 sm:right-4 z-30 w-[300px] sm:w-[340px] max-h-[calc(100vh-140px)] flex flex-col rounded-2xl bg-[#060818]/92 backdrop-blur-2xl border border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.85)] select-none pointer-events-auto transition-all ${className}`}
      data-testid="hurricane-tracker-sidebar"
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-rose-400 text-sm">🌀</span>
          <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>Hurricane tracker</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold">
              {cyclones.length}
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand tracker' : 'Collapse tracker'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              title="Close hurricane tracker"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2 scrollbar-thin scrollbar-thumb-white/20">
          {cyclones.map((c) => {
            const isSelected = selectedCyclone?.id === c.id || selectedCyclone?.name.toLowerCase() === c.name.toLowerCase();
            const badge = getBadge(c);
            const windKt = c.windSpeedKnots || Math.round(c.windSpeedKph / 1.852);

            return (
              <div
                key={c.id}
                onClick={() => onSelectCyclone(c)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Category Circle Badge */}
                  <div
                    style={{ backgroundColor: badge.bg, borderColor: badge.border }}
                    className="w-7 h-7 rounded-full border flex items-center justify-center font-mono font-black text-xs text-white shrink-0 shadow-md"
                  >
                    {badge.text}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider truncate">
                        {c.category}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400/80 shrink-0">
                        {c.basin}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white tracking-tight truncate group-hover:text-cyan-200 transition-colors">
                      {c.name}
                    </h4>

                    {/* Wind & Pressure Telemetry */}
                    <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-white/40 text-[10px]">WIND:</span>
                        <strong className="text-cyan-300 font-bold">{windKt} kt</strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white/40 text-[10px]">PRES:</span>
                        <strong className="text-white/80">{c.pressureHpa ? `${c.pressureHpa} hPa` : '--'}</strong>
                      </div>
                    </div>

                    {/* Expanded details if selected */}
                    {isSelected && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-col gap-1.5 animate-fadeIn">
                        {/* Forecast Model Selection Pills */}
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-white/50">Forecast model:</span>
                          <div className="flex items-center gap-1">
                            {(['OFFICIAL', 'IMD', 'ECMWF', 'GFS'] as const).map((model) => (
                              <button
                                key={model}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedModel(model);
                                }}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition-all ${
                                  selectedModel === model
                                    ? 'bg-rose-500 text-white shadow-sm'
                                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/15'
                                }`}
                              >
                                {model}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Agency & Landfall Outlook */}
                        <div className="text-[10px] text-white/60 leading-tight">
                          <span>Tracked by </span>
                          <strong className="text-white/90">{c.agency}</strong>
                        </div>

                        {c.landfallOutlook && (
                          <div className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-200 font-mono flex items-center gap-1">
                            <span>⚠️</span>
                            <span className="truncate">{c.landfallOutlook.estimatedCoastlineName} (~{c.landfallOutlook.estimatedTimeWindow})</span>
                          </div>
                        )}

                        {onOpenDossier && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDossier(c);
                            }}
                            className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            <span>📋</span>
                            <span>Full Telemetry Dossier & Landfall Radar</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
