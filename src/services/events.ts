import { WorldEvent, EventCategory } from '@/types';
import { fetchLiveNews, searchLiveNews } from './news';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { locations, LocationRecord } from '@/data/locations';

export interface EventsWithStatus {
  events: WorldEvent[];
  status: {
    newsActive: boolean;
    footballActive: boolean;
  };
}

export interface LocationEventsResult {
  events: WorldEvent[];
  status: {
    newsActive: boolean;
    footballActive: boolean;
  };
  resolvedLocation: LocationRecord;
  activeLocation: LocationRecord | { name: string; type: string; country: string; countryCode: string; lat: number; lng: number };
  fallbackLevel: 'city' | 'state' | 'country' | 'global';
}

function detectCountry(text: string): string | undefined {
  const t = text.toLowerCase().trim();
  for (const key of Object.keys(COUNTRY_COORDINATES)) {
    if (t.includes(key.toLowerCase())) {
      return COUNTRY_COORDINATES[key].country;
    }
  }
  return undefined;
}

export function isArticleInCategory(title: string, summary: string, category: EventCategory): boolean {
  const text = `${title} ${summary}`.toLowerCase();
  
  if (category === 'technology') {
    return ['technology', 'tech', 'software', 'ai', 'science', 'semiconductor', 'computing', 'space', 'quantum', 'cyber', 'internet', 'web', 'data', 'algorithm', 'app', 'device', 'phone', 'robot', 'digital'].some(kw => text.includes(kw));
  }
  if (category === 'business') {
    return ['business', 'economy', 'market', 'stocks', 'finance', 'trade', 'currency', 'inflation', 'corporate', 'startup', 'investment', 'bank', 'earnings', 'revenue', 'ceo', 'industry'].some(kw => text.includes(kw));
  }
  if (category === 'weather') {
    return ['weather', 'climate', 'storm', 'rain', 'temperature', 'forecast', 'meteorology', 'flood', 'wind', 'atmosphere', 'heat', 'cold', 'degree', 'season', 'cyclone', 'typhoon', 'hurricane', 'drought', 'snow'].some(kw => text.includes(kw));
  }
  if (category === 'entertainment') {
    return ['entertainment', 'music', 'movie', 'film', 'actor', 'celebrity', 'star', 'festival', 'concert', 'gaming', 'stream', 'tv', 'pop culture', 'theater', 'arts', 'song', 'album', 'hollywood', 'cinema', 'show'].some(kw => text.includes(kw));
  }
  if (category === 'sports') {
    return ['sports', 'match', 'championship', 'tournament', 'cup', 'athlete', 'coach', 'stadium', 'olympic', 'football', 'soccer', 'basketball', 'tennis', 'game', 'score', 'team'].some(kw => text.includes(kw));
  }
  if (category === 'football') {
    return ['football', 'soccer', 'match', 'league', 'stadium', 'cup', 'club', 'uefa', 'goal', 'score', 'team', 'player'].some(kw => text.includes(kw));
  }
  return true; // default/breaking allows all
}

