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

function extractSectorFromUrl(url) {
  if (!url) return null;
  const qsSector = url.match(/[?&]sector=([^&#]+)/i);
  if (qsSector && qsSector[1]) {
    try {
      return decodeURIComponent(qsSector[1]).toLowerCase();
    } catch {
      return qsSector[1].toLowerCase();
    }
  }
  if (/eumet-iodc|msg_iodc|meteosat-9/i.test(url)) return 'eumet-iodc';
  if (/europe-africa|eumet-prime|msg_fes|meteosat-0deg|eumet-tile/i.test(url)) return 'europe-africa';
  if (/himawari/i.test(url)) return 'himawari';
  if (/goes-west|goes18|goes-18/i.test(url)) return 'goes-west';
  if (/goes-east|goes19|goes16|goes-19|goes-16/i.test(url) || url.startsWith('noaa-star://')) return 'goes-east';
  if (/worldcloudmap|mumi|global-polar/i.test(url)) return 'global-polar';
  return null;
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

  const sector = extractSectorFromUrl(url);
  if (sector === 'global-polar') {
    return northLat <= 58.0 && southLat >= -58.0;
  }

  if (
    sector !== 'himawari' &&
    sector !== 'eumet-iodc' &&
    sector !== 'europe-africa' &&
    sector !== 'goes-east' &&
    sector !== 'goes-west'
  ) {
    return false;
  }
  if (southLat >= 65.0 || northLat <= -65.0) return true;

  let arcCenter = 0;
  let arcHalfSpan = 180;
  if (sector === 'eumet-iodc') {
    arcCenter = 60.0;
    arcHalfSpan = 35.0;
  } else if (sector === 'himawari') {
    arcCenter = 135.0;
    arcHalfSpan = 60.0;
  } else if (sector === 'goes-west') {
    arcCenter = 215.0;
    arcHalfSpan = 50.0;
  } else if (sector === 'goes-east') {
    arcCenter = 285.0;
    arcHalfSpan = 60.0;
  } else if (sector === 'europe-africa') {
    arcCenter = 2.5;
    arcHalfSpan = 42.5;
  }

  const tileCenterLng = (westLng + eastLng) * 0.5;
  const tileHalfW = (eastLng - westLng) * 0.5;
  const delta = Math.abs((((tileCenterLng - arcCenter) % 360) + 540) % 360 - 180);
  return delta > tileHalfW + arcHalfSpan + 0.5;
}

function computeSolarPositionRad(timeMs) {
  const safeMs = Number.isFinite(timeMs) ? timeMs : Date.now();
  const dateObj = new Date(safeMs);
  const dayDiff = (safeMs - 946728000000) / 86400000;
  const L = (280.46 + 0.9856474 * dayDiff) % 360;
  const g = ((357.528 + 0.9856003 * dayDiff) % 360) * (Math.PI / 180);
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * (Math.PI / 180);
  const eps = (23.439 - 0.0000004 * dayDiff) * (Math.PI / 180);
  const solLatRad = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const utcHours =
    dateObj.getUTCHours() + dateObj.getUTCMinutes() / 60 + dateObj.getUTCSeconds() / 3600;
  const solLngRad = ((((12 - utcHours) * 15 + 540) % 360) - 180) * (Math.PI / 180);
  return {
    solLatRad,
    solLngRad,
    sinSol: Math.sin(solLatRad),
    cosSol: Math.cos(solLatRad),
  };
}

function isBlackMarbleTileSolidDaylight(url, coords = parseTileCoordsFromUrl(url)) {
  if (!url || !coords || !Number.isFinite(coords.tileZ) || coords.tileZ < 3) return false;
  const tMatch = url.match(/[?&]t=(\d+)/);
  const timeMs = tMatch ? parseInt(tMatch[1], 10) : Date.now();
  const { sinSol, cosSol, solLngRad } = computeSolarPositionRad(timeMs);
  const rad = Math.PI / 180;

  const { tileZ, tileX, tileY } = coords;
  const lats = [tileToLat(tileY, tileZ), tileToLat(tileY + 1, tileZ)];
  const lngs = [tileToLng(tileX, tileZ), tileToLng(tileX + 1, tileZ)];

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
  CIRA_PROXY_PATH: '/api/weather/satellite/cira',
  TELEMETRY_CHANNEL: 'noaa-star-pilot-telemetry',
  EXPECTED_WIDTH: 1808,
  EXPECTED_HEIGHT: 1808,
  MAX_NOAA_RESPONSE_BYTES: 8 * 1024 * 1024,
  MAX_CIRA_TILE_BYTES: 3 * 1024 * 1024,
  // Tracked worker-buffer budget ONLY (excludes MapLibre-retained tile bitmaps & browser/GPU overhead)
  // Sized at 68 MB so daytime GeoColor + nighttime IR live sector buffers stay warm simultaneously with LRU eviction.
  MAX_TRACKED_BUFFER_BYTES: 68 * 1024 * 1024,
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

const HIMAWARI_Z1_STEP_RAD = 4 * (65536 / 20466275) * (Math.PI / 180);
const METEOSAT_Z1_STEP_RAD = 4 * (65536 / 781648343.404);

const NOAA_GLOBAL_SECTORS = {
  'goes-east:vis': {
    key: 'goes-east:vis',
    sector: 'goes-east',
    spectral: 'vis',
    satLabel: 'GOES-19',
    product: 'GeoColor',
    sourceKind: 'star-jpeg',
    sourceUrl: 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/GEOCOLOR/1808x1808.jpg',
    width: 1808,
    height: 1808,
    lon0Deg: -75.0,
    sweep: 'x',
    rEq: NOAA_STAR_CONSTANTS.R_EQ_M,
    rPol: NOAA_STAR_CONSTANTS.R_POL_M,
    hDist: NOAA_STAR_CONSTANTS.SAT_DIST_M,
    firstPixelCenterXRad: STAR_1808_SYMMETRIC_BLOCK3.firstPixelCenterXRad,
    firstPixelCenterYRad: STAR_1808_SYMMETRIC_BLOCK3.firstPixelCenterYRad,
    stepRad: STAR_1808_SYMMETRIC_BLOCK3.stepRad,
    applyCalOffset: true,
    detectFooter: true,
  },
  'goes-east:ir': {
    key: 'goes-east:ir',
    sector: 'goes-east',
    spectral: 'ir',
    satLabel: 'GOES-19 IR',
    product: 'Band13',
    sourceKind: 'cira-z1',
    ciraSat: 'goes-19',
    ciraProduct: 'band_13',
    width: 1356,
    height: 1356,
    lon0Deg: -75.0,
    sweep: 'x',
    rEq: NOAA_STAR_CONSTANTS.R_EQ_M,
    rPol: NOAA_STAR_CONSTANTS.R_POL_M,
    hDist: NOAA_STAR_CONSTANTS.SAT_DIST_M,
    cx: 677.25,
    cy: 677.25,
    stepRad: 4 * 56e-6,
    applyCalOffset: false,
    detectFooter: false,
  },
  'goes-west:vis': {
    key: 'goes-west:vis',
    sector: 'goes-west',
    spectral: 'vis',
    satLabel: 'GOES-18',
    product: 'GeoColor',
    sourceKind: 'star-jpeg',
    sourceUrl: 'https://cdn.star.nesdis.noaa.gov/GOES18/ABI/FD/GEOCOLOR/1808x1808.jpg',
    width: 1808,
    height: 1808,
    lon0Deg: -137.0,
    sweep: 'x',
    rEq: NOAA_STAR_CONSTANTS.R_EQ_M,
    rPol: NOAA_STAR_CONSTANTS.R_POL_M,
    hDist: NOAA_STAR_CONSTANTS.SAT_DIST_M,
    firstPixelCenterXRad: STAR_1808_SYMMETRIC_BLOCK3.firstPixelCenterXRad,
    firstPixelCenterYRad: STAR_1808_SYMMETRIC_BLOCK3.firstPixelCenterYRad,
    stepRad: STAR_1808_SYMMETRIC_BLOCK3.stepRad,
    applyCalOffset: true,
    detectFooter: true,
  },
  'goes-west:ir': {
    key: 'goes-west:ir',
    sector: 'goes-west',
    spectral: 'ir',
    satLabel: 'GOES-18 IR',
    product: 'Band13',
    sourceKind: 'cira-z1',
    ciraSat: 'goes-18',
    ciraProduct: 'band_13',
    width: 1356,
    height: 1356,
    lon0Deg: -137.0,
    sweep: 'x',
    rEq: NOAA_STAR_CONSTANTS.R_EQ_M,
    rPol: NOAA_STAR_CONSTANTS.R_POL_M,
    hDist: NOAA_STAR_CONSTANTS.SAT_DIST_M,
    cx: 677.25,
    cy: 677.25,
    stepRad: 4 * 56e-6,
    applyCalOffset: false,
    detectFooter: false,
  },
  'himawari:vis': {
    key: 'himawari:vis',
    sector: 'himawari',
    spectral: 'vis',
    satLabel: 'Himawari-9',
    product: 'GeoColor',
    sourceKind: 'cira-z1',
    ciraSat: 'himawari',
    ciraProduct: 'geocolor',
    width: 1376,
    height: 1376,
    lon0Deg: 140.7,
    sweep: 'y',
    rEq: NOAA_STAR_CONSTANTS.R_EQ_M,
    rPol: NOAA_STAR_CONSTANTS.R_POL_M,
    hDist: 42164000.0,
    cx: 687.5,
    cy: 686.5,
    stepRad: HIMAWARI_Z1_STEP_RAD,
    applyCalOffset: false,
    detectFooter: false,
  },
  'himawari:ir': {
    key: 'himawari:ir',
    sector: 'himawari',
    spectral: 'ir',
    satLabel: 'Himawari-9 IR',
    product: 'Band13',
    sourceKind: 'cira-z1',
    ciraSat: 'himawari',
    ciraProduct: 'band_13',
    width: 1376,
    height: 1376,
    lon0Deg: 140.7,
    sweep: 'y',
    rEq: NOAA_STAR_CONSTANTS.R_EQ_M,
    rPol: NOAA_STAR_CONSTANTS.R_POL_M,
    hDist: 42164000.0,
    cx: 687.5,
    cy: 686.5,
    stepRad: HIMAWARI_Z1_STEP_RAD,
    applyCalOffset: false,
    detectFooter: false,
  },
  'eumet-iodc:vis': {
    key: 'eumet-iodc:vis',
    sector: 'eumet-iodc',
    spectral: 'vis',
    satLabel: 'Meteosat-9',
    product: 'GeoColor',
    sourceKind: 'cira-z1',
    ciraSat: 'meteosat-9',
    ciraProduct: 'geocolor',
    width: 928,
    height: 928,
    lon0Deg: 45.5,
    sweep: 'y',
    rEq: 6378169.0,
    rPol: 6356583.8,
    hDist: 42164000.0,
    cx: 463.5,
    cy: 463.5,
    stepRad: METEOSAT_Z1_STEP_RAD,
    applyCalOffset: false,
    detectFooter: false,
  },
  'eumet-iodc:ir': {
    key: 'eumet-iodc:ir',
    sector: 'eumet-iodc',
    spectral: 'ir',
    satLabel: 'Meteosat-9 IR',
    product: 'Band09',
    sourceKind: 'cira-z1',
    ciraSat: 'meteosat-9',
    ciraProduct: 'band_09',
    width: 928,
    height: 928,
    lon0Deg: 45.5,
    sweep: 'y',
    rEq: 6378169.0,
    rPol: 6356583.8,
    hDist: 42164000.0,
    cx: 463.5,
    cy: 463.5,
    stepRad: METEOSAT_Z1_STEP_RAD,
    applyCalOffset: false,
    detectFooter: false,
  },
  'europe-africa:vis': {
    key: 'europe-africa:vis',
    sector: 'europe-africa',
    spectral: 'vis',
    satLabel: 'Meteosat-0deg',
    product: 'GeoColor',
    sourceKind: 'cira-z1',
    ciraSat: 'meteosat-0deg',
    ciraProduct: 'geocolor',
    width: 928,
    height: 928,
    lon0Deg: 0.0,
    sweep: 'y',
    rEq: 6378169.0,
    rPol: 6356583.8,
    hDist: 42164000.0,
    cx: 463.5,
    cy: 463.5,
    stepRad: METEOSAT_Z1_STEP_RAD,
    applyCalOffset: false,
    detectFooter: false,
  },
  'europe-africa:ir': {
    key: 'europe-africa:ir',
    sector: 'europe-africa',
    spectral: 'ir',
    satLabel: 'Meteosat-0deg IR',
    product: 'Band09',
    sourceKind: 'cira-z1',
    ciraSat: 'meteosat-0deg',
    ciraProduct: 'band_09',
    width: 928,
    height: 928,
    lon0Deg: 0.0,
    sweep: 'y',
    rEq: 6378169.0,
    rPol: 6356583.8,
    hDist: 42164000.0,
    cx: 463.5,
    cy: 463.5,
    stepRad: METEOSAT_Z1_STEP_RAD,
    applyCalOffset: false,
    detectFooter: false,
  },
};

function getGlobalSectorSpec(sector = 'goes-east', spectral = 'vis') {
  const modeKey = spectral === 'vis' ? 'vis' : 'ir';
  const sec = NOAA_GLOBAL_SECTORS[`${sector}:${modeKey}`];
  return sec || NOAA_GLOBAL_SECTORS[`goes-east:${modeKey}`] || NOAA_GLOBAL_SECTORS['goes-east:vis'];
}

function geodeticToGeoScan(latDeg, lonDeg, {
  lon0Deg = NOAA_STAR_CONSTANTS.LONGITUDE_OF_PROJECTION_ORIGIN_DEG,
  sweep = 'x',
  rEq = NOAA_STAR_CONSTANTS.R_EQ_M,
  rPol = NOAA_STAR_CONSTANTS.R_POL_M,
  hDist = NOAA_STAR_CONSTANTS.SAT_DIST_M,
} = {}) {
  const rad = Math.PI / 180;
  const lat = latDeg * rad;
  const lon = lonDeg * rad;
  const lon0 = lon0Deg * rad;
  const e2 = 1 - (rPol * rPol) / (rEq * rEq);

  const phiC = Math.atan((1 - e2) * Math.tan(lat));
  const cosPhiC = Math.cos(phiC);
  const sinPhiC = Math.sin(phiC);
  const rC = rPol / Math.sqrt(1 - e2 * cosPhiC * cosPhiC);

  const dLon = lon - lon0;
  const xp = rC * cosPhiC * Math.cos(dLon);
  const sx = hDist - xp;
  const sy = -rC * cosPhiC * Math.sin(dLon);
  const sz = rC * sinPhiC;

  if (hDist * (hDist - sx) < sy * sy + ((rEq * rEq) / (rPol * rPol)) * sz * sz) return null;

  const sNorm = Math.sqrt(sx * sx + sy * sy + sz * sz);
  if (sweep === 'x') {
    return {
      scanX: Math.asin(-sy / sNorm),
      scanY: Math.atan2(sz, sx),
    };
  }
  return {
    scanX: Math.atan2(-sy, sx),
    scanY: Math.asin(sz / sNorm),
  };
}

function geodeticToAbiScan(latDeg, lonDeg, lambda0Deg = NOAA_STAR_CONSTANTS.LONGITUDE_OF_PROJECTION_ORIGIN_DEG) {
  return geodeticToGeoScan(latDeg, lonDeg, {
    lon0Deg: lambda0Deg,
    sweep: 'x',
    rEq: NOAA_STAR_CONSTANTS.R_EQ_M,
    rPol: NOAA_STAR_CONSTANTS.R_POL_M,
    hDist: NOAA_STAR_CONSTANTS.SAT_DIST_M,
  });
}

function scanToPixel(scanX, scanY, { gridSpec = STAR_1808_SYMMETRIC_BLOCK3, calibrationOffsetPx = { x: 0, y: 0 } } = {}) {
  if (typeof gridSpec.cx === 'number' && typeof gridSpec.cy === 'number') {
    return {
      col: gridSpec.cx + scanX / gridSpec.stepRad + (calibrationOffsetPx.x || 0),
      row: gridSpec.cy - scanY / gridSpec.stepRad + (calibrationOffsetPx.y || 0),
    };
  }
  return {
    col: (scanX - gridSpec.firstPixelCenterXRad) / gridSpec.stepRad + (calibrationOffsetPx.x || 0),
    row: (gridSpec.firstPixelCenterYRad - scanY) / gridSpec.stepRad + (calibrationOffsetPx.y || 0),
  };
}

function pixelToScan(col, row, { gridSpec = STAR_1808_SYMMETRIC_BLOCK3, calibrationOffsetPx = { x: 0, y: 0 } } = {}) {
  const c = col - (calibrationOffsetPx.x || 0);
  const r = row - (calibrationOffsetPx.y || 0);
  if (typeof gridSpec.cx === 'number' && typeof gridSpec.cy === 'number') {
    return {
      scanX: (c - gridSpec.cx) * gridSpec.stepRad,
      scanY: (gridSpec.cy - r) * gridSpec.stepRad,
    };
  }
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
  const maxValidRow = footerStartRow < height ? Math.min(height - 1, footerStartRow - 2) : height - 1;
  if (col < 0 || col >= width - 1 || row < 0 || row >= maxValidRow) return null;
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
  sectorSpec = null,
  tileSize = 256,
  gridN = 32,
  outRgba = new Uint8ClampedArray(tileSize * tileSize * 4),
}) {
  const expectedW = sectorSpec ? sectorSpec.width : NOAA_STAR_DEFAULTS.EXPECTED_WIDTH;
  const expectedH = sectorSpec ? sectorSpec.height : NOAA_STAR_DEFAULTS.EXPECTED_HEIGHT;
  if (width !== expectedW || height !== expectedH) {
    throw new Error('UNEXPECTED_NOAA_DIMENSIONS');
  }
  const verts = gridN + 1;
  const colLut = new Float64Array(verts * verts);
  const rowLut = new Float64Array(verts * verts);
  const validLut = new Uint8Array(verts * verts);
  const cellPx = tileSize / gridN;
  const gridSpec = sectorSpec || STAR_1808_SYMMETRIC_BLOCK3;
  const effOffset = sectorSpec
    ? sectorSpec.applyCalOffset
      ? calOffsetPx
      : { x: 0, y: 0 }
    : calOffsetPx;
  const scanParams = sectorSpec
    ? {
        lon0Deg: sectorSpec.lon0Deg,
        sweep: sectorSpec.sweep,
        rEq: sectorSpec.rEq,
        rPol: sectorSpec.rPol,
        hDist: sectorSpec.hDist,
      }
    : {
        lon0Deg: NOAA_STAR_CONSTANTS.LONGITUDE_OF_PROJECTION_ORIGIN_DEG,
        sweep: 'x',
        rEq: NOAA_STAR_CONSTANTS.R_EQ_M,
        rPol: NOAA_STAR_CONSTANTS.R_POL_M,
        hDist: NOAA_STAR_CONSTANTS.SAT_DIST_M,
      };

  for (let gy = 0; gy < verts; gy++) {
    for (let gx = 0; gx < verts; gx++) {
      const idx = gy * verts + gx;
      const { latDeg, lonDeg } = tilePixelToLatLon(tileZ, tileX, tileY, gx * cellPx, gy * cellPx, tileSize);
      const scan = geodeticToGeoScan(latDeg, lonDeg, scanParams);
      if (!scan) continue;
      const pt = scanToPixel(scan.scanX, scan.scanY, { gridSpec, calibrationOffsetPx: effOffset });
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
        const scan = geodeticToGeoScan(latDeg, lonDeg, scanParams);
        if (!scan) continue;
        const pt = scanToPixel(scan.scanX, scan.scanY, { gridSpec, calibrationOffsetPx: effOffset });
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
  const rawSector = (qs.get('sector') || 'goes-east').toLowerCase();
  const sector = NOAA_GLOBAL_SECTORS[`${rawSector}:vis`] ? rawSector : 'goes-east';
  const layer = qs.get('fallbackLayer') || 'GOES-East_ABI_GeoColor';
  const time = qs.get('fallbackTime') || new Date(Date.now() - 10 * 60000).toISOString().slice(0, 10);
  const tms = qs.get('fallbackTms') || 'GoogleMapsCompatible_Level7';
  const ext = qs.get('fallbackExt') || 'png';
  const spectral = qs.get('spectral') || 'vis';
  const fallbackProto = (qs.get('fallbackProto') || 'gibs').toLowerCase();
  const parseOff = (key, def) => {
    const raw = qs.get(key);
    if (raw === null || raw === '') return def;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(-2, Math.min(2, n)) : def;
  };
  const originBase =
    typeof self !== 'undefined' && self.location && /^https?:/i.test(self.location.origin)
      ? self.location.origin
      : '';
  const httpsGibsUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${time}/${tms}/${tileZ}/${tileY}/${tileX}.${ext}?spectral=${encodeURIComponent(spectral)}&sector=${encodeURIComponent(sector)}`;
  const fallbackUrl =
    fallbackProto === 'eumet'
      ? `${originBase}/api/weather/satellite/eumet-tile?z=${tileZ}&x=${tileX}&y=${tileY}&layer=${encodeURIComponent(layer)}&spectral=${encodeURIComponent(spectral)}&sector=${encodeURIComponent(sector)}`
      : httpsGibsUrl;
  return {
    tileZ,
    tileX,
    tileY,
    sector,
    spectral,
    fallbackProto,
    nightIr: qs.get('nightIr') === '1',
    calOffsetPx: {
      x: parseOff('calX', NOAA_STAR_DEFAULTS.DEFAULT_OFFSET_X),
      y: parseOff('calY', NOAA_STAR_DEFAULTS.DEFAULT_OFFSET_Y),
    },
    httpsGibsUrl,
    fallbackUrl,
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
  const sectorCache = new Map();
  const globalState = {
    activeTileJobs: 0,
    jobWaiters: [],
    streamBytesByKey: new Map(),
    activeDecodeBytes: 0,
    activeStripBytes: 0,
    recentTotalMs: [],
    lastTelemetryAtMs: 0,
    telemetryFlushTimer: null,
    lastPrimaryKey: 'goes-east:vis',
  };

  const getSectorEntry = (spec) => {
    let entry = sectorCache.get(spec.key);
    if (!entry) {
      entry = {
        key: spec.key,
        spec,
        rgb: null,
        width: 0,
        height: 0,
        footerStartRow: 0,
        fetchedAtMs: 0,
        lastUsedAtMs: 0,
        lastModifiedUtc: null,
        lastModifiedMs: null,
        inFlightPromise: null,
        cooldownUntilMs: 0,
        activeReaders: 0,
        drainResolvers: [],
        gibsHintTime: null,
        gibsHintLayer: null,
        gibsHintAtMs: 0,
        fallbackActive: false,
        fallbackPendingSent: false,
      };
      sectorCache.set(spec.key, entry);
    }
    return entry;
  };

  const getTotalRgbBytes = () => {
    let sum = 0;
    for (const entry of sectorCache.values()) {
      if (entry.rgb) sum += entry.rgb.byteLength;
    }
    return sum;
  };

  const getTotalActiveReaders = () => {
    let sum = 0;
    for (const entry of sectorCache.values()) {
      sum += entry.activeReaders;
    }
    return sum;
  };

  const getActiveStreamBytes = () => {
    let sum = 0;
    for (const n of globalState.streamBytesByKey.values()) sum += n;
    return sum;
  };

  const getTrackedBytes = () =>
    getTotalRgbBytes() +
    getActiveStreamBytes() +
    globalState.activeDecodeBytes +
    globalState.activeStripBytes +
    globalState.activeTileJobs * cfg.EST_TILE_JOB_BYTES;

  const waitForSectorReadersDrain = (entry) => {
    if (entry.activeReaders === 0) return Promise.resolve();
    return new Promise((resolve) => entry.drainResolvers.push(resolve));
  };

  const releaseSectorReader = (entry) => {
    if (entry.activeReaders > 0) entry.activeReaders--;
    if (entry.activeReaders === 0 && entry.drainResolvers.length > 0) {
      const list = entry.drainResolvers.splice(0, entry.drainResolvers.length);
      for (const r of list) r();
    }
  };

  const evictIdleSectorsToFit = (neededBytes, excludeKey) => {
    if (getTrackedBytes() + neededBytes <= cfg.MAX_TRACKED_BUFFER_BYTES) return;
    const candidates = [];
    for (const entry of sectorCache.values()) {
      if (entry.key !== excludeKey && entry.rgb && entry.activeReaders === 0 && !entry.inFlightPromise) {
        candidates.push(entry);
      }
    }
    candidates.sort((a, b) => a.lastUsedAtMs - b.lastUsedAtMs);
    for (const victim of candidates) {
      if (getTrackedBytes() + neededBytes <= cfg.MAX_TRACKED_BUFFER_BYTES) break;
      victim.rgb = null;
      victim.width = 0;
      victim.height = 0;
      victim.footerStartRow = 0;
      victim.fetchedAtMs = 0;
    }
  };

  const acquireTileSlot = () => {
    if (globalState.activeTileJobs < cfg.MAX_CONCURRENT_TILE_JOBS) {
      globalState.activeTileJobs++;
      return Promise.resolve();
    }
    return new Promise((resolve) => globalState.jobWaiters.push(resolve)).then(() => {
      globalState.activeTileJobs++;
    });
  };

  const releaseTileSlot = () => {
    if (globalState.activeTileJobs > 0) globalState.activeTileJobs--;
    if (globalState.activeTileJobs < cfg.MAX_CONCURRENT_TILE_JOBS && globalState.jobWaiters.length > 0) {
      const next = globalState.jobWaiters.shift();
      next();
    }
  };

  const buildActiveSectorsSummary = (tNow) => {
    const active = [];
    for (const e of sectorCache.values()) {
      if (e.rgb && e.fetchedAtMs > 0) {
        const ageMin = e.lastModifiedMs !== null ? Math.max(0, Math.round((tNow - e.lastModifiedMs) / 60000)) : null;
        active.push({
          sector: e.spec.sector,
          satLabel: e.spec.satLabel,
          product: e.spec.product,
          cdnAgeMinutes: ageMin,
          fallbackActive: Boolean(e.fallbackActive),
          lastUsedAtMs: e.lastUsedAtMs,
        });
      }
    }
    active.sort((a, b) => b.lastUsedAtMs - a.lastUsedAtMs);
    return active.map(({ lastUsedAtMs: _ignore, ...rest }) => rest);
  };

  const buildTelemetryPayload = (mode, reason, calOffsetPx, tNow, entry) => {
    const sorted = [...globalState.recentTotalMs].sort((a, b) => a - b);
    const p50 = sorted.length > 0 ? Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(2)) : null;
    const p95 = sorted.length > 0 ? Number(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)].toFixed(2)) : null;
    const lmMs = entry && entry.lastModifiedMs !== null ? entry.lastModifiedMs : null;
    const cdnAgeMin = lmMs !== null ? Math.max(0, Math.round((tNow - lmMs) / 60000)) : null;
    return {
      mode,
      reason: reason || null,
      sector: entry ? entry.spec.sector : 'goes-east',
      satLabel: entry ? entry.spec.satLabel : 'GOES-19',
      product: entry ? entry.spec.product : 'GeoColor',
      lastModifiedUtc: entry ? entry.lastModifiedUtc : null,
      lastModifiedMs: lmMs,
      cdnAgeMinutes: cdnAgeMin,
      activeSectors: buildActiveSectorsSummary(tNow),
      calOffsetX: calOffsetPx.x,
      calOffsetY: calOffsetPx.y,
      p50Ms: p50,
      p95Ms: p95,
      sampleCount: sorted.length,
      trackedBufferMb: Number((getTrackedBytes() / (1024 * 1024)).toFixed(2)),
      updatedAtMs: tNow,
    };
  };

  const emitTelemetry = (mode, reason, calOffsetPx, force = false, entry = null) => {
    if (!telemetryPostFn) return;
    const targetEntry = entry || sectorCache.get(globalState.lastPrimaryKey) || null;
    const tNow = nowFn();
    if (globalState.telemetryFlushTimer && typeof clearTimeout !== 'undefined') {
      clearTimeout(globalState.telemetryFlushTimer);
      globalState.telemetryFlushTimer = null;
    }
    if (!force && globalState.lastTelemetryAtMs > 0 && tNow - globalState.lastTelemetryAtMs < 1000) {
      if (typeof setTimeout !== 'undefined') {
        globalState.telemetryFlushTimer = setTimeout(() => {
          globalState.telemetryFlushTimer = null;
          const flushNow = nowFn();
          globalState.lastTelemetryAtMs = flushNow;
          telemetryPostFn(buildTelemetryPayload(mode, reason, calOffsetPx, flushNow, targetEntry));
        }, 300);
        if (typeof globalState.telemetryFlushTimer.unref === 'function') globalState.telemetryFlushTimer.unref();
      }
      return;
    }
    globalState.lastTelemetryAtMs = tNow;
    telemetryPostFn(buildTelemetryPayload(mode, reason, calOffsetPx, tNow, targetEntry));
  };

  const tripCooldown = (entry, reason, calOffsetPx) => {
    entry.rgb = null;
    entry.width = 0;
    entry.height = 0;
    entry.footerStartRow = 0;
    entry.fetchedAtMs = 0;
    entry.cooldownUntilMs = nowFn() + cfg.COOLDOWN_MS;
    if (!entry.fallbackActive) {
      entry.fallbackPendingSent = true;
      emitTelemetry('gibs-fallback-pending', reason, calOffsetPx, true, entry);
    }
  };

  async function extractRgbViaStripCanvas(bitmap, expectedW, expectedH) {
    if (extractRgbStripFn) return extractRgbStripFn(bitmap, cfg);
    const w = expectedW || bitmap.width;
    const h = expectedH || bitmap.height;
    const stripH = Math.min(cfg.STRIP_HEIGHT, h);
    const stripCanvas = new OffscreenCanvasCtor(w, stripH);
    globalState.activeStripBytes = w * stripH * 4 * 2;
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
      globalState.activeStripBytes = 0;
    }
  }

  async function extractCiraQuadrantsToRgb(quadBuffers, spec) {
    const fullW = spec.width;
    const fullH = spec.height;
    const halfW = fullW >> 1;
    const halfH = fullH >> 1;
    const rgb = new Uint8Array(fullW * fullH * 3);
    const stripH = Math.min(cfg.STRIP_HEIGHT, halfH);
    const stripCanvas = OffscreenCanvasCtor && !extractRgbStripFn ? new OffscreenCanvasCtor(halfW, stripH) : null;
    const stripCtx = stripCanvas ? stripCanvas.getContext('2d') : null;
    if (!extractRgbStripFn && !stripCtx) {
      throw new Error('OFFSCREEN_CONTEXT_UNAVAILABLE');
    }
    globalState.activeStripBytes = extractRgbStripFn ? 0 : halfW * stripH * 4 * 2;

    try {
      for (let q = 0; q < 4; q++) {
        const qRowOffset = (q >> 1) * halfH;
        const qColOffset = (q & 1) * halfW;
        let qBytes = quadBuffers[q];
        quadBuffers[q] = null;
        let decodeTarget = BlobCtor ? new BlobCtor([qBytes], { type: 'image/png' }) : qBytes;
        qBytes = null;
        let bmp = null;
        try {
          globalState.activeDecodeBytes = halfW * halfH * 4;
          bmp = await createImageBitmapFn(decodeTarget);
          decodeTarget = null;
          if (bmp.width !== halfW || bmp.height !== halfH) {
            throw new Error('UNEXPECTED_NOAA_DIMENSIONS');
          }
          if (extractRgbStripFn) {
            const subRgb = await extractRgbStripFn(bmp, cfg);
            for (let y = 0; y < halfH; y++) {
              const srcOff = y * halfW * 3;
              const dstOff = ((qRowOffset + y) * fullW + qColOffset) * 3;
              rgb.set(subRgb.subarray(srcOff, srcOff + halfW * 3), dstOff);
            }
          } else {
            for (let y = 0; y < halfH; y += stripH) {
              const curH = Math.min(stripH, halfH - y);
              stripCtx.clearRect(0, 0, halfW, curH);
              stripCtx.drawImage(bmp, 0, y, halfW, curH, 0, 0, halfW, curH);
              const stripData = stripCtx.getImageData(0, 0, halfW, curH).data;
              for (let r = 0; r < curH; r++) {
                const srcRow = r * halfW;
                const dstBase = ((qRowOffset + y + r) * fullW + qColOffset) * 3;
                for (let c = 0; c < halfW; c++) {
                  const s = (srcRow + c) << 2;
                  const d = dstBase + c * 3;
                  rgb[d] = stripData[s];
                  rgb[d + 1] = stripData[s + 1];
                  rgb[d + 2] = stripData[s + 2];
                }
              }
            }
          }
        } finally {
          if (bmp && typeof bmp.close === 'function') {
            try { bmp.close(); } catch {}
          }
          globalState.activeDecodeBytes = 0;
        }
      }
      return rgb;
    } finally {
      if (stripCanvas) {
        stripCanvas.width = 0;
        stripCanvas.height = 0;
      }
      globalState.activeStripBytes = 0;
    }
  }

  let activeCiraFetches = 0;
  const ciraWaiters = [];
  const MAX_CONCURRENT_CIRA_FETCHES = 3;

  const acquireCiraSlot = () => {
    if (activeCiraFetches < MAX_CONCURRENT_CIRA_FETCHES) {
      activeCiraFetches++;
      return Promise.resolve();
    }
    return new Promise((resolve) => ciraWaiters.push(resolve)).then(() => {
      activeCiraFetches++;
    });
  };

  const releaseCiraSlot = () => {
    if (activeCiraFetches > 0) activeCiraFetches--;
    if (activeCiraFetches < MAX_CONCURRENT_CIRA_FETCHES && ciraWaiters.length > 0) {
      const next = ciraWaiters.shift();
      next();
    }
  };

  let activeDecodes = 0;
  const decodeWaiters = [];
  const acquireDecodeSlot = () => {
    if (activeDecodes < 1) {
      activeDecodes++;
      return Promise.resolve();
    }
    return new Promise((resolve) => decodeWaiters.push(resolve)).then(() => {
      activeDecodes++;
    });
  };

  const releaseDecodeSlot = () => {
    if (activeDecodes > 0) activeDecodes--;
    if (activeDecodes < 1 && decodeWaiters.length > 0) {
      const next = decodeWaiters.shift();
      next();
    }
  };

  async function ensureFreshSource(calOffsetPx, specOrKey = 'goes-east:vis') {
    const spec =
      typeof specOrKey === 'string'
        ? NOAA_GLOBAL_SECTORS[specOrKey] || NOAA_GLOBAL_SECTORS['goes-east:vis']
        : specOrKey;
    const entry = getSectorEntry(spec);
    const tNow = nowFn();
    if (tNow < entry.cooldownUntilMs) {
      throw new Error('NOAA_COOLDOWN_ACTIVE');
    }
    if (entry.rgb && tNow - entry.fetchedAtMs < cfg.SOURCE_CACHE_TTL_MS) {
      entry.lastUsedAtMs = tNow;
      return entry;
    }
    if (entry.inFlightPromise) {
      return entry.inFlightPromise;
    }

    entry.fallbackActive = false;
    entry.fallbackPendingSent = false;

    entry.inFlightPromise = (async () => {
      const noaaController = new AbortController();
      let timeoutId =
        spec.sourceKind === 'cira-z1'
          ? null
          : setTimeout(() => noaaController.abort('noaa-timeout'), cfg.NOAA_FETCH_TIMEOUT_MS);
      let bitmap = null;
      let bytes = null;
      let quadBuffers = null;
      try {
        if (spec.sourceKind === 'cira-z1') {
          const originBase =
            typeof self !== 'undefined' && self.location && /^https?:/i.test(self.location.origin)
              ? self.location.origin
              : '';
          const ciraBase = cfg.CIRA_BASE_URL || `${originBase}${cfg.CIRA_PROXY_PATH}`;
          let parsedLmMs = NaN;
          await acquireCiraSlot();
          timeoutId = setTimeout(
            () => noaaController.abort('noaa-timeout'),
            Math.max(cfg.NOAA_FETCH_TIMEOUT_MS, 20000)
          );
          try {
            const metaUrl = `${ciraBase}?action=meta&sat=${encodeURIComponent(spec.ciraSat)}&product=${encodeURIComponent(spec.ciraProduct)}`;
            const metaRes = await fetchFn(metaUrl, { signal: noaaController.signal });
            if (!metaRes.ok) throw new Error('CIRA_META_HTTP_' + metaRes.status);
            const metaJson = await metaRes.json();
            const candidateTsList = [];
            if (Array.isArray(metaJson?.timestamps)) {
              for (const t of metaJson.timestamps) {
                if (typeof t === 'string' && /^\d{14}$/.test(t) && !candidateTsList.includes(t)) {
                  candidateTsList.push(t);
                }
              }
            }
            const latestTs = metaJson && typeof metaJson.latestTs === 'string' ? metaJson.latestTs : '';
            if (/^\d{14}$/.test(latestTs) && !candidateTsList.includes(latestTs)) {
              candidateTsList.unshift(latestTs);
            }
            if (candidateTsList.length === 0) throw new Error('CIRA_META_INVALID_TS');

            const isLoopbackCira = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(ciraBase);
            const fetchQuadsForTs = async (tsVal) => {
              const qStream = [0, 0, 0, 0];
              const rcList = ['000_000', '000_001', '001_000', '001_001'];
              const fetchOneQuad = async (rc, qIdx) => {
                const tUrl = `${ciraBase}?action=tile&sat=${encodeURIComponent(spec.ciraSat)}&product=${encodeURIComponent(spec.ciraProduct)}&ts=${tsVal}&rc=${rc}`;
                const tRes = await fetchFn(tUrl, { signal: noaaController.signal });
                if (!tRes.ok) throw new Error('CIRA_TILE_HTTP_' + tRes.status);
                return await readResponseBytesBounded(tRes, cfg.MAX_CIRA_TILE_BYTES, (n) => {
                  qStream[qIdx] = n;
                  globalState.streamBytesByKey.set(spec.key, qStream[0] + qStream[1] + qStream[2] + qStream[3]);
                });
              };
              if (!isLoopbackCira) {
                return await Promise.all(rcList.map((rc, qIdx) => fetchOneQuad(rc, qIdx)));
              }
              const topRow = await Promise.all([fetchOneQuad(rcList[0], 0), fetchOneQuad(rcList[1], 1)]);
              const botRow = await Promise.all([fetchOneQuad(rcList[2], 2), fetchOneQuad(rcList[3], 3)]);
              return [topRow[0], topRow[1], botRow[0], botRow[1]];
            };

            let chosenTs = candidateTsList[0];
            try {
              quadBuffers = await fetchQuadsForTs(chosenTs);
            } catch (firstTsErr) {
              if (candidateTsList.length > 1 && !(noaaController.signal && noaaController.signal.aborted)) {
                chosenTs = candidateTsList[1];
                quadBuffers = await fetchQuadsForTs(chosenTs);
              } else {
                throw firstTsErr;
              }
            }
            const chosenIso = `${chosenTs.slice(0, 4)}-${chosenTs.slice(4, 6)}-${chosenTs.slice(6, 8)}T${chosenTs.slice(8, 10)}:${chosenTs.slice(10, 12)}:${chosenTs.slice(12, 14)}Z`;
            const obsIso = chosenTs === latestTs ? (metaJson.observedIso || chosenIso) : chosenIso;
            parsedLmMs = obsIso ? Date.parse(obsIso) : NaN;
          } finally {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            releaseCiraSlot();
          }
          globalState.streamBytesByKey.set(
            spec.key,
            quadBuffers.reduce((acc, b) => acc + b.byteLength, 0)
          );

          await acquireDecodeSlot();
          try {
            const halfW = spec.width >> 1;
            const halfH = spec.height >> 1;
            const expectedDecodeBytes = halfW * halfH * 4;
            const expectedStripBytes = halfW * Math.min(cfg.STRIP_HEIGHT, halfH) * 4 * 2;
            const expectedRgbBytes = spec.width * spec.height * 3;
            await waitForSectorReadersDrain(entry);
            entry.rgb = null;
            entry.width = 0;
            entry.height = 0;

            const neededPeak = expectedDecodeBytes + expectedStripBytes + expectedRgbBytes;
            evictIdleSectorsToFit(neededPeak, entry.key);

            const projectedPeak = getTrackedBytes() + neededPeak;
            const heapUsed = getHeapUsedBytesFn();
            if (projectedPeak > cfg.MAX_TRACKED_BUFFER_BYTES || (heapUsed !== null && heapUsed > cfg.MAX_TRACKED_BUFFER_BYTES * 4)) {
              throw new Error('NOAA_TRACKED_BUDGET_EXCEEDED');
            }

            globalState.streamBytesByKey.delete(spec.key);
            const rgb = await extractCiraQuadrantsToRgb(quadBuffers, spec);
            quadBuffers = null;

            if (getTrackedBytes() + rgb.byteLength > cfg.MAX_TRACKED_BUFFER_BYTES) {
              throw new Error('NOAA_TRACKED_BUDGET_EXCEEDED');
            }

            const readyAtMs = nowFn();
            entry.rgb = rgb;
            entry.width = spec.width;
            entry.height = spec.height;
            entry.footerStartRow = spec.height;
            entry.fetchedAtMs = readyAtMs;
            entry.lastUsedAtMs = readyAtMs;
            entry.lastModifiedUtc = Number.isFinite(parsedLmMs) ? new Date(parsedLmMs).toISOString() : null;
            entry.lastModifiedMs = Number.isFinite(parsedLmMs) ? parsedLmMs : null;
            return entry;
          } finally {
            releaseDecodeSlot();
          }
        }

        const effectiveUrl =
          spec.key === 'goes-east:vis' && sourceUrl !== NOAA_STAR_DEFAULTS.SOURCE_URL
            ? sourceUrl
            : spec.sourceUrl;
        const res = await fetchFn(effectiveUrl, { signal: noaaController.signal });
        if (!res.ok) throw new Error('NOAA_HTTP_' + res.status);

        const lmHeader = res.headers && typeof res.headers.get === 'function' ? res.headers.get('last-modified') : null;
        const parsedLmMs = lmHeader ? Date.parse(lmHeader) : NaN;

        bytes = await readResponseBytesBounded(res, cfg.MAX_NOAA_RESPONSE_BYTES, (n) => {
          globalState.streamBytesByKey.set(spec.key, n);
        });
        clearTimeout(timeoutId);
        globalState.streamBytesByKey.set(spec.key, bytes.byteLength);

        await acquireDecodeSlot();
        try {
          const expectedDecodeBytes = spec.width * spec.height * 4;
          const expectedStripBytes = spec.width * cfg.STRIP_HEIGHT * 4 * 2;
          const expectedRgbBytes = spec.width * spec.height * 3;
          await waitForSectorReadersDrain(entry);
          entry.rgb = null;
          entry.width = 0;
          entry.height = 0;

          const neededPeak = expectedDecodeBytes + expectedStripBytes + expectedRgbBytes;
          evictIdleSectorsToFit(neededPeak, entry.key);

          const projectedPeak = getTrackedBytes() + neededPeak;
          const heapUsed = getHeapUsedBytesFn();
          if (projectedPeak > cfg.MAX_TRACKED_BUFFER_BYTES || (heapUsed !== null && heapUsed > cfg.MAX_TRACKED_BUFFER_BYTES * 4)) {
            throw new Error('NOAA_TRACKED_BUDGET_EXCEEDED');
          }

          let decodeTarget = BlobCtor ? new BlobCtor([bytes], { type: 'image/jpeg' }) : bytes;
          bytes = null;
          globalState.streamBytesByKey.delete(spec.key);

          globalState.activeDecodeBytes = expectedDecodeBytes;
          bitmap = await createImageBitmapFn(decodeTarget);
          decodeTarget = null;
          if (bitmap.width !== spec.width || bitmap.height !== spec.height) {
            throw new Error('UNEXPECTED_NOAA_DIMENSIONS');
          }

          const rgb = await extractRgbViaStripCanvas(bitmap, spec.width, spec.height);
          bitmap.close();
          bitmap = null;
          globalState.activeDecodeBytes = 0;

          if (getTrackedBytes() + rgb.byteLength > cfg.MAX_TRACKED_BUFFER_BYTES) {
            throw new Error('NOAA_TRACKED_BUDGET_EXCEEDED');
          }

          const readyAtMs = nowFn();
          entry.rgb = rgb;
          entry.width = spec.width;
          entry.height = spec.height;
          entry.footerStartRow = spec.detectFooter ? detectFooterStartRowRgb(rgb, spec.width, spec.height) : spec.height;
          entry.fetchedAtMs = readyAtMs;
          entry.lastUsedAtMs = readyAtMs;
          entry.lastModifiedUtc = Number.isFinite(parsedLmMs) ? new Date(parsedLmMs).toISOString() : null;
          entry.lastModifiedMs = Number.isFinite(parsedLmMs) ? parsedLmMs : null;
          return entry;
        } finally {
          releaseDecodeSlot();
        }
      } catch (err) {
        if (bitmap && typeof bitmap.close === 'function') {
          try { bitmap.close(); } catch {}
        }
        bytes = null;
        quadBuffers = null;
        globalState.streamBytesByKey.delete(spec.key);
        globalState.activeDecodeBytes = 0;
        globalState.activeStripBytes = 0;
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
        tripCooldown(entry, msg, calOffsetPx);
        throw new Error(msg);
      } finally {
        clearTimeout(timeoutId);
        entry.inFlightPromise = null;
      }
    })();

    return entry.inFlightPromise;
  }

  async function renderGibsFallbackTile(req, mapAbortSignal, reason, entry) {
    if (mapAbortSignal && mapAbortSignal.aborted) {
      throw makeAbortError();
    }
    if (!entry.fallbackActive && !entry.fallbackPendingSent) {
      entry.fallbackPendingSent = true;
      emitTelemetry('gibs-fallback-pending', reason, req.calOffsetPx, true, entry);
    }
    const markFallbackActive = () => {
      entry.fallbackActive = true;
      entry.fallbackPendingSent = false;
      emitTelemetry('gibs-fallback', reason, req.calOffsetPx, true, entry);
    };
    const gibsController = new AbortController();
    const timeoutId = setTimeout(() => gibsController.abort('gibs-timeout'), cfg.GIBS_FETCH_TIMEOUT_MS);
    const onMapAbort = () => gibsController.abort('map-abort');
    if (mapAbortSignal) mapAbortSignal.addEventListener('abort', onMapAbort, { once: true });

    try {
      let res;
      let resolvedUrl;
      if (req.fallbackProto === 'eumet') {
        resolvedUrl = req.fallbackUrl;
        res = await fetchFn(resolvedUrl, { signal: gibsController.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      } else {
        const hintFresh = entry.gibsHintTime && nowFn() - entry.gibsHintAtMs < 60000;
        const hintedUrl =
          hintFresh && entry.gibsHintLayer && req.httpsGibsUrl.includes(`/${entry.gibsHintLayer}/default/`)
            ? req.httpsGibsUrl.replace(/(\/default\/)([^/]+)(\/)/, `$1${entry.gibsHintTime}$3`)
            : req.httpsGibsUrl;
        let resObj;
        try {
          resObj = await fetchDirectHttpsGibsTile(hintedUrl, gibsController.signal, fetchFn);
        } catch (hintErr) {
          if (hintedUrl !== req.httpsGibsUrl && !(gibsController.signal && gibsController.signal.aborted)) {
            entry.gibsHintTime = null;
            resObj = await fetchDirectHttpsGibsTile(req.httpsGibsUrl, gibsController.signal, fetchFn);
          } else {
            throw hintErr;
          }
        }
        res = resObj.res;
        resolvedUrl = resObj.resolvedUrl;
        const resolvedMatch = resolvedUrl.match(/\/best\/([^/]+)\/default\/([^/]+)\//);
        if (resolvedMatch) {
          entry.gibsHintLayer = resolvedMatch[1];
          entry.gibsHintTime = resolvedMatch[2];
          entry.gibsHintAtMs = nowFn();
        }
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
      if (!(mapAbortSignal && mapAbortSignal.aborted) && !entry.fallbackActive) {
        emitTelemetry('gibs-fallback-failed', reason, req.calOffsetPx, true, entry);
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
    const specVis = getGlobalSectorSpec(req.sector, req.spectral);
    const useNightIrBlend =
      req.nightIr &&
      req.spectral === 'vis' &&
      sourceUrl === NOAA_STAR_DEFAULTS.SOURCE_URL;

    let wantVis = true;
    let wantIr = false;
    let solarForTile = null;
    if (useNightIrBlend) {
      solarForTile = computeSolarPositionRad(nowFn());
      const rad = Math.PI / 180;
      let minCosZ = 1.0;
      let maxCosZ = -1.0;
      for (const py of [0, 256]) {
        for (const px of [0, 256]) {
          const { latDeg, lonDeg } = tilePixelToLatLon(req.tileZ, req.tileX, req.tileY, px, py, 256);
          const cosZ =
            Math.sin(latDeg * rad) * solarForTile.sinSol +
            Math.cos(latDeg * rad) * solarForTile.cosSol * Math.cos(lonDeg * rad - solarForTile.solLngRad);
          if (cosZ < minCosZ) minCosZ = cosZ;
          if (cosZ > maxCosZ) maxCosZ = cosZ;
        }
      }
      if (maxCosZ <= 0.0) {
        wantVis = false;
        wantIr = true;
      } else if (minCosZ < 0.16) {
        wantVis = true;
        wantIr = true;
      }
    }

    const specIr = wantIr ? getGlobalSectorSpec(req.sector, 'blue') : null;
    const primarySpec = wantVis ? specVis : specIr;
    const entry = getSectorEntry(primarySpec);
    globalState.lastPrimaryKey = primarySpec.key;
    const tStart = perfNowFn();

    if (nowFn() < entry.cooldownUntilMs) {
      return renderGibsFallbackTile(req, mapSignal, 'NOAA_COOLDOWN_ACTIVE', entry);
    }

    const fetchWithAbort = async (targetSpec, targetEntry) => {
      if (nowFn() < targetEntry.cooldownUntilMs) {
        throw new Error('NOAA_COOLDOWN_ACTIVE');
      }
      const waitSource = ensureFreshSource(req.calOffsetPx, targetSpec);
      const ready = mapSignal
        ? await Promise.race([
            waitSource,
            new Promise((_, reject) => {
              if (mapSignal.aborted) reject(makeAbortError());
              else mapSignal.addEventListener('abort', () => reject(makeAbortError()), { once: true });
            }),
          ])
        : await waitSource;
      if (!ready || !ready.rgb) throw new Error('NOAA_BUFFER_UNAVAILABLE');
      return ready;
    };

    let visReady = null;
    let irReady = null;
    const entryIr = specIr ? getSectorEntry(specIr) : null;
    try {
      if (wantVis && wantIr && specIr && entryIr) {
        const [vRes, irRes] = await Promise.allSettled([
          fetchWithAbort(specVis, getSectorEntry(specVis)),
          fetchWithAbort(specIr, entryIr),
        ]);
        if (mapSignal && mapSignal.aborted) throw makeAbortError();
        if (vRes.status === 'fulfilled') visReady = vRes.value;
        if (irRes.status === 'fulfilled') irReady = irRes.value;
        if (!visReady && !irReady) {
          const err = vRes.status === 'rejected' ? vRes.reason : new Error('NOAA_UNAVAILABLE');
          throw err;
        }
      } else if (wantVis) {
        visReady = await fetchWithAbort(specVis, entry);
      } else if (specIr && entryIr) {
        irReady = await fetchWithAbort(specIr, entryIr);
      }
    } catch (err) {
      if (mapSignal && mapSignal.aborted) throw err;
      return renderGibsFallbackTile(req, mapSignal, err && err.message ? err.message : 'NOAA_UNAVAILABLE', entry);
    }

    if (getTrackedBytes() + cfg.EST_TILE_JOB_BYTES > cfg.MAX_TRACKED_BUFFER_BYTES) {
      evictIdleSectorsToFit(cfg.EST_TILE_JOB_BYTES, primarySpec.key);
      if (getTrackedBytes() + cfg.EST_TILE_JOB_BYTES > cfg.MAX_TRACKED_BUFFER_BYTES) {
        tripCooldown(entry, 'NOAA_TRACKED_BUDGET_EXCEEDED', req.calOffsetPx);
        return renderGibsFallbackTile(req, mapSignal, 'NOAA_TRACKED_BUDGET_EXCEEDED', entry);
      }
    }

    await acquireTileSlot();
    try {
      if (mapSignal && mapSignal.aborted) throw makeAbortError();
      const visEntry = wantVis ? getSectorEntry(specVis) : null;
      const reprojectAndProcess = (targetSpec, targetEntry, processSpectral) => {
        if (!targetEntry || !targetEntry.rgb) return null;
        const buf = new Uint8ClampedArray(256 * 256 * 4);
        targetEntry.activeReaders++;
        targetEntry.lastUsedAtMs = nowFn();
        try {
          reprojectNoaaStarRgbLut32({
            rgb: targetEntry.rgb,
            width: targetEntry.width,
            height: targetEntry.height,
            footerStartRow: targetEntry.footerStartRow,
            tileZ: req.tileZ,
            tileX: req.tileX,
            tileY: req.tileY,
            calOffsetPx: req.calOffsetPx,
            sectorSpec: targetSpec,
            outRgba: buf,
          });
        } finally {
          releaseSectorReader(targetEntry);
        }
        const obsMs = targetEntry.lastModifiedMs !== null ? targetEntry.lastModifiedMs : nowFn();
        const liveProcessUrl = `https://live.mooearth.internal/tile/${req.tileZ}/${req.tileX}/${req.tileY}.png?sector=${encodeURIComponent(targetSpec.sector)}&spectral=${encodeURIComponent(processSpectral)}&product=${encodeURIComponent(targetSpec.product)}&t=${obsMs}`;
        if (processTilePixelsFn) {
          processTilePixelsFn(buf, 256, 256, liveProcessUrl);
        }
        return buf;
      };

      const visBuf = visReady ? reprojectAndProcess(specVis, visEntry, req.spectral) : null;
      const irBuf = irReady ? reprojectAndProcess(specIr, entryIr, 'blue') : null;
      if (!visBuf && !irBuf) {
        return await renderGibsFallbackTile(req, mapSignal, 'NOAA_BUFFER_EVICTED', entry);
      }

      let outRgba;
      let telemetryEntry = entry;
      if (visBuf && irBuf && solarForTile) {
        outRgba = new Uint8ClampedArray(256 * 256 * 4);
        const rad = Math.PI / 180;
        const colCosH = new Float32Array(256);
        for (let c = 0; c < 256; c++) {
          colCosH[c] = Math.cos(tileToLng(req.tileX + (c + 0.5) / 256, req.tileZ) * rad - solarForTile.solLngRad);
        }
        for (let y = 0; y < 256; y++) {
          const latRad = tileToLat(req.tileY + (y + 0.5) / 256, req.tileZ) * rad;
          const sLat = Math.sin(latRad);
          const cLat = Math.cos(latRad);
          for (let x = 0; x < 256; x++) {
            const p = (y * 256 + x) * 4;
            const cosZ = sLat * solarForTile.sinSol + cLat * solarForTile.cosSol * colCosH[x];
            const dayW = cosZ <= 0.0 ? 0.0 : cosZ >= 0.16 ? 1.0 : cosZ / 0.16;
            const aV = visBuf[p + 3] * dayW;
            const aI = irBuf[p + 3] * (1.0 - dayW);
            const aSum = aV + aI;
            if (aSum <= 2) continue;
            outRgba[p] = Math.min(255, Math.round((visBuf[p] * aV + irBuf[p] * aI) / aSum));
            outRgba[p + 1] = Math.min(255, Math.round((visBuf[p + 1] * aV + irBuf[p + 1] * aI) / aSum));
            outRgba[p + 2] = Math.min(255, Math.round((visBuf[p + 2] * aV + irBuf[p + 2] * aI) / aSum));
            outRgba[p + 3] = Math.min(255, Math.round(aSum));
          }
        }
      } else {
        outRgba = visBuf || irBuf;
        telemetryEntry = irBuf && !visBuf && entryIr ? entryIr : entry;
      }

      const totalMs = perfNowFn() - tStart;
      globalState.recentTotalMs.push(totalMs);
      if (globalState.recentTotalMs.length > 64) globalState.recentTotalMs.shift();
      telemetryEntry.fallbackActive = false;
      telemetryEntry.fallbackPendingSent = false;
      emitTelemetry('noaa-star', null, req.calOffsetPx, false, telemetryEntry);

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
    getState: () => {
      const primary =
        sectorCache.get(globalState.lastPrimaryKey) ||
        sectorCache.values().next().value ||
        null;
      const sectors = {};
      for (const [k, e] of sectorCache.entries()) {
        sectors[k] = {
          width: e.width,
          height: e.height,
          hasRgb: Boolean(e.rgb),
          activeReaders: e.activeReaders,
          cooldownUntilMs: e.cooldownUntilMs,
        };
      }
      return {
        width: primary ? primary.width : 0,
        height: primary ? primary.height : 0,
        hasRgb: Boolean(primary && primary.rgb),
        activeNoaaReaders: getTotalActiveReaders(),
        activeTileJobs: globalState.activeTileJobs,
        cooldownUntilMs: primary ? primary.cooldownUntilMs : 0,
        trackedBufferBytes: getTrackedBytes(),
        sectors,
      };
    },
  };
}

// Circular partition of unity across all 360 degrees (Himawari, GOES-West, GOES-East, Meteosat)
function getSectorSpatialWeight(url, lng, lat) {
    const absLat = Math.abs(lat);
    const sector = extractSectorFromUrl(url);

    // Polar Underlay: strictly 0.0 below 58°, smooth ramp 58°-65°, 1.0 above 65° up to 85°
    if (sector === 'global-polar') {
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

    const isHimawari = sector === 'himawari';
    const isIodc = sector === 'eumet-iodc';
    const isMeteosatPrime = sector === 'europe-africa';
    const isGoesEast = sector === 'goes-east';
    const isGoesWest = sector === 'goes-west';

    // 5-Sentinel Exact Mathematical Partition of Unity (sum == 1.000 everywhere):
    if (isIodc) {
      satLng = 45.5;
      if (angle >= 25.0 && angle <= 45.0) {
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 25.0) / 20.0)));
      } else if (angle > 45.0 && angle <= 75.0) {
        lngWeight = 1.0;
      } else if (angle > 75.0 && angle <= 95.0) {
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 75.0) / 20.0)));
      }
    } else if (isHimawari) {
      satLng = 140.7;
      if (angle >= 75.0 && angle <= 95.0) {
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 75.0) / 20.0)));
      } else if (angle > 95.0 && angle <= 165.0) {
        lngWeight = 1.0;
      } else if (angle > 165.0 && angle <= 195.0) {
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
      }
    } else if (isGoesWest) {
      satLng = 223.0; // -137.0° GOES-18
      if (angle >= 165.0 && angle <= 195.0) {
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
      } else if (angle > 195.0 && angle <= 225.0) {
        lngWeight = 1.0;
      } else if (angle > 225.0 && angle <= 265.0) {
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
      }
    } else if (isGoesEast) {
      satLng = 285.0; // -75.0° GOES-19
      if (angle >= 225.0 && angle <= 265.0) {
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
      } else if (angle > 265.0 && angle <= 320.0) {
        lngWeight = 1.0;
      } else if (angle > 320.0 && angle <= 345.0) {
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
      }
    } else if (isMeteosatPrime) {
      satLng = 0.0;
      if (angle >= 320.0 && angle <= 345.0) {
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
      } else if (angle > 345.0 || angle <= 25.0) {
        lngWeight = 1.0;
      } else if (angle > 25.0 && angle <= 45.0) {
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 25.0) / 20.0)));
      }
    } else {
      lngWeight = 1.0;
    }

    let limbWeight = 1.0;
    if (isHimawari || isIodc || isMeteosatPrime || isGoesEast || isGoesWest) {
      const dLng = Math.abs((((lng - satLng + 540) % 360) - 180)) * (Math.PI / 180);
      const dLat = (lat * Math.PI) / 180;
      const cosPsi = Math.cos(dLat) * Math.cos(dLng);
      if (cosPsi <= 0.1564) {
        limbWeight = 0.0;
      } else if (cosPsi < 0.2756) {
        const t = (cosPsi - 0.1564) / (0.2756 - 0.1564);
        limbWeight = 0.5 * (1.0 - Math.cos(Math.PI * t));
      }
    }

    return Math.max(0.0, Math.min(1.0, lngWeight * latWeight * limbWeight));
  }

  // Zero-step-jump normalized cloud opacity curve (returns strictly 0 at norm<=0)
  function smoothCloudCurve(norm, mid = 0.28, slope = 5.5) {
    if (norm <= 0.0) return 0.0;
    if (norm >= 1.0) return 1.0;
    const s0 = 1.0 / (1.0 + Math.exp(slope * mid));
    const s1 = 1.0 / (1.0 + Math.exp(-slope * (1.0 - mid)));
    const s = 1.0 / (1.0 + Math.exp(-slope * (norm - mid)));
    const scaled = (s - s0) / (s1 - s0);
    const feather = norm < 0.14 ? norm / 0.14 : 1.0;
    return Math.max(0.0, Math.min(1.0, scaled * feather));
  }

  // Continuous C0 cloud-whiteness extractor for daytime GeoColor (avoids step-edge rings over ocean/land)
  function computeGeoColorDayCloud(r, g, b, minC, maxC) {
    const sat = maxC - minC;
    const warmExcess = r > b ? r - b : 0;
    const dayWhiteness = minC - 0.80 * sat - 0.60 * warmExcess;
    if (dayWhiteness <= 70.0) return 0.0;
    const dNorm = Math.min(1.0, (dayWhiteness - 70.0) / 138.0);
    return smoothCloudCurve(dNorm, 0.24, 5.5);
  }

  // Physical Elevation & Latitude Lapse-Rate Thermal Ground Discriminator
  // Rejects nocturnal freezing ground (Central India ~92, Arabia ~88) & high elevation Tibet > 3500m
  function getLocalThermalThreshold(lng, lat, isBand09OrEumet) {
    let thresh = isBand09OrEumet ? 96 : 98;
    const absLat = Math.abs(lat);

    if (lat >= 26.0 && lat <= 39.0 && lng >= 74.0 && lng <= 104.0) {
      const edgeX = Math.min(lng - 74.0, 104.0 - lng) / 4.0;
      const edgeY = Math.min(lat - 26.0, 39.0 - lat) / 3.0;
      const coreFactor = Math.max(0.0, Math.min(1.0, Math.min(edgeX, edgeY)));
      thresh += 102 * coreFactor;
    } else if (lat > 39.0 && lat <= 55.0 && lng >= 70.0 && lng <= 125.0) {
      const edgeX = Math.min(lng - 70.0, 125.0 - lng) / 8.0;
      const edgeY = Math.min(lat - 39.0, 55.0 - lat) / 4.0;
      const coreFactor = Math.max(0.0, Math.min(1.0, Math.min(edgeX, edgeY)));
      thresh += 88 * coreFactor;
    } else if (absLat > 55.0 && absLat <= 65.0) {
      const polarFactor = (absLat - 55.0) / 10.0;
      thresh += 50 * polarFactor;
    }
    return thresh;
  }

  // Unified Tile Pixel Processor (shared across noaa-star live 5-satellite feeds, gibs-alpha, & eumet-alpha)
  function processTilePixels(d, width, height, realUrl) {
    const len = d.length;
    const totalPixels = width * height;

    const coords = parseTileCoordsFromUrl(realUrl);
    const hasCoords = Boolean(coords && Number.isFinite(coords.tileZ));
    const tileZ = coords ? coords.tileZ : 3;
    const tileX = coords ? coords.tileX : 0;
    const tileY = coords ? coords.tileY : 0;

    const tileLngs = new Float32Array(width);
    const tileLats = new Float32Array(height);
    const rowSinLat = new Float32Array(height);
    const rowCosLat = new Float32Array(height);
    const colCosHour = new Float32Array(width);

    const tMatch = realUrl.match(/[?&]t=(\d+)/);
    const obsTimeMs = tMatch ? parseInt(tMatch[1], 10) : Date.now();
    const solar = computeSolarPositionRad(obsTimeMs);
    const rad = Math.PI / 180;

    if (hasCoords) {
      for (let c = 0; c < width; c++) {
        const lngDeg = tileToLng(tileX + (c + 0.5) / width, tileZ);
        tileLngs[c] = lngDeg;
        colCosHour[c] = Math.cos(lngDeg * rad - solar.solLngRad);
      }
      for (let r = 0; r < height; r++) {
        const latDeg = tileToLat(tileY + (r + 0.5) / height, tileZ);
        tileLats[r] = latDeg;
        rowSinLat[r] = Math.sin(latDeg * rad);
        rowCosLat[r] = Math.cos(latDeg * rad);
      }
    }

    const sector = extractSectorFromUrl(realUrl);
    const isVisMode = realUrl.includes('spectral=vis');
    const isInfraMode = realUrl.includes('spectral=infra');
    const isBlueMode = realUrl.includes('spectral=blue') || (!isVisMode && !isInfraMode);
    const isGeoColor = /product=geocolor|GeoColor/i.test(realUrl);
    const isBand09 = !isGeoColor && /Band09|band_09|ir108|msg_|eumet/i.test(realUrl);
    const isInfraLayer = !isGeoColor && (/Band13|band_13|Infrared|\bIR\b/i.test(realUrl) || isBand09);
    const isHimawariVis = !isGeoColor && !isInfraLayer && /Band3|Himawari_AHI_Band3/i.test(realUrl);
    const isEumetVis = !isGeoColor && !isInfraLayer && (sector === 'eumet-iodc' || sector === 'europe-africa');

    const lum = new Float32Array(totalPixels);
    const convective = new Uint8Array(totalPixels);
    const isHimawari = sector === 'himawari';
    const isGoes = sector === 'goes-east' || sector === 'goes-west';

    for (let p = 0, idx = 0; idx < len; idx += 4, p++) {
      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      if (r < 20 && g < 20 && b < 20) {
        lum[p] = 0;
      } else {
        lum[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      if (isInfraLayer) {
        if (isHimawari) {
          if (lum[p] >= 180) convective[p] = 1;
          else if (lum[p] >= 162) convective[p] = 2;
        } else if (isGoes) {
          if (lum[p] >= 170) convective[p] = 1;
          else if (lum[p] >= 152) convective[p] = 2;
        } else if (isBand09) {
          if (b > 190 && r < 25 && g < 25) {
            lum[p] = 0;
          } else if (lum[p] >= 196) convective[p] = 1;
          else if (lum[p] >= 182) convective[p] = 2;
        }
      }
    }

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
            convective[p] = 3;
          }
        }
      }
    }

    for (let y = 0; y < height; y++) {
      const row = y * width;
      const sinLat = hasCoords ? rowSinLat[y] : 0;
      const cosLat = hasCoords ? rowCosLat[y] : 1;
      for (let x = 0; x < width; x++) {
        const p = row + x;
        const i = p * 4;
        if (d[i + 3] === 0) continue;

        const r = d[i], g = d[i + 1], b = d[i + 2];
        const maxC = r > g ? (r > b ? r : b) : (g > b ? g : b);
        const minC = r < g ? (r < b ? r : b) : (g < b ? g : b);
        const isConv = convective[p] === 1 || convective[p] === 3;

        if (maxC < 26 && !isConv) {
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
          if (isInfraMode) {
            if (baseRadiance >= 218) {
              d[i] = 255; d[i + 1] = 242; d[i + 2] = 255;
            } else if (convective[p] === 3 || baseRadiance >= 200) {
              d[i] = 220; d[i + 1] = 38; d[i + 2] = 38;
            } else if (baseRadiance >= 184) {
              d[i] = 245; d[i + 1] = 158; d[i + 2] = 11;
            } else {
              d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
            }
            d[i + 3] = Math.min(252, Math.round(248 * spatWeight));
          } else {
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

        if (isGeoColor && (isVisMode || isBlueMode)) {
          const cosZ = hasCoords ? (sinLat * solar.sinSol + cosLat * solar.cosSol * colCosHour[x]) : 1.0;
          let dayW = 1.0;
          if (hasCoords) {
            if (cosZ <= 0.0) dayW = 0.0;
            else if (cosZ < 0.18) dayW = cosZ / 0.18;
          }

          let dSig = 0.0;
          let dayAlpha = 0.0;
          if (dayW > 0.01) {
            dSig = computeGeoColorDayCloud(r, g, b, minC, maxC);
            dayAlpha = 248.0 * dSig;
          }

          let nSig = 0.0;
          let nightAlpha = 0.0;
          if (dayW < 0.99) {
            const isCityLight = r > b + 12 && r > 56 && g < r * 0.93 && maxC < 230;
            const isNightLand =
              (b - g >= 6 && r >= g - 2 && maxC < 108) ||
              (r - g >= 6 && r >= b - 4 && maxC < 100);
            if (maxC >= 46 && !isCityLight && !isNightLand) {
              const isNightLowCloud = b > r + 5 && g >= r - 2 && b >= 58;
              const nightSig = isNightLowCloud
                ? Math.max(l, 0.45 * g + 0.55 * b)
                : (minC >= 46 && Math.abs(r - b) < 28 ? l : 0);
              if (nightSig > 48) {
                const nNorm = Math.min(1.0, (nightSig - 48.0) / 138.0);
                nSig = smoothCloudCurve(nNorm, 0.24, 5.5);
                nightAlpha = 248.0 * nSig;
              }
            }
          }

          const wDay = dayW * dayAlpha;
          const wNight = (1.0 - dayW) * nightAlpha;
          const wSum = wDay + wNight;
          const cloudAlpha = Math.round(wSum * spatWeight);
          if (cloudAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }
          const effSig = wSum > 0.001 ? (wDay * dSig + wNight * nSig) / wSum : dSig;
          const thin = Math.max(0.0, 1.0 - effSig);
          const cloudTone = Math.min(255, Math.round(224 + 31 * effSig));
          d[i] = Math.min(255, Math.round(cloudTone - 3 * thin));
          d[i + 1] = Math.min(255, Math.round(cloudTone));
          d[i + 2] = Math.min(255, Math.round(cloudTone + 6 * thin));
          d[i + 3] = cloudAlpha;
          continue;
        }

        if (isBlueMode || isVisMode) {
          let cloudAlpha = 0;
          let sigmoid = 0;

          if (isInfraLayer) {
            const irThresh = hasCoords ? getLocalThermalThreshold(tileLngs[x], tileLats[y], isBand09) : (isBand09 ? 96 : 98);
            if (baseRadiance <= irThresh) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, Math.max(0.0, (baseRadiance - irThresh) / (215.0 - irThresh)));
            sigmoid = smoothCloudCurve(norm, 0.24, 5.5);
            cloudAlpha = Math.round(250.0 * sigmoid * spatWeight);
          } else if (isHimawariVis) {
            if (r <= 78) { d[i + 3] = 0; continue; }
            const norm = Math.min(1.0, (r - 78) / (200 - 78));
            sigmoid = smoothCloudCurve(norm, 0.26, 5.5);
            cloudAlpha = Math.round(250 * sigmoid * spatWeight);
          } else if (isEumetVis) {
            if (l <= 82) { d[i + 3] = 0; continue; }
            const norm = Math.min(1.0, (l - 82) / (205 - 82));
            sigmoid = smoothCloudCurve(norm, 0.26, 5.5);
            cloudAlpha = Math.round(250 * sigmoid * spatWeight);
          } else {
            if (baseRadiance <= 64) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (baseRadiance - 64) / (200 - 64));
            sigmoid = smoothCloudCurve(norm, 0.26, 5.5);
            cloudAlpha = Math.round(248 * sigmoid * spatWeight);
          }

          if (cloudAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }

          if (isInfraLayer) {
            const cloudTone = Math.min(255, Math.round(218 + 37 * sigmoid));
            const thinness = Math.max(0.0, 1.0 - sigmoid);
            const rayleighB = Math.round(7.0 * thinness);
            const rayleighG = Math.round(2.0 * thinness);
            d[i] = cloudTone;
            d[i + 1] = Math.min(255, cloudTone + rayleighG);
            d[i + 2] = Math.min(255, cloudTone + rayleighB);
            d[i + 3] = cloudAlpha;
          } else {
            const thinness = Math.max(0.0, 1.0 - sigmoid);
            const rayleighB = Math.round(6.0 * thinness);
            const rayleighG = Math.round(2.0 * thinness);
            const cloudTone = Math.min(255, Math.round(225 + 30 * sigmoid));
            d[i] = cloudTone;
            d[i + 1] = Math.min(255, cloudTone + rayleighG);
            d[i + 2] = Math.min(255, cloudTone + rayleighB);
            d[i + 3] = cloudAlpha;
          }
        } else {
          // INFRARED THERMAL MODE (Dvorak/BD Hurricane Scale with clean warm land/sea suppression)
          const baseThresh = isBand09 ? 98 : 102;
          const localThresh = hasCoords ? getLocalThermalThreshold(tileLngs[x], tileLats[y], isBand09) : baseThresh;
          const thresh = Math.max(baseThresh, localThresh);
          const maxRange = isBand09 ? 190 : 225;
          if (l <= thresh) {
            d[i + 3] = 0;
            continue;
          }
          const norm = Math.min(1.0, (l - thresh) / (maxRange - thresh));
          const finalAlpha = Math.round(245 * Math.pow(norm, 0.78) * spatWeight);
          if (finalAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }
          if (norm < 0.25) {
            const tone = Math.min(255, Math.max(195, Math.round(210 + 35 * norm)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = Math.min(255, tone + 4);
          } else if (norm < 0.45) {
            const tone = Math.min(255, Math.max(220, Math.round(230 + 20 * norm)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone;
          } else if (norm < 0.65) {
            d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
          } else if (norm < 0.85) {
            d[i] = 245; d[i + 1] = 158; d[i + 2] = 11;
          } else {
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
    NOAA_GLOBAL_SECTORS,
    getGlobalSectorSpec,
    extractSectorFromUrl,
    computeSolarPositionRad,
    tileToLng,
    tileToLat,
    tilePixelToLatLon,
    geodeticToGeoScan,
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
    getSectorSpatialWeight,
    processTilePixels,
    createNoaaStarProtocolHandler,
  };
}
