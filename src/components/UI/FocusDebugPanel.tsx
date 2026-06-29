'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FocusDebugPanelProps {
  isFocusMode: boolean;
  currentActivity: string;
  onClose: () => void;
  selectedLocation?: any | null;
  fallbackLevel?: string | null;
  activeLocation?: any | null;
  articleCount?: number;
  publisherCount?: number;
  cacheStatus?: string | null;
}

export default function FocusDebugPanel({
  isFocusMode,
  currentActivity,
  onClose,
  selectedLocation,
  fallbackLevel,
  activeLocation,
  articleCount,
  publisherCount,
  cacheStatus
}: FocusDebugPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);


  const pausedSystems = [
    { name: 'News Feed', desc: 'Background breaking news polling' },
    { name: 'Country Feed', desc: 'Interactive reaction updates' },
    { name: 'EarthCast', desc: 'Auto event narration trigger' },
    { name: 'Notifications', desc: 'Non-critical browser alerts' },
  ];

  return (
    <div className="fixed top-24 left-6 z-[90] pointer-events-auto font-sans select-none">
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.button
            key="collapsed"
            layoutId="focus-debug-panel"
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 rounded-full glass border flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(10, 12, 22, 0.92)',
              borderColor: isFocusMode ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.08)',
              boxShadow: isFocusMode
                ? '0 0 15px rgba(6, 182, 212, 0.25)'
                : '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
            title="Open UX Debug Console"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <span className={`text-sm ${isFocusMode ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>⚙️</span>
            {isFocusMode && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            )}
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            layoutId="focus-debug-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-72 rounded-2xl border glass p-4 shadow-2xl relative overflow-hidden transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(10,12,22,0.92) 0%, rgba(5,5,10,0.95) 100%)',
              borderColor: isFocusMode ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.08)',
              boxShadow: isFocusMode
                ? '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.15)'
                : '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Glow effect */}
            {isFocusMode && (
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-[30px] animate-pulse" />
            )}

            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚙️</span>
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                  UX Debug Console
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFocusMode ? 'bg-cyan-400 animate-ping' : 'bg-white/20'
                    }`}
                  />
                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider">
                    Diagnostic
                  </span>
                </div>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="text-white/40 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-md text-xs font-bold leading-none cursor-pointer"
                  title="Minimize Console"
                >
                  ➖
                </button>
                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-md text-xs font-bold leading-none cursor-pointer"
                  title="Close Console"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Focus Mode Status */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white/60">Focus Mode</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  isFocusMode
                    ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                {isFocusMode ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            {/* Current Activity */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <span className="text-xs font-bold text-white/60">Current Activity</span>
              <span
                className={`text-xs font-black truncate max-w-[150px] ${
                  isFocusMode ? 'text-white' : 'text-white/30 font-medium'
                }`}
              >
                {currentActivity}
              </span>
            </div>

            {/* Paused Systems */}
            <div>
              <span className="text-[9px] font-extrabold text-white/40 uppercase tracking-wider block mb-2">
                Background Systems
              </span>
              <div className="space-y-2">
                {pausedSystems.map((sys) => (
                  <div
                    key={sys.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-black text-white/80 block leading-none">
                        {sys.name}
                      </span>
                      <span className="text-[8px] text-white/40 block mt-0.5 leading-none">
                        {sys.desc}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div
                        className={`w-1 h-1 rounded-full ${
                          isFocusMode ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                      />
                      <span
                        className={`text-[8px] font-extrabold uppercase tracking-wider ${
                          isFocusMode ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {isFocusMode ? 'PAUSED' : 'RUNNING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic News Diagnostics */}
            {selectedLocation && (
              <div className="mt-4 border-t border-white/10 pt-3.5 space-y-2">
                <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider block">
                  Geographic News Diagnostics
                </span>
                <div className="space-y-1.5 text-[11px] font-semibold text-white/70">
                  <div className="flex justify-between">
                    <span className="text-white/40">Resolved Loc:</span>
                    <span className="text-white truncate max-w-[150px]">{selectedLocation.name} ({selectedLocation.type})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Active Loc:</span>
                    <span className="text-white truncate max-w-[150px]">{activeLocation?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Fallback Level:</span>
                    <span className="text-cyan-400 uppercase font-black text-[10px]">{fallbackLevel || 'city'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Matched Articles:</span>
                    <span className="text-white">{articleCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Publisher Count:</span>
                    <span className="text-white">{publisherCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Cache Status:</span>
                    <span className="text-emerald-400 font-bold">{cacheStatus || 'MISS'}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
