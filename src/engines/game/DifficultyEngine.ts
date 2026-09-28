// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Difficulty Engine
// ============================================================
// Dynamically calculates challenge difficulty based on player
// performance, country familiarity, geographic distance, and
// challenge-type complexity.

import { ChallengeDifficulty, ChallengeType, GameSessionState } from './types';
import { COUNTRY_METADATA, CountryMeta } from '@/data/questions/countryMetadata';

// ---- Difficulty Tiers ----

const DIFFICULTY_THRESHOLDS = {
  easy: 0,
  medium: 0.3,
  hard: 0.6,
  expert: 0.85,
} as const;

// ---- Country Familiarity Scores ----
// Countries most people recognize (lower = more familiar)

const FAMILIARITY_TIERS: Record<string, number> = {};

// Tier 1: Very well-known (familiarity = 0.1)
['United States', 'United Kingdom', 'France', 'Germany', 'Japan', 'China', 'India',
  'Brazil', 'Australia', 'Canada', 'Italy', 'Spain', 'Russia', 'Mexico'].forEach(c => {
  FAMILIARITY_TIERS[c.toLowerCase()] = 0.1;
});

// Tier 2: Well-known (familiarity = 0.3)
['South Korea', 'Argentina', 'Egypt', 'South Africa', 'Turkey', 'Thailand',
  'Indonesia', 'Saudi Arabia', 'Nigeria', 'Pakistan', 'Israel', 'Iran',
  'Netherlands', 'Sweden', 'Switzerland', 'Portugal', 'Greece', 'Poland'].forEach(c => {
  FAMILIARITY_TIERS[c.toLowerCase()] = 0.3;
});

// Tier 3: Moderately known (familiarity = 0.5)
['Colombia', 'Peru', 'Chile', 'Philippines', 'Vietnam', 'Malaysia',
  'Morocco', 'Kenya', 'Ukraine', 'Norway', 'Denmark', 'Finland',
  'Belgium', 'Austria', 'Czech Republic', 'Ireland', 'New Zealand'].forEach(c => {
  FAMILIARITY_TIERS[c.toLowerCase()] = 0.5;
});

// Default for unlisted countries: 0.7 (less familiar)

/**
 * Get the familiarity score for a country (0 = very familiar, 1 = obscure).
 */
export function getCountryFamiliarity(country: string): number {
  return FAMILIARITY_TIERS[country.toLowerCase()] ?? 0.7;
}

// ---- Difficulty Calculation ----

/** Factors considered when computing challenge difficulty */
export interface DifficultyFactors {
  countryFamiliarity: number;   // 0.0 (very familiar) to 1.0 (obscure)
  geographicDistance: number;   // Normalized 0-1 based on hemisphere distance
  choiceCount: number;          // Number of options (fewer = harder)
  timePressure: number;         // 0-1 based on time limit vs default
  dataSourceCount: number;      // For AI missions: how many data sources combined
  playerPerformance: number;    // 0-1 based on recent accuracy
}

/**
 * Calculate a composite difficulty score from multiple factors.
 * Returns a value between 0.0 (trivial) and 1.0 (extreme).
 */
