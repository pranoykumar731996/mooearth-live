// ============================================================
// MooEarth Live — Stop The Earth Gameplay HUD
// Completely transparent during spin: The Globe IS the Button!
// ============================================================

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayEarthPhase } from '@/types';
import { StopTheEarthCandidate } from '@/engines/game/types';
import { CountryFlag } from '@/components/UI/CountryFlag';

interface StopTheEarthHUDProps {
  phase: PlayEarthPhase;
  onStart: () => void;
  onStop: () => void;
  onSelectCandidate: (candidate: StopTheEarthCandidate) => void;
  onNextRound: () => void;
  onRestart: () => void;
  onExit: () => void;
  onShare: () => void;
  round: number;
  maxRounds: number;
  timerSeconds: number;
  isSpinning: boolean;
  candidates: StopTheEarthCandidate[];
  selectedCandidate: StopTheEarthCandidate | null;
  stoppedCoordinate: { lat: number; lng: number } | null;
  resolvedLocation: StopTheEarthCandidate | null;
  distanceKm: number | null;
  accuracyPercent: number | null;
  roundScore: number;
  totalScore: number;
  streak: number;
  onPlaySound: () => void;
}

export default function StopTheEarthHUD({
  phase,
  onStart,
  onStop: _onStop, // No separate stop button: the 3D globe itself is the primary click target
  onSelectCandidate,
  onNextRound,
  onRestart,
  onExit,
  onShare,
  round,
  maxRounds,
  timerSeconds,
  isSpinning: _isSpinning,
  candidates,
  selectedCandidate,
  stoppedCoordinate,
  resolvedLocation,
  distanceKm,
  accuracyPercent,
  roundScore,
  totalScore,
  streak,
  onPlaySound,
}: StopTheEarthHUDProps) {
  // Format coordinate display cleanly
  const formatCoord = (coord: { lat: number; lng: number } | null) => {
    if (!coord) return '--° N, --° E';
    const latDir = coord.lat >= 0 ? 'N' : 'S';
    const lngDir = coord.lng >= 0 ? 'E' : 'W';
    return `${Math.abs(coord.lat).toFixed(2)}° ${latDir}, ${Math.abs(coord.lng).toFixed(2)}° ${lngDir}`;
  };

  // Get score tier badge
  const getScoreBadge = (dist: number | null) => {
    if (dist === null) return { label: 'STOPPED', color: 'from-cyan-500 to-blue-500' };
    if (dist < 15) return { label: '🎯 EARTHSHOT! PERFECT STOP', color: 'from-amber-400 to-yellow-500 text-black' };
    if (dist < 50) return { label: '🌟 BULLSEYE!', color: 'from-emerald-400 to-cyan-500 text-black' };
    if (dist < 150) return { label: '⚡ EXCEPTIONAL STOP', color: 'from-cyan-400 to-blue-500 text-white' };
    if (dist < 350) return { label: '📍 CLOSE STOP', color: 'from-blue-500 to-indigo-500 text-white' };
    if (dist < 800) return { label: '🔍 IN THE REGION', color: 'from-indigo-500 to-purple-500 text-white' };
    return { label: '🌐 GLOBAL ATTEMPT', color: 'from-gray-600 to-gray-700 text-white' };
  };

  const isSpinningPhase = phase === 'stop-the-earth-spin';

  return (
    <div className="fixed inset-0 pointer-events-none z-[50] flex flex-col justify-between p-3 sm:p-6 select-none font-sans overflow-hidden">
      {/* ───────────────── TOP HEADER & TIMER (ABOVE GLOBE) ───────────────── */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-2 pointer-events-none">
        {/* Top Status Bar with Exit & Score */}
        <div className="w-full flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onExit}
              className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-colors cursor-pointer shadow-lg"
            >
              ← Exit
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-cyan-950/70 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs font-black tracking-wide flex items-center gap-1.5 shadow-lg">
              <span>⏱️</span>
              <span>STOP THE EARTH</span>
            </div>
          </div>

          {/* Round & Score Pill */}
          <div className="flex items-center gap-2 pointer-events-none">
            {streak > 1 && (
              <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1 shadow-lg">
                <span>🔥</span>
                <span>{streak}x</span>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-lg">
              <span className="text-white/40">Score: </span>
              <span className="text-cyan-400 font-black">{totalScore.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Big Prominent Countdown Timer (Visually Above Globe, 100% Display-Only, NEVER intercepts clicks) */}
        {isSpinningPhase && (
          <motion.div
            key="spinning-timer-header"
            initial={{ opacity: 0, scale: 0.9, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center mt-2 pointer-events-none select-none"
          >
            <span className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight text-cyan-300 drop-shadow-[0_0_35px_rgba(0,229,255,0.85)]">
              {timerSeconds.toFixed(1)}s
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 mt-1 shadow-[0_0_20px_rgba(0,229,255,0.35)] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                STOP THE EARTH
              </span>
              <span className="text-[10px] text-white/30">|</span>
              <span className="text-[10px] font-bold text-white/70">Round {round} of {maxRounds}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ───────────────── CENTER VIEWPORT ─────────────────
          CRITICAL: During spinning phase, this center area is 100% EMPTY.
          NO overlay, NO card, NO button blocks the 3D rotating Globe.
          Only start, stopped/select, result, and summary cards render here.
      */}
      <div className="w-full max-w-md mx-auto my-auto pointer-events-none">
        <AnimatePresence mode="wait">
          {/* Phase 1: Start Screen */}
          {phase === 'stop-the-earth-start' && (
            <motion.div
              key="start-screen"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="glass rounded-3xl border border-cyan-500/30 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_60px_rgba(0,229,255,0.2)] backdrop-blur-2xl pointer-events-auto"
              style={{ background: 'linear-gradient(135deg, rgba(8,18,35,0.94) 0%, rgba(5,10,22,0.96) 100%)' }}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(0,229,255,0.25)]">
                ⏱️
              </div>
              <div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-100 to-indigo-300">
                  STOP THE EARTH
                </h3>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  The Earth rotates rapidly. Stop the planet by <strong className="text-cyan-300">CLICKING/TAPPING DIRECTLY ON THE GLOBE</strong>, then identify your landing coordinates!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 text-left">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-lg block">🌀</span>
                  <span className="text-[10px] font-bold text-white/80 block mt-1">Rapid Spin</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-lg block">🌎</span>
                  <span className="text-[10px] font-bold text-white/80 block mt-1">Tap Globe</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-lg block">📍</span>
                  <span className="text-[10px] font-bold text-white/80 block mt-1">Distance & XP</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={onStart}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(0,229,255,0.35)] cursor-pointer active:scale-95"
                >
                  START 5S ROTATION
                </button>
                <button
                  onClick={onExit}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Back to Modes
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase 2: Countdown */}
          {phase === 'stop-the-earth-countdown' && (
            <motion.div
              key="countdown"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.25, 1], opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center pointer-events-none select-none"
            >
              <span className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 drop-shadow-[0_0_40px_rgba(0,229,255,0.7)]">
                READY!
              </span>
            </motion.div>
          )}

          {/* Phase 4: Location Selection (Shown after globe is stopped) */}
          {(phase === 'stop-the-earth-stopped' || phase === 'stop-the-earth-select') && (
            <motion.div
              key="location-select"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-3xl border border-white/10 p-5 space-y-4 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl pointer-events-auto"
              style={{ background: 'linear-gradient(135deg, rgba(8,15,30,0.96) 0%, rgba(4,8,18,0.98) 100%)' }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    EARTH STOPPED
                  </span>
                  {timerSeconds > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-white/60 bg-white/5 border border-white/10">
                      ⏱ {timerSeconds.toFixed(1)}s
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-black text-white mt-1">Where did you stop?</h4>
                <p className="text-xs text-white/50 font-mono mt-0.5">
                  Coordinates: {formatCoord(stoppedCoordinate)}
                </p>
              </div>

              {/* 4 Geographic Candidate Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {candidates.map((cand) => (
                  <button
                    key={cand.id}
                    onClick={() => {
                      onPlaySound();
                      onSelectCandidate(cand);
                    }}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer group flex flex-col justify-between gap-1 ${
                      selectedCandidate?.id === cand.id
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-white text-xs group-hover:text-cyan-300 transition-colors">
                        {cand.name}
                      </span>
                      {cand.countryCode ? (
                        <CountryFlag flag={cand.countryCode} className="w-5 h-3.5 object-cover rounded shadow-sm shrink-0" />
                      ) : (
                        <span className="text-sm shrink-0">
                          {cand.type === 'ocean' ? '🌊' : cand.type === 'sea' ? '⚓' : cand.type === 'island' ? '🏝️' : cand.type === 'continent' ? '❄️' : '🌐'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/40 truncate">
                      {cand.type === 'ocean' || cand.type === 'sea' ? 'Maritime Basin' : cand.description || 'Global Location'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase 5: Round Result */}
          {phase === 'stop-the-earth-result' && (
            <motion.div
              key="round-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-3xl border border-cyan-500/30 p-5 sm:p-6 text-center space-y-4 shadow-[0_0_60px_rgba(0,229,255,0.25)] backdrop-blur-2xl pointer-events-auto"
              style={{ background: 'linear-gradient(135deg, rgba(8,18,35,0.96) 0%, rgba(5,10,22,0.98) 100%)' }}
            >
              {/* Badge */}
              {(() => {
                const b = getScoreBadge(distanceKm);
                return (
                  <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r ${b.color} shadow-lg`}>
                    {b.label}
                  </div>
                );
              })()}

              <div>
                <h4 className="text-xl font-black text-white">
                  {resolvedLocation?.name || 'Verified Location'}
                </h4>
                <p className="text-xs text-white/60 mt-1">
                  You stopped approx. <strong className="text-cyan-300">{distanceKm?.toLocaleString() ?? 0} km</strong> from target
                </p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-2 py-1">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase block">Accuracy</span>
                  <span className="text-lg font-black text-emerald-400">
                    {accuracyPercent ? `${accuracyPercent.toFixed(1)}%` : '98.5%'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-white/40 font-bold uppercase block">Points Earned</span>
                  <span className="text-lg font-black text-cyan-300">
                    +{roundScore.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={onNextRound}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-black font-black text-xs tracking-wider uppercase transition-all shadow-lg cursor-pointer active:scale-95"
                >
                  {round < maxRounds ? 'NEXT ROUND →' : 'VIEW FINAL SCORE →'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase 6: Game Summary */}
          {phase === 'stop-the-earth-summary' && (
            <motion.div
              key="summary-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-3xl border border-cyan-500/40 p-6 text-center space-y-4 shadow-[0_0_80px_rgba(0,229,255,0.3)] backdrop-blur-2xl pointer-events-auto"
              style={{ background: 'linear-gradient(135deg, rgba(8,18,35,0.98) 0%, rgba(3,8,18,0.99) 100%)' }}
            >
              <span className="text-5xl block">🏆</span>
              <div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">
                  MISSION COMPLETE!
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  You conquered all {maxRounds} rapid Earth rotations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                <span className="text-xs text-cyan-300/70 uppercase font-black tracking-wider block">Total Points</span>
                <span className="text-4xl font-black text-white block mt-1">
                  {totalScore.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onShare}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs tracking-wider uppercase transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>📤</span>
                  <span>SHARE SCORECARD</span>
                </button>
                <button
                  onClick={onRestart}
                  className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  PLAY AGAIN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ───────────────── BOTTOM FLOATING GUIDANCE (BELOW GLOBE) ───────────────── */}
      <div className="w-full text-center pointer-events-none pb-2 sm:pb-4 select-none">
        {isSpinningPhase ? (
          <motion.div
            key="spinning-instruction"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 backdrop-blur-md shadow-[0_0_35px_rgba(0,229,255,0.45)] animate-pulse"
          >
            <span className="text-xl">👇</span>
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
              TAP THE EARTH TO STOP
            </span>
          </motion.div>
        ) : (
          <span className="text-[11px] text-white/40 font-medium">
            MooEarth Live Play Earth Engine 2.0 · 100% Planetary Coordinates
          </span>
        )}
      </div>
    </div>
  );
}
