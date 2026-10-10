// ============================================================
// MooEarth Live — Marine API Route
// ============================================================
// GET /api/weather/marine?lat=X&lng=Y
// Returns wave, swell, and marine data for ocean locations.
// Inland locations return dataAvailable=false.

import { NextRequest } from 'next/server';
import { fetchMarineWeather } from '@/services/weather';

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

    const data = await fetchMarineWeather(lat, lng);

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Marine API]', message);
    return Response.json(
      { error: 'Failed to fetch marine data', detail: message },
      { status: 502 }
    );
  }
}
