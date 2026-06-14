import { NextRequest, NextResponse } from 'next/server';
import { EarthQuestion, QuizCategory } from '@/types';
import { 
  DEDUPLICATED_STATIC_QUESTIONS, 
  matchCountry, 
  getCanonicalCountryName 
} from '@/data/questions';
import { 
  getUserProgress, 
  saveUserProgress, 
  getCachedAiQuestions, 
  addCachedAiQuestion,
  UserProgress
} from '@/data/questions/quizDb';
import { generateQuestions } from '@/data/questions/generator';

export const dynamic = 'force-dynamic';

function getQuestionHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Safe crash-proof country-locked fallback question selector */
function getSafeFallbackQuestion(
  country: string,
  category: QuizCategory,
  progress: UserProgress,
  answeredIds: string[]
): NextResponse {
  // 1. Try to reuse any answered local matches for this country (oldest first)
  const localMatches = DEDUPLICATED_STATIC_QUESTIONS.filter(q => matchCountry(q.country, country));
  if (localMatches.length > 0) {
    const oldestLocal = [...localMatches].sort((a, b) => {
      const idxA = progress.answeredQuestionIds.indexOf(a.id);
      const idxB = progress.answeredQuestionIds.indexOf(b.id);
      return idxA - idxB;
    })[0];
    return NextResponse.json({ question: oldestLocal, source: 'fallback-local-repeat' });
  }

  // 2. Try to generate a procedural question locally using metadata
  const procedural = generateQuestions(country, category, 5);
  if (procedural.length > 0) {
    const selected = shuffle(procedural)[0];
    return NextResponse.json({ question: selected, source: 'fallback-procedural' });
  }

  // 3. Try to reuse any cached AI question for this country (even if already answered)
  const cachedAiPool = getCachedAiQuestions(country, category, 'medium');
  if (cachedAiPool.length > 0) {
    const oldestCached = [...cachedAiPool].sort((a, b) => {
      const idxA = progress.answeredQuestionIds.indexOf(a.id);
      const idxB = progress.answeredQuestionIds.indexOf(b.id);
      return idxA - idxB;
    })[0];
    return NextResponse.json({ question: oldestCached, source: 'fallback-cache-repeat' });
  }

  // 4. Ultimate fallback: Get a global question, copy it, and rewrite country name
  const globalPool = DEDUPLICATED_STATIC_QUESTIONS.filter(q => q.country.toLowerCase() === 'global');
  const fallbackPool = globalPool.length > 0 ? globalPool : DEDUPLICATED_STATIC_QUESTIONS;
  
  if (fallbackPool.length > 0) {
    const randomGlobal = shuffle(fallbackPool)[0];
    const clonedQuestion: EarthQuestion = {
      ...randomGlobal,
      id: `fallback-${country.toLowerCase().replace(/[^a-z]/g, '')}-${Date.now()}`,
      country: country, // Override country lock to prevent immersion breaking
      funFact: randomGlobal.funFact ? `${randomGlobal.funFact} (Challenge for ${country})` : `Challenge for ${country}.`
    };
    return NextResponse.json({ question: clonedQuestion, source: 'fallback-global-rewrite' });
  }

  return NextResponse.json({ error: 'No questions available' }, { status: 404 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { country, category, username, answeredIds = [] } = body;

    if (!country || !category || !username) {
      return NextResponse.json({ error: 'Missing required parameters: country, category, username' }, { status: 400 });
    }

    const canonicalCountry = getCanonicalCountryName(country);
    
    // Fetch user progress from our lightweight DB
    const progress = getUserProgress(username);
    
    // Combine frontend answeredIds with backend stored answeredQuestionIds to be bulletproof
    const excludeSet = new Set<string>([
      ...answeredIds,
      ...progress.answeredQuestionIds
    ]);

    // ------ LAYER 1: LOCAL QUESTION DATABASE (PRIMARY) ------
    // Find all static questions that match the selected country specifically.
    let localMatches = DEDUPLICATED_STATIC_QUESTIONS.filter(q => {
      const isCountryMatch = matchCountry(q.country, canonicalCountry);
      if (!isCountryMatch) return false;
      return category === 'trivia' || q.category === category;
    });

    // Filter out already answered questions
    let unseenLocalMatches = localMatches.filter(q => !excludeSet.has(q.id));

    if (unseenLocalMatches.length > 0) {
      const selectedQuestion = shuffle(unseenLocalMatches)[0];

      // Update backend user progress
      progress.answeredQuestionIds.push(selectedQuestion.id);
      progress.recentQuestions.push(selectedQuestion.id);
      if (progress.recentQuestions.length > 20) {
        progress.recentQuestions.shift();
      }
      saveUserProgress(username, progress);

      return NextResponse.json({ question: selectedQuestion, source: 'local' });
    }

    // ------ LAYER 2: AI QUESTION GENERATION (FALLBACK) ------
    // Map requested category to something meaningful if 'trivia'
    const aiCategory = category === 'trivia' ? 'geography' : category;
    const difficulty = 'medium';

    // Try to reuse cached AI questions before generating new ones (Cost Optimization)
    const cachedAiPool = getCachedAiQuestions(canonicalCountry, aiCategory, difficulty);
    const unseenCachedAi = cachedAiPool.filter(q => !excludeSet.has(q.id));

    if (unseenCachedAi.length > 0) {
      const selectedQuestion = shuffle(unseenCachedAi)[0];

      // Update backend user progress
      progress.answeredQuestionIds.push(selectedQuestion.id);
      progress.recentQuestions.push(selectedQuestion.id);
      if (progress.recentQuestions.length > 20) {
        progress.recentQuestions.shift();
      }
      saveUserProgress(username, progress);

      return NextResponse.json({ question: selectedQuestion, source: 'cache' });
    }

    // Generate a new AI question if no unseen cached questions are available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY is missing. Invoking safe fallback sequence.');
      return getSafeFallbackQuestion(canonicalCountry, aiCategory as QuizCategory, progress, answeredIds);
    }

    // Prompt OpenAI gpt-4o-mini to generate a country-locked question
    let response;
    let apiFailed = false;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
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

      if (!response.ok) {
        apiFailed = true;
      }
    } catch (e) {
      apiFailed = true;
    }

    if (apiFailed || !response) {
      console.warn(`OpenAI call failed or returned error. Invoking safe fallback sequence for ${canonicalCountry}.`);
      return getSafeFallbackQuestion(canonicalCountry, aiCategory as QuizCategory, progress, answeredIds);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(rawContent);

    // Validate options and answer
    const options: string[] = parsed.options || [];
    const answer: string = parsed.answer || '';
    
    if (options.length !== 4 || !options.includes(answer)) {
      throw new Error('Invalid options/answer schema returned by OpenAI');
    }

    const correctIndex = options.indexOf(answer);
    const questionText = parsed.question;
    const qHash = getQuestionHash(questionText);

    // Generate unique ID
    const questionId = `ai-${canonicalCountry.toLowerCase().replace(/[^a-z]/g, '')}-${aiCategory}-${qHash}`;

    const newQuestion: EarthQuestion = {
      id: questionId,
      country: canonicalCountry,
      category: aiCategory as QuizCategory,
      difficulty: difficulty,
      question: questionText,
      choices: options,
      correctIndex: correctIndex,
      funFact: parsed.fact || ''
    };

    // Cache the newly generated question
    addCachedAiQuestion(newQuestion);

    // Track in user progress
    progress.answeredQuestionIds.push(newQuestion.id);
    progress.aiGeneratedHashes.push(qHash);
    progress.recentQuestions.push(newQuestion.id);
    if (progress.recentQuestions.length > 20) {
      progress.recentQuestions.shift();
    }
    saveUserProgress(username, progress);

    return NextResponse.json({ question: newQuestion, source: 'ai-generated' });

  } catch (error: any) {
    console.error('API /quiz/next error:', error);
    // Ultimate safety wrapper: never let it crash the frontend, fallback gracefully
    try {
      const body = await request.json().catch(() => ({}));
      const { country, category, username, answeredIds = [] } = body;
      const canonicalCountry = getCanonicalCountryName(country || 'Global');
      const progress = getUserProgress(username || 'anonymous');
      return getSafeFallbackQuestion(canonicalCountry, (category || 'geography') as QuizCategory, progress, answeredIds);
    } catch (innerError) {
      return NextResponse.json({ error: 'Critical Error', details: error.message }, { status: 500 });
    }
  }
}
