// ============================================================
// MooEarth Live — Weather Intelligence Platform Types
// ============================================================
// Strict type definitions for all Open-Meteo API integrations.
// Never fabricate weather data — all types mirror real API schemas.

// ── Unit System ───────────────────────────────────────────────

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'kmh' | 'ms' | 'mph' | 'kn';
export type PrecipitationUnit = 'mm' | 'inch';

export interface UnitPreferences {
  temperature: TemperatureUnit;
  windSpeed: WindSpeedUnit;
  precipitation: PrecipitationUnit;
}

export const DEFAULT_UNITS: UnitPreferences = {
  temperature: 'celsius',
  windSpeed: 'kmh',
  precipitation: 'mm',
};

// ── Geocoding ─────────────────────────────────────────────────

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone: string;
  country?: string;
  countryCode?: string;
  admin1?: string; // State/province
  admin2?: string; // County/district
  admin3?: string;
  population?: number;
  featureCode?: string;
}

export interface GeocodingResponse {
  results: GeocodingResult[];
  generationTime: number;
}

// ── Current Weather ───────────────────────────────────────────

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  cloudCover: number;
  surfacePressure: number;
  sealevelPressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  weatherCode: number;
  weatherDescription: string;
  weatherEmoji: string;
  isDay: boolean;
  visibility: number;
  uvIndex: number;
  time: string; // ISO 8601
}

// ── Hourly Forecast ───────────────────────────────────────────

export interface HourlyForecast {
  time: string[];
  temperature2m: number[];
  apparentTemperature: number[];
  relativeHumidity2m: number[];
  precipitation: number[];
  precipitationProbability: number[];
  rain: number[];
  snowfall: number[];
  cloudCover: number[];
  windSpeed10m: number[];
  windDirection10m: number[];
  windGusts10m: number[];
  weatherCode: number[];
  visibility: number[];
  surfacePressure: number[];
  uvIndex: number[];
  isDay: number[];
}

// ── Daily Forecast ────────────────────────────────────────────

export interface DailyForecast {
  time: string[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
  apparentTemperatureMax: number[];
  apparentTemperatureMin: number[];
  sunrise: string[];
  sunset: string[];
  precipitationSum: number[];
  precipitationProbabilityMax: number[];
  windSpeedMax: number[];
  windGustsMax: number[];
  windDirectionDominant: number[];
  uvIndexMax: number[];
}

// ── Full Forecast Response ────────────────────────────────────

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
  generationTime: number;
  dataSource: 'open-meteo';
  fetchedAt: string; // ISO timestamp of when we fetched
}

// ── Air Quality ───────────────────────────────────────────────

export interface AirQualityData {
  time: string;
  pm25: number | null;
  pm10: number | null;
  nitrogenDioxide: number | null;
  ozone: number | null;
  sulphurDioxide: number | null;
  carbonMonoxide: number | null;
  europeanAqi: number | null;
  usAqi: number | null;
}

export interface AirQualityHourly {
  time: string[];
  pm25: (number | null)[];
  pm10: (number | null)[];
  nitrogenDioxide: (number | null)[];
  ozone: (number | null)[];
  sulphurDioxide: (number | null)[];
  carbonMonoxide: (number | null)[];
  europeanAqi: (number | null)[];
  usAqi: (number | null)[];
}

export interface AirQualityResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: AirQualityData;
  hourly: AirQualityHourly;
  generationTime: number;
  dataSource: 'open-meteo';
  fetchedAt: string;
}

export type AirQualityCategory =
  | 'Good'
  | 'Fair'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Extremely Poor'
  | 'Unknown';

// ── Elevation ─────────────────────────────────────────────────

export interface ElevationResponse {
  latitude: number;
  longitude: number;
  elevation: number; // metres above sea level
  elevationFeet: number;
  dataSource: 'open-meteo';
  fetchedAt: string;
}

// ── Flood ─────────────────────────────────────────────────────

export interface FloodData {
  time: string[];
  riverDischarge: (number | null)[];
  riverDischargeMean: (number | null)[];
  riverDischargeMedian: (number | null)[];
  riverDischargeMax: (number | null)[];
  riverDischargeMin: (number | null)[];
  riverDischargeP25: (number | null)[];
  riverDischargeP75: (number | null)[];
}

