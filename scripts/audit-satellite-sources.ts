import fs from 'fs';
import path from 'path';
// @ts-ignore
import { PNG } from 'pngjs';

interface AuditResult {
  location: string;
  coords: { lat: number; lng: number };
  tile: { z: number; x: number; y: number };
  providers: {
    name: string;
    url: string;
    status: number;
    latencyMs: number;
    byteSize: number;
    dimensions?: { width: number; height: number };
    pixelStats?: {
      total: number;
      transparentPixels: number;
      transparentPct: number;
      blackSpacePixels: number;
      validDataPixels: number;
      validDataPct: number;
      minLum: number;
      maxLum: number;
      meanLum: number;
    };
    error?: string;
  }[];
}

// Slippy tile math (EPSG:3857)
function latLngToTile(lat: number, lng: number, z: number) {
  const n = Math.pow(2, z);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return { z, x, y };
}

// Convert slippy tile to EPSG:3857 BBOX for WMS
function tileToBbox3857(x: number, y: number, z: number) {
  const n = Math.pow(2, z);
  const worldSize = 20037508.342789244 * 2;
  const originShift = 20037508.342789244;
  const res = worldSize / n;
  const minX = x * res - originShift;
  const maxX = (x + 1) * res - originShift;
  const maxY = originShift - y * res;
  const minY = originShift - (y + 1) * res;
  return { minX, minY, maxX, maxY };
}

async function analyzePngBuffer(buf: Buffer) {
  const png = new PNG();
  await new Promise<PNG>((resolve, reject) => {
    png.parse(buf, (err: any, data: any) => (err ? reject(err) : resolve(data)));
  });

  const total = png.width * png.height;
  let transparentPixels = 0;
  let blackSpacePixels = 0;
  let validDataPixels = 0;
  let lumSum = 0;
  let minLum = 255;
  let maxLum = 0;

  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    const a = png.data[i + 3];

    if (a === 0) {
      transparentPixels++;
    } else if (r < 25 && g < 25 && b < 25) {
      blackSpacePixels++;
    } else {
      validDataPixels++;
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      lumSum += lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }
  }

  return {
    dimensions: { width: png.width, height: png.height },
    pixelStats: {
      total,
      transparentPixels,
      transparentPct: Number(((transparentPixels / total) * 100).toFixed(1)),
      blackSpacePixels,
      validDataPixels,
      validDataPct: Number(((validDataPixels / total) * 100).toFixed(1)),
      minLum: validDataPixels > 0 ? minLum : 0,
      maxLum: validDataPixels > 0 ? maxLum : 0,
      meanLum: validDataPixels > 0 ? Number((lumSum / validDataPixels).toFixed(1)) : 0,
    },
  };
}

async function runAudit() {
  console.log('====================================================');
  console.log('📡 MOOEARTH SATELLITE SOURCE & COVERAGE AUDIT');
  console.log('====================================================');

  const testLocations = [
    { name: 'Central Asia (Uzbekistan / Turkmenistan)', lat: 40.0, lng: 65.0 },
    { name: 'Northern India / Tibet Border (Himalayas)', lat: 31.0, lng: 79.0 },
    { name: 'Eastern India (Bhubaneshwar / Bay of Bengal)', lat: 20.26, lng: 85.84 },
    { name: 'Equatorial Indian Ocean (South of India)', lat: 0.0, lng: 75.0 },
    { name: 'Iran / Middle East (Tehran / Caspian Sea)', lat: 35.7, lng: 51.4 },
  ];

  // Let's use a verified observation timestamp from today
  const targetDateStr = '2026-11-05';
  const targetTimeIso = '2026-11-05T08:00:00Z'; // 1:30 PM IST (matching user screenshot)
  const z = 5;

  const auditResults: AuditResult[] = [];

  for (const loc of testLocations) {
    const tile = latLngToTile(loc.lat, loc.lng, z);
    const bbox = tileToBbox3857(tile.x, tile.y, z);
    const bboxStr = `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`;

    console.log(`\nAnalyzing Location: ${loc.name} at zoom ${z} (Tile: ${tile.z}/${tile.y}/${tile.x})...`);

    const providersToTest = [
      {
        name: 'NASA GIBS (Himawari Band 13 IR 10.4µm at 140.7°E)',
        url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band13_Clean_Infrared/default/${targetTimeIso}/GoogleMapsCompatible_Level6/${tile.z}/${tile.y}/${tile.x}.png`,
      },
      {
        name: 'NASA GIBS (Himawari Band 3 Red Visible 1km at 140.7°E)',
        url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band3_Red_Visible_1km/default/${targetDateStr}/GoogleMapsCompatible_Level7/${tile.z}/${tile.y}/${tile.x}.png`,
      },
      {
        name: 'EUMETSAT IODC (Meteosat-9 at 45.5°E - msg_iodc:ir108)',
        url: `https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=${bboxStr}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=msg_iodc:ir108&FORMAT=image/png`,
      },
      {
        name: 'EUMETSAT IODC (Meteosat-9 at 45.5°E - msg_iodc:vis006)',
        url: `https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=${bboxStr}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=msg_iodc:vis006&FORMAT=image/png`,
      },
      {
        name: 'EUMETSAT FES Prime (Meteosat-11 at 0.0° - msg_fes:ir108)',
        url: `https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=${bboxStr}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=msg_fes:ir108&FORMAT=image/png`,
      },
    ];

    const providerResults: AuditResult['providers'] = [];

    for (const prov of providersToTest) {
      const t0 = performance.now();
      try {
        const res = await fetch(prov.url, { headers: { 'User-Agent': 'MooEarth-Audit/1.0' } });
        const latencyMs = Math.round(performance.now() - t0);
        if (!res.ok) {
          providerResults.push({
            name: prov.name,
            url: prov.url,
            status: res.status,
            latencyMs,
            byteSize: 0,
            error: `HTTP ${res.status}: ${res.statusText}`,
          });
          console.log(`  ❌ ${prov.name} -> HTTP ${res.status} (${latencyMs}ms)`);
          continue;
        }

        const buf = Buffer.from(await res.arrayBuffer());
        const analysis = await analyzePngBuffer(buf);

        providerResults.push({
          name: prov.name,
          url: prov.url,
          status: res.status,
          latencyMs,
          byteSize: buf.length,
          dimensions: analysis.dimensions,
          pixelStats: analysis.pixelStats,
        });

        console.log(
          `  ✅ ${prov.name} -> ${res.status} OK (${latencyMs}ms, ${buf.length} bytes, ` +
            `Valid Data: ${analysis.pixelStats.validDataPct}%, Transparent: ${analysis.pixelStats.transparentPct}%, Mean Lum: ${analysis.pixelStats.meanLum})`
        );
      } catch (err: any) {
        const latencyMs = Math.round(performance.now() - t0);
        providerResults.push({
          name: prov.name,
          url: prov.url,
          status: 0,
          latencyMs,
          byteSize: 0,
          error: err.message,
        });
        console.log(`  ❌ ${prov.name} -> Error: ${err.message} (${latencyMs}ms)`);
      }
    }

    auditResults.push({
      location: loc.name,
      coords: { lat: loc.lat, lng: loc.lng },
      tile,
      providers: providerResults,
    });
  }

  // Write audit results JSON and summary
  const outPath = path.join(process.cwd(), 'test-results', 'satellite-source-audit.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(auditResults, null, 2), 'utf8');
  console.log(`\nAudit results written to: ${outPath}`);
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
