import { PerspectiveArticle, PerspectiveComparison, PerspectiveResult } from '@/types/perspective';
import { getCountryPublishers, GLOBAL_PUBLISHERS } from '@/config/publishers';
import { locations, LocationRecord } from '@/data/locations';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseRss(xmlText: string, geoLevel: 'city' | 'state' | 'national' | 'international'): PerspectiveArticle[] {
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
        snippet: snippet.substring(0, 200),
        geoLevel
      });
    }
  }

  return items;
}

async function fetchArticles(
  query: string, 
  geoLevel: 'city' | 'state' | 'national' | 'international',
  fallbackQuery?: string
): Promise<PerspectiveArticle[]> {
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

  let articles = xmlText ? parseRss(xmlText, geoLevel) : [];
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
        articles = parseRss(xmlText, geoLevel);
      }
    } catch (err) {
      console.error(`Error fetching fallback RSS for query "${fallbackQuery}":`, err);
    }
  }

  return articles.slice(0, 5);
}

// ─── AI COMPARISON SYSTEM ─────────────────────────────────────────────────────
// Multi-provider cascading fallback: OpenAI → Gemini → Groq

const COMPARISON_PROMPT = `You are an elite, non-partisan media analyst. Your task is to compare how news is reported at different geographic levels: Local City, State, National, and International.
You must remain strictly neutral. Do not take sides, do not declare which side is correct/incorrect, do not draw political conclusions, and do not judge coverage accuracy.
Analyze ONLY facts reported, topics emphasized, and differences in focal framing at these different levels.

Output must be in JSON format conforming strictly to this TypeScript type:
{
  commonFacts: string[];        // Facts agreed upon across all levels (max 4 items)
  cityFocus: string[];          // Themes/points emphasized by local city media (max 3 items, or empty if city is not selected)
  stateFocus: string[];         // Themes/points emphasized by state/regional media (max 3 items, or empty if state is not selected)
  nationalFocus: string[];      // Themes/points emphasized by national publishers (max 3 items)
  globalFocus: string[];        // Themes/points emphasized by international/global publishers (max 3 items)
  missingContext: string[];     // Crucial contextual points largely omitted by all levels (max 3 items)
  similarityScore: 'Low' | 'Medium' | 'High'; // Degree of agreement in overall narrative
}`;

function build4LevelUserPrompt(
  locationName: string,
  topic: string,
  cityArticles: PerspectiveArticle[],
  stateArticles: PerspectiveArticle[],
  nationalArticles: PerspectiveArticle[],
  globalArticles: PerspectiveArticle[]
): string {
  const cityText = cityArticles.map(a => `- [${a.source}] ${a.title}: ${a.snippet}`).join('\n') || 'No city-level media found.';
  const stateText = stateArticles.map(a => `- [${a.source}] ${a.title}: ${a.snippet}`).join('\n') || 'No state-level media found.';
  const nationalText = nationalArticles.map(a => `- [${a.source}] ${a.title}: ${a.snippet}`).join('\n') || 'No national media found.';
  const globalText = globalArticles.map(a => `- [${a.source}] ${a.title}: ${a.snippet}`).join('\n') || 'No international media found.';

  return `Location under focus: ${locationName}
Topic of coverage: ${topic}

Local City-Level Coverage:
${cityText}

State/Regional Coverage:
${stateText}

National Coverage:
${nationalText}

International Coverage:
${globalText}`;
}

function parseComparisonJson(text: string): PerspectiveComparison | null {
  try {
    let jsonStr = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    const parsed = JSON.parse(jsonStr);
    
    // Standardize variables & provide fallbacks for compatibility
    const cityFocus = parsed.cityFocus || [];
    const stateFocus = parsed.stateFocus || [];
    const nationalFocus = parsed.nationalFocus || parsed.localFocus || [];
    const globalFocus = parsed.globalFocus || parsed.globalFocus || [];

    return {
      commonFacts: parsed.commonFacts || [],
      localFocus: nationalFocus, // Compatibility mapping
      globalFocus: globalFocus, // Compatibility mapping
      cityFocus,
      stateFocus,
      nationalFocus,
      missingContext: parsed.missingContext || [],
      similarityScore: parsed.similarityScore || 'Medium'
    };
  } catch {
    console.error('[Perspective] Failed to parse AI comparison JSON:', text.substring(0, 200));
    return null;
  }
}

