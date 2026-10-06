// ============================================================
// MooEarth Live — City Search Indexing Quality Gate
// ============================================================
// Central SEO indexing gate for city pages (/cities/[city]).
// Enforces that only meaningful, factual locations are indexed.
//
// Rejection Invariants:
//   1. Empty pages (no real geography, metrics, or nearby places)
//   2. Missing data (null/invalid coordinates, unverified parent country)
//   3. Duplicate pages (alias slugs vs canonical slugs)
//   4. Temporary errors (upstream failures on critical dependencies)

import { getCityBySlug, resolveCanonicalCitySlug } from '@/data/places';
import { getCountryByName } from '@/data/countries';
import { CityRecord } from '@/types/places';

export interface CityPageQualityData {
  city: CityRecord | null;
  hasWeather?: boolean;
  newsArticleCount?: number;
  nearbyPlacesCount?: number;
  isTemporaryError?: boolean;
}

export interface CityQualityGateResult {
  shouldIndex: boolean;
  reason: string;
  canonicalSlug: string | null;
  city: CityRecord | null;
  robotsDirective: {
    index: boolean;
    follow: boolean;
  };
}

/**
 * Central quality gate governing indexation of /cities/[city].
 * Prevents thin, duplicate, or unverified city pages from polluting search indexes.
 */
export function shouldIndexCityPage(
  citySlug: string,
  data?: CityPageQualityData
): CityQualityGateResult {
  if (!citySlug || typeof citySlug !== 'string' || citySlug.trim().length === 0) {
    return {
      shouldIndex: false,
      reason: 'Missing or empty city slug string.',
      canonicalSlug: null,
      city: null,
      robotsDirective: { index: false, follow: false },
    };
  }

  const normalized = citySlug.trim().toLowerCase();
  const canonical = resolveCanonicalCitySlug(normalized);
  const city = getCityBySlug(normalized);

  // Invariant 1: Unknown or unverified city
  if (!city || !canonical) {
    return {
      shouldIndex: false,
      reason: `Unknown or unverified geographic city: "${citySlug}".`,
      canonicalSlug: null,
      city: null,
      robotsDirective: { index: false, follow: false },
    };
  }

  // Invariant 2: Duplicate prevention (alias slug vs canonical slug)
  if (normalized !== city.slug) {
    return {
      shouldIndex: false,
      reason: `Slug "${normalized}" is an alias for canonical city "${city.slug}". Preventing duplicate indexation.`,
      canonicalSlug: city.slug,
      city,
      robotsDirective: { index: false, follow: true },
    };
  }

  // Invariant 3: Coordinate bounds validity
  const { lat, lng } = city.coordinates;
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return {
      shouldIndex: false,
      reason: `City "${city.name}" has invalid or missing coordinates.`,
      canonicalSlug: city.slug,
      city,
      robotsDirective: { index: false, follow: false },
    };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      shouldIndex: false,
      reason: `City "${city.name}" coordinates are outside terrestrial bounds.`,
      canonicalSlug: city.slug,
      city,
      robotsDirective: { index: false, follow: false },
    };
  }

  // Invariant 4: Parent country relation integrity
  const parentCountry = getCountryByName(city.country);
  if (!parentCountry) {
    return {
      shouldIndex: false,
      reason: `City "${city.name}" is not associated with a verified sovereign nation ("${city.country}").`,
      canonicalSlug: city.slug,
      city,
      robotsDirective: { index: false, follow: false },
    };
  }

  // Invariant 5: Minimum population / demographic substance
  if (!city.population || city.population <= 0) {
    return {
      shouldIndex: false,
      reason: `City "${city.name}" lacks verified population data.`,
      canonicalSlug: city.slug,
      city,
      robotsDirective: { index: false, follow: true },
    };
  }

  // Invariant 6: Minimum descriptive geography substance
  if (!city.geography || city.geography.trim().length < 30) {
    return {
      shouldIndex: false,
      reason: `City "${city.name}" lacks sufficient physical geography documentation.`,
      canonicalSlug: city.slug,
      city,
      robotsDirective: { index: false, follow: true },
    };
  }

  // Invariant 7: Content depth check if optional payload is supplied
  if (data) {
    if (data.isTemporaryError && !data.hasWeather && (!data.newsArticleCount || data.newsArticleCount === 0)) {
      return {
        shouldIndex: false,
        reason: 'Temporary network failure on real-time city telemetry and news.',
        canonicalSlug: city.slug,
        city,
        robotsDirective: { index: false, follow: true },
      };
    }
  }

  return {
    shouldIndex: true,
    reason: `Verified canonical metropolitan location "${city.name}" in ${city.country} with complete spatial records.`,
    canonicalSlug: city.slug,
    city,
    robotsDirective: { index: true, follow: true },
  };
}
