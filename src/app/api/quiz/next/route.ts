import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { EarthQuestion, QuizCategory } from '@/types';
import { 
  matchCountry, 
  getCanonicalCountryName,
  getContinentForCountry
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

  // Merge and deduplicate by question text
  const merged = [...folderQuestions];
  const seenText = new Set<string>(folderQuestions.map(q => q.question.toLowerCase().trim()));

  for (const q of memQuestions) {
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
    const choices = [canonical, 'Argentina', 'Germany', 'Japan'];
    const shuffled = shuffle([canonical, ...choices.filter(c => c !== canonical)].slice(0, 4));
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
    const choices = [canonical, 'Brazil', 'Canada', 'Australia'];
    const shuffled = shuffle([canonical, ...choices.filter(c => c !== canonical)].slice(0, 4));
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
  const choices = [canonical, 'United States', 'United Kingdom', 'France'];
  const shuffled = shuffle([canonical, ...choices.filter(c => c !== canonical)].slice(0, 4));
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { country, category, username, answeredIds = [] } = body;

    if (!country || !category || !username) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const canonicalCountry = getCanonicalCountryName(country);
    const clientAnsweredIds = Array.isArray(answeredIds) ? answeredIds : [];
    const excludeSet = new Set<string>(clientAnsweredIds);

    // ------ LAYER 1: COMBINED LOCAL DATABASE (FILES + SERVERLESS MEMORY) ------
    const countryCategoryPool = getMergedQuestions(canonicalCountry, category);
    const unseenPool = countryCategoryPool.filter(q => !excludeSet.has(q.id));

    if (unseenPool.length > 0) {
      const selected = shuffle(unseenPool)[0];
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
}`
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
              funFact: parsed.fact || parsed.funFact || ''
            };

            // Write to files / cache
            saveGeneratedQuestion(newQuestion);

            return NextResponse.json({ question: newQuestion, source: 'ai-generated' });
          }
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
    if (procedural.length > 0) {
      const selected = shuffle(procedural)[0];
      // Save it locally / cache so it is persistent and added to the pool
      saveGeneratedQuestion(selected);
      return NextResponse.json({ question: selected, source: 'procedural' });
    }

    // ------ LAYER 4: UNIVERSAL SAME-COUNTRY GENERATION (FINAL CRASH RESISTANT) ------
    const universalQ = generateUniversalFallback(canonicalCountry, category);
    // If the universal question itself hasn't been answered in this session yet, return it
    if (!excludeSet.has(universalQ.id)) {
      saveGeneratedQuestion(universalQ);
      return NextResponse.json({ question: universalQ, source: 'universal-fallback' });
    }

    // ------ LAYER 5: SAME-COUNTRY REUSE (ROUND-ROBIN CYCLING) ------
    // Only reuse older questions if all unseen database, procedural, and universal fallback questions have been exhausted.
    if (countryCategoryPool.length > 0) {
      const oldestAnswered = [...countryCategoryPool].sort((a, b) => {
        const idxA = clientAnsweredIds.lastIndexOf(a.id);
        const idxB = clientAnsweredIds.lastIndexOf(b.id);
        
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return -1;
        if (idxB === -1) return 1;
        
        return idxA - idxB;
      })[0];

      return NextResponse.json({ question: oldestAnswered, source: 'local-recycle' });
    }

    // Ultimate fallback if pool is somehow completely empty and everything failed
    saveGeneratedQuestion(universalQ);
    return NextResponse.json({ question: universalQ, source: 'emergency-fallback' });

  } catch (err: any) {
    console.error('CRITICAL /api/quiz/next error:', err);
    // Ultimate absolute fallback to avoid HTTP 500 error
    try {
      const body = await request.json().catch(() => ({}));
      const fallbackCountry = body.country || 'Global';
      const fallbackCategory = body.category || 'geography';
      const universalQ = generateUniversalFallback(fallbackCountry, fallbackCategory);
      return NextResponse.json({ question: universalQ, source: 'error-safe-fallback' });
    } catch (inner) {
      return NextResponse.json({ error: 'Critical server error', details: err.message }, { status: 500 });
    }
  }
}
