/**
 * Feature-flagged NOAA STAR GOES-19 1808x1808 GeoColor pilot configuration and telemetry.
 *
 * Hard gate: NEXT_PUBLIC_NOAA_STAR_PILOT must equal 'true' at build time.
 * Query parameters can only opt out (?noaaPilot=0|false), never enable the pilot in production.
 */

export const NOAA_STAR_TELEMETRY_CHANNEL = 'noaa-star-pilot-telemetry';
export const NOAA_STAR_DEFAULT_1808_OFFSET = 0.333;

export interface NoaaStarActiveSectorInfo {
  sector: string;
  satLabel: string;
  product: string;
  cdnAgeMinutes: number | null;
  fallbackActive?: boolean;
}

export interface NoaaStarPilotTelemetry {
  mode: 'noaa-star' | 'gibs-fallback-pending' | 'gibs-fallback' | 'gibs-fallback-failed';
  reason: string | null;
  sector?: string;
  satLabel?: string;
  product?: string;
  activeSectors?: NoaaStarActiveSectorInfo[];
  lastModifiedUtc: string | null;
  lastModifiedMs: number | null;
  cdnAgeMinutes: number | null;
  calOffsetX: number;
  calOffsetY: number;
  p50Ms: number | null;
  p95Ms: number | null;
  sampleCount: number;
  trackedBufferMb: number | null;
  updatedAtMs: number;
}

export interface NoaaStarSectorCheck {
  sectorId: string;
  isVisibleMode?: boolean;
  spectralMode?: 'visible' | 'blue' | 'infra';
  goesEastDay?: boolean;
  isHdMode: boolean;
  timelineHoursAhead: number;
  search?: string;
}

export interface NoaaStarTileUrlParams {
  sectorId?: string;
  fallbackProto?: 'gibs' | 'eumet';
  enableNightIr?: boolean;
  hiResExperiment?: boolean;
  softCloudExperiment?: boolean;
  layerName: string;
  tileTime: string;
  tileMatrixSet: string;
  ext: string;
  spectralParam: string;
  bucket: number;
  calOffsetX?: number;
  calOffsetY?: number;
}

export const NOAA_GLOBAL_PILOT_SECTORS = new Set([
  'goes-east',
  'goes-west',
  'himawari',
  'eumet-iodc',
  'europe-africa',
]);

function parseClampedOffset(rawValue: string | undefined, fallback: number): number {
  if (rawValue === undefined || rawValue === '') return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(-2, Math.min(2, parsed));
}

export function isNoaaStarPilotBuildEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NOAA_STAR_PILOT === 'true';
}

export function isNoaaStarPilotEnabled(search?: string): boolean {
  if (!isNoaaStarPilotBuildEnabled()) return false;
  const searchStr =
    search !== undefined
      ? search
      : typeof window !== 'undefined'
      ? window.location.search
      : '';
  if (searchStr) {
    const opt = new URLSearchParams(searchStr).get('noaaPilot');
    if (opt === '0' || opt === 'false') return false;
  }
  return true;
}

/**
 * Independent build-gated + query-opted experiment flags for separating
 * source-resolution upgrades (?satHiRes=1) from soft-ramp cloud styling (?satSoftCloud=1).
 * Both stay strictly disabled unless their build flag is 'true' AND opted in via query.
 */
export function isSatHiResExperimentEnabled(search?: string): boolean {
  if (process.env.NEXT_PUBLIC_SAT_HIRES_PILOT !== 'true') return false;
  const searchStr =
    search !== undefined
      ? search
      : typeof window !== 'undefined'
      ? window.location.search
      : '';
  if (!searchStr) return false;
  const opt = new URLSearchParams(searchStr).get('satHiRes');
  return opt === '1' || opt === 'true';
}

export function isSatSoftCloudExperimentEnabled(search?: string): boolean {
  if (process.env.NEXT_PUBLIC_SAT_SOFT_CLOUD_PILOT !== 'true') return false;
  const searchStr =
    search !== undefined
      ? search
      : typeof window !== 'undefined'
      ? window.location.search
      : '';
  if (!searchStr) return false;
  const opt = new URLSearchParams(searchStr).get('satSoftCloud');
  return opt === '1' || opt === 'true';
}

export function getNoaaStar1808CalibrationOffset(): { x: number; y: number } {
  return {
    x: parseClampedOffset(process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_X, NOAA_STAR_DEFAULT_1808_OFFSET),
    y: parseClampedOffset(process.env.NEXT_PUBLIC_NOAA_STAR_1808_OFFSET_Y, NOAA_STAR_DEFAULT_1808_OFFSET),
  };
}

