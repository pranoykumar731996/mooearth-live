// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Scoring Engine
// ============================================================
// Central, configurable scoring service. Calculates total points
// from base score, accuracy, speed, difficulty multiplier,
// streak bonuses, and special challenge bonuses.

import {
  ChallengeDifficulty,
  ScoringBreakdown,
  ScoringConfig,
  EarthChallenge,
  UserResponse,
  ValidationResult,
  GameSessionState,
} from './types';
import { getBasePoints } from './registry';

// ---- Default Configuration ----

const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  basePoints: {
    easy: 100,
    medium: 250,
    hard: 500,
    expert: 750,
  },
  maxSpeedBonusPercent: 50,      // Up to +50% for very fast answers
  streakMultiplierStep: 0.1,     // +10% per streak level
  maxStreakMultiplier: 3.0,       // Cap at 3x
  breakingNewsBonus: 100,        // Extra for breaking news challenges
  dailyChallengeBonus: 50,       // Extra per daily round
};

let activeConfig: ScoringConfig = { ...DEFAULT_SCORING_CONFIG };

// ---- Configuration ----

/** Update the active scoring configuration */
export function configureScoringEngine(config: Partial<ScoringConfig>): void {
  activeConfig = { ...activeConfig, ...config };
}

/** Reset to default configuration */
export function resetScoringConfig(): void {
  activeConfig = { ...DEFAULT_SCORING_CONFIG };
}

/** Get the current active configuration (read-only) */
export function getScoringConfig(): Readonly<ScoringConfig> {
  return activeConfig;
}

// ---- Score Calculation ----

/**
 * Calculate the full scoring breakdown for a completed challenge.
 *
 * @param challenge - The challenge that was answered
 * @param response - The user's response
 * @param validation - The validation result
 * @param session - Current session state (for streak multiplier)
 * @returns Complete scoring breakdown
 */
export function calculateScore(
  challenge: EarthChallenge,
  response: UserResponse,
  validation: ValidationResult,
  session: Partial<Pick<GameSessionState, 'currentStreak' | 'mode'>> = {}
): ScoringBreakdown {
  const currentStreak = session.currentStreak ?? 0;
  const mode = session.mode ?? 'endless';

  // 1. Base points (from registry or challenge itself)
  const registryBase = getBasePoints(challenge.type, challenge.difficulty);
  const basePoints = challenge.points || registryBase;

  // If incorrect, minimal consolation points
  if (!validation.correct) {
    return {
      basePoints: 0,
      accuracyBonus: 0,
      speedBonus: 0,
      difficultyMultiplier: 1,
      streakMultiplier: 1,
      specialBonus: 0,
      totalPoints: 0,
    };
  }

  // 2. Accuracy bonus (for distance/estimation challenges)
  let accuracyBonus = 0;
  if (validation.accuracy !== undefined && validation.accuracy > 0) {
    // Scale from 0% to 100% of base points based on accuracy
    accuracyBonus = Math.round(basePoints * validation.accuracy * 0.5);
  }

  // 3. Speed bonus — faster answers get up to maxSpeedBonusPercent extra
  let speedBonus = 0;
  if (challenge.timeLimit > 0 && response.responseTimeMs > 0) {
    const timeLimitMs = challenge.timeLimit * 1000;
    const timeUsedFraction = Math.min(response.responseTimeMs / timeLimitMs, 1.0);
    // Linear: answering instantly = full bonus, using all time = 0 bonus
    const speedFactor = Math.max(0, 1 - timeUsedFraction);
    const maxBonus = basePoints * (activeConfig.maxSpeedBonusPercent / 100);
    speedBonus = Math.round(maxBonus * speedFactor);
  }

  // 4. Difficulty multiplier
  const difficultyMultipliers: Record<ChallengeDifficulty, number> = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0,
    expert: 3.0,
  };
  const difficultyMultiplier = difficultyMultipliers[challenge.difficulty] ?? 1.0;

  // 5. Streak multiplier (capped)
  const streakLevel = Math.max(0, currentStreak);
  const streakMultiplier = Math.min(
    1 + streakLevel * activeConfig.streakMultiplierStep,
    activeConfig.maxStreakMultiplier
  );

  // 6. Special bonuses
  let specialBonus = 0;
  if (challenge.type === 'BREAKING_NEWS_CHALLENGE') {
    specialBonus += activeConfig.breakingNewsBonus;
  }
  if (mode === 'daily') {
    specialBonus += activeConfig.dailyChallengeBonus;
  }

  // 7. Total calculation
  const subtotal = (basePoints + accuracyBonus + speedBonus) * difficultyMultiplier * streakMultiplier;
  const totalPoints = Math.round(subtotal + specialBonus);

  return {
    basePoints,
    accuracyBonus,
    speedBonus,
    difficultyMultiplier,
    streakMultiplier,
    specialBonus,
    totalPoints,
  };
}

/**
 * Map total XP to the corresponding category for the engine type.
 * Returns { category, xp } for updating InfiniteEarthStats.
 */
export function getXPCategory(
  engine: string
): 'geographyXP' | 'newsXP' | 'weatherXP' | 'earthXP' | 'explorationXP' {
  switch (engine) {
    case 'geography':
    case 'classic':
      return 'geographyXP';
    case 'news':
    case 'article':
      return 'newsXP';
    case 'weather':
      return 'weatherXP';
    case 'earth_events':
      return 'earthXP';
    case 'time':
    case 'ai_mission':
    default:
      return 'explorationXP';
  }
}
