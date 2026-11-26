import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CIRA_BASE = 'https://rammb-slider.cira.colostate.edu/data';

const ALLOWED_SATS = new Set([
  'goes-19',
  'goes-18',
  'himawari',
  'meteosat-9',
  'meteosat-0deg',
]);

const ALLOWED_PRODUCTS = new Set([
  'geocolor',
  'band_13',
  'band_09',
]);

const ALLOWED_RC = new Set([
  '000_000',
  '000_001',
  '001_000',
  '001_001',
]);

const RC_RE = /^(\d{3})_(\d{3})$/;
const Z_RE = /^0?([1-4])$/;
const CIRA_MAX_Z: Record<string, Record<string, number>> = {
  'goes-19': { geocolor: 4, band_13: 3 },
  'goes-18': { geocolor: 4, band_13: 3 },
  himawari: { geocolor: 4, band_13: 3 },
  'meteosat-9': { geocolor: 3, band_09: 3 },
  'meteosat-0deg': { geocolor: 3, band_09: 3 },
};

function getCiraMaxZoom(sat: string, product: string): number {
  return CIRA_MAX_Z[sat]?.[product] ?? 1;
}

const TS_RE = /^\d{14}$/;

function formatTsIso(ts: string): string | null {
  if (!TS_RE.test(ts)) return null;
  const y = ts.slice(0, 4);
  const m = ts.slice(4, 6);
  const d = ts.slice(6, 8);
  const hh = ts.slice(8, 10);
  const mm = ts.slice(10, 12);
  const ss = ts.slice(12, 14);
  const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

async function fetchUpstreamWithRetry(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  attempts = 2,
): Promise<Response> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok || res.status === 404 || i === attempts - 1) return res;
    } catch (err) {
      lastErr = err;
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }
  throw lastErr || new Error('Upstream fetch failed');
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action') || 'tile';
  const sat = searchParams.get('sat') || '';
  const product = searchParams.get('product') || '';

  if (!ALLOWED_SATS.has(sat) || !ALLOWED_PRODUCTS.has(product)) {
    return NextResponse.json(
      { error: 'Invalid sat or product parameter' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // Enforce compatible product-to-satellite combinations
  if ((sat === 'meteosat-9' || sat === 'meteosat-0deg') && product === 'band_13') {
    return NextResponse.json(
      { error: 'Meteosat uses band_09 for infrared' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if ((sat === 'goes-19' || sat === 'goes-18' || sat === 'himawari') && product === 'band_09') {
    return NextResponse.json(
      { error: 'ABI/AHI uses band_13 for clean infrared' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (action === 'meta') {
    const metaUrl = `${CIRA_BASE}/json/${sat}/full_disk/${product}/latest_times.json`;
    try {
      const upstream = await fetchUpstreamWithRetry(
        metaUrl,
        {
          'User-Agent': 'MooEarthLive/1.0 (+https://www.mooearth.live)',
          Accept: 'application/json',
        },
        12000,
      );
      if (!upstream.ok) {
        return NextResponse.json(
          { error: `CIRA metadata upstream ${upstream.status}` },
          { status: upstream.status === 404 ? 404 : 502, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      const data = await upstream.json() as { timestamps_int?: number[] };
      const timestamps = Array.isArray(data?.timestamps_int)
        ? data.timestamps_int.slice(0, 3).map(String).filter((t) => TS_RE.test(t))
        : [];
      const rawTs = timestamps[0] || '';
      if (!TS_RE.test(rawTs)) {
        return NextResponse.json(
          { error: 'CIRA metadata missing valid timestamp' },
          { status: 502, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      const observedIso = formatTsIso(rawTs);
      const lm = upstream.headers.get('last-modified') || observedIso;
      const maxZoom = getCiraMaxZoom(sat, product);
      return NextResponse.json(
        {
          sat,
          product,
          latestTs: rawTs,
          timestamps,
          observedIso,
          lm,
          tiles: ['000_000', '000_001', '001_000', '001_001'],
          zoomLevel: '01',
          maxZoom,
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=180',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    } catch {
      return NextResponse.json(
        { error: 'CIRA metadata upstream error' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

  if (action === 'tile') {
    const ts = searchParams.get('ts') || '';
    const rc = searchParams.get('rc') || '';
    const rawZ = searchParams.get('z') || '01';
    const zMatch = rawZ.match(Z_RE);
    const rcMatch = rc.match(RC_RE);
    if (!TS_RE.test(ts) || !zMatch || !rcMatch) {
      return NextResponse.json(
        { error: 'Invalid ts, z, or rc parameter' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const zNum = Number(zMatch[1]);
    const maxZoom = getCiraMaxZoom(sat, product);
    const gridLimit = 1 << zNum;
    const rowIdx = Number(rcMatch[1]);
    const colIdx = Number(rcMatch[2]);
    if (zNum > maxZoom || rowIdx >= gridLimit || colIdx >= gridLimit) {
      return NextResponse.json(
        { error: `Requested zoom ${zNum} or tile ${rc} exceeds upstream bounds (maxZ=${maxZoom})` },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (zNum === 1 && !ALLOWED_RC.has(rc)) {
      return NextResponse.json(
        { error: 'Invalid z01 rc parameter' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const zPad = String(zNum).padStart(2, '0');
    const yyyy = ts.slice(0, 4);
    const mm = ts.slice(4, 6);
    const dd = ts.slice(6, 8);
    const tileUrl = `${CIRA_BASE}/imagery/${yyyy}/${mm}/${dd}/${sat}---full_disk/${product}/${ts}/${zPad}/${rc}.png`;

    try {
      const upstream = await fetchUpstreamWithRetry(
        tileUrl,
        {
          'User-Agent': 'MooEarthLive/1.0 (+https://www.mooearth.live)',
          Accept: 'image/png,image/*;q=0.8',
        },
        15000,
      );
      if (!upstream.ok) {
        return new NextResponse(`CIRA tile upstream ${upstream.status}`, {
          status: upstream.status === 404 ? 404 : 502,
          headers: { 'Cache-Control': 'no-store' },
        });
      }
      const buf = await upstream.arrayBuffer();
      if (buf.byteLength < 64) {
        return new NextResponse('Empty CIRA tile', {
          status: 502,
          headers: { 'Cache-Control': 'no-store' },
        });
      }
      return new NextResponse(buf, {
        headers: {
          'Content-Type': upstream.headers.get('content-type') || 'image/png',
          'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
          'Access-Control-Allow-Origin': '*',
          ...(upstream.headers.get('last-modified')
            ? { 'Last-Modified': upstream.headers.get('last-modified')! }
            : {}),
        },
      });
    } catch {
      return new NextResponse('CIRA tile fetch error', {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  }

  return NextResponse.json(
    { error: 'Unsupported action' },
    { status: 400, headers: { 'Cache-Control': 'no-store' } },
  );
}
