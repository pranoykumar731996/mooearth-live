'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import { generateMatchStats, generateLineups, generateTimeline } from '@/utils/matchGenerators';
import { getFlag } from '@/data/worldCupSchedule';
import { CountryFlag } from '@/components/UI/CountryFlag';

interface MatchDetailsPanelProps {
  matchEvent: WorldEvent;
  onClose: () => void;
}

type TabType = 'TIMELINE' | 'LINEUPS' | 'STATS' | 'STANDINGS';

export default function MatchDetailsPanel({ matchEvent, onClose }: MatchDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('TIMELINE');
  const fd = matchEvent.footballData;
  if (!fd) return null;

  const stats = generateMatchStats(matchEvent.id);
  const lineups = generateLineups(matchEvent.id, fd.homeTeam, fd.awayTeam);
  const timeline = generateTimeline(matchEvent.id, fd);

  const renderTimeline = () => {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
        {timeline.length === 0 ? (
          <div className="text-center text-white/40 text-xs py-8">No events yet</div>
        ) : (
          timeline.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-12 text-right text-xs font-bold text-white/60">{item.time}'</div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                {item.type === 'goal' && '⚽'}
                {item.type === 'yellow' && <div className="w-3 h-4 bg-yellow-400 rounded-sm" />}
                {item.type === 'red' && <div className="w-3 h-4 bg-red-500 rounded-sm" />}
                {item.type === 'substitution' && '🔄'}
              </div>
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                  {item.team === 'home' ? fd.homeTeam : fd.awayTeam}
                </div>
                {item.type === 'substitution' ? (
                  <div className="text-sm">
                    <span className="text-emerald-400">IN:</span> {item.playerIn} <br/>
                    <span className="text-red-400">OUT:</span> {item.playerOut}
                  </div>
                ) : (
                  <div className="text-sm text-white font-semibold">{item.player}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderLineups = () => {
    const renderTeam = (teamName: string, teamData: any) => (
      <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <CountryFlag flag={getFlag(teamName)} className="w-5 h-3.5 object-cover rounded-[2px]" />
          <span className="font-bold text-white uppercase">{teamName}</span>
          <span className="ml-auto text-xs text-white/40">{teamData.formation}</span>
        </div>
        <div className="space-y-1 mb-6">
          {teamData.starters.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-5 text-right text-[10px] text-white/40">{p.number}</span>
                <span className="text-sm text-white/80">{p.name}</span>
              </div>
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">{p.pos}</span>
            </div>
          ))}
        </div>
        <div className="text-xs font-black text-white/30 uppercase tracking-widest mb-2">Bench</div>
        <div className="space-y-1">
          {teamData.bench.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-5 text-right text-[10px] text-white/40">{p.number}</span>
                <span className="text-xs text-white/60">{p.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="flex-1 overflow-y-auto px-6 py-4 flex gap-4 scrollbar-thin">
        {renderTeam(fd.homeTeam, lineups.home)}
        {renderTeam(fd.awayTeam, lineups.away)}
      </div>
    );
  };

  const renderStats = () => {
    const StatRow = ({ label, home, away }: { label: string, home: number, away: number }) => {
      const total = home + away || 1;
      const homePct = (home / total) * 100;
      return (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/70 mb-1.5 font-bold">
            <span>{home}</span>
            <span className="uppercase tracking-widest text-[10px] text-white/40">{label}</span>
            <span>{away}</span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden bg-white/10 gap-1">
            <div className="bg-cyan-400 h-full rounded-r-full transition-all" style={{ width: `${homePct}%` }} />
            <div className="bg-orange-500 h-full rounded-l-full transition-all" style={{ width: `${100 - homePct}%` }} />
          </div>
        </div>
      );
    };

    return (
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <div className="max-w-sm mx-auto">
          <StatRow label="Possession %" home={stats.possession.home} away={stats.possession.away} />
          <StatRow label="Shots" home={stats.shots.home} away={stats.shots.away} />
          <StatRow label="Shots on Target" home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
          <StatRow label="Passes" home={stats.passes.home} away={stats.passes.away} />
          <StatRow label="Pass Accuracy %" home={stats.passAccuracy.home} away={stats.passAccuracy.away} />
          <StatRow label="Fouls" home={stats.fouls.home} away={stats.fouls.away} />
          <StatRow label="Yellow Cards" home={stats.yellowCards.home} away={stats.yellowCards.away} />
          <StatRow label="Red Cards" home={stats.redCards.home} away={stats.redCards.away} />
          <StatRow label="Offsides" home={stats.offsides.home} away={stats.offsides.away} />
          <StatRow label="Corners" home={stats.corners.home} away={stats.corners.away} />
        </div>
      </div>
    );
  };

  const renderStandings = () => {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-4 flex items-center justify-center text-center scrollbar-thin">
        <div className="text-white/40">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-bold mb-1 text-white/80">Standings Unavailable</div>
          <div className="text-xs">Group standings are updated after all Matchday games.</div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed right-6 top-24 bottom-24 w-[480px] z-[55] flex flex-col rounded-3xl glass border border-white/10 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="relative shrink-0 bg-black/40 border-b border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white hover:text-black transition-colors z-10 font-bold"
        >
          ✕
        </button>
        
        <div className="pt-8 pb-6 px-6 text-center">
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em] mb-4">
            {fd.status === 'NS' ? 'Upcoming Match' : fd.status === 'LIVE' ? 'Live Match' : 'Full Time'}
          </div>
          
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2 flex-1">
              <CountryFlag flag={getFlag(fd.homeTeam)} className="w-9 h-6 object-cover rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <span className="font-black text-white uppercase text-sm tracking-widest">{fd.homeTeam}</span>
            </div>
            
            <div className="flex items-center gap-4 text-4xl font-black text-white shrink-0">
              <span>{fd.homeScore}</span>
              <span className="text-white/20 text-2xl">-</span>
              <span>{fd.awayScore}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 flex-1">
              <CountryFlag flag={getFlag(fd.awayTeam)} className="w-9 h-6 object-cover rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <span className="font-black text-white uppercase text-sm tracking-widest">{fd.awayTeam}</span>
            </div>
          </div>
          <div className="mt-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            {matchEvent.stadium} • {matchEvent.city}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-4 pt-2">
          {(['TIMELINE', 'LINEUPS', 'STATS', 'STANDINGS'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${
                activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-black/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {activeTab === 'TIMELINE' && renderTimeline()}
            {activeTab === 'LINEUPS' && renderLineups()}
            {activeTab === 'STATS' && renderStats()}
            {activeTab === 'STANDINGS' && renderStandings()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