export function computeDifficultyScore(factors: Partial<DifficultyFactors>): number {
  const weights = {
    countryFamiliarity: 0.25,
    geographicDistance: 0.15,
    choiceCount: 0.10,
    timePressure: 0.15,
    dataSourceCount: 0.10,
    playerPerformance: 0.25,
  };

  const values: DifficultyFactors = {
    countryFamiliarity: factors.countryFamiliarity ?? 0.5,
    geographicDistance: factors.geographicDistance ?? 0.5,
    choiceCount: factors.choiceCount ?? 0.5,
    timePressure: factors.timePressure ?? 0.5,
    dataSourceCount: factors.dataSourceCount ?? 0,
    playerPerformance: factors.playerPerformance ?? 0.5,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += values[key as keyof DifficultyFactors] * weight;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Map a numeric difficulty score (0-1) to a ChallengeDifficulty tier.
 */
export function scoreToDifficulty(score: number): ChallengeDifficulty {
  if (score >= DIFFICULTY_THRESHOLDS.expert) return 'expert';
  if (score >= DIFFICULTY_THRESHOLDS.hard) return 'hard';
  if (score >= DIFFICULTY_THRESHOLDS.medium) return 'medium';
  return 'easy';
}

/**
 * Calculate the difficulty tier for a challenge based on player session state
 * and target country.
 */
export function calculateDifficulty(
  targetCountry: string | undefined,
  session: Pick<GameSessionState, 'attempts' | 'currentStreak' | 'challengesCompleted'>,
  challengeType?: ChallengeType
): ChallengeDifficulty {
  // 1. Country familiarity
  const familiarity = targetCountry ? getCountryFamiliarity(targetCountry) : 0.5;

  // 2. Player performance — accuracy over last 10 attempts
  const recentAttempts = session.attempts.slice(-10);
  let playerPerformance = 0.5;
  if (recentAttempts.length >= 3) {
    const correctCount = recentAttempts.filter(a => a.validation.correct).length;
    const accuracy = correctCount / recentAttempts.length;
    // High accuracy = player is doing well = increase difficulty
    playerPerformance = accuracy;
  }

  // 3. Streak pressure — longer streaks push toward harder challenges
  const streakFactor = Math.min(session.currentStreak / 10, 1.0);

  // 4. Challenge count ramp — gradually increase difficulty over a session
  const rampFactor = Math.min(session.challengesCompleted / 20, 1.0);

  // 5. Challenge type complexity modifier
  let typeModifier = 0;
  if (challengeType === 'GEO_BORDER_ESCAPE' || challengeType === 'AI_COMBINED_MISSION') {
    typeModifier = 0.2; // Inherently harder challenge types
  }

  const score = computeDifficultyScore({
    countryFamiliarity: familiarity,
    playerPerformance: playerPerformance * 0.6 + streakFactor * 0.2 + rampFactor * 0.2,
    dataSourceCount: typeModifier,
  });

  return scoreToDifficulty(score);
}

/**
 * Select an appropriate country for a given difficulty tier.
 * Easy = familiar countries, Hard = obscure countries.
 */
export function selectCountryForDifficulty(
  difficulty: ChallengeDifficulty,
  excludeCountries: string[] = []
): string {
  const exclude = new Set(excludeCountries.map(c => c.toLowerCase()));
  const metaEntries = (Object.values(COUNTRY_METADATA) as CountryMeta[]).filter(
    m => m.name && !exclude.has(m.name.toLowerCase())
  );

  if (metaEntries.length === 0) {
    // Absolute fallback
    return 'India';
  }

  // Filter by familiarity tier
  let pool = metaEntries;
  if (difficulty === 'easy') {
    pool = metaEntries.filter(m => getCountryFamiliarity(m.name) <= 0.3);
  } else if (difficulty === 'medium') {
    pool = metaEntries.filter(m => {
      const f = getCountryFamiliarity(m.name);
      return f > 0.1 && f <= 0.6;
    });
  } else if (difficulty === 'hard') {
    pool = metaEntries.filter(m => getCountryFamiliarity(m.name) >= 0.4);
  } else {
    pool = metaEntries.filter(m => getCountryFamiliarity(m.name) >= 0.5);
  }

  // Fallback to full pool if filters are too aggressive
  if (pool.length < 3) pool = metaEntries;

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx].name;
}

/**
 * Adjust the time limit based on difficulty tier.
 */
export function adjustTimeLimit(baseTimeLimit: number, difficulty: ChallengeDifficulty): number {
  const multipliers: Record<ChallengeDifficulty, number> = {
    easy: 1.5,
    medium: 1.0,
    hard: 0.75,
    expert: 0.5,
  };
  return Math.round(baseTimeLimit * multipliers[difficulty]);
}
