// ============================================================
// MooEarth Live — Country News Service
// ============================================================
// Real-world news aggregator for sovereign countries. Never hallucinates.

import { searchLiveNews } from './news';
import { fallbackEvents } from '@/data/events';
import { getCountryNewsEngineFeed } from './newsEngine';

export interface CountryNewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  originalUrl: string;
  publishedAt: string;
  location: string;
  category: string;
  accessLevel?: string;
  accessLabel?: string;
}

export interface CountryNewsResult {
  articles: CountryNewsArticle[];
  isTemporaryError: boolean;
}

/**
 * Fetch verified real news articles for a country using Multi-Source News Engine 2.0.
 * Extracts original source, headline, timestamp, summary, and location.
 */
export async function fetchNewsForCountry(countryName: string): Promise<CountryNewsResult> {
  if (!countryName) {
    return { articles: [], isTemporaryError: false };
  }

  try {
    // 1. Query Multi-Source News Engine for country-specific feed (GDELT + Publisher RSS)
    const engineArticles = await getCountryNewsEngineFeed(countryName);
    if (engineArticles && engineArticles.length > 0) {
      const articles: CountryNewsArticle[] = engineArticles.map((art, idx) => ({
        id: art.id || `country-news-${idx}`,
        title: art.title,
        summary: art.summary,
        source: art.publisher || extractSourceName(art.title),
        originalUrl: art.sourceUrl,
        publishedAt: art.publishedAt || new Date().toISOString(),
        location: art.city ? `${art.city}, ${art.country}` : countryName,
        category: art.category || 'breaking',
        accessLevel: art.accessLevel,
        accessLabel: art.accessLabel,
      }));

      return { articles, isTemporaryError: false };
    }

    // 2. Fallback to searchLiveNews
    const live = await searchLiveNews(countryName);

    if (live && live.events && live.events.length > 0) {
      // Filter events to only those referencing this country
      const filtered = live.events.filter(
        e =>
          e.country?.toLowerCase() === countryName.toLowerCase() ||
          e.title?.toLowerCase().includes(countryName.toLowerCase()) ||
          e.summary?.toLowerCase().includes(countryName.toLowerCase())
      );

      if (filtered.length > 0) {
        const articles: CountryNewsArticle[] = filtered.map((e, idx) => ({
          id: e.id || `news-${idx}`,
          title: e.title,
          summary: e.summary,
          source: extractSourceName(e.source || e.title),
          originalUrl: e.source,
          publishedAt: e.publishedAt || new Date().toISOString(),
          location: e.city ? `${e.city}, ${countryName}` : countryName,
          category: e.category || 'breaking',
        }));

        return { articles, isTemporaryError: false };
      }
    }

    // Fallback: Check fallback verified events
    const matchingFallback = fallbackEvents.filter(
      e =>
        e.country?.toLowerCase() === countryName.toLowerCase() ||
        e.title?.toLowerCase().includes(countryName.toLowerCase()) ||
        e.summary?.toLowerCase().includes(countryName.toLowerCase())
    );

    const fallbackArticles: CountryNewsArticle[] = matchingFallback.map((e, idx) => ({
      id: e.id || `fallback-${idx}`,
      title: e.title,
      summary: e.summary,
      source: extractSourceName(e.source || e.title),
      originalUrl: e.source || `/countries/${encodeURIComponent(countryName.toLowerCase())}`,
      publishedAt: e.publishedAt || new Date().toISOString(),
      location: e.city ? `${e.city}, ${countryName}` : countryName,
      category: e.category || 'breaking',
    }));

    return {
      articles: fallbackArticles,
      isTemporaryError: false,
    };
  } catch (err) {
    return {
      articles: [],
      isTemporaryError: true,
    };
  }
}

function extractSourceName(sourceOrTitle: string): string {
  if (!sourceOrTitle) return 'Global Wire';
  if (sourceOrTitle.includes(' - ')) {
    const parts = sourceOrTitle.split(' - ');
    return parts[parts.length - 1].trim();
  }
  if (sourceOrTitle.startsWith('http')) {
    try {
      const url = new URL(sourceOrTitle);
      return url.hostname.replace(/^www\./, '');
    } catch {}
  }
  return sourceOrTitle;
}
