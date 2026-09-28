// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Weather Provider
// ============================================================
// Fetches live weather data from Open-Meteo (free, no API key)
// and generates weather-based challenges.
//
// Challenge Types:
//   WEATHER_HUNT         — Find a country with specific weather
//   WEATHER_WIND         — Compare wind speeds between cities
//   WEATHER_TEMPERATURE  — Compare temperatures across the globe
//   WEATHER_RAIN         — Find where it's raining

import {
  ChallengeRequest,
  ChallengeType,
  DataProvider,
  EarthChallenge,
  ProviderStatus,
  ChallengeDifficulty,
  WeatherObservation,
  WeatherDataset,
} from '../types';
import { AntiRepeatEngine } from '../AntiRepeatEngine';
import { adjustTimeLimit } from '../DifficultyEngine';
import { getDefaultTimeLimit, getBasePoints } from '../registry';
import { COUNTRY_COORDINATES } from '@/lib/constants';

// ---- Configuration ----

/** How long weather data stays fresh before re-fetching (ms) */
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Maximum cities to query at once */
const MAX_CITIES = 25;

// ---- Cache ----

let weatherCache: WeatherDataset | null = null;

// ---- Helpers ----

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genId(type: string, target: string): string {
  return `weather-${type}-${target.replace(/\s/g, '').toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Map WMO weather codes to human-readable descriptions */
function weatherCodeToDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Light freezing rain', 67: 'Heavy freezing rain',
    71: 'Slight snowfall', 73: 'Moderate snowfall', 75: 'Heavy snowfall',
    77: 'Snow grains',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || `Weather code ${code}`;
}

function weatherCodeToEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

// ---- Fallback Seed Data ----

const SEED_WEATHER_OBSERVATIONS: WeatherObservation[] = [
  { lat: 28.6139, lng: 77.209, city: 'New Delhi', country: 'India', temperature: 28.5, apparentTemperature: 30.1, precipitation: 0, rain: 0, windSpeed: 8.2, windDirection: 120, cloudCover: 15, weatherCode: 1, isDay: true, timestamp: new Date().toISOString() },
  { lat: 51.5074, lng: -0.1278, city: 'London', country: 'United Kingdom', temperature: 14.2, apparentTemperature: 13.5, precipitation: 2.1, rain: 2.1, windSpeed: 22.4, windDirection: 240, cloudCover: 90, weatherCode: 61, isDay: true, timestamp: new Date().toISOString() },
  { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan', temperature: 19.8, apparentTemperature: 19.2, precipitation: 0, rain: 0, windSpeed: 12.0, windDirection: 70, cloudCover: 25, weatherCode: 2, isDay: true, timestamp: new Date().toISOString() },
  { lat: 40.7128, lng: -74.006, city: 'New York', country: 'United States', temperature: 18.0, apparentTemperature: 17.2, precipitation: 0.5, rain: 0.5, windSpeed: 16.5, windDirection: 310, cloudCover: 65, weatherCode: 51, isDay: true, timestamp: new Date().toISOString() },
  { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia', temperature: 21.3, apparentTemperature: 21.0, precipitation: 0, rain: 0, windSpeed: 14.8, windDirection: 190, cloudCover: 10, weatherCode: 0, isDay: false, timestamp: new Date().toISOString() },
  { lat: -23.5505, lng: -46.6333, city: 'São Paulo', country: 'Brazil', temperature: 24.1, apparentTemperature: 25.0, precipitation: 0, rain: 0, windSpeed: 9.3, windDirection: 160, cloudCover: 40, weatherCode: 2, isDay: false, timestamp: new Date().toISOString() },
  { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia', temperature: 3.5, apparentTemperature: 0.2, precipitation: 0, rain: 0, windSpeed: 15.1, windDirection: 340, cloudCover: 95, weatherCode: 3, isDay: true, timestamp: new Date().toISOString() },
  { lat: -1.2921, lng: 36.8219, city: 'Nairobi', country: 'Kenya', temperature: 22.0, apparentTemperature: 22.5, precipitation: 1.2, rain: 1.2, windSpeed: 11.0, windDirection: 80, cloudCover: 60, weatherCode: 80, isDay: true, timestamp: new Date().toISOString() },
  { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France', temperature: 16.2, apparentTemperature: 15.8, precipitation: 0, rain: 0, windSpeed: 10.5, windDirection: 210, cloudCover: 30, weatherCode: 1, isDay: true, timestamp: new Date().toISOString() },
  { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore', temperature: 31.4, apparentTemperature: 37.2, precipitation: 3.5, rain: 3.5, windSpeed: 7.5, windDirection: 60, cloudCover: 85, weatherCode: 95, isDay: true, timestamp: new Date().toISOString() },
  { lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'United Arab Emirates', temperature: 36.2, apparentTemperature: 39.5, precipitation: 0, rain: 0, windSpeed: 18.0, windDirection: 310, cloudCover: 5, weatherCode: 0, isDay: true, timestamp: new Date().toISOString() },
  { lat: 37.5665, lng: 126.978, city: 'Seoul', country: 'South Korea', temperature: 17.5, apparentTemperature: 16.9, precipitation: 0, rain: 0, windSpeed: 8.5, windDirection: 140, cloudCover: 20, weatherCode: 1, isDay: true, timestamp: new Date().toISOString() },
  { lat: -34.6037, lng: -58.3816, city: 'Buenos Aires', country: 'Argentina', temperature: 19.1, apparentTemperature: 18.8, precipitation: 0, rain: 0, windSpeed: 13.2, windDirection: 90, cloudCover: 35, weatherCode: 2, isDay: false, timestamp: new Date().toISOString() },
  { lat: 30.0444, lng: 31.2357, city: 'Cairo', country: 'Egypt', temperature: 31.0, apparentTemperature: 32.5, precipitation: 0, rain: 0, windSpeed: 14.0, windDirection: 350, cloudCover: 0, weatherCode: 0, isDay: true, timestamp: new Date().toISOString() },
  { lat: 19.4326, lng: -99.1332, city: 'Mexico City', country: 'Mexico', temperature: 23.4, apparentTemperature: 23.0, precipitation: 0, rain: 0, windSpeed: 9.8, windDirection: 45, cloudCover: 45, weatherCode: 2, isDay: false, timestamp: new Date().toISOString() },
];

// ---- Data Fetching ----

/**
 * Fetch weather observations for multiple cities via Open-Meteo.
 * Uses batch coordinates to minimize API calls with a strict 1500ms timeout.
 */
async function fetchWeatherData(): Promise<WeatherObservation[]> {
  try {
    const entries = Object.entries(COUNTRY_COORDINATES);
    const selected = shuffle(entries).slice(0, MAX_CITIES);

    const lats = selected.map(([, d]) => d.lat).join(',');
    const lngs = selected.map(([, d]) => d.lng).join(',');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,apparent_temperature,precipitation,rain,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code,is_day&timezone=auto`;

    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();

    // Open-Meteo returns an array when multiple coordinates are provided
    const results: WeatherObservation[] = [];
    const items = Array.isArray(data) ? data : [data];

    for (let i = 0; i < items.length && i < selected.length; i++) {
      const item = items[i];
      const [, coordData] = selected[i];
      const current = item?.current;
      if (!current) continue;

      results.push({
        lat: coordData.lat,
        lng: coordData.lng,
        city: coordData.city || 'Unknown',
        country: coordData.country || selected[i][0],
        temperature: current.temperature_2m ?? 0,
        apparentTemperature: current.apparent_temperature ?? 0,
        precipitation: current.precipitation ?? 0,
        rain: current.rain ?? 0,
        windSpeed: current.wind_speed_10m ?? 0,
        windDirection: current.wind_direction_10m ?? 0,
        cloudCover: current.cloud_cover ?? 0,
        weatherCode: current.weather_code ?? 0,
        isDay: current.is_day === 1,
        timestamp: new Date().toISOString(),
      });
    }

    return results.length >= 4 ? results : SEED_WEATHER_OBSERVATIONS;
  } catch (error) {
    console.warn('[WeatherProvider] Open-Meteo fetch failed/timed out, using seed observations:', error);
    return SEED_WEATHER_OBSERVATIONS;
  }
}

