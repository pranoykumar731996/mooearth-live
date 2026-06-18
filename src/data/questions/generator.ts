// ============================================================
// Play Earth — Procedural Question Generator
// ============================================================
// Generates unlimited questions using structured country metadata
// and template patterns. Ensures no two runs produce the same set.

import { EarthQuestion, QuizCategory } from '@/types';
import { COUNTRY_METADATA, findCountryMeta, getMetadataCountries } from './countryMetadata';

type TemplateGenerator = (country: string) => EarthQuestion | null;

/** Shuffle helper (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick N random wrong answers from a pool, excluding the correct one */
function pickWrongAnswers(correct: string, pool: string[], count: number): string[] {
  const filtered = pool.filter(p => p !== correct);
  return shuffle(filtered).slice(0, count);
}

/** Hash helper for question ID generation */
function getQuestionHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return (hash >>> 0).toString(16);
}

/** Generate a unique ID for a generated question */
function genId(country: string, cat: string, idx: number, question: string): string {
  const hash = getQuestionHash(question);
  return `gen-${country.replace(/\s/g, '').toLowerCase()}-${cat}-${idx}-${hash}`;
}

// ------ TEMPLATE POOLS ------

const allCapitals = () => Object.values(COUNTRY_METADATA).map(m => m.capital);
const allCurrencies = () => Object.values(COUNTRY_METADATA).map(m => m.currency);
const allLanguages = () => [...new Set(Object.values(COUNTRY_METADATA).map(m => m.language))];
const allLandmarks = () => Object.values(COUNTRY_METADATA).map(m => m.landmark);
const allContinents = () => [...new Set(Object.values(COUNTRY_METADATA).map(m => m.continent))];
const allFamousPeople = () => Object.values(COUNTRY_METADATA).filter(m => m.famousPerson).map(m => m.famousPerson!);
const allDishes = () => Object.values(COUNTRY_METADATA).filter(m => m.famousDish).map(m => m.famousDish!);
const allSports = () => [...new Set(Object.values(COUNTRY_METADATA).filter(m => m.sport).map(m => m.sport!))];

// ------ GEOGRAPHY TEMPLATES ------

const geoTemplates: TemplateGenerator[] = [
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta) return null;
    const wrongs = pickWrongAnswers(meta.capital, allCapitals(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.capital, ...wrongs]);
    const question = `What is the capital of ${meta.name}?`;
    return {
      id: genId(country, 'geo', 1, question), country: meta.name, category: 'geography', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.capital),
      funFact: `${meta.capital} is the official capital of ${meta.name}. ${meta.funFact}`,
    };
  },
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta) return null;
    const wrongs = pickWrongAnswers(meta.continent, allContinents(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.continent, ...wrongs]);
    const question = `On which continent is ${meta.name} located?`;
    return {
      id: genId(country, 'geo', 2, question), country: meta.name, category: 'geography', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.continent),
      funFact: `${meta.name} is located in the continent of ${meta.continent}.`,
    };
  },
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta) return null;
    const wrongs = pickWrongAnswers(meta.currency, allCurrencies(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.currency, ...wrongs]);
    const question = `What is the official currency of ${meta.name}?`;
    return {
      id: genId(country, 'geo', 3, question), country: meta.name, category: 'geography', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.currency),
      funFact: `The official currency of ${meta.name} is the ${meta.currency}.`,
    };
  },
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta) return null;
    const wrongs = pickWrongAnswers(meta.language, allLanguages(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.language, ...wrongs]);
    const question = `What is the primary official language of ${meta.name}?`;
    return {
      id: genId(country, 'geo', 4, question), country: meta.name, category: 'geography', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.language),
      funFact: `The primary official language of ${meta.name} is ${meta.language}.`,
    };
  },
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta) return null;
    const wrongs = pickWrongAnswers(meta.landmark, allLandmarks(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.landmark, ...wrongs]);
    const question = `Which famous landmark is located in ${meta.name}?`;
    return {
      id: genId(country, 'geo', 5, question), country: meta.name, category: 'geography', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.landmark),
      funFact: `The famous landmark ${meta.landmark} is located in ${meta.name}. ${meta.funFact}`,
    };
  },
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.neighbours || meta.neighbours.length === 0) return null;
    const correctNeighbour = meta.neighbours[0];
    const allCountries = getMetadataCountries().filter(c => !meta.neighbours!.includes(c) && c !== meta.name);
    const wrongs = shuffle(allCountries).slice(0, 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([correctNeighbour, ...wrongs]);
    const question = `Which of these countries borders ${meta.name}?`;
    return {
      id: genId(country, 'geo', 6, question), country: meta.name, category: 'geography', difficulty: 'hard',
      question,
      choices, correctIndex: choices.indexOf(correctNeighbour),
      funFact: `${meta.name} shares a land border with ${correctNeighbour}.`,
    };
  },
];

// ------ TRIVIA TEMPLATES ------

