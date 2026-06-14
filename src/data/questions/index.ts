// ============================================================
// Play Earth — Question Engine
// ============================================================
// Unified query interface combining curated + procedurally-generated questions.
// Anti-repeat logic ensures previously answered questions are skipped.

import { EarthQuestion, QuizCategory } from '@/types';
import { CURATED_QUESTIONS } from './curated';
import { GENERATED_QUESTIONS } from './generatedPool';
import { generateQuestions } from './generator';
import { findCountryMeta } from './countryMetadata';

/** Shuffle helper (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fuzzy match country names */
function matchCountry(q: string, target: string): boolean {
  const n1 = q.toLowerCase().replace(/[^a-z]/g, '');
  const n2 = target.toLowerCase().replace(/[^a-z]/g, '');
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  // Alias check
  if ((n1 === 'usa' || n1 === 'us' || n1 === 'unitedstatesofamerica') &&
      (n2 === 'unitedstates' || n2 === 'unitedstatesofamerica' || n2 === 'usa')) return true;
  if ((n1 === 'uk' || n1 === 'england' || n1 === 'greatbritain') &&
      (n2 === 'unitedkingdom' || n2 === 'england' || n2 === 'greatbritain')) return true;
  return false;
}

/** Complete mapping of world countries to their respective continents */
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Asia
  'india': 'Asia', 'china': 'Asia', 'japan': 'Asia', 'south korea': 'Asia', 'russia': 'Asia',
  'indonesia': 'Asia', 'saudi arabia': 'Asia', 'turkey': 'Asia', 'iran': 'Asia', 'pakistan': 'Asia',
  'bangladesh': 'Asia', 'vietnam': 'Asia', 'thailand': 'Asia', 'philippines': 'Asia', 'malaysia': 'Asia',
  'israel': 'Asia', 'singapore': 'Asia', 'united arab emirates': 'Asia', 'uae': 'Asia', 'iraq': 'Asia',
  'afghanistan': 'Asia', 'nepal': 'Asia', 'bhutan': 'Asia', 'myanmar': 'Asia', 'sri lanka': 'Asia',
  'kazakhstan': 'Asia', 'uzbekistan': 'Asia', 'yemen': 'Asia', 'syria': 'Asia', 'jordan': 'Asia',
  'azerbaijan': 'Asia', 'oman': 'Asia', 'lebanon': 'Asia', 'kuwait': 'Asia', 'qatar': 'Asia',
  'mongolia': 'Asia', 'armenia': 'Asia', 'bahrain': 'Asia', 'timor-leste': 'Asia', 'taiwan': 'Asia',
  'north korea': 'Asia', 'cambodia': 'Asia', 'laos': 'Asia', 'tajikistan': 'Asia', 'kyrgyzstan': 'Asia',
  'georgia': 'Asia', 'maldives': 'Asia', 'brunei': 'Asia',

  // Europe
  'united kingdom': 'Europe', 'uk': 'Europe', 'great britain': 'Europe', 'england': 'Europe',
  'france': 'Europe', 'germany': 'Europe', 'italy': 'Europe', 'spain': 'Europe', 'ukraine': 'Europe',
  'poland': 'Europe', 'romania': 'Europe', 'netherlands': 'Europe', 'belgium': 'Europe', 'greece': 'Europe',
  'czech republic': 'Europe', 'sweden': 'Europe', 'portugal': 'Europe', 'hungary': 'Europe', 'austria': 'Europe',
  'switzerland': 'Europe', 'bulgaria': 'Europe', 'denmark': 'Europe', 'finland': 'Europe', 'slovakia': 'Europe',
  'norway': 'Europe', 'ireland': 'Europe', 'croatia': 'Europe', 'moldova': 'Europe', 'bosnia and herzegovina': 'Europe',
  'albania': 'Europe', 'lithuania': 'Europe', 'north macedonia': 'Europe', 'slovenia': 'Europe', 'latvia': 'Europe',
  'estonia': 'Europe', 'montenegro': 'Europe', 'luxembourg': 'Europe', 'malta': 'Europe', 'iceland': 'Europe',
  'monaco': 'Europe', 'andorra': 'Europe', 'liechtenstein': 'Europe', 'san marino': 'Europe', 'vatican city': 'Europe',
  'serbia': 'Europe', 'belarus': 'Europe', 'cyprus': 'Europe',

  // Africa
  'nigeria': 'Africa', 'ethiopia': 'Africa', 'egypt': 'Africa', 'democratic republic of the congo': 'Africa',
  'dr congo': 'Africa', 'drc': 'Africa', 'tanzania': 'Africa', 'south africa': 'Africa', 'kenya': 'Africa',
  'uganda': 'Africa', 'algeria': 'Africa', 'sudan': 'Africa', 'morocco': 'Africa', 'angola': 'Africa',
  'mozambique': 'Africa', 'ghana': 'Africa', 'madagascar': 'Africa', 'cameroon': 'Africa', 'cote d\'ivoire': 'Africa',
  'ivory coast': 'Africa', 'niger': 'Africa', 'mali': 'Africa', 'malawi': 'Africa', 'zambia': 'Africa',
  'senegal': 'Africa', 'zimbabwe': 'Africa', 'chad': 'Africa', 'tunisia': 'Africa', 'guinea': 'Africa',
  'rwanda': 'Africa', 'benin': 'Africa', 'burundi': 'Africa', 'south sudan': 'Africa', 'eritrea': 'Africa',
  'sierra leone': 'Africa', 'togo': 'Africa', 'libya': 'Africa', 'central african republic': 'Africa',
  'mauritania': 'Africa', 'congo': 'Africa', 'liberia': 'Africa', 'namibia': 'Africa', 'botswana': 'Africa',
  'lesotho': 'Africa', 'gambia': 'Africa', 'gabon': 'Africa', 'mauritius': 'Africa', 'eswatini': 'Africa',
  'swaziland': 'Africa', 'djibouti': 'Africa', 'comoros': 'Africa', 'equatorial guinea': 'Africa',
  'cape verde': 'Africa', 'sao tome and principe': 'Africa', 'seychelles': 'Africa', 'somalia': 'Africa',

  // North America
  'united states': 'North America', 'united states of america': 'North America', 'usa': 'North America', 'us': 'North America',
  'canada': 'North America', 'mexico': 'North America', 'guatemala': 'North America', 'cuba': 'North America',
  'haiti': 'North America', 'dominican republic': 'North America', 'honduras': 'North America', 'el salvador': 'North America',
  'nicaragua': 'North America', 'costa rica': 'North America', 'panama': 'North America', 'jamaica': 'North America',
  'trinidad and tobago': 'North America', 'bahamas': 'North America', 'belize': 'North America', 'barbados': 'North America',
  'saint lucia': 'North America', 'grenada': 'North America', 'antigua and barbuda': 'North America',
  'saint vincent and the grenadines': 'North America', 'saint kitts and nevis': 'North America', 'dominica': 'North America',

  // South America
  'brazil': 'South America', 'colombia': 'South America', 'argentina': 'South America', 'peru': 'South America',
  'venezuela': 'South America', 'chile': 'South America', 'ecuador': 'South America', 'bolivia': 'South America',
  'paraguay': 'South America', 'uruguay': 'South America', 'guyana': 'South America', 'suriname': 'South America',

  // Oceania
  'australia': 'Oceania', 'new zealand': 'Oceania', 'papua new guinea': 'Oceania', 'fiji': 'Oceania',
  'solomon islands': 'Oceania', 'vanuatu': 'Oceania', 'samoa': 'Oceania', 'tonga': 'Oceania',
  'kiribati': 'Oceania', 'micronesia': 'Oceania', 'marshall islands': 'Oceania', 'palau': 'Oceania',
  'tuvalu': 'Oceania', 'nauru': 'Oceania'
};

