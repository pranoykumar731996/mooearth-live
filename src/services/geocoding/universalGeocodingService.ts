// ============================================================
// MooEarth Live — Universal Global Geocoding Service
// ============================================================
// Multi-provider geocoding engine with zero API fees ($0.00):
// 1. Primary: Photon by Komoot (OpenStreetMap Elasticsearch index)
//    - Deep coverage: streets, house numbers, POIs, airports, peaks, landmarks
// 2. Fallback 1: OpenStreetMap Nominatim
//    - High precision address & postal resolution with polite headers
// 3. Fallback 2: Open-Meteo Geocoding
//    - Dedicated municipal & administrative boundary database
// Includes in-memory TTL caching (24h) and input sanitization.

import type {
  GeocodingResult,
  GeocodingResponse,
  GeographicFeatureType,
} from '@/services/weather/types';
import { searchLocations as searchOpenMeteo } from '@/services/weather/geocodingService';

// ── In-Memory TTL Cache ───────────────────────────────────────

interface CacheEntry {
  response: GeocodingResponse;
  expiresAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 500;
const memoryCache = new Map<string, CacheEntry>();

function getFromCache(key: string): GeocodingResponse | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.response;
}

function setInCache(key: string, response: GeocodingResponse): void {
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest item
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, {
    response,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ── OSM Classification ────────────────────────────────────────

export function classifyOsmFeature(
  osmKey?: string,
  osmValue?: string,
  type?: string
): GeographicFeatureType {
  const key = (osmKey || '').toLowerCase();
  const val = (osmValue || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (key === 'aeroway' || val === 'aerodrome' || val === 'airport' || t === 'airport') {
    return 'airport';
  }
  if (
    key === 'natural' &&
    ['peak', 'volcano', 'hill', 'mountain_range', 'ridge', 'cliff'].includes(val)
  ) {
    return 'mountain';
  }
  if (
    key === 'natural' &&
    ['water', 'bay', 'strait', 'coastline', 'beach', 'lake', 'river', 'sea', 'ocean'].includes(val)
  ) {
    return 'water';
  }
  if (
    key === 'tourism' ||
    key === 'historic' ||
    ['monument', 'memorial', 'castle', 'attraction', 'museum', 'viewpoint'].includes(val)
  ) {
    return 'landmark';
  }
  if (key === 'highway' || ['street', 'road', 'residential', 'primary', 'secondary'].includes(val)) {
    return 'street';
  }
  if (key === 'leisure' && ['park', 'nature_reserve', 'garden', 'playground'].includes(val)) {
    return 'park';
  }
  if (key === 'railway' || ['station', 'subway_entrance', 'halt', 'tram_stop'].includes(val)) {
    return 'station';
  }
  if (val === 'country' || t === 'country') {
    return 'country';
  }
  if (['state', 'region', 'province', 'county', 'district'].includes(val) || t === 'administrative') {
    return 'administrative';
  }
  if (['house', 'building', 'address'].includes(val) || t === 'house') {
    return 'address';
  }
  return 'city';
}

/**
 * Format a human-readable display address from components
 */
function buildDisplayName(parts: {
  name: string;
  street?: string;
  housenumber?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}): string {
  const segments: string[] = [];
  const added = new Set<string>();

  const add = (val?: string) => {
    if (!val) return;
    const trimmed = val.trim();
    const lower = trimmed.toLowerCase();
    if (trimmed && !added.has(lower)) {
      added.add(lower);
      segments.push(trimmed);
    }
  };

  add(parts.name);

  if (parts.street && parts.street.toLowerCase() !== parts.name.toLowerCase()) {
    const streetLine = parts.housenumber
      ? `${parts.housenumber} ${parts.street}`
      : parts.street;
    add(streetLine);
  }

  add(parts.city);
  add(parts.state);
  add(parts.postcode);
  add(parts.country);

  return segments.join(', ');
}

// ── Provider 1: Photon by Komoot ──────────────────────────────

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    extent?: [number, number, number, number];
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

async function queryPhoton(
  query: string,
  count: number,
  language: string
): Promise<GeocodingResult[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${count}&lang=${language}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MooEarthLive-Weather/1.0 (https://mooearth.live)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return [];

    const data: PhotonResponse = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    const results: GeocodingResult[] = [];

    for (let i = 0; i < data.features.length; i++) {
      const feat = data.features[i];
      const props = feat.properties;
      const coords = feat.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;

      const [lon, lat] = coords;
      if (isNaN(lat) || isNaN(lon)) continue;

      const name = props.name || props.street || props.city || query;
      const featureType = classifyOsmFeature(props.osm_key, props.osm_value, props.type);

      const displayName = buildDisplayName({
        name,
        street: props.street,
        housenumber: props.housenumber,
        city: props.city || props.district,
        state: props.state,
        country: props.country,
        postcode: props.postcode,
      });

      results.push({
        id: props.osm_id || Math.abs(Math.round(lat * 10000 + lon * 10000)) + i,
        name,
        latitude: lat,
        longitude: lon,
        timezone: 'auto',
        country: props.country,
        countryCode: props.countrycode?.toUpperCase(),
        admin1: props.state,
        admin2: props.city || props.district,
        type: featureType,
        street: props.street,
        housenumber: props.housenumber,
        postcode: props.postcode,
        displayName,
        osmId: props.osm_id,
        boundingBox: props.extent,
      });
    }

    return results;
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// ── Provider 2: OpenStreetMap Nominatim ───────────────────────

interface NominatimResult {
  place_id: number;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class?: string;
  type?: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: [string, string, string, string];
}

async function queryNominatim(
  query: string,
  count: number
): Promise<GeocodingResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&addressdetails=1&limit=${count}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MooEarthLive-Weather/1.0 (contact@mooearth.live)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return [];

    const data: NominatimResult[] = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item, idx) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const addr = item.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.suburb;
      const primaryName =
        addr.road || cityName || addr.county || item.display_name.split(',')[0].trim();
      const featureType = classifyOsmFeature(item.class, item.type, item.type);

      const bbox: [number, number, number, number] | undefined = item.boundingbox
        ? [
            parseFloat(item.boundingbox[0]),
            parseFloat(item.boundingbox[1]),
            parseFloat(item.boundingbox[2]),
            parseFloat(item.boundingbox[3]),
          ]
        : undefined;

      return {
        id: item.place_id || item.osm_id || idx + 1,
        name: primaryName,
        latitude: lat,
        longitude: lon,
        timezone: 'auto',
        country: addr.country,
        countryCode: addr.country_code?.toUpperCase(),
        admin1: addr.state,
        admin2: cityName,
        type: featureType,
        street: addr.road,
        housenumber: addr.house_number,
        postcode: addr.postcode,
        displayName: item.display_name,
        osmId: item.osm_id,
        boundingBox: bbox,
      };
    });
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// ── Master Universal Search Function ──────────────────────────

/**
 * Universal Global Geocoding Search
 * Queries Photon -> Nominatim -> Open-Meteo with caching.
 */
export async function universalSearchLocations(
  query: string,
  count: number = 10,
  language: string = 'en'
): Promise<GeocodingResponse> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return { results: [], generationTime: 0, provider: 'none' };
  }

  const cacheKey = `${trimmed.toLowerCase()}_${count}_${language}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  const startTime = Date.now();

  // 1. Try Primary: Photon by Komoot
  let results = await queryPhoton(trimmed, count, language);
  let provider = 'photon-komoot';

  // 2. Try Fallback 1: OSM Nominatim
  if (!results || results.length === 0) {
    results = await queryNominatim(trimmed, count);
    provider = 'osm-nominatim';
  }

  // 3. Try Fallback 2: Open-Meteo
  if (!results || results.length === 0) {
    try {
      const openMeteoResp = await searchOpenMeteo(trimmed, count, language);
      results = (openMeteoResp.results || []).map(r => ({
        ...r,
        type: 'city' as GeographicFeatureType,
        displayName: r.country ? `${r.name}, ${r.country}` : r.name,
      }));
      provider = 'open-meteo';
    } catch {
      results = [];
    }
  }

  const response: GeocodingResponse = {
    results: results.slice(0, count),
    generationTime: Date.now() - startTime,
    provider,
  };

  if (response.results.length > 0) {
    setInCache(cacheKey, response);
  }

  return response;
}
