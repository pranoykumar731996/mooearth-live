// ============================================================
// MooEarth Live — 2D MapLibre Wind Streamlines & Velocity Heatmap Overlay
// ============================================================
// Synchronized Windy-grade Wind Layer for MapLibre GL JS:
// 1. Continuous scalar wind speed velocity heatmap raster underneath particles.
// 2. Hardware-accelerated Canvas 2D animated streamline particles with motion trails.
// 3. Interactive cursor wind inspection telemetry (speed in kt & km/h, direction arrow, gusts).
// 4. Strict isolation: mounts and displays ONLY when activeLayer === 'wind'.

'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { getGlobalWindField, GriddedWindField } from '@/services/weather/griddedWindService';

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

  const particleCount = isMobile ? 500 : 1500;
  const isWindActive = activeLayer === 'wind';

  // ── 1. MapLibre Wind Velocity Heatmap Raster Layer Lifecycle ───────────
  useEffect(() => {
    if (!map) return;

    if (!isWindActive) {
      // Clean up wind heatmap raster as soon as user switches away from Wind
      try {
        if (map.getLayer(WIND_HEATMAP_LAYER_ID)) {
          map.removeLayer(WIND_HEATMAP_LAYER_ID);
        }
        if (map.getSource(WIND_HEATMAP_SOURCE_ID)) {
          map.removeSource(WIND_HEATMAP_SOURCE_ID);
        }
      } catch (err) {
        console.warn('[MapLibre Wind] Cleanup notice:', err);
      }
      return;
    }

    const applyWindHeatmap = () => {
      try {
        if (map.getSource(WIND_HEATMAP_SOURCE_ID)) return;

        const windField = windFieldRef.current;
        const dataUrl = windField.getMercatorWindHeatmapDataUrl(1440, 720);
        if (!dataUrl) return;

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
              'raster-opacity': 0.82,
              'raster-fade-duration': 250,
              'raster-resampling': 'linear',
            },
          },
          beforeLayerId
        );
      } catch (err) {
        console.warn('[MapLibre Wind] Heatmap mount error:', err);
      }
    };

    if (map.isStyleLoaded()) {
      applyWindHeatmap();
    } else {
      map.once('style.load', applyWindHeatmap);
    }

    return () => {
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
  }, [map, isWindActive]);

  // ── 2. Interactive Wind Telemetry Cursor Picker ─────────────────────────
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

      setCursorTelemetry({
        x: point.x,
        y: point.y,
        lat: Math.round(lat * 100) / 100,
        lng: Math.round(lng * 100) / 100,
        speedKt,
        speedKmh,
        gustKmh,
        directionDeg: Math.round(sample.directionDeg),
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

  // ── 3. High-Performance Streamline Particle Engine ──────────────────────
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

    // Spawn random particle within current visible map bounds
    const spawnParticle = (): Particle2D => {
      const bounds = map.getBounds();
      const west = bounds.getWest();
      const east = bounds.getEast();
      const south = Math.max(-80, bounds.getSouth());
      const north = Math.min(80, bounds.getNorth());

      const lat = south + Math.random() * (north - south);
      const lng = west + Math.random() * (east - west);

      return {
        lat,
        lng,
        prevLat: lat,
        prevLng: lng,
        age: Math.floor(Math.random() * 45),
        maxAge: 45 + Math.floor(Math.random() * 55),
        speed: 15,
      };
    };

    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(spawnParticle());
    }

    const windField = windFieldRef.current;
    const timeScale = reducedMotion ? 0.05 : 0.18;

    const render = () => {
      const container = map.getContainer();
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Soft trail fade creates aerodynamic particle motion blur
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = isMobile ? 1.1 : 1.5;
      ctx.lineCap = 'round';

      const particles = particlesRef.current;
      const bounds = map.getBounds();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.prevLat = p.lat;
        p.prevLng = p.lng;

        // Advect particle along meteorological U/V vectors
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

        const distSq = (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2;
        if (distSq > 10000) {
          particles[i] = spawnParticle();
          continue;
        }

        // Streamlines on top of heatmap are styled in luminous translucent white/cyan
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
            top: `${cursorTelemetry.y - 36}px`,
          }}
        >
          <div className="bg-[#0b1329]/95 border border-cyan-400/50 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-2xl text-xs font-mono text-white flex items-center gap-2">
            <span
              className="inline-block transition-transform duration-100 text-cyan-300 font-bold text-sm"
              style={{ transform: `rotate(${cursorTelemetry.directionDeg}deg)` }}
              title={`Wind blowing from ${cursorTelemetry.directionDeg}°`}
            >
              ↑
            </span>
            <div className="flex flex-col leading-tight">
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-sm text-cyan-300">{cursorTelemetry.speedKt}</span>
                <span className="text-[10px] text-cyan-400/80">kt</span>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="text-[11px] text-white/90">{cursorTelemetry.speedKmh} km/h</span>
              </div>
              <div className="text-[9px] text-white/50 flex items-center gap-1">
                <span>Gusts {cursorTelemetry.gustKmh} km/h</span>
                <span>·</span>
                <span>{cursorTelemetry.directionDeg}°</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
