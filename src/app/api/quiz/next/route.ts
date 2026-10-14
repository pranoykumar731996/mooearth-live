import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { EarthQuestion, QuizCategory } from '@/types';
import { 
  matchCountry, 
  getCanonicalCountryName,
  getContinentForCountry,
  isQuestionExpired
} from '@/data/questions';
import { COUNTRY_METADATA, findCountryMeta } from '@/data/questions/countryMetadata';
import { generateQuestions } from '@/data/questions/generator';
import { 
  areQuestionsDuplicate as historyAreQuestionsDuplicate, 
  QuestionBrief 
} from '@/services/questionHistoryService';
import { aiRateLimiter, getClientIp } from '@/lib/rate-limiter';

export const areQuestionsDuplicate = historyAreQuestionsDuplicate;
export const dynamic = 'force-dynamic';

const API_URL = 'https://api.openai.com/v1/chat/completions';

// Global in-memory cache to support Vercel serverless instances (since filesystem is read-only)
const MEMORY_AI_QUESTIONS: EarthQuestion[] = [];

/** Shuffle helper (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Hash helper for question ID generation */
function getQuestionHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

/** Maps any input category to the canonical 6 categories */
function getCanonicalCategory(cat: string): string {
  const normalized = cat.toLowerCase().trim();
  if (normalized === 'geography') return 'geography';
  if (normalized === 'sports') return 'sports';
  if (normalized === 'history') return 'history';
  if (normalized === 'science' || normalized === 'technology' || normalized === 'space') return 'science';
  if (normalized === 'politics' || normalized === 'current-affairs') return 'current-affairs';
  return 'mixed';
}

/** Reads country questions directly from the folder JSON database */
function getQuestionsFromFolderDb(country: string, category: string): EarthQuestion[] {
  const canonical = getCanonicalCountryName(country);
  const cat = getCanonicalCategory(category);
  const countryDir = path.resolve(process.cwd(), 'src/data/questions/questions', canonical);
  console.log(`[PLAY EARTH DEBUG] getQuestionsFromFolderDb: checking path: "${countryDir}" for file: "${cat}.json"`);

  if (cat === 'mixed') {
    const mixedFile = path.join(countryDir, 'mixed.json');
    if (fs.existsSync(mixedFile)) {
      try {
        return JSON.parse(fs.readFileSync(mixedFile, 'utf-8'));
      } catch (e) {}
    }
    // Fallback: merge all files in the country directory
    if (fs.existsSync(countryDir)) {
      try {
        const files = fs.readdirSync(countryDir);
        const combined: EarthQuestion[] = [];
        const seenText = new Set<string>();
        for (const file of files) {
          if (file.endsWith('.json') && file !== 'mixed.json') {
            const list = JSON.parse(fs.readFileSync(path.join(countryDir, file), 'utf-8'));
            for (const q of list) {
              const key = q.question.toLowerCase().trim();
              if (!seenText.has(key)) {
                seenText.add(key);
                combined.push(q);
              }
            }
          }
        }
        return combined;
      } catch (e) {}
    }
    return [];
  } else {
    const filePath = path.join(countryDir, `${cat}.json`);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {}
    }
    return [];
  }
}

/** Combines folder-based database questions with memory cache for strict country-category matching */
function getMergedQuestions(country: string, category: string): EarthQuestion[] {
  const canonical = getCanonicalCountryName(country);
  const cat = getCanonicalCategory(category);

  // 1. Get questions from folder database
  const folderQuestions = getQuestionsFromFolderDb(canonical, category);

  // 2. Filter memory cache questions for this country and category
  const memQuestions = MEMORY_AI_QUESTIONS.filter(q => {
    const isCountryMatch = matchCountry(q.country, canonical);
    if (!isCountryMatch) return false;
    if (cat === 'mixed') return true;
    return getCanonicalCategory(q.category) === cat;
  });

  // Merge, filter out expired, and deduplicate by question text
  const merged: EarthQuestion[] = [];
  const seenText = new Set<string>();

  for (const q of [...folderQuestions, ...memQuestions]) {
    if (isQuestionExpired(q)) continue;
    const key = q.question.toLowerCase().trim();
    if (!seenText.has(key)) {
      seenText.add(key);
      merged.push(q);
    }
  }

  return merged;
}

