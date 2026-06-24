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
import { generateQuestions } from '@/data/questions/generator';

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

/** Universal fallback generator that works for ANY country, strictly same-country locked */
function generateUniversalFallback(country: string, category: string): EarthQuestion {
  const canonical = getCanonicalCountryName(country);
  const continent = getContinentForCountry(canonical) || 'Earth';
  const cat = getCanonicalCategory(category);

  if (cat === 'geography' || cat === 'mixed') {
    const choices = [continent, 'Asia', 'Europe', 'Africa', 'Americas', 'Oceania'];
    const uniqueChoices = [...new Set(choices)].slice(0, 4);
    const shuffled = shuffle(uniqueChoices);
    const correctIndex = shuffled.indexOf(continent);

    return {
      id: `universal-geo-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
      country: canonical,
      category: 'geography',
      difficulty: 'easy',
      question: `In which continent is the nation of ${canonical} located?`,
      choices: shuffled,
      correctIndex: correctIndex === -1 ? 0 : correctIndex,
      funFact: `${canonical} is situated in ${continent}. It offers a unique geographical landscape to explore.`
    };
  }

  if (cat === 'history') {
    const choices = [canonical, 'Global Union', 'Universal Territory', 'United Continents'];
    const shuffled = shuffle(choices);
    return {
      id: `universal-hist-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
      country: canonical,
      category: 'history',
      difficulty: 'medium',
      question: `Which sovereign country is the main focus of this history and cultural heritage challenge?`,
      choices: shuffled,
      correctIndex: shuffled.indexOf(canonical),
      funFact: `We are studying the historical timeline and heritage of ${canonical} in this round.`
    };
  }

  if (cat === 'sports') {
    const wrongPool = ['Argentina', 'Germany', 'Japan', 'Brazil', 'France', 'Italy', 'Spain', 'United Kingdom', 'United States'];
    const filteredWrongs = wrongPool.filter(c => c !== canonical);
    const uniqueChoices = [canonical, ...filteredWrongs].slice(0, 4);
    const shuffled = shuffle(uniqueChoices);
    return {
      id: `universal-sports-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
      country: canonical,
      category: 'sports',
      difficulty: 'easy',
      question: `Which country's international sports teams play under the national colors of ${canonical}?`,
      choices: shuffled,
      correctIndex: shuffled.indexOf(canonical),
      funFact: `Athletes and national sports teams proudly represent the sovereignty of ${canonical}.`
    };
  }

  if (cat === 'science') {
    const wrongPool = ['Brazil', 'Canada', 'Australia', 'Japan', 'Germany', 'France', 'United States', 'United Kingdom'];
    const filteredWrongs = wrongPool.filter(c => c !== canonical);
    const uniqueChoices = [canonical, ...filteredWrongs].slice(0, 4);
    const shuffled = shuffle(uniqueChoices);
    return {
      id: `universal-sci-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
      country: canonical,
      category: 'science',
      difficulty: 'medium',
      question: `Which country's geographical coordinate mapping, biodiversity, and ecosystems are we examining?`,
      choices: shuffled,
      correctIndex: shuffled.indexOf(canonical),
      funFact: `Every country, including ${canonical}, has distinct ecosystems and environmental sciences.`
    };
  }

  // Current Affairs & mixed fallbacks
  const wrongPool = ['United States', 'United Kingdom', 'France', 'Japan', 'Germany', 'Brazil', 'Canada', 'Australia'];
  const filteredWrongs = wrongPool.filter(c => c !== canonical);
  const uniqueChoices = [canonical, ...filteredWrongs].slice(0, 4);
  const shuffled = shuffle(uniqueChoices);
  return {
    id: `universal-curr-${canonical.toLowerCase().replace(/[^a-z]/g, '')}`,
    country: canonical,
    category: 'current-affairs',
    difficulty: 'medium',
    question: `Which nation is the primary subject of current affairs, politics, and local developments in this challenge card?`,
    choices: shuffled,
    correctIndex: shuffled.indexOf(canonical),
    funFact: `You are playing the Current Affairs and events challenge specifically for ${canonical}.`
  };
}

interface QuestionBrief {
  id: string;
  question: string;
  country: string;
}

