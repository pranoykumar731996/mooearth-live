import { ReactionEvent, WorldEvent, EventCategory } from '@/types';
import { fetchSocialReactions } from './social';
import { analyzeSentiment } from './sentiment';
import fs from 'fs';
import path from 'path';
import { analyzeCelebrationSentiment } from './celebration-ai';
import { BoundedMap } from '@/lib/rate-limiter';
import { matchCountry } from '@/data/questions';
import { searchPlanetaryEvents, planetaryEventToWorldEvent } from './planetaryEngine';

// Bounded in-memory cache for country reactions (max 300 entries, FIFO eviction)
const reactionCache = new BoundedMap<string, { data: ReactionEvent; timestamp: number }>(300);
const dbPath = path.join(process.cwd(), 'src/data/celebrations.json');

function readCelebrations(): any[] {
  try {
    if (!fs.existsSync(dbPath)) return [];
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading celebrations database:', error);
    return [];
  }
}

function isSameCountry(c1?: string | null, c2?: string | null): boolean {
  if (!c1 || !c2) return false;
  return matchCountry(c1, c2);
}

export async function fetchCountryReactions(country: string, category?: string | null): Promise<ReactionEvent> {
  const cacheKey = `${country}_${category || 'home'}`;
  const cached = reactionCache.get(cacheKey);
  // Cache for 60 seconds (prevents rapid LLM sentiment burning while remaining fresh)
  if (cached && Date.now() - cached.timestamp < 60_000) {
    return cached.data;
  }

  const cat = (category && category !== 'home') ? (category as EventCategory) : undefined;
  const rawEvents = await searchPlanetaryEvents(country, cat);
  const countryEvents: WorldEvent[] = rawEvents
    .map(planetaryEventToWorldEvent)
    .filter(e => isSameCountry(e.country, country) || e.title.toLowerCase().includes(country.toLowerCase()));

  const dataSource = countryEvents.length > 0 ? 'Earth Observatories Telemetry' : 'Global Cultural Indicators';

  // Read local fan celebrations and filter for this country (only for sports / football / home)
  const allCelebrations = readCelebrations();
  const countryCelebrations = (!category || ['sports', 'football'].includes(category))
    ? allCelebrations.filter(
        (c: any) => isSameCountry(c.country, country) && (!c.reports || c.reports < 3)
      )
    : [];

  // Convert celebrations to headlines so they render in the Reaction Feed
  const celebrationHeadlines = countryCelebrations.map((c: any) => ({
    id: c.id,
    title: `[Fan ${c.type.toUpperCase()}] ${c.username} reacted: "${c.comment}"`,
    summary: `Live fan feedback uploaded from ${c.country}.`,
    category: 'football' as EventCategory,
    country: c.country,
    city: 'Live Network',
    lat: c.lat,
    lng: c.lng,
    source: 'Fan Upload Network',
    publishedAt: new Date(c.timestamp).toISOString()
  }));

  const allHeadlines = [...celebrationHeadlines, ...countryEvents];
  let contextText = allHeadlines.map(h => `${h.title}: ${h.summary}`).join('. ');

  if (!contextText) {
    contextText = `No live events currently reported for ${country}`;
  }

  const socialData = await fetchSocialReactions(country, category);

  // Analyze Sentiment (Use celebration sentiment if there are fan uploads)
  let sentiment;
  if (countryCelebrations.length > 0) {
    sentiment = await analyzeCelebrationSentiment(country, countryCelebrations);
  } else {
    sentiment = await analyzeSentiment(country, contextText + ' ' + socialData.posts.map(p => p.text).join(' '), category);
  }

  const reactionData: ReactionEvent = {
    id: `rxn-${country}-${Date.now()}`,
    country,
    headlines: allHeadlines,
    socialPosts: socialData.posts,
    trendingHashtags: socialData.hashtags,
    sentiment,
    query: `${country} Pulses`,
    source: dataSource,
    noCategoryContent: countryEvents.length === 0,
    fallbackCategory: countryEvents.length === 0 ? 'Science & Nature' : undefined
  };

  reactionCache.set(cacheKey, { data: reactionData, timestamp: Date.now() });

  return reactionData;
}
