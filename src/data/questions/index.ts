// ============================================================
// Play Earth — Question Engine
// ============================================================
// Unified query interface combining curated + procedurally-generated questions.
// Anti-repeat logic ensures previously answered questions are skipped.

import { EarthQuestion, QuizCategory } from '@/types';
import { CURATED_QUESTIONS } from './curated';
import { GENERATED_QUESTIONS } from './generatedPool';
import { generateQuestions } from './generator';
import { COUNTRY_METADATA, findCountryMeta } from './countryMetadata';

/** Shuffle helper (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

export function isQuestionExpired(q: EarthQuestion): boolean {
  if (q.expirationDate) {
    const exp = new Date(q.expirationDate).getTime();
    if (!isNaN(exp) && Date.now() > exp) return true;
  }
  if (q.category === 'current-affairs' && q.timestamp) {
    const ageMs = Date.now() - q.timestamp;
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    if (ageMs > ninetyDaysMs) return true;
  }
  return false;
}

/** Complete mapping of country aliases to their canonical forms */
export const COUNTRY_MAPPINGS: Record<string, string> = {
  'usa': 'United States',
  'united states of america': 'United States',
  'united states': 'United States',
  'us': 'United States',
  'uk': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  'great britain': 'United Kingdom',
  'england': 'United Kingdom',
  'uae': 'United Arab Emirates',
  'united arab emirates': 'United Arab Emirates',
  'russia': 'Russia',
  'russian federation': 'Russia',
  'south korea': 'South Korea',
  'republic of korea': 'South Korea',
  'korea': 'South Korea',
  'north korea': 'North Korea',
  'dprk': 'North Korea',
  'viet nam': 'Vietnam',
  'vietnam': 'Vietnam',
  'cambodia': 'Cambodia',
  'iran': 'Iran',
  'islamic republic of iran': 'Iran',
  'syria': 'Syria',
  'syrian arab republic': 'Syria',
  'laos': 'Laos',
  'lao pdr': 'Laos',
  'brunei': 'Brunei',
  'brunei darussalam': 'Brunei',
  'taiwan': 'Taiwan',
  'republic of china': 'Taiwan',
  'venezuela': 'Venezuela',
  'bolivarian republic of venezuela': 'Venezuela',
  'bolivia': 'Bolivia',
  'plurinational state of bolivia': 'Bolivia',
  'tanzania': 'Tanzania',
  'united republic of tanzania': 'Tanzania',
  'congo': 'Congo',
  'republic of the congo': 'Congo',
  'dr congo': 'Democratic Republic of the Congo',
  'democratic republic of the congo': 'Democratic Republic of the Congo',
  'drc': 'Democratic Republic of the Congo',
  'cote d\'ivoire': 'Ivory Coast',
  'cote divoire': 'Ivory Coast',
  'ivory coast': 'Ivory Coast',
  'eswatini': 'Eswatini',
  'swaziland': 'Eswatini',
  'palestine': 'Palestine',
  'west bank': 'Palestine',
  'gaza': 'Palestine',
  'czechia': 'Czech Republic',
  'czech republic': 'Czech Republic',
  'bahamas': 'Bahamas',
  'the bahamas': 'Bahamas',
  // New expanded aliases
  'pakistan': 'Pakistan',
  'bangladesh': 'Bangladesh',
  'philippines': 'Philippines',
  'malaysia': 'Malaysia',
  'israel': 'Israel',
  'singapore': 'Singapore',
  'iraq': 'Iraq',
  'afghanistan': 'Afghanistan',
  'nepal': 'Nepal',
  'sri lanka': 'Sri Lanka',
  'ceylon': 'Sri Lanka',
  'myanmar': 'Myanmar',
  'burma': 'Myanmar',
  'kazakhstan': 'Kazakhstan',
  'uzbekistan': 'Uzbekistan',
  'yemen': 'Yemen',
  'jordan': 'Jordan',
  'lebanon': 'Lebanon',
  'oman': 'Oman',
  'kuwait': 'Kuwait',
  'qatar': 'Qatar',
  'bahrain': 'Bahrain',
  'mongolia': 'Mongolia',
  'maldives': 'Maldives',
  'bhutan': 'Bhutan',
  'tajikistan': 'Tajikistan',
  'kyrgyzstan': 'Kyrgyzstan',
  'turkmenistan': 'Turkmenistan',
  'georgia': 'Georgia',
  'armenia': 'Armenia',
  'azerbaijan': 'Azerbaijan',
  'ireland': 'Ireland',
  'austria': 'Austria',
  'hungary': 'Hungary',
  'romania': 'Romania',
  'bulgaria': 'Bulgaria',
  'denmark': 'Denmark',
  'finland': 'Finland',
  'serbia': 'Serbia',
  'ukraine': 'Ukraine',
  'belarus': 'Belarus',
  'lithuania': 'Lithuania',
  'latvia': 'Latvia',
  'estonia': 'Estonia',
  'slovenia': 'Slovenia',
  'slovakia': 'Slovakia',
  'albania': 'Albania',
  'north macedonia': 'North Macedonia',
  'macedonia': 'North Macedonia',
  'montenegro': 'Montenegro',
  'bosnia and herzegovina': 'Bosnia and Herzegovina',
  'bosnia': 'Bosnia and Herzegovina',
  'moldova': 'Moldova',
  'iceland': 'Iceland',
  'luxembourg': 'Luxembourg',
  'malta': 'Malta',
  'cyprus': 'Cyprus',
  'ethiopia': 'Ethiopia',
  'ghana': 'Ghana',
  'uganda': 'Uganda',
  'algeria': 'Algeria',
  'tunisia': 'Tunisia',
  'cameroon': 'Cameroon',
  'madagascar': 'Madagascar',
  'mozambique': 'Mozambique',
  'zimbabwe': 'Zimbabwe',
  'zambia': 'Zambia',
  'rwanda': 'Rwanda',
  'namibia': 'Namibia',
  'botswana': 'Botswana',
  'somalia': 'Somalia',
  'sudan': 'Sudan',
  'ecuador': 'Ecuador',
  'paraguay': 'Paraguay',
  'guyana': 'Guyana',
  'cuba': 'Cuba',
  'jamaica': 'Jamaica',
  'haiti': 'Haiti',
  'dominican republic': 'Dominican Republic',
  'honduras': 'Honduras',
  'guatemala': 'Guatemala',
  'costa rica': 'Costa Rica',
  'panama': 'Panama',
  'el salvador': 'El Salvador',
  'nicaragua': 'Nicaragua',
  'trinidad and tobago': 'Trinidad and Tobago',
  'papua new guinea': 'Papua New Guinea',
  'fiji': 'Fiji',
  'persia': 'Iran',
  'siam': 'Thailand',
  'holland': 'Netherlands',
  'bosnia and herz.': 'Bosnia and Herzegovina',
  'dem. rep. congo': 'Democratic Republic of the Congo',
  'central african rep.': 'Central African Republic',
  'dominican rep.': 'Dominican Republic',
  'solomon is.': 'Solomon Islands',
  's. sudan': 'South Sudan',
  'eq. guinea': 'Equatorial Guinea',
};

