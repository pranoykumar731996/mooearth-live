import { ReactionEvent } from '@/types';
import { fetchLiveFootball } from './football';
import { fetchLiveNews } from './news';
import { fetchSocialReactions } from './social';
import { analyzeSentiment } from './sentiment';

// In-memory cache for country reactions to avoid spamming APIs
const reactionCache = new Map<string, { data: ReactionEvent; timestamp: number }>();

export async function fetchCountryReactions(country: string): Promise<ReactionEvent> {
  const cached = reactionCache.get(country);
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }

  // 1. Fetch related headlines (Football + News)
  const [football, news] = await Promise.all([
    fetchLiveFootball(),
    fetchLiveNews()
  ]);

  const allHeadlines = [...football, ...news].filter(
    (e) => e.country.toLowerCase() === country.toLowerCase() || e.title.toLowerCase().includes(country.toLowerCase()) || e.summary.toLowerCase().includes(country.toLowerCase())
  );

  // If no headlines specifically for this country, we create a context placeholder
  const contextText = allHeadlines.length > 0 
    ? allHeadlines.map(h => h.title).join('. ') 
    : `${country} is preparing for their upcoming World Cup fixture. Fans are gathering in the host cities.`;

  // 2. Fetch Social Reactions
  const socialData = await fetchSocialReactions(country, contextText);

  // 3. Analyze Sentiment via AI
  const sentiment = await analyzeSentiment(country, contextText + ' ' + socialData.posts.map(p => p.text).join(' '));

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
