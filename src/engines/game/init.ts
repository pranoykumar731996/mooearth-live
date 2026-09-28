// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Initialization
// ============================================================
// Call initializeGameEngine() once at app startup to register
// all data providers with the ChallengeGenerator.

import { registerProvider } from './ChallengeGenerator';
import {
  GeographyProvider,
  WeatherProvider,
  NewsProvider,
  TimeProvider,
  EarthEventsProvider,
  AIMissionProvider,
} from './providers';

let initialized = false;

/**
 * Initialize the Infinite Earth Game Engine by registering
 * all data providers with the ChallengeGenerator.
 *
 * Safe to call multiple times — only runs once.
 */
export function initializeGameEngine(): void {
  if (initialized) return;

  // Register all providers
  registerProvider(GeographyProvider);   // Always available (offline-safe)
  registerProvider(TimeProvider);        // Always available (offline-safe)
  registerProvider(WeatherProvider);     // Requires Open-Meteo API
  registerProvider(NewsProvider);        // Requires Google News RSS
  registerProvider(EarthEventsProvider); // Requires USGS API
  registerProvider(AIMissionProvider);   // Multi-source intelligence recon

  initialized = true;
  console.log('[GameEngine] ✅ Infinite Earth Game Engine initialized with 6 providers');
}

/**
 * Check if the engine has been initialized.
 */
export function isEngineInitialized(): boolean {
  return initialized;
}
