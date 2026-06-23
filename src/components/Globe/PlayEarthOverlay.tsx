// ============================================================
// Play Earth — Interactive Game Overlay (V2 Expansion)
// ============================================================
// Premium, cinematic quiz game HUD. Renders as a fixed overlay
// above the globe. Manages multiple game modes, dynamic question generators,
// result display, streaks, XP, level progression, and real-time Firestore sync.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EarthQuestion, PlayerGameState, QuizCategory, PlayEarthPhase, GameBadge, PlayEarthMode } from '@/types';
import { 
  QUIZ_CATEGORIES, 
  XP_REWARDS, 
  calculateLevel,
  generateFlagQuestion, 
  generateCapitalQuestion, 
  getDailyEarthQuestion, 
  getWorldCupQuestion,
  DEDUPLICATED_STATIC_QUESTIONS
} from '@/data/questions';
import { findCountryMeta, getMetadataCountries } from '@/data/questions/countryMetadata';
import { CountryFlag, renderTextWithFlags } from '@/components/UI/CountryFlag';
import { trackEvent } from '@/services/analytics';
import { shareContent } from '@/utils/share';
import { BRANDING } from '@/config/branding';
import { checkUnlockBadges } from '@/config/badges';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const TIMER_SECONDS = 15;
const STREAK_BONUS_MULTIPLIER = 1.5;

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
  isInline?: boolean;
  initialMode?: PlayEarthMode | null;
}

