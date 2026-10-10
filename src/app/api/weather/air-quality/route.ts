// ============================================================
// MooEarth Live — Air Quality API Route
// ============================================================
// GET /api/weather/air-quality?lat=X&lng=Y
// Returns PM2.5, PM10, NO₂, O₃, SO₂, CO, European & US AQI.

import { NextRequest } from 'next/server';
import { fetchAirQuality } from '@/services/weather';

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

    const data = await fetchAirQuality(lat, lng);

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Air Quality API]', message);
    return Response.json(
      { error: 'Failed to fetch air quality data', detail: message },
      { status: 502 }
    );
  }
}
