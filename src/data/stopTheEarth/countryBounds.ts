// ============================================================
// MooEarth Live — Stop the Earth: Country Bounding Boxes
// ============================================================
// Approximate bounding boxes for all 195 sovereign countries.
// Used for: (a) fitting MapLibre to country view, (b) validating
// that player clicks fall within the selected country,
// (c) determining appropriate zoom levels.
//
// Bounds are computed from centroid + area heuristic for countries
// without explicit bbox data. Sufficient for game purposes.

import { CountryBounds } from '@/engines/game/stopTheEarth/types';
import { CANONICAL_COUNTRIES } from '@/data/countries';

/**
 * Estimate a bounding box from a centroid and country area.
 * Uses sqrt(area) as a proxy for geographic extent, converted
 * to approximate degrees of latitude/longitude.
 */
function estimateBounds(
  lat: number,
  lng: number,
  areaKm2: number
): { sw: { lat: number; lng: number }; ne: { lat: number; lng: number }; zoom: number } {
  // sqrt(area) gives rough side length in km
  const sideKm = Math.sqrt(areaKm2);
  // Convert km to degrees (very rough: 1° lat ≈ 111km, 1° lng ≈ 111 * cos(lat) km)
  const latSpread = Math.max(sideKm / 111, 0.5);
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const lngSpread = Math.max(sideKm / (111 * Math.max(cosLat, 0.1)), 0.5);

  // Determine zoom level based on geographic extent
  let zoom: number;
  if (areaKm2 > 5_000_000) zoom = 3;       // Russia, Canada, USA, China
  else if (areaKm2 > 1_000_000) zoom = 4;   // India, Argentina, Algeria
  else if (areaKm2 > 300_000) zoom = 5;      // France, Germany, Japan
  else if (areaKm2 > 50_000) zoom = 6;       // Netherlands, Denmark, Sri Lanka
  else if (areaKm2 > 5_000) zoom = 8;        // Jamaica, Cyprus, Brunei
  else if (areaKm2 > 500) zoom = 10;         // Hong Kong, Bahrain, Singapore
  else zoom = 12;                            // Monaco, Vatican, San Marino

  return {
    sw: {
      lat: Math.max(lat - latSpread / 2, -85),
      lng: Math.max(lng - lngSpread / 2, -180),
    },
    ne: {
      lat: Math.min(lat + latSpread / 2, 85),
      lng: Math.min(lng + lngSpread / 2, 180),
    },
    zoom,
  };
}

// Known overrides for countries with non-standard geography
// (archipelagos, territories spanning the antimeridian, etc.)
const BOUNDS_OVERRIDES: Record<string, Partial<CountryBounds>> = {
  US: {
    sw: { lat: 24.5, lng: -125.0 },
    ne: { lat: 49.5, lng: -66.5 },
    zoom: 4,
  },
  RU: {
    sw: { lat: 41.0, lng: 19.0 },
    ne: { lat: 82.0, lng: 180.0 },
    zoom: 3,
  },
  FR: {
    sw: { lat: 41.3, lng: -5.2 },
    ne: { lat: 51.1, lng: 9.6 },
    zoom: 5,
  },
  NZ: {
    sw: { lat: -47.5, lng: 166.0 },
    ne: { lat: -34.0, lng: 179.0 },
    zoom: 5,
  },
  JP: {
    sw: { lat: 24.0, lng: 123.0 },
    ne: { lat: 46.0, lng: 146.0 },
    zoom: 5,
  },
  ID: {
    sw: { lat: -11.0, lng: 95.0 },
    ne: { lat: 6.0, lng: 141.0 },
    zoom: 4,
  },
  CL: {
    sw: { lat: -56.0, lng: -75.7 },
    ne: { lat: -17.5, lng: -66.5 },
    zoom: 4,
  },
  NO: {
    sw: { lat: 57.9, lng: 4.5 },
    ne: { lat: 71.2, lng: 31.2 },
    zoom: 4,
  },
  PH: {
    sw: { lat: 4.5, lng: 116.0 },
    ne: { lat: 21.2, lng: 127.0 },
    zoom: 5,
  },
  CA: {
    sw: { lat: 41.7, lng: -141.0 },
    ne: { lat: 83.1, lng: -52.6 },
    zoom: 3,
  },
  AU: {
    sw: { lat: -44.0, lng: 113.0 },
    ne: { lat: -10.0, lng: 154.0 },
    zoom: 4,
  },
  CN: {
    sw: { lat: 18.0, lng: 73.5 },
    ne: { lat: 53.5, lng: 135.0 },
    zoom: 4,
  },
  BR: {
    sw: { lat: -33.8, lng: -73.9 },
    ne: { lat: 5.3, lng: -34.8 },
    zoom: 4,
  },
  IN: {
    sw: { lat: 6.5, lng: 68.1 },
    ne: { lat: 35.7, lng: 97.4 },
    zoom: 4,
  },
  GB: {
    sw: { lat: 49.9, lng: -8.2 },
    ne: { lat: 60.9, lng: 1.8 },
    zoom: 5,
  },
  DE: {
    sw: { lat: 47.3, lng: 5.9 },
    ne: { lat: 55.1, lng: 15.0 },
    zoom: 6,
  },
  IT: {
    sw: { lat: 36.6, lng: 6.6 },
    ne: { lat: 47.1, lng: 18.5 },
    zoom: 5,
  },
  ES: {
    sw: { lat: 36.0, lng: -9.3 },
    ne: { lat: 43.8, lng: 4.3 },
    zoom: 5,
  },
  MX: {
    sw: { lat: 14.5, lng: -118.5 },
    ne: { lat: 32.7, lng: -86.7 },
    zoom: 5,
  },
  EG: {
    sw: { lat: 22.0, lng: 24.7 },
    ne: { lat: 31.7, lng: 36.9 },
    zoom: 5,
  },
  TR: {
    sw: { lat: 35.8, lng: 26.0 },
    ne: { lat: 42.1, lng: 44.8 },
    zoom: 5,
  },
  ZA: {
    sw: { lat: -35.0, lng: 16.5 },
    ne: { lat: -22.1, lng: 32.9 },
    zoom: 5,
  },
  SA: {
    sw: { lat: 16.4, lng: 34.5 },
    ne: { lat: 32.2, lng: 55.7 },
    zoom: 5,
  },
  AR: {
    sw: { lat: -55.1, lng: -73.6 },
    ne: { lat: -21.8, lng: -53.6 },
    zoom: 4,
  },
  NG: {
    sw: { lat: 4.3, lng: 2.7 },
    ne: { lat: 13.9, lng: 14.7 },
    zoom: 5,
  },
  KR: {
    sw: { lat: 33.1, lng: 124.6 },
    ne: { lat: 38.6, lng: 131.9 },
    zoom: 6,
  },
  TH: {
    sw: { lat: 5.6, lng: 97.3 },
    ne: { lat: 20.5, lng: 105.6 },
    zoom: 5,
  },
};

