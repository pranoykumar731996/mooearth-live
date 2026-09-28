// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Earth Events Provider
// ============================================================
// Fetches real earthquake data from the USGS Earthquake API
// and generates location-based challenges.
//
// Challenge Types:
//   EARTHQUAKE_HUNT      — Find where a real earthquake occurred
//   EARTH_EVENT_LOCATION — Identify the country from event description

import {
  ChallengeRequest,
  ChallengeType,
  DataProvider,
  EarthChallenge,
  ProviderStatus,
  ChallengeDifficulty,
  EarthEvent,
  EarthEventDataset,
} from '../types';
import { AntiRepeatEngine } from '../AntiRepeatEngine';
import { adjustTimeLimit } from '../DifficultyEngine';
import { getDefaultTimeLimit, getBasePoints } from '../registry';
import { COUNTRY_METADATA, CountryMeta } from '@/data/questions/countryMetadata';

// ---- Configuration ----

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const USGS_API_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

// ---- Cache ----

let eventCache: EarthEventDataset | null = null;

// ---- Helpers ----

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genId(type: string, target: string): string {
  return `earth-${type}-${target.replace(/\s/g, '').toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Get random decoy countries for multiple-choice */
function getDecoyCountries(correctCountry: string, count: number): string[] {
  const allCountries = (Object.values(COUNTRY_METADATA) as CountryMeta[])
    .map(m => m.name)
    .filter(n => n.toLowerCase() !== correctCountry.toLowerCase());
  return shuffle(allCountries).slice(0, count);
}

/**
 * Attempt to resolve an earthquake location string to a country name.
 * USGS location strings are like "23 km SW of City, Country" or just "Region".
 */
function resolveCountryFromLocation(location: string): string | null {
  // Try to extract the part after the last comma
  const parts = location.split(',');
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1].trim();
    // Check if it matches a known country
    const meta = (Object.values(COUNTRY_METADATA) as CountryMeta[]).find(
      m => m.name.toLowerCase() === lastPart.toLowerCase()
    );
    if (meta) return meta.name;
  }

  // Try matching country names anywhere in the string
  const locationLower = location.toLowerCase();
  for (const meta of Object.values(COUNTRY_METADATA) as CountryMeta[]) {
    if (locationLower.includes(meta.name.toLowerCase())) {
      return meta.name;
    }
  }

  // Common USGS region names to country mappings
  const regionMappings: Record<string, string> = {
    'california': 'United States', 'alaska': 'United States', 'hawaii': 'United States',
    'oklahoma': 'United States', 'nevada': 'United States', 'utah': 'United States',
    'honshu': 'Japan', 'hokkaido': 'Japan',
    'sumatra': 'Indonesia', 'java': 'Indonesia', 'sulawesi': 'Indonesia',
    'luzon': 'Philippines', 'mindanao': 'Philippines',
    'papua new guinea': 'Papua New Guinea',
    'new zealand': 'New Zealand',
  };

  for (const [region, country] of Object.entries(regionMappings)) {
    if (locationLower.includes(region)) return country;
  }

  return null;
}

// ---- Data Fetching ----

async function fetchEarthquakeData(): Promise<EarthEvent[]> {
  // Fetch significant earthquakes in the past day
  const urls = [
    `${USGS_API_BASE}/significant_day.geojson`,
    `${USGS_API_BASE}/4.5_day.geojson`, // Fallback: M4.5+ in past day
    `${USGS_API_BASE}/2.5_day.geojson`, // Further fallback: M2.5+ in past day
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      if (!data.features || data.features.length === 0) continue;

       
      const events: EarthEvent[] = data.features.map((f: any) => {
        const props = f.properties;
        const coords = f.geometry?.coordinates;
        const country = resolveCountryFromLocation(props.place || '');

        return {
          id: f.id || `usgs-${Date.now()}`,
          type: 'earthquake' as const,
          magnitude: props.mag,
          depth: coords?.[2],
          location: props.place || 'Unknown location',
          country,
          coordinates: {
            lat: coords?.[1] ?? 0,
            lng: coords?.[0] ?? 0,
          },
          timestamp: new Date(props.time).toISOString(),
          source: 'USGS',
          sourceUrl: props.url,
        };
      });

      // Only return events with resolved countries
      const resolved = events.filter(e => e.country);
      if (resolved.length > 0) return resolved;
      // If no country resolved, return all (we can still use coordinates)
      return events;
    } catch {
      continue;
    }
  }

  return [];
}

async function getEarthEvents(): Promise<EarthEvent[]> {
  const now = Date.now();

  if (eventCache && now < eventCache.expiresAt) {
    return eventCache.events;
  }

  try {
    const events = await fetchEarthquakeData();
    eventCache = {
      events,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL_MS,
    };
    return events;
  } catch (error) {
    if (eventCache) return eventCache.events;
    throw error;
  }
}

// ---- Challenge Generators ----

function generateEarthquakeHunt(
  events: EarthEvent[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  const usableEvents = events.filter(e => e.country && e.magnitude);
  if (usableEvents.length === 0) return null;

  const event = shuffle(usableEvents)[0];

  const hint = difficulty === 'easy'
    ? `Hint: This earthquake was near ${event.location}.`
    : difficulty === 'medium' && event.magnitude
      ? `Hint: This was a magnitude ${event.magnitude.toFixed(1)} earthquake.`
      : undefined;

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('EARTHQUAKE_HUNT'), difficulty);

  return {
    id: genId('quake', event.country || 'unknown'),
    type: 'EARTHQUAKE_HUNT',
    engine: 'earth_events',
    difficulty,
    responseType: 'globe_tap',
    question: `🌋 A real earthquake (M${event.magnitude?.toFixed(1) || '?'}) was detected recently. Find the country where it occurred!`,
    hint,
    explanation: `🌋 A magnitude ${event.magnitude?.toFixed(1)} earthquake occurred at ${event.location} at a depth of ${event.depth?.toFixed(0) || '?'} km.`,
    targetCountry: event.country || '',
    targetCoordinates: event.coordinates,
    points: getBasePoints('EARTHQUAKE_HUNT', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint(
      'earth_events', 'EARTHQUAKE_HUNT', event.country || event.id, event.timestamp
    ),
    source: 'USGS Earthquake Hazards Program',
    sourceDataTimestamp: event.timestamp,
    data: {
      magnitude: event.magnitude,
      depth: event.depth,
      location: event.location,
      eventId: event.id,
      sourceUrl: event.sourceUrl,
    },
  };
}

function generateEarthEventLocation(
  events: EarthEvent[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  const usableEvents = events.filter(e => e.country);
  if (usableEvents.length === 0) return null;

  const event = shuffle(usableEvents)[0];

  // Build multiple-choice
  const decoys = getDecoyCountries(event.country!, 3);
  const choices = shuffle([event.country!, ...decoys]);
  const correctIndex = choices.indexOf(event.country!);

  // Redact country from the location description
  let clue = event.location;
  if (event.country) {
    clue = clue.replace(new RegExp(event.country, 'gi'), '[???]');
  }

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('EARTH_EVENT_LOCATION'), difficulty);

  return {
    id: genId('event', event.country || 'unknown'),
    type: 'EARTH_EVENT_LOCATION',
    engine: 'earth_events',
    difficulty,
    responseType: 'multiple_choice',
    question: `🌎 A ${event.type} event was detected at: "${clue}"\n\nWhich country?`,
    choices,
    correctIndex,
    explanation: `The event occurred at ${event.location} — a magnitude ${event.magnitude?.toFixed(1) || '?'} ${event.type}.`,
    targetCountry: event.country || '',
    targetCoordinates: event.coordinates,
    points: getBasePoints('EARTH_EVENT_LOCATION', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint(
      'earth_events', 'EARTH_EVENT_LOCATION', event.country || event.id, event.timestamp
    ),
    source: 'USGS',
    sourceDataTimestamp: event.timestamp,
    data: {
      magnitude: event.magnitude,
      eventType: event.type,
      eventId: event.id,
    },
  };
}

// ---- Provider Implementation ----

const SUPPORTED_TYPES: ChallengeType[] = [
  'EARTHQUAKE_HUNT',
  'EARTH_EVENT_LOCATION',
];

export const EarthEventsProvider: DataProvider<EarthEventDataset> = {
  engine: 'earth_events',
  supportedTypes: SUPPORTED_TYPES,

  async isAvailable(): Promise<boolean> {
    try {
      if (eventCache && Date.now() < eventCache.expiresAt) return true;
      const events = await getEarthEvents();
      return events.length > 0;
    } catch {
      return eventCache !== null;
    }
  },

  getStatus(): ProviderStatus {
    return {
      name: 'Earth Events Provider (USGS)',
      engine: 'earth_events',
      available: eventCache !== null,
      lastSuccessfulFetch: eventCache?.fetchedAt ?? null,
      lastError: null,
      cacheStatus: eventCache
        ? Date.now() < eventCache.expiresAt ? 'fresh' : 'stale'
        : 'empty',
      latencyMs: null,
    };
  },

  getCachedData(): EarthEventDataset | null {
    return eventCache;
  },

  async generateChallenge(request: ChallengeRequest): Promise<EarthChallenge | null> {
    const difficulty = request.difficulty || 'medium';

    let events: EarthEvent[];
    try {
      events = await getEarthEvents();
    } catch {
      return null;
    }

    if (events.length === 0) return null;

    if (request.type) {
      return generateEarthByType(request.type, events, difficulty);
    }

    const shuffledTypes = shuffle(SUPPORTED_TYPES);
    for (const type of shuffledTypes) {
      const challenge = generateEarthByType(type, events, difficulty);
      if (challenge) return challenge;
    }

    return null;
  },
};

function generateEarthByType(
  type: ChallengeType,
  events: EarthEvent[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  switch (type) {
    case 'EARTHQUAKE_HUNT':
      return generateEarthquakeHunt(events, difficulty);
    case 'EARTH_EVENT_LOCATION':
      return generateEarthEventLocation(events, difficulty);
    default:
      return null;
  }
}