export function detectCategory(title: string, summary: string): EventCategory {
  const text = `${title} ${summary}`.toLowerCase();
  if (['football', 'soccer', 'premier league', 'uefa', 'fifa', 'copa', 'laliga', 'serie a', 'bundesliga', 'striker', 'goalkeeper', 'fc '].some(kw => text.includes(kw))) {
    return 'football';
  }
  if (['sports', 'championship', 'tournament', 'nba', 'nfl', 'olympic', 'tennis', 'basketball', 'baseball', 'cricket', 'rugby', 'golf', 'grand slam', 'formula 1', 'f1', 'athlete'].some(kw => text.includes(kw))) {
    return 'sports';
  }
  if (['technology', 'tech', 'software', 'ai', 'semiconductor', 'computing', 'cyber', 'quantum', 'smartphone', 'apple inc', 'google cloud', 'nvidia', 'chatgpt', 'openai', 'robotics', 'silicon'].some(kw => text.includes(kw))) {
    return 'technology';
  }
  if (['business', 'market', 'stocks', 'nasdaq', 'dow jones', 'inflation', 'federal reserve', 'central bank', 'revenue', 'ipo', 'gdp', 'economy', 'investors', 'wall street'].some(kw => text.includes(kw))) {
    return 'business';
  }
  if (['weather', 'cyclone', 'typhoon', 'hurricane', 'meteorology', 'storm', 'heatwave', 'flooding', 'tornado', 'blizzard', 'snowfall', 'drought', 'forecast'].some(kw => text.includes(kw))) {
    return 'weather';
  }
  if (['entertainment', 'hollywood', 'box office', 'movie', 'film', 'grammy', 'oscar', 'emmy', 'netflix', 'album', 'celebrity', 'broadway', 'billboard', 'cinema'].some(kw => text.includes(kw))) {
    return 'entertainment';
  }
  return 'breaking';
}

export function sanitizeEventCategory(e: WorldEvent): WorldEvent {
  return e;
}

export async function fetchAllEvents(category?: string | null, refresh = false, lang = 'en'): Promise<EventsWithStatus> {
  const cat = (category && category !== 'home') ? (category as EventCategory) : null;

  // If a specific category is requested (technology, sports, football, weather, business, entertainment)
  if (cat && cat !== 'breaking') {
    const searchTerm = cat === 'football' ? 'football soccer match' : cat;
    const newsResult = await searchLiveNews(searchTerm, cat, undefined, refresh, lang);
    let events = (newsResult.events || []).map(e => ({ ...e, category: cat }));
    
    // Filter to ensure relevance, falling back to raw results if overly strict
    const filtered = events.filter(e => isArticleInCategory(e.title, e.summary, cat));
    if (filtered.length > 0) {
      events = filtered;
    }

    events.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return {
      events,
      status: {
        newsActive: newsResult.active,
        footballActive: cat === 'football' || cat === 'sports',
      }
    };
  }

  // Home or breaking: fetch live news and classify each article
  const newsResult = await fetchLiveNews(refresh, lang);
  const events = newsResult.events.map(e => {
    const detected = detectCategory(e.title, e.summary);
    return detected !== 'breaking' ? { ...e, category: detected } : e;
  }).sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return {
    events,
    status: {
      newsActive: newsResult.active,
      footballActive: false,
    }
  };
}

export async function searchAllEvents(query: string, category?: string | null, refresh = false, lang = 'en'): Promise<EventsWithStatus> {
  const detectedCountry = detectCountry(query);
  const cat = (category && category !== 'home') ? (category as EventCategory) : null;
  const searchTerm = cat ? (cat === 'breaking' ? `${query} news` : `${query} ${cat}`) : query;
  
  const newsResult = await searchLiveNews(searchTerm, cat, detectedCountry, refresh, lang);
  let newsEvents = (newsResult.events || []).map(e => ({ ...e, ...(cat ? { category: cat } : {}) }));

  if (cat) {
    newsEvents = newsEvents.filter(e => isArticleInCategory(e.title, e.summary, cat));
  }

  newsEvents.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return {
    events: newsEvents,
    status: {
      newsActive: newsResult.active,
      footballActive: false
    }
  };
}

/**
 * Builds a search query for Google News RSS incorporating the category filter.
 */
function buildLocationQuery(locName: string, category?: string | null): string {
  if (!category || category === 'home') return `"${locName}"`;
  if (category === 'breaking') return `"${locName}" news`;
  if (category === 'sports') return `"${locName}" sports`;
  if (category === 'football') return `"${locName}" football`;
  return `"${locName}" ${category}`;
}

/**
 * Geographic News Fallback Engine
 * Fetches news specifically related to a Location, falling back if no results exist:
 * City -> State -> Country -> Global
 */
