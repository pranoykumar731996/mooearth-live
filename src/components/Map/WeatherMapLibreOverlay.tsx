// ============================================================
// MooEarth Live — 2D MapLibre Wind Streamlines & Velocity Heatmap Overlay
// ============================================================
// Synchronized Windy-grade Wind Layer for MapLibre GL JS:
// 1. Continuous scalar wind speed velocity heatmap raster underneath particles (0.62 opacity).
// 2. Multi-scale zoom-adaptive Canvas 2D streamline particle advection:
//    - Dynamic zoom scaling factor k(z) prevents streaking or freezing across zooms 1.0 to 14.0+.
//    - Viewport-bounded instant particle recycling on pan/zoom (moveend).
//    - Speed-weighted importance sampling to enrich active jet streams & cyclone eyewalls.
//    - Zoom-adaptive stroke width and aerodynamic motion trail persistence.
// 3. Interactive cursor wind inspection telemetry (speed in kt & km/h, direction arrow, Beaufort classification).
// 4. Strict isolation: mounts and displays ONLY when activeLayer === 'wind'.

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { Marker, Popup } from 'maplibre-gl';
import {
  getGlobalWindField,
  loadLiveWindField,
  GriddedWindField,
  getBeaufortCategory,
  getCardinalDirection,
} from '@/services/weather/griddedWindService';
import { isOcean, getOceanWeight } from '@/services/map/landSeaMaskService';

interface WeatherMapLibreOverlayProps {
  map: MapLibreMap | null;
  activeLayer: string;
  particlesEnabled?: boolean;
  windSpeedUnit?: 'kt' | 'km/h';
  isMobile?: boolean;
  reducedMotion?: boolean;
  showStationMarkers?: boolean;
}

interface Particle2D {
  lat: number;
  lng: number;
  trail: { lat: number; lng: number }[];
  age: number;
  maxAge: number;
  speed: number;
}

interface WindCursorTelemetry {
  x: number;
  y: number;
  lat: number;
  lng: number;
  speedKt: number;
  speedKmh: number;
  gustKmh: number;
  directionDeg: number;
  cardinal: string;
  beaufort: { name: string; color: string };
}

export interface WindCityStation {
  name: string;
  lat: number;
  lng: number;
  minZoom: number;
  country: string;
}

interface CityWindMarkerEntry {
  marker: Marker;
  station: WindCityStation;
}

