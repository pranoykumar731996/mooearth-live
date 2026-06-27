// ============================================================
// MooEarth Live — FIFA World Cup 2026 Schedule Panel (Premium)
// ============================================================

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import { CountryFlag } from '../UI/CountryFlag';
import {
  computeMatchStatus,
  matchToWorldEvent,
  getFlag,
  GROUPS,
  WCMatchData,
  ComputedMatchStatus,
  ALL_TEAM_FLAGS,
} from '@/data/worldCupSchedule';

interface WorldCupScheduleProps {
  onSelectEvent: (event: WorldEvent) => void;
  onSelectCountry?: (country: string | null) => void;
  onPlaySound?: () => void;
  footballActive?: boolean;
  selectedCountry?: string | null;
}

type StageFilter = 'all' | 'group' | 'knockout';
type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished';
type GroupFilter = 'all' | string;

const STAGE_LABELS: Record<string, string> = {
  group: 'Group Stage', R32: 'Round of 32', R16: 'Round of 16',
  QF: 'Quarter-Finals', SF: 'Semi-Finals', TPP: '3rd Place', F: 'Final',
};

interface TeamStats {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

interface WCTopScorer {
  player: string;
  team: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  photo?: string;
}

interface TournamentStats {
  matchesPlayed: number;
  totalGoals: number;
  yellowCards: number;
}

function computeTournamentStats(matchesWithStatus: { match: WCMatchData; status: ComputedMatchStatus }[]): TournamentStats {
  let matchesPlayed = 0;
  let totalGoals = 0;
  let yellowCards = 0;

  matchesWithStatus.forEach(({ match, status }) => {
    if (status.status === 'FT') {
      matchesPlayed++;
    }
    if (status.status === 'FT' || status.status === 'LIVE' || status.status === 'HT') {
      totalGoals += (status.homeScore || 0) + (status.awayScore || 0);
      yellowCards += (match.cards || []).filter(c => c.type === 'Yellow').length;
    }
  });

  return {
    matchesPlayed,
    totalGoals,
    yellowCards,
  };
}

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
  selectedCountry = null,
}: WorldCupScheduleProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'standings' | 'stats' | 'progress'>('schedule');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isDevParam = params.get('dev') === 'true' || params.get('developer') === 'true';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isDevStorage = localStorage.getItem('mooearth_dev') === 'true';
      if (isDevParam || isDevStorage || isLocal) {
        setIsDeveloper(true);
      }
    }
  }, []);

  // Live Data States
  const [matches, setMatches] = useState<WCMatchData[]>([]);
  const [standings, setStandings] = useState<Record<string, TeamStats[]>>({});
  const [scorers, setScorers] = useState<WCTopScorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const suffix = force ? '?refresh=true' : '';
      const [matchesRes, standingsRes, scorersRes] = await Promise.all([
        fetch(`/api/worldcup/matches${suffix}`).then(r => { if (!r.ok) throw new Error('Matches fetch failed'); return r.json(); }),
        fetch(`/api/worldcup/standings${suffix}`).then(r => { if (!r.ok) throw new Error('Standings fetch failed'); return r.json(); }),
        fetch(`/api/worldcup/scorers${suffix}`).then(r => { if (!r.ok) throw new Error('Scorers fetch failed'); return r.json(); })
      ]);

      setMatches(matchesRes);
      setStandings(standingsRes);
      setScorers(scorersRes);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
      setError(null);
    } catch (err: any) {
      console.error('[WorldCupSchedule] fetch error:', err);
      setError(err?.message || 'Failed to update live World Cup data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
    
    fetchData(false);

    const clockIv = setInterval(() => setNow(new Date()), 1000);
    // 30s auto-refresh interval
    const refreshIv = setInterval(() => fetchData(false), 30000);

    return () => {
      clearInterval(clockIv);
      clearInterval(refreshIv);
    };
  }, [fetchData]);

  const handleManualRefresh = () => {
    if (onPlaySound) onPlaySound();
    fetchData(true);
  };

  const matchesWithStatus = useMemo(() => {
    return matches.map(m => ({
      match: m,
      status: computeMatchStatus(m, now),
    }));
  }, [matches, now]);

  const counts = useMemo(() => {
    const c = { live: 0, upcoming: 0, finished: 0, total: matches.length };
    matchesWithStatus.forEach(({ status }) => {
      if (status.status === 'LIVE' || status.status === 'HT') c.live++;
      else if (status.status === 'FT') c.finished++;
      else c.upcoming++;
    });
    return c;
  }, [matchesWithStatus]);

  const filtered = useMemo(() => {
    return matchesWithStatus.filter(({ match, status }) => {
      if (stageFilter === 'group' && match.stage !== 'group') return false;
      if (stageFilter === 'knockout' && match.stage === 'group') return false;
      if (groupFilter !== 'all' && match.group !== groupFilter) return false;
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
    if (onPlaySound) onPlaySound();
  }, [onSelectEvent, onPlaySound]);

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
      const dateKey = toLocalKey(d);
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

  const tournamentStats = useMemo(() => computeTournamentStats(matchesWithStatus), [matchesWithStatus]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full overflow-hidden items-center justify-center py-20 text-white/20">
        <div className="w-8 h-8 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  const renderStandingsTab = () => {
    const groupsToRender = groupFilter === 'all' ? Object.keys(standings).sort() : [groupFilter];

    if (Object.keys(standings).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center">
          <span className="text-2xl mb-2">📋</span>
          <span>No standing data available</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {groupsToRender.map(group => {
          const teams = standings[group] || [];
          return (
            <div key={group} className="rounded-2xl border border-white/[0.06] bg-black/20 overflow-hidden">
              <div className="bg-white/[0.02] px-4 py-2 border-b border-white/[0.04]">
                <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Group {group}</h3>
              </div>
              <div className="p-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] text-white/35 font-bold uppercase tracking-wider border-b border-white/[0.04]">
                      <th className="py-1.5 pl-2 w-8">#</th>
                      <th className="py-1.5">Team</th>
                      <th className="py-1.5 text-center w-8">P</th>
                      <th className="py-1.5 text-center w-8">GD</th>
                      <th className="py-1.5 text-center w-8">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t, idx) => (
                      <tr key={t.team} className="text-[10px] border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2 pl-2 font-bold text-white/40">{idx + 1}</td>
                        <td className="py-2 font-bold text-white/80">
                          <Link
                            href={`/country/${encodeURIComponent(t.team.toLowerCase())}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectCountry) onSelectCountry(t.team);
                            }}
                            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                          >
                            <CountryFlag flag={getFlag(t.team)} className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm shrink-0" />
                            <span className="truncate">{t.team}</span>
                          </Link>
                        </td>
                        <td className="py-2 text-center font-bold text-white/60 tabular-nums">{t.played}</td>
                        <td className="py-2 text-center font-bold text-white/60 tabular-nums">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                        <td className="py-2 text-center font-black text-cyan-400 tabular-nums">{t.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStatsTab = () => {
    const statsList = [
      { label: 'Matches Played', value: tournamentStats.matchesPlayed.toString(), desc: 'Completed tournament matches', color: 'text-cyan-400' },
      { label: 'Total Goals', value: tournamentStats.totalGoals.toString(), desc: 'Goals scored in the tournament', color: 'text-emerald-400' },
      { label: 'Average Goals', value: tournamentStats.matchesPlayed > 0 ? (tournamentStats.totalGoals / tournamentStats.matchesPlayed).toFixed(2) : '0.00', desc: 'Goals per match average', color: 'text-yellow-400' },
      { label: 'Total Yellow Cards', value: tournamentStats.yellowCards.toString(), desc: 'Cards counted from live streams', color: 'text-orange-400' },
    ];

    return (
      <div className="space-y-4">
        {/* Tournament Counters */}
        <div className="grid grid-cols-2 gap-2.5">
          {statsList.map((s, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-white/[0.05] bg-black/20 flex flex-col justify-between hover:border-white/10 transition-colors">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{s.label}</span>
              <span className={`text-2xl font-black tabular-nums my-1.5 ${s.color}`}>{s.value}</span>
              <span className="text-[8px] text-white/30 font-medium">{s.desc}</span>
            </div>
          ))}
        </div>

        {/* Top Scorers Leaderboard */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 overflow-hidden">
          <div className="bg-white/[0.02] px-4 py-2 border-b border-white/[0.04] flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Top Scorers</h3>
            <span className="text-[8px] font-black uppercase text-white/30 tracking-wider">Goals (Assists)</span>
          </div>
          <div className="p-2 divide-y divide-white/[0.03]">
            {scorers.length === 0 ? (
              <div className="p-4 text-center text-white/20 text-[10px]">No scorer data available</div>
            ) : (
              scorers.slice(0, 10).map((s, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-2 hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-black text-white/30 w-4">{idx + 1}</span>
                    {s.photo ? (
                      <img 
                        src={s.photo} 
                        alt={s.player} 
                        className="w-5 h-5 rounded-full object-cover bg-white/5 border border-white/10 shrink-0" 
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                      />
                    ) : (
                      <span className="text-xs">👤</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white/95 truncate">{s.player}</p>
                      <p className="text-[8px] text-white/40 font-medium truncate flex items-center gap-1">
                        <CountryFlag flag={getFlag(s.team)} className="w-4 h-3 object-cover rounded-[1px] shadow-sm shrink-0" />
                        <span>{s.team}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-black text-emerald-400 tabular-nums">{s.goals}</span>
                    <span className="text-[9px] text-white/30 font-bold tabular-nums ml-1">({s.assists})</span>
                    <p className="text-[8px] text-white/20 uppercase tracking-widest mt-0.5">{s.matchesPlayed} matches</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Participating Countries */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-3">Participating Countries</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(ALL_TEAM_FLAGS).sort().map(team => (
              <Link
                key={team}
                href={`/country/${encodeURIComponent(team.toLowerCase())}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectCountry) onSelectCountry(team);
                }}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-all group"
              >
                <CountryFlag flag={getFlag(team)} className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-white/70 group-hover:text-cyan-400 transition-colors truncate">{team}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProgressTab = () => {
    const stages = [
      { id: 'group', name: 'Group Stage', dates: 'June 11 – June 27', status: counts.finished > 0 ? 'Active' : 'Upcoming' },
      { id: 'r32', name: 'Round of 32', dates: 'June 28 – July 3', status: 'Locked' },
      { id: 'r16', name: 'Round of 16', dates: 'July 4 – July 7', status: 'Locked' },
      { id: 'qf', name: 'Quarter-Finals', dates: 'July 9 – July 11', status: 'Locked' },
      { id: 'sf', name: 'Semi-Finals', dates: 'July 14 – July 15', status: 'Locked' },
      { id: 'final', name: 'Final & 3rd Place', dates: 'July 18 – July 19', status: 'Locked' },
    ];

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Tournament Stages</h3>
          <div className="relative border-l-2 border-white/5 pl-4 ml-2 space-y-5">
            {stages.map((stage) => (
              <div key={stage.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 flex h-2.5 w-2.5 rounded-full border border-[#0d0e15] bg-white/10" />
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-white/80">{stage.name}</h4>
                    <span className="text-[8px] text-white/30 font-medium">{stage.dates}</span>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                    stage.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : stage.status === 'Upcoming'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse'
                      : 'bg-white/[0.02] text-white/20 border-white/[0.04]'
                  }`}>
                    {stage.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-white/[0.05] bg-black/20">
          <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2">Host Nations</h3>
          <p className="text-[10px] text-white/50 leading-relaxed">
            The FIFA World Cup 2026 is co-hosted by three countries across 16 iconic host cities in North America.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-lg">🇺🇸</span>
              <p className="text-[8px] font-black text-white/70 mt-1 uppercase">USA</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-lg">🇲🇽</span>
              <p className="text-[8px] font-black text-white/70 mt-1 uppercase">Mexico</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-lg">🇨🇦</span>
              <p className="text-[8px] font-black text-white/70 mt-1 uppercase">Canada</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleTab = () => {
    if (!footballActive) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-white/40 text-xs font-semibold uppercase tracking-wider text-center px-6">
          <span className="text-3xl mb-3">⚠️</span>
          Live football data temporarily unavailable
        </div>
      );
    }

    if (loading && matches.length === 0) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse p-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] h-28 flex flex-col justify-between">
              <div className="h-2.5 bg-white/5 rounded w-1/4" />
              <div className="flex items-center justify-between my-2">
                <div className="h-3 bg-white/5 rounded w-1/3" />
                <div className="h-6 bg-white/5 rounded-xl w-12" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
              <div className="h-2 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      );
    }

    if (error && matches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <span className="text-3xl mb-2">❌</span>
          <span className="text-xs font-bold text-red-400">Failed to load schedule</span>
          <p className="text-[10px] text-white/40 mt-1">{error}</p>
          <button 
            onClick={() => handleManualRefresh()}
            className="mt-4 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-wider hover:bg-cyan-500/20 active:scale-95 transition-all"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    if (filtered.length === 0) {
      if (statusFilter === 'live') {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center px-6">
            <span className="text-2xl mb-2">🟢</span>
            <span>No live matches currently in progress</span>
            <p className="text-[10px] text-white/20 mt-2 normal-case">Check back during scheduled match kickoff times</p>
          </div>
        );
      }
      if (statusFilter === 'finished') {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center px-6">
            <span className="text-2xl mb-2">✅</span>
            <span>No matches completed yet</span>
            <p className="text-[10px] text-white/20 mt-2 normal-case">Matches will appear here as results are finalized</p>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center py-20 text-white/25 text-xs font-semibold uppercase tracking-wider text-center px-6">
          <span className="text-3xl mb-3">📡</span>
          Connecting to live football feeds...
          <p className="text-[10px] text-white/20 mt-2 normal-case">No matches found for the selected filters</p>
        </div>
      );
    }

    return groupedByDate.map(({ date, label, items }) => (
      <div key={date} className="mb-3">
        <div className="flex items-center gap-2 px-1 py-2 sticky top-0 z-10 backdrop-blur-md">
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] shrink-0 ${
            label === 'Today' ? 'text-cyan-400' : 'text-white/30'
          }`}>
            {label === 'Today' ? '📅 ' : ''}{label}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
        </div>

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
    ));
  };

  const renderDebugPanel = () => {
    return (
      <div className="shrink-0 border-t border-white/[0.05] bg-black/40 mt-auto">
        <button
          onClick={() => { setIsDebugOpen(!isDebugOpen); if (onPlaySound) onPlaySound(); }}
          className="w-full px-5 py-2.5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/35 hover:text-white/60 transition-colors cursor-pointer"
        >
          <span>🔍 Category Inspector (Debug Mode)</span>
          <span>{isDebugOpen ? '▲' : '▼'}</span>
        </button>

        <AnimatePresence>
          {isDebugOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/[0.03]"
            >
              <div className="px-5 py-3.5 space-y-2 text-[9px] font-mono text-cyan-300/80 bg-black/60 leading-normal">
                <div className="flex justify-between">
                  <span className="text-white/30">Selected Category:</span>
                  <span className="font-bold">worldcup</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Selected Country:</span>
                  <span className="font-bold text-white/95">{selectedCountry || 'Global (None)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Competition ID:</span>
                  <span className="font-bold text-emerald-400">World Cup 2026 (League ID: 1)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Data Source:</span>
                  <span className="font-bold">Football API (api-sports.io)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Records Loaded:</span>
                  <span className="font-bold text-white/90 tabular-nums">{filtered.length} matches</span>
                </div>
                {lastUpdated && (
                  <div className="flex justify-between">
                    <span className="text-white/30">Last API Sync:</span>
                    <span className="font-bold text-white">{lastUpdated}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0d0e15]">
      {/* ===== HEADER ===== */}
      <div className="shrink-0 px-5 pt-4 pb-3 border-b border-white/[0.05] bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 flex items-center justify-center text-base">
              🏆
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black uppercase tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-400">
                FIFA World Cup 2026
              </h2>
              <p className="text-[9px] text-white/35 font-semibold tracking-wider uppercase">
                USA · Mexico · Canada
              </p>
            </div>
          </div>
          
          {/* Refresh Action / Timestamp */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <button
              onClick={() => handleManualRefresh()}
              disabled={loading}
              className={`p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 active:scale-95 transition-all text-white/40 hover:text-white/80 cursor-pointer flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest ${loading ? 'animate-pulse' : ''}`}
            >
              {loading ? (
                <div className="w-2.5 h-2.5 rounded-full border border-white/20 border-t-white animate-spin" />
              ) : (
                <span>🔄</span>
              )}
              <span>Refresh</span>
            </button>
            {lastUpdated && (
              <span className="text-[7px] text-white/20 font-bold tabular-nums">
                Updated {lastUpdated}
              </span>
            )}
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

      {/* ===== TABS ===== */}
      <div className="shrink-0 px-4 pb-2 pt-1 border-b border-white/[0.05] bg-black/20 flex gap-1">
        {([
          ['schedule', '📅 Schedule'],
          ['standings', '📋 Standings'],
          ['stats', '📊 Stats'],
          ['progress', '📈 Progress']
        ] as const).map(([tabId, label]) => (
          <button
            key={tabId}
            onClick={() => { setActiveTab(tabId); if (onPlaySound) onPlaySound(); }}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tabId
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(0,229,255,0.05)]'
                : 'text-white/35 hover:text-white/60 border border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ===== FILTERS (Conditionally shown for Schedule/Standings) ===== */}
      {(activeTab === 'schedule' || activeTab === 'standings') && (
        <div className="shrink-0 p-3 bg-black/30 border-b border-white/[0.04] space-y-2">
          {activeTab === 'schedule' && (
            /* Stage Tabs */
            <div className="flex bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.04]">
              {([['all', 'All'], ['group', 'Groups'], ['knockout', 'Knockout']] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setStageFilter(id); if (onPlaySound) onPlaySound(); }}
                  className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    stageFilter === id
                      ? 'bg-cyan-500/15 text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.08)] border border-cyan-500/20'
                      : 'text-white/35 hover:text-white/60 border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Group Filter + Status Filter Row */}
          <div className="flex items-center gap-2">
            {/* Group Dropdown */}
            {stageFilter !== 'knockout' && Object.keys(standings).length > 0 && (
              <select
                aria-label="Filter by group"
                value={groupFilter}
                onChange={e => { setGroupFilter(e.target.value); if (onPlaySound) onPlaySound(); }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-[9px] font-bold text-white/70 uppercase tracking-wider cursor-pointer appearance-none outline-none focus:border-cyan-500/30 transition-colors"
                style={{ minWidth: 80 }}
              >
                <option value="all" className="bg-[#0a0a14]">All Groups</option>
                {Object.keys(standings).sort().map(g => (
                  <option key={g} value={g} className="bg-[#0a0a14]">Group {g}</option>
                ))}
              </select>
            )}

            {/* Status Pills (Only shown for Schedule tab) */}
            {activeTab === 'schedule' && (
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
                     className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border shrink-0 flex items-center gap-1 ${
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
            )}
          </div>
        </div>
      )}

      {/* ===== TAB CONTENT ===== */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
        {activeTab === 'schedule' && renderScheduleTab()}
        {activeTab === 'standings' && renderStandingsTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'progress' && renderProgressTab()}
      </div>

      {/* ===== DEBUG PANEL ===== */}
      {isDeveloper && renderDebugPanel()}
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
  const [nowLocal] = useState(() => new Date());
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
            <span className="text-xl shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] flex items-center justify-center">
              <CountryFlag flag={getFlag(match.homeTeam)} className="w-6 h-4 object-cover rounded-[2px] shadow-sm shrink-0" />
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
            <span className="text-xl shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] flex items-center justify-center">
              <CountryFlag flag={getFlag(match.awayTeam)} className="w-6 h-4 object-cover rounded-[2px] shadow-sm shrink-0" />
            </span>
          </Link>
        </div>

        {/* Goal Scorers */}
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

        {/* Countdown */}
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
