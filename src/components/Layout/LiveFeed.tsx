// ============================================================
// EarthPulse AI — Live Feed Panel (Right Side)
// ============================================================

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { WorldEvent, EventCategory } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';

interface LiveFeedProps {
  events: WorldEvent[];
  onSelectEvent: (event: WorldEvent) => void;
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

export default function LiveFeed({ events, onSelectEvent }: LiveFeedProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Calculate live counters
  const counters = useMemo(() => {
    const counts: Record<string, number> = {
      breaking: 0, sports: 0, technology: 0, business: 0, weather: 0, entertainment: 0
    };
    events.forEach(e => counts[e.category]++);
    return counts;
  }, [events]);

  return (
    <>
      {/* Desktop panel */}
      <div
        id="live-feed"
        className="fixed right-6 top-24 bottom-24 w-96 z-30
                   hidden lg:flex flex-col
                   rounded-3xl glass overflow-hidden"
      >
        {/* Header with Counters */}
        <div className="flex flex-col gap-3 px-6 py-5 border-b border-white/[0.05] bg-black/20">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
            </span>
            <h2 className="text-lg font-semibold tracking-wide text-white">Live Events</h2>
            <span className="ml-auto text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full tabular-nums">
              {sortedEvents.length} Total
            </span>
          </div>
          
          {/* Mini Counters */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin pb-1">
            {Object.entries(counters).map(([cat, count]) => {
              if (count === 0) return null;
              const config = CATEGORY_MAP[cat as EventCategory];
              return (
                <div key={cat} className="flex items-center gap-1.5 shrink-0 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                  <span className="text-xs">{config.emoji}</span>
                  <span className="text-[10px] font-medium text-white/70">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
          <AnimatePresence initial={false}>
          {sortedEvents.map((event) => {
            const config = CATEGORY_MAP[event.category];
            return (
              <motion.button
                key={event.id}
                id={`feed-${event.id}`}
                layout
                initial={{ opacity: 0, x: 30, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                whileHover={{ scale: 1.02, x: -4, backgroundColor: 'rgba(255,255,255,0.06)' }}
                onClick={() => onSelectEvent(event)}
                className="w-full text-left p-4 rounded-2xl transition-all cursor-pointer group bg-black/20 border border-white/5 relative overflow-hidden mb-3"
              >
                {/* Subtle category glow on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${config.color})` }}
                />

                <div className="flex items-start gap-3 relative z-10">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-white/30 tabular-nums font-medium" suppressHydrationWarning>
                        {formatRelativeTime(event.publishedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 font-medium leading-relaxed mb-2 group-hover:text-white transition-colors line-clamp-2">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/30" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="text-xs text-white/40">{event.city}, {event.country}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div
        id="live-feed-mobile"
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden rounded-t-3xl glass border-t border-white/[0.06]"
        style={{ maxHeight: '50vh' }}
      >
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        <div className="flex flex-col gap-2 px-6 pb-2">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
            <h2 className="text-base font-semibold text-white">Live Events</h2>
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-6 space-y-2" style={{ maxHeight: 'calc(50vh - 80px)' }}>
          {sortedEvents.slice(0, 10).map((event) => {
            const config = CATEGORY_MAP[event.category];
            return (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="w-full text-left p-3.5 rounded-2xl hover:bg-white/[0.06] transition-colors cursor-pointer bg-black/20 border border-white/5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-base">{config.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-white/90 font-medium leading-snug truncate mb-1">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase" style={{ color: config.color }}>{config.label}</span>
                      <span className="text-[10px] text-white/30">•</span>
                      <span className="text-[10px] text-white/40">{event.country}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
