// ============================================================
// MooEarth Live — User Location Resolver
// ============================================================
// Dynamically resolves the user's initial location instead of
// hardcoding Tokyo or any single city.
//
// Resolution Priority:
// 1. URL search parameters (?lat=...&lng=...&city=...&country=...)
// 2. Previously saved user location from localStorage
// 3. Browser Geolocation API (if granted / available)
// 4. Browser Timezone deduction (Intl.DateTimeFormat)
// 5. Regional global anchor fallback
// ============================================================

export interface ResolvedLocationTarget {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  timezone?: string;
  source: 'url' | 'saved' | 'geolocation' | 'timezone' | 'default';
}

const STORAGE_KEY = 'mooearth_user_location';

/**
 * Common timezone prefix and keyword map to verified metropolitan coordinates
 */
const TIMEZONE_LOCATION_MAP: { match: string; loc: Omit<ResolvedLocationTarget, 'source'> }[] = [
  // India / Indian Subcontinent (IST +05:30)
  { match: 'kolkata', loc: { latitude: 28.6139, longitude: 77.2090, name: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata' } },
  { match: 'calcutta', loc: { latitude: 28.6139, longitude: 77.2090, name: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata' } },
  { match: 'colombo', loc: { latitude: 6.9271, longitude: 79.8612, name: 'Colombo', country: 'Sri Lanka', timezone: 'Asia/Colombo' } },
  { match: 'dhaka', loc: { latitude: 23.8103, longitude: 90.4125, name: 'Dhaka', country: 'Bangladesh', timezone: 'Asia/Dhaka' } },
  { match: 'karachi', loc: { latitude: 24.8607, longitude: 67.0011, name: 'Karachi', country: 'Pakistan', timezone: 'Asia/Karachi' } },
  { match: 'kathmandu', loc: { latitude: 27.7172, longitude: 85.3240, name: 'Kathmandu', country: 'Nepal', timezone: 'Asia/Kathmandu' } },

  // United States & Canada
  { match: 'new_york', loc: { latitude: 40.7128, longitude: -74.0060, name: 'New York', country: 'United States', timezone: 'America/New_York' } },
  { match: 'detroit', loc: { latitude: 42.3314, longitude: -83.0458, name: 'Detroit', country: 'United States', timezone: 'America/Detroit' } },
  { match: 'chicago', loc: { latitude: 41.8781, longitude: -87.6298, name: 'Chicago', country: 'United States', timezone: 'America/Chicago' } },
  { match: 'los_angeles', loc: { latitude: 34.0522, longitude: -118.2437, name: 'Los Angeles', country: 'United States', timezone: 'America/Los_Angeles' } },
  { match: 'denver', loc: { latitude: 39.7392, longitude: -104.9903, name: 'Denver', country: 'United States', timezone: 'America/Denver' } },
  { match: 'phoenix', loc: { latitude: 33.4484, longitude: -112.0740, name: 'Phoenix', country: 'United States', timezone: 'America/Phoenix' } },
  { match: 'toronto', loc: { latitude: 43.6532, longitude: -79.3832, name: 'Toronto', country: 'Canada', timezone: 'America/Toronto' } },
  { match: 'vancouver', loc: { latitude: 49.2827, longitude: -123.1207, name: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver' } },

  // Europe & UK
  { match: 'london', loc: { latitude: 51.5074, longitude: -0.1278, name: 'London', country: 'United Kingdom', timezone: 'Europe/London' } },
  { match: 'paris', loc: { latitude: 48.8566, longitude: 2.3522, name: 'Paris', country: 'France', timezone: 'Europe/Paris' } },
  { match: 'berlin', loc: { latitude: 52.5200, longitude: 13.4050, name: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin' } },
  { match: 'madrid', loc: { latitude: 40.4168, longitude: -3.7038, name: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid' } },
  { match: 'rome', loc: { latitude: 41.9028, longitude: 12.4964, name: 'Rome', country: 'Italy', timezone: 'Europe/Rome' } },
  { match: 'amsterdam', loc: { latitude: 52.3676, longitude: 4.9041, name: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam' } },
  { match: 'zurich', loc: { latitude: 47.3769, longitude: 8.5417, name: 'Zurich', country: 'Switzerland', timezone: 'Europe/Zurich' } },
  { match: 'stockholm', loc: { latitude: 59.3293, longitude: 18.0686, name: 'Stockholm', country: 'Sweden', timezone: 'Europe/Stockholm' } },
  { match: 'warsaw', loc: { latitude: 52.2297, longitude: 21.0122, name: 'Warsaw', country: 'Poland', timezone: 'Europe/Warsaw' } },
  { match: 'athens', loc: { latitude: 37.9838, longitude: 23.7275, name: 'Athens', country: 'Greece', timezone: 'Europe/Athens' } },

  // Middle East & Africa
  { match: 'dubai', loc: { latitude: 25.2048, longitude: 55.2708, name: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' } },
  { match: 'riyadh', loc: { latitude: 24.7136, longitude: 46.6753, name: 'Riyadh', country: 'Saudi Arabia', timezone: 'Asia/Riyadh' } },
  { match: 'cairo', loc: { latitude: 30.0444, longitude: 31.2357, name: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo' } },
  { match: 'johannesburg', loc: { latitude: -26.2041, longitude: 28.0473, name: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg' } },
  { match: 'nairobi', loc: { latitude: -1.2921, longitude: 36.8219, name: 'Nairobi', country: 'Kenya', timezone: 'Africa/Nairobi' } },

  // Asia-Pacific & Oceania
  { match: 'singapore', loc: { latitude: 1.3521, longitude: 103.8198, name: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' } },
  { match: 'tokyo', loc: { latitude: 35.6762, longitude: 139.6503, name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' } },
  { match: 'seoul', loc: { latitude: 37.5665, longitude: 126.9780, name: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul' } },
  { match: 'shanghai', loc: { latitude: 31.2304, longitude: 121.4737, name: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' } },
  { match: 'hong_kong', loc: { latitude: 22.3193, longitude: 114.1694, name: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong' } },
  { match: 'bangkok', loc: { latitude: 13.7563, longitude: 100.5018, name: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok' } },
  { match: 'jakarta', loc: { latitude: -6.2088, longitude: 106.8456, name: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta' } },
  { match: 'sydney', loc: { latitude: -33.8688, longitude: 151.2093, name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' } },
  { match: 'melbourne', loc: { latitude: -37.8136, longitude: 144.9631, name: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne' } },
  { match: 'auckland', loc: { latitude: -36.8485, longitude: 174.7633, name: 'Auckland', country: 'New Zealand', timezone: 'Pacific/Auckland' } },

  // Latin America
  { match: 'sao_paulo', loc: { latitude: -23.5505, longitude: -46.6333, name: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo' } },
  { match: 'buenos_aires', loc: { latitude: -34.6037, longitude: -58.3816, name: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' } },
  { match: 'mexico', loc: { latitude: 19.4326, longitude: -99.1332, name: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City' } },
  { match: 'bogota', loc: { latitude: 4.7110, longitude: -74.0721, name: 'Bogotá', country: 'Colombia', timezone: 'America/Bogota' } },
  { match: 'santiago', loc: { latitude: -33.4489, longitude: -70.6693, name: 'Santiago', country: 'Chile', timezone: 'America/Santiago' } },
];

// In-memory fallback for SSR and testing environments
const memoryStorage: Record<string, string> = {};

function getStorage(): { getItem(key: string): string | null; setItem(key: string, val: string): void; removeItem(key: string): void } {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const testKey = '__mooearth_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch {
      // localStorage restricted or disabled (e.g. private mode)
    }
  }
  return {
    getItem: (key: string) => memoryStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      memoryStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
  };
}

/**
 * Retrieve saved location from browser localStorage
 */
export function getSavedUserLocation(): ResolvedLocationTarget | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.latitude === 'number' &&
      typeof parsed?.longitude === 'number' &&
      typeof parsed?.name === 'string'
    ) {
      // Auto-heal / invalidate legacy hardcoded Tokyo default if user is not in Japan timezone
      if (parsed.name.toLowerCase().includes('tokyo') || parsed.country?.toLowerCase() === 'japan') {
        const tz = (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '').toLowerCase();
        if (!tz.includes('tokyo') && !tz.includes('japan')) {
          storage.removeItem(STORAGE_KEY);
          return null;
        }
      }

      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        name: parsed.name,
        country: parsed.country,
        timezone: parsed.timezone || 'auto',
        source: 'saved',
      };
    }
  } catch {
    // Ignore parse or storage errors
  }
  return null;
}

/**
 * Persist user's explicitly selected location
 */
export function saveUserLocation(loc: {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
  timezone?: string;
}): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        latitude: loc.latitude,
        longitude: loc.longitude,
        name: loc.name,
        country: loc.country,
        timezone: loc.timezone,
        timestamp: Date.now(),
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Deduce regional location from browser's Intl timezone
 */
export function detectUserTimezoneLocation(): ResolvedLocationTarget {
  try {
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    for (const item of TIMEZONE_LOCATION_MAP) {
      if (tz.includes(item.match)) {
        return {
          ...item.loc,
          source: 'timezone',
        };
      }
    }
    // Broad continent matches
    if (tz.startsWith('europe/')) {
      return { latitude: 51.5074, longitude: -0.1278, name: 'London', country: 'United Kingdom', timezone: 'Europe/London', source: 'timezone' };
    }
    if (tz.startsWith('america/')) {
      return { latitude: 40.7128, longitude: -74.0060, name: 'New York', country: 'United States', timezone: 'America/New_York', source: 'timezone' };
    }
    if (tz.startsWith('australia/')) {
      return { latitude: -33.8688, longitude: 151.2093, name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', source: 'timezone' };
    }
    if (tz.startsWith('africa/')) {
      return { latitude: -26.2041, longitude: 28.0473, name: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg', source: 'timezone' };
    }
    if (tz.startsWith('asia/')) {
      return { latitude: 28.6139, longitude: 77.2090, name: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata', source: 'timezone' };
    }
  } catch {
    // Fallback
  }

  // Balanced global default: New Delhi, India (or planetary central coordinates)
  return {
    latitude: 28.6139,
    longitude: 77.2090,
    name: 'New Delhi',
    country: 'India',
    timezone: 'Asia/Kolkata',
    source: 'default',
  };
}

/**
 * Resolves the optimal initial location for the application:
 * Checks localStorage first, then detects user's timezone.
 */
export function resolveInitialLocation(): ResolvedLocationTarget {
  const saved = getSavedUserLocation();
  if (saved) return saved;

  return detectUserTimezoneLocation();
}
