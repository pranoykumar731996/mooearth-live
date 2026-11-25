// gibs-protocol-worker.js
// MapLibre Web Worker Script: Intercepts NASA GIBS & EUMETSAT Geostationary satellite tiles
// 1. Sector Spatial Blending & Longitude Cross-Fade:
//    Circular partition of unity across all 360 degrees (Himawari, GOES-West, GOES-East, Meteosat)
//    with raised-cosine edge-feathering, completely eliminating 100% of vertical razor seams!
// 2. Latitude Limb Fade:
//    Smoothly dissolves cloud boundaries between 56° and 66° latitude North and South.
// 3. Desert Sand, Land & Ocean Glint Discrimination (Windy Parity):
//    Keys out clear ocean, dark land, city lights, and iron-rich desert sand (Sahara, Arabia)
//    with 100% transparency, letting the underlying basemap shine through.
// 4. Soft Organic Sigmoid Albedo-to-Alpha Cloud Formation:
//    Renders clouds as pure, semi-translucent, floating luminous white cloud formations.
// 5. Day/Night Solar Terminator Harmonization:
//    Renders nighttime infrared clouds in soft silvery moonlight white, giving 24/7 cloud continuity.
// 6. Calibrated Dvorak/BD Curve (in Infra Mode):
//    Vivid temperature-coded convective storm cores (-30°C to -80°C).

// MapLibre slippy tile conversions (EPSG:3857 Web Mercator)
function tileToLng(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tileToLat(y, z) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function tilePixelToLatLon(z, tileX, tileY, px, py, tileSize = 256) {
  const n = Math.pow(2, z);
  const lonDeg = ((tileX + (px + 0.5) / tileSize) / n) * 360 - 180;
  const yFrac = tileY + (py + 0.5) / tileSize;
  const latDeg = (Math.atan(Math.sinh(Math.PI * (1 - (2 * yFrac) / n))) * 180) / Math.PI;
  return { latDeg, lonDeg };
}

const EMPTY_TRANSPARENT_PNG_BYTES = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0,
  0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45,
  180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

function createEmptyTransparentPngBuffer() {
  return EMPTY_TRANSPARENT_PNG_BYTES.slice().buffer;
}

function parseTileCoordsFromUrl(url) {
  if (!url) return null;
  const noaaMatch = url.match(/^noaa-star:\/\/tile\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)/i);
  if (noaaMatch) {
    return {
      tileZ: parseInt(noaaMatch[1], 10),
      tileX: parseInt(noaaMatch[2], 10),
      tileY: parseInt(noaaMatch[3], 10),
    };
  }
  const eumetMatch = url.match(/\/tile\/([^/?]+)\/(\d+)\/(\d+)\/(\d+)\.png/i);
  if (eumetMatch) {
    return {
      tileZ: parseInt(eumetMatch[2], 10),
      tileX: parseInt(eumetMatch[3], 10),
      tileY: parseInt(eumetMatch[4], 10),
    };
  }
  const isGibs =
    url.includes('gibs.earthdata.nasa.gov') ||
    url.includes('GoogleMapsCompatible') ||
    url.includes('gibs-alpha');
  const wmtsMatch = url.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)/i);
  if (wmtsMatch) {
    return {
      tileZ: parseInt(wmtsMatch[1], 10),
      tileX: parseInt(isGibs ? wmtsMatch[3] : wmtsMatch[2], 10),
      tileY: parseInt(isGibs ? wmtsMatch[2] : wmtsMatch[3], 10),
    };
  }
  return null;
}

function isTileOutsideSectorSupport(url, coords = parseTileCoordsFromUrl(url)) {
  if (!url || !coords || !Number.isFinite(coords.tileZ) || coords.tileZ < 2) return false;
  const { tileZ, tileX, tileY } = coords;
  const northLat = tileToLat(tileY, tileZ);
  const southLat = tileToLat(tileY + 1, tileZ);
  const westLng = tileToLng(tileX, tileZ);
  const eastLng = tileToLng(tileX + 1, tileZ);

  if (url.includes('worldcloudmap') || url.includes('mumi') || url.includes('global-polar')) {
    return northLat <= 58.0 && southLat >= -58.0;
  }

  const isHimawari = url.includes('Himawari') || url.includes('himawari');
  const isIodc = (url.includes('msg_iodc') || url.includes('eumet-iodc')) && !isHimawari;
  const isMeteosatPrime =
    (url.includes('msg_fes') || url.includes('europe-africa') || url.includes('eumet-prime')) && !isIodc;
  const isGoesEast = url.includes('GOES-East') || url.includes('goes-east') || url.startsWith('noaa-star://');
  const isGoesWest = url.includes('GOES-West') || url.includes('goes-west');

  if (!isHimawari && !isIodc && !isMeteosatPrime && !isGoesEast && !isGoesWest) return false;
  if (southLat >= 65.0 || northLat <= -65.0) return true;

  let arcCenter = 0;
  let arcHalfSpan = 180;
  if (isIodc) {
    arcCenter = 60.0;
    arcHalfSpan = 35.0;
  } else if (isHimawari) {
    arcCenter = 135.0;
    arcHalfSpan = 60.0;
  } else if (isGoesWest) {
    arcCenter = 215.0;
    arcHalfSpan = 50.0;
  } else if (isGoesEast) {
    arcCenter = 285.0;
    arcHalfSpan = 60.0;
  } else if (isMeteosatPrime) {
    arcCenter = 2.5;
    arcHalfSpan = 42.5;
  }

  const tileCenterLng = (westLng + eastLng) * 0.5;
  const tileHalfW = (eastLng - westLng) * 0.5;
  const delta = Math.abs((((tileCenterLng - arcCenter) % 360) + 540) % 360 - 180);
  return delta > tileHalfW + arcHalfSpan + 0.5;
}

function isBlackMarbleTileSolidDaylight(url, coords = parseTileCoordsFromUrl(url)) {
  if (!url || !coords || !Number.isFinite(coords.tileZ) || coords.tileZ < 3) return false;
  const tMatch = url.match(/[?&]t=(\d+)/);
  const timeMs = tMatch ? parseInt(tMatch[1], 10) : Date.now();
  const dateObj = new Date(timeMs);
  const dayDiff = (timeMs - 946728000000) / 86400000;
  const L = (280.46 + 0.9856474 * dayDiff) % 360;
  const g = ((357.528 + 0.9856003 * dayDiff) % 360) * (Math.PI / 180);
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * (Math.PI / 180);
  const eps = (23.439 - 0.0000004 * dayDiff) * (Math.PI / 180);
  const solLatRad = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const utcHours =
    dateObj.getUTCHours() + dateObj.getUTCMinutes() / 60 + dateObj.getUTCSeconds() / 3600;
  const solLngRad = ((((12 - utcHours) * 15 + 540) % 360) - 180) * (Math.PI / 180);
  const rad = Math.PI / 180;

  const { tileZ, tileX, tileY } = coords;
  const lats = [tileToLat(tileY, tileZ), tileToLat(tileY + 1, tileZ)];
  const lngs = [tileToLng(tileX, tileZ), tileToLng(tileX + 1, tileZ)];
  const sinSol = Math.sin(solLatRad);
  const cosSol = Math.cos(solLatRad);

  let maxPsi = 0;
  for (const latDeg of lats) {
    const latRad = latDeg * rad;
    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    for (const lngDeg of lngs) {
      const cosZ = Math.max(-1, Math.min(1, sinLat * sinSol + cosLat * cosSol * Math.cos(lngDeg * rad - solLngRad)));
      const psi = Math.acos(cosZ);
      if (psi > maxPsi) maxPsi = psi;
    }
  }
  return Math.cos(Math.min(Math.PI, maxPsi + 4 * rad)) >= 0.06;
}

// Authoritative NOAA ABI PUG-L2+ Vol 5 Fixed Grid constants & GRS80 datum (GOES-East -75.0 deg)
const NOAA_STAR_CONSTANTS = {
  R_EQ_M: 6378137.0,
  R_POL_M: 6356752.31414,
  H_PERSPECTIVE_M: 35786023.0,
  SAT_DIST_M: 42164160.0,
  E2: 1 - (6356752.31414 * 6356752.31414) / (6378137.0 * 6378137.0),
  LONGITUDE_OF_PROJECTION_ORIGIN_DEG: -75.0,
  NATIVE_FIRST_PIXEL_CENTER_X_RAD: -0.151844,
  NATIVE_FIRST_PIXEL_CENTER_Y_RAD: 0.151844,
  NATIVE_STEP_RAD: 56e-6,
  NATIVE_OUTER_BOUND_RAD: 0.151872,
};

// Symmetric 3x3 block-average baseline for 1808x1808; empirical STAR JPEG offset is passed separately
// and applied strictly when decoded dimensions equal 1808x1808.
const STAR_1808_SYMMETRIC_BLOCK3 = {
  id: 'STAR_1808_SYMMETRIC_BLOCK3',
  imageSize: 1808,
  firstPixelCenterXRad: NOAA_STAR_CONSTANTS.NATIVE_FIRST_PIXEL_CENTER_X_RAD + NOAA_STAR_CONSTANTS.NATIVE_STEP_RAD, // -0.151788
  firstPixelCenterYRad: NOAA_STAR_CONSTANTS.NATIVE_FIRST_PIXEL_CENTER_Y_RAD - NOAA_STAR_CONSTANTS.NATIVE_STEP_RAD, // +0.151788
  stepRad: 3 * NOAA_STAR_CONSTANTS.NATIVE_STEP_RAD,                                                                // 168e-6
};

const NOAA_STAR_DEFAULTS = {
  SOURCE_URL: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/1808x1808.jpg',
  TELEMETRY_CHANNEL: 'noaa-star-pilot-telemetry',
  EXPECTED_WIDTH: 1808,
  EXPECTED_HEIGHT: 1808,
  MAX_NOAA_RESPONSE_BYTES: 8 * 1024 * 1024,
  // Tracked worker-buffer budget ONLY (excludes MapLibre-retained tile bitmaps & browser/GPU overhead)
  MAX_TRACKED_BUFFER_BYTES: 40 * 1024 * 1024,
  MAX_CONCURRENT_TILE_JOBS: 8,
  EST_TILE_JOB_BYTES: 560 * 1024,
  STRIP_HEIGHT: 256,
  NOAA_FETCH_TIMEOUT_MS: 10000,
  GIBS_FETCH_TIMEOUT_MS: 10000,
  SOURCE_CACHE_TTL_MS: 5 * 60 * 1000,
  COOLDOWN_MS: 120 * 1000,
  DEFAULT_OFFSET_X: 0.333,
  DEFAULT_OFFSET_Y: 0.333,
};

