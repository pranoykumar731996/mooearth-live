// ============================================================
// MooEarth Live — Elevation API Route
// ============================================================
// GET /api/weather/elevation?lat=X&lng=Y
// Returns elevation in metres and feet. Long cache (24h).

import { NextRequest } from 'next/server';
import { fetchElevation } from '@/services/weather';

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

    const data = await fetchElevation(lat, lng);

    return Response.json(data, {
      headers: {
        // Elevation is static — cache for 24 hours
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Elevation API]', message);
    return Response.json(
      { error: 'Failed to fetch elevation data', detail: message },
      { status: 502 }
    );
  }
}
