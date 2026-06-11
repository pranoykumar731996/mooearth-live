// ============================================================
// MooEarth Live — Globe Controls Hook
// ============================================================

'use client';

import { useCallback, useRef } from 'react';
import { GLOBE_CONFIG } from '@/lib/constants';
import { GlobePointOfView } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      controls.dampingFactor = 0.1;
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

  return {
    globeRef,
    initControls,
    flyTo,
    pauseRotation,
    resumeRotation,
  };
}
