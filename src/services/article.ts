import { WorldEvent } from '@/types';
import { BoundedMap } from '@/lib/rate-limiter';
import {
  resolveArticleAccess,
  findRelatedCluster,
  conductMultiSourceResearch,
  generateArticleWithAi,
  enforcePublicationGate,
  EvidenceDepthMode,
  PublicationStatus,
  EvidenceRecord,
  AttributedStatement,
  TimelineDevelopment,
  SourceTransparencyReport,
  ResearchTelemetry,
} from './newsEngine';
import { FEATURES } from '@/config/features';
import { isTakedownActive, getTakedownDetails, generateTombstoneArticle } from './newsEngine/takedownService';

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
  accessLevel?: 'full' | 'synthesis' | 'dispatch';
  accessLabel?: string;
  relatedSources?: Array<{ publisher: string; url: string; title: string }>;
  topicKeywords?: string[];
  debug?: {
    articleId: string;
    publisher: string;
    sourceUrl: string;
    contentRetrieved: boolean;
    summaryGenerated: boolean;
    cacheHit: boolean;
    validationPassed: boolean;
    [key: string]: any;
  };

  // Multi-Source AI Research & Evidence Depth Fields
  depthMode?: EvidenceDepthMode;
  publicationStatus?: PublicationStatus;
  newlyReportedFacts?: string[];
  attributedStatements?: AttributedStatement[];
  timelineDevelopments?: TimelineDevelopment[];
  historicalBackground?: string;
  analysisAndImplications?: string;
  competingAccountsOrContradictions?: string[];
  unresolvedQuestions?: string[];
  evidenceRecord?: EvidenceRecord;
  sourceTransparency?: SourceTransparencyReport;
  telemetry?: ResearchTelemetry;
}

// Curated premium images for each category
export const CATEGORY_IMAGES: Record<string, string> = {
  breaking: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800',
  sports: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
  football: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
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

// Bounded server-side in-memory cache for expanded articles (max 500 entries, FIFO eviction)
const articleCache = new BoundedMap<string, ArticleDetails>(500);

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
  author?: string;
}

/**
 * Safely extracts the content of a <meta> tag by name or property without
 * crossing tag boundary '>' or capturing surrounding HTML tags.
 */
function extractMetaTagContent(html: string, attrKey: string): string | null {
  const metaTagRegex = /<meta\b([^>]*?)>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaTagRegex.exec(html)) !== null) {
    const tagAttrs = match[1];
    const attrRegex = new RegExp(`(?:name|property)\\s*=\\s*["']${attrKey}["']`, 'i');
    if (attrRegex.test(tagAttrs)) {
      const contentMatch = tagAttrs.match(/content\s*=\s*["']([^"']*)["']/i);
      if (contentMatch && contentMatch[1]) {
        const val = decodeHtmlEntities(contentMatch[1].trim());
        if (!/<[^>]+>/.test(val) && !/width=device-width|viewport|theme-color|link\s+rel|favicon/i.test(val)) {
          return val;
        }
      }
    }
  }
  return null;
}

/**
 * Validates that an author or publisher name is clean, concise human text
 * and does not contain raw HTML tags or template fragments.
 */
export function isValidPublisherOrAuthor(text?: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  if (/<[^>]*>/i.test(trimmed)) return false;
  if (/meta\s+name|width=device|link\s+rel|favicon|theme-color|apple-touch|canonical|stylesheet/i.test(trimmed)) return false;
  return true;
}

export function extractPublisherFromUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.replace(/^www\./, '');
    const knownHosts: Record<string, string> = {
      'dw.com': 'DW',
      'bbc.com': 'BBC News',
      'bbc.co.uk': 'BBC News',
      'reuters.com': 'Reuters',
      'apnews.com': 'AP News',
      'aljazeera.com': 'Al Jazeera',
      'cnn.com': 'CNN',
      'theguardian.com': 'The Guardian',
      'bloomberg.com': 'Bloomberg',
      'nytimes.com': 'The New York Times',
      'washingtonpost.com': 'The Washington Post',
      'france24.com': 'France 24',
      'ft.com': 'Financial Times',
      'economist.com': 'The Economist',
      'cnbc.com': 'CNBC',
      'forbes.com': 'Forbes',
    };
    if (knownHosts[host]) return knownHosts[host];
    const dotIdx = host.indexOf('.');
    if (dotIdx !== -1) {
      const brand = host.substring(0, dotIdx);
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
    return host.toUpperCase();
  } catch {
    return 'Global Wire';
  }
}

/**
 * Validates external URLs to prevent Server-Side Request Forgery (SSRF).
 * Blocks loopback, link-local, cloud metadata, and private IP ranges.
 */
