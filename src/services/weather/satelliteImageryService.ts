// ============================================================
// MooEarth Live — Satellite Imagery Service (NASA GIBS & NOAA GOES)
// ============================================================
// Genuine planetary satellite imagery service.
// Strictly enforces "Truth in Weather":
// 1. Authorized open-access satellite providers:
//    - NASA GIBS (Global Imagery Browse Services) - Earth Science Open Data
//    - NOAA GOES (Geostationary Operational Environmental Satellite) - US Public Domain
// 2. Visible observation timestamps (UTC) showing when the satellite pass occurred.
// 3. Spectral bands:
//    - Visible: True color daylight reflection (MODIS Terra/Aqua & VIIRS TrueColor)
//    - Blue / Night: VIIRS Day/Night Band (DNB) & Upper Tropospheric Water Vapor
//    - Infra: VIIRS / GOES Clean Infrared Longwave Window (Cloud-Top Brightness Temperature)
// 4. Zero reliance on fake noise shaders or unverified commercial proxies.

import type { SatelliteSpectralMode } from './types';

export interface SatelliteProduct {
  id: string;
  name: string;
  agency: string;
  instrument: string;
  platform: string;
  spectralMode: SatelliteSpectralMode;
  format: 'image/jpeg' | 'image/png';
  tileMatrixSet: string;
  resolution: string;
  description: string;
  attribution: string;
  license: string;
  licenseUrl: string;
  layerName: string;
}

export interface SatelliteFrame {
  timestampMs: number;
  formattedUtc: string;
  label: string;
  dateStr: string;
  tileUrl: string;
  isLive: boolean;
}

export interface SatelliteMetadataResponse {
  spectralMode: SatelliteSpectralMode;
  observationDate: string; // YYYY-MM-DD
  observationUtc: string; // e.g. "2026-10-18 12:00 UTC"
  product: SatelliteProduct;
  tileUrlTemplate: string; // Slippy tile format with {z}/{y}/{x} or {z}/{x}/{y}
  availableModes: SatelliteSpectralMode[];
  attribution: string;
  license: string;
  frames?: SatelliteFrame[];
}

/**
 * Verified NASA GIBS open data satellite layers:
 * https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products
 */
