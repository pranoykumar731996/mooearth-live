// ============================================================
// MooEarth Live — Planetary Engine: NASA EONET v3 Client
// ============================================================

import { NasaEonetResponse, NasaEonetEvent, PlanetaryEvent } from './types';
import { EventCategory } from '@/types';
import { CANONICAL_COUNTRIES } from '@/data/countries';
import { COUNTRY_COORDINATES } from '@/lib/constants';

const NASA_EONET_ENDPOINT = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=60';

/** Map EONET category IDs to MooEarth Planetary Event categories */
function mapEonetCategory(categoryId: string): EventCategory {
  switch (categoryId.toLowerCase()) {
    case 'wildfires':
      return 'wildfires';
    case 'severestorms':
      return 'severe_weather';
    case 'volcanoes':
      return 'seismic';
    case 'sealakeice':
    case 'watercolor':
    case 'temperatureextremes':
      return 'climate_oceans';
    case 'dusthaze':
      return 'severe_weather';
    default:
      return 'science_nature';
  }
}

/**
 * Extracts country and region from NASA event title
 */
function resolveEonetLocation(title: string, lat: number, lng: number): { country: string; city: string } {
  // Common pattern: "Event Name, State/Region, Country" or "Wildfire - Region, Country"
  for (const c of CANONICAL_COUNTRIES) {
    if (title.toLowerCase().includes(c.name.toLowerCase())) {
      return { country: c.name, city: title.split(',')[0].trim() };
    }
  }

  // Check nearest coordinate fallback
  let closestCountry = 'Global Wilderness';
  let minDistance = Infinity;
  for (const [name, coord] of Object.entries(COUNTRY_COORDINATES)) {
    const dLat = coord.lat - lat;
    const dLng = coord.lng - lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance && dist < 18) {
      minDistance = dist;
      closestCountry = coord.country;
    }
  }

  return { country: closestCountry, city: title.split(',')[0].trim() };
}

/**
 * Converts a NASA EONET Event to PlanetaryEvent / WorldEvent
 */
export function parseNasaEonetEvent(event: NasaEonetEvent): PlanetaryEvent | null {
  if (!event.geometry || event.geometry.length === 0) return null;

  // Take the most recent observation point
  const latestGeo = event.geometry[event.geometry.length - 1];
  let lng = 0;
  let lat = 0;

  if (Array.isArray(latestGeo.coordinates) && typeof latestGeo.coordinates[0] === 'number') {
    lng = latestGeo.coordinates[0] as number;
    lat = latestGeo.coordinates[1] as number;
  } else if (Array.isArray(latestGeo.coordinates) && Array.isArray(latestGeo.coordinates[0])) {
    // Polygon center approximation
    const ring = latestGeo.coordinates[0] as number[];
    if (ring && ring.length >= 2) {
      lng = ring[0];
      lat = ring[1];
    }
  }

  if (lat === 0 && lng === 0) return null;

  const primaryCategory = event.categories?.[0];
  const categoryId = primaryCategory?.id || 'wildfires';
  const categoryTitle = primaryCategory?.title || 'Natural Event';
  const eventCategory = mapEonetCategory(categoryId);

  const { country, city } = resolveEonetLocation(event.title, lat, lng);
  const dateIso = latestGeo.date || new Date().toISOString();

  let telemetryDesc = '';
  let magValue: number | undefined;
  if (typeof latestGeo.magnitudeValue === 'number') {
    magValue = latestGeo.magnitudeValue;
    telemetryDesc = ` Measured intensity: ${latestGeo.magnitudeValue} ${latestGeo.magnitudeUnit || ''}.`;
  }

  const primarySource = event.sources?.[0]?.url || event.link;

  return {
    id: `eonet-${event.id}`,
    title: `${event.title}`,
    summary: `Active ${categoryTitle.toLowerCase()} tracked by NASA Earth Observatory Natural Event Tracker (EONET).${telemetryDesc}`,
    category: eventCategory,
    country,
    city,
    lat,
    lng,
    source: 'NASA Earth Observatory (EONET)',
    publishedAt: dateIso,
    url: primarySource,
    dataOrigin: 'nasa_eonet',
    planetaryTelemetry: {
      magnitude: magValue,
      fireRadiativePowerMw: eventCategory === 'wildfires' && magValue ? magValue : undefined,
      windSpeedKph: eventCategory === 'severe_weather' && latestGeo.magnitudeUnit === 'kts' && magValue ? Math.round(magValue * 1.852) : undefined,
      eventStatus: 'active',
      sensorSource: 'NASA Earth Science Division / EONET',
      externalDataUrl: primarySource,
    },
  };
}

/**
 * Fetches real-time natural events from NASA EONET v3
 */
export async function fetchNasaEonetEvents(timeoutMs = 7000): Promise<PlanetaryEvent[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(NASA_EONET_ENDPOINT, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MooEarthLivePlanetaryEngine/1.0',
      },
      next: { revalidate: 300 }, // 5-minute Next.js caching
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[Planetary NASA EONET] Feed returned HTTP ${res.status}`);
      return [];
    }

    const data: NasaEonetResponse = await res.json();
    if (!data?.events || !Array.isArray(data.events)) {
      return [];
    }

    const events: PlanetaryEvent[] = [];
    for (const rawEvent of data.events) {
      const parsed = parseNasaEonetEvent(rawEvent);
      if (parsed) {
        events.push(parsed);
      }
    }

    return events;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[Planetary NASA EONET] Fetch notice: ${err?.message || err}`);
    return [];
  }
}