/** Resolve the continent for a country name */
export function getContinentForCountry(country: string): string | null {
  const meta = findCountryMeta(country);
  if (meta && meta.continent) return meta.continent;

  const normalized = country.toLowerCase().trim();
  if (COUNTRY_TO_CONTINENT[normalized]) return COUNTRY_TO_CONTINENT[normalized];

  // Try partial matching in keys
  for (const key of Object.keys(COUNTRY_TO_CONTINENT)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return COUNTRY_TO_CONTINENT[key];
    }
  }

  return null;
}

// Deduplicate questions from curated and generated databases
const seenIds = new Set<string>();
const DEDUPLICATED_STATIC_QUESTIONS: EarthQuestion[] = [];
for (const q of [...CURATED_QUESTIONS, ...GENERATED_QUESTIONS]) {
  if (!seenIds.has(q.id)) {
    seenIds.add(q.id);
    DEDUPLICATED_STATIC_QUESTIONS.push(q);
  }
}

/** Gather matching questions from static pools and procedural generation */
function getQuestionsForTarget(
  target: string,
  category: QuizCategory | 'any',
  matchType: 'country' | 'continent' | 'global'
): EarthQuestion[] {
  // 1. Filter static matches
  const staticMatches = DEDUPLICATED_STATIC_QUESTIONS.filter(q => {
    if (category !== 'any' && q.category !== category) return false;

    if (matchType === 'country') {
      return matchCountry(q.country, target);
    } else if (matchType === 'continent') {
      return q.country.toLowerCase() === target.toLowerCase();
    } else {
      return q.country.toLowerCase() === 'global';
    }
  });

  // 2. Procedural generation (only for country matches)
  let proceduralMatches: EarthQuestion[] = [];
  if (matchType === 'country') {
    const catsToGen: QuizCategory[] = category === 'any'
      ? ['geography', 'trivia', 'sports', 'history']
      : [category];

    for (const cat of catsToGen) {
      const gen = generateQuestions(target, cat, 5);
      proceduralMatches.push(...gen);
    }
  }

  const combined = [...staticMatches, ...proceduralMatches];

  // Deduplicate by question text
  const seenText = new Set<string>();
  const unique: EarthQuestion[] = [];
  for (const q of combined) {
    const textKey = q.question.toLowerCase().trim();
    if (!seenText.has(textKey)) {
      seenText.add(textKey);
      unique.push(q);
    }
  }

  return shuffle(unique);
}

