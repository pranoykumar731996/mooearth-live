// ============================================================
// MooEarth Live — Weather Services Barrel Export
// ============================================================
// Single import point for all weather-related services.

// Types
export type {
  TemperatureUnit,
  WindSpeedUnit,
  PrecipitationUnit,
  UnitPreferences,
  GeocodingResult,
  GeocodingResponse,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  ForecastResponse,
  AirQualityData,
  AirQualityHourly,
  AirQualityResponse,
  AirQualityCategory,
  ElevationResponse,
  FloodData,
  FloodResponse,
  MarineCurrentData,
  MarineHourlyData,
  MarineDailyData,
  MarineResponse,
  WeatherLayerMode,
  WeatherLayerConfig,
  WeatherError,
  WeatherFetchState,
  SelectedWeatherLocation,
  CacheMetrics,
} from './types';

export { DEFAULT_UNITS, WEATHER_LAYERS } from './types';

// Client
export {
  queryOpenMeteo,
  getCacheMetrics,
  getEndpointUrl,
  isCommercialPlan,
  clearWeatherCache,
} from './openMeteoClient';

// Forecast
export {
  fetchForecast,
  fetchCurrentWeather,
  getWmoWeatherInfo,
  WMO_CODE_MAP,
} from './forecastService';

// Geocoding
export {
  searchLocations,
  formatLocationName,
} from './geocodingService';

// Air Quality
export {
  fetchAirQuality,
  categorizeEuropeanAqi,
  categorizeUsAqi,
  getAqiColor,
} from './airQualityService';

// Elevation
export {
  fetchElevation,
  formatElevation,
} from './elevationService';

// Flood
export {
  fetchFloodData,
  describeDischarge,
} from './floodService';

// Marine
export {
  fetchMarineWeather,
  describeWaveConditions,
  waveDirectionToCompass,
} from './marineService';
