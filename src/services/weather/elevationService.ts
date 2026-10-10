// ============================================================
// MooEarth Live — Elevation Service
// ============================================================
// Terrain elevation using the Open-Meteo Elevation API.
// Uses long cache TTL since elevation doesn't change.

import { queryOpenMeteo } from './openMeteoClient';
import { ElevationResponse } from './types';

// ── Raw API Types ─────────────────────────────────────────────

interface RawElevationResponse {
  elevation: number[];
}

// ── Public API ────────────────────────────────────────────────

/**
 * Fetch elevation for a geographic coordinate.
 * Cached aggressively (7 days) since elevation is static.
 */
export async function fetchElevation(
  latitude: number,
  longitude: number
): Promise<ElevationResponse> {
  // Round to 4 decimal places (≈11m precision) for elevation
  const lat = Number(latitude.toFixed(4));
  const lng = Number(longitude.toFixed(4));

  const raw = await queryOpenMeteo<RawElevationResponse>({
    endpoint: 'elevation',
    params: {
      latitude: lat,
      longitude: lng,
    },
  });

  const elevationMetres = raw.elevation?.[0] ?? 0;

  return {
    latitude: lat,
    longitude: lng,
    elevation: elevationMetres,
    elevationFeet: Math.round(elevationMetres * 3.28084),
    dataSource: 'open-meteo',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Format elevation for display.
 */
export function formatElevation(metres: number, showFeet: boolean = true): string {
  const m = `${Math.round(metres)} m`;
  if (!showFeet) return m;
  const ft = `${Math.round(metres * 3.28084)} ft`;
  return `${m} (${ft})`;
}
