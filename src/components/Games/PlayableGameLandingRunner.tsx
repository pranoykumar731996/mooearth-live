'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { EarthQuestion } from '@/types';
import { getChallengeShareUrl, getShareText, getWhatsAppShareUrl, getXShareUrl } from '@/utils/share';

// Simple Web Audio synthesized sounds for browser gameplay (zero audio assets needed)
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
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    }, delay * 1000);
  } catch {
    // Graceful silent fallback if Web Audio is blocked
  }
}

function playCorrectSound() {
  playTone(523.25, 'sine', 0.15, 0);    // C5
  playTone(659.25, 'sine', 0.15, 0.08); // E5
  playTone(783.99, 'sine', 0.25, 0.16); // G5
}

function playWrongSound() {
  playTone(220, 'sawtooth', 0.25, 0);
  playTone(196, 'sawtooth', 0.35, 0.12);
}

function playVictorySound() {
  playTone(523.25, 'triangle', 0.15, 0);
  playTone(659.25, 'triangle', 0.15, 0.1);
  playTone(783.99, 'triangle', 0.15, 0.2);
  playTone(1046.50, 'triangle', 0.4, 0.3);
}

interface PlayableGameLandingRunnerProps {
  initialQuestions: EarthQuestion[];
  gameTitle: string;
  gameSlug: string;
  gameMode: string;
  countryName?: string;
  badge?: string;
}

