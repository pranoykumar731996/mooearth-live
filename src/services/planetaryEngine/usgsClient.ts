// ============================================================
// MooEarth Live — Planetary Engine: USGS Earthquake Client
// ============================================================

import { UsgsGeoJsonResponse, PlanetaryEvent } from './types';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { CANONICAL_COUNTRIES } from '@/data/countries';

const USGS_FEEDS = {
  ALL_2_5_DAY: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
  SIGNIFICANT_MONTH: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson',
  ALL_4_5_DAY: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
};

// Common US state abbreviations found in USGS place strings
const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'PR', 'VI', 'GU', 'AS', 'MP'
]);

/**
 * Resolves country and city from USGS place string and coordinates
 */
export function resolveUsgsLocation(place: string | null, lat: number, lng: number): { country: string; city: string } {
  if (!place) {
    return { country: 'International Waters', city: 'Offshore' };
  }

  const parts = place.split(',').map((s) => s.trim());

  // Pattern: "32 km NNW of City, Country/State"
  if (parts.length >= 2) {
    const rawCityPart = parts[0];
    const rawCountryPart = parts[parts.length - 1];

    // Clean distance prefix from city: "32 km NNW of Tokyo" -> "Tokyo"
    const cityMatch = rawCityPart.match(/(?:of\s+)(.+)$/i);
    const city = cityMatch ? cityMatch[1].trim() : rawCityPart;

    // Check US State code
    if (US_STATE_CODES.has(rawCountryPart.toUpperCase())) {
      return { country: 'United States', city: `${city}, ${rawCountryPart}` };
    }

    // Match against canonical countries
    for (const c of CANONICAL_COUNTRIES) {
      if (
        c.name.toLowerCase() === rawCountryPart.toLowerCase() ||
        rawCountryPart.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(rawCountryPart.toLowerCase())
      ) {
        return { country: c.name, city };
      }
    }

    return { country: rawCountryPart, city };
  }

  // Single place string (e.g. "Southern Mid-Atlantic Ridge")
  for (const c of CANONICAL_COUNTRIES) {
    if (place.toLowerCase().includes(c.name.toLowerCase())) {
      return { country: c.name, city: place };
    }
  }

  // Nearest coordinate fallback
  let closestCountry = 'Ocean Region';
  let minDistance = Infinity;
  for (const [name, coord] of Object.entries(COUNTRY_COORDINATES)) {
    const dLat = coord.lat - lat;
    const dLng = coord.lng - lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance && dist < 15) {
      minDistance = dist;
      closestCountry = coord.country;
    }
  }

  return { country: closestCountry, city: place };
}

/**
 * Converts a USGS Feature to a PlanetaryEvent / WorldEvent
 */
export function parseUsgsFeature(feature: UsgsGeoJsonResponse['features'][0]): PlanetaryEvent | null {
  const p = feature.properties;
  const coords = feature.geometry?.coordinates;

  if (!coords || coords.length < 2) return null;

  const lng = coords[0];
  const lat = coords[1];
  const depthKm = coords[2] ?? 10;
  const mag = typeof p.mag === 'number' ? Math.round(p.mag * 10) / 10 : 3.0;
  const place = p.place || 'Unknown Location';
  const { country, city } = resolveUsgsLocation(place, lat, lng);

  const tsunamiWarning = p.tsunami === 1;
  const intensity = p.mmi ? `MMI ${p.mmi.toFixed(1)}` : undefined;

  const dateIso = p.time ? new Date(p.time).toISOString() : new Date().toISOString();

  const title = `M ${mag.toFixed(1)} Earthquake — ${city || place}`;
  const summary = `A magnitude ${mag.toFixed(1)} seismic event occurred at a depth of ${depthKm.toFixed(1)} km. ${
    tsunamiWarning ? '⚠️ Tsunami advisory/warning registered.' : 'No tsunami alert reported.'
  } Recorded by the USGS Earthquake Hazards Program.`;

  return {
    id: `usgs-${feature.id || Math.abs(p.time)}`,
    title,
    summary,
    category: 'seismic',
    country,
    city,
    lat,
    lng,
    source: 'USGS Earthquake Hazards Program',
    publishedAt: dateIso,
    url: p.url,
    dataOrigin: 'usgs',
    planetaryTelemetry: {
      magnitude: mag,
      depthKm,
      intensity,
      tsunamiWarning,
      eventStatus: p.status,
      sensorSource: 'USGS National Earthquake Information Center (NEIC)',
      externalDataUrl: p.url,
    },
  };
}

/**
 * Fetches real-time earthquakes from USGS GeoJSON feeds
 */
export async function fetchUsgsEarthquakes(timeoutMs = 7000): Promise<PlanetaryEvent[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchFeed = async (url: string) => {
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MooEarthLivePlanetaryEngine/1.0',
          },
          next: { revalidate: 120 },
        });
        if (!res.ok) return [];
        const data: UsgsGeoJsonResponse = await res.json();
        return Array.isArray(data?.features) ? data.features : [];
      } catch {
        return [];
      }
    };

    const [global45Features, local25Features] = await Promise.all([
      fetchFeed(USGS_FEEDS.ALL_4_5_DAY),
      fetchFeed(USGS_FEEDS.ALL_2_5_DAY),
    ]);

    clearTimeout(timer);

    const featureMap = new Map<string, PlanetaryEvent>();

    // Process global M4.5+ earthquakes first
    for (const f of global45Features) {
      const event = parseUsgsFeature(f);
      if (event && !featureMap.has(event.id)) {
        featureMap.set(event.id, event);
      }
    }

    // Add local M2.5+ earthquakes
    for (const f of local25Features) {
      const event = parseUsgsFeature(f);
      if (event && !featureMap.has(event.id)) {
        featureMap.set(event.id, event);
      }
    }

    const events = Array.from(featureMap.values());
    events.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return events;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[Planetary USGS] Fetch notice: ${err?.message || err}`);
    return [];
  }
}
