// ============================================================
// MooEarth Live — API: Official Tropical Cyclone Feed Route
// ============================================================
// Returns verified tropical cyclone tracks, intensities, 5-day forecast cones,
// and landfall intelligence from NOAA National Hurricane Center (NHC), JTWC, and IMD.
// Caches responses with SWR (10-minute cadence).

import { NextRequest, NextResponse } from 'next/server';
import { getOfficialActiveCyclones } from '@/services/weather/cycloneForecastAdapter';
import { getActiveTropicalCyclones } from '@/services/weather/cycloneTrackingService';
import { fetchLivePlanetaryEvents, planetaryEventToWorldEvent } from '@/services/planetaryEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const basin = searchParams.get('basin');
    const allowFallback = searchParams.get('baseline') === 'true';

    // 1. Fetch live multi-source cyclones from official adapters
    const feed = await getOfficialActiveCyclones(allowFallback);

    // If empty and baseline fallback permitted, augment with planetary engine
    let cyclones = feed.cyclones;
    if (cyclones.length === 0 && allowFallback) {
      const livePlanetaryEvents = await fetchLivePlanetaryEvents();
      const worldEvents = livePlanetaryEvents.map(planetaryEventToWorldEvent);
      const fallbackFeed = getActiveTropicalCyclones(worldEvents, true);
      cyclones = fallbackFeed.cyclones;
    }

    // Filter by basin if requested (e.g. ?basin=Atlantic, ?basin=North Indian)
    if (basin) {
      cyclones = cyclones.filter((c) => c.basin.toLowerCase() === basin.toLowerCase());
    }

    return NextResponse.json(
      {
        count: cyclones.length,
        cyclones,
        attribution: feed.attribution,
        sourceAgencies: feed.sourceAgencies,
        fetchedAt: feed.fetchedAt,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
          'X-Weather-Source': 'IMD-NOAA-NHC-JTWC',
        },
      }
    );
  } catch (err) {
    console.warn('[Cyclones API] Error retrieving cyclone data:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve tropical cyclone feed' },
      { status: 500 }
    );
  }
}
