// ============================================================
// MooEarth Live — API: Satellite Metadata Route
// ============================================================
// Returns verified NASA GIBS / NOAA GOES satellite layer metadata,
// observation timestamps, and slippy tile URL templates.
// Caches responses with SWR (10-minute cadence).
// Zero third-party commercial tile proxies, zero synthetic random noise.

import { NextRequest, NextResponse } from 'next/server';
import { getSatelliteMetadata } from '@/services/weather/satelliteImageryService';
import type { SatelliteSpectralMode } from '@/services/weather/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modeParam = searchParams.get('mode') as SatelliteSpectralMode;
    const offsetParam = parseInt(searchParams.get('offsetHours') || '0', 10);

    const validModes: SatelliteSpectralMode[] = ['visible', 'blue', 'infra'];
    const mode: SatelliteSpectralMode = validModes.includes(modeParam) ? modeParam : 'visible';
    const offsetHours = isNaN(offsetParam) ? 0 : Math.max(0, Math.min(72, offsetParam));

    const metadata = getSatelliteMetadata(mode, offsetHours);

    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        'X-Satellite-Provider': 'NASA-GIBS',
      },
    });
  } catch (err) {
    console.warn('[Satellite API] Error generating satellite metadata:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve satellite imagery metadata' },
      { status: 500 }
    );
  }
}
