import { WorldEvent, EventCategory } from '@/types';
import { fetchLiveNews, searchLiveNews } from './news';
import { fetchLiveFootball, fetchWorldCupMatches } from './football';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { locations, LocationRecord } from '@/data/locations';

export const WORLD_CUP_LEAGUE_IDS = [
  1,   // FIFA World Cup
  10,  // WC Qualification - UEFA
  11,  // WC Qualification - CONMEBOL
  12,  // WC Qualification - CONCACAF
  13,  // WC Qualification - CAF
  14,  // WC Qualification - AFC
  15,  // WC Qualification - OFC
];

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
  
  if (category === 'worldcup') {
    return text.includes('world cup') || text.includes('fifa') || text.includes('2026') || text.includes('worldcup') || text.includes('qualifier') || text.includes('world cup qualification');
  }
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
    return ['football', 'soccer', 'match', 'league', 'stadium', 'cup', 'club', 'fifa', 'uefa', 'goal', 'score', 'team', 'player'].some(kw => text.includes(kw));
  }
  return true; // default/breaking allows all
}

export function sanitizeEventCategory(e: WorldEvent): WorldEvent {
  if (e.category === 'football' && e.footballData?.leagueId) {
    if (WORLD_CUP_LEAGUE_IDS.includes(e.footballData.leagueId)) {
      return { ...e, category: 'worldcup' };
    }
  }
  return e;
}

export async function fetchAllEvents(refresh = false): Promise<EventsWithStatus> {
  const [newsResult, footballResult] = await Promise.all([
    fetchLiveNews(refresh),
    fetchLiveFootball()
  ]);

  const sanitizedNews = newsResult.events;
  const sanitizedFootball = footballResult.events.map(sanitizeEventCategory);

  // Sort by published date descending (newest first)
  const combined = [...sanitizedNews, ...sanitizedFootball].sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return {
    events: combined,
    status: {
      newsActive: newsResult.active,
      footballActive: footballResult.active,
    }
  };
}

export async function searchAllEvents(query: string, category?: string | null, refresh = false): Promise<EventsWithStatus> {
  let newsEvents: WorldEvent[] = [];
  let footballEvents: WorldEvent[] = [];
  let newsActive = false;
  let footballActive = false;

  const detectedCountry = detectCountry(query);

  if (!category || category === 'home') {
    const [newsResult, footballResult] = await Promise.all([
      searchLiveNews(query, null, detectedCountry, refresh),
      fetchLiveFootball()
    ]);
    newsEvents = newsResult.events;
    footballEvents = footballResult.events.map(sanitizeEventCategory);
    newsActive = newsResult.active;
    footballActive = footballResult.active;
  } else if (category === 'sports' || category === 'football' || category === 'worldcup') {
    if (category === 'worldcup') {
      const [newsResult, wcMatches] = await Promise.all([
        searchLiveNews(`${query} FIFA World Cup`, 'worldcup', detectedCountry, refresh),
        fetchWorldCupMatches(refresh)
      ]);
      newsEvents = (newsResult.events || []).map(e => ({ ...e, category: 'worldcup' as any }));
      footballEvents = wcMatches.map(m => ({
        id: m.id,
        title: `${m.homeTeam} vs ${m.awayTeam}`,
        summary: `FIFA World Cup 2026 match at ${m.venue.name}, ${m.venue.city}. Score: ${m.apiData?.homeScore ?? 0} - ${m.apiData?.awayScore ?? 0}.`,
        category: 'worldcup' as any,
        country: m.venue.country,
        city: m.venue.city,
        lat: m.venue.lat,
        lng: m.venue.lng,
        source: 'https://www.api-football.com',
        publishedAt: m.kickoff,
        stadium: m.venue.name,
        footballData: {
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.apiData?.homeScore ?? 0,
          awayScore: m.apiData?.awayScore ?? 0,
          status: m.apiData?.status || 'NS',
          elapsed: m.apiData?.elapsed || 0,
          goals: m.goals || [],
          cards: m.cards || [],
          leagueId: 1
        }
      }));
      newsActive = newsResult.active;
      footballActive = true;
    } else {
      const searchTerm = category === 'sports' ? `${query} sports` : `${query} football`;
      const [newsResult, footballResult] = await Promise.all([
        searchLiveNews(searchTerm, category as EventCategory, detectedCountry, refresh),
        fetchLiveFootball()
      ]);
      newsEvents = (newsResult.events || []).map(e => ({ ...e, category: category as any }));
      footballEvents = footballResult.events.map(sanitizeEventCategory);
      newsActive = newsResult.active;
      footballActive = footballResult.active;
    }
  } else {
    const searchTerm = category === 'breaking' ? `${query} news` : `${query} ${category}`;
    const newsResult = await searchLiveNews(searchTerm, category as EventCategory, detectedCountry, refresh);
    newsEvents = (newsResult.events || []).map(e => ({ ...e, category: category as any }));
    newsActive = newsResult.active;
  }

  if (category && category !== 'home') {
    newsEvents = newsEvents.filter(e => isArticleInCategory(e.title, e.summary, category as EventCategory));
  }

  const q = query.toLowerCase();
  const matchedFootball = footballEvents.filter(e => 
    e.title.toLowerCase().includes(q) || 
    (e.country && e.country.toLowerCase().includes(q)) ||
    (e.city && e.city.toLowerCase().includes(q)) ||
    (e.summary && e.summary.toLowerCase().includes(q))
  );

  let combined = [...newsEvents, ...matchedFootball];
  if (category && category !== 'home') {
    combined = combined.filter(e => {
      if (category === 'worldcup') return e.category === 'worldcup';
      if (category === 'football') return e.category === 'football';
      if (category === 'sports') return e.category === 'sports' || e.category === 'football' || e.category === 'worldcup';
      return e.category === category;
    });
  }

  combined.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return {
    events: combined,
    status: {
      newsActive,
      footballActive
    }
  };
}

