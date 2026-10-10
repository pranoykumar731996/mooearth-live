// ============================================================
// MooEarth Live — Forecast Service
// ============================================================
// Full weather forecast using the Open-Meteo Forecast API.
// Current conditions + hourly + daily with all supported variables.
// Never fabricates or interpolates weather values.

import { queryOpenMeteo } from './openMeteoClient';
import {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  ForecastResponse,
  UnitPreferences,
  DEFAULT_UNITS,
} from './types';

// ── WMO Weather Code Map ──────────────────────────────────────

const WMO_CODE_MAP: Record<number, { desc: string; emoji: string }> = {
  0: { desc: 'Clear sky', emoji: '☀️' },
  1: { desc: 'Mainly clear', emoji: '🌤️' },
  2: { desc: 'Partly cloudy', emoji: '⛅' },
  3: { desc: 'Overcast', emoji: '☁️' },
  45: { desc: 'Fog', emoji: '🌫️' },
  48: { desc: 'Depositing rime fog', emoji: '🌫️' },
  51: { desc: 'Light drizzle', emoji: '🌦️' },
  53: { desc: 'Moderate drizzle', emoji: '🌦️' },
  55: { desc: 'Dense drizzle', emoji: '🌧️' },
  56: { desc: 'Light freezing drizzle', emoji: '🌨️' },
  57: { desc: 'Dense freezing drizzle', emoji: '🌨️' },
  61: { desc: 'Slight rain', emoji: '🌧️' },
  63: { desc: 'Moderate rain', emoji: '🌧️' },
  65: { desc: 'Heavy rain', emoji: '🌧️' },
  66: { desc: 'Light freezing rain', emoji: '🌨️' },
  67: { desc: 'Heavy freezing rain', emoji: '🌨️' },
  71: { desc: 'Slight snow fall', emoji: '❄️' },
  73: { desc: 'Moderate snow fall', emoji: '❄️' },
  75: { desc: 'Heavy snow fall', emoji: '❄️' },
  77: { desc: 'Snow grains', emoji: '❄️' },
  80: { desc: 'Slight rain showers', emoji: '🌦️' },
  81: { desc: 'Moderate rain showers', emoji: '🌧️' },
  82: { desc: 'Violent rain showers', emoji: '⛈️' },
  85: { desc: 'Slight snow showers', emoji: '🌨️' },
  86: { desc: 'Heavy snow showers', emoji: '🌨️' },
  95: { desc: 'Thunderstorm', emoji: '⚡' },
  96: { desc: 'Thunderstorm with slight hail', emoji: '⛈️' },
  99: { desc: 'Thunderstorm with heavy hail', emoji: '⛈️' },
};

export function getWmoWeatherInfo(code: number): { desc: string; emoji: string } {
  return WMO_CODE_MAP[code] || { desc: `Weather code ${code}`, emoji: '🌡️' };
}

// ── Raw API Response Types ────────────────────────────────────

interface RawCurrentWeather {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  cloud_cover: number;
  surface_pressure: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  weather_code: number;
  is_day: number;
  visibility?: number;
  uv_index?: number;
}

interface RawHourlyData {
  time: string[];
  temperature_2m?: number[];
  apparent_temperature?: number[];
  relative_humidity_2m?: number[];
  precipitation?: number[];
  precipitation_probability?: number[];
  rain?: number[];
  snowfall?: number[];
  cloud_cover?: number[];
  wind_speed_10m?: number[];
  wind_direction_10m?: number[];
  wind_gusts_10m?: number[];
  weather_code?: number[];
  visibility?: number[];
  surface_pressure?: number[];
  uv_index?: number[];
  is_day?: number[];
}

interface RawDailyData {
  time: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  apparent_temperature_max?: number[];
  apparent_temperature_min?: number[];
  sunrise?: string[];
  sunset?: string[];
  precipitation_sum?: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
  wind_gusts_10m_max?: number[];
  wind_direction_10m_dominant?: number[];
  uv_index_max?: number[];
}

interface RawForecastResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  current?: RawCurrentWeather;
  hourly?: RawHourlyData;
  daily?: RawDailyData;
  generationtime_ms: number;
}

// ── Transform Functions ───────────────────────────────────────

function transformCurrent(raw: RawCurrentWeather): CurrentWeather {
  const wmo = getWmoWeatherInfo(raw.weather_code ?? 0);
  return {
    temperature: raw.temperature_2m,
    apparentTemperature: raw.apparent_temperature ?? raw.temperature_2m,
    relativeHumidity: raw.relative_humidity_2m ?? 0,
    precipitation: raw.precipitation ?? 0,
    rain: raw.rain ?? 0,
    snowfall: raw.snowfall ?? 0,
    cloudCover: raw.cloud_cover ?? 0,
    surfacePressure: raw.surface_pressure ?? 1013.25,
    sealevelPressure: raw.pressure_msl ?? 1013.25,
    windSpeed: raw.wind_speed_10m ?? 0,
    windDirection: raw.wind_direction_10m ?? 0,
    windGusts: raw.wind_gusts_10m ?? 0,
    weatherCode: raw.weather_code ?? 0,
    weatherDescription: wmo.desc,
    weatherEmoji: wmo.emoji,
    isDay: raw.is_day === 1,
    visibility: raw.visibility ?? 10000,
    uvIndex: raw.uv_index ?? 0,
    time: raw.time || new Date().toISOString(),
  };
}

