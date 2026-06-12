// ============================================================
// MooEarth Live — Live Feed Panel (Right Side)
// ============================================================

'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent, EventCategory } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';

interface LiveFeedProps {
  events: WorldEvent[];
  onSelectEvent: (event: WorldEvent) => void;
  activeCategory?: EventCategory | null;
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

export default function LiveFeed({ events, onSelectEvent, activeCategory }: LiveFeedProps) {
  const [footballTab, setFootballTab] = useState<FootballTab>('matches');

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

  // Grouped matches for matches tab
  const groupedMatches = useMemo(() => {
    const live: WorldEvent[] = [];
    const finished: WorldEvent[] = [];
    const upcomingTomorrow: WorldEvent[] = [];
    const upcomingLater: WorldEvent[] = [];

    sortedEvents.forEach(e => {
      if (e.category !== 'football') return;
      
      const fd = e.footballData;
      if (!fd) return;

      if (fd.status === 'FT') {
        finished.push(e);
      } else if (fd.status === 'NS') {
        const isTomorrow = e.title.includes('Canada') || e.title.includes('USA') || e.title.includes('Bosnia') || e.title.includes('Paraguay');
        if (isTomorrow) {
          upcomingTomorrow.push(e);
        } else {
          upcomingLater.push(e);
        }
      } else {
        live.push(e);
      }
    });

    const groups = [];
    if (live.length > 0) {
      groups.push({ title: 'Group Stage · Live Now', matches: live });
    }
    if (finished.length > 0) {
      groups.push({ title: 'Group Stage · Today', matches: finished });
    }
    if (upcomingTomorrow.length > 0) {
      groups.push({ title: 'Group Stage · Tomorrow', matches: upcomingTomorrow });
    }
    if (upcomingLater.length > 0) {
      groups.push({ title: 'Group Stage · Sun, 14 Jun', matches: upcomingLater });
    }
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
    if (groupedMatches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-white/40 text-xs">
          <span>No football matches found.</span>
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

              let timeStr = '12:30 am';
              if (event.title.includes('Paraguay') || event.title.includes('USA')) timeStr = '6:30 am';
              if (event.title.includes('Morocco')) timeStr = '3:30 am';
              if (event.title.includes('Scotland')) timeStr = '6:30 am';
              if (event.title.includes('Türkiye') || event.title.includes('Australia')) timeStr = '9:30 am';

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
                        <span className="text-[9px] text-white/30 font-medium uppercase mt-0.5 tracking-wider">Today</span>
                      </>
                    ) : fd.status === 'LIVE' ? (
                      <>
                        <span className="text-xs font-black text-emerald-400 animate-pulse uppercase tracking-wide">Live</span>
                        <span className="text-[9px] text-emerald-400/80 font-bold mt-0.5 tabular-nums">{fd.elapsed}'</span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold text-white/40 uppercase">Tomorrow</span>
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
    const rounds = [
      {
        stage: 'Round of 16',
        matches: [
          { home: 'Germany', away: 'Croatia', homeScore: 3, awayScore: 1 },
          { home: 'Argentina', away: 'Australia', homeScore: 2, awayScore: 0 },
          { home: 'Brazil', away: 'Japan', homeScore: 2, awayScore: 1 },
          { home: 'France', away: 'USA', homeScore: 3, awayScore: 2 },
        ]
      },
      {
        stage: 'Quarter-Finals',
        matches: [
          { home: 'Germany', away: 'Argentina', homeScore: 1, awayScore: 2 },
          { home: 'Brazil', away: 'France', homeScore: 0, awayScore: 1 },
        ]
      },
      {
        stage: 'Semi-Finals',
        matches: [
          { home: 'Argentina', away: 'France', homeScore: 3, awayScore: 2 }
        ]
      }
    ];

    return (
      <div className="space-y-4">
        {rounds.map((round) => (
          <div key={round.stage} className="space-y-2.5">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-1 bg-white/[0.02] rounded-md">
              {round.stage}
            </div>
            <div className="space-y-2">
              {round.matches.map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between text-xs">
                  <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-white/90">
                        <span>{getTeamFlag(m.home)}</span>
                        <span>{m.home}</span>
                      </span>
                      <span className="font-bold text-white tabular-nums">{m.homeScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-white/90">
                        <span>{getTeamFlag(m.away)}</span>
                        <span>{m.away}</span>
                      </span>
                      <span className="font-bold text-white/60 tabular-nums">{m.awayScore}</span>
                    </div>
                  </div>
                  <div className="text-[9px] font-black text-cyan-400 uppercase tracking-wider pl-3 border-l border-white/5 select-none">
                    FT
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPlayersTab = () => {
    const scorers = [
      { rank: 1, name: 'Lionel Messi', team: 'Argentina', value: 5, flag: '🇦🇷' },
      { rank: 2, name: 'Kylian Mbappé', team: 'France', value: 4, flag: '🇫🇷' },
      { rank: 3, name: 'Harry Kane', team: 'England', value: 3, flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { rank: 4, name: 'Neymar Jr', team: 'Brazil', value: 3, flag: '🇧🇷' },
      { rank: 5, name: 'Santiago Giménez', team: 'Mexico', value: 3, flag: '🇲🇽' },
    ];
    
    const assists = [
      { rank: 1, name: 'Kevin De Bruyne', team: 'Belgium', value: 4, flag: '🇧🇪' },
      { rank: 2, name: 'Antoine Griezmann', team: 'France', value: 3, flag: '🇫🇷' },
      { rank: 3, name: 'Bruno Fernandes', team: 'Portugal', value: 3, flag: '🇵🇹' },
    ];

    return (
      <div className="space-y-4">
        {/* Goals */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-1 bg-white/[0.02] rounded-md">
            Top Scorers
          </div>
          <div className="space-y-2">
            {scorers.map((s) => (
              <div key={s.rank} className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 text-xs hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-cyan-400/80 w-4">{s.rank}</span>
                  <span className="font-semibold text-white/90">{s.name}</span>
                  <span className="text-[10px] text-white/30 font-medium">{s.flag} {s.team}</span>
                </div>
                <span className="font-bold text-white text-sm tabular-nums">{s.value} <span className="text-[9px] text-white/40 font-bold uppercase">G</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Assists */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-1 bg-white/[0.02] rounded-md">
            Top Assists
          </div>
          <div className="space-y-2">
            {assists.map((a) => (
              <div key={a.rank} className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 text-xs hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-cyan-400/80 w-4">{a.rank}</span>
                  <span className="font-semibold text-white/90">{a.name}</span>
                  <span className="text-[10px] text-white/30 font-medium">{a.flag} {a.team}</span>
                </div>
                <span className="font-bold text-white text-sm tabular-nums">{a.value} <span className="text-[9px] text-white/40 font-bold uppercase">A</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStatsTab = () => {
    const stats = [
      { label: 'Matches Played', value: '48', desc: 'Group & Knockout stages', color: 'text-cyan-400' },
      { label: 'Total Goals', value: '124', desc: 'Average 2.58 per match', color: 'text-emerald-400' },
      { label: 'Yellow Cards', value: '156', desc: 'Average 3.25 per match', color: 'text-yellow-400' },
      { label: 'Red Cards', value: '8', desc: 'Average 0.17 per match', color: 'text-red-400' },
      { label: 'Clean Sheets', value: '18', desc: '37.5% clean sheet ratio', color: 'text-blue-400' },
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
        {/* Team Highlights */}
        <div className="col-span-2 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Top Attacking Team</span>
            <div className="text-sm font-bold text-white">Brazil 🇧🇷</div>
            <span className="text-[9px] text-white/30">12 goals scored in the tournament</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-400/20 text-sm">
            ⚽
          </div>
        </div>
      </div>
    );
  };

  const renderTableTab = () => {
    const groups = [
      {
        name: 'Group A',
        teams: [
          { name: 'Mexico', flag: '🇲🇽', p: 2, w: 2, d: 0, l: 0, gd: '+4', pts: 6 },
          { name: 'South Korea', flag: '🇰🇷', p: 2, w: 1, d: 1, l: 0, gd: '+1', pts: 4 },
          { name: 'South Africa', flag: '🇿🇦', p: 2, w: 0, d: 1, l: 1, gd: '-2', pts: 1 },
          { name: 'Czechia', flag: '🇨🇿', p: 2, w: 0, d: 0, l: 2, gd: '-3', pts: 0 },
        ]
      },
      {
        name: 'Group B',
        teams: [
          { name: 'Canada', flag: '🇨🇦', p: 2, w: 1, d: 1, l: 0, gd: '+2', pts: 4 },
          { name: 'Switzerland', flag: '🇨🇭', p: 2, w: 1, d: 1, l: 0, gd: '+1', pts: 4 },
          { name: 'Bosnia and Herz.', flag: '🇧🇦', p: 2, w: 0, d: 2, l: 0, gd: '0', pts: 2 },
          { name: 'Qatar', flag: '🇶🇦', p: 2, w: 0, d: 0, l: 2, gd: '-3', pts: 0 },
        ]
      }
    ];

    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.name} className="space-y-2">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 py-1 bg-white/[0.02] rounded-md">
              {group.name}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-white/70">
                <thead>
                  <tr className="border-b border-white/5 text-left text-white/30 font-bold uppercase tracking-wider">
                    <th className="py-1.5 pl-2">Pos</th>
                    <th className="py-1.5">Team</th>
                    <th className="py-1.5 text-center">P</th>
                    <th className="py-1.5 text-center">W</th>
                    <th className="py-1.5 text-center">D</th>
                    <th className="py-1.5 text-center">L</th>
                    <th className="py-1.5 text-center">GD</th>
                    <th className="py-1.5 text-right pr-2">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {group.teams.map((t, idx) => (
                    <tr key={t.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 pl-2 font-bold text-cyan-400">{idx + 1}</td>
                      <td className="py-2 font-semibold text-white/90">
                        <span className="mr-1">{t.flag}</span> {t.name}
                      </td>
                      <td className="py-2 text-center font-medium tabular-nums">{t.p}</td>
                      <td className="py-2 text-center font-medium tabular-nums">{t.w}</td>
                      <td className="py-2 text-center font-medium tabular-nums">{t.d}</td>
                      <td className="py-2 text-center font-medium tabular-nums">{t.l}</td>
                      <td className="py-2 text-center font-bold text-white/55 tabular-nums">{t.gd}</td>
                      <td className="py-2 text-right font-black text-white pr-2 tabular-nums">{t.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
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
        {activeCategory === 'football' ? (
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

        {activeCategory === 'football' ? (
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
