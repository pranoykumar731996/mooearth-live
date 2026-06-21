import { PerspectiveArticle, PerspectiveComparison, PerspectiveResult } from '@/types/perspective';
import { getCountryPublishers, GLOBAL_PUBLISHERS } from '@/config/publishers';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseRss(xmlText: string): PerspectiveArticle[] {
  const items: PerspectiveArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    const extractTag = (tag: string) => {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`);
      const m = regex.exec(itemContent);
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : '';
    };

    const rawTitle = extractTag('title');
    const link = extractTag('link');
    const pubDate = extractTag('pubDate');
    const description = extractTag('description');

    const decodedDesc = decodeHtmlEntities(description);
    let snippet = decodedDesc.replace(/<[^>]*>/g, '').trim();
    if (!snippet || snippet.length < 5) {
      snippet = rawTitle;
    }

    if (rawTitle && link) {
      // Split source from title (e.g. "Headline - Source Name" or "Headline | Source Name")
      let title = rawTitle;
      let source = 'Unknown Source';

      const lastDashIndex = rawTitle.lastIndexOf(' - ');
      if (lastDashIndex !== -1) {
        title = rawTitle.substring(0, lastDashIndex).trim();
        source = rawTitle.substring(lastDashIndex + 3).trim();
      } else {
        const lastPipeIndex = rawTitle.lastIndexOf(' | ');
        if (lastPipeIndex !== -1) {
          title = rawTitle.substring(0, lastPipeIndex).trim();
          source = rawTitle.substring(lastPipeIndex + 3).trim();
        }
      }

      items.push({
        title,
        link,
        source,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        snippet: snippet.substring(0, 200)
      });
    }
  }

  return items;
}

async function fetchArticles(query: string, fallbackQuery?: string): Promise<PerspectiveArticle[]> {
  let xmlText = '';
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, { 
      next: { revalidate: 300 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (res.ok) {
      xmlText = await res.text();
    }
  } catch (err) {
    console.error(`Error fetching RSS for query "${query}":`, err);
  }

  let articles = xmlText ? parseRss(xmlText) : [];
  if (articles.length === 0 && fallbackQuery) {
    console.log(`No articles found for query "${query}". Trying fallback: "${fallbackQuery}"`);
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(fallbackQuery)}&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetch(url, { 
        next: { revalidate: 300 },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      if (res.ok) {
        xmlText = await res.text();
        articles = parseRss(xmlText);
      }
    } catch (err) {
      console.error(`Error fetching fallback RSS for query "${fallbackQuery}":`, err);
    }
  }

  return articles.slice(0, 5);
}

// ─── AI COMPARISON SYSTEM ─────────────────────────────────────────────────────
// Multi-provider cascading fallback: OpenAI → Gemini → Groq
// Each provider is tried in sequence; if one fails, the next is attempted.

const COMPARISON_PROMPT = `You are an elite, non-partisan media analyst. Your task is to compare how local domestic media and international media cover the same event.
You must remain strictly neutral. Do not take sides, do not declare which side is correct/incorrect, do not draw political conclusions, and do not judge coverage accuracy.
Analyze ONLY facts reported, topics emphasized, and differences in focal framing.

Output must be in JSON format conforming strictly to this TypeScript type:
{
  commonFacts: string[];        // Facts agreed upon by both sides (max 4 items)
  localFocus: string[];         // Themes/points emphasized by local publishers (max 3 items)
  globalFocus: string[];        // Themes/points emphasized by international publishers (max 3 items)
  missingContext: string[];     // Crucial contextual points largely omitted by both (max 3 items)
  similarityScore: 'Low' | 'Medium' | 'High'; // Degree of agreement in overall narrative
}`;

function buildUserPrompt(
  country: string,
  topic: string,
  localArticles: PerspectiveArticle[],
  globalArticles: PerspectiveArticle[]
): string {
  const localText = localArticles.map(a => `- [${a.source}] ${a.title}: ${a.snippet}`).join('\n');
  const globalText = globalArticles.map(a => `- [${a.source}] ${a.title}: ${a.snippet}`).join('\n');

  return `Country under focus: ${country}
Topic of coverage: ${topic}

Local domestic coverage:
${localText || 'No local coverage available.'}

International coverage:
${globalText || 'No international coverage available.'}`;
}

function parseComparisonJson(text: string): PerspectiveComparison | null {
  try {
    // Try to extract JSON from the response (may be wrapped in markdown code blocks)
    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    const parsed = JSON.parse(jsonStr);
    return {
      commonFacts: parsed.commonFacts || [],
      localFocus: parsed.localFocus || [],
      globalFocus: parsed.globalFocus || [],
      missingContext: parsed.missingContext || [],
      similarityScore: parsed.similarityScore || 'Medium'
    };
  } catch {
    console.error('[Perspective] Failed to parse AI comparison JSON:', text.substring(0, 200));
    return null;
  }
}

// ─── Provider 1: OpenAI ───────────────────────────────────────────────────────
async function tryOpenAI(userPrompt: string): Promise<PerspectiveComparison | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    console.log('[Perspective] Trying OpenAI gpt-4o-mini...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: COMPARISON_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Perspective] OpenAI returned ${response.status}: ${errText.substring(0, 200)}`);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return null;

    console.log('[Perspective] ✅ OpenAI succeeded');
    return parseComparisonJson(content);
  } catch (err: any) {
    console.error('[Perspective] OpenAI failed:', err.message);
    return null;
  }
}

