// ============================================================
// MooEarth Live — Geocoding API Route
// ============================================================
// GET /api/weather/geocoding?q=tokyo&count=10&language=en
// Searches for locations by name. Never exposes raw API calls.

import { NextRequest } from 'next/server';
import { searchLocations } from '@/services/weather';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q') || '';
    const count = Math.min(parseInt(searchParams.get('count') || '10', 10), 20);
    const language = searchParams.get('language') || 'en';

    if (!query.trim()) {
      return Response.json({ results: [], generationTime: 0 });
    }

    if (query.trim().length < 2) {
      return Response.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results = await searchLocations(query, count, language);

    return Response.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Geocoding API]', message);
    return Response.json(
      { error: 'Failed to search locations', detail: message },
      { status: 502 }
    );
  }
}
