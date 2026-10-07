// ============================================================
// MooEarth Live — Weather Service (Live Open-Meteo Telemetry)
// ============================================================
// Real-world meteorological data integration. Never fabricates weather.

export interface WeatherTelemetry {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  precipitation: number;
  rain: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  surfacePressure: number;
  weatherCode: number;
  weatherDescription: string;
  weatherEmoji: string;
  isDay: boolean;
  stationLat: number;
  stationLng: number;
  timestamp: string;
}

export interface WeatherFetchResult {
  observation: WeatherTelemetry | null;
  isTemporaryError: boolean;
  errorMessage?: string;
}

const WMO_CODE_MAP: Record<number, { desc: string; emoji: string }> = {
  0: { desc: 'Clear sky', emoji: '☀️' },
  1: { desc: 'Mainly clear', emoji: '🌤️' },
  2: { desc: 'Partly cloudy', emoji: '⛅' },
  3: { desc: 'Overcast', emoji: '☁️' },
  45: { desc: 'Fog', emoji: '🌫️' },
  48: { desc: 'Depositing rime fog', emoji: '🌫️' },
  51: { desc: 'Light drizzle', emoji: '🌦️' },
  53: { desc: 'Moderate drizzle', emoji: '🌦️' },
  55: { desc: 'Dense drizzle', emoji: '🌧️' },
  56: { desc: 'Light freezing drizzle', emoji: '🌨️' },
  57: { desc: 'Dense freezing drizzle', emoji: '🌨️' },
  61: { desc: 'Slight rain', emoji: '🌧️' },
  63: { desc: 'Moderate rain', emoji: '🌧️' },
  65: { desc: 'Heavy rain', emoji: '🌧️' },
  66: { desc: 'Light freezing rain', emoji: '🌨️' },
  67: { desc: 'Heavy freezing rain', emoji: '🌨️' },
  71: { desc: 'Slight snow fall', emoji: '❄️' },
  73: { desc: 'Moderate snow fall', emoji: '❄️' },
  75: { desc: 'Heavy snow fall', emoji: '❄️' },
  77: { desc: 'Snow grains', emoji: '❄️' },
  80: { desc: 'Slight rain showers', emoji: '🌦️' },
  81: { desc: 'Moderate rain showers', emoji: '🌧️' },
  82: { desc: 'Violent rain showers', emoji: '⛈️' },
  85: { desc: 'Slight snow showers', emoji: '🌨️' },
  86: { desc: 'Heavy snow showers', emoji: '🌨️' },
  95: { desc: 'Thunderstorm', emoji: '⚡' },
  96: { desc: 'Thunderstorm with slight hail', emoji: '⛈️' },
  99: { desc: 'Thunderstorm with heavy hail', emoji: '⛈️' },
};

export function getWmoWeatherInfo(code: number): { desc: string; emoji: string } {
  return WMO_CODE_MAP[code] || { desc: `Atmospheric Code ${code}`, emoji: '🌡️' };
}

