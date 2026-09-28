// ============================================================
// Play Earth — Procedural Question Generator
// ============================================================
// Generates unlimited, non-repeating questions using structured country metadata
// and diverse template patterns across all quiz categories.

import { EarthQuestion, QuizCategory } from '@/types';
import { COUNTRY_METADATA, findCountryMeta, getMetadataCountries } from './countryMetadata';
import { areQuestionsDuplicate, getQuestionSignature } from '@/services/questionHistoryService';

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
  const filtered = pool.filter(p => p && p.toLowerCase() !== correct.toLowerCase());
  return shuffle([...new Set(filtered)]).slice(0, count);
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

const allCapitals = () => Object.values(COUNTRY_METADATA).map(m => m.capital).filter(Boolean);
const allCurrencies = () => Object.values(COUNTRY_METADATA).map(m => m.currency).filter(Boolean);
const allLanguages = () => [...new Set(Object.values(COUNTRY_METADATA).map(m => m.language).filter(Boolean))];
const allLandmarks = () => Object.values(COUNTRY_METADATA).map(m => m.landmark).filter(Boolean);
const allContinents = () => [...new Set(Object.values(COUNTRY_METADATA).map(m => m.continent).filter(Boolean))];
const allFamousPeople = () => Object.values(COUNTRY_METADATA).filter(m => m.famousPerson).map(m => m.famousPerson!);
const allDishes = () => Object.values(COUNTRY_METADATA).filter(m => m.famousDish).map(m => m.famousDish!);
const allSports = () => [...new Set(Object.values(COUNTRY_METADATA).filter(m => m.sport).map(m => m.sport!))];
const allClimates = () => [...new Set(Object.values(COUNTRY_METADATA).filter(m => m.climate).map(m => m.climate!))];
const allCountries = () => Object.values(COUNTRY_METADATA).map(m => m.name);

// ------ GEOGRAPHY TEMPLATES ------

const geoTemplates: TemplateGenerator[] = [
  // 1. Capital (Direct)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.capital) return null;
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
  // 2. Continent
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.continent) return null;
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
  // 3. Currency (Direct)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.currency) return null;
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
  // 4. Language (Direct)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.language) return null;
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
  // 5. Landmark (Direct)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.landmark) return null;
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
  // 6. Bordering Country (Direct)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.neighbours || meta.neighbours.length === 0) return null;
    const correctNeighbour = meta.neighbours[0];
    const nonNeighbours = allCountries().filter(c => !meta.neighbours!.includes(c) && c !== meta.name);
    const wrongs = shuffle(nonNeighbours).slice(0, 3);
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
  // 7. Capital (Reverse)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.capital) return null;
    const wrongs = pickWrongAnswers(meta.name, allCountries(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.name, ...wrongs]);
    const question = `${meta.capital} is the capital city of which country?`;
    return {
      id: genId(country, 'geo', 7, question), country: meta.name, category: 'geography', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.name),
      funFact: `${meta.capital} is the vibrant capital city of ${meta.name}.`,
    };
  },
  // 8. Landmark (Reverse)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.landmark) return null;
    const wrongs = pickWrongAnswers(meta.name, allCountries(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.name, ...wrongs]);
    const question = `In which country can you visit the world-famous landmark ${meta.landmark}?`;
    return {
      id: genId(country, 'geo', 8, question), country: meta.name, category: 'geography', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.name),
      funFact: `${meta.landmark} draws visitors from all around the world to ${meta.name}.`,
    };
  },
  // 9. Non-Bordering Country (Reverse / Exclusion)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.neighbours || meta.neighbours.length < 2) return null;
    const nonNeighbours = allCountries().filter(c => !meta.neighbours!.includes(c) && c !== meta.name);
    if (nonNeighbours.length === 0) return null;
    const nonBorder = shuffle(nonNeighbours)[0];
    const borderChoices = shuffle(meta.neighbours).slice(0, 3);
    if (borderChoices.length < 3) return null;
    const choices = shuffle([nonBorder, ...borderChoices]);
    const question = `Which of these countries does NOT share a land border with ${meta.name}?`;
    return {
      id: genId(country, 'geo', 9, question), country: meta.name, category: 'geography', difficulty: 'hard',
      question,
      choices, correctIndex: choices.indexOf(nonBorder),
      funFact: `${nonBorder} does not border ${meta.name}. ${meta.name}'s neighbors include ${meta.neighbours.slice(0, 3).join(', ')}.`,
    };
  },
];

// ------ TRIVIA TEMPLATES ------

