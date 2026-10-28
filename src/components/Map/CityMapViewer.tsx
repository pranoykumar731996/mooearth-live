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
import type { SatelliteSpectralMode, WeatherLayerMode } from '@/services/weather/types';
import {
  type TropicalCyclone,
  interpolateForecastPosition,
  getSaffirSimpsonCategoryNumber,
} from '@/services/weather/cycloneTrackingService';
import { getNowcastLightningFeed, type LightningFeedResponse } from '@/services/weather/lightningService';
import { getSatelliteObservationDate, getGeostationaryObservationDate } from '@/services/weather/satelliteImageryService';
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
  onLayerChange?: (layer: WeatherLayerMode) => void;
  radarTileUrl?: string;
  satelliteTileUrl?: string;
  satelliteObservationUtc?: string;
  spectralMode?: SatelliteSpectralMode;
  onSelectSpectralMode?: (mode: SatelliteSpectralMode) => void;
  particlesEnabled?: boolean;
  disasters?: WorldEvent[];
  disasterFilter?: 'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather';
  onSelectDisasterFilter?: (filter: 'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather') => void;
  selectedDisaster?: WorldEvent | null;
  onSelectDisaster?: (event: WorldEvent | null) => void;
  onInspectDossier?: (event: WorldEvent) => void;
  cyclones?: TropicalCyclone[];
  timelineHoursAhead?: number;
  selectedCyclone?: TropicalCyclone | null;
  onSelectCyclone?: (cyclone: TropicalCyclone | null) => void;
  onReturnToEarth: () => void;
  onOpenWeather?: () => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

function createLocationPopupHtml(
  cityName: string,
  countryName?: string,
  latitude?: number,
  longitude?: number,
  weather?: CityWeatherSummary | null
): string {
  const hasWeather = Boolean(weather && typeof weather.temperature === 'number');
  const tempStr = hasWeather && weather?.temperature !== undefined
    ? `${Math.round(weather.temperature)}°${weather.units === 'fahrenheit' ? 'F' : 'C'}`
    : '';
  return `
    <div style="background: rgba(5,5,18,0.96); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(6,182,212,0.45); border-radius: 14px; padding: 10px 14px; color: #fff; font-family: monospace; font-size: 11px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); max-width: 270px;">
      <div style="font-weight: 800; color: #67e8f9; font-size: 13px; margin-bottom: 2px; white-space: normal; line-height: 1.25;">${cityName}</div>
      ${countryName ? `<div style="color: rgba(255,255,255,0.75); font-size: 10px;">${countryName}</div>` : ''}
      ${hasWeather && weather ? `
        <div style="display: flex; align-items: center; gap: 6px; margin: 6px 0 4px 0; padding: 4px 8px; border-radius: 8px; background: rgba(6,182,212,0.12); border: 1px solid rgba(6,182,212,0.3);">
          <span style="font-size: 16px;">${weather.weatherEmoji || '🌤️'}</span>
          <span style="font-weight: 800; color: #ffffff; font-size: 13px;">${tempStr}</span>
          <span style="color: rgba(255,255,255,0.75); font-size: 10px; margin-left: 2px;">${weather.weatherDescription || ''}</span>
        </div>
      ` : `
        <div style="display: flex; align-items: center; gap: 6px; margin: 6px 0 4px 0; padding: 4px 8px; border-radius: 8px; background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.2);">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #22d3ee; box-shadow: 0 0 8px #22d3ee;"></span>
          <span style="color: #67e8f9; font-size: 10px; font-weight: 600;">Fetching live weather telemetry...</span>
        </div>
      `}
      ${typeof latitude === 'number' && typeof longitude === 'number' ? `
        <div style="color: rgba(6,182,212,0.85); font-size: 9px; margin-top: 4px; font-weight: 600;">${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°</div>
      ` : ''}
    </div>
  `;
}

function formatMilestoneDate(timestamp?: string, leadHours: number = 0): string {
  if (!timestamp) return `+${leadHours}h`;
  try {
    const targetDate = new Date(timestamp);
    const now = new Date();
    const isToday =
      targetDate.getDate() === now.getDate() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getFullYear() === now.getFullYear();
    const tomorrow = new Date(now.getTime() + 86400000);
    const isTomorrow =
      targetDate.getDate() === tomorrow.getDate() &&
      targetDate.getMonth() === tomorrow.getMonth() &&
      targetDate.getFullYear() === tomorrow.getFullYear();
    const timeStr = targetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '');
    if (isToday) return `Today - ${timeStr}`;
    if (isTomorrow) return `Tomorrow - ${timeStr}`;
    const weekday = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
    const day = targetDate.getDate();
    return `${weekday} ${day} - ${timeStr}`;
  } catch {
    return `+${leadHours}h`;
  }
}

