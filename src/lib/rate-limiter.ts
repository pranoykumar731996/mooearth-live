// ============================================================
// MooEarth Live — Universal IP Rate Limiter
// ============================================================
// Shared sliding-window rate limiter for all API routes.
// Prevents Denial-of-Wallet attacks on AI endpoints and
// resource abuse on upload/write endpoints.

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Maximum number of tracked IPs before garbage collection triggers */
  maxTrackedIPs?: number;
}

class SlidingWindowRateLimiter {
  private map = new Map<string, RateLimitRecord>();
  private maxRequests: number;
  private windowMs: number;
  private maxTrackedIPs: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.maxTrackedIPs = options.maxTrackedIPs ?? 2000;
  }

  /**
   * Returns true if the given IP has exceeded its rate limit.
   * Automatically increments the request count on non-limited calls.
   */
  isLimited(ip: string): boolean {
    const now = Date.now();

    // Periodic cleanup when map grows too large
    if (this.map.size > this.maxTrackedIPs) {
      for (const [key, val] of this.map.entries()) {
        if (now > val.resetTime) this.map.delete(key);
      }
    }

    const record = this.map.get(ip);

    if (!record || now > record.resetTime) {
      this.map.set(ip, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (record.count >= this.maxRequests) {
      return true;
    }

    record.count++;
    return false;
  }

  /** Returns remaining requests for the given IP in the current window */
  remaining(ip: string): number {
    const record = this.map.get(ip);
    if (!record || Date.now() > record.resetTime) return this.maxRequests;
    return Math.max(0, this.maxRequests - record.count);
  }
}

// ─── Pre-configured Limiters for Different Endpoint Tiers ───────────────────

/** Standard AI endpoints: 15 req/min per IP */
export const aiRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 15,
  windowMs: 60_000,
});

/** Expensive AI endpoints (TTS, multi-model cascade): 8 req/min per IP */
export const expensiveAiRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 8,
  windowMs: 60_000,
});

/** File upload endpoint: 5 uploads per 10 minutes per IP */
export const uploadRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 5,
  windowMs: 10 * 60_000,
});

/** General data-write endpoints: 30 req/min per IP */
export const writeRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
});

// ─── Helper to Extract Client IP ────────────────────────────────────────────

import { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest | Request): string {
  if ('headers' in request) {
    const headers = request.headers;
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp;
  }
  return 'anonymous';
}

// ─── Bounded LRU Map Utility ────────────────────────────────────────────────
// Drop-in replacement for Map that enforces a maximum size with FIFO eviction.

export class BoundedMap<K, V> {
  private map = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  set(key: K, value: V): this {
    this.map.set(key, value);

    // Evict oldest entries when exceeding max size
    while (this.map.size > this.maxSize) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      } else {
        break;
      }
    }

    return this;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  get size(): number {
    return this.map.size;
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void {
    this.map.forEach(callbackfn);
  }

  clear(): void {
    this.map.clear();
  }
}
