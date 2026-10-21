// ============================================================
// MooEarth Live — Nearby Places API Route
// ============================================================
// GET /api/places/nearby?lat=48.8584&lng=2.2945&radius=10000&limit=8
// Zero API fees ($0.00) powered by Wikimedia Geosearch.

import { NextRequest } from 'next/server';
import { fetchNearbyPlaces } from '@/services/places/nearbyPlacesService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');
    const limitStr = searchParams.get('limit');

    if (!latStr || !lngStr) {
      return Response.json(
        { error: 'Missing required lat and lng parameters' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return Response.json(
        { error: 'Invalid coordinate range' },
        { status: 400 }
      );
    }

    const radius = radiusStr ? parseInt(radiusStr, 10) : 10000;
    const limit = limitStr ? parseInt(limitStr, 10) : 8;

    const data = await fetchNearbyPlaces(lat, lng, radius, limit);

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Nearby Places API]', message);
    return Response.json(
      { error: 'Failed to fetch nearby places', detail: message },
      { status: 502 }
    );
  }
}