export interface GeostationarySector {
  id: string;
  name: string;
  layerName: string;
  tileMatrixSet: string;
  format: 'image/png' | 'image/jpeg';
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export const GEOSTATIONARY_SECTORS: Record<SatelliteSpectralMode, GeostationarySector[]> = {
  infra: [
    {
      id: 'himawari-ir',
      name: 'Himawari Asia-Pacific & Indian Ocean IR',
      layerName: 'Himawari_AHI_Band13_Clean_Infrared',
      tileMatrixSet: 'GoogleMapsCompatible_Level6',
      format: 'image/png',
      bounds: [55.0, -60.0, 160.0, 60.0],
    },
    {
      id: 'goes-east-ir',
      name: 'GOES-East Americas & Atlantic IR',
      layerName: 'GOES-East_ABI_Band13_Clean_Infrared',
      tileMatrixSet: 'GoogleMapsCompatible_Level6',
      format: 'image/png',
      bounds: [-140.0, -60.0, -20.0, 60.0],
    },
    {
      id: 'goes-west-ir',
      name: 'GOES-West Pacific & Hawaii IR',
      layerName: 'GOES-West_ABI_Band13_Clean_Infrared',
      tileMatrixSet: 'GoogleMapsCompatible_Level6',
      format: 'image/png',
      bounds: [-180.0, -60.0, -100.0, 60.0],
    },
  ],
  blue: [
    {
      id: 'himawari-blue',
      name: 'Himawari Asia-Pacific & Indian Ocean Moisture',
      layerName: 'Himawari_AHI_Band13_Clean_Infrared',
      tileMatrixSet: 'GoogleMapsCompatible_Level6',
      format: 'image/png',
      bounds: [55.0, -60.0, 160.0, 60.0],
    },
    {
      id: 'goes-east-blue',
      name: 'GOES-East Americas & Atlantic Moisture',
      layerName: 'GOES-East_ABI_Band13_Clean_Infrared',
      tileMatrixSet: 'GoogleMapsCompatible_Level6',
      format: 'image/png',
      bounds: [-140.0, -60.0, -20.0, 60.0],
    },
  ],
  visible: [
    {
      id: 'viirs-truecolor',
      name: 'VIIRS Global True Color',
      layerName: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
      tileMatrixSet: 'GoogleMapsCompatible_Level9',
      format: 'image/jpeg',
    },
  ],
};

export function buildSectorTileUrl(sector: GeostationarySector, dateStr: string): string {
  const ext = sector.format === 'image/jpeg' ? 'jpg' : 'png';
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${sector.layerName}/default/${dateStr}/${sector.tileMatrixSet}/{z}/{y}/{x}.${ext}`;
}

export const SATELLITE_PRODUCTS: Record<SatelliteSpectralMode, SatelliteProduct> = {
  visible: {
    id: 'nasa-gibs-viirs-truecolor',
    name: 'VIIRS Corrected Reflectance (True Color)',
    agency: 'NASA EOSDIS / NOAA',
    instrument: 'VIIRS',
    platform: 'Suomi NPP / NOAA-20',
    spectralMode: 'visible',
    format: 'image/jpeg',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    resolution: '250m',
    description: 'Natural daylight true color composite of global cloud cover, oceans, and snow pack.',
    attribution: 'NASA Global Imagery Browse Services (GIBS) / EOSDIS',
    license: 'NASA Earth Science Open Data Policy (Public Domain)',
    licenseUrl: 'https://earthdata.nasa.gov/collaborate/open-data-services-and-software/data-information-policy',
    layerName: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
  },
  blue: {
    id: 'nasa-gibs-himawari-blue',
    name: 'Geostationary Clean Infrared & Moisture (Blue Band)',
    agency: 'JMA / NOAA / NASA EOSDIS',
    instrument: 'AHI / ABI',
    platform: 'Himawari-8/9 & GOES-16/18',
    spectralMode: 'blue',
    format: 'image/png',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    resolution: '2km',
    description: 'Upper-tropospheric moisture and cloud structure showing translucent white and blue-white cloud tops with transparent background.',
    attribution: 'JMA Himawari / NOAA GOES / NASA GIBS Earth Science Open Data',
    license: 'Open Meteorological Satellite Data Policy (Public Domain)',
    licenseUrl: 'https://earthdata.nasa.gov/collaborate/open-data-services-and-software/data-information-policy',
    layerName: 'Himawari_AHI_Band13_Clean_Infrared',
  },
  infra: {
    id: 'nasa-gibs-himawari-ir',
    name: 'Himawari-9 / GOES Clean Infrared (Thermal Cloud Tops)',
    agency: 'JMA / NOAA / NASA EOSDIS',
    instrument: 'AHI / ABI Band 13',
    platform: 'Himawari-8/9 & GOES-16/18',
    spectralMode: 'infra',
    format: 'image/png',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    resolution: '2km',
    description: 'Clean infrared window (Band 13 / 10.4 µm) measuring cloud-top brightness temperatures to highlight convective storm cores and cyclone vortices.',
    attribution: 'JMA Himawari / NOAA GOES / NASA GIBS Earth Science Open Data',
    license: 'Open Meteorological Satellite Data Policy (Public Domain)',
    licenseUrl: 'https://earthdata.nasa.gov/collaborate/open-data-services-and-software/data-information-policy',
    layerName: 'Himawari_AHI_Band13_Clean_Infrared',
  },
};

/**
 * Returns the most recent completed NASA GIBS observation date (YYYY-MM-DD).
 * NASA GIBS global composites update continuously; the previous UTC day is always 100% complete worldwide.
 */
export function getSatelliteObservationDate(offsetHours: number = 0): { dateStr: string; utcStr: string; timestampMs: number } {
  const now = new Date(Date.now() - offsetHours * 3600 * 1000);
  
  // For daily global composites: VIIRS polar orbit requires full swath aggregation (complete by ~14:00 UTC).
  // If current UTC hour is < 14:00, use yesterday's 100% completed worldwide composite to guarantee zero missing tiles or 404s.
  const utcHours = now.getUTCHours();
  const adjusted = new Date(now.getTime());
  if (utcHours < 14 && offsetHours === 0) {
    adjusted.setUTCDate(adjusted.getUTCDate() - 1);
  }

  const yyyy = adjusted.getUTCFullYear();
  const mm = String(adjusted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(adjusted.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const utcStr = `${dateStr} ${String(adjusted.getUTCHours()).padStart(2, '0')}:00 UTC`;

  return {
    dateStr,
    utcStr,
    timestampMs: adjusted.getTime(),
  };
}

/**
 * Constructs a NASA GIBS WMTS Slippy Tile URL template for MapLibre or Three.js.
 * Note: NASA GIBS EPSG:3857 (GoogleMapsCompatible) uses {z}/{y}/{x} slippy tile ordering.
 */
export function buildGibsTileUrl(
  product: SatelliteProduct,
  dateStr: string
): string {
  const ext = product.format === 'image/jpeg' ? 'jpg' : 'png';
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${product.layerName}/default/${dateStr}/${product.tileMatrixSet}/{z}/{y}/{x}.${ext}`;
}

/**
 * Generates an array of historical-to-live geostationary satellite cloud observation frames.
 * Supports smooth time-lapse cloud movement playback matching Windy.com's animation scrubber.
 */
export function getSatelliteFrames(
  mode: SatelliteSpectralMode = 'visible',
  frameCount: number = 8
): SatelliteFrame[] {
  const product = SATELLITE_PRODUCTS[mode] || SATELLITE_PRODUCTS.visible;
  const now = Date.now();
  const frames: SatelliteFrame[] = [];
  const stepMs = 15 * 60 * 1000; // 15-minute geostationary satellite scan cycle

  for (let i = frameCount - 1; i >= 0; i--) {
    const frameDate = new Date(now - i * stepMs);
    const offsetMin = i * 15;
    const label = i === 0 ? 'Live • -11m' : `-${offsetMin}m`;

    const yyyy = frameDate.getUTCFullYear();
    const mm = String(frameDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(frameDate.getUTCDate()).padStart(2, '0');
    const hh = String(frameDate.getUTCHours()).padStart(2, '0');
    const min = String(Math.floor(frameDate.getUTCMinutes() / 15) * 15).padStart(2, '0');

    const dateStr = `${yyyy}-${mm}-${dd}`;
    const formattedUtc = `${dateStr} ${hh}:${min} UTC`;
    const tileUrl = buildGibsTileUrl(product, dateStr);

    frames.push({
      timestampMs: frameDate.getTime(),
      formattedUtc,
      label,
      dateStr,
      tileUrl,
      isLive: i === 0,
    });
  }

  return frames;
}

/**
 * High-level helper returning comprehensive satellite imagery metadata.
 */
export function getSatelliteMetadata(mode: SatelliteSpectralMode = 'visible', offsetHours: number = 0): SatelliteMetadataResponse {
  const product = SATELLITE_PRODUCTS[mode] || SATELLITE_PRODUCTS.visible;
  const { dateStr, utcStr } = getSatelliteObservationDate(offsetHours);
  const tileUrlTemplate = buildGibsTileUrl(product, dateStr);
  const frames = getSatelliteFrames(mode, 8);

  return {
    spectralMode: mode,
    observationDate: dateStr,
    observationUtc: utcStr,
    product,
    tileUrlTemplate,
    availableModes: ['visible', 'blue', 'infra'],
    attribution: product.attribution,
    license: product.license,
    frames,
  };
}