function geodeticToAbiScan(latDeg, lonDeg, lambda0Deg = NOAA_STAR_CONSTANTS.LONGITUDE_OF_PROJECTION_ORIGIN_DEG) {
  const rad = Math.PI / 180;
  const lat = latDeg * rad;
  const lon = lonDeg * rad;
  const lon0 = lambda0Deg * rad;

  const rEq = NOAA_STAR_CONSTANTS.R_EQ_M;
  const rPol = NOAA_STAR_CONSTANTS.R_POL_M;
  const D = NOAA_STAR_CONSTANTS.SAT_DIST_M;
  const e2 = NOAA_STAR_CONSTANTS.E2;

  const phiC = Math.atan((1 - e2) * Math.tan(lat));
  const cosPhiC = Math.cos(phiC);
  const sinPhiC = Math.sin(phiC);
  const rC = rPol / Math.sqrt(1 - e2 * cosPhiC * cosPhiC);

  const dLon = lon - lon0;
  const xp = rC * cosPhiC * Math.cos(dLon);
  const sx = D - xp;
  const sy = -rC * cosPhiC * Math.sin(dLon);
  const sz = rC * sinPhiC;

  if (D * xp < rEq * rEq) return null;

  const sNorm = Math.sqrt(sx * sx + sy * sy + sz * sz);
  return {
    scanX: Math.asin(-sy / sNorm),
    scanY: Math.atan2(sz, sx),
  };
}

function scanToPixel(scanX, scanY, { gridSpec = STAR_1808_SYMMETRIC_BLOCK3, calibrationOffsetPx = { x: 0, y: 0 } } = {}) {
  return {
    col: (scanX - gridSpec.firstPixelCenterXRad) / gridSpec.stepRad + (calibrationOffsetPx.x || 0),
    row: (gridSpec.firstPixelCenterYRad - scanY) / gridSpec.stepRad + (calibrationOffsetPx.y || 0),
  };
}

function pixelToScan(col, row, { gridSpec = STAR_1808_SYMMETRIC_BLOCK3, calibrationOffsetPx = { x: 0, y: 0 } } = {}) {
  const c = col - (calibrationOffsetPx.x || 0);
  const r = row - (calibrationOffsetPx.y || 0);
  return {
    scanX: gridSpec.firstPixelCenterXRad + c * gridSpec.stepRad,
    scanY: gridSpec.firstPixelCenterYRad - r * gridSpec.stepRad,
  };
}

function detectFooterStartRowRgb(rgbData, width, height) {
  const scanDepth = Math.round(height * 0.05);
  const stepX = Math.max(8, Math.round(width / 226));
  for (let y = height - scanDepth; y < height; y++) {
    let brightCount = 0;
    let sampled = 0;
    const rowOff = y * width * 3;
    for (let x = 0; x < width; x += stepX) {
      const i = rowOff + x * 3;
      if (rgbData[i] > 235 && rgbData[i + 1] > 235 && rgbData[i + 2] > 235) brightCount++;
      sampled++;
    }
    if (sampled > 0 && brightCount / sampled >= 0.65) return y;
  }
  return height;
}

function sampleNoaaRgbBilinear(rgb, width, height, col, row, footerStartRow) {
  if (col < 0 || col >= width - 1 || row < 0 || row >= Math.min(height - 1, footerStartRow - 2)) return null;
  const centerIdx = (width - 1) / 2;
  const maxRad = width * (905 / 1808);
  const dxC = col - centerIdx;
  const dyC = row - centerIdx;
  if (dxC * dxC + dyC * dyC > maxRad * maxRad) return null;

  const x0 = Math.floor(col);
  const y0 = Math.floor(row);
  const fx = col - x0;
  const fy = row - y0;
  const row0 = y0 * width;
  const row1 = (y0 + 1) * width;
  const i00 = (row0 + x0) * 3;
  const i10 = (row0 + x0 + 1) * 3;
  const i01 = (row1 + x0) * 3;
  const i11 = (row1 + x0 + 1) * 3;
  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;
  return [
    Math.round(rgb[i00] * w00 + rgb[i10] * w10 + rgb[i01] * w01 + rgb[i11] * w11),
    Math.round(rgb[i00 + 1] * w00 + rgb[i10 + 1] * w10 + rgb[i01 + 1] * w01 + rgb[i11 + 1] * w11),
    Math.round(rgb[i00 + 2] * w00 + rgb[i10 + 2] * w10 + rgb[i01 + 2] * w01 + rgb[i11 + 2] * w11),
  ];
}

function reprojectNoaaStarRgbLut32({
  rgb,
  width,
  height,
  footerStartRow,
  tileZ,
  tileX,
  tileY,
  calOffsetPx = { x: NOAA_STAR_DEFAULTS.DEFAULT_OFFSET_X, y: NOAA_STAR_DEFAULTS.DEFAULT_OFFSET_Y },
  tileSize = 256,
  gridN = 32,
  outRgba = new Uint8ClampedArray(tileSize * tileSize * 4),
}) {
  if (width !== NOAA_STAR_DEFAULTS.EXPECTED_WIDTH || height !== NOAA_STAR_DEFAULTS.EXPECTED_HEIGHT) {
    throw new Error('UNEXPECTED_NOAA_DIMENSIONS');
  }
  const verts = gridN + 1;
  const colLut = new Float64Array(verts * verts);
  const rowLut = new Float64Array(verts * verts);
  const validLut = new Uint8Array(verts * verts);
  const cellPx = tileSize / gridN;
  const gridSpec = STAR_1808_SYMMETRIC_BLOCK3;

  for (let gy = 0; gy < verts; gy++) {
    for (let gx = 0; gx < verts; gx++) {
      const idx = gy * verts + gx;
      const { latDeg, lonDeg } = tilePixelToLatLon(tileZ, tileX, tileY, gx * cellPx, gy * cellPx, tileSize);
      const scan = geodeticToAbiScan(latDeg, lonDeg, NOAA_STAR_CONSTANTS.LONGITUDE_OF_PROJECTION_ORIGIN_DEG);
      if (!scan) continue;
      const pt = scanToPixel(scan.scanX, scan.scanY, { gridSpec, calibrationOffsetPx: calOffsetPx });
      colLut[idx] = pt.col;
      rowLut[idx] = pt.row;
      validLut[idx] = 1;
    }
  }

  for (let py = 0; py < tileSize; py++) {
    const gy = Math.min(gridN - 1, Math.floor(py / cellPx));
    const fy = (py - gy * cellPx) / cellPx;
    for (let px = 0; px < tileSize; px++) {
      const gx = Math.min(gridN - 1, Math.floor(px / cellPx));
      const fx = (px - gx * cellPx) / cellPx;
      const i00 = gy * verts + gx;
      const i10 = i00 + 1;
      const i01 = i00 + verts;
      const i11 = i01 + 1;

      let col;
      let row;
      if (validLut[i00] && validLut[i10] && validLut[i01] && validLut[i11]) {
        const w00 = (1 - fx) * (1 - fy);
        const w10 = fx * (1 - fy);
        const w01 = (1 - fx) * fy;
        const w11 = fx * fy;
        col = colLut[i00] * w00 + colLut[i10] * w10 + colLut[i01] * w01 + colLut[i11] * w11;
        row = rowLut[i00] * w00 + rowLut[i10] * w10 + rowLut[i01] * w01 + rowLut[i11] * w11;
      } else {
        const { latDeg, lonDeg } = tilePixelToLatLon(tileZ, tileX, tileY, px, py, tileSize);
        const scan = geodeticToAbiScan(latDeg, lonDeg, NOAA_STAR_CONSTANTS.LONGITUDE_OF_PROJECTION_ORIGIN_DEG);
        if (!scan) continue;
        const pt = scanToPixel(scan.scanX, scan.scanY, { gridSpec, calibrationOffsetPx: calOffsetPx });
        col = pt.col;
        row = pt.row;
      }

      const sampled = sampleNoaaRgbBilinear(rgb, width, height, col, row, footerStartRow);
      if (!sampled) continue;
      const o = (py * tileSize + px) * 4;
      outRgba[o] = sampled[0];
      outRgba[o + 1] = sampled[1];
      outRgba[o + 2] = sampled[2];
      outRgba[o + 3] = 255;
    }
  }
  return outRgba;
}

async function fetchDirectHttpsGibsTile(initialHttpsUrl, signal, fetchFn = fetch) {
  if (signal && signal.aborted) throw makeAbortError();
  let realUrl = initialHttpsUrl;
  let res = await fetchFn(realUrl, { signal });
  if (!res.ok && res.status === 404) {
    const isoMatch = realUrl.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
    if (isoMatch) {
      const curIso = isoMatch[1];
      const curTime = new Date(curIso).getTime();
      for (let step = 1; step <= 3 && !res.ok; step++) {
        if (signal && signal.aborted) throw makeAbortError();
        const prev = new Date(curTime - step * 10 * 60000);
        const yyyy = prev.getUTCFullYear();
        const mm = String(prev.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(prev.getUTCDate()).padStart(2, '0');
        const hh = String(prev.getUTCHours()).padStart(2, '0');
        const min = String(prev.getUTCMinutes()).padStart(2, '0');
        const fbUrl = realUrl.replace(curIso, `${yyyy}-${mm}-${dd}T${hh}:${min}:00Z`);
        try {
          const fbRes = await fetchFn(fbUrl, { signal });
          if (fbRes.ok) {
            res = fbRes;
            realUrl = fbUrl;
            break;
          }
        } catch (err) {
          if (signal && signal.aborted) throw err;
        }
      }
      if (!res.ok) {
        if (signal && signal.aborted) throw makeAbortError();
        const dateOnlyUrl = realUrl.replace(isoMatch[0], curIso.slice(0, 10));
        try {
          const dateRes = await fetchFn(dateOnlyUrl, { signal });
          if (dateRes.ok) {
            res = dateRes;
            realUrl = dateOnlyUrl;
          }
        } catch (err) {
          if (signal && signal.aborted) throw err;
        }
      }
    }
  }
  if (signal && signal.aborted) throw makeAbortError();
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return { res, resolvedUrl: realUrl };
}

async function readResponseBytesBounded(res, maxBytes, onProgressBytes) {
  const clHeader = res.headers && typeof res.headers.get === 'function' ? res.headers.get('content-length') : null;
  if (clHeader !== null && clHeader !== '') {
    const declared = Number(clHeader);
    if (Number.isFinite(declared) && declared > maxBytes) {
      try { await res.body?.cancel?.('NOAA_CONTENT_LENGTH_EXCEEDED'); } catch {}
      throw new Error('NOAA_RESPONSE_TOO_LARGE');
    }
  }

  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        total += value.byteLength;
        if (total > maxBytes) {
          try { await reader.cancel('NOAA_STREAM_LIMIT_EXCEEDED'); } catch {}
          throw new Error('NOAA_RESPONSE_TOO_LARGE');
        }
        chunks.push(value);
        if (onProgressBytes) onProgressBytes(total);
      }
    } finally {
      try { reader.releaseLock(); } catch {}
    }
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      combined.set(c, offset);
      offset += c.byteLength;
    }
    return combined;
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > maxBytes) throw new Error('NOAA_RESPONSE_TOO_LARGE');
  if (onProgressBytes) onProgressBytes(buf.byteLength);
  return new Uint8Array(buf);
}

