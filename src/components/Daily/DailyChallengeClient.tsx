'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { EarthQuestion } from '@/types';
import { getDailyEarthQuestion } from '@/data/questions';
import { COUNTRY_METADATA } from '@/data/questions/countryMetadata';
import { SupportedLocale, getTranslation } from '@/lib/i18n';
import StreakNotificationPrompt from '@/components/PWA/StreakNotificationPrompt';

// Calculate day index from reference epoch (Jan 1, 2026)
function getDailyNumber(date: Date = new Date()): number {
  const epoch = new Date('2026-01-01T00:00:00Z').getTime();
  const diffDays = Math.floor((date.getTime() - epoch) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

// Simple Web Audio sound synthesizers (zero external assets needed)
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
    // Ignore audio failures if restricted by browser policy
  }
}

function playCorrectSound() {
  playTone(523.25, 'sine', 0.15, 0);       // C5
  playTone(659.25, 'sine', 0.15, 0.08);    // E5
  playTone(783.99, 'sine', 0.25, 0.16);    // G5
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

interface StoredDailyResult {
  date: string;
  score: number;
  timeSeconds: number;
  answers: boolean[];
  completedAt: number;
}

export interface DailyChallengeClientProps {
  locale?: SupportedLocale;
}

export default function DailyChallengeClient({ locale = 'en' }: DailyChallengeClientProps = {}) {
  const dict = useMemo(() => getTranslation(locale), [locale]);
  const [mounted, setMounted] = useState(false);
  const [dateStr] = useState(getTodayDateStr);
  const dailyNumber = useMemo(() => getDailyNumber(), []);

  // 5 deterministic daily questions for today
  const questions: EarthQuestion[] = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => getDailyEarthQuestion(dateStr, i));
  }, [dateStr]);

  // Game state
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  
  // Timer & Scoring
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Social copy toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Countdown to next UTC midnight
  const [timeLeftToNext, setTimeLeftToNext] = useState('');

  useEffect(() => {
    setMounted(true);

    // Read stored streak and results
    try {
      const storedStreak = parseInt(localStorage.getItem('mooearth_daily_streak') || '0', 10);
      const storedBest = parseInt(localStorage.getItem('mooearth_daily_best_streak') || '0', 10);
      setStreak(storedStreak);
      setBestStreak(Math.max(storedStreak, storedBest));

      const savedToday = localStorage.getItem(`mooearth_daily_${dateStr}`);
      if (savedToday) {
        const parsed: StoredDailyResult = JSON.parse(savedToday);
        setAnswers(parsed.answers);
        setScore(parsed.score);
        setElapsedSeconds(parsed.timeSeconds);
        setGameState('completed');
      }
    } catch {
      // localStorage fallback
    }

    // Countdown timer for next challenge (midnight UTC)
    const updateCountdown = () => {
      const now = new Date();
      const nextUtcMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      const diffMs = nextUtcMidnight.getTime() - now.getTime();
      if (diffMs > 0) {
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setTimeLeftToNext(`${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [dateStr]);

  // Timer loop during gameplay
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

  function startDailyGame() {
    setGameState('playing');
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedIndex(null);
    setIsAnswerLocked(false);
    setElapsedSeconds(0);
    setScore(0);
  }

  function handleSelectAnswer(idx: number) {
    if (isAnswerLocked || gameState !== 'playing') return;

    setIsAnswerLocked(true);
    setSelectedIndex(idx);

    const currentQ = questions[currentIndex];
    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      playCorrectSound();
      // Scoring: 1,000 base + speed bonus (up to 500 bonus for answering fast)
      const speedBonus = Math.max(0, 500 - elapsedSeconds * 10);
      setScore(prev => prev + 1000 + speedBonus);
    } else {
      playWrongSound();
    }

    const updatedAnswers = [...answers, isCorrect];
    setAnswers(updatedAnswers);

    // Wait 1.4s to reveal answer & fun fact, then advance
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setSelectedIndex(null);
        setIsAnswerLocked(false);
      } else {
        // Finished all 5 questions
        finishGame(updatedAnswers);
      }
    }, 1400);
  }

  function finishGame(finalAnswers: boolean[]) {
    setGameState('completed');
    if (timerRef.current) clearInterval(timerRef.current);
    playVictorySound();

    // Calculate streak
    let newStreak = streak;
    const lastDate = localStorage.getItem('mooearth_daily_last_date');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;

    if (lastDate === yesterdayStr) {
      newStreak += 1;
    } else if (lastDate === dateStr) {
      // Already recorded streak today
    } else {
      newStreak = 1;
    }

    const newBest = Math.max(newStreak, bestStreak);
    setStreak(newStreak);
    setBestStreak(newBest);

    try {
      localStorage.setItem('mooearth_daily_streak', newStreak.toString());
      localStorage.setItem('mooearth_daily_best_streak', newBest.toString());
      localStorage.setItem('mooearth_daily_last_date', dateStr);

      const record: StoredDailyResult = {
        date: dateStr,
        score,
        timeSeconds: elapsedSeconds,
        answers: finalAnswers,
        completedAt: Date.now(),
      };
      localStorage.setItem(`mooearth_daily_${dateStr}`, JSON.stringify(record));
    } catch {
      // localStorage fallback
    }
  }

  // Generate Wordle-style emoji grid
  const emojiGrid = useMemo(() => {
    return answers.map(a => (a ? '🟩' : '🟥')).join('');
  }, [answers]);

  const correctCount = useMemo(() => {
    return answers.filter(Boolean).length;
  }, [answers]);

  function getShareText(): string {
    const baseUrl = locale === 'en' ? 'https://www.mooearth.live/daily' : `https://www.mooearth.live/${locale}/daily`;
    const shareUrl = `${baseUrl}?c=${dailyNumber}`;
    return `🌍 MooEarth Daily #${dailyNumber} — ${correctCount}/5 🟢\n` +
      `⏱️ ${elapsedSeconds}s | 🏆 ${score.toLocaleString()} XP | 🔥 ${streak}-Day Streak\n` +
      `${emojiGrid}\n` +
      `Can you beat my score?\n` +
      `👉 ${shareUrl}`;
  }

  async function handleShare() {
    const text = getShareText();
    const baseUrl = locale === 'en' ? 'https://www.mooearth.live/daily' : `https://www.mooearth.live/${locale}/daily`;
    const shareUrl = `${baseUrl}?c=${dailyNumber}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `MooEarth Daily #${dailyNumber}`,
          text,
          url: shareUrl,
        });
        showToast(dict.daily.copiedToast || 'Shared successfully!');
        return;
      } catch {
        // User cancelled or unsupported, fallback to copy
      }
    }
    copyToClipboard(text);
  }

  function copyToClipboard(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Scorecard copied to clipboard! 📋');
      }).catch(() => {
        showToast('Failed to copy. Please select and copy manually.');
      });
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  if (!mounted) return null;

  const currentQ = questions[currentIndex];
  const currentMeta = Object.values(COUNTRY_METADATA).find(m => m.name === currentQ?.country);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #140d2b 0%, #05040d 60%, #020204 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
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
          background: 'rgba(0, 229, 255, 0.95)',
          color: '#05040d',
          fontWeight: 700,
          fontSize: '14px',
          padding: '12px 24px',
          borderRadius: '9999px',
          boxShadow: '0 10px 30px rgba(0, 229, 255, 0.4)',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {toastMessage}
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <header style={{
        width: '100%',
        maxWidth: '680px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '28px',
      }}>
        <Link href="/" style={{
          color: '#94a3b8',
          textDecoration: 'none',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>←</span>
          <span>Back to Globe</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(236, 72, 153, 0.15)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#f472b6',
          }}>
            <span>🔥</span>
            <span>{streak} Day Streak</span>
          </div>

          <Link href="/play-earth" style={{
            color: '#00e5ff',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            background: 'rgba(0, 229, 255, 0.1)',
            padding: '4px 12px',
            borderRadius: '9999px',
            border: '1px solid rgba(0, 229, 255, 0.25)',
          }}>
            🎮 11+ Modes
          </Link>
        </div>
      </header>

      {/* Content Container */}
      <main style={{ width: '100%', maxWidth: '640px' }}>
        
        {/* ==================== STATE: INTRO ==================== */}
        {gameState === 'intro' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '72px', marginBottom: '16px', filter: 'drop-shadow(0 0 24px rgba(236, 72, 153, 0.5))' }}>
              🌍
            </div>

            <div style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '9999px',
              background: 'rgba(0, 229, 255, 0.12)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              color: '#00e5ff',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              MooEarth Daily #{dailyNumber}
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 6vw, 3.2rem)',
              fontWeight: 900,
              letterSpacing: '-0.5px',
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #ffffff 30%, #ec4899 70%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {dict.daily.title}
            </h1>

            <p style={{
              fontSize: '16px',
              color: '#94a3b8',
              lineHeight: 1.6,
              maxWidth: '480px',
              margin: '0 auto 32px',
            }}>
              {dict.daily.subtitle}
            </p>

            {/* Quick Overview Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '36px',
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px',
                borderRadius: '16px',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>❓</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>5</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Questions</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px',
                borderRadius: '16px',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>⏱️</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>Timed</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Speed Bonus</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px',
                borderRadius: '16px',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔥</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f472b6' }}>{streak}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{dict.daily.streakLabel}</div>
              </div>
            </div>

            <button
              onClick={startDailyGame}
              id="start-daily-challenge-btn"
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '18px 36px',
                fontSize: '18px',
                fontWeight: 800,
                color: '#05040d',
                background: 'linear-gradient(135deg, #00e5ff 0%, #38bdf8 50%, #ec4899 100%)',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 12px 30px rgba(0, 229, 255, 0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ▶ {dict.daily.startBtn}
            </button>
          </div>
        )}

        {/* ==================== STATE: PLAYING ==================== */}
        {gameState === 'playing' && currentQ && (
          <div>
            {/* Question Progress Dots & Timer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {questions.map((_, i) => {
                  const answered = answers[i] !== undefined;
                  const isCorrect = answers[i] === true;
                  const isCurrent = i === currentIndex;
                  return (
                    <div
                      key={i}
                      style={{
                        width: '32px',
                        height: '8px',
                        borderRadius: '4px',
                        background: answered
                          ? isCorrect ? '#22c55e' : '#ef4444'
                          : isCurrent ? '#00e5ff' : 'rgba(255, 255, 255, 0.15)',
                        transition: 'all 0.3s ease',
                        boxShadow: isCurrent ? '0 0 10px rgba(0, 229, 255, 0.6)' : 'none',
                      }}
                    />
                  );
                })}
              </div>

              <div style={{
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '4px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
              }}>
                ⏱️ {elapsedSeconds}s
              </div>
            </div>

            {/* Question Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '28px 24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              marginBottom: '20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}>
                <span style={{ fontSize: '24px' }}>{currentMeta?.flag || '🌍'}</span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  {currentQ.country} · Question {currentIndex + 1} of 5
                </span>
              </div>

              <h2 style={{
                fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)',
                fontWeight: 800,
                lineHeight: 1.4,
                margin: '0 0 24px',
                color: '#ffffff',
              }}>
                {currentQ.question.replace(/^\[.*?\]\s*/, '')}
              </h2>

              {/* 4 Multiple Choice Options */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '12px',
              }}>
                {currentQ.choices.map((choice, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCorrect = idx === currentQ.correctIndex;
                  let bg = 'rgba(255, 255, 255, 0.05)';
                  let border = 'rgba(255, 255, 255, 0.12)';
                  let textColor = '#ffffff';

                  if (isAnswerLocked) {
                    if (isCorrect) {
                      bg = 'rgba(34, 197, 94, 0.25)';
                      border = '#22c55e';
                      textColor = '#4ade80';
                    } else if (isSelected && !isCorrect) {
                      bg = 'rgba(239, 68, 68, 0.25)';
                      border = '#ef4444';
                      textColor = '#f87171';
                    } else {
                      bg = 'rgba(255, 255, 255, 0.02)';
                      border = 'rgba(255, 255, 255, 0.05)';
                      textColor = '#64748b';
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
                        color: textColor,
                        fontSize: '16px',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: isAnswerLocked ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{choice}</span>
                      {isAnswerLocked && isCorrect && <span style={{ fontSize: '18px' }}>✓</span>}
                      {isAnswerLocked && isSelected && !isCorrect && <span style={{ fontSize: '18px' }}>✗</span>}
                    </button>
                  );
                })}
              </div>

              {/* Educational Fun Fact Reveal */}
              {isAnswerLocked && currentQ.funFact && (
                <div style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  background: 'rgba(0, 229, 255, 0.08)',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#7dd3fc',
                  lineHeight: 1.5,
                }}>
                  💡 <strong>Did You Know?</strong> {currentQ.funFact}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== STATE: COMPLETED ==================== */}
        {gameState === 'completed' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(24px)',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '8px' }}>
              {correctCount === 5 ? '🏆' : correctCount >= 3 ? '🎉' : '🌍'}
            </div>

            <h2 style={{
              fontSize: '28px',
              fontWeight: 900,
              margin: '0 0 6px',
              background: 'linear-gradient(135deg, #00e5ff, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {correctCount === 5 ? 'Flawless Knowledge!' : correctCount >= 3 ? 'Great Work, Explorer!' : 'Challenge Completed!'}
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 28px' }}>
              MooEarth Daily #{dailyNumber} · {dateStr}
            </p>

            {/* Performance Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              marginBottom: '28px',
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '14px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#22c55e' }}>{correctCount}/5</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Accuracy</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '14px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>{elapsedSeconds}s</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Time</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '14px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>{score.toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>XP Earned</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '14px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ec4899' }}>🔥 {streak}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Streak</div>
              </div>
            </div>

            {/* Wordle-Style Zero-Spoiler Emoji Grid Card */}
            <div style={{
              background: '#090914',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'left',
              fontFamily: 'monospace',
            }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 700, letterSpacing: '1px' }}>
                OFFICIAL SPOILER-FREE SCORECARD
              </div>
              <div style={{ fontSize: '15px', color: '#ffffff', lineHeight: 1.6 }}>
                🌍 MooEarth Daily #{dailyNumber} — {correctCount}/5 🟢<br />
                ⏱️ {elapsedSeconds}s | 🏆 {score.toLocaleString()} XP | 🔥 {streak}-Day Streak<br />
                <span style={{ fontSize: '22px', letterSpacing: '4px' }}>{emojiGrid}</span>
              </div>
            </div>

            {/* Viral Share Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              <button
                onClick={handleShare}
                id="share-scorecard-btn"
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #00e5ff 0%, #38bdf8 100%)',
                  color: '#05040d',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(0, 229, 255, 0.3)',
                }}
              >
                <span>📤</span>
                <span>Share Scorecard (WhatsApp / X / Messages)</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => copyToClipboard(getShareText())}
                  style={{
                    padding: '12px 18px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  📋 Copy Grid
                </button>

                <Link
                  href={`/challenge/daily-${dateStr.replace(/-/g, '')}?score=${score}&time=${elapsedSeconds}&streak=${streak}&name=Challenger`}
                  style={{
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(245, 158, 11, 0.2))',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    borderRadius: '12px',
                    color: '#f472b6',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>⚔️</span>
                  <span>1v1 Challenge</span>
                </Link>
              </div>
            </div>

            {/* Next Challenge Countdown */}
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              fontSize: '13px',
              color: '#94a3b8',
            }}>
              Next Synchronized Daily Challenge in: <strong style={{ color: '#00e5ff', fontFamily: 'monospace' }}>{timeLeftToNext}</strong>
            </div>
          </div>
        )}
      </main>

      {/* PWA Streak Retention Alert Prompt */}
      <StreakNotificationPrompt streak={streak} />
    </div>
  );
}
