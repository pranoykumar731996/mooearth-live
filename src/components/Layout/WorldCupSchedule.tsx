// ============================================================
// MooEarth Live — FIFA World Cup 2026 Schedule Panel (Premium)
// ============================================================

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import {
  getAllWorldCupMatches,
  computeMatchStatus,
  matchToWorldEvent,
  getFlag,
  GROUPS,
  WCMatchData,
  ComputedMatchStatus,
} from '@/data/worldCupSchedule';

interface WorldCupScheduleProps {
  onSelectEvent: (event: WorldEvent) => void;
  onSelectCountry?: (country: string | null) => void;
  onPlaySound?: () => void;
  footballActive?: boolean;
}

type StageFilter = 'all' | 'group' | 'knockout';
type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished';
type GroupFilter = 'all' | string;

const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage', R32: 'Round of 32', R16: 'Round of 16',
  QF: 'Quarter-Finals', SF: 'Semi-Finals', TPP: '3rd Place', F: 'Final',
};

// ==================== COUNTDOWN COMPONENT ====================
function LiveCountdown({ kickoff }: { kickoff: string }) {
  const [diff, setDiff] = useState(() => new Date(kickoff).getTime() - Date.now());

  useEffect(() => {
    const iv = setInterval(() => setDiff(new Date(kickoff).getTime() - Date.now()), 1000);
    return () => clearInterval(iv);
  }, [kickoff]);

  if (diff <= 0) return <span className="text-emerald-400 text-[9px] font-black animate-pulse">STARTING</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1">
      {days > 0 && (
        <span className="bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded text-[9px] font-black text-cyan-400 tabular-nums">
          {days}d
        </span>
      )}
      <span className="bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded text-[9px] font-black text-cyan-400 tabular-nums">
        {pad(hours)}
      </span>
      <span className="text-white/20 text-[8px]">:</span>
      <span className="bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded text-[9px] font-black text-cyan-400 tabular-nums">
        {pad(minutes)}
      </span>
      <span className="text-white/20 text-[8px]">:</span>
      <span className="bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded text-[9px] font-black text-emerald-400 tabular-nums">
        {pad(seconds)}
      </span>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function WorldCupSchedule({
  onSelectEvent,
  onSelectCountry,
  onPlaySound,
  footballActive = true,
}: WorldCupScheduleProps) {
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);

  // Client-side clock ticks every second for real-time updates
  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // All matches (generated once, stable reference)
  const allMatches = useMemo(() => getAllWorldCupMatches(), []);

  // Compute live status for every match on each tick
  const matchesWithStatus = useMemo(() => {
    return allMatches.map(m => ({
      match: m,
      status: computeMatchStatus(m, now),
    }));
  }, [allMatches, now]);

  // Live counters
  const counts = useMemo(() => {
    const c = { live: 0, upcoming: 0, finished: 0, total: allMatches.length };
    matchesWithStatus.forEach(({ status }) => {
      if (status.status === 'LIVE' || status.status === 'HT') c.live++;
      else if (status.status === 'FT') c.finished++;
      else c.upcoming++;
    });
    return c;
  }, [matchesWithStatus, allMatches.length]);

  // Filtered matches
  const filtered = useMemo(() => {
    return matchesWithStatus.filter(({ match, status }) => {
      // Stage filter
      if (stageFilter === 'group' && match.stage !== 'group') return false;
      if (stageFilter === 'knockout' && match.stage === 'group') return false;
      // Group filter
      if (groupFilter !== 'all' && match.group !== groupFilter) return false;
      // Status filter
      if (statusFilter === 'live' && status.status !== 'LIVE' && status.status !== 'HT') return false;
      if (statusFilter === 'upcoming' && status.status !== 'NS') return false;
      if (statusFilter === 'finished' && status.status !== 'FT') return false;
      return true;
    });
  }, [matchesWithStatus, stageFilter, statusFilter, groupFilter]);

  const handleCardClick = useCallback((match: WCMatchData, status: ComputedMatchStatus) => {
    setSelectedId(match.id);
    const event = matchToWorldEvent(match, status);
    onSelectEvent(event);
    if (onSelectCountry) onSelectCountry(match.venue.country);
    if (onPlaySound) onPlaySound();
  }, [onSelectEvent, onSelectCountry, onPlaySound]);

  // Group date sections — using LOCAL dates (not UTC)
  const groupedByDate = useMemo(() => {
    const toLocalKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const todayKey = toLocalKey(now);
    const tomorrowKey = toLocalKey(new Date(now.getTime() + 86400000));
    const yesterdayKey = toLocalKey(new Date(now.getTime() - 86400000));

    const groups: { date: string; label: string; items: typeof filtered }[] = [];
    const dateMap = new Map<string, typeof filtered>();

    filtered.forEach(item => {
      const d = new Date(item.match.kickoff);
      const dateKey = toLocalKey(d); // local date, not UTC
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, []);
      dateMap.get(dateKey)!.push(item);
    });

    for (const [dateKey, items] of dateMap.entries()) {
      const label = dateKey === todayKey ? 'Today'
        : dateKey === tomorrowKey ? 'Tomorrow'
        : dateKey === yesterdayKey ? 'Yesterday'
        : new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      groups.push({ date: dateKey, label, items });
    }

    return groups.sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered, now]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full overflow-hidden items-center justify-center py-20 text-white/20">
        <div className="w-8 h-8 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="shrink-0 px-5 pt-4 pb-3 border-b border-white/[0.05] bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 flex items-center justify-center text-base">
            🏆
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-400">
              FIFA World Cup 2026
            </h2>
            <p className="text-[9px] text-white/35 font-semibold tracking-wider uppercase">
              USA · Mexico · Canada
            </p>
          </div>
        </div>
        {/* Live Counters */}
        <div className="flex items-center gap-2 text-[9px] font-bold">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            {counts.live} Live
          </span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/15 text-cyan-400">
            {counts.upcoming} Upcoming
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.06] text-white/40">
            {counts.finished} Played
          </span>
          <span className="ml-auto text-white/25 tabular-nums">
            {counts.total} Total
          </span>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="shrink-0 p-3 bg-black/30 border-b border-white/[0.04] space-y-2">
        {/* Stage Tabs */}
        <div className="flex bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.04]">
          {([['all', 'All'], ['group', 'Groups'], ['knockout', 'Knockout']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setStageFilter(id); if (onPlaySound) onPlaySound(); }}
              className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                stageFilter === id
                  ? 'bg-cyan-500/15 text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.08)] border border-cyan-500/20'
                  : 'text-white/35 hover:text-white/60 border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Group Filter + Status Filter Row */}
        <div className="flex items-center gap-2">
          {/* Group Dropdown */}
          {stageFilter !== 'knockout' && (
            <select
              value={groupFilter}
              onChange={e => { setGroupFilter(e.target.value); if (onPlaySound) onPlaySound(); }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[9px] font-bold text-white/70 uppercase tracking-wider cursor-pointer appearance-none outline-none focus:border-cyan-500/30 transition-colors"
              style={{ minWidth: 80 }}
            >
              <option value="all" className="bg-[#0a0a14]">All Groups</option>
              {Object.keys(GROUPS).map(g => (
                <option key={g} value={g} className="bg-[#0a0a14]">Group {g}</option>
              ))}
            </select>
          )}

          {/* Status Pills */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1">
            {[
              { id: 'all' as const, label: 'All', icon: '⚽' },
              { id: 'live' as const, label: 'Live', icon: '🟢' },
              { id: 'upcoming' as const, label: 'Next', icon: '🕐' },
              { id: 'finished' as const, label: 'FT', icon: '✅' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => { setStatusFilter(s.id); if (onPlaySound) onPlaySound(); }}
                className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border shrink-0 flex items-center gap-1 ${
                  statusFilter === s.id
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-white/[0.02] text-white/35 border-white/[0.04] hover:text-white/60'
                }`}
              >
                <span className="text-[9px]">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MATCH LIST ===== */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
        {!footballActive ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 text-xs font-semibold uppercase tracking-wider text-center px-6">
            <span className="text-3xl mb-3">⚠️</span>
            Live football data temporarily unavailable
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/25 text-xs font-semibold uppercase tracking-wider text-center px-6">
            <span className="text-3xl mb-3">📡</span>
            Connecting to live football feeds...
            <p className="text-[10px] text-white/20 mt-2 lowercase normal-case">No active World Cup matches currently scheduled</p>
          </div>
        ) : (
          groupedByDate.map(({ date, label, items }) => (
            <div key={date} className="mb-3">
              {/* Date Header */}
              <div className="flex items-center gap-2 px-1 py-2 sticky top-0 z-10 backdrop-blur-md">
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] shrink-0 ${
                  label === 'Today' ? 'text-cyan-400' : 'text-white/30'
                }`}>
                  {label === 'Today' ? '📅 ' : ''}{label}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {items.map(({ match, status }) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      status={status}
                      isSelected={selectedId === match.id}
                      onClick={() => handleCardClick(match, status)}
                      onSelectCountry={onSelectCountry}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== MATCH CARD COMPONENT ====================
function MatchCard({
  match,
  status,
  isSelected,
  onClick,
  onSelectCountry,
}: {
  match: WCMatchData;
  status: ComputedMatchStatus;
  isSelected: boolean;
  onClick: () => void;
  onSelectCountry?: (country: string | null) => void;
}) {
  const isLive = status.status === 'LIVE' || status.status === 'HT';
  const isFT = status.status === 'FT';
  const isNS = status.status === 'NS';

  const stageLabel = match.stage === 'group'
    ? `Group ${match.group} · MD${match.matchDay}`
    : STAGE_LABELS[match.stage] || match.stage;

  const kickoffTime = new Date(match.kickoff).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  return (
    <motion.div
      layoutId={`wc-card-${match.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ scale: 1.015, x: -2 }}
      onClick={onClick}
      className={`relative rounded-2xl border transition-all cursor-pointer overflow-hidden ${
        isLive
          ? 'bg-gradient-to-br from-emerald-500/[0.06] to-emerald-900/[0.04] border-emerald-500/25 shadow-[0_0_25px_rgba(16,185,129,0.08)]'
          : isNS
          ? 'bg-gradient-to-br from-white/[0.02] to-black/30 border-white/[0.06] hover:border-cyan-500/25 hover:shadow-[0_0_15px_rgba(0,229,255,0.05)]'
          : 'bg-black/20 border-white/[0.04] opacity-75 hover:opacity-100'
      } ${isSelected ? 'ring-1 ring-cyan-400/40 shadow-[0_0_30px_rgba(0,229,255,0.1)]' : ''}`}
    >
      {/* Live pulse overlay */}
      {isLive && (
        <div className="absolute inset-0 rounded-2xl border border-emerald-400/20 animate-[pulse_2.5s_ease-in-out_infinite]" />
      )}

      <div className="relative z-10 p-3.5">
        {/* Top Row: Stage + Status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em]">
            {stageLabel}
          </span>
          {isLive ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider tabular-nums">
                {status.status === 'HT' ? 'Half-Time' : `${status.elapsed}'`}
              </span>
            </span>
          ) : isFT ? (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] font-black text-white/30 uppercase tracking-wider">
              Full Time
            </span>
          ) : (
            <span className="text-[9px] font-bold text-white/30 tabular-nums">
              {kickoffTime}
            </span>
          )}
        </div>

        {/* Teams + Score */}
        <div className="flex items-center gap-3">
          {/* Home */}
          <Link
            href={`/country/${encodeURIComponent(match.homeTeam.toLowerCase())}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectCountry) onSelectCountry(match.homeTeam);
            }}
            className="flex-1 flex items-center gap-2.5 min-w-0 hover:text-cyan-400 transition-colors"
          >
            <span className="text-xl shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
              {getFlag(match.homeTeam)}
            </span>
            <span className={`text-[11px] font-bold truncate ${
              isFT && status.homeScore > status.awayScore ? 'text-white' :
              isFT && status.homeScore < status.awayScore ? 'text-white/40' :
              'text-white/85'
            }`}>
              {match.homeTeam}
            </span>
          </Link>

          {/* Score / VS */}
          <div className="shrink-0">
            {!isNS ? (
              <div className={`flex items-center gap-1 font-black text-sm tabular-nums px-3 py-1 rounded-xl border ${
                isLive
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-white'
                  : 'bg-white/[0.04] border-white/[0.06] text-white/70'
              }`}>
                <span>{status.homeScore}</span>
                <span className="text-white/20 text-[10px] mx-0.5">–</span>
                <span>{status.awayScore}</span>
              </div>
            ) : (
              <span className="text-[9px] font-black text-white/15 uppercase tracking-widest px-2">VS</span>
            )}
          </div>

          {/* Away */}
          <Link
            href={`/country/${encodeURIComponent(match.awayTeam.toLowerCase())}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectCountry) onSelectCountry(match.awayTeam);
            }}
            className="flex-1 flex items-center gap-2.5 min-w-0 justify-end hover:text-cyan-400 transition-colors"
          >
            <span className={`text-[11px] font-bold truncate text-right ${
              isFT && status.awayScore > status.homeScore ? 'text-white' :
              isFT && status.awayScore < status.homeScore ? 'text-white/40' :
              'text-white/85'
            }`}>
              {match.awayTeam}
            </span>
            <span className="text-xl shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
              {getFlag(match.awayTeam)}
            </span>
          </Link>
        </div>

        {/* Goal Scorers (for live/finished) */}
        {!isNS && status.currentGoals.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-white/[0.04] space-y-0.5">
            {status.currentGoals.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-[9px]">
                <span className={`font-medium ${g.team === 'home' ? 'text-white/50' : 'text-white/30'}`}>
                  {g.team === 'home' ? `⚽ ${g.player}` : ''}
                </span>
                <span className="text-cyan-400/60 font-bold tabular-nums">{g.time}{"'"}</span>
                <span className={`font-medium text-right ${g.team === 'away' ? 'text-white/50' : 'text-white/30'}`}>
                  {g.team === 'away' ? `${g.player} ⚽` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Countdown for upcoming */}
        {isNS && (
          <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[8px] text-white/25 font-semibold uppercase tracking-wider">Kick-off in</span>
            <LiveCountdown kickoff={match.kickoff} />
          </div>
        )}

        {/* Stadium Footer */}
        <div className="mt-2 flex items-center justify-between text-[8px] text-white/20 font-medium">
          <span className="flex items-center gap-1 truncate max-w-[65%]">
            <span>🏟️</span>
            <span className="truncate">{match.venue.name}</span>
          </span>
          <span className="shrink-0 text-right">
            {match.venue.city}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
