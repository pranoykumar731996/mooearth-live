// ============================================================
// MooEarth Live — Geocoding Service
// ============================================================
// Global location search using the Open-Meteo Geocoding API.
// Supports city, country, region searches with full metadata.

import { queryOpenMeteo } from './openMeteoClient';
import { GeocodingResult, GeocodingResponse } from './types';

// ── Raw API Response Types ────────────────────────────────────

interface RawGeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  population?: number;
  feature_code?: string;
}

interface RawGeocodingResponse {
  results?: RawGeocodingResult[];
  generationtime_ms?: number;
}

// ── Transform Functions ───────────────────────────────────────

function transformGeocodingResult(raw: RawGeocodingResult): GeocodingResult {
  return {
    id: raw.id,
    name: raw.name,
    latitude: raw.latitude,
    longitude: raw.longitude,
    elevation: raw.elevation,
    timezone: raw.timezone,
    country: raw.country,
    countryCode: raw.country_code,
    admin1: raw.admin1,
    admin2: raw.admin2,
    admin3: raw.admin3,
    population: raw.population,
    featureCode: raw.feature_code,
  };
}

// ── Public API ────────────────────────────────────────────────

/**
 * Search for locations by name.
 * Returns up to 10 results with coordinates, timezone, and administrative info.
 */
export async function searchLocations(
  query: string,
  count: number = 10,
  language: string = 'en'
): Promise<GeocodingResponse> {
  if (!query.trim()) {
    return { results: [], generationTime: 0 };
  }

  const raw = await queryOpenMeteo<RawGeocodingResponse>({
    endpoint: 'geocoding',
    params: {
      name: query.trim(),
      count,
      language,
      format: 'json',
    },
  });

  return {
    results: (raw.results || []).map(transformGeocodingResult),
    generationTime: raw.generationtime_ms ?? 0,
  };
}

/**
 * Format a geocoding result into a human-readable location string.
 */
export function formatLocationName(result: GeocodingResult): string {
  const parts = [result.name];
  if (result.admin1 && result.admin1 !== result.name) {
    parts.push(result.admin1);
  }
  if (result.country) {
    parts.push(result.country);
  }
  return parts.join(', ');
}
