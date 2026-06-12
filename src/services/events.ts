import { WorldEvent } from '@/types';
import { fetchLiveNews, searchLiveNews } from './news';
import { fetchLiveFootball } from './football';

export interface EventsWithStatus {
  events: WorldEvent[];
  status: {
    newsActive: boolean;
    footballActive: boolean;
  };
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

export async function searchAllEvents(query: string): Promise<EventsWithStatus> {
  const [newsResult, footballResult] = await Promise.all([
    searchLiveNews(query),
    fetchLiveFootball()
  ]);

  // Filter football matches locally by query
  const q = query.toLowerCase();
  const matchedFootball = footballResult.events.filter(e => 
    e.title.toLowerCase().includes(q) || 
    (e.country && e.country.toLowerCase().includes(q)) ||
    (e.city && e.city.toLowerCase().includes(q)) ||
    (e.summary && e.summary.toLowerCase().includes(q))
  );

  const combined = [...newsResult.events, ...matchedFootball].sort((a, b) => {
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


