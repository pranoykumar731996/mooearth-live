// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Challenge Generator
// ============================================================
// Master orchestrator that dispatches challenge requests to data
// providers, applies anti-repeat filtering, difficulty scaling,
// and handles graceful failover when providers are unavailable.

import {
  ChallengeRequest,
  ChallengeType,
  DataProvider,
  EarthChallenge,
  GameEngineType,
  GameSessionMode,
  GameSessionState,
  ChallengeDifficulty,
  ChallengeAttempt,
  UserResponse,
  ValidationResult,
  ScoringBreakdown,
} from './types';
import { getEnabledTypes, getTypesForEngine, getOfflineTypes, ChallengeRegistryEntry } from './registry';
import { AntiRepeatEngine } from './AntiRepeatEngine';
import { calculateDifficulty, selectCountryForDifficulty } from './DifficultyEngine';
import { calculateScore, getXPCategory } from './ScoringEngine';
import { validateResponse } from './ValidationEngine';

// ---- Provider Management ----

const registeredProviders: Map<GameEngineType, DataProvider> = new Map();

/** Register a data provider for a specific engine type */
export function registerProvider(provider: DataProvider): void {
  registeredProviders.set(provider.engine, provider);
}

/** Unregister a provider */
export function unregisterProvider(engine: GameEngineType): void {
  registeredProviders.delete(engine);
}

/** Get a registered provider */
export function getProvider(engine: GameEngineType): DataProvider | undefined {
  return registeredProviders.get(engine);
}

/** Get all registered providers */
export function getAllProviders(): DataProvider[] {
  return Array.from(registeredProviders.values());
}

// ---- Engine Rotation ----

/**
 * Default engine rotation order for Endless mode.
 * Engines that require live data are interspersed with offline-safe engines
 * to ensure uninterrupted gameplay.
 */
const DEFAULT_ENGINE_ROTATION: GameEngineType[] = [
  'geography',
  'weather',
  'news',
  'time',
  'geography',
  'earth_events',
  'news',
  'geography',
  'weather',
  'ai_mission',
];

/**
 * Daily challenge round configuration.
 * Each round uses a specific engine for variety.
 */
const DAILY_ROUND_ENGINES: GameEngineType[] = [
  'geography',    // Round 1
  'weather',      // Round 2
  'news',         // Round 3
  'time',         // Round 4
  'geography',    // Round 5 (Globe Hunt finale)
];

// ---- Session Management ----

/** Create a new game session */
export function createSession(mode: GameSessionMode): GameSessionState {
  return {
    sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode,
    startedAt: Date.now(),
    attempts: [],
    currentStreak: 0,
    totalScore: 0,
    challengesCompleted: 0,
    challengesFailed: 0,
    activeChallenge: null,
    engineRotation: mode === 'daily' ? DAILY_ROUND_ENGINES : DEFAULT_ENGINE_ROTATION,
    lastEngineIndex: -1,
    dailySeed: mode === 'daily' ? getDailySeed() : undefined,
  };
}

/** Deterministic seed from today's date (server-safe, no timezone leakage) */
function getDailySeed(): number {
  const now = new Date();
  const dateStr = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return hash >>> 0;
}

// ---- Challenge Generation ----

const globalAntiRepeat = new AntiRepeatEngine(50);

/**
 * Generate the next challenge for the session.
 *
 * Flow:
 * 1. Determine which engine to use (from rotation or request).
 * 2. Calculate difficulty from session state.
 * 3. Dispatch to the appropriate data provider.
 * 4. Check anti-repeat. If duplicate, retry with another type/provider.
 * 5. Apply difficulty adjustments (time limit, points).
 * 6. Return the challenge or null if all providers are exhausted.
 */
