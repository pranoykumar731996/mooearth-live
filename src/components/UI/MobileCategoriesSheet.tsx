// ============================================================
// MooEarth Live — Mobile Categories Bottom Sheet Selector
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { EventCategory } from '@/types';

export interface CategoryOption {
  id: EventCategory | null;
  name: string;
  desc: string;
  icon: string;
}

interface MobileCategoriesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory: EventCategory | null;
  onSelectCategory: (category: EventCategory | null) => void;
  playHoverBlip?: () => void;
  globalEnergyScore: number;
  onSettingsClick: () => void;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: null, name: 'Home Feed', desc: 'All live event updates globally.', icon: '🏠' },
  { id: 'breaking', name: 'Breaking News', desc: 'Global headlines and stories.', icon: '📰' },
  { id: 'football', name: 'Live Football', desc: 'Upcoming and live scores.', icon: '⚽' },
  { id: 'worldcup', name: 'FIFA World Cup', desc: 'Standings and tournament stats.', icon: '🏆' },
  { id: 'technology', name: 'Technology', desc: 'AI, space, and tech developments.', icon: '💻' },
  { id: 'weather', name: 'Weather Radar', desc: 'Climate warnings and weather alerts.', icon: '🌦️' },
  { id: 'business', name: 'Business', desc: 'GDP and tech funding indicators.', icon: '📈' },
  { id: 'entertainment', name: 'Entertainment', desc: 'Media, cinema, and cultural beats.', icon: '🎬' },
];

export default function MobileCategoriesSheet({
  isOpen,
  onClose,
  currentCategory,
  onSelectCategory,
  playHoverBlip,
  globalEnergyScore,
  onSettingsClick,
}: MobileCategoriesSheetProps) {
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
                  <span>🗂️</span> Event Categories
                </h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">
                  Select global event feed filter
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

            {/* Global Pulse Card */}
            <div className="w-full p-4 rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-md flex items-center justify-between shadow-[0_0_20px_rgba(0,229,255,0.05)] relative overflow-hidden shrink-0 select-none">
              {/* Beating effect background */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-cyan-500/5 rounded-full blur-[20px] animate-[pulse_2s_infinite]" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/25 border border-cyan-400/30 flex items-center justify-center text-lg relative">
                  <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping absolute" />
                  💓
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Global Pulse Energy</h4>
                  <p className="text-lg font-black text-white leading-tight mt-1">{globalEnergyScore}% Intensity</p>
                </div>
              </div>
              
              <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                Live Pulse
              </div>
            </div>

            {/* 2-Column Grid Selector */}
            <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[35vh] pr-1 py-1 scrollbar-none">
              {CATEGORY_OPTIONS.map((opt) => {
                const isActive = currentCategory === opt.id;
                return (
                  <motion.div
                    key={opt.id === null ? 'all' : opt.id}
                    onClick={() => {
                      if (playHoverBlip) playHoverBlip();
                      onSelectCategory(opt.id);
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
                      <span className="font-extrabold text-xs text-white tracking-tight leading-tight flex items-center gap-1.5">
                        <span>{opt.icon}</span> {opt.name}
                      </span>
                    </div>

                    <span className="text-[9px] text-white/40 leading-relaxed font-medium relative z-10">
                      {opt.desc}
                    </span>

                    {/* Selection badge */}
                    {isActive && (
                      <div className="mt-auto pt-1 relative z-10">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 uppercase tracking-wider">
                          ✓ Selected
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Settings & Profile Option */}
              <motion.div
                onClick={() => {
                  if (playHoverBlip) playHoverBlip();
                  onClose();
                  onSettingsClick();
                }}
                whileTap={{ scale: 0.98 }}
                className="p-3 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 flex flex-col gap-1.5 cursor-pointer transition-all duration-300 relative overflow-hidden select-none"
              >
                <div className="flex items-start justify-between gap-1.5 relative z-10">
                  <span className="font-extrabold text-xs text-white tracking-tight leading-tight flex items-center gap-1.5">
                    <span>⚙️</span> Settings & Profile
                  </span>
                </div>

                <span className="text-[9px] text-white/40 leading-relaxed font-medium relative z-10">
                  Manage account, profile, and app settings.
                </span>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