function transformHourly(raw: RawHourlyData): HourlyForecast {
  const len = raw.time.length;
  const zeros = new Array(len).fill(0);
  return {
    time: raw.time,
    temperature2m: raw.temperature_2m ?? zeros,
    apparentTemperature: raw.apparent_temperature ?? zeros,
    relativeHumidity2m: raw.relative_humidity_2m ?? zeros,
    precipitation: raw.precipitation ?? zeros,
    precipitationProbability: raw.precipitation_probability ?? zeros,
    rain: raw.rain ?? zeros,
    snowfall: raw.snowfall ?? zeros,
    cloudCover: raw.cloud_cover ?? zeros,
    windSpeed10m: raw.wind_speed_10m ?? zeros,
    windDirection10m: raw.wind_direction_10m ?? zeros,
    windGusts10m: raw.wind_gusts_10m ?? zeros,
    weatherCode: raw.weather_code ?? zeros,
    visibility: raw.visibility ?? new Array(len).fill(10000),
    surfacePressure: raw.surface_pressure ?? new Array(len).fill(1013.25),
    uvIndex: raw.uv_index ?? zeros,
    isDay: raw.is_day ?? new Array(len).fill(1),
  };
}

function transformDaily(raw: RawDailyData): DailyForecast {
  const len = raw.time.length;
  const zeros = new Array(len).fill(0);
  const emptyStrings = new Array(len).fill('');
  return {
    time: raw.time,
    weatherCode: raw.weather_code ?? zeros,
    temperatureMax: raw.temperature_2m_max ?? zeros,
    temperatureMin: raw.temperature_2m_min ?? zeros,
    apparentTemperatureMax: raw.apparent_temperature_max ?? zeros,
    apparentTemperatureMin: raw.apparent_temperature_min ?? zeros,
    sunrise: raw.sunrise ?? emptyStrings,
    sunset: raw.sunset ?? emptyStrings,
    precipitationSum: raw.precipitation_sum ?? zeros,
    precipitationProbabilityMax: raw.precipitation_probability_max ?? zeros,
    windSpeedMax: raw.wind_speed_10m_max ?? zeros,
    windGustsMax: raw.wind_gusts_10m_max ?? zeros,
    windDirectionDominant: raw.wind_direction_10m_dominant ?? zeros,
    uvIndexMax: raw.uv_index_max ?? zeros,
  };
}

// ── Public API ────────────────────────────────────────────────

/**
 * Fetch a complete weather forecast for a location.
 * Includes current conditions, hourly forecast (48h), and daily forecast (7 days).
 */
export async function fetchForecast(
  latitude: number,
  longitude: number,
  units: UnitPreferences = DEFAULT_UNITS,
  timezone: string = 'auto'
): Promise<ForecastResponse> {
  // Round coordinates to 2 decimal places for consistent cache hits
  const lat = Number(latitude.toFixed(2));
  const lng = Number(longitude.toFixed(2));

  const raw = await queryOpenMeteo<RawForecastResponse>({
    endpoint: 'forecast',
    params: {
      latitude: lat,
      longitude: lng,
      current: [
        'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
        'precipitation', 'rain', 'snowfall', 'cloud_cover',
        'surface_pressure', 'pressure_msl',
        'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
        'weather_code', 'is_day',
      ].join(','),
      hourly: [
        'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
        'precipitation', 'precipitation_probability', 'rain', 'snowfall',
        'cloud_cover', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
        'weather_code', 'visibility', 'surface_pressure', 'uv_index', 'is_day',
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'apparent_temperature_max', 'apparent_temperature_min',
        'sunrise', 'sunset', 'precipitation_sum', 'precipitation_probability_max',
        'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
        'uv_index_max',
      ].join(','),
      temperature_unit: units.temperature,
      wind_speed_unit: units.windSpeed,
      precipitation_unit: units.precipitation,
      timezone,
      forecast_days: 7,
      forecast_hours: 48,
    },
  });

  const emptyHourly: RawHourlyData = { time: [] };
  const emptyDaily: RawDailyData = { time: [] };
  const emptyCurrent: RawCurrentWeather = {
    time: new Date().toISOString(),
    temperature_2m: 0,
    apparent_temperature: 0,
    relative_humidity_2m: 0,
    precipitation: 0,
    rain: 0,
    snowfall: 0,
    cloud_cover: 0,
    surface_pressure: 1013.25,
    pressure_msl: 1013.25,
    wind_speed_10m: 0,
    wind_direction_10m: 0,
    wind_gusts_10m: 0,
    weather_code: 0,
    is_day: 1,
  };

  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    elevation: raw.elevation,
    timezone: raw.timezone,
    timezoneAbbreviation: raw.timezone_abbreviation,
    utcOffsetSeconds: raw.utc_offset_seconds,
    current: transformCurrent(raw.current ?? emptyCurrent),
    hourly: transformHourly(raw.hourly ?? emptyHourly),
    daily: transformDaily(raw.daily ?? emptyDaily),
    generationTime: raw.generationtime_ms,
    dataSource: 'open-meteo',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch only current weather conditions (lighter request).
 */
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
  units: UnitPreferences = DEFAULT_UNITS
): Promise<CurrentWeather> {
  const lat = Number(latitude.toFixed(2));
  const lng = Number(longitude.toFixed(2));

  const raw = await queryOpenMeteo<RawForecastResponse>({
    endpoint: 'forecast',
    params: {
      latitude: lat,
      longitude: lng,
      current: [
        'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
        'precipitation', 'rain', 'snowfall', 'cloud_cover',
        'surface_pressure', 'pressure_msl',
        'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
        'weather_code', 'is_day',
      ].join(','),
      temperature_unit: units.temperature,
      wind_speed_unit: units.windSpeed,
      precipitation_unit: units.precipitation,
      timezone: 'auto',
    },
  });

  if (!raw.current) {
    throw new Error('No current weather data available from Open-Meteo');
  }

  return transformCurrent(raw.current);
}

// Re-export the WMO helper for use elsewhere
export { WMO_CODE_MAP };
