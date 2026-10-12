// ============================================================
// MooEarth Live — Global Weather Grid API Route
// ============================================================
// GET /api/weather/grid?units=celsius
// Returns planetary meteorological grid points (wind vectors, temperature,
// precipitation) from Open-Meteo across 70 distributed reference stations.
// Cached for 10 minutes with stale-while-revalidate.

import { NextRequest } from 'next/server';
import { fetchGlobalWeatherGrid } from '@/services/weather';
import type { UnitPreferences } from '@/services/weather';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const units: UnitPreferences = {
      temperature: (searchParams.get('temperature_unit') as 'celsius' | 'fahrenheit') || 'celsius',
      windSpeed: (searchParams.get('wind_speed_unit') as 'kmh' | 'ms' | 'mph' | 'kn') || 'kmh',
      precipitation: (searchParams.get('precipitation_unit') as 'mm' | 'inch') || 'mm',
    };

    const gridData = await fetchGlobalWeatherGrid(units);

    return Response.json(gridData, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Global Weather Grid API]', message);
    return Response.json(
      { error: 'Failed to fetch global weather grid', detail: message },
      { status: 502 }
    );
  }
}
