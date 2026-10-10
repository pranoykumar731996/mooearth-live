// ============================================================
// MooEarth Live — Flood API Route
// ============================================================
// GET /api/weather/flood?lat=X&lng=Y
// Returns river discharge forecasts. Missing data ≠ "safe".

import { NextRequest } from 'next/server';
import { fetchFloodData } from '@/services/weather';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
      return Response.json(
        { error: 'Missing or invalid lat/lng parameters' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return Response.json(
        { error: 'Coordinates out of range' },
        { status: 400 }
      );
    }

    const data = await fetchFloodData(lat, lng);

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Flood API]', message);
    return Response.json(
      { error: 'Failed to fetch flood data', detail: message },
      { status: 502 }
    );
  }
}
