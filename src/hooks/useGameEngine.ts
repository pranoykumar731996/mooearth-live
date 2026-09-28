// ============================================================
// MooEarth Live — Infinite Earth Game Engine: React Hook
// ============================================================
// Client-side hook that manages engine sessions, communicates
// with the server-side API, and provides reactive state for the UI.

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  EarthChallenge,
  GameSessionMode,
  GameEngineType,
  ChallengeType,
  ChallengeDifficulty,
  ValidationResult,
  ScoringBreakdown,
  UserResponse,
} from '@/engines/game/types';

// ---- Hook State ----

export interface EngineSessionInfo {
  sessionId: string;
  mode: GameSessionMode;
  currentStreak: number;
  totalScore: number;
  challengesCompleted: number;
  challengesFailed: number;
}

export interface UseGameEngineReturn {
  // State
  challenge: EarthChallenge | null;
  session: EngineSessionInfo | null;
  isLoading: boolean;
  error: string | null;
  lastValidation: ValidationResult | null;
  lastScoring: ScoringBreakdown | null;
  timer: number;
  isTimerRunning: boolean;

  // Actions
  startSession: (mode: GameSessionMode) => Promise<void>;
  fetchChallenge: (opts?: FetchChallengeOptions) => Promise<EarthChallenge | null>;
  submitAnswer: (response: UserResponse) => Promise<{ validation: ValidationResult; scoring: ScoringBreakdown } | null>;
  nextChallenge: () => Promise<void>;
  endSession: () => void;
  resetTimer: () => void;
}

interface FetchChallengeOptions {
  engine?: GameEngineType;
  type?: ChallengeType;
  difficulty?: ChallengeDifficulty;
  targetCountry?: string;
}

// ---- Hook Implementation ----

export function useGameEngine(): UseGameEngineReturn {
  const [challenge, setChallenge] = useState<EarthChallenge | null>(null);
  const [session, setSession] = useState<EngineSessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const [lastScoring, setLastScoring] = useState<ScoringBreakdown | null>(null);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const challengeStartRef = useRef<number>(0);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!isTimerRunning || timer <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timer]);

  // ---- Start a new session ----
  const startSession = useCallback(async (mode: GameSessionMode) => {
    setError(null);
    setLastValidation(null);
    setLastScoring(null);
    setChallenge(null);

    // Create session and fetch first challenge
    setIsLoading(true);
    try {
      const res = await fetch('/api/game/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      if (!res.ok) {
        throw new Error(`Failed to start session: ${res.status}`);
      }

      const data = await res.json();
      setSession(data.session);
      setChallenge(data.challenge);
      setTimer(data.challenge.timeLimit || 15);
      setIsTimerRunning(true);
      challengeStartRef.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---- Fetch a specific challenge ----
  const fetchChallenge = useCallback(async (opts?: FetchChallengeOptions): Promise<EarthChallenge | null> => {
    if (!session) return null;

    setIsLoading(true);
    setError(null);
    setLastValidation(null);
    setLastScoring(null);

    try {
      const res = await fetch('/api/game/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          ...opts,
        }),
      });

      if (!res.ok) {
        throw new Error(`Challenge fetch failed: ${res.status}`);
      }

      const data = await res.json();
      setSession(data.session);
      setChallenge(data.challenge);
      setTimer(data.challenge.timeLimit || 15);
      setIsTimerRunning(true);
      challengeStartRef.current = Date.now();
      return data.challenge;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch challenge');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // ---- Submit an answer ----
  const submitAnswer = useCallback(async (
    response: UserResponse
  ): Promise<{ validation: ValidationResult; scoring: ScoringBreakdown } | null> => {
    if (!session || !challenge) return null;

    setIsTimerRunning(false);

    // Calculate response time if not provided
    const responseWithTime: UserResponse = {
      ...response,
      responseTimeMs: response.responseTimeMs || (Date.now() - challengeStartRef.current),
    };

    try {
      const res = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          response: responseWithTime,
        }),
      });

      if (!res.ok) {
        throw new Error(`Answer submission failed: ${res.status}`);
      }

      const data = await res.json();
      setSession(data.session);
      setLastValidation(data.validation);
      setLastScoring(data.scoring);

      return { validation: data.validation, scoring: data.scoring };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
      return null;
    }
  }, [session, challenge]);

  // ---- Next challenge (convenience) ----
  const nextChallenge = useCallback(async () => {
    await fetchChallenge();
  }, [fetchChallenge]);

  // ---- End session ----
  const endSession = useCallback(() => {
    setIsTimerRunning(false);
    setChallenge(null);
    setLastValidation(null);
    setLastScoring(null);
    // Don't clear session — keep the stats for summary display
  }, []);

  // ---- Reset timer ----
  const resetTimer = useCallback(() => {
    if (challenge) {
      setTimer(challenge.timeLimit || 15);
      setIsTimerRunning(true);
      challengeStartRef.current = Date.now();
    }
  }, [challenge]);

  return {
    challenge,
    session,
    isLoading,
    error,
    lastValidation,
    lastScoring,
    timer,
    isTimerRunning,
    startSession,
    fetchChallenge,
    submitAnswer,
    nextChallenge,
    endSession,
    resetTimer,
  };
}