// ─── Provider 2: Google Gemini ────────────────────────────────────────────────
async function tryGemini(userPrompt: string): Promise<PerspectiveComparison | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    console.log('[Perspective] Trying Gemini Flash...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${COMPARISON_PROMPT}\n\n${userPrompt}` }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Perspective] Gemini returned ${response.status}: ${errText.substring(0, 200)}`);
      return null;
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;

    console.log('[Perspective] ✅ Gemini succeeded');
    return parseComparisonJson(content);
  } catch (err: any) {
    console.error('[Perspective] Gemini failed:', err.message);
    return null;
  }
}

// ─── Provider 3: Groq (Free Tier - Llama 3.3 70B) ────────────────────────────
async function tryGroq(userPrompt: string): Promise<PerspectiveComparison | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    console.log('[Perspective] Trying Groq llama-3.3-70b-versatile...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: COMPARISON_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Perspective] Groq returned ${response.status}: ${errText.substring(0, 200)}`);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return null;

    console.log('[Perspective] ✅ Groq succeeded');
    return parseComparisonJson(content);
  } catch (err: any) {
    console.error('[Perspective] Groq failed:', err.message);
    return null;
  }
}

// ─── Cascading AI Comparison ──────────────────────────────────────────────────
async function runAiComparison(
  country: string,
  topic: string,
  localArticles: PerspectiveArticle[],
  globalArticles: PerspectiveArticle[]
): Promise<PerspectiveComparison | null> {
  const userPrompt = buildUserPrompt(country, topic, localArticles, globalArticles);

  // Try providers in sequence: OpenAI → Gemini → Groq
  const providers = [tryOpenAI, tryGemini, tryGroq];
  
  for (const provider of providers) {
    const result = await provider(userPrompt);
    if (result && result.commonFacts && result.commonFacts.length > 0) {
      return result;
    }
  }

  console.warn('[Perspective] All AI providers failed or returned empty results.');
  return null;
}

/**
 * Builds a complete perspective comparison using local RSS sources, global RSS sources, and AI.
 */
export async function getPerspective(
  country: string,
  topic: string,
  category: string
): Promise<PerspectiveResult> {
  const localConfig = getCountryPublishers(country);
  
  // Construct local and global queries
  let localQuery = '';
  if (localConfig) {
    localQuery = `${topic} ${localConfig.queryOperator}`;
  } else {
    localQuery = `${topic} "${country}" news`;
  }
  const localFallback = `${topic} "${country}"`;

  const globalQuery = `${topic} ${GLOBAL_PUBLISHERS.queryOperator}`;
  const globalFallback = `${topic} global news`;

  // Fetch articles concurrently
  const [localArticles, globalArticles] = await Promise.all([
    fetchArticles(localQuery, localFallback),
    fetchArticles(globalQuery, globalFallback)
  ]);

  if (localArticles.length === 0 && globalArticles.length === 0) {
    throw new Error('No coverage articles found for this topic.');
  }

  // Attempt to run AI comparison (cascading providers)
  const aiComparison = await runAiComparison(country, topic, localArticles, globalArticles);

  return {
    country,
    topic,
    localArticles,
    globalArticles,
    commonFacts: aiComparison?.commonFacts || [],
    localFocus: aiComparison?.localFocus || [],
    globalFocus: aiComparison?.globalFocus || [],
    missingContext: aiComparison?.missingContext || [],
    similarityScore: aiComparison?.similarityScore || 'Medium'
  };
}

