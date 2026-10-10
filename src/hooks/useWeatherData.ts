// ============================================================
// MooEarth Live — useWeatherData Hook
// ============================================================
// Client-side hook for fetching weather data from our API routes.
// Handles loading, error, and caching states.

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ForecastResponse,
  AirQualityResponse,
  ElevationResponse,
  FloodResponse,
  MarineResponse,
  GeocodingResponse,
  SelectedWeatherLocation,
  WeatherLayerMode,
} from '@/services/weather/types';

// ── Debounce Helper ───────────────────────────────────────────

function useDebounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: unknown[]) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs]
  ) as T;
}

// ── Fetch helpers ─────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Main Hook ─────────────────────────────────────────────────

export interface WeatherData {
  forecast: ForecastResponse | null;
  airQuality: AirQualityResponse | null;
  elevation: ElevationResponse | null;
  flood: FloodResponse | null;
  marine: MarineResponse | null;
}

export interface WeatherDataState {
  data: WeatherData;
  loading: {
    forecast: boolean;
    airQuality: boolean;
    elevation: boolean;
    flood: boolean;
    marine: boolean;
  };
  errors: {
    forecast: string | null;
    airQuality: string | null;
    elevation: string | null;
    flood: string | null;
    marine: string | null;
  };
  selectedLocation: SelectedWeatherLocation | null;
  activeLayer: WeatherLayerMode;
}

export function useWeatherData() {
  const [state, setState] = useState<WeatherDataState>({
    data: {
      forecast: null,
      airQuality: null,
      elevation: null,
      flood: null,
      marine: null,
    },
    loading: {
      forecast: false,
      airQuality: false,
      elevation: false,
      flood: false,
      marine: false,
    },
    errors: {
      forecast: null,
      airQuality: null,
      elevation: null,
      flood: null,
      marine: null,
    },
    selectedLocation: null,
    activeLayer: 'overview',
  });

  const setActiveLayer = useCallback((layer: WeatherLayerMode) => {
    setState(prev => ({ ...prev, activeLayer: layer }));
  }, []);

  // Fetch forecast
  const fetchForecast = useCallback(async (lat: number, lng: number) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, forecast: true },
      errors: { ...prev.errors, forecast: null },
    }));
    try {
      const data = await fetchJson<ForecastResponse>(
        `/api/weather/forecast?lat=${lat}&lng=${lng}`
      );
      setState(prev => ({
        ...prev,
        data: { ...prev.data, forecast: data },
        loading: { ...prev.loading, forecast: false },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load forecast';
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, forecast: false },
        errors: { ...prev.errors, forecast: msg },
      }));
    }
  }, []);

  // Fetch air quality
  const fetchAirQuality = useCallback(async (lat: number, lng: number) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, airQuality: true },
      errors: { ...prev.errors, airQuality: null },
    }));
    try {
      const data = await fetchJson<AirQualityResponse>(
        `/api/weather/air-quality?lat=${lat}&lng=${lng}`
      );
      setState(prev => ({
        ...prev,
        data: { ...prev.data, airQuality: data },
        loading: { ...prev.loading, airQuality: false },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load air quality';
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, airQuality: false },
        errors: { ...prev.errors, airQuality: msg },
      }));
    }
  }, []);

  // Fetch elevation
  const fetchElevation = useCallback(async (lat: number, lng: number) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, elevation: true },
      errors: { ...prev.errors, elevation: null },
    }));
    try {
      const data = await fetchJson<ElevationResponse>(
        `/api/weather/elevation?lat=${lat}&lng=${lng}`
      );
      setState(prev => ({
        ...prev,
        data: { ...prev.data, elevation: data },
        loading: { ...prev.loading, elevation: false },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load elevation';
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, elevation: false },
        errors: { ...prev.errors, elevation: msg },
      }));
    }
  }, []);

  // Fetch flood
  const fetchFlood = useCallback(async (lat: number, lng: number) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, flood: true },
      errors: { ...prev.errors, flood: null },
    }));
    try {
      const data = await fetchJson<FloodResponse>(
        `/api/weather/flood?lat=${lat}&lng=${lng}`
      );
      setState(prev => ({
        ...prev,
        data: { ...prev.data, flood: data },
        loading: { ...prev.loading, flood: false },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load flood data';
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, flood: false },
        errors: { ...prev.errors, flood: msg },
      }));
    }
  }, []);

  // Fetch marine
  const fetchMarine = useCallback(async (lat: number, lng: number) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, marine: true },
      errors: { ...prev.errors, marine: null },
    }));
    try {
      const data = await fetchJson<MarineResponse>(
        `/api/weather/marine?lat=${lat}&lng=${lng}`
      );
      setState(prev => ({
        ...prev,
        data: { ...prev.data, marine: data },
        loading: { ...prev.loading, marine: false },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load marine data';
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, marine: false },
        errors: { ...prev.errors, marine: msg },
      }));
    }
  }, []);

  // Fetch all data for a location based on active layer
  const fetchWeatherForLocation = useCallback(
    async (location: SelectedWeatherLocation) => {
      setState(prev => ({ ...prev, selectedLocation: location }));

      const { latitude, longitude } = location;

      // Always fetch forecast (it's the core data)
      fetchForecast(latitude, longitude);

      // Fetch layer-specific data
      fetchElevation(latitude, longitude);
      fetchAirQuality(latitude, longitude);
      fetchFlood(latitude, longitude);
      fetchMarine(latitude, longitude);
    },
    [fetchForecast, fetchAirQuality, fetchElevation, fetchFlood, fetchMarine]
  );

  // Search locations (debounced)
  const searchLocationsRaw = useCallback(
    async (query: string): Promise<GeocodingResponse> => {
      if (!query.trim() || query.trim().length < 2) {
        return { results: [], generationTime: 0 };
      }
      return fetchJson<GeocodingResponse>(
        `/api/weather/geocoding?q=${encodeURIComponent(query)}`
      );
    },
    []
  );

  return {
    ...state,
    setActiveLayer,
    fetchWeatherForLocation,
    searchLocations: searchLocationsRaw,
    fetchForecast,
    fetchAirQuality,
    fetchElevation,
    fetchFlood,
    fetchMarine,
  };
}

export { useDebounce };