export function shouldUseNoaaStarPilotForSector({
  sectorId,
  isVisibleMode,
  spectralMode,
  goesEastDay,
  isHdMode,
  timelineHoursAhead,
  search,
}: NoaaStarSectorCheck): boolean {
  if (!isNoaaStarPilotEnabled(search)) return false;
  if (isHdMode || timelineHoursAhead !== 0) return false;
  if (!NOAA_GLOBAL_PILOT_SECTORS.has(sectorId)) return false;
  if (spectralMode) {
    return spectralMode === 'visible' || spectralMode === 'blue' || spectralMode === 'infra';
  }
  if (isVisibleMode !== undefined) {
    // Allow GeoColor / Clean IR across all 5 geostationary sectors 24/7
    void goesEastDay;
    return isVisibleMode || sectorId !== 'global-polar';
  }
  return true;
}

/**
 * Builds a noaa-star:// URL template retaining literal {z}/{x}/{y} placeholders for MapLibre
 * while carrying sector identity and mode-compatible GIBS/EUMETSAT failover parameters.
 */
export function buildNoaaStarTileUrl({
  sectorId = 'goes-east',
  fallbackProto,
  enableNightIr = false,
  hiResExperiment = false,
  softCloudExperiment = false,
  layerName,
  tileTime,
  tileMatrixSet,
  ext,
  spectralParam,
  bucket,
  calOffsetX,
  calOffsetY,
}: NoaaStarTileUrlParams): string {
  const defaults = getNoaaStar1808CalibrationOffset();
  const cx = calOffsetX ?? defaults.x;
  const cy = calOffsetY ?? defaults.y;
  const spectral = spectralParam.startsWith('spectral=') ? spectralParam.slice('spectral='.length) : spectralParam;
  const resolvedFallbackProto =
    fallbackProto ||
    (sectorId === 'europe-africa' || sectorId === 'eumet-iodc' ? 'eumet' : 'gibs');
  const query = [
    `sector=${encodeURIComponent(sectorId)}`,
    `fallbackProto=${encodeURIComponent(resolvedFallbackProto)}`,
    `fallbackLayer=${encodeURIComponent(layerName)}`,
    `fallbackTime=${encodeURIComponent(tileTime)}`,
    `fallbackTms=${encodeURIComponent(tileMatrixSet)}`,
    `fallbackExt=${encodeURIComponent(ext)}`,
    `spectral=${encodeURIComponent(spectral)}`,
    ...(enableNightIr && spectral === 'vis' ? ['nightIr=1'] : []),
    ...(hiResExperiment ? ['hiRes=1'] : []),
    ...(softCloudExperiment ? ['softCloud=1'] : []),
    `calX=${encodeURIComponent(String(cx))}`,
    `calY=${encodeURIComponent(String(cy))}`,
    `bucket=${encodeURIComponent(String(bucket))}`,
  ].join('&');
  return `noaa-star://tile/{z}/{x}/{y}.png?${query}`;
}

