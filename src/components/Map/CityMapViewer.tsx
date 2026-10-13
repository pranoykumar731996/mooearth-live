// ============================================================
// MooEarth Live — City Map Viewer (MapLibre GL JS)
// ============================================================
// High-performance 2D interactive vector & raster city explorer:
// - Powered by MapLibre GL JS with MapTiler, Esri World Street & OpenFreeMap
// - Roads, labels, topography, and geographic features
// - Pulsing target coordinate pin with city tooltip
// - Floating Live Weather Telemetry Summary
// - Return to 3D Earth action preserving orbital view & state
// - Tile error handling, watchdog timeout & automated failover
// - Full cleanup on unmount (zero WebGL context leaks)

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Map,
  NavigationControl,
  ScaleControl,
  Marker,
  Popup,
  setWorkerUrl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  type MapStyleKey,
  type MapStyleOption,
  MAP_STYLES,
  DEFAULT_CITY_ZOOM,
  getDefaultMapStyleKey,
  getFailoverStyle,
} from '@/services/map/mapStyles';

export type { MapStyleKey, MapStyleOption };
export { MAP_STYLES, DEFAULT_CITY_ZOOM };

// Configure standalone Web Worker asset in browser context
if (typeof window !== 'undefined') {
  try {
    setWorkerUrl('/maplibre-gl-worker.mjs');
  } catch {
    // ignore if already set
  }
}

export interface CityWeatherSummary {
  temperature?: number;
  apparentTemperature?: number;
  weatherDescription?: string;
  weatherEmoji?: string;
  windSpeed?: number;
  relativeHumidity?: number;
  precipitation?: number;
  units?: string;
}

export interface CityMapViewerProps {
  latitude: number;
  longitude: number;
  cityName: string;
  countryName?: string;
  initialZoom?: number;
  weatherSummary?: CityWeatherSummary | null;
  onReturnToEarth: () => void;
  onOpenWeather?: () => void;
  className?: string;
}

