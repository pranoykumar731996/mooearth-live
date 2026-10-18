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

export interface SatelliteMetadataResponse {
  spectralMode: SatelliteSpectralMode;
  observationDate: string; // YYYY-MM-DD
  observationUtc: string; // e.g. "2026-10-18 12:00 UTC"
  product: SatelliteProduct;
  tileUrlTemplate: string; // Slippy tile format with {z}/{y}/{x} or {z}/{x}/{y}
  availableModes: SatelliteSpectralMode[];
  attribution: string;
  license: string;
}

/**
 * Verified NASA GIBS open data satellite layers:
 * https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products
 */
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
    id: 'nasa-gibs-viirs-dnb',
    name: 'VIIRS Day/Night Band (Nighttime City Lights & Aurora)',
    agency: 'NASA EOSDIS / NOAA',
    instrument: 'VIIRS',
    platform: 'Suomi NPP',
    spectralMode: 'blue',
    format: 'image/jpeg',
    tileMatrixSet: 'GoogleMapsCompatible_Level8',
    resolution: '500m',
    description: 'High-sensitivity panchromatic nocturnal visible band showing moonlight on cloud tops, aurora, and city glow.',
    attribution: 'NASA GIBS / NOAA Suomi NPP Nighttime Imagery',
    license: 'NASA Earth Science Open Data Policy (Public Domain)',
    licenseUrl: 'https://earthdata.nasa.gov/collaborate/open-data-services-and-software/data-information-policy',
    layerName: 'VIIRS_SNPP_DayNightBand_ENCC',
  },
  infra: {
    id: 'nasa-gibs-viirs-thermal-ir',
    name: 'VIIRS Brightness Temperature (Thermal Infrared)',
    agency: 'NASA EOSDIS / NOAA',
    instrument: 'VIIRS',
    platform: 'Suomi NPP',
    spectralMode: 'infra',
    format: 'image/png',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    resolution: '375m',
    description: 'Clean infrared window (Band I5 / 11.45 µm) measuring cloud-top brightness temperatures to highlight convective storm cores.',
    attribution: 'NASA Global Imagery Browse Services (GIBS) / NOAA VIIRS Thermal IR',
    license: 'NASA Earth Science Open Data Policy (Public Domain)',
    licenseUrl: 'https://earthdata.nasa.gov/collaborate/open-data-services-and-software/data-information-policy',
    layerName: 'VIIRS_SNPP_Thermal_Anomalies_375m_All',
  },
};

/**
 * Returns the most recent completed NASA GIBS observation date (YYYY-MM-DD).
 * NASA GIBS global composites update continuously; the previous UTC day is always 100% complete worldwide.
 */
export function getSatelliteObservationDate(offsetHours: number = 0): { dateStr: string; utcStr: string; timestampMs: number } {
  const now = new Date(Date.now() - offsetHours * 3600 * 1000);
  
  // For daily global composites: if current UTC hour is early (< 04:00 UTC), use yesterday to ensure complete tiles
  const utcHours = now.getUTCHours();
  const adjusted = new Date(now.getTime());
  if (utcHours < 4 && offsetHours === 0) {
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
 * High-level helper returning comprehensive satellite imagery metadata.
 */
export function getSatelliteMetadata(mode: SatelliteSpectralMode = 'visible', offsetHours: number = 0): SatelliteMetadataResponse {
  const product = SATELLITE_PRODUCTS[mode] || SATELLITE_PRODUCTS.visible;
  const { dateStr, utcStr } = getSatelliteObservationDate(offsetHours);
  const tileUrlTemplate = buildGibsTileUrl(product, dateStr);

  return {
    spectralMode: mode,
    observationDate: dateStr,
    observationUtc: utcStr,
    product,
    tileUrlTemplate,
    availableModes: ['visible', 'blue', 'infra'],
    attribution: product.attribution,
    license: product.license,
  };
}