export function isSafeExternalUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block loopback, localhost, and internal domains
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    // Block IPv4 private & link-local ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const o1 = parseInt(ipMatch[1], 10);
      const o2 = parseInt(ipMatch[2], 10);
      if (o1 === 10) return false;
      if (o1 === 127) return false;
      if (o1 === 0) return false;
      if (o1 === 169 && o2 === 254) return false;
      if (o1 === 192 && o2 === 168) return false;
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return false;
      if (o1 === 100 && o2 >= 64 && o2 <= 127) return false;
    }

    if (hostname.includes('metadata.google') || hostname.includes('instance-data') || hostname.includes('169.254')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function resolveGNewsUrl(gnewsUrl: string): Promise<string> {
  try {
    const url = new URL(gnewsUrl);
    // Only resolve if it is a Google News redirect URL
    const isGNews = url.hostname.includes('news.google.com') && 
      (url.pathname.includes('/articles/') || url.pathname.includes('/rss/articles/'));
    
    if (!isGNews) {
      return gnewsUrl;
    }

    // Standard lawful HTTP redirect resolution (Zero private RPC / batchexecute reverse engineering)
    try {
      const headRes = await fetch(gnewsUrl, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(3000),
      });
      if (headRes.ok && headRes.url && !headRes.url.includes('news.google.com')) {
        return headRes.url;
      }
    } catch {
      // non-blocking fallback
    }
    return gnewsUrl;
  } catch {
    return gnewsUrl;
  }
}

