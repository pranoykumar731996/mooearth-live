// ============================================================
// MooEarth Live — Weather Layer Registry
// ============================================================
// Complete, typed metadata registry for all meteorological layers.
// Governs data provider attribution, licensing terms, geographic coverage,
// temporal classification (historical observation vs numerical forecast),
// units, scales, and timeline behavior.
//
// Strictly enforces "Truth in Weather":
// - Never represents forecast precipitation as observed radar.
// - Accurately documents regional radar bounds (NOAA NEXRAD/MRMS for CONUS).
// - Preserves verified open licenses (CC BY 4.0, Public Domain 17 U.S.C. § 105).

import type { WeatherLayerMode } from './types';

export type TemporalClassification = 'historical_observation' | 'forecast_model' | 'synoptic_analysis';

export type GeographicCoverage = 'global' | 'regional_conus' | 'marine' | 'terrestrial';

export interface LayerTimeHorizon {
  /** Number of hours of past observational data available (e.g. 2 for radar) */
  pastHours: number;
  /** Number of hours of future forecast horizon available (e.g. 168 for 7 days) */
  futureHours: number;
  /** Interval in minutes between scrubber frames (e.g. 10m for radar, 60m for forecast) */
  stepMinutes: number;
  /** Scrubber index representing "now" or "live observation" */
  liveIndex: number;
}

export interface LayerLegendStop {
  value: number | string;
  label: string;
  color: string;
}

export interface LayerLegend {
  title: string;
  subtitle?: string;
  unitsLabel: string;
  stops: LayerLegendStop[];
}

export interface WeatherLayerDefinition {
  id: WeatherLayerMode;
  name: string;
  shortName: string;
  icon: string;
  category: 'primary' | 'atmospheric' | 'severe' | 'oceanic' | 'environmental';
  provider: string;
  providerUrl: string;
  license: string;
  licenseUrl?: string;
  temporalMode: TemporalClassification;
  coverage: GeographicCoverage;
  coverageDescription: string;
  /** Bounding boxes [minLng, minLat, maxLng, maxLat] where data exists (if regional) */
  coverageBounds?: [number, number, number, number][];
  timeHorizon: LayerTimeHorizon;
  refreshIntervalMs: number;
  dataFreshnessCadence: string;
  supportsAnimation: boolean;
  supportsPlayback: boolean;
  requiresCoordinates: boolean;
  units: {
    default: string;
    available: string[];
  };
  legend: LayerLegend;
  description: string;
  disclaimer?: string;
}

