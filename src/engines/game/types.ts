// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Core Types
// ============================================================
// Universal type contracts for the extensible game platform.
// Backward-compatible with the existing EarthQuestion system.

import { EarthQuestion, QuizDifficulty } from '@/types';

// ---- Challenge Type Registry ----

/** All supported challenge types across all engines */
export type ChallengeType =
  // Geography Engine
  | 'GEO_GLOBE_HUNT'
  | 'GEO_RANDOM_LOCATION'
  | 'GEO_DISTANCE'
  | 'GEO_BORDER_ESCAPE'
  | 'GEO_COUNTRY_CHAIN'
  // Weather Engine
  | 'WEATHER_HUNT'
  | 'WEATHER_WIND'
  | 'WEATHER_TEMPERATURE'
  | 'WEATHER_RAIN'
  // News Engine
  | 'NEWS_DETECTIVE'
  | 'NEWS_LOCATION'
  | 'BREAKING_NEWS_CHALLENGE'
  // Article Engine
  | 'ARTICLE_QUIZ'
  // Earth Events Engine
  | 'EARTHQUAKE_HUNT'
  | 'EARTH_EVENT_LOCATION'
  // Time Engine
  | 'TIMEZONE_CHALLENGE'
  | 'DAY_NIGHT_CHALLENGE'
  // AI Mission Engine
  | 'AI_COMBINED_MISSION'
  // Legacy compatibility
  | 'CLASSIC_TRIVIA';

/** Game engine categories */
export type GameEngineType =
  | 'geography'
  | 'weather'
  | 'news'
  | 'earth_events'
  | 'time'
  | 'article'
  | 'ai_mission'
  | 'classic';

/** Extended difficulty tiers (superset of existing QuizDifficulty) */
export type ChallengeDifficulty = QuizDifficulty | 'expert';

/** How the user responds to a challenge */
export type ChallengeResponseType =
  | 'multiple_choice'   // Traditional 4-option selection
  | 'globe_tap'         // Tap a specific country polygon on the 3D globe
  | 'globe_point'       // Tap any point on the globe (lat/lng estimation)
  | 'numeric_input'     // Enter a number (distance, temperature, time)
  | 'slider'            // Slide to estimate a value
  | 'path_select';      // Select a sequence of countries (border escape)

// ---- Geographic Primitives ----

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

// ---- The Universal Challenge Contract ----

/**
 * EarthChallenge — the unified structure for all game engine outputs.
 *
 * This supersedes EarthQuestion for new challenge types while remaining
 * convertible to/from EarthQuestion for backward compatibility with
 * existing Explorer, Flag, and Capital modes.
 */
export interface EarthChallenge {
  id: string;
  type: ChallengeType;
  engine: GameEngineType;
  difficulty: ChallengeDifficulty;
  responseType: ChallengeResponseType;

  // ---- Display ----
  question: string;
  choices?: string[];            // For multiple_choice responseType
  hint?: string;                 // Optional clue shown to the player
  explanation?: string;          // Shown after answering

  // ---- Answer Definition ----
  correctIndex?: number;         // For multiple_choice
  targetCountry?: string;        // For globe_tap — the correct country name
  targetCity?: string;           // Display-only city name
  targetCoordinates?: GeoCoordinate;  // For globe_point / distance challenges
  correctValue?: number;         // For numeric_input (distance km, temperature °C, etc.)
  toleranceRadius?: number;      // Distance tolerance in km for globe_point
  correctPath?: string[];        // For path_select (border escape)

  // ---- Scoring & Timing ----
  points: number;                // Base point value for this challenge
  timeLimit: number;             // Seconds allowed

  // ---- Metadata ----
  generatedAt: string;           // ISO 8601 generation timestamp
  fingerprint: string;           // Anti-repeat hash (engine:type:target:seed)
  source?: string;               // Data attribution (e.g. 'Open-Meteo', 'USGS', 'Google News')
  sourceDataTimestamp?: string;  // When the underlying data was retrieved

