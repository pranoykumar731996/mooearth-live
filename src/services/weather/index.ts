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
  GeographicFeatureType,
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
export {
  universalSearchLocations,
  classifyOsmFeature,
} from '../geocoding/universalGeocodingService';

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

// Global Grid Weather Layer
export {
  GLOBAL_GRID_STATIONS,
  fetchGlobalWeatherGrid,
  interpolateGridWeatherAt,
} from './globalGridService';
export type {
  GlobalGridStation,
  GlobalGridPointData,
  GlobalWeatherGridResponse,
} from './globalGridService';

// Weather Layer Registry
export {
  WEATHER_LAYER_REGISTRY,
  getWeatherLayerDefinition,
  getAllWeatherLayers,
  isCoordinateWithinLayerCoverage,
} from './layerRegistry';
export type {
  WeatherLayerDefinition,
  TemporalClassification,
  GeographicCoverage,
  LayerTimeHorizon,
  LayerLegend,
  LayerLegendStop,
} from './layerRegistry';

// Radar Provider Adapter
export {
  radarManager,
  NoaaMrmsRadarProvider,
  getActiveRadarMetadata,
  isLocationCoveredByRadar,
} from './radarAdapter';
export type {
  IRadarProvider,
  RadarFrame,
  RadarCoverageArea,
  RadarMetadataResponse,
} from './radarAdapter';

// Satellite Imagery Service (NASA GIBS & NOAA GOES)
export {
  SATELLITE_PRODUCTS,
  GEOSTATIONARY_SECTORS,
  getSatelliteObservationDate,
  getGeostationaryObservationDate,
  getGeostationarySectorForCoords,
  buildGibsTileUrl,
  buildSectorTileUrl,
  getSatelliteMetadata,
} from './satelliteImageryService';
export type {
  SatelliteProduct,
  GeostationarySector,
  SatelliteMetadataResponse,
} from './satelliteImageryService';

// Tropical Cyclone Tracking Service
export {
  OFFICIAL_CYCLONE_BASELINES,
  getSaffirSimpsonCategoryNumber,
  getTropicalCycloneStageName,
  computeForecastCone,
  getActiveTropicalCyclones,
  cycloneToWorldEvent,
  getActiveTropicalCyclonesAsEvents,
} from './cycloneTrackingService';
export type {
  TropicalCyclone,
  CycloneTrackWaypoint,
  CycloneForecastConeNode,
  CycloneFeedResponse,
} from './cycloneTrackingService';
// Solar & Local Location Time Service
export {
  getSolarPosition,
  getLocationTime,
} from './timeService';
export type {
  SolarPosition,
  LocationTimeResult,
} from './timeService';
