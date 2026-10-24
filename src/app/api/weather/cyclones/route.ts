// ============================================================
// MooEarth Live — API: Official Tropical Cyclone Feed Route
// ============================================================
// Returns verified tropical cyclone tracks, intensities, and 5-day forecast cones
// from NOAA National Hurricane Center (NHC), JTWC, and IMD.
// Caches responses with SWR (10-minute cadence).

import { NextResponse } from 'next/server';
import { getActiveTropicalCyclones } from '@/services/weather/cycloneTrackingService';
import { fetchLivePlanetaryEvents, planetaryEventToWorldEvent } from '@/services/planetaryEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const livePlanetaryEvents = await fetchLivePlanetaryEvents();
    const worldEvents = livePlanetaryEvents.map(planetaryEventToWorldEvent);
    const feed = getActiveTropicalCyclones(worldEvents, true);

    return NextResponse.json(feed, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        'X-Weather-Source': 'JTWC-GDACS-IMD-NOAA',
      },
    });
  } catch (err) {
    console.warn('[Cyclones API] Error retrieving cyclone data:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve tropical cyclone feed' },
      { status: 500 }
    );
  }
}
