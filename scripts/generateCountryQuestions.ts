// ============================================================
// Play Earth — CLI Country Question Pre-Generation System
// ============================================================
// Run with: npx tsx scripts/generateCountryQuestions.ts [CountryName]
// Auto-generates high-quality questions for countries and writes them to folder-based JSON database.

import * as fs from 'fs';
import * as path from 'path';
import { getCanonicalCountryName } from '../src/data/questions/index';

// Custom lightweight environment loader for .env.local (removes dotenv dependency)
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        const val = trimmed.substring(index + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

// Load environment variables
loadEnvLocal();

const QUESTIONS_DIR = path.resolve(process.cwd(), 'src/data/questions/questions');
const API_URL = 'https://api.openai.com/v1/chat/completions';

const PRESET_COUNTRIES = [
  'Japan', 'Brazil', 'India', 'United States', 'United Kingdom',
  'France', 'Germany', 'Italy', 'Spain', 'China', 'Australia',
  'Canada', 'Mexico', 'Egypt', 'South Africa', 'Argentina',
  'Russia', 'South Korea', 'Saudi Arabia', 'Turkey', 'Iran',
  'Netherlands', 'Sweden', 'Switzerland', 'Nigeria', 'Kenya'
];

const CATEGORIES = [
  'geography', 'sports', 'history', 'science', 'current-affairs'
];

function getQuestionHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

async function generateQuestionForCountry(country: string, category: string, apiKey: string): Promise<any> {
  const response = await fetch(API_URL, {
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
          content: `Generate a multiple choice question about "${country}".
Category: ${category}
Difficulty: medium
Ensure the question, options, answer, and fact are 100% focused on ${country}. Do not reference other countries unless directly relevant as comparison.`
        }
      ],
      temperature: 0.85,
      max_tokens: 300,
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API returned status ${response.status}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(rawContent);

  const options: string[] = parsed.options || [];
  const answer: string = parsed.answer || '';
  
  if (options.length !== 4 || !options.includes(answer)) {
    throw new Error('Invalid options/answer schema returned by OpenAI');
  }

  return parsed;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: OPENAI_API_KEY environment variable is not defined in .env.local');
    process.exit(1);
  }

  // Determine countries to generate for (either from CLI args or default list)
  const args = process.argv.slice(2);
  const targetCountries = args.length > 0 ? [args.join(' ')] : PRESET_COUNTRIES;

  console.log(`Starting pre-generation pipeline...`);
  console.log(`Target countries: ${targetCountries.join(', ')}`);
  console.log(`Categories: ${CATEGORIES.join(', ')}\n`);

  let generatedCount = 0;

  for (const country of targetCountries) {
    const canonicalCountry = getCanonicalCountryName(country);
    console.log(`--------------------------------------------------`);
    console.log(`🌍 Generating questions for country: ${canonicalCountry}`);
    console.log(`--------------------------------------------------`);

    const countryDir = path.join(QUESTIONS_DIR, canonicalCountry);
    if (!fs.existsSync(countryDir)) {
      fs.mkdirSync(countryDir, { recursive: true });
    }

    for (const category of CATEGORIES) {
      console.log(`🛰️ Generating: Category [${category}]...`);
      try {
        const questionData = await generateQuestionForCountry(canonicalCountry, category, apiKey);
        
        const qHash = getQuestionHash(questionData.question);
        const questionId = `ai-${canonicalCountry.toLowerCase().replace(/[^a-z]/g, '')}-${category}-${qHash}`;

        // Map to folder files
        let targetCategory = category;
        if (category === 'technology' || category === 'space' || category === 'science') {
          targetCategory = 'science';
        } else if (category === 'politics' || category === 'current-affairs') {
          targetCategory = 'current-affairs';
        } else if (category !== 'geography' && category !== 'sports' && category !== 'history') {
          targetCategory = 'mixed';
        }

        const filePath = path.join(countryDir, `${targetCategory}.json`);
        let questionsList: any[] = [];
        if (fs.existsSync(filePath)) {
          try {
            questionsList = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          } catch (e) {}
        }

        // Check if it already exists
        const exists = questionsList.some(
          (q: any) => q.question.toLowerCase().trim() === questionData.question.toLowerCase().trim()
        );

        if (exists) {
          console.log(`⚠️ Question already exists in database file. Skipping.`);
          continue;
        }

        const newQuestion = {
          id: questionId,
          country: canonicalCountry,
          category: targetCategory,
          difficulty: questionData.difficulty || 'medium',
          question: questionData.question,
          choices: questionData.options,
          correctIndex: questionData.options.indexOf(questionData.answer),
          funFact: questionData.fact || ''
        };

        questionsList.push(newQuestion);
        fs.writeFileSync(filePath, JSON.stringify(questionsList, null, 2), 'utf-8');

        // Also update mixed.json
        if (targetCategory !== 'mixed') {
          const mixedPath = path.join(countryDir, 'mixed.json');
          let mixedList: any[] = [];
          if (fs.existsSync(mixedPath)) {
            try {
              mixedList = JSON.parse(fs.readFileSync(mixedPath, 'utf-8'));
            } catch (e) {}
          }
          if (!mixedList.some((q: any) => q.question.toLowerCase().trim() === newQuestion.question.toLowerCase().trim())) {
            mixedList.push(newQuestion);
            fs.writeFileSync(mixedPath, JSON.stringify(mixedList, null, 2), 'utf-8');
          }
        }
        
        console.log(`✅ Success: "${newQuestion.question.substring(0, 50)}..."`);
        generatedCount++;

        // Add a slight delay between requests to be polite to the API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err: any) {
        console.error(`❌ Failed to generate for ${canonicalCountry} - ${category}:`, err.message);
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`Pipeline complete. Generated and cached ${generatedCount} new questions.`);
  console.log(`==================================================`);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