const triviaTemplates: TemplateGenerator[] = [
  // 1. Famous Dish (Direct)
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
  // 2. Famous Person (Direct)
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
  // 3. Flag (Direct)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.flag) return null;
    const otherFlags = Object.values(COUNTRY_METADATA).filter(m => m.name !== meta.name && m.flag).map(m => m.flag);
    const wrongs = pickWrongAnswers(meta.flag, otherFlags, 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.flag, ...wrongs]);
    const question = `Which flag belongs to ${meta.name}?`;
    return {
      id: genId(country, 'trivia', 3, question), country: meta.name, category: 'trivia', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.flag),
      funFact: `The national flag of ${meta.name} is ${meta.flag}.`,
    };
  },
  // 4. Famous Dish (Reverse)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.famousDish) return null;
    const wrongs = pickWrongAnswers(meta.name, allCountries(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.name, ...wrongs]);
    const question = `The culinary delight "${meta.famousDish}" is a national dish of which country?`;
    return {
      id: genId(country, 'trivia', 4, question), country: meta.name, category: 'trivia', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.name),
      funFact: `${meta.famousDish} is celebrated worldwide as a signature culinary heritage of ${meta.name}.`,
    };
  },
  // 5. Flag (Reverse)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.flag) return null;
    const wrongs = pickWrongAnswers(meta.name, allCountries(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.name, ...wrongs]);
    const question = `Which country does this flag belong to?\n\n${meta.flag}`;
    return {
      id: genId(country, 'trivia', 5, question), country: meta.name, category: 'trivia', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.name),
      funFact: `${meta.flag} is the official national flag of ${meta.name}.`,
    };
  },
  // 6. Fun Fact Identification
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.funFact) return null;
    const wrongs = pickWrongAnswers(meta.name, allCountries(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.name, ...wrongs]);
    const question = `Which country is known for the following fact?\n"${meta.funFact}"`;
    return {
      id: genId(country, 'trivia', 6, question), country: meta.name, category: 'trivia', difficulty: 'hard',
      question,
      choices, correctIndex: choices.indexOf(meta.name),
      funFact: `This is a unique geographical and cultural fact about ${meta.name}.`,
    };
  },
];

// ------ SPORTS TEMPLATES ------

const sportsTemplates: TemplateGenerator[] = [
  // 1. Most Popular Sport
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.sport) return null;
    const wrongs = pickWrongAnswers(meta.sport, allSports(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.sport, ...wrongs]);
    const question = `What is considered the most popular or culturally prominent sport in ${meta.name}?`;
    return {
      id: genId(country, 'sports', 1, question), country: meta.name, category: 'sports', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.sport),
      funFact: `${meta.sport} is deeply rooted in the sporting culture of ${meta.name}.`,
    };
  },
  // 2. Sport Representation (Reverse)
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.sport) return null;
    const wrongs = pickWrongAnswers(meta.name, allCountries(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.name, ...wrongs]);
    const question = `In which country is ${meta.sport} widely followed as one of the most prominent national sports?`;
    return {
      id: genId(country, 'sports', 2, question), country: meta.name, category: 'sports', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.name),
      funFact: `Athletes and fans from ${meta.name} have a celebrated tradition in ${meta.sport}.`,
    };
  },
  // 3. Cultural Athlete / Icon
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.famousPerson) return null;
    const wrongs = pickWrongAnswers(meta.name, allCountries(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.name, ...wrongs]);
    const question = `Which country did the world-renowned icon ${meta.famousPerson} represent on the international stage?`;
    return {
      id: genId(country, 'sports', 3, question), country: meta.name, category: 'sports', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.name),
      funFact: `${meta.famousPerson} is an international icon from ${meta.name}.`,
    };
  },
];

// ------ HISTORY TEMPLATES ------

const historyTemplates: TemplateGenerator[] = [
  // 1. Independence / Unification Year
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.independence || meta.independence === 'N/A' || meta.independence === 'Never colonized') return null;
    const year = meta.independence;
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) return null;
    const offsets = [-40, -20, 15, 35, 60, -75];
    const wrongs = shuffle(offsets).slice(0, 3).map(o => String(yearNum + o));
    const choices = shuffle([year, ...wrongs]);
    const question = `In which year did ${meta.name} achieve independence (or formal state unification)?`;
    return {
      id: genId(country, 'history', 1, question), country: meta.name, category: 'history', difficulty: 'hard',
      question,
      choices, correctIndex: choices.indexOf(year),
      funFact: `${meta.name} achieved national independence or unification in ${year}.`,
    };
  },
  // 2. Historic Personality
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.famousPerson) return null;
    const wrongs = pickWrongAnswers(meta.name, allCountries(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.name, ...wrongs]);
    const question = `Which country's rich historical and cultural tapestry includes the legacy of ${meta.famousPerson}?`;
    return {
      id: genId(country, 'history', 2, question), country: meta.name, category: 'history', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.name),
      funFact: `${meta.famousPerson} remains an integral part of the historical narrative of ${meta.name}.`,
    };
  },
  // 3. Ancient Landmark Heritage
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.landmark) return null;
    const wrongs = pickWrongAnswers(meta.name, allCountries(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.name, ...wrongs]);
    const question = `The historic architectural monument "${meta.landmark}" stands as a testament to the heritage of which nation?`;
    return {
      id: genId(country, 'history', 3, question), country: meta.name, category: 'history', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.name),
      funFact: `${meta.landmark} is a historic landmark and cultural icon in ${meta.name}.`,
    };
  },
];

