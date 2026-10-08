// ============================================================
// MooEarth Live — Global News Coverage Engine 2.0: GDELT Client
// ============================================================

import { EngineArticle, GdeltDocItem } from './types';
import { getCountryById, getCountryByName } from '@/data/countries';
import { cleanTitleText, resolveGeo } from './rssFeeds';

// In-memory bounded cache for GDELT queries (20-minute TTL)
interface GdeltCacheEntry {
  timestamp: number;
  articles: EngineArticle[];
}

const gdeltCache = new Map<string, GdeltCacheEntry>();

// Minimum 5-second interval between outbound GDELT requests to respect rate limits
let lastGdeltCallTime = 0;
const MIN_GDELT_INTERVAL_MS = 5500;

// Language code to GDELT sourcelang mapping
const GDELT_LANG_MAP: Record<string, string> = {
  en: 'eng',
  es: 'spa',
  fr: 'fra',
  de: 'deu',
  pt: 'por',
  ja: 'jpn',
  hi: 'hin',
  ar: 'ara',
};

/**
 * Parses GDELT seendate format (YYYYMMDDTHHMMSSZ or YYYYMMDDHHMMSS) to ISO 8601
 */
function parseGdeltDate(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString();
  try {
    const cleaned = rawDate.replace(/[^0-9]/g, '');
    if (cleaned.length >= 14) {
      const year = cleaned.substring(0, 4);
      const month = cleaned.substring(4, 6);
      const day = cleaned.substring(6, 8);
      const hour = cleaned.substring(8, 10);
      const min = cleaned.substring(10, 12);
      const sec = cleaned.substring(12, 14);
      return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`).toISOString();
    }
  } catch {
    // Fallback
  }
  return new Date().toISOString();
}

/**
 * Safe, rate-throttled query to GDELT 2.0 Document API
 */
export async function queryGdeltArticles(params: {
  query?: string;
  countryCode?: string;
  language?: string;
  maxRecords?: number;
}): Promise<EngineArticle[]> {
  const queryTerm = params.query || 'world';
  const countryCode = params.countryCode?.toUpperCase();
  const langFilter = params.language ? GDELT_LANG_MAP[params.language] || params.language : '';
  const max = Math.min(params.maxRecords || 10, 15);

  const cacheKey = `${queryTerm}__${countryCode || ''}__${langFilter || ''}__${max}`;
  const now = Date.now();
  const cached = gdeltCache.get(cacheKey);

  // Return cached result if fresh (< 20 minutes)
  if (cached && now - cached.timestamp < 20 * 60 * 1000) {
    return cached.articles;
  }

  // Throttle enforcement: If called within 5.5 seconds, return cached or empty rather than getting blocked
  if (now - lastGdeltCallTime < MIN_GDELT_INTERVAL_MS) {
    if (cached) return cached.articles;
    // Don't hammer GDELT if throttled
    return [];
  }

  try {
    lastGdeltCallTime = Date.now();

    const queryParts: string[] = [queryTerm];
    if (countryCode) {
      queryParts.push(`sourcecountry:${countryCode}`);
    }
    if (langFilter) {
      queryParts.push(`sourcelang:${langFilter}`);
    }

    const fullQuery = queryParts.join(' ');
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(
      fullQuery
    )}&mode=artlist&format=json&maxrecords=${max}&sort=hybridrel`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MooEarthLive/2.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(12000), // 12-second timeout to accommodate GDELT latency
    });

    if (!res.ok) {
      console.warn(`[NewsEngine GDELT] API returned HTTP ${res.status}`);
      return cached ? cached.articles : [];
    }

    const text = await res.text();
    // Verify response is JSON (GDELT returns plain text when rate limited)
    if (!text.trim().startsWith('{')) {
      console.warn(`[NewsEngine GDELT] Throttled or plain text message: ${text.substring(0, 100)}`);
      return cached ? cached.articles : [];
    }

    const data = JSON.parse(text);
    const rawArticles: GdeltDocItem[] = data.articles || [];

    const articles: EngineArticle[] = [];

    for (let i = 0; i < rawArticles.length; i++) {
      const item = rawArticles[i];
      if (!item.url || !item.title) continue;

      const cleanTitle = cleanTitleText(item.title);
      const domain = item.domain || 'news.global';
      const publisherName = domain.replace(/^www\./, '').split('.')[0].toUpperCase();

      // Resolve country
      let resolvedCountry = 'International';
      let resolvedCity = 'Global';
      let lat = 20.0;
      let lng = 0.0;

      if (item.sourcecountry) {
        const countryRec = getCountryById(item.sourcecountry);
        if (countryRec) {
          resolvedCountry = countryRec.name;
          resolvedCity = countryRec.capital || 'Capital';
          lat = countryRec.coordinates.lat;
          lng = countryRec.coordinates.lng;
        }
      }

      if (resolvedCountry === 'International') {
        const geo = resolveGeo(cleanTitle, domain);
        resolvedCountry = geo.country;
        resolvedCity = geo.city;
        lat = geo.lat;
        lng = geo.lng;
      }

      const publishedAt = parseGdeltDate(item.seendate);

      articles.push({
        id: `gdelt-${Date.now().toString(36)}-${i}`,
        title: cleanTitle,
        summary: cleanTitle,
        sourceUrl: item.url,
        publisher: publisherName,
        publisherDomain: domain,
        category: 'breaking',
        country: resolvedCountry,
        city: resolvedCity,
        lat,
        lng,
        publishedAt,
        language: item.language || params.language || 'en',
        accessLevel: 'dispatch',
        accessLabel: 'Publisher Dispatch',
        imageUrl: item.socialimage || undefined,
        sourceType: 'gdelt',
        relatedSources: [],
      });
    }

    if (articles.length > 0) {
      gdeltCache.set(cacheKey, { timestamp: Date.now(), articles });
    }

    return articles;
  } catch (err: any) {
    console.warn(`[NewsEngine GDELT] Non-blocking fetch notice: ${err?.message}`);
    return cached ? cached.articles : [];
  }
}
