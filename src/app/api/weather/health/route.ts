// ============================================================
// MooEarth Live — Weather Health Check API Route
// ============================================================
// GET /api/weather/health
// Reports API connectivity, cache stats, and configuration status.

import {
  getCacheMetrics,
  getEndpointUrl,
  isCommercialPlan,
} from '@/services/weather';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cacheMetrics = getCacheMetrics();
    const commercial = isCommercialPlan();

    // Test connectivity by making a lightweight geocoding request
    let connectivityOk = false;
    let connectivityLatencyMs = 0;
    try {
      const start = Date.now();
      const res = await fetch(
        'https://geocoding-api.open-meteo.com/v1/search?name=London&count=1',
        { signal: AbortSignal.timeout(5000) }
      );
      connectivityLatencyMs = Date.now() - start;
      connectivityOk = res.ok;
    } catch {
      connectivityOk = false;
    }

    return Response.json({
      status: connectivityOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      connectivity: {
        ok: connectivityOk,
        latencyMs: connectivityLatencyMs,
      },
      configuration: {
        commercialPlan: commercial,
        endpoints: {
          forecast: getEndpointUrl('forecast'),
          geocoding: getEndpointUrl('geocoding'),
          airQuality: getEndpointUrl('airQuality'),
          elevation: getEndpointUrl('elevation'),
          flood: getEndpointUrl('flood'),
          marine: getEndpointUrl('marine'),
        },
      },
      cache: cacheMetrics,
      version: '1.0.0',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json(
      { status: 'error', error: message },
      { status: 500 }
    );
  }
}