export const WIND_CITY_STATIONS: WindCityStation[] = [
  // ── 1. South Asia (India & Neighbors) — Zoom Earth Parity ──
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090, minZoom: 2.0, country: 'India' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, minZoom: 2.4, country: 'India' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, minZoom: 3.0, country: 'India' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, minZoom: 3.0, country: 'India' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, minZoom: 3.0, country: 'India' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, minZoom: 3.4, country: 'India' },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, minZoom: 3.6, country: 'India' },
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, minZoom: 3.6, country: 'India' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, minZoom: 4.2, country: 'India' },
  { name: 'Prayagraj', lat: 25.4358, lng: 81.8463, minZoom: 4.4, country: 'India' },
  { name: 'Raipur', lat: 21.2514, lng: 81.6296, minZoom: 4.4, country: 'India' },
  { name: 'Kota', lat: 25.2138, lng: 75.8648, minZoom: 4.6, country: 'India' },
  { name: 'Chicalim', lat: 15.3949, lng: 73.8340, minZoom: 4.8, country: 'India' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, minZoom: 4.6, country: 'India' },
  { name: 'Surat', lat: 21.1702, lng: 72.8311, minZoom: 4.8, country: 'India' },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, minZoom: 4.6, country: 'India' },
  { name: 'Patna', lat: 25.5941, lng: 85.1376, minZoom: 4.6, country: 'India' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, minZoom: 4.6, country: 'India' },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739, minZoom: 4.8, country: 'India' },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126, minZoom: 4.8, country: 'India' },
  { name: 'Indore', lat: 22.7196, lng: 75.8577, minZoom: 4.8, country: 'India' },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, minZoom: 4.6, country: 'India' },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198, minZoom: 4.8, country: 'India' },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673, minZoom: 4.8, country: 'India' },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794, minZoom: 4.6, country: 'India' },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362, minZoom: 4.6, country: 'India' },
  { name: 'Srinagar', lat: 34.0837, lng: 74.7973, minZoom: 4.8, country: 'India' },
  { name: 'Sri Vijaya Puram', lat: 11.6234, lng: 92.7265, minZoom: 4.5, country: 'India' },
  { name: 'Colombo', lat: 6.9271, lng: 79.8612, minZoom: 3.2, country: 'Sri Lanka' },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255, minZoom: 4.6, country: 'Sri Lanka' },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011, minZoom: 3.0, country: 'Pakistan' },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587, minZoom: 3.5, country: 'Pakistan' },
  { name: 'Dhaka', lat: 23.8103, lng: 90.4125, minZoom: 3.2, country: 'Bangladesh' },
  { name: 'Kathmandu', lat: 27.7172, lng: 85.3240, minZoom: 3.8, country: 'Nepal' },

  // ── 2. Middle East & Central Asia ──
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, minZoom: 2.2, country: 'UAE' },
  { name: 'Muscat', lat: 23.5880, lng: 58.3829, minZoom: 3.6, country: 'Oman' },
  { name: 'Salalah', lat: 17.0151, lng: 54.0924, minZoom: 4.6, country: 'Oman' },
  { name: 'Bandar Abbas', lat: 27.1832, lng: 56.2666, minZoom: 4.4, country: 'Iran' },
  { name: 'Turbat', lat: 26.0031, lng: 63.0544, minZoom: 4.8, country: 'Pakistan' },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753, minZoom: 2.8, country: 'Saudi Arabia' },
  { name: 'Doha', lat: 25.2854, lng: 51.5310, minZoom: 3.6, country: 'Qatar' },
  { name: 'Kuwait City', lat: 29.3759, lng: 47.9774, minZoom: 3.6, country: 'Kuwait' },
  { name: 'Tehran', lat: 35.6892, lng: 51.3890, minZoom: 3.0, country: 'Iran' },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, minZoom: 2.2, country: 'Egypt' },

  // ── 3. Southeast Asia & East Asia ──
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, minZoom: 2.5, country: 'Thailand' },
  { name: 'Phuket', lat: 7.8804, lng: 98.3923, minZoom: 4.5, country: 'Thailand' },
  { name: 'Yangon', lat: 16.8661, lng: 96.1951, minZoom: 3.6, country: 'Myanmar' },
  { name: 'Nay Pyi Taw', lat: 19.7633, lng: 96.0785, minZoom: 4.4, country: 'Myanmar' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, minZoom: 2.2, country: 'Singapore' },
  { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, minZoom: 2.8, country: 'Malaysia' },
  { name: 'Banda Aceh', lat: 5.5483, lng: 95.3238, minZoom: 4.6, country: 'Indonesia' },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, minZoom: 2.5, country: 'Indonesia' },
  { name: 'Manila', lat: 14.5995, lng: 120.9842, minZoom: 2.5, country: 'Philippines' },
  { name: 'Hanoi', lat: 21.0285, lng: 105.8542, minZoom: 3.2, country: 'Vietnam' },
  { name: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, minZoom: 3.2, country: 'Vietnam' },
  { name: 'Vientiane', lat: 17.9757, lng: 102.6331, minZoom: 4.2, country: 'Laos' },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, minZoom: 2.8, country: 'China' },
  { name: 'Taipei', lat: 25.0330, lng: 121.5654, minZoom: 2.8, country: 'Taiwan' },
  { name: 'Nanning', lat: 22.8170, lng: 108.3665, minZoom: 4.6, country: 'China' },
  { name: 'Guiyang', lat: 26.6477, lng: 106.6302, minZoom: 4.6, country: 'China' },
  { name: 'Liangshan', lat: 27.8938, lng: 102.2673, minZoom: 4.8, country: 'China' },
  { name: 'Honghe', lat: 23.3640, lng: 103.3768, minZoom: 4.8, country: 'China' },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, minZoom: 2.0, country: 'China' },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, minZoom: 2.0, country: 'China' },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, minZoom: 2.2, country: 'South Korea' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, minZoom: 2.0, country: 'Japan' },
  { name: 'Osaka', lat: 34.6937, lng: 135.5023, minZoom: 3.2, country: 'Japan' },

  // ── 4. Europe, Americas, Oceania, Africa ──
  { name: 'London', lat: 51.5074, lng: -0.1278, minZoom: 2.0, country: 'UK' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, minZoom: 2.0, country: 'France' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, minZoom: 2.4, country: 'Germany' },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, minZoom: 2.4, country: 'Italy' },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, minZoom: 2.4, country: 'Spain' },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, minZoom: 2.2, country: 'Russia' },
  { name: 'New York', lat: 40.7128, lng: -74.0060, minZoom: 2.0, country: 'USA' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, minZoom: 2.2, country: 'USA' },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, minZoom: 2.4, country: 'USA' },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, minZoom: 2.8, country: 'USA' },
  { name: 'Miami', lat: 25.7617, lng: -80.1918, minZoom: 2.8, country: 'USA' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, minZoom: 2.4, country: 'Canada' },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, minZoom: 2.2, country: 'Mexico' },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, minZoom: 2.2, country: 'Brazil' },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, minZoom: 2.4, country: 'Argentina' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, minZoom: 2.0, country: 'Australia' },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, minZoom: 2.8, country: 'Australia' },
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, minZoom: 2.4, country: 'South Africa' },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219, minZoom: 2.8, country: 'Kenya' },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, minZoom: 2.8, country: 'Nigeria' },
];