export default function CityMapViewer({
  latitude,
  longitude,
  cityName,
  countryName,
  initialZoom = 12.8,
  weatherSummary,
  onReturnToEarth,
  onOpenWeather,
  className = '',
}: CityMapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [activeStyleKey, setActiveStyleKey] = useState<MapStyleKey>(() => getDefaultMapStyleKey());
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentBearing, setCurrentBearing] = useState(0);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);

  // Initialize or reconfigure MapLibre
  const initMap = useCallback(
    (styleKey: MapStyleKey) => {
      if (!mapContainerRef.current) return;

      // Clear any pending watchdog timer
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }

      // Clean up previous instance if any
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore cleanup errors
        }
        mapRef.current = null;
      }

      setIsMapLoaded(false);
      setHasMapError(false);
      setErrorMessage(null);

      const styleDef = MAP_STYLES[styleKey] || MAP_STYLES['esri-street'];

      try {
        const map = new Map({
          container: mapContainerRef.current,
          style: styleDef.style,
          center: [longitude, latitude],
          zoom: initialZoom,
          pitch: 35,
          bearing: 0,
          attributionControl: {
            compact: true,
            customAttribution: styleDef.attribution,
          },
        });

        // Add standard navigation controls (Zoom + Pitch/Compass)
        const nav = new NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        });
        map.addControl(nav, 'top-right');

        // Add scale bar
        const scale = new ScaleControl({
          maxWidth: 120,
          unit: 'metric',
        });
        map.addControl(scale, 'bottom-left');

        // Create glowing location pin element
        const pinEl = document.createElement('div');
        pinEl.className = 'city-map-pin-container group cursor-pointer';
        pinEl.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></span>
            <span class="absolute w-5 h-5 rounded-full bg-cyan-500/50"></span>
            <div class="relative w-3.5 h-3.5 rounded-full bg-cyan-300 border-2 border-white shadow-[0_0_12px_rgba(6,182,212,1)]"></div>
          </div>
        `;

        // Create custom popup tooltip
        const popup = new Popup({
          offset: 20,
          closeButton: false,
          className: 'city-map-popup',
        }).setHTML(`
          <div style="background: rgba(5,5,18,0.95); backdrop-filter: blur(12px); border: 1px solid rgba(6,182,212,0.4); border-radius: 12px; padding: 8px 12px; color: #fff; font-family: monospace; font-size: 11px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
            <div style="font-weight: 700; color: #67e8f9; font-size: 13px; margin-bottom: 2px;">${cityName}</div>
            <div style="color: rgba(255,255,255,0.7); font-size: 10px;">${countryName || ''}</div>
            <div style="color: rgba(255,255,255,0.4); font-size: 9px; margin-top: 4px;">${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</div>
          </div>
        `);

        // Attach marker
        const marker = new Marker({ element: pinEl, anchor: 'center' })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map);

        markerRef.current = marker;

        // Map lifecycle listeners
        map.on('load', () => {
          if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
            watchdogTimerRef.current = null;
          }
          setIsMapLoaded(true);
          // Auto-display popup for instant clarity
          try {
            popup.addTo(map);
          } catch {
            // popup display optional
          }
        });

        map.on('move', () => {
          setCurrentZoom(Number(map.getZoom().toFixed(1)));
          setCurrentPitch(Math.round(map.getPitch()));
          setCurrentBearing(Math.round(map.getBearing()));
        });

        // Watchdog timer: If vector style hangs or network stalls for > 4.5s, failover safely
        watchdogTimerRef.current = setTimeout(() => {
          if (!mapRef.current) return;
          const isLoaded = mapRef.current.loaded();
          if (!isLoaded) {
            console.warn(`[CityMapViewer] Tile watchdog timeout (4500ms) on style "${styleKey}". Initiating failover...`);
            const failoverKey = getFailoverStyle(styleKey, true);
            if (failoverKey !== styleKey) {
              setFallbackNotice(
                `Tile provider "${MAP_STYLES[styleKey]?.label || styleKey}" is responding slowly. Switched to high-availability ${MAP_STYLES[failoverKey]?.label}.`
              );
              setActiveStyleKey(failoverKey);
            } else {
              setIsMapLoaded(true);
            }
          }
        }, 4500);

        map.on('error', (e) => {
          // Check for critical style loading or authorization failures
          const errStr = e?.error?.message || '';
          const isCritical =
            errStr.includes('Failed to fetch') ||
            errStr.includes('style') ||
            errStr.includes('Worker failed to load') ||
            errStr.includes('401') ||
            errStr.includes('403') ||
            errStr.includes('404');

          if (isCritical) {
            console.warn(`[CityMapViewer] MapLibre error encountered on style "${styleKey}":`, e.error);
            const failoverKey = getFailoverStyle(styleKey, true);
            if (failoverKey !== styleKey) {
              setFallbackNotice(
                `Connection issue with "${MAP_STYLES[styleKey]?.label || styleKey}". Switched to fallback ${MAP_STYLES[failoverKey]?.label}.`
              );
              setActiveStyleKey(failoverKey);
            } else {
              setHasMapError(true);
              setErrorMessage('Tile or network failure. You can retry or choose an alternative map style.');
            }
          }
        });

        mapRef.current = map;
      } catch (err: any) {
        console.error('Failed to initialize MapLibre GL map:', err);
        setHasMapError(true);
        setErrorMessage(err?.message || 'Unable to initialize WebGL city map.');
      }
    },
    [latitude, longitude, cityName, countryName, initialZoom]
  );

  // Mount effect
  useEffect(() => {
    initMap(activeStyleKey);

    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore cleanup error
        }
        mapRef.current = null;
      }
    };
  }, [initMap, activeStyleKey]);

  // Handle fly-to coordinate updates if parent changes props
  useEffect(() => {
    if (mapRef.current && isMapLoaded) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: initialZoom,
        essential: true,
      });
      if (markerRef.current) {
        markerRef.current.setLngLat([longitude, latitude]);
      }
    }
  }, [latitude, longitude, initialZoom, isMapLoaded]);

  // Center map on city marker
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: initialZoom,
        pitch: 35,
        bearing: 0,
        speed: 1.2,
      });
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-0 bg-[#020208] text-white overflow-hidden select-none ${className}`}
      data-testid="city-map-viewer"
    >
      {/* ── Map Canvas Container ─────────────────────── */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* ── Fallback Notification Toast ─────────────── */}
      {fallbackNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[90%] sm:max-w-md bg-[#070718]/95 border border-cyan-500/40 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-xl text-xs font-mono text-cyan-300 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 truncate">
            <span>⚡</span>
            <span className="truncate">{fallbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFallbackNotice(null)}
            className="text-white/40 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Top Floating Navigation HUD ──────────────── */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex items-start justify-between gap-3">
        {/* Left: "Return to Earth" Action */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            type="button"
            data-testid="return-to-earth-btn"
            onClick={onReturnToEarth}
            className="group px-3.5 py-2.5 rounded-2xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 hover:text-white flex items-center gap-2.5 shadow-2xl transition-all active:scale-95 cursor-pointer"
            title="Return to interactive 3D Earth globe"
          >
            <span className="text-base group-hover:rotate-12 transition-transform">🌍</span>
            <span>Return to Earth</span>
            <span className="text-[10px] text-cyan-400/60 font-normal">⟵ Orbit</span>
          </button>

          {/* City Badge & Recenter Button */}
          <div className="px-3.5 py-2 rounded-2xl bg-[#050512]/90 backdrop-blur-xl border border-white/10 text-xs font-mono flex items-center gap-2 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <div className="min-w-0">
              <div className="font-bold text-white truncate max-w-[180px] sm:max-w-[240px]">
                {cityName}
              </div>
              <div className="text-[10px] text-white/50 truncate">
                {countryName || 'Metropolis'} · {latitude.toFixed(2)}°, {longitude.toFixed(2)}°
              </div>
            </div>
            <button
              type="button"
              onClick={handleRecenter}
              className="ml-1 p-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-white/60 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Recenter camera on city marker"
              aria-label="Recenter"
            >
              🎯
            </button>
          </div>
        </div>

        {/* Right: Style Selector & Weather Summary */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Style Selector Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              data-testid="map-style-selector-btn"
              onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
              className="px-3 py-1.5 rounded-xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 text-[11px] font-mono text-white/80 hover:text-white flex items-center gap-1.5 shadow-xl transition-all cursor-pointer"
              title="Change Map Tiles & Styling"
            >
              <span className="text-cyan-400">🗺️</span>
              <span className="font-semibold">{MAP_STYLES[activeStyleKey]?.label || 'Map Style'}</span>
              <span className="text-[9px] text-white/40">▼</span>
            </button>

            {isStyleMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-[#070718]/98 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-40 space-y-1">
                {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => {
                  const opt = MAP_STYLES[key];
                  const isActive = activeStyleKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setActiveStyleKey(key);
                        setIsStyleMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400' : 'bg-transparent'}`} />
                        <span className="truncate">{opt.label}</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-white/40">
                        {opt.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compact Live Weather Summary Badge */}
          {weatherSummary && (
            <div
              data-testid="city-weather-summary-card"
              className="px-3.5 py-2.5 rounded-2xl bg-[#050512]/90 backdrop-blur-xl border border-cyan-500/20 shadow-2xl flex flex-col gap-1 max-w-[220px]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">
                    {weatherSummary.weatherEmoji || '🌤️'}
                  </span>
                  <div>
                    <div className="text-sm font-black text-white font-mono leading-tight">
                      {typeof weatherSummary.temperature === 'number'
                        ? `${Math.round(weatherSummary.temperature)}°${weatherSummary.units === 'fahrenheit' ? 'F' : 'C'}`
                        : '—'}
                    </div>
                    <div className="text-[10px] text-white/50 truncate max-w-[110px]">
                      {weatherSummary.weatherDescription || 'Current weather'}
                    </div>
                  </div>
                </div>

                {onOpenWeather && (
                  <button
                    type="button"
                    onClick={onOpenWeather}
                    className="p-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono transition-colors cursor-pointer"
                    title="Open full meteorological radar and forecasts"
                  >
                    Radar ↗
                  </button>
                )}
              </div>

              {/* Extra telemetry pill */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[9px] font-mono text-white/40">
                {typeof weatherSummary.windSpeed === 'number' && (
                  <span>💨 {Math.round(weatherSummary.windSpeed)} km/h</span>
                )}
                {typeof weatherSummary.relativeHumidity === 'number' && (
                  <span>💧 {weatherSummary.relativeHumidity}%</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Telemetry & Attribution Bar ───────── */}
      <div className="absolute bottom-2 left-4 right-4 z-20 pointer-events-none flex items-end justify-between text-[10px] font-mono text-white/40">
        {/* Telemetry coords */}
        <div className="bg-[#050512]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 pointer-events-auto">
          <span>ZOOM: {currentZoom}</span>
          <span className="mx-1.5 text-white/20">|</span>
          <span>PITCH: {currentPitch}°</span>
          <span className="mx-1.5 text-white/20">|</span>
          <span>BEARING: {currentBearing}°</span>
        </div>

        {/* Tile Provider Attribution Notice */}
        <div className="bg-[#050512]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 pointer-events-auto max-w-[60%] truncate text-right">
          <span>{MAP_STYLES[activeStyleKey]?.attribution}</span>
        </div>
      </div>

      {/* ── Loading Spinner State ─────────────────────── */}
      {!isMapLoaded && !hasMapError && (
        <div className="absolute inset-0 bg-[#020208]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-cyan-400 font-mono text-xs tracking-wider">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-3" />
          <span>RENDERING {cityName.toUpperCase()} CITY MAP...</span>
          <span className="text-[10px] text-white/40 mt-1">
            Loading roads, labels, and tiles from {MAP_STYLES[activeStyleKey]?.label}
          </span>
        </div>
      )}

      {/* ── Tile / Network Failure Error Fallback ─────── */}
      {hasMapError && (
        <div className="absolute inset-0 bg-[#020208]/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md p-6 rounded-3xl bg-[#070718] border border-red-500/30 shadow-2xl">
            <div className="text-4xl mb-3">🗺️⚠️</div>
            <h4 className="text-base font-bold text-white mb-1.5">
              City Tile Connection Issue
            </h4>
            <p className="text-xs text-white/60 mb-4 leading-relaxed">
              {errorMessage || 'Unable to retrieve vector or raster map tiles at this moment.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => initMap(activeStyleKey)}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                🔄 Retry Loading
              </button>
              {activeStyleKey !== 'esri-street' && (
                <button
                  type="button"
                  onClick={() => setActiveStyleKey('esri-street')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  ⚡ Switch to Esri Street
                </button>
              )}
              {activeStyleKey !== 'osm' && (
                <button
                  type="button"
                  onClick={() => setActiveStyleKey('osm')}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  🗺️ Switch to OpenStreetMap
                </button>
              )}
              <button
                type="button"
                onClick={onReturnToEarth}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-mono text-xs transition-colors cursor-pointer"
              >
                🌍 Return to Earth
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