/**
 * Build bounding boxes for all 195 countries.
 * Uses overrides for countries with known complex geography,
 * falls back to area-based estimation for the rest.
 */
function buildAllCountryBounds(): Map<string, CountryBounds> {
  const map = new Map<string, CountryBounds>();

  for (const country of CANONICAL_COUNTRIES) {
    const code = country.iso2.toUpperCase();
    const override = BOUNDS_OVERRIDES[code];

    if (override) {
      map.set(code, {
        countryCode: code,
        name: country.name,
        sw: override.sw || { lat: country.coordinates.lat - 5, lng: country.coordinates.lng - 5 },
        ne: override.ne || { lat: country.coordinates.lat + 5, lng: country.coordinates.lng + 5 },
        center: { lat: country.coordinates.lat, lng: country.coordinates.lng },
        zoom: override.zoom || 5,
      });
    } else {
      const estimated = estimateBounds(
        country.coordinates.lat,
        country.coordinates.lng,
        country.areaKm2
      );
      map.set(code, {
        countryCode: code,
        name: country.name,
        sw: estimated.sw,
        ne: estimated.ne,
        center: { lat: country.coordinates.lat, lng: country.coordinates.lng },
        zoom: estimated.zoom,
      });
    }
  }

  return map;
}

const COUNTRY_BOUNDS_MAP = buildAllCountryBounds();

/**
 * Get the bounding box for a country by its ISO2 code.
 */
export function getCountryBounds(countryCode: string): CountryBounds | null {
  return COUNTRY_BOUNDS_MAP.get(countryCode.toUpperCase()) || null;
}

/**
 * Get the bounding box for a country by its name.
 */
export function getCountryBoundsByName(countryName: string): CountryBounds | null {
  const country = CANONICAL_COUNTRIES.find(
    c => c.name.toLowerCase() === countryName.toLowerCase()
  );
  if (!country) return null;
  return getCountryBounds(country.iso2);
}

/**
 * Check if a coordinate falls within a country's bounding box.
 * This is an approximation — not pixel-perfect polygon checking.
 * Includes a small padding (0.5°) for edge cases near borders.
 */
export function isWithinCountryBounds(
  coord: { lat: number; lng: number },
  countryCode: string,
  paddingDeg: number = 0.5
): boolean {
  const bounds = getCountryBounds(countryCode);
  if (!bounds) return true; // If no bounds data, allow the click

  return (
    coord.lat >= bounds.sw.lat - paddingDeg &&
    coord.lat <= bounds.ne.lat + paddingDeg &&
    coord.lng >= bounds.sw.lng - paddingDeg &&
    coord.lng <= bounds.ne.lng + paddingDeg
  );
}

/**
 * Get all country bounds as an array.
 */
export function getAllCountryBounds(): CountryBounds[] {
  return Array.from(COUNTRY_BOUNDS_MAP.values());
}
