// ============================================================
// MooEarth Live — Flood Service
// ============================================================
// River discharge forecast using the Open-Meteo Flood API (GloFAS).
// Clearly distinguishes "no data" from "no flood risk".
// Not a substitute for official emergency alerts.

import { queryOpenMeteo } from './openMeteoClient';
import { FloodData, FloodResponse } from './types';

// ── Raw API Types ─────────────────────────────────────────────

interface RawFloodDaily {
  time: string[];
  river_discharge?: (number | null)[];
  river_discharge_mean?: (number | null)[];
  river_discharge_median?: (number | null)[];
  river_discharge_max?: (number | null)[];
  river_discharge_min?: (number | null)[];
  river_discharge_p25?: (number | null)[];
  river_discharge_p75?: (number | null)[];
}

interface RawFloodResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  daily?: RawFloodDaily;
  generationtime_ms: number;
}

// ── Transform ─────────────────────────────────────────────────

function transformFloodDaily(raw: RawFloodDaily): FloodData {
  const len = raw.time.length;
  const nulls = new Array(len).fill(null);
  return {
    time: raw.time,
    riverDischarge: raw.river_discharge ?? nulls,
    riverDischargeMean: raw.river_discharge_mean ?? nulls,
    riverDischargeMedian: raw.river_discharge_median ?? nulls,
    riverDischargeMax: raw.river_discharge_max ?? nulls,
    riverDischargeMin: raw.river_discharge_min ?? nulls,
    riverDischargeP25: raw.river_discharge_p25 ?? nulls,
    riverDischargeP75: raw.river_discharge_p75 ?? nulls,
  };
}

// ── Public API ────────────────────────────────────────────────

/**
 * Fetch flood forecast data for a location.
 * Returns river discharge forecasts from GloFAS.
 *
 * IMPORTANT: Missing data does NOT mean "no flood risk".
 * The API may not have data for all locations.
 */
export async function fetchFloodData(
  latitude: number,
  longitude: number
): Promise<FloodResponse> {
  const lat = Number(latitude.toFixed(2));
  const lng = Number(longitude.toFixed(2));

  try {
    const raw = await queryOpenMeteo<RawFloodResponse>({
      endpoint: 'flood',
      params: {
        latitude: lat,
        longitude: lng,
        daily: [
          'river_discharge',
          'river_discharge_mean',
          'river_discharge_median',
          'river_discharge_max',
          'river_discharge_min',
          'river_discharge_p25',
          'river_discharge_p75',
        ].join(','),
        forecast_days: 14,
      },
    });

    const hasData = raw.daily &&
      raw.daily.time.length > 0 &&
      raw.daily.river_discharge?.some(v => v !== null);

    const emptyDaily: FloodData = {
      time: [], riverDischarge: [], riverDischargeMean: [],
      riverDischargeMedian: [], riverDischargeMax: [],
      riverDischargeMin: [], riverDischargeP25: [], riverDischargeP75: [],
    };

    return {
      latitude: raw.latitude,
      longitude: raw.longitude,
      timezone: raw.timezone ?? 'UTC',
      daily: raw.daily ? transformFloodDaily(raw.daily) : emptyDaily,
      generationTime: raw.generationtime_ms,
      dataSource: 'open-meteo',
      fetchedAt: new Date().toISOString(),
      dataAvailable: !!hasData,
    };
  } catch {
    // Some inland locations or small rivers may not have flood data
    return {
      latitude: lat,
      longitude: lng,
      timezone: 'UTC',
      daily: {
        time: [], riverDischarge: [], riverDischargeMean: [],
        riverDischargeMedian: [], riverDischargeMax: [],
        riverDischargeMin: [], riverDischargeP25: [], riverDischargeP75: [],
      },
      generationTime: 0,
      dataSource: 'open-meteo',
      fetchedAt: new Date().toISOString(),
      dataAvailable: false,
    };
  }
}

/**
 * Get a human-readable description for river discharge magnitude.
 * This is NOT a flood-risk score — it's a rough magnitude label.
 */
export function describeDischarge(dischargeM3s: number | null): string {
  if (dischargeM3s === null) return 'No data available';
  if (dischargeM3s < 10) return 'Very low discharge';
  if (dischargeM3s < 100) return 'Low discharge';
  if (dischargeM3s < 1000) return 'Moderate discharge';
  if (dischargeM3s < 5000) return 'High discharge';
  return 'Very high discharge';
}
