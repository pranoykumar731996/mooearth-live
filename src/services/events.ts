import { WorldEvent } from '@/types';
import { fetchLiveNews } from './news';
import { fetchLiveFootball } from './football';

export async function fetchAllEvents(): Promise<WorldEvent[]> {
  const [newsEvents, footballEvents] = await Promise.all([
    fetchLiveNews(),
    fetchLiveFootball()
  ]);

  // Sort by published date descending (newest first)
  const combined = [...newsEvents, ...footballEvents].sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return combined;
}
