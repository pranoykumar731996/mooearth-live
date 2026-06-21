import { PerspectiveResult } from '@/types/perspective';

interface CachedEntry {
  data: PerspectiveResult;
  timestamp: number;
}

const cache = new Map<string, CachedEntry>();
const TTL_MS = 3600000; // 1 hour in milliseconds

/**
 * Generates a consistent cache key for a given country, topic, and category.
 */
export function generateCacheKey(country: string, topic: string, category: string): string {
  const cleanCountry = country.trim().toLowerCase();
  const cleanTopic = topic.trim().toLowerCase();
  const cleanCategory = category.trim().toLowerCase();
  return `${cleanCountry}::${cleanTopic}::${cleanCategory}`;
}

/**
 * Retrieves a cached perspective if it exists and has not expired.
 */
export function getCachedPerspective(key: string): PerspectiveResult | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Saves a perspective analysis to the cache.
 */
export function setCachedPerspective(key: string, data: PerspectiveResult): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clears the perspective cache (useful for testing or manual refreshes).
 */
export function clearPerspectiveCache(): void {
  cache.clear();
}
