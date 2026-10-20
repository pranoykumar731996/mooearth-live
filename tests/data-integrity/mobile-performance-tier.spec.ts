// ============================================================
// MooEarth Live — Mobile Performance & Anti-Hang Test Suite
// ============================================================
// Verifies that low-end Android mobile devices (1GB–3GB RAM,
// budget Mali/PowerVR/Adreno GPUs) are accurately detected and
// assigned optimal performance constraints (DPR 0.70, flat polygons,
// 30 FPS clamping, HTML DOM suppression in game mode).
// ============================================================

import { test, expect } from '@playwright/test';
import {
  getPerformanceProfile,
  setPerformanceTierOverride,
  recordFrameJank,
  subscribeToPerformanceProfile,
  PerformanceProfile,
} from '@/services/devicePerformanceTier';

test.describe('MOOEARTH LIVE — LOW-END ANDROID ANTI-HANG ENGINE', () => {
  test('accurately returns baseline profile with valid hardware constraints', () => {
    const profile = getPerformanceProfile();
    expect(profile).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(profile.tier);
    expect(profile.maxPixelRatio).toBeGreaterThanOrEqual(0.65);
    expect(profile.maxPixelRatio).toBeLessThanOrEqual(2.0);
    expect([30, 60]).toContain(profile.maxFps);
  });

  test('user manual override to low tier enforces low-power mobile profile', () => {
    setPerformanceTierOverride('low');
    const profile = getPerformanceProfile();

    expect(profile.tier).toBe('low');
    expect(profile.isLowEndDevice).toBe(true);
    expect(profile.maxPixelRatio).toBe(0.70);
    expect(profile.maxFps).toBe(30);
    expect(profile.flatPolygons).toBe(true);
    expect(profile.suppressHtmlMarkersInGame).toBe(true);
    expect(profile.disableBackdropFilter).toBe(true);
    expect(profile.sphereSegments).toBe(28);
    expect(profile.atmosphereGlowEnabled).toBe(false);
    expect(profile.cloudsLayerEnabled).toBe(false);
    expect(profile.textureScale).toBe('low');
  });

  test('user manual override to high tier restores full desktop fidelity', () => {
    setPerformanceTierOverride('high');
    const profile = getPerformanceProfile();

    expect(profile.tier).toBe('high');
    expect(profile.isLowEndDevice).toBe(false);
    expect(profile.maxPixelRatio).toBe(2.0);
    expect(profile.maxFps).toBe(60);
    expect(profile.flatPolygons).toBe(false);
    expect(profile.sphereSegments).toBe(75);
    expect(profile.atmosphereGlowEnabled).toBe(true);
    expect(profile.cloudsLayerEnabled).toBe(true);
    expect(profile.textureScale).toBe('high');
  });

  test('subscribers receive real-time notifications when tier changes', () => {
    let notifiedProfile: PerformanceProfile | null = null;
    const unsubscribe = subscribeToPerformanceProfile((p) => {
      notifiedProfile = p;
    });

    setPerformanceTierOverride('low');
    expect(notifiedProfile).not.toBeNull();
    expect(notifiedProfile!.tier).toBe('low');

    unsubscribe();
  });

  test('consecutive jank frames (>50ms) trigger autonomous downgrade to low tier', () => {
    setPerformanceTierOverride('high');
    expect(getPerformanceProfile().tier).toBe('high');

    // Simulate 3 consecutive slow frames (>50ms)
    recordFrameJank(55);
    recordFrameJank(60);
    recordFrameJank(70);

    const downgraded = getPerformanceProfile();
    expect(downgraded.tier).toBe('low');
    expect(downgraded.isLowEndDevice).toBe(true);
    expect(downgraded.maxPixelRatio).toBe(0.70);
    expect(downgraded.maxFps).toBe(30);
    expect(downgraded.flatPolygons).toBe(true);

    // Reset to auto for subsequent test runs
    setPerformanceTierOverride('auto');
  });
});
