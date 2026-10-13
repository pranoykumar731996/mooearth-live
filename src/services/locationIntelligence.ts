// ============================================================
// MooEarth Live — Global Location Intelligence Service
// ============================================================
// Canonical resolution for countries and cities.
// Integrates real-world Open-Meteo weather telemetry,
// verified multi-source news, timezone calculation,
// and URL synchronization.
// Never fabricates weather, time, or geographic data.

import { getCountryByName, getCountryBySlug, getCountryById, CountryRecord, CANONICAL_COUNTRIES } from '@/data/countries';
import { locations, LocationRecord } from '@/data/locations';
import { getAllCities, getCityBySlug } from '@/data/places';
import { findCountryMeta } from '@/data/questions/countryMetadata';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import type { ForecastResponse } from '@/services/weather/types';
import type { WorldEvent } from '@/types';

export interface CanonicalLocation {
  type: 'country' | 'city';
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  capital?: string;
  state?: string;
  lat: number;
  lng: number;
  population?: string;
  timezone?: string;
  region?: string;
  subregion?: string;
  languages?: string;
  currency?: string;
  majorCities?: string[];
  capitalCoordinates?: { lat: number; lng: number };
}

// Map common capital cities to their coordinates and timezones for instant resolution
const CAPITAL_COORDINATES_MAP: Record<string, { lat: number; lng: number; timezone: string }> = {
  'Tokyo': { lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo' },
  'Washington D.C.': { lat: 38.8951, lng: -77.0364, timezone: 'America/New_York' },
  'London': { lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  'Paris': { lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' },
  'Berlin': { lat: 52.5200, lng: 13.4050, timezone: 'Europe/Berlin' },
  'New Delhi': { lat: 28.6139, lng: 77.2090, timezone: 'Asia/Kolkata' },
  'Beijing': { lat: 39.9042, lng: 116.4074, timezone: 'Asia/Shanghai' },
  'Canberra': { lat: -35.2809, lng: 149.1300, timezone: 'Australia/Sydney' },
  'Brasília': { lat: -15.7975, lng: -47.8919, timezone: 'America/Sao_Paulo' },
  'Ottawa': { lat: 45.4215, lng: -75.6972, timezone: 'America/Toronto' },
  'Rome': { lat: 41.9028, lng: 12.4964, timezone: 'Europe/Rome' },
  'Madrid': { lat: 40.4168, lng: -3.7038, timezone: 'Europe/Madrid' },
  'Cairo': { lat: 30.0444, lng: 31.2357, timezone: 'Africa/Cairo' },
  'Seoul': { lat: 37.5665, lng: 126.9780, timezone: 'Asia/Seoul' },
  'Riyadh': { lat: 24.7136, lng: 46.6753, timezone: 'Asia/Riyadh' },
  'Pretoria': { lat: -25.7479, lng: 28.2293, timezone: 'Africa/Johannesburg' },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816, timezone: 'America/Argentina/Buenos_Aires' },
  'Mexico City': { lat: 19.4326, lng: -99.1332, timezone: 'America/Mexico_City' },
  'Jakarta': { lat: -6.2088, lng: 106.8456, timezone: 'Asia/Jakarta' },
  'Bangkok': { lat: 13.7563, lng: 100.5018, timezone: 'Asia/Bangkok' },
  'Singapore': { lat: 1.3521, lng: 103.8198, timezone: 'Asia/Singapore' },
  'Bern': { lat: 46.9480, lng: 7.4474, timezone: 'Europe/Zurich' },
  'Stockholm': { lat: 59.3293, lng: 18.0686, timezone: 'Europe/Stockholm' },
  'Oslo': { lat: 59.9139, lng: 10.7522, timezone: 'Europe/Oslo' },
  'Copenhagen': { lat: 55.6761, lng: 12.5683, timezone: 'Europe/Copenhagen' },
  'Amsterdam': { lat: 52.3676, lng: 4.9041, timezone: 'Europe/Amsterdam' },
  'Brussels': { lat: 50.8503, lng: 4.3517, timezone: 'Europe/Brussels' },
  'Vienna': { lat: 48.2082, lng: 16.3738, timezone: 'Europe/Vienna' },
  'Athens': { lat: 37.9838, lng: 23.7275, timezone: 'Europe/Athens' },
  'Ankara': { lat: 39.9334, lng: 32.8597, timezone: 'Europe/Istanbul' },
  'Wellington': { lat: -41.2865, lng: 174.7762, timezone: 'Pacific/Auckland' },
  'Dublin': { lat: 53.3498, lng: -6.2603, timezone: 'Europe/Dublin' },
  'Lisbon': { lat: 38.7223, lng: -9.1393, timezone: 'Europe/Lisbon' },
  'Warsaw': { lat: 52.2297, lng: 21.0122, timezone: 'Europe/Warsaw' },
};

/**
 * Resolve canonical location intelligence for a country or city input.
 */
export function resolveCanonicalLocation(input: {
  country?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  location?: LocationRecord | null;
}): CanonicalLocation | null {
  // 1. If explicit LocationRecord provided
  if (input.location) {
    const loc = input.location;
    const countryMeta = findCountryMeta(loc.country);
    return {
      type: loc.type === 'country' ? 'country' : 'city',
      id: loc.id,
      name: loc.name,
      country: loc.country,
      countryCode: loc.countryCode || '',
      flag: countryMeta?.flag || '🏳️',
      state: loc.state,
      lat: loc.lat,
      lng: loc.lng,
      population: loc.population ? loc.population.toLocaleString() : undefined,
      timezone: loc.timezone || undefined,
    };
  }

  // 2. If City name provided
  if (input.city) {
    const normalizedCity = input.city.trim().toLowerCase();
    
    // Check in locations.ts (filter all matches and pick best match by country or highest population)
    const matchingLocs = locations.filter(
      l => l.type === 'city' && (
        l.name.toLowerCase() === normalizedCity ||
        l.aliases?.some(a => a.toLowerCase() === normalizedCity)
      )
    );

    let matchedLoc: LocationRecord | undefined;
    if (matchingLocs.length > 0) {
      if (input.country) {
        matchedLoc = matchingLocs.find(l => l.country.toLowerCase() === input.country!.toLowerCase());
      }
      if (!matchedLoc) {
        // Sort by population descending so global metropolises take precedence over small towns
        matchedLoc = [...matchingLocs].sort((a, b) => (b.population || 0) - (a.population || 0))[0];
      }
    }

    if (matchedLoc) {
      const countryMeta = findCountryMeta(matchedLoc.country);
      return {
        type: 'city',
        id: matchedLoc.id,
        name: matchedLoc.name,
        country: matchedLoc.country,
        countryCode: matchedLoc.countryCode || '',
        flag: countryMeta?.flag || '🏳️',
        state: matchedLoc.state,
        lat: matchedLoc.lat,
        lng: matchedLoc.lng,
        population: matchedLoc.population ? matchedLoc.population.toLocaleString() : undefined,
        timezone: matchedLoc.timezone,
      };
    }

    // Check in places
    const matchedPlace = getAllCities().find(
      c => c.name.toLowerCase() === normalizedCity || c.slug === normalizedCity
    );

    if (matchedPlace) {
      const countryMeta = findCountryMeta(matchedPlace.country);
      const parentCountry = getCountryByName(matchedPlace.country);
      return {
        type: 'city',
        id: `city-${matchedPlace.slug}`,
        name: matchedPlace.name,
        country: matchedPlace.country,
        countryCode: parentCountry?.iso2 || '',
        flag: countryMeta?.flag || parentCountry?.flag || '🏳️',
        state: matchedPlace.state,
        lat: matchedPlace.coordinates.lat,
        lng: matchedPlace.coordinates.lng,
        population: matchedPlace.population ? matchedPlace.population.toLocaleString() : undefined,
        timezone: matchedPlace.timezone,
      };
    }

    // If city name not found in database but coordinates are provided, construct safe custom record
    if (typeof input.lat === 'number' && typeof input.lng === 'number' &&
        input.lat >= -90 && input.lat <= 90 && input.lng >= -180 && input.lng <= 180) {
      const countryName = input.country || 'Planet Earth';
      const countryMeta = findCountryMeta(countryName);
      const parentCountry = getCountryByName(countryName);
      return {
        type: 'city',
        id: `custom-city-${input.lat.toFixed(4)}-${input.lng.toFixed(4)}`,
        name: input.city,
        country: countryName,
        countryCode: parentCountry?.iso2 || '',
        flag: countryMeta?.flag || parentCountry?.flag || '🏳️',
        lat: input.lat,
        lng: input.lng,
      };
    }
  }

  // 3. If Country name provided
  if (input.country) {
    const rawCountry = input.country.trim();
    const countryRecord: CountryRecord | null =
      getCountryByName(rawCountry) ||
      getCountryBySlug(rawCountry) ||
      getCountryById(rawCountry);

    if (countryRecord) {
      const capitalInfo = CAPITAL_COORDINATES_MAP[countryRecord.capital];
      const capitalCoords = capitalInfo ? { lat: capitalInfo.lat, lng: capitalInfo.lng } : undefined;
      const capitalTz = capitalInfo?.timezone;

      return {
        type: 'country',
        id: `country-${countryRecord.slug}`,
        name: countryRecord.name,
        country: countryRecord.name,
        countryCode: countryRecord.iso2,
        flag: countryRecord.flag,
        capital: countryRecord.capital,
        lat: countryRecord.coordinates.lat,
        lng: countryRecord.coordinates.lng,
        population: countryRecord.population,
        region: countryRecord.region,
        subregion: countryRecord.subregion,
        languages: countryRecord.languages,
        currency: countryRecord.currency,
        majorCities: countryRecord.majorCities,
        timezone: capitalTz,
        capitalCoordinates: capitalCoords,
      };
    }

    // Fallback: check COUNTRY_COORDINATES constant
    const fallbackCoords = COUNTRY_COORDINATES[rawCountry.toLowerCase()] || COUNTRY_COORDINATES[rawCountry];
    const countryMeta = findCountryMeta(rawCountry);
    if (fallbackCoords) {
      return {
        type: 'country',
        id: `country-${rawCountry.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: countryMeta?.name || rawCountry,
        country: countryMeta?.name || rawCountry,
        countryCode: '',
        flag: countryMeta?.flag || '🏳️',
        capital: countryMeta?.capital,
        lat: fallbackCoords.lat,
        lng: fallbackCoords.lng,
      };
    }
  }

  // 4. If raw coordinates provided without city or country
  if (typeof input.lat === 'number' && typeof input.lng === 'number' &&
      input.lat >= -90 && input.lat <= 90 && input.lng >= -180 && input.lng <= 180) {
    return {
      type: 'city',
      id: `coord-${input.lat.toFixed(4)}-${input.lng.toFixed(4)}`,
      name: `${input.lat.toFixed(2)}°, ${input.lng.toFixed(2)}°`,
      country: input.country || 'Planet Earth',
      countryCode: '',
      flag: '🌐',
      lat: input.lat,
      lng: input.lng,
    };
  }

  return null;
}

// Client-side Weather In-Memory Cache (5-minute TTL)
const CLIENT_WEATHER_CACHE = new Map<string, { data: ForecastResponse; timestamp: number }>();
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;

// Deduplication map for active in-flight weather requests
const IN_FLIGHT_WEATHER = new Map<string, Promise<ForecastResponse>>();

/**
 * Fetch live weather forecast for coordinates with in-memory caching and request deduplication.
 * Reuses existing Open-Meteo endpoint /api/weather/forecast.
 */
export async function fetchLiveLocationWeather(
  lat: number,
  lng: number,
  options?: { signal?: AbortSignal; forceRefresh?: boolean }
): Promise<ForecastResponse> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;

  if (!options?.forceRefresh) {
    const cached = CLIENT_WEATHER_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Deduplicate concurrent requests for the exact same coordinates
  if (IN_FLIGHT_WEATHER.has(cacheKey) && !options?.forceRefresh) {
    return IN_FLIGHT_WEATHER.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(
        `/api/weather/forecast?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&timezone=auto`,
        { signal: options?.signal }
      );

      if (!res.ok) {
        throw new Error(`Weather telemetry request failed with status ${res.status}`);
      }

      const data: ForecastResponse = await res.json();
      CLIENT_WEATHER_CACHE.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      IN_FLIGHT_WEATHER.delete(cacheKey);
    }
  })();

  IN_FLIGHT_WEATHER.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Helper to deduplicate news headlines by title similarity and strip noise.
 */
export function deduplicateNewsArticles(articles: WorldEvent[]): WorldEvent[] {
  const seenTitles = new Set<string>();
  const deduplicated: WorldEvent[] = [];

  for (const art of articles) {
    if (!art.title || art.title.trim().length === 0) continue;
    // Normalize title: remove punctuation, lowercase
    const normalized = art.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenTitles.has(normalized)) continue;
    seenTitles.add(normalized);
    deduplicated.push(art);
  }

  return deduplicated;
}

/**
 * Helper: parse location parameters from URL search string or URLSearchParams.
 */
export function parseLocationFromUrl(search: string | URLSearchParams): {
  country: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  view: string | null;
} {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const rawCountry = params.get('country');
  const rawCity = params.get('city');
  const rawLat = params.get('lat');
  const rawLng = params.get('lng');
  const view = params.get('view');

  const latNum = rawLat ? parseFloat(rawLat) : null;
  const lngNum = rawLng ? parseFloat(rawLng) : null;

  const validLat = latNum !== null && !isNaN(latNum) && latNum >= -90 && latNum <= 90 ? latNum : null;
  const validLng = lngNum !== null && !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180 ? lngNum : null;

  return {
    country: rawCountry ? decodeURIComponent(rawCountry) : null,
    city: rawCity ? decodeURIComponent(rawCity) : null,
    lat: validLat,
    lng: validLng,
    view: view || null,
  };
}

/**
 * Helper: serialize location parameters to a search query string.
 */
export function serializeLocationToUrl(location: CanonicalLocation, currentParams?: URLSearchParams): string {
  const params = currentParams ? new URLSearchParams(currentParams) : new URLSearchParams();

  if (location.type === 'city') {
    params.set('city', location.name);
    params.set('country', location.country);
    params.set('lat', location.lat.toFixed(4));
    params.set('lng', location.lng.toFixed(4));
  } else {
    params.set('country', location.name);
    params.delete('city');
    params.delete('lat');
    params.delete('lng');
  }

  return params.toString();
}
