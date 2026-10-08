// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Challenge Registry
// ============================================================
// Registry-based system for enabling, disabling, and configuring
// challenge types. Each registered type declares its engine, default
// time limit, UI prompt template, required data provider, and scoring tier.

import {
  ChallengeType,
  GameEngineType,
  ChallengeDifficulty,
  ChallengeResponseType,
} from './types';

// ---- Registry Entry Definition ----

export interface ChallengeRegistryEntry {
  type: ChallengeType;
  engine: GameEngineType;
  label: string;                     // Human-readable name
  emoji: string;                     // Display emoji
  description: string;               // Short description for UI
  responseType: ChallengeResponseType;
  defaultTimeLimit: number;          // Seconds
  basePoints: Record<ChallengeDifficulty, number>;
  enabled: boolean;                  // Toggle on/off without removing
  requiresLiveData: boolean;         // If true, cannot run offline/without provider
  minimumDifficulty: ChallengeDifficulty; // Lowest difficulty this type supports
}

// ---- Challenge Type Registry ----

const CHALLENGE_REGISTRY: Map<ChallengeType, ChallengeRegistryEntry> = new Map();

function register(entry: ChallengeRegistryEntry): void {
  CHALLENGE_REGISTRY.set(entry.type, entry);
}

// ── Geography Engine ──