/** Find the oldest answered question from a pool to allow controlled repeat fallback */
function getBestRepeatQuestion(questions: EarthQuestion[], answeredIds: string[]): EarthQuestion | null {
  if (questions.length === 0) return null;

  // Find any that are not answered yet (unseen fallback)
  const unseen = questions.find(q => !answeredIds.includes(q.id));
  if (unseen) return unseen;

  // Find the one answered longest ago (lowest index in answeredIds)
  let oldestQ = questions[0];
  let oldestIdx = answeredIds.indexOf(oldestQ.id);

  for (let i = 1; i < questions.length; i++) {
    const q = questions[i];
    const idx = answeredIds.indexOf(q.id);
    if (idx < oldestIdx) {
      oldestIdx = idx;
      oldestQ = q;
    }
  }

  return oldestQ;
}

/**
 * Get questions for a specific country and category.
 * Integrates fallbacks and repeat controls.
 */
export function getQuestionsForCountry(
  country: string,
  category: QuizCategory,
  answeredIds: string[] = [],
  count: number = 1
): EarthQuestion[] {
  const excludeSet = new Set(answeredIds);
  const continent = getContinentForCountry(country);
  const results: EarthQuestion[] = [];

  const steps: { target: string; category: QuizCategory | 'any'; matchType: 'country' | 'continent' | 'global' }[] = [
    { target: country, category, matchType: 'country' },
    { target: country, category: 'any', matchType: 'country' },
  ];

  if (continent) {
    steps.push({ target: continent, category, matchType: 'continent' });
    steps.push({ target: continent, category: 'any', matchType: 'continent' });
  }

  steps.push({ target: 'Global', category, matchType: 'global' });
  steps.push({ target: 'Global', category: 'any', matchType: 'global' });

  // 1. Gather unseen questions
  for (const step of steps) {
    if (results.length >= count) break;
    const pool = getQuestionsForTarget(step.target, step.category, step.matchType);
    const unseen = pool.filter(q => !excludeSet.has(q.id) && !results.some(r => r.id === q.id));
    results.push(...unseen);
  }

  // 2. Allow repeats if count not met
  if (results.length < count) {
    for (const step of steps) {
      if (results.length >= count) break;
      const pool = getQuestionsForTarget(step.target, step.category, step.matchType);
      const remaining = pool.filter(q => !results.some(r => r.id === q.id));
      const sorted = [...remaining].sort((a, b) => {
        const idxA = answeredIds.indexOf(a.id);
        const idxB = answeredIds.indexOf(b.id);
        return idxA - idxB;
      });
      results.push(...sorted);
    }
  }

  return results.slice(0, count);
}

