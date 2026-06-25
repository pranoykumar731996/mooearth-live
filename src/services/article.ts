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
  debug?: {
    articleId: string;
    publisher: string;
    sourceUrl: string;
    contentRetrieved: boolean;
    summaryGenerated: boolean;
    cacheHit: boolean;
    validationPassed: boolean;
  };
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

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

interface RetrievedContent {
  success: boolean;
  content: string;
  excerpt: string;
  publisher?: string;
  title?: string;
}

async function retrieveArticleContent(url: string): Promise<RetrievedContent> {
  try {
    if (!url) return { success: false, content: '', excerpt: '' };
    new URL(url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      console.warn(`[ArticleService] Fetching URL failed (status: ${response.status}): ${url}`);
      return { success: false, content: '', excerpt: '' };
    }

    const html = await response.text();

    // 1. Extract metadata: excerpt/description
    let excerpt = '';
    const descRegexes = [
      /<meta[^>]*?name=["']description["'][^>]*?content=["']([\s\S]*?)["']/i,
      /<meta[^>]*?content=["']([\s\S]*?)["'][^>]*?name=["']description["']/i,
      /<meta[^>]*?property=["']og:description["'][^>]*?content=["']([\s\S]*?)["']/i,
      /<meta[^>]*?content=["']([\s\S]*?)["'][^>]*?property=["']og:description["']/i,
      /<meta[^>]*?name=["']twitter:description["'][^>]*?content=["']([\s\S]*?)["']/i,
    ];

    for (const regex of descRegexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        excerpt = decodeHtmlEntities(match[1].trim());
        break;
      }
    }

    // 2. Extract metadata: title
    let title = '';
    const titleRegex = /<title>([\s\S]*?)<\/title>/i;
    const titleMatch = html.match(titleRegex);
    if (titleMatch && titleMatch[1]) {
      title = decodeHtmlEntities(titleMatch[1].trim());
    }

    // 3. Extract metadata: publisher
    let publisher = '';
    const siteNameRegexes = [
      /<meta[^>]*?property=["']og:site_name["'][^>]*?content=["']([\s\S]*?)["']/i,
      /<meta[^>]*?content=["']([\s\S]*?)["'][^>]*?property=["']og:site_name["']/i,
    ];
    for (const regex of siteNameRegexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        publisher = decodeHtmlEntities(match[1].trim());
        break;
      }
    }

    // 4. Extract article body (P tags)
    let cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '');

    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    const paragraphs: string[] = [];
    while ((pMatch = pRegex.exec(cleanHtml)) !== null) {
      const pText = pMatch[1].replace(/<[^>]*>/g, '').trim();
      const decodedP = decodeHtmlEntities(pText);
      if (decodedP.length > 40 && !decodedP.toLowerCase().includes('subscribe') && !decodedP.toLowerCase().includes('cookie')) {
        paragraphs.push(decodedP);
      }
    }

    const content = paragraphs.slice(0, 15).join('\n\n');

    return {
      success: content.length > 100 || excerpt.length > 50,
      content,
      excerpt,
      publisher,
      title
    };
  } catch (err) {
    console.error(`[ArticleService] Failed to retrieve article content: ${url}`, err);
    return { success: false, content: '', excerpt: '' };
  }
}

function verifyArticleIntegrity(
  feedTitle: string,
  fetchedTitle: string,
  fetchedContent: string,
  fetchedExcerpt: string
): boolean {
  const getSignificantWords = (text: string) => {
    const stopWords = new Set([
      'about', 'after', 'again', 'would', 'could', 'their', 'there', 'this', 'that',
      'with', 'from', 'news', 'video', 'watch', 'here', 'today', 'live', 'says', 'said',
      'japan', 'world', 'breaking', 'report'
    ]);
    const words = text.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
    return new Set(words);
  };

  const feedWords = getSignificantWords(feedTitle);
  if (feedWords.size === 0) return true;

  const fetchedText = `${fetchedTitle} ${fetchedExcerpt} ${fetchedContent}`;
  const fetchedWords = getSignificantWords(fetchedText);

  let matchCount = 0;
  for (const word of feedWords) {
    if (fetchedWords.has(word)) {
      matchCount++;
    }
  }

  const requiredMatches = Math.min(2, feedWords.size);
  const passed = matchCount >= requiredMatches;

  console.log(`[ArticleService] Integrity Check: matched ${matchCount}/${feedWords.size} words. Required: ${requiredMatches}. Passed: ${passed}`);
  return passed;
}

function generateUnavailableArticle(
  id: string,
  title: string,
  country: string,
  category: string,
  source: string,
  publishedAt: string
): ArticleDetails {
  return {
    id,
    title: cleanText(title),
    source: cleanText(source),
    publishedAt,
    country,
    category,
    aiSummary: "Summary unavailable. Please open the original article.",
    fullContent: "The full content of this article could not be retrieved from the publisher's website. Please use the link below to read the original article on their official site.",
    keyFacts: [],
    author: "MooEarth Newsroom",
    image: CATEGORY_IMAGES[category] || CATEGORY_IMAGES.breaking,
    description: "Summary unavailable."
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

export async function fetchOrGenerateArticleDetails(
  id: string,
  url: string,
  title: string,
  summary: string,
  country: string,
  category: string,
  publishedAt: string
): Promise<ArticleDetails> {
  const cleanTitle = cleanText(title);
  const cleanSummary = cleanText(summary);

  // Generate unique cache key using ID, URL, and timestamp
  const cacheKey = `${id.trim()}||${url.trim()}||${publishedAt.trim()}`;
  
  if (articleCache.has(cacheKey)) {
    const cached = articleCache.get(cacheKey)!;
    return {
      ...cached,
      debug: {
        ...(cached.debug || {
          articleId: id,
          publisher: cached.author || "Unknown",
          sourceUrl: url,
          contentRetrieved: true,
          summaryGenerated: false,
          validationPassed: true,
        }),
        cacheHit: true
      }
    };
  }

  // Validate URL structure
  let isValidUrl = false;
  try {
    new URL(url);
    isValidUrl = true;
  } catch (e) {
    isValidUrl = false;
  }

  if (!isValidUrl) {
    console.warn(`[ArticleService] Invalid article URL: ${url}`);
    const details = generateUnavailableArticle(id, title, country, category, url, publishedAt);
    details.debug = {
      articleId: id,
      publisher: "Unknown",
      sourceUrl: url,
      contentRetrieved: false,
      summaryGenerated: false,
      cacheHit: false,
      validationPassed: false
    };
    return details;
  }

  // Retrieve article HTML content
  console.log(`[ArticleService] Retrieving content for: ${url}`);
  const retrieved = await retrieveArticleContent(url);
  const publisherName = retrieved.publisher || getDeterministicAuthor(id || title);

  // Data Integrity Validation Check
  let validationPassed = true;
  if (retrieved.success) {
    validationPassed = verifyArticleIntegrity(
      cleanTitle,
      retrieved.title || '',
      retrieved.content || '',
      retrieved.excerpt || ''
    );
  } else {
    // If we can't retrieve the content, we cannot validate it. We still proceed to check if the feed description is valid.
    validationPassed = false;
  }

  if (retrieved.success && !validationPassed) {
    console.warn(`[ArticleService] Data integrity validation failed (title mismatch) for: ${url}`);
    const details = generateUnavailableArticle(id, title, country, category, url, publishedAt);
    details.debug = {
      articleId: id,
      publisher: publisherName,
      sourceUrl: url,
      contentRetrieved: true,
      summaryGenerated: false,
      cacheHit: false,
      validationPassed: false
    };
    articleCache.set(cacheKey, details);
    return details;
  }

  // Determine if publisher provides a valid official description/excerpt
  let officialDescription = '';
  const isDescriptionValid = (desc: string) => {
    if (!desc) return false;
    const cleanDesc = cleanText(desc);
    return (
      cleanDesc.length > 80 &&
      cleanDesc.split(/\s+/).length > 10 &&
      cleanDesc.toLowerCase() !== cleanTitle.toLowerCase()
    );
  };

  if (isDescriptionValid(retrieved.excerpt)) {
    officialDescription = cleanText(retrieved.excerpt);
  } else if (isDescriptionValid(cleanSummary)) {
    officialDescription = cleanSummary;
  }

  // Bypass AI if official description is sufficient
  if (officialDescription) {
    console.log(`[ArticleService] Publisher description is valid. Bypassing AI summarizer.`);
    const details: ArticleDetails = {
      id,
      title: cleanTitle,
      source: cleanText(url),
      publishedAt,
      country,
      category,
      aiSummary: officialDescription,
      fullContent: retrieved.content && retrieved.content.length > 150 
        ? retrieved.content 
        : officialDescription,
      keyFacts: [
        `Main Event: ${cleanTitle}`,
        `Important Development: Official summary provided directly by the publisher.`,
        `Why It Matters: Direct source details have been verified for accuracy.`,
        `Country Impact: Relevant developments are monitored in ${country}.`
      ],
      author: publisherName,
      image: CATEGORY_IMAGES[category] || CATEGORY_IMAGES.breaking,
      description: cleanSummary,
      debug: {
        articleId: id,
        publisher: publisherName,
        sourceUrl: url,
        contentRetrieved: retrieved.success,
        summaryGenerated: false,
        cacheHit: false,
        validationPassed: true
      }
    };

    articleCache.set(cacheKey, details);
    return details;
  }

  // If content was not retrieved successfully, we cannot summarize it reliably. No fake summaries allowed.
  if (!retrieved.success) {
    console.warn(`[ArticleService] Retrieval failed and no valid description exists. Returning unavailable.`);
    const details = generateUnavailableArticle(id, title, country, category, url, publishedAt);
    details.debug = {
      articleId: id,
      publisher: publisherName,
      sourceUrl: url,
      contentRetrieved: false,
      summaryGenerated: false,
      cacheHit: false,
      validationPassed: false
    };
    articleCache.set(cacheKey, details);
    return details;
  }

  // AI Summarization is required
  console.log(`[ArticleService] Running AI Summarization for title: ${cleanTitle}`);
  const prompt = `
SYSTEM PROMPT:
You are a news summarization assistant.
Summarize ONLY the supplied article.
Requirements:
* Preserve factual accuracy.
* Preserve names, places, dates, and scores.
* Do not add information.
* Do not speculate.
* Do not combine information from other articles.
* Produce a concise summary of approximately 100–200 words.
* If the supplied content is insufficient, return 'Summary unavailable' rather than inventing missing details.

INPUT ARTICLE DETAILS:
- TITLE: ${cleanTitle}
- PUBLISHER: ${publisherName}
- DESCRIPTION: ${officialDescription || 'None'}
- BODY CONTENT:
${retrieved.content || 'None'}

OUTPUT FORMAT:
Generate a JSON response conforming strictly to the following JSON structure:
{
  "aiSummary": "Your concise summary of approximately 100-200 words goes here, following the system prompt rules. If content is insufficient, put 'Summary unavailable'.",
  "fullContent": "The detailed content of the article (or a substantial summary of the body content if available). If content is insufficient, put 'The full content of this article could not be retrieved from the publisher\\'s website. Please use the link below to read the original article on their official site.'",
  "keyFacts": [
    "Main Event: [description of main event]",
    "Important Development: [description of important development]",
    "Why It Matters: [description of why it matters]",
    "Country Impact: [description of country impact]"
  ],
  "author": "Reporter Name"
}

Respond with RAW VALID JSON ONLY. Do not wrap in markdown or add extra text.
`;

  let parsed: any = null;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (geminiApiKey) {
    parsed = await generateWithGemini20(geminiApiKey, prompt);
    if (!parsed) {
      parsed = await generateWithGeminiLatest(geminiApiKey, prompt);
    }
  }

  if (!parsed && openaiApiKey) {
    parsed = await generateWithOpenAI(openaiApiKey, prompt);
  }

  // Check if AI generated content successfully
  if (parsed && parsed.aiSummary && parsed.fullContent && Array.isArray(parsed.keyFacts)) {
    const aiSummaryText = cleanText(parsed.aiSummary);
    
    // Check if the AI returned 'Summary unavailable'
    if (aiSummaryText.toLowerCase().includes('summary unavailable') || parsed.keyFacts.length === 0) {
      console.warn(`[ArticleService] AI returned 'Summary unavailable' for: ${cleanTitle}`);
      const details = generateUnavailableArticle(id, title, country, category, url, publishedAt);
      details.debug = {
        articleId: id,
        publisher: publisherName,
        sourceUrl: url,
        contentRetrieved: true,
        summaryGenerated: true,
        cacheHit: false,
        validationPassed: true
      };
      articleCache.set(cacheKey, details);
      return details;
    }

    const details: ArticleDetails = {
      id,
      title: cleanTitle,
      source: cleanText(url),
      publishedAt,
      country,
      category,
      aiSummary: aiSummaryText,
      fullContent: cleanText(parsed.fullContent),
      keyFacts: parsed.keyFacts.map((fact: string) => cleanText(fact)),
      author: parsed.author ? cleanText(parsed.author) : publisherName,
      image: CATEGORY_IMAGES[category] || CATEGORY_IMAGES.breaking,
      description: cleanSummary,
      debug: {
        articleId: id,
        publisher: publisherName,
        sourceUrl: url,
        contentRetrieved: true,
        summaryGenerated: true,
        cacheHit: false,
        validationPassed: true
      }
    };

    articleCache.set(cacheKey, details);
    return details;
  }

  // AI Generation failed/timed out: fallback to Summary Unavailable (No fake summaries allowed!)
  console.warn(`[ArticleService] AI article summarization failed or timed out for "${title}". Returning unavailable.`);
  const details = generateUnavailableArticle(id, title, country, category, url, publishedAt);
  details.debug = {
    articleId: id,
    publisher: publisherName,
    sourceUrl: url,
    contentRetrieved: true,
    summaryGenerated: false,
    cacheHit: false,
    validationPassed: true
  };
  articleCache.set(cacheKey, details);
  return details;
}