export function areQuestionsDuplicate(q1: QuestionBrief, q2: QuestionBrief): boolean {
  if (q1.id === q2.id) return true;
  
  const c1 = q1.country.toLowerCase().trim();
  const c2 = q2.country.toLowerCase().trim();
  if (c1 !== c2) return false;
  
  const getSignature = (text: string) => {
    const norm = text.toLowerCase();
    const keywords = ['capital', 'flag', 'currency', 'language', 'continent', 'landmark', 'border', 'neighbour', 'population', 'independence', 'dish', 'food', 'person', 'sport'];
    for (const kw of keywords) {
      if (norm.includes(kw)) return kw;
    }
    return '';
  };
  
  const sig1 = getSignature(q1.question);
  const sig2 = getSignature(q2.question);
  
  if (sig1 && sig1 === sig2) {
    return true;
  }
  
  const stopWords = new Set(['what', 'which', 'the', 'is', 'are', 'was', 'were', 'of', 'in', 'and', 'belong', 'belongs', 'located', 'city', 'country']);
  const getWords = (text: string) => {
    return new Set(
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
    );
  };
  
  const w1 = getWords(q1.question);
  const w2 = getWords(q2.question);
  
  if (w1.size === 0 || w2.size === 0) return false;
  
  let intersection = 0;
  for (const w of w1) {
    if (w2.has(w)) intersection++;
  }
  
  const union = w1.size + w2.size - intersection;
  return (intersection / union) > 0.55;
}

export async function POST(request: NextRequest) {
  let requestCountry = 'Global';
  let requestCategory = 'geography';
  try {
    const body = await request.json();
    const { country, category, username, answeredIds = [], answeredQuestions = [] } = body;
    requestCountry = country || 'Global';
    requestCategory = category || 'geography';

    console.log(`[PLAY EARTH DEBUG] POST /api/quiz/next: Clicked Country="${country}", Category="${category}", Username="${username}"`);
    console.log(`[PLAY EARTH DEBUG] clientAnsweredIds count: ${answeredIds.length}`);

    if (!country || !category || !username) {
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
    // Generate up to 5 questions, excluding any already answered.
    const procedural = generateQuestions(
      canonicalCountry, 
      getCanonicalCategory(category) as QuizCategory, 
      5, 
      clientAnsweredIds
    );
    const unseenProcedural = procedural.filter(q => !isDuplicate(q));
    console.log(`[PLAY EARTH DEBUG] Layer 3: Procedural count: ${procedural.length}, Unseen: ${unseenProcedural.length}`);
    if (unseenProcedural.length > 0) {
      const selected = shuffle(unseenProcedural)[0];
      saveGeneratedQuestion(selected);
      console.log(`[PLAY EARTH DEBUG] Layer 3 Match Found: ID="${selected.id}" for Country="${selected.country}"`);
      return NextResponse.json({ question: selected, source: 'procedural' });
    }

    // ------ LAYER 4: SAME-COUNTRY MIXED FALLBACK ------
    // If we have no questions for this category (e.g. Sports empty), fallback to same country's Mixed pool
    if (category !== 'mixed') {
      console.log(`[PLAY EARTH DEBUG] Layer 4: Category "${category}" empty, falling back to same-country "mixed" pool`);
      
      const mixedPool = getMergedQuestions(canonicalCountry, 'mixed');
      const unseenMixed = mixedPool.filter(q => !isDuplicate(q));
      console.log(`[PLAY EARTH DEBUG] Layer 4: Unseen mixed pool size: ${unseenMixed.length}`);

      if (unseenMixed.length > 0) {
        const selected = shuffle(unseenMixed)[0];
        console.log(`[PLAY EARTH DEBUG] Layer 4 Match Found: ID="${selected.id}" (Mixed category fallback)`);
        return NextResponse.json({ question: selected, source: 'same-country-mixed-fallback' });
      }

      // If mixed folder is also empty/exhausted, try generating procedural questions from any category
      const proceduralMixed = generateQuestions(canonicalCountry, 'mixed', 5, clientAnsweredIds);
      const unseenProceduralMixed = proceduralMixed.filter(q => !isDuplicate(q));
      console.log(`[PLAY EARTH DEBUG] Layer 4: Procedural mixed count: ${proceduralMixed.length}, Unseen: ${unseenProceduralMixed.length}`);
      if (unseenProceduralMixed.length > 0) {
        const selected = shuffle(unseenProceduralMixed)[0];
        saveGeneratedQuestion(selected);
        console.log(`[PLAY EARTH DEBUG] Layer 4 Match Found: ID="${selected.id}" (Procedural mixed category fallback)`);
        return NextResponse.json({ question: selected, source: 'same-country-procedural-mixed-fallback' });
      }
    }

    // ------ LAYER 4.5: UNIVERSAL SAME-COUNTRY GENERATION (FINAL CRASH RESISTANT) ------
    const universalQ = generateUniversalFallback(canonicalCountry, category);
    console.log(`[PLAY EARTH DEBUG] Layer 4.5: Universal fallback ID="${universalQ.id}" (isDuplicate? ${isDuplicate(universalQ)})`);
    if (!isDuplicate(universalQ)) {
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
      return NextResponse.json({ question: universalQ, source: 'error-safe-fallback' });
    } catch (inner: any) {
      return NextResponse.json({ error: 'Critical server error', details: err.message }, { status: 500 });
    }
  }
}
