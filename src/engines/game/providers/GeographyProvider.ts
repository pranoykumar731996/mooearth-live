// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Geography Provider
// ============================================================
// Generates geography-based challenges using existing country
// metadata, coordinates, and border graphs. Zero network calls.
//
// Challenge Types:
//   GEO_GLOBE_HUNT      — "Find [Country] on the globe"
//   GEO_RANDOM_LOCATION  — Clue-based location guessing
//   GEO_DISTANCE         — Estimate distance between two cities
//   GEO_BORDER_ESCAPE    — Navigate borders from A to B
//   GEO_COUNTRY_CHAIN    — Build the longest neighbor chain

import {
  ChallengeRequest,
  ChallengeType,
  DataProvider,
  EarthChallenge,
  GeoCoordinate,
  ProviderStatus,
  ChallengeDifficulty,
} from '../types';
import { AntiRepeatEngine } from '../AntiRepeatEngine';
import { selectCountryForDifficulty, adjustTimeLimit } from '../DifficultyEngine';
import { getDefaultTimeLimit, getBasePoints } from '../registry';
import { haversineDistance, findBorderPath, getNeighbours } from '../ValidationEngine';
import { COUNTRY_METADATA, CountryMeta } from '@/data/questions/countryMetadata';
import { COUNTRY_COORDINATES } from '@/lib/constants';

// ---- Helpers ----

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCoordinates(country: string): GeoCoordinate | null {
  const lower = country.toLowerCase();
  for (const [key, data] of Object.entries(COUNTRY_COORDINATES)) {
    if (key.toLowerCase() === lower) {
      return { lat: data.lat, lng: data.lng };
    }
  }
  return null;
}

function getMetaWithCoords(): (CountryMeta & { coords: GeoCoordinate })[] {
  return (Object.values(COUNTRY_METADATA) as CountryMeta[])
    .map(m => {
      const coords = getCoordinates(m.name);
      return coords ? { ...m, coords } : null;
    })
    .filter((m): m is CountryMeta & { coords: GeoCoordinate } => m !== null);
}

/** Generate a unique challenge ID */
function genChallengeId(type: string, target: string, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 100000);
  return `geo-${type}-${target.replace(/\s/g, '').toLowerCase()}-${Date.now()}-${s}`;
}

// ---- Challenge Generators ----

function generateGlobeHunt(
  difficulty: ChallengeDifficulty,
  excludeCountries: string[],
  targetCountry?: string
): EarthChallenge | null {
  const country = targetCountry || selectCountryForDifficulty(difficulty, excludeCountries);
  const coords = getCoordinates(country);
  if (!coords) return null;

  const meta = (Object.values(COUNTRY_METADATA) as CountryMeta[]).find(
    m => m.name.toLowerCase() === country.toLowerCase()
  );
  const hint = difficulty === 'easy' && meta
    ? `Hint: This country is in ${meta.continent}.`
    : difficulty === 'medium' && meta
      ? `Hint: The capital is ${meta.capital}.`
      : undefined;

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('GEO_GLOBE_HUNT'), difficulty);

  return {
    id: genChallengeId('hunt', country),
    type: 'GEO_GLOBE_HUNT',
    engine: 'geography',
    difficulty,
    responseType: 'globe_tap',
    question: `Find ${country} on the globe.`,
    hint,
    explanation: meta
      ? `${meta.flag} ${meta.name} — ${meta.funFact}`
      : `${country} is located at ${coords.lat.toFixed(1)}°, ${coords.lng.toFixed(1)}°.`,
    targetCountry: country,
    targetCoordinates: coords,
    points: getBasePoints('GEO_GLOBE_HUNT', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint('geography', 'GEO_GLOBE_HUNT', country),
  };
}

function generateRandomLocation(
  difficulty: ChallengeDifficulty,
  excludeCountries: string[]
): EarthChallenge | null {
  const pool = getMetaWithCoords().filter(
    m => !excludeCountries.includes(m.name.toLowerCase())
  );
  if (pool.length === 0) return null;

  const target = shuffle(pool)[0];
  const coords = target.coords;

  // Build clues based on difficulty (more clues for easier)
  const clues: string[] = [];
  clues.push(`This location is in ${target.continent}.`);

  if (difficulty === 'easy' || difficulty === 'medium') {
    clues.push(`The local language is ${target.language}.`);
    clues.push(`The currency used here is ${target.currency}.`);
  }
  if (difficulty === 'easy') {
    clues.push(`A famous landmark here is ${target.landmark}.`);
  }

  const latBand = coords.lat > 23.5 ? 'Northern Hemisphere' : coords.lat < -23.5 ? 'Southern Hemisphere' : 'Tropical zone';
  clues.push(`This location is in the ${latBand}.`);

  const toleranceMap: Record<ChallengeDifficulty, number> = {
    easy: 1500,
    medium: 1000,
    hard: 500,
    expert: 250,
  };

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('GEO_RANDOM_LOCATION'), difficulty);

  return {
    id: genChallengeId('loc', target.name),
    type: 'GEO_RANDOM_LOCATION',
    engine: 'geography',
    difficulty,
    responseType: 'globe_point',
    question: `Find this mystery location on the globe.`,
    hint: clues.join(' '),
    explanation: `${target.flag} The location was ${target.capital}, ${target.name}. ${target.funFact}`,
    targetCountry: target.name,
    targetCity: target.capital,
    targetCoordinates: coords,
    toleranceRadius: toleranceMap[difficulty],
    points: getBasePoints('GEO_RANDOM_LOCATION', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint('geography', 'GEO_RANDOM_LOCATION', target.name),
  };
}

