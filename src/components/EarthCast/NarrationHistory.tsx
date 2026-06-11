// ============================================================
// MooEarth Live — EarthCast Narration History
// Collapsible timeline of past narrations. Shows in the
// trending scoreboard or as a standalone panel.
// ============================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NarrationEntry } from '@/hooks/useEarthCast';
import { EarthCastEventType } from '@/services/earthcast-ai';

interface NarrationHistoryProps {
  history: NarrationEntry[];
  isEarthCastActive: boolean;
}

const EVENT_ICONS: Record<EarthCastEventType, string> = {
  goal: '⚽',
  red_card: '🟥',
  penalty: '🥅',
  match_end: '🏁',
  upset: '😱',
  tension: '⚡',
  atmosphere_check: '🌍',
};

export default function NarrationHistory({
  history,
  isEarthCastActive,
}: NarrationHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isEarthCastActive || history.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mt-3"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🎙️</span>
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold group-hover:text-white/70 transition-colors">
            EarthCast Log
          </span>
          <span className="text-[9px] text-cyan-400/60 font-black">{history.length}</span>
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-white/30"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      {/* History entries */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto scrollbar-thin">
              {history.slice(0, 5).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-colors group cursor-default"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">{EVENT_ICONS[entry.eventType]}</span>
                    <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold flex-1 truncate">
                      {entry.country}
                    </span>
                    <span className="text-[8px] text-white/20 font-medium tabular-nums">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed line-clamp-2 group-hover:text-white/70 transition-colors">
                    {entry.text}
                  </p>
                  {/* Emotion color indicator */}
                  <div
                    className="w-full h-[1px] mt-2 rounded-full opacity-30"
                    style={{ backgroundColor: entry.emotionColor }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