/**
 * Builds a search query for Google News RSS incorporating the category filter.
 */
function buildLocationQuery(locName: string, category?: string | null): string {
  if (!category || category === 'home') return `"${locName}"`;
  if (category === 'breaking') return `"${locName}" news`;
  if (category === 'worldcup') return `"${locName}" FIFA World Cup`;
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
  refresh = false
): Promise<LocationEventsResult> {
  const resolvedLocation = locations.find(l => l.id === locationId);
  if (!resolvedLocation) {
    throw new Error(`Location ID "${locationId}" not found in database.`);
  }

  let events: WorldEvent[] = [];
  let newsActive = false;
  let footballActive = false;

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

  // 1. Try City level (if resolved is city)
  if (resolvedLocation.type === 'city') {
    const q = buildLocationQuery(resolvedLocation.name, category);
    const res = await searchLiveNews(q, category as EventCategory, resolvedLocation.country, refresh);
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
      const res = await searchLiveNews(q, category as EventCategory, resolvedLocation.country, refresh);
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
    const res = await searchLiveNews(q, category as EventCategory, resolvedLocation.country, refresh);
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

  // Filter football matches (only for sports / football / worldcup)
  if (category === 'sports' || category === 'football' || category === 'worldcup') {
    let matches: WorldEvent[] = [];
    if (category === 'worldcup') {
      const wcMatches = await fetchWorldCupMatches(refresh);
      matches = wcMatches.map(m => ({
        id: m.id,
        title: `${m.homeTeam} vs ${m.awayTeam}`,
        summary: `FIFA World Cup 2026 match at ${m.venue.name}, ${m.venue.city}. Score: ${m.apiData?.homeScore ?? 0} - ${m.apiData?.awayScore ?? 0}.`,
        category: 'worldcup' as any,
        country: m.venue.country,
        city: m.venue.city,
        lat: m.venue.lat,
        lng: m.venue.lng,
        source: 'https://www.api-football.com',
        publishedAt: m.kickoff,
        stadium: m.venue.name,
        footballData: {
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.apiData?.homeScore ?? 0,
          awayScore: m.apiData?.awayScore ?? 0,
          status: m.apiData?.status || 'NS',
          elapsed: m.apiData?.elapsed || 0,
          goals: m.goals || [],
          cards: m.cards || [],
          leagueId: 1
        }
      }));
      footballActive = true;
    } else {
      const footballResult = await fetchLiveFootball();
      matches = footballResult.events.map(sanitizeEventCategory);
      footballActive = footballResult.active;
    }

    // Filter football matches by the selected location's attributes
    const nameToMatch = resolvedLocation.name.toLowerCase();
    const stateToMatch = resolvedLocation.state?.toLowerCase() || '';
    const countryToMatch = resolvedLocation.country.toLowerCase();

    const matchedMatches = matches.filter(m => {
      const city = m.city?.toLowerCase() || '';
      const country = m.country?.toLowerCase() || '';
      const stadium = m.stadium?.toLowerCase() || '';
      const title = m.title.toLowerCase();

      if (resolvedLocation.type === 'city') {
        return city.includes(nameToMatch) || stadium.includes(nameToMatch) || title.includes(nameToMatch);
      }
      if (resolvedLocation.type === 'state') {
        return city.includes(nameToMatch) || stateToMatch.includes(nameToMatch) || title.includes(nameToMatch);
      }
      return country.includes(countryToMatch) || title.includes(countryToMatch);
    });

    events = [...events, ...matchedMatches];
  }

  // Double-filter events strictly by category (isolated categories)
  if (category && category !== 'home') {
    events = events.filter(e => {
      if (category === 'worldcup') return e.category === 'worldcup';
      if (category === 'football') return e.category === 'football';
      if (category === 'sports') return e.category === 'sports' || e.category === 'football' || e.category === 'worldcup';
      return e.category === category;
    });
  }

  events.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return {
    events,
    status: {
      newsActive,
      footballActive
    },
    resolvedLocation,
    activeLocation,
    fallbackLevel
  };
}