function parseNoaaStarTileRequest(rawUrl) {
  const m = rawUrl.match(/^noaa-star:\/\/tile\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)(?:\?(.*))?$/i);
  if (!m) throw new Error('INVALID_NOAA_STAR_TILE_URL');
  const tileZ = parseInt(m[1], 10);
  const tileX = parseInt(m[2], 10);
  const tileY = parseInt(m[3], 10);
  const qs = new URLSearchParams(m[5] || '');
  const layer = qs.get('fallbackLayer') || 'GOES-East_ABI_GeoColor';
  const time = qs.get('fallbackTime') || new Date(Date.now() - 10 * 60000).toISOString().slice(0, 10);
  const tms = qs.get('fallbackTms') || 'GoogleMapsCompatible_Level7';
  const ext = qs.get('fallbackExt') || 'png';
  const spectral = qs.get('spectral') || 'vis';
  const parseOff = (key, def) => {
    const raw = qs.get(key);
    if (raw === null || raw === '') return def;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(-2, Math.min(2, n)) : def;
  };
  return {
    tileZ,
    tileX,
    tileY,
    calOffsetPx: {
      x: parseOff('calX', NOAA_STAR_DEFAULTS.DEFAULT_OFFSET_X),
      y: parseOff('calY', NOAA_STAR_DEFAULTS.DEFAULT_OFFSET_Y),
    },
    httpsGibsUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${time}/${tms}/${tileZ}/${tileY}/${tileX}.${ext}?spectral=${encodeURIComponent(spectral)}`,
  };
}

function makeAbortError(msg = 'Aborted') {
  try {
    return new DOMException(msg, 'AbortError');
  } catch {
    const err = new Error(msg);
    err.name = 'AbortError';
    return err;
  }
}

function createNoaaStarProtocolHandler({
  fetchFn = typeof fetch !== 'undefined' ? fetch : null,
  createImageBitmapFn = typeof createImageBitmap !== 'undefined' ? createImageBitmap : null,
  OffscreenCanvasCtor = typeof OffscreenCanvas !== 'undefined' ? OffscreenCanvas : null,
  BlobCtor = typeof Blob !== 'undefined' ? Blob : null,
  processTilePixelsFn = null,
  extractRgbStripFn = null,
  encodeTileResultFn = null,
  nowFn = () => Date.now(),
  perfNowFn = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  getHeapUsedBytesFn = () => (typeof performance !== 'undefined' && performance.memory ? performance.memory.usedJSHeapSize : null),
  telemetryPostFn = null,
  sourceUrl = NOAA_STAR_DEFAULTS.SOURCE_URL,
  configOverrides = {},
} = {}) {
  const cfg = { ...NOAA_STAR_DEFAULTS, ...configOverrides };
  const state = {
    rgb: null,
    width: 0,
    height: 0,
    footerStartRow: 0,
    fetchedAtMs: 0,
    lastModifiedUtc: null,
    lastModifiedMs: null,
    inFlightPromise: null,
    cooldownUntilMs: 0,
    activeNoaaReaders: 0,
    drainResolvers: [],
    activeTileJobs: 0,
    jobWaiters: [],
    activeStreamBytes: 0,
    activeDecodeBytes: 0,
    activeStripBytes: 0,
    recentTotalMs: [],
    lastTelemetryAtMs: 0,
    telemetryFlushTimer: null,
    gibsHintTime: null,
    gibsHintLayer: null,
    gibsHintAtMs: 0,
    fallbackActive: false,
    fallbackPendingSent: false,
  };

  const getTrackedBytes = () =>
    (state.rgb ? state.rgb.byteLength : 0) +
    state.activeStreamBytes +
    state.activeDecodeBytes +
    state.activeStripBytes +
    state.activeTileJobs * cfg.EST_TILE_JOB_BYTES;

  const waitForReadersDrain = () => {
    if (state.activeNoaaReaders === 0) return Promise.resolve();
    return new Promise((resolve) => state.drainResolvers.push(resolve));
  };

  const releaseNoaaReader = () => {
    if (state.activeNoaaReaders > 0) state.activeNoaaReaders--;
    if (state.activeNoaaReaders === 0 && state.drainResolvers.length > 0) {
      const list = state.drainResolvers.splice(0, state.drainResolvers.length);
      for (const r of list) r();
    }
  };

  const acquireTileSlot = () => {
    if (state.activeTileJobs < cfg.MAX_CONCURRENT_TILE_JOBS) {
      state.activeTileJobs++;
      return Promise.resolve();
    }
    return new Promise((resolve) => state.jobWaiters.push(resolve)).then(() => {
      state.activeTileJobs++;
    });
  };

  const releaseTileSlot = () => {
    if (state.activeTileJobs > 0) state.activeTileJobs--;
    if (state.activeTileJobs < cfg.MAX_CONCURRENT_TILE_JOBS && state.jobWaiters.length > 0) {
      const next = state.jobWaiters.shift();
      next();
    }
  };

  const buildTelemetryPayload = (mode, reason, calOffsetPx, tNow) => {
    const sorted = [...state.recentTotalMs].sort((a, b) => a - b);
    const p50 = sorted.length > 0 ? Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(2)) : null;
    const p95 = sorted.length > 0 ? Number(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)].toFixed(2)) : null;
    const cdnAgeMin = state.lastModifiedMs !== null ? Math.max(0, Math.round((tNow - state.lastModifiedMs) / 60000)) : null;
    return {
      mode,
      reason: reason || null,
      lastModifiedUtc: state.lastModifiedUtc,
      lastModifiedMs: state.lastModifiedMs,
      cdnAgeMinutes: cdnAgeMin,
      calOffsetX: calOffsetPx.x,
      calOffsetY: calOffsetPx.y,
      p50Ms: p50,
      p95Ms: p95,
      sampleCount: sorted.length,
      trackedBufferMb: Number((getTrackedBytes() / (1024 * 1024)).toFixed(2)),
      updatedAtMs: tNow,
    };
  };

  const emitTelemetry = (mode, reason, calOffsetPx, force = false) => {
    if (!telemetryPostFn) return;
    const tNow = nowFn();
    if (state.telemetryFlushTimer && typeof clearTimeout !== 'undefined') {
      clearTimeout(state.telemetryFlushTimer);
      state.telemetryFlushTimer = null;
    }
    if (!force && state.lastTelemetryAtMs > 0 && tNow - state.lastTelemetryAtMs < 1000) {
      if (typeof setTimeout !== 'undefined') {
        state.telemetryFlushTimer = setTimeout(() => {
          state.telemetryFlushTimer = null;
          const flushNow = nowFn();
          state.lastTelemetryAtMs = flushNow;
          telemetryPostFn(buildTelemetryPayload(mode, reason, calOffsetPx, flushNow));
        }, 300);
        if (typeof state.telemetryFlushTimer.unref === 'function') state.telemetryFlushTimer.unref();
      }
      return;
    }
    state.lastTelemetryAtMs = tNow;
    telemetryPostFn(buildTelemetryPayload(mode, reason, calOffsetPx, tNow));
  };

  const tripCooldown = (reason, calOffsetPx) => {
    state.rgb = null;
    state.width = 0;
    state.height = 0;
    state.footerStartRow = 0;
    state.fetchedAtMs = 0;
    state.cooldownUntilMs = nowFn() + cfg.COOLDOWN_MS;
    if (!state.fallbackActive) {
      state.fallbackPendingSent = true;
      emitTelemetry('gibs-fallback-pending', reason, calOffsetPx, true);
    }
  };

  async function extractRgbViaStripCanvas(bitmap) {
    if (extractRgbStripFn) return extractRgbStripFn(bitmap, cfg);
    const w = bitmap.width;
    const h = bitmap.height;
    const stripH = Math.min(cfg.STRIP_HEIGHT, h);
    const stripCanvas = new OffscreenCanvasCtor(w, stripH);
    state.activeStripBytes = w * stripH * 4 * 2;
    const rgb = new Uint8Array(w * h * 3);
    try {
      const ctx = stripCanvas.getContext('2d');
      if (!ctx) throw new Error('OFFSCREEN_CONTEXT_UNAVAILABLE');
      for (let y = 0; y < h; y += stripH) {
        const curH = Math.min(stripH, h - y);
        ctx.clearRect(0, 0, w, curH);
        ctx.drawImage(bitmap, 0, y, w, curH, 0, 0, w, curH);
        const stripData = ctx.getImageData(0, 0, w, curH).data;
        const dstBase = y * w * 3;
        const pxCount = w * curH;
        for (let p = 0; p < pxCount; p++) {
          const s = p << 2;
          const d = dstBase + p * 3;
          rgb[d] = stripData[s];
          rgb[d + 1] = stripData[s + 1];
          rgb[d + 2] = stripData[s + 2];
        }
      }
      return rgb;
    } finally {
      stripCanvas.width = 0;
      stripCanvas.height = 0;
      state.activeStripBytes = 0;
    }
  }

  async function ensureFreshSource(calOffsetPx) {
    const tNow = nowFn();
    if (tNow < state.cooldownUntilMs) {
      throw new Error('NOAA_COOLDOWN_ACTIVE');
    }
    if (state.rgb && tNow - state.fetchedAtMs < cfg.SOURCE_CACHE_TTL_MS) {
      return state;
    }
    if (state.inFlightPromise) {
      return state.inFlightPromise;
    }

    state.fallbackActive = false;
    state.fallbackPendingSent = false;

    state.inFlightPromise = (async () => {
      const noaaController = new AbortController();
      const timeoutId = setTimeout(() => noaaController.abort('noaa-timeout'), cfg.NOAA_FETCH_TIMEOUT_MS);
      let bitmap = null;
      let bytes = null;
      try {
        const res = await fetchFn(sourceUrl, { signal: noaaController.signal });
        if (!res.ok) throw new Error('NOAA_HTTP_' + res.status);

        const lmHeader = res.headers && typeof res.headers.get === 'function' ? res.headers.get('last-modified') : null;
        const parsedLmMs = lmHeader ? Date.parse(lmHeader) : NaN;

        bytes = await readResponseBytesBounded(res, cfg.MAX_NOAA_RESPONSE_BYTES, (n) => {
          state.activeStreamBytes = n;
        });
        // Network fetch & stream finished; disarm network timeout before CPU decode/strip extraction
        clearTimeout(timeoutId);
        state.activeStreamBytes = bytes.byteLength;

        const expectedDecodeBytes = cfg.EXPECTED_WIDTH * cfg.EXPECTED_HEIGHT * 4;
        const expectedStripBytes = cfg.EXPECTED_WIDTH * cfg.STRIP_HEIGHT * 4 * 2;
        const expectedRgbBytes = cfg.EXPECTED_WIDTH * cfg.EXPECTED_HEIGHT * 3;
        await waitForReadersDrain();
        // Evict previous generation synchronously only after active readers drain so no dual-generation RGB exists
        state.rgb = null;
        state.width = 0;
        state.height = 0;

        const projectedPeak = getTrackedBytes() + expectedDecodeBytes + expectedStripBytes + expectedRgbBytes;
        const heapUsed = getHeapUsedBytesFn();
        if (projectedPeak > cfg.MAX_TRACKED_BUFFER_BYTES || (heapUsed !== null && heapUsed > cfg.MAX_TRACKED_BUFFER_BYTES * 4)) {
          throw new Error('NOAA_TRACKED_BUDGET_EXCEEDED');
        }

        let decodeTarget = BlobCtor ? new BlobCtor([bytes], { type: 'image/jpeg' }) : bytes;
        bytes = null;
        state.activeStreamBytes = 0;

        state.activeDecodeBytes = expectedDecodeBytes;
        bitmap = await createImageBitmapFn(decodeTarget);
        decodeTarget = null;
        if (bitmap.width !== cfg.EXPECTED_WIDTH || bitmap.height !== cfg.EXPECTED_HEIGHT) {
          throw new Error('UNEXPECTED_NOAA_DIMENSIONS');
        }

        const rgb = await extractRgbViaStripCanvas(bitmap);
        bitmap.close();
        bitmap = null;
        state.activeDecodeBytes = 0;

        if (getTrackedBytes() + rgb.byteLength > cfg.MAX_TRACKED_BUFFER_BYTES) {
          throw new Error('NOAA_TRACKED_BUDGET_EXCEEDED');
        }

        state.rgb = rgb;
        state.width = cfg.EXPECTED_WIDTH;
        state.height = cfg.EXPECTED_HEIGHT;
        state.footerStartRow = detectFooterStartRowRgb(rgb, cfg.EXPECTED_WIDTH, cfg.EXPECTED_HEIGHT);
        state.fetchedAtMs = nowFn();
        state.lastModifiedUtc = Number.isFinite(parsedLmMs) ? new Date(parsedLmMs).toISOString() : null;
        state.lastModifiedMs = Number.isFinite(parsedLmMs) ? parsedLmMs : null;
        return state;
      } catch (err) {
        if (bitmap && typeof bitmap.close === 'function') {
          try { bitmap.close(); } catch {}
        }
        bytes = null;
        state.activeStreamBytes = 0;
        state.activeDecodeBytes = 0;
        state.activeStripBytes = 0;
        const isNoaaTimeout =
          noaaController.signal.aborted ||
          err === 'noaa-timeout' ||
          (err && err.name === 'AbortError');
        const rawMsg = err && err.message ? err.message : '';
        const isNetworkErr =
          !isNoaaTimeout &&
          (!rawMsg ||
            rawMsg === 'Failed to fetch' ||
            rawMsg === 'Load failed' ||
            rawMsg.includes('NetworkError') ||
            rawMsg.includes('ERR_'));
        const msg = isNoaaTimeout
          ? 'NOAA_TIMEOUT'
          : isNetworkErr
          ? 'NOAA_NETWORK_ERROR'
          : rawMsg || 'NOAA_FETCH_ERROR';
        tripCooldown(msg, calOffsetPx);
        throw new Error(msg);
      } finally {
        clearTimeout(timeoutId);
        state.inFlightPromise = null;
      }
    })();

    return state.inFlightPromise;
  }

  async function renderGibsFallbackTile(req, mapAbortSignal, reason) {
    if (mapAbortSignal && mapAbortSignal.aborted) {
      throw makeAbortError();
    }
    if (!state.fallbackActive && !state.fallbackPendingSent) {
      state.fallbackPendingSent = true;
      emitTelemetry('gibs-fallback-pending', reason, req.calOffsetPx, true);
    }
    const markFallbackActive = () => {
      state.fallbackActive = true;
      state.fallbackPendingSent = false;
      emitTelemetry('gibs-fallback', reason, req.calOffsetPx, true);
    };
    const gibsController = new AbortController();
    const timeoutId = setTimeout(() => gibsController.abort('gibs-timeout'), cfg.GIBS_FETCH_TIMEOUT_MS);
    const onMapAbort = () => gibsController.abort('map-abort');
    if (mapAbortSignal) mapAbortSignal.addEventListener('abort', onMapAbort, { once: true });

    try {
      const hintFresh = state.gibsHintTime && nowFn() - state.gibsHintAtMs < 60000;
      const hintedUrl =
        hintFresh && state.gibsHintLayer && req.httpsGibsUrl.includes(`/${state.gibsHintLayer}/default/`)
          ? req.httpsGibsUrl.replace(/(\/default\/)([^/]+)(\/)/, `$1${state.gibsHintTime}$3`)
          : req.httpsGibsUrl;
      let resObj;
      try {
        resObj = await fetchDirectHttpsGibsTile(hintedUrl, gibsController.signal, fetchFn);
      } catch (hintErr) {
        if (hintedUrl !== req.httpsGibsUrl && !(gibsController.signal && gibsController.signal.aborted)) {
          state.gibsHintTime = null;
          resObj = await fetchDirectHttpsGibsTile(req.httpsGibsUrl, gibsController.signal, fetchFn);
        } else {
          throw hintErr;
        }
      }
      const { res, resolvedUrl } = resObj;
      const resolvedMatch = resolvedUrl.match(/\/best\/([^/]+)\/default\/([^/]+)\//);
      if (resolvedMatch) {
        state.gibsHintLayer = resolvedMatch[1];
        state.gibsHintTime = resolvedMatch[2];
        state.gibsHintAtMs = nowFn();
      }
      const blob = await res.blob();
      if (encodeTileResultFn) {
        const encoded = await encodeTileResultFn({ kind: 'gibs-fallback', blob, resolvedUrl, req });
        markFallbackActive();
        return encoded;
      }
      if (OffscreenCanvasCtor && createImageBitmapFn) {
        let bmp = null;
        let canvas = null;
        try {
          bmp = await createImageBitmapFn(blob);
          canvas = new OffscreenCanvasCtor(bmp.width, bmp.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            markFallbackActive();
            return { data: bmp };
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bmp, 0, 0);
          bmp.close();
          bmp = null;
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if (processTilePixelsFn) {
            processTilePixelsFn(imgData.data, canvas.width, canvas.height, resolvedUrl);
          }
          ctx.putImageData(imgData, 0, 0);
          const cleanBitmap = await createImageBitmapFn(canvas);
          markFallbackActive();
          return { data: cleanBitmap };
        } finally {
          if (bmp && typeof bmp.close === 'function') {
            try { bmp.close(); } catch {}
          }
          if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
          }
        }
      }
      const buf = await blob.arrayBuffer();
      markFallbackActive();
      return { data: buf };
    } catch (fallbackErr) {
      if (!(mapAbortSignal && mapAbortSignal.aborted) && !state.fallbackActive) {
        emitTelemetry('gibs-fallback-failed', reason, req.calOffsetPx, true);
      }
      throw fallbackErr;
    } finally {
      clearTimeout(timeoutId);
      if (mapAbortSignal) mapAbortSignal.removeEventListener('abort', onMapAbort);
    }
  }

  async function handleTileRequest(params, abortController) {
    const mapSignal = abortController ? abortController.signal : null;
    if (mapSignal && mapSignal.aborted) throw makeAbortError();

    const req = parseNoaaStarTileRequest(params.url);
    if (isTileOutsideSectorSupport(params.url, req)) {
      return { data: createEmptyTransparentPngBuffer() };
    }
    const tStart = perfNowFn();

    if (nowFn() < state.cooldownUntilMs) {
      return renderGibsFallbackTile(req, mapSignal, 'NOAA_COOLDOWN_ACTIVE');
    }

    let sourceReady = null;
    try {
      const waitSource = ensureFreshSource(req.calOffsetPx);
      if (mapSignal) {
        sourceReady = await Promise.race([
          waitSource,
          new Promise((_, reject) => {
            if (mapSignal.aborted) reject(makeAbortError());
            else mapSignal.addEventListener('abort', () => reject(makeAbortError()), { once: true });
          }),
        ]);
      } else {
        sourceReady = await waitSource;
      }
    } catch (err) {
      if (mapSignal && mapSignal.aborted) throw err;
      return renderGibsFallbackTile(req, mapSignal, err && err.message ? err.message : 'NOAA_UNAVAILABLE');
    }

    if (!sourceReady || !sourceReady.rgb) {
      return renderGibsFallbackTile(req, mapSignal, 'NOAA_BUFFER_UNAVAILABLE');
    }
    if (getTrackedBytes() + cfg.EST_TILE_JOB_BYTES > cfg.MAX_TRACKED_BUFFER_BYTES) {
      tripCooldown('NOAA_TRACKED_BUDGET_EXCEEDED', req.calOffsetPx);
      return renderGibsFallbackTile(req, mapSignal, 'NOAA_TRACKED_BUDGET_EXCEEDED');
    }

    await acquireTileSlot();
    try {
      if (mapSignal && mapSignal.aborted) throw makeAbortError();
      if (!state.rgb) {
        return await renderGibsFallbackTile(req, mapSignal, 'NOAA_BUFFER_EVICTED');
      }

      const outRgba = new Uint8ClampedArray(256 * 256 * 4);
      state.activeNoaaReaders++;
      try {
        reprojectNoaaStarRgbLut32({
          rgb: state.rgb,
          width: state.width,
          height: state.height,
          footerStartRow: state.footerStartRow,
          tileZ: req.tileZ,
          tileX: req.tileX,
          tileY: req.tileY,
          calOffsetPx: req.calOffsetPx,
          outRgba,
        });
      } finally {
        releaseNoaaReader();
      }

      if (processTilePixelsFn) {
        processTilePixelsFn(outRgba, 256, 256, req.httpsGibsUrl);
      }

      const totalMs = perfNowFn() - tStart;
      state.recentTotalMs.push(totalMs);
      if (state.recentTotalMs.length > 64) state.recentTotalMs.shift();
      state.fallbackActive = false;
      state.fallbackPendingSent = false;
      emitTelemetry('noaa-star', null, req.calOffsetPx, false);

      if (encodeTileResultFn) {
        return await encodeTileResultFn({ kind: 'noaa-star', rgba: outRgba, width: 256, height: 256, req });
      }
      if (OffscreenCanvasCtor && createImageBitmapFn) {
        const tileCanvas = new OffscreenCanvasCtor(256, 256);
        try {
          const ctx = tileCanvas.getContext('2d');
          if (!ctx) return { data: outRgba.buffer };
          const imageData = ctx.createImageData(256, 256);
          imageData.data.set(outRgba);
          ctx.putImageData(imageData, 0, 0);
          const cleanBitmap = await createImageBitmapFn(tileCanvas);
          return { data: cleanBitmap };
        } finally {
          tileCanvas.width = 0;
          tileCanvas.height = 0;
        }
      }
      return { data: outRgba.buffer };
    } finally {
      releaseTileSlot();
    }
  }

  return {
    handleTileRequest,
    ensureFreshSource,
    getState: () => ({
      width: state.width,
      height: state.height,
      hasRgb: Boolean(state.rgb),
      activeNoaaReaders: state.activeNoaaReaders,
      activeTileJobs: state.activeTileJobs,
      cooldownUntilMs: state.cooldownUntilMs,
      trackedBufferBytes: getTrackedBytes(),
    }),
  };
}

// Circular partition of unity across all 360 degrees (Himawari, GOES-West, GOES-East, Meteosat)
function getSectorSpatialWeight(url, lng, lat) {
    const absLat = Math.abs(lat);

    // Polar Underlay: strictly 0.0 below 58°, smooth ramp 58°-65°, 1.0 above 65° up to 85°
    if (url.includes('worldcloudmap') || url.includes('mumi') || url.includes('global-polar')) {
      if (absLat > 85.0) return 0.0;
      if (absLat >= 65.0) return 1.0;
      if (absLat <= 58.0) return 0.0;
      return 0.5 * (1.0 - Math.cos(Math.PI * ((absLat - 58.0) / 7.0)));
    }

    let latWeight = 1.0;
    if (absLat > 65.0) return 0.0;
    else if (absLat > 55.0) latWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((absLat - 55.0) / 10.0)));

    const angle = (((lng % 360) + 360) % 360);
    let lngWeight = 0.0;
    let satLng = 0.0;

    const isHimawari = url.includes('Himawari') || url.includes('himawari');
    const isIodc = (url.includes('msg_iodc') || url.includes('eumet-iodc')) && !isHimawari;
    const isMeteosatPrime = (url.includes('msg_fes') || url.includes('europe-africa') || url.includes('eumet-prime')) && !isIodc;
    const isGoesEast = url.includes('GOES-East') || url.includes('goes-east');
    const isGoesWest = url.includes('GOES-West') || url.includes('goes-west');

    // 5-Sentinel Exact Mathematical Partition of Unity (sum == 1.000 everywhere):
    if (isIodc) {
      satLng = 45.5;
      // Meteosat-9 IODC (45.5°E): Covers East Africa, Middle East, Arabian Sea, India, Bay of Bengal (25°E to 95°E)
      if (angle >= 25.0 && angle <= 45.0) {
        // Smooth blend with Meteosat Prime (25°E to 45°E)
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 25.0) / 20.0)));
      } else if (angle > 45.0 && angle <= 75.0) {
        lngWeight = 1.0; // 100% full coverage across Arabian Sea, Persian Gulf, Pakistan, NW India
      } else if (angle > 75.0 && angle <= 95.0) {
        // Smooth blend with Himawari across Central/Eastern India and Bay of Bengal (75°E to 95°E)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 75.0) / 20.0)));
      }
    } else if (isHimawari) {
      satLng = 140.7;
      // Himawari-9 (140.7°E): Covers India, China, SE Asia, Japan, Australia, Western Pacific (75°E to 195°E)
      if (angle >= 75.0 && angle <= 95.0) {
        // Smooth blend with Meteosat-IODC across Central/Eastern India and Bay of Bengal (75°E to 95°E)
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 75.0) / 20.0)));
      } else if (angle > 95.0 && angle <= 165.0) {
        lngWeight = 1.0; // 100% full coverage across China, Japan, Korea, SE Asia, Australia
      } else if (angle > 165.0 && angle <= 195.0) {
        // Smooth blend with GOES-West over Western Pacific / Dateline (165°E to 195°E)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
      }
    } else if (isGoesWest) {
      satLng = 222.8; // 137.2°W
      // GOES-West (137.2°W / 222.8°E): Covers Central/Eastern Pacific & US West (165°E to 265°E)
      if (angle >= 165.0 && angle <= 195.0) {
        // Smooth blend with Himawari over Western Pacific / Dateline (165°E to 195°E)
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
      } else if (angle > 195.0 && angle <= 225.0) {
        lngWeight = 1.0; // 100% full coverage across Hawaii, Central/East Pacific
      } else if (angle > 225.0 && angle <= 265.0) {
        // Smooth blend with GOES-East over Western North America / US West Coast / Rockies (225° to 265°)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
      }
    } else if (isGoesEast) {
      satLng = 284.8; // 75.2°W
      // GOES-East (75.2°W / 284.8°E): Covers Americas, Caribbean, Atlantic (225°E to 345°E)
      if (angle >= 225.0 && angle <= 265.0) {
        // Smooth blend with GOES-West over Rockies / Great Plains (225° to 265°)
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
      } else if (angle > 265.0 && angle <= 320.0) {
        lngWeight = 1.0; // 100% full coverage across Eastern US, Caribbean, South America, Western Atlantic
      } else if (angle > 320.0 && angle <= 345.0) {
        // Smooth blend with Meteosat Prime over Mid-Atlantic (320° to 345°)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
      }
    } else if (isMeteosatPrime) {
      satLng = 0.0;
      // Meteosat Prime (0°E): Covers Europe, West Africa, Atlantic (320° to 45°E)
      if (angle >= 320.0 && angle <= 345.0) {
        // Smooth blend with GOES-East over Mid-Atlantic (320° to 345°)
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
      } else if (angle > 345.0 || angle <= 25.0) {
        lngWeight = 1.0; // 100% full coverage across UK, France, Germany, Spain, West Africa
      } else if (angle > 25.0 && angle <= 45.0) {
        // Smooth blend with Meteosat-IODC over Eastern Europe / Red Sea / East Africa (25°E to 45°E)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 25.0) / 20.0)));
      }
    }

    // Geostationary Earth Disk Horizon / Limb Feathering:
    // Smoothly feathers out disk edge (74° to 81° angular distance from sub-satellite point)
    let limbWeight = 1.0;
    if (isHimawari || isIodc || isMeteosatPrime || isGoesEast || isGoesWest) {
      const dLng = Math.abs((((lng - satLng + 540) % 360) - 180)) * (Math.PI / 180);
      const dLat = (lat * Math.PI) / 180;
      const cosPsi = Math.cos(dLat) * Math.cos(dLng);
      // cos(74°) ≈ 0.2756, cos(81°) ≈ 0.1564
      if (cosPsi <= 0.1564) {
        limbWeight = 0.0;
      } else if (cosPsi < 0.2756) {
        const t = (cosPsi - 0.1564) / (0.2756 - 0.1564);
        limbWeight = 0.5 * (1.0 - Math.cos(Math.PI * t));
      }
    }

    return Math.max(0.0, Math.min(1.0, lngWeight * latWeight * limbWeight));
  }

  // Physical Elevation & Latitude Lapse-Rate Thermal Ground Discriminator
  // Rejects nocturnal freezing ground in high elevation (Tibet > 3500m) and cold winter interiors
  function getLocalThermalThreshold(lng, lat, isEumet) {
    let thresh = isEumet ? 70 : 72;
    const absLat = Math.abs(lat);

    // 1. Tibetan Plateau & High Himalayas (26°N-39°N, 74°E-104°E, elevation 3,800m-5,500m):
    // Winter nocturnal ground temperature drops to -15°C to -35°C (radiance 140-165).
    // Genuine convective & cirrus clouds over Tibet reach radiance > 172 (-50°C to -80°C).
    if (lat >= 26.0 && lat <= 39.0 && lng >= 74.0 && lng <= 104.0) {
      const edgeX = Math.min(lng - 74.0, 104.0 - lng) / 4.0;
      const edgeY = Math.min(lat - 26.0, 39.0 - lat) / 3.0;
      const coreFactor = Math.max(0.0, Math.min(1.0, Math.min(edgeX, edgeY)));
      thresh += 102 * coreFactor; // Peaks at 174 in plateau center
    }
    // 2. Central Asian & Mongolian Cold Continental Steppe (39°N-55°N, 70°E-125°E):
    else if (lat > 39.0 && lat <= 55.0 && lng >= 70.0 && lng <= 125.0) {
      const edgeX = Math.min(lng - 70.0, 125.0 - lng) / 8.0;
      const edgeY = Math.min(lat - 39.0, 55.0 - lat) / 4.0;
      const coreFactor = Math.max(0.0, Math.min(1.0, Math.min(edgeX, edgeY)));
      thresh += 88 * coreFactor; // Peaks at 160 over northern cold interior
    }
    // 3. High-latitude cold sub-polar continental land (> 55°N):
    else if (absLat > 55.0 && absLat <= 65.0) {
      const polarFactor = (absLat - 55.0) / 10.0;
      thresh += 50 * polarFactor;
    }
    return thresh;
  }

  // Unified Tile Pixel Processor (shared across gibs-alpha & eumet-alpha)
  function processTilePixels(d, width, height, realUrl) {
    const len = d.length;
    const totalPixels = width * height;

    // Parse slippy tile coordinates /{z}/{y}/{x}.ext from URL (or query params from proxy)
    let tileZ = 3, tileY = 0, tileX = 0, hasCoords = false;
    const isGibs = realUrl.includes('gibs.earthdata.nasa.gov') || realUrl.includes('GoogleMapsCompatible') || realUrl.includes('gibs-alpha');
    const wmtsMatch = realUrl.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)/i);
    const queryMatch = realUrl.match(/[?&]z=(\d+)[&]x=(\d+)[&]y=(\d+)/i) || realUrl.match(/[?&]z=(\d+)[&]y=(\d+)[&]x=(\d+)/i);
    if (queryMatch) {
      tileZ = parseInt(queryMatch[1], 10);
      if (realUrl.includes('x=' + queryMatch[2])) {
        tileX = parseInt(queryMatch[2], 10);
        tileY = parseInt(queryMatch[3], 10);
      } else {
        tileY = parseInt(queryMatch[2], 10);
        tileX = parseInt(queryMatch[3], 10);
      }
      hasCoords = true;
    } else if (wmtsMatch) {
      tileZ = parseInt(wmtsMatch[1], 10);
      if (isGibs) {
        // NASA GIBS WMTS uses TileMatrix/TileRow/TileCol -> {z}/{y}/{x}
        tileY = parseInt(wmtsMatch[2], 10);
        tileX = parseInt(wmtsMatch[3], 10);
      } else {
        // Standard Slippy Tile format -> {z}/{x}/{y}
        tileX = parseInt(wmtsMatch[2], 10);
        tileY = parseInt(wmtsMatch[3], 10);
      }
      hasCoords = true;
    }

    const tileLngs = new Float32Array(width);
    const tileLats = new Float32Array(height);
    if (hasCoords) {
      for (let c = 0; c < width; c++) {
        tileLngs[c] = tileToLng(tileX + (c + 0.5) / width, tileZ);
      }
      for (let r = 0; r < height; r++) {
        tileLats[r] = tileToLat(tileY + (r + 0.5) / height, tileZ);
      }
    }

    const isVisMode = realUrl.includes('spectral=vis');
    const isInfraMode = realUrl.includes('spectral=infra');
    const isBlueMode = realUrl.includes('spectral=blue') || (!isVisMode && !isInfraMode);
    const isInfraLayer = realUrl.includes('Band13') || realUrl.includes('Infrared') || realUrl.includes('IR') || realUrl.includes('ir108');
    const isHimawariVis = realUrl.includes('Band3') || realUrl.includes('Himawari_AHI_Band3');
    const isGeoColor = realUrl.includes('GeoColor');
    const isEumet = realUrl.includes('msg_') || realUrl.includes('eumet');

    // Pass 1: Fast Per-Pixel Luminance & Convective Core Tagging (Windy Parity)
    const lum = new Float32Array(totalPixels);
    const convective = new Uint8Array(totalPixels);
    const isHimawari = realUrl.includes('Himawari') || realUrl.includes('himawari');
    const isGoes = realUrl.includes('GOES') || realUrl.includes('goes');

    for (let p = 0, idx = 0; idx < len; idx += 4, p++) {
      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      if (r < 28 && g < 28 && b < 28) {
        lum[p] = 0;
      } else {
        lum[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      if (isHimawari && isInfraLayer) {
        // Himawari-9 Band 13 Clean IR:
        // Convective storm tops & cyclone eyewalls (-40°C to -85°C) -> lum >= 180
        // Active convective rainbands -> lum >= 162
        if (lum[p] >= 180) {
          convective[p] = 1; // 100% Genuine convective cloud top
        } else if (lum[p] >= 162) {
          convective[p] = 2; // Convective rainband candidate
        }
      } else if (isGoes && isInfraLayer) {
        // GOES Band 13 Clean IR:
        if (lum[p] >= 170) {
          convective[p] = 1;
        } else if (lum[p] >= 152) {
          convective[p] = 2;
        }
      } else if (isEumet && isInfraLayer) {
        // EUMETSAT 10.8µm IR (Rejects cold nocturnal soil in Gujarat/Pakistan/Rajasthan < 170):
        if (lum[p] >= 182) {
          convective[p] = 1;
        } else if (lum[p] >= 170) {
          convective[p] = 2;
        }
      }
    }

    // Pass 2: Fast 3x3 Box Blur & BD Core Morphology (Eliminates Hollow Donut Voids)
    const blur = new Float32Array(totalPixels);
    for (let y = 0; y < height; y++) {
      const row = y * width;
      const prevRow = (y > 0 ? y - 1 : y) * width;
      const nextRow = (y < height - 1 ? y + 1 : y) * width;
      for (let x = 0; x < width; x++) {
        const prevCol = x > 0 ? x - 1 : x;
        const nextCol = x < width - 1 ? x + 1 : x;
        const p = row + x;
        blur[p] = (
          lum[prevRow + prevCol] + lum[prevRow + x] + lum[prevRow + nextCol] +
          lum[row + prevCol]     + lum[p]           + lum[row + nextCol] +
          lum[nextRow + prevCol] + lum[nextRow + x] + lum[nextRow + nextCol]
        ) * 0.1111111;

        if (convective[p] === 2) {
          let hasConvNeighbor = false;
          for (let dy = -2; dy <= 2 && !hasConvNeighbor; dy++) {
            const ny = Math.max(0, Math.min(height - 1, y + dy)) * width;
            for (let dx = -2; dx <= 2; dx++) {
              const nx = Math.max(0, Math.min(width - 1, x + dx));
              if (convective[ny + nx] === 1) {
                hasConvNeighbor = true;
                break;
              }
            }
          }
          if (hasConvNeighbor) {
            convective[p] = 3; // Confirmed -72°C BD Convective Core
          }
        }

        // Cyclone Eye Cavity Detection: calm warmer interior surrounded by convective wall ring
        if (convective[p] === 0 && lum[p] >= 115 && lum[p] <= 165) {
          let northConv = false, southConv = false, westConv = false, eastConv = false;
          for (let step = 3; step <= 7; step++) {
            const ny1 = Math.max(0, y - step) * width;
            const ny2 = Math.min(height - 1, y + step) * width;
            const nx1 = Math.max(0, x - step);
            const nx2 = Math.min(width - 1, x + step);
            if (convective[ny1 + x] === 1 || convective[ny1 + x] === 3) northConv = true;
            if (convective[ny2 + x] === 1 || convective[ny2 + x] === 3) southConv = true;
            if (convective[row + nx1] === 1 || convective[row + nx1] === 3) westConv = true;
            if (convective[row + nx2] === 1 || convective[row + nx2] === 3) eastConv = true;
          }
          if (northConv && southConv && westConv && eastConv) {
            convective[p] = 4; // Cyclone Eye Cavity
          }
        }
      }
    }

    // Pass 3: Physically-Accurate Non-Destructive Cloud Transfer Function (Windy & Zoom Earth Parity)
    // Zero artificial Sobel noise, zero unsharp distortion, and zero inter-tile boundary seams!
    for (let y = 0; y < height; y++) {
      const row = y * width;
      for (let x = 0; x < width; x++) {
        const p = row + x;
        const i = p * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const isConv = convective[p] === 1 || convective[p] === 3;

        // Off-disk deep black space void
        if (lum[p] < 28 && !isConv) {
          d[i + 3] = 0;
          continue;
        }

        const spatWeight = hasCoords ? getSectorSpatialWeight(realUrl, tileLngs[x], tileLats[y]) : 1.0;
        if (spatWeight <= 0.001) {
          d[i + 3] = 0;
          continue;
        }

        const l = lum[p];
        const bl = blur[p];
        const baseRadiance = 0.65 * l + 0.35 * bl;

        if (isConv) {
          // ==========================================
          // HIGH-DEFINITION CONVECTIVE STORM TOP & CYCLONE VORTEX (Windy & Zoom Earth Parity)
          // ==========================================
          if (isInfraMode) {
            // Authentic Dvorak BD Color Scale (Kelvin / Celsius)
            if (r > 120 && b > 120 && g < 120) {
              // Overshooting top (-92°C to -80°C) -> Luminous White / Lavender
              d[i] = 255; d[i + 1] = 242; d[i + 2] = 255;
            } else if (convective[p] === 3 || (r > 20 && g < 35 && b < 35)) {
              // Coldest Eyewall Core (-80°C to -62°C) -> Intense Crimson
              d[i] = 220; d[i + 1] = 38; d[i + 2] = 38;
            } else if (r > 180 && g > 50) {
              // Deep Convection (-62°C to -48°C) -> Vivid Amber / Yellow
              d[i] = 245; d[i + 1] = 158; d[i + 2] = 11;
            } else if (g > 100 && r < 200) {
              // Moderate Convection (-48°C to -35°C) -> Emerald Green
              d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
            } else {
              // Upper Convective Cloud (-35°C to -20°C) -> Cyan / Azure
              d[i] = 14; d[i + 1] = 165; d[i + 2] = 233;
            }
            d[i + 3] = Math.min(252, Math.round(248 * spatWeight));
          } else {
            // Blue / Atmospheric / Visible: Natural Convective Cloud Tops with Authentic Sensor Radiance
            const convIntensity = isHimawari
              ? Math.min(1.0, Math.max(0.0, (baseRadiance - 155) / 60))
              : isGoes
              ? Math.min(1.0, Math.max(0.0, (baseRadiance - 142) / 60))
              : Math.min(1.0, Math.max(0.0, (baseRadiance - 132) / 60));

            const convTone = Math.min(255, Math.max(190, Math.round(baseRadiance)));
            const convAlpha = Math.min(252, Math.round((235 + 18 * convIntensity) * spatWeight));

            d[i] = convTone;
            d[i + 1] = convTone;
            d[i + 2] = Math.min(255, convTone + 2);
            d[i + 3] = convAlpha;
          }
          continue;
        }

        if (isBlueMode) {
          // ==========================================
          // BLUE / HD ATMOSPHERIC RADIOMETRIC CLOUD MODE (Zoom Earth & Windy Parity)
          // ==========================================
          let cloudAlpha = 0;
          let sigmoid = 0;

          if (isInfraLayer) {
            const irThresh = hasCoords ? getLocalThermalThreshold(tileLngs[x], tileLats[y], isEumet) : (isEumet ? 70 : 72);
            if (baseRadiance <= irThresh) {
              d[i + 3] = 0;
              continue;
            }
            // Sigmoid Volumetric Density Transfer Function (Zoom Earth & Windy Parity):
            // Translucent high-altitude cirrus filaments, voluminous cumulus decks, and solid thunderstorm cores
            const norm = Math.min(1.0, Math.max(0.0, (baseRadiance - irThresh) / (215.0 - irThresh)));
            sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
            cloudAlpha = Math.round(250.0 * sigmoid * spatWeight);
          } else {
            // Visible optical channels (Himawari Band 3, GOES GeoColor, Meteosat vis006):
            if (isGeoColor) {
              const isBlueOcean = (b > r + 8 && b >= g - 6) || (b > 115 && r < 140 && g < 155);
              const isSand = (r > g && g > b && (r - b) >= 20 && (r - g) >= 6);
              if (isBlueOcean || isSand || l <= 62) { d[i + 3] = 0; continue; }
              const norm = Math.min(1.0, (l - 62) / (205 - 62));
              sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
              cloudAlpha = Math.round(248 * sigmoid * spatWeight);
            } else if (isHimawariVis) {
              // Himawari-9 Band 3 (0.64µm Visible Red Reflectance):
              // Reject ocean (< 55) and desert/land albedo (< 85)
              if (r <= 85) { d[i + 3] = 0; continue; }
              const norm = Math.min(1.0, (r - 85) / (205 - 85));
              sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
              cloudAlpha = Math.round(250 * sigmoid * spatWeight);
            } else if (isEumet) {
              // EUMETSAT Meteosat-9/11 vis006 (0.6µm Visible Optical Reflectance):
              // Reject ocean (< 60) and desert sand (< 92)
              if (l <= 92) { d[i + 3] = 0; continue; }
              const norm = Math.min(1.0, (l - 92) / (210 - 92));
              sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
              cloudAlpha = Math.round(250 * sigmoid * spatWeight);
            } else {
              if (baseRadiance <= 72) {
                d[i + 3] = 0;
                continue;
              }
              const norm = Math.min(1.0, (baseRadiance - 72) / (205 - 72));
              sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
              cloudAlpha = Math.round(248 * sigmoid * spatWeight);
            }
          }

          if (cloudAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }

          if (isInfraLayer) {
            // PRESERVE GENUINE SATELLITE RADIANCE + RAYLEIGH ATMOSPHERIC SCATTER (Zoom Earth & Windy Parity)
            // Dense cloud tops reflect pure luminous sunlight; thin feathered fringes catch atmospheric azure scatter
            const naturalLum = Math.min(255, Math.round(baseRadiance * 1.02));
            const thinness = Math.max(0.0, 1.0 - sigmoid);
            const rayleighB = Math.round(6.0 * thinness);
            const rayleighG = Math.round(2.0 * thinness);

            d[i] = naturalLum;
            d[i + 1] = Math.min(255, naturalLum + rayleighG);
            d[i + 2] = Math.min(255, naturalLum + rayleighB + 2);
            d[i + 3] = cloudAlpha;
          } else if (isGeoColor) {
            // Multi-channel GeoColor: preserve natural RGB
            d[i] = r;
            d[i + 1] = g;
            d[i + 2] = b;
            d[i + 3] = cloudAlpha;
          } else {
            // Single-band visible channel (Himawari Band 3, Meteosat vis006):
            // Pure luminous cloud white + Rayleigh horizon scatter (Zoom Earth & Windy Parity)
            const thinness = Math.max(0.0, 1.0 - sigmoid);
            const rayleighB = Math.round(6.0 * thinness);
            const rayleighG = Math.round(2.0 * thinness);
            const cloudTone = Math.min(255, Math.round(225 + 30 * sigmoid));

            d[i] = cloudTone;
            d[i + 1] = Math.min(255, cloudTone + rayleighG);
            d[i + 2] = Math.min(255, cloudTone + rayleighB);
            d[i + 3] = cloudAlpha;
          }

        } else if (isVisMode) {
          // ==========================================
          // VISIBLE / OPTICAL REFLECTANCE MODE (Natural Day / Fallback Night)
          // ==========================================
          if (isEumet && !isInfraLayer) {
            if (l <= 92) { d[i + 3] = 0; continue; }
            const norm = Math.min(1.0, (l - 92) / (210 - 92));
            const sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
            const cloudAlpha = Math.round(250 * sigmoid * spatWeight);
            if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
            const thinness = Math.max(0.0, 1.0 - sigmoid);
            const rayleighB = Math.round(5.0 * thinness);
            const rayleighG = Math.round(2.0 * thinness);
            const cloudTone = Math.min(255, Math.round(225 + 30 * sigmoid));
            d[i] = cloudTone;
            d[i + 1] = Math.min(255, cloudTone + rayleighG);
            d[i + 2] = Math.min(255, cloudTone + rayleighB);
            d[i + 3] = cloudAlpha;
          } else if (isHimawariVis) {
            if (r <= 85) { d[i + 3] = 0; continue; }
            const norm = Math.min(1.0, (r - 85) / (205 - 85));
            const sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
            const cloudAlpha = Math.round(250 * sigmoid * spatWeight);
            if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
            const thinness = Math.max(0.0, 1.0 - sigmoid);
            const rayleighB = Math.round(5.0 * thinness);
            const rayleighG = Math.round(2.0 * thinness);
            const cloudTone = Math.min(255, Math.round(225 + 30 * sigmoid));
            d[i] = cloudTone;
            d[i + 1] = Math.min(255, cloudTone + rayleighG);
            d[i + 2] = Math.min(255, cloudTone + rayleighB);
            d[i + 3] = cloudAlpha;
          } else if (isGeoColor) {
            const isBlueOcean = (b > r + 8 && b >= g - 6) || (b > 115 && r < 140 && g < 155);
            const isSand = (r > g && g > b && (r - b) >= 20 && (r - g) >= 6);
            if (isBlueOcean || isSand || l <= 62) { d[i + 3] = 0; continue; }
            const norm = Math.min(1.0, (l - 62) / (205 - 62));
            const sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
            const cloudAlpha = Math.round(248 * sigmoid * spatWeight);
            if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
            d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = cloudAlpha;
          } else if (isInfraLayer) {
            // Clean Infrared Band 13 (Truth in Remote Sensing - Zoom Earth & Windy Parity)
            const irThresh = hasCoords ? getLocalThermalThreshold(tileLngs[x], tileLats[y], isEumet) : (isEumet ? 70 : 72);
            if (baseRadiance <= irThresh) { d[i + 3] = 0; continue; }
            const norm = Math.min(1.0, (baseRadiance - irThresh) / (215 - irThresh));
            const sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
            const cloudAlpha = Math.round(250 * sigmoid * spatWeight);
            if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
            const naturalLum = Math.min(255, Math.round(baseRadiance * 1.02));
            const thinness = Math.max(0.0, 1.0 - sigmoid);
            const rayleighB = Math.round(5.0 * thinness);
            const rayleighG = Math.round(2.0 * thinness);
            d[i] = naturalLum;
            d[i + 1] = Math.min(255, naturalLum + rayleighG);
            d[i + 2] = Math.min(255, naturalLum + rayleighB + 2);
            d[i + 3] = cloudAlpha;
          } else {
            if (l <= 72) { d[i + 3] = 0; continue; }
            const norm = Math.min(1.0, (l - 72) / (205 - 72));
            const sigmoid = 1.0 / (1.0 + Math.exp(-9.0 * (norm - 0.38)));
            const cloudAlpha = Math.round(248 * sigmoid * spatWeight);
            if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
            const cloudTone = Math.min(255, Math.round(225 + 30 * sigmoid));
            d[i] = cloudTone; d[i + 1] = cloudTone; d[i + 2] = cloudTone; d[i + 3] = cloudAlpha;
          }
        } else {
          // ==========================================
          // INFRARED THERMAL MODE (Dvorak/BD Hurricane Scale)
          // ==========================================
          const baseThresh = isEumet ? 72 : 118;
          const localThresh = hasCoords ? getLocalThermalThreshold(tileLngs[x], tileLats[y], isEumet) : baseThresh;
          const thresh = Math.max(baseThresh, localThresh);
          const maxRange = isEumet ? 180 : 230;
          if (l <= thresh) {
            d[i + 3] = 0;
            continue;
          }
          const norm = Math.min(1.0, (l - thresh) / (maxRange - thresh));
          const finalAlpha = Math.round(245 * Math.pow(norm, 0.70) * spatWeight);
          if (finalAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }
          // Unified thermodynamic Kelvin temperature palette across EUMETSAT, Himawari, and GOES:
          if (norm < 0.25) {
            // Cirrus & mid-troposphere clouds: soft luminous translucent moonlight-white
            const tone = Math.min(255, Math.max(195, Math.round(210 + 35 * norm)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = Math.min(255, tone + 4);
          } else if (norm < 0.45) {
            // Upper troposphere: dense white cloud top
            const tone = Math.min(255, Math.max(220, Math.round(230 + 20 * norm)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone;
          } else if (norm < 0.65) {
            // Active convection (-40°C to -55°C): Emerald green storm mantle
            d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
          } else if (norm < 0.85) {
            // Deep convective vortex (-55°C to -70°C): Vivid Amber / Yellow core
            d[i] = 245; d[i + 1] = 158; d[i + 2] = 11;
          } else {
            // Coldest overshooting tops (< -70°C): Crimson / Luminous White storm core
            d[i] = 239; d[i + 1] = 68; d[i + 2] = 68;
          }
          d[i + 3] = finalAlpha;
        }
      }
    }

    // 4. Sub-Pixel Spatial Anti-Aliasing (Windy Parity):
    // Eliminates isolated 1-2px sensor noise speckles over ocean and smooths blocky cloud edges into silky organic gradients
    applySpatialAntiAliasing(d, width, height);
  }

  function applySpatialAntiAliasing(d, width, height) {
    const numPixels = width * height;
    const alphaCopy = new Uint8Array(numPixels);
    for (let p = 0; p < numPixels; p++) {
      alphaCopy[p] = d[(p << 2) + 3];
    }

    // Step 0: Pinhole Hole Filling (Ensures solid convective storm tops without single-pixel dark voids)
    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      for (let x = 1; x < width - 1; x++) {
        const p = row + x;
        if (alphaCopy[p] === 0) {
          let denseNeighborCount = 0;
          if (alphaCopy[p - width] >= 200) denseNeighborCount++;
          if (alphaCopy[p + width] >= 200) denseNeighborCount++;
          if (alphaCopy[p - 1] >= 200) denseNeighborCount++;
          if (alphaCopy[p + 1] >= 200) denseNeighborCount++;
          if (denseNeighborCount >= 3) {
            d[(p << 2) + 3] = 246;
            d[p << 2] = 248;
            d[(p << 2) + 1] = 250;
            d[(p << 2) + 2] = 255;
            alphaCopy[p] = 246;
          }
        }
      }
    }

    // Step A: Deep Sensor Noise Speckle Elimination (Eradicates isolated 1-3px spikes over land & sea)
    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      for (let x = 1; x < width - 1; x++) {
        const p = row + x;
        if (alphaCopy[p] > 0) {
          let neighborCount = 0;
          let neighborSum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const ny = (y + dy) * width;
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const na = alphaCopy[ny + (x + dx)];
              if (na > 0) {
                neighborCount++;
                neighborSum += na;
              }
            }
          }
          if (neighborCount < 3 || neighborSum < 80) {
            d[(p << 2) + 3] = 0;
          }
        }
      }
    }

    // Step B: Silky Gaussian-Weighted Edge Anti-Aliasing (Clean Cloud White RGB, Zero Dirty Fringe)
    for (let p = 0; p < numPixels; p++) {
      alphaCopy[p] = d[(p << 2) + 3];
    }
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = rowOffset + x;
        const center = alphaCopy[idx];
        const top = idx - width;
        const bottom = idx + width;
        const nSum = alphaCopy[top] + alphaCopy[bottom] + alphaCopy[idx - 1] + alphaCopy[idx + 1];

        if (center > 0 && nSum > 30) {
          const smoothed = (
            alphaCopy[top - 1] + (alphaCopy[top] << 1) + alphaCopy[top + 1] +
            (alphaCopy[idx - 1] << 1) + (center << 2) + (alphaCopy[idx + 1] << 1) +
            alphaCopy[bottom - 1] + (alphaCopy[bottom] << 1) + alphaCopy[bottom + 1]
          ) >> 4;

          d[(idx << 2) + 3] = smoothed <= 3 ? 0 : smoothed;
          const rgbIdx = idx << 2;
          if (d[rgbIdx] < 200) {
            d[rgbIdx] = 238;
            d[rgbIdx + 1] = 238;
            d[rgbIdx + 2] = 242;
          }
        }
      }
    }
  }

if (typeof self !== 'undefined') {
  const noaaTelemetryChannel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(NOAA_STAR_DEFAULTS.TELEMETRY_CHANNEL) : null;
  const isDedicatedWorkerScope =
    typeof self.document === 'undefined' && typeof self.postMessage === 'function' && !self.addProtocol;
  const noaaStarHandler = createNoaaStarProtocolHandler({
    processTilePixelsFn: processTilePixels,
    telemetryPostFn: (msg) => {
      if (isDedicatedWorkerScope) {
        self.postMessage({ __noaaStarRpc: true, type: 'telemetry', telemetry: msg });
      }
      if (noaaTelemetryChannel) {
        noaaTelemetryChannel.postMessage(msg);
      }
    },
  });

  // Dedicated Worker RPC bridge: MapLibre RasterTileSource runs addProtocol on main thread,
  // so main-thread noaa-star forwards tile work into this Web Worker with zero-copy ImageBitmap transfer.
  if (isDedicatedWorkerScope) {
    const pendingTileControllers = new Map();
    self.addEventListener('message', async (event) => {
      const msg = event.data;
      if (!msg || msg.__noaaStarRpc !== true) return;
      if (msg.type === 'abort') {
        const ctrl = pendingTileControllers.get(msg.id);
        if (ctrl) {
          pendingTileControllers.delete(msg.id);
          ctrl.abort(makeAbortError('map-abort'));
        }
        return;
      }
      if (msg.type !== 'tile') return;

      const tileCtrl = new AbortController();
      pendingTileControllers.set(msg.id, tileCtrl);
      try {
        const result = await noaaStarHandler.handleTileRequest({ url: msg.url }, tileCtrl);
        pendingTileControllers.delete(msg.id);
        const payloadData = result && result.data ? result.data : null;
        const transfer =
          payloadData &&
          ((typeof ImageBitmap !== 'undefined' && payloadData instanceof ImageBitmap) ||
            payloadData instanceof ArrayBuffer)
            ? [payloadData]
            : [];
        self.postMessage({ __noaaStarRpc: true, type: 'result', id: msg.id, data: payloadData }, transfer);
      } catch (err) {
        pendingTileControllers.delete(msg.id);
        self.postMessage({
          __noaaStarRpc: true,
          type: 'error',
          id: msg.id,
          name: (err && err.name) || 'Error',
          message: (err && err.message) || 'Worker tile error',
        });
      }
    });
  }

  if (self.addProtocol) {
    // Protocol 1: NASA GIBS Geostationary Satellites (GOES & Himawari)
    self.addProtocol('gibs-alpha', async (params, abortController) => {
      if (isTileOutsideSectorSupport(params.url)) {
        return { data: createEmptyTransparentPngBuffer() };
      }
      const initialUrl = params.url.replace(/^gibs-alpha:\/\//, 'https://');
      const { res, resolvedUrl } = await fetchDirectHttpsGibsTile(initialUrl, abortController.signal, fetch);
      const blob = await res.blob();

      if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
        try {
          const bitmap = await createImageBitmap(blob);
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) return { data: bitmap };

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          processTilePixels(imgData.data, canvas.width, canvas.height, resolvedUrl);
          ctx.putImageData(imgData, 0, 0);
          const cleanBitmap = await createImageBitmap(canvas);
          return { data: cleanBitmap };
        } catch {
          return { data: await blob.arrayBuffer() };
        }
      }
      return { data: await blob.arrayBuffer() };
    });

    // Protocol 1b: Feature-Flagged NOAA STAR GOES-19 1808x1808 GeoColor Reprojector -> GIBS GeoColor Failover
    self.addProtocol('noaa-star', (params, abortController) => noaaStarHandler.handleTileRequest(params, abortController));

  // Edge proxy helper for EUMETSAT tiles
  function eumetUrlToProxy(url) {
    const match = url.match(/\/tile\/([^/?]+)\/(\d+)\/(\d+)\/(\d+)\.png/i);
    if (!match) return url.replace(/^eumet-alpha:\/\//, 'https://');
    const layer = match[1];
    const z = parseInt(match[2], 10);
    const x = parseInt(match[3], 10);
    const y = parseInt(match[4], 10);
    return `/api/weather/satellite/eumet-tile?z=${z}&x=${x}&y=${y}&layer=${encodeURIComponent(layer)}`;
  }

  // Direct WMS fallback for EUMETSAT
  function eumetUrlToWmsDirect(url) {
    const match = url.match(/\/tile\/([^/?]+)\/(\d+)\/(\d+)\/(\d+)\.png/i);
    if (!match) return url.replace(/^eumet-alpha:\/\//, 'https://');
    const layer = match[1];
    const z = parseInt(match[2], 10);
    const x = parseInt(match[3], 10);
    const y = parseInt(match[4], 10);
    const n = Math.pow(2, z);
    const worldSize = 20037508.342789244 * 2;
    const originShift = 20037508.342789244;
    const res = worldSize / n;
    const minX = x * res - originShift;
    const maxX = (x + 1) * res - originShift;
    const maxY = originShift - y * res;
    const minY = originShift - (y + 1) * res;
    return 'https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=' + minX + ',' + minY + ',' + maxX + ',' + maxY + '&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=' + layer + '&FORMAT=image/png';
  }

  // Protocol 2: EUMETSAT Meteosat High Rate SEVIRI (Europe, Africa & Indian Ocean)
  self.addProtocol('eumet-alpha', async (params, abortController) => {
    if (isTileOutsideSectorSupport(params.url)) {
      return { data: createEmptyTransparentPngBuffer() };
    }
    try {
      let res = null;

      // Primary: direct EUMETSAT WMS (Zero Vercel Serverless CPU cost, native CORS + 7-day browser cache)
      try {
        const directUrl = eumetUrlToWmsDirect(params.url);
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 9000);
        abortController.signal.addEventListener('abort', () => timeoutController.abort());
        const directRes = await fetch(directUrl, { signal: timeoutController.signal });
        clearTimeout(timeoutId);
        if (directRes.ok) res = directRes;
      } catch {
        // Direct WMS failed/timed out, fall through to edge proxy fallback
      }

      // Fallback: edge proxy ONLY if direct WMS fails (e.g. strict firewall or network block)
      if (!res) {
        const proxyUrl = eumetUrlToProxy(params.url);
        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 10000);
        abortController.signal.addEventListener('abort', () => fallbackController.abort());
        try {
          const proxyRes = await fetch(proxyUrl, { signal: fallbackController.signal });
          clearTimeout(fallbackTimeout);
          if (proxyRes.ok) res = proxyRes;
        } catch {
          clearTimeout(fallbackTimeout);
        }
      }

      if (!res || !res.ok) throw new Error('All EUMETSAT tile sources failed');
      const blob = await res.blob();

      if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return { data: bitmap };

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        processTilePixels(imgData.data, canvas.width, canvas.height, params.url);
        ctx.putImageData(imgData, 0, 0);
        const cleanBitmap = await createImageBitmap(canvas);
        return { data: cleanBitmap };
      }
      return { data: await blob.arrayBuffer() };
    } catch {
      const emptyBuf = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,10,73,68,65,84,120,156,99,0,1,0,0,5,0,1,13,10,45,180,0,0,0,0,73,69,78,68,174,66,96,130]);
      return { data: emptyBuf.buffer };
    }
  });

  // Protocol 3: NASA Black Marble (VIIRS Day/Night Band City Lights)
  // Extracts nocturnal city lights, illuminates nighttime continents, keys out day hemisphere
  function processBlackMarblePixels(d, width, height, url) {
    const coordMatch = url.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)/i);
    let tileZ = 3, tileY = 0, tileX = 0, hasCoords = false;
    if (coordMatch) {
      tileZ = parseInt(coordMatch[1], 10);
      tileY = parseInt(coordMatch[2], 10);
      tileX = parseInt(coordMatch[3], 10);
      hasCoords = true;
    }
    if (!hasCoords) return;

    const tMatch = url.match(/[?&]t=(\d+)/);
    const timeMs = tMatch ? parseInt(tMatch[1], 10) : Date.now();
    const dateObj = new Date(timeMs);
    const dayDiff = (timeMs - 946728000000) / 86400000;
    const L = (280.460 + 0.9856474 * dayDiff) % 360;
    const g = ((357.528 + 0.9856003 * dayDiff) % 360) * Math.PI / 180;
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
    const eps = (23.439 - 0.0000004 * dayDiff) * Math.PI / 180;
    const solLat = Math.asin(Math.sin(eps) * Math.sin(lambda)) * 180 / Math.PI;
    const utcHours = dateObj.getUTCHours() + dateObj.getUTCMinutes() / 60 + dateObj.getUTCSeconds() / 3600;
    const solLng = ((12 - utcHours) * 15 + 540) % 360 - 180;
    const rad = Math.PI / 180;

    const tileLngs = new Float32Array(width);
    const tileLats = new Float32Array(height);
    for (let c = 0; c < width; c++) tileLngs[c] = tileToLng(tileX + (c + 0.5) / width, tileZ);
    for (let r = 0; r < height; r++) tileLats[r] = tileToLat(tileY + (r + 0.5) / height, tileZ);

    for (let y = 0; y < height; y++) {
      const row = y * width;
      const pLat = tileLats[y];
      const sinLat = Math.sin(pLat * rad);
      const cosLat = Math.cos(pLat * rad);
      const sinSol = Math.sin(solLat * rad);
      const cosSol = Math.cos(solLat * rad);

      for (let x = 0; x < width; x++) {
        const p = row + x;
        const i = p * 4;
        const pLng = tileLngs[x];

        // Solar zenith angle cosine
        const cosZenith = sinLat * sinSol + cosLat * cosSol * Math.cos((pLng - solLng) * rad);

        // Broad daylight: 100% transparent
        if (cosZenith >= 0.06) {
          d[i + 3] = 0;
          continue;
        }

        let nightWeight = 1.0;
        if (cosZenith > -0.06) {
          const t = (cosZenith - (-0.06)) / 0.12;
          nightWeight = 0.5 * (1.0 + Math.cos(t * Math.PI));
        }

        const r = d[i], g = d[i + 1], b = d[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Dark oceans and unpopulated areas: smooth nocturnal darkening without vector knife cuts
        if (lum < 14) {
          d[i] = 1;
          d[i + 1] = 3;
          d[i + 2] = 8;
          d[i + 3] = Math.round(180 * nightWeight);
          continue;
        }

        // City lights & populated centers: warm golden radiance (Zoom Earth parity)
        const intensity = Math.min(1.0, Math.pow((lum - 14) / 75.0, 0.65));
        const alpha = Math.min(252, Math.round(250 * intensity * nightWeight));

        // Warm golden/amber luminescence matching ISS & Zoom Earth night photography
        d[i] = Math.min(255, Math.round(r * 1.35 + 28));
        d[i + 1] = Math.min(255, Math.round(g * 1.20 + 18));
        d[i + 2] = Math.min(255, Math.round(b * 0.85 + 4));
        d[i + 3] = alpha;
      }
    }
  }

  self.addProtocol('black-marble-alpha', async (params, abortController) => {
    if (isBlackMarbleTileSolidDaylight(params.url)) {
      return { data: createEmptyTransparentPngBuffer() };
    }
    const realUrl = params.url.replace(/^black-marble-alpha:\/\//, 'https://');
    const res = await fetch(realUrl, { signal: abortController.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();

    if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
      try {
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return { data: bitmap };

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        processBlackMarblePixels(imgData.data, canvas.width, canvas.height, params.url);
        ctx.putImageData(imgData, 0, 0);
        const cleanBitmap = await createImageBitmap(canvas);
        return { data: cleanBitmap };
      } catch {
        return { data: await blob.arrayBuffer() };
      }
    }
    return { data: await blob.arrayBuffer() };
  });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NOAA_STAR_CONSTANTS,
    STAR_1808_SYMMETRIC_BLOCK3,
    NOAA_STAR_DEFAULTS,
    tileToLng,
    tileToLat,
    tilePixelToLatLon,
    geodeticToAbiScan,
    scanToPixel,
    pixelToScan,
    detectFooterStartRowRgb,
    sampleNoaaRgbBilinear,
    reprojectNoaaStarRgbLut32,
    fetchDirectHttpsGibsTile,
    readResponseBytesBounded,
    parseNoaaStarTileRequest,
    parseTileCoordsFromUrl,
    isTileOutsideSectorSupport,
    isBlackMarbleTileSolidDaylight,
    createNoaaStarProtocolHandler,
  };
}