/** Saves generated AI question to the folder-based JSON database and the memory cache */
function saveGeneratedQuestion(question: EarthQuestion) {
  // 1. Save to memory cache (essential for serverless Vercel persistence)
  const existsMem = MEMORY_AI_QUESTIONS.some(
    q => q.question.toLowerCase().trim() === question.question.toLowerCase().trim()
  );
  if (!existsMem) {
    MEMORY_AI_QUESTIONS.push(question);
  }

  // 2. Save to local folder database
  try {
    const canonical = getCanonicalCountryName(question.country);
    const cat = getCanonicalCategory(question.category);
    const countryDir = path.resolve(process.cwd(), 'src/data/questions/questions', canonical);
    
    if (!fs.existsSync(countryDir)) {
      fs.mkdirSync(countryDir, { recursive: true });
    }

    const filePath = path.join(countryDir, `${cat}.json`);
    let questionsList: EarthQuestion[] = [];
    if (fs.existsSync(filePath)) {
      try {
        questionsList = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {}
    }

    const exists = questionsList.some(
      q => q.question.toLowerCase().trim() === question.question.toLowerCase().trim()
    );

    if (!exists) {
      questionsList.push(question);
      fs.writeFileSync(filePath, JSON.stringify(questionsList, null, 2), 'utf-8');
    }

    // Update mixed.json as well
    if (cat !== 'mixed') {
      const mixedPath = path.join(countryDir, 'mixed.json');
      let mixedList: EarthQuestion[] = [];
      if (fs.existsSync(mixedPath)) {
        try {
          mixedList = JSON.parse(fs.readFileSync(mixedPath, 'utf-8'));
        } catch (e) {}
      }
      const existsInMixed = mixedList.some(
        q => q.question.toLowerCase().trim() === question.question.toLowerCase().trim()
      );
      if (!existsInMixed) {
        mixedList.push(question);
        fs.writeFileSync(mixedPath, JSON.stringify(mixedList, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Vercel filesystem is read-only. Generated question was cached in serverless memory only.');
  }
}

/** Multi-template universal question generator with anti-repeat safeguards */
function generateUniversalFallback(
  country: string, 
  category: string,
  excludeIds: string[] = [],
  excludeQuestions: { id: string; question: string; country: string }[] = []
): EarthQuestion | null {
  const canonical = getCanonicalCountryName(country);
  const meta = findCountryMeta(canonical);
  const continent = (meta?.continent || getContinentForCountry(canonical) || 'Earth').trim();
  const excludeSet = new Set(excludeIds);
  const isCandidateDuplicate = (q: EarthQuestion) => {
    if (excludeSet.has(q.id)) return true;
    for (const aq of excludeQuestions) {
      if (historyAreQuestionsDuplicate(q, aq)) return true;
    }
    return false;
  };

  const allMeta = Object.values(COUNTRY_METADATA);
  const candidates: EarthQuestion[] = [];

  // Template 1: Continent (Geography / Mixed)
  if (meta?.continent || continent !== 'Earth') {
    const choices = [continent, 'Asia', 'Europe', 'Africa', 'Americas', 'Oceania'];
    const uniqueChoices = [...new Set(choices)].slice(0, 4);
    const shuffled = shuffle(uniqueChoices);
    const question = `In which continent is the nation of ${canonical} located?`;
    candidates.push({
      id: `universal-cont-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
      country: canonical,
      category: 'geography',
      difficulty: 'easy',
      question,
      choices: shuffled,
      correctIndex: shuffled.indexOf(continent),
      funFact: `${canonical} is situated in ${continent}. It offers a unique geographical landscape to explore.`
    });
  }

  // Template 2: Capital City
  if (meta?.capital) {
    const wrongCapitals = shuffle(allMeta.map(m => m.capital).filter(c => c && c !== meta.capital)).slice(0, 3);
    if (wrongCapitals.length >= 3) {
      const choices = shuffle([meta.capital, ...wrongCapitals]);
      const question = `What is the capital city of ${canonical}?`;
      candidates.push({
        id: `universal-cap-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
        country: canonical,
        category: 'geography',
        difficulty: 'medium',
        question,
        choices,
        correctIndex: choices.indexOf(meta.capital),
        funFact: `${meta.capital} is the primary capital city of ${canonical}.`
      });
    }
  }

  // Template 3: Flag
  if (meta?.flag) {
    const wrongCountries = shuffle(allMeta.map(m => m.name).filter(n => n && n !== canonical)).slice(0, 3);
    if (wrongCountries.length >= 3) {
      const choices = shuffle([canonical, ...wrongCountries]);
      const question = `Which sovereign nation is represented by this national flag?\n\n${meta.flag}`;
      candidates.push({
        id: `universal-flag-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
        country: canonical,
        category: 'geography',
        difficulty: 'easy',
        question,
        choices,
        correctIndex: choices.indexOf(canonical),
        funFact: `${meta.flag} is the official national flag of ${canonical}.`
      });
    }
  }

  // Template 4: Currency
  if (meta?.currency) {
    const wrongCurrencies = shuffle(allMeta.map(m => m.currency).filter(c => c && c !== meta.currency)).slice(0, 3);
    if (wrongCurrencies.length >= 3) {
      const choices = shuffle([meta.currency, ...wrongCurrencies]);
      const question = `What is the official currency used in ${canonical}?`;
      candidates.push({
        id: `universal-curr-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
        country: canonical,
        category: 'geography',
        difficulty: 'medium',
        question,
        choices,
        correctIndex: choices.indexOf(meta.currency),
        funFact: `The official currency of ${canonical} is the ${meta.currency}.`
      });
    }
  }

  // Template 5: Language
  if (meta?.language) {
    const wrongLangs = shuffle([...new Set(allMeta.map(m => m.language).filter(l => l && l !== meta.language))]).slice(0, 3);
    if (wrongLangs.length >= 3) {
      const choices = shuffle([meta.language, ...wrongLangs]);
      const question = `Which official or primary language is spoken in ${canonical}?`;
      candidates.push({
        id: `universal-lang-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
        country: canonical,
        category: 'history',
        difficulty: 'medium',
        question,
        choices,
        correctIndex: choices.indexOf(meta.language),
        funFact: `${meta.language} is widely spoken and recognized across ${canonical}.`
      });
    }
  }

  // Template 6: Landmark
  if (meta?.landmark) {
    const wrongLandmarks = shuffle(allMeta.map(m => m.landmark).filter(l => l && l !== meta.landmark)).slice(0, 3);
    if (wrongLandmarks.length >= 3) {
      const choices = shuffle([meta.landmark, ...wrongLandmarks]);
      const question = `Which famous landmark or natural wonder is located in ${canonical}?`;
      candidates.push({
        id: `universal-land-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
        country: canonical,
        category: 'geography',
        difficulty: 'medium',
        question,
        choices,
        correctIndex: choices.indexOf(meta.landmark),
        funFact: `${meta.landmark} is one of the most iconic landmarks of ${canonical}.`
      });
    }
  }

  // Template 7: Border Neighbor
  if (meta?.neighbours && meta.neighbours.length > 0) {
    const correctNeighbour = meta.neighbours[0];
    const nonNeighbours = shuffle(allMeta.map(m => m.name).filter(n => n !== canonical && !meta.neighbours!.includes(n))).slice(0, 3);
    if (nonNeighbours.length >= 3) {
      const choices = shuffle([correctNeighbour, ...nonNeighbours]);
      const question = `Which of these nations shares an international land border with ${canonical}?`;
      candidates.push({
        id: `universal-border-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
        country: canonical,
        category: 'geography',
        difficulty: 'hard',
        question,
        choices,
        correctIndex: choices.indexOf(correctNeighbour),
        funFact: `${canonical} shares a land border with ${correctNeighbour}. Neighboring countries include: ${meta.neighbours.join(', ')}.`
      });
    }
  }

  // Template 8: Famous Dish
  if (meta?.famousDish) {
    const dish = meta.famousDish;
    const wrongDishes = shuffle(
      allMeta.map(m => m.famousDish).filter((d): d is string => Boolean(d) && d !== dish)
    ).slice(0, 3);
    if (wrongDishes.length >= 3) {
      const choices: string[] = shuffle([dish, ...wrongDishes]);
      const question = `Which traditional dish or culinary specialty originates from ${canonical}?`;
      candidates.push({
        id: `universal-dish-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
        country: canonical,
        category: 'geography',
        difficulty: 'easy',
        question,
        choices,
        correctIndex: choices.indexOf(dish),
        funFact: `${dish} is a famous culinary tradition of ${canonical}.`
      });
    }
  }

  // Shuffle candidates and pick the first unseen candidate
  for (const cand of shuffle(candidates)) {
    if (!isCandidateDuplicate(cand)) {
      return cand;
    }
  }

  // If ALL specific templates for this country have been answered,
  // offer a Regional Master Challenge from the same continent
  const sameContinentCountries = allMeta.filter(m => m.continent === continent && m.name !== canonical);
  if (sameContinentCountries.length >= 4) {
    const targetNeighbor = shuffle(sameContinentCountries)[0];
    const otherContinentCountries = shuffle(allMeta.filter(m => m.continent !== continent)).slice(0, 3);
    if (otherContinentCountries.length >= 3) {
      const choices = shuffle([targetNeighbor.name, ...otherContinentCountries.map(m => m.name)]);
      const question = `Regional Master Challenge: Having explored ${canonical}, which other nation is also located in ${continent}?`;
      const regCand: EarthQuestion = {
        id: `universal-regmaster-${canonical.toLowerCase().replace(/[^a-z]/g, '')}-${targetNeighbor.name.toLowerCase().replace(/[^a-z]/g, '')}`,
        country: canonical,
        category: 'geography',
        difficulty: 'hard',
        question,
        choices,
        correctIndex: choices.indexOf(targetNeighbor.name),
        funFact: `Both ${canonical} and ${targetNeighbor.name} are situated in ${continent}. You are mastering the continent!`
      };
      if (!isCandidateDuplicate(regCand)) {
        return regCand;
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  let requestCountry = 'Global';
  let requestCategory = 'geography';
  try {
    // Rate limiting: 15 requests per minute per IP
    const clientIp = getClientIp(request);
    if (aiRateLimiter.isLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before requesting another question.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { country, category, username = 'Anonymous', answeredIds = [], answeredQuestions = [] } = body;
    requestCountry = country || 'Global';
    requestCategory = category || 'geography';

    console.log(`[PLAY EARTH DEBUG] POST /api/quiz/next: Clicked Country="${country}", Category="${category}", Username="${username}"`);
    console.log(`[PLAY EARTH DEBUG] clientAnsweredIds count: ${answeredIds.length}`);

    if (!country || !category) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const canonicalCountry = getCanonicalCountryName(country);
    console.log(`[PLAY EARTH DEBUG] Resolved Canonical Country Name: "${canonicalCountry}"`);

    const clientAnsweredIds = Array.isArray(answeredIds) ? answeredIds : [];
    const clientAnsweredQuestions = Array.isArray(answeredQuestions) ? answeredQuestions : [];
    const excludeSet = new Set<string>(clientAnsweredIds);

    const isDuplicate = (q: EarthQuestion) => {
      if (excludeSet.has(q.id)) return true;
      for (const aq of clientAnsweredQuestions) {
        if (areQuestionsDuplicate(q, aq)) return true;
      }
      return false;
    };

    // ------ LAYER 1: COMBINED LOCAL DATABASE (FILES + SERVERLESS MEMORY) ------
    const countryCategoryPool = getMergedQuestions(canonicalCountry, category);
    const unseenPool = countryCategoryPool.filter(q => !isDuplicate(q));
    console.log(`[PLAY EARTH DEBUG] Layer 1: CountryCategoryPool size: ${countryCategoryPool.length}, UnseenPool size: ${unseenPool.length}`);

    if (unseenPool.length > 0) {
      const selected = shuffle(unseenPool)[0];
      console.log(`[PLAY EARTH DEBUG] Layer 1 Match Found: ID="${selected.id}" for Country="${selected.country}"`);
      return NextResponse.json({ question: selected, source: 'local-db' });
    }

    // ------ LAYER 2: OPENAI DYNAMIC GENERATION (COULD 429 IF OVER LIMIT) ------
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const aiCategory = getCanonicalCategory(category);
        const difficulty = 'medium';

        const apiResponse = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `You are an elite educational game master. You generate engaging trivia questions about countries. 
You must respond strictly in JSON format matching the schema:
{
  "country": "Canonical name of the country",
  "category": "The requested category",
  "difficulty": "easy | medium | hard",
  "question": "A unique, high-quality multiple-choice question specifically about the country",
  "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
  "answer": "The correct option exactly matching one of the options",
  "fact": "A short, interesting fun fact or explanation about the answer"
}

CRITICAL: Do NOT repeat or generate questions that are identical or semantically similar to any of these previously asked questions:
${clientAnsweredQuestions.slice(-15).map(q => `- ${q.question}`).join('\n')}`
              },
              {
                role: 'user',
                content: `Generate a multiple choice question about "${canonicalCountry}".
Category: ${aiCategory}
Difficulty: ${difficulty}
Ensure the question, options, answer, and fact are 100% focused on ${canonicalCountry}. Do not reference other countries unless directly relevant as comparison.`
              }
            ],
            temperature: 0.85,
            max_tokens: 300,
          })
        });

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          const rawContent = apiData.choices?.[0]?.message?.content;
          const parsed = JSON.parse(rawContent);

          const options: string[] = parsed.options || [];
          const answer: string = parsed.answer || '';
          
          if (options.length === 4 && options.includes(answer)) {
            const correctIndex = options.indexOf(answer);
            const questionText = parsed.question;
            const qHash = getQuestionHash(questionText);
            const questionId = `ai-${canonicalCountry.toLowerCase().replace(/[^a-z]/g, '')}-${aiCategory}-${qHash}`;

            const newQuestion: EarthQuestion = {
              id: questionId,
              country: canonicalCountry,
              category: aiCategory as QuizCategory,
              difficulty: difficulty,
              question: questionText,
              choices: options,
              correctIndex: correctIndex,
              funFact: parsed.fact || parsed.funFact || '',
              timestamp: Date.now(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };

            if (!isDuplicate(newQuestion)) {
              // Write to files / cache
              saveGeneratedQuestion(newQuestion);
              console.log(`[PLAY EARTH DEBUG] Layer 2 OpenAI success: ID="${newQuestion.id}"`);
              return NextResponse.json({ question: newQuestion, source: 'ai-generated' });
            } else {
              console.warn(`[PLAY EARTH DEBUG] Layer 2 OpenAI generated duplicate question: "${newQuestion.question}"`);
            }
          }
        } else {
          console.warn(`[PLAY EARTH DEBUG] Layer 2 OpenAI failed with status: ${apiResponse.status}`);
        }
      } catch (err) {
        console.warn('OpenAI dynamic generation call failed. Transitioning to local same-country fallback.', err);
      }
    }

    // ------ LAYER 3: LOCAL PROCEDURAL TEMPLATES (FALLBACK) ------
    // Generate up to 10 questions, strictly excluding any already answered or duplicate questions
    const procedural = generateQuestions(
      canonicalCountry, 
      getCanonicalCategory(category) as QuizCategory, 
      10, 
      clientAnsweredIds,
      clientAnsweredQuestions
    );
    const unseenProcedural = procedural.filter(q => !isDuplicate(q));
    console.log(`[PLAY EARTH DEBUG] Layer 3: Procedural count: ${procedural.length}, Unseen: ${unseenProcedural.length}`);
    if (unseenProcedural.length > 0) {
      const selected = shuffle(unseenProcedural)[0];
      saveGeneratedQuestion(selected);
      console.log(`[PLAY EARTH DEBUG] Layer 3 Match Found: ID="${selected.id}" for Country="${selected.country}"`);
      return NextResponse.json({ question: selected, source: 'procedural' });
    }

    // ------ LAYER 4: SAME-COUNTRY CATEGORY EXPANSION ------
    // If we have exhausted this category (e.g. Sports), seamlessly rotate to other unasked categories for the same country
    const altCategories: QuizCategory[] = ['geography', 'trivia', 'sports', 'history', 'current-affairs'];
    for (const altCat of altCategories) {
      if (altCat === getCanonicalCategory(category)) continue;

      const altFolder = getMergedQuestions(canonicalCountry, altCat);
      const unseenAlt = altFolder.filter(q => !isDuplicate(q));
      if (unseenAlt.length > 0) {
        const selected = shuffle(unseenAlt)[0];
        console.log(`[PLAY EARTH DEBUG] Layer 4: Found alternative category question: "${selected.id}" in ${altCat}`);
        return NextResponse.json({ question: selected, source: `alt-category-${altCat}` });
      }

      const altProcedural = generateQuestions(canonicalCountry, altCat, 6, clientAnsweredIds, clientAnsweredQuestions);
      const unseenAltProcedural = altProcedural.filter(q => !isDuplicate(q));
      if (unseenAltProcedural.length > 0) {
        const selected = shuffle(unseenAltProcedural)[0];
        saveGeneratedQuestion(selected);
        console.log(`[PLAY EARTH DEBUG] Layer 4: Generated alternative category procedural question: "${selected.id}" in ${altCat}`);
        return NextResponse.json({ question: selected, source: `alt-procedural-${altCat}` });
      }
    }

    // ------ LAYER 4.5: UNIVERSAL SAME-COUNTRY GENERATION (FINAL CRASH RESISTANT) ------
    const universalQ = generateUniversalFallback(canonicalCountry, category, clientAnsweredIds, clientAnsweredQuestions);
    console.log(`[PLAY EARTH DEBUG] Layer 4.5: Universal fallback ID="${universalQ?.id}" (isDuplicate? ${universalQ ? isDuplicate(universalQ) : 'null'})`);
    if (universalQ && !isDuplicate(universalQ)) {
      saveGeneratedQuestion(universalQ);
      console.log(`[PLAY EARTH DEBUG] Layer 4.5 Match Found: ID="${universalQ.id}" for Country="${universalQ.country}"`);
      return NextResponse.json({ question: universalQ, source: 'universal-fallback' });
    }

    // ------ LAYER 5: NO RECYCLE / EXHAUSTED ------
    console.log(`[PLAY EARTH DEBUG] Layer 5: All questions exhausted for Country="${canonicalCountry}" Category="${category}"`);
    return NextResponse.json({ question: null, source: 'exhausted' });

  } catch (err: any) {
    console.error('CRITICAL /api/quiz/next error:', err);
    try {
      const universalQ = generateUniversalFallback(requestCountry, requestCategory);
      if (universalQ) {
        return NextResponse.json({ question: universalQ, source: 'error-safe-fallback' });
      }
      return NextResponse.json({ question: null, source: 'exhausted' });
    } catch (inner: any) {
      return NextResponse.json({ question: null, source: 'exhausted' }, { status: 200 });
    }
  }
}
