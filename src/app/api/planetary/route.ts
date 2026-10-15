import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLivePlanetaryEvents,
  searchPlanetaryEvents,
  fetchPlanetaryEventsForCountry,
} from '@/services/planetaryEngine';
import { EventCategory } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q') || '';
    const category = (searchParams.get('category') || 'all') as EventCategory | 'all';
    const country = searchParams.get('country') || '';
    const refresh = searchParams.get('refresh') === 'true';

    let events;

    if (country.trim()) {
      events = await fetchPlanetaryEventsForCountry(country.trim());
    } else if (query.trim() || category !== 'all') {
      events = await searchPlanetaryEvents(query.trim(), category);
    } else {
      events = await fetchLivePlanetaryEvents(refresh);
    }

    return NextResponse.json({
      success: true,
      count: events.length,
      timestamp: new Date().toISOString(),
      events,
      sources: [
        'USGS Earthquake Hazards Program (Public Domain)',
        'NASA Earth Observatory Natural Event Tracker (EONET)',
        'NOAA Space Weather Prediction Center (SWPC)',
        'NASA Earth Observatory Satellite Fleet',
      ],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('[API /api/planetary] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve planetary telemetry stream', details: error?.message },
      { status: 500 }
    );
  }
}