register({
  type: 'GEO_GLOBE_HUNT',
  engine: 'geography',
  label: 'Globe Hunt',
  emoji: '🌍',
  description: 'Find the target country by tapping the 3D globe.',
  responseType: 'globe_tap',
  defaultTimeLimit: 20,
  basePoints: { easy: 100, medium: 200, hard: 350, expert: 500 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'easy',
});

register({
  type: 'GEO_RANDOM_LOCATION',
  engine: 'geography',
  label: 'Location Finder',
  emoji: '📍',
  description: 'Guess the location from geographic clues.',
  responseType: 'globe_point',
  defaultTimeLimit: 30,
  basePoints: { easy: 150, medium: 300, hard: 500, expert: 750 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'easy',
});

register({
  type: 'GEO_DISTANCE',
  engine: 'geography',
  label: 'Distance Challenge',
  emoji: '📏',
  description: 'Estimate the distance between two world locations.',
  responseType: 'slider',
  defaultTimeLimit: 20,
  basePoints: { easy: 100, medium: 250, hard: 400, expert: 600 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'easy',
});

register({
  type: 'GEO_BORDER_ESCAPE',
  engine: 'geography',
  label: 'Border Escape',
  emoji: '🗺️',
  description: 'Navigate from one country to another through shared borders.',
  responseType: 'path_select',
  defaultTimeLimit: 60,
  basePoints: { easy: 200, medium: 400, hard: 600, expert: 1000 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'medium',
});

register({
  type: 'GEO_COUNTRY_CHAIN',
  engine: 'geography',
  label: 'Country Chain',
  emoji: '🔗',
  description: 'Build the longest chain of neighboring countries.',
  responseType: 'path_select',
  defaultTimeLimit: 90,
  basePoints: { easy: 50, medium: 100, hard: 150, expert: 200 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'easy',
});

// ── Weather Engine ──

register({
  type: 'WEATHER_HUNT',
  engine: 'weather',
  label: 'Weather Hunt',
  emoji: '🌧️',
  description: 'Find a location experiencing specific weather conditions.',
  responseType: 'globe_tap',
  defaultTimeLimit: 25,
  basePoints: { easy: 150, medium: 300, hard: 450, expert: 700 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'easy',
});

register({
  type: 'WEATHER_WIND',
  engine: 'weather',
  label: 'Wind Challenge',
  emoji: '💨',
  description: 'Find or compare locations by wind speed.',
  responseType: 'multiple_choice',
  defaultTimeLimit: 20,
  basePoints: { easy: 100, medium: 250, hard: 400, expert: 600 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'easy',
});

register({
  type: 'WEATHER_TEMPERATURE',
  engine: 'weather',
  label: 'Temperature Challenge',
  emoji: '🌡️',
  description: 'Compare temperatures between world locations.',
  responseType: 'multiple_choice',
  defaultTimeLimit: 15,
  basePoints: { easy: 100, medium: 200, hard: 350, expert: 500 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'easy',
});

register({
  type: 'WEATHER_RAIN',
  engine: 'weather',
  label: 'Rain Challenge',
  emoji: '☔',
  description: 'Find where it is raining or compare precipitation.',
  responseType: 'multiple_choice',
  defaultTimeLimit: 20,
  basePoints: { easy: 100, medium: 250, hard: 400, expert: 600 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'easy',
});

// ── News Engine ──

register({
  type: 'NEWS_DETECTIVE',
  engine: 'news',
  label: 'News Detective',
  emoji: '🕵️',
  description: 'Identify the country from news event clues.',
  responseType: 'multiple_choice',
  defaultTimeLimit: 20,
  basePoints: { easy: 150, medium: 300, hard: 500, expert: 750 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'easy',
});

register({
  type: 'NEWS_LOCATION',
  engine: 'news',
  label: 'News Location',
  emoji: '📰',
  description: 'Find where a news event happened on the globe.',
  responseType: 'globe_tap',
  defaultTimeLimit: 20,
  basePoints: { easy: 150, medium: 300, hard: 450, expert: 700 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'easy',
});

register({
  type: 'BREAKING_NEWS_CHALLENGE',
  engine: 'news',
  label: 'Breaking News',
  emoji: '🔴',
  description: 'A live breaking news event — find the country!',
  responseType: 'globe_tap',
  defaultTimeLimit: 15,
  basePoints: { easy: 200, medium: 400, hard: 600, expert: 1000 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'medium',
});

// ── Article Engine ──

register({
  type: 'ARTICLE_QUIZ',
  engine: 'article',
  label: 'Article Quiz',
  emoji: '📖',
  description: 'Test your knowledge after reading an article.',
  responseType: 'multiple_choice',
  defaultTimeLimit: 20,
  basePoints: { easy: 100, medium: 250, hard: 400, expert: 600 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'easy',
});

// ── Earth Events Engine ──

register({
  type: 'EARTHQUAKE_HUNT',
  engine: 'earth_events',
  label: 'Earthquake Hunt',
  emoji: '🌋',
  description: 'Locate where a real earthquake occurred.',
  responseType: 'globe_tap',
  defaultTimeLimit: 25,
  basePoints: { easy: 150, medium: 300, hard: 500, expert: 750 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'easy',
});

register({
  type: 'EARTH_EVENT_LOCATION',
  engine: 'earth_events',
  label: 'Earth Event',
  emoji: '🌎',
  description: 'Identify the location of a natural event.',
  responseType: 'globe_tap',
  defaultTimeLimit: 25,
  basePoints: { easy: 150, medium: 300, hard: 450, expert: 700 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'easy',
});

// ── Time Engine ──

register({
  type: 'TIMEZONE_CHALLENGE',
  engine: 'time',
  label: 'Timezone Challenge',
  emoji: '🕐',
  description: 'Guess the current local time at a location.',
  responseType: 'multiple_choice',
  defaultTimeLimit: 15,
  basePoints: { easy: 100, medium: 200, hard: 350, expert: 500 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'easy',
});

register({
  type: 'DAY_NIGHT_CHALLENGE',
  engine: 'time',
  label: 'Day or Night',
  emoji: '🌗',
  description: 'Find a location where it is currently daytime or nighttime.',
  responseType: 'globe_tap',
  defaultTimeLimit: 20,
  basePoints: { easy: 100, medium: 200, hard: 350, expert: 500 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'easy',
});

// ── AI Mission Engine ──

register({
  type: 'AI_COMBINED_MISSION',
  engine: 'ai_mission',
  label: 'AI Mission',
  emoji: '🤖',
  description: 'A multi-source challenge combining geography, weather, news, and time.',
  responseType: 'globe_tap',
  defaultTimeLimit: 30,
  basePoints: { easy: 300, medium: 500, hard: 800, expert: 1200 },
  enabled: true,
  requiresLiveData: true,
  minimumDifficulty: 'medium',
});

// ── Legacy / Classic ──

register({
  type: 'CLASSIC_TRIVIA',
  engine: 'classic',
  label: 'Classic Trivia',
  emoji: '❓',
  description: 'Traditional trivia from the Play Earth question bank.',
  responseType: 'multiple_choice',
  defaultTimeLimit: 15,
  basePoints: { easy: 100, medium: 250, hard: 500, expert: 500 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'easy',
});

// ── Stop the Earth Engine ──

register({
  type: 'STOP_THE_EARTH',
  engine: 'geography',
  label: 'Stop the Earth',
  emoji: '⏱️',
  description: 'Stop the rapidly spinning Earth with one click and pinpoint your landing coordinates.',
  responseType: 'globe_point',
  defaultTimeLimit: 5,
  basePoints: { easy: 200, medium: 400, hard: 800, expert: 1500 },
  enabled: true,
  requiresLiveData: false,
  minimumDifficulty: 'easy',
});

// ---- Public API ----

/** Get a registry entry by challenge type */
export function getRegistryEntry(type: ChallengeType): ChallengeRegistryEntry | undefined {
  return CHALLENGE_REGISTRY.get(type);
}

/** Get all enabled challenge types */
export function getEnabledTypes(): ChallengeRegistryEntry[] {
  return Array.from(CHALLENGE_REGISTRY.values()).filter(e => e.enabled);
}

/** Get all enabled types for a specific engine */
export function getTypesForEngine(engine: GameEngineType): ChallengeRegistryEntry[] {
  return getEnabledTypes().filter(e => e.engine === engine);
}

/** Get all unique enabled engines */
export function getActiveEngines(): GameEngineType[] {
  const engines = new Set(getEnabledTypes().map(e => e.engine));
  return Array.from(engines);
}

/** Get all challenge types that do NOT require live data (always available offline) */
export function getOfflineTypes(): ChallengeRegistryEntry[] {
  return getEnabledTypes().filter(e => !e.requiresLiveData);
}

/** Enable or disable a challenge type at runtime */
export function setChallengeEnabled(type: ChallengeType, enabled: boolean): void {
  const entry = CHALLENGE_REGISTRY.get(type);
  if (entry) {
    entry.enabled = enabled;
  }
}

/** Get the default time limit for a challenge type */
export function getDefaultTimeLimit(type: ChallengeType): number {
  return CHALLENGE_REGISTRY.get(type)?.defaultTimeLimit ?? 15;
}

/** Get base points for a challenge type and difficulty */
export function getBasePoints(type: ChallengeType, difficulty: ChallengeDifficulty): number {
  const entry = CHALLENGE_REGISTRY.get(type);
  if (!entry) return 100;
  return entry.basePoints[difficulty] ?? entry.basePoints.medium;
}

/** List all registered challenge types (including disabled) */
export function getAllRegisteredTypes(): ChallengeRegistryEntry[] {
  return Array.from(CHALLENGE_REGISTRY.values());
}
