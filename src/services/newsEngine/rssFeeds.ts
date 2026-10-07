// ============================================================
// MooEarth Live — Global News Coverage Engine 2.0: RSS Feeds
// ============================================================

import { RssFeedConfig, EngineArticle } from './types';
import { getCountryByName, CANONICAL_COUNTRIES } from '@/data/countries';
import { COUNTRY_COORDINATES } from '@/lib/constants';

export const GLOBAL_PUBLISHER_FEEDS: RssFeedConfig[] = [
  // Global & Wire Feeds (English)
  {
    id: 'bbc-world',
    name: 'BBC News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    region: 'Global',
    language: 'en',
    category: 'breaking',
    weight: 10,
  },
  {
    id: 'aljazeera-en',
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    region: 'Middle East & Global',
    language: 'en',
    category: 'breaking',
    weight: 9,
  },
  {
    id: 'france24-en',
    name: 'France 24',
    url: 'https://www.france24.com/en/rss',
    region: 'Europe & Global',
    language: 'en',
    category: 'breaking',
    weight: 9,
  },
  {
    id: 'dw-en',
    name: 'Deutsche Welle',
    url: 'https://rss.dw.com/rdf/rss-en-all',
    region: 'Europe & Global',
    language: 'en',
    category: 'breaking',
    weight: 8,
  },
  {
    id: 'the-guardian-world',
    name: 'The Guardian',
    url: 'https://www.theguardian.com/world/rss',
    region: 'Global',
    language: 'en',
    category: 'breaking',
    weight: 8,
  },
  {
    id: 'npr-world',
    name: 'NPR News',
    url: 'https://feeds.npr.org/1004/rss.xml',
    region: 'Americas & Global',
    language: 'en',
    category: 'breaking',
    weight: 8,
  },
  {
    id: 'the-hindu-world',
    name: 'The Hindu',
    url: 'https://www.thehindu.com/news/international/feeder/default.rss',
    region: 'Asia & Global',
    language: 'en',
    category: 'breaking',
    weight: 8,
  },
  {
    id: 'cbc-world',
    name: 'CBC News',
    url: 'https://www.cbc.ca/cmlink/rss-world',
    region: 'Americas & Global',
    language: 'en',
    category: 'breaking',
    weight: 7,
  },
  {
    id: 'wsj-world',
    name: 'Wall Street Journal',
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    region: 'Global',
    language: 'en',
    category: 'business',
    weight: 8,
  },
  {
    id: 'cnbc-world',
    name: 'CNBC',
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    region: 'Global',
    language: 'en',
    category: 'business',
    weight: 8,
  },

  // Category-Specific Feeds
  // Technology
  {
    id: 'arstechnica-tech',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    region: 'Global',
    language: 'en',
    category: 'technology',
    weight: 8,
  },
  {
    id: 'theverge-tech',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    region: 'Global',
    language: 'en',
    category: 'technology',
    weight: 8,
  },
  {
    id: 'phys-org-tech',
    name: 'Phys.org',
    url: 'https://phys.org/rss-feed/',
    region: 'Global',
    language: 'en',
    category: 'technology',
    weight: 7,
  },

  // Sports & Football
  {
    id: 'bbc-sport',
    name: 'BBC Sport',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    region: 'Global',
    language: 'en',
    category: 'sports',
    weight: 8,
  },
  {
    id: 'guardian-football',
    name: 'The Guardian Football',
    url: 'https://www.theguardian.com/football/rss',
    region: 'Europe & Global',
    language: 'en',
    category: 'football',
    weight: 8,
  },

  // Regional English Feeds for Continental Breadth
  {
    id: 'bbc-africa',
    name: 'BBC Africa',
    url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
    region: 'Africa',
    language: 'en',
    category: 'breaking',
    weight: 8,
  },
  {
    id: 'abc-australia',
    name: 'ABC News (Australia)',
    url: 'https://www.abc.net.au/news/feed/51120/rss.xml',
    region: 'Oceania & Asia-Pacific',
    language: 'en',
    category: 'breaking',
    weight: 8,
  },
  {
    id: 'bbc-asia',
    name: 'BBC Asia',
    url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',
    region: 'Asia',
    language: 'en',
    category: 'breaking',
    weight: 8,
  },
  {
    id: 'bbc-latam',
    name: 'BBC Latin America',
    url: 'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml',
    region: 'Latin America',
    language: 'en',
    category: 'breaking',
    weight: 8,
  },

  // Regional & Multilingual Feeds
  // Spanish (es)
  {
    id: 'bbc-mundo',
    name: 'BBC Mundo',
    url: 'https://feeds.bbci.co.uk/mundo/rss.xml',
    region: 'Latin America & Spain',
    language: 'es',
    category: 'breaking',
    weight: 9,
  },
  {
    id: 'elpais-portada',
    name: 'El País',
    url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada',
    region: 'Spain & Latin America',
    language: 'es',
    category: 'breaking',
    weight: 8,
  },

  // French (fr)
  {
    id: 'france24-fr',
    name: 'France 24 (FR)',
    url: 'https://www.france24.com/fr/rss',
    region: 'France & Francophone',
    language: 'fr',
    category: 'breaking',
    weight: 8,
  },

  // German (de)
  {
    id: 'dw-de',
    name: 'Deutsche Welle (DE)',
    url: 'https://rss.dw.com/rdf/rss-de-all',
    region: 'Germany & Europe',
    language: 'de',
    category: 'breaking',
    weight: 8,
  },

  // Portuguese (pt)
  {
    id: 'bbc-brasil',
    name: 'BBC News Brasil',
    url: 'https://feeds.bbci.co.uk/portuguese/rss.xml',
    region: 'Brazil & Portugal',
    language: 'pt',
    category: 'breaking',
    weight: 8,
  },

  // Arabic (ar)
  {
    id: 'aljazeera-ar',
    name: 'Al Jazeera (Arabic)',
    url: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9',
    region: 'Middle East & North Africa',
    language: 'ar',
    category: 'breaking',
    weight: 9,
  },
  {
    id: 'bbc-arabic',
    name: 'BBC Arabic',
    url: 'https://feeds.bbci.co.uk/arabic/rss.xml',
    region: 'Middle East & North Africa',
    language: 'ar',
    category: 'breaking',
    weight: 8,
  },

  // Hindi (hi)
  {
    id: 'bbc-hindi',
    name: 'BBC Hindi',
    url: 'https://feeds.bbci.co.uk/hindi/rss.xml',
    region: 'India & South Asia',
    language: 'hi',
    category: 'breaking',
    weight: 8,
  },

  // Japanese (ja)
  {
    id: 'nhk-world-ja',
    name: 'NHK World',
    url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
    region: 'Japan & East Asia',
    language: 'ja',
    category: 'breaking',
    weight: 8,
  },
];

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

