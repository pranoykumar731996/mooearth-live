// ============================================================
// MooEarth Live — Football Match Center Component
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';

interface FootballMatchCenterProps {
  event: WorldEvent;
}

const MEMES = [
  { id: 1, user: 'ElClasicoMemes', text: 'Vinicius running past defense like 🏃‍♂️💨', time: '2m ago', likes: 184, emoji: '🔥' },
  { id: 2, user: 'BarcaIntel', text: 'Lewandowski when he gets a pass in the box: 🎯⚽ (Never misses)', time: '5m ago', likes: 312, emoji: '😎' },
  { id: 3, user: 'VAR_Watcher', text: 'Ref checking VAR for the 10th time today: 🧑‍💻🔍 "Enhance..."', time: '12m ago', likes: 98, emoji: '🤡' },
  { id: 4, user: 'MadridistaHQ', text: 'Bellingham sliding into the box to save the match: 🦸‍♂️✨', time: '15m ago', likes: 250, emoji: '🙌' }
];

const COMMENTARY = [
  { time: "72'", text: "Yellow Card shown to Jules Koundé for a mistimed challenge on Vinícius Júnior." },
  { time: "68'", text: "Substitution: Luka Modrić comes on for Jude Bellingham (Real Madrid)." },
  { time: "65'", text: "Lewandowski hits the woodwork! A thunderous strike from the edge of the box bounces off the post." },
  { time: "58'", text: "Raphinha whips a dangerous corner in, but Courtois punches it clear." },
  { time: "45+2'", text: "HALF TIME: Real Madrid 1 - 1 Barcelona. High intensity, tactical deadlock." },
  { time: "45'", text: "GOAL! Robert Lewandowski equalizes with a brilliant header! Assist by Raphinha." },
  { time: "38'", text: "Pedri receives treatment after a hard tackle from Tchouaméni. He is good to continue." },
  { time: "24'", text: "GOAL! Vinícius Júnior scores! A blazing run down the left wing followed by a neat finish." }
];

