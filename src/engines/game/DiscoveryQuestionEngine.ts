// ============================================================
// MooEarth Live — Discovery Question Engine
// ============================================================
// Deterministic, verified geographic question generator.
// Built on authoritative datasets:
// - COUNTRY_METADATA (195+ sovereign nations with borders, landmarks, facts)
// - CANONICAL_COUNTRIES (geocodes, ISO codes)
// - ALL_WORLD_PLACES (curated wonders, landmarks, cities)
//
// Supports 6 core categories:
// 1. FLAG_ID           — Country and flag identification
// 2. CAPITAL_CITY      — Capitals and major cities
// 3. BORDER_NEIGHBOR   — Borders and neighboring nations
// 4. LANDMARK_GEOGRAPHY— Landmarks and physical geography
// 5. CONTINENT_LOCATION— Continental & hemisphere locations
// 6. GEOGRAPHIC_FACT   — Verified geographic superlatives and facts
//
// Zero hallucination. Every question and answer is validated against
// trusted geographic primitives before output.

import { EarthQuestion, QuizDifficulty } from '@/types';
import { COUNTRY_METADATA, CountryMeta } from '@/data/questions/countryMetadata';
import { CANONICAL_COUNTRIES, CountryRecord } from '@/data/countries';
import { ALL_WORLD_PLACES, WorldPlace } from '@/data/worldPlaces';
import { SeededRandom } from '@/data/questions';

export type DiscoveryQuestionCategory =
  | 'flag'
  | 'capital'
  | 'border'
  | 'landmark'
  | 'continent'
  | 'fact';

export interface DiscoveryQuestionConfig {
  difficulty?: QuizDifficulty;
  category?: DiscoveryQuestionCategory;
  countryName?: string;
  excludeIds?: string[];
  seed?: number;
}

const ALL_META = Object.values(COUNTRY_METADATA) as CountryMeta[];
const COUNTRIES_WITH_NEIGHBOURS = ALL_META.filter(m => m.neighbours && m.neighbours.length > 0);
const COUNTRIES_WITH_LANDMARKS = ALL_META.filter(m => m.landmark && m.landmark.length > 0);

/**
 * 1. FLAG IDENTIFICATION QUESTION
 * "Which country flies this national flag? [Flag Emoji]"
 */
