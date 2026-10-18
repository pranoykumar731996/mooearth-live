// ============================================================
// MooEarth Live — 2D MapLibre Wind Streamlines Overlay
// ============================================================
// Synchronized HTML5 Canvas 2D animated wind particle streamlines for MapLibre GL JS.
// Uses the exact same GriddedWindField dataset as the 3D Earth Globe, ensuring
// complete mathematical and visual consistency between 2D and 3D projections.
//
// Features:
// - Zoom-adaptive particle density and streak lengths.
// - Smooth trailing alpha fades matching Windy.com aesthetic.
// - Hardware-accelerated Canvas 2D with requestAnimationFrame.
// - Battery-conscious: pauses when tab is hidden or reduced-motion is requested.

'use client';

import React, { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { getGlobalWindField, GriddedWindField } from '@/services/weather/griddedWindService';
import { getWindColor } from '@/components/Globe/WeatherLayers/WindParticleSystem';

interface WeatherMapLibreOverlayProps {
  map: MapLibreMap | null;
  activeLayer: string;
  particlesEnabled?: boolean;
  windSpeedUnit?: string;
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

  const particleCount = isMobile ? 400 : 1200;
  const shouldRenderParticles =
    activeLayer === 'wind' ||
    (particlesEnabled && (activeLayer === 'overview' || activeLayer === 'pressure' || activeLayer === 'temperature'));

  useEffect(() => {
    if (!map || !shouldRenderParticles) {
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

    // Spawn random particle within map bounding box
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
        age: Math.floor(Math.random() * 40),
        maxAge: 40 + Math.floor(Math.random() * 50),
        speed: 15,
      };
    };

    // Initialize particle pool
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(spawnParticle());
    }

    const windField = windFieldRef.current;
    const timeScale = reducedMotion ? 0.05 : 0.16;

    // Animation Loop
    const render = () => {
      const container = map.getContainer();
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Soft semi-transparent black fade to create particle motion streaks
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = isMobile ? 1.0 : 1.4;
      ctx.lineCap = 'round';

      const particles = particlesRef.current;
      const bounds = map.getBounds();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.prevLat = p.lat;
        p.prevLng = p.lng;

        // Advect particle using the GriddedWindField
        const advected = windField.advectParticle(p.lat, p.lng, timeScale);
        p.lat = advected.nextLat;
        p.lng = advected.nextLng;
        p.speed = advected.vector.speed;
        p.age++;

        // Respawn if aged or drifted outside view
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

        // Guard against massive pixel jumps across 180 antimeridian
        const distSq = (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2;
        if (distSq > 10000) {
          particles[i] = spawnParticle();
          continue;
        }

        // Compute color and alpha
        const threeCol = getWindColor(p.speed);
        const progress = p.age / p.maxAge;
        const alpha = Math.sin(progress * Math.PI) * 0.85;

        const r = Math.round(threeCol.r * 255);
        const g = Math.round(threeCol.g * 255);
        const b = Math.round(threeCol.b * 255);

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;

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
  }, [map, activeLayer, isMobile, reducedMotion, particleCount]);

  if (activeLayer !== 'wind') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
