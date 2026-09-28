// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Anti-Repeat Engine
// ============================================================
// Prevents challenge repetition by computing and tracking
// unique fingerprint hashes over a rolling window.

import { ChallengeType, EarthChallenge, GameEngineType } from './types';

/** Maximum fingerprints retained before oldest are evicted */
const DEFAULT_WINDOW_SIZE = 50;

/**
 * AntiRepeatEngine maintains a rolling set of recent challenge fingerprints
 * to ensure variety. Fingerprints encode engine, challenge type, target,
 * source timestamp, difficulty, and a random seed.
 */
export class AntiRepeatEngine {
  private recentFingerprints: string[] = [];
  private recentCountries: string[] = [];
  private windowSize: number;

  constructor(windowSize: number = DEFAULT_WINDOW_SIZE) {
    this.windowSize = windowSize;
  }

  // ---- Fingerprint Generation ----

  /**
   * Compute a deterministic fingerprint for a challenge configuration.
   * Used both to tag generated challenges and to check for duplicates
   * before presenting to the user.
   */
  static computeFingerprint(
    engine: GameEngineType,
    type: ChallengeType,
    target: string,
    sourceTimestamp?: string,
    seed?: number
  ): string {
    const parts = [
      engine,
      type,
      target.toLowerCase().replace(/\s+/g, '_'),
      sourceTimestamp || 'static',
      seed !== undefined ? String(seed) : 'auto',
    ];
    return parts.join(':');
  }

  /**
   * Compute a fast numeric hash from a string for compact storage.
   * Uses FNV-1a algorithm for good distribution.
   */
  static hashString(input: string): string {
    let hash = 0x811c9dc5; // FNV offset basis
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = (hash * 0x01000193) | 0; // FNV prime
    }
    return (hash >>> 0).toString(16);
  }

  // ---- Duplicate Checking ----

  /** Check if a fingerprint was recently used */
  isDuplicate(fingerprint: string): boolean {
    return this.recentFingerprints.includes(fingerprint);
  }

  /** Check if a country was used too recently (within last N challenges) */
  isCountryTooRecent(country: string, minGap: number = 3): boolean {
    const normalizedCountry = country.toLowerCase().trim();
    const recent = this.recentCountries.slice(-minGap);
    return recent.some(c => c === normalizedCountry);
  }

  /**
   * Check if a challenge would be considered a repeat.
   * Considers both the fingerprint hash and recent country usage.
   */
  wouldRepeat(challenge: EarthChallenge, minCountryGap: number = 3): boolean {
    if (this.isDuplicate(challenge.fingerprint)) return true;
    if (challenge.targetCountry && this.isCountryTooRecent(challenge.targetCountry, minCountryGap)) {
      return true;
    }
    return false;
  }

  // ---- Recording ----

  /** Record a challenge as served. Evicts oldest entries beyond the window. */
  record(challenge: EarthChallenge): void {
    this.recentFingerprints.push(challenge.fingerprint);
    if (challenge.targetCountry) {
      this.recentCountries.push(challenge.targetCountry.toLowerCase().trim());
    }

    // Evict oldest entries beyond window
    while (this.recentFingerprints.length > this.windowSize) {
      this.recentFingerprints.shift();
    }
    while (this.recentCountries.length > this.windowSize) {
      this.recentCountries.shift();
    }
  }

  /** Record a raw fingerprint string (e.g. from external sources) */
  recordFingerprint(fingerprint: string): void {
    this.recentFingerprints.push(fingerprint);
    while (this.recentFingerprints.length > this.windowSize) {
      this.recentFingerprints.shift();
    }
  }

  // ---- Bulk Operations ----

  /** Import a list of previously served fingerprints (e.g. from localStorage) */
  importFingerprints(fingerprints: string[]): void {
    this.recentFingerprints = fingerprints.slice(-this.windowSize);
  }

  /** Export current fingerprints for persistence */
  exportFingerprints(): string[] {
    return [...this.recentFingerprints];
  }

  /** Reset all tracking state */
  reset(): void {
    this.recentFingerprints = [];
    this.recentCountries = [];
  }

  /** Get count of tracked fingerprints */
  get trackedCount(): number {
    return this.recentFingerprints.length;
  }
}
