// ============================================================
// MooEarth Live — Stop the Earth: Distance-Based Scoring Engine
// ============================================================
// Calculates player score based on:
// 1. Distance accuracy (Haversine distance from guess to answer)
// 2. Speed bonus (faster answers earn more)
// 3. Difficulty multiplier (harder = more points)
// 4. Streak multiplier (consecutive good guesses earn more)

import { SteScoreBreakdown, SteDifficulty, STE_DIFFICULTY_CONFIG } from './types';

// ---- Distance Feedback Tiers ----

export interface FeedbackResult {
  emoji: string;
  label: string;
  tier: 'perfect' | 'excellent' | 'good' | 'fair' | 'miss';
}

/**
 * Get feedback tier based on distance and tolerance.
 */
export function getDistanceFeedback(distanceKm: number, toleranceKm: number): FeedbackResult {
  if (distanceKm <= toleranceKm) {
    return { emoji: '🎯', label: 'Bullseye!', tier: 'perfect' };
  }
  if (distanceKm <= toleranceKm * 2) {
    return { emoji: '🌟', label: 'Very close!', tier: 'excellent' };
  }
  if (distanceKm <= toleranceKm * 5) {
    return { emoji: '⚡', label: 'Close!', tier: 'good' };
  }
  if (distanceKm <= toleranceKm * 10) {
    return { emoji: '📍', label: 'In the region', tier: 'fair' };
  }
  return { emoji: '🌐', label: 'Not quite!', tier: 'miss' };
}

/**
 * Calculate the full score breakdown for a single round.
 *
 * Formula:
 *   accuracyRatio = max(0, 1 - distance / maxScoringDistance)
 *   baseScore = 1000 × accuracyRatio
 *   speedBonus = baseScore × 0.5 × max(0, 1 - timeUsed/timeLimit)
 *   difficultyMultiplier = { easy: 1.0, medium: 1.5, hard: 2.0 }
 *   streakMultiplier = min(1 + streak × 0.1, 3.0)
 *   totalScore = round((baseScore + speedBonus) × difficultyMultiplier × streakMultiplier)
 */
export function calculateDistanceScore(
  distanceKm: number,
  difficulty: SteDifficulty,
  responseTimeMs: number,
  currentStreak: number
): SteScoreBreakdown {
  const config = STE_DIFFICULTY_CONFIG[difficulty];
  const maxDist = config.maxScoringDistanceKm;
  const timeLimitMs = config.timeLimitSeconds * 1000;

  // 1. Accuracy score (0-1000)
  const accuracyRatio = Math.max(0, 1 - distanceKm / maxDist);
  const baseScore = Math.round(1000 * accuracyRatio);

  // 2. Speed bonus (0 - 500): faster answers earn up to 50% of base
  const timeRatio = Math.max(0, 1 - responseTimeMs / timeLimitMs);
  const speedBonus = Math.round(baseScore * 0.5 * timeRatio);

  // 3. Difficulty multiplier
  const difficultyMultiplier = config.multiplier;

  // 4. Streak multiplier: +10% per streak, capped at 3x
  const streakMultiplier = Math.min(1 + currentStreak * 0.1, 3.0);

  // 5. Final score
  const totalScore = Math.round((baseScore + speedBonus) * difficultyMultiplier * streakMultiplier);

  return {
    baseScore,
    speedBonus,
    difficultyMultiplier,
    streakMultiplier,
    totalScore,
  };
}

/**
 * Calculate accuracy percentage (0-100).
 */
export function calculateAccuracy(distanceKm: number, difficulty: SteDifficulty): number {
  const maxDist = STE_DIFFICULTY_CONFIG[difficulty].maxScoringDistanceKm;
  return Math.round(Math.max(0, (1 - distanceKm / maxDist)) * 100);
}

/**
 * Determine if a guess counts as "correct" (within tolerance).
 */
export function isGuessCorrect(distanceKm: number, toleranceKm: number): boolean {
  return distanceKm <= toleranceKm;
}

/**
 * Format distance for display.
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm).toLocaleString()} km`;
}
