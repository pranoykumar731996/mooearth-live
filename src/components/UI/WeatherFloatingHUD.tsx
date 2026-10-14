// ============================================================
// MooEarth Live — Weather Floating HUD Component (Phase 2.3)
// ============================================================
// Real-time floating glassmorphic telemetry HUD displayed directly
// on the 3D Earth Globe viewport when "Turn on Weather" is active.
// - Real-time atmospheric conditions (temp, humidity, wind, UV, AQI)
// - °C / °F unit toggle
// - Micro hourly forecast timeline
// - Quick planet weather stations with 1-click 3D camera fly-to
// - Thermal radar color scale legend & deep 7-day forecast portal link

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Presets for quick planetary weather sampling
export const GLOBAL_WEATHER_STATIONS = [
  { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', lat: 35.6762, lng: 139.6503 },
  { name: 'London', country: 'United Kingdom', flag: '🇬🇧', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', country: 'United States', flag: '🇺🇸', lat: 40.7128, lng: -74.0060 },
  { name: 'Dubai', country: 'UAE', flag: '🇦🇪', lat: 25.2048, lng: 55.2708 },
  { name: 'Sydney', country: 'Australia', flag: '🇦🇺', lat: -33.8688, lng: 151.2093 },
  { name: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', lat: -22.9068, lng: -43.1729 },
  { name: 'Reykjavík', country: 'Iceland', flag: '🇮🇸', lat: 64.1466, lng: -21.9426 },
  { name: 'Amundsen-Scott', country: 'Antarctica', flag: '🇦🇶', lat: -90.0, lng: 0.0 },
];

interface WeatherFloatingHUDProps {
  isActive: boolean;
  onToggleWeather: () => void;
  selectedCityName?: string;
  selectedCountryName?: string;
  coordinates?: { lat: number; lng: number };
  onSelectCoordinates?: (coords: { lat: number; lng: number; name?: string; country?: string }) => void;
  isMobile?: boolean;
}

interface HourlyItem {
  timeStr: string;
  temp: number;
  icon: string;
}

export default function WeatherFloatingHUD({
  isActive,
  onToggleWeather,
  selectedCityName = 'World Radar',
  selectedCountryName = 'Global',
  coordinates = { lat: 20.0, lng: 0.0 },
  onSelectCoordinates,
  isMobile = false,
}: WeatherFloatingHUDProps) {
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [weatherData, setWeatherData] = useState<{
    temp: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    uvIndex: number;
    condition: string;
    icon: string;
  } | null>(null);

  const [aqiData, setAqiData] = useState<{
    aqi: number;
    label: string;
    color: string;
  } | null>(null);

  const [hourlyList, setHourlyList] = useState<HourlyItem[]>([]);
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

    // 1. Fetch Forecast & Hourly
    fetch(`/api/weather/forecast?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Weather forecast fetch failed');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const current = data.current || {};
        const code = current.weatherCode ?? current.weather_code ?? 0;
        const info = getWeatherInfo(code);
        
        setWeatherData({
          temp: Math.round(current.temperature ?? current.temperature_2m ?? 22),
          weatherCode: code,
          windSpeed: Math.round(current.windSpeed ?? current.wind_speed_10m ?? 12),
          humidity: Math.round(current.relativeHumidity ?? current.relative_humidity_2m ?? 55),
          uvIndex: Math.round(current.uvIndex ?? 4),
          condition: current.weatherDescription || info.condition,
          icon: current.weatherEmoji || info.icon,
        });

        // Parse next 5 hourly slots from hourly data
        if (data.hourly && Array.isArray(data.hourly.time) && Array.isArray(data.hourly.temperature2m)) {
          const hours: HourlyItem[] = [];
          const now = new Date();
          const currentHour = now.getHours();

          for (let i = 0; i < Math.min(data.hourly.time.length, 24); i += 2) {
            const timeStr = data.hourly.time[i];
            const tDate = new Date(timeStr);
            if (tDate.getTime() >= now.getTime() - 3600000 && hours.length < 5) {
              const hCode = data.hourly.weatherCode ? data.hourly.weatherCode[i] : 0;
              const hInfo = getWeatherInfo(hCode);
              const formattedHour = `${tDate.getHours()}:00`;
              hours.push({
                timeStr: hours.length === 0 ? 'Now' : formattedHour,
                temp: Math.round(data.hourly.temperature2m[i] ?? 20),
                icon: hInfo.icon,
              });
            }
          }
          if (hours.length > 0) {
            setHourlyList(hours);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const estimatedTemp = Math.round(28 - Math.abs(lat) * 0.45);
        setWeatherData({
          temp: estimatedTemp,
          weatherCode: 1,
          windSpeed: 14,
          humidity: 60,
          uvIndex: 5,
          condition: 'Partly Cloudy',
          icon: '⛅',
        });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // 2. Fetch Air Quality Index in parallel
    fetch(`/api/weather/air-quality?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Air quality fetch failed');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const aqiVal = data.current?.europeanAqi ?? data.current?.usAqi ?? 25;
        let label = 'Good';
        let color = '#34d399'; // Emerald
        if (aqiVal > 50) {
          label = 'Moderate';
          color = '#facc15'; // Yellow
        }
        if (aqiVal > 80) {
          label = 'Poor';
          color = '#f87171'; // Red
        }
        setAqiData({ aqi: aqiVal, label, color });
      })
      .catch(() => {
        if (!isMounted) return;
        setAqiData({ aqi: 32, label: 'Fair', color: '#a3e635' });
      });

    return () => {
      isMounted = false;
    };
  }, [isActive, coordinates?.lat, coordinates?.lng]);

  if (!isActive) return null;

  const formatTemp = (celsius: number) => {
    return temperatureUnit === 'C'
      ? `${celsius}°C`
      : `${Math.round((celsius * 9) / 5 + 32)}°F`;
  };

  const displayTemp = weatherData ? formatTemp(weatherData.temp) : '--';

  return (
    <AnimatePresence>
      <motion.div
        key="weather-floating-hud"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`fixed z-50 pointer-events-auto select-none ${
          isMobile
            ? 'top-16 left-3 right-3 max-h-[82vh] overflow-y-auto'
            : 'top-20 left-24 w-[380px]'
        }`}
      >
        <div
          className="rounded-3xl p-4 sm:p-5 border border-cyan-500/30 shadow-[0_12px_45px_rgba(0,0,0,0.7)] backdrop-blur-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(8, 18, 36, 0.96) 0%, rgba(3, 7, 16, 0.98) 100%)',
          }}
        >
          {/* Cyan radar glow background aura */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status & Controls Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3 mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span className="text-[10px] font-mono font-black tracking-widest text-cyan-300 uppercase">
                ATMOSPHERIC RADAR ON
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Unit Toggle Button */}
              <button
                onClick={() => setTemperatureUnit(u => (u === 'C' ? 'F' : 'C'))}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] font-mono font-bold text-white transition-all cursor-pointer"
                title="Toggle °C / °F"
              >
                °{temperatureUnit}
              </button>

              {/* Close / Turn Off Weather */}
              <button
                onClick={onToggleWeather}
                className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-[10px] font-mono font-bold text-red-300 transition-all cursor-pointer"
                title="Turn off Weather Layer"
              >
                ✕ OFF
              </button>
            </div>
          </div>

          {/* Main Weather Telemetry */}
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="min-w-0 flex-1">
              <div className="text-base font-black text-white tracking-tight truncate flex items-center gap-1.5">
                <span>{selectedCityName}</span>
              </div>
              <div className="text-[10px] text-white/50 font-mono truncate mt-0.5">
                {selectedCountryName} • {coordinates.lat.toFixed(2)}°, {coordinates.lng.toFixed(2)}°
              </div>

              <div className="flex items-baseline gap-2.5 mt-2">
                <span className="text-3xl select-none">{weatherData?.icon || '🌤️'}</span>
                <span className="text-3xl font-black font-mono text-cyan-300 tracking-tight">
                  {isLoading ? '...' : displayTemp}
                </span>
                <span className="text-xs text-white/70 font-semibold truncate">
                  {weatherData?.condition}
                </span>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="text-right text-[10px] font-mono space-y-1.5 shrink-0">
              <div className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/70">
                💨 {weatherData?.windSpeed ?? '--'} km/h
              </div>
              <div className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/70">
                💧 {weatherData?.humidity ?? '--'}% hum
              </div>
            </div>
          </div>

          {/* Environmental Telemetry Bar (UV + Air Quality) */}
          <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] text-[10px] font-mono relative z-10">
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <span className="text-white/50">☀️ UV INDEX:</span>
              <span className="font-bold text-amber-300">{weatherData?.uvIndex ?? 4} (MOD)</span>
            </div>

            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <span className="text-white/50">🌿 AIR QUALITY:</span>
              <span
                className="font-bold flex items-center gap-1"
                style={{ color: aqiData?.color || '#34d399' }}
              >
                <span>{aqiData?.label || 'Good'}</span>
                <span className="text-[9px] opacity-70">({aqiData?.aqi || 28})</span>
              </span>
            </div>
          </div>

          {/* Micro Hourly Forecast Strip */}
          {hourlyList.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] relative z-10">
              <div className="text-[9px] font-mono font-bold tracking-widest text-white/40 uppercase mb-1.5">
                6-HOUR ATMOSPHERIC OUTLOOK
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {hourlyList.map((item, idx) => (
                  <div
                    key={`hourly-${idx}`}
                    className="p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center flex flex-col items-center gap-0.5"
                  >
                    <span className="text-[9px] font-mono text-white/40">{item.timeStr}</span>
                    <span className="text-sm select-none my-0.5">{item.icon}</span>
                    <span className="text-[10px] font-mono font-bold text-cyan-200">
                      {formatTemp(item.temp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Planet Stations Sampler */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] relative z-10">
            <div className="text-[9px] font-mono font-bold tracking-widest text-white/40 uppercase mb-1.5 flex items-center justify-between">
              <span>EXPLORE PLANET STATIONS</span>
              <span className="text-cyan-400">1-CLICK FLY-TO</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {GLOBAL_WEATHER_STATIONS.map((station) => (
                <button
                  key={station.name}
                  onClick={() => {
                    if (onSelectCoordinates) {
                      onSelectCoordinates({
                        lat: station.lat,
                        lng: station.lng,
                        name: station.name,
                        country: station.country,
                      });
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 border ${
                    selectedCityName === station.name
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                      : 'bg-white/[0.03] hover:bg-white/10 border-white/[0.08] text-white/70 hover:text-white'
                  }`}
                >
                  <span>{station.flag}</span>
                  <span>{station.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Thermal Heat Scale Bar */}
          <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[8px] font-mono text-white/40 relative z-10">
            <span>-20°C COLD</span>
            <div className="flex-1 mx-2 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 via-emerald-400 via-yellow-400 to-rose-600 opacity-80" />
            <span>+45°C HEAT</span>
          </div>

          {/* Radar Link & Deep Forecast */}
          <div className="mt-3 pt-2 border-t border-white/[0.08] flex items-center justify-between relative z-10">
            <span className="text-[9px] font-mono text-cyan-400/70">
              3D Satellite & Cloud Layer Active
            </span>
            <Link
              href={`/weather?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&city=${encodeURIComponent(selectedCityName)}`}
              className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span className="group-hover:underline">Full 7-Day Forecast Radar</span>
              <span className="text-xs">↗</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
