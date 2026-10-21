// ============================================================
// MooEarth Live — Stop the Earth Game: Core Types
// ============================================================
// Type contracts for the map-click geography game engine.
// Players locate real places on an interactive map and earn
// points based on distance accuracy and speed.

import { GeoCoordinate } from '../types';

// ---- Question Types ----

/** Supported place categories for geographic questions */
export type GeoQuestionType =
  | 'capital'
  | 'city'
  | 'landmark'
  | 'wonder'
  | 'mountain'
  | 'river'
  | 'lake'
  | 'island'
  | 'natural'
  | 'park';

/** Difficulty tiers with distance tolerance configuration */
export type SteDifficulty = 'easy' | 'medium' | 'hard';

/** Game modes */
export type SteGameMode = 'country-challenge' | 'time-attack' | 'world-challenge' | 'daily';

/**
 * A single verified geographic question in the question bank.
 * All coordinates are pre-verified against country membership.
 */
export interface GeoQuestion {
  /** Unique stable ID: "ste-{countryCode}-{placeId}" */
  id: string;
  /** Canonical place ID from the WorldPlace or CountryMetadata registry */
  placeId: string;
  /** Human-readable place name (e.g. "Taj Mahal", "Jaipur") */
  placeName: string;
  /** Country name (e.g. "India") */
  country: string;
  /** ISO 3166-1 alpha-2 code (e.g. "IN") */
  countryCode: string;
  /** Place category */
  type: GeoQuestionType;
  /** Difficulty tier */
  difficulty: SteDifficulty;
  /** Verified answer coordinates */
  coordinates: GeoCoordinate;
  /** Distance in km within which the answer is considered "correct" */
  toleranceKm: number;
  /** Full question text: "Find the Taj Mahal in India" */
  questionText: string;
  /** Optional geographic hint */
  hint?: string;
  /** Explanation / fun fact shown after answering */
  explanation?: string;
  /** Geographic region (e.g. "South Asia", "Western Europe") */
  region?: string;
  /** Content fingerprint for dedup: hash of normalized(placeName + country + type) */
  fingerprint: string;
  /** Must be true before the question can be served */
  verified: boolean;
  /** Data provenance */
  source: string;
}

// ---- Country Bounds ----

/** Approximate bounding box for a country's geographic extent */
export interface CountryBounds {
  countryCode: string;
  name: string;
  /** Southwest corner of bounding box */
  sw: GeoCoordinate;
  /** Northeast corner of bounding box */
  ne: GeoCoordinate;
  /** Geographic center (for map centering) */
  center: GeoCoordinate;
  /** Recommended initial zoom level for MapLibre */
  zoom: number;
}

// ---- Game Session ----

/** Server-side game session for Stop the Earth */
export interface SteSession {
  sessionId: string;
  playerId: string;
  country: string;
  countryCode: string;
  difficulty: SteDifficulty;
  mode: SteGameMode;
  currentQuestionId: string | null;
  currentQuestionAssignedAt: number | null;
  roundNumber: number;
  maxRounds: number;
  totalScore: number;
  streak: number;
  bestGuessKm: number | null;
  totalDistanceKm: number;
  questionsCorrect: number;
  startedAt: number;
  status: 'active' | 'completed' | 'abandoned';
  /** Round history for end-of-game summary */
  rounds: SteRoundResult[];
}

/** Result of a single round */
export interface SteRoundResult {
  questionId: string;
  placeName: string;
  guessCoordinates: GeoCoordinate | null;
  answerCoordinates: GeoCoordinate;
  distanceKm: number | null;
  score: number;
  responseTimeMs: number;
  feedback: string;
}

// ---- Scoring ----

/** Scoring breakdown for a single round */
export interface SteScoreBreakdown {
  /** Base accuracy score (0-1000) */
  baseScore: number;
  /** Speed bonus (0-500) */
  speedBonus: number;
  /** Difficulty multiplier (1.0, 1.5, 2.0) */
  difficultyMultiplier: number;
  /** Streak multiplier (1.0 - 3.0) */
  streakMultiplier: number;
  /** Final computed score for this round */
  totalScore: number;
}

/** Distance-based feedback tier */
export interface DistanceTier {
  label: string;
  emoji: string;
  minDistanceKm: number;
  maxDistanceKm: number;
}

// ---- API Request / Response Contracts ----

export interface SteQuestionRequest {
  sessionId?: string;
  playerId?: string;
  country: string;
  difficulty: SteDifficulty;
  mode: SteGameMode;
}

export interface SteQuestionResponse {
  sessionId: string;
  questionId: string;
  questionText: string;
  placeName: string;
  country: string;
  countryCode: string;
  type: GeoQuestionType;
  hint?: string;
  roundNumber: number;
  maxRounds: number;
  timeLimit: number;
  totalScore: number;
  streak: number;
  /** Country bounding box for map view */
  bounds: CountryBounds;
}

export interface SteAnswerRequest {
  sessionId: string;
  questionId: string;
  guessLat: number;
  guessLng: number;
  responseTimeMs: number;
}

export interface SteAnswerResponse {
  correct: boolean;
  distanceKm: number;
  accuracy: number;
  scoring: SteScoreBreakdown;
  feedback: string;
  correctCoordinates: GeoCoordinate;
  explanation?: string;
  placeName: string;
  /** Updated session totals */
  totalScore: number;
  streak: number;
  roundNumber: number;
  maxRounds: number;
  /** Whether the game is now complete */
  gameComplete: boolean;
}

export interface SteSummaryResponse {
  totalScore: number;
  questionsAnswered: number;
  questionsCorrect: number;
  avgDistanceKm: number;
  bestGuessKm: number | null;
  longestStreak: number;
  totalTimeMs: number;
  rounds: SteRoundResult[];
  country: string;
  difficulty: SteDifficulty;
  mode: SteGameMode;
}

// ---- Configuration ----

/** Per-difficulty scoring and timing configuration */
export interface SteDifficultyConfig {
  /** Maximum distance (km) for partial credit */
  maxScoringDistanceKm: number;
  /** Distance (km) within which the answer is "correct" */
  defaultToleranceKm: number;
  /** Seconds allowed per question */
  timeLimitSeconds: number;
  /** Scoring multiplier */
  multiplier: number;
  /** Number of rounds per game */
  rounds: number;
}

export const STE_DIFFICULTY_CONFIG: Record<SteDifficulty, SteDifficultyConfig> = {
  easy: {
    maxScoringDistanceKm: 500,
    defaultToleranceKm: 50,
    timeLimitSeconds: 30,
    multiplier: 1.0,
    rounds: 5,
  },
  medium: {
    maxScoringDistanceKm: 300,
    defaultToleranceKm: 30,
    timeLimitSeconds: 20,
    multiplier: 1.5,
    rounds: 7,
  },
  hard: {
    maxScoringDistanceKm: 150,
    defaultToleranceKm: 15,
    timeLimitSeconds: 15,
    multiplier: 2.0,
    rounds: 10,
  },
};