export function parseNoaaStarFallbackHttpsUrl(rawUrl: string): string | null {
  const m = rawUrl.match(/^noaa-star:\/\/tile\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)(?:\?(.*))?$/i);
  if (!m) return null;
  const tileZ = parseInt(m[1], 10);
  const tileX = parseInt(m[2], 10);
  const tileY = parseInt(m[3], 10);
  const qs = new URLSearchParams(m[5] || '');
  const sector = (qs.get('sector') || 'goes-east').toLowerCase();
  const fallbackProto = (qs.get('fallbackProto') || 'gibs').toLowerCase();
  const layer = qs.get('fallbackLayer') || 'GOES-East_ABI_GeoColor';
  const time = qs.get('fallbackTime') || new Date(Date.now() - 10 * 60000).toISOString().slice(0, 10);
  const tms = qs.get('fallbackTms') || 'GoogleMapsCompatible_Level7';
  const ext = qs.get('fallbackExt') || 'png';
  const spectral = qs.get('spectral') || 'vis';
  if (fallbackProto === 'eumet') {
    return `/api/weather/satellite/eumet-tile?z=${tileZ}&x=${tileX}&y=${tileY}&layer=${encodeURIComponent(layer)}&spectral=${encodeURIComponent(spectral)}&sector=${encodeURIComponent(sector)}`;
  }
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${time}/${tms}/${tileZ}/${tileY}/${tileX}.${ext}?spectral=${encodeURIComponent(spectral)}&sector=${encodeURIComponent(sector)}`;
}

export function formatNoaaFallbackReason(reason?: string | null): string {
  if (!reason) return 'NOAA unavailable';
  if (reason === 'NOAA_TIMEOUT' || reason === 'noaa-timeout') return 'NOAA timed out';
  if (
    reason === 'NOAA_NETWORK_ERROR' ||
    reason === 'Failed to fetch' ||
    reason === 'Load failed' ||
    reason.includes('NetworkError')
  ) {
    return 'NOAA network unreachable';
  }
  if (reason === 'NOAA_COOLDOWN_ACTIVE') return 'NOAA cooldown active';
  if (reason === 'NOAA_RESPONSE_TOO_LARGE') return 'NOAA payload > 8 MB';
  if (reason === 'UNEXPECTED_NOAA_DIMENSIONS') return 'Unexpected image dimensions';
  if (reason === 'NOAA_TRACKED_BUDGET_EXCEEDED') return 'NOAA buffer limit reached';
  if (reason.startsWith('CIRA_META_HTTP_')) return `CIRA meta HTTP ${reason.slice('CIRA_META_HTTP_'.length)}`;
  if (reason.startsWith('CIRA_TILE_HTTP_')) return `CIRA tile HTTP ${reason.slice('CIRA_TILE_HTTP_'.length)}`;
  if (reason.startsWith('NOAA_HTTP_')) return `NOAA HTTP ${reason.slice('NOAA_HTTP_'.length)}`;
  return reason;
}

export const EMPTY_TRANSPARENT_PNG_BYTES = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0,
  0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45,
  180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

export function createEmptyTransparentPngBuffer(): ArrayBuffer {
  return EMPTY_TRANSPARENT_PNG_BYTES.slice().buffer;
}

function slippyTileToLng(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function slippyTileToLat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export function parseTileCoordsFromUrl(url: string): { tileZ: number; tileX: number; tileY: number } | null {
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

export function extractSectorFromUrl(url: string): string | null {
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

/**
 * Returns true when a tile at z >= 2 lies strictly outside the sector's non-zero
 * spatial blend footprint so off-hemisphere fetches short-circuit without network I/O.
 */
export function isTileOutsideSectorSupport(
  url: string,
  coords: { tileZ: number; tileX: number; tileY: number } | null = parseTileCoordsFromUrl(url)
): boolean {
  if (!url || !coords || !Number.isFinite(coords.tileZ) || coords.tileZ < 2) return false;
  const { tileZ, tileX, tileY } = coords;
  const northLat = slippyTileToLat(tileY, tileZ);
  const southLat = slippyTileToLat(tileY + 1, tileZ);
  const westLng = slippyTileToLng(tileX, tileZ);
  const eastLng = slippyTileToLng(tileX + 1, tileZ);

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

export function isBlackMarbleTileSolidDaylight(
  url: string,
  coords: { tileZ: number; tileX: number; tileY: number } | null = parseTileCoordsFromUrl(url)
): boolean {
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
  const lats = [slippyTileToLat(tileY, tileZ), slippyTileToLat(tileY + 1, tileZ)];
  const lngs = [slippyTileToLng(tileX, tileZ), slippyTileToLng(tileX + 1, tileZ)];
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
  // 4 deg margin guarantees broad daylight (cosZenith >= 0.06) everywhere inside curved z>=3 tiles
  return Math.cos(Math.min(Math.PI, maxPsi + 4 * rad)) >= 0.06;
}

const telemetryListeners = new Set<(telemetry: NoaaStarPilotTelemetry) => void>();
let latestNoaaTelemetry: NoaaStarPilotTelemetry | null = null;

export function publishNoaaStarTelemetry(data: NoaaStarPilotTelemetry): void {
  if (
    !data ||
    (data.mode !== 'noaa-star' &&
      data.mode !== 'gibs-fallback-pending' &&
      data.mode !== 'gibs-fallback' &&
      data.mode !== 'gibs-fallback-failed')
  ) {
    return;
  }
  latestNoaaTelemetry = data;
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__noaaStarPilotMetrics = data;
  }
  telemetryListeners.forEach((fn) => fn(data));
}

export function subscribeNoaaStarTelemetry(
  onTelemetry: (telemetry: NoaaStarPilotTelemetry) => void
): () => void {
  telemetryListeners.add(onTelemetry);
  if (latestNoaaTelemetry) {
    onTelemetry(latestNoaaTelemetry);
  }
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return () => {
      telemetryListeners.delete(onTelemetry);
    };
  }
  const channel = new BroadcastChannel(NOAA_STAR_TELEMETRY_CHANNEL);
  const handler = (event: MessageEvent<NoaaStarPilotTelemetry>) => {
    if (event.data) publishNoaaStarTelemetry(event.data);
  };
  channel.addEventListener('message', handler);
  return () => {
    telemetryListeners.delete(onTelemetry);
    channel.removeEventListener('message', handler);
    channel.close();
  };
}
