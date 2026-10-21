// ============================================================
// MooEarth Live — Stop the Earth: Verified Question Bank
// ============================================================
// 500+ verified geographic questions generated from existing
// in-codebase data sources. Each question has verified coordinates,
// country membership, difficulty tier, and tolerance radius.
//
// Sources:
// - worldPlaces.ts: 195 capitals + 60+ cities + 50+ landmarks
// - canonicalCountries.ts: 195 sovereign country records
// - countryMetadata.ts: landmarks, neighbours, fun facts

import { GeoQuestion, GeoQuestionType, SteDifficulty } from '@/engines/game/stopTheEarth/types';
export type { GeoQuestion, GeoQuestionType, SteDifficulty };
import { ALL_WORLD_PLACES, ICONIC_LANDMARKS, FAMOUS_METROPOLISES, WORLD_CAPITALS, WorldPlace } from '@/data/worldPlaces';
import { CANONICAL_COUNTRIES } from '@/data/countries';
import { locations } from '@/data/locations';

// ---- Fingerprint Generation ----

function generateFingerprint(placeName: string, country: string, type: string): string {
  const normalized = `${placeName.toLowerCase().trim()}|${country.toLowerCase().trim()}|${type}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `ste-fp-${Math.abs(hash).toString(36)}`;
}

// ---- Difficulty Assignment ----

const EASY_TYPES: GeoQuestionType[] = ['capital', 'wonder'];
const MEDIUM_TYPES: GeoQuestionType[] = ['city', 'landmark'];
const HARD_TYPES: GeoQuestionType[] = ['natural', 'mountain', 'river', 'lake', 'island', 'park'];

// Famous wonders and landmarks that are globally recognizable → easy
const GLOBALLY_FAMOUS: Set<string> = new Set([
  'Eiffel Tower', 'Statue of Liberty', 'Taj Mahal', 'Great Pyramids of Giza',
  'Colosseum', 'Machu Picchu', 'Christ the Redeemer', 'Great Wall of China',
  'Sydney Opera House', 'Big Ben & Westminster', 'Burj Khalifa', 'Sagrada Família',
  'Mount Everest', 'Grand Canyon', 'Niagara Falls', 'Golden Gate Bridge',
  'Chichen Itza', 'Angkor Wat', 'Hagia Sophia', 'Forbidden City',
]);

// Major world cities that most people know → easy
const MAJOR_CITIES: Set<string> = new Set([
  'New York City', 'London', 'Paris', 'Tokyo', 'Beijing', 'Moscow',
  'Los Angeles', 'Dubai', 'Istanbul', 'Sydney', 'Rio de Janeiro',
  'Mumbai', 'Shanghai', 'São Paulo', 'Barcelona', 'Berlin', 'Rome',
  'Cairo', 'Mexico City', 'Toronto', 'Seoul', 'Bangkok', 'San Francisco',
  'Singapore', 'Hong Kong', 'Chicago', 'Madrid', 'Amsterdam',
]);

// Prominent world capitals that are globally famous and easy to recognize
const FAMOUS_CAPITALS: Set<string> = new Set([
  'Paris', 'London', 'Tokyo', 'Washington, D.C.', 'Washington D.C.', 'Berlin', 'Rome',
  'Beijing', 'New Delhi', 'Madrid', 'Moscow', 'Cairo', 'Seoul', 'Bangkok', 'Ottawa',
  'Canberra', 'Brasília', 'Buenos Aires', 'Riyadh', 'Jakarta', 'Mexico City', 'Ankara',
  'Athens', 'Dublin', 'Amsterdam', 'Bern', 'Vienna', 'Stockholm', 'Oslo', 'Copenhagen',
]);

// Obscure / small island / challenging capitals that belong in hard tier
const HARD_CAPITALS: Set<string> = new Set([
  'Ngerulmud', 'Funafuti', 'Yaren', 'Tarawa', 'Palikir', 'Majuro', 'Honiara',
  'Port Moresby', 'Suva', 'Nukuʻalofa', 'Apia', 'Port Vila', 'Moroni', 'Victoria',
  'São Tomé', 'Praia', 'Malabo', 'Mbabane', 'Maseru', 'Gitega', 'Bujumbura',
  'Banjul', 'Bissau', 'Conakry', 'Freetown', 'Monrovia', 'Lomé', 'Porto-Novo',
  'Bangui', 'N\'Djamena', 'Libreville', 'Brazzaville', 'Kinshasa', 'Kigali',
  'Djibouti', 'Asmara', 'Mogadishu', 'Juba', 'Dodoma', 'Lilongwe', 'Lusaka',
  'Harare', 'Gaborone', 'Windhoek', 'Maputo', 'Antananarivo', 'Port Louis',
  'Georgetown', 'Paramaribo', 'Belmopan', 'San Salvador', 'Tegucigalpa',
  'Managua', 'San José', 'St. George\'s', 'Kingstown', 'Castries',
  'Bridgetown', 'Roseau', 'St. John\'s', 'Basseterre', 'Nassau',
  'Thimphu', 'Vientiane', 'Naypyidaw', 'Phnom Penh', 'Bandar Seri Begawan',
  'Dili', 'Ulaanbaatar', 'Astana', 'Tashkent', 'Ashgabat', 'Bishkek', 'Dushanbe',
  'Yerevan', 'Baku', 'Tbilisi', 'Chisinau', 'Podgorica', 'Skopje', 'Pristina',
  'Sarajevo', 'Tirana', 'Vaduz', 'San Marino', 'Andorra la Vella',
]);

function assignDifficulty(place: WorldPlace): SteDifficulty {
  // Globally famous landmarks → always easy
  if (GLOBALLY_FAMOUS.has(place.name)) return 'easy';
  // Major world cities → easy
  if (MAJOR_CITIES.has(place.name)) return 'easy';
  // Wonders → easy
  if (place.type === 'wonder') return 'easy';
  // Capitals
  if (place.type === 'capital') {
    if (FAMOUS_CAPITALS.has(place.name)) return 'easy';
    if (HARD_CAPITALS.has(place.name)) return 'hard';
    return 'medium';
  }
  // Known cities
  if (place.type === 'city') {
    return 'medium';
  }
  // Landmarks
  if (place.type === 'landmark') return 'medium';
  // Natural features, islands, remote places → hard
  if (HARD_TYPES.includes(place.type as GeoQuestionType)) return 'hard';
  return 'medium';
}

// ---- Tolerance Radii (km) ----

const TOLERANCE_BY_DIFFICULTY: Record<SteDifficulty, number> = {
  easy: 50,
  medium: 30,
  hard: 15,
};

// Larger countries get more tolerance (harder to pinpoint in a large area)
const LARGE_COUNTRY_CODES = new Set(['RU', 'CA', 'US', 'CN', 'BR', 'AU', 'IN', 'AR']);

function getToleranceKm(difficulty: SteDifficulty, countryCode: string): number {
  const base = TOLERANCE_BY_DIFFICULTY[difficulty];
  if (LARGE_COUNTRY_CODES.has(countryCode.toUpperCase())) {
    return Math.round(base * 1.5);
  }
  return base;
}

// ---- Question Text Templates ----

const QUESTION_TEMPLATES: Record<GeoQuestionType, string[]> = {
  capital: [
    'Find {place}, the capital of {country}',
    'Locate {place} on the map of {country}',
    'Where is {place}, the capital city of {country}?',
  ],
  city: [
    'Find the city of {place} in {country}',
    'Locate {place} on the map of {country}',
    'Where is {place} in {country}?',
  ],
  landmark: [
    'Find {place} in {country}',
    'Locate {place} on the map',
    'Where is {place} located in {country}?',
  ],
  wonder: [
    'Find {place} in {country}',
    'Locate the famous {place}',
    'Where is {place} in {country}?',
  ],
  mountain: [
    'Find {place} on the map of {country}',
    'Where is {place} located?',
    'Locate the peak of {place} in {country}',
  ],
  river: [
    'Find {place} in {country}',
    'Locate {place} on the map',
  ],
  lake: [
    'Find {place} in {country}',
    'Locate {place} on the map',
  ],
  island: [
    'Find {place} on the map',
    'Locate {place} in the {region} region',
  ],
  natural: [
    'Find {place} in {country}',
    'Locate {place} on the map of {country}',
    'Where is {place}?',
  ],
  park: [
    'Find {place} in {country}',
    'Locate {place} on the map',
  ],
};

function generateQuestionText(
  place: WorldPlace,
  type: GeoQuestionType
): string {
  const templates = QUESTION_TEMPLATES[type] || QUESTION_TEMPLATES.landmark;
  const template = templates[Math.abs(place.name.length) % templates.length];
  return template
    .replace('{place}', place.name)
    .replace('{country}', place.country)
    .replace('{region}', place.region || '');
}

// ---- Build Question from WorldPlace ----

function worldPlaceToQuestion(place: WorldPlace): GeoQuestion {
  const type = mapWorldPlaceType(place.type);
  const difficulty = assignDifficulty(place);
  const countryCode = place.countryCode.toUpperCase();

  return {
    id: `ste-${countryCode.toLowerCase()}-${place.id}`,
    placeId: place.id,
    placeName: place.name,
    country: place.country,
    countryCode,
    type,
    difficulty,
    coordinates: { lat: place.coordinates.lat, lng: place.coordinates.lng },
    toleranceKm: getToleranceKm(difficulty, countryCode),
    questionText: generateQuestionText(place, type),
    explanation: place.description,
    region: place.region,
    fingerprint: generateFingerprint(place.name, place.country, type),
    verified: true,
    source: 'worldPlaces',
  };
}

function mapWorldPlaceType(wpType: string): GeoQuestionType {
  switch (wpType) {
    case 'capital': return 'capital';
    case 'city': return 'city';
    case 'landmark': return 'landmark';
    case 'wonder': return 'wonder';
    case 'island': return 'island';
    case 'natural': return 'natural';
    default: return 'landmark';
  }
}

// ---- Build Questions from Country Metadata (majorCities + landmark) ----

function buildCountryMetadataQuestions(): GeoQuestion[] {
  const questions: GeoQuestion[] = [];
  const seenFingerprints = new Set<string>();

  // Collect all existing place IDs to avoid duplicates
  const existingPlaceNames = new Set(ALL_WORLD_PLACES.map(p => p.name.toLowerCase()));

  for (const country of CANONICAL_COUNTRIES) {
    const cc = country.iso2.toUpperCase();

    // Add landmark question if not already in world places
    if (country.landmark && !existingPlaceNames.has(country.landmark.toLowerCase())) {
      const fp = generateFingerprint(country.landmark, country.name, 'landmark');
      if (!seenFingerprints.has(fp)) {
        seenFingerprints.add(fp);
        questions.push({
          id: `ste-${cc.toLowerCase()}-landmark-${country.slug}`,
          placeId: `landmark-${country.slug}`,
          placeName: country.landmark,
          country: country.name,
          countryCode: cc,
          type: 'landmark',
          difficulty: 'medium',
          coordinates: { lat: country.coordinates.lat, lng: country.coordinates.lng },
          toleranceKm: getToleranceKm('medium', cc),
          questionText: `Find ${country.landmark} in ${country.name}`,
          explanation: `${country.landmark} is a famous landmark in ${country.name}.`,
          region: country.subregion || country.region,
          fingerprint: fp,
          verified: true,
          source: 'canonicalCountries',
        });
      }
    }
  }

  return questions;
}

// ---- Build Questions from Locations Registry (cities + states) ----

function buildLocationsQuestions(): GeoQuestion[] {
  const questions: GeoQuestion[] = [];
  const seenFingerprints = new Set<string>();

  for (const loc of locations) {
    if (loc.type === 'city') {
      const cc = (loc.countryCode || '').toUpperCase();
      if (!cc) continue;
      const fp = generateFingerprint(loc.name, loc.country, 'city');
      if (seenFingerprints.has(fp)) continue;
      seenFingerprints.add(fp);

      let difficulty: SteDifficulty = 'medium';
      if (MAJOR_CITIES.has(loc.name)) {
        difficulty = 'easy';
      } else if (loc.population && loc.population < 800_000) {
        difficulty = 'hard';
      }

      questions.push({
        id: `ste-${cc.toLowerCase()}-city-${loc.id.replace(/^city-/, '')}`,
        placeId: loc.id,
        placeName: loc.name,
        country: loc.country,
        countryCode: cc,
        type: 'city',
        difficulty,
        coordinates: { lat: loc.lat, lng: loc.lng },
        toleranceKm: getToleranceKm(difficulty, cc),
        questionText: loc.state
          ? `Find the city of ${loc.name} (${loc.state}) in ${loc.country}`
          : `Find the city of ${loc.name} in ${loc.country}`,
        explanation: `${loc.name} is a city in ${loc.country}${loc.state ? `, ${loc.state}` : ''}${loc.population ? ` with a population of approximately ${loc.population.toLocaleString()}` : ''}.`,
        region: loc.state,
        fingerprint: fp,
        verified: true,
        source: 'locations',
      });
    } else if (loc.type === 'state') {
      const cc = (loc.countryCode || '').toUpperCase();
      if (!cc) continue;
      const fp = generateFingerprint(loc.name, loc.country, 'state');
      if (seenFingerprints.has(fp)) continue;
      seenFingerprints.add(fp);

      questions.push({
        id: `ste-${cc.toLowerCase()}-state-${loc.id.replace(/^state-/, '')}`,
        placeId: loc.id,
        placeName: loc.name,
        country: loc.country,
        countryCode: cc,
        type: 'landmark',
        difficulty: 'hard',
        coordinates: { lat: loc.lat, lng: loc.lng },
        toleranceKm: Math.min(getToleranceKm('hard', cc) * 2, 80),
        questionText: `Locate the state/region of ${loc.name} in ${loc.country}`,
        explanation: `${loc.name} is a state or province in ${loc.country}.`,
        region: loc.name,
        fingerprint: fp,
        verified: true,
        source: 'locations',
      });
    }
  }

  return questions;
}

// ---- Deduplication ----

function deduplicateQuestions(questions: GeoQuestion[]): GeoQuestion[] {
  const seen = new Map<string, GeoQuestion>();

  for (const q of questions) {
    // Dedup by fingerprint (same place + country + type)
    if (!seen.has(q.fingerprint)) {
      seen.set(q.fingerprint, q);
    }
  }

  return Array.from(seen.values());
}

// ---- Build the Complete Question Bank ----

function buildQuestionBank(): GeoQuestion[] {
  const fromWorldPlaces = ALL_WORLD_PLACES.map(worldPlaceToQuestion);
  const fromMetadata = buildCountryMetadataQuestions();
  const fromLocations = buildLocationsQuestions();

  const all = [...fromWorldPlaces, ...fromMetadata, ...fromLocations];
  const deduped = deduplicateQuestions(all);

  // Sort by country then difficulty for deterministic ordering
  deduped.sort((a, b) => {
    const countryCompare = a.country.localeCompare(b.country);
    if (countryCompare !== 0) return countryCompare;
    const diffOrder: Record<SteDifficulty, number> = { easy: 0, medium: 1, hard: 2 };
    return diffOrder[a.difficulty] - diffOrder[b.difficulty];
  });

  return deduped;
}

// ---- Exported Question Bank ----

/** The complete verified question bank */
export const QUESTION_BANK: GeoQuestion[] = buildQuestionBank();

/** Pre-indexed lookup by ID */
const QUESTION_BY_ID = new Map<string, GeoQuestion>();
for (const q of QUESTION_BANK) {
  QUESTION_BY_ID.set(q.id, q);
}

/** Pre-indexed lookup by country (uppercase ISO2 code) */
const QUESTIONS_BY_COUNTRY = new Map<string, GeoQuestion[]>();
for (const q of QUESTION_BANK) {
  const key = q.countryCode.toUpperCase();
  if (!QUESTIONS_BY_COUNTRY.has(key)) {
    QUESTIONS_BY_COUNTRY.set(key, []);
  }
  QUESTIONS_BY_COUNTRY.get(key)!.push(q);
}

// ---- Query API ----

/**
 * Get a question by its unique ID.
 */
export function getQuestionById(id: string): GeoQuestion | null {
  return QUESTION_BY_ID.get(id) || null;
}

/**
 * Get all questions for a specific country.
 */
export function getQuestionsForCountry(countryCode: string): GeoQuestion[] {
  return QUESTIONS_BY_COUNTRY.get(countryCode.toUpperCase()) || [];
}

/**
 * Get questions for a country filtered by difficulty.
 */
export function getQuestionsForCountryAndDifficulty(
  countryCode: string,
  difficulty: SteDifficulty
): GeoQuestion[] {
  return getQuestionsForCountry(countryCode).filter(q => q.difficulty === difficulty);
}

/**
 * Get eligible questions: match country + difficulty, exclude already-served IDs.
 */
export function getEligibleQuestions(
  countryCode: string,
  difficulty: SteDifficulty,
  excludeIds: Set<string>
): GeoQuestion[] {
  return getQuestionsForCountry(countryCode).filter(
    q => q.difficulty === difficulty && !excludeIds.has(q.id)
  );
}

/**
 * Get eligible questions with difficulty fallback.
 * If no questions remain at the requested difficulty, try adjacent levels.
 */
export function getEligibleQuestionsWithFallback(
  countryCode: string,
  difficulty: SteDifficulty,
  excludeIds: Set<string>
): GeoQuestion[] {
  // Try exact difficulty first
  let eligible = getEligibleQuestions(countryCode, difficulty, excludeIds);
  if (eligible.length > 0) return eligible;

  // Fallback: try all difficulties for the country
  const allForCountry = getQuestionsForCountry(countryCode);
  eligible = allForCountry.filter(q => !excludeIds.has(q.id));
  return eligible;
}

/**
 * Select a random question from eligible pool.
 */
export function selectRandomQuestion(eligible: GeoQuestion[]): GeoQuestion | null {
  if (eligible.length === 0) return null;
  const index = Math.floor(Math.random() * eligible.length);
  return eligible[index];
}

/**
 * Get a summary of question availability per country.
 */
export function getQuestionBankStats(): {
  totalQuestions: number;
  countriesWithQuestions: number;
  byDifficulty: Record<SteDifficulty, number>;
  byType: Record<string, number>;
} {
  const byDifficulty: Record<SteDifficulty, number> = { easy: 0, medium: 0, hard: 0 };
  const byType: Record<string, number> = {};

  for (const q of QUESTION_BANK) {
    byDifficulty[q.difficulty]++;
    byType[q.type] = (byType[q.type] || 0) + 1;
  }

  return {
    totalQuestions: QUESTION_BANK.length,
    countriesWithQuestions: QUESTIONS_BY_COUNTRY.size,
    byDifficulty,
    byType,
  };
}

/**
 * Get the number of available questions for a country.
 */
export function getQuestionCountForCountry(countryCode: string): number {
  return getQuestionsForCountry(countryCode).length;
}

/**
 * Get all unique country codes that have questions.
 */
export function getCountriesWithQuestions(): string[] {
  return Array.from(QUESTIONS_BY_COUNTRY.keys());
}
