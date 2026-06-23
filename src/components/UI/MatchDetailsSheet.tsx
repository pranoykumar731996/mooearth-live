'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { WorldEvent } from '@/types';
import { generateMatchStats, generateLineups, generateTimeline } from '@/utils/matchGenerators';
import { getFlag } from '@/data/worldCupSchedule';
import { CountryFlag } from './CountryFlag';

interface MatchDetailsSheetProps {
  matchEvent: WorldEvent;
  onClose: () => void;
}

type TabType = 'TIMELINE' | 'LINEUPS' | 'STATS' | 'STANDINGS';

export default function MatchDetailsSheet({ matchEvent, onClose }: MatchDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('TIMELINE');
  const dragControls = useDragControls();

  const fd = matchEvent.footballData;
  if (!fd) return null;

  const stats = generateMatchStats(matchEvent.id);
  const lineups = generateLineups(matchEvent.id, fd.homeTeam, fd.awayTeam);
  const timeline = generateTimeline(matchEvent.id, fd);

  const renderTimeline = () => {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin pb-safe">
        {timeline.length === 0 ? (
          <div className="text-center text-white/40 text-xs py-8">No events yet</div>
        ) : (
          timeline.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-10 text-right text-xs font-bold text-white/60">{item.time}'</div>
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
                  <div className="text-xs">
                    <span className="text-emerald-400">IN:</span> {item.playerIn} <br/>
                    <span className="text-red-400">OUT:</span> {item.playerOut}
                  </div>
                ) : (
                  <div className="text-xs text-white font-semibold">{item.player}</div>
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
      <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 min-w-[200px]">
        <div className="flex items-center gap-2 mb-4">
          <CountryFlag flag={getFlag(teamName)} className="w-5 h-3.5 object-cover rounded-[2px]" />
          <span className="font-bold text-white uppercase text-sm">{teamName}</span>
          <span className="ml-auto text-[10px] text-white/40">{teamData.formation}</span>
        </div>
        <div className="space-y-1 mb-6">
          {teamData.starters.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-4 text-right text-[9px] text-white/40">{p.number}</span>
                <span className="text-xs text-white/80">{p.name}</span>
              </div>
              <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">{p.pos}</span>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="flex-1 overflow-x-auto px-6 py-4 flex gap-4 scrollbar-thin pb-safe snap-x">
        <div className="snap-center w-[85%] shrink-0">{renderTeam(fd.homeTeam, lineups.home)}</div>
        <div className="snap-center w-[85%] shrink-0">{renderTeam(fd.awayTeam, lineups.away)}</div>
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
            <span className="uppercase tracking-widest text-[9px] text-white/40">{label}</span>
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
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin pb-safe">
        <div className="max-w-md mx-auto">
          <StatRow label="Possession %" home={stats.possession.home} away={stats.possession.away} />
          <StatRow label="Shots" home={stats.shots.home} away={stats.shots.away} />
          <StatRow label="Shots on Target" home={stats.shotsOnTarget.home} away={stats.shotsOnTarget.away} />
          <StatRow label="Passes" home={stats.passes.home} away={stats.passes.away} />
          <StatRow label="Pass Accuracy %" home={stats.passAccuracy.home} away={stats.passAccuracy.away} />
          <StatRow label="Fouls" home={stats.fouls.home} away={stats.fouls.away} />
          <StatRow label="Yellow Cards" home={stats.yellowCards.home} away={stats.yellowCards.away} />
          <StatRow label="Red Cards" home={stats.redCards.home} away={stats.redCards.away} />
          <StatRow label="Corners" home={stats.corners.home} away={stats.corners.away} />
        </div>
      </div>
    );
  };

  const renderStandings = () => {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-4 flex items-center justify-center text-center scrollbar-thin pb-safe">
        <div className="text-white/40">
          <div className="text-3xl mb-3">📊</div>
          <div className="font-bold mb-1 text-white/80 text-sm">Standings Unavailable</div>
          <div className="text-[10px]">Group standings are updated after all Matchday games.</div>
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
      />

      {/* Bottom Sheet */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
          }
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-x-0 bottom-0 z-[80] flex flex-col glass border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden lg:hidden"
        style={{ height: '85vh' }}
      >
        {/* Drag Handle */}
        <div
          className="shrink-0 pt-4 pb-2 flex justify-center touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="relative shrink-0 bg-black/20 border-b border-white/5 pb-4 px-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-2 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white hover:text-black transition-colors z-10 font-bold"
          >
            ✕
          </button>
          
          <div className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.25em] mb-3 mt-2">
            {fd.status === 'NS' ? 'Upcoming Match' : fd.status === 'LIVE' ? 'Live Match' : 'Full Time'}
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <CountryFlag flag={getFlag(fd.homeTeam)} className="w-8 h-5.5 object-cover rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <span className="font-black text-white uppercase text-[10px] tracking-widest text-center truncate w-full">{fd.homeTeam}</span>
            </div>
            
            <div className="flex items-center gap-3 text-3xl font-black text-white shrink-0">
              <span>{fd.homeScore}</span>
              <span className="text-white/20 text-xl">-</span>
              <span>{fd.awayScore}</span>
            </div>
            
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <CountryFlag flag={getFlag(fd.awayTeam)} className="w-8 h-5.5 object-cover rounded-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
              <span className="font-black text-white uppercase text-[10px] tracking-widest text-center truncate w-full">{fd.awayTeam}</span>
            </div>
          </div>
          <div className="mt-3 text-[9px] font-bold text-white/40 uppercase tracking-widest">
            {matchEvent.stadium} • {matchEvent.city}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-2 pt-2 bg-black/40 border-b border-white/5 shrink-0">
          {(['TIMELINE', 'LINEUPS', 'STATS', 'STANDINGS'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-3 text-[9px] font-black uppercase tracking-wider transition-colors relative ${
                activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeMobileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-black/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
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
    </>
  );
}
