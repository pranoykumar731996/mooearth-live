// ============================================================
// MooEarth Live — Weather Layers Barrel Export
// ============================================================

export { WindParticleSystem, getWindColor, geoToVector3 } from './WindParticleSystem';
export type { WindParticleSystemOptions } from './WindParticleSystem';

export { TemperatureHeatmapLayer, getThermalColorRgb } from './TemperatureHeatmapLayer';
export type { TemperatureLayerOptions } from './TemperatureHeatmapLayer';

export { PrecipitationLayer, getPrecipitationColorRgb } from './PrecipitationLayer';
export type { PrecipitationLayerOptions } from './PrecipitationLayer';

export { CycloneVortexLayer, getSaffirSimpsonColor, getCycloneCategoryLabel, BASELINE_CYCLONE_EVENTS } from './CycloneVortexLayer';
export type { CycloneVortexLayerOptions } from './CycloneVortexLayer';

import { WorldEvent } from '@/types';

export { SeismicShockwaveLayer, getFocalDepthColor, getFocalDepthLabel, getRichterCategoryLabel, BASELINE_SEISMIC_EVENTS } from './SeismicShockwaveLayer';
export type { SeismicShockwaveLayerOptions } from './SeismicShockwaveLayer';

export { LightningNetworkLayer, BASELINE_LIGHTNING_EVENTS } from './LightningNetworkLayer';
export type { LightningNetworkLayerOptions } from './LightningNetworkLayer';

export { WildfireThermalLayer, getWildfireIntensityColor, getWildfireIntensityLabel, BASELINE_WILDFIRE_EVENTS } from './WildfireThermalLayer';
export type { WildfireThermalLayerOptions } from './WildfireThermalLayer';

export { AuroralOvalLayer, getKpStormScaleLabel, getAuroraGlowColor } from './AuroralOvalLayer';
export type { AuroralOvalLayerOptions } from './AuroralOvalLayer';

export const BASELINE_SPACE_WEATHER_EVENTS: WorldEvent[] = [
  {
    id: 'space-weather-geomagnetic-storm-g3',
    title: 'G3 Strong Geomagnetic Storm & Auroral Surge',
    summary: 'Coronal Mass Ejection (CME) shock passage triggering magnetospheric ring current disturbances with vivid auroras down to 50° geomagnetic latitude.',
    category: 'space_weather',
    lat: 68.5,
    lng: -149.0,
    city: 'Fairbanks',
    country: 'United States',
    publishedAt: new Date(Date.now() - 1800000).toISOString(),
    url: 'https://www.swpc.noaa.gov',
    source: 'NOAA Space Weather Prediction Center',
    planetaryTelemetry: {
      kpIndex: 7.0,
      solarWindSpeedKms: 645,
      imfBzNt: -14.2,
      auroraVisibilityLatitude: '50°N (Canada, Alaska, Scandinavia)',
    },
  },
  {
    id: 'space-weather-nordic-auroral-substorm',
    title: 'Nordic Auroral Substorm - Tromsø Magnetometer Spike',
    summary: 'Substorm westward electrojet acceleration with intense green and magenta ribbons visible across Northern Scandinavia.',
    category: 'space_weather',
    lat: 69.6,
    lng: 18.9,
    city: 'Tromsø',
    country: 'Norway',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    url: 'https://www.swpc.noaa.gov',
    source: 'NOAA SWPC / Tromsø Geophysical Obs',
    planetaryTelemetry: {
      kpIndex: 6.3,
      solarWindSpeedKms: 585,
      imfBzNt: -9.8,
      auroraVisibilityLatitude: '55°N (Scandinavia & Scotland)',
    },
  },
];

export { OceanCurrentsLayer, getOceanCurrentColor, getSstAnomalyColor } from './OceanCurrentsLayer';
export type { OceanCurrentsLayerOptions } from './OceanCurrentsLayer';

export { GeostationarySatelliteLayer } from './GeostationarySatelliteLayer';
export type { GeostationarySatelliteLayerOptions } from './GeostationarySatelliteLayer';

export { AtmosphericPressureLayer } from './AtmosphericPressureLayer';
export type { AtmosphericPressureLayerOptions } from './AtmosphericPressureLayer';
