// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Public API
// ============================================================
// Barrel export for all game engine modules.

// Core type contracts
export type {
  ChallengeType,
  GameEngineType,
  ChallengeDifficulty,
  ChallengeResponseType,
  GeoCoordinate,
  EarthChallenge,
  ScoringBreakdown,
  ScoringConfig,
  ValidationResult,
  UserResponse,
  ChallengeAttempt,
  GameSessionMode,
  GameSessionState,
  InfiniteEarthStats,
  ProviderStatus,
  ChallengeRequest,
  DataProvider,
  WeatherObservation,
  WeatherDataset,
  EarthEvent,
  EarthEventDataset,
} from './types';

// Conversion utilities
export {
  earthQuestionToChallenge,
  challengeToEarthQuestion,
} from './types';

// Challenge registry
export {
  getRegistryEntry,
  getEnabledTypes,
  getTypesForEngine,
  getActiveEngines,
  getOfflineTypes,
  setChallengeEnabled,
  getDefaultTimeLimit,
  getBasePoints,
  getAllRegisteredTypes,
} from './registry';
export type { ChallengeRegistryEntry } from './registry';

// Anti-repeat engine
export { AntiRepeatEngine } from './AntiRepeatEngine';

// Difficulty engine
export {
  getCountryFamiliarity,
  computeDifficultyScore,
  scoreToDifficulty,
  calculateDifficulty,
  selectCountryForDifficulty,
  adjustTimeLimit,
} from './DifficultyEngine';
export type { DifficultyFactors } from './DifficultyEngine';

// Scoring engine
export {
  configureScoringEngine,
  resetScoringConfig,
  getScoringConfig,
  calculateScore,
  getXPCategory,
} from './ScoringEngine';

// Validation engine
export {
  haversineDistance,
  areBorderNeighbours,
  getNeighbours,
  findBorderPath,
  validateBorderPath,
  validateResponse,
} from './ValidationEngine';

// Challenge generator (master orchestrator)
export {
  registerProvider,
  unregisterProvider,
  getProvider,
  getAllProviders,
  createSession,
  generateNextChallenge,
  processAnswer,
  getEngineHealth,
  resetAntiRepeat,
  exportAntiRepeatState,
  importAntiRepeatState,
} from './ChallengeGenerator';

// Session Store
export {
  getSession,
  saveSession,
  deleteSession,
  getAllSessions,
} from './sessionStore';

// Engine initialization
export { initializeGameEngine, isEngineInitialized } from './init';

// Data providers
export {
  GeographyProvider,
  WeatherProvider,
  NewsProvider,
  TimeProvider,
  EarthEventsProvider,
  AIMissionProvider,
} from './providers';