/** Get or refresh cached weather data */
async function getWeatherData(): Promise<WeatherObservation[]> {
  const now = Date.now();

  if (weatherCache && now < weatherCache.expiresAt) {
    return weatherCache.observations;
  }

  try {
    const observations = await fetchWeatherData();
    const result = observations.length >= 4 ? observations : SEED_WEATHER_OBSERVATIONS;
    weatherCache = {
      observations: result,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL_MS,
    };
    return result;
  } catch {
    return weatherCache?.observations || SEED_WEATHER_OBSERVATIONS;
  }
}

// ---- Challenge Generators ----

function generateWeatherHunt(
  observations: WeatherObservation[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  if (observations.length < 4) return null;

  // Pick a specific weather condition to hunt for
  const rainyObs = observations.filter(o => o.rain > 0 || o.precipitation > 1);
  const coldObs = observations.filter(o => o.temperature < 5);
  const hotObs = observations.filter(o => o.temperature > 30);
  const windyObs = observations.filter(o => o.windSpeed > 20);
  const cloudyObs = observations.filter(o => o.cloudCover > 80);

  const conditions: { label: string; emoji: string; obs: WeatherObservation[] }[] = [];
  if (rainyObs.length > 0) conditions.push({ label: 'raining', emoji: '🌧️', obs: rainyObs });
  if (coldObs.length > 0) conditions.push({ label: 'below 5°C', emoji: '🥶', obs: coldObs });
  if (hotObs.length > 0) conditions.push({ label: 'above 30°C', emoji: '🥵', obs: hotObs });
  if (windyObs.length > 0) conditions.push({ label: 'winds above 20 km/h', emoji: '💨', obs: windyObs });
  if (cloudyObs.length > 0) conditions.push({ label: 'mostly cloudy', emoji: '☁️', obs: cloudyObs });

  if (conditions.length === 0) {
    // Fallback: just find a country with its current weather
    const target = shuffle(observations)[0];
    const desc = weatherCodeToDescription(target.weatherCode);
    return buildWeatherHuntChallenge(target, `experiencing ${desc.toLowerCase()}`, weatherCodeToEmoji(target.weatherCode), difficulty);
  }

  const condition = shuffle(conditions)[0];
  const target = shuffle(condition.obs)[0];

  return buildWeatherHuntChallenge(target, condition.label, condition.emoji, difficulty);
}

function buildWeatherHuntChallenge(
  target: WeatherObservation,
  conditionLabel: string,
  emoji: string,
  difficulty: ChallengeDifficulty
): EarthChallenge {
  const hint = difficulty === 'easy'
    ? `Hint: Look in the area around ${target.country}.`
    : undefined;

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('WEATHER_HUNT'), difficulty);

  return {
    id: genId('hunt', target.country),
    type: 'WEATHER_HUNT',
    engine: 'weather',
    difficulty,
    responseType: 'globe_tap',
    question: `${emoji} Find a country where it is currently ${conditionLabel}.`,
    hint,
    explanation: `${weatherCodeToEmoji(target.weatherCode)} ${target.city}, ${target.country} — ${weatherCodeToDescription(target.weatherCode)}, ${target.temperature}°C.`,
    targetCountry: target.country,
    targetCity: target.city,
    targetCoordinates: { lat: target.lat, lng: target.lng },
    points: getBasePoints('WEATHER_HUNT', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint('weather', 'WEATHER_HUNT', target.country, target.timestamp),
    source: 'Open-Meteo',
    sourceDataTimestamp: target.timestamp,
    data: { observation: target },
  };
}

function generateTemperatureChallenge(
  observations: WeatherObservation[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  if (observations.length < 4) return null;

  // Sort by temperature and pick interesting comparisons
  const sorted = [...observations].sort((a, b) => b.temperature - a.temperature);
  const hottest = sorted[0];
  const coldest = sorted[sorted.length - 1];

  // Build multiple-choice: "Which city is hotter right now?"
  const candidates = shuffle(observations).slice(0, 4);
  // Ensure the hottest is among the choices
  if (!candidates.find(c => c.city === hottest.city)) {
    candidates[0] = hottest;
  }
  const shuffledChoices = shuffle(candidates);
  const correctIndex = shuffledChoices.findIndex(c => c.city === hottest.city);

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('WEATHER_TEMPERATURE'), difficulty);

  return {
    id: genId('temp', hottest.country),
    type: 'WEATHER_TEMPERATURE',
    engine: 'weather',
    difficulty,
    responseType: 'multiple_choice',
    question: `🌡️ Which city currently has the highest temperature?`,
    choices: shuffledChoices.map(c => `${c.city}, ${c.country}`),
    correctIndex,
    explanation: `${hottest.city} is at ${hottest.temperature}°C, while ${coldest.city} is at ${coldest.temperature}°C — a difference of ${Math.round(hottest.temperature - coldest.temperature)}°C!`,
    targetCountry: hottest.country,
    targetCity: hottest.city,
    points: getBasePoints('WEATHER_TEMPERATURE', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint('weather', 'WEATHER_TEMPERATURE', hottest.country, hottest.timestamp),
    source: 'Open-Meteo',
    sourceDataTimestamp: hottest.timestamp,
    data: {
      temperatures: shuffledChoices.map(c => ({ city: c.city, country: c.country, temperature: c.temperature })),
    },
  };
}

function generateWindChallenge(
  observations: WeatherObservation[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  if (observations.length < 4) return null;

  const sorted = [...observations].sort((a, b) => b.windSpeed - a.windSpeed);
  const windiest = sorted[0];

  const candidates = shuffle(observations).slice(0, 4);
  if (!candidates.find(c => c.city === windiest.city)) {
    candidates[0] = windiest;
  }
  const shuffledChoices = shuffle(candidates);
  const correctIndex = shuffledChoices.findIndex(c => c.city === windiest.city);

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('WEATHER_WIND'), difficulty);

  return {
    id: genId('wind', windiest.country),
    type: 'WEATHER_WIND',
    engine: 'weather',
    difficulty,
    responseType: 'multiple_choice',
    question: `💨 Which city currently has the strongest winds?`,
    choices: shuffledChoices.map(c => `${c.city}, ${c.country}`),
    correctIndex,
    explanation: `${windiest.city} currently has winds of ${windiest.windSpeed} km/h from ${windiest.windDirection}°.`,
    targetCountry: windiest.country,
    targetCity: windiest.city,
    points: getBasePoints('WEATHER_WIND', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint('weather', 'WEATHER_WIND', windiest.country, windiest.timestamp),
    source: 'Open-Meteo',
    sourceDataTimestamp: windiest.timestamp,
    data: {
      windSpeeds: shuffledChoices.map(c => ({ city: c.city, country: c.country, windSpeed: c.windSpeed })),
    },
  };
}

function generateRainChallenge(
  observations: WeatherObservation[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  if (observations.length < 4) return null;

  const rainy = observations.filter(o => o.rain > 0 || o.precipitation > 0);
  const dry = observations.filter(o => o.rain === 0 && o.precipitation === 0);

  if (rainy.length === 0) {
    // No rain anywhere — ask "which city is most likely to have rain?"
    // Use the one with highest cloud cover as the answer
    const sorted = [...observations].sort((a, b) => b.cloudCover - a.cloudCover);
    const cloudiest = sorted[0];
    const candidates = shuffle(observations).slice(0, 4);
    if (!candidates.find(c => c.city === cloudiest.city)) {
      candidates[0] = cloudiest;
    }
    const shuffledChoices = shuffle(candidates);
    const correctIndex = shuffledChoices.findIndex(c => c.city === cloudiest.city);

    return {
      id: genId('rain', cloudiest.country),
      type: 'WEATHER_RAIN',
      engine: 'weather',
      difficulty,
      responseType: 'multiple_choice',
      question: `☁️ Which city currently has the most cloud cover?`,
      choices: shuffledChoices.map(c => `${c.city}, ${c.country}`),
      correctIndex,
      explanation: `${cloudiest.city} has ${cloudiest.cloudCover}% cloud cover.`,
      targetCountry: cloudiest.country,
      points: getBasePoints('WEATHER_RAIN', difficulty),
      timeLimit: adjustTimeLimit(getDefaultTimeLimit('WEATHER_RAIN'), difficulty),
      generatedAt: new Date().toISOString(),
      fingerprint: AntiRepeatEngine.computeFingerprint('weather', 'WEATHER_RAIN', cloudiest.country, cloudiest.timestamp),
      source: 'Open-Meteo',
    };
  }

  // Ask which city is experiencing rain
  const target = shuffle(rainy)[0];
  const decoys = shuffle(dry).slice(0, 3);
  const allChoices = shuffle([target, ...decoys]);
  const correctIndex = allChoices.findIndex(c => c.city === target.city);

  return {
    id: genId('rain', target.country),
    type: 'WEATHER_RAIN',
    engine: 'weather',
    difficulty,
    responseType: 'multiple_choice',
    question: `☔ Which of these cities is currently experiencing rain?`,
    choices: allChoices.map(c => `${c.city}, ${c.country}`),
    correctIndex,
    explanation: `${target.city} has ${target.rain}mm of rain right now (${weatherCodeToDescription(target.weatherCode)}).`,
    targetCountry: target.country,
    points: getBasePoints('WEATHER_RAIN', difficulty),
    timeLimit: adjustTimeLimit(getDefaultTimeLimit('WEATHER_RAIN'), difficulty),
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint('weather', 'WEATHER_RAIN', target.country, target.timestamp),
    source: 'Open-Meteo',
    sourceDataTimestamp: target.timestamp,
  };
}

// ---- Provider Implementation ----

const SUPPORTED_TYPES: ChallengeType[] = [
  'WEATHER_HUNT',
  'WEATHER_WIND',
  'WEATHER_TEMPERATURE',
  'WEATHER_RAIN',
];

export const WeatherProvider: DataProvider<WeatherDataset> = {
  engine: 'weather',
  supportedTypes: SUPPORTED_TYPES,

  async isAvailable(): Promise<boolean> {
    try {
      if (weatherCache && Date.now() < weatherCache.expiresAt) return true;
      // Quick health check — fetch a single city
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m&timezone=auto');
      return res.ok;
    } catch {
      return weatherCache !== null; // Stale cache is still usable
    }
  },

  getStatus(): ProviderStatus {
    return {
      name: 'Weather Provider (Open-Meteo)',
      engine: 'weather',
      available: weatherCache !== null || true, // Assume available if unchecked
      lastSuccessfulFetch: weatherCache?.fetchedAt ?? null,
      lastError: null,
      cacheStatus: weatherCache
        ? Date.now() < weatherCache.expiresAt ? 'fresh' : 'stale'
        : 'empty',
      latencyMs: null,
    };
  },

  getCachedData(): WeatherDataset | null {
    return weatherCache;
  },

  async generateChallenge(request: ChallengeRequest): Promise<EarthChallenge | null> {
    const difficulty = request.difficulty || 'medium';

    let observations: WeatherObservation[];
    try {
      observations = await getWeatherData();
    } catch {
      return null;
    }

    if (observations.length < 4) return null;

    if (request.type) {
      return generateWeatherByType(request.type, observations, difficulty);
    }

    // Pick a random weather challenge type
    const shuffledTypes = shuffle(SUPPORTED_TYPES);
    for (const type of shuffledTypes) {
      const challenge = generateWeatherByType(type, observations, difficulty);
      if (challenge) return challenge;
    }

    return null;
  },
};

function generateWeatherByType(
  type: ChallengeType,
  observations: WeatherObservation[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  switch (type) {
    case 'WEATHER_HUNT':
      return generateWeatherHunt(observations, difficulty);
    case 'WEATHER_TEMPERATURE':
      return generateTemperatureChallenge(observations, difficulty);
    case 'WEATHER_WIND':
      return generateWindChallenge(observations, difficulty);
    case 'WEATHER_RAIN':
      return generateRainChallenge(observations, difficulty);
    default:
      return null;
  }
}
