// ============================================================
// MooEarth Live — Article Quiz API
// ============================================================
// POST /api/article/quiz
// Generates or retrieves interactive comprehension questions
// for any read article, linking the reading flow to Play Earth XP.

import { NextRequest, NextResponse } from 'next/server';
import { EarthQuestion } from '@/types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// In-memory cache for article quizzes
const articleQuizCache = new Map<string, EarthQuestion[]>();

function getHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministic procedural questions when LLM is unavailable */
function generateProceduralArticleQuestions(
  title: string,
  summary: string,
  country: string,
  source: string
): EarthQuestion[] {
  const hash = getHash(title);
  const questions: EarthQuestion[] = [];

  // Question 1: Geopolitical setting
  const decoyCountries = shuffle([
    'France', 'Brazil', 'Japan', 'Canada', 'Australia', 'Germany', 'India', 'South Africa'
  ]).filter(c => c.toLowerCase() !== country.toLowerCase()).slice(0, 3);
  const q1Choices = shuffle([country, ...decoyCountries]);

  questions.push({
    id: `art-q1-${hash}`,
    country: country || 'Global',
    category: 'current-affairs',
    difficulty: 'easy',
    question: `In which nation or global region is this news story primarily centered?`,
    choices: q1Choices,
    correctIndex: q1Choices.indexOf(country),
    funFact: `The reported events took place in or significantly impact ${country}.`,
  });

  // Question 2: Source verification
  if (source && source !== 'Unknown' && source !== 'Global News') {
    const decoySources = shuffle([
      'Reuters Newsdesk', 'Associated Press wire', 'Global Times', 'Al Jazeera International', 'BBC World'
    ]).filter(s => !s.toLowerCase().includes(source.toLowerCase())).slice(0, 3);
    const q2Choices = shuffle([source, ...decoySources]);

    questions.push({
      id: `art-q2-${hash}`,
      country: country || 'Global',
      category: 'current-affairs',
      difficulty: 'medium',
      question: `Which international media outlet or wire organization reported this headline?`,
      choices: q2Choices,
      correctIndex: q2Choices.indexOf(source),
      funFact: `Verified reporting provided by ${source}.`,
    });
  }

  // Question 3: Core theme / comprehension
  const keyWords = title.split(/\s+/).filter(w => w.length > 5 && !w.toLowerCase().includes(country.toLowerCase()));
  const focusTopic = keyWords[0] || 'strategic geopolitical developments';
  const q3Choices = shuffle([
    `Events related to ${focusTopic.toLowerCase()}`,
    `Long-term historical space expeditions from the 1960s`,
    `Antarctic meteorological research expeditions`,
    `Deep-ocean submarine geological surveys`,
  ]);

  questions.push({
    id: `art-q3-${hash}`,
    country: country || 'Global',
    category: 'current-affairs',
    difficulty: 'medium',
    question: `What primary subject matter or real-world development is covered in this article?`,
    choices: q3Choices,
    correctIndex: q3Choices.findIndex(c => c.includes(focusTopic.toLowerCase())),
    funFact: `Headline synopsis: "${title}"`,
  });

  return questions;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      summary = '',
      country = 'Global',
      source = 'Global News',
      url = '',
    } = body as {
      title: string;
      summary?: string;
      country?: string;
      source?: string;
      url?: string;
    };

    if (!title) {
      return NextResponse.json({ error: 'Missing article title' }, { status: 400 });
    }

    const cacheKey = getHash(title + country);
    if (articleQuizCache.has(cacheKey)) {
      return NextResponse.json({
        questions: articleQuizCache.get(cacheKey),
        source: 'cache',
      });
    }

    // Try AI generation with OpenAI cascade
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const aiResponse = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: `You are an educational quiz creator. Given a news article, generate exactly 3 multiple choice comprehension questions to test the reader's understanding.
Return JSON strictly matching this schema:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": "Exact matching option text",
      "fact": "One sentence explanation"
    }
  ]
}`
              },
              {
                role: 'user',
                content: `Article Title: ${title}\nCountry: ${country}\nSource: ${source}\nSummary: ${summary.slice(0, 500)}`
              }
            ],
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
          if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            const questions: EarthQuestion[] = parsed.questions.map((q: any, idx: number) => {
              const options: string[] = q.options || [];
              const answer: string = q.answer || options[0] || '';
              const correctIndex = options.indexOf(answer) !== -1 ? options.indexOf(answer) : 0;
              return {
                id: `ai-art-${cacheKey}-${idx}`,
                country: country || 'Global',
                category: 'current-affairs',
                difficulty: 'medium',
                question: q.question,
                choices: options,
                correctIndex,
                funFact: q.fact || `Based on reporting by ${source}.`,
              };
            });

            articleQuizCache.set(cacheKey, questions);
            return NextResponse.json({ questions, source: 'ai-generated' });
          }
        }
      } catch (aiErr) {
        console.warn('[ArticleQuiz] AI generation failed, falling back to procedural:', aiErr);
      }
    }

    // Fallback: procedural questions
    const fallbackQuestions = generateProceduralArticleQuestions(title, summary, country, source);
    articleQuizCache.set(cacheKey, fallbackQuestions);
    return NextResponse.json({ questions: fallbackQuestions, source: 'procedural' });
  } catch (error) {
    console.error('Error generating article quiz:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
