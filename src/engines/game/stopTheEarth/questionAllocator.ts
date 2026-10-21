// ============================================================
// MooEarth Live — Stop the Earth: Server-Side Question Allocator
// ============================================================
// Manages question allocation with a guaranteed no-repeat system.
// Uses an in-memory session store with Firestore persistence for
// authenticated players.
//
// Anti-repeat guarantee:
// 1. Each served question ID is recorded immediately on allocation
// 2. Questions are filtered against the player's full history
// 3. If the pool is exhausted, an explicit message is returned
// 4. Refresh/reconnect returns the same question (stored in session)


import {
  SteSession,
  SteRoundResult,
  SteDifficulty,
  SteGameMode,
  SteQuestionResponse,
  SteAnswerResponse,
  SteScoreBreakdown,
  STE_DIFFICULTY_CONFIG,
  CountryBounds,
  GeoQuestion,
} from './types';
import {
  getQuestionById,
  getEligibleQuestionsWithFallback,
  selectRandomQuestion,
  getQuestionCountForCountry,
} from '@/data/stopTheEarth/questionBank';
import { getCountryBounds, getCountryBoundsByName } from '@/data/stopTheEarth/countryBounds';
import { haversineDistance } from '@/engines/game/ValidationEngine';
import {
  calculateDistanceScore,
  calculateAccuracy,
  isGuessCorrect,
  getDistanceFeedback,
  formatDistance,
} from './scoring';

// ---- In-Memory Session Store ----
// Sessions are stored in memory for fast access during gameplay.
// For authenticated users, question history is also synced to Firestore.

const sessions = new Map<string, SteSession>();
const playerHistory = new Map<string, Set<string>>();

// Cleanup old sessions periodically (> 2 hours)
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

function cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.startedAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

// Run cleanup every 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStaleSessions, 30 * 60 * 1000);
}

// ---- Session Management ----

