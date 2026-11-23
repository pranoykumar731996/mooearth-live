// ============================================================
// MooEarth Live — Real-Time Satellite Tile Edge Streamer
// ============================================================
// Ultra-lightweight edge streamer for satellite imagery tiles.
// Zero CPU decompression: streams NASA GIBS upstream directly
// with 24-hour Edge CDN caching (0 active serverless CPU).

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 86400;

// Pre-encoded transparent 1x1 PNG (RFC 2083 minimum valid PNG)
const TRANSPARENT_1X1_PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='),
  (c) => c.charCodeAt(0)
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'visible';
    const sector = searchParams.get('sector') || 'global';
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const z = searchParams.get('z') || '0';
    const x = searchParams.get('x') || '0';
    const y = searchParams.get('y') || '0';

    const zNum = parseInt(z, 10);
    const xNum = parseInt(x, 10);
    const yNum = parseInt(y, 10);

    if (isNaN(zNum) || isNaN(xNum) || isNaN(yNum) || zNum < 0 || zNum > 9) {
      return new NextResponse(TRANSPARENT_1X1_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        },
      });
    }

    let upstreamUrl = '';
    let contentType = 'image/jpeg';
    if (mode === 'visible') {
      upstreamUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/${z}/${y}/${x}.jpg`;
      contentType = 'image/jpeg';
    } else {
      let layerName = 'Himawari_AHI_Band13_Clean_Infrared';
      if (sector === 'goes-east') {
        layerName = 'GOES-East_ABI_Band13_Clean_Infrared';
      } else if (sector === 'goes-west') {
        layerName = 'GOES-West_ABI_Band13_Clean_Infrared';
      }
      upstreamUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/${date}/GoogleMapsCompatible_Level6/${z}/${y}/${x}.png`;
      contentType = 'image/png';
    }

    let upstreamRes = await fetch(upstreamUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'MooEarth-Live-WeatherEngine/2.0',
      },
    });

    // If today's composite tile is not yet ready in NASA GIBS, fallback to yesterday's complete scan
    if (!upstreamRes.ok) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      let fallbackUrl = '';
      if (mode === 'visible') {
        fallbackUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${yesterday}/GoogleMapsCompatible_Level9/${z}/${y}/${x}.jpg`;
      } else {
        let layerName = 'Himawari_AHI_Band13_Clean_Infrared';
        if (sector === 'goes-east') layerName = 'GOES-East_ABI_Band13_Clean_Infrared';
        else if (sector === 'goes-west') layerName = 'GOES-West_ABI_Band13_Clean_Infrared';
        fallbackUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/${yesterday}/GoogleMapsCompatible_Level6/${z}/${y}/${x}.png`;
      }
      try {
        const fallbackRes = await fetch(fallbackUrl, {
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'MooEarth-Live-WeatherEngine/2.0' },
        });
        if (fallbackRes.ok) {
          upstreamRes = fallbackRes;
        }
      } catch {
        // Fall through to fallback check below
      }
    }

    if (!upstreamRes.ok) {
      return new NextResponse(TRANSPARENT_1X1_PNG, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      });
    }

    const arrayBuf = await upstreamRes.arrayBuffer();
    return new NextResponse(arrayBuf, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse(TRANSPARENT_1X1_PNG, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  }
}
