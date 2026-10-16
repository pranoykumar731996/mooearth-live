// ============================================================
// MooEarth Live — Weather Layers Barrel Export
// ============================================================

export { WindParticleSystem, getWindColor, geoToVector3 } from './WindParticleSystem';
export type { WindParticleSystemOptions } from './WindParticleSystem';

export { TemperatureHeatmapLayer, getThermalColorRgb } from './TemperatureHeatmapLayer';
export type { TemperatureLayerOptions } from './TemperatureHeatmapLayer';

export { PrecipitationLayer, getPrecipitationColorRgb } from './PrecipitationLayer';
export type { PrecipitationLayerOptions } from './PrecipitationLayer';

export { CycloneVortexLayer, getSaffirSimpsonColor, getCycloneCategoryLabel } from './CycloneVortexLayer';
export type { CycloneVortexLayerOptions } from './CycloneVortexLayer';

export { SeismicShockwaveLayer, getFocalDepthColor, getFocalDepthLabel, getRichterCategoryLabel } from './SeismicShockwaveLayer';
export type { SeismicShockwaveLayerOptions } from './SeismicShockwaveLayer';

export { LightningNetworkLayer } from './LightningNetworkLayer';
export type { LightningNetworkLayerOptions } from './LightningNetworkLayer';


