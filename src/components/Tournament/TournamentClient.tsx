'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { EarthQuestion } from '@/types';
import { getDailyEarthQuestion } from '@/data/questions';
import LanguageSelector from '@/components/UI/LanguageSelector';

// Web Audio sound effects
function playTone(freq: number, type: OscillatorType, duration: number, delay: number = 0) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    setTimeout(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    }, delay * 1000);
  } catch {
    // Audio fallback
  }
}

function playCorrect() {
  playTone(523.25, 'sine', 0.12, 0);
  playTone(659.25, 'sine', 0.12, 0.08);
  playTone(783.99, 'sine', 0.25, 0.16);
}

function playWrong() {
  playTone(220, 'sawtooth', 0.25, 0);
  playTone(180, 'sawtooth', 0.35, 0.12);
}

function playTrophyFanfare() {
  playTone(523.25, 'triangle', 0.15, 0);
  playTone(659.25, 'triangle', 0.15, 0.1);
  playTone(783.99, 'triangle', 0.15, 0.2);
  playTone(1046.50, 'triangle', 0.5, 0.3);
}

interface NationTeam {
  name: string;
  flag: string;
  contenders: number;
  totalScore: number;
  medals: { gold: number; silver: number; bronze: number };
}

const DEFAULT_NATIONS: NationTeam[] = [
  { name: 'Spain', flag: '🇪🇸', contenders: 4120, totalScore: 3482000, medals: { gold: 124, silver: 98, bronze: 85 } },
  { name: 'Brazil', flag: '🇧🇷', contenders: 3950, totalScore: 3290400, medals: { gold: 110, silver: 92, bronze: 79 } },
  { name: 'Japan', flag: '🇯🇵', contenders: 3820, totalScore: 3180200, medals: { gold: 104, silver: 89, bronze: 72 } },
  { name: 'United States', flag: '🇺🇸', contenders: 3640, totalScore: 3012500, medals: { gold: 95, silver: 82, bronze: 68 } },
  { name: 'Germany', flag: '🇩🇪', contenders: 3210, totalScore: 2845000, medals: { gold: 88, silver: 74, bronze: 61 } },
  { name: 'France', flag: '🇫🇷', contenders: 2980, totalScore: 2610400, medals: { gold: 76, silver: 69, bronze: 55 } },
  { name: 'India', flag: '🇮🇳', contenders: 2890, totalScore: 2540000, medals: { gold: 71, silver: 65, bronze: 59 } },
  { name: 'United Kingdom', flag: '🇬🇧', contenders: 2750, totalScore: 2420000, medals: { gold: 65, silver: 58, bronze: 51 } },
];

