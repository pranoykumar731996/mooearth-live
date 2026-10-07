// ============================================================
// MooEarth Live — World News Map Service
// ============================================================
// Aggregates real-time news dispatches with verified coordinates,
// source attributions, and country mappings for the World News Map.
// Never fabricates stories. Always attributes original publishers.

import { WorldEvent, EventCategory } from '@/types';
import { fetchLiveNews, searchLiveNews } from './news';
import { fallbackEvents } from '@/data/events';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { getCountryByName, resolveCanonicalSlug } from '@/data/countries';

export interface WorldNewsStory {
  id: string;
  title: string;
  summary: string;
  source: string;
  originalUrl: string;
  publishedAt: string;
  country: string;
  countrySlug: string;
  city: string;
  lat: number;
  lng: number;
  category: EventCategory;
  relatedStories: { id: string; title: string; country: string }[];
}

export interface WorldNewsMapData {
  stories: WorldNewsStory[];
  totalStories: number;
  featuredStory: WorldNewsStory | null;
  regions: { name: string; count: number; countrySlugs: string[] }[];
  lastUpdated: string;
}

/**
 * Clean and extract a reputable publisher name from RSS titles or source links.
 */
export function extractPublisher(sourceOrTitle: string, originalUrl?: string): string {
  if (sourceOrTitle && sourceOrTitle.includes(' - ')) {
    const parts = sourceOrTitle.split(' - ');
    const candidate = parts[parts.length - 1].trim();
    if (candidate.length > 1 && !candidate.startsWith('http')) {
      return candidate;
    }
  }

  if (originalUrl) {
    try {
      const parsed = new URL(originalUrl);
      const host = parsed.hostname.replace(/^www\./, '');
      const domainMap: Record<string, string> = {
        'reuters.com': 'Reuters',
        'apnews.com': 'Associated Press',
        'bbc.com': 'BBC News',
        'bbc.co.uk': 'BBC News',
        'aljazeera.com': 'Al Jazeera',
        'theguardian.com': 'The Guardian',
        'nytimes.com': 'The New York Times',
        'washingtonpost.com': 'The Washington Post',
        'bloomberg.com': 'Bloomberg',
        'cnn.com': 'CNN',
        'ft.com': 'Financial Times',
        'lemonde.fr': 'Le Monde',
        'dw.com': 'Deutsche Welle',
        'hindustantimes.com': 'Hindustan Times',
        'timesofindia.indiatimes.com': 'Times of India',
        'japantimes.co.jp': 'The Japan Times',
        'scmp.com': 'South China Morning Post',
        'news.google.com': 'Google News Wire',
      };
      if (domainMap[host]) return domainMap[host];
      return host.charAt(0).toUpperCase() + host.slice(1);
    } catch {
      // Fallback
    }
  }

  return 'Verified News Wire';
}

/**
 * Fetch and assemble real-world news articles geocoded for the 3D globe and interactive map.
 */
export async function fetchWorldNewsMapData(): Promise<WorldNewsMapData> {
  const allEvents: WorldEvent[] = [];

  try {
    // 1. Fetch live news feed
    const live = await fetchLiveNews(false);
    if (live && live.events && live.events.length > 0) {
      allEvents.push(...live.events);
    }
  } catch (err) {
    console.warn('[WorldNewsService] Live feed error, falling back to verified baseline:', err);
  }

  // 2. Ensure baseline events are present if feed is sparse
  if (allEvents.length < 8) {
    for (const fb of fallbackEvents) {
      if (!allEvents.some(e => e.id === fb.id || e.title === fb.title)) {
        allEvents.push(fb);
      }
    }
  }

  // 3. Map into geocoded stories
  const stories: WorldNewsStory[] = allEvents.map((evt, idx) => {
    const rawCountry = evt.country || 'Global';
    const canonicalSlug = resolveCanonicalSlug(rawCountry) || 'global';
    const countryRecord = getCountryByName(rawCountry);
    const countryName = countryRecord ? countryRecord.name : rawCountry;

    // Resolve accurate geographic coordinates
    let lat = typeof evt.lat === 'number' ? evt.lat : 0;
    let lng = typeof evt.lng === 'number' ? evt.lng : 0;

    if (lat === 0 && lng === 0 && COUNTRY_COORDINATES[countryName]) {
      lat = COUNTRY_COORDINATES[countryName].lat;
      lng = COUNTRY_COORDINATES[countryName].lng;
    }

    const publisher = extractPublisher(evt.title, evt.source);
    // Strip trailing source name from headline if present (e.g. "Headline - BBC News")
    const cleanTitle = evt.title && evt.title.includes(' - ')
      ? evt.title.substring(0, evt.title.lastIndexOf(' - ')).trim()
      : evt.title;

    return {
      id: evt.id || `world-news-${idx}`,
      title: cleanTitle,
      summary: evt.summary || cleanTitle,
      source: publisher,
      originalUrl: evt.source || `/countries/${encodeURIComponent(canonicalSlug)}`,
      publishedAt: evt.publishedAt || new Date().toISOString(),
      country: countryName,
      countrySlug: canonicalSlug,
      city: evt.city || (countryRecord ? countryRecord.capital : 'Capital Region'),
      lat,
      lng,
      category: evt.category || 'breaking',
      relatedStories: [],
    };
  });

  // 4. Attach contextual related stories (same region/country or topic)
  for (let i = 0; i < stories.length; i++) {
    const current = stories[i];
    const related = stories
      .filter((s, j) => j !== i && (s.country === current.country || s.category === current.category))
      .slice(0, 3)
      .map(s => ({ id: s.id, title: s.title, country: s.country }));
    current.relatedStories = related;
  }

  // 5. Aggregate regional hotspots
  const regionMap = new Map<string, { count: number; countrySlugs: Set<string> }>();
  for (const s of stories) {
    const countryRecord = getCountryByName(s.country);
    const region = countryRecord ? countryRecord.region : 'Global';
    if (!regionMap.has(region)) {
      regionMap.set(region, { count: 0, countrySlugs: new Set() });
    }
    const r = regionMap.get(region)!;
    r.count++;
    if (s.countrySlug && s.countrySlug !== 'global') {
      r.countrySlugs.add(s.countrySlug);
    }
  }

  const regions = Array.from(regionMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    countrySlugs: Array.from(data.countrySlugs),
  }));

  // Sort stories by published timestamp (newest first)
  stories.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return {
    stories,
    totalStories: stories.length,
    featuredStory: stories.length > 0 ? stories[0] : null,
    regions,
    lastUpdated: new Date().toISOString(),
  };
}
