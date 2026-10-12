// ============================================================
// MooEarth Live — Weather Floating HUD Component
// ============================================================
// Real-time floating glassmorphic telemetry HUD displayed directly
// on the 3D Earth Globe viewport when "Turn on Weather" is active.

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface WeatherFloatingHUDProps {
  isActive: boolean;
  onToggleWeather: () => void;
  selectedCityName?: string;
  selectedCountryName?: string;
  coordinates?: { lat: number; lng: number };
  onSelectCoordinates?: (coords: { lat: number; lng: number }) => void;
  isMobile?: boolean;
}

export default function WeatherFloatingHUD({
  isActive,
  onToggleWeather,
  selectedCityName = 'World Radar',
  selectedCountryName = 'Global',
  coordinates = { lat: 20.0, lng: 0.0 },
  isMobile = false,
}: WeatherFloatingHUDProps) {
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [weatherData, setWeatherData] = useState<{
    temp: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    condition: string;
    icon: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to map Open-Meteo WMO weather code to condition + icon
  const getWeatherInfo = (code: number) => {
    if (code === 0) return { condition: 'Clear Sky', icon: '☀️' };
    if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: '⛅' };
    if (code === 3) return { condition: 'Overcast', icon: '☁️' };
    if (code === 45 || code === 48) return { condition: 'Foggy', icon: '🌫️' };
    if (code >= 51 && code <= 55) return { condition: 'Drizzle', icon: '🌦️' };
    if (code >= 61 && code <= 65) return { condition: 'Rain', icon: '🌧️' };
    if (code >= 71 && code <= 77) return { condition: 'Snowfall', icon: '❄️' };
    if (code >= 80 && code <= 82) return { condition: 'Showers', icon: '🌧️' };
    if (code >= 95) return { condition: 'Thunderstorm', icon: '⚡' };
    return { condition: 'Atmospheric', icon: '🌤️' };
  };

  useEffect(() => {
    if (!isActive) return;

    let isMounted = true;
    setIsLoading(true);

    const lat = coordinates?.lat ?? 20.0;
    const lng = coordinates?.lng ?? 0.0;

    fetch(`/api/weather/forecast?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Weather fetch failed');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const current = data.current || {};
        const code = current.weather_code ?? current.weathercode ?? 0;
        const info = getWeatherInfo(code);
        setWeatherData({
          temp: Math.round(current.temperature_2m ?? current.temperature ?? 22),
          weatherCode: code,
          windSpeed: Math.round(current.wind_speed_10m ?? current.windspeed ?? 12),
          humidity: Math.round(current.relative_humidity_2m ?? 55),
          condition: info.condition,
          icon: info.icon,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        // Deterministic fallback based on latitude if remote fetch fails
        const estimatedTemp = Math.round(28 - Math.abs(lat) * 0.45);
        setWeatherData({
          temp: estimatedTemp,
          weatherCode: 1,
          windSpeed: 14,
          humidity: 60,
          condition: 'Partly Cloudy',
          icon: '⛅',
        });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isActive, coordinates?.lat, coordinates?.lng]);

  if (!isActive) return null;

  const displayTemp = weatherData
    ? temperatureUnit === 'C'
      ? `${weatherData.temp}°C`
      : `${Math.round((weatherData.temp * 9) / 5 + 32)}°F`
    : '--';

  return (
    <AnimatePresence>
      <motion.div
        key="weather-floating-hud"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`fixed z-30 pointer-events-auto select-none ${
          isMobile
            ? 'top-20 left-4 right-4'
            : 'top-20 left-72 max-w-sm'
        }`}
      >
        <div
          className="rounded-2xl p-4 border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(8, 20, 38, 0.94) 0%, rgba(3, 8, 18, 0.96) 100%)',
          }}
        >
          {/* Cyan radar glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Status & Controls */}
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono font-black tracking-wider text-cyan-300 uppercase">
                WEATHER LAYER ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Unit Toggle */}
              <button
                onClick={() => setTemperatureUnit(u => u === 'C' ? 'F' : 'C')}
                className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-white transition-colors cursor-pointer"
                title="Toggle °C / °F"
              >
                °{temperatureUnit}
              </button>

              {/* Close / Turn Off Weather */}
              <button
                onClick={onToggleWeather}
                className="px-2 py-0.5 rounded-md bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-[10px] font-mono font-bold text-red-300 transition-colors cursor-pointer"
                title="Turn off Weather Layer"
              >
                TURN OFF ✕
              </button>
            </div>
          </div>

          {/* Main Weather Telemetry */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {selectedCityName}
              </div>
              <div className="text-[10px] text-white/50 font-mono truncate">
                {selectedCountryName} • {coordinates.lat.toFixed(1)}°, {coordinates.lng.toFixed(1)}°
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{weatherData?.icon || '🌤️'}</span>
                <span className="text-2xl font-black font-mono text-cyan-300 tracking-tight">
                  {isLoading ? '...' : displayTemp}
                </span>
                <span className="text-xs text-white/70 font-medium">
                  {weatherData?.condition}
                </span>
              </div>
            </div>

            {/* Quick Metrics Column */}
            <div className="text-right text-[10px] font-mono text-white/60 space-y-1 shrink-0">
              <div>💨 {weatherData?.windSpeed ?? '--'} km/h</div>
              <div>💧 {weatherData?.humidity ?? '--'}% hum</div>
            </div>
          </div>

          {/* Thermal Scale Bar */}
          <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[8px] font-mono text-white/40">
            <span>-20°C COLD</span>
            <div className="flex-1 mx-2 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 via-emerald-400 via-yellow-400 to-rose-600 opacity-80" />
            <span>+45°C HEAT</span>
          </div>

          {/* Radar Link */}
          <div className="mt-2.5 pt-1.5 flex justify-end">
            <Link
              href={`/weather?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&city=${encodeURIComponent(selectedCityName)}`}
              className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Full Weather Intelligence & 7-Day Radar</span>
              <span>↗</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
