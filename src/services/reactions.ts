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

export async function fetchCountryReactions(country: string): Promise<ReactionEvent> {
  const cached = reactionCache.get(country);
  if (cached && Date.now() - cached.timestamp < 2000) {
    return cached.data;
  }

  // 1. Fetch related headlines (Football + News)
  const [football, news] = await Promise.all([
    fetchLiveFootball(),
    fetchLiveNews()
  ]);

  // Read local fan celebrations and filter for this country
  const allCelebrations = readCelebrations();
  const countryCelebrations = allCelebrations.filter(
    (c: any) => c.country.toLowerCase() === country.toLowerCase() && (!c.reports || c.reports < 3)
  );

  const newsHeadlines = [...football, ...news].filter(
    (e) => e.country.toLowerCase() === country.toLowerCase() || e.title.toLowerCase().includes(country.toLowerCase()) || e.summary.toLowerCase().includes(country.toLowerCase())
  );

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
    // Generate deterministic diverse states based on country string hash
    const hash = country.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const state = hash % 5;
    
    if (state === 0) contextText = `${country} just scored a massive win! Fans are in absolute celebration.`;
    else if (state === 1) contextText = `${country} suffers a devastating loss and is knocked out of the tournament.`;
    else if (state === 2) contextText = `A controversial referee decision leaves ${country} fans furious and angry.`;
    else if (state === 3) contextText = `Total shock as ${country} pulls off an unbelievable upset victory!`;
    else contextText = `${country} is preparing for their upcoming World Cup fixture. Fans are gathering in the host cities.`;

    // Ensure the country always has at least one headline to show in the UI
    allHeadlines.push({
      id: `mock-headline-${country}-${Date.now()}`,
      title: contextText,
      summary: `Live reporting and sentiment tracking for ${country} as events unfold on the global stage.`,
      category: 'breaking',
      country: country,
      city: 'Capital',
      lat: 0,
      lng: 0,
      source: 'MooEarth Live',
      publishedAt: new Date().toISOString()
    });
  }

  // 2. Fetch Social Reactions
  const socialData = await fetchSocialReactions(country, contextText);

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
