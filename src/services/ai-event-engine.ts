// ============================================================
// MooEarth Live — Central AI Event & Cache Engine
// Handles global event scoring, server-side caching (Redis-ready),
// request deduplication (Single Flight), and cost savings analytics.
// ============================================================

import { EarthCastContext } from './commentary-templates';

export interface ServerStats {
  totalRequests: number;
  aiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  voiceGenerations: number;
  estimatedTokensSaved: number;
  estimatedCharactersSaved: number;
  estimatedDollarsSaved: number;
  activeCacheCount: number;
}

export interface CachedNarration {
  text: string;
  emotionColor: string;
  intensity: number;
  audioBase64: string | null;
  eventType: string;
  country: string;
  timestamp: string;
}

interface GlobalCache {
  narrations: Record<string, CachedNarration>;
  inFlight: Record<string, Promise<CachedNarration>>;
  stats: {
    totalRequests: number;
    aiCalls: number;
    cacheHits: number;
    cacheMisses: number;
    voiceGenerations: number;
    estimatedTokensSaved: number;
    estimatedCharactersSaved: number;
    estimatedDollarsSaved: number;
  };
}

// Next.js Global Singleton pattern to prevent HMR reset and persist cache
const globalRef = global as unknown as {
  _earthcastCache?: GlobalCache;
};

if (!globalRef._earthcastCache) {
  globalRef._earthcastCache = {
    narrations: {},
    inFlight: {},
    stats: {
      totalRequests: 0,
      aiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      voiceGenerations: 0,
      estimatedTokensSaved: 0,
      estimatedCharactersSaved: 0,
      estimatedDollarsSaved: 0.00,
    },
  };
}

export const cacheEngine = {
  // Score event importance (1-100)
  scoreEvent(context: EarthCastContext): number {
    switch (context.eventType) {
      case 'goal':
        return 100;
      case 'upset':
        return 100;
      case 'penalty':
        // If it's a shootout, rate it even higher
        return context.score?.includes('PEN') || context.elapsed === 120 ? 95 : 80;
      case 'red_card':
        return 70;
      case 'match_end':
        return context.isUpset ? 90 : 45;
      case 'tension':
        return 50;
      case 'atmosphere_check':
        return 20;
      default:
        return 30;
    }
  },

  // Determine if OpenAI enhancement is needed (Threshold: 75)
  isAINeeded(score: number): boolean {
    return score >= 75;
  },

  // Unique Cache Key Generator per event instance
  getCacheKey(context: EarthCastContext): string {
    const type = context.eventType;
    const country = (context.country || 'world').toLowerCase().replace(/\s+/g, '_');
    
    // Group atmosphere checks into 5-minute cache blocks
    if (type === 'atmosphere_check') {
      const timeBlock = Math.floor(Date.now() / 300000); // 5 minutes (300,000ms)
      const mood = (context.trendingMood || 'electric').toLowerCase().replace(/\s+/g, '_');
      return `atmos_${country}_${mood}_${timeBlock}`;
    }

    // Goal cache key includes scorer and current score to separate back-to-back goals
    if (type === 'goal') {
      const scorer = (context.playerName || 'scorer').toLowerCase().replace(/\s+/g, '_');
      const score = (context.score || 'score').replace(/\s+/g, '');
      return `goal_${country}_${scorer}_${score}`;
    }

    // Penalty key
    if (type === 'penalty') {
      const scorer = (context.playerName || 'taker').toLowerCase().replace(/\s+/g, '_');
      return `penalty_${country}_${scorer}`;
    }

    // Red card
    if (type === 'red_card') {
      const player = (context.playerName || 'player').toLowerCase().replace(/\s+/g, '_');
      return `redcard_${country}_${player}`;
    }

    // Tension key (cache per minute of the match to prevent duplicate late-game narrations)
    if (type === 'tension') {
      const min = context.elapsed || 90;
      return `tension_${country}_${min}`;
    }

    // General default key
    const suffix = context.score ? '_' + context.score.replace(/\s+/g, '') : '';
    return `${type}_${country}${suffix}`;
  },

  // Get current cache entry
  get(key: string): CachedNarration | undefined {
    return globalRef._earthcastCache?.narrations[key];
  },

  // Set cache entry and calculate financial savings
  set(key: string, data: CachedNarration) {
    if (!globalRef._earthcastCache) return;
    
    globalRef._earthcastCache.narrations[key] = data;

    // Clean up in-flight promise ref once done
    delete globalRef._earthcastCache.inFlight[key];
  },

  // Track an in-flight generation promise (Single Flight deduplication)
  getInFlight(key: string): Promise<CachedNarration> | undefined {
    return globalRef._earthcastCache?.inFlight[key];
  },

  setInFlight(key: string, promise: Promise<CachedNarration>) {
    if (!globalRef._earthcastCache) return;
    globalRef._earthcastCache.inFlight[key] = promise;
  },

  // Retrieve metrics dashboard stats
  getStats(): ServerStats {
    const cache = globalRef._earthcastCache!;
    const activeCacheCount = Object.keys(cache.narrations).length;

    return {
      ...cache.stats,
      activeCacheCount,
    };
  },

  // Increment metrics
  increment(metric: keyof GlobalCache['stats'], amount = 1) {
    if (!globalRef._earthcastCache) return;
    globalRef._earthcastCache.stats[metric] += amount;
  },

  // Calculate savings on cache hit or template bypass
  trackSavings(narrationText: string, cacheHit: boolean, ttsSaved: boolean) {
    if (!globalRef._earthcastCache) return;
    const stats = globalRef._earthcastCache.stats;

    // 1. Completion Token Savings:
    // If it's a cache hit or templated bypass, we save completion API tokens.
    // Average completion request is ~150 prompt tokens + 45 completion tokens = 195 tokens.
    if (!cacheHit) {
      // If we didn't call AI (templated), we saved the tokens.
      stats.estimatedTokensSaved += 195;
    } else {
      // If it is a cache hit, we saved the API call entirely.
      stats.estimatedTokensSaved += 195;
    }

    // 2. TTS Character Savings:
    // If we play audio from cache, we save characters sent to OpenAI TTS.
    if (ttsSaved) {
      stats.estimatedCharactersSaved += narrationText.length;
    }

    // 3. Financial calculations:
    // GPT-4o-mini pricing: ~$0.30 per 1M tokens average input/output blend.
    // OpenAI TTS pricing: $15.00 per 1M characters.
    const gptCostSaved = (stats.estimatedTokensSaved / 1000000) * 0.30;
    const ttsCostSaved = (stats.estimatedCharactersSaved / 1000000) * 15.00;
    
    stats.estimatedDollarsSaved = parseFloat((gptCostSaved + ttsCostSaved).toFixed(4));
  }
};