async function retrieveArticleContent(url: string): Promise<RetrievedContent> {
  try {
    if (!url || !isSafeExternalUrl(url)) {
      if (url && !isSafeExternalUrl(url)) {
        console.warn(`[ArticleService] Blocked unsafe or internal URL (SSRF defense): ${url}`);
      }
      return { success: false, content: '', excerpt: '' };
    }
    
    // Resolve Google News redirect URLs to the original publisher URL
    const resolvedUrl = await resolveGNewsUrl(url);
    if (!isSafeExternalUrl(resolvedUrl)) {
      console.warn(`[ArticleService] Blocked unsafe resolved URL (SSRF defense): ${resolvedUrl}`);
      return { success: false, content: '', excerpt: '' };
    }

    const response = await fetch(resolvedUrl, {
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
    const descCandidates = [
      extractMetaTagContent(html, 'description'),
      extractMetaTagContent(html, 'og:description'),
      extractMetaTagContent(html, 'twitter:description'),
    ];
    for (const cand of descCandidates) {
      if (cand && cand.length > 20 && cand.length < 1000) {
        excerpt = cand;
        break;
      }
    }

    // 2. Extract metadata: title
    let title = '';
    const ogTitle = extractMetaTagContent(html, 'og:title');
    if (ogTitle && ogTitle.length > 5 && !/<[^>]+>/.test(ogTitle)) {
      title = ogTitle;
    } else {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = decodeHtmlEntities(titleMatch[1].trim());
      }
    }

    // 3. Extract metadata: publisher
    let publisher = '';
    const ogSiteName = extractMetaTagContent(html, 'og:site_name');
    if (ogSiteName && isValidPublisherOrAuthor(ogSiteName)) {
      publisher = ogSiteName;
    } else {
      publisher = extractPublisherFromUrl(resolvedUrl);
    }

    // 4. Extract metadata: author
    let author = '';
    const authorCandidates = [
      extractMetaTagContent(html, 'author'),
      extractMetaTagContent(html, 'article:author'),
      extractMetaTagContent(html, 'twitter:creator'),
    ];
    for (const cand of authorCandidates) {
      if (cand && isValidPublisherOrAuthor(cand)) {
        author = cand;
        break;
      }
    }

    // 5. Safe metadata-only extraction (Zero full-text scraping of copyrighted articles)
    return {
      success: excerpt.length > 20 || title.length > 10,
      content: excerpt,
      excerpt,
      publisher,
      title,
      author,
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
  publishedAt: string,
  summary?: string,
  publisher?: string
): ArticleDetails {
  const cleanTitle = cleanText(title);
  const cleanSource = cleanText(source);
  const resolution = resolveArticleAccess({
    url: cleanSource,
    title: cleanTitle,
    summary,
    country,
    publisher,
  });

  return {
    id,
    title: cleanTitle,
    source: cleanSource,
    publishedAt,
    country,
    category,
    aiSummary: resolution.cleanedBody || "Summary unavailable. Please open the original article.",
    fullContent: resolution.cleanedBody || "The full content of this article could not be retrieved from the publisher's website. Please use the link below to read the original article on their official site.",
    keyFacts: resolution.extractedKeyFacts || [],
    author: publisher || "MooEarth Newsroom",
    image: CATEGORY_IMAGES[category] || CATEGORY_IMAGES.breaking,
    description: resolution.cleanedBody || "Summary unavailable.",
    accessLevel: resolution.accessLevel,
    accessLabel: resolution.accessLabel,
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
    console.log('[ArticleService] Generating article with OpenAI gpt-4o-mini...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

// In-flight research promise tracker to guarantee zero duplicate AI calls (SingleFlight pattern)
const inFlightResearchMap = new Map<string, Promise<ArticleDetails>>();

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

  // 0. Legal Takedown & Retraction Check (Phase 5 Compliance)
  if (isTakedownActive(id) || isTakedownActive(url) || isTakedownActive(cleanTitle)) {
    const takedown = getTakedownDetails(id) || getTakedownDetails(url) || getTakedownDetails(cleanTitle);
    const tombstone = generateTombstoneArticle(
      id,
      cleanTitle,
      url,
      takedown?.reason || 'Retracted by legal or editorial notice.'
    );
    return tombstone;
  }

  // 1. Generate unique and canonical topic cache keys
  const specificKey = `${id.trim()}||${url.trim()}||${publishedAt.trim()}`;
  const canonicalKey = `canonical__${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 60)}__${(country || 'global').toLowerCase()}`;

  // Check cache for canonical topic
  if (articleCache.has(canonicalKey)) {
    const cached = articleCache.get(canonicalKey)!;
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
        cacheHit: true,
      },
    };
  }

  // Check cache for specific ID/URL
  if (articleCache.has(specificKey)) {
    const cached = articleCache.get(specificKey)!;
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
        cacheHit: true,
      },
    };
  }

  // 2. Check in-flight research map (deduplicate parallel clicks on the same story)
  if (inFlightResearchMap.has(canonicalKey)) {
    return inFlightResearchMap.get(canonicalKey)!;
  }

  // 3. Initiate the multi-source research promise
  const researchPromise = (async () => {
    try {
      console.log(`[ArticleService] Initiating Multi-Source Research Engine for: "${cleanTitle}"`);

      // A. Conduct multi-source research across independent outlets, public documents, and GDELT
      const evidence = await conductMultiSourceResearch({
        headline: cleanTitle,
        url,
        summary: cleanSummary,
        country: country || 'Global',
        category: category || 'breaking',
        publishedAt: publishedAt || new Date().toISOString(),
      });

      // B. Generate evidence-dependent article (briefing, multi_source, deep_dive)
      const generated = await generateArticleWithAi(evidence, category || 'breaking', url);

      // C. Run publication quality gate (sufficiency, claim alignment, stale detection, status)
      const finalized = enforcePublicationGate(generated, evidence);

      // D. Map to ArticleDetails structure
      const primaryPub = evidence.sources[0]?.publisher || extractPublisherFromUrl(url) || 'News Wire';
      const details: ArticleDetails = {
        id: id || finalized.id,
        title: finalized.title || cleanTitle,
        source: cleanText(url),
        publishedAt: finalized.publishedAt || publishedAt,
        country: finalized.country || country,
        category: finalized.category || category,
        aiSummary: finalized.aiSummary,
        fullContent: finalized.fullContent,
        keyFacts: finalized.keyFacts,
        author: finalized.author || `${primaryPub} & MooEarth Research Bureau`,
        image: finalized.image || CATEGORY_IMAGES[category] || CATEGORY_IMAGES.breaking,
        description: cleanSummary || finalized.aiSummary,
        accessLevel: finalized.accessLevel,
        accessLabel: finalized.accessLabel,
        relatedSources: finalized.relatedSources,
        topicKeywords: evidence.entities.organizations.concat(evidence.entities.people),
        
        // Multi-Source Depth & Transparency Fields
        depthMode: finalized.depthMode,
        publicationStatus: finalized.publicationStatus,
        newlyReportedFacts: finalized.newlyReportedFacts,
        attributedStatements: finalized.attributedStatements,
        timelineDevelopments: finalized.timelineDevelopments,
        historicalBackground: finalized.historicalBackground,
        analysisAndImplications: finalized.analysisAndImplications,
        competingAccountsOrContradictions: finalized.competingAccountsOrContradictions,
        unresolvedQuestions: finalized.unresolvedQuestions,
        evidenceRecord: finalized.evidenceRecord,
        sourceTransparency: finalized.sourceTransparency,
        telemetry: finalized.telemetry,
        debug: {
          articleId: id,
          publisher: primaryPub,
          sourceUrl: url,
          contentRetrieved: evidence.corroboration.accessibleSourcesCount > 0,
          summaryGenerated: true,
          cacheHit: false,
          validationPassed: finalized.publicationStatus !== 'under_review',
          depthMode: finalized.depthMode,
          publicationStatus: finalized.publicationStatus,
          sourcesCount: evidence.sources.length,
          accessibleCount: evidence.corroboration.accessibleSourcesCount,
        },
      };

      // Store in memory cache with both canonical and specific keys
      articleCache.set(canonicalKey, details);
      articleCache.set(specificKey, details);

      return details;
    } catch (err: any) {
      console.error(`[ArticleService] Multi-source research encountered error, falling back gracefully:`, err);
      const fallbackDetails = generateUnavailableArticle(
        id,
        title,
        country,
        category,
        url,
        publishedAt,
        cleanSummary,
        extractPublisherFromUrl(url)
      );
      articleCache.set(specificKey, fallbackDetails);
      return fallbackDetails;
    } finally {
      inFlightResearchMap.delete(canonicalKey);
    }
  })();

  inFlightResearchMap.set(canonicalKey, researchPromise);
  return await researchPromise;
}