// ------ CURRENT AFFAIRS TEMPLATES ------

const currentAffairsTemplates: TemplateGenerator[] = [
  // 1. Population Scale
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.population) return null;
    const wrongs = pickWrongAnswers(meta.population, Object.values(COUNTRY_METADATA).map(m => m.population), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.population, ...wrongs]);
    const question = `According to modern demographic reports, what is the approximate population of ${meta.name}?`;
    return {
      id: genId(country, 'curr', 1, question), country: meta.name, category: 'current-affairs', difficulty: 'easy',
      question,
      choices, correctIndex: choices.indexOf(meta.population),
      funFact: `${meta.name} has a population of approximately ${meta.population}.`,
    };
  },
  // 2. Contemporary Icon
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
  // 3. Administrative Center
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

// ------ NATURE & CLIMATE TEMPLATES ------

const natureTemplates: TemplateGenerator[] = [
  (country) => {
    const meta = findCountryMeta(country);
    if (!meta || !meta.climate) return null;
    const wrongs = pickWrongAnswers(meta.climate, allClimates(), 3);
    if (wrongs.length < 3) return null;
    const choices = shuffle([meta.climate, ...wrongs]);
    const question = `What type of climate predominantly characterizes the landscape of ${meta.name}?`;
    return {
      id: genId(country, 'nature', 1, question), country: meta.name, category: 'geography', difficulty: 'medium',
      question,
      choices, correctIndex: choices.indexOf(meta.climate),
      funFact: `${meta.name} features a predominantly ${meta.climate} climate.`,
    };
  },
];

// ------ CATEGORY → TEMPLATES MAP ------

const templatesByCategory: Record<QuizCategory, TemplateGenerator[]> = {
  geography: [...geoTemplates, ...natureTemplates],
  sports: [...sportsTemplates, ...triviaTemplates],
  trivia: [...triviaTemplates, ...geoTemplates],
  history: [...historyTemplates, ...currentAffairsTemplates],
  weather: [...natureTemplates, ...geoTemplates],
  technology: [...triviaTemplates, ...currentAffairsTemplates],
  space: [...triviaTemplates, ...geoTemplates],
  science: [...natureTemplates, ...triviaTemplates],
  nature: [...natureTemplates, ...geoTemplates],
  politics: [...historyTemplates, ...currentAffairsTemplates],
  culture: [...triviaTemplates, ...historyTemplates],
  'current-affairs': [...currentAffairsTemplates, ...historyTemplates],
  mixed: [
    ...geoTemplates,
    ...triviaTemplates,
    ...sportsTemplates,
    ...historyTemplates,
    ...currentAffairsTemplates,
    ...natureTemplates
  ],
};

/**
 * Generate procedural questions for a given country and category.
 * Strictly guarantees that no question matches excludeIds or any previous questions.
 */
export function generateQuestions(
  country: string,
  category: QuizCategory,
  count: number = 5,
  excludeIds: string[] = [],
  excludeQuestions: { id: string; question: string; country: string }[] = []
): EarthQuestion[] {
  const templates = templatesByCategory[category] || geoTemplates;
  const results: EarthQuestion[] = [];
  const excludeSet = new Set(excludeIds);
  const seenSignatures = new Set<string>();

  // Initialize signatures from previous questions
  for (const eq of excludeQuestions) {
    if (eq && eq.question) {
      seenSignatures.add(getQuestionSignature(eq.question));
    }
  }

  // Run templates multiple times with shuffled order
  for (let pass = 0; pass < 3 && results.length < count; pass++) {
    for (const template of shuffle(templates)) {
      if (results.length >= count) break;
      const q = template(country);
      if (!q) continue;

      if (excludeSet.has(q.id)) continue;

      // Duplicate check against existing excludeQuestions
      const isDuplicate = excludeQuestions.some(eq => areQuestionsDuplicate(q, eq));
      if (isDuplicate) continue;

      // Signature diversity check
      const sig = getQuestionSignature(q.question);
      if (sig && seenSignatures.has(sig)) continue;

      if (q.category === 'current-affairs') {
        q.timestamp = Date.now();
        q.expirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      results.push(q);
      excludeSet.add(q.id);
      if (sig) seenSignatures.add(sig);
    }
  }

  // Pass 2: If primary category templates are exhausted, expand to other categories for this country
  if (results.length < count) {
    const allTemplates = templatesByCategory['mixed'];
    for (const template of shuffle(allTemplates)) {
      if (results.length >= count) break;
      const q = template(country);
      if (!q) continue;

      if (excludeSet.has(q.id)) continue;
      const isDuplicate = excludeQuestions.some(eq => areQuestionsDuplicate(q, eq));
      if (isDuplicate) continue;

      const sig = getQuestionSignature(q.question);
      if (sig && seenSignatures.has(sig)) continue;

      results.push(q);
      excludeSet.add(q.id);
      if (sig) seenSignatures.add(sig);
    }
  }

  return results;
}
