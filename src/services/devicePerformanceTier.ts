// ============================================================
// MooEarth Live — Device Performance Tier & Anti-Hang Engine
// ============================================================
// Dynamically classifies client hardware into Performance Tiers:
// Tier 1 ('high'): Desktop & premium mobile (6GB+ RAM, 8 cores, high-fill GPU)
// Tier 2 ('medium'): Mid-tier mobile (4GB–6GB RAM, balanced GPU)
// Tier 3 ('low'): Low-end Android (<=3GB RAM, <=4 cores, Mali/PowerVR/Adreno entry GPU)
//
// Eliminates ANR (Application Not Responding) hangs, thermal throttling,
// and WebGL context loss on budget smartphones.
// ============================================================

export type PerformanceTier = 'high' | 'medium' | 'low';

export interface PerformanceProfile {
  tier: PerformanceTier;
  isLowEndDevice: boolean;
  isMobile: boolean;
  maxPixelRatio: number;
  maxFps: number;
  flatPolygons: boolean;
  suppressHtmlMarkersInGame: boolean;
  disableBackdropFilter: boolean;
  sphereSegments: number;
  atmosphereGlowEnabled: boolean;
  cloudsLayerEnabled: boolean;
  textureScale: 'low' | 'medium' | 'high';
  hardwareInfo: {
    memoryGb: number | null;
    cores: number | null;
    gpuRenderer: string;
    isDataSaver: boolean;
  };
}

const STORAGE_OVERRIDE_KEY = 'mooearth_perf_tier_override';

// Known budget / fill-rate constrained mobile GPU substrings
const LOW_END_GPU_PATTERNS = [
  /mali-4/i,
  /mali-t/i,
  /mali-g31/i,
  /mali-g51/i,
  /mali-g52\s*(mc1|mp1|r)/i,
  /powervr/i,
  /adreno\s*(304|305|306|308|405|504|505|506|610|612)/i,
  /swiftshader/i,
  /llvmpipe/i,
  /software/i,
];

let cachedProfile: PerformanceProfile | null = null;
let memoryTierOverride: PerformanceTier | null = null;
const listeners = new Set<(profile: PerformanceProfile) => void>();

// Jank detection state
let consecutiveJankFrames = 0;
let isJankDowngraded = false;

/**
 * Inspects WebGL unmasked renderer string without leaking contexts
 */
function detectGpuRenderer(): string {
  if (typeof window === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const gl =
      canvas.getContext('webgl', { powerPreference: 'low-power' }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      // Clean up WebGL context extension if possible
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
      return String(renderer);
    }
  } catch {
    // Ignore context creation restrictions
  }
  return '';
}

/**
 * Pre-flight synchronous hardware detection
 */
