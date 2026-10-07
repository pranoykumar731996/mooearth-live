// ============================================================
// MooEarth Live — Weather Quality Gate (Indexing Protection)
// ============================================================
// Enforces strict verification before allowing search engines to index
// any weather page. Prevents indexing if weather telemetry is missing,
// stale, fake, or errored.

import { WeatherFetchResult } from '@/services/weatherService';

export interface WeatherQualityGateResult {
  shouldIndex: boolean;
  reason: string;
  robotsDirective: {
    index: boolean;
    follow: boolean;
  };
}

/**
 * Validates that weather telemetry is authentic, fresh, and complete
 * before allowing search indexing.
 * 
 * Rules:
 * - Must have observation object (not null)
 * - Must not be a temporary error
 * - Must have numerical temperature within valid planetary limits (-90°C to 65°C)
 * - Must have valid ISO timestamp within recent threshold
 * - Must have realistic atmospheric pressure (800 to 1100 hPa)
 * - Must match canonical slug (no alias indexing)
 */
export function shouldIndexWeatherPage(
  slug: string,
  canonicalSlug: string,
  weatherResult: WeatherFetchResult
): WeatherQualityGateResult {
  // 1. Alias protection: only index the canonical URL
  if (slug.toLowerCase() !== canonicalSlug.toLowerCase()) {
    return {
      shouldIndex: false,
      reason: `Slug '${slug}' is an alias for canonical '${canonicalSlug}'. Alias pages must not be indexed.`,
      robotsDirective: { index: false, follow: false },
    };
  }

  // 2. Error / Missing observation check
  if (weatherResult.isTemporaryError || !weatherResult.observation) {
    return {
      shouldIndex: false,
      reason: `Missing live weather telemetry: ${weatherResult.errorMessage || 'No observation returned'}.`,
      robotsDirective: { index: false, follow: false },
    };
  }

  const { observation } = weatherResult;

  // 3. Fake / NaN / Extreme anomaly checks
  if (
    typeof observation.temperature !== 'number' ||
    isNaN(observation.temperature) ||
    observation.temperature < -90 ||
    observation.temperature > 65
  ) {
    return {
      shouldIndex: false,
      reason: `Temperature reading (${observation.temperature}) outside valid atmospheric bounds.`,
      robotsDirective: { index: false, follow: false },
    };
  }

  // 4. Pressure check (surface pressure on Earth is generally 850hPa to 1085hPa)
  if (
    typeof observation.surfacePressure !== 'number' ||
    isNaN(observation.surfacePressure) ||
    observation.surfacePressure < 500 ||
    observation.surfacePressure > 1150
  ) {
    return {
      shouldIndex: false,
      reason: `Surface pressure reading (${observation.surfacePressure}) invalid or missing.`,
      robotsDirective: { index: false, follow: false },
    };
  }

  // 5. Stale data check (timestamp must be valid parseable date within 48h)
  const obsTime = new Date(observation.timestamp).getTime();
  if (isNaN(obsTime)) {
    return {
      shouldIndex: false,
      reason: `Invalid observation timestamp format: ${observation.timestamp}.`,
      robotsDirective: { index: false, follow: false },
    };
  }

  const ageMs = Date.now() - obsTime;
  const maxAgeMs = 48 * 60 * 60 * 1000; // 48 hours max threshold
  if (ageMs > maxAgeMs) {
    return {
      shouldIndex: false,
      reason: `Observation is stale (${Math.round(ageMs / 3600000)}h old). Stale weather pages must not be indexed.`,
      robotsDirective: { index: false, follow: false },
    };
  }

  // All verification checks passed
  return {
    shouldIndex: true,
    reason: 'Verified live meteorological telemetry from Open-Meteo.',
    robotsDirective: { index: true, follow: true },
  };
}