function generateDistance(
  difficulty: ChallengeDifficulty,
  excludeCountries: string[]
): EarthChallenge | null {
  const pool = getMetaWithCoords().filter(
    m => !excludeCountries.includes(m.name.toLowerCase())
  );
  if (pool.length < 2) return null;

  const shuffled = shuffle(pool);
  const a = shuffled[0];
  const b = shuffled[1];

  const actualDistance = Math.round(haversineDistance(a.coords, b.coords));

  // Tolerance: 15% for easy, 10% for medium, 7% for hard, 5% for expert
  const tolerancePercent: Record<ChallengeDifficulty, number> = {
    easy: 0.20,
    medium: 0.15,
    hard: 0.10,
    expert: 0.05,
  };
  const tolerance = Math.round(actualDistance * tolerancePercent[difficulty]);

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('GEO_DISTANCE'), difficulty);

  return {
    id: genChallengeId('dist', `${a.name}-${b.name}`),
    type: 'GEO_DISTANCE',
    engine: 'geography',
    difficulty,
    responseType: 'slider',
    question: `Estimate the distance between ${a.capital}, ${a.name} and ${b.capital}, ${b.name}.`,
    explanation: `The actual distance is approximately ${actualDistance.toLocaleString()} km.`,
    targetCountry: a.name,
    correctValue: actualDistance,
    toleranceRadius: tolerance,
    points: getBasePoints('GEO_DISTANCE', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint(
      'geography', 'GEO_DISTANCE', `${a.name}:${b.name}`
    ),
    data: {
      cityA: a.capital,
      countryA: a.name,
      flagA: a.flag,
      coordsA: a.coords,
      cityB: b.capital,
      countryB: b.name,
      flagB: b.flag,
      coordsB: b.coords,
      actualDistanceKm: actualDistance,
      maxSliderValue: Math.min(actualDistance * 3, 20000),
    },
  };
}

function generateBorderEscape(
  difficulty: ChallengeDifficulty,
  excludeCountries: string[]
): EarthChallenge | null {
  // Find two countries with a valid border path
  const countriesWithNeighbours = (Object.values(COUNTRY_METADATA) as CountryMeta[]).filter(
    m => m.neighbours && m.neighbours.length > 0
  );
  if (countriesWithNeighbours.length < 2) return null;

  const shuffled = shuffle(countriesWithNeighbours);

  for (let i = 0; i < Math.min(20, shuffled.length); i++) {
    for (let j = i + 1; j < Math.min(20, shuffled.length); j++) {
      const start = shuffled[i];
      const end = shuffled[j];

      if (excludeCountries.includes(start.name.toLowerCase())) continue;
      if (excludeCountries.includes(end.name.toLowerCase())) continue;

      const path = findBorderPath(start.name, end.name);
      if (!path) continue;

      // Filter path length by difficulty
      const minLength: Record<ChallengeDifficulty, number> = { easy: 2, medium: 3, hard: 4, expert: 5 };
      const maxLength: Record<ChallengeDifficulty, number> = { easy: 4, medium: 6, hard: 8, expert: 12 };

      if (path.length < minLength[difficulty] || path.length > maxLength[difficulty]) continue;

      const timeLimit = adjustTimeLimit(getDefaultTimeLimit('GEO_BORDER_ESCAPE'), difficulty);

      // Capitalize path entries
      const capitalizedPath = path.map(p =>
        p.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      );

      return {
        id: genChallengeId('escape', `${start.name}-${end.name}`),
        type: 'GEO_BORDER_ESCAPE',
        engine: 'geography',
        difficulty,
        responseType: 'path_select',
        question: `Navigate from ${start.name} ${start.flag} to ${end.name} ${end.flag} through shared borders.`,
        explanation: `Shortest route: ${capitalizedPath.join(' → ')} (${path.length} moves).`,
        targetCountry: end.name,
        correctPath: capitalizedPath,
        points: getBasePoints('GEO_BORDER_ESCAPE', difficulty),
        timeLimit,
        generatedAt: new Date().toISOString(),
        fingerprint: AntiRepeatEngine.computeFingerprint(
          'geography', 'GEO_BORDER_ESCAPE', `${start.name}:${end.name}`
        ),
        data: {
          startCountry: start.name,
          startFlag: start.flag,
          endCountry: end.name,
          endFlag: end.flag,
          optimalPathLength: path.length,
        },
      };
    }
  }

  return null; // No valid pair found
}

