// ============================================================
// MooEarth Live — Globe Controls Hook
// ============================================================

'use client';

import { useCallback, useRef } from 'react';
import { GLOBE_CONFIG } from '@/lib/constants';
import { GlobePointOfView } from '@/types';

export interface GlobeApi {
  getPointOfView: () => { lat: number; lng: number; altitude: number } | null;
  flyTo: (pov: Partial<GlobePointOfView>, duration?: number) => void;
  pauseRotation: () => void;
  resumeRotation: () => void;
  spinRapidly: (speedMultiplier?: number) => void;
  freezeRotation: () => void;
}

type GlobeInstance = any;

export function useGlobeControls() {
  const globeRef = useRef<GlobeInstance>(null);

  /** Initialize globe controls after mount */
  const initControls = useCallback(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = GLOBE_CONFIG.autoRotateSpeed;
      controls.enableDamping = true;
      controls.dampingFactor = 0.04; // Google Earth style inertia damping (smoother momentum glide)
      controls.rotateSpeed = 0.65;    // Smoother drag rotation
      controls.zoomSpeed = 0.85;      // Smooth zoom speed
      controls.minDistance = 120;
      controls.maxDistance = 600;
    }
  }, []);

  /** Fly the camera to a specific point on the globe */
  const flyTo = useCallback(
    (pov: Partial<GlobePointOfView>, duration?: number) => {
      if (!globeRef.current) return;
      globeRef.current.pointOfView(
        {
          lat: pov.lat ?? GLOBE_CONFIG.defaultPov.lat,
          lng: pov.lng ?? GLOBE_CONFIG.defaultPov.lng,
          altitude: pov.altitude ?? 1.8,
        },
        duration ?? GLOBE_CONFIG.transitionDuration
      );
    },
    []
  );

  /** Pause auto-rotation (e.g., during user interaction) */
  const pauseRotation = useCallback(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) controls.autoRotate = false;
  }, []);

  /** Resume auto-rotation */
  const resumeRotation = useCallback(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = GLOBE_CONFIG.autoRotateSpeed;
    }
  }, []);

  /** Spin the globe rapidly for games like Stop The Earth */
  const spinRapidly = useCallback((speedMultiplier = 16.0) => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = speedMultiplier;
    }
  }, []);

  /** Instantly freeze globe rotation */
  const freezeRotation = useCallback(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0;
    }
  }, []);

  /** Get exact camera point of view coordinates (lat, lng, altitude) */
  const getPointOfView = useCallback(() => {
    if (!globeRef.current) return null;
    return globeRef.current.pointOfView() as { lat: number; lng: number; altitude: number } | null;
  }, []);

  return {
    globeRef,
    initControls,
    flyTo,
    pauseRotation,
    resumeRotation,
    spinRapidly,
    freezeRotation,
    getPointOfView,
  };
}
