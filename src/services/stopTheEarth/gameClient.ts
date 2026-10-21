// ============================================================
// MooEarth Live — Stop the Earth: Client-Side API Wrapper
// ============================================================
// Type-safe API client for the Stop the Earth game.
// Handles session creation, question fetching, and answer submission.

import type {
  SteDifficulty,
  SteGameMode,
  SteQuestionResponse,
  SteAnswerResponse,
  SteSummaryResponse,
} from '@/engines/game/stopTheEarth/types';

const API_BASE = '/api/game/stop-the-earth';

// ---- Session ----

export interface CreateSessionResponse {
  sessionId: string;
  playerId: string;
  country: string;
  countryCode: string;
  difficulty: SteDifficulty;
  mode: SteGameMode;
  maxRounds: number;
  questionsAvailable: number;
}

export async function createSession(
  country: string,
  difficulty: SteDifficulty = 'easy',
  mode: SteGameMode = 'country-challenge',
  playerId?: string
): Promise<CreateSessionResponse> {
  const res = await fetch(`${API_BASE}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country, difficulty, mode, playerId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `Failed to create session: ${res.status}`);
  }

  return res.json();
}

// ---- Question ----

export async function fetchQuestion(sessionId: string): Promise<SteQuestionResponse & { exhausted?: boolean }> {
  const res = await fetch(`${API_BASE}/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    if (err.exhausted) {
      throw Object.assign(new Error(err.error), { exhausted: true });
    }
    throw new Error(err.error || `Failed to fetch question: ${res.status}`);
  }

  return res.json();
}

// ---- Answer ----

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  guessLat: number,
  guessLng: number,
  responseTimeMs: number
): Promise<SteAnswerResponse & { summary?: SteSummaryResponse | null }> {
  const res = await fetch(`${API_BASE}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      questionId,
      guessLat,
      guessLng,
      responseTimeMs,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `Failed to submit answer: ${res.status}`);
  }

  return res.json();
}

// ---- Helpers ----

/**
 * Store the player ID in localStorage for persistence across sessions.
 */
export function getStoredPlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('ste_player_id');
  if (!id) {
    id = `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('ste_player_id', id);
  }
  return id;
}

/**
 * Store the best score for a country/difficulty combo.
 */
export function saveBestScore(country: string, difficulty: SteDifficulty, score: number): void {
  if (typeof window === 'undefined') return;
  const key = `ste_best_${country.toLowerCase()}_${difficulty}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  if (score > current) {
    localStorage.setItem(key, score.toString());
  }
}

export function getBestScore(country: string, difficulty: SteDifficulty): number {
  if (typeof window === 'undefined') return 0;
  const key = `ste_best_${country.toLowerCase()}_${difficulty}`;
  return parseInt(localStorage.getItem(key) || '0', 10);
}
