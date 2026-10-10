// ============================================================
// MooEarth Live — Marine Service
// ============================================================
// Ocean & coastal weather using the Open-Meteo Marine API.
// Wave height, direction, period, swell, and wind waves.
// Unavailable for inland locations — handled gracefully.

import { queryOpenMeteo } from './openMeteoClient';
import {
  MarineCurrentData,
  MarineHourlyData,
  MarineDailyData,
  MarineResponse,
} from './types';

// ── Raw API Types ─────────────────────────────────────────────

interface RawMarineCurrent {
  time: string;
  wave_height?: number;
  wave_direction?: number;
  wave_period?: number;
  wind_wave_height?: number;
  wind_wave_direction?: number;
  wind_wave_period?: number;
  swell_wave_height?: number;
  swell_wave_direction?: number;
  swell_wave_period?: number;
}

interface RawMarineHourly {
  time: string[];
  wave_height?: (number | null)[];
  wave_direction?: (number | null)[];
  wave_period?: (number | null)[];
  wind_wave_height?: (number | null)[];
  wind_wave_direction?: (number | null)[];
  wind_wave_period?: (number | null)[];
  swell_wave_height?: (number | null)[];
  swell_wave_direction?: (number | null)[];
  swell_wave_period?: (number | null)[];
}

interface RawMarineDaily {
  time: string[];
  wave_height_max?: (number | null)[];
  wave_direction_dominant?: (number | null)[];
  wave_period_max?: (number | null)[];
}

interface RawMarineResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  current?: RawMarineCurrent;
  hourly?: RawMarineHourly;
  daily?: RawMarineDaily;
  generationtime_ms: number;
}

// ── Transform Functions ───────────────────────────────────────

function transformCurrent(raw: RawMarineCurrent): MarineCurrentData {
  return {
    time: raw.time,
    waveHeight: raw.wave_height ?? null,
    waveDirection: raw.wave_direction ?? null,
    wavePeriod: raw.wave_period ?? null,
    windWaveHeight: raw.wind_wave_height ?? null,
    windWaveDirection: raw.wind_wave_direction ?? null,
    windWavePeriod: raw.wind_wave_period ?? null,
    swellWaveHeight: raw.swell_wave_height ?? null,
    swellWaveDirection: raw.swell_wave_direction ?? null,
    swellWavePeriod: raw.swell_wave_period ?? null,
  };
}

function transformHourly(raw: RawMarineHourly): MarineHourlyData {
  const len = raw.time.length;
  const nulls = new Array(len).fill(null);
  return {
    time: raw.time,
    waveHeight: raw.wave_height ?? nulls,
    waveDirection: raw.wave_direction ?? nulls,
    wavePeriod: raw.wave_period ?? nulls,
    windWaveHeight: raw.wind_wave_height ?? nulls,
    windWaveDirection: raw.wind_wave_direction ?? nulls,
    windWavePeriod: raw.wind_wave_period ?? nulls,
    swellWaveHeight: raw.swell_wave_height ?? nulls,
    swellWaveDirection: raw.swell_wave_direction ?? nulls,
    swellWavePeriod: raw.swell_wave_period ?? nulls,
  };
}

function transformDaily(raw: RawMarineDaily): MarineDailyData {
  const len = raw.time.length;
  const nulls = new Array(len).fill(null);
  return {
    time: raw.time,
    waveHeightMax: raw.wave_height_max ?? nulls,
    waveDirectionDominant: raw.wave_direction_dominant ?? nulls,
    wavePeriodMax: raw.wave_period_max ?? nulls,
  };
}

// ── Public API ────────────────────────────────────────────────

/**
 * Fetch marine weather data for a location.
 * Returns wave, swell, and wind wave data for ocean/coastal locations.
 * Returns dataAvailable=false for inland locations.
 */
export async function fetchMarineWeather(
  latitude: number,
  longitude: number
): Promise<MarineResponse> {
  const lat = Number(latitude.toFixed(2));
  const lng = Number(longitude.toFixed(2));

  try {
    const raw = await queryOpenMeteo<RawMarineResponse>({
      endpoint: 'marine',
      params: {
        latitude: lat,
        longitude: lng,
        current: [
          'wave_height', 'wave_direction', 'wave_period',
          'wind_wave_height', 'wind_wave_direction', 'wind_wave_period',
          'swell_wave_height', 'swell_wave_direction', 'swell_wave_period',
        ].join(','),
        hourly: [
          'wave_height', 'wave_direction', 'wave_period',
          'wind_wave_height', 'wind_wave_direction', 'wind_wave_period',
          'swell_wave_height', 'swell_wave_direction', 'swell_wave_period',
        ].join(','),
        daily: [
          'wave_height_max', 'wave_direction_dominant', 'wave_period_max',
        ].join(','),
        timezone: 'auto',
        forecast_days: 7,
        forecast_hours: 48,
      },
    });

    // Check if we got meaningful data
    const hasData = raw.current?.wave_height !== undefined &&
                    raw.current?.wave_height !== null;

    return {
      latitude: raw.latitude,
      longitude: raw.longitude,
      timezone: raw.timezone ?? 'UTC',
      current: raw.current ? transformCurrent(raw.current) : null,
      hourly: raw.hourly ? transformHourly(raw.hourly) : null,
      daily: raw.daily ? transformDaily(raw.daily) : null,
      generationTime: raw.generationtime_ms,
      dataSource: 'open-meteo',
      fetchedAt: new Date().toISOString(),
      dataAvailable: hasData,
    };
  } catch {
    // Inland locations will fail — this is expected
    return {
      latitude: lat,
      longitude: lng,
      timezone: 'UTC',
      current: null,
      hourly: null,
      daily: null,
      generationTime: 0,
      dataSource: 'open-meteo',
      fetchedAt: new Date().toISOString(),
      dataAvailable: false,
    };
  }
}

/**
 * Describe wave conditions for display.
 */
export function describeWaveConditions(heightMetres: number | null): string {
  if (heightMetres === null) return 'No data available';
  if (heightMetres < 0.3) return 'Calm (Glassy)';
  if (heightMetres < 0.5) return 'Calm (Rippled)';
  if (heightMetres < 1.25) return 'Smooth';
  if (heightMetres < 2.5) return 'Slight';
  if (heightMetres < 4.0) return 'Moderate';
  if (heightMetres < 6.0) return 'Rough';
  if (heightMetres < 9.0) return 'Very Rough';
  if (heightMetres < 14.0) return 'High';
  return 'Very High';
}

/**
 * Convert wave direction (degrees) to compass direction.
 */
export function waveDirectionToCompass(degrees: number | null): string {
  if (degrees === null) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return dirs[index];
}
