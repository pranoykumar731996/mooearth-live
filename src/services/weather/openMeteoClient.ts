// ============================================================
// MooEarth Live — Open-Meteo HTTP Client
// ============================================================
// Central HTTP client with caching, retry, rate-limiting,
// and API key support for the Open-Meteo commercial plan.
// All weather API calls go through this client — never directly.

import { CacheMetrics } from './types';

// ── Configuration ─────────────────────────────────────────────

const OPEN_METEO_BASE_URL = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com';
const OPEN_METEO_API_KEY = process.env.OPEN_METEO_API_KEY || '';

// Different base URLs for different APIs (free tier)
const API_BASES = {
  forecast: OPEN_METEO_API_KEY
    ? `${OPEN_METEO_BASE_URL}/v1/forecast`
    : 'https://api.open-meteo.com/v1/forecast',
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  airQuality: OPEN_METEO_API_KEY
    ? `${OPEN_METEO_BASE_URL}/v1/air-quality`
    : 'https://air-quality-api.open-meteo.com/v1/air-quality',
  elevation: 'https://api.open-meteo.com/v1/elevation',
  flood: OPEN_METEO_API_KEY
    ? `${OPEN_METEO_BASE_URL}/v1/flood`
    : 'https://flood-api.open-meteo.com/v1/flood',
  marine: OPEN_METEO_API_KEY
    ? `${OPEN_METEO_BASE_URL}/v1/marine`
    : 'https://marine-api.open-meteo.com/v1/marine',
} as const;

export type OpenMeteoEndpoint = keyof typeof API_BASES;

// ── Cache Layer ───────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: string;
}

const cache = new Map<string, CacheEntry<unknown>>();
let cacheHits = 0;
let cacheMisses = 0;

// TTLs by endpoint type
const CACHE_TTLS: Record<OpenMeteoEndpoint, number> = {
  forecast: 10 * 60 * 1000,       // 10 minutes
  geocoding: 24 * 60 * 60 * 1000, // 24 hours (places don't change)
  airQuality: 30 * 60 * 1000,     // 30 minutes
  elevation: 7 * 24 * 60 * 60 * 1000, // 7 days (elevation is static)
  flood: 60 * 60 * 1000,          // 1 hour
  marine: 30 * 60 * 1000,         // 30 minutes
};

function getCacheKey(endpoint: OpenMeteoEndpoint, params: Record<string, string | number>): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${endpoint}:${sortedParams}`;
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) {
    cacheMisses++;
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    cacheMisses++;
    return null;
  }
  cacheHits++;
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  // Evict oldest entries if cache grows too large (max 500 entries)
  if (cache.size >= 500) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    createdAt: new Date().toISOString(),
  });
}

/** Get cache performance metrics for monitoring. */
export function getCacheMetrics(): CacheMetrics {
  let oldestEntry: string | null = null;
  for (const entry of cache.values()) {
    if (!oldestEntry || entry.createdAt < oldestEntry) {
      oldestEntry = entry.createdAt;
    }
  }
  return {
    hits: cacheHits,
    misses: cacheMisses,
    entries: cache.size,
    oldestEntry,
  };
}

export { getCached, setCache, getCacheKey, checkRateLimit };

// ── Rate Limiting ─────────────────────────────────────────────

let requestCount = 0;
let windowStart = Date.now();
const MAX_REQUESTS_PER_MINUTE = 500; // Well under commercial plan limits

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    requestCount = 0;
    windowStart = now;
  }
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  requestCount++;
  return true;
}

// ── Retry with Exponential Backoff ────────────────────────────

async function fetchWithRetry(
  url: string,
  maxRetries: number = 2,
  timeoutMs: number = 5000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        // Next.js ISR cache — revalidate every 10 minutes
        next: { revalidate: 600 },
      });

      if (res.ok) return res;

      // Don't retry 4xx errors (client errors)
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`Open-Meteo returned HTTP ${res.status}: ${res.statusText}`);
      }

      // Retry 5xx errors
      lastError = new Error(`Open-Meteo returned HTTP ${res.status}`);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Exponential backoff: 500ms, 1500ms
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(3, attempt)));
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

// ── Main Query Function ───────────────────────────────────────

export interface OpenMeteoQueryOptions {
  endpoint: OpenMeteoEndpoint;
  params: Record<string, string | number>;
  /** Override the default cache TTL for this endpoint */
  cacheTtlMs?: number;
  /** Skip cache for this request */
  skipCache?: boolean;
}

/**
 * Query any Open-Meteo API endpoint with caching, retry, and rate limiting.
 * This is the ONLY function that should make external HTTP calls to Open-Meteo.
 */
export async function queryOpenMeteo<T>(options: OpenMeteoQueryOptions): Promise<T> {
  const { endpoint, params, cacheTtlMs, skipCache } = options;

  // 1. Check cache first
  const cacheKey = getCacheKey(endpoint, params);
  if (!skipCache) {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) return cached;
  }

  // 2. Rate limit check
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded. Too many weather API requests per minute.');
  }

  // 3. Build URL
  const baseUrl = API_BASES[endpoint];
  const urlParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    urlParams.set(key, String(value));
  }

  // Append API key if available (commercial plan)
  if (OPEN_METEO_API_KEY) {
    urlParams.set('apikey', OPEN_METEO_API_KEY);
  }

  const url = `${baseUrl}?${urlParams.toString()}`;

  // 4. Fetch with retry
  const res = await fetchWithRetry(url);
  const data = await res.json() as T;

  // 5. Cache the result
  const ttl = cacheTtlMs ?? CACHE_TTLS[endpoint];
  setCache(cacheKey, data, ttl);

  return data;
}

/**
 * Get the appropriate base URL for an endpoint (for health check display).
 */
export function getEndpointUrl(endpoint: OpenMeteoEndpoint): string {
  return API_BASES[endpoint];
}

/**
 * Check if the commercial API key is configured.
 */
export function isCommercialPlan(): boolean {
  return OPEN_METEO_API_KEY.length > 0;
}

/**
 * Clear all cached weather data.
 */
export function clearWeatherCache(): void {
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
