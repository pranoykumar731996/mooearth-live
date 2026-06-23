'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WorldEvent } from '@/types';
import { getFlag } from '@/data/worldCupSchedule';
import { CountryFlag } from '@/components/UI/CountryFlag';

interface MatchDetailsPanelProps {
  matchEvent: WorldEvent;
  onClose: () => void;
}

export default function MatchDetailsPanel({ matchEvent, onClose }: MatchDetailsPanelProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fd = matchEvent.footballData;

  useEffect(() => {
    if (!fd) return;
    let active = true;
    setLoading(true);
    
    // Extract digits specifically to avoid grabbing the '26' prefix from 'wc26-xxxx' or index suffix
    let cleanIdStr = matchEvent.id;
    const wcMatch = matchEvent.id.match(/wc26-(\d+)/);
    const fbMatch = matchEvent.id.match(/football-(\d+)/);
    if (wcMatch) {
      cleanIdStr = wcMatch[1];
    } else if (fbMatch) {
      cleanIdStr = fbMatch[1];
    } else {
      const match = matchEvent.id.match(/(\d+)/g);
      if (match) {
        cleanIdStr = match[match.length - 1];
      }
    }

    const numericId = parseInt(cleanIdStr, 10);

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
        console.error('[MatchDetailsPanel] Failed to fetch statistics:', err);
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
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        </div>
      );
    }

    if (!stats || !stats.home || !stats.away) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-white/40">
          <span className="text-3xl mb-3">📊</span>
          <span className="text-xs font-semibold">Live data currently unavailable.</span>
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
        <div className="mb-5 last:mb-0">
          <div className="flex justify-between text-xs text-white/70 mb-1.5 font-bold">
            <span>{isPct ? `${home}%` : home}</span>
            <span className="uppercase tracking-widest text-[9px] text-white/40 font-semibold">{label}</span>
            <span>{isPct ? `${away}%` : away}</span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden bg-white/10 gap-0.5">
            <div className="bg-cyan-400 h-full rounded-r-sm transition-all" style={{ width: `${homePct}%` }} />
            <div className="bg-orange-500 h-full rounded-l-sm transition-all" style={{ width: `${100 - homePct}%` }} />
          </div>
        </div>
      );
    };

    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        <div className="max-w-sm mx-auto space-y-6">
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">
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
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed right-6 top-24 bottom-24 w-[420px] z-[55] flex flex-col rounded-3xl glass border border-white/10 shadow-2xl overflow-hidden pointer-events-auto"
    >
      {/* Header */}
      <div className="relative shrink-0 bg-black/40 border-b border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white hover:text-black transition-colors z-10 font-bold cursor-pointer"
        >
          ✕
        </button>
        
        <div className="pt-8 pb-6 px-6 text-center">
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em] mb-4">
            {fd.status === 'NS' ? 'Upcoming Match' : fd.status === 'LIVE' || fd.status === 'HT' ? 'Live Match' : 'Full Time'}
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2 flex-1">
              <CountryFlag flag={getFlag(fd.homeTeam)} className="w-9 h-6 object-cover rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <span className="font-black text-white uppercase text-xs tracking-widest text-center truncate w-full">{fd.homeTeam}</span>
            </div>
            
            <div className="flex items-center gap-4 text-3xl font-black text-white shrink-0 tabular-nums">
              <span>{fd.homeScore}</span>
              <span className="text-white/20 text-2xl font-normal">-</span>
              <span>{fd.awayScore}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 flex-1">
              <CountryFlag flag={getFlag(fd.awayTeam)} className="w-9 h-6 object-cover rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <span className="font-black text-white uppercase text-xs tracking-widest text-center truncate w-full">{fd.awayTeam}</span>
            </div>
          </div>
          
          <div className="mt-5 text-[9px] font-bold text-white/40 uppercase tracking-widest flex flex-col gap-1 items-center justify-center">
            <span className="text-cyan-400/80 font-black tracking-wider flex items-center gap-1">🏆 FIFA World Cup 2026</span>
            <span>{matchEvent.stadium} • {matchEvent.city}</span>
            <span className="text-white/30 font-mono mt-0.5">Kick-off: {kickoffStr}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-black/25">
        {renderStatsContent()}
      </div>
    </motion.div>
  );
}