export default function FootballMatchCenter({ event }: FootballMatchCenterProps) {
  const [activeTab, setActiveTab] = useState<'hud' | 'ai' | 'fan'>('hud');
  const match = event.footballData || {
    homeTeam: 'Home Team',
    awayTeam: 'Away Team',
    homeScore: 0,
    awayScore: 0,
    status: 'LIVE',
    elapsed: 45,
    goals: [],
    cards: []
  };

  // Live Timer Simulation
  const [elapsedTime, setElapsedTime] = useState(match.elapsed);
  useEffect(() => {
    if (match.status !== 'FT' && match.status !== 'HT') {
      const interval = setInterval(() => {
        setElapsedTime(prev => (prev < 90 ? prev + 1 : prev));
      }, 10000); // Speed up for demo purposes
      return () => clearInterval(interval);
    }
  }, [match.status]);

  // Fan Poll State
  const [userVote, setUserVote] = useState<'home' | 'draw' | 'away' | null>(null);
  const [pollResults, setPollResults] = useState({ home: 48, draw: 22, away: 30 });
  const handleVote = useCallback((option: 'home' | 'draw' | 'away') => {
    if (userVote) return;
    setUserVote(option);
    setPollResults(prev => {
      const next = { ...prev };
      next[option] = next[option] + 1;
      return next;
    });
  }, [userVote]);

  // Player Performance Ratings
  const [ratings, setRatings] = useState<Record<string, number>>({
    'Vinícius Júnior': 8.2,
    'Robert Lewandowski': 7.9,
    'Luka Modrić': 6.8
  });
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const handleRate = useCallback((player: string, rating: number) => {
    setUserRatings(prev => ({ ...prev, [player]: rating }));
    setRatings(prev => {
      const currentAvg = prev[player];
      // Community average moves slightly towards user rating
      const newAvg = parseFloat(((currentAvg * 9 + rating) / 10).toFixed(1));
      return { ...prev, [player]: newAvg };
    });
  }, []);

  // AI 10s Summary Generation
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const triggerAiSummary = useCallback(() => {
    setIsGeneratingSummary(true);
    setTimeout(() => {
      setIsGeneratingSummary(false);
      setAiSummary(
        `⚡ **MooEarth AI 10-Second Summary**:\n` +
        `• **Dynamic Start**: Vinícius Júnior opened the score in the 24th minute with a blazing counterattack.\n` +
        `• **Barca Response**: Lewandowski equalized right before Half-Time with an impressive header.\n` +
        `• **Tactical Deadlock**: High intensity in midfield. Real Madrid dominating possession, Barcelona threatening on the woodwork.`
      );
    }, 1500);
  }, []);

  // Helper to get total poll votes
  const totalVotes = pollResults.home + pollResults.draw + pollResults.away;
  const getPct = (votes: number) => Math.round((votes / totalVotes) * 100);

  return (
    <div className="flex flex-col h-full text-white">
      {/* Mini Scoreboard */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-4 flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between text-xs text-white/40 uppercase tracking-widest font-black">
          <span>{event.city} • {event.country}</span>
          <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {match.status === 'FT' ? 'Full Time' : match.status === 'HT' ? 'Half Time' : `${elapsedTime}'`}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 px-4">
          <div className="flex flex-col items-center flex-1 text-center">
            <span className="text-2xl mb-1">🇪🇸</span>
            <span className="text-sm font-black tracking-tight">{match.homeTeam}</span>
          </div>

          <div className="flex items-center gap-4 px-6">
            <span className="text-3xl font-black tabular-nums">{match.homeScore}</span>
            <span className="text-white/20 font-black text-xl">:</span>
            <span className="text-3xl font-black tabular-nums">{match.awayScore}</span>
          </div>

          <div className="flex flex-col items-center flex-1 text-center">
            <span className="text-2xl mb-1">🔵🔴</span>
            <span className="text-sm font-black tracking-tight">{match.awayTeam}</span>
          </div>
        </div>

        {/* Goal Scorers list */}
        {match.goals && match.goals.length > 0 && (
          <div className="border-t border-white/5 pt-2.5 flex flex-col gap-1 text-[11px] text-white/50">
            {match.goals.map((g, idx) => (
              <div key={idx} className="flex justify-between items-center px-2">
                <span className={g.team === 'home' ? 'font-bold text-white/70' : 'opacity-0'}>
                  ⚽ {g.player} ({g.time}')
                </span>
                <span className={g.team === 'away' ? 'font-bold text-white/70 text-right' : 'opacity-0'}>
                  {g.player} ({g.time}') ⚽
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl mb-4">
        {(['hud', 'ai', 'fan'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === tab
                ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-500/30 text-cyan-400 shadow-md'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab === 'hud' ? '🏟️ HUD' : tab === 'ai' ? '🤖 AI' : '📣 Fan Zone'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
        <AnimatePresence mode="wait">
          {activeTab === 'hud' && (
            <motion.div
              key="hud-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Match Emotions */}
              <div className="rounded-xl bg-white/5 border border-white/5 p-3.5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2">
                  Match Emotions (Live Fan Sentiment)
                </span>
                <div className="flex justify-between items-center mb-1 text-xs font-bold">
                  <span>Hype: 78% 🔥</span>
                  <span>Anxiety: 42% 😰</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
                  <div className="h-full bg-gradient-to-r from-red-500 to-orange-500" style={{ width: '78%' }} />
                  <div className="h-full bg-blue-500" style={{ width: '22%' }} />
                </div>
                <p className="text-[10px] text-white/40 mt-1.5 font-medium">
                  Real Madrid supporters are pushing heavily. Barcelona fans showing concern over the left wing.
                </p>
              </div>

              {/* AI Live Commentary */}
              <div className="rounded-xl bg-white/5 border border-white/5 p-3.5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2.5">
                  AI Commentary Feed
                </span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                  {COMMENTARY.map((c, idx) => (
                    <div key={idx} className="flex gap-2 text-xs leading-relaxed">
                      <span className="font-black text-cyan-400 tracking-wider shrink-0">{c.time}</span>
                      <span className="text-white/70 font-medium">{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Win Probability */}
              <div className="rounded-xl bg-white/5 border border-white/5 p-3.5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2.5">
                  AI Win Probability
                </span>
                <div className="flex h-4 rounded-full overflow-hidden text-[9px] font-black text-center text-white select-none">
                  <div className="bg-purple-600 flex items-center justify-center" style={{ width: '45%' }}>RM (45%)</div>
                  <div className="bg-white/20 flex items-center justify-center" style={{ width: '25%' }}>Draw (25%)</div>
                  <div className="bg-blue-600 flex items-center justify-center" style={{ width: '30%' }}>BAR (30%)</div>
                </div>
                <p className="text-[10px] text-white/40 mt-2 font-medium">
                  Real Madrid holds the advantage due to defensive strength and counterattack capabilities.
                </p>
              </div>

              {/* Next Scorer Prediction */}
              <div className="rounded-xl bg-white/5 border border-white/5 p-3.5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2">
                  Who Will Score Next?
                </span>
                <div className="space-y-1.5">
                  {[
                    { name: 'Vinícius Júnior', pct: 35, color: '#a855f7' },
                    { name: 'Robert Lewandowski', pct: 28, color: '#3b82f6' },
                    { name: 'No More Goals', pct: 37, color: 'rgba(255,255,255,0.2)' }
                  ].map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white/80">{p.name}</span>
                      <div className="flex items-center gap-2 w-1/2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
                        </div>
                        <span className="w-8 text-right tabular-nums">{p.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 10s Match Summary */}
              <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/10 p-3.5">
                <button
                  onClick={triggerAiSummary}
                  disabled={isGeneratingSummary}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg transition duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingSummary ? (
                    <>
                      <div className="w-3 h-3 rounded-full border border-white/20 border-t-white animate-spin" />
                      Analyzing Match Center...
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      Generate 10s Match Summary
                    </>
                  )}
                </button>
                {aiSummary && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 text-[11px] leading-relaxed text-cyan-100 font-medium whitespace-pre-line border-t border-cyan-500/10 pt-2.5"
                  >
                    {aiSummary}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'fan' && (
            <motion.div
              key="fan-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Fan Poll */}
              <div className="rounded-xl bg-white/5 border border-white/5 p-3.5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2">
                  Who will win El Clásico?
                </span>
                {!userVote ? (
                  <div className="grid grid-cols-3 gap-2">
                    {(['home', 'draw', 'away'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleVote(opt)}
                        className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all cursor-pointer hover:border-cyan-500/30"
                      >
                        {opt === 'home' ? 'Real Madrid' : opt === 'draw' ? 'Draw' : 'Barcelona'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {([
                      { id: 'home', label: 'Real Madrid', color: 'bg-purple-600' },
                      { id: 'draw', label: 'Draw', color: 'bg-white/20' },
                      { id: 'away', label: 'Barcelona', color: 'bg-blue-600' }
                    ] as const).map(opt => (
                      <div key={opt.id} className="relative h-8 rounded-lg overflow-hidden bg-white/5 border border-white/5 flex items-center justify-between px-3 text-xs font-bold">
                        <div className={`absolute left-0 top-0 bottom-0 ${opt.color} opacity-20 transition-all duration-500`} style={{ width: `${getPct(pollResults[opt.id])}%` }} />
                        <span className="relative z-10">{opt.label} {userVote === opt.id && '✓'}</span>
                        <span className="relative z-10 tabular-nums">{getPct(pollResults[opt.id])}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rate Player Performance */}
              <div className="rounded-xl bg-white/5 border border-white/5 p-3.5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2.5">
                  Rate Player Performance
                </span>
                <div className="space-y-3">
                  {Object.entries(ratings).map(([player, avg]) => (
                    <div key={player} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white/80">{player}</span>
                        <span className="font-black text-cyan-400">
                          {userRatings[player] ? `Your Rating: ${userRatings[player]} | ` : ''}Avg: {avg}⭐
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={userRatings[player] || avg}
                        onChange={(e) => handleRate(player, parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Meme Feed */}
              <div className="rounded-xl bg-white/5 border border-white/5 p-3.5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-2">
                  Match Memes Feed
                </span>
                <div className="space-y-2.5">
                  {MEMES.map(meme => (
                    <div key={meme.id} className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex items-start gap-2.5">
                      <span className="text-xl shrink-0 mt-0.5">{meme.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[10px] text-white/30 mb-0.5">
                          <span className="font-bold text-white/50">@{meme.user}</span>
                          <span>{meme.time}</span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed font-medium">{meme.text}</p>
                        <div className="flex items-center gap-1 text-[10px] text-cyan-400/60 mt-1 font-bold">
                          <span>👍 {meme.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
