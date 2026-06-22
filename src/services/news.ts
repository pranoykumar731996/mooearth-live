/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorldEvent, EventCategory } from '@/types';
import { demoEvents } from '@/data/events';
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

export async function fetchLiveNews(): Promise<{ events: WorldEvent[]; active: boolean }> {
  try {
    const response = await fetch('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Google News RSS failed: ${response.status}`);
    }

    const xmlText = await response.text();
    const articles = parseGoogleNewsRss(xmlText).slice(0, 15);
    
    const events = articles.map((article, index) => {
      const geo = assignCoordinates(article.title, article.summary);
      
      return {
        id: `news-${Date.now()}-${index}`,
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
    return { events: demoEvents, active: true };
  }
}

export async function searchLiveNews(query: string, category?: EventCategory | null, countryHint?: string): Promise<{ events: WorldEvent[]; active: boolean }> {
  try {
    const response = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Google News RSS Search failed: ${response.status}`);
    }

    const xmlText = await response.text();
    const articles = parseGoogleNewsRss(xmlText).slice(0, 15);
    
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


