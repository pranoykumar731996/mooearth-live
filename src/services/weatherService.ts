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

/**
 * Fetch real-world weather telemetry from Open-Meteo API.
 * Never fabricates or fakes weather readings.
 */
export async function fetchCountryWeather(
  lat: number,
  lng: number
): Promise<WeatherFetchResult> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code,is_day,surface_pressure&timezone=auto`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 600 }, // 10 minutes cache
    });

    if (!res.ok) {
      return {
        observation: null,
        isTemporaryError: true,
        errorMessage: `Open-Meteo returned status ${res.status}`,
      };
    }

    const data = await res.json();
    const curr = data?.current;

    if (!curr || typeof curr.temperature_2m !== 'number') {
      return {
        observation: null,
        isTemporaryError: true,
        errorMessage: 'Invalid current telemetry payload from Open-Meteo',
      };
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

    return {
      observation,
      isTemporaryError: false,
    };
  } catch (err: any) {
    return {
      observation: null,
      isTemporaryError: true,
      errorMessage: err?.message || 'Network timeout or failure querying Open-Meteo',
    };
  }
}
