// ============================================================
// MooEarth Live — Nearby Places Discovery Service
// ============================================================
// Free POI discovery powered by the Wikimedia Geosearch API.
// Discovers famous landmarks, airports, parks, historic monuments,
// mountains, and geographic features within a configurable radius ($0.00).

export interface NearbyPlace {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  formattedDistance: string;
  category: 'landmark' | 'airport' | 'mountain' | 'park' | 'water' | 'historic';
  icon: string;
  url?: string;
}

export interface NearbyPlacesResponse {
  places: NearbyPlace[];
  center: { lat: number; lng: number };
  radiusMeters: number;
}

// ── In-Memory TTL Cache (24h) ─────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const placesCache = new Map<string, { response: NearbyPlacesResponse; expiresAt: number }>();

function getCacheKey(lat: number, lng: number, radius: number): string {
  return `${lat.toFixed(3)}_${lng.toFixed(3)}_${radius}`;
}

// ── Category Classifier ───────────────────────────────────────

export function classifyNearbyPlace(title: string): {
  category: NearbyPlace['category'];
  icon: string;
} {
  const lower = title.toLowerCase();

  if (
    lower.includes('airport') ||
    lower.includes('airfield') ||
    lower.includes('aerodrome') ||
    lower.includes('heliport')
  ) {
    return { category: 'airport', icon: '✈️' };
  }
  if (
    lower.includes('mountain') ||
    lower.includes('mount ') ||
    lower.includes(' mt ') ||
    lower.includes('peak') ||
    lower.includes('volcano') ||
    lower.includes('ridge') ||
    lower.includes('hill')
  ) {
    return { category: 'mountain', icon: '🏔️' };
  }
  if (
    lower.includes('park') ||
    lower.includes('garden') ||
    lower.includes('forest') ||
    lower.includes('nature reserve') ||
    lower.includes('botanical')
  ) {
    return { category: 'park', icon: '🌳' };
  }
  if (
    lower.includes('lake') ||
    lower.includes('river') ||
    lower.includes('beach') ||
    lower.includes('bay') ||
    lower.includes('harbor') ||
    lower.includes('harbour') ||
    lower.includes('strait') ||
    lower.includes('waterfall')
  ) {
    return { category: 'water', icon: '🌊' };
  }
  if (
    lower.includes('castle') ||
    lower.includes('palace') ||
    lower.includes('museum') ||
    lower.includes('cathedral') ||
    lower.includes('temple') ||
    lower.includes('monument') ||
    lower.includes('memorial') ||
    lower.includes('tower') ||
    lower.includes('bridge')
  ) {
    return { category: 'historic', icon: '🏛️' };
  }

  return { category: 'landmark', icon: '📍' };
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// ── Query Wikimedia API ───────────────────────────────────────

export async function fetchNearbyPlaces(
  latitude: number,
  longitude: number,
  radiusMeters: number = 10000,
  limit: number = 8
): Promise<NearbyPlacesResponse> {
  const cacheKey = getCacheKey(latitude, longitude, radiusMeters);
  const cached = placesCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.response;
  }

  const clampedRadius = Math.min(Math.max(radiusMeters, 1000), 10000); // 1km - 10km max
  const clampedLimit = Math.min(Math.max(limit, 1), 20);

  const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${latitude.toFixed(
    4
  )}|${longitude.toFixed(4)}&gsradius=${clampedRadius}&gslimit=${clampedLimit}&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MooEarthLive-WeatherApp/1.0 (https://mooearth.live)',
        Accept: 'application/json',
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { places: [], center: { lat: latitude, lng: longitude }, radiusMeters: clampedRadius };
    }

    const data = await res.json();
    const items = data.query?.geosearch;
    if (!Array.isArray(items)) {
      return { places: [], center: { lat: latitude, lng: longitude }, radiusMeters: clampedRadius };
    }

    const places: NearbyPlace[] = items.map((item: any) => {
      const { category, icon } = classifyNearbyPlace(item.title);
      return {
        id: item.pageid,
        title: item.title,
        latitude: item.lat,
        longitude: item.lon,
        distanceMeters: item.dist,
        formattedDistance: formatDistance(item.dist),
        category,
        icon,
        url: `https://en.wikipedia.org/?curid=${item.pageid}`,
      };
    });

    const response: NearbyPlacesResponse = {
      places,
      center: { lat: latitude, lng: longitude },
      radiusMeters: clampedRadius,
    };

    placesCache.set(cacheKey, {
      response,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return response;
  } catch {
    clearTimeout(timer);
    return { places: [], center: { lat: latitude, lng: longitude }, radiusMeters: clampedRadius };
  }
}