  // ---- Optional payload for weather/earth/news data ----
  data?: Record<string, unknown>;
}

// ---- Scoring ----

export interface ScoringBreakdown {
  basePoints: number;
  accuracyBonus: number;
  speedBonus: number;
  difficultyMultiplier: number;
  streakMultiplier: number;
  specialBonus: number;          // Breaking news, daily challenge, etc.
  totalPoints: number;
}

export interface ScoringConfig {
  basePoints: Record<ChallengeDifficulty, number>;
  maxSpeedBonusPercent: number;  // e.g. 50 means up to +50% for fast answers
  streakMultiplierStep: number;  // e.g. 0.1 means +10% per streak level
  maxStreakMultiplier: number;   // Cap on streak multiplier
  breakingNewsBonus: number;     // Extra points for breaking news challenges
  dailyChallengeBonus: number;   // Extra points for daily challenge rounds
}

// ---- Validation ----

export interface ValidationResult {
  correct: boolean;
  distanceKm?: number;           // For location-based challenges
  accuracy?: number;             // 0.0 to 1.0 (1.0 = perfect)
  feedback: string;              // Human-readable result text
  correctAnswer?: string;        // Display string for the correct answer
}

/** Input the user provides when answering a challenge */
export interface UserResponse {
  choiceIndex?: number;          // For multiple_choice
  tappedCountry?: string;        // For globe_tap
  selectedCountry?: string;      // Alias for tappedCountry
  tappedCoordinate?: GeoCoordinate; // For globe_point
  numericValue?: number;         // For numeric_input / slider
  selectedPath?: string[];       // For path_select
  responseTimeMs: number;        // How long the user took
}

// ---- Session & Attempt Tracking ----

export interface ChallengeAttempt {
  challengeId: string;
  challengeType: ChallengeType;
  engine: GameEngineType;
  difficulty: ChallengeDifficulty;
  userResponse: UserResponse;
  validation: ValidationResult;
  scoring: ScoringBreakdown;
  timestamp: number;
}

export type GameSessionMode =
  | 'endless'
  | 'daily'
  | 'survival'
  | 'beat_the_clock'
  | 'globe_hunt'
  | 'weather_challenge'
  | 'news_detective'
  | 'article_quiz'
  | 'border_escape'
  // Legacy modes (existing Play Earth)
  | 'explorer'
  | 'flag'
  | 'capital';

export interface GameSessionState {
  sessionId: string;
  mode: GameSessionMode;
  startedAt: number;
  attempts: ChallengeAttempt[];
  currentStreak: number;
  totalScore: number;
  challengesCompleted: number;
  challengesFailed: number;
  activeChallenge: EarthChallenge | null;

  /** Engine rotation order for Endless mode */
  engineRotation: GameEngineType[];
  lastEngineIndex: number;

  /** Deterministic seed for Daily mode */
  dailySeed?: number;

  /** Beat-the-clock duration */
  clockDuration?: 30 | 60 | 120;

  /** Border escape state */
  borderPath?: string[];
  borderTarget?: string;
}

// ---- Player Stats Extension ----

export interface InfiniteEarthStats {
  totalChallenges: number;
  correctAnswers: number;
  accuracy: number;              // 0.0 to 1.0
  bestStreak: number;
  highestScore: number;
  countriesDiscovered: string[];
  newsStoriesCompleted: number;
  weatherChallengesCompleted: number;
  earthChallengesCompleted: number;
  favoriteGameMode: GameSessionMode | null;

  // XP by category
  geographyXP: number;
  newsXP: number;
  weatherXP: number;
  earthXP: number;
  explorationXP: number;
}

// ---- Provider Diagnostics ----

export interface ProviderStatus {
  name: string;
  engine: GameEngineType;
  available: boolean;
  lastSuccessfulFetch: number | null;
  lastError: string | null;
  cacheStatus: 'fresh' | 'stale' | 'empty';
  latencyMs: number | null;
}

// ---- Challenge Generation Request ----

