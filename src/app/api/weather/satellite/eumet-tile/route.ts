// ============================================================
// MooEarth Live — EUMETSAT Geostationary Tile Edge Proxy
// ============================================================
// Proxies EUMETSAT WMS tiles through our Vercel Edge CDN:
//   1. Converts slippy tile coords (z/x/y) → WMS BBOX in EPSG:3857
//   2. Fetches from EUMETSAT GeoServer with extended 12s timeout + retry
//   3. Caches on Vercel Edge (s-maxage=600) for instant global delivery
//   4. Returns transparent 1x1 PNG on error (map never hangs)
//
// This eliminates the 3.5s browser-side timeout problem that caused
// Africa and Europe to appear cloud-free.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Pre-encoded transparent 1x1 PNG (RFC 2083 minimum valid PNG)
const TRANSPARENT_1X1_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
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
    return new NextResponse(new Uint8Array(TRANSPARENT_1X1_PNG), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  // Whitelist check
  if (!ALLOWED_LAYERS.has(layer)) {
    return new NextResponse(new Uint8Array(TRANSPARENT_1X1_PNG), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  const [minX, minY, maxX, maxY] = tileToEpsg3857Bbox(z, x, y);

  const wmsUrl =
    `https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
    `&BBOX=${minX},${minY},${maxX},${maxY}` +
    `&CRS=EPSG:3857&WIDTH=256&HEIGHT=256` +
    `&LAYERS=${encodeURIComponent(layer)}&FORMAT=image/png&TRANSPARENT=TRUE`;

  // Resilience logic: try primary layer on attempt 0, fallback to global worldcloudmap on attempt 1
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const activeLayer = (attempt === 1 && layer !== 'mumi:worldcloudmap_ir108')
        ? 'mumi:worldcloudmap_ir108'
        : layer;

      const wmsUrl =
        `https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
        `&BBOX=${minX},${minY},${maxX},${maxY}` +
        `&CRS=EPSG:3857&WIDTH=256&HEIGHT=256` +
        `&LAYERS=${encodeURIComponent(activeLayer)}&FORMAT=image/png&TRANSPARENT=TRUE`;

      const res = await fetch(wmsUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'MooEarth-Live-WeatherEngine/2.0',
        },
      });

      if (!res.ok) {
        if (attempt === 0) continue; // retry with worldcloudmap fallback
        break;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('image')) {
        if (attempt === 0) continue; // retry with worldcloudmap fallback
        break;
      }

      const arrayBuf = await res.arrayBuffer();

      // Serve the EUMETSAT tile with edge CDN caching:
      // s-maxage=900 = 15 minutes on Vercel CDN edge
      // stale-while-revalidate=86400 = 24h stale revalidation for instant response
      return new NextResponse(new Uint8Array(arrayBuf), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=86400',
          'X-EUMETSAT-Layer': activeLayer,
          'X-EUMETSAT-Tile': `${z}/${x}/${y}`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      if (attempt === 0) continue; // retry with worldcloudmap on timeout/error
      console.warn(`[EUMETSAT Tile Proxy] Failed after retries: z=${z} x=${x} y=${y} layer=${layer}`, err);
    }
  }

  // All attempts failed — return transparent fallback (map never hangs)
  return new NextResponse(new Uint8Array(TRANSPARENT_1X1_PNG), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=120, s-maxage=120',
    },
  });
}