export default function PlayableGameLandingRunner({
  initialQuestions,
  gameTitle,
  gameSlug,
  gameMode,
  countryName,
  badge = 'Interactive Play Earth Trial',
}: PlayableGameLandingRunnerProps) {
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<EarthQuestion[]>(initialQuestions);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);

  // Timer & Scoring
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [score, setScore] = useState(0);
  const [challengeId, setChallengeId] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setChallengeId(`${gameMode}-${Date.now().toString(36)}`);
  }, [gameMode]);

  useEffect(() => {
    if (gameState === 'playing') {
      const startTime = Date.now() - elapsedSeconds * 1000;
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, elapsedSeconds]);

  function startGame() {
    setGameState('playing');
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedIndex(null);
    setIsAnswerLocked(false);
    setElapsedSeconds(0);
    setScore(0);
    setChallengeId(`${gameMode}-${Date.now().toString(36)}`);
  }

  function handleSelectAnswer(idx: number) {
    if (isAnswerLocked || gameState !== 'playing') return;

    setIsAnswerLocked(true);
    setSelectedIndex(idx);

    const currentQ = questions[currentIndex];
    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      playCorrectSound();
      // Scoring: 1,000 base + speed bonus (up to 500 bonus for fast response)
      const speedBonus = Math.max(0, 500 - elapsedSeconds * 8);
      setScore(prev => prev + 1000 + speedBonus);
    } else {
      playWrongSound();
    }

    const updatedAnswers = [...answers, isCorrect];
    setAnswers(updatedAnswers);

    // Advance to next question after 1.4s
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setSelectedIndex(null);
        setIsAnswerLocked(false);
      } else {
        setGameState('completed');
        if (timerRef.current) clearInterval(timerRef.current);
        playVictorySound();
      }
    }, 1400);
  }

  // Wordle-style zero-spoiler emoji scorecard
  const emojiGrid = useMemo(() => {
    return answers.map(a => (a ? '🟩' : '🟥')).join('');
  }, [answers]);

  const correctCount = useMemo(() => {
    return answers.filter(Boolean).length;
  }, [answers]);

  // Formatted scorecard text
  function getScorecardText(): string {
    const accuracy = `${correctCount}/${questions.length}`;
    const pageUrl = `https://www.mooearth.live/${gameSlug}`;
    return `🌍 MooEarth ${gameTitle}\n` +
      `Score: ${score.toLocaleString()} XP | ${accuracy} Correct | ⏱️ ${elapsedSeconds}s\n` +
      `${emojiGrid}\n` +
      `Can you beat my score?\n` +
      `👉 ${pageUrl}?score=${score}&time=${elapsedSeconds}`;
  }

  // Viral challenge link pointing to 1v1 Arena
  const challengeUrl = useMemo(() => {
    return `https://www.mooearth.live/challenge/${challengeId}?score=${score}&time=${elapsedSeconds}&name=Player`;
  }, [challengeId, score, elapsedSeconds]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function copyScorecard() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(getScorecardText()).then(() => {
        showToast('Scorecard copied to clipboard! 📋');
      }).catch(() => {
        showToast('Failed to copy. Please select and copy manually.');
      });
    }
  }

  function copyChallengeLink() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(challengeUrl).then(() => {
        showToast('1v1 Challenge link copied to clipboard! ⚔️');
      }).catch(() => {
        showToast('Failed to copy link.');
      });
    }
  }

  async function shareNative() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `MooEarth ${gameTitle}`,
          text: getScorecardText(),
          url: challengeUrl,
        });
        showToast('Shared successfully!');
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    copyScorecard();
  }

  if (!mounted) {
    return (
      <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] text-center min-h-[320px] flex items-center justify-center">
        <div className="text-white/40 text-sm font-mono animate-pulse">Initializing Play Earth Game Engine...</div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="w-full relative" id="playable-game-viewport">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-cyan-400 text-black font-extrabold text-sm shadow-2xl shadow-cyan-500/50 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* ==================== STATE 1: INTRO / LOBBY ==================== */}
      {gameState === 'intro' && (
        <div className="p-6 sm:p-10 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/60 shadow-2xl space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs">
            <span>🎮</span>
            <span>{badge}</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Play {gameTitle} Now
            </h2>
            <p className="text-sm text-white/70 max-w-xl mx-auto">
              {countryName
                ? `Test your knowledge with authentic Play Earth questions for ${countryName}. 5 timed questions with real-time feedback and global leaderboard scoring.`
                : `Test your global knowledge across 5 randomized Play Earth challenges. Beat the clock, rack up speed bonuses, and challenge your friends.`}
            </p>
          </div>

          {/* Quick Match HUD */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto py-2">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Rounds</span>
              <span className="text-lg font-black text-white">{questions.length} Questions</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Per Question</span>
              <span className="text-lg font-black text-cyan-400">15 Seconds</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Max Reward</span>
              <span className="text-lg font-black text-emerald-400">7,500 XP</span>
            </div>
          </div>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              id="start-game-btn"
              onClick={startGame}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-black text-base shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              🚀 Start Game Now
            </button>
            <Link
              href="/play-earth"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition-colors text-center"
            >
              🌍 Launch 3D Globe Mode
            </Link>
          </div>
        </div>
      )}

      {/* ==================== STATE 2: ACTIVE GAMEPLAY ==================== */}
      {gameState === 'playing' && currentQ && (
        <div className="p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-black/80 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                Q{currentIndex + 1}/{questions.length}
              </span>
              <span className="text-xs text-white/50 font-mono uppercase">
                {currentQ.country || 'Global'} &bull; {currentQ.category || 'Geography'}
              </span>
            </div>

            {/* Progress indicators */}
            <div className="flex items-center gap-1.5">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-2 rounded-full transition-all ${
                    answers[i] !== undefined
                      ? answers[i] ? 'bg-emerald-400' : 'bg-rose-500'
                      : i === currentIndex
                        ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                        : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            {/* Live Timer */}
            <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <span>⏱️</span>
              <span className={elapsedSeconds > 12 ? 'text-rose-400' : 'text-cyan-400'}>
                {elapsedSeconds}s
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {currentQ.question.replace(/^\[.*?\]\s*/, '')}
            </h3>
          </div>

          {/* Choices Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.choices.map((choice, idx) => {
              const isSelected = selectedIndex === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnClasses = 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-cyan-500/40 text-white';

              if (isAnswerLocked) {
                if (isCorrect) {
                  btnClasses = 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold';
                } else if (isSelected && !isCorrect) {
                  btnClasses = 'border-rose-500 bg-rose-500/20 text-rose-200 line-through';
                } else {
                  btnClasses = 'border-white/5 bg-white/[0.01] text-white/30 cursor-not-allowed';
                }
              }

              const letter = String.fromCharCode(65 + idx);

              return (
                <button
                  key={idx}
                  type="button"
                  id={`choice-btn-${idx}`}
                  disabled={isAnswerLocked}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${btnClasses}`}
                >
                  <span className="w-6 h-6 rounded-md bg-black/40 border border-white/10 text-xs font-mono flex items-center justify-center shrink-0 mt-0.5 text-white/60">
                    {letter}
                  </span>
                  <span className="text-sm font-semibold flex-1 leading-snug">{choice}</span>
                  {isAnswerLocked && isCorrect && <span className="text-emerald-400 font-bold">✓</span>}
                  {isAnswerLocked && isSelected && !isCorrect && <span className="text-rose-400 font-bold">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Educational Fun Fact Reveal */}
          {isAnswerLocked && (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <span>💡</span>
                <span>Correct: {currentQ.choices[currentQ.correctIndex]}</span>
              </div>
              {currentQ.funFact && (
                <p className="text-white/70 pl-5 leading-relaxed">
                  {currentQ.funFact}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== STATE 3: COMPLETED & VIRAL LOOP ==================== */}
      {gameState === 'completed' && (
        <div className="p-6 sm:p-10 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-black to-black shadow-2xl space-y-8 text-center" id="game-finished-screen">
          {/* Trophy Header */}
          <div className="space-y-2">
            <div className="text-6xl animate-bounce">
              {correctCount === questions.length ? '🏆' : correctCount >= 3 ? '🎉' : '🌍'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {correctCount === questions.length
                ? 'Flawless Knowledge Victory!'
                : correctCount >= 3
                  ? 'Great Job, World Explorer!'
                  : 'Game Complete!'}
            </h2>
            <p className="text-xs text-white/50 font-mono">
              {gameTitle} &bull; {countryName || 'Global Trial'}
            </p>
          </div>

          {/* Performance Stats HUD */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Accuracy</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                {correctCount}/{questions.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Time</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-400">
                {elapsedSeconds}s
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] text-white/40 font-mono uppercase block">Total XP</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400" id="final-score-val">
                {score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Wordle-Style Zero-Spoiler Scorecard Card */}
          <div className="p-5 rounded-2xl bg-black/80 border border-cyan-500/30 text-left font-mono max-w-lg mx-auto shadow-inner" id="viral-sharecard">
            <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold mb-2 uppercase tracking-wider">
              <span>Official Scorecard</span>
              <span>No Spoilers</span>
            </div>
            <div className="text-xs sm:text-sm text-white/90 leading-relaxed">
              <div>🌍 MooEarth {gameTitle}</div>
              <div>🏆 {score.toLocaleString()} XP &bull; {correctCount}/{questions.length} Correct &bull; ⏱️ {elapsedSeconds}s</div>
              <div className="text-xl sm:text-2xl tracking-widest my-2 select-all">{emojiGrid}</div>
              <div className="text-[11px] text-white/50 truncate">👉 https://www.mooearth.live/{gameSlug}</div>
            </div>
          </div>

          {/* Viral Action Buttons */}
          <div className="space-y-3 max-w-lg mx-auto">
            {/* Primary Action: Share Scorecard */}
            <button
              type="button"
              id="share-scorecard-btn"
              onClick={shareNative}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>📤</span>
              <span>Share Scorecard (WhatsApp / X / Copy)</span>
            </button>

            {/* Friend Challenge Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="copy-challenge-link-btn"
                onClick={copyChallengeLink}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>📋</span>
                <span>Copy 1v1 Link</span>
              </button>

              <Link
                href={`/challenge/${challengeId}?score=${score}&time=${elapsedSeconds}&name=Player`}
                id="friend-challenge-btn"
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-300 font-bold text-xs sm:text-sm border border-pink-500/30 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>⚔️</span>
                <span>Play 1v1 Arena</span>
              </Link>
            </div>

            {/* Social Direct Links */}
            <div className="flex items-center justify-center gap-2 pt-1 text-xs">
              <a
                href={getWhatsAppShareUrl(getScorecardText(), challengeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
              >
                💬 WhatsApp
              </a>
              <a
                href={getXShareUrl(getScorecardText(), challengeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-colors"
              >
                🐦 X (Twitter)
              </a>
              <button
                type="button"
                onClick={copyScorecard}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors cursor-pointer"
              >
                📋 Copy Text
              </button>
            </div>

            {/* Rematch & More Games */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                id="play-again-btn"
                onClick={startGame}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                🔄 Play Another Round
              </button>
              <Link
                href="/play-earth"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-colors"
              >
                🌍 Full 3D Earth Globe
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
