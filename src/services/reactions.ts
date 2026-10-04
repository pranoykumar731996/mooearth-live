import { ReactionEvent, WorldEvent, EventCategory } from '@/types';
import { fetchLiveNews, searchLiveNews, generateLocalFallbackEvents } from './news';
import { fetchSocialReactions } from './social';
import { analyzeSentiment } from './sentiment';

import fs from 'fs';
import path from 'path';
import { analyzeCelebrationSentiment } from './celebration-ai';
import { BoundedMap } from '@/lib/rate-limiter';

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

import { matchCountry } from '@/data/questions';

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

  let newsHeadlines: WorldEvent[] = [];
  let generatedQuery = '';
  let dataSource = 'Google News RSS Search';
  let noCategoryContent = false;

  const categoryLabelMap: Record<string, string> = {
    breaking: 'News',
    sports: 'Sports',
    football: 'Football',
    technology: 'Technology',
    business: 'Business',
    weather: 'Weather',
    entertainment: 'Entertainment'
  };

  const catLabel = categoryLabelMap[category || ''] || 'News';

  if (category && category !== 'home') {
    generatedQuery = category === 'breaking' ? `${country} Breaking News` : `${country} ${catLabel}`;
    const newsResult = await searchLiveNews(generatedQuery, category as EventCategory, country);
    let newsEvents = (newsResult.events || []).filter(e => isSameCountry(e.country, country));

    if (newsEvents.length === 0) {
      noCategoryContent = true;
      const generalQuery = `${country} News`;
      const fallbackResult = await searchLiveNews(generalQuery, null, country);
      newsEvents = (fallbackResult.events || []).filter(e => isSameCountry(e.country, country));
      dataSource = 'Google News RSS Search (Related Fallback)';

      if (newsEvents.length === 0) {
        newsEvents = generateLocalFallbackEvents(generalQuery, null, country);
        dataSource = 'Local Fallback Database (Related)';
      }
    }

    newsHeadlines = newsEvents;
  } else {
    // Home mode
    generatedQuery = `${country} News`;
    const newsResult = await fetchLiveNews();
    const news = newsResult.events;

    let newsEvents = news.filter(
      (e) =>
        isSameCountry(e.country, country) ||
        e.title.toLowerCase().includes(country.toLowerCase()) ||
        e.summary.toLowerCase().includes(country.toLowerCase())
    );

    // If no general headlines match this country, search specifically for this country
    if (newsEvents.length === 0) {
      const searchResult = await searchLiveNews(generatedQuery, null, country);
      newsEvents = (searchResult.events || []).filter(e => isSameCountry(e.country, country));
    }

    if (newsEvents.length === 0) {
      newsEvents = generateLocalFallbackEvents(generatedQuery, null, country);
      dataSource = 'Local Fallback Database';
    }

    newsHeadlines = newsEvents;
  }

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
    category: 'sports' as any,
    country: c.country,
    city: 'Live Network',
    lat: c.lat,
    lng: c.lng,
    source: 'Fan Upload Network',
    publishedAt: new Date(c.timestamp).toISOString()
  }));

  const allHeadlines = [...celebrationHeadlines, ...newsHeadlines];
  let contextText = allHeadlines.map(h => `${h.title}: ${h.summary}`).join('. ');

  if (!contextText) {
    contextText = `No live events currently reported for ${country}`;
  }

  const socialData = await fetchSocialReactions(country, category);

  // 3. Analyze Sentiment (Use celebration sentiment if there are fan uploads)
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
    query: generatedQuery,
    source: dataSource,
    noCategoryContent,
    fallbackCategory: noCategoryContent ? catLabel : undefined
  };

  reactionCache.set(cacheKey, { data: reactionData, timestamp: Date.now() });

  return reactionData;
}
