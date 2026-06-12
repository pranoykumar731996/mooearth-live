/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactionEvent } from '@/types';
import { fetchLiveFootball } from './football';
import { fetchLiveNews } from './news';
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

export async function fetchCountryReactions(country: string): Promise<ReactionEvent> {
  const cached = reactionCache.get(country);
  if (cached && Date.now() - cached.timestamp < 2000) {
    return cached.data;
  }

  // 1. Fetch related headlines (Football + News)
  const [footballResult, newsResult] = await Promise.all([
    fetchLiveFootball(),
    fetchLiveNews()
  ]);

  const football = footballResult.events;
  const news = newsResult.events;

  // Read local fan celebrations and filter for this country
  const allCelebrations = readCelebrations();
  const countryCelebrations = allCelebrations.filter(
    (c: any) => isSameCountry(c.country, country) && (!c.reports || c.reports < 3)
  );

  let newsHeadlines = [...football, ...news].filter(
    (e) =>
      isSameCountry(e.country, country) ||
      e.title.toLowerCase().includes(country.toLowerCase()) ||
      e.summary.toLowerCase().includes(country.toLowerCase())
  );

  // If no general headlines match this country, search specifically for this country
  if (newsHeadlines.length === 0) {
    try {
      const { searchLiveNews } = require('./news');
      const searchResult = await searchLiveNews(country);
      if (searchResult.events && searchResult.events.length > 0) {
        newsHeadlines = [...football, ...searchResult.events].filter(
          (e) =>
            isSameCountry(e.country, country) ||
            e.title.toLowerCase().includes(country.toLowerCase()) ||
            e.summary.toLowerCase().includes(country.toLowerCase())
        );
      }
    } catch (err) {
      console.error(`Failed to perform dynamic country search for ${country}:`, err);
    }
  }

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
  let contextText = allHeadlines.map(h => h.title).join('. ');
  
  if (!contextText) {
    contextText = `No live events currently reported for ${country}`;
  }

  const socialData = await fetchSocialReactions(country);

  // 3. Analyze Sentiment (Use celebration sentiment if there are fan uploads)
  let sentiment;
  if (countryCelebrations.length > 0) {
    sentiment = await analyzeCelebrationSentiment(country, countryCelebrations);
  } else {
    sentiment = await analyzeSentiment(country, contextText + ' ' + socialData.posts.map(p => p.text).join(' '));
  }

  const reactionData: ReactionEvent = {
    id: `rxn-${country}-${Date.now()}`,
    country,
    headlines: allHeadlines,
    socialPosts: socialData.posts,
    trendingHashtags: socialData.hashtags,
    sentiment
  };

  reactionCache.set(country, { data: reactionData, timestamp: Date.now() });

  return reactionData;
}
