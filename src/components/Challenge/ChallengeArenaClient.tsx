'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { EarthQuestion } from '@/types';
import { getDailyEarthQuestion } from '@/data/questions';

// Simple Web Audio sounds for challenge mode
function playChallengeTone(freq: number, type: OscillatorType, duration: number, delay: number = 0) {
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
    // Ignore audio errors
  }
}

interface ChallengeArenaClientProps {
  challengeId: string;
}

export default function ChallengeArenaClient({ challengeId }: ChallengeArenaClientProps) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Challenger parameters from URL
  const challengerName = searchParams.get('name') || searchParams.get('user') || 'Alex';
  const targetScore = parseInt(searchParams.get('score') || '4500', 10);
  const targetTime = parseInt(searchParams.get('time') || '35', 10);
  const challengerStreak = parseInt(searchParams.get('streak') || '3', 10);

  // Parse date string from challengeId (e.g. daily-20261005) or fallback to today
  const isDaily = challengeId.startsWith('daily-');
  const dateStr = useMemo(() => {
    const match = challengeId.match(/daily-(\d{4})(\d{2})(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }, [challengeId]);

  // Questions for this challenge (same seed as challenger)
  const questions: EarthQuestion[] = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => getDailyEarthQuestion(dateStr, i));
  }, [dateStr]);

  // Gameplay state
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);

  // Timer & Scoring
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [playerScore, setPlayerScore] = useState(0);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  function startChallenge() {
    setGameState('playing');
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedIndex(null);
    setIsAnswerLocked(false);
    setElapsedSeconds(0);
    setPlayerScore(0);
  }

  function handleSelectAnswer(idx: number) {
    if (isAnswerLocked || gameState !== 'playing') return;

    setIsAnswerLocked(true);
    setSelectedIndex(idx);

    const currentQ = questions[currentIndex];
    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      playChallengeTone(523.25, 'sine', 0.15);
      playChallengeTone(659.25, 'sine', 0.15, 0.08);
      const speedBonus = Math.max(0, 500 - elapsedSeconds * 10);
      setPlayerScore(prev => prev + 1000 + speedBonus);
    } else {
      playChallengeTone(220, 'sawtooth', 0.25);
    }

    const updatedAnswers = [...answers, isCorrect];
    setAnswers(updatedAnswers);

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setSelectedIndex(null);
        setIsAnswerLocked(false);
      } else {
        setGameState('result');
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1300);
  }

  const isPlayerWinner = playerScore > targetScore || (playerScore === targetScore && elapsedSeconds <= targetTime);

  function getShareResultText(): string {
    const verdict = isPlayerWinner ? 'I WON 🏆' : 'CLOSE BATTLE ⚔️';
    return `⚔️ 1v1 Battle Result on MooEarth Live!\n` +
      `Me: ${playerScore.toLocaleString()} XP (${elapsedSeconds}s) vs ${challengerName}: ${targetScore.toLocaleString()} XP (${targetTime}s)\n` +
      `Verdict: ${verdict}\n` +
      `Can you beat us both?\n` +
      `👉 https://mooearth.live/challenge/${challengeId}?score=${playerScore}&time=${elapsedSeconds}&name=Player`;
  }

  function copyResult() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(getShareResultText()).then(() => {
        setToastMessage('Battle result copied to clipboard! 📋');
        setTimeout(() => setToastMessage(null), 3000);
      });
    }
  }

  if (!mounted) return null;

  const currentQ = questions[currentIndex];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #1e0b36 0%, #080314 60%, #020108 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          zIndex: 9999,
          background: 'rgba(236, 72, 153, 0.95)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '14px',
          padding: '12px 24px',
          borderRadius: '9999px',
          boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)',
        }}>
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <header style={{
        width: '100%',
        maxWidth: '680px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '28px',
      }}>
        <Link href="/daily" style={{
          color: '#94a3b8',
          textDecoration: 'none',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>←</span>
          <span>Daily Challenge</span>
        </Link>

        <div style={{
          fontSize: '12px',
          fontWeight: 800,
          color: '#f472b6',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          background: 'rgba(236, 72, 153, 0.12)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          padding: '4px 12px',
          borderRadius: '9999px',
        }}>
          1v1 Head-to-Head Arena
        </div>
      </header>

      {/* Main Container */}
      <main style={{ width: '100%', maxWidth: '640px' }}>
        
        {/* ==================== STATE: LOBBY ==================== */}
        {gameState === 'lobby' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚔️</div>

            <h1 style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
              fontWeight: 900,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #f472b6 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {challengerName} Challenged You!
            </h1>

            <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.5, margin: '0 0 32px' }}>
              Can you beat {challengerName}&apos;s score on the exact same 5 world questions?
            </p>

            {/* Challenger Scorecard Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '2px solid rgba(236, 72, 153, 0.35)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(236, 72, 153, 0.15)',
              marginBottom: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>👤</span>
                <span style={{ fontSize: '18px', fontWeight: 800 }}>{challengerName}&apos;s Record to Beat</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px 8px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b' }}>{targetScore.toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Target XP</div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px 8px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#38bdf8' }}>{targetTime}s</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Time Taken</div>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px 8px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#f472b6' }}>🔥 {challengerStreak}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Streak</div>
                </div>
              </div>
            </div>

            <button
              onClick={startChallenge}
              id="accept-challenge-btn"
              style={{
                width: '100%',
                maxWidth: '420px',
                padding: '18px 36px',
                fontSize: '18px',
                fontWeight: 900,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 12px 30px rgba(236, 72, 153, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              ⚡ Accept Challenge & Play
            </button>
          </div>
        )}

        {/* ==================== STATE: PLAYING ==================== */}
        {gameState === 'playing' && currentQ && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {questions.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '32px',
                      height: '8px',
                      borderRadius: '4px',
                      background: answers[i] !== undefined
                        ? answers[i] ? '#22c55e' : '#ef4444'
                        : i === currentIndex ? '#f472b6' : 'rgba(255, 255, 255, 0.15)',
                    }}
                  />
                ))}
              </div>

              <div style={{
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 700,
                color: elapsedSeconds > targetTime ? '#ef4444' : '#38bdf8',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 12px',
                borderRadius: '8px',
              }}>
                ⏱️ {elapsedSeconds}s <span style={{ color: '#64748b' }}>(Target: {targetTime}s)</span>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '28px 24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', marginBottom: '12px' }}>
                Question {currentIndex + 1} of 5 · {currentQ.country}
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 24px', lineHeight: 1.4 }}>
                {currentQ.question.replace(/^\[.*?\]\s*/, '')}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {currentQ.choices.map((choice, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCorrect = idx === currentQ.correctIndex;
                  let bg = 'rgba(255, 255, 255, 0.05)';
                  let border = 'rgba(255, 255, 255, 0.12)';
                  let color = '#ffffff';

                  if (isAnswerLocked) {
                    if (isCorrect) {
                      bg = 'rgba(34, 197, 94, 0.25)';
                      border = '#22c55e';
                      color = '#4ade80';
                    } else if (isSelected && !isCorrect) {
                      bg = 'rgba(239, 68, 68, 0.25)';
                      border = '#ef4444';
                      color = '#f87171';
                    } else {
                      color = '#64748b';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswerLocked}
                      onClick={() => handleSelectAnswer(idx)}
                      style={{
                        padding: '16px 20px',
                        background: bg,
                        border: `2px solid ${border}`,
                        borderRadius: '14px',
                        color,
                        fontSize: '16px',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: isAnswerLocked ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{choice}</span>
                      {isAnswerLocked && isCorrect && <span>✓</span>}
                      {isAnswerLocked && isSelected && !isCorrect && <span>✗</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== STATE: RESULT ==================== */}
        {gameState === 'result' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: `2px solid ${isPlayerWinner ? '#22c55e' : '#ef4444'}`,
            borderRadius: '24px',
            padding: '36px 24px',
            textAlign: 'center',
            boxShadow: `0 25px 60px ${isPlayerWinner ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}>
            <div style={{ fontSize: '64px', marginBottom: '8px' }}>
              {isPlayerWinner ? '🏆' : '💀'}
            </div>

            <h2 style={{
              fontSize: '32px',
              fontWeight: 900,
              margin: '0 0 8px',
              color: isPlayerWinner ? '#22c55e' : '#ef4444',
            }}>
              {isPlayerWinner ? 'VICTORY!' : 'DEFEATED!'}
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '15px', margin: '0 0 28px' }}>
              {isPlayerWinner
                ? `You outperformed ${challengerName}! Amazing job.`
                : `${challengerName} won this round. Ready for a rematch?`}
            </p>

            {/* Head-to-Head Comparison Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '28px',
            }}>
              {/* You */}
              <div style={{
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                padding: '20px 16px',
                borderRadius: '16px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#00e5ff', textTransform: 'uppercase', marginBottom: '8px' }}>
                  YOU
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
                  {playerScore.toLocaleString()} XP
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>⏱️ {elapsedSeconds}s</div>
              </div>

              {/* Opponent */}
              <div style={{
                background: 'rgba(236, 72, 153, 0.08)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                padding: '20px 16px',
                borderRadius: '16px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f472b6', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {challengerName.toUpperCase()}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
                  {targetScore.toLocaleString()} XP
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>⏱️ {targetTime}s</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={copyResult}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #00e5ff 0%, #ec4899 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                📤 Share Battle Result
              </button>

              <button
                onClick={startChallenge}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                🔄 Rematch
              </button>

              <Link
                href="/daily"
                style={{
                  color: '#00e5ff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  marginTop: '12px',
                }}
              >
                Go to Official Daily Challenge →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