/** Load game state from localStorage */
function loadGameState(username: string): PlayerGameState {
  if (typeof window === 'undefined') return createDefaultState(username);
  try {
    const raw = localStorage.getItem(`mooearth_quiz_progress_${username}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.answeredQuestionIds || !Array.isArray(parsed.answeredQuestionIds)) {
        parsed.answeredQuestionIds = parsed.answeredIds || [];
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

/** Real-time progress sync with Firestore */
const syncProgressToFirestore = async (state: PlayerGameState) => {
  if (typeof window === 'undefined' || !auth.currentUser) return;
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      xp: state.xp,
      level: state.level,
      streak: state.streak,
      bestStreak: state.bestStreak,
      totalCorrect: state.totalCorrect,
      totalAnswered: state.totalAnswered,
      answeredQuestionIds: state.answeredQuestionIds || [],
      countriesExplored: state.countriesExplored || [],
      survivalBest: state.survivalBest || 0,
      clockBest: state.clockBest || {},
      flagBest: state.flagBest || {},
      capitalBest: state.capitalBest || {},
      worldCupBest: state.worldCupBest || 0,
      dailyChallengeStreak: state.dailyChallengeStreak || 0,
      lastDailyChallengeDate: state.lastDailyChallengeDate || ""
    });
  } catch (err) {
    console.warn('[PlayEarthOverlay] Firestore progress sync failed:', err);
  }
};

export default function PlayEarthOverlay({
  isActive, selectedCountry, onClose, onPlaySound,
  onCorrectSound, onWrongSound, onTimerTick, onLevelUp, username,
  isInline = false, initialMode = null,
}: PlayEarthOverlayProps) {
  // Game Mode States
  const [activeMode, setActiveMode] = useState<PlayEarthMode | 'discovery' | null>(null);
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
  const [questionSource, setQuestionSource] = useState<string>('Local Database');
  
  // V2 Specific counters
  const [survivalCount, setSurvivalCount] = useState(0);
  const [survivalCountry, setSurvivalCountry] = useState<string>('');
  const [clockDuration, setClockDuration] = useState<'30s' | '60s' | '120s'>('60s');
  const [clockScore, setClockScore] = useState(0);
  const [clockTotal, setClockTotal] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [dailyIndex, setDailyIndex] = useState(0);
  const [dailyQuestions, setDailyQuestions] = useState<EarthQuestion[]>([]);
  const [dailyScore, setDailyScore] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync username changes
  const [prevUsername, setPrevUsername] = useState(username);
  if (username !== prevUsername) {
    setPrevUsername(username);
    setGameState(loadGameState(username));
  }

  // Handle active/country reset
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  const [prevSelectedCountry, setPrevSelectedCountry] = useState<string | null>(null);

  if (isActive !== prevIsActive || selectedCountry !== prevSelectedCountry) {
    setPrevIsActive(isActive);
    setPrevSelectedCountry(selectedCountry);
    
    if (isActive) {
      if (initialMode) {
        setActiveMode(initialMode);
        if (initialMode === 'explorer') {
          setPhase(selectedCountry ? 'category-select' : 'intro');
        } else if (initialMode === 'survival') {
          setPhase('survival-start');
        } else if (initialMode === 'clock') {
          setPhase('beat-the-clock-start');
        } else if (initialMode === 'flag') {
          setPhase('flag-challenge-start');
        } else if (initialMode === 'capital') {
          setPhase('capital-challenge-start');
        } else if (initialMode === 'worldcup') {
          setPhase('world-cup-start');
        } else if (initialMode === 'daily') {
          setPhase('daily-earth-start');
        }
      } else if (selectedCountry) {
        setActiveMode('explorer');
        setPhase('category-select');
      } else {
        setActiveMode(null);
        setPhase('intro');
      }
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

  // Audio trigger
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
    if (selectedCountry || activeMode) {
      onPlaySound();
    }
  }, [isActive, selectedCountry, activeMode, onPlaySound]);

  // Cleanup timers on unmount
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

  // Standard Quiz Phase Timer Countdown
  useEffect(() => {
    if (phase !== 'question' || selectedAnswer !== null || activeMode === 'clock') {
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
  }, [phase, selectedAnswer, activeMode]);

  // Beat the Clock Continuous Countdown
  useEffect(() => {
    if (activeMode !== 'clock' || phase !== 'question') return;
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('summary');
          // Update high score stats
          setGameState(g => {
            const next = { ...g };
            const currentDuration = clockDuration;
            if (!next.clockBest) next.clockBest = { '30s': 0, '60s': 0, '120s': 0 };
            if (clockScore > (next.clockBest[currentDuration] || 0)) {
              next.clockBest[currentDuration] = clockScore;
            }
            saveGameState(next);
            syncProgressToFirestore(next);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeMode, phase, clockDuration, clockScore]);

  /** Helper to load a random global question for Beat the Clock mode */
  const loadNextClockQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    
    // Choose randomly: Curated, Flag, or Capital
    const type = Math.floor(Math.random() * 3);
    const answered = gameState.answeredQuestionIds || [];
    let q: EarthQuestion;

    if (type === 0) {
      q = generateFlagQuestion('medium', answered);
      setQuestionSource('Flag Generator');
    } else if (type === 1) {
      q = generateCapitalQuestion('medium', answered);
      setQuestionSource('Capital Generator');
    } else {
      const pool = DEDUPLICATED_STATIC_QUESTIONS.filter(x => !answered.includes(x.id));
      if (pool.length > 0) {
        q = pool[Math.floor(Math.random() * pool.length)];
        setQuestionSource('Local Database');
      } else {
        q = generateCapitalQuestion('easy', answered);
        setQuestionSource('Capital Generator');
      }
    }
    
    setCurrentQuestion(q);
  };

  /** Start a new question from the hybrid API or dynamic generators */
  const startQuestion = useCallback(async (category: QuizCategory) => {
    setSelectedCategory(category);
    setIsLoadingQuestion(true);
    onPlaySound();
    trackEvent('category', 'click', `quiz_${category}`);

    const startTime = Date.now();
    try {
      const res = await fetch('/api/quiz/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: selectedCountry || 'Global',
          category,
          username,
          answeredIds: gameState.answeredQuestionIds || []
        })
      });

      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();
      const q = data.question;

      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
      }

      if (q) {
        setCurrentQuestion(q);
        setQuestionSource(data.source || 'AI Generator');
        setSelectedAnswer(null);
        setIsCorrect(null);
        setXpGained(0);
        setShowXpFloat(false);
        setLeveledUp(false);
        const duration = q.difficulty === 'easy' ? 20 : q.difficulty === 'hard' ? 10 : 15;
        setTimer(duration);
        setPhase('question');
      } else {
        setPhase('summary');
      }
    } catch (err) {
      console.warn('API error, falling back to local procedural template', err);
      // Local fallback
      const q = generateCapitalQuestion('medium', gameState.answeredQuestionIds || []);
      setCurrentQuestion(q);
      setQuestionSource('Capital Generator (Local Fallback)');
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimer(15);
      setPhase('question');
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [selectedCountry, gameState, username, onPlaySound]);

  /** Survival Mode Loop: Correct -> load next random country question */
  const startSurvivalQuestion = useCallback(() => {
    setIsLoadingQuestion(true);
    onPlaySound();
    
    setTimeout(() => {
      const countries = getMetadataCountries();
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      setSurvivalCountry(randomCountry);
      
      const q = generateCapitalQuestion('medium', gameState.answeredQuestionIds || [], randomCountry);
      setQuestionSource('Capital Generator');
      
      setCurrentQuestion(q);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimer(15);
      setIsLoadingQuestion(false);
      setPhase('question');
    }, 800);
  }, [gameState, onPlaySound]);

  /** Daily challenge question handler */
  const loadDailyQuestionIndex = (idx: number) => {
    const today = new Date().toDateString();
    const q = getDailyEarthQuestion(today, idx);
    setQuestionSource('Seeded Daily Generator');
    setCurrentQuestion(q);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTimer(15);
    setPhase('question');
  };

  /** Handle answer selection and calculate rewards */
  const handleAnswer = useCallback((index: number) => {
    if (!currentQuestion || selectedAnswer !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = index === currentQuestion.correctIndex;
    setSelectedAnswer(index);
    setIsCorrect(correct);

    trackEvent('play_earth', 'question_answered', undefined, undefined, {
      correct,
      category: currentQuestion.category,
      mode: activeMode,
      country: currentQuestion.country
    });

    // 1. Beat the Clock Mode
    if (activeMode === 'clock') {
      setClockTotal(t => t + 1);
      setGameState(prev => {
        const next = { ...prev };
        next.totalAnswered++;
        next.answeredQuestionIds = [...(prev.answeredQuestionIds || []), currentQuestion.id];
        
        if (correct) {
          next.xp += 50;
          next.totalCorrect++;
          setXpGained(50);
          setShowXpFloat(true);
          
          const newLevel = calculateLevel(next.xp);
          if (newLevel > next.level) {
            next.level = newLevel;
            setLeveledUp(true);
            setTimeout(() => onLevelUp(), 300);
          }
        }
        
        saveGameState(next);
        syncProgressToFirestore(next);
        return next;
      });

      if (correct) {
        setClockScore(s => s + 1);
        onCorrectSound();
      } else {
        onWrongSound();
      }

      // Automatically advance to next Clock question after 600ms
      setTimeout(() => {
        loadNextClockQuestion();
      }, 600);
      return;
    }

    // 2. Survival Mode (Wrong = Game Over)
    if (activeMode === 'survival') {
      setGameState(prev => {
        const next = { ...prev };
        next.totalAnswered++;
        next.answeredQuestionIds = [...(prev.answeredQuestionIds || []), currentQuestion.id];

        if (correct) {
          next.xp += 150; // High XP for survival answers
          next.totalCorrect++;
          setXpGained(150);
          setShowXpFloat(true);

          if (survivalCount + 1 >= 5) {
            next.xp += 500; // Milestone bonus
          }

          const newLevel = calculateLevel(next.xp);
          if (newLevel > next.level) {
            next.level = newLevel;
            setLeveledUp(true);
            setTimeout(() => onLevelUp(), 300);
          }

          if (survivalCount + 1 > (next.survivalBest || 0)) {
            next.survivalBest = survivalCount + 1;
          }
        } else {
          if (survivalCount > (next.survivalBest || 0)) {
            next.survivalBest = survivalCount;
          }
        }

        saveGameState(next);
        syncProgressToFirestore(next);
        return next;
      });

      if (correct) {
        setSurvivalCount(c => c + 1);
        onCorrectSound();
      } else {
        onWrongSound();
      }
      setTimeout(() => setPhase('result'), 800);
      return;
    }

    // 3. Flag / Capital challenge (wrong = game over)
    if (activeMode === 'flag' || activeMode === 'capital') {
      setGameState(prev => {
        const next = { ...prev };
        next.totalAnswered++;
        next.answeredQuestionIds = [...(prev.answeredQuestionIds || []), currentQuestion.id];

        if (correct) {
          const reward = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 200;
          next.xp += reward;
          next.streak++;
          if (next.streak > next.bestStreak) next.bestStreak = next.streak;
          next.totalCorrect++;
          setXpGained(reward);
          setShowXpFloat(true);

          const newLevel = calculateLevel(next.xp);
          if (newLevel > next.level) {
            next.level = newLevel;
            setLeveledUp(true);
            setTimeout(() => onLevelUp(), 300);
          }

          if (activeMode === 'flag') {
            if (!next.flagBest) next.flagBest = { easy: 0, medium: 0, hard: 0 };
            if (next.streak > (next.flagBest[difficulty] || 0)) {
              next.flagBest[difficulty] = next.streak;
            }
          } else {
            if (!next.capitalBest) next.capitalBest = { easy: 0, medium: 0, hard: 0 };
            if (next.streak > (next.capitalBest[difficulty] || 0)) {
              next.capitalBest[difficulty] = next.streak;
            }
          }
        } else {
          next.streak = 0;
        }

        saveGameState(next);
        syncProgressToFirestore(next);
        return next;
      });

      if (correct) {
        onCorrectSound();
      } else {
        onWrongSound();
      }
      setTimeout(() => setPhase('result'), 800);
      return;
    }

    // 4. Daily Challenge (5 questions)
    if (activeMode === 'daily') {
      setGameState(prev => {
        const next = { ...prev };
        next.totalAnswered++;
        next.answeredQuestionIds = [...(prev.answeredQuestionIds || []), currentQuestion.id];

        if (correct) {
          next.xp += 100;
          next.totalCorrect++;
          setXpGained(100);
          setShowXpFloat(true);

          const newLevel = calculateLevel(next.xp);
          if (newLevel > next.level) {
            next.level = newLevel;
            setLeveledUp(true);
            setTimeout(() => onLevelUp(), 300);
          }
        }

        saveGameState(next);
        syncProgressToFirestore(next);
        return next;
      });

      if (correct) {
        setDailyScore(s => s + 1);
        onCorrectSound();
      } else {
        onWrongSound();
      }
      setTimeout(() => setPhase('result'), 800);
      return;
    }

    // 5. World Cup Mode (5 questions)
    if (activeMode === 'worldcup') {
      setGameState(prev => {
        const next = { ...prev };
        next.totalAnswered++;
        next.answeredQuestionIds = [...(prev.answeredQuestionIds || []), currentQuestion.id];

        if (correct) {
          next.xp += 150;
          next.totalCorrect++;
          setXpGained(150);
          setShowXpFloat(true);

          const newLevel = calculateLevel(next.xp);
          if (newLevel > next.level) {
            next.level = newLevel;
            setLeveledUp(true);
            setTimeout(() => onLevelUp(), 300);
          }

          if (clockScore + 1 > (next.worldCupBest || 0)) {
            next.worldCupBest = clockScore + 1;
          }
        }

        saveGameState(next);
        syncProgressToFirestore(next);
        return next;
      });

      if (correct) {
        setClockScore(s => s + 1);
        onCorrectSound();
      } else {
        onWrongSound();
      }
      setTimeout(() => setPhase('result'), 800);
      return;
    }

    // Default Explorer Mode
    if (selectedCategory === 'mixed' && !correct) {
      setMixedWrongCount(prev => prev + 1);
    }

    setGameState(prev => {
      const next = { ...prev };
      next.totalAnswered++;
      next.answeredQuestionIds = [...(prev.answeredQuestionIds || []), currentQuestion.id];

      if (correct) {
        next.totalCorrect++;
        next.streak++;
        if (next.streak > next.bestStreak) next.bestStreak = next.streak;

        let xp = XP_REWARDS[currentQuestion.difficulty] || 100;
        if (next.streak >= 3) xp = Math.floor(xp * STREAK_BONUS_MULTIPLIER);
        const qDuration = currentQuestion.difficulty === 'easy' ? 20 : currentQuestion.difficulty === 'hard' ? 10 : 15;
        const timeBonus = Math.floor((timer / qDuration) * 50);
        xp += timeBonus;
        next.xp += xp;
        setXpGained(xp);
        setShowXpFloat(true);

        const newLevel = calculateLevel(next.xp);
        if (newLevel > next.level) {
          next.level = newLevel;
          setLeveledUp(true);
          setTimeout(() => onLevelUp(), 300);
        }

        onCorrectSound();
      } else {
        next.streak = 0;
        onWrongSound();
      }

      if (selectedCountry && !next.countriesExplored.includes(selectedCountry)) {
        next.countriesExplored = [...next.countriesExplored, selectedCountry];
      }

      const checkedBadges = checkUnlockBadges(next, selectedCategory, selectedCountry || undefined);
      if (checkedBadges.length > (next.badges || []).length) {
        const newUnlocks = checkedBadges.filter(cb => !(next.badges || []).some(nb => nb.id === cb.id));
        if (newUnlocks.length > 0) setUnlockedBadgeToShow(newUnlocks[0]);
        next.badges = checkedBadges;
      }

      next.lastPlayedAt = Date.now();
      saveGameState(next);
      syncProgressToFirestore(next);
      return next;
    });

    setTimeout(() => {
      setPhase('result');
    }, 800);
  }, [currentQuestion, selectedAnswer, timer, selectedCountry, selectedCategory, onCorrectSound, onWrongSound, onLevelUp, activeMode, survivalCount, clockScore, difficulty, dailyIndex]);

  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  /** Continue flow after seeing answer result */
  const handleContinue = useCallback(() => {
    onPlaySound();
    
    // 1. Survival mode
    if (activeMode === 'survival') {
      if (!isCorrect) {
        // Game Over! Go to summary
        setPhase('summary');
      } else {
        startSurvivalQuestion();
      }
      return;
    }

    // 2. Flag & Capital challenge (survival based)
    if (activeMode === 'flag' || activeMode === 'capital') {
      if (!isCorrect) {
        setPhase('summary');
      } else {
        setIsLoadingQuestion(true);
        setTimeout(() => {
          const q = activeMode === 'flag' 
            ? generateFlagQuestion(difficulty, gameState.answeredQuestionIds || [])
            : generateCapitalQuestion(difficulty, gameState.answeredQuestionIds || []);
          setQuestionSource(activeMode === 'flag' ? 'Flag Generator' : 'Capital Generator');
          setCurrentQuestion(q);
          setSelectedAnswer(null);
          setIsCorrect(null);
          setTimer(15);
          setIsLoadingQuestion(false);
          setPhase('question');
        }, 600);
      }
      return;
    }

    // 3. Daily Challenge (5 questions)
    if (activeMode === 'daily') {
      const nextIdx = dailyIndex + 1;
      if (nextIdx >= 5) {
        // Daily Completed! Award 500 XP bonus
        setGameState(prev => {
          const next = { ...prev };
          next.xp += 500;
          next.dailyChallengeStreak = (next.dailyChallengeStreak || 0) + 1;
          next.lastDailyChallengeDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
          
          const newLevel = calculateLevel(next.xp);
          if (newLevel > next.level) {
            next.level = newLevel;
            setLeveledUp(true);
            setTimeout(() => onLevelUp(), 300);
          }
          
          saveGameState(next);
          syncProgressToFirestore(next);
          return next;
        });
        setPhase('summary');
      } else {
        setDailyIndex(nextIdx);
        loadDailyQuestionIndex(nextIdx);
      }
      return;
    }

    // 4. World Cup Challenge (5 questions)
    if (activeMode === 'worldcup') {
      const nextIdx = dailyIndex + 1; // reuse dailyIndex as counter
      if (nextIdx >= 5) {
        setPhase('summary');
      } else {
        setDailyIndex(nextIdx);
        setIsLoadingQuestion(true);
        setTimeout(() => {
          const q = getWorldCupQuestion(gameState.answeredQuestionIds || []);
          setQuestionSource('Local World Cup Database');
          setCurrentQuestion(q);
          setSelectedAnswer(null);
          setIsCorrect(null);
          setTimer(15);
          setIsLoadingQuestion(false);
          setPhase('question');
        }, 600);
      }
      return;
    }

    // Explorer Mode continue
    if (selectedCategory === 'mixed') {
      if (mixedWrongCount >= 3) {
        setMixedWrongCount(0);
        setPhase('category-select');
      } else {
        startQuestion('mixed');
      }
    } else {
      setPhase('category-select');
    }
  }, [onPlaySound, selectedCategory, mixedWrongCount, startQuestion, activeMode, isCorrect, startSurvivalQuestion, difficulty, gameState, dailyIndex]);

  /** Reset mode to selection dashboard */
  const handleBackToModes = useCallback(() => {
    onPlaySound();
    setActiveMode(null);
    setPhase('intro');
  }, [onPlaySound]);

  const handleShareChallenge = async () => {
    let shareText = `🌍 I am playing MooEarth Quiz and reached Level ${gameState.level}! Can you beat me?`;
    if (activeMode === 'survival') {
      shareText = `🔥 I survived ${survivalCount} countries in Survival Mode! Can you beat my streak?`;
    } else if (activeMode === 'clock') {
      shareText = `⏱️ I scored ${clockScore} points in Beat the Clock! Play now on MooEarth Live!`;
    }
    
    const didShare = await shareContent({
      title: `Play Earth Challenge — ${BRANDING.name}`,
      text: shareText,
      url: `/play-earth`
    });

    if (!didShare) {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  const renderDebugHUD = (q: EarthQuestion) => {
    const timesShown = (gameState.answeredQuestionIds || []).filter(id => id === q.id).length + 1;
    const answerLetter = String.fromCharCode(65 + q.correctIndex);
    return (
      <div className="mt-4 pt-3 border-t border-dashed border-white/10 text-[9px] font-mono text-cyan-400/80 bg-black/40 rounded-xl p-3 space-y-1.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between text-white/40 uppercase tracking-widest text-[8px] font-black pb-1.5 border-b border-white/5">
          <span>⚙️ Diagnostic HUD (Debug Mode)</span>
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-left">
          <div><span className="text-white/40">Country:</span> <span className="text-white font-bold">{q.country}</span></div>
          <div><span className="text-white/40">Category:</span> <span className="text-white font-bold">{q.category}</span></div>
          <div className="col-span-2 truncate"><span className="text-white/40">ID:</span> <span className="text-cyan-300 font-bold select-all">{q.id}</span></div>
          <div><span className="text-white/40">Source:</span> <span className="text-amber-400 font-bold">{questionSource}</span></div>
          <div><span className="text-white/40">Times Shown:</span> <span className="text-white font-bold">{timesShown}</span></div>
          <div className="col-span-2"><span className="text-white/40">Answer:</span> <span className="text-emerald-400 font-extrabold">{answerLetter} ({q.choices[q.correctIndex]})</span></div>
        </div>
      </div>
    );
  };

  if (!isActive) return null;

  const countryMeta = selectedCountry ? findCountryMeta(selectedCountry) : null;
  const timerUrgent = timer <= 5;
  const timerCritical = timer <= 3;
  const accuracy = gameState.totalAnswered > 0
    ? Math.round((gameState.totalCorrect / gameState.totalAnswered) * 100)
    : 0;

  // Render for mobile inline (bottom sheet integration)
  if (isInline) {
    return (
      <div className="w-full flex flex-col gap-4 text-left select-none pointer-events-auto" id="play-earth-overlay">
        {/* HUD Bar */}
        <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs font-bold text-white shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Play Earth V2</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span>⭐ {gameState.xp.toLocaleString()} XP</span>
            <span className="text-white/20">|</span>
            <span>Lv. {gameState.level}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Mode Selector HUD */}
          {activeMode === null && (
            <motion.div
              key="mode-selector"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              <div className="text-center py-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Select Game Mode</h3>
                <p className="text-[10px] text-white/40">Select a discovery challenge to play.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onPlaySound();
                    if (selectedCountry) {
                      setActiveMode('explorer');
                      setPhase('category-select');
                    } else {
                      // Prompt user to click country
                      setActiveMode('explorer');
                      setPhase('intro');
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex flex-col gap-1 cursor-pointer"
                >
                  <span className="text-xl">🌍</span>
                  <span className="text-xs font-black text-white">Country Explorer</span>
                  <span className="text-[8px] text-white/40 leading-snug">Answer questions on clicked countries.</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('survival');
                    setPhase('survival-start');
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex flex-col gap-1 cursor-pointer"
                >
                  <span className="text-xl">🔥</span>
                  <span className="text-xs font-black text-white">Survival Mode</span>
                  <span className="text-[8px] text-white/40 leading-snug">Survival streak. Answer wrong & game over!</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('clock');
                    setPhase('beat-the-clock-start');
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex flex-col gap-1 cursor-pointer"
                >
                  <span className="text-xl">⏱️</span>
                  <span className="text-xs font-black text-white">Beat The Clock</span>
                  <span className="text-[8px] text-white/40 leading-snug">Answer as many as possible before time expires.</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('flag');
                    setPhase('flag-challenge-start');
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex flex-col gap-1 cursor-pointer"
                >
                  <span className="text-xl">🚩</span>
                  <span className="text-xs font-black text-white">Flag Challenge</span>
                  <span className="text-[8px] text-white/40 leading-snug">Guess the country from the national flags.</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('capital');
                    setPhase('capital-challenge-start');
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex flex-col gap-1 cursor-pointer"
                >
                  <span className="text-xl">🏙️</span>
                  <span className="text-xs font-black text-white">Capital Challenge</span>
                  <span className="text-[8px] text-white/40 leading-snug">Match cities to their sovereign nations.</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('worldcup');
                    setPhase('world-cup-start');
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex flex-col gap-1 cursor-pointer"
                >
                  <span className="text-xl">🏆</span>
                  <span className="text-xs font-black text-white">World Cup</span>
                  <span className="text-[8px] text-white/40 leading-snug">Curated football history and 2026 trivia.</span>
                </button>
              </div>

              <button
                onClick={() => {
                  onPlaySound();
                  setActiveMode('daily');
                  setPhase('daily-earth-start');
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                📆 DAILY GLOBAL CHALLENGE
              </button>
            </motion.div>
          )}

          {/* Intro Instruction (If explorer and no country chosen) */}
          {activeMode === 'explorer' && phase === 'intro' && (
            <motion.div
              key="explorer-intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <span className="text-4xl">🌍</span>
              <h4 className="text-sm font-bold text-white mt-3">TAP A COUNTRY</h4>
              <p className="text-xs text-white/40 max-w-xs mx-auto mt-1 mb-6">
                Click on any country on the globe map to study its info or start the country explorer quiz.
              </p>
              <button
                onClick={handleBackToModes}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white/60 font-bold uppercase tracking-wider cursor-pointer"
              >
                ← Back to Mode Menu
              </button>
            </motion.div>
          )}

          {/* Phase: Category Select (Explorer mode) */}
          {activeMode === 'explorer' && phase === 'category-select' && selectedCountry && (
            <motion.div
              key="explorer-cat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{selectedCountry} Explorer</span>
                <button
                  onClick={handleBackToModes}
                  className="text-[9px] text-white/40 font-bold hover:text-white"
                >
                  ← Modes
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {QUIZ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => startQuestion(cat.id)}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-[8px] font-bold text-white/70 truncate max-w-full">{cat.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Phase: Survival Start Screen */}
          {activeMode === 'survival' && phase === 'survival-start' && (
            <motion.div
              key="survival-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <span className="text-5xl">🔥</span>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Survival Challenge</h4>
                <p className="text-xs text-white/50 max-w-xs mx-auto mt-1">
                  How many countries can you survive? Correct answers move you to the next random nation. One mistake and you are out!
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    setSurvivalCount(0);
                    startSurvivalQuestion();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-xs tracking-wider cursor-pointer"
                >
                  START CHALLENGE
                </button>
                <button
                  onClick={handleBackToModes}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs"
                >
                  BACK
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase: Clock Start Screen */}
          {activeMode === 'clock' && phase === 'beat-the-clock-start' && (
            <motion.div
              key="clock-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <span className="text-5xl">⏱️</span>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Beat The Clock</h4>
                <p className="text-xs text-white/50 max-w-xs mx-auto mt-1">
                  Answer as many questions as you can before the clock runs dry! Select duration:
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {([['30s', 30], ['60s', 60], ['120s', 120]] as const).map(([label, seconds]) => (
                  <button
                    key={label}
                    onClick={() => {
                      onPlaySound();
                      setClockDuration(label);
                      setClockScore(0);
                      setClockTotal(0);
                      setTimer(seconds);
                      loadNextClockQuestion();
                      setPhase('question');
                    }}
                    className={`px-4 py-2 rounded-xl border font-bold text-xs cursor-pointer ${
                      clockDuration === label
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/10 bg-white/5 text-white/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleBackToModes}
                className="w-full text-[10px] text-white/30 hover:text-white"
              >
                ← Back to Mode Menu
              </button>
            </motion.div>
          )}

          {/* Phase: Flag / Capital Start Screen */}
          {(activeMode === 'flag' || activeMode === 'capital') && phase.endsWith('-start') && (
            <motion.div
              key="difficulty-select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <span className="text-5xl">{activeMode === 'flag' ? '🚩' : '🏙️'}</span>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  {activeMode === 'flag' ? 'Flag Challenge' : 'Capital Challenge'}
                </h4>
                <p className="text-xs text-white/50 max-w-xs mx-auto mt-1">
                  Answer questions continuously. Wrong answer ends the streak! Select Difficulty:
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      onPlaySound();
                      setDifficulty(diff);
                      setGameState(prev => {
                        const next = { ...prev };
                        next.streak = 0; // reset streak
                        return next;
                      });
                      setIsLoadingQuestion(true);
                      setTimeout(() => {
                        const q = activeMode === 'flag'
                          ? generateFlagQuestion(diff, gameState.answeredQuestionIds || [])
                          : generateCapitalQuestion(diff, gameState.answeredQuestionIds || []);
                        setCurrentQuestion(q);
                        setSelectedAnswer(null);
                        setIsCorrect(null);
                        setTimer(15);
                        setIsLoadingQuestion(false);
                        setPhase('question');
                      }, 600);
                    }}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    {diff}
                  </button>
                ))}
              </div>

              <button
                onClick={handleBackToModes}
                className="w-full text-[10px] text-white/30 hover:text-white"
              >
                ← Back to Mode Menu
              </button>
            </motion.div>
          )}

          {/* Phase: World Cup Start Screen */}
          {activeMode === 'worldcup' && phase === 'world-cup-start' && (
            <motion.div
              key="wc-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <span className="text-5xl">🏆</span>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">World Cup Challenge</h4>
                <p className="text-xs text-white/50 max-w-xs mx-auto mt-1">
                  Test your knowledge on FIFA World Cup history, legends, and stadiums in a 5-question blitz.
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    onPlaySound();
                    setClockScore(0); // reset score
                    setDailyIndex(0); // reset index
                    setIsLoadingQuestion(true);
                    setTimeout(() => {
                      const q = getWorldCupQuestion(gameState.answeredQuestionIds || []);
                      setQuestionSource('Local World Cup Database');
                      setCurrentQuestion(q);
                      setSelectedAnswer(null);
                      setIsCorrect(null);
                      setTimer(15);
                      setIsLoadingQuestion(false);
                      setPhase('question');
                    }, 600);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs tracking-wider cursor-pointer"
                >
                  START BLITZ
                </button>
                <button
                  onClick={handleBackToModes}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs"
                >
                  BACK
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase: Daily Challenge Start Screen */}
          {activeMode === 'daily' && phase === 'daily-earth-start' && (
            <motion.div
              key="daily-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <span className="text-5xl">📆</span>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Daily Global Challenge</h4>
                <p className="text-xs text-white/50 max-w-xs mx-auto mt-1">
                  Answer today's 5 global challenge questions correctly. Earn a bonus +500 XP!
                </p>
              </div>

              {gameState.lastDailyChallengeDate === new Date().toLocaleDateString('en-CA') ? (
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-amber-400 text-xs font-bold">
                  ✓ You have already completed today's Daily Challenge. Come back tomorrow!
                </div>
              ) : (
                <button
                  onClick={() => {
                    onPlaySound();
                    setDailyIndex(0);
                    setDailyScore(0);
                    loadDailyQuestionIndex(0);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs tracking-wider cursor-pointer"
                >
                  START DAILY CHALLENGE
                </button>
              )}

              <button
                onClick={handleBackToModes}
                className="w-full text-[10px] text-white/30 hover:text-white"
              >
                ← Back to Mode Menu
              </button>
            </motion.div>
          )}

          {/* Phase: Question HUD */}
          {!isLoadingQuestion && phase === 'question' && currentQuestion && (
            <motion.div
              key="question-box"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Question Header */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">
                    {activeMode === 'survival' ? '🔥' : activeMode === 'clock' ? '⏱️' : activeMode === 'flag' ? '🚩' : activeMode === 'capital' ? '🏙️' : '🌍'}
                  </span>
                  <div>
                    <span className="font-bold text-white">
                      {activeMode === 'survival' ? `Survival: Country #${survivalCount + 1}` :
                       activeMode === 'clock' ? `Clock: ${clockScore} Pts` :
                       activeMode === 'flag' ? `Flag Streak: ${gameState.streak}` :
                       activeMode === 'capital' ? `Capital Streak: ${gameState.streak}` :
                       activeMode === 'daily' ? `Daily Question ${dailyIndex + 1}/5` :
                       activeMode === 'worldcup' ? `World Cup ${dailyIndex + 1}/5` :
                       selectedCountry}
                    </span>
                  </div>
                </div>

                {/* Clock / Timer Indicator */}
                <div className={`px-2 py-0.5 rounded-full border text-[10px] font-black font-mono ${
                  timerCritical ? 'border-red-500/60 bg-red-500/15 animate-pulse' : 'border-white/10 bg-white/5'
                }`}>
                  {timer}s
                </div>
              </div>

              {/* Question text */}
              <div className={`glass rounded-2xl border p-4 ${
                selectedAnswer !== null
                  ? isCorrect
                    ? 'border-emerald-500/40'
                    : 'border-red-500/40 animate-[card-shake_0.5s]'
                  : 'border-white/5'
              }`}>
                <h4 className="text-xs font-bold text-white leading-relaxed mb-3 whitespace-pre-wrap">
                  {renderTextWithFlags(currentQuestion.question)}
                </h4>

                <div className="space-y-1.5">
                  {currentQuestion.choices.map((choice, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrectChoice = i === currentQuestion.correctIndex;
                    const showResult = selectedAnswer !== null;

                    let btnStyle = 'bg-white/5 border-white/5 hover:bg-white/10';
                    if (showResult) {
                      if (isCorrectChoice) btnStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
                      else if (isSelected && !isCorrect) btnStyle = 'bg-red-500/15 border-red-500/40 text-red-300';
                      else btnStyle = 'bg-white/[0.01] border-white/5 opacity-40';
                    }

                    return (
                      <button
                        key={i}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleAnswer(i)}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-2 cursor-pointer ${btnStyle}`}
                      >
                        <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[9px] font-black">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="truncate">{renderTextWithFlags(choice)}</span>
                      </button>
                    );
                  })}
                </div>
                {renderDebugHUD(currentQuestion)}
              </div>
            </motion.div>
          )}

          {/* Phase: Result Display */}
          {!isLoadingQuestion && phase === 'result' && currentQuestion && (
            <motion.div
              key="result-box"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`glass rounded-2xl border p-4 ${
                isCorrect ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-red-500/20 bg-red-500/[0.02]'
              }`}>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${
                    isCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}>
                    {isCorrect ? '✓' : '✗'}
                  </div>
                  <div>
                    <h4 className={`text-xs font-black ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </h4>
                    {isCorrect && xpGained > 0 && (
                      <span className="text-[8px] text-emerald-400/80 font-bold uppercase tracking-wider">
                        +{xpGained} XP Earned
                      </span>
                    )}
                  </div>
                </div>

                {!isCorrect && (
                  <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <span className="text-[8px] text-emerald-400/60 uppercase font-black">Correct Choice</span>
                    <p className="text-xs text-emerald-300 font-bold leading-tight">{renderTextWithFlags(currentQuestion.choices[currentQuestion.correctIndex])}</p>
                  </div>
                )}

                {currentQuestion.funFact && (
                  <p className="text-[10px] text-white/60 bg-white/5 border border-white/5 rounded-xl p-3 leading-relaxed mb-4">
                    💡 {renderTextWithFlags(currentQuestion.funFact)}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleContinue}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold text-[11px] tracking-wider cursor-pointer"
                  >
                    {!isCorrect && (activeMode === 'survival' || activeMode === 'flag' || activeMode === 'capital') 
                      ? 'View Summary' 
                      : 'Continue →'}
                  </button>
                  <button
                    onClick={handleBackToModes}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs"
                  >
                    🌍
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Phase: Post-Round Summary Dashboard */}
          {!isLoadingQuestion && phase === 'summary' && (
            <motion.div
              key="summary-box"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl border border-white/10 p-5 text-center space-y-4"
            >
              <div>
                <span className="text-4xl">🌟</span>
                <h3 className="text-sm font-black text-white mt-2">Challenge Finalized!</h3>
                <p className="text-[10px] text-white/40">Here is your discovery report:</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left font-mono">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[8px] text-white/40 block">SCORE / STREAK</span>
                  <span className="text-xs font-bold text-white">
                    {activeMode === 'survival' ? `${survivalCount} Survived` :
                     activeMode === 'clock' ? `${clockScore} Points` :
                     activeMode === 'daily' ? `${dailyScore}/5 Correct` :
                     activeMode === 'worldcup' ? `${clockScore}/5 Correct` :
                     gameState.streak}
                  </span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[8px] text-white/40 block">ACCURACY</span>
                  <span className="text-xs font-bold text-white">
                    {activeMode === 'clock' && clockTotal > 0 ? `${Math.round((clockScore / clockTotal) * 100)}%` : `${accuracy}%`}
                  </span>
                </div>
              </div>

              {/* Share actions */}
              <button
                onClick={handleShareChallenge}
                className="w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-[10px] tracking-wider cursor-pointer"
              >
                ⚔️ CHALLENGE FRIENDS
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onPlaySound();
                    if (activeMode === 'survival') startSurvivalQuestion();
                    else if (activeMode === 'clock') {
                      setClockScore(0);
                      setClockTotal(0);
                      setTimer(clockDuration === '30s' ? 30 : clockDuration === '120s' ? 120 : 60);
                      loadNextClockQuestion();
                      setPhase('question');
                    } else if (activeMode === 'daily') {
                      setDailyIndex(0);
                      setDailyScore(0);
                      loadDailyQuestionIndex(0);
                    } else if (activeMode === 'worldcup') {
                      setClockScore(0);
                      setDailyIndex(0);
                      setIsLoadingQuestion(true);
                      setTimeout(() => {
                        const q = getWorldCupQuestion(gameState.answeredQuestionIds || []);
                        setQuestionSource('Local World Cup Database');
                        setCurrentQuestion(q);
                        setSelectedAnswer(null);
                        setIsCorrect(null);
                        setTimer(15);
                        setIsLoadingQuestion(false);
                        setPhase('question');
                      }, 600);
                    } else {
                      setPhase('category-select');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs tracking-wider cursor-pointer"
                >
                  Play Again
                </button>
                <button
                  onClick={handleBackToModes}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs cursor-pointer"
                >
                  Main Menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render for desktop/modal overlay
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

      {/* Click-blocking backdrop during active quiz */}
      {(phase !== 'intro' || activeMode) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1.5px] pointer-events-auto" onClick={(e) => {
          e.stopPropagation();
        }} />
      )}

      {/* Top HUD Bar */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[46] pointer-events-auto"
      >
        <div className="glass px-5 py-2.5 rounded-full border border-emerald-500/30 flex items-center gap-3 shadow-[0_0_25px_rgba(0,255,136,0.15)] font-sans">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
          <span className="text-[10px] text-emerald-400 uppercase tracking-[0.25em] font-black">
            PLAY EARTH {activeMode ? `— ${activeMode.toUpperCase()}` : 'V2'}
          </span>
          <span className="text-white/20">|</span>
          <span className="text-xs text-white/80 font-bold">
            ⭐ {gameState.xp.toLocaleString()} XP
          </span>
          <span className="text-white/20">|</span>
          <span className="text-xs text-white/80 font-bold">
            Lv.{gameState.level}
          </span>
        </div>
      </motion.div>

      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onClose}
        className="fixed top-24 right-6 z-[47] w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all pointer-events-auto cursor-pointer"
      >
        ✕
      </motion.button>

      {/* ═══════════════ MAIN SELECTION HUD ═══════════════ */}
      <AnimatePresence mode="wait">
        {!isLoadingQuestion && phase === 'intro' && activeMode === null && (
          <motion.div
            key="intro-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-xl px-4 pointer-events-auto font-sans"
          >
            <div className="glass rounded-3xl border border-white/10 p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
              <div className="text-center mb-5">
                <span className="text-4xl block mb-2">🌍</span>
                <h3 className="text-xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Play Earth Gaming Platform</h3>
                <p className="text-xs text-white/45">Choose a world discovery mode to play.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => {
                    onPlaySound();
                    if (selectedCountry) {
                      setActiveMode('explorer');
                      setPhase('category-select');
                    } else {
                      setActiveMode('explorer');
                      setPhase('intro');
                    }
                  }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all text-left flex flex-col gap-1.5 cursor-pointer group"
                >
                  <span className="text-2xl group-hover:scale-105 transition-transform">🌍</span>
                  <span className="text-sm font-bold text-white">Country Explorer</span>
                  <span className="text-xs text-white/40 leading-snug">Answer questions on clicked countries to earn XP.</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('survival');
                    setPhase('survival-start');
                  }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all text-left flex flex-col gap-1.5 cursor-pointer group"
                >
                  <span className="text-2xl group-hover:scale-105 transition-transform">🔥</span>
                  <span className="text-sm font-bold text-white">Survival Mode</span>
                  <span className="text-xs text-white/40 leading-snug">How many countries can you survive? One wrong is Game Over!</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('clock');
                    setPhase('beat-the-clock-start');
                  }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all text-left flex flex-col gap-1.5 cursor-pointer group"
                >
                  <span className="text-2xl group-hover:scale-105 transition-transform">⏱️</span>
                  <span className="text-sm font-bold text-white">Beat The Clock</span>
                  <span className="text-xs text-white/40 leading-snug">Continuous global timer challenge. Play against the countdown.</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('flag');
                    setPhase('flag-challenge-start');
                  }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all text-left flex flex-col gap-1.5 cursor-pointer group"
                >
                  <span className="text-2xl group-hover:scale-105 transition-transform">🚩</span>
                  <span className="text-sm font-bold text-white">Flag Challenge</span>
                  <span className="text-xs text-white/40 leading-snug">Guess the country from national flags. Easy, Medium, or Hard.</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('capital');
                    setPhase('capital-challenge-start');
                  }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all text-left flex flex-col gap-1.5 cursor-pointer group"
                >
                  <span className="text-2xl group-hover:scale-105 transition-transform">🏙️</span>
                  <span className="text-sm font-bold text-white">Capital Challenge</span>
                  <span className="text-xs text-white/40 leading-snug">Guess capital cities of nations across various difficulty tiers.</span>
                </button>

                <button
                  onClick={() => {
                    onPlaySound();
                    setActiveMode('worldcup');
                    setPhase('world-cup-start');
                  }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all text-left flex flex-col gap-1.5 cursor-pointer group"
                >
                  <span className="text-2xl group-hover:scale-105 transition-transform">🏆</span>
                  <span className="text-sm font-bold text-white">World Cup</span>
                  <span className="text-xs text-white/40 leading-snug">Test your FIFA World Cup history and records knowledge.</span>
                </button>
              </div>

              <button
                onClick={() => {
                  onPlaySound();
                  setActiveMode('daily');
                  setPhase('daily-earth-start');
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/35 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 font-extrabold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                📆 DAILY GLOBAL EARTH CHALLENGE (+500 XP BONUS)
              </button>
            </div>
          </motion.div>
        )}

        {/* Explorer mode tap country prompt */}
        {activeMode === 'explorer' && phase === 'intro' && (
          <motion.div
            key="explorer-intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[46] flex items-center justify-center pointer-events-none"
          >
            <div className="text-center pointer-events-none select-none">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl mb-6"
              >
                🌍
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                TAP ANY COUNTRY
              </h2>
              <p className="text-sm text-white/50 max-w-xs mx-auto mb-6">
                Click on any country on the globe map to open its info board and start the explorer quiz.
              </p>
              <button
                onClick={handleBackToModes}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 font-bold uppercase tracking-wider cursor-pointer pointer-events-auto"
              >
                ← Back to Mode Menu
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase: Category Select (Explorer mode) */}
        {!isLoadingQuestion && phase === 'category-select' && selectedCountry && activeMode === 'explorer' && (
          <motion.div
            key="category"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto font-sans"
          >
            <div className="glass rounded-3xl border border-white/10 p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <CountryFlag flag={countryMeta?.flag} className="w-8 h-6 object-cover rounded-[3px] shadow-sm shrink-0" />
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedCountry} Explorer</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Select Quiz Topic</p>
                  </div>
                </div>
                <button
                  onClick={handleBackToModes}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white/50 font-bold hover:text-white"
                >
                  ← Modes
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {QUIZ_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.id}
                    onClick={() => startQuestion(cat.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all cursor-pointer group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                    <span className="text-[10px] font-bold text-white/70 group-hover:text-white transition-colors truncate max-w-full text-center">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase: Survival Start Screen */}
        {activeMode === 'survival' && phase === 'survival-start' && (
          <motion.div
            key="survival-start"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto font-sans"
          >
            <div className="glass rounded-3xl border border-white/10 p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] text-center space-y-4">
              <span className="text-6xl block">🔥</span>
              <div>
                <h3 className="text-xl font-black text-white">Survival Mode</h3>
                <p className="text-xs text-white/50 max-w-md mx-auto mt-2 leading-relaxed">
                  Test your limits. Answer questions on random countries continuously. A single wrong answer will end your run!
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setSurvivalCount(0);
                    startSurvivalQuestion();
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-xs tracking-wider cursor-pointer"
                >
                  START CHALLENGE
                </button>
                <button
                  onClick={handleBackToModes}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs"
                >
                  BACK
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase: Clock Start Screen */}
        {activeMode === 'clock' && phase === 'beat-the-clock-start' && (
          <motion.div
            key="clock-start"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto font-sans"
          >
            <div className="glass rounded-3xl border border-white/10 p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] text-center space-y-4">
              <span className="text-6xl block">⏱️</span>
              <div>
                <h3 className="text-xl font-black text-white">Beat The Clock</h3>
                <p className="text-xs text-white/50 max-w-md mx-auto mt-2 leading-relaxed">
                  Continuous countdown trivia speed run. Answer as many questions as possible before time runs out!
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                {([['30 Seconds', '30s', 30], ['60 Seconds', '60s', 60], ['120 Seconds', '120s', 120]] as const).map(([label, duration, seconds]) => (
                  <button
                    key={duration}
                    onClick={() => {
                      onPlaySound();
                      setClockDuration(duration);
                      setClockScore(0);
                      setClockTotal(0);
                      setTimer(seconds);
                      loadNextClockQuestion();
                      setPhase('question');
                    }}
                    className={`px-5 py-3 rounded-2xl border font-bold text-xs cursor-pointer ${
                      clockDuration === duration
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/10 bg-white/5 text-white/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleBackToModes}
                className="w-full text-xs text-white/30 hover:text-white"
              >
                ← Back to Mode Menu
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase: Flag / Capital Start Screen */}
        {(activeMode === 'flag' || activeMode === 'capital') && phase.endsWith('-start') && (
          <motion.div
            key="diff-select"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto font-sans"
          >
            <div className="glass rounded-3xl border border-white/10 p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] text-center space-y-4">
              <span className="text-6xl block">{activeMode === 'flag' ? '🚩' : '🏙️'}</span>
              <div>
                <h3 className="text-xl font-black text-white">
                  {activeMode === 'flag' ? 'Flag Challenge' : 'Capital Challenge'}
                </h3>
                <p className="text-xs text-white/50 max-w-md mx-auto mt-2 leading-relaxed">
                  Trivia streak challenge. Select difficulty:
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      onPlaySound();
                      setDifficulty(diff);
                      setGameState(prev => {
                        const next = { ...prev };
                        next.streak = 0;
                        return next;
                      });
                      setIsLoadingQuestion(true);
                      setTimeout(() => {
                        const q = activeMode === 'flag'
                          ? generateFlagQuestion(diff, gameState.answeredQuestionIds || [])
                          : generateCapitalQuestion(diff, gameState.answeredQuestionIds || []);
                        setCurrentQuestion(q);
                        setSelectedAnswer(null);
                        setIsCorrect(null);
                        setTimer(15);
                        setIsLoadingQuestion(false);
                        setPhase('question');
                      }, 600);
                    }}
                    className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 text-white font-extrabold text-xs uppercase cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {diff}
                  </button>
                ))}
              </div>

              <button
                onClick={handleBackToModes}
                className="w-full text-xs text-white/30 hover:text-white"
              >
                ← Back to Mode Menu
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase: World Cup Start Screen */}
        {activeMode === 'worldcup' && phase === 'world-cup-start' && (
          <motion.div
            key="wc-start"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto font-sans"
          >
            <div className="glass rounded-3xl border border-white/10 p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] text-center space-y-4">
              <span className="text-6xl block">🏆</span>
              <div>
                <h3 className="text-xl font-black text-white">World Cup Challenge</h3>
                <p className="text-xs text-white/50 max-w-md mx-auto mt-2 leading-relaxed">
                  Answer 5 curated questions about legendary World Cup teams, players, and stadium records to test your football trivia.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    onPlaySound();
                    setClockScore(0);
                    setDailyIndex(0);
                    setIsLoadingQuestion(true);
                    setTimeout(() => {
                      const q = getWorldCupQuestion(gameState.answeredQuestionIds || []);
                      setQuestionSource('Local World Cup Database');
                      setCurrentQuestion(q);
                      setSelectedAnswer(null);
                      setIsCorrect(null);
                      setTimer(15);
                      setIsLoadingQuestion(false);
                      setPhase('question');
                    }, 600);
                  }}
                  className="px-6 py-3 rounded-2xl bg-amber-500 text-black font-black text-xs tracking-wider cursor-pointer"
                >
                  START WORLD CUP BLITZ
                </button>
                <button
                  onClick={handleBackToModes}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs"
                >
                  BACK
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase: Daily Challenge Start Screen */}
        {activeMode === 'daily' && phase === 'daily-earth-start' && (
          <motion.div
            key="daily-start"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto font-sans"
          >
            <div className="glass rounded-3xl border border-white/10 p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] text-center space-y-4">
              <span className="text-6xl block">📆</span>
              <div>
                <h3 className="text-xl font-black text-white">Daily Global Challenge</h3>
                <p className="text-xs text-white/50 max-w-md mx-auto mt-2 leading-relaxed">
                  Solve today's 5 global challenge questions for a special +500 XP reward. All players receive the same challenge.
                </p>
              </div>

              {gameState.lastDailyChallengeDate === new Date().toLocaleDateString('en-CA') ? (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-amber-400 text-xs font-bold">
                  ✓ You have already completed today's Daily Challenge. Come back tomorrow!
                </div>
              ) : (
                <button
                  onClick={() => {
                    onPlaySound();
                    setDailyIndex(0);
                    setDailyScore(0);
                    loadDailyQuestionIndex(0);
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs tracking-wider cursor-pointer"
                >
                  START CHALLENGE
                </button>
              )}

              <button
                onClick={handleBackToModes}
                className="w-full text-xs text-white/30 hover:text-white"
              >
                ← Back to Mode Menu
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase: Timed Question UI */}
        {!isLoadingQuestion && phase === 'question' && currentQuestion && (
          <motion.div
            key="question"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto font-sans"
          >
            <div className={`glass rounded-3xl border p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] ${
              selectedAnswer !== null
                ? isCorrect
                  ? 'border-emerald-500/40'
                  : 'border-red-500/40 animate-[card-shake_0.5s]'
                : 'border-white/10'
            }`}>
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {activeMode === 'survival' ? '🔥' : activeMode === 'clock' ? '⏱️' : activeMode === 'flag' ? '🚩' : activeMode === 'capital' ? '🏙️' : '🌍'}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white/80">
                      {activeMode === 'survival' ? `Survival: Country #${survivalCount + 1} (${survivalCountry})` :
                       activeMode === 'clock' ? `Beat the Clock: ${clockScore} Pts` :
                       activeMode === 'flag' ? `Flag Streak: ${gameState.streak}` :
                       activeMode === 'capital' ? `Capital Streak: ${gameState.streak}` :
                       activeMode === 'daily' ? `Daily Question ${dailyIndex + 1}/5` :
                       activeMode === 'worldcup' ? `World Cup ${dailyIndex + 1}/5` :
                       selectedCountry}
                    </span>
                  </div>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  timerCritical ? 'border-red-500/60 bg-red-500/15 animate-pulse' : 'border-white/10 bg-white/5'
                }`}>
                  <span className={`text-sm font-black font-mono ${timerCritical ? 'text-red-400' : 'text-white'}`}>
                    {timer}
                  </span>
                  <span className="text-[9px] text-white/40 uppercase font-bold">sec</span>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-white mb-5 leading-snug whitespace-pre-wrap">
                {renderTextWithFlags(currentQuestion.question)}
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
                      choiceStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(0,255,136,0.1)]';
                    } else if (isSelected && !isCorrect) {
                      choiceStyle = 'bg-red-500/15 border-red-500/40 text-red-300 shadow-[0_0_15px_rgba(255,60,60,0.1)]';
                    } else {
                      choiceStyle = 'bg-white/[0.02] border-white/5 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleAnswer(i)}
                      className={`w-full text-left px-4 py-3 rounded-2xl border transition-all duration-200 flex items-center gap-3 cursor-pointer ${choiceStyle}`}
                    >
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black bg-white/10">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm font-medium">{renderTextWithFlags(choice)}</span>
                    </button>
                  );
                })}
              </div>

              {renderDebugHUD(currentQuestion)}

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

        {/* Phase: Result screen */}
        {!isLoadingQuestion && phase === 'result' && currentQuestion && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto font-sans"
          >
            <div className={`glass rounded-3xl border p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] ${
              isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                  isCorrect ? 'bg-emerald-500/15' : 'bg-red-500/15'
                }`}>
                  {isCorrect ? '🎉' : '💡'}
                </div>
                <div>
                  <h3 className={`text-lg font-black ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </h3>
                  {isCorrect && xpGained > 0 && (
                    <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">
                      +{xpGained} XP Earned
                    </p>
                  )}
                </div>
              </div>

              {!isCorrect && (
                <div className="mb-4 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400/60 uppercase tracking-widest font-bold mb-1">
                    Correct Answer
                  </p>
                  <p className="text-sm text-emerald-300 font-bold">
                    {renderTextWithFlags(currentQuestion.choices[currentQuestion.correctIndex])}
                  </p>
                </div>
              )}

              {currentQuestion.funFact && (
                <div className="mb-5 px-4 py-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                  <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-bold mb-1">
                    💡 Fun Fact
                  </p>
                  <p className="text-xs text-white/70 leading-relaxed">{renderTextWithFlags(currentQuestion.funFact)}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleContinue}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold text-sm tracking-wider cursor-pointer"
                >
                  {!isCorrect && (activeMode === 'survival' || activeMode === 'flag' || activeMode === 'capital')
                    ? 'View Summary'
                    : 'Continue →'}
                </button>
                <button
                  onClick={handleBackToModes}
                  className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:text-white"
                >
                  🌍
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase: Summary Report Dashboard */}
        {!isLoadingQuestion && phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[46] w-full max-w-lg px-4 pointer-events-auto font-sans"
          >
            <div className="glass rounded-3xl border border-white/10 p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] text-center space-y-4">
              <div>
                <span className="text-4xl block">🏆</span>
                <h3 className="text-xl font-black text-white mt-2">Challenge Finished</h3>
                <p className="text-xs text-white/45">Your global trivia report is ready:</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left font-mono">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-white/40 block">SCORE / STREAK</span>
                  <span className="text-sm font-black text-white">
                    {activeMode === 'survival' ? `${survivalCount} Survived` :
                     activeMode === 'clock' ? `${clockScore} Points` :
                     activeMode === 'daily' ? `${dailyScore}/5 Correct` :
                     activeMode === 'worldcup' ? `${clockScore}/5 Correct` :
                     gameState.streak}
                  </span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[9px] text-white/40 block">ACCURACY</span>
                  <span className="text-sm font-black text-white">
                    {activeMode === 'clock' && clockTotal > 0 ? `${Math.round((clockScore / clockTotal) * 100)}%` : `${accuracy}%`}
                  </span>
                </div>
              </div>

              <button
                onClick={handleShareChallenge}
                className="w-full py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs tracking-wider transition-all cursor-pointer"
              >
                ⚔️ CHALLENGE FRIENDS
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onPlaySound();
                    if (activeMode === 'survival') {
                      setSurvivalCount(0);
                      startSurvivalQuestion();
                    } else if (activeMode === 'clock') {
                      setClockScore(0);
                      setClockTotal(0);
                      setTimer(clockDuration === '30s' ? 30 : clockDuration === '120s' ? 120 : 60);
                      loadNextClockQuestion();
                      setPhase('question');
                    } else if (activeMode === 'daily') {
                      setDailyIndex(0);
                      setDailyScore(0);
                      loadDailyQuestionIndex(0);
                    } else if (activeMode === 'worldcup') {
                      setClockScore(0);
                      setDailyIndex(0);
                      setIsLoadingQuestion(true);
                      setTimeout(() => {
                        const q = getWorldCupQuestion(gameState.answeredQuestionIds || []);
                        setQuestionSource('Local World Cup Database');
                        setCurrentQuestion(q);
                        setSelectedAnswer(null);
                        setIsCorrect(null);
                        setTimer(15);
                        setIsLoadingQuestion(false);
                        setPhase('question');
                      }, 600);
                    } else {
                      setPhase('category-select');
                    }
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-extrabold text-sm tracking-wider cursor-pointer hover:scale-[1.02] transition-all"
                >
                  Play Again
                </button>
                <button
                  onClick={handleBackToModes}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm cursor-pointer hover:bg-white/10"
                >
                  Modes Menu
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
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <span className="text-6xl mb-4 block">{unlockedBadgeToShow.emoji}</span>
              <h2 className="text-xs font-black text-amber-400 uppercase tracking-[0.25em] mb-1">Badge Unlocked!</h2>
              <h3 className="text-xl font-black text-white mb-2">{unlockedBadgeToShow.label}</h3>
              <p className="text-xs text-white/60 leading-relaxed mb-6 px-4">{unlockedBadgeToShow.description}</p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    const shareText = `🏆 I unlocked the "${unlockedBadgeToShow.emoji} ${unlockedBadgeToShow.label}" badge on MooEarth Live!`;
                    await shareContent({
                      title: `Badge Unlocked — ${BRANDING.name}`,
                      text: shareText,
                      url: `/play-earth`
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
