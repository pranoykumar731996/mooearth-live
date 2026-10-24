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

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedCountryName } from '@/lib/i18n';
import type { WorldEvent } from '@/types';
import WeatherMapLibreOverlay from './WeatherMapLibreOverlay';
import RadarCoverageNotice from '@/components/Weather/RadarCoverageNotice';
import { isLocationCoveredByRadar } from '@/services/weather/radarAdapter';
import NearbyPlacesPanel from './NearbyPlacesPanel';

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

import {
  getDisasterMeta,
  type DisasterCategoryType,
  type DisasterMeta,
} from '@/services/map/disasterMapUtils';

export { getDisasterMeta, type DisasterCategoryType, type DisasterMeta };

export interface CityMapViewerProps {
  latitude: number;
  longitude: number;
  cityName: string;
  countryName?: string;
  initialZoom?: number;
  initialMapStyle?: MapStyleKey;
  weatherSummary?: CityWeatherSummary | null;
  activeLayer?: string;
  radarTileUrl?: string;
  satelliteTileUrl?: string;
  satelliteObservationUtc?: string;
  particlesEnabled?: boolean;
  disasters?: WorldEvent[];
  selectedDisaster?: WorldEvent | null;
  onSelectDisaster?: (event: WorldEvent | null) => void;
  onReturnToEarth: () => void;
  onOpenWeather?: () => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export default function CityMapViewer({
  latitude,
  longitude,
  cityName,
  countryName,
  initialZoom = 12.8,
  initialMapStyle = 'satellite',
  weatherSummary,
  activeLayer = 'wind',
  radarTileUrl,
  satelliteTileUrl,
  satelliteObservationUtc,
  particlesEnabled = true,
  disasters = [],
  selectedDisaster = null,
  onSelectDisaster,
  onReturnToEarth,
  onOpenWeather,
  onMapClick,
  className = '',
}: CityMapViewerProps) {
  const { locale, dict } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const disasterMarkersRef = useRef<{ marker: Marker; event: WorldEvent; popup: Popup }[]>([]);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [activeStyleKey, setActiveStyleKey] = useState<MapStyleKey>(() => initialMapStyle || getDefaultMapStyleKey());
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentBearing, setCurrentBearing] = useState(0);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);

  // Disaster filtering and visibility on 2D map
  const [disasterFilter, setDisasterFilter] = useState<'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms'>('all');
  const [showDisasters, setShowDisasters] = useState(true);

  // Filtered disaster list
  const filteredDisasters = useMemo(() => {
    if (!disasters || disasters.length === 0) return [];
    if (disasterFilter === 'all') return disasters;
    return disasters.filter((d) => getDisasterMeta(d).type === disasterFilter);
  }, [disasters, disasterFilter]);

  // Disaster counts
  const cycloneCount = useMemo(() => (disasters || []).filter((d) => getDisasterMeta(d).type === 'cyclone').length, [disasters]);
  const quakeCount = useMemo(() => (disasters || []).filter((d) => getDisasterMeta(d).type === 'seismic').length, [disasters]);
  const wildfireCount = useMemo(() => (disasters || []).filter((d) => getDisasterMeta(d).type === 'wildfires').length, [disasters]);
  const stormCount = useMemo(() => (disasters || []).filter((d) => getDisasterMeta(d).type === 'thunderstorms').length, [disasters]);

  // Persistent ref tracking latest city coordinates & metadata without triggering map re-initialization
  const currentLocationRef = useRef({ latitude, longitude, cityName, countryName, initialZoom });
  currentLocationRef.current = { latitude, longitude, cityName, countryName, initialZoom };

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

      const styleDef = MAP_STYLES[styleKey] || MAP_STYLES['satellite'];
      const initCoords = currentLocationRef.current;

      try {
        const map = new Map({
          container: mapContainerRef.current,
          style: styleDef.style,
          center: [initCoords.longitude, initCoords.latitude],
          zoom: initCoords.initialZoom,
          pitch: 0,
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

        // Create glowing location pin element if a specific city is selected
        const isSpecificCity = initCoords.cityName && initCoords.cityName !== 'World Map';
        if (isSpecificCity) {
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
            closeButton: true,
            className: 'city-map-popup',
          }).setHTML(`
            <div style="background: rgba(5,5,18,0.95); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(6,182,212,0.45); border-radius: 14px; padding: 10px 30px 10px 14px; color: #fff; font-family: monospace; font-size: 11px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); max-width: 260px;">
              <div style="font-weight: 800; color: #67e8f9; font-size: 13px; margin-bottom: 2px; white-space: normal; line-height: 1.25;">${initCoords.cityName}</div>
              <div style="color: rgba(255,255,255,0.75); font-size: 10px;">${initCoords.countryName || ''}</div>
              <div style="color: rgba(6,182,212,0.85); font-size: 9px; margin-top: 4px; font-weight: 600;">${initCoords.latitude.toFixed(4)}°, ${initCoords.longitude.toFixed(4)}°</div>
            </div>
          `);

          // Attach marker
          const marker = new Marker({ element: pinEl, anchor: 'center' })
            .setLngLat([initCoords.longitude, initCoords.latitude])
            .setPopup(popup)
            .addTo(map);

          markerRef.current = marker;
        } else {
          markerRef.current = null;
        }

        // Map lifecycle listeners
        map.on('load', () => {
          if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
            watchdogTimerRef.current = null;
          }
          setIsMapLoaded(true);
          // Auto-display popup for instant clarity if city marker exists
          if (markerRef.current) {
            try {
              markerRef.current.getPopup()?.addTo(map);
            } catch {
              // popup display optional
            }
          }
        });

        map.on('move', () => {
          setCurrentZoom(Number(map.getZoom().toFixed(1)));
          setCurrentPitch(Math.round(map.getPitch()));
          setCurrentBearing(Math.round(map.getBearing()));
        });

        // Click on map coordinates to inspect weather telemetry
        map.on('click', (e) => {
          const target = e.originalEvent.target as HTMLElement;
          if (target?.closest('.disaster-map-marker-container') || target?.closest('.maplibregl-popup')) {
            return;
          }
          const lat = Number(e.lngLat.lat.toFixed(4));
          const lng = Number(e.lngLat.lng.toFixed(4));
          onMapClick?.({ lat, lng });
        });

        // Watchdog timer: If vector style hangs or network stalls for > 4.5s, failover safely
        watchdogTimerRef.current = setTimeout(() => {
          if (!mapRef.current) return;
          if (styleKey === 'satellite') return; // Satellite raster tiles stream continuously, do not trigger false timeout
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
    [onMapClick]
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
      disasterMarkersRef.current.forEach(({ marker }) => {
        try {
          marker.remove();
        } catch {
          // ignore
        }
      });
      disasterMarkersRef.current = [];
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

  // Handle fly-to coordinate updates if parent changes props without destroying map instance
  useEffect(() => {
    if (mapRef.current && isMapLoaded) {
      if (cityName && cityName !== 'World Map') {
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: initialZoom,
          essential: true,
        });

        const popupHtml = `
          <div style="background: rgba(5,5,18,0.95); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(6,182,212,0.45); border-radius: 14px; padding: 10px 30px 10px 14px; color: #fff; font-family: monospace; font-size: 11px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); max-width: 260px;">
            <div style="font-weight: 800; color: #67e8f9; font-size: 13px; margin-bottom: 2px; white-space: normal; line-height: 1.25;">${cityName}</div>
            <div style="color: rgba(255,255,255,0.75); font-size: 10px;">${countryName || ''}</div>
            <div style="color: rgba(6,182,212,0.85); font-size: 9px; margin-top: 4px; font-weight: 600;">${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</div>
          </div>
        `;

        if (markerRef.current) {
          markerRef.current.setLngLat([longitude, latitude]);
          markerRef.current.getPopup()?.setHTML(popupHtml);
        } else {
          const pinEl = document.createElement('div');
          pinEl.className = 'city-map-pin-container group cursor-pointer';
          pinEl.innerHTML = `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></span>
              <span class="absolute w-5 h-5 rounded-full bg-cyan-500/50"></span>
              <div class="relative w-3.5 h-3.5 rounded-full bg-cyan-300 border-2 border-white shadow-[0_0_12px_rgba(6,182,212,1)]"></div>
            </div>
          `;
          const popup = new Popup({
            offset: 20,
            closeButton: true,
            className: 'city-map-popup',
          }).setHTML(popupHtml);

          markerRef.current = new Marker({ element: pinEl, anchor: 'center' })
            .setLngLat([longitude, latitude])
            .setPopup(popup)
            .addTo(mapRef.current);
          try {
            popup.addTo(mapRef.current);
          } catch {
            // popup display optional
          }
        }
      }
    }
  }, [latitude, longitude, initialZoom, isMapLoaded, cityName, countryName]);

  // Synchronize 2D Disaster and Cyclone Markers with MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Clear previous markers
    disasterMarkersRef.current.forEach(({ marker }) => {
      try {
        marker.remove();
      } catch {
        // ignore
      }
    });
    disasterMarkersRef.current = [];

    if (!showDisasters || filteredDisasters.length === 0) return;

    filteredDisasters.forEach((event) => {
      if (typeof event.lat !== 'number' || typeof event.lng !== 'number') return;
      if (isNaN(event.lat) || isNaN(event.lng)) return;

      const meta = getDisasterMeta(event);
      const isSelected = selectedDisaster?.id === event.id;

      // Build marker DOM element
      const el = document.createElement('div');
      el.className = `disaster-map-marker-container disaster-${meta.type} cursor-pointer group`;
      el.setAttribute('data-disaster-id', event.id);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `${event.title} - ${meta.categoryLabel}`);

      el.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; user-select: none;">
          <!-- Animated outer ring based on hazard type -->
          ${
            meta.type === 'cyclone'
              ? `<div style="position: absolute; width: 44px; height: 44px; top: -5px; border-radius: 9999px; border: 2px dashed rgba(6,182,212,0.8); animation: cyclone-spin 5s linear infinite; pointer-events: none;"></div>
                 <div style="position: absolute; width: 48px; height: 48px; top: -7px; border-radius: 9999px; background: rgba(6,182,212,0.2); animation: marker-glow-pulse 2.5s ease-in-out infinite; pointer-events: none;"></div>`
              : meta.type === 'seismic'
              ? `<div style="position: absolute; width: 50px; height: 50px; top: -8px; border-radius: 9999px; border: 2px solid rgba(244,63,94,0.7); animation: seismic-shockwave 2s ease-out infinite; pointer-events: none;"></div>
                 <div style="position: absolute; width: 44px; height: 44px; top: -5px; border-radius: 9999px; background: rgba(244,63,94,0.25); animation: marker-glow-pulse 2s ease-in-out infinite; pointer-events: none;"></div>`
              : meta.type === 'wildfires'
              ? `<div style="position: absolute; width: 46px; height: 46px; top: -6px; border-radius: 9999px; background: radial-gradient(circle, rgba(249,115,22,0.45) 0%, transparent 70%); animation: marker-glow-pulse 2s ease-in-out infinite; pointer-events: none;"></div>`
              : `<div style="position: absolute; width: 44px; height: 44px; top: -5px; border-radius: 9999px; border: 1.5px solid ${meta.colorHex}; opacity: 0.6; animation: marker-glow-pulse 2.5s ease-in-out infinite; pointer-events: none;"></div>`
          }

          <!-- Core Badge -->
          <div style="
            position: relative;
            width: 34px;
            height: 34px;
            border-radius: 9999px;
            background: #060818;
            border: 2px solid ${isSelected ? '#ffffff' : meta.colorHex};
            box-shadow: 0 0 ${isSelected ? '22px' : '14px'} ${meta.glowRgba};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          ">
            ${meta.type === 'cyclone' ? `<span style="display: inline-block; animation: cyclone-spin 4s linear infinite;">${meta.icon}</span>` : meta.icon}
          </div>

          <!-- Instant Name & Telemetry Label Pill (Always visible on 2D map!) -->
          <div style="
            margin-top: 4px;
            padding: 2.5px 7px;
            border-radius: 8px;
            background: rgba(5, 5, 18, 0.95);
            border: 1px solid ${isSelected ? '#ffffff' : `${meta.colorHex}66`};
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
            pointer-events: none;
            font-family: monospace;
            font-size: 10px;
            backdrop-filter: blur(8px);
          ">
            <span style="font-weight: 700; color: #ffffff;">${meta.cleanTitle}</span>
            <span style="
              padding: 1px 4px;
              border-radius: 4px;
              background: ${meta.badgeBg};
              border: 1px solid ${meta.badgeBorder};
              color: ${meta.colorHex};
              font-weight: 800;
              font-size: 9px;
            ">${meta.categoryLabel}</span>
          </div>
        </div>
      `;

      // Custom Popup
      const popup = new Popup({
        offset: 24,
        closeButton: true,
        className: 'disaster-map-popup',
        maxWidth: '320px',
      }).setHTML(`
        <div style="
          background: rgba(6, 8, 24, 0.97);
          backdrop-filter: blur(20px);
          border: 1px solid ${meta.colorHex}66;
          border-radius: 16px;
          padding: 14px 16px;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px ${meta.glowRgba}33;
          min-width: 250px;
          max-width: 300px;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">${meta.icon}</span>
              <span style="font-family: monospace; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${meta.colorHex};">
                ${meta.type === 'cyclone' ? 'TROPICAL CYCLONE' : meta.type === 'seismic' ? 'SEISMIC EVENT' : meta.type === 'wildfires' ? 'THERMAL WILDFIRE' : meta.type === 'space_weather' ? 'SPACE WEATHER' : 'SEVERE STORM'}
              </span>
            </div>
            <span style="font-family: monospace; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: ${meta.badgeBg}; border: 1px solid ${meta.badgeBorder}; color: ${meta.colorHex};">
              ${meta.categoryLabel}
            </span>
          </div>

          <div style="font-size: 13px; font-weight: 800; color: #ffffff; line-height: 1.3; margin-bottom: 3px;">
            ${event.title}
          </div>

          <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; font-family: monospace;">
            📍 ${event.city ? `${event.city}` : ''}${event.country ? ` · ${event.country}` : ''} (${event.lat.toFixed(2)}°, ${event.lng.toFixed(2)}°)
          </div>

          <div style="font-size: 11px; line-height: 1.45; color: rgba(255, 255, 255, 0.8); margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${event.summary}
          </div>

          <!-- Telemetry Badge Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 6px 8px; border-radius: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06); font-family: monospace; font-size: 10px; margin-bottom: 10px;">
            ${event.planetaryTelemetry?.windSpeedKph ? `
              <div><span style="color: rgba(255,255,255,0.4);">WIND:</span> <strong style="color: #67e8f9;">${Math.round(event.planetaryTelemetry.windSpeedKph)} km/h</strong></div>
            ` : ''}
            ${event.planetaryTelemetry?.pressureHpa ? `
              <div><span style="color: rgba(255,255,255,0.4);">PRES:</span> <strong style="color: #67e8f9;">${event.planetaryTelemetry.pressureHpa} hPa</strong></div>
            ` : ''}
            ${event.planetaryTelemetry?.magnitude ? `
              <div><span style="color: rgba(255,255,255,0.4);">MAG:</span> <strong style="color: #fda4af;">M ${event.planetaryTelemetry.magnitude.toFixed(1)}</strong></div>
            ` : ''}
            ${event.planetaryTelemetry?.fireRadiativePowerMw ? `
              <div><span style="color: rgba(255,255,255,0.4);">FRP:</span> <strong style="color: #fcd34d;">${event.planetaryTelemetry.fireRadiativePowerMw} MW</strong></div>
            ` : ''}
            ${event.source ? `
              <div style="grid-column: span 2;"><span style="color: rgba(255,255,255,0.4);">SRC:</span> <strong style="color: rgba(255,255,255,0.85);">${event.source}</strong></div>
            ` : ''}
          </div>

          <button type="button" class="inspect-dossier-btn" data-event-id="${event.id}" style="
            width: 100%;
            padding: 7px 10px;
            border-radius: 10px;
            background: linear-gradient(135deg, ${meta.colorHex}22, ${meta.colorHex}44);
            border: 1px solid ${meta.colorHex}88;
            color: #ffffff;
            font-family: monospace;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          ">
            <span>📊 Inspect Telemetry Dossier</span>
            <span>↗</span>
          </button>
        </div>
      `);

      // Click / touch handler on marker
      const handleSelect = (e: Event) => {
        e.stopPropagation();
        onSelectDisaster?.(event);
        map.flyTo({
          center: [event.lng, event.lat],
          zoom: Math.max(map.getZoom(), 5.5),
          speed: 1.2,
          essential: true,
        });
        popup.addTo(map);
      };

      el.addEventListener('click', handleSelect);
      el.addEventListener('touchend', handleSelect);

      // Popup dossier inspect button handler
      popup.on('open', () => {
        const pEl = popup.getElement();
        if (pEl) {
          const btn = pEl.querySelector(`.inspect-dossier-btn[data-event-id="${event.id}"]`);
          if (btn) {
            btn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              onSelectDisaster?.(event);
            });
          }
        }
      });

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([event.lng, event.lat])
        .setPopup(popup)
        .addTo(map);

      disasterMarkersRef.current.push({ marker, event, popup });

      // If this event was already selected, open its popup
      if (isSelected) {
        try {
          popup.addTo(map);
        } catch {
          // ignore
        }
      }
    });

    return () => {
      disasterMarkersRef.current.forEach(({ marker }) => {
        try {
          marker.remove();
        } catch {
          // ignore
        }
      });
      disasterMarkersRef.current = [];
    };
  }, [filteredDisasters, showDisasters, isMapLoaded, onSelectDisaster, selectedDisaster?.id]);

  // Handle outside selectedDisaster updates (e.g. from top dashboard pills)
  useEffect(() => {
    if (selectedDisaster && mapRef.current && isMapLoaded) {
      mapRef.current.flyTo({
        center: [selectedDisaster.lng, selectedDisaster.lat],
        zoom: Math.max(mapRef.current.getZoom(), 5.5),
        speed: 1.2,
        essential: true,
      });
      const entry = disasterMarkersRef.current.find((m) => m.event.id === selectedDisaster.id);
      if (entry) {
        try {
          entry.popup.addTo(mapRef.current);
        } catch {
          // ignore
        }
      }
    }
  }, [selectedDisaster, isMapLoaded]);

  // Action: Fly to disaster when selected from 2D disaster tray
  const handleFlyToDisaster = useCallback(
    (event: WorldEvent) => {
      if (!mapRef.current) return;
      onSelectDisaster?.(event);
      mapRef.current.flyTo({
        center: [event.lng, event.lat],
        zoom: Math.max(mapRef.current.getZoom(), 5.5),
        speed: 1.2,
        essential: true,
      });
      const entry = disasterMarkersRef.current.find((m) => m.event.id === event.id);
      if (entry) {
        try {
          entry.popup.addTo(mapRef.current);
        } catch {
          // ignore
        }
      }
    },
    [onSelectDisaster]
  );

  // Synchronize NOAA Radar Raster Layer with MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const sourceId = 'noaa-mrms-radar-source';
    const layerId = 'noaa-mrms-radar-layer';
    const defaultTileUrl = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png';
    const activeTileUrl = radarTileUrl || defaultTileUrl;

    if (activeLayer === 'radar') {
      try {
        const existingSource = map.getSource(sourceId) as any;
        if (existingSource) {
          // If the tile URL changed (e.g., user stepped through past radar frames), swap smoothly
          if (existingSource.tiles?.[0] !== activeTileUrl) {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
            map.removeSource(sourceId);
            map.addSource(sourceId, {
              type: 'raster',
              tiles: [activeTileUrl],
              tileSize: 256,
              bounds: [-128.0, 24.0, -66.0, 50.0],
            });
            map.addLayer({
              id: layerId,
              type: 'raster',
              source: sourceId,
              paint: {
                'raster-opacity': 0.75,
                'raster-fade-duration': 150,
              },
            });
          }
        } else {
          map.addSource(sourceId, {
            type: 'raster',
            tiles: [activeTileUrl],
            tileSize: 256,
            bounds: [-128.0, 24.0, -66.0, 50.0],
          });
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': 0.75,
              'raster-fade-duration': 300,
            },
          });
        }
      } catch (err) {
        console.warn('[MapLibre Radar] Layer sync notice:', err);
      }
    } else {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch {
        // Silently ignore cleanup errors
      }
    }
  }, [activeLayer, isMapLoaded, radarTileUrl]);

  // Synchronize NASA GIBS Satellite Raster Layer with MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const sourceId = 'nasa-gibs-satellite-source';
    const layerId = 'nasa-gibs-satellite-layer';

    if (activeLayer === 'satellite' && satelliteTileUrl) {
      try {
        const existingSource = map.getSource(sourceId) as any;
        if (existingSource) {
          if (existingSource.tiles?.[0] !== satelliteTileUrl) {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
            map.removeSource(sourceId);
            map.addSource(sourceId, {
              type: 'raster',
              tiles: [satelliteTileUrl],
              tileSize: 256,
              maxzoom: 9,
              attribution: 'NASA GIBS / EOSDIS Earth Science Open Data',
            });
            map.addLayer({
              id: layerId,
              type: 'raster',
              source: sourceId,
              paint: {
                'raster-opacity': 0.85,
                'raster-fade-duration': 200,
              },
            });
          }
        } else {
          map.addSource(sourceId, {
            type: 'raster',
            tiles: [satelliteTileUrl],
            tileSize: 256,
            maxzoom: 9,
            attribution: 'NASA GIBS / EOSDIS Earth Science Open Data',
          });
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': 0.85,
              'raster-fade-duration': 300,
            },
          });
        }
      } catch (err) {
        console.warn('[MapLibre Satellite] Layer sync notice:', err);
      }
    } else {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch {
        // Silently ignore cleanup errors
      }
    }
  }, [activeLayer, isMapLoaded, satelliteTileUrl]);

  // Center map on city marker
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: initialZoom,
        pitch: 0,
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

      {/* ── Synchronized 2D Weather Overlay (Wind Streamlines) ── */}
      {isMapLoaded && mapRef.current && (
        <WeatherMapLibreOverlay
          map={mapRef.current}
          activeLayer={activeLayer}
          particlesEnabled={particlesEnabled}
        />
      )}

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

      {/* ── Radar Coverage Notice when viewing areas outside North American Doppler network ── */}
      {activeLayer === 'radar' && !isLocationCoveredByRadar(latitude, longitude) && (
        <div className="absolute top-20 left-4 z-40 pointer-events-auto">
          <RadarCoverageNotice
            locationName={cityName}
            onSwitchToPrecipitation={() => {
              if (onOpenWeather) onOpenWeather();
            }}
            onSwitchToSatellite={() => {
              if (onOpenWeather) onOpenWeather();
            }}
            onRecenterRadar={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({ center: [-96.0, 38.5], zoom: 4.5, speed: 1.4 });
              }
            }}
          />
        </div>
      )}

      {/* ── Satellite Genuine Observation Pass Badge (NASA GIBS) ── */}
      {activeLayer === 'satellite' && (
        <div className="absolute top-20 left-4 z-40 pointer-events-auto max-w-[90%] sm:max-w-md">
          <div className="rounded-2xl bg-[#060818]/92 backdrop-blur-xl border border-cyan-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] px-3 py-2 flex items-center gap-2.5 text-xs">
            <span className="text-base shrink-0">🛰️</span>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-[11px] flex items-center gap-1.5 flex-wrap">
                <span>NASA GIBS Global Satellite Observation</span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 px-1 py-0.2 rounded bg-emerald-500/20">
                  REAL SENSOR PASS
                </span>
              </span>
              <span className="text-[10px] text-white/50 font-mono truncate">
                {satelliteObservationUtc || 'Daily Planetary Composite • NASA EOSDIS'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Floating Navigation HUD ──────────────── */}
      <div className="absolute top-3 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 z-30 pointer-events-none flex items-start justify-between gap-1.5 sm:gap-3">
        {/* Left: "Return to Earth" Action & City Badge */}
        <div className="flex flex-col gap-1.5 sm:gap-2 pointer-events-auto min-w-0 max-w-[55%] sm:max-w-none">
          <button
            type="button"
            data-testid="return-to-earth-btn"
            onClick={onReturnToEarth}
            className="group px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400 text-[11px] sm:text-xs font-mono font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 sm:gap-2 shadow-2xl transition-all active:scale-95 cursor-pointer w-fit shrink-0"
            title="Return to interactive 3D Earth globe"
          >
            <span className="text-sm sm:text-base group-hover:rotate-12 transition-transform">🌍</span>
            <span className="truncate">{dict.cityMap?.returnToEarth || 'Return to Earth'}</span>
            <span className="text-[10px] text-cyan-400/60 font-normal hidden sm:inline">⟵ Orbit</span>
          </button>

          {/* City Badge & Recenter Button */}
          <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-[#050512]/90 backdrop-blur-xl border border-white/10 text-xs font-mono flex items-center gap-1.5 sm:gap-2 shadow-2xl max-w-full">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-white truncate max-w-[110px] min-[400px]:max-w-[140px] sm:max-w-[240px]">
                {cityName === 'World Map' ? 'Global 2D Disaster & Climate Map' : cityName}
              </div>
              <div className="text-[10px] text-white/50 truncate max-w-[110px] min-[400px]:max-w-[140px] sm:max-w-[240px]">
                {cityName === 'World Map'
                  ? 'Planetary Cyclones & Hazards'
                  : `${(countryName ? getLocalizedCountryName(countryName, locale) : null) || 'Metropolis'} · ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`}
              </div>
            </div>
            {cityName !== 'World Map' && (
              <button
                type="button"
                onClick={handleRecenter}
                className="ml-1 p-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-white/60 hover:text-cyan-300 transition-colors cursor-pointer shrink-0"
                title="Recenter camera on city marker"
                aria-label="Recenter"
              >
                🎯
              </button>
            )}
          </div>

          {/* Nearby Places Discovery */}
          {cityName !== 'World Map' && (
            <NearbyPlacesPanel
              latitude={latitude}
              longitude={longitude}
              onSelectPlace={(place) => {
                mapRef.current?.flyTo({
                  center: [place.longitude, place.latitude],
                  zoom: 14.5,
                  essential: true,
                });
                onMapClick?.({ lat: place.latitude, lng: place.longitude });
              }}
            />
          )}
        </div>

        {/* Right: Style Selector & Weather Telemetry Summary */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto shrink-0 max-w-[45%] sm:max-w-none">
          {/* Style Selector Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              data-testid="map-style-selector-btn"
              onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
              className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 text-[10px] sm:text-[11px] font-mono text-white/80 hover:text-white flex items-center gap-1 sm:gap-1.5 shadow-xl transition-all cursor-pointer"
              title="Change Map Tiles & Styling"
            >
              <span className="text-cyan-400">🗺️</span>
              <span className="font-semibold truncate max-w-[80px] sm:max-w-none">{MAP_STYLES[activeStyleKey]?.label || 'Map Style'}</span>
              <span className="text-[8px] sm:text-[9px] text-white/40">▼</span>
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

          {/* Live Weather Summary Badge & Mobile Weather Telemetry Option */}
          {weatherSummary ? (
            <div
              data-testid="city-weather-summary-card"
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#050512]/92 backdrop-blur-xl border border-cyan-500/30 shadow-2xl flex flex-col gap-1 max-w-[130px] min-[400px]:max-w-[160px] sm:max-w-[230px]"
            >
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div
                  className="flex items-center gap-1 sm:gap-1.5 cursor-pointer group"
                  onClick={onOpenWeather}
                  title="Click to view detailed weather telemetry"
                >
                  <span className="text-lg sm:text-xl shrink-0">
                    {weatherSummary.weatherEmoji || '🌤️'}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight group-hover:text-cyan-300 transition-colors">
                      {typeof weatherSummary.temperature === 'number'
                        ? `${Math.round(weatherSummary.temperature)}°${weatherSummary.units === 'fahrenheit' ? 'F' : 'C'}`
                        : '—'}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/50 truncate max-w-[65px] min-[400px]:max-w-[90px] sm:max-w-[110px]">
                      {weatherSummary.weatherDescription || 'Current'}
                    </div>
                  </div>
                </div>

                {onOpenWeather && (
                  <button
                    type="button"
                    data-testid="city-map-telemetry-btn"
                    onClick={onOpenWeather}
                    className="p-1 sm:px-2 sm:py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 shadow-sm"
                    title="Open full meteorological telemetry and forecasts"
                  >
                    <span>📊</span>
                    <span className="hidden min-[440px]:inline">Telemetry</span>
                  </button>
                )}
              </div>

              {/* Extra telemetry pill - hidden on small mobile to avoid crowding */}
              <div
                className="hidden sm:flex items-center gap-2 pt-1 border-t border-white/5 text-[9px] font-mono text-white/40 cursor-pointer hover:text-white/70 transition-colors"
                onClick={onOpenWeather}
              >
                {typeof weatherSummary.windSpeed === 'number' && (
                  <span>💨 {Math.round(weatherSummary.windSpeed)} km/h</span>
                )}
                {typeof weatherSummary.relativeHumidity === 'number' && (
                  <span>💧 {weatherSummary.relativeHumidity}%</span>
                )}
              </div>
            </div>
          ) : (
            onOpenWeather && (
              <button
                type="button"
                data-testid="city-map-telemetry-btn"
                onClick={onOpenWeather}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/35 backdrop-blur-xl border border-cyan-400/40 text-[10px] sm:text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5 shadow-xl transition-all cursor-pointer active:scale-95"
                title="Open live meteorological telemetry"
              >
                <span>📊</span>
                <span>Weather Telemetry</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* ── 2D Map Active Disasters Floating HUD & Quick Selector ── */}
      {disasters && disasters.length > 0 && (
        <div className="absolute bottom-11 sm:bottom-12 left-2 right-2 sm:left-4 sm:right-4 z-30 pointer-events-none flex flex-col items-center gap-1.5">
          <div className="pointer-events-auto max-w-full w-auto flex flex-col items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl bg-[#050512]/92 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
            {/* Category Filter Chips & Eye Visibility Toggle */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none max-w-full">
              <button
                type="button"
                onClick={() => setShowDisasters(!showDisasters)}
                className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  showDisasters
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
                title="Toggle disaster markers on 2D map"
              >
                <span>{showDisasters ? '👁️' : '🕶️'}</span>
                <span className="hidden sm:inline">Disasters</span>
                <span className="text-[9px] px-1 rounded bg-white/10 font-bold">{filteredDisasters.length}</span>
              </button>

              <div className="h-3 w-px bg-white/15" />

              {/* Filter Pills */}
              {(
                [
                  { key: 'all', label: 'All Hazards', icon: '🌐', count: disasters.length },
                  { key: 'cyclones', label: 'Cyclones', icon: '🌀', count: cycloneCount },
                  { key: 'seismic', label: 'Quakes', icon: '🌋', count: quakeCount },
                  { key: 'wildfires', label: 'Fires', icon: '🔥', count: wildfireCount },
                  { key: 'thunderstorms', label: 'Storms', icon: '⚡', count: stormCount },
                ] as const
              ).map((tab) => {
                const isActive = disasterFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDisasterFilter(tab.key)}
                    className={`shrink-0 px-2 py-0.8 rounded-xl text-[10px] font-mono font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rose-500/25 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className="text-[9px] font-bold opacity-60">({tab.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Horizontal Carousel of Disasters for Quick-Fly */}
            {showDisasters && filteredDisasters.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-[92vw] sm:max-w-2xl py-0.5">
                {filteredDisasters.map((ev) => {
                  const meta = getDisasterMeta(ev);
                  const isSelected = selectedDisaster?.id === ev.id;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => handleFlyToDisaster(ev)}
                      className={`shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      title={`Fly to ${ev.title}`}
                    >
                      <span>{meta.icon}</span>
                      <span className="truncate max-w-[120px]">{meta.cleanTitle}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 font-bold" style={{ color: meta.colorHex }}>
                        {meta.categoryLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Scoped Disaster Animations & MapLibre Popup Styling ── */}
      <style>{`
        @keyframes cyclone-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes seismic-shockwave {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes marker-glow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .disaster-map-popup .maplibregl-popup-content,
        .city-map-popup .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 14px !important;
          border: none !important;
        }
        .disaster-map-popup .maplibregl-popup-tip,
        .city-map-popup .maplibregl-popup-tip {
          border-top-color: rgba(5, 5, 18, 0.95) !important;
          border-bottom-color: rgba(5, 5, 18, 0.95) !important;
        }
        .disaster-map-popup .maplibregl-popup-close-button,
        .city-map-popup .maplibregl-popup-close-button {
          color: #67e8f9 !important;
          padding: 3px 7px !important;
          font-size: 15px !important;
          right: 6px !important;
          top: 6px !important;
          outline: none !important;
          background: rgba(255, 255, 255, 0.12) !important;
          border-radius: 6px !important;
          line-height: 1 !important;
          cursor: pointer !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          transition: background 0.15s !important;
        }
        .disaster-map-popup .maplibregl-popup-close-button:hover,
        .city-map-popup .maplibregl-popup-close-button:hover {
          background: rgba(6, 182, 212, 0.3) !important;
          color: #fff !important;
        }
      `}</style>

      {/* ── Bottom Telemetry & Attribution Bar ───────── */}
      <div className="absolute bottom-1.5 sm:bottom-2 left-2 right-2 sm:left-4 sm:right-4 z-20 pointer-events-none flex items-end justify-between text-[10px] font-mono text-white/40 pb-[env(safe-area-inset-bottom)]">
        {/* Telemetry coords */}
        <div className="bg-[#050512]/80 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-white/5 pointer-events-auto">
          <span>ZOOM: {currentZoom}</span>
          <span className="hidden sm:inline">
            <span className="mx-1.5 text-white/20">|</span>
            <span>PITCH: {currentPitch}°</span>
            <span className="mx-1.5 text-white/20">|</span>
            <span>BEARING: {currentBearing}°</span>
          </span>
        </div>

        {/* Subtle Cartography Sources Link */}
        <Link
          href="/data-sources"
          title={MAP_STYLES[activeStyleKey]?.attribution || 'Cartographic Data Sources'}
          className="bg-[#050512]/80 hover:bg-[#050512] backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-white/5 hover:border-white/20 text-white/40 hover:text-white/80 pointer-events-auto transition-colors flex items-center gap-1 sm:gap-1.5"
        >
          <span className="text-[11px]">ℹ️</span>
          <span className="hidden sm:inline">Data Sources</span>
        </Link>
      </div>

      {/* ── Loading Spinner State ─────────────────────── */}
      {!isMapLoaded && !hasMapError && (
        <div className="absolute inset-0 bg-[#020208]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-cyan-400 font-mono text-xs tracking-wider">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-3" />
          <span>RENDERING {cityName.toUpperCase()} CITY MAP...</span>
          <span className="text-[10px] text-white/40 mt-1">
            Loading high-resolution roads, boundaries, and cartographic vectors...
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
