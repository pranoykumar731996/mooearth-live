import { WorldEvent, EventCategory } from '@/types';
import { fetchLiveNews, searchLiveNews } from './news';
import { fetchLiveFootball } from './football';
import { COUNTRY_COORDINATES } from '@/lib/constants';

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

export async function fetchAllEvents(): Promise<EventsWithStatus> {
  const [newsResult, footballResult] = await Promise.all([
    fetchLiveNews(),
    fetchLiveFootball()
  ]);

  // Sort by published date descending (newest first)
  const combined = [...newsResult.events, ...footballResult.events].sort((a, b) => {
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
    footballEvents = footballResult.events;
    newsActive = newsResult.active;
    footballActive = footballResult.active;
  } else if (category === 'sports' || category === 'football' || category === 'worldcup') {
    const searchTerm = category === 'worldcup' ? `${query} FIFA World Cup` : `${query} sports`;
    const [newsResult, footballResult] = await Promise.all([
      searchLiveNews(searchTerm, category as EventCategory, detectedCountry),
      fetchLiveFootball()
    ]);
    newsEvents = (newsResult.events || []).map(e => ({ ...e, category: category as any }));
    footballEvents = footballResult.events;
    newsActive = newsResult.active;
    footballActive = footballResult.active;
  } else {
    // technology, business, weather, entertainment, breaking
    const searchTerm = category === 'breaking' ? `${query} news` : `${query} ${category}`;
    const newsResult = await searchLiveNews(searchTerm, category as EventCategory, detectedCountry);
    newsEvents = (newsResult.events || []).map(e => ({ ...e, category: category as any }));
    newsActive = newsResult.active;
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
        return e.category === 'worldcup' || e.category === 'football';
      }
      if (category === 'sports') {
        return e.category === 'sports' || e.category === 'football';
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


