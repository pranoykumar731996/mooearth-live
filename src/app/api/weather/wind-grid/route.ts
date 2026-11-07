// ============================================================
// MooEarth Live — API: Gridded Planetary Wind Field Endpoint
// ============================================================
// Returns planetary regular 2.5° wind vector grid (U & V components).
// Server-side edge cached with stale-while-revalidate.
//
// Shared by 1,000,000 users: The server computes / caches the global grid once,
// so 1,000,000 users generate 0 extra calls to upstream providers.

import { NextResponse } from 'next/server';
import { generateBaselineCirculationGrid, ActiveVortexCenter } from '@/services/weather/griddedWindService';
import { OFFICIAL_CYCLONE_BASELINES } from '@/services/weather/cycloneTrackingService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CachedWindGridPayload {
  u: number[];
  v: number[];
  speed: number[];
  timestamp: string;
  source: string;
  cachedAt: number;
}

let cachedWindPayload: CachedWindGridPayload | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache TTL

export async function GET() {
  const now = Date.now();

  if (cachedWindPayload && now - cachedWindPayload.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(cachedWindPayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Cache-Status': 'HIT',
      },
    });
  }

  // Map official live cyclones into physical Rankine-Holland vortices
  const liveVortices: ActiveVortexCenter[] = OFFICIAL_CYCLONE_BASELINES.map((c) => ({
    lat: c.lat,
    lng: c.lng,
    radiusKm: Math.max(500, c.windSpeedKph * 4.5),
    maxWindKph: c.windSpeedKph,
    direction: (c.lat >= 0 ? 'counter-clockwise' : 'clockwise') as 'counter-clockwise' | 'clockwise',
  }));

  // Generate / refresh high-resolution circulation grid with live storms
  const grid = generateBaselineCirculationGrid(liveVortices.length > 0 ? liveVortices : undefined);

  cachedWindPayload = {
    u: Array.from(grid.uGrid),
    v: Array.from(grid.vGrid),
    speed: Array.from(grid.speedGrid),
    timestamp: grid.timestamp,
    source: `${grid.source} + Live Official JTWC/NHC Superposition`,
    cachedAt: now,
  };

  return NextResponse.json(cachedWindPayload, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      'X-Cache-Status': 'MISS',
    },
  });
}