export const WEATHER_LAYER_REGISTRY: Record<WeatherLayerMode, WeatherLayerDefinition> = {
  wind: {
    id: 'wind',
    name: 'Wind Streamlines',
    shortName: 'Wind',
    icon: '💨',
    category: 'primary',
    provider: 'Open-Meteo GFS / ECMWF',
    providerUrl: 'https://open-meteo.com',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    temporalMode: 'forecast_model',
    coverage: 'global',
    coverageDescription: 'Worldwide planetary coverage at 2.5° grid resolution.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 168,
      stepMinutes: 60,
      liveIndex: 0,
    },
    refreshIntervalMs: 600_000,
    dataFreshnessCadence: 'Updated every 6 hours with latest GFS/ECMWF model cycles.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: true,
    units: {
      default: 'kmh',
      available: ['kmh', 'kn', 'ms', 'mph'],
    },
    legend: {
      title: 'Wind Speed',
      unitsLabel: 'km/h',
      stops: [
        { value: 0, label: '0', color: '#00e5ff' },
        { value: 15, label: '15', color: '#10b981' },
        { value: 30, label: '30', color: '#facc15' },
        { value: 50, label: '50', color: '#f97316' },
        { value: 70, label: '70+', color: '#ef4444' },
      ],
    },
    description: 'Dynamic wind streamlines advected along real U/V atmospheric vector fields at 10m altitude.',
  },

  satellite: {
    id: 'satellite',
    name: 'Satellite Observations',
    shortName: 'Satellite',
    icon: '🛰️',
    category: 'primary',
    provider: 'NASA GIBS & NOAA GOES',
    providerUrl: 'https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs',
    license: 'NASA Earth Science Open Data / Public Domain (US Gov 17 U.S.C. § 105)',
    licenseUrl: 'https://earthdata.nasa.gov/collaborate/open-data-services-and-software/data-information-policy',
    temporalMode: 'historical_observation',
    coverage: 'global',
    coverageDescription: 'Global polar-orbiting composites (NASA MODIS/VIIRS) & Geostationary Full-Disk (NOAA GOES-16/18).',
    timeHorizon: {
      pastHours: 2,
      futureHours: 0,
      stepMinutes: 10,
      liveIndex: 12,
    },
    refreshIntervalMs: 600_000,
    dataFreshnessCadence: 'Refreshed every 10–15 minutes for GOES; daily for MODIS/VIIRS true-color composites.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: false,
    units: {
      default: 'kelvin',
      available: ['kelvin', 'celsius'],
    },
    legend: {
      title: 'Cloud-Top Infrared Temperature',
      subtitle: 'Thermal Brightness',
      unitsLabel: 'K',
      stops: [
        { value: 265, label: '265K', color: '#d9e2ec' },
        { value: 245, label: '245K', color: '#0ea5e9' },
        { value: 230, label: '230K', color: '#10b981' },
        { value: 215, label: '215K', color: '#f59e0b' },
        { value: 200, label: '200K', color: '#ef4444' },
        { value: 190, label: '<195K', color: '#a855f7' },
      ],
    },
    description: 'Genuine geostationary and polar-orbiting spectral imagery (Visible, Infrared, and Water Vapor) from official space agencies.',
    disclaimer: 'Actual observation data with verified UTC timestamps. Cloud structures reflect real sensor acquisitions.',
  },

  radar: {
    id: 'radar',
    name: 'Doppler Weather Radar (North America)',
    shortName: 'Radar',
    icon: '📡',
    category: 'primary',
    provider: 'NOAA NEXRAD / MRMS',
    providerUrl: 'https://www.nssl.noaa.gov/projects/mrms/',
    license: 'Public Domain (US Government work, 17 U.S.C. § 105)',
    licenseUrl: 'https://www.weather.gov/disclaimer',
    temporalMode: 'historical_observation',
    coverage: 'regional_conus',
    coverageDescription: 'Continental United States, Alaska, Hawaii, Puerto Rico, and southern border corridors.',
    coverageBounds: [
      [-128.0, 24.0, -66.0, 50.0], // CONUS
      [-170.0, 52.0, -130.0, 72.0], // Alaska
      [-161.0, 18.0, -154.0, 23.0], // Hawaii
      [-68.0, 17.5, -65.0, 19.0], // Puerto Rico
    ],
    timeHorizon: {
      pastHours: 2,
      futureHours: 0,
      stepMinutes: 10,
      liveIndex: 12,
    },
    refreshIntervalMs: 300_000,
    dataFreshnessCadence: 'Refreshed every 5–10 minutes from NOAA ground Doppler radar stations.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: false,
    units: {
      default: 'dBZ',
      available: ['dBZ'],
    },
    legend: {
      title: 'Doppler Base Reflectivity',
      subtitle: 'Observed Radar Echo',
      unitsLabel: 'dBZ',
      stops: [
        { value: 15, label: '15 dBZ', color: '#04e9e7' },
        { value: 25, label: '25 dBZ', color: '#019ff4' },
        { value: 35, label: '35 dBZ', color: '#0300f4' },
        { value: 45, label: '45 dBZ', color: '#02fd02' },
        { value: 55, label: '55 dBZ', color: '#e7c000' },
        { value: 65, label: '65+ dBZ', color: '#d70000' },
      ],
    },
    description: 'Official composite Doppler radar reflectivity from the NOAA MRMS/NEXRAD terrestrial network.',
    disclaimer: 'Terrestrial radar coverage is available strictly where physical ground radar installations operate (North America). Ground radar physically does not exist over open oceans.',
  },

  precipitation: {
    id: 'precipitation',
    name: 'Precipitation Forecast',
    shortName: 'Rain, thunder',
    icon: '⛈️',
    category: 'primary',
    provider: 'Open-Meteo NWP (GFS / ECMWF)',
    providerUrl: 'https://open-meteo.com',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    temporalMode: 'forecast_model',
    coverage: 'global',
    coverageDescription: 'Worldwide planetary coverage from numerical weather prediction models.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 168,
      stepMinutes: 60,
      liveIndex: 0,
    },
    refreshIntervalMs: 600_000,
    dataFreshnessCadence: 'Updated every 6 hours with latest numerical model runs.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: true,
    units: {
      default: 'mm',
      available: ['mm', 'inch'],
    },
    legend: {
      title: 'Precipitation Rate',
      subtitle: 'Numerical Model Forecast',
      unitsLabel: 'mm/h',
      stops: [
        { value: 0, label: '0', color: 'transparent' },
        { value: 0.5, label: '0.5', color: '#34d399' },
        { value: 2.0, label: '2.0', color: '#06b6d4' },
        { value: 6.0, label: '6.0', color: '#2563eb' },
        { value: 15.0, label: '15', color: '#9333ea' },
        { value: 30.0, label: '30+', color: '#f43f5e' },
      ],
    },
    description: 'Planetary liquid rain, snowfall, and convective precipitation forecasts derived from ECMWF and GFS numerical models.',
    disclaimer: 'Explicitly classified as a numerical forecast. This layer does not represent live Doppler radar observations.',
  },

  temperature: {
    id: 'temperature',
    name: 'Temperature & Heatmap',
    shortName: 'Temperature',
    icon: '🌡️',
    category: 'atmospheric',
    provider: 'Open-Meteo GFS / ECMWF',
    providerUrl: 'https://open-meteo.com',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    temporalMode: 'forecast_model',
    coverage: 'global',
    coverageDescription: 'Worldwide 2m surface air temperature.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 168,
      stepMinutes: 60,
      liveIndex: 0,
    },
    refreshIntervalMs: 600_000,
    dataFreshnessCadence: 'Updated every 6 hours.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: true,
    units: {
      default: 'celsius',
      available: ['celsius', 'fahrenheit'],
    },
    legend: {
      title: 'Air Temperature (2m)',
      unitsLabel: '°C',
      stops: [
        { value: -30, label: '-30°C', color: '#7c3aed' },
        { value: -10, label: '-10°C', color: '#0284c7' },
        { value: 0, label: '0°C', color: '#38bdf8' },
        { value: 15, label: '15°C', color: '#84cc16' },
        { value: 25, label: '25°C', color: '#f59e0b' },
        { value: 35, label: '35°C', color: '#ea580c' },
        { value: 45, label: '45°C+', color: '#dc2626' },
      ],
    },
    description: 'Global 2-meter air temperature and apparent (feels-like) temperature heatmaps.',
  },

  pressure: {
    id: 'pressure',
    name: 'Mean Sea Level Pressure (MSLP)',
    shortName: 'Pressure',
    icon: '🔵',
    category: 'atmospheric',
    provider: 'Open-Meteo GFS / ECMWF',
    providerUrl: 'https://open-meteo.com',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    temporalMode: 'forecast_model',
    coverage: 'global',
    coverageDescription: 'Worldwide planetary coverage with synoptic 4 hPa isobar contours and High/Low pressure centers.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 168,
      stepMinutes: 60,
      liveIndex: 0,
    },
    refreshIntervalMs: 600_000,
    dataFreshnessCadence: 'Updated every 6 hours with GFS/ECMWF model cycles.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: false,
    units: {
      default: 'hPa',
      available: ['hPa', 'inHg', 'mmHg'],
    },
    legend: {
      title: 'Atmospheric Pressure',
      unitsLabel: 'hPa',
      stops: [
        { value: 980, label: '980 (Deep Low)', color: '#991b1b' },
        { value: 996, label: '996 (Low)', color: '#f43f5e' },
        { value: 1013, label: '1013 (Standard)', color: '#94a3b8' },
        { value: 1024, label: '1024 (High)', color: '#00e5ff' },
        { value: 1040, label: '1040+ (Strong High)', color: '#38bdf8' },
      ],
    },
    description: 'Mean sea level barometric pressure (MSLP) with 4 hPa synoptic isobars and planetary High (H) / Low (L) pressure centers.',
  },

  hurricane: {
    id: 'hurricane',
    name: 'Tropical Cyclones & Severe Storms',
    shortName: 'Cyclone Tracker',
    icon: '🌀',
    category: 'severe',
    provider: 'NOAA NHC / JTWC / IMD',
    providerUrl: 'https://www.nhc.noaa.gov',
    license: 'Public Domain & WMO Open Data',
    temporalMode: 'historical_observation',
    coverage: 'global',
    coverageDescription: 'Oceanic tropical cyclone basins (Atlantic, East Pacific, West Pacific, North Indian Ocean, Southern Hemisphere).',
    timeHorizon: {
      pastHours: 24,
      futureHours: 120, // 5-day forecast cone
      stepMinutes: 180,
      liveIndex: 8,
    },
    refreshIntervalMs: 600_000,
    dataFreshnessCadence: 'Advisories published every 3–6 hours during active tropical depressions, storms, and hurricanes.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: false,
    units: {
      default: 'kmh',
      available: ['kmh', 'kn', 'mph'],
    },
    legend: {
      title: 'Saffir-Simpson Scale',
      unitsLabel: 'Category',
      stops: [
        { value: 'TD', label: 'Depression (<63 km/h)', color: '#38bdf8' },
        { value: 'TS', label: 'Storm (63–118 km/h)', color: '#34d399' },
        { value: 'Cat 1', label: 'Cat 1 (119–153 km/h)', color: '#facc15' },
        { value: 'Cat 2', label: 'Cat 2 (154–177 km/h)', color: '#fb923c' },
        { value: 'Cat 3', label: 'Cat 3 (178–208 km/h)', color: '#f87171' },
        { value: 'Cat 4', label: 'Cat 4 (209–251 km/h)', color: '#ef4444' },
        { value: 'Cat 5', label: 'Cat 5 (>252 km/h)', color: '#b91c1c' },
      ],
    },
    description: 'Real-time tropical cyclone tracking, vortex wind field dynamics, central barometric pressure, and official 5-day cone of uncertainty.',
  },

  clouds: {
    id: 'clouds',
    name: 'Cloud Cover Fraction',
    shortName: 'Clouds',
    icon: '☁️',
    category: 'atmospheric',
    provider: 'Open-Meteo GFS / ECMWF',
    providerUrl: 'https://open-meteo.com',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    temporalMode: 'forecast_model',
    coverage: 'global',
    coverageDescription: 'Worldwide total, low, mid, and high altitude cloud cover fraction.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 168,
      stepMinutes: 60,
      liveIndex: 0,
    },
    refreshIntervalMs: 600_000,
    dataFreshnessCadence: 'Updated every 6 hours.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: true,
    units: {
      default: '%',
      available: ['%'],
    },
    legend: {
      title: 'Total Cloud Cover',
      unitsLabel: '%',
      stops: [
        { value: 0, label: '0%', color: 'transparent' },
        { value: 25, label: '25%', color: 'rgba(255,255,255,0.25)' },
        { value: 50, label: '50%', color: 'rgba(255,255,255,0.50)' },
        { value: 75, label: '75%', color: 'rgba(255,255,255,0.75)' },
        { value: 100, label: '100%', color: '#ffffff' },
      ],
    },
    description: 'Model-derived total cloud fraction covering low stratus, mid-level altocumulus, and high cirrus cloud sheets.',
  },

  marine: {
    id: 'marine',
    name: 'Ocean Waves & Swell',
    shortName: 'Waves',
    icon: '🌊',
    category: 'oceanic',
    provider: 'Open-Meteo Marine / Copernicus Marine',
    providerUrl: 'https://marine.copernicus.eu',
    license: 'Open Data (Copernicus / CC BY 4.0)',
    temporalMode: 'forecast_model',
    coverage: 'marine',
    coverageDescription: 'Planetary oceans, coastal seas, and maritime basins.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 168,
      stepMinutes: 60,
      liveIndex: 0,
    },
    refreshIntervalMs: 1_800_000,
    dataFreshnessCadence: 'Updated every 12 hours from oceanic wave-action models.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: true,
    units: {
      default: 'm',
      available: ['m', 'ft'],
    },
    legend: {
      title: 'Significant Wave Height',
      unitsLabel: 'm',
      stops: [
        { value: 0.5, label: '0.5m (Calm)', color: '#06b6d4' },
        { value: 1.5, label: '1.5m (Slight)', color: '#10b981' },
        { value: 3.0, label: '3.0m (Moderate)', color: '#f59e0b' },
        { value: 5.0, label: '5.0m (Rough)', color: '#f97316' },
        { value: 8.0, label: '8.0m (Very Rough)', color: '#ef4444' },
        { value: 12.0, label: '12m+ (Phenomenal)', color: '#a855f7' },
      ],
    },
    description: 'Significant wave height, primary swell direction, swell period (seconds), and oceanic surface currents.',
  },

  waves: {
    id: 'waves',
    name: 'Ocean Waves & Swell',
    shortName: 'Waves',
    icon: '🌊',
    category: 'oceanic',
    provider: 'Open-Meteo Marine / Copernicus Marine',
    providerUrl: 'https://marine.copernicus.eu',
    license: 'Open Data (Copernicus / CC BY 4.0)',
    temporalMode: 'forecast_model',
    coverage: 'marine',
    coverageDescription: 'Planetary oceans, coastal seas, and maritime basins.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 168,
      stepMinutes: 60,
      liveIndex: 0,
    },
    refreshIntervalMs: 1_800_000,
    dataFreshnessCadence: 'Updated every 12 hours from oceanic wave-action models.',
    supportsAnimation: true,
    supportsPlayback: true,
    requiresCoordinates: true,
    units: {
      default: 'm',
      available: ['m', 'ft'],
    },
    legend: {
      title: 'Significant Wave Height',
      unitsLabel: 'm',
      stops: [
        { value: 0.5, label: '0.5m (Calm)', color: '#06b6d4' },
        { value: 1.5, label: '1.5m (Slight)', color: '#10b981' },
        { value: 3.0, label: '3.0m (Moderate)', color: '#f59e0b' },
        { value: 5.0, label: '5.0m (Rough)', color: '#f97316' },
        { value: 8.0, label: '8.0m (Very Rough)', color: '#ef4444' },
        { value: 12.0, label: '12m+ (Phenomenal)', color: '#a855f7' },
      ],
    },
    description: 'Significant wave height, primary swell direction, swell period (seconds), and oceanic surface currents.',
  },

  'air-quality': {
    id: 'air-quality',
    name: 'Air Quality & Pollutants',
    shortName: 'Air Quality',
    icon: '🫁',
    category: 'environmental',
    provider: 'Copernicus Atmosphere Monitoring Service (CAMS)',
    providerUrl: 'https://atmosphere.copernicus.eu',
    license: 'Open Data (Copernicus)',
    temporalMode: 'forecast_model',
    coverage: 'global',
    coverageDescription: 'Worldwide atmospheric aerosol and gaseous concentration models.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 120,
      stepMinutes: 60,
      liveIndex: 0,
    },
    refreshIntervalMs: 1_800_000,
    dataFreshnessCadence: 'Updated every 12 hours.',
    supportsAnimation: false,
    supportsPlayback: true,
    requiresCoordinates: true,
    units: {
      default: 'US AQI',
      available: ['US AQI', 'European AQI'],
    },
    legend: {
      title: 'Air Quality Index',
      unitsLabel: 'US AQI',
      stops: [
        { value: 50, label: 'Good (0–50)', color: '#10b981' },
        { value: 100, label: 'Moderate (51–100)', color: '#facc15' },
        { value: 150, label: 'Unhealthy (Sens.)', color: '#fb923c' },
        { value: 200, label: 'Unhealthy', color: '#ef4444' },
        { value: 300, label: 'Very Unhealthy', color: '#a855f7' },
        { value: 500, label: 'Hazardous (300+)', color: '#7f1d1d' },
      ],
    },
    description: 'Surface concentrations of PM2.5, PM10, nitrogen dioxide, sulphur dioxide, carbon monoxide, and ozone.',
  },

  overview: {
    id: 'overview',
    name: 'Comprehensive Weather Overview',
    shortName: 'Overview',
    icon: '🌤️',
    category: 'primary',
    provider: 'Open-Meteo Global Synthesis',
    providerUrl: 'https://open-meteo.com',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    temporalMode: 'forecast_model',
    coverage: 'global',
    coverageDescription: 'Worldwide multi-parameter synthesis.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 168,
      stepMinutes: 60,
      liveIndex: 0,
    },
    refreshIntervalMs: 600_000,
    dataFreshnessCadence: 'Hourly synthesis.',
    supportsAnimation: false,
    supportsPlayback: true,
    requiresCoordinates: true,
    units: {
      default: 'celsius',
      available: ['celsius', 'fahrenheit'],
    },
    legend: {
      title: 'Weather Overview',
      unitsLabel: 'Conditions',
      stops: [
        { value: 0, label: 'Clear', color: '#38bdf8' },
        { value: 3, label: 'Cloudy', color: '#94a3b8' },
        { value: 63, label: 'Rain', color: '#3b82f6' },
        { value: 73, label: 'Snow', color: '#e2e8f0' },
        { value: 95, label: 'Thunder', color: '#f59e0b' },
      ],
    },
    description: 'Multi-parameter synoptic overview showing temperature, wind, humidity, pressure, and UV index.',
  },

  flood: {
    id: 'flood',
    name: 'River Discharge & Flood Risk',
    shortName: 'Flood',
    icon: '🌊',
    category: 'environmental',
    provider: 'Copernicus GloFAS / Open-Meteo',
    providerUrl: 'https://www.globalfloods.eu',
    license: 'Copernicus Open Access',
    temporalMode: 'forecast_model',
    coverage: 'terrestrial',
    coverageDescription: 'Worldwide river basin hydrological networks.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 168,
      stepMinutes: 1440, // Daily steps
      liveIndex: 0,
    },
    refreshIntervalMs: 3_600_000,
    dataFreshnessCadence: 'Updated daily with GloFAS river discharge runs.',
    supportsAnimation: false,
    supportsPlayback: false,
    requiresCoordinates: true,
    units: {
      default: 'm³/s',
      available: ['m³/s'],
    },
    legend: {
      title: 'River Discharge Magnitude',
      unitsLabel: 'm³/s',
      stops: [
        { value: 10, label: 'Very Low', color: '#94a3b8' },
        { value: 100, label: 'Low', color: '#38bdf8' },
        { value: 1000, label: 'Moderate', color: '#10b981' },
        { value: 5000, label: 'High', color: '#f59e0b' },
        { value: 10000, label: 'Very High', color: '#ef4444' },
      ],
    },
    description: 'River discharge volume forecasts and flood probability percentiles from the Global Flood Awareness System (GloFAS).',
  },

  elevation: {
    id: 'elevation',
    name: 'Topographic Elevation (DEM)',
    shortName: 'Elevation',
    icon: '⛰️',
    category: 'environmental',
    provider: 'Copernicus DEM (90m resolution)',
    providerUrl: 'https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model',
    license: 'Copernicus Open Access',
    temporalMode: 'synoptic_analysis',
    coverage: 'global',
    coverageDescription: 'Global terrain elevation model above sea level.',
    timeHorizon: {
      pastHours: 0,
      futureHours: 0,
      stepMinutes: 0,
      liveIndex: 0,
    },
    refreshIntervalMs: 86_400_000,
    dataFreshnessCadence: 'Static high-precision topographic dataset.',
    supportsAnimation: false,
    supportsPlayback: false,
    requiresCoordinates: true,
    units: {
      default: 'm',
      available: ['m', 'ft'],
    },
    legend: {
      title: 'Terrain Altitude',
      unitsLabel: 'm',
      stops: [
        { value: 0, label: 'Sea Level (0m)', color: '#0284c7' },
        { value: 200, label: 'Plains (200m)', color: '#10b981' },
        { value: 1000, label: 'Highlands (1000m)', color: '#f59e0b' },
        { value: 2500, label: 'Mountains (2500m)', color: '#b45309' },
        { value: 5000, label: 'High Alpine (5000m+)', color: '#ffffff' },
      ],
    },
    description: 'High-precision digital elevation model showing terrain altitude above mean sea level.',
  },
};

/**
 * Get definition for a specific weather layer
 */
export function getWeatherLayerDefinition(mode: WeatherLayerMode): WeatherLayerDefinition {
  return WEATHER_LAYER_REGISTRY[mode] || WEATHER_LAYER_REGISTRY.wind;
}

/**
 * Returns all weather layers as an array sorted by category
 */
export function getAllWeatherLayers(): WeatherLayerDefinition[] {
  return Object.values(WEATHER_LAYER_REGISTRY);
}

/**
 * Returns whether a coordinate falls within a layer's supported coverage bounds
 */
export function isCoordinateWithinLayerCoverage(
  mode: WeatherLayerMode,
  lat: number,
  lng: number
): boolean {
  const layer = getWeatherLayerDefinition(mode);
  if (layer.coverage === 'global') return true;

  if (layer.coverage === 'regional_conus') {
    if (!layer.coverageBounds || layer.coverageBounds.length === 0) {
      return lng >= -128 && lng <= -66 && lat >= 24 && lat <= 50;
    }
    return layer.coverageBounds.some(([minLng, minLat, maxLng, maxLat]) => {
      return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
    });
  }

  // Marine layers are available across maritime waters
  return true;
}