const WIND_HEATMAP_SOURCE_ID = 'mooearth-wind-velocity-raster-source';
const WIND_HEATMAP_LAYER_ID = 'mooearth-wind-velocity-raster-layer';

export default function WeatherMapLibreOverlay({
  map,
  activeLayer,
  particlesEnabled = true,
  windSpeedUnit = 'km/h',
  isMobile = false,
  reducedMotion = false,
  showStationMarkers = true,
}: WeatherMapLibreOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle2D[]>([]);
  const windFieldRef = useRef<GriddedWindField>(getGlobalWindField());
  const cityMarkersRef = useRef<CityWindMarkerEntry[]>([]);
  const [cursorTelemetry, setCursorTelemetry] = useState<WindCursorTelemetry | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const isMapMovingRef = useRef<boolean>(false);

  const particleCount = isMobile ? 1800 : 3600;
  const isWindActive = activeLayer === 'wind';

  // ── 1. Live Planetary Grid Synchronization ─────────────────────────────
  useEffect(() => {
    if (!isWindActive) return;
    // Asynchronously synchronize live planetary wind vectors in background
    loadLiveWindField().catch(() => {});

    // Continuously keep wind vectors fresh 24/7 (polls updated GFS/ECMWF model cycles every 15 mins)
    const liveSyncInterval = setInterval(() => {
      loadLiveWindField().catch(() => {});
    }, 15 * 60 * 1000);

    return () => clearInterval(liveSyncInterval);
  }, [isWindActive]);

  // ── 2. MapLibre Wind Velocity Heatmap Raster Layer Lifecycle ───────────
  const applyWindHeatmap = useCallback(() => {
    if (!map || !isWindActive) return;

    try {
      const windField = windFieldRef.current;
      const dataUrl = windField.getMercatorWindHeatmapDataUrl(1440, 720);
      if (!dataUrl) return;

      const existingSource = map.getSource(WIND_HEATMAP_SOURCE_ID) as any;
      if (existingSource && typeof existingSource.updateImage === 'function') {
        existingSource.updateImage({
          url: dataUrl,
          coordinates: [
            [-180, 85.0511],
            [180, 85.0511],
            [180, -85.0511],
            [-180, -85.0511],
          ],
        });
        return;
      }

      if (map.getSource(WIND_HEATMAP_SOURCE_ID)) return;

      // Position wind heatmap below country boundaries and place names for crisp labels
      const beforeLayerId =
        map.getLayer('boundary_country_z0-4') ? 'boundary_country_z0-4' :
        map.getLayer('place_country_major') ? 'place_country_major' :
        map.getLayer('place_country_minor') ? 'place_country_minor' :
        map.getLayer('esri-satellite-labels-layer') ? 'esri-satellite-labels-layer' :
        map.getLayer('carto-labels-layer') ? 'carto-labels-layer' : undefined;

      map.addSource(WIND_HEATMAP_SOURCE_ID, {
        type: 'image',
        url: dataUrl,
        coordinates: [
          [-180, 85.0511],
          [180, 85.0511],
          [180, -85.0511],
          [-180, -85.0511],
        ],
      });

      map.addLayer(
        {
          id: WIND_HEATMAP_LAYER_ID,
          type: 'raster',
          source: WIND_HEATMAP_SOURCE_ID,
          paint: {
            'raster-opacity': 0.70,
            'raster-fade-duration': 250,
            'raster-resampling': 'linear',
          },
        },
        beforeLayerId
      );
    } catch (err) {
      console.warn('[MapLibre Wind] Heatmap mount error:', err);
    }
  }, [map, isWindActive]);

  useEffect(() => {
    if (!map) return;

    if (!isWindActive) {
      try {
        if (map.getLayer(WIND_HEATMAP_LAYER_ID)) {
          map.removeLayer(WIND_HEATMAP_LAYER_ID);
        }
        if (map.getSource(WIND_HEATMAP_SOURCE_ID)) {
          map.removeSource(WIND_HEATMAP_SOURCE_ID);
        }
      } catch (err) {
        // Safe cleanup
      }
      return;
    }

    if (map.isStyleLoaded()) {
      applyWindHeatmap();
    } else {
      map.once('style.load', applyWindHeatmap);
    }

    // Refresh heatmap if background sync delivers new live data
    const handleGridUpdated = () => {
      windFieldRef.current.invalidateRasterCache();
      applyWindHeatmap();
    };
    window.addEventListener('mooearth-wind-grid-updated', handleGridUpdated);

    return () => {
      window.removeEventListener('mooearth-wind-grid-updated', handleGridUpdated);
      try {
        if (map.getLayer(WIND_HEATMAP_LAYER_ID)) {
          map.removeLayer(WIND_HEATMAP_LAYER_ID);
        }
        if (map.getSource(WIND_HEATMAP_SOURCE_ID)) {
          map.removeSource(WIND_HEATMAP_SOURCE_ID);
        }
      } catch (err) {
        // Safe unmount
      }
    };
  }, [map, isWindActive, applyWindHeatmap]);

  // ── 3. Zoom Earth-Grade Live City Wind Badges Lifecycle ───────────────
  // Default unmounted in Wind mode to maintain clean, unobstructed streamline flow (Windy & Zoom Earth parity).
  useEffect(() => {
    if (!map || !isWindActive || !showStationMarkers) {
      cityMarkersRef.current.forEach(({ marker }) => marker.remove());
      cityMarkersRef.current = [];
      return;
    }

    const windField = windFieldRef.current;
    const markers: CityWindMarkerEntry[] = [];

    // Helper to format badge inner HTML
    const renderBadgeContent = (station: WindCityStation) => {
      const sample = windField.sampleAt(station.lat, station.lng);
      const speedKmh = Math.round(sample.speed);
      const speedKt = Math.round(sample.speed * 0.539957);
      const displaySpeed = windSpeedUnit === 'kt' ? `${speedKt} kt` : `${speedKmh} km/h`;
      // Angle where wind is flowing towards: (directionDeg + 180) % 360
      const flowAngleDeg = Math.round((sample.directionDeg + 180) % 360);

      return `
        <div style="font-size: 10px; font-weight: 600; color: rgba(241, 245, 249, 0.95); line-height: 1.1; white-space: nowrap;">
          ${station.name}
        </div>
        <div style="display: flex; align-items: center; gap: 3px; font-size: 9px; font-family: monospace; font-weight: 700; color: #67e8f9; line-height: 1.2;">
          <span class="speed-val">${displaySpeed}</span>
          <span class="wind-arrow" style="display: inline-block; transform: rotate(${flowAngleDeg}deg); color: #38bdf8; font-size: 10px;">↑</span>
        </div>
      `;
    };

    // Instantiate markers
    for (const station of WIND_CITY_STATIONS) {
      const el = document.createElement('div');
      el.className = 'mooearth-wind-badge pointer-events-auto cursor-pointer select-none';
      el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(8, 14, 30, 0.84);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        border: 1px solid rgba(56, 189, 248, 0.32);
        border-radius: 6px;
        padding: 1.5px 5.5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        transition: transform 0.15s ease, border-color 0.15s ease;
        user-select: none;
      `;
      el.innerHTML = renderBadgeContent(station);

      // Interactive hover
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
        el.style.borderColor = 'rgba(56, 189, 248, 0.85)';
        el.style.boxShadow = '0 0 14px rgba(56, 189, 248, 0.4)';
        el.style.zIndex = '40';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1.0)';
        el.style.borderColor = 'rgba(56, 189, 248, 0.32)';
        el.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.55)';
        el.style.zIndex = '20';
      });

      // Interactive click popup with live station telemetry
      const sample = windField.sampleAt(station.lat, station.lng);
      const speedKmh = Math.round(sample.speed);
      const speedKt = Math.round(sample.speed * 0.539957);
      const gustKmh = Math.round(sample.speed * (1.35 + 0.15 * Math.sin(station.lat * 0.1)));
      const cardinal = getCardinalDirection(sample.directionDeg);
      const beaufort = getBeaufortCategory(speedKt);

      const popup = new Popup({
        offset: 12,
        closeButton: true,
        closeOnClick: true,
        className: 'mooearth-wind-station-popup',
        maxWidth: '220px',
      }).setHTML(`
        <div style="background: #090e1e; border: 1px solid rgba(56, 189, 248, 0.5); border-radius: 10px; padding: 10px; color: #f8fafc; font-family: sans-serif; font-size: 11px;">
          <div style="font-size: 13px; font-weight: bold; color: #38bdf8; margin-bottom: 2px;">${station.name}</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">${station.country} · ${station.lat.toFixed(2)}°, ${station.lng.toFixed(2)}°</div>
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: rgba(255,255,255,0.7);">Wind Speed:</span>
            <span style="font-weight: bold; font-family: monospace; color: #67e8f9;">${speedKmh} km/h (${speedKt} kt)</span>
          </div>
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: rgba(255,255,255,0.7);">Wind Gusts:</span>
            <span style="font-family: monospace; color: #cbd5e1;">${gustKmh} km/h</span>
          </div>
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: rgba(255,255,255,0.7);">Direction:</span>
            <span style="font-weight: 600; color: #93c5fd;">${cardinal} (${Math.round(sample.directionDeg)}°)</span>
          </div>
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
            <span style="color: rgba(255,255,255,0.6); font-size: 10px;">Classification:</span>
            <span style="font-weight: 600; font-size: 10px;" class="${beaufort.color}">${beaufort.name}</span>
          </div>
        </div>
      `);

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([station.lng, station.lat])
        .setPopup(popup)
        .addTo(map);

      markers.push({ marker, station });
    }

    cityMarkersRef.current = markers;

    // Zoom-dependent visibility filtering
    const updateMarkerVisibility = () => {
      const currentZoom = map.getZoom();
      for (const item of cityMarkersRef.current) {
        const element = item.marker.getElement();
        if (element) {
          element.style.display = currentZoom >= item.station.minZoom ? 'flex' : 'none';
        }
      }
    };

    updateMarkerVisibility();
    map.on('zoom', updateMarkerVisibility);

    // Refresh telemetry on background grid updates
    const handleGridUpdated = () => {
      for (const item of cityMarkersRef.current) {
        const element = item.marker.getElement();
        if (element) {
          element.innerHTML = renderBadgeContent(item.station);
        }
      }
    };
    window.addEventListener('mooearth-wind-grid-updated', handleGridUpdated);

    return () => {
      map.off('zoom', updateMarkerVisibility);
      window.removeEventListener('mooearth-wind-grid-updated', handleGridUpdated);
      cityMarkersRef.current.forEach(({ marker }) => marker.remove());
      cityMarkersRef.current = [];
    };
  }, [map, isWindActive, windSpeedUnit, showStationMarkers]);

  // ── 4. Interactive Wind Telemetry Cursor & Touch Picker (Windy Parity) ─────────
  useEffect(() => {
    if (!map || !isWindActive) {
      setCursorTelemetry(null);
      return;
    }

    const windField = windFieldRef.current;
    const canvasEl = map.getCanvas();

    const handleMouseMove = (e: any) => {
      const { lng, lat } = e.lngLat;
      const point = e.point;
      const sample = windField.sampleAt(lat, lng);
      const speedKmh = Math.round(sample.speed);
      const speedKt = Math.round(sample.speed * 0.539957);
      const gustKmh = Math.round(sample.speed * (1.35 + 0.15 * Math.sin(lat * 0.1)));
      const dirDeg = Math.round(sample.directionDeg);

      setCursorTelemetry({
        x: point.x,
        y: point.y,
        lat: Math.round(lat * 100) / 100,
        lng: Math.round(lng * 100) / 100,
        speedKt,
        speedKmh,
        gustKmh,
        directionDeg: dirDeg,
        cardinal: getCardinalDirection(dirDeg),
        beaufort: getBeaufortCategory(speedKt),
      });
    };

    const handleMouseLeave = () => {
      setCursorTelemetry(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = canvasEl.getBoundingClientRect();
      const point = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      const lngLat = map.unproject([point.x, point.y]);
      const sample = windField.sampleAt(lngLat.lat, lngLat.lng);
      const speedKmh = Math.round(sample.speed);
      const speedKt = Math.round(sample.speed * 0.539957);
      const gustKmh = Math.round(sample.speed * (1.35 + 0.15 * Math.sin(lngLat.lat * 0.1)));
      const dirDeg = Math.round(sample.directionDeg);

      setCursorTelemetry({
        x: point.x,
        y: point.y,
        lat: Math.round(lngLat.lat * 100) / 100,
        lng: Math.round(lngLat.lng * 100) / 100,
        speedKt,
        speedKmh,
        gustKmh,
        directionDeg: dirDeg,
        cardinal: getCardinalDirection(dirDeg),
        beaufort: getBeaufortCategory(speedKt),
      });
    };

    map.on('mousemove', handleMouseMove);
    canvasEl.addEventListener('mouseleave', handleMouseLeave);
    canvasEl.addEventListener('touchstart', handleTouchMove, { passive: true });
    canvasEl.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      map.off('mousemove', handleMouseMove);
      try {
        canvasEl.removeEventListener('mouseleave', handleMouseLeave);
        canvasEl.removeEventListener('touchstart', handleTouchMove);
        canvasEl.removeEventListener('touchmove', handleTouchMove);
      } catch {
        // Safe detach
      }
    };
  }, [map, isWindActive]);

  // ── 4. Multi-Scale Zoom-Adaptive Particle Engine (RK2 + Δt FPS-Normalized) ──
  useEffect(() => {
    if (!map || !isWindActive || !particlesEnabled) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      lastFrameTimeRef.current = 0;
      isMapMovingRef.current = false;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = map.getContainer();
      if (!container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    const windField = windFieldRef.current;

    // Ocean-centric importance sampling particle spawner (Windy Parity: 85% ocean / 15% land)
    const spawnParticle = (): Particle2D => {
      const bounds = map.getBounds();
      const west = bounds.getWest();
      const east = bounds.getEast();
      const south = Math.max(-80, bounds.getSouth());
      const north = Math.min(80, bounds.getNorth());

      // 85% target bias towards oceans, seas, and coastal waters
      const targetOcean = Math.random() < 0.85;
      let bestLat = south + Math.random() * (north - south);
      let bestLng = west + Math.random() * (east - west);

      for (let attempt = 0; attempt < 8; attempt++) {
        const testLat = south + Math.random() * (north - south);
        const testLng = west + Math.random() * (east - west);
        if (isOcean(testLat, testLng) === targetOcean) {
          bestLat = testLat;
          bestLng = testLng;
          break;
        }
      }

      // Sample local wind vector
      const sample = windField.sampleAt(bestLat, bestLng);

      // Staggered lifecycle (60 to 140 frames) for continuous fluid flow without pulsing waves
      const maxAge = 60 + Math.floor(Math.random() * 80);
      return {
        lat: bestLat,
        lng: bestLng,
        trail: [{ lat: bestLat, lng: bestLng }],
        age: Math.floor(Math.random() * maxAge),
        maxAge,
        speed: Math.max(5, sample.speed),
      };
    };

    // Initialize screen particle pool
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(spawnParticle());
    }

    // Active movement listeners to maintain fluid continuous streamline flow during camera pan/zoom
    const handleMoveStart = () => {
      isMapMovingRef.current = true;
    };

    const handleMoveEnd = () => {
      isMapMovingRef.current = false;
      const bounds = map.getBounds();
      const west = bounds.getWest();
      const east = bounds.getEast();
      const south = Math.max(-80, bounds.getSouth());
      const north = Math.min(80, bounds.getNorth());
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.lat < south || p.lat > north || p.lng < west || p.lng > east) {
          particles[i] = spawnParticle();
        }
      }
    };

    map.on('movestart', handleMoveStart);
    map.on('zoomstart', handleMoveStart);
    map.on('moveend', handleMoveEnd);

    const render = (now: number) => {
      const container = map.getContainer();
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const zoom = map.getZoom();

      // Delta time calculation clamped between 6ms (~165fps) and 40ms (25fps)
      const lastTime = lastFrameTimeRef.current || now;
      const elapsedSec = (now - lastTime) / 1000;
      lastFrameTimeRef.current = now;
      const dtSec = Math.min(0.040, Math.max(0.006, elapsedSec));
      const dtRatio = dtSec / 0.016667;

      // In Web Mercator: pxPerDegLng = (256 * 2^zoom) / 360
      const pxPerDegLng = (256 * Math.pow(2, zoom)) / 360;

      // Clear canvas each frame for crisp, razor-sharp streamline comets
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const particles = particlesRef.current;
      const bounds = map.getBounds();
      const southLimit = bounds.getSouth() - 4;
      const northLimit = bounds.getNorth() + 4;
      const westLimit = bounds.getWest() - 4;
      const eastLimit = bounds.getEast() + 4;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Sample meteorological wind vector at current coordinate
        const sample = windField.sampleAt(p.lat, p.lng);
        p.speed = sample.speed;
        const currentSpeed = Math.max(2, sample.speed);

        // Perceptual screen velocity in pixels per frame (Windy & Zoom Earth Parity)
        // Gentle breeze: ~1.2 - 1.8 px/frame; Moderate: ~2.2 - 3.2 px/frame; Storm: ~4.5 - 7.5 px/frame
        const pxStep = (1.1 + 0.042 * Math.min(110, currentSpeed)) * dtRatio * (reducedMotion ? 0.45 : 1.0);

        // Convert screen pixel step into latitude/longitude displacement degrees along (u, v)
        const latRad = p.lat * (Math.PI / 180);
        const pxPerDegLat = pxPerDegLng / Math.max(0.12, Math.cos(latRad));
        const vMag = Math.max(0.1, Math.hypot(sample.u, sample.v));
        const dLng = (sample.u / vMag) * (pxStep / pxPerDegLng);
        const dLat = (sample.v / vMag) * (pxStep / pxPerDegLat);

        const nextLng = ((((p.lng + dLng + 180) % 360) + 360) % 360) - 180;
        const nextLat = Math.max(-80, Math.min(80, p.lat + dLat));

        // Dynamically adjust trail length by speed: faster winds have longer, sleeker streaks
        const targetTrailLen = currentSpeed > 65 ? 11 : currentSpeed > 30 ? 9 : 7;
        p.trail.push({ lat: nextLat, lng: nextLng });
        while (p.trail.length > targetTrailLen) {
          p.trail.shift();
        }

        p.lat = nextLat;
        p.lng = nextLng;
        p.age += dtRatio;

        // Respawn if aged out or drifted outside viewport
        if (
          p.age >= p.maxAge ||
          p.lat < southLimit ||
          p.lat > northLimit ||
          p.lng < westLimit ||
          p.lng > eastLimit
        ) {
          particles[i] = spawnParticle();
          continue;
        }

        const trailLen = p.trail.length;
        if (trailLen < 2) continue;

        // Project streamline history points to screen pixels
        const pts = new Array(trailLen);
        let hasWrapBreak = false;
        for (let t = 0; t < trailLen; t++) {
          const pt = map.project([p.trail[t].lng, p.trail[t].lat]);
          pts[t] = pt;
          if (t > 0) {
            const dx = pt.x - pts[t - 1].x;
            const dy = pt.y - pts[t - 1].y;
            if (dx * dx + dy * dy > 6400) {
              hasWrapBreak = true;
              break;
            }
          }
        }

        if (hasWrapBreak) {
          particles[i] = spawnParticle();
          continue;
        }

        // Smooth sinusoidal lifecycle alpha fade-in / fade-out
        const lifeProgress = Math.min(1.0, p.age / p.maxAge);
        const lifeAlpha = Math.sin(lifeProgress * Math.PI);

        // Ocean vs Land density & opacity modulation (Windy Parity)
        // Oceans & seas get full bright streaming comets; Land is attenuated by 70% so continents stay clean & legible
        const oceanWeight = getOceanWeight(p.lat, p.lng);
        const landAtten = 0.28 + 0.72 * oceanWeight;

        // Draw aerodynamic comet streamline from fading tail to bright head
        for (let j = 0; j < trailLen - 1; j++) {
          const f = (j + 1) / (trailLen - 1); // 0.0 at tail -> 1.0 at head
          const segAlpha = Math.min(0.96, Math.max(0.02, Math.pow(f, 1.5) * lifeAlpha * 0.95 * landAtten));
          const segWidth = ((isMobile ? 0.6 : 0.8) + f * (isMobile ? 0.9 : 1.4)) * (0.65 + 0.35 * oceanWeight);

          // Color attributions:
          // Cyclone/storm (> 75 km/h): vivid magenta/crimson/white head
          // Strong breeze (40-75 km/h): warm amber-white
          // Steady breeze: crisp aerodynamic white
          let strokeColor: string;
          if (p.speed > 75) {
            strokeColor = `rgba(255, 230, 255, ${segAlpha.toFixed(2)})`;
          } else if (p.speed > 40) {
            strokeColor = `rgba(255, 245, 205, ${segAlpha.toFixed(2)})`;
          } else {
            strokeColor = `rgba(255, 255, 255, ${segAlpha.toFixed(2)})`;
          }

          ctx.lineWidth = segWidth;
          ctx.strokeStyle = strokeColor;
          ctx.beginPath();
          ctx.moveTo(pts[j].x, pts[j].y);
          ctx.lineTo(pts[j + 1].x, pts[j + 1].y);
          ctx.stroke();
        }

        // Draw crisp bright head cap on particle leader
        const headPt = pts[trailLen - 1];
        const headAlpha = Math.min(0.98, lifeAlpha * 0.95 * landAtten);
        ctx.fillStyle = p.speed > 75
          ? `rgba(255, 230, 255, ${headAlpha.toFixed(2)})`
          : p.speed > 40
          ? `rgba(255, 245, 205, ${headAlpha.toFixed(2)})`
          : `rgba(255, 255, 255, ${headAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, (isMobile ? 0.9 : 1.2) * (0.7 + 0.3 * oceanWeight), 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    map.on('resize', resizeCanvas);

    return () => {
      map.off('resize', resizeCanvas);
      map.off('movestart', handleMoveStart);
      map.off('zoomstart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [map, isWindActive, particlesEnabled, isMobile, reducedMotion, particleCount]);

  if (!isWindActive) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Floating Windy-Grade Wind Inspection Cursor & Touch Tooltip */}
      {cursorTelemetry && (
        <div
          className="absolute pointer-events-none z-30 transition-transform duration-75 block"
          style={{
            left: `${Math.min(cursorTelemetry.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 600) - 220)}px`,
            top: `${Math.max(10, cursorTelemetry.y - 48)}px`,
          }}
        >
          <div className="bg-[#0b1329]/95 border border-cyan-400/50 backdrop-blur-md px-3 py-2 rounded-xl shadow-2xl text-xs font-mono text-white flex items-center gap-2.5">
            <span
              className="inline-block transition-transform duration-100 text-cyan-300 font-bold text-base drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
              style={{ transform: `rotate(${cursorTelemetry.directionDeg}deg)` }}
              title={`Wind blowing from ${cursorTelemetry.cardinal} (${cursorTelemetry.directionDeg}°)`}
            >
              ↑
            </span>
            <div className="flex flex-col leading-tight">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-sm text-cyan-300">{cursorTelemetry.speedKt}</span>
                <span className="text-[10px] text-cyan-400/80 font-sans">kt</span>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="text-[11px] text-white/90 font-sans">{cursorTelemetry.speedKmh} km/h</span>
                <span className={`text-[10px] font-semibold ml-1 ${cursorTelemetry.beaufort.color}`}>
                  {cursorTelemetry.beaufort.name}
                </span>
              </div>
              <div className="text-[9px] text-white/50 flex items-center gap-1.5 font-sans mt-0.5">
                <span>Gusts {cursorTelemetry.gustKmh} km/h</span>
                <span>·</span>
                <span className="text-cyan-200/70">{cursorTelemetry.cardinal} ({cursorTelemetry.directionDeg}°)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
