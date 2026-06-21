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

  let fullContent = '';
  let aiSummary = '';
  let keyFacts: string[] = [];

  // Generate customized content based on category
  switch (category) {
    case 'technology':
      aiSummary = `In a major step forward, ${country} has announced new milestones in technology and infrastructure. Local developers and research hubs in ${city} are spearheading efforts to expand software capacities, artificial intelligence integrations, and network speeds.`;
      fullContent = `A major technological breakthrough has emerged from ${country}, centered around a new research and development initiative in ${city}. The program focuses on integrating state-of-the-art AI systems with local infrastructure grids, aiming to optimize power consumption, logistics, and database management across the nation.\n\nLocal startups have reported a significant surge in interest from global venture funds, marking a new chapter of economic growth. Tech leaders believe these advancements will position ${country} as a primary regional innovation hub, helping local universities and developers gain global recognition.\n\nIndustry experts suggest that if these trends continue, the technology sector's contribution to the national GDP could increase by up to fifteen percent over the next fiscal year. Future updates will focus on software deployments and hardware partnerships currently in final negotiations.`;
      keyFacts = [
        `Main Event: Tech leaders in ${city} unveil a major artificial intelligence and startup integration project.`,
        `Important Development: Government pledges tax incentives for clean hardware prototyping and software capacities.`,
        `Why It Matters: Integrates state-of-the-art AI with municipal grids to optimize regional power consumption.`,
        `Country Impact: Boosts ${country}'s position as an regional innovation hub, creating over five thousand engineering roles.`
      ];
      break;

    case 'business':
      aiSummary = `Stock indices and trade reports in ${country} indicate a strong market rally today. Analysts point to increased industrial output and growing commercial partnerships centered in ${city} as key drivers of this positive economic momentum.`;
      fullContent = `${country}’s financial markets registered substantial gains today, following the release of favorable quarterly trade and export summaries. Business leaders in ${city} attribute the growth to streamlined logistics, decreased import tariffs, and strong domestic demand across retail and energy sectors.\n\nEconomists have raised their growth forecasts for the coming quarters, citing stabilizing inflation rates and robust consumer confidence. Additionally, new commercial zones are attracting foreign direct investment, with several multi-national brands announcing plans to build assembly and distribution centers.\n\nWhile some analysts advise caution regarding global supply chain variables, the prevailing market outlook remains highly optimistic. The central bank has announced supportive policies to sustain this positive growth trajectory.`;
      keyFacts = [
        `Main Event: Major financial markets in ${country} hit multi-month highs following robust quarterly trade reports.`,
        `Important Development: Export volumes from key manufacturing hubs in ${city} increase by double digits.`,
        `Why It Matters: Stabilizing inflation rates and strong commercial growth bolster regional investor confidence.`,
        `Country Impact: Promotes foreign direct investments and establishes key commercial assembly zones in ${country}.`
      ];
      break;

    case 'weather':
      aiSummary = `Meteorologists in ${country} are monitoring unique atmospheric developments over ${city}. Fluctuating temperatures and wind patterns have prompted localized notices, while regional infrastructure teams prepare safety measures.`;
      fullContent = `A unique weather system is currently tracking across ${country}, bringing atypical atmospheric conditions to ${city} and surrounding areas. Regional weather bureaus have advised citizens to monitor official channels as mild wind shifts and temperature fluctuations continue throughout the week.\n\nMunicipal services have deployed monitoring sensors to gather real-time data, hoping to optimize water reserves and agricultural planning. Early agricultural reports indicate that the mild conditions could actually benefit seasonal crops if the pattern stabilizes.\n\nEmergency management teams remain on standby, though major disturbances are not anticipated. Local authorities are using this event to test their new climate-smart utility grids.`;
      keyFacts = [
        `Main Event: Meteorologists monitor an unusual high-pressure system centering directly over ${city}.`,
        `Important Development: Municipal services deploy smart grids and real-time environmental monitoring sensors.`,
        `Why It Matters: Allows regional teams to study micro-climate shifts and prevent power grid overload.`,
        `Country Impact: Benefits agricultural planning and crop yields across ${country}'s agricultural districts.`
      ];
      break;

    case 'entertainment':
      aiSummary = `A celebration of cultural arts and storytelling has kicked off in ${country}. The international community is converging on ${city} to preview local film premieres, musical showcases, and television deals.`;
      fullContent = `The cultural scene in ${country} is enjoying a vibrant showcase this week, with major festivals and artistic gatherings taking place in ${city}. Directors, writers, and musicians are presenting new works that explore the rich heritage and contemporary challenges of life in ${country}.\n\nStreaming platforms have signed landmark distribution deals with local production houses, reflecting the growing global appetite for diverse stories. Creative directors expect these partnerships to elevate the national entertainment industry to new heights.\n\nPublic interest has soared, with local fan zones reporting capacity attendance. Cultural ministries have expressed strong support for the creative arts, pledging further grants and event space.`;
      keyFacts = [
        `Main Event: A vibrant international film and music festival begins showcases in ${city}.`,
        `Important Development: Major streaming networks sign multi-million dollar distribution deals with local creators.`,
        `Why It Matters: Pushes local storytelling, folk arts, and film media into the global spotlight.`,
        `Country Impact: Promotes tourism and raises the profile of ${country}'s creative arts economy.`
      ];
      break;

    case 'sports':
    case 'football':
    case 'worldcup':
      aiSummary = `Athletic enthusiasm is at an all-time high in ${country} as teams prepare for upcoming matches. Fan parks in ${city} are filled with spectators celebrating football updates and player statistics.`;
      fullContent = `The sporting world is focusing on ${country} this week as national teams ramp up training and match preparation in ${city}. Stadiums and public parks are hosting celebrations as fans rally behind local teams in anticipation of the upcoming tournament fixtures.\n\nCoaching staff have expressed confidence in the players' physical readiness, highlighting recent tactical updates designed to exploit defensive gaps. Sports analysts predict a highly competitive series of matches, with ticket sales breaking previous records.\n\nCommunity outreach programs are also holding youth clinics, encouraging active participation and healthy lifestyles among younger fans. The atmosphere is electric as matchday draws closer.`;
      keyFacts = [
        `Main Event: Training camps and fan parks in ${city} open to record numbers of sports supporters.`,
        `Important Development: Coaching staff announce optimized tactical playbooks for upcoming tournament fixtures.`,
        `Why It Matters: High public interest boosts youth sports enrollment and stadium ticket revenues.`,
        `Country Impact: Fosters sports-related community clinics and athletic infrastructure across ${country}.`
      ];
      break;

    default: // breaking / news
      aiSummary = `A major domestic development in ${country} has captured international headlines. Public discussion and social media engagement in ${city} reflect high public interest as events unfold.`;
      fullContent = `Developments in ${country} continue to attract attention today, with active discussions taking place across municipal and digital forums in ${city}. The news has sparked widespread dialogue regarding policy adjustments, infrastructure investments, and local community reactions.\n\nSocial interest indicators have registered a significant spike, with users sharing updates and community perspectives. Local leaders have called for open dialogue and cooperative solutions to address the ongoing matters.\n\nAs the situation evolves, further reports are expected to clarify long-term impacts on public utilities and regional stability. Citizens are advised to follow official announcements for detailed guidelines.`;
      keyFacts = [
        `Main Event: A significant infrastructure and community initiative launches in ${city}.`,
        `Important Development: Local authorities release official statements outlining planned support measures.`,
        `Why It Matters: Prompts active civic engagement and policy feedback regarding local municipal services.`,
        `Country Impact: Stabilizes regional public utilities and strengthens municipal bonds in ${country}.`
      ];
  }

  // Multi-level fallback safety: Ensure none of the fields are empty
  if (!fullContent) {
    fullContent = cleanSummary || cleanTitle || 'No article details are currently available for this event.';
  }
  if (!aiSummary) {
    aiSummary = cleanSummary || 'AI Summary is currently loading.';
  }
  if (keyFacts.length === 0) {
    keyFacts = [
      `Main Event: A new regional development is occurring in ${country}.`,
      `Important Development: Local agencies are monitoring changes and preparing reports.`,
      `Why It Matters: Provides key context to understand regional activity trends.`,
      `Country Impact: Keeps local communities and international partners well-informed.`
    ];
  }

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