export interface FloodResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: FloodData;
  generationTime: number;
  dataSource: 'open-meteo';
  fetchedAt: string;
  /** null means data unavailable — NOT "safe" */
  dataAvailable: boolean;
}

// ── Marine ────────────────────────────────────────────────────

export interface MarineCurrentData {
  time: string;
  waveHeight: number | null;
  waveDirection: number | null;
  wavePeriod: number | null;
  windWaveHeight: number | null;
  windWaveDirection: number | null;
  windWavePeriod: number | null;
  swellWaveHeight: number | null;
  swellWaveDirection: number | null;
  swellWavePeriod: number | null;
}

export interface MarineHourlyData {
  time: string[];
  waveHeight: (number | null)[];
  waveDirection: (number | null)[];
  wavePeriod: (number | null)[];
  windWaveHeight: (number | null)[];
  windWaveDirection: (number | null)[];
  windWavePeriod: (number | null)[];
  swellWaveHeight: (number | null)[];
  swellWaveDirection: (number | null)[];
  swellWavePeriod: (number | null)[];
}

export interface MarineDailyData {
  time: string[];
  waveHeightMax: (number | null)[];
  waveDirectionDominant: (number | null)[];
  wavePeriodMax: (number | null)[];
}

export interface MarineResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: MarineCurrentData | null;
  hourly: MarineHourlyData | null;
  daily: MarineDailyData | null;
  generationTime: number;
  dataSource: 'open-meteo';
  fetchedAt: string;
  /** false for inland locations where marine data is unavailable */
  dataAvailable: boolean;
}

// ── Weather Layer System ──────────────────────────────────────

export type WeatherLayerMode =
  | 'overview'
  | 'wind'
  | 'temperature'
  | 'precipitation'
  | 'air-quality'
  | 'flood'
  | 'marine'
  | 'elevation';

export interface WeatherLayerConfig {
  id: WeatherLayerMode;
  name: string;
  icon: string;
  description: string;
  requiresCoordinates: boolean;
  refreshIntervalMs: number;
}

export const WEATHER_LAYERS: WeatherLayerConfig[] = [
  { id: 'overview', name: 'Overview', icon: '🌤️', description: 'Current conditions & forecast', requiresCoordinates: true, refreshIntervalMs: 600_000 },
  { id: 'wind', name: 'Wind', icon: '💨', description: 'Wind speed, direction & gusts', requiresCoordinates: true, refreshIntervalMs: 600_000 },
  { id: 'temperature', name: 'Temperature', icon: '🌡️', description: 'Temperature & feels-like', requiresCoordinates: true, refreshIntervalMs: 600_000 },
  { id: 'precipitation', name: 'Rain & Precipitation', icon: '🌧️', description: 'Rainfall, snow & probability', requiresCoordinates: true, refreshIntervalMs: 600_000 },
  { id: 'air-quality', name: 'Air Quality', icon: '🫁', description: 'PM2.5, PM10, AQI & pollutants', requiresCoordinates: true, refreshIntervalMs: 1_800_000 },
  { id: 'flood', name: 'Flood Risk', icon: '🌊', description: 'River discharge forecasts', requiresCoordinates: true, refreshIntervalMs: 3_600_000 },
  { id: 'marine', name: 'Marine', icon: '⚓', description: 'Wave height, period & direction', requiresCoordinates: true, refreshIntervalMs: 1_800_000 },
  { id: 'elevation', name: 'Elevation', icon: '⛰️', description: 'Terrain altitude above sea level', requiresCoordinates: true, refreshIntervalMs: 86_400_000 },
];

// ── Shared Error / Loading Types ──────────────────────────────

export interface WeatherError {
  message: string;
  isTemporary: boolean;
  statusCode?: number;
}

export interface WeatherFetchState<T> {
  data: T | null;
  loading: boolean;
  error: WeatherError | null;
  lastUpdated: string | null;
}

// ── Selected Location ─────────────────────────────────────────

export interface SelectedWeatherLocation {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  timezone: string;
  source: 'search' | 'globe-click' | 'station' | 'url';
}

// ── Cache Metrics ─────────────────────────────────────────────

export interface CacheMetrics {
  hits: number;
  misses: number;
  entries: number;
  oldestEntry: string | null;
}
