// ============================================================
// MooEarth Live — Animated Wind Particle Overlay
// ============================================================
// Lightweight HTML5 Canvas particle system for visualizing wind speed
// and direction over the globe. Speed-sensitive, directionally correct,
// with reduced-motion support, pause/resume, and mobile optimization.

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface WindParticleOverlayProps {
  windSpeed?: number; // km/h
  windDirection?: number; // degrees (0° = North, 90° = East, 180° = South, 270° = West)
  windGusts?: number; // km/h
  isActive?: boolean;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  life: number;
  maxLife: number;
  width: number;
}

export default function WindParticleOverlay({
  windSpeed = 15,
  windDirection = 45,
  windGusts,
  isActive = true,
  className = '',
}: WindParticleOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [intensity, setIntensity] = useState<'gentle' | 'normal' | 'turbo'>('normal');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Intensity multiplier
  const intensityMultiplier = intensity === 'gentle' ? 0.6 : intensity === 'turbo' ? 1.8 : 1.0;

  // Compute Beaufort scale and description
  const getBeaufortDescription = (speedKmh: number) => {
    if (speedKmh < 2) return { scale: 0, label: 'Calm', color: 'text-sky-300' };
    if (speedKmh < 12) return { scale: 1, label: 'Light Air', color: 'text-cyan-300' };
    if (speedKmh < 20) return { scale: 2, label: 'Light Breeze', color: 'text-emerald-300' };
    if (speedKmh < 29) return { scale: 3, label: 'Gentle Breeze', color: 'text-teal-300' };
    if (speedKmh < 39) return { scale: 4, label: 'Moderate Breeze', color: 'text-yellow-300' };
    if (speedKmh < 50) return { scale: 5, label: 'Fresh Breeze', color: 'text-amber-400' };
    if (speedKmh < 62) return { scale: 6, label: 'Strong Breeze', color: 'text-orange-400' };
    if (speedKmh < 75) return { scale: 7, label: 'High Wind / Near Gale', color: 'text-rose-400' };
    if (speedKmh < 89) return { scale: 8, label: 'Gale', color: 'text-red-400' };
    return { scale: 9, label: 'Severe Gale / Storm', color: 'text-purple-400' };
  };

  const beaufort = getBeaufortDescription(windSpeed);

  // Compass cardinal string
  const getCardinalDirection = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((deg % 360) / 22.5)) % 16;
    return directions[index];
  };

  const cardinal = getCardinalDirection(windDirection);

  // Canvas particle simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Resize handler
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 300);

    const isMobile = width < 640;
    const particleCount = isMobile ? 35 : 75;

    // Calculate angle in radians. Wind direction is where wind comes from; particles blow toward opposite angle.
    const blowAngleRad = ((windDirection + 180) % 360) * (Math.PI / 180);
    const cosAngle = Math.cos(blowAngleRad);
    const sinAngle = Math.sin(blowAngleRad);

    // Speed scaling: 0-100 km/h maps to 1.0 - 8.0 px/frame
    const baseSpeed = Math.max(1.2, Math.min(8.0, (windSpeed / 12) * intensityMultiplier));

    // Initialize particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 8 + Math.random() * 16 * (baseSpeed / 3),
        speed: baseSpeed * (0.8 + Math.random() * 0.4),
        opacity: 0.15 + Math.random() * 0.45,
        life: Math.random() * 100,
        maxLife: 60 + Math.random() * 80,
        width: 1 + Math.random() * 1.5,
      });
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle color based on speed
    const strokeColor =
      windSpeed < 20
        ? 'rgba(0, 229, 255,' // Cyan
        : windSpeed < 45
        ? 'rgba(52, 211, 153,' // Emerald
        : windSpeed < 70
        ? 'rgba(251, 191, 36,' // Amber
        : 'rgba(244, 63, 94,'; // Rose/Red

    // Animation frame render
    const render = () => {
      if (isPaused) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;

        if (p.life >= p.maxLife) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.life = 0;
          p.maxLife = 60 + Math.random() * 80;
        }

        // Move particle in wind direction
        p.x += cosAngle * p.speed;
        p.y += sinAngle * p.speed;

        // Wrap around boundaries
        if (p.x < -40) p.x = width + 30;
        if (p.x > width + 40) p.x = -30;
        if (p.y < -40) p.y = height + 30;
        if (p.y > height + 40) p.y = -30;

        // Fade in and out with life cycle
        const lifeFraction = p.life / p.maxLife;
        const fade = Math.sin(lifeFraction * Math.PI);
        const currentOpacity = p.opacity * fade;

        // Draw streamline streak
        ctx.beginPath();
        ctx.strokeStyle = `${strokeColor} ${currentOpacity.toFixed(2)})`;
        ctx.lineWidth = p.width;
        ctx.lineCap = 'round';
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - cosAngle * p.length, p.y - sinAngle * p.length);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [windSpeed, windDirection, intensityMultiplier, isPaused, isActive, prefersReducedMotion]);

  if (!isActive) return null;

  return (
    <div className={`pointer-events-none relative w-full h-full ${className}`}>
      {/* Full-bleed HTML5 Canvas for Streamlines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Floating Interactive Wind Telemetry HUD */}
      <div className="pointer-events-auto absolute bottom-4 right-4 z-20 flex flex-col gap-2 max-w-[260px]">
        <div className="bg-[#050512]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl text-white">
          {/* Header & Compass */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              {/* Compass Needle */}
              <div className="relative w-7 h-7 rounded-full bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
                <div
                  className="w-1 h-4 bg-gradient-to-t from-transparent via-cyan-400 to-rose-400 rounded-full transition-transform duration-700 ease-out"
                  style={{ transform: `rotate(${windDirection}deg)` }}
                />
                <span className="absolute text-[7px] font-bold text-white/40 top-0.5">N</span>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                  WIND STREAMLINES
                </div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span className="text-cyan-300">{Math.round(windSpeed)} km/h</span>
                  <span className="text-xs text-white/60">({cardinal} {Math.round(windDirection)}°)</span>
                </div>
              </div>
            </div>

            {/* Play / Pause */}
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs transition-colors"
              title={isPaused ? 'Resume wind animation' : 'Pause wind animation'}
            >
              {isPaused ? '▶' : '⏸'}
            </button>
          </div>

          {/* Beaufort Scale Badge */}
          <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/5 border border-white/5 mb-2">
            <span className="text-[11px] text-white/50">Beaufort {beaufort.scale}</span>
            <span className={`text-[11px] font-semibold ${beaufort.color}`}>{beaufort.label}</span>
          </div>

          {/* Wind Gusts if reported */}
          {windGusts !== undefined && windGusts > 0 && (
            <div className="text-[10px] text-white/60 flex items-center justify-between mb-2 px-1">
              <span>Peak Gusts:</span>
              <span className="font-mono text-amber-300 font-bold">{Math.round(windGusts)} km/h</span>
            </div>
          )}

          {/* Intensity Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
            <span className="text-white/40">Intensity:</span>
            <div className="flex gap-1">
              {(['gentle', 'normal', 'turbo'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setIntensity(mode)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium capitalize transition-colors ${
                    intensity === mode
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer note */}
        <div className="text-[9px] text-white/30 text-right px-1">
          Streamlines rendered from Open-Meteo vector vectors.
        </div>
      </div>
    </div>
  );
}
