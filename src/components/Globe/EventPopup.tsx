// ============================================================
// MooEarth Live — Event Popup (Glassmorphism Card)
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';

interface EventPopupProps {
  event: WorldEvent | null;
  onClose: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Simple helper to get a flag emoji for common demo countries
function getFlag(country: string) {
  const flags: Record<string, string> = {
    'Japan': '🇯🇵', 'India': '🇮🇳', 'United Kingdom': '🇬🇧',
    'United States': '🇺🇸', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽',
    'Spain': '🇪🇸', 'Australia': '🇦🇺', 'South Africa': '🇿🇦',
    'Singapore': '🇸🇬'
  };
  return flags[country] || '🌍';
}

export default function EventPopup({ event, onClose }: EventPopupProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          id="event-popup"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[90vw] max-w-[460px] z-50
                     rounded-3xl p-6
                     glass"
          style={{
            background: 'linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(20,20,35,0.85) 100%)',
            boxShadow: `0 0 80px ${CATEGORY_MAP[event.category].glowColor}, 0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          {/* Close button */}
          <button
            id="event-popup-close"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full
                       flex items-center justify-center
                       bg-white/5 hover:bg-white/10 text-white/60 hover:text-white
                       transition-all duration-200 cursor-pointer"
            aria-label="Close popup"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Category & Time */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: CATEGORY_MAP[event.category].bgColor }}>
              <span className="text-sm">{CATEGORY_MAP[event.category].emoji}</span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: CATEGORY_MAP[event.category].color }}>
                {CATEGORY_MAP[event.category].label}
              </span>
            </div>
            <span className="text-xs text-white/40 font-medium" suppressHydrationWarning>{formatRelativeTime(event.publishedAt)}</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3 leading-tight pr-8 tracking-tight">
            {event.title}
          </h2>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <span className="text-base">{getFlag(event.country)}</span>
            <span className="font-medium text-white/70">{event.city}, {event.country}</span>
          </div>

          {/* AI Summary */}
          <div className="rounded-2xl p-5 mb-6 border border-white/5 relative overflow-hidden"
            style={{ background: 'rgba(0,229,255,0.03)' }}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-600" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                AI Summary
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="text-sm text-white/80 leading-relaxed font-medium">
              {event.summary}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              id="event-popup-source"
              href={event.source}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                         bg-gradient-to-r from-cyan-500/20 to-blue-500/20
                         border border-cyan-500/30 text-cyan-400
                         hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.2)]
                         transition-all duration-300 group"
            >
              <span>Read Source</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            
            {/* Bookmark */}
            <button className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            
            {/* Share */}
            <button className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
