// ============================================================
// MooEarth Live — 2D Map Disaster & Hazard Utilities
// ============================================================
// Classification, categorization, and metadata formatting for
// tropical cyclones, earthquakes, wildfires, storms, and space weather.

import type { WorldEvent } from '@/types';

export type DisasterCategoryType = 'cyclone' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather';

export interface DisasterMeta {
  type: DisasterCategoryType;
  icon: string;
  categoryLabel: string;
  metricLabel: string;
  cleanTitle: string;
  colorHex: string;
  glowRgba: string;
  badgeBg: string;
  badgeBorder: string;
}

/**
 * Classifies a WorldEvent into a disaster type and provides formatted metadata,
 * color tokens, and telemetry badges for display on the 2D map and popups.
 */
export function getDisasterMeta(event: WorldEvent): DisasterMeta {
  const title = (event.title || '').toLowerCase();
  const cat = event.category;

  // 1. Tropical Cyclones / Hurricanes / Typhoons
  if (
    title.includes('cyclon') ||
    title.includes('hurricane') ||
    title.includes('typhoon') ||
    title.includes('tropical storm') ||
    event.planetaryTelemetry?.stormWarningType === 'tropical_cyclone'
  ) {
    const wind = event.planetaryTelemetry?.windSpeedKph;
    const catLabel = wind ? (wind >= 210 ? 'Cat 4-5' : wind >= 178 ? 'Cat 3' : wind >= 119 ? 'Cat 1-2' : 'Trop Storm') : 'Cyclone';
    const metricLabel = wind ? `${Math.round(wind)} km/h` : (event.planetaryTelemetry?.pressureHpa ? `${event.planetaryTelemetry.pressureHpa} hPa` : 'Cyclonic');
    return {
      type: 'cyclone',
      icon: '🌀',
      categoryLabel: catLabel,
      metricLabel,
      cleanTitle: event.title.split('(')[0].replace(/^(Tropical Cyclone|Typhoon|Hurricane|Super Typhoon)\s+/i, '').trim() || event.title,
      colorHex: '#00e5ff',
      glowRgba: 'rgba(0, 229, 255, 0.85)',
      badgeBg: 'rgba(6, 182, 212, 0.25)',
      badgeBorder: 'rgba(6, 182, 212, 0.6)',
    };
  }

  // 2. Earthquakes / Seismic
  if (
    cat === 'seismic' ||
    title.includes('earthquake') ||
    title.includes('richter') ||
    title.includes('magnitude') ||
    typeof event.planetaryTelemetry?.magnitude === 'number'
  ) {
    const mag = event.planetaryTelemetry?.magnitude ? event.planetaryTelemetry.magnitude.toFixed(1) : '6.5+';
    return {
      type: 'seismic',
      icon: '🌋',
      categoryLabel: `M ${mag}`,
      metricLabel: event.planetaryTelemetry?.depthKm ? `${event.planetaryTelemetry.depthKm} km depth` : 'Seismic Quake',
      cleanTitle: event.title.replace(/M\s*\d+(\.\d+)?\s*-?\s*/i, '').split('-')[0].trim() || event.title,
      colorHex: '#f43f5e',
      glowRgba: 'rgba(244, 63, 94, 0.85)',
      badgeBg: 'rgba(244, 63, 94, 0.25)',
      badgeBorder: 'rgba(244, 63, 94, 0.6)',
    };
  }

  // 3. Wildfires / Thermal Anomalies
  if (
    cat === 'wildfires' ||
    title.includes('wildfire') ||
    title.includes('bushfire') ||
    title.includes('forest fire') ||
    typeof event.planetaryTelemetry?.fireRadiativePowerMw === 'number'
  ) {
    const mw = event.planetaryTelemetry?.fireRadiativePowerMw ? `${event.planetaryTelemetry.fireRadiativePowerMw} MW` : 'Wildfire';
    return {
      type: 'wildfires',
      icon: '🔥',
      categoryLabel: mw,
      metricLabel: event.planetaryTelemetry?.brightnessTempKelvin ? `${Math.round(event.planetaryTelemetry.brightnessTempKelvin)} K` : 'Active Fire',
      cleanTitle: event.title.replace(/wildfire|fire complex/gi, '').split('-')[0].trim() || event.title,
      colorHex: '#f97316',
      glowRgba: 'rgba(249, 115, 22, 0.85)',
      badgeBg: 'rgba(249, 115, 22, 0.25)',
      badgeBorder: 'rgba(249, 115, 22, 0.6)',
    };
  }

  // 4. Space Weather / Auroral Storms
  if (
    cat === 'space_weather' ||
    title.includes('geomagnetic') ||
    title.includes('aurora') ||
    title.includes('solar storm')
  ) {
    const kp = event.planetaryTelemetry?.kpIndex ? `Kp ${event.planetaryTelemetry.kpIndex}` : 'Kp 8';
    return {
      type: 'space_weather',
      icon: '🌌',
      categoryLabel: kp,
      metricLabel: event.planetaryTelemetry?.solarWindSpeedKms ? `${event.planetaryTelemetry.solarWindSpeedKms} km/s` : 'Space Weather',
      cleanTitle: event.title.split('-')[0].split('(')[0].trim() || event.title,
      colorHex: '#a855f7',
      glowRgba: 'rgba(168, 85, 247, 0.85)',
      badgeBg: 'rgba(168, 85, 247, 0.25)',
      badgeBorder: 'rgba(168, 85, 247, 0.6)',
    };
  }

  // 5. Severe Thunderstorms / Lightning / Convective default
  const strikeRate = event.planetaryTelemetry?.lightningStrikeRatePerMin ? `${event.planetaryTelemetry.lightningStrikeRatePerMin}/min` : 'Severe';
  return {
    type: 'thunderstorms',
    icon: '⚡',
    categoryLabel: strikeRate,
    metricLabel: 'Convective Storm',
    cleanTitle: event.title.split('-')[0].split('(')[0].trim() || event.title,
    colorHex: '#eab308',
    glowRgba: 'rgba(234, 179, 8, 0.85)',
    badgeBg: 'rgba(234, 179, 8, 0.25)',
    badgeBorder: 'rgba(234, 179, 8, 0.6)',
  };
}
