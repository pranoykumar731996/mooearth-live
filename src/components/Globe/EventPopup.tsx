// ============================================================
// EarthPulse AI — Event Popup (Glassmorphism Card)
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import CategoryBadge from '@/components/UI/CategoryBadge';

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

export default function EventPopup({ event, onClose }: EventPopupProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          id="event-popup"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[90vw] max-w-[420px] z-50
                     rounded-2xl p-6
                     backdrop-blur-xl border border-white/10
                     shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(10,10,20,0.9) 0%, rgba(15,15,30,0.85) 100%)',
            boxShadow: `0 0 60px ${CATEGORY_MAP[event.category].glowColor}, 0 25px 50px rgba(0,0,0,0.5)`,
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
          <div className="flex items-center gap-3 mb-3">
            <CategoryBadge category={event.category} size="md" />
            <span className="text-xs text-white/40">{formatRelativeTime(event.publishedAt)}</span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-white mb-2 leading-snug pr-8">
            {event.title}
          </h2>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{event.city}, {event.country}</span>
          </div>

          {/* AI Summary */}
          <div className="rounded-xl p-4 mb-4 border border-white/5"
            style={{ background: 'rgba(0,229,255,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                AI Summary
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              {event.summary}
            </p>
          </div>

          {/* Read Source */}
          <a
            id="event-popup-source"
            href={event.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                       bg-gradient-to-r from-cyan-500/20 to-blue-500/20
                       border border-cyan-500/30 text-cyan-400
                       hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.2)]
                       transition-all duration-300"
          >
            <span>Read Source</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
