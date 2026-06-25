import { WorldEvent } from '@/types';

export interface ArticleDetails {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  country: string;
  category: string;
  aiSummary: string;
  fullContent: string;
  keyFacts: string[];
  author?: string;
  image?: string;
  description?: string;
}

// Curated premium images for each category
export const CATEGORY_IMAGES: Record<string, string> = {
  breaking: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800',
  sports: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
  football: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
  worldcup: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=800',
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800',
  weather: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=800',
  business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800',
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800'
};

const AUTHORS_LIST = [
  'Elena Rostova', 'Marcus Vance', 'Sarah Jenkins', 'David Chen',
  'Amara Diop', 'Kenji Sato', 'Sofia Gatti', 'Carlos Mendez'
];

function getDeterministicAuthor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AUTHORS_LIST.length;
  return AUTHORS_LIST[idx];
}

// Server-side in-memory cache for expanded articles
const articleCache = new Map<string, ArticleDetails>();

/**
 * Normalizes text to fix common RSS formatting errors, run-together words,
 * poor spacing, and sentence merging.
 */
export function cleanText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remove raw HTML tags if any remain
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');

  // 2. Fix run-together sentences like "word.Next" or "orders.Online" (lowercase letter, dot, uppercase letter)
  cleaned = cleaned.replace(/([a-z])\.([A-Z])/g, '$1. $2');

  // 3. Fix merged commas like "word,next" or "news,development"
  cleaned = cleaned.replace(/([a-z]),([a-zA-Z])/g, '$1, $2');

  // 4. Fix common run-together publisher names
  cleaned = cleaned.replace(/\bAP\s*News([A-Z]|\b)/g, 'AP News $1');
  cleaned = cleaned.replace(/ReutersNews/g, 'Reuters News');
  cleaned = cleaned.replace(/YahooNews/g, 'Yahoo News');
  cleaned = cleaned.replace(/BBCNews/g, 'BBC News');
  cleaned = cleaned.replace(/CNNNews/g, 'CNN News');

  // 5. Normalise multiple whitespace characters
  cleaned = cleaned.replace(/\s+/g, ' ');

  // 6. Clean duplicate sentences (sometimes GNews concatenates title + snippet)
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  const uniqueSentences: string[] = [];
  const seen = new Set<string>();

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    
    // Simple deduplication of nearly identical sentences
    let isDuplicate = false;
    for (const existing of seen) {
      if (existing.includes(lower) || lower.includes(existing)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      uniqueSentences.push(trimmed);
      seen.add(lower);
    }
  }

  cleaned = uniqueSentences.join(' ');

  return cleaned.trim();
}

/**
 * Generates procedural template-based article content as a high-quality fallback
 * when OpenAI is offline, rate-limited, or unauthorized.
 */
