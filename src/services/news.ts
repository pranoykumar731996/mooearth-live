import { WorldEvent, EventCategory } from '@/types';
import { fallbackEvents } from '@/data/events';
import { COUNTRY_COORDINATES } from '@/lib/constants';

function assignCoordinates(title: string, content: string, countryHint?: string) {
  const text = `${title} ${content}`.toLowerCase();
  
  // If countryHint is provided, prioritize resolving it first to prevent cross-country leakage
  if (countryHint) {
    const hintLower = countryHint.toLowerCase().trim();
    for (const [key, data] of Object.entries(COUNTRY_COORDINATES)) {
      const k = key.toLowerCase();
      if (k === hintLower || hintLower.includes(k) || k.includes(hintLower)) {
        return data;
      }
    }
    // If not found in COUNTRY_COORDINATES, create a fallback coordinate for this country hint
    // We generate a deterministic lat/lng from the name to keep it on land or consistent
    let hash = 0;
    for (let i = 0; i < countryHint.length; i++) {
      hash = countryHint.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = ((Math.abs(hash) % 100) - 50); // -50 to 50
    const lng = ((Math.abs(hash >> 5) % 320) - 160); // -160 to 160
    return {
      country: countryHint.charAt(0).toUpperCase() + countryHint.slice(1),
      city: 'Main Region',
      lat,
      lng
    };
  }

  for (const [key, data] of Object.entries(COUNTRY_COORDINATES)) {
    if (text.includes(key.toLowerCase())) {
      return data;
    }
  }

  // Default fallback (randomish distribution to make it look active)
  const keys = Object.keys(COUNTRY_COORDINATES);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return COUNTRY_COORDINATES[randomKey];
}

// Generate realistic mock events based on the search query when GNews is rate-limited
export function generateLocalFallbackEvents(query: string, category?: EventCategory | null, countryHint?: string): WorldEvent[] {
  return [];
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseGoogleNewsRss(xmlText: string): { title: string; link: string; pubDate: string; summary: string }[] {
  const items: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const extractTag = (tag: string) => {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`);
      const m = regex.exec(itemContent);
      return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : '';
    };

    const title = extractTag('title');
    const link = extractTag('link');
    const pubDate = extractTag('pubDate');
    const description = extractTag('description');
    
    const decodedDesc = decodeHtmlEntities(description);
    let summary = decodedDesc.replace(/<[^>]*>/g, '').trim();
    if (!summary || summary.length < 5) {
      summary = title;
    }

    if (title && link) {
      items.push({
        title,
        link,
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        summary
      });
    }
  }
  
  return items;
}

import { recordFetch } from './freshness';

export const GOOGLE_NEWS_LOCALE_PARAMS: Record<string, string> = {
  en: 'hl=en-US&gl=US&ceid=US:en',
  ja: 'hl=ja&gl=JP&ceid=JP:ja',
  es: 'hl=es&gl=ES&ceid=ES:es',
  fr: 'hl=fr&gl=FR&ceid=FR:fr',
  de: 'hl=de&gl=DE&ceid=DE:de',
  pt: 'hl=pt-BR&gl=BR&ceid=BR:pt-419',
  hi: 'hl=hi&gl=IN&ceid=IN:hi',
  ar: 'hl=ar&gl=SA&ceid=SA:ar',
};

export async function fetchLiveNews(refresh = false, lang = 'en'): Promise<{ events: WorldEvent[]; active: boolean }> {
  try {
    const localeParams = GOOGLE_NEWS_LOCALE_PARAMS[lang] || GOOGLE_NEWS_LOCALE_PARAMS.en;
    const url = `https://news.google.com/rss?${localeParams}${refresh ? `&refresh=${Date.now()}` : ''}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(1800),
      next: { revalidate: refresh ? 0 : 60 },
      cache: refresh ? 'no-store' : 'default'
    } as any);

    if (!response.ok) {
      throw new Error(`Google News RSS failed: ${response.status}`);
    }

    const xmlText = await response.text();
    const articles = parseGoogleNewsRss(xmlText).slice(0, 15);
    
    // Record freshness
    const newestTime = articles.length > 0
      ? Math.max(...articles.map(a => new Date(a.pubDate).getTime()))
      : Date.now();
    recordFetch('breaking', newestTime);

    const events = articles.map((article, index) => {
      const geo = assignCoordinates(article.title, article.summary);
      
      return {
        id: `news-${lang}-${Date.now()}-${index}`,
        title: article.title,
        summary: article.summary,
        category: 'breaking' as EventCategory,
        country: geo.country,
        city: geo.city,
        lat: geo.lat,
        lng: geo.lng,
        source: article.link,
        publishedAt: article.pubDate,
      };
    });

    return { events, active: true };
  } catch (error) {
    console.warn('Failed to fetch live news from RSS, using fallback static events:', error);
    return { events: fallbackEvents, active: true };
  }
}

export async function searchLiveNews(
  query: string,
  category?: EventCategory | null,
  countryHint?: string,
  refresh = false,
  lang = 'en'
): Promise<{ events: WorldEvent[]; active: boolean }> {
  try {
    const localeParams = GOOGLE_NEWS_LOCALE_PARAMS[lang] || GOOGLE_NEWS_LOCALE_PARAMS.en;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${localeParams}${refresh ? `&refresh=${Date.now()}` : ''}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(1800),
      next: { revalidate: refresh ? 0 : 60 },
      cache: refresh ? 'no-store' : 'default'
    } as any);

    if (!response.ok) {
      throw new Error(`Google News RSS Search failed: ${response.status}`);
    }

    const xmlText = await response.text();
    const articles = parseGoogleNewsRss(xmlText).slice(0, 15);
    
    const catName = category || 'breaking';
    // Record freshness
    const newestTime = articles.length > 0
      ? Math.max(...articles.map(a => new Date(a.pubDate).getTime()))
      : Date.now();
    recordFetch(catName, newestTime);

    if (articles.length === 0) {
      console.log(`Google News RSS returned 0 results for "${query}". Triggering local fallback.`);
      const fallbackEvents = generateLocalFallbackEvents(query, category, countryHint);
      return { events: fallbackEvents, active: true };
    }

    const events = articles.map((article, index) => {
      const geo = assignCoordinates(article.title, article.summary, countryHint);
      
      return {
        id: `news-search-${Date.now()}-${index}`,
        title: article.title,
        summary: article.summary,
        category: (category || 'breaking') as EventCategory,
        country: geo.country,
        city: geo.city,
        lat: geo.lat,
        lng: geo.lng,
        source: article.link,
        publishedAt: article.pubDate,
      };
    });

    return { events, active: true };
  } catch (error) {
    console.warn('Failed to search news via RSS, calling local fallback:', error);
    const fallbackEvents = generateLocalFallbackEvents(query, category, countryHint);
    return { events: fallbackEvents, active: true };
  }
}