function generateCountryChain(
  difficulty: ChallengeDifficulty,
  excludeCountries: string[]
): EarthChallenge | null {
  const country = selectCountryForDifficulty(difficulty, excludeCountries);
  const neighbours = getNeighbours(country);

  if (neighbours.length === 0) {
    // Island nation — try another country
    const altCountry = selectCountryForDifficulty(difficulty, [...excludeCountries, country]);
    const altNeighbours = getNeighbours(altCountry);
    if (altNeighbours.length === 0) return null;
    return generateCountryChainFrom(altCountry, difficulty);
  }

  return generateCountryChainFrom(country, difficulty);
}

function generateCountryChainFrom(
  startCountry: string,
  difficulty: ChallengeDifficulty
): EarthChallenge {
  const meta = (Object.values(COUNTRY_METADATA) as CountryMeta[]).find(
    m => m.name.toLowerCase() === startCountry.toLowerCase()
  );
  const flag = meta?.flag || '🏳️';

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('GEO_COUNTRY_CHAIN'), difficulty);

  return {
    id: genChallengeId('chain', startCountry),
    type: 'GEO_COUNTRY_CHAIN',
    engine: 'geography',
    difficulty,
    responseType: 'path_select',
    question: `Starting from ${startCountry} ${flag}, build the longest chain of neighboring countries!`,
    explanation: `Each move must be to a country that shares a border with your current country.`,
    targetCountry: startCountry,
    points: getBasePoints('GEO_COUNTRY_CHAIN', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint(
      'geography', 'GEO_COUNTRY_CHAIN', startCountry
    ),
    data: {
      startCountry,
      startFlag: flag,
    },
  };
}

// ---- Provider Implementation ----

const SUPPORTED_TYPES: ChallengeType[] = [
  'GEO_GLOBE_HUNT',
  'GEO_RANDOM_LOCATION',
  'GEO_DISTANCE',
  'GEO_BORDER_ESCAPE',
  'GEO_COUNTRY_CHAIN',
];

export const GeographyProvider: DataProvider = {
  engine: 'geography',
  supportedTypes: SUPPORTED_TYPES,

  async isAvailable(): Promise<boolean> {
    // Geography is always available — no network dependency
    return true;
  },

  getStatus(): ProviderStatus {
    return {
      name: 'Geography Provider',
      engine: 'geography',
      available: true,
      lastSuccessfulFetch: Date.now(),
      lastError: null,
      cacheStatus: 'fresh',
      latencyMs: 0,
    };
  },

  async generateChallenge(request: ChallengeRequest): Promise<EarthChallenge | null> {
    const difficulty = request.difficulty || 'medium';
    const recentCountries = (request.excludeFingerprints || [])
      .filter((f): f is string => typeof f === 'string' && f.startsWith('geography:'))
      .map(f => f.split(':')[2] || '')
      .filter(Boolean);

    // If a specific type is requested, generate that
    if (request.type) {
      return generateByType(request.type, difficulty, recentCountries, request.targetCountry);
    }

    // Otherwise, pick a random type from supported types
    const shuffledTypes = shuffle(SUPPORTED_TYPES);
    for (const type of shuffledTypes) {
      const challenge = generateByType(type, difficulty, recentCountries, request.targetCountry);
      if (challenge) return challenge;
    }

    return null;
  },
};

function generateByType(
  type: ChallengeType,
  difficulty: ChallengeDifficulty,
  excludeCountries: string[],
  targetCountry?: string
): EarthChallenge | null {
  switch (type) {
    case 'GEO_GLOBE_HUNT':
      return generateGlobeHunt(difficulty, excludeCountries, targetCountry);
    case 'GEO_RANDOM_LOCATION':
      return generateRandomLocation(difficulty, excludeCountries);
    case 'GEO_DISTANCE':
      return generateDistance(difficulty, excludeCountries);
    case 'GEO_BORDER_ESCAPE':
      return generateBorderEscape(difficulty, excludeCountries);
    case 'GEO_COUNTRY_CHAIN':
      return generateCountryChain(difficulty, excludeCountries);
    default:
      return null;
  }
}