export default function CityMapViewer({
  latitude,
  longitude,
  cityName,
  countryName,
  initialZoom = 12.8,
  initialMapStyle = 'atmospheric-satellite',
  weatherSummary,
  activeLayer = 'wind',
  onLayerChange,
  radarTileUrl,
  satelliteTileUrl,
  satelliteObservationUtc,
  spectralMode = 'blue',
  onSelectSpectralMode,
  particlesEnabled = true,
  disasters = [],
  disasterFilter: disasterFilterProp,
  onSelectDisasterFilter,
  selectedDisaster = null,
  onSelectDisaster,
  onInspectDossier,
  cyclones = [],
  timelineHoursAhead = 0,
  selectedCyclone = null,
  onSelectCyclone,
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
  const [isSatelliteHudDismissed, setIsSatelliteHudDismissed] = useState(false);
  const [isRadarNoticeDismissed, setIsRadarNoticeDismissed] = useState(false);

  useEffect(() => {
    setIsRadarNoticeDismissed(false);
  }, [activeLayer]);

  // Disaster filtering, visibility and collapsible bar state on 2D map
  const [internalDisasterFilter, setInternalDisasterFilter] = useState<'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather'>('all');
  const activeDisasterFilter = disasterFilterProp !== undefined ? disasterFilterProp : internalDisasterFilter;
  const setDisasterFilter = useCallback((val: 'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather') => {
    setInternalDisasterFilter(val);
    onSelectDisasterFilter?.(val);
  }, [onSelectDisasterFilter]);
  const [showDisasters, setShowDisasters] = useState(true);
  // Filtered disaster list: strictly isolates selected hazard (no unwanted hazard markers)
  const filteredDisasters = useMemo(() => {
    if (!disasters || disasters.length === 0) return [];
    if (activeDisasterFilter === 'all') return disasters;
    return disasters.filter((d) => {
      const type = getDisasterMeta(d).type;
      if (activeDisasterFilter === 'cyclones') return type === 'cyclone';
      if (activeDisasterFilter === 'seismic') return type === 'seismic';
      if (activeDisasterFilter === 'wildfires') return type === 'wildfires';
      if (activeDisasterFilter === 'thunderstorms') return type === 'thunderstorms';
      if (activeDisasterFilter === 'space_weather') return type === 'space_weather' || d.category === 'space_weather';
      return type === activeDisasterFilter;
    });
  }, [disasters, activeDisasterFilter]);

  // Real-time Nowcast Lightning telemetry feed
  const [lightningFeed, setLightningFeed] = useState<LightningFeedResponse | null>(null);
  const [showLightning, setShowLightning] = useState(true);

  useEffect(() => {
    setLightningFeed(getNowcastLightningFeed(disasters));
    const interval = setInterval(() => {
      setLightningFeed(getNowcastLightningFeed(disasters));
    }, 45000);
    return () => clearInterval(interval);
  }, [disasters]);

  // Persistent ref tracking latest city coordinates & metadata without triggering map re-initialization
  const currentLocationRef = useRef({ latitude, longitude, cityName, countryName, initialZoom });
  currentLocationRef.current = { latitude, longitude, cityName, countryName, initialZoom };

  // Last known weather summary ref to prevent flickering / disappearing telemetry on location selection
  const lastKnownWeatherRef = useRef<CityWeatherSummary | null>(null);
  if (weatherSummary) {
    lastKnownWeatherRef.current = weatherSummary;
  }
  const activeWeatherSummary = weatherSummary || lastKnownWeatherRef.current;

  // Stable ref for onMapClick to prevent recreating initMap on parent re-renders
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Track last flown location target to prevent resetting user's free map exploration
  const lastFlownTargetRef = useRef<string>('');
  const userMapClickCoordRef = useRef<string>('');

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
          minZoom: 1.8,
          maxZoom: 18,
          renderWorldCopies: false,
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
        if (typeof window !== 'undefined') (window as any)._map = map;
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
          }).setHTML(
            createLocationPopupHtml(initCoords.cityName, initCoords.countryName, initCoords.latitude, initCoords.longitude, activeWeatherSummary)
          );

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
          userMapClickCoordRef.current = `${lat.toFixed(4)},${lng.toFixed(4)}`;
          onMapClickRef.current?.({ lat, lng });
        });

        // Watchdog timer: If vector style hangs or network stalls for > 4.5s, failover safely
        watchdogTimerRef.current = setTimeout(() => {
          if (!mapRef.current) return;
          if (styleKey === 'satellite' || styleKey === 'atmospheric-satellite') return; // Do not trigger false timeout on satellite base styles
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
            if (styleKey === 'satellite' || styleKey === 'windy-satellite') {
              // Atmospheric satellite has multiple fallback tile sources; do not trigger disruptive failover
              return;
            }
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
    []
  );

  // Mount effect (strictly on mount or explicit styleKey change)
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

  // Handle fly-to coordinate updates ONLY when the destination actually changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    if (!cityName || cityName === 'World Map') return;

    const targetKey = `${cityName}:${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (lastFlownTargetRef.current === targetKey) {
      // Already at this target - DO NOT disrupt user's free panning or zooming!
      return;
    }
    lastFlownTargetRef.current = targetKey;

    const isFromMapClick = userMapClickCoordRef.current === `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const targetZoom = isFromMapClick ? mapRef.current.getZoom() : initialZoom;

    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom: targetZoom,
      essential: true,
    });

    const popupHtml = createLocationPopupHtml(cityName, countryName, latitude, longitude, activeWeatherSummary);

    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
      const popup = markerRef.current.getPopup();
      if (popup) {
        popup.setHTML(popupHtml);
        try {
          popup.addTo(mapRef.current);
        } catch {
          // popup display optional
        }
      }
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
  }, [latitude, longitude, cityName, countryName, initialZoom, isMapLoaded]);

  // Synchronize pin popup whenever activeWeatherSummary updates WITHOUT touching map camera
  useEffect(() => {
    if (markerRef.current && activeWeatherSummary) {
      markerRef.current.getPopup()?.setHTML(
        createLocationPopupHtml(cityName, countryName, latitude, longitude, activeWeatherSummary)
      );
    }
  }, [activeWeatherSummary, cityName, countryName, latitude, longitude]);

  // Synchronize 2D camera with selectedDisaster when user clicks a hazard card or marker
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !selectedDisaster) return;
    if (typeof selectedDisaster.lat !== 'number' || typeof selectedDisaster.lng !== 'number') return;
    if (isNaN(selectedDisaster.lat) || isNaN(selectedDisaster.lng)) return;

    mapRef.current.flyTo({
      center: [selectedDisaster.lng, selectedDisaster.lat],
      zoom: Math.max(mapRef.current.getZoom(), 5.5),
      speed: 1.2,
      essential: true,
    });

    const match = disasterMarkersRef.current.find((m) => m.event.id === selectedDisaster.id);
    if (match) {
      try {
        match.popup.addTo(mapRef.current);
      } catch {
        // ignore
      }
    }
  }, [selectedDisaster, isMapLoaded]);

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

    if (!showDisasters && activeLayer !== 'hurricane') return;

    // Guarantee that every tracked tropical cyclone has a representation when cyclones or hurricane layer are active
    const eventsToRender: WorldEvent[] = [...(showDisasters ? filteredDisasters : [])];
    if (activeLayer === 'hurricane' || activeDisasterFilter === 'cyclones' || activeDisasterFilter === 'all') {
      cyclones.forEach((c) => {
        const alreadyExists = eventsToRender.some(
          (e) => e.id === c.id || e.title.toLowerCase().includes(c.name.toLowerCase())
        );
        if (!alreadyExists) {
          eventsToRender.push({
            id: c.id,
            title: `Cyclone ${c.name}`,
            category: 'severe_weather',
            lat: c.lat,
            lng: c.lng,
            city: c.basin,
            country: c.agency,
            summary: c.summary,
            publishedAt: c.advisoryIssuedAt || new Date().toISOString(),
            source: c.attribution,
            planetaryTelemetry: {
              windSpeedKph: c.windSpeedKph,
              pressureHpa: c.pressureHpa,
              stormWarningType: 'tropical_cyclone',
            },
          });
        }
      });
    }

    if (eventsToRender.length === 0) return;

    eventsToRender.forEach((event) => {
      if (typeof event.lat !== 'number' || typeof event.lng !== 'number') return;
      if (isNaN(event.lat) || isNaN(event.lng)) return;

      const meta = getDisasterMeta(event);
      const isSelected = selectedDisaster?.id === event.id || (selectedCyclone && (selectedCyclone.id === event.id || selectedCyclone.name.toLowerCase() === event.title.toLowerCase()));

      // Check if this event corresponds to an active tracked tropical cyclone
      const matchingCyclone = meta.type === 'cyclone'
        ? (cyclones.find((c) => c.id === event.id || c.name.toLowerCase() === event.title.toLowerCase()) || (cyclones.length > 0 ? cyclones[0] : null))
        : null;

      // Position computation: interpolate along official forecast/observed path when timeline scrubber moves
      let markerLat = event.lat;
      let markerLng = event.lng;
      let markerWind = event.planetaryTelemetry?.windSpeedKph || 120;
      let markerCategory = meta.categoryLabel;
      let isForecast = false;
      let leadHours = 0;

      if (matchingCyclone) {
        const interpolated = interpolateForecastPosition(matchingCyclone, timelineHoursAhead);
        markerLat = interpolated.lat;
        markerLng = interpolated.lng;
        markerWind = interpolated.windSpeedKph;
        markerCategory = interpolated.stageName || meta.categoryLabel;
        isForecast = interpolated.isForecast;
        leadHours = interpolated.leadHours;
      }

      // Build marker DOM element
      const el = document.createElement('div');
      el.className = `disaster-map-marker-container disaster-${meta.type} cursor-pointer group`;
      el.setAttribute('data-disaster-id', event.id);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `${event.title} - ${markerCategory}`);

      el.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; user-select: none;">
          <!-- Animated outer ring based on hazard type -->
          ${
            meta.type === 'cyclone'
              ? `<div style="position: absolute; width: 62px; height: 62px; top: -12px; border-radius: 9999px; border: 2px dashed rgba(6,182,212,0.85); animation: cyclone-spin 4s linear infinite; pointer-events: none;"></div>
                 <div style="position: absolute; width: 82px; height: 82px; top: -22px; border-radius: 9999px; background: radial-gradient(circle, rgba(6,182,212,0.3) 0%, rgba(6,182,212,0.06) 55%, transparent 75%); animation: marker-glow-pulse 2.5s ease-in-out infinite; pointer-events: none;"></div>`
              : meta.type === 'seismic'
              ? `<div style="position: absolute; width: 50px; height: 50px; top: -8px; border-radius: 9999px; border: 2px solid rgba(244,63,94,0.7); animation: seismic-shockwave 2s ease-out infinite; pointer-events: none;"></div>
                 <div style="position: absolute; width: 44px; height: 44px; top: -5px; border-radius: 9999px; background: rgba(244,63,94,0.25); animation: marker-glow-pulse 2s ease-in-out infinite; pointer-events: none;"></div>`
              : meta.type === 'wildfires'
              ? `<div style="position: absolute; width: 46px; height: 46px; top: -6px; border-radius: 9999px; background: radial-gradient(circle, rgba(249,115,22,0.45) 0%, transparent 70%); animation: marker-glow-pulse 2s ease-in-out infinite; pointer-events: none;"></div>`
              : `<div style="position: absolute; width: 44px; height: 44px; top: -5px; border-radius: 9999px; border: 1.5px solid ${meta.colorHex}; opacity: 0.6; animation: marker-glow-pulse 2.5s ease-in-out infinite; pointer-events: none;"></div>`
          }

          <!-- Core Badge: Central Cyclone Eye or Hazard Icon -->
          <div style="
            position: relative;
            width: ${meta.type === 'cyclone' ? '38px' : '34px'};
            height: ${meta.type === 'cyclone' ? '38px' : '34px'};
            border-radius: 9999px;
            background: ${meta.type === 'cyclone' ? 'radial-gradient(circle at 35% 35%, #0f172a 0%, #020617 100%)' : '#060818'};
            border: 2px solid ${isSelected ? '#ffffff' : meta.colorHex};
            box-shadow: 0 0 ${isSelected ? '22px' : '14px'} ${meta.glowRgba};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${meta.type === 'cyclone' ? '20px' : '16px'};
            transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          ">
            ${
              meta.type === 'cyclone'
                ? `<span style="display: inline-block; animation: cyclone-spin 3s linear infinite; filter: drop-shadow(0 0 6px ${meta.colorHex});">${meta.icon}</span>
                   <span style="
                     position: absolute;
                     bottom: -4px;
                     right: -4px;
                     width: 17px;
                     height: 17px;
                     border-radius: 9999px;
                     background: ${meta.badgeBg};
                     border: 1.5px solid ${meta.badgeBorder};
                     color: #ffffff;
                     font-family: monospace;
                     font-size: 9px;
                     font-weight: 900;
                     display: flex;
                     align-items: center;
                     justify-content: center;
                     box-shadow: 0 2px 6px rgba(0,0,0,0.8);
                   ">
                     ${matchingCyclone ? (matchingCyclone.saffirSimpsonScale > 0 ? matchingCyclone.saffirSimpsonScale : (matchingCyclone.category.toLowerCase().includes('typhoon') ? 'T' : 'S')) : '1'}
                   </span>`
                : meta.icon
            }
          </div>

          <!-- Instant Name & Telemetry Label Pill (Prominent for Cyclones or active selection) -->
          ${
            meta.type === 'cyclone' || isSelected
              ? `<div style="
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
                  ">${markerCategory}</span>
                  ${
                    matchingCyclone && timelineHoursAhead !== 0
                      ? `<span style="
                          padding: 1px 4px;
                          border-radius: 4px;
                          background: ${isForecast ? 'rgba(244,63,94,0.3)' : 'rgba(56,189,248,0.3)'};
                          border: 1px solid ${isForecast ? '#f43f5e' : '#38bdf8'};
                          color: #ffffff;
                          font-weight: 800;
                          font-size: 8px;
                        ">${isForecast ? `+${leadHours}h FCST` : `${timelineHoursAhead}h OBS`}</span>`
                      : ''
                  }
                </div>`
              : ''
          }
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
              ${markerCategory}
            </span>
          </div>

          <div style="font-size: 13px; font-weight: 800; color: #ffffff; line-height: 1.3; margin-bottom: 3px;">
            ${event.title}
          </div>

          <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; font-family: monospace;">
            📍 ${event.city ? `${event.city}` : ''}${event.country ? ` · ${event.country}` : ''} (${markerLat.toFixed(2)}°, ${markerLng.toFixed(2)}°)
          </div>

          ${
            matchingCyclone && isForecast
              ? `<div style="margin-bottom: 6px; padding: 4px 8px; border-radius: 6px; background: rgba(244,63,94,0.18); border: 1px solid rgba(244,63,94,0.4); font-size: 10px; font-weight: 700; color: #fca5a5;">
                  🔮 Official Forecast Position (+${leadHours}h)
                </div>`
              : ''
          }

          <div style="font-size: 11px; line-height: 1.45; color: rgba(255, 255, 255, 0.8); margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${event.summary}
          </div>

          <!-- Telemetry Badge Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 6px 8px; border-radius: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06); font-family: monospace; font-size: 10px; margin-bottom: 10px;">
            ${markerWind ? `
              <div><span style="color: rgba(255,255,255,0.4);">WIND:</span> <strong style="color: #67e8f9;">${Math.round(markerWind)} km/h</strong></div>
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
            <span>${
              meta.type === 'cyclone' ? '📊 Inspect Cyclone Dossier' :
              meta.type === 'seismic' ? '🌋 Inspect Seismic Dossier' :
              meta.type === 'wildfires' ? '🔥 Inspect Wildfire Dossier' :
              meta.type === 'space_weather' ? '🌌 Inspect Space Weather Dossier' :
              '⚡ Inspect Hazard Dossier'
            }</span>
            <span>↗</span>
          </button>
        </div>
      `);

      // Click / touch handler on marker
      const handleSelect = (e: Event) => {
        e.stopPropagation();
        onSelectDisaster?.(event);
        if (matchingCyclone) {
          onSelectCyclone?.(matchingCyclone);
        }
        map.flyTo({
          center: [markerLng, markerLat],
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
              if (matchingCyclone) {
                onSelectCyclone?.(matchingCyclone);
              }
              if (onInspectDossier) {
                onInspectDossier(event);
              } else {
                onSelectDisaster?.(event);
              }
            });
          }
        }
      });

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([markerLng, markerLat])
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
  }, [filteredDisasters, showDisasters, isMapLoaded, onSelectDisaster, selectedDisaster?.id, cyclones, timelineHoursAhead, selectedCyclone?.id, onSelectCyclone]);

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


  // Synchronize MapLibre GeoJSON Hazard Vector Layers (Seismic shockwaves, Cyclone gale radii, Wildfire halos)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const beforeLayerId =
      map.getLayer('esri-satellite-labels-layer') ? 'esri-satellite-labels-layer' :
      map.getLayer('carto-labels-layer') ? 'carto-labels-layer' :
      undefined;

    // 1. Quakes FeatureCollection
    const seismicFeatures: any[] = (!showDisasters ? [] : filteredDisasters)
      .filter((d) => getDisasterMeta(d).type === 'seismic' && typeof d.lat === 'number' && typeof d.lng === 'number' && !isNaN(d.lat) && !isNaN(d.lng))
      .map((d) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
        properties: {
          id: d.id,
          magnitude: d.planetaryTelemetry?.magnitude || 5.0,
          depth: d.planetaryTelemetry?.depthKm || 10,
        },
      }));

    const seismicData = { type: 'FeatureCollection', features: seismicFeatures };
    const seismicSourceId = 'hazard-seismic-pulse-source';
    const seismicOuterLayerId = 'hazard-seismic-pulse-outer';
    const seismicInnerLayerId = 'hazard-seismic-pulse-inner';

    try {
      const existingSeismicSource = map.getSource(seismicSourceId) as any;
      if (existingSeismicSource && typeof existingSeismicSource.setData === 'function') {
        existingSeismicSource.setData(seismicData);
      } else if (!existingSeismicSource) {
        map.addSource(seismicSourceId, { type: 'geojson', data: seismicData as any });
        map.addLayer(
          {
            id: seismicOuterLayerId,
            type: 'circle',
            source: seismicSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, ['*', ['get', 'magnitude'], 3.5], 6, ['*', ['get', 'magnitude'], 8], 10, ['*', ['get', 'magnitude'], 16]],
              'circle-color': '#f43f5e',
              'circle-opacity': 0.16,
              'circle-stroke-width': 1.8,
              'circle-stroke-color': '#fb7185',
              'circle-stroke-opacity': 0.75,
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: seismicInnerLayerId,
            type: 'circle',
            source: seismicSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 6, 8, 10, 14],
              'circle-color': '#e11d48',
              'circle-opacity': 0.6,
              'circle-stroke-width': 1.2,
              'circle-stroke-color': '#ffffff',
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback if style is reloading
    }

    // 2. Cyclone Wind Radii FeatureCollection
    const cycloneFeatures: any[] = (!showDisasters ? [] : filteredDisasters)
      .filter((d) => getDisasterMeta(d).type === 'cyclone' && typeof d.lat === 'number' && typeof d.lng === 'number' && !isNaN(d.lat) && !isNaN(d.lng))
      .map((d) => {
        let ptLng = d.lng;
        let ptLat = d.lat;
        let ptWind = d.planetaryTelemetry?.windSpeedKph || 120;
        const matchingCyclone = cyclones.find((c) => c.id === d.id || c.name.toLowerCase() === d.title.toLowerCase());
        if (matchingCyclone && timelineHoursAhead !== 0) {
          const interp = interpolateForecastPosition(matchingCyclone, timelineHoursAhead);
          ptLng = interp.lng;
          ptLat = interp.lat;
          ptWind = interp.windSpeedKph;
        }
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [ptLng, ptLat] },
          properties: {
            id: d.id,
            wind: ptWind,
          },
        };
      });

    const cycloneData = { type: 'FeatureCollection', features: cycloneFeatures };
    const cycloneSourceId = 'hazard-cyclone-radii-source';
    const cycloneOuterLayerId = 'hazard-cyclone-gale-outer';
    const cycloneInnerLayerId = 'hazard-cyclone-core-inner';

    try {
      const existingCycloneSource = map.getSource(cycloneSourceId) as any;
      if (existingCycloneSource && typeof existingCycloneSource.setData === 'function') {
        existingCycloneSource.setData(cycloneData);
      } else if (!existingCycloneSource) {
        map.addSource(cycloneSourceId, { type: 'geojson', data: cycloneData as any });
        map.addLayer(
          {
            id: cycloneOuterLayerId,
            type: 'circle',
            source: cycloneSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 14, 5, 38, 8, 90, 11, 240],
              'circle-color': 'rgba(6, 182, 212, 0.08)',
              'circle-stroke-width': 1.8,
              'circle-stroke-color': '#00e5ff',
              'circle-stroke-opacity': 0.75,
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: cycloneInnerLayerId,
            type: 'circle',
            source: cycloneSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 5, 14, 8, 35, 11, 90],
              'circle-color': 'rgba(6, 182, 212, 0.22)',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#38bdf8',
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // 3. Wildfire Thermal Halo FeatureCollection
    const wildfireFeatures: any[] = (!showDisasters ? [] : filteredDisasters)
      .filter((d) => getDisasterMeta(d).type === 'wildfires' && typeof d.lat === 'number' && typeof d.lng === 'number' && !isNaN(d.lat) && !isNaN(d.lng))
      .map((d) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
        properties: {
          id: d.id,
          frp: d.planetaryTelemetry?.fireRadiativePowerMw || 50,
        },
      }));

    const wildfireData = { type: 'FeatureCollection', features: wildfireFeatures };
    const wildfireSourceId = 'hazard-wildfire-source';
    const wildfireLayerId = 'hazard-wildfire-halo';

    try {
      const existingWildfireSource = map.getSource(wildfireSourceId) as any;
      if (existingWildfireSource && typeof existingWildfireSource.setData === 'function') {
        existingWildfireSource.setData(wildfireData);
      } else if (!existingWildfireSource) {
        map.addSource(wildfireSourceId, { type: 'geojson', data: wildfireData as any });
        map.addLayer(
          {
            id: wildfireLayerId,
            type: 'circle',
            source: wildfireSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 6, 6, 15, 10, 30],
              'circle-color': '#f97316',
              'circle-opacity': 0.22,
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#f59e0b',
              'circle-stroke-opacity': 0.7,
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // 4. Tropical Cyclone Uncertainty Cone & Track Geometry
    const shouldRenderCycloneTracks = showDisasters && (
      activeLayer === 'hurricane' ||
      activeDisasterFilter === 'cyclones' ||
      activeDisasterFilter === 'all'
    );

    const activeConeFeatures: any[] = [];
    const activeHistoryTrackFeatures: any[] = [];
    const activeForecastTrackFeatures: any[] = [];
    const activeForecastNodeFeatures: any[] = [];

    if (shouldRenderCycloneTracks && cyclones.length > 0) {
      cyclones.forEach((c) => {
        // A. Uncertainty Cone Polygon
        if (c.uncertaintyConeGeoJson) {
          activeConeFeatures.push({
            type: 'Feature',
            geometry: c.uncertaintyConeGeoJson,
            properties: { id: c.id, name: c.name },
          });
        }

        // B. Observed Historical Track LineString
        if (c.historicalTrack && c.historicalTrack.length > 1) {
          const coords = c.historicalTrack
            .filter((p) => typeof p.lng === 'number' && typeof p.lat === 'number')
            .map((p) => [p.lng, p.lat]);
          if (coords.length > 1) {
            activeHistoryTrackFeatures.push({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: coords },
              properties: { id: c.id, name: c.name },
            });
          }
        }

        // C. Official Forecast Track LineString
        if (c.forecastPoints && c.forecastPoints.length > 0) {
          const coords = [[c.lng, c.lat], ...c.forecastPoints.map((p) => [p.lng, p.lat])];
          activeForecastTrackFeatures.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
            properties: { id: c.id, name: c.name },
          });

          // D. Forecast Nodes
          c.forecastPoints.forEach((p) => {
            const windKt = p.windSpeedKnots || Math.round(p.windSpeedKph / 1.852);
            const milestoneTitle = formatMilestoneDate(p.timestamp, p.leadHours);
            const sshwsScale = getSaffirSimpsonCategoryNumber(p.windSpeedKph);
            const sshwsText = sshwsScale > 0 ? `SSHWS category ${sshwsScale}` : (p.stageName || 'Tropical Cyclone');
            const cardSubtitle = `${windKt}kt${p.pressureHpa ? ` · ${p.pressureHpa}hPa` : ''}`;
            const labelText = `${milestoneTitle}\n${cardSubtitle}`;
            const nodeBadge = sshwsScale > 0 ? `${sshwsScale}` : (p.stageName?.toLowerCase().includes('depression') ? 'D' : 'S');

            activeForecastNodeFeatures.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
              properties: {
                id: c.id,
                name: c.name,
                leadHours: p.leadHours || 0,
                windSpeedKph: p.windSpeedKph,
                windSpeedKnots: windKt,
                pressureHpa: p.pressureHpa || '',
                stageName: p.stageName || sshwsText,
                sshwsText,
                milestoneTitle,
                cardSubtitle,
                labelText,
                nodeBadge,
              },
            });
          });
        }
      });
    }

    // Add / Update Uncertainty Cone
    const coneData = { type: 'FeatureCollection', features: activeConeFeatures };
    const coneSourceId = 'hazard-cyclone-cone-source';
    const coneFillLayerId = 'hazard-cyclone-cone-fill';
    const coneOutlineLayerId = 'hazard-cyclone-cone-outline';

    try {
      const existingConeSource = map.getSource(coneSourceId) as any;
      if (existingConeSource && typeof existingConeSource.setData === 'function') {
        existingConeSource.setData(coneData);
      } else if (!existingConeSource) {
        map.addSource(coneSourceId, { type: 'geojson', data: coneData as any });
        map.addLayer(
          {
            id: coneFillLayerId,
            type: 'fill',
            source: coneSourceId,
            paint: {
              'fill-color': 'rgba(255, 255, 255, 0.16)',
              'fill-opacity': 0.85,
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: coneOutlineLayerId,
            type: 'line',
            source: coneSourceId,
            paint: {
              'line-color': '#ffffff',
              'line-width': 2.0,
              'line-dasharray': [4, 3],
              'line-opacity': 0.85,
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // Add / Update Historical Observed Track
    const historyData = { type: 'FeatureCollection', features: activeHistoryTrackFeatures };
    const historySourceId = 'hazard-cyclone-history-track-source';
    const historyLayerId = 'hazard-cyclone-history-track-line';

    try {
      const existingHistorySource = map.getSource(historySourceId) as any;
      if (existingHistorySource && typeof existingHistorySource.setData === 'function') {
        existingHistorySource.setData(historyData);
      } else if (!existingHistorySource) {
        map.addSource(historySourceId, { type: 'geojson', data: historyData as any });
        map.addLayer(
          {
            id: historyLayerId,
            type: 'line',
            source: historySourceId,
            paint: {
              'line-color': '#38bdf8',
              'line-width': 2.6,
              'line-opacity': 0.85,
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // Add / Update Forecast Track
    const forecastData = { type: 'FeatureCollection', features: activeForecastTrackFeatures };
    const forecastSourceId = 'hazard-cyclone-forecast-track-source';
    const forecastLayerId = 'hazard-cyclone-forecast-track-line';

    try {
      const existingForecastSource = map.getSource(forecastSourceId) as any;
      if (existingForecastSource && typeof existingForecastSource.setData === 'function') {
        existingForecastSource.setData(forecastData);
      } else if (!existingForecastSource) {
        map.addSource(forecastSourceId, { type: 'geojson', data: forecastData as any });
        map.addLayer(
          {
            id: forecastLayerId,
            type: 'line',
            source: forecastSourceId,
            paint: {
              'line-color': '#ffffff',
              'line-width': 2.5,
              'line-dasharray': [3, 2],
              'line-opacity': 0.95,
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // Add / Update Forecast Nodes
    const nodesData = { type: 'FeatureCollection', features: activeForecastNodeFeatures };
    const nodesSourceId = 'hazard-cyclone-forecast-nodes-source';
    const nodesLayerId = 'hazard-cyclone-forecast-nodes-circle';
    const nodesLabelLayerId = 'hazard-cyclone-forecast-nodes-label';

    try {
      const existingNodesSource = map.getSource(nodesSourceId) as any;
      if (existingNodesSource && typeof existingNodesSource.setData === 'function') {
        existingNodesSource.setData(nodesData);
      } else if (!existingNodesSource) {
        map.addSource(nodesSourceId, { type: 'geojson', data: nodesData as any });
        map.addLayer(
          {
            id: nodesLayerId,
            type: 'circle',
            source: nodesSourceId,
            paint: {
              'circle-radius': 9,
              'circle-color': [
                'step',
                ['get', 'windSpeedKph'],
                '#64748b',
                63, '#0284c7',
                119, '#dc2626',
                154, '#b91c1c',
                178, '#991b1b',
                210, '#7f1d1d',
              ],
              'circle-stroke-width': 2.2,
              'circle-stroke-color': '#ffffff',
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: nodesLabelLayerId,
            type: 'symbol',
            source: nodesSourceId,
            layout: {
              'text-field': ['get', 'labelText'],
              'text-size': 9.5,
              'text-offset': [0, 1.8],
              'text-anchor': 'top',
              'text-justify': 'center',
              'text-allow-overlap': true,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': 'rgba(6, 8, 24, 0.95)',
              'text-halo-width': 2.5,
            },
          },
          beforeLayerId
        );

        // Click popup displaying the reference-grade milestone card
        map.on('click', nodesLayerId, (e: any) => {
          const feat = e.features?.[0];
          if (!feat) return;
          const props = feat.properties;
          const coords = (feat.geometry as any).coordinates.slice();
          new Popup({ className: 'city-map-popup', closeButton: true, offset: 12 })
            .setLngLat(coords)
            .setHTML(`
              <div style="background: rgba(6, 8, 24, 0.96); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 10px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.85); min-width: 175px;">
                <div style="font-size: 11px; font-weight: 800; color: #ffffff; margin-bottom: 3px;">${props?.milestoneTitle || 'Forecast Milestone'}</div>
                <div style="font-size: 12px; font-family: monospace; font-weight: 700; color: #38bdf8; margin-bottom: 3px;">
                  ${props?.windSpeedKnots || '--'}kt ${props?.pressureHpa ? `<span style="color: rgba(255,255,255,0.4);">|</span> ${props.pressureHpa}hPa` : ''}
                </div>
                <div style="font-size: 10px; font-weight: 700; color: #f43f5e; text-transform: uppercase; letter-spacing: 0.05em;">
                  ${props?.sshwsText || ''}
                </div>
                <div style="font-size: 9px; color: rgba(255,255,255,0.5); margin-top: 4px; font-family: monospace;">
                  ${props?.name || ''} • Official Forecast (+${props?.leadHours || 0}h)
                </div>
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseenter', nodesLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', nodesLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }
    } catch {
      // Safe fallback
    }

    return () => {
      [
        'hazard-seismic-pulse-inner',
        'hazard-seismic-pulse-outer',
        'hazard-cyclone-core-inner',
        'hazard-cyclone-gale-outer',
        'hazard-wildfire-halo',
        'hazard-cyclone-cone-fill',
        'hazard-cyclone-cone-outline',
        'hazard-cyclone-history-track-line',
        'hazard-cyclone-forecast-track-line',
        'hazard-cyclone-forecast-nodes-circle',
        'hazard-cyclone-forecast-nodes-label',
      ].forEach((lId) => {
        try {
          if (map.getLayer(lId)) map.removeLayer(lId);
        } catch {
          // ignore
        }
      });
      [
        'hazard-seismic-pulse-source',
        'hazard-cyclone-radii-source',
        'hazard-wildfire-source',
        'hazard-cyclone-cone-source',
        'hazard-cyclone-history-track-source',
        'hazard-cyclone-forecast-track-source',
        'hazard-cyclone-forecast-nodes-source',
      ].forEach((sId) => {
        try {
          if (map.getSource(sId)) map.removeSource(sId);
        } catch {
          // ignore
        }
      });
    };
  }, [filteredDisasters, showDisasters, isMapLoaded, cyclones, activeLayer, activeDisasterFilter, timelineHoursAhead]);

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

  // Synchronize NASA GIBS Satellite Multi-Sector Raster Layers with MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const sectorSourceIds = [
      'nasa-gibs-visible-source',
      'nasa-gibs-polar-fill-source',
      'nasa-gibs-himawari-source',
      'nasa-gibs-goes-east-source',
      'nasa-gibs-goes-west-source',
      'nasa-gibs-europe-africa-source',
      'nasa-gibs-arctic-polar-source',
      'nasa-gibs-antarctic-polar-source',
      'nasa-gibs-satellite-source',
    ];
    const sectorLayerIds = [
      'nasa-gibs-visible-layer',
      'nasa-gibs-polar-fill-layer',
      'nasa-gibs-himawari-layer',
      'nasa-gibs-goes-east-layer',
      'nasa-gibs-goes-west-layer',
      'nasa-gibs-europe-africa-layer',
      'nasa-gibs-arctic-polar-layer',
      'nasa-gibs-antarctic-polar-layer',
      'nasa-gibs-satellite-layer',
    ];

    if (activeLayer === 'satellite' || activeLayer === 'clouds' || activeLayer === 'overview' || activeLayer === 'hurricane' || activeStyleKey === 'satellite' || activeStyleKey === 'atmospheric-satellite') {
      try {
        // Position clouds below country borders and place names so cartography stays crisp
        const beforeLayerId =
          map.getLayer('place_country_major') ? 'place_country_major' :
          map.getLayer('place_country_minor') ? 'place_country_minor' :
          map.getLayer('boundary_country_z0-4') ? 'boundary_country_z0-4' :
          map.getLayer('esri-satellite-labels-layer') ? 'esri-satellite-labels-layer' :
          undefined;

        // Tune opacity & contrast based on spectral band (Blue moisture, Infra thermal, or Visible daylight)
        const isVisibleMode = spectralMode === 'visible';
        const isBlue = (spectralMode || 'blue') === 'blue';
        const isInfra = spectralMode === 'infra';
        const rasterContrast = isVisibleMode ? 0.08 : isBlue ? 0.22 : 0.12;

        // Progressive Zoom-Dependent Atmospheric Cloud Dissolve Expressions:
        // - Planetary/Regional (zoom <= 8.5): Clouds remain 88% opaque showing real cyclone spirals & storms.
        // - District/Metropolitan (zoom 9.0 to 11.5): Clouds smoothly dissolve as the camera approaches city level.
        // - Street/Monuments/Landmarks (zoom >= 12.0): Clouds reach 0.0 opacity, revealing 100% razor-sharp, crisp 4K/HD satellite photography of places with ZERO fog.
        const visibleOpacityExpression: any = [
          'interpolate',
          ['linear'],
          ['zoom'],
          7.0, 0.88,
          8.5, 0.84,
          9.5, 0.65,
          10.5, 0.35,
          11.5, 0.10,
          12.0, 0.0,
        ];

        const geostationaryOpacityExpression: any = [
          'interpolate',
          ['linear'],
          ['zoom'],
          7.0, isBlue ? 0.86 : 0.88,
          8.5, isBlue ? 0.80 : 0.84,
          9.5, 0.65,
          10.5, 0.35,
          11.5, 0.10,
          12.0, 0.0,
        ];

        // Observation date string: for geostationary infrared & moisture, stream today's live real-time frames
        const geoObs = getGeostationaryObservationDate(timelineHoursAhead < 0 ? Math.abs(timelineHoursAhead) : 0);
        const dateStr = isVisibleMode
          ? getSatelliteObservationDate(0, 'visible').dateStr
          : geoObs.dateStr;

        if (isVisibleMode) {
          // Clean up infrared sectors
          ['nasa-gibs-himawari-layer', 'nasa-gibs-goes-east-layer', 'nasa-gibs-goes-west-layer', 'nasa-gibs-europe-africa-layer', 'nasa-gibs-arctic-polar-layer', 'nasa-gibs-antarctic-polar-layer', 'nasa-gibs-satellite-layer'].forEach((id) => {
            if (map.getLayer(id)) map.removeLayer(id);
          });
          ['nasa-gibs-himawari-source', 'nasa-gibs-goes-east-source', 'nasa-gibs-goes-west-source', 'nasa-gibs-europe-africa-source', 'nasa-gibs-arctic-polar-source', 'nasa-gibs-antarctic-polar-source', 'nasa-gibs-satellite-source'].forEach((id) => {
            if (map.getSource(id)) map.removeSource(id);
          });

          // Clean up polar fill layer if previously active
          if (map.getLayer('nasa-gibs-polar-fill-layer')) map.removeLayer('nasa-gibs-polar-fill-layer');
          if (map.getSource('nasa-gibs-polar-fill-source')) map.removeSource('nasa-gibs-polar-fill-source');

          // Global seamless TrueColor VIIRS layer (natural daylight cloud reflectance)
          const visibleSourceId = 'nasa-gibs-visible-source';
          const visibleLayerId = 'nasa-gibs-visible-layer';
          const trueColorUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${dateStr}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;

          const existingVisibleSource = map.getSource(visibleSourceId) as any;
          if (existingVisibleSource) {
            if (existingVisibleSource.tiles?.[0] !== trueColorUrl) {
              if (map.getLayer(visibleLayerId)) map.removeLayer(visibleLayerId);
              map.removeSource(visibleSourceId);
              map.addSource(visibleSourceId, {
                type: 'raster',
                tiles: [trueColorUrl],
                tileSize: 256,
                maxzoom: 9,
                bounds: [-180.0, -85.0, 180.0, 85.0],
                attribution: 'NASA GIBS / EOSDIS True Color',
              });
              map.addLayer(
                {
                  id: visibleLayerId,
                  type: 'raster',
                  source: visibleSourceId,
                  maxzoom: 12,
                  paint: {
                    'raster-opacity': visibleOpacityExpression,
                    'raster-contrast': rasterContrast,
                    'raster-fade-duration': 300,
                  },
                },
                beforeLayerId
              );
            } else if (map.getLayer(visibleLayerId)) {
              map.setPaintProperty(visibleLayerId, 'raster-opacity', visibleOpacityExpression);
              map.setPaintProperty(visibleLayerId, 'raster-contrast', rasterContrast);
            }
          } else {
            map.addSource(visibleSourceId, {
              type: 'raster',
              tiles: [trueColorUrl],
              tileSize: 256,
              maxzoom: 9,
              bounds: [-180.0, -85.0, 180.0, 85.0],
              attribution: 'NASA GIBS / EOSDIS True Color',
            });
            map.addLayer(
              {
                id: visibleLayerId,
                type: 'raster',
                source: visibleSourceId,
                maxzoom: 12,
                paint: {
                  'raster-opacity': visibleOpacityExpression,
                  'raster-contrast': rasterContrast,
                  'raster-fade-duration': 300,
                },
              },
              beforeLayerId
            );
          }
        } else {
          // Infrared / Blue geostationary sectors
          // Clean up visible and polar fill layers if present
          if (map.getLayer('nasa-gibs-visible-layer')) map.removeLayer('nasa-gibs-visible-layer');
          if (map.getSource('nasa-gibs-visible-source')) map.removeSource('nasa-gibs-visible-source');
          if (map.getLayer('nasa-gibs-polar-fill-layer')) map.removeLayer('nasa-gibs-polar-fill-layer');
          if (map.getSource('nasa-gibs-polar-fill-source')) map.removeSource('nasa-gibs-polar-fill-source');
          if (map.getLayer('nasa-gibs-satellite-layer')) map.removeLayer('nasa-gibs-satellite-layer');
          if (map.getSource('nasa-gibs-satellite-source')) map.removeSource('nasa-gibs-satellite-source');

          // Geostationary Clean Infrared constellation:
          // Covers Asia-Pacific & Indian Ocean / Bay of Bengal (Himawari-9),
          // Americas & Atlantic (GOES-East), and Pacific / Hawaii (GOES-West).
          // Clamped to tropical and temperate storm zones [-50°, +55°] to eliminate polar freezing ground false-positives.
          const sectors: {
            id: string;
            layerName: string;
            bounds: [number, number, number, number];
            tileMatrixSet: string;
            format: 'image/png' | 'image/jpeg';
            isSubHourly: boolean;
            maxzoom: number;
          }[] = [
            {
              id: 'himawari',
              layerName: 'Himawari_AHI_Band13_Clean_Infrared',
              tileMatrixSet: 'GoogleMapsCompatible_Level6',
              format: 'image/png',
              bounds: [45.0, -50.0, 165.0, 55.0],
              isSubHourly: true,
              maxzoom: 6,
            },
            {
              id: 'goes-east',
              layerName: 'GOES-East_ABI_Band13_Clean_Infrared',
              tileMatrixSet: 'GoogleMapsCompatible_Level6',
              format: 'image/png',
              bounds: [-140.0, -50.0, -15.0, 55.0],
              isSubHourly: true,
              maxzoom: 6,
            },
            {
              id: 'goes-west',
              layerName: 'GOES-West_ABI_Band13_Clean_Infrared',
              tileMatrixSet: 'GoogleMapsCompatible_Level6',
              format: 'image/png',
              bounds: [-180.0, -50.0, -100.0, 55.0],
              isSubHourly: true,
              maxzoom: 6,
            },
          ];

          // Clean up unused sectors (including obsolete VIIRS thermal brightness sectors)
          const activeSectorIds = new Set(sectors.map((s) => s.id));
          ['himawari', 'goes-east', 'goes-west', 'europe-africa', 'arctic-polar', 'antarctic-polar'].forEach((sId) => {
            if (!activeSectorIds.has(sId)) {
              if (map.getLayer(`nasa-gibs-${sId}-layer`)) map.removeLayer(`nasa-gibs-${sId}-layer`);
              if (map.getSource(`nasa-gibs-${sId}-source`)) map.removeSource(`nasa-gibs-${sId}-source`);
            }
          });

          sectors.forEach((sec) => {
            const sId = `nasa-gibs-${sec.id}-source`;
            const lId = `nasa-gibs-${sec.id}-layer`;
            const tileTime = sec.isSubHourly ? geoObs.isoTimestamp : geoObs.dateStr;
            const ext = sec.format === 'image/jpeg' ? 'jpg' : 'png';
            const tileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${sec.layerName}/default/${tileTime}/${sec.tileMatrixSet}/{z}/{y}/{x}.${ext}`;

            const existingSource = map.getSource(sId) as any;
            if (existingSource) {
              if (existingSource.tiles?.[0] !== tileUrl) {
                if (map.getLayer(lId)) map.removeLayer(lId);
                map.removeSource(sId);
                map.addSource(sId, {
                  type: 'raster',
                  tiles: [tileUrl],
                  tileSize: 256,
                  maxzoom: sec.maxzoom,
                  bounds: sec.bounds,
                  attribution: 'NASA GIBS / NOAA GOES / JMA Himawari Earth Science Open Data',
                });
                map.addLayer(
                  {
                    id: lId,
                    type: 'raster',
                    source: sId,
                    maxzoom: 9,
                    paint: {
                      'raster-opacity': geostationaryOpacityExpression,
                      'raster-contrast': rasterContrast,
                      'raster-fade-duration': 250,
                    },
                  },
                  beforeLayerId
                );
              } else if (map.getLayer(lId)) {
                map.setPaintProperty(lId, 'raster-opacity', geostationaryOpacityExpression);
                map.setPaintProperty(lId, 'raster-contrast', rasterContrast);
              }
            } else {
              map.addSource(sId, {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256,
                maxzoom: sec.maxzoom,
                bounds: sec.bounds,
                attribution: 'NASA GIBS / NOAA GOES / JMA Himawari Earth Science Open Data',
              });
              map.addLayer(
                {
                  id: lId,
                  type: 'raster',
                  source: sId,
                  maxzoom: 9,
                  paint: {
                    'raster-opacity': geostationaryOpacityExpression,
                    'raster-contrast': rasterContrast,
                    'raster-fade-duration': 300,
                  },
                },
                beforeLayerId
              );
            }
          });
        }
      } catch (err) {
        console.warn('[MapLibre Satellite] Layer sync notice:', err);
      }
    } else {
      try {
        sectorLayerIds.forEach((id) => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        sectorSourceIds.forEach((id) => {
          if (map.getSource(id)) map.removeSource(id);
        });
      } catch {
        // Silently ignore cleanup errors
      }
    }
  }, [activeLayer, isMapLoaded, satelliteTileUrl, spectralMode, satelliteObservationUtc, activeStyleKey, timelineHoursAhead, selectedCyclone]);

  // Synchronize Nowcast Lightning GeoJSON layer on MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const sourceId = 'nowcast-lightning-source';
    const glowLayerId = 'nowcast-lightning-glow';
    const coreLayerId = 'nowcast-lightning-core';

    if (showLightning && lightningFeed && lightningFeed.features.length > 0) {
      try {
        const existingSource = map.getSource(sourceId) as any;
        if (existingSource) {
          existingSource.setData(lightningFeed);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: lightningFeed as any,
          });

          // Soft ambient neon glow
          map.addLayer({
            id: glowLayerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'intensityKa'],
                15, 6,
                110, 15,
              ],
              'circle-color': ['get', 'colorHex'],
              'circle-opacity': 0.55,
              'circle-blur': 0.65,
            },
          });

          // Intense core spark
          map.addLayer({
            id: coreLayerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': 3.5,
              'circle-color': '#ffffff',
              'circle-stroke-width': 1.5,
              'circle-stroke-color': ['get', 'colorHex'],
            },
          });

          // Click popup showing lightning details
          map.on('click', coreLayerId, (e: any) => {
            const feat = e.features?.[0];
            if (!feat) return;
            const props = feat.properties;
            const coords = (feat.geometry as any).coordinates.slice();
            new Popup({ className: 'city-map-popup', closeButton: true })
              .setLngLat(coords)
              .setHTML(`
                <div style="background:#070718; color:#fff; padding:10px; border-radius:12px; font-family:monospace; font-size:11px; border:1px solid #e879f9;">
                  <div style="font-weight:bold; color:#f43f5e; margin-bottom:4px;">⚡ Nowcast Lightning Strike</div>
                  <div>Peak Current: <b>${props?.polarity ?? ''}${props?.intensityKa ?? 45} kA</b></div>
                  <div style="color:rgba(255,255,255,0.6); font-size:10px;">Detected ${props?.ageSeconds ?? 15}s ago</div>
                </div>
              `)
              .addTo(map);
          });

          map.on('mouseenter', coreLayerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', coreLayerId, () => {
            map.getCanvas().style.cursor = '';
          });
        }
      } catch (err) {
        console.warn('[MapLibre Lightning] Sync notice:', err);
      }
    } else {
      try {
        if (map.getLayer(coreLayerId)) map.removeLayer(coreLayerId);
        if (map.getLayer(glowLayerId)) map.removeLayer(glowLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // Silently ignore cleanup
      }
    }
  }, [showLightning, lightningFeed, isMapLoaded]);

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
      {activeLayer === 'radar' && !isRadarNoticeDismissed && !isLocationCoveredByRadar(latitude, longitude) && (
        <div className="absolute top-20 left-4 z-40 pointer-events-auto">
          <RadarCoverageNotice
            locationName={cityName}
            onSwitchToPrecipitation={() => {
              if (onLayerChange) onLayerChange('precipitation');
              else if (onOpenWeather) onOpenWeather();
            }}
            onSwitchToSatellite={() => {
              if (onLayerChange) onLayerChange('satellite');
              else if (onOpenWeather) onOpenWeather();
            }}
            onRecenterRadar={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({ center: [-96.0, 38.5], zoom: 4.5, speed: 1.4 });
              }
            }}
            onDismiss={() => setIsRadarNoticeDismissed(true)}
          />
        </div>
      )}



      {/* ── Geostationary Satellite & Nowcast Lightning Telemetry HUD ── */}
      {(activeLayer === 'satellite' || activeLayer === 'clouds' || activeLayer === 'hurricane' || activeStyleKey === 'satellite' || activeStyleKey === 'atmospheric-satellite') && !isSatelliteHudDismissed && (
        <div className="absolute top-20 left-4 z-40 pointer-events-auto max-w-[95%] sm:max-w-lg flex flex-col gap-1.5 animate-fade-in">
          <div className="rounded-2xl bg-[#060818]/94 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] p-2 sm:p-2.5 flex flex-col gap-2">
            {/* Top row: Sensor Pass + Live Time Pill + Hide Crossbar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-base shrink-0">🛰️</span>
                <span className="font-bold text-white text-[11px] tracking-wide">
                  Geostationary Satellite Clouds
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30">
                  REAL CLOUDS
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                {/* Amber Live Latency Pill or HD Ground Detail indicator */}
                {currentZoom >= 11.8 ? (
                  <div className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono font-bold text-[10px] tracking-wide flex items-center gap-1 shrink-0">
                    <span>✨</span>
                    <span>HD Places Active</span>
                  </div>
                ) : (
                  <div className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-[10px] tracking-wide shadow-[0_0_12px_rgba(251,191,36,0.8)] flex items-center gap-1 shrink-0 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>Live • 11m ago</span>
                  </div>
                )}

                {/* Crossbar to hide the HUD */}
                <button
                  type="button"
                  data-testid="close-satellite-hud-btn"
                  onClick={() => setIsSatelliteHudDismissed(true)}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-rose-500/30 text-white/70 hover:text-white flex items-center justify-center text-xs font-bold transition-all border border-white/10 hover:border-rose-400/50 cursor-pointer shrink-0 active:scale-95"
                  title="Hide Satellite Clouds HUD"
                  aria-label="Hide Satellite Clouds HUD"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Middle Row: Spectral Mode Switcher (Visible | Infra | Blue) & Lightning Toggle */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap">
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
                {(['visible', 'infra', 'blue'] as SatelliteSpectralMode[]).map((mode) => {
                  const isActive = (spectralMode || 'visible') === mode;
                  const label = mode === 'visible' ? 'Visible' : mode === 'infra' ? 'Infra (K)' : 'Blue (Moisture)';
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSelectSpectralMode?.(mode)}
                      className={`px-2 py-0.8 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-sm'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Nowcast Lightning Toggle Button */}
              {lightningFeed && (
                <button
                  type="button"
                  onClick={() => setShowLightning(!showLightning)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                    showLightning
                      ? 'bg-rose-500/25 border-rose-400/60 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  }`}
                  title="Toggle Nowcast Lightning strikes overlay"
                >
                  <span className="animate-pulse">⚡</span>
                  <span>Nowcast Lightning</span>
                  <span className="text-[9px] px-1 rounded bg-white/10 text-rose-300 font-bold">
                    {lightningFeed.totalCount}
                  </span>
                </button>
              )}
            </div>

            {/* Bottom Subtitle */}
            <div className="text-[9px] font-mono text-white/40 truncate">
              {satelliteObservationUtc || 'NASA EOSDIS / NOAA GOES / EUMETSAT • 10-15m Scans • Public Domain'}
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
            {activeWeatherSummary?.weatherEmoji ? (
              <span className="text-base shrink-0">{activeWeatherSummary.weatherEmoji}</span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white truncate max-w-[110px] min-[400px]:max-w-[140px] sm:max-w-[240px]">
                  {cityName === 'World Map' ? 'Global 2D Disaster & Climate Map' : cityName}
                </span>
                {activeWeatherSummary && typeof activeWeatherSummary.temperature === 'number' && (
                  <span className="font-black text-cyan-300 text-xs font-mono shrink-0">
                    {Math.round(activeWeatherSummary.temperature)}°{activeWeatherSummary.units === 'fahrenheit' ? 'F' : 'C'}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-white/50 truncate max-w-[110px] min-[400px]:max-w-[140px] sm:max-w-[240px]">
                {cityName === 'World Map'
                  ? 'Planetary Cyclones & Hazards'
                  : `${activeWeatherSummary?.weatherDescription ? `${activeWeatherSummary.weatherDescription} · ` : ''}${(countryName ? getLocalizedCountryName(countryName, locale) : null) || 'Metropolis'} · ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`}
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
          {/* Top Controls Row: Style Selector Dropdown + Optional Satellite HUD Restore Pill */}
          <div className="flex items-center gap-1.5">
            {/* If Satellite HUD is dismissed, show a sleek pill button to bring it back */}
            {(activeLayer === 'satellite' || activeLayer === 'clouds' || activeLayer === 'hurricane' || activeStyleKey === 'satellite' || activeStyleKey === 'atmospheric-satellite') && isSatelliteHudDismissed && (
              <button
                type="button"
                data-testid="show-satellite-hud-btn"
                onClick={() => setIsSatelliteHudDismissed(false)}
                className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 text-[10px] sm:text-[11px] font-mono text-cyan-300 hover:text-white flex items-center gap-1 shadow-lg transition-all cursor-pointer"
                title="Show Geostationary Satellite Clouds controls"
              >
                <span>🛰️</span>
                <span className="hidden sm:inline">Clouds</span>
                <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  {spectralMode ? spectralMode.toUpperCase() : 'BLUE'}
                </span>
              </button>
            )}

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
        </div>

          {/* Live Weather Summary Badge & Mobile Weather Telemetry Option */}
          {activeWeatherSummary ? (
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
                    {activeWeatherSummary.weatherEmoji || '🌤️'}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                      <span>
                        {typeof activeWeatherSummary.temperature === 'number'
                          ? `${Math.round(activeWeatherSummary.temperature)}°${activeWeatherSummary.units === 'fahrenheit' ? 'F' : 'C'}`
                          : '—'}
                      </span>
                      {!weatherSummary && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" title="Refreshing telemetry..." />
                      )}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/50 truncate max-w-[65px] min-[400px]:max-w-[90px] sm:max-w-[110px]">
                      {activeWeatherSummary.weatherDescription || 'Current'}
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
                {typeof activeWeatherSummary.windSpeed === 'number' && (
                  <span>💨 {Math.round(activeWeatherSummary.windSpeed)} km/h</span>
                )}
                {typeof activeWeatherSummary.relativeHumidity === 'number' && (
                  <span>💧 {activeWeatherSummary.relativeHumidity}%</span>
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



      {/* ── Scoped Disaster Animations & MapLibre Popup Styling ── */}
      <style>{`
        @keyframes cyclone-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cyclone-cloud-spin {
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
        <div className="bg-[#050512]/80 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-white/5 pointer-events-auto flex items-center gap-1.5">
          <span>ZOOM: {currentZoom}</span>
          {currentZoom >= 11.8 && (
            <span className="text-[9px] text-cyan-300 font-bold bg-cyan-500/20 px-1 py-0.2 rounded border border-cyan-400/30">
              HD GROUND
            </span>
          )}
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
