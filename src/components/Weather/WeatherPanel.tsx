// ============================================================
// MooEarth Live — Weather Panel Component
// ============================================================
// Displays current weather, hourly/daily forecasts, and
// layer-specific data (AQI, elevation, flood, marine).
// Bottom sheet on mobile, side panel on desktop.

'use client';

import React, { useState } from 'react';
import type {
  ForecastResponse,
  AirQualityResponse,
  ElevationResponse,
  FloodResponse,
  MarineResponse,
  WeatherLayerMode,
  SelectedWeatherLocation,
} from '@/services/weather/types';
import { categorizeEuropeanAqi, categorizeUsAqi, getAqiColor } from '@/services/weather/airQualityService';
import { describeDischarge } from '@/services/weather/floodService';
import { describeWaveConditions, waveDirectionToCompass } from '@/services/weather/marineService';
import { getWmoWeatherInfo } from '@/services/weather/forecastService';

interface WeatherPanelProps {
  forecast: ForecastResponse | null;
  airQuality: AirQualityResponse | null;
  elevation: ElevationResponse | null;
  flood: FloodResponse | null;
  marine: MarineResponse | null;
  location: SelectedWeatherLocation | null;
  activeLayer: WeatherLayerMode;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export default function WeatherPanel({
  forecast,
  airQuality,
  elevation,
  flood,
  marine,
  location,
  activeLayer,
  loading,
  errors,
  isMinimized,
  onToggleMinimize,
}: WeatherPanelProps) {
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  const formatTemp = (celsius: number | undefined | null) => {
    if (typeof celsius !== 'number') return '—';
    if (unit === 'F') return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    return `${Math.round(celsius)}°C`;
  };

  const windDir = (deg: number) => {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  if (!location) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3">🌍</div>
        <p className="text-sm text-white/60 font-medium">
          Search for a location or click on the globe to see weather data
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with minimize toggle */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-pointer"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-cyan-400">📍</span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">
              {location.name}
            </h3>
            {location.country && (
              <p className="text-[11px] text-white/50 truncate">
                {location.country} · {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Unit toggle */}
          <div className="flex rounded-lg bg-black/40 border border-white/10 p-0.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setUnit('C'); }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all
                ${unit === 'C' ? 'bg-cyan-500 text-black' : 'text-white/50'}`}
            >°C</button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setUnit('F'); }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all
                ${unit === 'F' ? 'bg-cyan-500 text-black' : 'text-white/50'}`}
            >°F</button>
          </div>
          <span className={`text-white/40 transition-transform ${isMinimized ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {isMinimized ? null : (
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-4">
          {/* ── Current Conditions ────────────────── */}
          {(activeLayer === 'overview' || activeLayer === 'temperature' || activeLayer === 'wind' || activeLayer === 'precipitation') && (
            <>
              {loading.forecast ? (
                <LoadingSkeleton />
              ) : errors.forecast ? (
                <ErrorDisplay message={errors.forecast} />
              ) : forecast ? (
                <>
                  {/* Big Temperature Display */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-5xl font-black text-white tracking-tight">
                        {formatTemp(forecast.current.temperature)}
                      </div>
                      <p className="text-sm text-white/70 mt-1 flex items-center gap-1.5">
                        <span>{forecast.current.weatherEmoji}</span>
                        <span>{forecast.current.weatherDescription}</span>
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Feels like {formatTemp(forecast.current.apparentTemperature)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-white/50 space-y-1">
                      <div>{forecast.current.isDay ? '☀️ Day' : '🌙 Night'}</div>
                      <div>{forecast.timezone}</div>
                      <div className="text-[10px] text-white/30">
                        {new Date(forecast.current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <MetricCard label="Wind" value={`${forecast.current.windSpeed.toFixed(0)} km/h`} sub={windDir(forecast.current.windDirection)} />
                    <MetricCard label="Humidity" value={`${forecast.current.relativeHumidity}%`} />
                    <MetricCard label="Pressure" value={`${forecast.current.surfacePressure.toFixed(0)} hPa`} />
                    <MetricCard label="Cloud" value={`${forecast.current.cloudCover}%`} />
                    <MetricCard label="Rain" value={`${forecast.current.precipitation} mm`} />
                    <MetricCard label="Gusts" value={`${forecast.current.windGusts.toFixed(0)} km/h`} />
                  </div>

                  {/* Hourly Forecast */}
                  <div>
                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                      Hourly Forecast
                    </h4>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {forecast.hourly.time.slice(0, 24).map((time, i) => {
                        const wmo = getWmoWeatherInfo(forecast.hourly.weatherCode[i]);
                        const isNow = i === 0;
                        return (
                          <div
                            key={time}
                            className={`shrink-0 flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border
                              ${isNow
                                ? 'bg-cyan-500/10 border-cyan-400/30'
                                : 'bg-white/[0.02] border-white/5'
                              }`}
                          >
                            <span className="text-[10px] text-white/40 font-mono">
                              {isNow ? 'Now' : new Date(time).toLocaleTimeString([], { hour: '2-digit' })}
                            </span>
                            <span className="text-sm">{wmo.emoji}</span>
                            <span className="text-xs font-bold text-white">
                              {formatTemp(forecast.hourly.temperature2m[i])}
                            </span>
                            {forecast.hourly.precipitationProbability[i] > 0 && (
                              <span className="text-[9px] text-blue-400">
                                {forecast.hourly.precipitationProbability[i]}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Forecast */}
                  <div>
                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                      7-Day Forecast
                    </h4>
                    <div className="space-y-1">
                      {forecast.daily.time.map((time, i) => {
                        const wmo = getWmoWeatherInfo(forecast.daily.weatherCode[i]);
                        const isToday = i === 0;
                        return (
                          <div
                            key={time}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl
                              ${isToday ? 'bg-cyan-500/5 border border-cyan-400/10' : 'hover:bg-white/[0.02]'}`}
                          >
                            <span className="w-12 text-xs text-white/50 font-mono shrink-0">
                              {isToday ? 'Today' : new Date(time).toLocaleDateString([], { weekday: 'short' })}
                            </span>
                            <span className="text-sm">{wmo.emoji}</span>
                            <span className="flex-1 text-xs text-white/60 truncate">{wmo.desc}</span>
                            <div className="flex items-center gap-1.5 text-xs font-mono shrink-0">
                              <span className="text-blue-300">{formatTemp(forecast.daily.temperatureMin[i])}</span>
                              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-500/40 to-orange-500/40" />
                              <span className="text-orange-300">{formatTemp(forecast.daily.temperatureMax[i])}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}

          {/* ── Air Quality ─────────────────────── */}
          {activeLayer === 'air-quality' && (
            <>
              {loading.airQuality ? (
                <LoadingSkeleton />
              ) : errors.airQuality ? (
                <ErrorDisplay message={errors.airQuality} />
              ) : airQuality ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">
                    Air Quality Index
                  </h4>
                  {airQuality.current.europeanAqi !== null && (
                    <AqiBadge
                      label="European AQI"
                      value={airQuality.current.europeanAqi}
                      category={categorizeEuropeanAqi(airQuality.current.europeanAqi)}
                    />
                  )}
                  {airQuality.current.usAqi !== null && (
                    <AqiBadge
                      label="US AQI"
                      value={airQuality.current.usAqi}
                      category={categorizeUsAqi(airQuality.current.usAqi)}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {airQuality.current.pm25 !== null && (
                      <MetricCard label="PM2.5" value={`${airQuality.current.pm25.toFixed(1)} µg/m³`} />
                    )}
                    {airQuality.current.pm10 !== null && (
                      <MetricCard label="PM10" value={`${airQuality.current.pm10.toFixed(1)} µg/m³`} />
                    )}
                    {airQuality.current.ozone !== null && (
                      <MetricCard label="Ozone (O₃)" value={`${airQuality.current.ozone.toFixed(1)} µg/m³`} />
                    )}
                    {airQuality.current.nitrogenDioxide !== null && (
                      <MetricCard label="NO₂" value={`${airQuality.current.nitrogenDioxide.toFixed(1)} µg/m³`} />
                    )}
                    {airQuality.current.sulphurDioxide !== null && (
                      <MetricCard label="SO₂" value={`${airQuality.current.sulphurDioxide.toFixed(1)} µg/m³`} />
                    )}
                    {airQuality.current.carbonMonoxide !== null && (
                      <MetricCard label="CO" value={`${airQuality.current.carbonMonoxide.toFixed(0)} µg/m³`} />
                    )}
                  </div>
                  <p className="text-[10px] text-white/30 pt-2">
                    Air quality forecast data. Not a ground-station measurement. Source: Open-Meteo.com
                  </p>
                </div>
              ) : null}
            </>
          )}

          {/* ── Elevation ──────────────────────── */}
          {activeLayer === 'elevation' && (
            <>
              {loading.elevation ? (
                <LoadingSkeleton />
              ) : errors.elevation ? (
                <ErrorDisplay message={errors.elevation} />
              ) : elevation ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">
                    Terrain Elevation
                  </h4>
                  <div className="flex items-end gap-4">
                    <div>
                      <div className="text-4xl font-black text-white">
                        {Math.round(elevation.elevation)} m
                      </div>
                      <p className="text-sm text-white/50 mt-1">
                        {elevation.elevationFeet.toLocaleString()} ft above sea level
                      </p>
                    </div>
                    <span className="text-4xl">⛰️</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <MetricCard label="Latitude" value={`${elevation.latitude.toFixed(4)}°`} />
                    <MetricCard label="Longitude" value={`${elevation.longitude.toFixed(4)}°`} />
                  </div>
                  <p className="text-[10px] text-white/30 pt-2">
                    Elevation data from digital terrain models. Source: Open-Meteo.com
                  </p>
                </div>
              ) : null}
            </>
          )}

          {/* ── Flood ──────────────────────────── */}
          {activeLayer === 'flood' && (
            <>
              {loading.flood ? (
                <LoadingSkeleton />
              ) : errors.flood ? (
                <ErrorDisplay message={errors.flood} />
              ) : flood ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">
                    River Discharge Forecast
                  </h4>
                  {!flood.dataAvailable ? (
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200">
                      <p className="font-semibold mb-1">⚠️ No flood data available for this location</p>
                      <p className="text-yellow-200/70">
                        This does NOT mean the area is safe from flooding. The GloFAS model may not cover this specific location.
                        Always refer to official emergency services for flood warnings.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        {flood.daily.time.slice(0, 7).map((time, i) => {
                          const discharge = flood.daily.riverDischarge[i];
                          return (
                            <div key={time} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.02]">
                              <span className="w-16 text-xs text-white/50 font-mono shrink-0">
                                {new Date(time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="flex-1 text-xs text-white/60">
                                {describeDischarge(discharge)}
                              </span>
                              <span className="text-xs font-mono text-white/70 shrink-0">
                                {discharge !== null ? `${discharge.toFixed(1)} m³/s` : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-white/30 pt-2">
                        River discharge forecast (GloFAS). Not a substitute for official flood warnings. Source: Open-Meteo.com
                      </p>
                    </>
                  )}
                </div>
              ) : null}
            </>
          )}

          {/* ── Marine ─────────────────────────── */}
          {activeLayer === 'marine' && (
            <>
              {loading.marine ? (
                <LoadingSkeleton />
              ) : errors.marine ? (
                <ErrorDisplay message={errors.marine} />
              ) : marine ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">
                    Marine Forecast
                  </h4>
                  {!marine.dataAvailable ? (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                      <p className="font-semibold mb-1">🏔️ No marine data available</p>
                      <p className="text-blue-200/70">
                        Marine weather is only available for ocean and coastal locations.
                        This location appears to be inland.
                      </p>
                    </div>
                  ) : marine.current ? (
                    <>
                      <div className="flex items-end gap-4">
                        <div>
                          <div className="text-3xl font-black text-white">
                            {marine.current.waveHeight !== null
                              ? `${marine.current.waveHeight.toFixed(1)} m`
                              : '—'}
                          </div>
                          <p className="text-sm text-white/50 mt-1">
                            {describeWaveConditions(marine.current.waveHeight)}
                          </p>
                        </div>
                        <span className="text-3xl">🌊</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <MetricCard
                          label="Wave Direction"
                          value={waveDirectionToCompass(marine.current.waveDirection)}
                          sub={marine.current.waveDirection !== null ? `${marine.current.waveDirection}°` : undefined}
                        />
                        <MetricCard
                          label="Wave Period"
                          value={marine.current.wavePeriod !== null ? `${marine.current.wavePeriod.toFixed(1)} s` : '—'}
                        />
                        <MetricCard
                          label="Swell Height"
                          value={marine.current.swellWaveHeight !== null ? `${marine.current.swellWaveHeight.toFixed(1)} m` : '—'}
                        />
                        <MetricCard
                          label="Wind Wave"
                          value={marine.current.windWaveHeight !== null ? `${marine.current.windWaveHeight.toFixed(1)} m` : '—'}
                        />
                      </div>
                      <p className="text-[10px] text-white/30 pt-2">
                        Marine forecast data. Source: Open-Meteo.com
                      </p>
                    </>
                  ) : null}
                </div>
              ) : null}
            </>
          )}

          {/* ── Attribution ────────────────────── */}
          <div className="pt-4 pb-2 border-t border-white/5">
            <p className="text-[10px] text-white/25 text-center">
              Weather data by{' '}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/40 transition-colors"
              >
                Open-Meteo.com
              </a>
              {' '}· Last updated: {forecast?.fetchedAt
                ? new Date(forecast.fetchedAt).toLocaleTimeString()
                : '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub Components ────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="text-[10px] uppercase font-mono text-white/40 mb-0.5">{label}</div>
      <div className="text-sm font-bold text-white font-mono">{value}</div>
      {sub && <div className="text-[10px] text-white/30 font-mono">{sub}</div>}
    </div>
  );
}

function AqiBadge({ label, value, category }: { label: string; value: number; category: string }) {
  const color = getAqiColor(category as any);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {value}
      </div>
      <div>
        <div className="text-xs text-white/50">{label}</div>
        <div className="text-sm font-bold" style={{ color }}>{category}</div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-12 rounded-xl bg-white/[0.04]" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-white/[0.03]" />
        ))}
      </div>
      <div className="h-24 rounded-xl bg-white/[0.03]" />
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
      <p className="font-semibold mb-1">⚠️ Error loading data</p>
      <p className="text-red-300/70">{message}</p>
    </div>
  );
}
