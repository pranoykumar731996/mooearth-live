/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactionEvent, WorldEvent, EventCategory } from '@/types';
import { fetchLiveFootball } from './football';
import { fetchLiveNews, searchLiveNews, generateLocalFallbackEvents } from './news';
import { fetchSocialReactions } from './social';
import { analyzeSentiment } from './sentiment';

import fs from 'fs';
import path from 'path';
import { analyzeCelebrationSentiment } from './celebration-ai';

// In-memory cache for country reactions to avoid spamming APIs (reduced to 2s for near-instant live updates)
const reactionCache = new Map<string, { data: ReactionEvent; timestamp: number }>();
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
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const n1 = norm(c1);
  const n2 = norm(c2);
  if (n1 === n2) return true;
  if (n1 === 'unitedstates' && n2 === 'unitedstatesofamerica') return true;
  if (n1 === 'unitedstatesofamerica' && n2 === 'unitedstates') return true;
  if (n1 === 'usa' && (n2 === 'unitedstates' || n2 === 'unitedstatesofamerica')) return true;
  if (n1 === 'unitedkingdom' && (n2 === 'england' || n2 === 'uk' || n2 === 'greatbritain')) return true;
  if ((n1 === 'england' || n1 === 'uk' || n1 === 'greatbritain') && n2 === 'unitedkingdom') return true;
  return false;
}

export async function fetchCountryReactions(country: string, category?: string | null): Promise<ReactionEvent> {
  const cacheKey = `${country}_${category || 'home'}`;
  const cached = reactionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 2000) {
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
    worldcup: 'FIFA World Cup',
    technology: 'Technology',
    business: 'Business',
    weather: 'Weather',
    entertainment: 'Entertainment'
  };

  const catLabel = categoryLabelMap[category || ''] || 'News';

  if (category && category !== 'home') {
    if (category === 'sports' || category === 'football' || category === 'worldcup') {
      const footballResult = await fetchLiveFootball();
      const football = footballResult.events;

      // Filter football events strictly by country
      const countryFootball = football.filter(
        (e) =>
          isSameCountry(e.country, country) ||
          e.title.toLowerCase().includes(country.toLowerCase()) ||
          e.summary.toLowerCase().includes(country.toLowerCase())
      );

      generatedQuery = category === 'worldcup' ? `${country} FIFA World Cup` : category === 'football' ? `${country} Football` : `${country} Sports`;
      const newsResult = await searchLiveNews(generatedQuery, category as EventCategory, country);
      let newsEvents = (newsResult.events || []).filter(e => isSameCountry(e.country, country));

      if (newsEvents.length === 0 && countryFootball.length === 0) {
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

      newsHeadlines = [...countryFootball, ...newsEvents];
    } else {
      // technology, business, weather, entertainment, breaking
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
    }
  } else {
    // Home mode
    generatedQuery = `${country} News`;
    const [footballResult, newsResult] = await Promise.all([
      fetchLiveFootball(),
      fetchLiveNews()
    ]);

    const football = footballResult.events;
    const news = newsResult.events;

    // Filter by country
    const countryFootball = football.filter(
      (e) =>
        isSameCountry(e.country, country) ||
        e.title.toLowerCase().includes(country.toLowerCase()) ||
        e.summary.toLowerCase().includes(country.toLowerCase())
    );

    let newsEvents = news.filter(
      (e) =>
        isSameCountry(e.country, country) ||
        e.title.toLowerCase().includes(country.toLowerCase()) ||
        e.summary.toLowerCase().includes(country.toLowerCase())
    );

    // If no general headlines match this country, search specifically for this country
    if (newsEvents.length === 0 && countryFootball.length === 0) {
      const searchResult = await searchLiveNews(generatedQuery, null, country);
      newsEvents = (searchResult.events || []).filter(e => isSameCountry(e.country, country));
    }

    if (newsEvents.length === 0 && countryFootball.length === 0) {
      newsEvents = generateLocalFallbackEvents(generatedQuery, null, country);
      dataSource = 'Local Fallback Database';
    }

    newsHeadlines = [...countryFootball, ...newsEvents];
  }

  // Read local fan celebrations and filter for this country (only for sports / football / worldcup / home)
  const allCelebrations = readCelebrations();
  const countryCelebrations = (!category || ['sports', 'football', 'worldcup'].includes(category))
    ? allCelebrations.filter(
        (c: any) => isSameCountry(c.country, country) && (!c.reports || c.reports < 3)
      )
    : [];

  // Convert celebrations to headlines so they render in the Reaction Feed
  const celebrationHeadlines = countryCelebrations.map((c: any) => ({
    id: c.id,
    title: `[Fan ${c.type.toUpperCase()}] ${c.username} reacted: "${c.comment}"`,
    summary: `Live fan feedback uploaded from ${c.country}.`,
    category: 'football' as any,
    country: c.country,
    city: 'Live Network',
    lat: c.lat,
    lng: c.lng,
    source: 'Fan Upload Network',
    publishedAt: new Date(c.timestamp).toISOString(),
    footballData: c.match ? {
      homeTeam: c.match.split(' vs ')[0] || c.match,
      awayTeam: c.match.split(' vs ')[1] || '',
      homeScore: 0,
      awayScore: 0,
      status: 'LIVE',
      elapsed: 90
    } : undefined
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