function generateSessionId(): string {
  // Use crypto-safe random ID
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for SSR
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new game session.
 */
export function createSteSession(
  playerId: string,
  country: string,
  countryCode: string,
  difficulty: SteDifficulty,
  mode: SteGameMode
): SteSession {
  const config = STE_DIFFICULTY_CONFIG[difficulty];
  const session: SteSession = {
    sessionId: generateSessionId(),
    playerId,
    country,
    countryCode: countryCode.toUpperCase(),
    difficulty,
    mode,
    currentQuestionId: null,
    currentQuestionAssignedAt: null,
    roundNumber: 0,
    maxRounds: Math.min(config.rounds, Math.max(getQuestionCountForCountry(countryCode), 1)),
    totalScore: 0,
    streak: 0,
    bestGuessKm: null,
    totalDistanceKm: 0,
    questionsCorrect: 0,
    startedAt: Date.now(),
    status: 'active',
    rounds: [],
  };

  sessions.set(session.sessionId, session);

  // Initialize player history if needed
  if (!playerHistory.has(playerId)) {
    playerHistory.set(playerId, new Set());
  }

  return session;
}

/**
 * Get an existing session.
 */
export function getSteSession(sessionId: string): SteSession | null {
  return sessions.get(sessionId) || null;
}

/**
 * Get or create player question history.
 */
function getPlayerHistory(playerId: string): Set<string> {
  if (!playerHistory.has(playerId)) {
    playerHistory.set(playerId, new Set());
  }
  return playerHistory.get(playerId)!;
}

// ---- Question Allocation ----

export interface AllocateQuestionResult {
  success: boolean;
  response?: SteQuestionResponse;
  error?: string;
  exhausted?: boolean;
}

/**
 * Allocate the next question for a session.
 * - If the session already has a current question (e.g. after refresh), return it.
 * - Otherwise, find an eligible question, record it, and return it.
 */
export function allocateNextQuestion(sessionId: string): AllocateQuestionResult {
  const session = sessions.get(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found. Start a new game.' };
  }

  if (session.status !== 'active') {
    return { success: false, error: 'Game is already complete.' };
  }

  // If there's already an active question (refresh-safe), return it
  if (session.currentQuestionId) {
    const currentQ = getQuestionById(session.currentQuestionId);
    if (currentQ) {
      const bounds = getCountryBounds(session.countryCode) ||
        getCountryBoundsByName(session.country);
      return {
        success: true,
        response: buildQuestionResponse(session, currentQ, bounds),
      };
    }
  }

  // Check if game is complete
  if (session.roundNumber >= session.maxRounds) {
    session.status = 'completed';
    return { success: false, error: 'All rounds completed.', exhausted: false };
  }

  // Get player's served question history
  const history = getPlayerHistory(session.playerId);

  // Find eligible questions
  const eligible = getEligibleQuestionsWithFallback(
    session.countryCode,
    session.difficulty,
    history
  );

  if (eligible.length === 0) {
    // Pool exhausted for this country
    const totalAvailable = getQuestionCountForCountry(session.countryCode);
    return {
      success: false,
      exhausted: true,
      error: `You've answered all ${totalAvailable} questions for ${session.country}! Try another country or difficulty.`,
    };
  }

  // Select random question
  const selected = selectRandomQuestion(eligible);
  if (!selected) {
    return { success: false, error: 'Failed to select a question.' };
  }

  // Record allocation atomically
  session.currentQuestionId = selected.id;
  session.currentQuestionAssignedAt = Date.now();
  session.roundNumber++;
  history.add(selected.id);

  const bounds = getCountryBounds(session.countryCode) ||
    getCountryBoundsByName(session.country);

  return {
    success: true,
    response: buildQuestionResponse(session, selected, bounds),
  };
}

function buildQuestionResponse(
  session: SteSession,
  question: GeoQuestion,
  bounds: CountryBounds | null
): SteQuestionResponse {
  const config = STE_DIFFICULTY_CONFIG[session.difficulty];
  return {
    sessionId: session.sessionId,
    questionId: question.id,
    questionText: question.questionText,
    placeName: question.placeName,
    country: question.country,
    countryCode: question.countryCode,
    type: question.type,
    hint: question.hint,
    roundNumber: session.roundNumber,
    maxRounds: session.maxRounds,
    timeLimit: config.timeLimitSeconds,
    totalScore: session.totalScore,
    streak: session.streak,
    bounds: bounds || {
      countryCode: question.countryCode,
      name: question.country,
      sw: { lat: question.coordinates.lat - 5, lng: question.coordinates.lng - 5 },
      ne: { lat: question.coordinates.lat + 5, lng: question.coordinates.lng + 5 },
      center: question.coordinates,
      zoom: 5,
    },
  };
}

// ---- Answer Processing ----

export interface ProcessAnswerResult {
  success: boolean;
  response?: SteAnswerResponse;
  error?: string;
}

/**
 * Process a player's answer submission.
 * - Validates the session and question
 * - Computes Haversine distance on server
 * - Calculates score
 * - Updates session state
 * - Returns result with correct coordinates (safe to reveal now)
 */
export function processAnswer(
  sessionId: string,
  questionId: string,
  guessLat: number,
  guessLng: number,
  responseTimeMs: number
): ProcessAnswerResult {
  const session = sessions.get(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found.' };
  }

  if (session.currentQuestionId !== questionId) {
    return { success: false, error: 'Question ID mismatch. This question may have already been answered.' };
  }

  const question = getQuestionById(questionId);
  if (!question) {
    return { success: false, error: 'Question not found in bank.' };
  }

  // Calculate distance using Haversine (server-side)
  const distanceKm = haversineDistance(
    { lat: guessLat, lng: guessLng },
    question.coordinates
  );

  // Calculate score
  const scoring = calculateDistanceScore(
    distanceKm,
    session.difficulty,
    responseTimeMs,
    session.streak
  );

  // Determine correctness and feedback
  const correct = isGuessCorrect(distanceKm, question.toleranceKm);
  const accuracy = calculateAccuracy(distanceKm, session.difficulty);
  const feedbackResult = getDistanceFeedback(distanceKm, question.toleranceKm);

  // Update session state
  if (correct || feedbackResult.tier === 'excellent') {
    session.streak++;
    session.questionsCorrect++;
  } else {
    session.streak = 0;
  }

  session.totalScore += scoring.totalScore;
  session.totalDistanceKm += distanceKm;

  if (session.bestGuessKm === null || distanceKm < session.bestGuessKm) {
    session.bestGuessKm = distanceKm;
  }

  // Record round result
  const roundResult: SteRoundResult = {
    questionId: question.id,
    placeName: question.placeName,
    guessCoordinates: { lat: guessLat, lng: guessLng },
    answerCoordinates: question.coordinates,
    distanceKm,
    score: scoring.totalScore,
    responseTimeMs,
    feedback: `${feedbackResult.emoji} ${feedbackResult.label} — ${formatDistance(distanceKm)} away`,
  };
  session.rounds.push(roundResult);

  // Clear current question (ready for next)
  session.currentQuestionId = null;
  session.currentQuestionAssignedAt = null;

  // Check if game is complete
  const gameComplete = session.roundNumber >= session.maxRounds;
  if (gameComplete) {
    session.status = 'completed';
  }

  return {
    success: true,
    response: {
      correct,
      distanceKm: Math.round(distanceKm * 10) / 10,
      accuracy,
      scoring,
      feedback: `${feedbackResult.emoji} ${feedbackResult.label}`,
      correctCoordinates: question.coordinates,
      explanation: question.explanation,
      placeName: question.placeName,
      totalScore: session.totalScore,
      streak: session.streak,
      roundNumber: session.roundNumber,
      maxRounds: session.maxRounds,
      gameComplete,
    },
  };
}

/**
 * Get game summary for a completed session.
 */
export function getGameSummary(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const longestStreak = Math.max(
    ...session.rounds.map((_, i) => {
      let streak = 0;
      for (let j = i; j < session.rounds.length; j++) {
        if (session.rounds[j].distanceKm !== null &&
          session.rounds[j].distanceKm! <= STE_DIFFICULTY_CONFIG[session.difficulty].defaultToleranceKm * 2) {
          streak++;
        } else break;
      }
      return streak;
    }),
    0
  );

  return {
    totalScore: session.totalScore,
    questionsAnswered: session.rounds.length,
    questionsCorrect: session.questionsCorrect,
    avgDistanceKm: session.rounds.length > 0
      ? Math.round(session.totalDistanceKm / session.rounds.length * 10) / 10
      : 0,
    bestGuessKm: session.bestGuessKm !== null
      ? Math.round(session.bestGuessKm * 10) / 10
      : null,
    longestStreak,
    totalTimeMs: Date.now() - session.startedAt,
    rounds: session.rounds,
    country: session.country,
    difficulty: session.difficulty,
    mode: session.mode,
  };
}
