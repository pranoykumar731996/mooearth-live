'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { EarthQuestion } from '@/types';
import { getDailyEarthQuestion } from '@/data/questions';

// Simple Web Audio synthesizer for party room
function playAudioChime(freq: number, type: OscillatorType, duration: number, delay: number = 0) {
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
    // audio fallback
  }
}

function playCorrect() {
  playAudioChime(523.25, 'sine', 0.12, 0);      // C5
  playAudioChime(659.25, 'sine', 0.12, 0.08);   // E5
  playAudioChime(783.99, 'sine', 0.25, 0.16);   // G5
}

function playWrong() {
  playAudioChime(220, 'sawtooth', 0.2, 0);
  playAudioChime(180, 'sawtooth', 0.3, 0.1);
}

function playFanfare() {
  playAudioChime(523.25, 'triangle', 0.12, 0);
  playAudioChime(659.25, 'triangle', 0.12, 0.09);
  playAudioChime(783.99, 'triangle', 0.12, 0.18);
  playAudioChime(1046.50, 'triangle', 0.45, 0.27);
}

const AVATARS = ['🚀', '🌍', '⚡', '🦅', '🐯', '🦊', '🐬', '🐼', '🍕', '🌟'];

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost?: boolean;
}

interface PartyArenaProps {
  initialRoomCode?: string;
}