export default function TournamentClient() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'roster' | 'playing' | 'results'>('roster');

  // Player registration
  const [nickname, setNickname] = useState('');
  const [selectedNation, setSelectedNation] = useState<NationTeam>(DEFAULT_NATIONS[0]);

  // Tournament questions (10 questions seeded by current week number)
  const currentWeekNumber = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + 1) / 7);
  }, []);

  const tournamentQuestions: EarthQuestion[] = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) =>
      getDailyEarthQuestion(`2026-W${currentWeekNumber}`, i)
    );
  }, [currentWeekNumber]);

  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // 10-second timer per question
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Social share toast
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function startTournament() {
    if (!nickname.trim()) {
      setNickname('Explorer');
    }
    setView('playing');
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    startQuestionTimer();
  }

  function startQuestionTimer() {
    setTimeLeft(10);
    setSelectedChoice(null);
    setIsLocked(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleTimeout() {
    setIsLocked(true);
    playWrong();
    setAnswers((prev) => [...prev, false]);
    setTimeout(() => advanceOrFinish(), 2000);
  }

  function handleAnswer(index: number) {
    if (isLocked) return;
    setIsLocked(true);
    setSelectedChoice(index);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const currentQ = tournamentQuestions[currentIndex];
    const isCorrect = index === currentQ.correctIndex;

    if (isCorrect) {
      playCorrect();
      // 1000 base + up to 500 speed bonus
      const earned = 1000 + timeLeft * 50;
      setScore((prev) => prev + earned);
      setAnswers((prev) => [...prev, true]);
    } else {
      playWrong();
      setAnswers((prev) => [...prev, false]);
    }

    setTimeout(() => advanceOrFinish(), 2000);
  }

  function advanceOrFinish() {
    if (currentIndex < tournamentQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      startQuestionTimer();
    } else {
      playTrophyFanfare();
      setView('results');
    }
  }

  // Awarded badge rank
  const badgeRank = useMemo(() => {
    if (score >= 8000) return { title: 'Diamond Planetary Ace', medal: '🥇', color: 'from-amber-400 to-yellow-200' };
    if (score >= 5000) return { title: 'Gold Continental Master', medal: '🥈', color: 'from-slate-300 to-slate-100' };
    return { title: 'Silver Global Explorer', medal: '🥉', color: 'from-amber-700 to-amber-500' };
  }, [score]);

  // Social share copy
  function getShareCopy(): string {
    return `🏆 MooEarth Global Tournament (Week #${currentWeekNumber})\n` +
      `I scored ${score.toLocaleString()} XP for Team ${selectedNation.flag} ${selectedNation.name}!\n` +
      `Rank: ${badgeRank.medal} ${badgeRank.title}\n` +
      `Can your country beat our score?\n` +
      `👉 https://mooearth.live/tournament`;
  }

  function handleShare() {
    const text = getShareCopy();
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `MooEarth Tournament — Team ${selectedNation.name}`,
        text,
        url: 'https://mooearth.live/tournament',
      }).catch(() => {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      });
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050716] text-white flex flex-col font-sans relative selection:bg-amber-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-amber-500/15 via-cyan-500/10 to-transparent blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[400px] bg-blue-600/10 blur-[130px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-[#090d22]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span>🏆</span>
          </div>
          <div className="leading-tight">
            <span className="font-extrabold tracking-wide text-sm bg-gradient-to-r from-amber-200 via-white to-cyan-300 bg-clip-text text-transparent">
              MooEarth Tournament
            </span>
            <span className="text-[10px] block font-mono text-amber-400 font-bold uppercase tracking-widest">
              Week #{currentWeekNumber} Global Cup
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-amber-300">
            <span>🌍</span>
            <span>28,400+ CONTENDERS</span>
          </div>
          <Link
            href="/party"
            className="hidden sm:inline-flex px-3 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 transition-colors"
          >
            ⚡ Classroom & Party
          </Link>
          <LanguageSelector compact={true} />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto w-full">
        {/* ============================================================== */}
        {/* VIEW 1: TOURNAMENT ROSTER & NATION PICKER */}
        {/* ============================================================== */}
        {view === 'roster' && (
          <div className="w-full max-w-3xl animate-fadeIn">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <span>🏆 High-Stakes Weekly Championship</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-amber-100 to-amber-400 bg-clip-text text-transparent mb-3">
                The Global Nations Cup
              </h1>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Represent your country, score points across 10 high-speed questions, and climb the international medal leaderboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
              {/* Left: Nation Selection */}
              <div className="md:col-span-6 bg-[#0c1026]/90 border border-white/15 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  1. Your Call-Sign
                </label>
                <input
                  type="text"
                  placeholder="e.g. CaptainAtlas, GeoNinja"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors mb-5"
                />

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  2. Choose Your Nation
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {DEFAULT_NATIONS.map((nation) => (
                    <button
                      key={nation.name}
                      onClick={() => setSelectedNation(nation)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                        selectedNation.name === nation.name
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{nation.flag}</span>
                        <span>{nation.name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-amber-300">
                        {nation.contenders.toLocaleString()} players
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={startTournament}
                  className="w-full mt-6 py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>🚀</span> Launch Championship (10 Questions)
                </button>
              </div>

              {/* Right: Current World Nations Standings */}
              <div className="md:col-span-6 bg-[#0c1026]/90 border border-white/15 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center justify-between">
                    <span>🌍 Live Nations Leaderboard</span>
                    <span className="font-mono text-[10px] text-emerald-400">WEEK #{currentWeekNumber}</span>
                  </h3>

                  <div className="space-y-2.5">
                    {DEFAULT_NATIONS.slice(0, 5).map((nation, idx) => (
                      <div
                        key={nation.name}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-slate-400 w-4">#{idx + 1}</span>
                          <span className="text-lg">{nation.flag}</span>
                          <span className="font-bold text-white">{nation.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-amber-300 font-bold">
                            {(nation.totalScore / 1000).toFixed(0)}k PTS
                          </span>
                          <span className="text-xs">🥇{nation.medals.gold}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 text-center font-medium">
                  Points you score today directly elevate your country&apos;s rank!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: 10-QUESTION CHAMPIONSHIP SPEEDRUN */}
        {/* ============================================================== */}
        {view === 'playing' && tournamentQuestions[currentIndex] && (
          <div className="w-full max-w-2xl animate-fadeIn">
            {/* Top Bar: Progress, Nation Flag & Live Timer */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedNation.flag}</span>
                <div>
                  <span className="text-xs font-extrabold text-white block">
                    Team {selectedNation.name}
                  </span>
                  <span className="font-mono text-[10px] text-amber-400">
                    Question {currentIndex + 1} of 10
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">XP</span>
                  <span className="font-mono text-sm font-extrabold text-amber-300">{score.toLocaleString()}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-full font-mono text-sm font-extrabold flex items-center gap-1.5 ${
                  timeLeft <= 3 ? 'bg-red-500/20 border border-red-500 text-red-400 animate-pulse' : 'bg-white/10 border border-white/15 text-white'
                }`}>
                  <span>⏱️</span>
                  <span>{timeLeft}s</span>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#0c1026]/95 border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-6">
              <span className="inline-block px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-cyan-300 uppercase mb-3">
                {tournamentQuestions[currentIndex].category}
              </span>
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-6 leading-snug">
                {tournamentQuestions[currentIndex].question}
              </h3>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tournamentQuestions[currentIndex].choices.map((opt, idx) => {
                  let btnStyle = 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200';
                  if (isLocked) {
                    if (idx === tournamentQuestions[currentIndex].correctIndex) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20';
                    } else if (idx === selectedChoice) {
                      btnStyle = 'bg-red-500/20 border-red-500 text-red-300';
                    } else {
                      btnStyle = 'opacity-40 border-transparent';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleAnswer(idx)}
                      className={`p-4 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span className="flex-1 pr-2">{opt}</span>
                      <span className="w-6 h-6 rounded-md bg-white/10 font-mono text-xs flex items-center justify-center shrink-0">
                        {['A', 'B', 'C', 'D'][idx]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Fun Fact Reveal */}
              {isLocked && tournamentQuestions[currentIndex].funFact && (
                <div className="mt-5 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-300 animate-fadeIn">
                  💡 {tournamentQuestions[currentIndex].funFact}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: TOURNAMENT RESULTS & MEDAL BADGE */}
        {/* ============================================================== */}
        {view === 'results' && (
          <div className="w-full max-w-lg animate-fadeIn text-center">
            <div className="p-8 rounded-3xl bg-[#0c1026]/95 border border-amber-500/30 shadow-2xl backdrop-blur-xl mb-6">
              <span className="text-5xl block mb-2">{badgeRank.medal}</span>
              <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold block mb-1">
                Championship Badge Unlocked
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                {badgeRank.title}
              </h2>
              <p className="text-xs text-slate-300 mb-6">
                You successfully defended Team {selectedNation.flag} {selectedNation.name} in Week #{currentWeekNumber}!
              </p>

              {/* Score Box */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Score</span>
                  <span className="text-2xl font-mono font-extrabold text-amber-300">
                    {score.toLocaleString()} XP
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Accuracy</span>
                  <span className="text-2xl font-mono font-extrabold text-emerald-400">
                    {answers.filter(Boolean).length} / 10
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleShare}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>📢</span> {copiedToast ? 'Scorecard Copied! ✅' : 'Share National Victory'}
                </button>
                <button
                  onClick={() => setView('roster')}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
                >
                  🔄 View Global Nations Standings
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