function stripHtml(html: string): string {
  if (!html) return '';
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/**
 * Clean publisher suffixes from titles (e.g. "Headline - BBC News" -> "Headline")
 */
export function cleanTitleText(rawTitle: string): string {
  if (!rawTitle) return '';
  let cleaned = decodeHtmlEntities(rawTitle).trim();
  // Strip trailing publisher tags
  cleaned = cleaned.replace(/\s*[-–—|]\s*(BBC News|BBC|Al Jazeera|France 24|Deutsche Welle|DW|The Guardian|NPR|The Hindu|CBC News|The Wall Street Journal|WSJ|El País|Le Monde|NHK|Reuters|Associated Press|AP).*$/i, '');
  return cleaned.trim();
}

/**
 * Assign coordinates and canonical country using title, description, and optional hint
 */
export function resolveGeo(title: string, summary: string, countryHint?: string): {
  country: string;
  city: string;
  lat: number;
  lng: number;
} {
  const combined = `${title} ${summary}`.toLowerCase();

  // 1. Prioritize explicit country hint
  if (countryHint) {
    const canonical = getCountryByName(countryHint);
    if (canonical) {
      return {
        country: canonical.name,
        city: canonical.capital || 'Capital',
        lat: canonical.coordinates.lat,
        lng: canonical.coordinates.lng,
      };
    }
  }

  // 2. Scan combined text against canonical countries
  for (const c of CANONICAL_COUNTRIES) {
    const nameLower = c.name.toLowerCase();
    if (nameLower.length > 3 && combined.includes(nameLower)) {
      return {
        country: c.name,
        city: c.capital || 'Capital',
        lat: c.coordinates.lat,
        lng: c.coordinates.lng,
      };
    }
  }

  // 3. Scan country coordinates constants
  for (const [key, data] of Object.entries(COUNTRY_COORDINATES)) {
    if (combined.includes(key.toLowerCase())) {
      return {
        country: data.country,
        city: data.city,
        lat: data.lat,
        lng: data.lng,
      };
    }
  }

  // Default fallback: Global anchor (Greenwich / Equator baseline)
  return {
    country: 'International',
    city: 'Global Wire',
    lat: 20.0,
    lng: 0.0,
  };
}

export function parseRssXml(xmlText: string, config: RssFeedConfig): EngineArticle[] {
  const articles: EngineArticle[] = [];
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;

  let domain = '';
  try {
    domain = new URL(config.url).hostname.replace(/^www\./, '');
  } catch {
    domain = 'news.publisher';
  }

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    const extractTag = (tag: string) => {
      const regex = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tag}[^>]*>([\\s\\S]*?)<\/(?:[a-zA-Z0-9]+:)?${tag}>`, 'i');
      const m = regex.exec(itemContent);
      if (m && m[1]) {
        return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
      }
      return '';
    };

    const extractAttribute = (tag: string, attr: string) => {
      const regex = new RegExp(`<${tag}[^>]*?${attr}=["']([^"']+)["'][^>]*>`, 'i');
      const m = regex.exec(itemContent);
      return m ? m[1] : '';
    };

    const rawTitle = extractTag('title');
    const link =
      extractTag('link') ||
      extractAttribute('link', 'href') ||
      extractTag('guid') ||
      extractTag('id');
    const rawDesc = extractTag('description') || extractTag('summary');
    const rawContent = extractTag('encoded') || extractTag('content'); // <content:encoded> or <content>
    const pubDateStr =
      extractTag('pubDate') ||
      extractTag('published') ||
      extractTag('updated') ||
      extractTag('date') ||
      extractTag('dc:date');

    const imageUrl =
      extractAttribute('media:content', 'url') ||
      extractAttribute('enclosure', 'url') ||
      extractAttribute('media:thumbnail', 'url') ||
      extractAttribute('img', 'src');

    if (!rawTitle || !link) continue;

    const title = cleanTitleText(rawTitle);
    const summary = stripHtml(rawDesc || rawContent || title);
    const fullContent = rawContent ? stripHtml(rawContent) : undefined;

    let publishedAt = new Date().toISOString();
    if (pubDateStr) {
      const parsedTime = new Date(pubDateStr).getTime();
      if (!Number.isNaN(parsedTime)) {
        publishedAt = new Date(parsedTime).toISOString();
      }
    }

    const geo = resolveGeo(title, summary, config.countryHint);

    // Assess initial access tier based on payload content
    const hasFullBody = Boolean(fullContent && fullContent.length > 250);
    const hasSummary = Boolean(summary && summary.length > 60);

    const accessLevel = hasFullBody ? 'full' : hasSummary ? 'synthesis' : 'dispatch';
    const accessLabel = hasFullBody ? 'Full Report' : hasSummary ? 'Verified Synthesis' : 'Publisher Dispatch';

    articles.push({
      id: `rss-${config.id}-${Date.now().toString(36)}-${articles.length}`,
      title,
      summary,
      fullContent,
      sourceUrl: link,
      publisher: config.name,
      publisherDomain: domain,
      category: config.category,
      country: geo.country,
      city: geo.city,
      lat: geo.lat,
      lng: geo.lng,
      publishedAt,
      language: config.language,
      accessLevel,
      accessLabel,
      imageUrl: imageUrl || undefined,
      sourceType: 'rss',
      relatedSources: [],
    });
  }

  return articles;
}

// Bounded in-memory cache for RSS feeds (120-second TTL)
interface CacheEntry {
  timestamp: number;
  articles: EngineArticle[];
}
const rssMemoryCache = new Map<string, CacheEntry>();

export async function fetchRssFeedArticles(
  config: RssFeedConfig,
  forceRefresh = false
): Promise<EngineArticle[]> {
  const cacheKey = config.id;
  const now = Date.now();
  const cached = rssMemoryCache.get(cacheKey);

  if (!forceRefresh && cached && now - cached.timestamp < 120_000) {
    return cached.articles;
  }

  try {
    const res = await fetch(config.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MooEarthLiveNewsEngine/2.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(5000),
      cache: forceRefresh ? 'no-store' : 'default',
    });

    if (!res.ok) {
      console.warn(`[NewsEngine RSS] Feed ${config.name} returned HTTP ${res.status}`);
      return cached ? cached.articles : [];
    }

    const xmlText = await res.text();
    const articles = parseRssXml(xmlText, config);

    if (articles.length > 0) {
      rssMemoryCache.set(cacheKey, { timestamp: now, articles });
    }

    return articles;
  } catch (err: any) {
    console.warn(`[NewsEngine RSS] Feed error on ${config.name}: ${err?.message}`);
    return cached ? cached.articles : [];
  }
}
