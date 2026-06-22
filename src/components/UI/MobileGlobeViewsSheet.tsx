// ============================================================
// MooEarth Live — Mobile Globe Views Bottom Sheet Selector
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface GlobeViewOption {
  id: 'standard' | 'fifa' | 'night' | 'weather' | 'satellite' | 'discovery';
  name: string;
  desc: string;
}

interface MobileGlobeViewsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'standard' | 'fifa' | 'night' | 'weather' | 'satellite' | 'discovery';
  onSelectView: (view: 'standard' | 'fifa' | 'night' | 'weather' | 'satellite' | 'discovery') => void;
  playHoverBlip?: () => void;
}

const VIEW_OPTIONS: GlobeViewOption[] = [
  { id: 'standard', name: '🌍 Standard View', desc: 'Default night lights map with active news category glows.' },
  { id: 'fifa', name: '⚽ FIFA World Cup', desc: 'Tactical pitch-green map, golden borders, live match highlights.' },
  { id: 'night', name: '🌃 Night Lights', desc: 'Realistic city lights map showing raw night-side electricity.' },
  { id: 'weather', name: '🌦 Weather Radar', desc: 'Day satellite base, rotating clouds, and temperature heatmaps.' },
  { id: 'satellite', name: '🛰 Satellite View', desc: 'Pure satellite imagery with ultra-thin border mappings.' },
  { id: 'discovery', name: '🎮 Earth Discovery', desc: 'Holographic grid blueprint with quiz question counters.' },
];

export default function MobileGlobeViewsSheet({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  playHoverBlip,
}: MobileGlobeViewsSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop glass overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] border-t border-white/10 p-5 pb-8 pointer-events-auto flex flex-col gap-4 shadow-[0_-15px_30px_rgba(0,0,0,0.6)]"
            style={{
              background: 'linear-gradient(180deg, rgba(12, 12, 24, 0.98) 0%, rgba(6, 6, 12, 0.99) 100%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-1 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>🗺️</span> Globe View Layers
                </h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">
                  Select visual mapping layout
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white cursor-pointer active:scale-95 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 2-Column Grid Selector */}
            <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[45vh] pr-1 py-1 scrollbar-none">
              {VIEW_OPTIONS.map((opt) => {
                const isActive = currentView === opt.id;
                return (
                  <motion.div
                    key={opt.id}
                    onClick={() => {
                      if (playHoverBlip) playHoverBlip();
                      onSelectView(opt.id);
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-2xl border flex flex-col gap-1.5 cursor-pointer transition-all duration-300 relative overflow-hidden select-none ${
                      isActive
                        ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,229,255,0.12)]'
                        : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    {/* Glowing radial effect for active items */}
                    {isActive && (
                      <div className="absolute -top-12 -left-12 w-24 h-24 bg-cyan-500/10 rounded-full blur-[24px]" />
                    )}

                    <div className="flex items-start justify-between gap-1.5 relative z-10">
                      <span className="font-extrabold text-xs text-white tracking-tight leading-tight">
                        {opt.name}
                      </span>
                    </div>

                    <span className="text-[9px] text-white/40 leading-relaxed font-medium relative z-10">
                      {opt.desc}
                    </span>

                    {/* Selection badge */}
                    {isActive && (
                      <div className="mt-auto pt-1 relative z-10">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 uppercase tracking-wider">
                          ✓ Active
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