export interface ChallengeRequest {
  engine?: GameEngineType;
  type?: ChallengeType;
  difficulty?: ChallengeDifficulty;
  targetCountry?: string;
  excludeFingerprints: string[];
  sessionMode: GameSessionMode;
}

// ---- Data Provider Interface ----

/**
 * Every data provider implements this interface.
 * The ChallengeGenerator dispatches to providers based on engine type.
 */
export interface DataProvider<T = unknown> {
  readonly engine: GameEngineType;
  readonly supportedTypes: ChallengeType[];

  /** Check if this provider can currently serve challenges */
  isAvailable(): Promise<boolean>;

  /** Get diagnostic status */
  getStatus(): ProviderStatus;

  /** Generate a single challenge from this provider */
  generateChallenge(request: ChallengeRequest): Promise<EarthChallenge | null>;

  /** Access cached data (for diagnostics or compound queries) */
  getCachedData?(): T | null;
}

// ---- Weather Data Types ----

export interface WeatherObservation {
  lat: number;
  lng: number;
  city: string;
  country: string;
  temperature: number;           // °C
  apparentTemperature: number;   // °C (feels like)
  precipitation: number;         // mm
  rain: number;                  // mm
  windSpeed: number;             // km/h
  windDirection: number;         // degrees (0-360)
  cloudCover: number;            // percentage (0-100)
  weatherCode: number;           // WMO weather interpretation code
  isDay: boolean;
  timestamp: string;             // ISO 8601 observation time
}

/** Batch of weather observations for game challenge generation */
export interface WeatherDataset {
  observations: WeatherObservation[];
  fetchedAt: number;             // Unix timestamp of fetch
  expiresAt: number;             // Unix timestamp when cache expires
}

// ---- Earth Event Types ----

export interface EarthEvent {
  id: string;
  type: 'earthquake' | 'volcanic' | 'storm';
  magnitude?: number;            // Richter scale for earthquakes
  depth?: number;                // km below surface
  location: string;              // Human-readable description
  country?: string;              // Resolved country name
  coordinates: GeoCoordinate;
  timestamp: string;             // ISO 8601 event time
  source: string;                // Attribution (e.g. 'USGS')
  sourceUrl?: string;
}

export interface EarthEventDataset {
  events: EarthEvent[];
  fetchedAt: number;
  expiresAt: number;
}

// ---- Conversion Utilities ----

/**
 * Convert an existing EarthQuestion to an EarthChallenge for unified processing.
 * Preserves all existing data while wrapping in the new contract.
 */
export function earthQuestionToChallenge(q: EarthQuestion): EarthChallenge {
  return {
    id: q.id,
    type: 'CLASSIC_TRIVIA',
    engine: 'classic',
    difficulty: q.difficulty as ChallengeDifficulty,
    responseType: 'multiple_choice',
    question: q.question,
    choices: q.choices,
    correctIndex: q.correctIndex,
    explanation: q.funFact,
    targetCountry: q.country,
    points: q.difficulty === 'hard' ? 500 : q.difficulty === 'medium' ? 250 : 100,
    timeLimit: 15,
    generatedAt: q.timestamp ? new Date(q.timestamp).toISOString() : new Date().toISOString(),
    fingerprint: `classic:trivia:${q.country}:${q.id}`,
    source: 'Play Earth Question Bank',
  };
}

/**
 * Convert an EarthChallenge back to an EarthQuestion for legacy UI compatibility.
 * Only works for multiple_choice challenges.
 */
export function challengeToEarthQuestion(c: EarthChallenge): EarthQuestion | null {
  if (c.responseType !== 'multiple_choice' || !c.choices || c.correctIndex === undefined) {
    return null;
  }
  return {
    id: c.id,
    country: c.targetCountry || 'Global',
    category: 'mixed',
    difficulty: c.difficulty === 'expert' ? 'hard' : c.difficulty,
    question: c.question,
    choices: c.choices,
    correctIndex: c.correctIndex,
    funFact: c.explanation,
    timestamp: Date.now(),
  };
}