export function getPerformanceProfile(): PerformanceProfile {
  if (cachedProfile) return cachedProfile;

  // Check manual user override first
  let userOverride: PerformanceTier | null = memoryTierOverride;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(STORAGE_OVERRIDE_KEY);
      if (saved === 'low' || saved === 'medium' || saved === 'high') {
        userOverride = saved as PerformanceTier;
      }
    } catch {
      // Ignore storage errors
    }
  }

  if (typeof window === 'undefined') {
    const effectiveTier = userOverride || 'high';
    const isLow = effectiveTier === 'low';
    return {
      tier: effectiveTier,
      isLowEndDevice: isLow,
      isMobile: isLow,
      maxPixelRatio: isLow ? 0.70 : 2.0,
      maxFps: isLow ? 30 : 60,
      flatPolygons: isLow,
      suppressHtmlMarkersInGame: isLow,
      disableBackdropFilter: isLow,
      sphereSegments: isLow ? 28 : 75,
      atmosphereGlowEnabled: !isLow,
      cloudsLayerEnabled: !isLow,
      textureScale: isLow ? 'low' : 'high',
      hardwareInfo: {
        memoryGb: isLow ? 2 : 8,
        cores: isLow ? 4 : 8,
        gpuRenderer: isLow ? 'Mali-400 MP2' : 'High-Performance GPU',
        isDataSaver: false,
      },
    };
  }

  const isMobile =
    window.innerWidth < 1024 ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

  const memoryGb =
    typeof (navigator as any).deviceMemory === 'number'
      ? (navigator as any).deviceMemory
      : null;

  const cores =
    typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : null;

  const isDataSaver =
    !!(navigator as any).connection?.saveData;

  const gpuRenderer = detectGpuRenderer();
  const isLowEndGpu = LOW_END_GPU_PATTERNS.some((pattern) =>
    pattern.test(gpuRenderer)
  );

  let tier: PerformanceTier = 'high';

  if (userOverride) {
    tier = userOverride;
  } else if (
    (memoryGb !== null && memoryGb <= 3) ||
    (isMobile && cores !== null && cores <= 4) ||
    isLowEndGpu ||
    isDataSaver ||
    /Android\s*[4-9]\b|Android\s*1[0-1]\b/i.test(navigator.userAgent) // Older Android versions
  ) {
    tier = 'low';
  } else if (isMobile || (memoryGb !== null && memoryGb <= 6)) {
    tier = 'medium';
  }

  const isLowEndDevice = tier === 'low';

  // Apply or remove the global CSS class for hardware-accelerated style overrides
  if (typeof document !== 'undefined') {
    if (isLowEndDevice) {
      document.documentElement.classList.add('low-end-mobile');
    } else {
      document.documentElement.classList.remove('low-end-mobile');
    }
  }

  cachedProfile = {
    tier,
    isLowEndDevice,
    isMobile,
    maxPixelRatio: isLowEndDevice ? 0.70 : isMobile ? 1.0 : 2.0,
    maxFps: isLowEndDevice ? 30 : 60,
    flatPolygons: isLowEndDevice,
    suppressHtmlMarkersInGame: isMobile,
    disableBackdropFilter: isLowEndDevice,
    sphereSegments: isLowEndDevice ? 28 : isMobile ? 36 : 75,
    atmosphereGlowEnabled: !isLowEndDevice,
    cloudsLayerEnabled: !isMobile && !isLowEndDevice,
    textureScale: isLowEndDevice ? 'low' : isMobile ? 'medium' : 'high',
    hardwareInfo: {
      memoryGb,
      cores,
      gpuRenderer,
      isDataSaver,
    },
  };

  return cachedProfile;
}

/**
 * Manually set or clear user performance tier override
 */
export function setPerformanceTierOverride(override: PerformanceTier | 'auto'): void {
  memoryTierOverride = override === 'auto' ? null : override;
  isJankDowngraded = false;
  consecutiveJankFrames = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (override === 'auto') {
        localStorage.removeItem(STORAGE_OVERRIDE_KEY);
      } else {
        localStorage.setItem(STORAGE_OVERRIDE_KEY, override);
      }
    } catch {
      // Ignore storage quota
    }
  }
  cachedProfile = null;
  const newProfile = getPerformanceProfile();
  listeners.forEach((cb) => cb(newProfile));
}

/**
 * Real-time Jank Watchdog: Call on every frame delta.
 * If severe frame drops are detected on mobile, automatically downgrades to Low-End tier.
 */
export function recordFrameJank(deltaMs: number): void {
  const profile = getPerformanceProfile();
  if (isJankDowngraded || profile.tier === 'low') return;

  // Frame took longer than 50ms (less than 20fps)
  if (deltaMs > 50) {
    consecutiveJankFrames++;
    if (consecutiveJankFrames >= 3) {
      isJankDowngraded = true;
      memoryTierOverride = 'low';
      console.warn('[Anti-Hang Engine] Consecutive frame drops detected. Autonomously switching to Low-Power Mobile Tier.');
      cachedProfile = {
        ...profile,
        tier: 'low',
        isLowEndDevice: true,
        maxPixelRatio: 0.70,
        maxFps: 30,
        flatPolygons: true,
        suppressHtmlMarkersInGame: true,
        disableBackdropFilter: true,
        sphereSegments: 28,
        atmosphereGlowEnabled: false,
        cloudsLayerEnabled: false,
        textureScale: 'low',
      };
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('low-end-mobile');
      }
      listeners.forEach((cb) => cb(cachedProfile!));
    }
  } else if (deltaMs < 35) {
    consecutiveJankFrames = Math.max(0, consecutiveJankFrames - 1);
  }
}

/**
 * Subscribe to performance profile updates
 */
export function subscribeToPerformanceProfile(
  cb: (profile: PerformanceProfile) => void
): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
