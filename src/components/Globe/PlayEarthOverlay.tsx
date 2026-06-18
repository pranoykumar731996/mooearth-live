// ============================================================
// Play Earth — Interactive Game Overlay
// ============================================================
// Premium, cinematic quiz game HUD. Renders as a fixed overlay
// above the globe. Manages category selection, timed questions,
// result display, streaks, XP, and badge animations.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EarthQuestion, PlayerGameState, QuizCategory, PlayEarthPhase, GameBadge } from '@/types';
import { QUIZ_CATEGORIES, XP_REWARDS, calculateLevel } from '@/data/questions';
import { findCountryMeta } from '@/data/questions/countryMetadata';
import { trackEvent } from '@/services/analytics';
import { shareContent } from '@/utils/share';
import { BRANDING } from '@/config/branding';
import { checkUnlockBadges } from '@/config/badges';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const TIMER_SECONDS = 15;
const STREAK_BONUS_MULTIPLIER = 1.5; // 50% bonus XP at streak ≥3

interface PlayEarthOverlayProps {
  isActive: boolean;
  selectedCountry: string | null;
  onClose: () => void;
  onPlaySound: () => void;
  onCorrectSound: () => void;
  onWrongSound: () => void;
  onTimerTick: (urgency: number) => void;
  onLevelUp: () => void;
  username: string;
}