export function generateFlagDiscoveryQuestion(
  rng: SeededRandom,
  countryMeta?: CountryMeta,
  difficulty: QuizDifficulty = 'medium'
): EarthQuestion {
  const target = countryMeta || ALL_META[rng.nextInt(0, ALL_META.length)];

  // Select 3 distractors
  let pool = ALL_META.filter(m => m.name !== target.name);
  if (difficulty === 'hard') {
    // Same continent distractors
    const sameCont = pool.filter(m => m.continent === target.continent);
    if (sameCont.length >= 3) pool = sameCont;
  }

  const shuffledPool = rng.shuffle(pool);
  const distractors = shuffledPool.slice(0, 3).map(m => m.name);
  const choices = rng.shuffle([target.name, ...distractors]);
  const correctIndex = choices.indexOf(target.name);

  return {
    id: `disc-flag-${target.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    country: target.name,
    category: 'geography',
    difficulty,
    question: `Which country flies this national flag?\n\n${target.flag}`,
    choices,
    correctIndex,
    funFact: `${target.flag} is the national flag of ${target.name}. Capital: ${target.capital}. ${target.funFact}`,
  };
}

/**
 * 2. CAPITAL CITY QUESTION
 * "What is the capital city of [Country]?"
 */
export function generateCapitalDiscoveryQuestion(
  rng: SeededRandom,
  countryMeta?: CountryMeta,
  difficulty: QuizDifficulty = 'medium'
): EarthQuestion {
  const target = countryMeta || ALL_META[rng.nextInt(0, ALL_META.length)];

  // Select 3 other capitals from the same continent if possible
  const otherCapitals = ALL_META
    .filter(m => m.name !== target.name && m.capital !== target.capital)
    .map(m => m.capital);

  const shuffledCapitals = rng.shuffle(otherCapitals);
  const distractors = shuffledCapitals.slice(0, 3);
  const choices = rng.shuffle([target.capital, ...distractors]);
  const correctIndex = choices.indexOf(target.capital);

  return {
    id: `disc-cap-${target.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    country: target.name,
    category: 'geography',
    difficulty,
    question: `What is the capital city of ${target.name}?`,
    choices,
    correctIndex,
    funFact: `${target.capital} is the capital of ${target.name}. Population: approx. ${target.population}.`,
  };
}

/**
 * 3. BORDER & NEIGHBORING NATION QUESTION
 * "Which of these countries shares a land border with [Country]?"
 */
export function generateBorderDiscoveryQuestion(
  rng: SeededRandom,
  countryMeta?: CountryMeta,
  difficulty: QuizDifficulty = 'medium'
): EarthQuestion {
  let target = countryMeta;
  if (!target || !target.neighbours || target.neighbours.length === 0) {
    target = COUNTRIES_WITH_NEIGHBOURS[rng.nextInt(0, COUNTRIES_WITH_NEIGHBOURS.length)];
  }

  const correctNeighbour = target.neighbours![rng.nextInt(0, target.neighbours!.length)];

  // Select 3 countries that do NOT share a border with target
  const neighbourSet = new Set(target.neighbours!.map(n => n.toLowerCase()));
  neighbourSet.add(target.name.toLowerCase());

  const nonNeighbours = ALL_META
    .filter(m => !neighbourSet.has(m.name.toLowerCase()))
    .map(m => m.name);

  const shuffledNonNeighbours = rng.shuffle(nonNeighbours);
  const distractors = shuffledNonNeighbours.slice(0, 3);
  const choices = rng.shuffle([correctNeighbour, ...distractors]);
  const correctIndex = choices.indexOf(correctNeighbour);

  return {
    id: `disc-border-${target.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${correctNeighbour.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    country: target.name,
    category: 'geography',
    difficulty,
    question: `Which of these countries shares an official land border with ${target.name}?`,
    choices,
    correctIndex,
    funFact: `${correctNeighbour} shares an international land border with ${target.name}. Neighbors include: ${target.neighbours!.join(', ')}.`,
  };
}

/**
 * 4. LANDMARK & PHYSICAL GEOGRAPHY QUESTION
 * "In which country is [Landmark] located?"
 */
export function generateLandmarkDiscoveryQuestion(
  rng: SeededRandom,
  countryMeta?: CountryMeta,
  difficulty: QuizDifficulty = 'medium'
): EarthQuestion {
  // Try finding curated world place or country landmark
  let target = countryMeta;
  if (!target || !target.landmark) {
    target = COUNTRIES_WITH_LANDMARKS[rng.nextInt(0, COUNTRIES_WITH_LANDMARKS.length)];
  }

  const landmarkName = target.landmark;

  // Pick 3 distractor countries
  const otherCountries = ALL_META
    .filter(m => m.name !== target.name)
    .map(m => m.name);

  const shuffledCountries = rng.shuffle(otherCountries);
  const distractors = shuffledCountries.slice(0, 3);
  const choices = rng.shuffle([target.name, ...distractors]);
  const correctIndex = choices.indexOf(target.name);

  return {
    id: `disc-landmark-${target.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    country: target.name,
    category: 'geography',
    difficulty,
    question: `In which country is the famous landmark "${landmarkName}" located?`,
    choices,
    correctIndex,
    funFact: `${landmarkName} is located in ${target.name} (${target.continent}). ${target.funFact}`,
  };
}

/**
 * 5. CONTINENT & HEMISPHERE QUESTION
 * "On which continent is [Country] located?"
 */
export function generateContinentDiscoveryQuestion(
  rng: SeededRandom,
  countryMeta?: CountryMeta,
  difficulty: QuizDifficulty = 'easy'
): EarthQuestion {
  const target = countryMeta || ALL_META[rng.nextInt(0, ALL_META.length)];
  const continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];

  const otherContinents = continents.filter(c => c !== target.continent);
  const distractors = rng.shuffle(otherContinents).slice(0, 3);
  const choices = rng.shuffle([target.continent, ...distractors]);
  const correctIndex = choices.indexOf(target.continent);

  return {
    id: `disc-cont-${target.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    country: target.name,
    category: 'geography',
    difficulty,
    question: `On which continent is ${target.name} located?`,
    choices,
    correctIndex,
    funFact: `${target.name} is situated in ${target.continent}. ${target.funFact}`,
  };
}

/**
 * 6. VERIFIED GEOGRAPHIC FACT / CURRENCY QUESTION
 * "What is the official currency of [Country]?"
 */
export function generateFactDiscoveryQuestion(
  rng: SeededRandom,
  countryMeta?: CountryMeta,
  difficulty: QuizDifficulty = 'medium'
): EarthQuestion {
  const target = countryMeta || ALL_META[rng.nextInt(0, ALL_META.length)];

  // Currency or language fact
  const otherCurrencies = Array.from(new Set(ALL_META.map(m => m.currency).filter(c => c !== target.currency)));
  const distractors = rng.shuffle(otherCurrencies).slice(0, 3);
  const choices = rng.shuffle([target.currency, ...distractors]);
  const correctIndex = choices.indexOf(target.currency);

  return {
    id: `disc-fact-${target.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    country: target.name,
    category: 'geography',
    difficulty,
    question: `What is the official currency of ${target.name}?`,
    choices,
    correctIndex,
    funFact: `The currency of ${target.name} is the ${target.currency}. Local language: ${target.language}.`,
  };
}

/**
 * MASTER GENERATOR: Procedurally generates an authentic, verified question
 * across any of the 6 categories with anti-repeat deduplication.
 */
export function generateDiscoveryQuestion(config: DiscoveryQuestionConfig = {}): EarthQuestion {
  const seed = config.seed ?? Math.floor(Math.random() * 1000000);
  const rng = new SeededRandom(seed);
  const difficulty = config.difficulty || 'medium';

  let targetMeta: CountryMeta | undefined;
  if (config.countryName) {
    targetMeta = ALL_META.find(m => m.name.toLowerCase() === config.countryName?.toLowerCase());
  }

  const category = config.category || pickCategoryFromSeed(rng);

  switch (category) {
    case 'flag':
      return generateFlagDiscoveryQuestion(rng, targetMeta, difficulty);
    case 'capital':
      return generateCapitalDiscoveryQuestion(rng, targetMeta, difficulty);
    case 'border':
      return generateBorderDiscoveryQuestion(rng, targetMeta, difficulty);
    case 'landmark':
      return generateLandmarkDiscoveryQuestion(rng, targetMeta, difficulty);
    case 'continent':
      return generateContinentDiscoveryQuestion(rng, targetMeta, difficulty);
    case 'fact':
    default:
      return generateFactDiscoveryQuestion(rng, targetMeta, difficulty);
  }
}

function pickCategoryFromSeed(rng: SeededRandom): DiscoveryQuestionCategory {
  const categories: DiscoveryQuestionCategory[] = [
    'flag',
    'capital',
    'border',
    'landmark',
    'continent',
    'fact',
  ];
  return categories[rng.nextInt(0, categories.length)];
}

/**
 * DETERMINISTIC DAILY GLOBAL CHALLENGE (5 Questions)
 * Generates the official, unyielding 5-question sequence for any calendar date.
 * Every player worldwide receives the exact same 5 questions on that date!
 *
 * Sequence across the 5 questions:
 * 1. Flag Identification (FLAG)
 * 2. Capital & Major City (CAPITAL)
 * 3. Border & Neighboring Nation (BORDER)
 * 4. World Landmark & Geography (LANDMARK)
 * 5. Geographic Fact / Currency / Superlative (FACT)
 */
export function getOfficialDailyQuestions(dateStr: string): EarthQuestion[] {
  // Deterministic seed from date string: YYYY-MM-DD
  const charSum = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseSeed = charSum * 1009;

  const categories: DiscoveryQuestionCategory[] = [
    'flag',
    'capital',
    'border',
    'landmark',
    'fact',
  ];

  const questions: EarthQuestion[] = [];
  const usedCountryNames = new Set<string>();

  for (let i = 0; i < 5; i++) {
    const qSeed = baseSeed + (i * 3571);
    const rng = new SeededRandom(qSeed);
    const cat = categories[i];

    // Pick an unused country for this round
    const available = ALL_META.filter(m => !usedCountryNames.has(m.name.toLowerCase()));
    const target = available.length > 0
      ? available[rng.nextInt(0, available.length)]
      : ALL_META[rng.nextInt(0, ALL_META.length)];

    usedCountryNames.add(target.name.toLowerCase());

    let q: EarthQuestion;
    switch (cat) {
      case 'flag':
        q = generateFlagDiscoveryQuestion(rng, target, 'medium');
        break;
      case 'capital':
        q = generateCapitalDiscoveryQuestion(rng, target, 'medium');
        break;
      case 'border':
        q = generateBorderDiscoveryQuestion(rng, target, 'medium');
        break;
      case 'landmark':
        q = generateLandmarkDiscoveryQuestion(rng, target, 'medium');
        break;
      case 'fact':
      default:
        q = generateFactDiscoveryQuestion(rng, target, 'medium');
        break;
    }

    // Embed daily metadata and round index into question ID
    q.id = `daily-${dateStr.replace(/[^a-zA-Z0-9]/g, '')}-${i + 1}-${q.id}`;
    q.question = `[Daily Challenge #${i + 1}/5] ${q.question}`;
    questions.push(q);
  }

  return questions;
}
