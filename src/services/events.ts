import { WorldEvent, EventCategory } from '@/types';
import { fetchLiveNews, searchLiveNews } from './news';
import { fetchLiveFootball, fetchWorldCupMatches } from './football';
import { COUNTRY_COORDINATES } from '@/lib/constants';

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

export async function fetchAllEvents(): Promise<EventsWithStatus> {
  const [newsResult, footballResult] = await Promise.all([
    fetchLiveNews(),
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

export async function searchAllEvents(query: string, category?: string | null): Promise<EventsWithStatus> {
  let newsEvents: WorldEvent[] = [];
  let footballEvents: WorldEvent[] = [];
  let newsActive = false;
  let footballActive = false;

  const detectedCountry = detectCountry(query);

  if (!category || category === 'home') {
    // Search everything
    const [newsResult, footballResult] = await Promise.all([
      searchLiveNews(query, null, detectedCountry),
      fetchLiveFootball()
    ]);
    newsEvents = newsResult.events;
    footballEvents = footballResult.events.map(sanitizeEventCategory);
    newsActive = newsResult.active;
    footballActive = footballResult.active;
  } else if (category === 'sports' || category === 'football' || category === 'worldcup') {
    if (category === 'worldcup') {
      const [newsResult, wcMatches] = await Promise.all([
        searchLiveNews(`${query} FIFA World Cup`, 'worldcup', detectedCountry),
        fetchWorldCupMatches(false)
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
        searchLiveNews(searchTerm, category as EventCategory, detectedCountry),
        fetchLiveFootball()
      ]);
      newsEvents = (newsResult.events || []).map(e => ({ ...e, category: category as any }));
      footballEvents = footballResult.events.map(sanitizeEventCategory);
      newsActive = newsResult.active;
      footballActive = footballResult.active;
    }
  } else {
    // technology, business, weather, entertainment, breaking
    const searchTerm = category === 'breaking' ? `${query} news` : `${query} ${category}`;
    const newsResult = await searchLiveNews(searchTerm, category as EventCategory, detectedCountry);
    newsEvents = (newsResult.events || []).map(e => ({ ...e, category: category as any }));
    newsActive = newsResult.active;
  }

  // Strictly filter news articles by category to avoid cross-contamination
  if (category && category !== 'home') {
    newsEvents = newsEvents.filter(e => isArticleInCategory(e.title, e.summary, category as EventCategory));
  }

  // Filter football matches locally by query
  const q = query.toLowerCase();
  const matchedFootball = footballEvents.filter(e => 
    e.title.toLowerCase().includes(q) || 
    (e.country && e.country.toLowerCase().includes(q)) ||
    (e.city && e.city.toLowerCase().includes(q)) ||
    (e.summary && e.summary.toLowerCase().includes(q))
  );

  // Filter combined results strictly by category to prevent leakage!
  let combined = [...newsEvents, ...matchedFootball];
  if (category && category !== 'home') {
    combined = combined.filter(e => {
      if (category === 'worldcup') {
        return e.category === 'worldcup';
      }
      if (category === 'football') {
        return e.category === 'football';
      }
      if (category === 'sports') {
        return e.category === 'sports' || e.category === 'football' || e.category === 'worldcup';
      }
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


