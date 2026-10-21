// ============================================================
// MooEarth Live — Games Hub Client Experience
// ============================================================
// Destination 2 of 2: Dedicated Earth Gaming & Multiplayer Hub.
// Features: Daily Earth Challenge, Classroom & Party Mode,
// Tournament Brackets, Stop The Earth Arcade, 11+ Quiz Modes,
// and Live Playable Question Runner.

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EarthQuestion } from '@/types';
import PlayableGameLandingRunner from '@/components/Games/PlayableGameLandingRunner';
import GlobalFooter from '@/components/Layout/GlobalFooter';

interface GamesHubClientProps {
  initialQuestions: EarthQuestion[];
}

interface GameModeItem {
  id: string;
  name: string;
  emoji: string;
  href: string;
  category: string;
  badge: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  questionCount: number;
}

const GAME_MODES_CATALOG: GameModeItem[] = [
  {
    id: 'flag-quiz',
    name: 'Flag Quiz',
    emoji: '🚩',
    href: '/flag-quiz',
    category: 'Vexillology',
    badge: 'Popular',
    difficulty: 'Medium',
    description: 'Identify national flags of 195 sovereign nations across all continents.',
    questionCount: 5,
  },
  {
    id: 'capital-quiz',
    name: 'Capital City Quiz',
    emoji: '🏛️',
    href: '/capital-quiz',
    category: 'Political Geography',
    badge: 'Featured',
    difficulty: 'Medium',
    description: 'Match world capitals from Tokyo to Buenos Aires against timer pressure.',
    questionCount: 5,
  },
  {
    id: 'country-quiz',
    name: 'Country Identifier',
    emoji: '🗺️',
    href: '/country-quiz',
    category: 'Sovereign Nations',
    badge: 'Core',
    difficulty: 'Easy',
    description: 'Test your knowledge of country locations, sovereign territories, and populations.',
    questionCount: 5,
  },
  {
    id: 'geography-quiz',
    name: 'Physical Geography Quiz',
    emoji: '🏔️',
    href: '/geography-quiz',
    category: 'Topography',
    badge: 'Essential',
    difficulty: 'Medium',
    description: 'Questions covering major rivers, mountain peaks, deep ocean trenches, and deserts.',
    questionCount: 5,
  },
  {
    id: 'world-map-quiz',
    name: 'World Map Coordinates',
    emoji: '🌐',
    href: '/world-map-quiz',
    category: 'Cartography',
    badge: 'Spatial',
    difficulty: 'Hard',
    description: 'Sharpen your spatial awareness by pinpointing exact global coordinates on Earth.',
    questionCount: 5,
  },
  {
    id: 'world-geography-quiz',
    name: 'World Geography Master',
    emoji: '🧭',
    href: '/world-geography-quiz',
    category: 'Planetary Mastery',
    badge: 'Comprehensive',
    difficulty: 'Medium',
    description: 'Curated mix of geopolitical trivia, continental records, and climate zones.',
    questionCount: 5,
  },
  {
    id: 'border-hunter',
    name: 'Border Hunter Challenge',
    emoji: '🎯',
    href: '/challenges',
    category: 'Territory',
    badge: 'Tactical',
    difficulty: 'Hard',
    description: 'Guess land borders, enclave states, and adjacent neighboring territories.',
    questionCount: 5,
  },
  {
    id: 'continents',
    name: 'Continent Explorer',
    emoji: '🌍',
    href: '/continents',
    category: 'Global Regions',
    badge: 'Regional',
    difficulty: 'Easy',
    description: 'Master sovereign nations and geographic features across the 7 continents.',
    questionCount: 7,
  },
  {
    id: 'landmarks',
    name: 'World Landmarks & Wonders',
    emoji: '🗿',
    href: '/geography-games',
    category: 'Heritage',
    badge: 'Cultural',
    difficulty: 'Medium',
    description: 'Identify iconic UNESCO heritage sites, historical monuments, and ancient wonders.',
    questionCount: 5,
  },
  {
    id: 'cities',
    name: 'Metropolitan City Places',
    emoji: '🏙️',
    href: '/cities',
    category: 'Urban Geography',
    badge: 'Urban',
    difficulty: 'Medium',
    description: 'Explore world metropolitan capitals, skyline landmarks, and urban centers.',
    questionCount: 5,
  },
  {
    id: 'stop-the-earth',
    name: 'Stop the Earth',
    emoji: '🌍',
    href: '/games/stop-the-earth',
    category: 'Map Guessing',
    badge: 'NEW',
    difficulty: 'Medium',
    description: 'Spin the Earth, pick a country, and locate real places on an interactive map. Score based on distance accuracy.',
    questionCount: 10,
  },
  {
    id: 'play-earth',
    name: 'Play Earth 3D Master Mode',
    emoji: '🎮',
    href: '/play-earth',
    category: 'Full Globe 3D',
    badge: 'Ultimate',
    difficulty: 'Hard',
    description: 'The complete interactive 3D WebGL globe quiz HUD with real-time fly-to animations.',
    questionCount: 10,
  },
];

