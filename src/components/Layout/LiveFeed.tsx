// ============================================================
// MooEarth Live — Live Feed Panel (Right Side)
// ============================================================

'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent, EventCategory } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import WorldCupSchedule from './WorldCupSchedule';

interface LiveFeedProps {
  events: WorldEvent[];
  onSelectEvent: (event: WorldEvent) => void;
  activeCategory?: EventCategory | null;
  onSelectCountry?: (country: string | null) => void;
  onPlaySound?: () => void;
  footballActive?: boolean;
}

type FootballTab = 'matches' | 'knockout' | 'players' | 'stats' | 'table';

const TEAM_FLAGS: Record<string, string> = {
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  'Czechia': '🇨🇿',
  'Canada': '🇨🇦',
  'Bosnia and Herzegovina': '🇧🇦',
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Qatar': '🇶🇦',
  'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷',
  'Morocco': '🇲🇦',
  'Haiti': '🇭🇹',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Australia': '🇦🇺',
  'Türkiye': '🇹🇷',
  'Turkey': '🇹🇷',
  'Germany': '🇩🇪',
  'Croatia': '🇭🇷',
  'Argentina': '🇦🇷',
  'Japan': '🇯🇵',
  'France': '🇫🇷',
};

function getTeamFlag(team: string): string {
  return TEAM_FLAGS[team] || '🏳️';
}

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(diff)) return 'Just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function LiveFeed({ events, onSelectEvent, activeCategory, onSelectCountry, onPlaySound, footballActive = true }: LiveFeedProps) {
  const [footballTab, setFootballTab] = useState<FootballTab>('matches');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [events]);

  // Calculate live counters
  const counters = useMemo(() => {
    const counts: Record<string, number> = {
      breaking: 0, sports: 0, football: 0, technology: 0, business: 0, weather: 0, entertainment: 0
    };
    events.forEach(e => {
      const cat = CATEGORY_MAP[e.category as EventCategory] ? e.category : 'breaking';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [events]);

  // Grouped matches for matches tab — dynamic date labels
  const groupedMatches = useMemo(() => {
    const live: WorldEvent[] = [];
    const dateGroups: Record<string, WorldEvent[]> = {};

    // Helper: get local YYYY-MM-DD key from a Date
    const toLocalKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const now = new Date();
    const todayKey = toLocalKey(now);
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const tomorrowKey = toLocalKey(tomorrowDate);
    const yesterdayDate = new Date(now.getTime() - 86400000);
    const yesterdayKey = toLocalKey(yesterdayDate);

    sortedEvents.forEach(e => {
      if (e.category !== 'football') return;
      const fd = e.footballData;
      if (!fd) return;

      // Live matches get their own bucket
      if (fd.status !== 'NS' && fd.status !== 'FT') {
        live.push(e);
        return;
      }

      // Group by local kickoff date
      const kickoff = new Date(e.publishedAt);
      const key = toLocalKey(kickoff);
      if (!dateGroups[key]) dateGroups[key] = [];
      dateGroups[key].push(e);
    });

    const groups: { title: string; matches: WorldEvent[] }[] = [];

    if (live.length > 0) {
      groups.push({ title: 'Group Stage · Live Now', matches: live });
    }

    // Sort date keys chronologically and label them
    Object.keys(dateGroups).sort().forEach(key => {
      let label: string;
      if (key === todayKey) {
        label = 'Today';
      } else if (key === tomorrowKey) {
        label = 'Tomorrow';
      } else if (key === yesterdayKey) {
        label = 'Yesterday';
      } else {
        const d = new Date(key + 'T12:00:00');
        label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
      }
      groups.push({ title: `Group Stage · ${label}`, matches: dateGroups[key] });
    });

    return groups;
  }, [sortedEvents]);

  // ------------------------------------------------------------
  // SUB-RENDERERS FOR FOOTBALL Scorecard Dashboard
  // ------------------------------------------------------------

  const renderTabSelector = () => (
    <div className="flex border-b border-white/10 bg-black/40">
      {[
        { id: 'matches', label: 'MATCHES' },
        { id: 'knockout', label: 'KNOCKOUT' },
        { id: 'players', label: 'PLAYERS' },
        { id: 'stats', label: 'STATS' },
        { id: 'table', label: 'TABLE' }
      ].map((t) => (
        <button
          key={t.id}
          onClick={() => setFootballTab(t.id as FootballTab)}
          className={`flex-1 py-3 text-center text-[10px] font-bold tracking-wider transition-colors cursor-pointer border-b-2 ${
            footballTab === t.id
              ? 'text-cyan-400 border-cyan-400 bg-white/[0.02]'
              : 'text-white/40 border-transparent hover:text-white/70'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const renderMatchesTab = () => {
    if (!mounted) {
      return (
        <div className="flex items-center justify-center py-12 text-white/20">
          <div className="w-6 h-6 rounded-full border border-cyan-500/20 border-t-cyan-400 animate-spin" />
        </div>
      );
    }

    if (!footballActive) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center px-4">
          <span className="text-2xl mb-2">⚠️</span>
          <span>Live football data temporarily unavailable</span>
        </div>
      );
    }

    if (groupedMatches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center px-4">
          <span className="text-2xl mb-2">📡</span>
          <span>Connecting to live football feeds...</span>
          <p className="text-[10px] text-white/20 mt-1 lowercase normal-case">No active matches found at this moment</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {groupedMatches.map((group) => (
          <div key={group.title} className="space-y-2.5">
            {/* Header */}
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-1 bg-white/[0.02] rounded-md">
              {group.title}
            </div>

            {/* Match Cards */}
            {group.matches.map((event) => {
              if (!event.footballData) return null;
              const fd = event.footballData;
              const isHomeLeading = fd.homeScore > fd.awayScore;
              const isAwayLeading = fd.awayScore > fd.homeScore;
              const homeRedCards = fd.cards?.filter((c: any) => c.team === 'home' && c.type === 'Red').length || 0;
              const awayRedCards = fd.cards?.filter((c: any) => c.team === 'away' && c.type === 'Red').length || 0;
              
              const teamGroup = event.title.includes('Mexico') || event.title.includes('South Africa') || event.title.includes('Korea') || event.title.includes('Czechia')
                ? 'Group A'
                : event.title.includes('Canada') || event.title.includes('Bosnia') || event.title.includes('Qatar') || event.title.includes('Switzerland')
                ? 'Group B'
                : event.title.includes('Brazil') || event.title.includes('Morocco') || event.title.includes('Haiti') || event.title.includes('Scotland')
                ? 'Group C'
                : 'Group D';

              const matchDate = new Date(event.publishedAt);
              const toLocalKey = (d: Date) =>
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const matchDateKey = toLocalKey(matchDate);
              const nowLocalKey = toLocalKey(new Date());
              const tomorrowLocalKey = toLocalKey(new Date(Date.now() + 86400000));
              const yesterdayLocalKey = toLocalKey(new Date(Date.now() - 86400000));

              const dayLabel = matchDateKey === nowLocalKey ? 'Today'
                : matchDateKey === tomorrowLocalKey ? 'Tomorrow'
                : matchDateKey === yesterdayLocalKey ? 'Yesterday'
                : matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              const timeStr = matchDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }).toLowerCase();

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  className="p-3.5 rounded-2xl bg-black/30 border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.03] transition-all cursor-pointer flex items-center justify-between group"
                >
                  {/* Left: Teams and Scores */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="text-[9px] font-bold text-white/30 uppercase tracking-wide">
                      {teamGroup}
                    </div>
                    {/* Home Team */}
                    <div className="flex items-center justify-between pr-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{getTeamFlag(fd.homeTeam)}</span>
                        <span className="text-sm font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                          {fd.homeTeam}
                        </span>
                        {homeRedCards > 0 && (
                          <span className="w-2.5 h-3.5 bg-red-500 rounded-[2px] block shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.6)]" title={`${homeRedCards} Red Card(s)`} />
                        )}
                      </div>
                      {fd.status !== 'NS' && (
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-black tabular-nums ${isHomeLeading ? 'text-white' : 'text-white/60'}`}>
                            {fd.homeScore}
                          </span>
                          {isHomeLeading && <span className="text-[10px] text-cyan-400 shrink-0">◀</span>}
                        </div>
                      )}
                    </div>
                    {/* Away Team */}
                    <div className="flex items-center justify-between pr-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{getTeamFlag(fd.awayTeam)}</span>
                        <span className="text-sm font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                          {fd.awayTeam}
                        </span>
                        {awayRedCards > 0 && (
                          <span className="w-2.5 h-3.5 bg-red-500 rounded-[2px] block shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.6)]" title={`${awayRedCards} Red Card(s)`} />
                        )}
                      </div>
                      {fd.status !== 'NS' && (
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-black tabular-nums ${isAwayLeading ? 'text-white' : 'text-white/60'}`}>
                            {fd.awayScore}
                          </span>
                          {isAwayLeading && <span className="text-[10px] text-cyan-400 shrink-0">◀</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status / Time & Highlight Thumbnail */}
                  <div className="w-24 shrink-0 flex flex-col items-center justify-center border-l border-white/5 pl-3">
                    {fd.status === 'FT' ? (
                      <>
                        <span className="text-xs font-black text-white tracking-wide">FT</span>
                        <span className="text-[9px] text-white/30 font-medium uppercase mt-0.5 tracking-wider">{dayLabel}</span>
                      </>
                    ) : fd.status === 'LIVE' ? (
                      <>
                        <span className="text-xs font-black text-emerald-400 animate-pulse uppercase tracking-wide">Live</span>
                        <span className="text-[9px] text-emerald-400/80 font-bold mt-0.5 tabular-nums">{fd.elapsed}{"'"}</span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold text-white/40 uppercase">{dayLabel}</span>
                        <span className="text-[10px] font-black text-cyan-400/80 mt-0.5 tabular-nums">{timeStr}</span>
                        {/* Highlights Thumbnail Match Story Box */}
                        {fd.homeTeam === 'Canada' || fd.homeTeam === 'USA' ? (
                          <div className="h-7 w-12 rounded bg-gradient-to-r from-blue-950 to-indigo-900 border border-white/10 flex items-center justify-center mt-1.5 shadow-md relative group/thumb overflow-hidden">
                            <span className="text-[8px] font-black text-cyan-300 scale-95 group-hover/thumb:scale-105 transition-transform flex items-center gap-0.5">
                              ▶ 0:30
                            </span>
                          </div>
                        ) : (
                          <div className="h-7 w-12 rounded bg-slate-950 border border-white/10 flex flex-col items-center justify-center mt-1.5 shadow-md group/thumb overflow-hidden">
                            <span className="text-[5px] font-black text-white/45 scale-90 select-none">MATCH STORY</span>
                            <span className="text-[6px] font-bold text-white/60 -mt-0.5 scale-90">{getTeamFlag(fd.homeTeam)} v {getTeamFlag(fd.awayTeam)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderKnockoutTab = () => {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center px-4">
        <span className="text-2xl mb-2">🏆</span>
        <span>Knockout stages only appear when officially active in the API</span>
      </div>
    );
  };

  const renderPlayersTab = () => {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center px-4">
        <span className="text-2xl mb-2">⚽</span>
        <span>Player statistics are only active when officially available from the API</span>
      </div>
    );
  };

  const renderStatsTab = () => {
    const footballMatches = events.filter(e => e.category === 'football');
    if (!footballActive) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center px-4">
          <span className="text-2xl mb-2">⚠️</span>
          <span>Live football data temporarily unavailable</span>
        </div>
      );
    }
    if (footballMatches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center px-4">
          <span className="text-2xl mb-2">📊</span>
          <span>Real-time stats are calculated dynamically during live matches. No matches currently active.</span>
        </div>
      );
    }

    let totalGoals = 0;
    let totalCards = 0;
    let yellowCards = 0;
    let redCards = 0;

    footballMatches.forEach(m => {
      if (m.footballData) {
        totalGoals += (m.footballData.homeScore || 0) + (m.footballData.awayScore || 0);
        const cards = m.footballData.cards || [];
        totalCards += cards.length;
        yellowCards += cards.filter((c: any) => c.type === 'Yellow').length;
        redCards += cards.filter((c: any) => c.type === 'Red').length;
      }
    });

    const stats = [
      { label: 'Active Matches', value: footballMatches.length.toString(), desc: 'Live/Finished matches', color: 'text-cyan-400' },
      { label: 'Total Goals', value: totalGoals.toString(), desc: `Average ${(totalGoals / footballMatches.length).toFixed(2)} per match`, color: 'text-emerald-400' },
      { label: 'Yellow Cards', value: yellowCards.toString(), desc: 'From official events', color: 'text-yellow-400' },
      { label: 'Red Cards', value: redCards.toString(), desc: 'From official events', color: 'text-red-400' },
    ];

    return (
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, idx) => (
          <div key={idx} className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider leading-snug">{s.label}</span>
            <div className="my-2.5">
              <span className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</span>
            </div>
            <span className="text-[9px] text-white/30 font-medium">{s.desc}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTableTab = () => {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs text-center px-4">
        <span className="text-2xl mb-2">📋</span>
        <span>Standings are only active when officially available from the API</span>
      </div>
    );
  };

  // ------------------------------------------------------------
  // MAIN RENDERING
  // ------------------------------------------------------------

  return (
    <>
      {/* Desktop panel */}
      <div
        id="live-feed"
        className="fixed right-6 top-24 bottom-24 w-96 z-30
                   hidden lg:flex flex-col
                   rounded-3xl glass overflow-hidden"
      >
        {activeCategory === 'worldcup' ? (
          <WorldCupSchedule
            onSelectEvent={onSelectEvent}
            onSelectCountry={onSelectCountry}
            onPlaySound={onPlaySound}
            footballActive={footballActive}
          />
        ) : activeCategory === 'football' ? (
          <>
            {/* Scorecard Dashboard Tab Selector */}
            {renderTabSelector()}
            {/* Scorecard Dashboard Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
              {footballTab === 'matches' && renderMatchesTab()}
              {footballTab === 'knockout' && renderKnockoutTab()}
              {footballTab === 'players' && renderPlayersTab()}
              {footballTab === 'stats' && renderStatsTab()}
              {footballTab === 'table' && renderTableTab()}
            </div>
          </>
        ) : (
          <>
            {/* Default Header with Counters */}
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
                  if (!count || count === 0) return null;
                  const config = CATEGORY_MAP[cat as EventCategory] || CATEGORY_MAP.breaking;
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
                const config = CATEGORY_MAP[event.category] || CATEGORY_MAP.breaking;
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
          </>
        )}
      </div>

      {/* Mobile bottom sheet */}
      <div
        id="live-feed-mobile"
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden rounded-t-3xl glass border-t border-white/[0.06]"
        style={{ maxHeight: '55vh' }}
      >
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {activeCategory === 'worldcup' ? (
          <div className="flex flex-col h-[calc(55vh-30px)] overflow-hidden">
            <WorldCupSchedule
              onSelectEvent={onSelectEvent}
              onSelectCountry={onSelectCountry}
              onPlaySound={onPlaySound}
              footballActive={footballActive}
            />
          </div>
        ) : activeCategory === 'football' ? (
          <div className="flex flex-col h-[calc(55vh-30px)] overflow-hidden">
            {renderTabSelector()}
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
              {footballTab === 'matches' && renderMatchesTab()}
              {footballTab === 'knockout' && renderKnockoutTab()}
              {footballTab === 'players' && renderPlayersTab()}
              {footballTab === 'stats' && renderStatsTab()}
              {footballTab === 'table' && renderTableTab()}
            </div>
          </div>
        ) : (
          <>
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
                const config = CATEGORY_MAP[event.category] || CATEGORY_MAP.breaking;
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
          </>
        )}
      </div>
    </>
  );
}
