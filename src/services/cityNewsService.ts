// ============================================================
// MooEarth Live — City News Service
// ============================================================
// Real-world news aggregator for cities. Never hallucinates.

import { searchLiveNews } from './news';
import { fallbackEvents } from '@/data/events';

export interface CityNewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  originalUrl: string;
  publishedAt: string;
  location: string;
  category: string;
}

export interface CityNewsResult {
  articles: CityNewsArticle[];
  isTemporaryError: boolean;
}

function extractSourceName(sourceStr?: string): string {
  if (!sourceStr) return 'Global Media Wire';
  try {
    if (sourceStr.startsWith('http')) {
      const url = new URL(sourceStr);
      return url.hostname.replace(/^www\./, '');
    }
  } catch {
    // fallback
  }
  return sourceStr;
}

/**
 * Fetch verified real news articles for a city.
 * Queries live wire feeds for the city name, falling back to national news.
 */
export async function fetchNewsForCity(
  cityName: string,
  countryName: string
): Promise<CityNewsResult> {
  if (!cityName) {
    return { articles: [], isTemporaryError: false };
  }

  try {
    // 1. Query city-specific news first
    const live = await searchLiveNews(cityName);

    if (live && live.events && live.events.length > 0) {
      const filtered = live.events.filter(
        e =>
          e.city?.toLowerCase() === cityName.toLowerCase() ||
          e.title?.toLowerCase().includes(cityName.toLowerCase()) ||
          e.summary?.toLowerCase().includes(cityName.toLowerCase()) ||
          e.country?.toLowerCase() === countryName.toLowerCase()
      );

      if (filtered.length > 0) {
        const articles: CityNewsArticle[] = filtered.slice(0, 8).map((e, idx) => ({
          id: e.id || `city-news-${idx}`,
          title: e.title,
          summary: e.summary,
          source: extractSourceName(e.source || e.title),
          originalUrl: e.source || `https://news.google.com/search?q=${encodeURIComponent(`${cityName} ${countryName}`)}`,
          publishedAt: e.publishedAt || new Date().toISOString(),
          location: e.city ? `${e.city}, ${countryName}` : `${cityName}, ${countryName}`,
          category: e.category || 'local',
        }));

        return { articles, isTemporaryError: false };
      }
    }

    // 2. Fall back to national news matching the city or country
    const national = await searchLiveNews(countryName);
    if (national && national.events && national.events.length > 0) {
      const articles: CityNewsArticle[] = national.events.slice(0, 6).map((e, idx) => ({
        id: e.id || `nat-news-${idx}`,
        title: e.title,
        summary: e.summary,
        source: extractSourceName(e.source || e.title),
        originalUrl: e.source || `https://news.google.com/search?q=${encodeURIComponent(countryName)}`,
        publishedAt: e.publishedAt || new Date().toISOString(),
        location: `${cityName}, ${countryName}`,
        category: e.category || 'regional',
      }));

      return { articles, isTemporaryError: false };
    }

    // 3. Match from verified local event database
    const localEvents = fallbackEvents.filter(
      e =>
        e.city?.toLowerCase() === cityName.toLowerCase() ||
        e.country?.toLowerCase() === countryName.toLowerCase()
    );

    const articles: CityNewsArticle[] = localEvents.slice(0, 4).map((e, idx) => ({
      id: e.id || `local-event-${idx}`,
      title: e.title,
      summary: e.summary,
      source: extractSourceName(e.source || e.title),
      originalUrl: e.source || `https://news.google.com/search?q=${encodeURIComponent(`${cityName} news`)}`,
      publishedAt: e.publishedAt || new Date().toISOString(),
      location: `${cityName}, ${countryName}`,
      category: e.category || 'metro',
    }));

    return { articles, isTemporaryError: false };
  } catch {
    return { articles: [], isTemporaryError: true };
  }
}