export async function getLocationEvents(
  locationId: string,
  category?: string | null,
  refresh = false,
  lang = 'en'
): Promise<LocationEventsResult> {
  const resolvedLocation = locations.find(l => l.id === locationId);
  if (!resolvedLocation) {
    throw new Error(`Location ID "${locationId}" not found in database.`);
  }

  let events: WorldEvent[] = [];
  let newsActive = false;

  let activeLocation: any = resolvedLocation;
  let fallbackLevel: 'city' | 'state' | 'country' | 'global' = 'city';

  // Helper to tag articles with the active location metadata and coordinates
  const tagArticles = (articles: WorldEvent[], loc: LocationRecord): WorldEvent[] => {
    return articles.map(art => ({
      ...art,
      country: loc.country,
      city: loc.type === 'city' ? loc.name : (art.city || ''),
      state: loc.type === 'city' ? (loc.state || '') : (loc.type === 'state' ? loc.name : ''),
      lat: loc.lat,
      lng: loc.lng
    }));
  };

  const cat = (category && category !== 'home') ? (category as EventCategory) : null;

  // 1. Try City level (if resolved is city)
  if (resolvedLocation.type === 'city') {
    const q = buildLocationQuery(resolvedLocation.name, category);
    const res = await searchLiveNews(q, cat, resolvedLocation.country, refresh, lang);
    if (res.events && res.events.length > 0) {
      events = tagArticles(res.events, resolvedLocation);
      newsActive = res.active;
      fallbackLevel = 'city';
    }
  }

  // 2. Try State level (if city returned 0, or if resolved is state)
  if (events.length === 0 && (resolvedLocation.type === 'city' || resolvedLocation.type === 'state')) {
    const stateName = resolvedLocation.type === 'city' ? resolvedLocation.state : resolvedLocation.name;
    const stateLoc = locations.find(l => l.name === stateName && l.type === 'state');
    
    if (stateName) {
      const q = buildLocationQuery(stateName, category);
      const res = await searchLiveNews(q, cat, resolvedLocation.country, refresh, lang);
      if (res.events && res.events.length > 0) {
        events = tagArticles(res.events, stateLoc || resolvedLocation);
        newsActive = res.active;
        fallbackLevel = 'state';
        activeLocation = stateLoc || {
          id: `state-${stateName.toLowerCase()}`,
          name: stateName,
          type: 'state',
          country: resolvedLocation.country,
          countryCode: resolvedLocation.countryCode,
          lat: resolvedLocation.lat,
          lng: resolvedLocation.lng,
          population: 0,
          timezone: resolvedLocation.timezone,
          adminLevel: 1
        };
      }
    }
  }

  // 3. Try Country level (if city/state returned 0, or if resolved is country)
  if (events.length === 0) {
    const countryLoc = locations.find(l => l.name === resolvedLocation.country && l.type === 'country');
    const q = buildLocationQuery(resolvedLocation.country, category);
    const res = await searchLiveNews(q, cat, resolvedLocation.country, refresh);
    if (res.events && res.events.length > 0) {
      events = tagArticles(res.events, countryLoc || resolvedLocation);
      newsActive = res.active;
      fallbackLevel = 'country';
      activeLocation = countryLoc || resolvedLocation;
    }
  }

  // 4. Try Global level fallback
  if (events.length === 0) {
    const res = await fetchLiveNews(refresh);
    events = res.events;
    newsActive = res.active;
    fallbackLevel = 'global';
    activeLocation = {
      name: 'Global',
      type: 'global',
      country: 'Global',
      countryCode: 'GL',
      lat: 20,
      lng: 0
    };
  }

  // Double-filter events strictly by category (isolated categories)
  if (cat) {
    events = events.filter(e => isArticleInCategory(e.title, e.summary, cat));
  }

  events.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return {
    events,
    status: {
      newsActive,
      footballActive: false
    },
    resolvedLocation,
    activeLocation,
    fallbackLevel
  };
}