// Providers
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
    if (!response.ok) return null;
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseComparisonJson(content);
  } catch (err: any) {
    console.error('[Perspective] OpenAI failed:', err.message);
    return null;
  }
}

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
    if (!response.ok) return null;
    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;
    return parseComparisonJson(content);
  } catch (err: any) {
    console.error('[Perspective] Gemini failed:', err.message);
    return null;
  }
}

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
    if (!response.ok) return null;
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseComparisonJson(content);
  } catch (err: any) {
    console.error('[Perspective] Groq failed:', err.message);
    return null;
  }
}

async function runAiComparison4Levels(
  locationName: string,
  topic: string,
  cityArticles: PerspectiveArticle[],
  stateArticles: PerspectiveArticle[],
  nationalArticles: PerspectiveArticle[],
  globalArticles: PerspectiveArticle[]
): Promise<PerspectiveComparison | null> {
  const userPrompt = build4LevelUserPrompt(locationName, topic, cityArticles, stateArticles, nationalArticles, globalArticles);
  const providers = [tryOpenAI, tryGemini, tryGroq];
  
  for (const provider of providers) {
    const result = await provider(userPrompt);
    if (result && result.commonFacts && result.commonFacts.length > 0) {
      return result;
    }
  }
  return null;
}

/**
 * Builds a complete perspective comparison at up to 4 geographic levels.
 */
export async function getPerspective(
  locationIdOrCountryName: string,
  topic: string,
  category: string
): Promise<PerspectiveResult> {
  // Resolve geographic location from DB or fallback
  let resolvedLocation = locations.find(l => l.id === locationIdOrCountryName);
  if (!resolvedLocation) {
    // If not found by ID, look up by country name
    resolvedLocation = locations.find(
      l => l.name.toLowerCase() === locationIdOrCountryName.toLowerCase() && l.type === 'country'
    );
  }

  // Final fallback structure if not resolved
  const location: LocationRecord = resolvedLocation || {
    id: `country-${locationIdOrCountryName.toLowerCase()}`,
    name: locationIdOrCountryName,
    type: 'country',
    country: locationIdOrCountryName,
    countryCode: 'GL',
    lat: 20,
    lng: 0,
    population: 0,
    timezone: 'UTC',
    adminLevel: 0
  };

  const cityName = location.type === 'city' ? location.name : '';
  const stateName = location.type === 'city' ? location.state : (location.type === 'state' ? location.name : '');
  const countryName = location.country;

  // Construct queries for each of the 4 levels
  const cityQuery = cityName ? `"${cityName}" ${topic}` : '';
  const stateQuery = stateName ? `"${stateName}" ${topic}` : '';
  
  const localConfig = getCountryPublishers(countryName);
  const nationalQuery = localConfig 
    ? `${topic} ${localConfig.queryOperator}` 
    : `"${countryName}" ${topic}`;

  const globalQuery = `${topic} ${GLOBAL_PUBLISHERS.queryOperator}`;

  // Fetch articles concurrently for all active levels
  const fetchPromises: Promise<PerspectiveArticle[]>[] = [
    cityQuery ? fetchArticles(cityQuery, 'city') : Promise.resolve([]),
    stateQuery ? fetchArticles(stateQuery, 'state') : Promise.resolve([]),
    fetchArticles(nationalQuery, 'national', `${topic} "${countryName}"`),
    fetchArticles(globalQuery, 'international', `${topic} global news`)
  ];

  const [cityArticles, stateArticles, nationalArticles, globalArticles] = await Promise.all(fetchPromises);

  if (cityArticles.length === 0 && stateArticles.length === 0 && nationalArticles.length === 0 && globalArticles.length === 0) {
    throw new Error('No coverage articles found for this topic.');
  }

  // Run comparative analysis
  const aiComparison = await runAiComparison4Levels(
    location.name,
    topic,
    cityArticles,
    stateArticles,
    nationalArticles,
    globalArticles
  );

  // Compile articles into backwards-compatible array
  const localArticles = [...cityArticles, ...stateArticles, ...nationalArticles];

  return {
    country: location.country,
    topic,
    localArticles, // compatibility
    globalArticles, // compatibility
    cityArticles,
    stateArticles,
    nationalArticles,
    commonFacts: aiComparison?.commonFacts || [],
    localFocus: aiComparison?.localFocus || [],
    globalFocus: aiComparison?.globalFocus || [],
    cityFocus: aiComparison?.cityFocus || [],
    stateFocus: aiComparison?.stateFocus || [],
    nationalFocus: aiComparison?.nationalFocus || [],
    missingContext: aiComparison?.missingContext || [],
    similarityScore: aiComparison?.similarityScore || 'Medium',
    locationId: location.id,
    locationName: location.name,
    locationType: location.type
  };
}
