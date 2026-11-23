// ============================================================
// MooEarth Live — EUMETSAT Geostationary Tile Edge Proxy
// ============================================================
// Proxies EUMETSAT WMS tiles through Vercel Edge Network:
//   1. Converts slippy tile coords (z/x/y) → WMS BBOX in EPSG:3857
//   2. Fetches from EUMETSAT GeoServer
//   3. Caches on Vercel Edge (s-maxage=86400) for instant global delivery with 0 CPU
//   4. Runs on Edge runtime (lightweight V8 isolates, zero Node serverless CPU time)
//   5. Returns transparent 1x1 PNG on error (map never hangs)

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 86400;

// Pre-encoded transparent 1x1 PNG (RFC 2083 minimum valid PNG)
const TRANSPARENT_1X1_PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='),
  (c) => c.charCodeAt(0)
);

// Allowed EUMETSAT WMS layers (whitelist to prevent abuse)
const ALLOWED_LAYERS = new Set([
  'msg_fes:ir108',
  'msg_fes:vis006',
  'msg_iodc:ir108',
  'msg_iodc:vis006',
  'mumi:worldcloudmap_ir108',
  'mumi:wideareacoverage_rgb_natural',
]);

// Convert slippy tile coordinates to EPSG:3857 BBOX
function tileToEpsg3857Bbox(z: number, x: number, y: number): [number, number, number, number] {
  const originShift = 20037508.342789244;
  const worldSize = originShift * 2;
  const n = Math.pow(2, z);
  const tileRes = worldSize / n;

  const minX = x * tileRes - originShift;
  const maxX = (x + 1) * tileRes - originShift;
  const maxY = originShift - y * tileRes;
  const minY = originShift - (y + 1) * tileRes;

  return [minX, minY, maxX, maxY];
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const z = parseInt(params.get('z') || '0', 10);
  const x = parseInt(params.get('x') || '0', 10);
  const y = parseInt(params.get('y') || '0', 10);
  const layer = params.get('layer') || 'mumi:worldcloudmap_ir108';

  // Validate parameters
  if (isNaN(z) || isNaN(x) || isNaN(y) || z < 0 || z > 8) {
    return new NextResponse(TRANSPARENT_1X1_PNG, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Whitelist check
  if (!ALLOWED_LAYERS.has(layer)) {
    return new NextResponse(TRANSPARENT_1X1_PNG, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const [minX, minY, maxX, maxY] = tileToEpsg3857Bbox(z, x, y);

  const wmsUrl =
    `https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
    `&BBOX=${minX},${minY},${maxX},${maxY}` +
    `&CRS=EPSG:3857&WIDTH=256&HEIGHT=256` +
    `&LAYERS=${encodeURIComponent(layer)}&FORMAT=image/png&TRANSPARENT=TRUE`;

  try {
    const res = await fetch(wmsUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'MooEarth-Live-WeatherEngine/2.0',
      },
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('image')) {
        const arrayBuf = await res.arrayBuffer();

        // Serve the EUMETSAT tile with 24h edge CDN caching:
        // s-maxage=86400 = 24h on Vercel CDN edge (0 serverless compute cost for cache hits)
        // stale-while-revalidate=604800 = 7 days stale revalidation for instant response
        return new NextResponse(arrayBuf, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
            'X-EUMETSAT-Layer': layer,
            'X-EUMETSAT-Tile': `${z}/${x}/${y}`,
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
  } catch (err) {
    console.warn(`[EUMETSAT Tile Proxy] Notice: z=${z} x=${x} y=${y} layer=${layer}`);
  }

  // All attempts failed — return transparent fallback with 1h CDN cache so failed tiles do not hammer compute
  return new NextResponse(TRANSPARENT_1X1_PNG, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
