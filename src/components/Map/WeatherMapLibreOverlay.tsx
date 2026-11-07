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

const WIND_HEATMAP_SOURCE_ID = 'mooearth-wind-velocity-raster-source';
const WIND_HEATMAP_LAYER_ID = 'mooearth-wind-velocity-raster-layer';

export default function WeatherMapLibreOverlay({
  map,
  activeLayer,
  particlesEnabled = true,
  isMobile = false,
  reducedMotion = false,
}: WeatherMapLibreOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle2D[]>([]);
  const windFieldRef = useRef<GriddedWindField>(getGlobalWindField());
  const [cursorTelemetry, setCursorTelemetry] = useState<WindCursorTelemetry | null>(null);

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

  // ── 3. Interactive Wind Telemetry Cursor Picker (Windy Parity) ─────────
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

  // ── 4. Multi-Scale Zoom-Adaptive Particle Engine ────────────────────────
  useEffect(() => {
    if (!map || !isWindActive || !particlesEnabled) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
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

      return {
        lat: bestLat,
        lng: bestLng,
        prevLat: bestLat,
        prevLng: bestLng,
        age: Math.floor(Math.random() * 45),
        maxAge: 65 + Math.floor(Math.random() * 85),
        speed: 15,
      };
    };

    // Initialize screen particle pool
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(spawnParticle());
    }

    // Instant screen-space particle recycling on pan or zoom
    const handleViewportChange = () => {
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

    map.on('moveend', handleViewportChange);

    const render = () => {
      const container = map.getContainer();
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const zoom = map.getZoom();

      // Dynamic zoom-adaptive time scale:
      // In Web Mercator, 1 deg lat/lng spans exponentially more pixels as zoom increases (2^z).
      // We scale the advection step inversely by 2^(-(z-2.5)*0.82) so pixel displacement
      // remains in the comfortable 2-8 px/frame window across all zooms (1.0 to 14.0+).
      const zoomFactor = Math.pow(2, -(zoom - 2.5) * 0.82);
      const baseScale = reducedMotion ? 0.05 : 0.18;
      const timeScale = Math.max(0.0005, baseScale * zoomFactor);

      // Zoom-adaptive aerodynamic trail persistence & stroke styling
      const trailFade = zoom <= 4 ? 0.040 : zoom <= 8 ? 0.048 : 0.060;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${trailFade})`;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      const lineWidth = isMobile
        ? (zoom <= 4 ? 0.9 : zoom <= 8 ? 1.1 : 1.4)
        : (zoom <= 4 ? 1.0 : zoom <= 8 ? 1.3 : 1.7);
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      const particles = particlesRef.current;
      const bounds = map.getBounds();
      const maxDistSq = zoom <= 5 ? 10000 : zoom <= 9 ? 6400 : 2500;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.prevLat = p.lat;
        p.prevLng = p.lng;

        // Advect particle along meteorological U/V vectors with dynamic zoom scaling
        const advected = windField.advectParticle(p.lat, p.lng, timeScale);
        p.lat = advected.nextLat;
        p.lng = advected.nextLng;
        p.speed = advected.vector.speed;
        p.age++;

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
        const progress = p.age / p.maxAge;
        const alpha = Math.sin(progress * Math.PI) * 0.88;

        if (p.speed > 80) {
          // Intense eyewall / jet stream particles glow bright white-magenta
          ctx.strokeStyle = `rgba(255, 230, 255, ${alpha.toFixed(2)})`;
        } else if (p.speed > 40) {
          // Moderate to gale winds
          ctx.strokeStyle = `rgba(240, 255, 255, ${alpha.toFixed(2)})`;
        } else {
          // Gentle breeze
          ctx.strokeStyle = `rgba(210, 245, 255, ${(alpha * 0.82).toFixed(2)})`;
        }

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();
    map.on('resize', resizeCanvas);

    return () => {
      map.off('resize', resizeCanvas);
      map.off('moveend', handleViewportChange);
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