export function getCanonicalCountryName(country: string): string {
  const normalized = country.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  
  if (COUNTRY_MAPPINGS[normalized]) return COUNTRY_MAPPINGS[normalized];

  const metaMatch = Object.keys(COUNTRY_METADATA).find(
    k => k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === normalized
  );
  if (metaMatch) return metaMatch;

  // Capitalize first letter of each word as fallback
  return country.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/** Fuzzy match country names */
export function matchCountry(q: string, target: string): boolean {
  const c1 = getCanonicalCountryName(q);
  const c2 = getCanonicalCountryName(target);
  if (c1.toLowerCase() === c2.toLowerCase()) return true;

  const n1 = q.toLowerCase().replace(/[^a-z]/g, '');
  const n2 = target.toLowerCase().replace(/[^a-z]/g, '');
  if (n1 === n2) return true;
  
  // Specific alias checks (prevent general partial includes)
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
export const DEDUPLICATED_STATIC_QUESTIONS: EarthQuestion[] = [];
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
    if (isQuestionExpired(q)) return false;
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
  const proceduralMatches: EarthQuestion[] = [];
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
  let oldestIdx = answeredIds.lastIndexOf(oldestQ.id);

  for (let i = 1; i < questions.length; i++) {
    const q = questions[i];
    const idx = answeredIds.lastIndexOf(q.id);
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
  const canonicalCountry = getCanonicalCountryName(country);

  // Filter local static questions strictly matching this country
  const matches = DEDUPLICATED_STATIC_QUESTIONS.filter(q => {
    if (isQuestionExpired(q)) return false;
    if (!matchCountry(q.country, canonicalCountry)) return false;
    return category === 'trivia' || q.category === category;
  });

  // Also include procedurally generated questions if it's a metadata country
  const catsToGen: QuizCategory[] = category === 'trivia'
    ? ['geography', 'trivia', 'sports', 'history']
    : [category];

  const proceduralMatches: EarthQuestion[] = [];
  for (const cat of catsToGen) {
    const gen = generateQuestions(canonicalCountry, cat, 5);
    proceduralMatches.push(...gen);
  }

  // Combine static and procedural
  const combined = [...matches, ...proceduralMatches];

  // Deduplicate by question text
  const seenText = new Set<string>();
  const uniqueMatches: EarthQuestion[] = [];
  for (const q of combined) {
    const textKey = q.question.toLowerCase().trim();
    if (!seenText.has(textKey)) {
      seenText.add(textKey);
      uniqueMatches.push(q);
    }
  }

  const unseen = uniqueMatches.filter(q => !excludeSet.has(q.id));

  // If there are unseen questions, return them shuffled
  if (unseen.length >= count) {
    return shuffle(unseen).slice(0, count);
  }

  // If we run out of unseen, pad with already-answered (oldest first) to avoid empty states in sync mode
  const answered = uniqueMatches.filter(q => excludeSet.has(q.id));
  const sortedAnswered = [...answered].sort((a, b) => {
    return answeredIds.lastIndexOf(a.id) - answeredIds.lastIndexOf(b.id);
  });

  const finalCombined = [...shuffle(unseen), ...sortedAnswered];
  return finalCombined.slice(0, count);
}

/**
 * Get a single random question strictly for a country.
 */
export function getNextQuestion(
  country: string,
  category: QuizCategory,
  answeredIds: string[] = []
): EarthQuestion | null {
  const questions = getQuestionsForCountry(country, category, answeredIds, 1);
  return questions.length > 0 ? questions[0] : null;
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

// Custom Generators for Play Earth V2 Modes
import WORLDCUP_QUESTIONS from './worldcup.json';

/** Generates a flag quiz question dynamically from COUNTRY_METADATA */
export function generateFlagQuestion(
  difficulty: 'easy' | 'medium' | 'hard',
  answeredIds: string[] = [],
  countryName?: string
): EarthQuestion {
  const metadataArray = Object.values(COUNTRY_METADATA).filter(m => m.flag && m.name);
  let target = countryName ? metadataArray.find(m => m.name.toLowerCase() === countryName.toLowerCase()) : null;
  if (!target) {
    const excludeSet = new Set(answeredIds);
    const unseen = metadataArray.filter(m => !excludeSet.has(`flag-${m.name.toLowerCase()}`));
    target = unseen.length > 0 ? shuffle(unseen)[0] : shuffle(metadataArray)[0];
  }

  let distractors: string[] = [];
  if (difficulty === 'hard') {
    const sameContinent = metadataArray.filter(m => m.continent === target.continent && m.name !== target.name);
    distractors = shuffle(sameContinent).map(m => m.name).slice(0, 3);
  } else if (difficulty === 'medium') {
    const potential = metadataArray.filter(m => m.name !== target.name);
    distractors = shuffle(potential).map(m => m.name).slice(0, 3);
  } else {
    const diffContinent = metadataArray.filter(m => m.continent !== target.continent);
    distractors = shuffle(diffContinent).map(m => m.name).slice(0, 3);
  }

  while (distractors.length < 3) {
    const fallback = metadataArray.find(m => m.name !== target.name && !distractors.includes(m.name));
    if (fallback) distractors.push(fallback.name);
    else break;
  }

  const choices = shuffle([target.name, ...distractors]);
  const correctIndex = choices.indexOf(target.name);

  return {
    id: `flag-${target.name.toLowerCase()}`,
    country: target.name,
    category: 'geography',
    difficulty,
    question: `Which country does this flag belong to?\n\n${target.flag}`,
    choices,
    correctIndex,
    funFact: `${target.flag} belongs to ${target.name}. ${target.funFact}`
  };
}

/** Generates a capital city quiz question dynamically from COUNTRY_METADATA */
export function generateCapitalQuestion(
  difficulty: 'easy' | 'medium' | 'hard',
  answeredIds: string[] = [],
  countryName?: string
): EarthQuestion {
  const metadataArray = Object.values(COUNTRY_METADATA).filter(m => m.capital && m.name);
  let target = countryName ? metadataArray.find(m => m.name.toLowerCase() === countryName.toLowerCase()) : null;
  if (!target) {
    const excludeSet = new Set(answeredIds);
    const unseen = metadataArray.filter(m => !excludeSet.has(`capital-${m.name.toLowerCase()}`));
    target = unseen.length > 0 ? shuffle(unseen)[0] : shuffle(metadataArray)[0];
  }

  const otherCapitals = metadataArray.filter(m => m.name !== target.name).map(m => m.capital);
  const distractors = shuffle(otherCapitals).slice(0, 3);

  const choices = shuffle([target.capital, ...distractors]);
  const correctIndex = choices.indexOf(target.capital);

  return {
    id: `capital-${target.name.toLowerCase()}`,
    country: target.name,
    category: 'geography',
    difficulty,
    question: `What is the capital city of ${target.name}?`,
    choices,
    correctIndex,
    funFact: `${target.capital} is the capital of ${target.name}. ${target.funFact}`
  };
}

/** Generates a deterministic daily earth question based on calendar date and index */
export function getDailyEarthQuestion(dateStr: string, index: number): EarthQuestion {
  // Simple seed based on date string
  const charSum = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = charSum + index * 101;
  const rng = new SeededRandom(seed);

  const metadataArray = Object.values(COUNTRY_METADATA).filter(m => m.capital && m.name);
  const target = metadataArray[seed % metadataArray.length];

  const otherCapitals = metadataArray.filter(m => m.name !== target.name).map(m => m.capital);
  
  // Deterministically select 3 distractors
  const distractors: string[] = [];
  const availableCapitals = [...otherCapitals];
  for (let i = 0; i < 3; i++) {
    const randIdx = rng.nextInt(0, availableCapitals.length);
    distractors.push(availableCapitals[randIdx]);
    availableCapitals.splice(randIdx, 1);
  }

  // Deterministically shuffle the choices
  const choices = rng.shuffle([target.capital, ...distractors]);

  return {
    id: `daily-${dateStr.replace(/[^a-zA-Z0-9]/g, '')}-${index}`,
    country: target.name,
    category: 'mixed',
    difficulty: 'medium',
    question: `[Daily Challenge #${index + 1}] What is the capital city of ${target.name}?`,
    choices,
    correctIndex: choices.indexOf(target.capital),
    funFact: `${target.name} has a population of approximately ${target.population}. ${target.funFact}`
  };
}

/** Retrieves World Cup questions from curated worldcup.json database with fallbacks */
export function getWorldCupQuestion(answeredIds: string[] = []): EarthQuestion {
  const excludeSet = new Set(answeredIds);
  const unseen = (WORLDCUP_QUESTIONS as EarthQuestion[]).filter(q => !excludeSet.has(q.id));
  
  if (unseen.length > 0) {
    return shuffle(unseen)[0];
  }

  // Fallback to random World Cup questions by recycling
  const recycled = (WORLDCUP_QUESTIONS as EarthQuestion[]).sort((a, b) => {
    return answeredIds.lastIndexOf(a.id) - answeredIds.lastIndexOf(b.id);
  });
  return recycled[0];
}

/** All quiz categories with labels, emojis, and styling */
export const QUIZ_CATEGORIES: { id: QuizCategory; label: string; emoji: string; color: string }[] = [
  { id: 'geography', label: 'Geography', emoji: '🌍', color: '#00e5ff' },
  { id: 'sports', label: 'Sports', emoji: '⚽', color: '#4ade80' },
  { id: 'history', label: 'History', emoji: '📜', color: '#f59e0b' },
  { id: 'science', label: 'Science', emoji: '🔬', color: '#3b82f6' },
  { id: 'current-affairs', label: 'Current Affairs', emoji: '📰', color: '#a78bfa' },
  { id: 'mixed', label: 'Mixed Challenge', emoji: '🌍', color: '#ec4899' },
  { id: 'worldcup', label: 'FIFA World Cup', emoji: '🏆', color: '#fbbf24' },
];