function generateProceduralArticle(
  id: string,
  title: string,
  summary: string,
  country: string,
  category: string,
  source: string,
  publishedAt: string
): ArticleDetails {
  const cleanTitle = cleanText(title);
  const cleanSummary = cleanText(summary);

  // Derive city from title/summary or fallback to Capital City
  const cityMatch = summary.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  const city = cityMatch ? cityMatch[1] : 'Capital City';

  const mainEventText = cleanSummary || cleanTitle;
  
  // Category-specific descriptors to enrich context
  let categoryTheme = 'ongoing development';
  let categoryFocus = 'assessing safety protocols and operational updates';
  let impactArea = 'local community preparedness';

  switch (category) {
    case 'technology':
      categoryTheme = 'technological development';
      categoryFocus = 'evaluating system capabilities, research data, and technology frameworks';
      impactArea = 'digital infrastructure and technical standards';
      break;
    case 'business':
      categoryTheme = 'economic development';
      categoryFocus = 'monitoring trade indicators, market responses, and supply chain reports';
      impactArea = 'commercial activities and regional trade dynamics';
      break;
    case 'weather':
      categoryTheme = 'meteorological conditions';
      categoryFocus = 'tracking atmospheric sensors, localized patterns, and safety notices';
      impactArea = 'environmental resilience and public utilities';
      break;
    case 'entertainment':
      categoryTheme = 'cultural and media updates';
      categoryFocus = 'analyzing public response, cultural outreach, and media coverage';
      impactArea = 'creative industries and public engagement';
      break;
    case 'sports':
    case 'football':
    case 'worldcup':
      categoryTheme = 'athletic updates';
      categoryFocus = 'assessing squad preparation, match organization, and fan engagement';
      impactArea = 'sports infrastructure and tournament operations';
      break;
    default:
      categoryTheme = 'key development';
      categoryFocus = 'assessing the situation and coordinating immediate response plans';
      impactArea = 'regional safety and public communications';
  }

  // Create dynamic, highly relevant paragraphs using the title, snippet, and category details
  const introParagraph = `${mainEventText} This ${categoryTheme} has quickly drawn international attention and sparked extensive discussions both locally and globally.`;
  const contextParagraph = `Reports from ${country} indicate that local authorities and key organizations are actively involved, with teams in ${city === 'Capital City' ? country : city} currently ${categoryFocus}. As updates continue to come in, leaders are focusing on immediate protocols to ensure public information remains clear and accurate.`;
  const discussionParagraph = `Public sentiment and social media indicators show a high level of civic engagement, with citizens sharing real-time perspectives and local updates. Discussions have centered around the immediate impact on ${impactArea}, local services, and the next steps needed to manage the situation effectively.`;
  const futureParagraph = `As the situation stabilizes, further detailed assessments are expected from regional officials to outline long-term measures and support strategies. Citizens are advised to follow official announcements and verified channels for the latest guidelines.`;

  const fullContent = `${introParagraph}\n\n${contextParagraph}\n\n${discussionParagraph}\n\n${futureParagraph}`;
  const aiSummary = cleanSummary 
    ? `${cleanSummary} This ${categoryTheme} has prompted local response measures and active public discussion regarding safety and next steps.`
    : `A key ${categoryTheme} has emerged in ${country}: "${cleanTitle}". Local authorities are monitoring the situation and assessing immediate impacts.`;

  const keyFacts: string[] = [
    `Main Event: ${cleanTitle}`,
    `Important Development: Local teams in ${city === 'Capital City' ? country : city} initiate response protocols and active monitoring.`,
    `Why It Matters: Attracts widespread public attention and highlights the importance of rapid, accurate regional updates.`,
    `Country Impact: Prompts active community support and utility readiness to maintain stability in ${country}.`
  ];

  const author = getDeterministicAuthor(id || title);
  const image = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.breaking;

  return {
    id,
    title: cleanTitle,
    source: cleanText(source),
    publishedAt,
    country,
    category,
    aiSummary,
    fullContent,
    keyFacts,
    author,
    image,
    description: cleanSummary
  };
}

function parseJsonContent(text: string): any {
  try {
    let jsonStr = text.trim();
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    return JSON.parse(jsonStr);
  } catch (e: any) {
    console.error('[ArticleService] JSON parse error:', e.message, 'Raw text head:', text.substring(0, 150));
    return null;
  }
}

async function generateWithGemini20(apiKey: string, prompt: string): Promise<any> {
  try {
    console.log('[ArticleService] Generating article with Gemini 2.0 Flash...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 4096
        }
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ArticleService] Gemini 2.0 returned ${response.status}: ${errText.substring(0, 150)}`);
      return null;
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return parseJsonContent(text);
  } catch (err: any) {
    console.error('[ArticleService] Gemini 2.0 failed:', err.message);
    return null;
  }
}

async function generateWithGeminiLatest(apiKey: string, prompt: string): Promise<any> {
  try {
    console.log('[ArticleService] Generating article with Gemini Flash Latest...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 4096
        }
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ArticleService] Gemini Latest returned ${response.status}: ${errText.substring(0, 150)}`);
      return null;
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return parseJsonContent(text);
  } catch (err: any) {
    console.error('[ArticleService] Gemini Latest failed:', err.message);
    return null;
  }
}

async function generateWithOpenAI(apiKey: string, prompt: string): Promise<any> {
  try {
    console.log('[ArticleService] Generating article with OpenAI gpt-3.5-turbo...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI news assistant that generates structured JSON article content. You never output conversational text or markdown codeblocks, only raw JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ArticleService] OpenAI returned ${response.status}: ${errText.substring(0, 150)}`);
      return null;
    }

    const data = await response.json();
    const textResult = data.choices?.[0]?.message?.content?.trim() || '';
    return parseJsonContent(textResult);
  } catch (err: any) {
    console.error('[ArticleService] OpenAI failed:', err.message);
    return null;
  }
}