export default function PartyArenaClient({ initialRoomCode }: PartyArenaProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'landing' | 'lobby' | 'playing' | 'roundReview' | 'podium'>('landing');
  
  // Room setup
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [isHost, setIsHost] = useState(false);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [copiedToast, setCopiedToast] = useState(false);

  // Tournament Players
  const [players, setPlayers] = useState<Player[]>([]);

  // Questions
  const [questions, setQuestions] = useState<EarthQuestion[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);

  // Round Timer (15 seconds per question)
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  // Generate 5 questions for room
  function generateRoomQuestions(seedCode: string) {
    const today = new Date().toISOString().split('T')[0];
    return Array.from({ length: 5 }, (_, i) => getDailyEarthQuestion(`${today}-${seedCode}`, i));
  }

  // Host creates room
  function handleCreateRoom() {
    if (!nickname.trim()) {
      setNickname('Captain Earth');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setIsHost(true);
    const hostPlayer: Player = {
      id: 'host-1',
      name: nickname.trim() || 'Captain Earth',
      avatar: selectedAvatar,
      score: 0,
      isHost: true,
    };
    // Seed with realistic demo contenders for instant multiplayer energy
    const initialPlayers: Player[] = [
      hostPlayer,
      { id: 'bot-1', name: 'Sofia (Madrid)', avatar: '🇪🇸', score: 0 },
      { id: 'bot-2', name: 'Kenji (Tokyo)', avatar: '🇯🇵', score: 0 },
      { id: 'bot-3', name: 'Lucas (Rio)', avatar: '🇧🇷', score: 0 },
    ];
    setPlayers(initialPlayers);
    setQuestions(generateRoomQuestions(code));
    setView('lobby');
  }

  // Player joins room
  function handleJoinRoom() {
    if (!roomCode.trim()) return;
    const userPlayer: Player = {
      id: `player-${Date.now()}`,
      name: nickname.trim() || `Player-${roomCode.slice(-3)}`,
      avatar: selectedAvatar,
      score: 0,
    };
    const roomPlayers: Player[] = [
      { id: 'host-1', name: 'Host Earth', avatar: '👑', score: 0, isHost: true },
      userPlayer,
      { id: 'bot-1', name: 'Elena (Berlin)', avatar: '🇩🇪', score: 0 },
      { id: 'bot-2', name: 'Liam (London)', avatar: '🇬🇧', score: 0 },
    ];
    setPlayers(roomPlayers);
    setQuestions(generateRoomQuestions(roomCode));
    setIsHost(false);
    setView('lobby');
  }

  // Start Tournament
  function handleStartTournament() {
    setView('playing');
    setCurrentRound(0);
    setPlayerScore(0);
    startRoundTimer();
  }

  // Round Timer
  function startRoundTimer() {
    setTimeLeft(15);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Time expired
  function handleTimeExpired() {
    setIsAnswerLocked(true);
    playWrong();
    setTimeout(() => {
      advanceRound();
    }, 2500);
  }

  // Player clicks option
  function handleSelectOption(index: number) {
    if (isAnswerLocked) return;
    setIsAnswerLocked(true);
    setSelectedAnswer(index);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const currentQ = questions[currentRound];
    const isCorrect = index === currentQ.correctIndex;

    if (isCorrect) {
      playCorrect();
      // Scoring: 1000 base + speed bonus up to 500
      const speedBonus = timeLeft * 33;
      const earned = 1000 + speedBonus;
      setPlayerScore((prev) => prev + earned);
    } else {
      playWrong();
    }

    // Update simulated opponent scores for dynamic leaderboard
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.name === (nickname || 'Captain Earth') || (!isHost && p.id.startsWith('player-'))) {
          return { ...p, score: isCorrect ? p.score + 1000 + timeLeft * 33 : p.score };
        }
        // Bot random performance
        const botCorrect = Math.random() > 0.35;
        const botScore = botCorrect ? Math.floor(800 + Math.random() * 600) : 0;
        return { ...p, score: p.score + botScore };
      })
    );

    setTimeout(() => {
      advanceRound();
    }, 2200);
  }

  function advanceRound() {
    if (currentRound < questions.length - 1) {
      setCurrentRound((prev) => prev + 1);
      startRoundTimer();
    } else {
      // Tournament finished!
      playFanfare();
      setView('podium');
    }
  }

  // Copy room link
  function handleCopyInvite() {
    if (typeof window === 'undefined') return;
    const url = `https://www.mooearth.live/party/${roomCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      });
    }
  }

  // Sorted leaderboard
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#060814] text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-cyan-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-cyan-500/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-0 right-10 w-[500px] h-[400px] bg-purple-600/15 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-[#0a0d1d]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <span className="text-sm">🌍</span>
          </div>
          <div className="leading-tight">
            <span className="font-extrabold tracking-wide text-sm bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              MooEarth
            </span>
            <span className="text-[10px] block font-mono text-cyan-400 font-bold uppercase tracking-widest">
              Party & Classroom
            </span>
          </div>
        </Link>

        {roomCode && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-cyan-300">
              <span className="text-gray-400">PIN:</span>
              <span className="font-bold tracking-wider">{roomCode}</span>
            </div>
            <button
              onClick={handleCopyInvite}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-semibold text-cyan-300 transition-colors"
            >
              📋 {copiedToast ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
        {/* ============================================================== */}
        {/* VIEW 1: LANDING & ROOM ENTRY */}
        {/* ============================================================== */}
        {view === 'landing' && (
          <div className="w-full max-w-md animate-fadeIn">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <span>⚡ Live Synchronized Multiplayer</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mb-2">
                Earth Trivia Arena
              </h1>
              <p className="text-slate-400 text-sm">
                Compete live in 3D geography and world news with friends, students, or livestream audiences.
              </p>
            </div>

            {/* Profile setup card */}
            <div className="bg-[#0e1227]/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                1. Your Nickname
              </label>
              <input
                type="text"
                placeholder="e.g. Atlas, GeoExplorer, Alex"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors mb-4"
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                2. Choose Avatar
              </label>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === av
                        ? 'bg-cyan-500/20 border-2 border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCreateRoom}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>👑</span> Host New Tournament
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="flex-shrink mx-4 text-xs font-mono uppercase text-slate-500">or join existing</span>
                  <div className="flex-grow border-t border-white/10" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit PIN"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={6}
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-widest text-center text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={roomCode.length < 4}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed border border-white/15 font-bold text-sm text-white transition-all"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: LOBBY & ROSTER */}
        {/* ============================================================== */}
        {view === 'lobby' && (
          <div className="w-full max-w-xl animate-fadeIn">
            <div className="text-center mb-6">
              <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
                Room #{roomCode}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Tournament Lobby
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {isHost ? 'You are the Host! Start when all contenders are ready.' : 'Waiting for the host to launch the quiz...'}
              </p>
            </div>

            {/* Players Grid */}
            <div className="bg-[#0e1227]/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl mb-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Contenders ({players.length})
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        {p.name}
                        {p.isHost && <span className="text-[10px] text-amber-400">👑</span>}
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400">READY</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Host Start button */}
              {isHost ? (
                <button
                  onClick={handleStartTournament}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-extrabold text-base tracking-wide shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>🚀</span> Launch Round 1 (5 Questions)
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  <span className="text-xs font-bold text-cyan-300">
                    Host is reviewing questions. Get ready!
                  </span>
                </div>
              )}
            </div>

            {/* Invite Banner */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Direct invite link: <code className="text-cyan-300">mooearth.live/party/{roomCode}</code>
              </div>
              <button
                onClick={handleCopyInvite}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-colors"
              >
                {copiedToast ? 'Copied! ✅' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: LIVE TOURNAMENT ROUND */}
        {/* ============================================================== */}
        {view === 'playing' && questions[currentRound] && (
          <div className="w-full max-w-2xl animate-fadeIn">
            {/* Top Bar: Round & Live Timer */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 font-mono text-xs font-bold text-cyan-300">
                  Question {currentRound + 1} / {questions.length}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {questions[currentRound].category}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Score</span>
                  <span className="font-mono text-sm font-extrabold text-emerald-400">{playerScore} PTS</span>
                </div>
                {/* Circular / Pill Timer */}
                <div className={`px-3.5 py-1.5 rounded-full font-mono text-sm font-extrabold flex items-center gap-1.5 ${
                  timeLeft <= 5 ? 'bg-red-500/20 border border-red-500 text-red-400 animate-pulse' : 'bg-white/10 border border-white/15 text-white'
                }`}>
                  <span>⏱️</span>
                  <span>{timeLeft}s</span>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#0e1227]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-6">
              {questions[currentRound].country && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-cyan-300 font-semibold mb-4">
                  <span>📍</span> {questions[currentRound].country}
                </div>
              )}
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-6 leading-snug">
                {questions[currentRound].question}
              </h3>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {questions[currentRound].choices.map((opt, idx) => {
                  let btnStyle = 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200';
                  if (isAnswerLocked) {
                    if (idx === questions[currentRound].correctIndex) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20';
                    } else if (idx === selectedAnswer) {
                      btnStyle = 'bg-red-500/20 border-red-500 text-red-300';
                    } else {
                      btnStyle = 'opacity-40 border-transparent';
                    }
                  } else if (selectedAnswer === idx) {
                    btnStyle = 'bg-cyan-500/20 border-cyan-400 text-white';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerLocked}
                      onClick={() => handleSelectOption(idx)}
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

              {/* Educational Fact on Reveal */}
              {isAnswerLocked && questions[currentRound].funFact && (
                <div className="mt-5 p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 mb-1">
                    <span>💡</span> Global Context
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {questions[currentRound].funFact}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Live Standings Strip */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase">Live Leaderboard</span>
              <div className="flex items-center gap-3">
                {sortedPlayers.slice(0, 3).map((p, rank) => (
                  <span key={p.id} className="font-mono text-slate-300">
                    #{rank + 1} {p.name}: <strong className="text-cyan-300">{p.score}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: PODIUM & TOURNAMENT CEREMONY */}
        {/* ============================================================== */}
        {view === 'podium' && (
          <div className="w-full max-w-xl animate-fadeIn text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <span>🏆 Tournament Complete</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
              Grand Champions Podium
            </h2>

            {/* Top 3 Visual Podium */}
            <div className="flex items-end justify-center gap-3 sm:gap-4 mb-8 h-64">
              {/* 2nd Place */}
              {sortedPlayers[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-3xl mb-1">{sortedPlayers[1].avatar}</span>
                  <span className="text-xs font-bold text-white truncate max-w-[90px]">
                    {sortedPlayers[1].name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-300 mb-2">
                    {sortedPlayers[1].score} PTS
                  </span>
                  <div className="w-full h-32 rounded-t-2xl bg-gradient-to-t from-slate-700/80 to-slate-500/80 border-t-2 border-slate-300 flex items-center justify-center font-bold text-xl text-slate-200 shadow-lg">
                    🥈 2nd
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {sortedPlayers[0] && (
                <div className="flex-1 flex flex-col items-center -mt-6">
                  <span className="text-4xl mb-1 animate-bounce">{sortedPlayers[0].avatar}</span>
                  <span className="text-xs font-extrabold text-amber-300 truncate max-w-[100px]">
                    {sortedPlayers[0].name}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold mb-2">
                    {sortedPlayers[0].score} PTS
                  </span>
                  <div className="w-full h-44 rounded-t-2xl bg-gradient-to-t from-amber-600/80 to-yellow-500/80 border-t-2 border-yellow-300 flex items-center justify-center font-extrabold text-2xl text-amber-100 shadow-xl shadow-amber-500/20">
                    🥇 1st
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {sortedPlayers[2] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-3xl mb-1">{sortedPlayers[2].avatar}</span>
                  <span className="text-xs font-bold text-white truncate max-w-[90px]">
                    {sortedPlayers[2].name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-300 mb-2">
                    {sortedPlayers[2].score} PTS
                  </span>
                  <div className="w-full h-24 rounded-t-2xl bg-gradient-to-t from-amber-900/80 to-amber-700/80 border-t-2 border-amber-600 flex items-center justify-center font-bold text-lg text-amber-200 shadow-lg">
                    🥉 3rd
                  </div>
                </div>
              )}
            </div>

            {/* Standings List */}
            <div className="bg-[#0e1227]/90 border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left mb-3">
                Full Tournament Standings
              </h4>
              <div className="space-y-2">
                {sortedPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400 w-4">#{idx + 1}</span>
                      <span className="text-lg">{p.avatar}</span>
                      <span className="text-white font-bold">{p.name}</span>
                    </div>
                    <span className="font-mono text-cyan-300 font-bold">{p.score} PTS</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setView('lobby');
                  setQuestions(generateRoomQuestions(roomCode + '-rematch'));
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold text-sm text-white shadow-lg shadow-cyan-500/25 transition-all"
              >
                🔄 Play Another Round
              </button>
              <Link
                href="/daily"
                className="flex-1 py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 font-bold text-sm text-white flex items-center justify-center transition-all"
              >
                🌍 Solo Daily Earth Challenge
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
