// ============================================================
// MooEarth Live — API: Radar Metadata & Frames Route
// ============================================================
// Returns verified Doppler radar frames (timestamps, labels, tile templates).
// Server-side cached with SWR (2-minute freshness cadence).
// Enforces request deduplication to protect upstream sources from 1M users.

import { NextResponse } from 'next/server';
import { getActiveRadarMetadata, RadarMetadataResponse } from '@/services/weather/radarAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CachedRadarPayload {
  data: RadarMetadataResponse;
  cachedAt: number;
}

let cachedRadarPayload: CachedRadarPayload | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// In-flight promise pooling for request deduplication
let inFlightFetchPromise: Promise<RadarMetadataResponse> | null = null;

export async function GET() {
  const now = Date.now();

  // Return from in-memory cache if fresh
  if (cachedRadarPayload && now - cachedRadarPayload.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(cachedRadarPayload.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        'X-Cache-Status': 'HIT',
      },
    });
  }

  // Deduplicate concurrent requests
  if (!inFlightFetchPromise) {
    inFlightFetchPromise = getActiveRadarMetadata().finally(() => {
      inFlightFetchPromise = null;
    });
  }

  try {
    const data = await inFlightFetchPromise;
    cachedRadarPayload = {
      data,
      cachedAt: now,
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        'X-Cache-Status': 'MISS',
      },
    });
  } catch (err) {
    console.warn('[Radar API] Failed to fetch radar metadata:', err);
    if (cachedRadarPayload) {
      return NextResponse.json(cachedRadarPayload.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30',
          'X-Cache-Status': 'STALE_FALLBACK',
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to retrieve Doppler radar metadata' },
      { status: 500 }
    );
  }
}