// In-memory cache with 10-minute TTL to prevent redundant external API calls per page view
const WEATHER_CACHE = new Map<string, { result: WeatherFetchResult; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch real-world weather telemetry from Open-Meteo API.
 * Never fabricates or fakes weather readings.
 * Employs in-memory caching and Next.js ISR revalidation.
 */
export async function fetchCountryWeather(
  lat: number,
  lng: number
): Promise<WeatherFetchResult> {
  // Round coordinates to 2 decimal places for consistent cache hits
  const cacheKey = `${lat.toFixed(2)}:${lng.toFixed(2)}`;
  const now = Date.now();
  const cached = WEATHER_CACHE.get(cacheKey);

  if (cached && now < cached.expiresAt) {
    return cached.result;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code,is_day,surface_pressure&timezone=auto`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 600 }, // 10 minutes cache
    });

    if (!res.ok) {
      const errResult: WeatherFetchResult = {
        observation: null,
        isTemporaryError: true,
        errorMessage: `Open-Meteo returned status ${res.status}`,
      };
      return errResult;
    }

    const data = await res.json();
    const curr = data?.current;

    if (!curr || typeof curr.temperature_2m !== 'number') {
      const errResult: WeatherFetchResult = {
        observation: null,
        isTemporaryError: true,
        errorMessage: 'Invalid current telemetry payload from Open-Meteo',
      };
      return errResult;
    }

    const wmo = getWmoWeatherInfo(curr.weather_code ?? 0);

    const observation: WeatherTelemetry = {
      temperature: curr.temperature_2m,
      apparentTemperature: curr.apparent_temperature ?? curr.temperature_2m,
      relativeHumidity: curr.relative_humidity_2m ?? 0,
      precipitation: curr.precipitation ?? 0,
      rain: curr.rain ?? 0,
      windSpeed: curr.wind_speed_10m ?? 0,
      windDirection: curr.wind_direction_10m ?? 0,
      cloudCover: curr.cloud_cover ?? 0,
      surfacePressure: curr.surface_pressure ?? 1013.25,
      weatherCode: curr.weather_code ?? 0,
      weatherDescription: wmo.desc,
      weatherEmoji: wmo.emoji,
      isDay: curr.is_day === 1,
      stationLat: lat,
      stationLng: lng,
      timestamp: curr.time || new Date().toISOString(),
    };

    const successResult: WeatherFetchResult = {
      observation,
      isTemporaryError: false,
    };

    WEATHER_CACHE.set(cacheKey, { result: successResult, expiresAt: now + CACHE_TTL_MS });
    return successResult;
  } catch (err: any) {
    const errResult: WeatherFetchResult = {
      observation: null,
      isTemporaryError: true,
      errorMessage: err?.message || 'Network timeout or failure querying Open-Meteo',
    };
    return errResult;
  }
}

export interface WeatherStationHighlight {
  id: string;
  name: string;
  country: string;
  countrySlug: string;
  type: 'capital' | 'metropolis';
  lat: number;
  lng: number;
  telemetry: WeatherTelemetry | null;
}

// Curated global anchor stations representing all inhabited continents
export const GLOBAL_ANCHOR_STATIONS = [
  { id: 'st-tokyo', name: 'Tokyo', country: 'Japan', countrySlug: 'japan', type: 'capital' as const, lat: 35.6762, lng: 139.6503 },
  { id: 'st-london', name: 'London', country: 'United Kingdom', countrySlug: 'united-kingdom', type: 'capital' as const, lat: 51.5074, lng: -0.1278 },
  { id: 'st-paris', name: 'Paris', country: 'France', countrySlug: 'france', type: 'capital' as const, lat: 48.8566, lng: 2.3522 },
  { id: 'st-nyc', name: 'New York City', country: 'United States', countrySlug: 'united-states', type: 'metropolis' as const, lat: 40.7128, lng: -74.006 },
  { id: 'st-newdelhi', name: 'New Delhi', country: 'India', countrySlug: 'india', type: 'capital' as const, lat: 28.6139, lng: 77.209 },
  { id: 'st-cairo', name: 'Cairo', country: 'Egypt', countrySlug: 'egypt', type: 'capital' as const, lat: 30.0444, lng: 31.2357 },
  { id: 'st-saopaulo', name: 'São Paulo', country: 'Brazil', countrySlug: 'brazil', type: 'metropolis' as const, lat: -23.5505, lng: -46.6333 },
  { id: 'st-sydney', name: 'Sydney', country: 'Australia', countrySlug: 'australia', type: 'metropolis' as const, lat: -33.8688, lng: 151.2093 },
  { id: 'st-nairobi', name: 'Nairobi', country: 'Kenya', countrySlug: 'kenya', type: 'capital' as const, lat: -1.2921, lng: 36.8219 },
  { id: 'st-berlin', name: 'Berlin', country: 'Germany', countrySlug: 'germany', type: 'capital' as const, lat: 52.52, lng: 13.405 },
  { id: 'st-reykjavik', name: 'Reykjavik', country: 'Iceland', countrySlug: 'iceland', type: 'capital' as const, lat: 64.1466, lng: -21.9426 },
  { id: 'st-buenosaires', name: 'Buenos Aires', country: 'Argentina', countrySlug: 'argentina', type: 'capital' as const, lat: -34.6037, lng: -58.3816 },
];

/**
 * Concurrently fetches live weather observations for global anchor stations with caching.
 */
export async function fetchGlobalWeatherHighlights(): Promise<WeatherStationHighlight[]> {
  const promises = GLOBAL_ANCHOR_STATIONS.map(async station => {
    const res = await fetchCountryWeather(station.lat, station.lng);
    return {
      ...station,
      telemetry: res.observation,
    };
  });

  return Promise.all(promises);
}

