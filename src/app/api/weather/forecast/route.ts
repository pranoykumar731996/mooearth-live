// ============================================================
// MooEarth Live — Weather Forecast API Route
// ============================================================
// GET /api/weather/forecast?lat=X&lng=Y&units=celsius&timezone=auto
// Returns current + hourly (48h) + daily (7-day) forecast.
// All API keys stay server-side — never exposed to client.

import { NextRequest } from 'next/server';
import { fetchForecast } from '@/services/weather';
import type { UnitPreferences } from '@/services/weather';

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
        { error: 'Coordinates out of range. lat: [-90, 90], lng: [-180, 180]' },
        { status: 400 }
      );
    }

    const units: UnitPreferences = {
      temperature: (searchParams.get('temperature_unit') as 'celsius' | 'fahrenheit') || 'celsius',
      windSpeed: (searchParams.get('wind_speed_unit') as 'kmh' | 'ms' | 'mph' | 'kn') || 'kmh',
      precipitation: (searchParams.get('precipitation_unit') as 'mm' | 'inch') || 'mm',
    };

    const timezone = searchParams.get('timezone') || 'auto';

    const forecast = await fetchForecast(lat, lng, units, timezone);

    return Response.json(forecast, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Weather Forecast API]', message);
    return Response.json(
      { error: 'Failed to fetch forecast', detail: message },
      { status: 502 }
    );
  }
}
