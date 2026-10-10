// ============================================================
// MooEarth Live — Air Quality Service
// ============================================================
// Air quality data using the Open-Meteo Air Quality API.
// Shows PM2.5, PM10, NO₂, O₃, SO₂, CO, European AQI and US AQI.
// Only shows variables actually returned by the API.

import { queryOpenMeteo } from './openMeteoClient';
import { AirQualityData, AirQualityHourly, AirQualityResponse, AirQualityCategory } from './types';

// ── Raw API Types ─────────────────────────────────────────────

interface RawAirQualityCurrent {
  time: string;
  pm2_5?: number;
  pm10?: number;
  nitrogen_dioxide?: number;
  ozone?: number;
  sulphur_dioxide?: number;
  carbon_monoxide?: number;
  european_aqi?: number;
  us_aqi?: number;
}

interface RawAirQualityHourly {
  time: string[];
  pm2_5?: (number | null)[];
  pm10?: (number | null)[];
  nitrogen_dioxide?: (number | null)[];
  ozone?: (number | null)[];
  sulphur_dioxide?: (number | null)[];
  carbon_monoxide?: (number | null)[];
  european_aqi?: (number | null)[];
  us_aqi?: (number | null)[];
}

interface RawAirQualityResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: RawAirQualityCurrent;
  hourly?: RawAirQualityHourly;
  generationtime_ms: number;
}

// ── Transform ─────────────────────────────────────────────────

function transformCurrent(raw: RawAirQualityCurrent): AirQualityData {
  return {
    time: raw.time,
    pm25: raw.pm2_5 ?? null,
    pm10: raw.pm10 ?? null,
    nitrogenDioxide: raw.nitrogen_dioxide ?? null,
    ozone: raw.ozone ?? null,
    sulphurDioxide: raw.sulphur_dioxide ?? null,
    carbonMonoxide: raw.carbon_monoxide ?? null,
    europeanAqi: raw.european_aqi ?? null,
    usAqi: raw.us_aqi ?? null,
  };
}

function transformHourly(raw: RawAirQualityHourly): AirQualityHourly {
  const len = raw.time.length;
  const nulls = new Array(len).fill(null);
  return {
    time: raw.time,
    pm25: raw.pm2_5 ?? nulls,
    pm10: raw.pm10 ?? nulls,
    nitrogenDioxide: raw.nitrogen_dioxide ?? nulls,
    ozone: raw.ozone ?? nulls,
    sulphurDioxide: raw.sulphur_dioxide ?? nulls,
    carbonMonoxide: raw.carbon_monoxide ?? nulls,
    europeanAqi: raw.european_aqi ?? nulls,
    usAqi: raw.us_aqi ?? nulls,
  };
}

// ── AQI Category Helpers ──────────────────────────────────────

/**
 * Categorize European AQI into a human-readable label.
 * Based on EEA thresholds.
 */
export function categorizeEuropeanAqi(aqi: number | null): AirQualityCategory {
  if (aqi === null || aqi === undefined) return 'Unknown';
  if (aqi <= 20) return 'Good';
  if (aqi <= 40) return 'Fair';
  if (aqi <= 60) return 'Moderate';
  if (aqi <= 80) return 'Poor';
  if (aqi <= 100) return 'Very Poor';
  return 'Extremely Poor';
}

/**
 * Categorize US AQI into a human-readable label.
 * Based on EPA thresholds.
 */
export function categorizeUsAqi(aqi: number | null): AirQualityCategory {
  if (aqi === null || aqi === undefined) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Fair';
  if (aqi <= 150) return 'Moderate';
  if (aqi <= 200) return 'Poor';
  if (aqi <= 300) return 'Very Poor';
  return 'Extremely Poor';
}

/**
 * Get a color for an AQI category (for UI display).
 */
export function getAqiColor(category: AirQualityCategory): string {
  switch (category) {
    case 'Good': return '#4ade80';
    case 'Fair': return '#a3e635';
    case 'Moderate': return '#facc15';
    case 'Poor': return '#fb923c';
    case 'Very Poor': return '#ef4444';
    case 'Extremely Poor': return '#7f1d1d';
    default: return '#6b7280';
  }
}

// ── Public API ────────────────────────────────────────────────

/**
 * Fetch air quality data for a location.
 * Returns current values and hourly forecast.
 */
export async function fetchAirQuality(
  latitude: number,
  longitude: number
): Promise<AirQualityResponse> {
  const lat = Number(latitude.toFixed(2));
  const lng = Number(longitude.toFixed(2));

  const raw = await queryOpenMeteo<RawAirQualityResponse>({
    endpoint: 'airQuality',
    params: {
      latitude: lat,
      longitude: lng,
      current: [
        'pm2_5', 'pm10', 'nitrogen_dioxide', 'ozone',
        'sulphur_dioxide', 'carbon_monoxide',
        'european_aqi', 'us_aqi',
      ].join(','),
      hourly: [
        'pm2_5', 'pm10', 'nitrogen_dioxide', 'ozone',
        'sulphur_dioxide', 'carbon_monoxide',
        'european_aqi', 'us_aqi',
      ].join(','),
      timezone: 'auto',
      forecast_hours: 48,
    },
  });

  const defaultCurrent: AirQualityData = {
    time: new Date().toISOString(),
    pm25: null, pm10: null, nitrogenDioxide: null,
    ozone: null, sulphurDioxide: null, carbonMonoxide: null,
    europeanAqi: null, usAqi: null,
  };

  const defaultHourly: AirQualityHourly = {
    time: [], pm25: [], pm10: [], nitrogenDioxide: [],
    ozone: [], sulphurDioxide: [], carbonMonoxide: [],
    europeanAqi: [], usAqi: [],
  };

  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone: raw.timezone,
    current: raw.current ? transformCurrent(raw.current) : defaultCurrent,
    hourly: raw.hourly ? transformHourly(raw.hourly) : defaultHourly,
    generationTime: raw.generationtime_ms,
    dataSource: 'open-meteo',
    fetchedAt: new Date().toISOString(),
  };
}
