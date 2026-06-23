'use client';

import { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { WorldEvent } from '@/types';
import { getFlag } from '@/data/worldCupSchedule';
import { CountryFlag } from './CountryFlag';

interface MatchDetailsSheetProps {
  matchEvent: WorldEvent;
  onClose: () => void;
}

export default function MatchDetailsSheet({ matchEvent, onClose }: MatchDetailsSheetProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const dragControls = useDragControls();

  const fd = matchEvent.footballData;

  useEffect(() => {
    if (!fd) return;
    let active = true;
    setLoading(true);

    const numericId = matchEvent.id.replace(/[^\d]/g, '');

    fetch(`/api/worldcup/statistics?fixtureId=${numericId}`)
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(data => {
        if (active) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('[MatchDetailsSheet] Failed to fetch statistics:', err);
        if (active) {
          setStats(null);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [matchEvent.id, fd]);

  if (!fd) return null;

  const kickoffStr = new Date(matchEvent.publishedAt).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const renderStatsContent = () => {
    if (loading) {
      return (
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        </div>
      );
    }

    if (!stats || !stats.home || !stats.away) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center py-20 text-center text-white/40 px-6">
          <span className="text-2xl mb-3">📊</span>
          <span className="text-[11px] font-semibold">Live data currently unavailable.</span>
        </div>
      );
    }

    // Parse possession strings e.g. "50%" -> 50
    const parsePossession = (val: string | number) => {
      if (typeof val === 'number') return val;
      const parsed = parseInt(String(val).replace(/[^\d]/g, ''), 10);
      return isNaN(parsed) ? 50 : parsed;
    };

    const homePoss = parsePossession(stats.home.possession);
    const awayPoss = parsePossession(stats.away.possession);

    const StatRow = ({ label, home, away, isPct = false }: { label: string; home: number; away: number; isPct?: boolean }) => {
      const total = home + away || 1;
      const homePct = isPct ? home : (home / total) * 100;
      return (
        <div className="mb-4 last:mb-0">
          <div className="flex justify-between text-xs text-white/70 mb-1 font-bold">
            <span>{isPct ? `${home}%` : home}</span>
            <span className="uppercase tracking-widest text-[8px] text-white/40 font-bold">{label}</span>
            <span>{isPct ? `${away}%` : away}</span>
          </div>
          <div className="flex h-1 rounded-full overflow-hidden bg-white/10 gap-0.5">
            <div className="bg-cyan-400 h-full rounded-r-sm transition-all" style={{ width: `${homePct}%` }} />
            <div className="bg-orange-500 h-full rounded-l-sm transition-all" style={{ width: `${100 - homePct}%` }} />
          </div>
        </div>
      );
    };

    return (
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-none pb-safe">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-[9px] font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">
            Match Stats
          </div>
          <StatRow label="Possession" home={homePoss} away={awayPoss} isPct={true} />
          <StatRow label="Total Shots" home={Number(stats.home.shots)} away={Number(stats.away.shots)} />
          <StatRow label="Corner Kicks" home={Number(stats.home.corners)} away={Number(stats.away.corners)} />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] lg:hidden"
      />

      {/* Bottom Sheet */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 400) {
            onClose();
          }
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-x-0 bottom-0 z-[80] flex flex-col glass border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden lg:hidden"
        style={{ height: '65vh' }}
      >
        {/* Drag Handle */}
        <div
          className="shrink-0 pt-4 pb-2 flex justify-center touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="relative shrink-0 bg-black/20 border-b border-white/5 pb-4 px-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-1.5 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white hover:text-black transition-colors z-10 font-bold active:scale-90"
          >
            ✕
          </button>
          
          <div className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.25em] mb-3 mt-1">
            {fd.status === 'NS' ? 'Upcoming Match' : fd.status === 'LIVE' || fd.status === 'HT' ? 'Live Match' : 'Full Time'}
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <CountryFlag flag={getFlag(fd.homeTeam)} className="w-8 h-5.5 object-cover rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <span className="font-black text-white uppercase text-[10px] tracking-widest text-center truncate w-full">{fd.homeTeam}</span>
            </div>
            
            <div className="flex items-center gap-3 text-2xl font-black text-white shrink-0 tabular-nums">
              <span>{fd.homeScore}</span>
              <span className="text-white/20 text-xl font-normal">-</span>
              <span>{fd.awayScore}</span>
            </div>
            
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <CountryFlag flag={getFlag(fd.awayTeam)} className="w-8 h-5.5 object-cover rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <span className="font-black text-white uppercase text-[10px] tracking-widest text-center truncate w-full">{fd.awayTeam}</span>
            </div>
          </div>
          
          <div className="mt-4 text-[9px] font-bold text-white/40 uppercase tracking-widest flex flex-col gap-0.5 items-center justify-center">
            <span className="text-cyan-400/80 font-black tracking-wider flex items-center gap-1">🏆 FIFA World Cup 2026</span>
            <span>{matchEvent.stadium} • {matchEvent.city}</span>
            <span className="text-white/30 font-mono mt-0.5">Kick-off: {kickoffStr}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-black/25">
          {renderStatsContent()}
        </div>
      </motion.div>
    </>
  );
}