const triviaTemplates: TemplateGenerator[] = [
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.famousDish) return null;
    const wrongs = pickWrongAnswers(meta.famousDish, allDishes(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.famousDish, ...wrongs]);
    const question = `Which of these dishes is a famous specialty of ${meta.name}?`;
    return {
      id: genId(country, 'trivia', 1, question), country: meta.name, category: 'trivia', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.famousDish),
      funFact: `${meta.famousDish} is a famous traditional dish in ${meta.name}.`,
    };
  },
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.famousPerson) return null;
    const wrongs = pickWrongAnswers(meta.famousPerson, allFamousPeople(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.famousPerson, ...wrongs]);
    const question = `Which famous person is from ${meta.name}?`;
    return {
      id: genId(country, 'trivia', 2, question), country: meta.name, category: 'trivia', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.famousPerson),
      funFact: `${meta.famousPerson} is a highly celebrated figure from ${meta.name}.`,
    };
  },
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta) return null;
    const wrongs = pickWrongAnswers(meta.flag, Object.values(COUNTRY_METADATA).filter(m => m.name !== meta.name).map(m => m.flag).slice(0, 10), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.flag, ...wrongs]);
    const question = `Which flag belongs to ${meta.name}?`;
    return {
      id: genId(country, 'trivia', 3, question), country: meta.name, category: 'trivia', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.flag),
      funFact: `The national flag of ${meta.name} features the emoji ${meta.flag}.`,
    };
  },
];

// ------ SPORTS TEMPLATES ------

const sportsTemplates: TemplateGenerator[] = [
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.sport) return null;
    const wrongs = pickWrongAnswers(meta.sport, allSports(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.sport, ...wrongs]);
    const question = `What is considered the most popular sport in ${meta.name}?`;
    return {
      id: genId(country, 'sports', 1, question), country: meta.name, category: 'sports', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.sport),
      funFact: `${meta.sport} is considered the most popular or significant sport in ${meta.name}.`,
    };
  },
];

// ------ HISTORY TEMPLATES ------

const historyTemplates: TemplateGenerator[] = [
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.independence || meta.independence === 'N/A' || meta.independence === 'Never colonized') return null;
    const year = meta.independence;
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) return null;
    const offsets = [-30, -15, 15, 30, 50, -50];
    const wrongs = shuffle(offsets).slice(0, 3).map(o => String(yearNum + o));
    const choices = shuffle([year, ...wrongs]);
    const question = `In which year did ${meta.name} gain independence (or unify)?`;
    return {
      id: genId(country, 'history', 1, question), country: meta.name, category: 'history', difficulty: 'hard',
      question,
      choices, correctIndex: choices.indexOf(year),
      funFact: `${meta.name} gained independence (or was unified) in the year ${year}.`,
    };
  },
];

// ------ CURRENT AFFAIRS TEMPLATES ------

const currentAffairsTemplates: TemplateGenerator[] = [
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.population) return null;
    const wrongs = pickWrongAnswers(meta.population, Object.values(COUNTRY_METADATA).map(m => m.population), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.population, ...wrongs]);
    const question = `According to recent demographic reports, what is the approximate population of ${meta.name}?`;
    return {
      id: genId(country, 'curr', 1, question), country: meta.name, category: 'current-affairs', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.population),
      funFact: `${meta.name} has a population of approximately ${meta.population}.`,
    };
  },
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.famousPerson) return null;
    const wrongs = pickWrongAnswers(meta.famousPerson, allFamousPeople(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.famousPerson, ...wrongs]);
    const question = `Which prominent modern public figure, athlete, or cultural icon is a major contemporary symbol of ${meta.name}?`;
    return {
      id: genId(country, 'curr', 2, question), country: meta.name, category: 'current-affairs', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.famousPerson),
      funFact: `${meta.famousPerson} continues to be a highly recognized representative of ${meta.name} on the world stage.`,
    };
  },
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.capital) return null;
    const wrongs = pickWrongAnswers(meta.capital, allCapitals(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.capital, ...wrongs]);
    const question = `Which city currently serves as the official capital and modern administrative center of ${meta.name}?`;
    return {
      id: genId(country, 'curr', 3, question), country: meta.name, category: 'current-affairs', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.capital),
      funFact: `${meta.capital} is the political hub and capital city of ${meta.name}.`,
    };
  },
];

// ------ CATEGORY → TEMPLATES MAP ------

const templatesByCategory: Record<QuizCategory, TemplateGenerator[]> = {
  geography: geoTemplates,
  sports: sportsTemplates,
  trivia: triviaTemplates,
  history: historyTemplates,
  weather: geoTemplates,       // Fallback to geography for weather
  technology: triviaTemplates, // Fallback to trivia for tech
  space: triviaTemplates,      // Fallback to trivia for space
  science: triviaTemplates,     // Fallback to trivia for science
  nature: geoTemplates,        // Fallback to geography for nature
  politics: historyTemplates,  // Fallback to history for politics
  culture: triviaTemplates,     // Fallback to trivia for culture
  'current-affairs': currentAffairsTemplates,
  mixed: [...geoTemplates, ...sportsTemplates, ...triviaTemplates, ...historyTemplates, ...currentAffairsTemplates],
};

/**
 * Generate procedural questions for a given country and category.
 * Returns an array of valid questions (may be fewer than requested if templates fail).
 */
export function generateQuestions(
  country: string,
  category: QuizCategory,
  count: number = 5,
  excludeIds: string[] = []
): EarthQuestion[] {
  const templates = templatesByCategory[category] || geoTemplates;
  const results: EarthQuestion[] = [];
  const excludeSet = new Set(excludeIds);

  // Run templates multiple times with shuffled order
  for (let pass = 0; pass < 3 && results.length < count; pass++) {
    for (const template of shuffle(templates)) {
      if (results.length >= count) break;
      const q = template(country);
      if (q && !excludeSet.has(q.id)) {
        results.push(q);
        excludeSet.add(q.id);
      }
    }
  }

  return results;
}
