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

interface WeatherMapLibreOverlayProps {
  map: MapLibreMap | null;
  activeLayer: string;
  particlesEnabled?: boolean;
  windSpeedUnit?: 'kt' | 'km/h';
  isMobile?: boolean;
  reducedMotion?: boolean;
}

interface Particle2D {
  lat: number;
  lng: number;
  prevLat: number;
  prevLng: number;
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
}: WeatherMapLibreOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle2D[]>([]);
  const windFieldRef = useRef<GriddedWindField>(getGlobalWindField());
  const cityMarkersRef = useRef<CityWindMarkerEntry[]>([]);
  const [cursorTelemetry, setCursorTelemetry] = useState<WindCursorTelemetry | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const isMapMovingRef = useRef<boolean>(false);

  const particleCount = isMobile ? 800 : 3200;
  const isWindActive = activeLayer === 'wind';

  // ── 1. Live Planetary Grid Synchronization ─────────────────────────────
  useEffect(() => {
    if (!isWindActive) return;
    // Asynchronously synchronize live planetary wind vectors in background
    loadLiveWindField().catch(() => {});
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
            'raster-opacity': 0.62,
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
  useEffect(() => {
    if (!map || !isWindActive) {
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
  }, [map, isWindActive, windSpeedUnit]);

  // ── 4. Interactive Wind Telemetry Cursor Picker (Windy Parity) ─────────
  useEffect(() => {
    if (!map || !isWindActive) {
      setCursorTelemetry(null);
      return;
    }

    const windField = windFieldRef.current;

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

    map.on('mousemove', handleMouseMove);
    map.getCanvas().addEventListener('mouseleave', handleMouseLeave);

    return () => {
      map.off('mousemove', handleMouseMove);
      try {
        map.getCanvas().removeEventListener('mouseleave', handleMouseLeave);
      } catch (err) {
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

    // Speed-weighted importance sampling particle spawner
    const spawnParticle = (): Particle2D => {
      const bounds = map.getBounds();
      const west = bounds.getWest();
      const east = bounds.getEast();
      const south = Math.max(-80, bounds.getSouth());
      const north = Math.min(80, bounds.getNorth());

      let bestLat = south + Math.random() * (north - south);
      let bestLng = west + Math.random() * (east - west);

      // 2-sample importance check: prefer areas with active wind
      const sample1 = windField.sampleAt(bestLat, bestLng);
      if (sample1.speed < 4) {
        const candidateLat = south + Math.random() * (north - south);
        const candidateLng = west + Math.random() * (east - west);
        const sample2 = windField.sampleAt(candidateLat, candidateLng);
        if (sample2.speed > sample1.speed) {
          bestLat = candidateLat;
          bestLng = candidateLng;
        }
      }

      // Wide distribution (75 to 195 frames) with uniform random initial age to eliminate pulsing waves
      const maxAge = 75 + Math.floor(Math.random() * 120);
      return {
        lat: bestLat,
        lng: bestLng,
        prevLat: bestLat,
        prevLng: bestLng,
        age: Math.floor(Math.random() * maxAge),
        maxAge,
        speed: 15,
      };
    };

    // Initialize screen particle pool
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(spawnParticle());
    }

    // Active movement listeners to prevent screen trail smearing during camera panning/zooming
    const handleMoveStart = () => {
      isMapMovingRef.current = true;
      if (canvasRef.current) {
        const c = canvasRef.current;
        const context = c.getContext('2d');
        if (context) {
          context.clearRect(0, 0, c.width, c.height);
        }
      }
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
      // Standardizes particle velocity to exact physical speed across 60Hz, 90Hz, 120Hz, 144Hz displays
      const lastTime = lastFrameTimeRef.current || now;
      const elapsedSec = (now - lastTime) / 1000;
      lastFrameTimeRef.current = now;
      const dtSec = Math.min(0.040, Math.max(0.006, elapsedSec));
      const dtRatio = dtSec / 0.016667;

      // Dynamic zoom-adaptive time scale:
      // In Web Mercator, 1 deg lat/lng spans exponentially more pixels as zoom increases (2^z).
      // k(z) = 2^(-(z-2.5)*0.82) maintains a constant physical perceptual velocity across zooms 1 to 14+.
      const zoomFactor = Math.pow(2, -(zoom - 2.5) * 0.82);
      const baseScale = reducedMotion ? 0.04 : 0.16;
      const timeScale = Math.max(0.0004, baseScale * zoomFactor) * dtRatio;

      // Zoom-adaptive aerodynamic trail persistence & stroke styling
      // Scale trail fade rate with delta time so trail persistence is identical across different frame rates
      const baseTrailFade = isMapMovingRef.current
        ? 0.35 // Accelerated fade during active drag/pan to prevent trail smearing
        : (zoom <= 4 ? 0.038 : zoom <= 8 ? 0.048 : 0.058);
      const effectiveFade = 1 - Math.pow(1 - baseTrailFade, dtRatio);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${effectiveFade.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      const lineWidth = isMobile
        ? (zoom <= 4 ? 1.0 : zoom <= 8 ? 1.2 : 1.5)
        : (zoom <= 4 ? 1.1 : zoom <= 8 ? 1.4 : 1.8);
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      const particles = particlesRef.current;
      const bounds = map.getBounds();
      const maxDistSq = zoom <= 5 ? 10000 : zoom <= 9 ? 6400 : 2500;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.prevLat = p.lat;
        p.prevLng = p.lng;

        // Sample true wind vector at current coordinate
        const sample = windField.sampleAt(p.lat, p.lng);
        p.speed = sample.speed;

        // Smooth Sub-Linear Velocity Curve (Windy & Zoom Earth Parity):
        // Replaces artificial hard speed floor (which previously multiplied calm 0.5 km/h winds by 24x!)
        // Smoothly maps low-wind areas to a gentle laminar crawl (0.65x) up to high-speed jet streams (1.6x)
        // without any sudden velocity steps, stuttering, or visual jerking.
        const speedScale = 0.65 + 0.35 * Math.min(2.8, Math.pow(Math.max(0.1, sample.speed) / 15, 0.55));

        // Advect particle along meteorological U/V vectors using RK2 midpoint integration
        const advected = windField.advectParticle(p.lat, p.lng, timeScale * speedScale);
        p.lat = advected.nextLat;
        p.lng = advected.nextLng;
        p.age += dtRatio;

        // Respawn if aged or drifted outside viewport
        if (
          p.age >= p.maxAge ||
          p.lat < bounds.getSouth() - 2 ||
          p.lat > bounds.getNorth() + 2 ||
          p.lng < bounds.getWest() - 2 ||
          p.lng > bounds.getEast() + 2
        ) {
          particles[i] = spawnParticle();
          continue;
        }

        // Project geographic coordinates to screen pixels
        const p0 = map.project([p.prevLng, p.prevLat]);
        const p1 = map.project([p.lng, p.lat]);

        // Antimeridian or sudden camera jump guard
        const distSq = (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2;
        if (distSq > maxDistSq) {
          particles[i] = spawnParticle();
          continue;
        }

        // Streamlines styled in luminous translucent white/cyan with intensity glow
        const progress = Math.min(1.0, p.age / p.maxAge);
        const alpha = Math.sin(progress * Math.PI) * 0.92;

        if (p.speed > 75) {
          // Intense eyewall / jet stream particles glow bright white-magenta
          ctx.strokeStyle = `rgba(255, 230, 255, ${alpha.toFixed(2)})`;
        } else if (p.speed > 40) {
          // Moderate to gale winds
          ctx.strokeStyle = `rgba(235, 255, 255, ${alpha.toFixed(2)})`;
        } else if (p.speed > 15) {
          // Steady breeze
          ctx.strokeStyle = `rgba(200, 245, 255, ${(alpha * 0.85).toFixed(2)})`;
        } else {
          // Gentle calm breeze - silky subtle cyan
          ctx.strokeStyle = `rgba(175, 235, 255, ${(alpha * 0.72).toFixed(2)})`;
        }

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
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

      {/* Floating Windy-Grade Wind Inspection Cursor Tooltip */}
      {cursorTelemetry && (
        <div
          className="absolute pointer-events-none z-30 transition-transform duration-75 hidden sm:block"
          style={{
            left: `${cursorTelemetry.x + 14}px`,
            top: `${cursorTelemetry.y - 42}px`,
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