/**
 * Fetches, cleans, and enriches article content. Uses cascading Gemini 2.0 Flash,
 * Gemini Flash Latest, and OpenAI gpt-3.5-turbo to expand snippets into detailed articles,
 * falling back to procedural templates if offline.
 */
export async function fetchOrGenerateArticleDetails(
  id: string,
  url: string,
  title: string,
  summary: string,
  country: string,
  category: string,
  publishedAt: string
): Promise<ArticleDetails> {
  const cacheKey = id || url || title;
  
  if (articleCache.has(cacheKey)) {
    return articleCache.get(cacheKey)!;
  }

  const cleanTitle = cleanText(title);
  const cleanSummary = cleanText(summary);

  const prompt = `
    You are an elite research journalist and premium news expansion engine for MooEarth Live. 
    Take the following news snippet and expand it into a comprehensive, highly accurate, and deeply informative article reading experience.
    
    TITLE: ${cleanTitle}
    SNIPPET: ${cleanSummary}
    COUNTRY: ${country}
    CATEGORY: ${category}

    Generate a JSON response containing:
    1. "aiSummary": A detailed 2-3 paragraph summary of the event. Provide concrete background details, timeline context, and clear explanations. Fix any typos or run-together words.
    2. "fullContent": A substantial, in-depth 4-6 paragraph detailed article writeup. Include regional impact analysis, geopolitical or economic context, testimonials or perspectives (if applicable), and expected future developments. Make the content rich, informative, and extensive (at least 500-600 words).
    3. "keyFacts": An array of exactly 4-6 concise bullet points containing crucial takeaways. Each bullet point MUST cover exactly one of the following aspects in order:
       - Main event (e.g. "Main Event: [description]")
       - Important development (e.g. "Important Development: [description]")
       - Why it matters (e.g. "Why It Matters: [description]")
       - Country impact (e.g. "Country Impact: [description]")
    4. "author": A realistic reporter or editorial team name.

    OUTPUT FORMAT:
    You must respond with raw, valid JSON only conforming to the schema. Do not write conversational text or wrap in markdown blocks.
    JSON structure:
    {
      "aiSummary": "paragraph 1\\n\\nparagraph 2",
      "fullContent": "paragraph 1\\n\\nparagraph 2\\n\\nparagraph 3\\n\\nparagraph 4\\n\\nparagraph 5",
      "keyFacts": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
      "author": "Reporter Name"
    }
  `;

  let parsed: any = null;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // 1. Try Gemini 2.0 Flash
  if (geminiApiKey) {
    parsed = await generateWithGemini20(geminiApiKey, prompt);
    
    // 2. Try Gemini Flash Latest
    if (!parsed) {
      parsed = await generateWithGeminiLatest(geminiApiKey, prompt);
    }
  }

  // 3. Try OpenAI gpt-3.5-turbo
  if (!parsed && openaiApiKey) {
    parsed = await generateWithOpenAI(openaiApiKey, prompt);
  }

  // Handle successful generation
  if (parsed && parsed.aiSummary && parsed.fullContent && Array.isArray(parsed.keyFacts)) {
    const details: ArticleDetails = {
      id,
      title: cleanTitle,
      source: cleanText(url),
      publishedAt,
      country,
      category,
      aiSummary: cleanText(parsed.aiSummary),
      fullContent: cleanText(parsed.fullContent),
      keyFacts: parsed.keyFacts.map((fact: string) => cleanText(fact)),
      author: parsed.author ? cleanText(parsed.author) : getDeterministicAuthor(id || title),
      image: CATEGORY_IMAGES[category] || CATEGORY_IMAGES.breaking,
      description: cleanSummary
    };

    articleCache.set(cacheKey, details);
    return details;
  }

  // 4. Procedural fallback
  console.warn(`[ArticleService] AI article expansion failed or timed out for "${title}". Triggering procedural fallback.`);
  const fallbackDetails = generateProceduralArticle(
    id,
    title,
    summary,
    country,
    category,
    url,
    publishedAt
  );

  articleCache.set(cacheKey, fallbackDetails);
  return fallbackDetails;
}
