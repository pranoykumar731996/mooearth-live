// ============================================================
// MooEarth Live — Global Weather Grid Service
// ============================================================
// Fetches genuine global meteorological data (wind vectors, temperature,
// precipitation) from Open-Meteo across a distributed planetary coordinate
// network. Backs real-time 3D Earth layers with server-side caching.

import { queryOpenMeteo } from './openMeteoClient';
import type { UnitPreferences } from './types';
import { DEFAULT_UNITS } from './types';

export interface GlobalGridStation {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

// 70 evenly-spaced planetary reference stations across continents and oceans
export const GLOBAL_GRID_STATIONS: GlobalGridStation[] = [
  // 75°N Arctic & Sub-Arctic
  { id: 'grid-75n-150w', lat: 75, lng: -150, name: 'Beaufort Sea' },
  { id: 'grid-75n-090w', lat: 75, lng: -90, name: 'Canadian Arctic' },
  { id: 'grid-75n-030w', lat: 75, lng: -30, name: 'Greenland Sea' },
  { id: 'grid-75n-030e', lat: 75, lng: 30, name: 'Barents Sea' },
  { id: 'grid-75n-090e', lat: 75, lng: 90, name: 'Kara Sea' },
  { id: 'grid-75n-150e', lat: 75, lng: 150, name: 'East Siberian Sea' },

  // 60°N Northern Belts (Alaska, Scandinavia, Siberia)
  { id: 'grid-60n-150w', lat: 60, lng: -150, name: 'Gulf of Alaska' },
  { id: 'grid-60n-100w', lat: 60, lng: -100, name: 'Hudson Bay' },
  { id: 'grid-60n-050w', lat: 60, lng: -50, name: 'Labrador Sea' },
  { id: 'grid-60n-000e', lat: 60, lng: 0, name: 'North Sea' },
  { id: 'grid-60n-050e', lat: 60, lng: 50, name: 'Urals North' },
  { id: 'grid-60n-100e', lat: 60, lng: 100, name: 'Central Siberia' },
  { id: 'grid-60n-150e', lat: 60, lng: 150, name: 'Sea of Okhotsk' },

  // 45°N Mid-Latitudes (US, Europe, East Asia)
  { id: 'grid-45n-150w', lat: 45, lng: -150, name: 'North Pacific East' },
  { id: 'grid-45n-100w', lat: 45, lng: -100, name: 'North America Plains' },
  { id: 'grid-45n-050w', lat: 45, lng: -50, name: 'North Atlantic Mid' },
  { id: 'grid-45n-000e', lat: 45, lng: 0, name: 'Western Europe' },
  { id: 'grid-45n-050e', lat: 45, lng: 50, name: 'Caspian Basin' },
  { id: 'grid-45n-100e', lat: 45, lng: 100, name: 'Mongolian Plateau' },
  { id: 'grid-45n-150e', lat: 45, lng: 150, name: 'Northwest Pacific' },

  // 30°N Sub-Tropical Belts (US South, Mediterranean, South Asia)
  { id: 'grid-30n-150w', lat: 30, lng: -150, name: 'Pacific Subtropical' },
  { id: 'grid-30n-100w', lat: 30, lng: -100, name: 'Gulf of Mexico' },
  { id: 'grid-30n-050w', lat: 30, lng: -50, name: 'Bermuda Triangle' },
  { id: 'grid-30n-000e', lat: 30, lng: 0, name: 'Sahara North' },
  { id: 'grid-30n-050e', lat: 30, lng: 50, name: 'Persian Gulf' },
  { id: 'grid-30n-100e', lat: 30, lng: 100, name: 'Himalayan Foothills' },
  { id: 'grid-30n-150e', lat: 30, lng: 150, name: 'Philippine Sea North' },

  // 15°N Tropical North (Caribbean, Sahel, Arabian Sea, SE Asia)
  { id: 'grid-15n-150w', lat: 15, lng: -150, name: 'Central Pacific North' },
  { id: 'grid-15n-100w', lat: 15, lng: -100, name: 'Eastern Pacific' },
  { id: 'grid-15n-050w', lat: 15, lng: -50, name: 'Tropical North Atlantic' },
  { id: 'grid-15n-000e', lat: 15, lng: 0, name: 'Sahel Belt' },
  { id: 'grid-15n-050e', lat: 15, lng: 50, name: 'Arabian Sea' },
  { id: 'grid-15n-100e', lat: 15, lng: 100, name: 'Bay of Bengal' },
  { id: 'grid-15n-150e', lat: 15, lng: 150, name: 'Micronesia' },

  // 0° Equatorial Belt (Amazon, Congo, Indo-Pacific)
  { id: 'grid-00n-150w', lat: 0, lng: -150, name: 'Equatorial Pacific Central' },
  { id: 'grid-00n-100w', lat: 0, lng: -100, name: 'Galapagos Basin' },
  { id: 'grid-00n-050w', lat: 0, lng: -50, name: 'Amazon Basin' },
  { id: 'grid-00n-000e', lat: 0, lng: 0, name: 'Gulf of Guinea' },
  { id: 'grid-00n-050e', lat: 0, lng: 50, name: 'East African Coast' },
  { id: 'grid-00n-100e', lat: 0, lng: 100, name: 'Sumatra / Sunda' },
  { id: 'grid-00n-150e', lat: 0, lng: 150, name: 'Melanesia' },

  // 15°S Tropical South (South Pacific, Brazil, Madagascar, Coral Sea)
  { id: 'grid-15s-150w', lat: -15, lng: -150, name: 'Polynesia Basin' },
  { id: 'grid-15s-100w', lat: -15, lng: -100, name: 'Southeast Pacific' },
  { id: 'grid-15s-050w', lat: -15, lng: -50, name: 'Central Brazil' },
  { id: 'grid-15s-000e', lat: -15, lng: 0, name: 'South Atlantic Tropical' },
  { id: 'grid-15s-050e', lat: -15, lng: 50, name: 'Madagascar / Mozambique' },
  { id: 'grid-15s-100e', lat: -15, lng: 100, name: 'Cocos Basin' },
  { id: 'grid-15s-150e', lat: -15, lng: 150, name: 'Coral Sea' },

  // 30°S Sub-Tropical South (Chile, South Africa, Australia)
  { id: 'grid-30s-150w', lat: -30, lng: -150, name: 'South Pacific Gyre' },
  { id: 'grid-30s-100w', lat: -30, lng: -100, name: 'Easter Island Trench' },
  { id: 'grid-30s-050w', lat: -30, lng: -50, name: 'Rio de la Plata' },
  { id: 'grid-30s-000e', lat: -30, lng: 0, name: 'South Atlantic Center' },
  { id: 'grid-30s-050e', lat: -30, lng: 50, name: 'Southwest Indian Ocean' },
  { id: 'grid-30s-100e', lat: -30, lng: 100, name: 'Southeast Indian Ocean' },
  { id: 'grid-30s-150e', lat: -30, lng: 150, name: 'Tasman Sea North' },

  // 45°S Roaring Forties
  { id: 'grid-45s-150w', lat: -45, lng: -150, name: 'Roaring Forties Pacific' },
  { id: 'grid-45s-100w', lat: -45, lng: -100, name: 'Patagonia West' },
  { id: 'grid-45s-050w', lat: -45, lng: -50, name: 'Falkland Current' },
  { id: 'grid-45s-000e', lat: -45, lng: 0, name: 'South Atlantic Forties' },
  { id: 'grid-45s-050e', lat: -45, lng: 50, name: 'Crozet Basin' },
  { id: 'grid-45s-100e', lat: -45, lng: 100, name: 'Kerguelen Sea' },
  { id: 'grid-45s-150e', lat: -45, lng: 150, name: 'New Zealand South' },

  // 60°S Furious Fifties & Southern Ocean
  { id: 'grid-60s-150w', lat: -60, lng: -150, name: 'Amundsen Sea Outer' },
  { id: 'grid-60s-100w', lat: -60, lng: -100, name: 'Bellingshausen Sea Outer' },
  { id: 'grid-60s-050w', lat: -60, lng: -50, name: 'Drake Passage' },
  { id: 'grid-60s-000e', lat: -60, lng: 0, name: 'Weddell Sea Outer' },
  { id: 'grid-60s-050e', lat: -60, lng: 50, name: 'Enderby Coast' },
  { id: 'grid-60s-100e', lat: -60, lng: 100, name: 'Davis Sea' },
  { id: 'grid-60s-150e', lat: -60, lng: 150, name: 'Ross Sea Outer' },

  // 75°S Antarctic Plateau
  { id: 'grid-75s-000e', lat: -75, lng: 0, name: 'Queen Maud Land' },
];

export interface GlobalGridPointData {
  id: string;
  lat: number;
  lng: number;
  name: string;
  current: {
    temperature: number;
    windSpeed: number; // km/h
    windDirection: number; // degrees
    precipitation: number; // mm
  };
  hourly: {
    temperature: number[];
    windSpeed: number[];
    windDirection: number[];
    precipitation: number[];
  };
}

export interface GlobalWeatherGridResponse {
  stations: GlobalGridPointData[];
  timestamps: string[]; // ISO timestamps for the hourly forecast (48h)
  generationTimeMs: number;
  dataSource: 'open-meteo';
  fetchedAt: string;
  units: UnitPreferences;
}

/**
 * Fetch planetary weather grid from Open-Meteo with caching (10 min TTL).
 */
export async function fetchGlobalWeatherGrid(
  units: UnitPreferences = DEFAULT_UNITS
): Promise<GlobalWeatherGridResponse> {
  const lats = GLOBAL_GRID_STATIONS.map((s) => s.lat).join(',');
  const lngs = GLOBAL_GRID_STATIONS.map((s) => s.lng).join(',');

  const raw = await queryOpenMeteo<any[]>({
    endpoint: 'forecast',
    params: {
      latitude: lats,
      longitude: lngs,
      current: 'temperature_2m,wind_speed_10m,wind_direction_10m,precipitation',
      hourly: 'temperature_2m,wind_speed_10m,wind_direction_10m,precipitation',
      temperature_unit: units.temperature,
      wind_speed_unit: units.windSpeed,
      precipitation_unit: units.precipitation,
      forecast_hours: 48,
    },
    cacheTtlMs: 10 * 60 * 1000, // 10 minutes
  });

  const isArray = Array.isArray(raw);
  const stationsData: GlobalGridPointData[] = [];
  let timestamps: string[] = [];

  if (isArray) {
    for (let i = 0; i < GLOBAL_GRID_STATIONS.length; i++) {
      const station = GLOBAL_GRID_STATIONS[i];
      const res = raw[i];

      if (!res) continue;

      if (i === 0 && res.hourly?.time) {
        timestamps = res.hourly.time;
      }

      stationsData.push({
        id: station.id,
        lat: station.lat,
        lng: station.lng,
        name: station.name,
        current: {
          temperature: res.current?.temperature_2m ?? 0,
          windSpeed: res.current?.wind_speed_10m ?? 0,
          windDirection: res.current?.wind_direction_10m ?? 0,
          precipitation: res.current?.precipitation ?? 0,
        },
        hourly: {
          temperature: res.hourly?.temperature_2m ?? [],
          windSpeed: res.hourly?.wind_speed_10m ?? [],
          windDirection: res.hourly?.wind_direction_10m ?? [],
          precipitation: res.hourly?.precipitation ?? [],
        },
      });
    }
  }

  return {
    stations: stationsData,
    timestamps,
    generationTimeMs: 0,
    dataSource: 'open-meteo',
    fetchedAt: new Date().toISOString(),
    units,
  };
}

/**
 * Spherical inverse-distance weighted vector & scalar interpolation at any (lat, lng).
 */
export function interpolateGridWeatherAt(
  lat: number,
  lng: number,
  stations: GlobalGridPointData[],
  hourlyIndex?: number
): {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  u: number; // Eastward wind component (km/h)
  v: number; // Northward wind component (km/h)
} {
  if (!stations || stations.length === 0) {
    return { temperature: 15, windSpeed: 10, windDirection: 0, precipitation: 0, u: 0, v: 0 };
  }

  let totalWeight = 0;
  let sumTemp = 0;
  let sumPrecip = 0;
  let sumU = 0;
  let sumV = 0;

  for (const st of stations) {
    // Angular distance on sphere (Haversine approx)
    const dLat = (st.lat - lat) * (Math.PI / 180);
    const dLng = ((((st.lng - lng) % 360) + 540) % 360 - 180) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * (Math.PI / 180)) *
        Math.cos(st.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distDeg = c * (180 / Math.PI);

    // Exact match safeguard
    if (distDeg < 0.1) {
      const speed = hourlyIndex !== undefined ? (st.hourly.windSpeed[hourlyIndex] ?? st.current.windSpeed) : st.current.windSpeed;
      const dir = hourlyIndex !== undefined ? (st.hourly.windDirection[hourlyIndex] ?? st.current.windDirection) : st.current.windDirection;
      const dirRad = dir * (Math.PI / 180);
      const u = -speed * Math.sin(dirRad);
      const v = -speed * Math.cos(dirRad);
      return {
        temperature: hourlyIndex !== undefined ? (st.hourly.temperature[hourlyIndex] ?? st.current.temperature) : st.current.temperature,
        windSpeed: speed,
        windDirection: dir,
        precipitation: hourlyIndex !== undefined ? (st.hourly.precipitation[hourlyIndex] ?? st.current.precipitation) : st.current.precipitation,
        u,
        v,
      };
    }

    // Inverse distance weighting with power 2.2
    const weight = 1 / Math.pow(distDeg, 2.2);
    totalWeight += weight;

    const speed = hourlyIndex !== undefined ? (st.hourly.windSpeed[hourlyIndex] ?? st.current.windSpeed) : st.current.windSpeed;
    const dir = hourlyIndex !== undefined ? (st.hourly.windDirection[hourlyIndex] ?? st.current.windDirection) : st.current.windDirection;
    const temp = hourlyIndex !== undefined ? (st.hourly.temperature[hourlyIndex] ?? st.current.temperature) : st.current.temperature;
    const precip = hourlyIndex !== undefined ? (st.hourly.precipitation[hourlyIndex] ?? st.current.precipitation) : st.current.precipitation;

    // Convert meteorological wind direction (from which wind blows) to vector components
    const dirRad = dir * (Math.PI / 180);
    const u = -speed * Math.sin(dirRad);
    const v = -speed * Math.cos(dirRad);

    sumTemp += temp * weight;
    sumPrecip += precip * weight;
    sumU += u * weight;
    sumV += v * weight;
  }

  const u = sumU / totalWeight;
  const v = sumV / totalWeight;
  const windSpeed = Math.sqrt(u * u + v * v);
  const windDirection = (Math.atan2(-u, -v) * (180 / Math.PI) + 360) % 360;

  return {
    temperature: sumTemp / totalWeight,
    windSpeed,
    windDirection,
    precipitation: Math.max(0, sumPrecip / totalWeight),
    u,
    v,
  };
}