/** Load game state from localStorage */
function loadGameState(username: string): PlayerGameState {
  if (typeof window === 'undefined') return createDefaultState(username);
  try {
    const raw = localStorage.getItem(`mooearth_quiz_progress_${username}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.answeredIds || !Array.isArray(parsed.answeredIds)) {
        parsed.answeredIds = [];
      }
      if (!parsed.answeredQuestionIds || !Array.isArray(parsed.answeredQuestionIds)) {
        parsed.answeredQuestionIds = [...parsed.answeredIds];
      }
      if (!parsed.recentQuestions || !Array.isArray(parsed.recentQuestions)) {
        parsed.recentQuestions = [];
      }
      if (!parsed.recentCountryQuestions || !Array.isArray(parsed.recentCountryQuestions)) {
        parsed.recentCountryQuestions = [];
      }
      return parsed;
    }
  } catch (e) {}
  return createDefaultState(username);
}

function createDefaultState(username: string): PlayerGameState {
  return {
    username, xp: 0, level: 1, streak: 0, bestStreak: 0,
    totalCorrect: 0, totalAnswered: 0, answeredIds: [],
    answeredQuestionIds: [], recentQuestions: [], recentCountryQuestions: [],
    countriesExplored: [], badges: [],
  };
}

/** Save game state to localStorage */
function saveGameState(state: PlayerGameState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`mooearth_quiz_progress_${state.username}`, JSON.stringify(state));
  } catch (e) {}
}

export default function PlayEarthOverlay({
  isActive, selectedCountry, onClose, onPlaySound,
  onCorrectSound, onWrongSound, onTimerTick, onLevelUp, username,
}: PlayEarthOverlayProps) {
  const [phase, setPhase] = useState<PlayEarthPhase>('intro');
  const [gameState, setGameState] = useState<PlayerGameState>(() => loadGameState(username));
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory>('geography');
  const [currentQuestion, setCurrentQuestion] = useState<EarthQuestion | null>(null);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [showXpFloat, setShowXpFloat] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [mixedWrongCount, setMixedWrongCount] = useState(0);
  const [showShareToast, setShowShareToast] = useState(false);
  const [unlockedBadgeToShow, setUnlockedBadgeToShow] = useState<GameBadge | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShareChallenge = async () => {
    if (!selectedCountry) return;
    
    const refQuery = username ? `?ref=${encodeURIComponent(username)}` : '';
    const shareText = `🌍 I scored ${gameState.streak} correct in a row on the ${selectedCountry} Quiz! Can you beat me?`;
    const playEarthUrl = `/play-earth${refQuery}`;
    
    const didShare = await shareContent({
      title: `Play Earth Challenge — ${BRANDING.name}`,
      text: shareText,
      url: playEarthUrl
    });

    if (!didShare) {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load game state when username changes synchronously in render
  const [prevUsername, setPrevUsername] = useState(username);
  if (username !== prevUsername) {
    setPrevUsername(username);
    setGameState(loadGameState(username));
  }

  // Reset quiz state on active/country changes synchronously in render
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  const [prevSelectedCountry, setPrevSelectedCountry] = useState<string | null>(null);

  if (isActive !== prevIsActive || selectedCountry !== prevSelectedCountry) {
    setPrevIsActive(isActive);
    setPrevSelectedCountry(selectedCountry);
    
    if (isActive) {
      setPhase(selectedCountry ? 'category-select' : 'intro');
      setIsLoadingQuestion(false);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimer(TIMER_SECONDS);
      setXpGained(0);
      setShowXpFloat(false);
      setLeveledUp(false);
      setMixedWrongCount(0);
    }
  }

  // Reset audio and clear timers on active/country changes
  useEffect(() => {
    if (!isActive) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    if (selectedCountry) {
      onPlaySound();
    }
  }, [isActive, selectedCountry, onPlaySound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
      if (levelUpTimeoutRef.current) clearTimeout(levelUpTimeoutRef.current);
    };
  }, []);

  const handleAnswerRef = useRef<(index: number) => void>(() => {});

  const onTimerTickRef = useRef<(urgency: number) => void>(onTimerTick);
  useEffect(() => {
    onTimerTickRef.current = onTimerTick;
  }, [onTimerTick]);

  // Timer countdown during question phase
  useEffect(() => {
    if (phase !== 'question' || selectedAnswer !== null) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleAnswerRef.current(-1); // Time's up
          return 0;
        }
        if (prev <= 6) {
          const urgency = (6 - prev) / 5;
          onTimerTickRef.current(urgency);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, selectedAnswer]);

  /** Start a new question for the selected country/category from our hybrid API */
  const startQuestion = useCallback(async (category: QuizCategory) => {
    if (!selectedCountry) return;
    setSelectedCategory(category);
    setIsLoadingQuestion(true);
    onPlaySound();

    // Track category selection click
    trackEvent('category', 'click', `quiz_${category}`);

    console.log(`[PLAY EARTH DEBUG] startQuestion: Selected Country="${selectedCountry}", Category="${category}"`);

    const startTime = Date.now();
    try {
      const res = await fetch('/api/quiz/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: selectedCountry,
          category,
          username,
          answeredIds: [
            ...new Set([
              ...(gameState.answeredIds || []),
              ...(gameState.answeredQuestionIds || []),
              ...(gameState.recentQuestions || []),
              ...(gameState.recentCountryQuestions || [])
            ])
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch next question. Status: ${res.status}`);
      }

      const data = await res.json();
      const q = data.question;
      console.log(`[PLAY EARTH DEBUG] startQuestion success. Loaded Question:`, q);

      // Enforce minimum display time for the cinematic loader (800ms)
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
      }

      if (q) {
        setCurrentQuestion(q);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setXpGained(0);
        setShowXpFloat(false);
        setLeveledUp(false);
        // Dynamic timer based on difficulty (Task 6 timer validation: 10s, 15s, 20s)
        const duration = q.difficulty === 'easy' ? 20 : q.difficulty === 'hard' ? 10 : 15;
        setTimer(duration);
        setPhase('question');
      } else {
        setPhase('summary');
        trackEvent('play_earth', 'round_completed');
      }
    } catch (err) {
      console.error('Error fetching question:', err);
      // Wait out remaining loader duration on error
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
      }
      setPhase('summary');
      trackEvent('play_earth', 'round_completed');
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [selectedCountry, gameState, username, onPlaySound]);

  /** Handle answer selection */
  const handleAnswer = useCallback((index: number) => {
    if (!currentQuestion || selectedAnswer !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = index === currentQuestion.correctIndex;
    setSelectedAnswer(index);
    setIsCorrect(correct);

    // Track question response in analytics
    trackEvent('play_earth', 'question_answered', undefined, undefined, {
      correct,
      category: selectedCategory,
      country: selectedCountry || 'Global'
    });

    if (selectedCategory === 'mixed' && !correct) {
      setMixedWrongCount(prev => prev + 1);
    }

    setGameState(prev => {
      const next = { ...prev };
      next.totalAnswered++;
      next.answeredIds = [...prev.answeredIds, currentQuestion.id];
      next.answeredQuestionIds = [...(prev.answeredQuestionIds || []), currentQuestion.id];

      const recent = [...(prev.recentQuestions || [])];
      if (!recent.includes(currentQuestion.id)) {
        recent.push(currentQuestion.id);
      }
      if (recent.length > 15) {
        recent.shift();
      }
      next.recentQuestions = recent;

      const recentCountry = [...(prev.recentCountryQuestions || [])];
      if (!recentCountry.includes(currentQuestion.id)) {
        recentCountry.push(currentQuestion.id);
      }
      if (recentCountry.length > 10) {
        recentCountry.shift();
      }
      next.recentCountryQuestions = recentCountry;

      if (correct) {
        next.totalCorrect++;
        next.streak++;
        if (next.streak > next.bestStreak) next.bestStreak = next.streak;

        // Calculate XP
        let xp = XP_REWARDS[currentQuestion.difficulty] || 100;
        if (next.streak >= 3) xp = Math.floor(xp * STREAK_BONUS_MULTIPLIER);
        // Time bonus: faster answers get bonus (adjusted for dynamic question duration)
        const qDuration = currentQuestion.difficulty === 'easy' ? 20 : currentQuestion.difficulty === 'hard' ? 10 : 15;
        const timeBonus = Math.floor((timer / qDuration) * 50);
        xp += timeBonus;
        next.xp += xp;
        setXpGained(xp);
        setShowXpFloat(true);

        // Level check
        const newLevel = calculateLevel(next.xp);
        if (newLevel > next.level) {
          next.level = newLevel;
          setLeveledUp(true);
          if (levelUpTimeoutRef.current) clearTimeout(levelUpTimeoutRef.current);
          levelUpTimeoutRef.current = setTimeout(() => onLevelUp(), 300);
        }

        onCorrectSound();
      } else {
        next.streak = 0;
        onWrongSound();
      }

      // Track explored countries
      if (selectedCountry && !next.countriesExplored.includes(selectedCountry)) {
        next.countriesExplored = [...next.countriesExplored, selectedCountry];
      }

      // Check badges unlock
      const checkedBadges = checkUnlockBadges(next, selectedCategory, selectedCountry || undefined);
      if (checkedBadges.length > (next.badges || []).length) {
        const newUnlocks = checkedBadges.filter(
          cb => !(next.badges || []).some(nb => nb.id === cb.id)
        );
        if (newUnlocks.length > 0) {
          setUnlockedBadgeToShow(newUnlocks[0]);
        }
        next.badges = checkedBadges;
      }

      next.lastPlayedAt = Date.now();
      saveGameState(next);

      // Sync XP/level updates to Firestore if authenticated
      if (typeof window !== 'undefined' && auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        updateDoc(userRef, {
          xp: next.xp,
          level: next.level
        }).catch(err => console.warn('[PlayEarthOverlay] Failed to sync XP to Firestore:', err));
      }

      return next;
    });

    // Auto-advance after showing result
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    answerTimeoutRef.current = setTimeout(() => {
      setPhase('result');
    }, 800);
  }, [currentQuestion, selectedAnswer, timer, selectedCountry, selectedCategory, onCorrectSound, onWrongSound, onLevelUp]);

  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  /** Continue to next question or go back to category select */
  const handleContinue = useCallback(() => {
    onPlaySound();
    if (selectedCategory === 'mixed') {
      if (mixedWrongCount >= 3) {
        setMixedWrongCount(0);
        setPhase('category-select');
        trackEvent('play_earth', 'round_completed');
      } else {
        startQuestion('mixed');
      }
    } else {
      setPhase('category-select');
      trackEvent('play_earth', 'round_completed');
    }
  }, [onPlaySound, selectedCategory, mixedWrongCount, startQuestion]);

  /** Try another country */
  const handleExploreMore = useCallback(() => {
    onPlaySound();
    setMixedWrongCount(0);
    setPhase('intro');
  }, [onPlaySound]);

  if (!isActive) return null;

  const countryMeta = selectedCountry ? findCountryMeta(selectedCountry) : null;
  const timerUrgent = timer <= 5;
  const timerCritical = timer <= 3;
  const accuracy = gameState.totalAnswered > 0
    ? Math.round((gameState.totalCorrect / gameState.totalAnswered) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[45] pointer-events-none" id="play-earth-overlay">
      {/* Toast Alert */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-32 left-1/2 -translate-x-1/2 z-[110] py-2.5 px-5 rounded-full bg-emerald-500/20 border border-emerald-500/35 text-center text-xs font-bold text-emerald-200 shadow-lg pointer-events-auto"
          >
            📋 Challenge link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
      {/* Click-blocking backdrop when quiz is active (phase !== 'intro') (Task 8 Mobile Audit) */}
      {phase !== 'intro' && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[1.5px] pointer-events-auto" onClick={(e) => {
          e.stopPropagation();
        }} />
      )}

      {/* Top HUD Bar — Always visible */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[46] pointer-events-auto"
      >
        <div className="glass px-5 py-2.5 rounded-full border border-emerald-500/30 flex items-center gap-3
                        shadow-[0_0_25px_rgba(0,255,136,0.15)]">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
          <span className="text-[10px] text-emerald-400 uppercase tracking-[0.25em] font-black">
            PLAY EARTH MODE
          </span>
          <span className="text-white/20">|</span>
          <span className="text-xs text-white/80 font-bold">
            ⭐ {gameState.xp.toLocaleString()} XP
          </span>
          <span className="text-white/20">|</span>
          <span className="text-xs text-white/80 font-bold">
            Lv.{gameState.level}
          </span>
          {gameState.streak > 0 && (
            <>
              <span className="text-white/20">|</span>
              <span className="text-xs text-orange-400 font-black">
                🔥 {gameState.streak} Streak
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onClose}
        className="fixed top-24 right-6 z-[47] w-10 h-10 rounded-full glass border border-white/10
                   flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10
                   transition-all pointer-events-auto cursor-pointer"
      >
        ✕
      </motion.button>

      {/* ═══════════════ INTRO PHASE ═══════════════ */}
      <AnimatePresence mode="wait">
        {isLoadingQuestion && (
          <motion.div
            key="loading-challenge"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto"
          >
            <div className="glass rounded-3xl border border-cyan-500/30 p-8 text-center shadow-[0_0_60px_rgba(0,163,255,0.2)]">
              <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-cyan-500/10 border-t-cyan-400 animate-spin" />
                <span className="absolute inset-1.5 rounded-full border-2 border-emerald-500/10 border-b-emerald-400 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                <span className="text-2xl animate-pulse">🛰️</span>
              </div>
              <h3 className="text-lg font-black text-white tracking-wider mb-2">
                LOADING EARTH CHALLENGE
              </h3>
              <p className="text-xs text-cyan-400/80 uppercase tracking-widest font-black animate-pulse">
                Establishing uplink to {selectedCountry}...
              </p>
            </div>
          </motion.div>
        )}

        {!isLoadingQuestion && phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[46] flex items-center justify-center pointer-events-none"
          >
            <div className="text-center pointer-events-auto">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl mb-6"
              >
                🌍
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3
                             bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
                TAP ANY COUNTRY
              </h2>
              <p className="text-sm text-white/50 max-w-xs mx-auto">
                Click on any country on the globe to begin your quiz adventure
              </p>

              {/* Stats ribbon */}
              <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
                <div className="glass px-4 py-2 rounded-xl border border-white/10 text-center">
                  <div className="text-lg font-black text-white">{gameState.countriesExplored.length}</div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Countries</div>
                </div>
                <div className="glass px-4 py-2 rounded-xl border border-white/10 text-center">
                  <div className="text-lg font-black text-white">{gameState.totalCorrect}</div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Correct</div>
                </div>
                <div className="glass px-4 py-2 rounded-xl border border-white/10 text-center">
                  <div className="text-lg font-black text-white">{accuracy}%</div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Accuracy</div>
                </div>
                <div className="glass px-4 py-2 rounded-xl border border-white/10 text-center">
                  <div className="text-lg font-black text-orange-400">🔥 {gameState.bestStreak}</div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Best Streak</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ CATEGORY SELECT ═══════════════ */}
        {!isLoadingQuestion && phase === 'category-select' && selectedCountry && (
          <motion.div
            key="category"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto"
          >
            <div className="glass rounded-3xl border border-white/10 p-6
                            shadow-[0_0_60px_rgba(0,0,0,0.5)]">
              {/* Country header */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{countryMeta?.flag || '🌍'}</span>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedCountry}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    {countryMeta?.continent || 'Choose a category'}
                  </p>
                </div>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {QUIZ_CATEGORIES.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => startQuestion(cat.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl
                               bg-white/5 border border-white/5 hover:bg-white/10
                               hover:border-white/15 transition-all cursor-pointer group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                    <span className="text-[10px] font-bold text-white/70 group-hover:text-white transition-colors">
                      {cat.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Back to explore */}
              <button
                onClick={handleExploreMore}
                className="mt-4 w-full py-2 text-[10px] text-white/30 uppercase tracking-widest
                           font-bold hover:text-white/60 transition-colors cursor-pointer"
              >
                ← Choose another country
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ QUESTION PHASE ═══════════════ */}
        {!isLoadingQuestion && phase === 'question' && currentQuestion && (
          <motion.div
            key="question"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto"
          >
            <div className={`glass rounded-3xl border p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)]
                            ${selectedAnswer !== null
                              ? isCorrect
                                ? 'border-emerald-500/40'
                                : 'border-red-500/40 animate-[card-shake_0.5s_ease-in-out]'
                              : 'border-white/10'
                            }`}>

              {/* Temporary Audit Diagnostics (Task 4) */}
              <div className="mb-4 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[9px] text-white/40">
                <span>🔍 Question Found: <strong className={currentQuestion ? 'text-emerald-400' : 'text-red-400'}>{currentQuestion ? 'TRUE' : 'FALSE'}</strong></span>
                <span>🆔 ID: <strong className="text-cyan-400 font-mono">{currentQuestion?.id || 'none'}</strong></span>
                <span>✨ Rendered: <strong className="text-emerald-400">TRUE</strong></span>
              </div>

              {/* Timer + Country header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{countryMeta?.flag || '🌍'}</span>
                  <div>
                    <span className="text-xs font-bold text-white/80">{selectedCountry}</span>
                    <span className="text-[9px] text-white/30 ml-2 uppercase tracking-wider">
                      {currentQuestion.category}
                    </span>
                  </div>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border
                                ${timerCritical
                                  ? 'border-red-500/60 bg-red-500/15 animate-[timer-heartbeat_0.6s_ease-in-out_infinite]'
                                  : timerUrgent
                                    ? 'border-amber-500/40 bg-amber-500/10'
                                    : 'border-white/10 bg-white/5'
                                }`}>
                  <span className={`text-lg font-black tabular-nums
                                   ${timerCritical ? 'text-red-400' : timerUrgent ? 'text-amber-400' : 'text-white'}`}>
                    {timer}
                  </span>
                  <span className="text-[9px] text-white/40 uppercase font-bold">sec</span>
                </div>
              </div>

              {/* Difficulty badge + Mixed Challenge Lives */}
              <div className="mb-3 flex items-center justify-between">
                <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full
                                 ${currentQuestion.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-400' :
                                   currentQuestion.difficulty === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                                   'bg-red-500/15 text-red-400'}`}>
                  {currentQuestion.difficulty} • +{XP_REWARDS[currentQuestion.difficulty]} XP
                </span>
                {selectedCategory === 'mixed' && (
                  <div className="flex gap-1 items-center bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-black mr-1">LIVES:</span>
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <span key={idx} className="text-xs">
                        {idx < (3 - mixedWrongCount) ? '❤️' : '🖤'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Question */}
              <h3 className="text-base sm:text-lg font-bold text-white mb-5 leading-snug">
                {currentQuestion.question}
              </h3>

              {/* Answer Choices */}
              <div className="space-y-2.5">
                {currentQuestion.choices.map((choice, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrectChoice = i === currentQuestion.correctIndex;
                  const showResult = selectedAnswer !== null;

                  let choiceStyle = 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20';
                  if (showResult) {
                    if (isCorrectChoice) {
                      choiceStyle = 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_15px_rgba(0,255,136,0.1)]';
                    } else if (isSelected && !isCorrect) {
                      choiceStyle = 'bg-red-500/15 border-red-500/40 shadow-[0_0_15px_rgba(255,60,60,0.1)]';
                    } else {
                      choiceStyle = 'bg-white/[0.02] border-white/5 opacity-50';
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => selectedAnswer === null && handleAnswer(i)}
                      disabled={selectedAnswer !== null}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition-all duration-200
                                 flex items-center gap-3 cursor-pointer ${choiceStyle}
                                 ${selectedAnswer === null ? 'active:scale-[0.98]' : ''}`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0
                                       ${showResult && isCorrectChoice ? 'bg-emerald-500/30 text-emerald-300' :
                                         showResult && isSelected && !isCorrect ? 'bg-red-500/30 text-red-300' :
                                         'bg-white/10 text-white/50'}`}>
                        {showResult && isCorrectChoice ? '✓' :
                         showResult && isSelected && !isCorrect ? '✗' :
                         String.fromCharCode(65 + i)}
                      </span>
                      <span className={`text-sm font-medium
                                       ${showResult && isCorrectChoice ? 'text-emerald-300' :
                                         showResult && isSelected && !isCorrect ? 'text-red-300' :
                                         'text-white/80'}`}>
                        {choice}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* XP Float Animation */}
              <AnimatePresence>
                {showXpFloat && (
                  <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -40, scale: 1.2 }}
                    exit={{ opacity: 0, y: -80, scale: 0.8 }}
                    transition={{ duration: 1 }}
                    className="absolute top-0 right-8 text-emerald-400 font-black text-xl pointer-events-none"
                  >
                    +{xpGained} XP
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ RESULT PHASE ═══════════════ */}
        {!isLoadingQuestion && phase === 'result' && currentQuestion && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto"
          >
            <div className={`glass rounded-3xl border p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)]
                            ${isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'}`}>

              {/* Result Header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                                  ${isCorrect
                                    ? 'bg-emerald-500/15 shadow-[0_0_20px_rgba(0,255,136,0.15)]'
                                    : 'bg-red-500/15 shadow-[0_0_20px_rgba(255,60,60,0.15)]'
                                  }`}>
                    {isCorrect ? '🎉' : '💡'}
                  </div>
                  <div>
                    <h3 className={`text-lg font-black ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCorrect ? 'Correct!' : 'Not Quite!'}
                    </h3>
                    {isCorrect && xpGained > 0 ? (
                      <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
                        +{xpGained} XP earned {gameState.streak >= 3 ? '(🔥 Streak Bonus!)' : ''}
                      </p>
                    ) : (
                      !isCorrect && (
                        <p className="text-[10px] text-red-400/80 font-bold uppercase tracking-wider">
                          {selectedCategory === 'mixed' && mixedWrongCount >= 3 ? 'Challenge Failed' : 'Incorrect Answer'}
                        </p>
                      )
                    )}
                  </div>
                </div>
                {selectedCategory === 'mixed' && (
                  <div className="flex gap-1 items-center bg-white/5 px-2.5 py-1 rounded-full border border-white/5 self-start">
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-black mr-1">LIVES:</span>
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <span key={idx} className="text-xs">
                        {idx < (3 - mixedWrongCount) ? '❤️' : '🖤'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Correct answer display */}
              {!isCorrect && (
                <div className="mb-4 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400/60 uppercase tracking-widest font-bold mb-1">
                    Correct Answer
                  </p>
                  <p className="text-sm text-emerald-300 font-bold">
                    {currentQuestion.choices[currentQuestion.correctIndex]}
                  </p>
                </div>
              )}

              {/* Fun Fact */}
              {currentQuestion.funFact && (
                <div className="mb-5 px-4 py-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                  <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-bold mb-1">
                    💡 Fun Fact
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">{currentQuestion.funFact}</p>
                </div>
              )}

              {/* Level Up Celebration */}
              <AnimatePresence>
                {leveledUp && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="mb-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15
                               border border-amber-500/30 text-center"
                    style={{ animation: 'float-badge 0.6s ease-out' }}
                  >
                    <span className="text-2xl">🏆</span>
                    <p className="text-amber-400 font-black text-sm">LEVEL UP!</p>
                    <p className="text-[10px] text-white/50">You reached Level {gameState.level}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Challenge Friends Button */}
              {gameState.streak > 0 && (
                <button
                  onClick={handleShareChallenge}
                  className="w-full mb-3 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                >
                  ⚔️ Challenge Friends (Streak: {gameState.streak})
                </button>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleContinue}
                  className={`flex-1 py-3 rounded-2xl text-white font-bold text-sm tracking-wider transition-all cursor-pointer
                             ${selectedCategory === 'mixed' && mixedWrongCount >= 3
                               ? 'bg-gradient-to-r from-red-600 to-amber-600 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                               : 'bg-gradient-to-r from-emerald-600 to-cyan-600 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                             } hover:scale-[1.02]`}
                >
                  {selectedCategory === 'mixed' && mixedWrongCount >= 3 ? 'Back to Categories →' : 'Next Question →'}
                </button>
                <button
                  onClick={handleExploreMore}
                  className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10
                             text-white/60 font-bold text-sm hover:text-white hover:bg-white/10
                             transition-all cursor-pointer"
                >
                  🌍
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ SUMMARY PHASE ═══════════════ */}
        {!isLoadingQuestion && phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto"
          >
            <div className="glass rounded-3xl border border-white/10 p-6
                            shadow-[0_0_60px_rgba(0,0,0,0.5)]">
              <div className="text-center mb-5">
                <span className="text-4xl">🌟</span>
                <h3 className="text-xl font-black text-white mt-2">
                  {selectedCountry} Mastered!
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  No more questions available for this category. Try another!
                </p>
              </div>

              {/* Challenge Friends Button */}
              <button
                onClick={handleShareChallenge}
                className="w-full mb-4 py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.01]"
              >
                ⚔️ Share Score & Challenge Friends
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleContinue}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600
                             text-white font-bold text-sm tracking-wider cursor-pointer
                             hover:scale-[1.02] transition-all"
                >
                  Try Another Category
                </button>
                <button
                  onClick={handleExploreMore}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10
                             text-white/60 font-bold text-sm cursor-pointer
                             hover:text-white hover:bg-white/10 transition-all"
                >
                  🌍 New Country
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge Unlock Celebration Modal */}
      <AnimatePresence>
        {unlockedBadgeToShow && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-[90vw] max-w-[380px] rounded-3xl p-6 glass border border-amber-500/30 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(20,15,5,0.98) 0%, rgba(5,5,10,0.98) 100%)',
                boxShadow: '0 0 50px rgba(245,158,11,0.25)'
              }}
            >
              {/* Particle glow backdrops */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <span className="text-6xl mb-4 block" role="img" aria-label="Badge Emoji">
                {unlockedBadgeToShow.emoji}
              </span>
              
              <h2 className="text-xs font-black text-amber-400 uppercase tracking-[0.25em] mb-1">
                Badge Unlocked!
              </h2>
              
              <h3 className="text-xl font-black text-white mb-2">
                {unlockedBadgeToShow.label}
              </h3>
              
              <p className="text-xs text-white/60 leading-relaxed mb-6 px-4">
                {unlockedBadgeToShow.description}
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    const refQuery = username ? `?ref=${encodeURIComponent(username)}` : '';
                    const shareText = `🏆 I unlocked the "${unlockedBadgeToShow.emoji} ${unlockedBadgeToShow.label}" badge on MooEarth Live!`;
                    await shareContent({
                      title: `Badge Unlocked — ${BRANDING.name}`,
                      text: shareText,
                      url: `/play-earth${refQuery}`
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs tracking-wider cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
                >
                  📤 Share Achievement
                </button>
                <button
                  onClick={() => setUnlockedBadgeToShow(null)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold text-xs tracking-wider cursor-pointer transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