/**
 * Get a single random question for a country with dynamic fallback and repeat system.
 */
export function getNextQuestion(
  country: string,
  category: QuizCategory,
  answeredIds: string[] = []
): EarthQuestion | null {
  const excludeSet = new Set(answeredIds);
  const continent = getContinentForCountry(country);

  const steps: { target: string; category: QuizCategory | 'any'; matchType: 'country' | 'continent' | 'global' }[] = [
    { target: country, category, matchType: 'country' },
    { target: country, category: 'any', matchType: 'country' },
  ];

  if (continent) {
    steps.push({ target: continent, category, matchType: 'continent' });
    steps.push({ target: continent, category: 'any', matchType: 'continent' });
  }

  steps.push({ target: 'Global', category, matchType: 'global' });
  steps.push({ target: 'Global', category: 'any', matchType: 'global' });

  // Phase 1: Try to find an unseen question in the hierarchy
  for (const step of steps) {
    const pool = getQuestionsForTarget(step.target, step.category, step.matchType);
    const unseen = pool.filter(q => !excludeSet.has(q.id));
    if (unseen.length > 0) {
      return unseen[0];
    }
  }

  // Phase 2: If everything is answered, allow controlled repeats
  for (const step of steps) {
    const pool = getQuestionsForTarget(step.target, step.category, step.matchType);
    if (pool.length > 0) {
      const bestRepeat = getBestRepeatQuestion(pool, answeredIds);
      if (bestRepeat) return bestRepeat;
    }
  }

  // Ultimate fallback
  if (DEDUPLICATED_STATIC_QUESTIONS.length > 0) {
    return DEDUPLICATED_STATIC_QUESTIONS[Math.floor(Math.random() * DEDUPLICATED_STATIC_QUESTIONS.length)];
  }

  return null;
}

/**
 * Check if a country has available questions.
 * Since we have global and continent-level fallbacks, every country is playable!
 */
export function hasQuestionsForCountry(country: string): boolean {
  return true;
}

/** XP awarded per difficulty */
export const XP_REWARDS: Record<string, number> = {
  easy: 100,
  medium: 250,
  hard: 500,
};

/** Calculate player level from XP */
export function calculateLevel(xp: number): number {
  if (xp < 500) return 1;
  if (xp < 1500) return 2;
  if (xp < 3000) return 3;
  if (xp < 5000) return 4;
  if (xp < 8000) return 5;
  if (xp < 12000) return 6;
  if (xp < 17000) return 7;
  if (xp < 23000) return 8;
  if (xp < 30000) return 9;
  return 10 + Math.floor((xp - 30000) / 10000);
}

/** All quiz categories with labels, emojis, and styling */
export const QUIZ_CATEGORIES: { id: QuizCategory; label: string; emoji: string; color: string }[] = [
  { id: 'geography', label: 'Geography', emoji: '🌍', color: '#00e5ff' },
  { id: 'sports', label: 'Sports', emoji: '⚽', color: '#4ade80' },
  { id: 'history', label: 'History', emoji: '📜', color: '#f59e0b' },
  { id: 'science', label: 'Science', emoji: '🔬', color: '#3b82f6' },
  { id: 'technology', label: 'Technology', emoji: '💻', color: '#a78bfa' },
  { id: 'nature', label: 'Nature', emoji: '🌿', color: '#10b981' },
  { id: 'politics', label: 'Politics', emoji: '⚖️', color: '#ef4444' },
  { id: 'space', label: 'Space', emoji: '🚀', color: '#818cf8' },
  { id: 'culture', label: 'Culture', emoji: '🎨', color: '#ec4899' },
];