export async function generateNextChallenge(
  session: GameSessionState,
  request: Partial<ChallengeRequest> = {}
): Promise<EarthChallenge | null> {
  // Merge client-provided excludeFingerprints with globalAntiRepeat
  if (Array.isArray(request.excludeFingerprints)) {
    for (const fp of request.excludeFingerprints) {
      if (fp) globalAntiRepeat.recordFingerprint(fp);
    }
  }

  const excludeFingerprints = Array.from(new Set([
    ...globalAntiRepeat.exportFingerprints(),
    ...(request.excludeFingerprints || [])
  ]));

  // 1. Determine target engine
  let targetEngine = request.engine;
  if (!targetEngine) {
    // Advance the rotation
    const nextIndex = (session.lastEngineIndex + 1) % session.engineRotation.length;
    targetEngine = session.engineRotation[nextIndex];
    session.lastEngineIndex = nextIndex;
  }

  // 2. Calculate difficulty
  const difficulty = request.difficulty || calculateDifficulty(
    request.targetCountry,
    session,
    request.type
  );

  // 3. Build the full request
  const fullRequest: ChallengeRequest = {
    engine: targetEngine,
    type: request.type,
    difficulty,
    targetCountry: request.targetCountry,
    excludeFingerprints,
    sessionMode: session.mode,
  };

  // 4. Try the primary engine
  let challenge = await tryGenerateFromEngine(targetEngine, fullRequest);

  // 5. If primary fails, try fallback engines
  if (!challenge) {
    const fallbackOrder = getFallbackOrder(targetEngine);
    for (const fallbackEngine of fallbackOrder) {
      challenge = await tryGenerateFromEngine(fallbackEngine, {
        ...fullRequest,
        engine: fallbackEngine,
        type: undefined, // Let the fallback engine pick its own type
      });
      if (challenge) break;
    }
  }

  // 6. Record and return
  if (challenge) {
    globalAntiRepeat.record(challenge);
    session.activeChallenge = challenge;
  }

  return challenge;
}

/**
 * Try to generate a challenge from a specific engine.
 * Handles provider availability and anti-repeat filtering.
 */
async function tryGenerateFromEngine(
  engine: GameEngineType,
  request: ChallengeRequest
): Promise<EarthChallenge | null> {
  const provider = registeredProviders.get(engine);
  if (!provider) return null;

  try {
    const available = await provider.isAvailable();
    if (!available) return null;

    // Try up to 3 times to avoid anti-repeat collisions
    for (let attempt = 0; attempt < 3; attempt++) {
      const challenge = await provider.generateChallenge(request);
      if (!challenge) return null;

      if (!globalAntiRepeat.wouldRepeat(challenge)) {
        return challenge;
      }
    }

    return null;
  } catch (error) {
    console.warn(`[GameEngine] Provider "${engine}" failed:`, error);
    return null;
  }
}

/**
 * Get fallback engine order when the primary engine is unavailable.
 * Prioritizes offline-safe engines.
 */
function getFallbackOrder(primary: GameEngineType): GameEngineType[] {
  const allEngines: GameEngineType[] = [
    'geography', 'time', 'classic', 'weather', 'news', 'earth_events', 'ai_mission',
  ];
  // Remove the primary, put offline-safe engines first
  return allEngines.filter(e => e !== primary);
}

// ---- Answer Processing ----

/**
 * Process a user's answer to the active challenge.
 * Validates, scores, updates session state, and returns the result.
 */
export function processAnswer(
  session: GameSessionState,
  response: UserResponse
): { validation: ValidationResult; scoring: ScoringBreakdown } | null {
  const challenge = session.activeChallenge;
  if (!challenge) return null;

  // 1. Validate
  const validation = validateResponse(challenge, response);

  // 2. Score
  const scoring = calculateScore(challenge, response, validation, session);

  // 3. Update session state
  const attempt: ChallengeAttempt = {
    challengeId: challenge.id,
    challengeType: challenge.type,
    engine: challenge.engine,
    difficulty: challenge.difficulty,
    userResponse: response,
    validation,
    scoring,
    timestamp: Date.now(),
  };

  session.attempts.push(attempt);
  session.totalScore += scoring.totalPoints;

  if (validation.correct) {
    session.currentStreak++;
    session.challengesCompleted++;
  } else {
    session.currentStreak = 0;
    session.challengesFailed++;

    // In survival mode, incorrect answer ends the session
    if (session.mode === 'survival') {
      session.activeChallenge = null;
    }
  }

  // Clear active challenge
  session.activeChallenge = null;

  return { validation, scoring };
}

// ---- Diagnostics ----

/** Get diagnostic status for all registered providers */
export function getEngineHealth(): {
  providers: ReturnType<DataProvider['getStatus']>[];
  totalRegistered: number;
  totalAvailable: number;
  antiRepeatTracked: number;
} {
  const providers = getAllProviders().map(p => p.getStatus());
  return {
    providers,
    totalRegistered: providers.length,
    totalAvailable: providers.filter(p => p.available).length,
    antiRepeatTracked: globalAntiRepeat.trackedCount,
  };
}

/** Reset the anti-repeat engine (useful for new game sessions) */
export function resetAntiRepeat(): void {
  globalAntiRepeat.reset();
}

/** Export the global anti-repeat state for localStorage persistence */
export function exportAntiRepeatState(): string[] {
  return globalAntiRepeat.exportFingerprints();
}

/** Import anti-repeat state from localStorage */
export function importAntiRepeatState(fingerprints: string[]): void {
  globalAntiRepeat.importFingerprints(fingerprints);
}