export default function GamesHubClient({ initialQuestions }: GamesHubClientProps) {
  const router = useRouter();

  // Local storage player progression
  const [dailyStreak, setDailyStreak] = useState(0);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [playerXp, setPlayerXp] = useState(0);
  const [partyRoomPin, setPartyRoomPin] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'quizzes' | 'multiplayer' | 'arcade'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const now = new Date();
        const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
        const saved = localStorage.getItem(`mooearth_daily_${today}`);
        if (saved) setDailyCompleted(true);

        const streakVal = parseInt(localStorage.getItem('mooearth_daily_streak') || '0', 10);
        setDailyStreak(streakVal);

        const xpVal = parseInt(localStorage.getItem('mooearth_player_xp') || '450', 10);
        setPlayerXp(xpVal);
      } catch {
        // Fallback
      }
    }
  }, []);

  const handleJoinParty = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = partyRoomPin.trim().toUpperCase();
    if (cleanPin) {
      router.push(`/party?room=${encodeURIComponent(cleanPin)}`);
    } else {
      router.push('/party');
    }
  };

  const filteredModes = GAME_MODES_CATALOG.filter((mode) => {
    if (activeTab === 'quizzes') return true;
    if (activeTab === 'multiplayer') return false;
    if (activeTab === 'arcade') return mode.id === 'play-earth';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#020208] text-white flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* ── Top Header Navigation ────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#020208]/90 backdrop-blur-xl border-b border-white/10 select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">🌍</span>
            <div className="flex flex-col">
              <div className="text-base font-black text-white group-hover:text-cyan-300 transition-colors leading-none">
                MooEarth <span className="text-cyan-400 font-extrabold text-xs">Live</span>
              </div>
              <span className="text-[10px] text-white/40 font-mono tracking-wider">Planetary Platform</span>
            </div>
          </Link>

          {/* Exactly Two Primary Destinations Navigation */}
          <nav role="navigation" aria-label="Primary destinations" className="flex items-center p-1 rounded-2xl bg-[#090d20]/90 border border-white/10 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            {/* Destination 1: Weather (/) */}
            <Link
              href="/"
              className="h-9 px-2.5 sm:px-4 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold tracking-wider text-cyan-300 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-pointer"
              title="MooEarth Weather Intelligence"
              aria-label="Weather Intelligence"
            >
              <span className="text-base">🌤️</span>
              <span>WEATHER</span>
            </Link>

            {/* Destination 2: Games (/games) - ACTIVE */}
            <Link
              href="/games"
              className="h-9 px-2.5 sm:px-4 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs font-black tracking-wider bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] border border-purple-400/50 transition-all duration-300 cursor-pointer"
              title="MooEarth Earth Games Hub"
              aria-label="Games Hub"
            >
              <span className="text-base">🎮</span>
              <span className="hidden sm:inline">GAMES HUB</span>
              <span className="sm:hidden">GAMES</span>
              {dailyStreak > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-400/30 text-amber-200 border border-amber-400/50">
                  🔥{dailyStreak}
                </span>
              )}
            </Link>
          </nav>

          {/* Player Progress Stats */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/daily"
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5 transition-all"
              title="Daily Challenge Streak"
            >
              <span>🔥</span>
              <span className="hidden sm:inline">{dailyStreak} Days</span>
              <span className="sm:hidden">{dailyStreak}d</span>
            </Link>
            <div className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono items-center gap-1.5">
              <span>⚡</span>
              <span>{playerXp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Games Content Container ─────────────── */}
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero Banner: Games Hub Header */}
        <section className="mb-10 text-center sm:text-left relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Destination 2 of 2: Earth Games Hub
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Play Earth <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Games & Challenges</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/60 max-w-2xl">
                Master 195 sovereign nations with daily synchronized challenges, real-time multiplayer room battles, tournament brackets, and speed quiz modes.
              </p>
            </div>

            {/* Quick Navigation Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All Modes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quizzes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'quizzes'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Quizzes (11+)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('multiplayer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'multiplayer'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Multiplayer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('arcade')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'arcade'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Arcade
              </button>
            </div>
          </div>
        </section>

        {/* ── Feature 1: Daily Earth Challenge (Hero Card) ─ */}
        <section className="mb-12">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0c1825] via-[#08101a] to-[#040810] border border-cyan-500/30 p-6 sm:p-8 overflow-hidden shadow-[0_10px_40px_rgba(0,229,255,0.15)] group">
            {/* Background glowing particle aura */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-cyan-500/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold tracking-wider uppercase">
                    ⭐ DAILY SPOTLIGHT
                  </span>
                  <span className="text-white/40 text-xs font-mono">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Daily Earth Challenge</span>
                  <span className="text-amber-400 text-xl">🔥</span>
                </h2>
                <p className="mt-2 text-sm text-white/70 max-w-xl">
                  5 synchronized questions updated every 24 hours. Compete with players worldwide, protect your streak, and earn bonus speed XP.
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <span className="text-base">🔥</span>
                    <span>Current Streak: {dailyStreak} Day{dailyStreak === 1 ? '' : 's'}</span>
                  </div>
                  <div className="text-white/40">·</div>
                  <div className="text-cyan-300 font-bold">
                    {dailyCompleted ? '✅ Completed Today' : '⚡ Ready to Play'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                <Link
                  href="/daily"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm tracking-wider shadow-[0_0_25px_rgba(0,229,255,0.5)] active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🚀</span>
                  <span>{dailyCompleted ? 'REVIEW SCORECARD' : 'PLAY TODAY\'S CHALLENGE'}</span>
                </Link>
                <Link
                  href="/daily"
                  className="px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs tracking-wider transition-all text-center"
                >
                  Leaderboard 🏆
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature 2: Multiplayer & Party Hub (2 Cards) ─ */}
        {(activeTab === 'all' || activeTab === 'multiplayer') && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>Multiplayer & Live Arenas</span>
                  <span className="text-sm px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    Live
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-white/50 mt-1">
                  Battle friends, classmates, or live stream audiences across real-time geography arenas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card A: Party Mode & Classroom Arena */}
              <div className="rounded-3xl bg-gradient-to-br from-[#120a24] to-[#07040f] border border-purple-500/30 p-6 sm:p-7 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-3xl">🎉</span>
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-purple-500/30">
                      ROOM PIN MULTIPLAYER
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Classroom & Party Arena</h3>
                  <p className="text-xs text-white/60 mb-5 leading-relaxed">
                    Host private games on a big screen or join from your phone using a 4-digit PIN. Real-time scores, synced countdowns, and live podiums.
                  </p>
                </div>

                {/* Quick Join Input Form */}
                <form onSubmit={handleJoinParty} className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={partyRoomPin}
                    onChange={(e) => setPartyRoomPin(e.target.value.toUpperCase())}
                    placeholder="ENTER 4-DIGIT PIN"
                    maxLength={6}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-xs font-mono font-bold tracking-widest uppercase focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
                  >
                    JOIN ROOM
                  </button>
                  <Link
                    href="/party"
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-xs tracking-wider transition-all text-center shrink-0"
                  >
                    HOST
                  </Link>
                </form>
              </div>

              {/* Card B: Planetary Tournament */}
              <div className="rounded-3xl bg-gradient-to-br from-[#180f08] to-[#0a0604] border border-amber-500/30 p-6 sm:p-7 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-3xl">🏆</span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-amber-500/30">
                      16-PLAYER BRACKETS
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">World Knockout Tournament</h3>
                  <p className="text-xs text-white/60 mb-5 leading-relaxed">
                    Compete through Round of 16, Quarterfinals, Semifinals, and the Grand Final. Knock out opponents in head-to-head speed trivia rounds.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                  <div className="text-xs font-mono text-amber-300/80">
                    🏆 1st Place: 5,000 XP + Gold Bracket Crown
                  </div>
                  <Link
                    href="/tournament"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
                  >
                    ENTER TOURNAMENT
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Feature 3: Arcade Mode "Stop The Earth" ──────── */}
        {(activeTab === 'all' || activeTab === 'arcade') && (
          <section className="mb-14">
            <div className="rounded-3xl bg-gradient-to-r from-[#0a1420] via-[#091824] to-[#040e18] border border-sky-400/30 p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-3xl shrink-0 animate-spin-slow">
                  🌐
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                      REFLEX ARCADE
                    </span>
                    <h3 className="text-lg font-black text-white">Stop The Earth</h3>
                  </div>
                  <p className="text-xs text-white/60 mt-1 max-w-lg">
                    Test your spatial reflexes! Stop the rapidly spinning 3D Earth at target coordinates within milliseconds to score pinpoint accuracy bonuses.
                  </p>
                </div>
              </div>

              <Link
                href="/play-earth"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 font-black text-xs tracking-wider shadow-[0_0_20px_rgba(56,189,248,0.4)] active:scale-95 transition-all cursor-pointer shrink-0"
              >
                PLAY STOP THE EARTH 🕹️
              </Link>
            </div>
          </section>
        )}

        {/* ── Feature 4: Interactive Discovery Modes Catalog ─ */}
        {(activeTab === 'all' || activeTab === 'quizzes') && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>Interactive Geography Quizzes</span>
                  <span className="text-sm px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    11 Modes
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-white/50 mt-1">
                  Practice specific skills from sovereign flags to capital cities and regional terrain.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredModes.map((mode) => (
                <div
                  key={mode.id}
                  className="rounded-2xl bg-[#070714] border border-white/10 hover:border-emerald-500/40 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                        {mode.emoji}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                          {mode.category}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          mode.difficulty === 'Easy'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : mode.difficulty === 'Medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {mode.difficulty}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mb-1.5">
                      {mode.name}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-4">
                      {mode.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-white/40">
                      {mode.questionCount} Questions · 15s Timed
                    </span>
                    <Link
                      href={mode.href}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black border border-white/10 hover:border-emerald-400 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>Play</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Feature 5: Embedded Playable Trial Round ───── */}
        <section className="mb-16">
          <div className="rounded-3xl bg-[#070714] border border-white/10 p-6 sm:p-8">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  <span>⚡</span> Instant In-Browser Trial
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Quick Play Geography Round
                </h2>
                <p className="text-xs sm:text-sm text-white/60 mt-1">
                  Test your skills right now. Answer 5 fast questions to unlock your speed scorecard.
                </p>
              </div>

              <div className="text-xs font-mono text-white/40">
                Synchronized Authentic World Questions
              </div>
            </div>

            <PlayableGameLandingRunner
              initialQuestions={initialQuestions}
              gameTitle="Play Earth Games Hub Trial"
              gameSlug="games"
              gameMode="geography"
              badge="Games Hub Rapid Challenge"
            />
          </div>
        </section>

        {/* ── Feature 6: Player Progression & Badges ──────── */}
        <section className="mb-12">
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span>Player Progression & Badges</span>
              <span className="text-sm">🏅</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mb-6">
              Track your stats, build long streaks, and unlock planetary mastery achievements.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-lg font-black text-white">{dailyStreak} Days</div>
                <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Daily Streak</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-lg font-black text-cyan-400">{playerXp.toLocaleString()}</div>
                <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Total XP Earned</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-2xl mb-1">🌍</div>
                <div className="text-lg font-black text-emerald-400">195</div>
                <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Nations Covered</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-lg font-black text-amber-400">Master</div>
                <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Geography Rank</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <GlobalFooter />
    </div>
  );
}
