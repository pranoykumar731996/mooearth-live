// ============================================================
// MooEarth Live — Globe Scene (Dynamic Import Wrapper)
// ============================================================

'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { WorldEvent, EventArc, EventCategory } from '@/types';
import { CATEGORY_MAP, GLOBE_CONFIG, COUNTRY_COORDINATES, getCountryGlowColors } from '@/lib/constants';
import { findCountryMeta } from '@/data/questions/countryMetadata';
import { useGlobeControls } from '@/hooks/useGlobeControls';
import { useCinematicCamera } from '@/hooks/useCinematicCamera';
import { GoalCelebration } from '@/hooks/useGoalCelebration';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/services/analytics';


// Dynamic import — react-globe.gl requires window/WebGL
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => null,
});

interface GlobeSceneProps {
  events: WorldEvent[];
  selectedEvent: WorldEvent | null;
  onSelectEvent: (event: WorldEvent | null) => void;
  selectedCountry?: string | null;
  onSelectCountry?: (country: string | null) => void;
  emotionMap?: Record<string, string>;
  celebration?: GoalCelebration | null;
  celebrations?: any[];
  onSelectCelebration?: (celeb: any) => void;
  globalEnergyScore?: number;
  isCinematicModeActive?: boolean;
  earthCastActive?: boolean;
  earthCastAudioLevel?: number;
  activeCategory?: EventCategory | null;
  isPlayEarthActive?: boolean;
  globeView?: 'standard' | 'fifa' | 'night' | 'weather' | 'satellite' | 'discovery';
  isDashboardOpen?: boolean;
}

// Generate a green/gold soccer pitch texture dynamically at runtime via HTML Canvas
const createFifaTexture = () => {
  if (typeof window === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill background green
    ctx.fillStyle = '#081c10';
    ctx.fillRect(0, 0, 1024, 512);

    // Alternating horizontal stripes for grass pattern (pitch bands)
    const bandHeight = 32;
    for (let y = 0; y < 512; y += bandHeight) {
      ctx.fillStyle = (y / bandHeight) % 2 === 0 ? '#0b2616' : '#081c10';
      ctx.fillRect(0, y, 1024, bandHeight);
    }

    // Faint gold soccer lines (tactical layout)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.lineWidth = 1;

    // Pitch center line
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 512);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(512, 256, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Side grid lines for premium tactical vibe
    for (let x = 0; x <= 1024; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
  }
  return canvas.toDataURL();
};

// Generate a blue blueprint holographic grid texture dynamically at runtime via HTML Canvas
const createBlueprintGridTexture = () => {
  if (typeof window === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill background deep tech blue
    ctx.fillStyle = '#020412';
    ctx.fillRect(0, 0, 1024, 512);

    // Draw holographic grid lines
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.18)';
    ctx.lineWidth = 0.5;

    // Longitudinal lines (vertical)
    for (let x = 0; x <= 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Latitudinal lines (horizontal)
    for (let y = 0; y <= 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Main equator highlight line
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(1024, 256);
    ctx.stroke();
    
    // Prime meridian highlight line
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 512);
    ctx.stroke();
  }
  return canvas.toDataURL();
};


// Helper to convert ISO-2 country code to emoji flag
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode === '-99') return '🏳️';
  
  // Windows does not support flag emojis natively and renders them as ?? or boxes on canvas.
  if (typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('windows')) {
    return '';
  }

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🏳️';
  }
};

const matchCountryNames = (c1?: string | null, c2?: string | null) => {
  if (!c1 || !c2) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const n1 = norm(c1);
  const n2 = norm(c2);
  if (n1 === n2) return true;
  
  // United States matches
  const isUS1 = n1 === 'usa' || n1 === 'us' || n1 === 'unitedstates' || n1 === 'unitedstatesofamerica';
  const isUS2 = n2 === 'usa' || n2 === 'us' || n2 === 'unitedstates' || n2 === 'unitedstatesofamerica';
  if (isUS1 && isUS2) return true;

  // United Kingdom matches
  const isUK1 = n1 === 'uk' || n1 === 'unitedkingdom' || n1 === 'england' || n1 === 'greatbritain';
  const isUK2 = n2 === 'uk' || n2 === 'unitedkingdom' || n2 === 'england' || n2 === 'greatbritain';
  if (isUK1 && isUK2) return true;

  return false;
};

// Helper to estimate a country's latitude for thermal weather maps
const getCountryLatitude = (feat: any) => {
  const name = feat?.properties?.NAME || '';
  const geoCoords = COUNTRY_COORDINATES[name.toLowerCase()];
  if (geoCoords) return geoCoords.lat;
  
  const geom = feat?.geometry;
  if (!geom) return 0;
  if (geom.type === 'Polygon' && geom.coordinates?.[0]?.[0]) {
    return geom.coordinates[0][0][1]; // Latitude of first vertex as estimation
  } else if (geom.type === 'MultiPolygon' && geom.coordinates?.[0]?.[0]?.[0]) {
    return geom.coordinates[0][0][0][1];
  }
  return 0;
};

export default function GlobeScene({
  events,
  selectedEvent,
  onSelectEvent,
  selectedCountry,
  onSelectCountry,
  emotionMap = {},
  celebration,
  celebrations = [],
  onSelectCelebration,
  globalEnergyScore = 30,
  isCinematicModeActive = false,
  earthCastActive = false,
  earthCastAudioLevel = 0,
  activeCategory = null,
  isPlayEarthActive = false,
  globeView = 'standard',
  isDashboardOpen = false,
}: GlobeSceneProps) {
  const { globeRef, initControls, flyTo, pauseRotation, resumeRotation } = useGlobeControls();
  const [failsafeActive, setFailsafeActive] = useState(false);
  const lowFpsSecondsRef = useRef(0);
  const highFpsSecondsRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [introDone, setIntroDone] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [globalMood, setGlobalMood] = useState<Record<string, number>>({});

  // Precompute live match countries map for O(1) rendering lookup
  const liveMatchCountriesMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!countries) return map;
    countries.forEach((feat: any) => {
      const name = feat.properties.NAME;
      const isLive = events.some(e => 
        e.category === 'football' &&
        e.footballData &&
        (e.footballData.status === 'LIVE' || e.footballData.status === 'HT' || e.footballData.status === 'PEN') &&
        (matchCountryNames(e.footballData.homeTeam, name) || matchCountryNames(e.footballData.awayTeam, name))
      );
      if (isLive) {
        map[name] = true;
      }
    });
    return map;
  }, [countries, events]);

  // Precompute category-matching countries map for O(1) rendering lookup
  const categoryMatchingCountriesMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!activeCategory || !countries) return map;
    countries.forEach((feat: any) => {
      const name = feat.properties.NAME;
      const hasMatchingEvent = events.some(e => 
        matchCountryNames(e.country, name) && 
        (e.category === activeCategory || 
         (activeCategory === 'worldcup' && e.category === 'football'))
      );
      if (hasMatchingEvent) {
        map[name] = true;
      }
    });
    return map;
  }, [countries, events, activeCategory]);

  // Precompute penalty shootout status
  const hasPenaltyShootout = useMemo(() => {
    return events.some(e => e.footballData?.status === 'PEN');
  }, [events]);
  const [hoveredPolygon, setHoveredPolygon] = useState<any>(null);
  const [zoomAltitude, setZoomAltitude] = useState(1.5);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const getEmotionColorForCountry = useCallback((name: string) => {
    if (!name) return undefined;
    if (emotionMap[name]) return emotionMap[name];
    const matchKey = Object.keys(emotionMap).find(key => matchCountryNames(key, name));
    return matchKey ? emotionMap[matchKey] : undefined;
  }, [emotionMap]);

  const lastInteractionTime = useRef<number>(0);
  useEffect(() => {
    lastInteractionTime.current = Date.now();
  }, []);
  const atmosphereMeshRef = useRef<any>(null);
  const celebrationProcessedRef = useRef<string | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const cachedAtmosphereMeshRef = useRef<any>(null);

  // References and variables to prevent React state updates from causing WebGL jank
  const currentZoomAltitudeRef = useRef(1.5);
  const lastLoggedAltRef = useRef<number | null>(null);
  const lastLoggedLatRef = useRef<number | null>(null);
  const lastLoggedLngRef = useRef<number | null>(null);
  const htmlMarkersCacheRef = useRef<Map<string, HTMLElement>>(new Map());

  // Failsafe FPS Monitor & Trigger (Rule 11)
  // Tracks FPS and triggers failsafe mode only when status changes (minimizing re-renders)
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let animId: number;

    const measure = () => {
      frames++;
      const time = performance.now();
      if (time >= lastTime + 1000) {
        const currentFps = Math.round((frames * 1000) / (time - lastTime));
        
        if (currentFps < 45) {
          lowFpsSecondsRef.current += 1;
          highFpsSecondsRef.current = 0;
          if (lowFpsSecondsRef.current >= 3 && !failsafeActive) {
            setFailsafeActive(true);
          }
        } else if (currentFps >= 52) {
          highFpsSecondsRef.current += 1;
          lowFpsSecondsRef.current = 0;
          if (highFpsSecondsRef.current >= 5 && failsafeActive) {
            setFailsafeActive(false);
          }
        } else {
          lowFpsSecondsRef.current = 0;
          highFpsSecondsRef.current = 0;
        }

        frames = 0;
        lastTime = time;
      }
      animId = requestAnimationFrame(measure);
    };
    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, [failsafeActive]);

  // Clear html marker cache when event data changes
  useEffect(() => {
    htmlMarkersCacheRef.current.clear();
  }, [events, celebrations]);

  const adjustOpacity = useCallback((rgbaStr: string, multiplier: number) => {
    const match = rgbaStr.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (match) {
      const r = match[1];
      const g = match[2];
      const b = match[3];
      const a = parseFloat(match[4]);
      const newAlpha = Math.min(Math.max(a * multiplier, 0), 1);
      return `rgba(${r}, ${g}, ${b}, ${newAlpha.toFixed(3)})`;
    }
    return rgbaStr;
  }, []);

  // Mobile state detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Progressive Texture URLs & Lazy Loader (Rule 1 & Rule-2)
  const [globeTextureUrl, setGlobeTextureUrl] = useState(GLOBE_CONFIG.globePlaceholderUrl);
  const [cloudsTextureUrl, setCloudsTextureUrl] = useState(GLOBE_CONFIG.cloudsPlaceholderUrl);
  const [isTextureLoading, setIsTextureLoading] = useState(false);

  const [prevGlobeView, setPrevGlobeView] = useState<string | null>(null);
  if (globeView !== prevGlobeView) {
    setPrevGlobeView(globeView);
    if (globeView === 'standard' || globeView === 'night' || globeView === 'weather' || globeView === 'satellite') {
      setIsTextureLoading(true);
    }
  }

  // Lazy Texture Loader Effect
  useEffect(() => {
    let active = true;
    let targetTexture = '';

    if (globeView === 'standard' || globeView === 'night') {
      targetTexture = '/textures/globe-night.jpg';
    } else if (globeView === 'fifa') {
      targetTexture = createFifaTexture();
    } else if (globeView === 'discovery') {
      targetTexture = createBlueprintGridTexture();
    } else if (globeView === 'weather' || globeView === 'satellite') {
      targetTexture = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
    }

    if (!targetTexture) return;

    if (targetTexture.startsWith('data:')) {
      requestAnimationFrame(() => {
        if (active) {
          setGlobeTextureUrl(targetTexture);
        }
      });
      return;
    }

    const img = new Image();
    img.src = targetTexture;
    img.onload = () => {
      if (active) {
        setGlobeTextureUrl(targetTexture);
        setIsTextureLoading(false);
      }
    };
    img.onerror = () => {
      if (active) {
        setGlobeTextureUrl('/textures/globe-night-placeholder.jpg');
        setIsTextureLoading(false);
      }
    };

    return () => {
      active = false;
    };
  }, [globeView]);

  // Preload clouds texture in background
  useEffect(() => {
    const cloudsImg = new Image();
    cloudsImg.src = GLOBE_CONFIG.cloudsImageUrl;
    cloudsImg.onload = () => {
      setCloudsTextureUrl(GLOBE_CONFIG.cloudsImageUrl);
    };
  }, []);

  // Cinematic Camera Hook
  useCinematicCamera(events, { flyTo, pauseRotation, resumeRotation }, introDone);

  // Track interaction
  const recordInteraction = useCallback(() => {
    lastInteractionTime.current = Date.now();
  }, []);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch GeoJSON and Global Mood
  useEffect(() => {
    fetch(GLOBE_CONFIG.countriesGeoJsonUrl)
      .then((res) => res.json())
      .then((data) => {
        // Handle both standard TopoJSON and raw GeoJSON features
        const features = data.features || (data.objects ? data.objects.countries : data);
        setCountries(features);
      })
      .catch((err) => console.error('Failed to load geojson', err));

    fetch(`/api/global-mood?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.globalMood) setGlobalMood(data.globalMood);
      })
      .catch((err) => console.error('Failed to load global mood', err));
  }, []);

  // Intro animation & init
  useEffect(() => {
    const timer = setTimeout(() => {
      initControls();
      if (globeRef.current) {
        // Start far away
        globeRef.current.pointOfView(GLOBE_CONFIG.introPov, 0);
        // Animate in smoothly
        setTimeout(() => {
          globeRef.current?.pointOfView(GLOBE_CONFIG.defaultPov, 4000);
          setTimeout(() => setIntroDone(true), 4000);
        }, 200);

        // Cap pixel ratio on high-DPI screens to prevent WebGL from rendering at massive resolutions
        try {
          const renderer = globeRef.current.renderer();
          if (renderer) {
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2.0));
          }
        } catch (e) {
          console.warn('Could not set pixel ratio', e);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [initControls, globeRef, isMobile]);

  // Listen to OrbitControls zoom/rotation changes and update zoomAltitude state (throttled)
  useEffect(() => {
    if (!globeRef.current || !introDone) return;
    const controls = globeRef.current.controls();
    if (!controls) return;

    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleControlsChange = () => {
      if (globeRef.current) {
        const pov = globeRef.current.pointOfView();
        if (pov && typeof pov.altitude === 'number') {
          // Update ref instantly for immediate query reads (O(1) frame budget)
          currentZoomAltitudeRef.current = pov.altitude;

          // Track zoom changes (> 0.05)
          if (lastLoggedAltRef.current === null) {
            lastLoggedAltRef.current = pov.altitude;
          } else if (Math.abs(pov.altitude - lastLoggedAltRef.current) > 0.05) {
            trackEvent('globe', 'zoom');
            lastLoggedAltRef.current = pov.altitude;
          }

          // Track rotation / orbit changes (lat or lng changes > 1.5)
          if (typeof pov.lat === 'number' && typeof pov.lng === 'number') {
            if (lastLoggedLatRef.current === null || lastLoggedLngRef.current === null) {
              lastLoggedLatRef.current = pov.lat;
              lastLoggedLngRef.current = pov.lng;
            } else {
              const dLat = Math.abs(pov.lat - lastLoggedLatRef.current);
              let dLng = Math.abs(pov.lng - lastLoggedLngRef.current);
              if (dLng > 180) dLng = 360 - dLng;
              if (dLat > 1.5 || dLng > 1.5) {
                trackEvent('globe', 'rotation');
                lastLoggedLatRef.current = pov.lat;
                lastLoggedLngRef.current = pov.lng;
              }
            }
          }

          // Throttle state update to prevent excessive React render passes
          if (!throttleTimeout) {
            throttleTimeout = setTimeout(() => {
              setZoomAltitude(currentZoomAltitudeRef.current);
              throttleTimeout = null;
            }, 200);
          }
        }
      }
    };

    // Initialize once
    handleControlsChange();

    controls.addEventListener('change', handleControlsChange);
    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      controls.removeEventListener('change', handleControlsChange);
    };
  }, [globeRef, introDone]);


  // Cloud layer and advanced lighting (Rule 1: load active, unload inactive)
  useEffect(() => {
    if (!globeRef.current || !introDone) return;
    
    const globe = globeRef.current;
    const scene = globe.scene();
    if (!scene) return;

    // Show clouds ONLY on standard and weather views, and NOT in failsafe mode (Rule 1 & Rule 11)
    const showClouds = (globeView === 'standard' || globeView === 'weather') && !failsafeActive;

    if (!showClouds) {
      const existingClouds = scene.children.find((c: any) => c.name === 'clouds');
      if (existingClouds) {
        scene.remove(existingClouds);
        if (existingClouds.geometry) existingClouds.geometry.dispose();
        if (existingClouds.material) {
          if (Array.isArray(existingClouds.material)) {
            existingClouds.material.forEach((m: any) => m.dispose());
          } else {
            existingClouds.material.dispose();
          }
        }
      }
      cloudsMeshRef.current = null;
      return;
    }
    
    // Load the current clouds texture (starts as placeholder, then gets swapped with high-res)
    new THREE.TextureLoader().load(cloudsTextureUrl, (cloudsTexture) => {
      const existingClouds = scene.children.find((c: any) => c.name === 'clouds') as THREE.Mesh;
      if (existingClouds) {
        if (existingClouds.material && 'map' in existingClouds.material) {
          (existingClouds.material as any).map = cloudsTexture;
          (existingClouds.material as any).needsUpdate = true;
        }
      } else {
        const segments = isMobile ? 36 : 75; // Optimize polygon count on mobile devices
        const cloudsGeometry = new THREE.SphereGeometry(globe.getGlobeRadius() * 1.006, segments, segments);
        const cloudsMaterial = new THREE.MeshPhongMaterial({
          map: cloudsTexture,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        clouds.name = 'clouds';
        scene.add(clouds);
        cloudsMeshRef.current = clouds;
      }
    });

    // Enhance lighting
    const directionalLight = scene.children.find((obj3d: any) => obj3d.type === 'DirectionalLight');
    if (directionalLight) {
      directionalLight.intensity = 3.5;
      directionalLight.position.set(1, 1, 1);
    }
    
    const ambientLight = scene.children.find((obj3d: any) => obj3d.type === 'AmbientLight');
    if (ambientLight) {
      ambientLight.intensity = 0.5;
    }
  }, [globeRef, introDone, cloudsTextureUrl, isMobile, globeView, failsafeActive]);

  // Unified Render Loop: Phase 8 (Breathing/Rotation), Phase 10 (Energy), Phase 1 (Flicker)
  useEffect(() => {
    if (!globeRef.current || !introDone) return;
    
    const globe = globeRef.current;
    const scene = globe.scene();
    if (!scene) return;

    let animFrameId: number;

    const tick = () => {
      const time = performance.now();

      // 1. Cloud rotation speed (Phase 8: faster when energy is high)
      const clouds = cloudsMeshRef.current;
      if (clouds) {
        const baseCloudSpeed = 0.00015;
        const cloudEnergyFactor = (globalEnergyScore / 100) * 0.00045;
        clouds.rotation.y += (baseCloudSpeed + cloudEnergyFactor);
      }

      // 2. Earth Atmosphere Breathing (Phase 8: subtle size & glow modulation)
      let atmosphereMesh = cachedAtmosphereMeshRef.current;
      if (!atmosphereMesh) {
        atmosphereMesh = scene.children.find(
          (c: any) => c.type === 'Mesh' && c.material?.type === 'ShaderMaterial' && c !== scene.children[0]
        );
        if (atmosphereMesh) {
          cachedAtmosphereMeshRef.current = atmosphereMesh;
        }
      }

      if (atmosphereMesh && atmosphereMesh.material) {
        // Slow oscillation of size (breathing scale)
        const breatheScale = 1.0 + Math.sin(time * 0.0007) * 0.012;
        atmosphereMesh.scale.set(breatheScale, breatheScale, breatheScale);

        // Modulate glow coefficient (breathing density) if uniform is present
        if (atmosphereMesh.material.uniforms?.coefficient) {
          atmosphereMesh.material.uniforms.coefficient.value = 0.1 + Math.sin(time * 0.0009) * 0.025;
        }
      }

      // 3. Modulate Auto-Rotate Speed (Phase 8 Rotation & Phase 10 Energy)
      const controls = globe.controls();
      if (controls) {
        const baseSpeed = isCinematicModeActive ? 0.75 : GLOBE_CONFIG.autoRotateSpeed;
        // Global excitement accelerates rotation
        const energyMultiplier = 1.0 + (globalEnergyScore / 80);
        // Subtle breathing factor (15s period)
        const breathingFactor = 1.0 + Math.sin(time * 0.0004) * 0.12;
        controls.autoRotateSpeed = baseSpeed * energyMultiplier * breathingFactor;
      }

      // 4. Penalty Shootout unstable atmosphere flicker (Phase 1 Penalty Shootout)
      const isCelebrationActive = celebration?.active;
      
      if (hasPenaltyShootout && !isCelebrationActive && atmosphereMesh && atmosphereMesh.material && atmosphereMesh.material.uniforms?.glowColor) {
        const isFlash = Math.random() > 0.85;
        atmosphereMesh.material.uniforms.glowColor.value.copy(
          isFlash ? new THREE.Color('#f97316') : new THREE.Color('#151522')
        );
      }

      // 5. EarthCast Audio-Reactive Atmosphere Pulse
      if (earthCastActive && earthCastAudioLevel > 0.05 && atmosphereMesh) {
        const audioPulse = 1.0 + earthCastAudioLevel * 0.03;
        atmosphereMesh.scale.set(
          atmosphereMesh.scale.x * audioPulse,
          atmosphereMesh.scale.y * audioPulse,
          atmosphereMesh.scale.z * audioPulse
        );
        // Brighten glow during narration
        if (atmosphereMesh.material?.uniforms?.coefficient) {
          atmosphereMesh.material.uniforms.coefficient.value += earthCastAudioLevel * 0.015;
        }
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameId);
  }, [globeRef, introDone, globalEnergyScore, isCinematicModeActive, hasPenaltyShootout, celebration, earthCastActive, earthCastAudioLevel]);

  // ============================================================
  // GOAL CELEBRATION — Atmosphere Color Transformation
  // When a goal is scored, the atmosphere temporarily transforms
  // into the scoring country's flag colors with a smooth pulse.
  // ============================================================
  useEffect(() => {
    if (!globeRef.current || !introDone) return;

    const globe = globeRef.current;
    const scene = globe.scene();
    if (!scene) return;

    if (celebration && celebration.active) {
      const celebKey = `${celebration.team}-${celebration.goalTime}`;
      if (celebrationProcessedRef.current === celebKey) return;
      celebrationProcessedRef.current = celebKey;

      // --- Fly camera to scoring country ---
      flyTo({ lat: celebration.lat, lng: celebration.lng, altitude: 0.8 }, 2000);
      pauseRotation();

      // --- Transform atmosphere color ---
      // Find the atmosphere mesh in the scene
      const atmosphereMesh = scene.children.find(
        (c: any) => c.type === 'Mesh' && c.material?.type === 'ShaderMaterial' && c !== scene.children[0]
      );

      if (atmosphereMesh && atmosphereMesh.material) {
        atmosphereMeshRef.current = {
          mesh: atmosphereMesh,
          originalColor: atmosphereMesh.material.uniforms?.glowColor?.value?.clone(),
        };

        const celebColor = new THREE.Color(celebration.colors.primary);
        
        // Animate color transition
        if (atmosphereMesh.material.uniforms?.glowColor) {
          atmosphereMesh.material.uniforms.glowColor.value.copy(celebColor);
        }
      }

      // --- Boost lighting temporarily ---
      const dirLight = scene.children.find((c: any) => c.type === 'DirectionalLight');
      const ambLight = scene.children.find((c: any) => c.type === 'AmbientLight');
      
      if (dirLight) {
        dirLight.intensity = 6;
      }
      if (ambLight) {
        ambLight.intensity = 1.2;
      }

      // --- Create celebration glow sphere ---
      const existingGlow = scene.children.find((c: any) => c.name === 'celebrationGlow');
      if (!existingGlow) {
        const glowGeometry = new THREE.SphereGeometry(globe.getGlobeRadius() * 1.02, 64, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(celebration.colors.primary),
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.FrontSide,
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.name = 'celebrationGlow';
        scene.add(glowMesh);

        // Animate the glow: fade in, pulse, fade out
        const startTime = performance.now();
        const animateGlow = () => {
          const elapsed = (performance.now() - startTime) / 1000;
          if (elapsed > 8) {
            scene.remove(glowMesh);
            glowGeometry.dispose();
            glowMaterial.dispose();
            return;
          }
          // Pulse envelope
          const fadeIn = Math.min(elapsed / 0.5, 1);
          const fadeOut = elapsed > 6 ? Math.max(0, 1 - (elapsed - 6) / 2) : 1;
          const pulse = 1 + Math.sin(elapsed * 4) * 0.3;
          glowMaterial.opacity = fadeIn * fadeOut * pulse * 0.15;
          requestAnimationFrame(animateGlow);
        };
        animateGlow();
      }

      // --- Restore after celebration ends ---
      setTimeout(() => {
        if (dirLight) dirLight.intensity = 3.5;
        if (ambLight) ambLight.intensity = 0.5;

        // Restore atmosphere color
        if (atmosphereMeshRef.current?.mesh?.material?.uniforms?.glowColor && atmosphereMeshRef.current.originalColor) {
          atmosphereMeshRef.current.mesh.material.uniforms.glowColor.value.copy(
            atmosphereMeshRef.current.originalColor
          );
        }

        // Resume rotation
        resumeRotation();
      }, 10000);

    }
  }, [celebration, globeRef, introDone, flyTo, pauseRotation, resumeRotation]);

  // Fly to selected event or country
  useEffect(() => {
    if (introDone) {
      if (selectedEvent) {
        flyTo({ lat: selectedEvent.lat, lng: selectedEvent.lng, altitude: 1.2 });
        recordInteraction();
      } else if (selectedCountry) {
        // Find coordinates for the country
        const normCountry = selectedCountry.toLowerCase().trim();
        const geoKeys = Object.keys(COUNTRY_COORDINATES);
        const matchedKey = geoKeys.find(k => normCountry.includes(k) || k.includes(normCountry));

        if (matchedKey) {
          const coords = COUNTRY_COORDINATES[matchedKey];
          flyTo({ lat: coords.lat, lng: coords.lng, altitude: 1.8 });
        } else {
          // Fallback: Find country center from GeoJSON features
          const countryFeature = countries?.find((f: any) => matchCountryNames(f.properties?.NAME, selectedCountry));
          if (countryFeature && countryFeature.geometry) {
            let lat = 0;
            let lng = 0;
            const geom = countryFeature.geometry;
            if (geom.type === 'Polygon' && geom.coordinates?.[0]) {
              const ring = geom.coordinates[0];
              ring.forEach((pt: number[]) => {
                lng += pt[0];
                lat += pt[1];
              });
              lat /= ring.length;
              lng /= ring.length;
              flyTo({ lat, lng, altitude: 1.8 });
            } else if (geom.type === 'MultiPolygon' && geom.coordinates?.[0]?.[0]) {
              const ring = geom.coordinates[0][0];
              ring.forEach((pt: number[]) => {
                lng += pt[0];
                lat += pt[1];
              });
              lat /= ring.length;
              lng /= ring.length;
              flyTo({ lat, lng, altitude: 1.8 });
            }
          }
        }
        recordInteraction();
      }
    }
  }, [selectedEvent, selectedCountry, introDone, flyTo, recordInteraction, countries]);

  // Pause/resume rotation based on selected event state reactively
  useEffect(() => {
    if (selectedEvent) {
      pauseRotation();
    } else {
      resumeRotation();
    }
  }, [selectedEvent, pauseRotation, resumeRotation]);

  // Auto focus loop — only when idle
  useEffect(() => {
    if (!introDone) return;
    const interval = setInterval(() => {
      if (Date.now() - lastInteractionTime.current < 30000) return;
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      if (randomEvent) onSelectEvent(randomEvent);
    }, 15000);
    return () => clearInterval(interval);
  }, [events, onSelectEvent, introDone]);

  // Major countries always visible at all zoom levels (Feature 7)
  const MAJOR_COUNTRIES = useMemo(() => [
    'United States', 'USA', 'US', 'Brazil', 'India', 'China', 'Japan', 'United Kingdom', 'UK', 'England', 'France', 'Germany'
  ], []);

  // Precompute / memoize labelsData from countries GeoJSON (Feature 1)
  const labelsData = useMemo(() => {
    if (!countries || countries.length === 0) return [];
    return countries.map((feat: any) => {
      const name = feat.properties.NAME;
      const isoCode = feat.properties.ISO_A2;
      const labelRank = feat.properties.LABELRANK ?? 5;
      const popEst = feat.properties.POP_EST ?? 0;
      
      const normCountry = name.toLowerCase().trim();
      const geoKeys = Object.keys(COUNTRY_COORDINATES);
      const matchedKey = geoKeys.find(k => matchCountryNames(k, name));
      
      let lat = 0;
      let lng = 0;
      
      if (matchedKey) {
        const coords = COUNTRY_COORDINATES[matchedKey];
        lat = coords.lat;
        lng = coords.lng;
      } else {
        const geom = feat.geometry;
        let count = 0;
        if (geom.type === 'Polygon') {
          const ring = geom.coordinates[0] || [];
          ring.forEach((pt: number[]) => {
            lng += pt[0];
            lat += pt[1];
            count++;
          });
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach((poly: any) => {
            const ring = poly[0] || [];
            ring.forEach((pt: number[]) => {
              lng += pt[0];
              lat += pt[1];
              count++;
            });
          });
        }
        if (count > 0) {
          lat /= count;
          lng /= count;
        }
      }
      
      const flag = getFlagEmoji(isoCode);
      
      const isWorldCupTeam = [
        'USA', 'United States', 'Mexico', 'Canada', 'Brazil', 'Argentina', 'France', 'Germany', 'Spain', 
        'England', 'United Kingdom', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Uruguay', 
        'Colombia', 'Morocco', 'Senegal', 'Japan', 'South Korea', 'Australia', 'China', 'India'
      ].some(c => matchCountryNames(c, name));

      return {
        id: name,
        lat,
        lng,
        name,
        flag,
        labelRank,
        popEst,
        isWorldCupTeam,
        feature: feat
      };
    }).filter(label => label.lat !== 0 || label.lng !== 0);
  }, [countries]);

  // Filter labels based on camera altitude, priority scoring, and overlap collision detection
  const filteredLabels = useMemo(() => {
    if (!labelsData || labelsData.length === 0) return [];

    const alt = zoomAltitude;
    
    // 1. Calculate dynamic collision threshold based on zoom altitude and mobile screen size
    const baseThreshold = isMobile ? 24 : 13;
    const minDist = baseThreshold * Math.pow(alt, 1.25);

    // 2. Map labels to include priority scores and Europe categorization
    const scoredLabels = labelsData.map(label => {
      const isMajor = MAJOR_COUNTRIES.some(name => matchCountryNames(name, label.name));
      const hasLiveMatch = !!liveMatchCountriesMap[label.name];
      const hasCategoryMatch = !!categoryMatchingCountriesMap[label.name];
      
      // Greedy priority formula: Major countries and countries with active events always win collisions
      const priority = 
        (isMajor ? 1000 : 0) + 
        (hasLiveMatch ? 800 : 0) + 
        (hasCategoryMatch ? 400 : 0) + 
        (10 - label.labelRank) * 40 + 
        (label.popEst / 12000000);

      const isEurope = label.feature?.properties?.CONTINENT === 'Europe' || 
                       label.feature?.properties?.continent === 'Europe';

      return { ...label, priority, isEurope, isMajor };
    });

    // Sort descending by priority so higher priority labels are processed first
    scoredLabels.sort((a, b) => b.priority - a.priority);

    const selected: typeof scoredLabels = [];

    // Force include selected country and hovered country labels so they never collide-out
    if (selectedCountry) {
      const selLabel = scoredLabels.find(l => matchCountryNames(l.name, selectedCountry));
      if (selLabel) selected.push(selLabel);
    }
    if (hoveredPolygon) {
      const hoverName = hoveredPolygon.properties.NAME;
      if (hoverName && !selected.some(s => matchCountryNames(s.name, hoverName))) {
        const hoverLabel = scoredLabels.find(l => matchCountryNames(l.name, hoverName));
        if (hoverLabel) selected.push(hoverLabel);
      }
    }

    const EUROPE_MAJORS = ['Germany', 'France', 'United Kingdom', 'Italy', 'Spain'];

    // Greedily add labels that don't collide
    for (const label of scoredLabels) {
      // Skip if already added (like selected or hovered)
      if (selected.some(s => s.name === label.name)) continue;

      // Special Europe Handling (Feature 4):
      // If zoomed out (alt > 1.2) in Europe, show only the major European countries
      if (label.isEurope && alt > 1.2) {
        const isEuroMajor = EUROPE_MAJORS.some(m => matchCountryNames(m, label.name));
        if (!isEuroMajor && !liveMatchCountriesMap[label.name]) {
          continue; // Hide minor European countries at far/medium zoom
        }
      }

      // Check distance to all already selected labels
      let collides = false;
      for (const sel of selected) {
        // Simple distance check in lat/lng space (wrapping longitude)
        const dLat = label.lat - sel.lat;
        let dLng = Math.abs(label.lng - sel.lng);
        if (dLng > 180) dLng = 360 - dLng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);

        if (dist < minDist) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        selected.push(label);
      }
    }

    // Limit visible labels based on zoom tiers and failsafe (Rule 3 & Rule 11)
    let maxLabels = 60; // Close Zoom default
    if (failsafeActive) {
      maxLabels = 8;
    } else if (isMobile) {
      maxLabels = 12;
    } else if (alt > 2.0) {
      maxLabels = 12; // Far Zoom (10-15 target)
    } else if (alt >= 1.0) {
      maxLabels = 30; // Medium Zoom (25-40 target)
    }

    return selected.slice(0, maxLabels);
  }, [labelsData, zoomAltitude, selectedCountry, hoveredPolygon, MAJOR_COUNTRIES, isMobile, liveMatchCountriesMap, categoryMatchingCountriesMap, failsafeActive]);

  const getLabelSize = useCallback((d: any) => {
    const isSelected = selectedCountry === d.name;
    const isMajor = MAJOR_COUNTRIES.some(name => matchCountryNames(name, d.name));
    
    // Major countries should be larger and more prominent
    const baseSize = isSelected ? 2.2 : (isMajor ? 1.6 : 1.2);
    const alt = currentZoomAltitudeRef.current;
    
    // Dynamic Label Scaling (Feature 3):
    // Zoom out (high alt) -> smaller labels. Zoom in (low alt) -> larger labels.
    let scale = 1.0;
    if (alt > 2.5) {
      scale = 0.8;
    } else if (alt < 1.0) {
      scale = 1.25;
    }
    
    return baseSize * scale;
  }, [selectedCountry, MAJOR_COUNTRIES]);

  const getLabelAltitude = useCallback((d: any) => {
    // Dynamically calculate the country's polygon altitude first
    const feat = d.feature;
    let polyAlt = 0.01;
    if (feat) {
      const name = feat.properties.NAME;
      const isSelected = selectedCountry === name;
      const isLiveMatchCountry = !!liveMatchCountriesMap[name];

      if (celebration?.active && matchCountryNames(celebration.country, name)) {
        polyAlt = 0.15;
      } else if (isLiveMatchCountry) {
        polyAlt = 0.14;
      } else if (isSelected) {
        polyAlt = 0.12;
      } else {
        const emotionColor = getEmotionColorForCountry(name);
        if (emotionColor) {
          let baseAlt = 0.03;
          if (emotionColor.includes('255, 215, 0')) baseAlt = 0.08;
          else if (emotionColor.includes('239, 68, 68')) baseAlt = 0.06;
          else if (emotionColor.includes('128, 0, 128')) baseAlt = 0.04;
          else if (emotionColor.includes('249, 115, 22')) baseAlt = 0.05;
          else if (emotionColor.includes('16, 185, 129')) baseAlt = 0.06;
          polyAlt = baseAlt;
        } else {
          const intensity = globalMood[name] || 0;
          polyAlt = (0.01 + (intensity * 0.03));
        }
      }
    }
    
    return polyAlt + 0.04;
  }, [selectedCountry, celebration, globalMood, getEmotionColorForCountry, liveMatchCountriesMap]);

  // Find feature for the selected country (Feature 1 & Feature 8)
  const selectedCountryFeature = useMemo(() => {
    if (!selectedCountry || !countries) return null;
    return countries.find((f: any) => matchCountryNames(f.properties?.NAME, selectedCountry));
  }, [selectedCountry, countries]);

  // Context-aware stats compiler for selected country (Feature 1 & Feature 8)
  const countryStats = useMemo(() => {
    if (!selectedCountryFeature) return null;
    const name = selectedCountryFeature.properties.NAME;
    
    const countryEvents = events.filter(e => matchCountryNames(e.country, name));
    
    const newsEvents = countryEvents.filter(e => e.category === 'breaking');
    const sportsEvents = countryEvents.filter(e => e.category === 'sports' || e.category === 'football' || e.category === 'worldcup');
    const techEvents = countryEvents.filter(e => e.category === 'technology');
    
    const meta = findCountryMeta(name);
    
    const totalNews = newsEvents.length * 3 + Math.max(5, (name.length * 7) % 30 + 5);
    const breakingCount = newsEvents.length > 0 ? newsEvents.length : Math.max(1, (name.length % 5) + 1);
    const sportsCount = sportsEvents.length * 2 + Math.max(2, (name.length * 3) % 15 + 2);
    const techCount = techEvents.length + Math.max(1, (name.length * 4) % 10 + 1);
    
    const tempSeed = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % 15;
    let baseTemp = 20;
    let weatherCond = 'Partly Cloudy';
    let alert = '';
    const continent = meta?.continent || '';
    if (continent.includes('Africa') || name === 'India' || name === 'Qatar') {
      baseTemp = 30;
      weatherCond = tempSeed > 10 ? 'Sunny' : tempSeed > 5 ? 'Cloudy' : 'Thunderstorms';
      if (weatherCond === 'Thunderstorms') alert = 'Monsoon Alert';
    } else if (continent.includes('Europe') || name === 'Canada') {
      baseTemp = 14;
      weatherCond = tempSeed > 10 ? 'Rainy' : tempSeed > 5 ? 'Overcast' : 'Sunny';
      if (weatherCond === 'Rainy' && tempSeed < 3) alert = 'Gale Warning';
    } else if (name === 'Brazil' || name === 'Colombia') {
      baseTemp = 26;
      weatherCond = tempSeed > 8 ? 'Humid' : tempSeed > 3 ? 'Showers' : 'Partly Cloudy';
      if (weatherCond === 'Showers') alert = 'Tropical Storm Watch';
    }
    const currentTemp = baseTemp + (new Date().getHours() % 6) - 3 + (tempSeed % 5);
    
    const groupLetter = String.fromCharCode(65 + (name.charCodeAt(0) % 8));
    const standingNum = (name.length % 4) + 1;
    
    const isWorldCupTeam = [
      'USA', 'United States', 'Mexico', 'Canada', 'Brazil', 'Argentina', 'France', 'Germany', 'Spain', 
      'England', 'United Kingdom', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Uruguay', 
      'Colombia', 'Morocco', 'Senegal', 'Japan', 'South Korea', 'Australia', 'China', 'India'
    ].some(c => matchCountryNames(c, name));
    
    return {
      name,
      capital: meta?.capital || 'N/A',
      population: meta?.population || (selectedCountryFeature.properties.POP_EST ? `${(selectedCountryFeature.properties.POP_EST / 1000000).toFixed(1)}M` : 'N/A'),
      flag: meta?.flag || getFlagEmoji(selectedCountryFeature.properties.ISO_A2),
      newsCount: totalNews,
      breakingCount,
      sportsCount,
      techCount,
      temperature: `${currentTemp}°C`,
      weatherCondition: weatherCond,
      weatherAlert: alert,
      isWorldCupTeam,
      groupStanding: `Group ${groupLetter} • #${standingNum}`,
      lastUpdatedMin: Math.max(1, (name.length * 3) % 15),
    };
  }, [selectedCountryFeature, events]);


  // Combine normal events and celebration uploads
  const combinedHtmlData = useMemo(() => {
    const data: any[] = [...events.map(e => ({ ...e, isEvent: true }))];
    if (celebrations) {
      celebrations.forEach(c => {
        data.push({
          ...c,
          isCelebration: true,
          category: 'sports', // Map category for default fallback styling
        });
      });
    }
    return data;
  }, [events, celebrations]);

  // Connection arcs — pair adjacent events
  const arcsData = useMemo<EventArc[]>(() => {
    const arcs: EventArc[] = [];
    const maxArcs = isMobile ? 4 : events.length; // Limit arcs on mobile to save performance
    for (let i = 0; i < events.length && arcs.length < maxArcs; i += 2) {
      if (i + 1 < events.length) {
        arcs.push({
          startLat: events[i].lat,
          startLng: events[i].lng,
          endLat: events[i + 1].lat,
          endLng: events[i + 1].lng,
          color: CATEGORY_MAP[events[i].category].color,
        });
      }
    }
    return arcs;
  }, [events, isMobile]);

  // Ring data (Goal Shockwaves + Default Pulse + Celebration Mega-Rings + Weather Radar Rings)
  const ringsData = useMemo(() => {
    // Failsafe Mode (Rule 11) - disable expensive ring overlays
    if (failsafeActive) {
      return [];
    }

    const rings: any[] = [];
    
    // In weather view, render custom cyan/green storm radar rings at weather event coordinates
    if (globeView === 'weather') {
      const weatherEvents = events.filter(e => e.category === 'weather');
      const activeWeatherEvents = isMobile ? weatherEvents.slice(-2) : weatherEvents;
      activeWeatherEvents.forEach(e => {
        rings.push({
          lat: e.lat,
          lng: e.lng,
          maxR: 9,
          propagationSpeed: 1.4,
          repeatPeriod: 1800,
          color: 'rgba(0, 229, 255, 0.55)', // Cyan radar ring
          event: e,
        });
        rings.push({
          lat: e.lat,
          lng: e.lng,
          maxR: 5,
          propagationSpeed: 0.9,
          repeatPeriod: 1800,
          color: 'rgba(16, 185, 129, 0.35)', // Inner green radar ring
          event: e,
        });
      });
      return rings;
    }

    // Only render rings for the 3 most recent events on mobile to avoid CPU/GPU overhead
    const activeEvents = isMobile ? events.slice(-3) : events;
    
    activeEvents.forEach(e => {
      // Default ambient pulse
      rings.push({
        lat: e.lat,
        lng: e.lng,
        maxR: GLOBE_CONFIG.ringMaxRadius,
        propagationSpeed: GLOBE_CONFIG.ringPropagationSpeed,
        repeatPeriod: GLOBE_CONFIG.ringRepeatPeriod,
        color: CATEGORY_MAP[e.category].glowColor,
        event: e,
      });

      // Goal Shockwave
      if (e.footballData && e.footballData.goals && e.footballData.goals.length > 0) {
        rings.push({
          lat: e.lat,
          lng: e.lng,
          maxR: 12,
          propagationSpeed: 2,
          repeatPeriod: 4000,
          color: 'rgba(255, 215, 0, 0.8)',
          event: e,
         });
      }
    });

    // CELEBRATION MEGA-RINGS — massive expanding shockwave from the scoring country (Phase 2)
    if (celebration?.active) {
      // Ring 1: Outer mega shockwave
      rings.push({
        lat: celebration.lat,
        lng: celebration.lng,
        maxR: 28,             // Phase 2: Spread across the Earth
        propagationSpeed: 4.5, // Very high speed
        repeatPeriod: 2200,
        color: celebration.colors.glow,
      });
      // Ring 2: Mid shockwave
      rings.push({
        lat: celebration.lat,
        lng: celebration.lng,
        maxR: 18,
        propagationSpeed: 3.0,
        repeatPeriod: 2800,
        color: `${celebration.colors.primary}aa`,
      });
      // Ring 3: Inner pulse
      rings.push({
        lat: celebration.lat,
        lng: celebration.lng,
        maxR: 10,
        propagationSpeed: 1.8,
        repeatPeriod: 3500,
        color: `${celebration.colors.secondary || '#ffffff'}80`,
      });
    }

    return rings;
  }, [events, celebration, isMobile, globeView, failsafeActive]);

  // HTML marker elements
  const htmlMarkerRenderer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => {
      const isCelebration = d.isCelebration;
      const markerId = d.id || `${d.lat}-${d.lng}-${isCelebration ? 'celeb' : 'event'}`;
      
      // Return cached element if available to prevent DOM reflow/allocation jank
      if (htmlMarkersCacheRef.current.has(markerId)) {
        return htmlMarkersCacheRef.current.get(markerId)!;
      }

      if (isCelebration) {
        const typeEmoji = d.type === 'video' ? '🎥' : d.type === 'image' ? '📸' : '🎤';
        const color = d.type === 'video' ? '#00e5ff' : d.type === 'image' ? '#e040fb' : '#00e676';
        const shadowColor = d.type === 'video' ? 'rgba(0, 229, 255, 0.4)' : d.type === 'image' ? 'rgba(224, 64, 251, 0.4)' : 'rgba(0, 230, 118, 0.4)';

        const el = document.createElement('div');
        el.className = 'globe-celebration-marker';
        el.style.pointerEvents = 'auto';
        el.style.cssText = `
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        `;

        el.innerHTML = `
          <div style="
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: rgba(8,8,15,0.92);
            border: 2px solid ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px ${shadowColor};
            font-size: 13px;
            position: relative;
            z-index: 2;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: auto;
          ">
            ${typeEmoji}
          </div>
          <div style="
            position: absolute;
            top: 50%; left: 50%;
            width: 100%; height: 100%;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            border: 1px solid ${color};
            opacity: 0.8;
            animation: marker-ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
            z-index: 1;
            pointer-events: none;
          "></div>
          <div style="
            position: absolute;
            top: 50%; left: 50%;
            width: 100%; height: 100%;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            border: 1px solid ${color};
            opacity: 0.4;
            animation: marker-ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
            animation-delay: 0.8s;
            z-index: 1;
            pointer-events: none;
          "></div>
        `;

        el.addEventListener('mouseenter', () => {
          const inner = el.firstElementChild as HTMLElement;
          if (inner) inner.style.transform = 'scale(1.3)';
        });
        el.addEventListener('mouseleave', () => {
          const inner = el.firstElementChild as HTMLElement;
          if (inner) inner.style.transform = 'scale(1)';
        });
        const stopProp = (e: Event) => e.stopPropagation();
        el.addEventListener('pointerdown', stopProp);
        el.addEventListener('pointerup', stopProp);
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('mouseup', stopProp);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          pauseRotation();
          recordInteraction();
          flyTo({ lat: d.lat, lng: d.lng, altitude: 0.95 }, 1500);
          if (onSelectCelebration) onSelectCelebration(d);
        });

        htmlMarkersCacheRef.current.set(markerId, el);
        return el;
      }

      const event = d as WorldEvent & { color?: string };
      const config = CATEGORY_MAP[event.category];

      const el = document.createElement('div');
      el.className = 'globe-marker';
      el.style.pointerEvents = 'auto';
      el.style.cssText = `
        position: relative;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        animation: marker-fade-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      `;

      // Inner glowing core with emoji
      el.innerHTML = `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(10,10,15,0.85);
          border: 1.5px solid ${config.color};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px ${config.glowColor};
          font-size: 13px;
          position: relative;
          z-index: 2;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: auto;
        ">
          ${config.emoji}
        </div>
        <div style="
          position: absolute;
          top: 50%; left: 50%;
          width: 100%; height: 100%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: ${config.color};
          opacity: 0.7;
          animation: marker-ripple 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite;
          z-index: 1;
          pointer-events: none;
        "></div>
      `;

      el.addEventListener('mouseenter', () => {
        const inner = el.firstElementChild as HTMLElement;
        if (inner) inner.style.transform = 'scale(1.3)';
      });
      el.addEventListener('mouseleave', () => {
        const inner = el.firstElementChild as HTMLElement;
        if (inner) inner.style.transform = 'scale(1)';
      });
      const stopProp = (e: Event) => e.stopPropagation();
      el.addEventListener('pointerdown', stopProp);
      el.addEventListener('pointerup', stopProp);
      el.addEventListener('mousedown', stopProp);
      el.addEventListener('mouseup', stopProp);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        pauseRotation();
        recordInteraction();
        onSelectEvent(event);
      });

      htmlMarkersCacheRef.current.set(markerId, el);
      return el;
    },
    [onSelectEvent, pauseRotation, recordInteraction, onSelectCelebration, flyTo]
  );



  // Polygon Colors (Global Mood Map + Celebration Override + Category Glows)
  const getPolygonColor = useCallback((feat: any) => {
    const name = feat.properties.NAME;
    const isSelected = selectedCountry === name;
    
    // Check if it's a live match country (O(1) lookup)
    const isLiveMatchCountry = !!liveMatchCountriesMap[name];

    // 1. During goal celebration, make the scoring country GLOW brightly
    if (celebration?.active && matchCountryNames(celebration.country, name)) {
      return `${celebration.colors.primary}cc`; // Very bright
    }
    
    // 2. Play Earth gaming emerald glow
    if (isPlayEarthActive && isSelected) {
      return `rgba(16, 185, 129, 0.7)`;
    }

    // View-specific styling overrides (Phase 2 Views)
    if (globeView === 'fifa') {
      if (isLiveMatchCountry) {
        return 'rgba(255, 215, 0, 0.85)'; // Vibrant gold cap
      }
      if (isSelected) {
        return 'rgba(16, 185, 129, 0.85)'; // Bright green cap
      }
      // Pitch tactical look: transparent caps to see grass lines
      return 'rgba(24, 90, 48, 0.12)';
    }

    if (globeView === 'night') {
      if (isSelected) return 'rgba(0, 229, 255, 0.2)';
      return 'rgba(0, 0, 0, 0)'; // Fully transparent caps so city night lights shine through!
    }

    if (globeView === 'satellite') {
      if (isSelected) return 'rgba(255, 255, 255, 0.15)';
      return 'rgba(0, 0, 0, 0.01)'; // Fully transparent flat cap
    }

    if (globeView === 'weather') {
      // Thermal warning heatmap based on latitude
      const lat = Math.abs(getCountryLatitude(feat));
      if (isSelected) return 'rgba(255, 255, 255, 0.3)';
      if (lat < 15) return 'rgba(239, 68, 68, 0.42)'; // Hot (Red)
      if (lat < 30) return 'rgba(249, 115, 22, 0.35)'; // Warm (Orange)
      if (lat < 50) return 'rgba(234, 179, 8, 0.25)';  // Temperate (Yellow)
      if (lat < 65) return 'rgba(59, 130, 246, 0.3)';  // Cool (Blue)
      return 'rgba(168, 85, 247, 0.38)';                // Freezing (Purple)
    }

    if (globeView === 'discovery') {
      if (isSelected) {
        return 'rgba(0, 229, 255, 0.45)'; // Electric cyan
      }
      // Blueprint blue caps
      return 'rgba(0, 100, 255, 0.12)';
    }

    // 3. Live match gold glow (Feature 3)
    if (isLiveMatchCountry) {
      return `rgba(255, 215, 0, 0.7)`;
    }

    // 4. Selected country gets its brand-specific glow (Feature 5)
    if (isSelected) {
      const glow = getCountryGlowColors(name);
      return adjustOpacity(glow.primary, 0.75);
    }

    // 5. Category-Aware Globe Glow (Feature 2) (O(1) lookup)
    if (activeCategory) {
      const hasMatchingEvent = !!categoryMatchingCountriesMap[name];
      
      if (hasMatchingEvent) {
        switch (activeCategory) {
          case 'breaking':
            return `rgba(59, 130, 246, 0.45)`; // Blue
          case 'sports':
          case 'football':
            return `rgba(16, 185, 129, 0.45)`; // Green
          case 'worldcup':
            return `rgba(0, 229, 255, 0.45)`; // Cyan/Gold
          case 'weather':
            return `rgba(249, 115, 22, 0.45)`; // Orange
          case 'business':
            return `rgba(250, 204, 21, 0.45)`; // Gold
          case 'technology':
            return `rgba(168, 85, 247, 0.45)`; // Purple
          default:
            break;
        }
      }
    }

    // 6. Default emotion mapping
    const emotionColor = getEmotionColorForCountry(name);
    if (emotionColor) {
      return emotionColor;
    }
    
    // 7. Base mood intensity
    const intensity = globalMood[name] || 0;
    let baseColor = 'rgba(255, 255, 255, 0.015)';
    if (intensity > 0.7) baseColor = `rgba(255, 100, 0, ${0.2 + intensity * 0.3})`;
    else if (intensity > 0.4) baseColor = `rgba(16, 185, 129, ${0.15 + intensity * 0.3})`;
    else if (intensity > 0) baseColor = `rgba(59, 130, 246, ${0.1 + intensity * 0.2})`;
    
    return baseColor;
  }, [globalMood, selectedCountry, getEmotionColorForCountry, celebration, liveMatchCountriesMap, adjustOpacity, categoryMatchingCountriesMap, isPlayEarthActive, activeCategory, globeView]);

  // Polygon Altitude (3D Emotional Heatmap + Celebration + Live Match)
  const getPolygonAltitude = useCallback((feat: any) => {
    // Failsafe Mode (Rule 11) - force flat 3D mesh altitude
    if (failsafeActive) {
      return 0.002;
    }

    const name = feat.properties.NAME;
    const isSelected = selectedCountry === name;
    
    // Check if it's a live match country (O(1) lookup)
    const isLiveMatchCountry = !!liveMatchCountriesMap[name];

    // During celebration, the scoring country RISES dramatically
    if (celebration?.active && matchCountryNames(celebration.country, name)) {
      return 0.15; // Highest possible extrusion
    }

    // Flat views (Satellite and Night Lights)
    if (globeView === 'satellite' || globeView === 'night') {
      return 0.001; // Render flat mapping
    }
    
    if (isLiveMatchCountry) {
      return 0.14;
    }
    
    if (isSelected) {
      return 0.12;
    }

    const emotionColor = getEmotionColorForCountry(name);
    if (emotionColor) {
      let baseAlt = 0.03;
      if (emotionColor.includes('255, 215, 0')) baseAlt = 0.08; // Gold
      else if (emotionColor.includes('239, 68, 68')) baseAlt = 0.06; // Red
      else if (emotionColor.includes('128, 0, 128')) baseAlt = 0.04; // Purple
      else if (emotionColor.includes('249, 115, 22')) baseAlt = 0.05; // Orange
      else if (emotionColor.includes('16, 185, 129')) baseAlt = 0.06; // Green
      return baseAlt;
    }
    
    const intensity = globalMood[name] || 0;
    return (0.01 + (intensity * 0.03));
  }, [globalMood, selectedCountry, getEmotionColorForCountry, celebration, liveMatchCountriesMap, globeView, failsafeActive]);

  // Polygon Side Glow (Matching Cap Color)
  const getPolygonSideColor = useCallback((feat: any) => {
    // Failsafe Mode (Rule 11) - disable expensive side-wall color calculations
    if (failsafeActive) {
      return 'rgba(0,0,0,0)';
    }

    const name = feat.properties.NAME;
    const isSelected = selectedCountry === name;
    const isLiveMatchCountry = !!liveMatchCountriesMap[name];
    const isPulsing = isSelected || isLiveMatchCountry;
    const sideOpacity = isPulsing ? 0.65 : 0.45;
    
    // During celebration, sides glow with the country's color
    if (celebration?.active && matchCountryNames(celebration.country, name)) {
      return `${celebration.colors.primary}99`;
    }

    if (globeView === 'fifa') {
      return isLiveMatchCountry ? 'rgba(255, 215, 0, 0.7)' : 'rgba(218, 165, 32, 0.4)';
    }

    if (globeView === 'discovery') {
      return isSelected ? 'rgba(0, 229, 255, 0.7)' : 'rgba(0, 150, 255, 0.3)';
    }

    if (globeView === 'satellite' || globeView === 'night') {
      return 'rgba(0,0,0,0)'; // No sides for flat maps
    }
    
    const capColor = getPolygonColor(feat);
    if (capColor.startsWith('rgba')) {
      return capColor.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/, `rgba($1, $2, $3, ${sideOpacity.toFixed(3)})`);
    }
    return capColor;
  }, [getPolygonColor, celebration, selectedCountry, liveMatchCountriesMap, globeView, failsafeActive]);

  // High contrast borders & dynamic hover border highlight
  const getPolygonStrokeColor = useCallback((feat: any) => {
    const name = feat.properties.NAME;
    const isSelected = selectedCountry === name;

    // Failsafe Mode (Rule 11) - thin simple borders
    if (failsafeActive) {
      return 'rgba(255, 255, 255, 0.1)';
    }
    
    if (isSelected) {
      const glow = getCountryGlowColors(name);
      return adjustOpacity(glow.stroke, 0.85);
    }
    
    if (hoveredPolygon && hoveredPolygon.properties.NAME === name) {
      return 'rgba(255, 255, 255, 0.7)'; // Bright white on hover
    }

    if (globeView === 'fifa') {
      return 'rgba(255, 215, 0, 0.45)'; // Elegant gold borders
    }

    if (globeView === 'discovery') {
      return 'rgba(0, 229, 255, 0.6)'; // Cyber cyan blueprint borders
    }

    if (globeView === 'night') {
      return 'rgba(0, 100, 255, 0.15)'; // Darker blue borders
    }

    if (globeView === 'satellite') {
      return 'rgba(255, 255, 255, 0.15)'; // Thin white borders
    }
    
    return 'rgba(255, 255, 255, 0.2)'; // Brighter normal borders
  }, [selectedCountry, hoveredPolygon, adjustOpacity, globeView, failsafeActive]);

  const handlePolygonClick = useCallback((feat: any, event?: any) => {
    const name = feat.properties.NAME;
    if (onSelectCountry) onSelectCountry(name);
    onSelectEvent(null);
    pauseRotation();
    recordInteraction();

    // Log the country tap interaction
    trackEvent('globe', 'tap', name);

    // Position the floating details card near the clicked country (using mouse event clientX/Y)
    if (event && typeof event.clientX === 'number') {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  }, [onSelectCountry, onSelectEvent, pauseRotation, recordInteraction]);

  const handlePolygonHover = useCallback((feat: any) => {
    setHoveredPolygon(feat);
    const el = document.body;
    el.style.cursor = feat ? 'pointer' : 'default';
    if (feat) {
      const name = feat.properties?.NAME;
      if (name) {
        trackEvent('globe', 'hover', name);
      }
    }
  }, []);

  const handleGlobeClick = useCallback(() => {
    onSelectEvent(null);
    if (onSelectCountry) onSelectCountry(null);
    resumeRotation();
    recordInteraction();
  }, [onSelectEvent, onSelectCountry, resumeRotation, recordInteraction]);

  // Constrain tooltip position to prevent clipping off-screen or overlapping mobile elements
  const constrainedTooltipPos = useMemo(() => {
    let x = tooltipPosition.x + 15;
    let y = tooltipPosition.y + 15;
    const tooltipWidth = 256;
    const tooltipHeight = 180; // approximate max height

    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Keep x within screen bounds
      if (x + tooltipWidth > screenWidth - 16) {
        x = Math.max(16, tooltipPosition.x - tooltipWidth - 15);
      }
      
      // If mobile, prevent overlapping with bottom drawer (top of bottom drawer is around screenHeight - 280)
      const maxAllowedY = isMobile ? screenHeight - 280 - tooltipHeight : screenHeight - tooltipHeight - 16;
      if (y > maxAllowedY) {
        y = Math.max(16, tooltipPosition.y - tooltipHeight - 15);
      }

      if (x < 16) x = 16;
      if (y < 16) y = 16;
    }
    return { x, y };
  }, [tooltipPosition, isMobile]);

  const rendererConfig = useMemo(() => ({
    antialias: !isMobile, // Disable antialiasing on mobile to increase FPS
    alpha: true,
    powerPreference: 'high-performance' as const
  }), [isMobile]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      id="globe-container"
      style={{ opacity: 0, animation: 'fadeIn 2s ease-out 0.5s forwards' }}
      onPointerDown={recordInteraction}
      onWheel={recordInteraction}
      onMouseLeave={() => setHoveredPolygon(null)}
    >
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}

          // Textures & Atmosphere (Rule 1 & Rule 2 & Rule 11)
          globeImageUrl={globeTextureUrl}
          bumpImageUrl={failsafeActive ? "" : GLOBE_CONFIG.bumpImageUrl}
          backgroundImageUrl=""
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor={
            celebration?.active 
              ? celebration.colors.primary 
              : globeView === 'fifa'
              ? '#ffd700'
              : globeView === 'night'
              ? '#00e5ff'
              : globeView === 'discovery'
              ? '#00f5ff'
              : (globeView === 'weather' || globeView === 'satellite')
              ? '#87ceeb'
              : GLOBE_CONFIG.atmosphereColor
          }
          atmosphereAltitude={
            celebration?.active 
              ? (isMobile ? 0.35 : 0.4) 
              : failsafeActive
              ? 0.05
              : globeView === 'fifa'
              ? 0.3
              : globeView === 'night'
              ? 0.28
              : globeView === 'discovery'
              ? 0.25
              : (globeView === 'weather' || globeView === 'satellite')
              ? 0.15
              : (isMobile ? 0.2 : GLOBE_CONFIG.atmosphereAltitude)
          }

          // Connection Arcs
          arcsData={arcsData}
          arcColor="color"
          arcDashLength={GLOBE_CONFIG.arcDashLength}
          arcDashGap={GLOBE_CONFIG.arcDashGap}
          arcDashInitialGap={GLOBE_CONFIG.arcDashInitialGap}
          arcDashAnimateTime={GLOBE_CONFIG.arcDashAnimateTime}
          arcAltitude={GLOBE_CONFIG.arcAltitude}

          // HTML markers
          htmlElementsData={combinedHtmlData}
          htmlElement={htmlMarkerRenderer}
          htmlAltitude={GLOBE_CONFIG.markerAltitude}

          // Rings
          ringsData={ringsData}
          ringColor="color"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"

          // Polygons (Countries)
          polygonsData={countries}
          polygonCapColor={getPolygonColor}
          polygonSideColor={getPolygonSideColor}
          polygonStrokeColor={getPolygonStrokeColor}
          polygonAltitude={getPolygonAltitude}
          polygonsTransitionDuration={failsafeActive ? 0 : (isMobile ? 300 : 600)} // Disable transitions in failsafe
          onPolygonClick={handlePolygonClick}
          onPolygonHover={isMobile ? undefined : handlePolygonHover} // Disable raycasting hover queries on touch screens

          // Labels (Feature 1, 7, 10, 4)
          labelsData={filteredLabels}
          labelLat={(d: any) => d.lat}
          labelLng={(d: any) => d.lng}
          labelText={(d: any) => {
            const isWorldCupActive = activeCategory === 'worldcup';
            const hasLiveMatch = !!liveMatchCountriesMap[d.name];
            
            // On Windows, d.flag is empty to avoid rendering question marks (??) on the canvas
            const isWindows = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('windows');
            const flagPrefix = isWindows ? '' : (d.flag ? `${d.flag} ` : '');

            if (isPlayEarthActive) {
              const questionsAvailable = (d.name.length * 13) % 150 + 50;
              return `${flagPrefix}${d.name} 🎮 (${questionsAvailable} Qs)`;
            }
            
            if (isWorldCupActive && d.isWorldCupTeam) {
              if (hasLiveMatch) {
                return `⚽🔥 ${flagPrefix}${d.name} LIVE`;
              }
              return `⚽ ${flagPrefix}${d.name}`;
            }
            
            if (hasLiveMatch) {
              return `⚽🔥 ${flagPrefix}${d.name} LIVE`;
            }
            
            return `${flagPrefix}${d.name}`;
          }}
          labelColor={(d: any) => {
            if (selectedCountry) {
              return matchCountryNames(selectedCountry, d.name) ? '#00e5ff' : 'rgba(255, 255, 255, 0.35)';
            }
            return '#ffffff';
          }}
          labelSize={getLabelSize}
          labelAltitude={getLabelAltitude}
          labelDotRadius={(d: any) => {
            if (selectedCountry && matchCountryNames(selectedCountry, d.name)) {
              return 0.12; // Enlarge focus dot
            }
            return 0.04; // Small clean default dot
          }}
          labelResolution={failsafeActive ? 1 : 2} // Reduced label resolution in failsafe mode (Rule 11)
          labelsTransitionDuration={800} // Smooth interpolation transitions to prevent label popping (Feature 6)
          onLabelClick={(d: any) => handlePolygonClick(d.feature)}

          // Globe interaction
          onGlobeClick={handleGlobeClick}

          // Performance
          animateIn={true}
          rendererConfig={rendererConfig}
        />
      )}

      {/* Modern Premium Floating FPS Performance Monitor Badge & Collapsible HUD (Rule 8 & Rule 11) */}
      <FpsPerformancePanel 
        failsafeActive={failsafeActive}
        isMobile={isMobile}
        visibleLabelsCount={filteredLabels.length}
        visibleCountriesCount={countries.length}
        activeTextureUrl={globeTextureUrl}
        globeView={globeView}
        onResetFailsafe={() => {
          lowFpsSecondsRef.current = 0;
          highFpsSecondsRef.current = 0;
          setFailsafeActive(false);
        }}
      />

      {/* Floating details card (Feature 2 & Feature 8) */}
      <AnimatePresence>
        {selectedCountry && countryStats && !isDashboardOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[100] w-64 rounded-2xl glass border border-white/10 p-4 shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(0,229,255,0.1)] flex flex-col gap-2 pointer-events-auto"
            style={{
              left: constrainedTooltipPos.x,
              top: constrainedTooltipPos.y,
              background: 'linear-gradient(135deg, rgba(12,12,25,0.95) 0%, rgba(5,5,15,0.95) 100%)',
            }}
          >
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-2xl leading-none">{countryStats.flag}</span>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-white text-sm truncate">{countryStats.name}</h4>
                  <p className="text-[9px] text-white/45 uppercase tracking-wider">Capital: {countryStats.capital}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectCountry) onSelectCountry(null);
                }}
                className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/55 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Context-aware Content */}
            {activeCategory === 'breaking' ? (
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between text-white/80">
                  <span>📰 News Stories</span>
                  <span className="font-bold text-cyan-400">{countryStats.newsCount}</span>
                </div>
                <div className="flex justify-between text-red-400/90">
                  <span>🔥 Breaking Headlines</span>
                  <span className="font-bold">{countryStats.breakingCount}</span>
                </div>
                <div className="text-[9px] text-white/30 italic mt-1">Updated {countryStats.lastUpdatedMin} min ago</div>
              </div>
            ) : activeCategory === 'sports' || activeCategory === 'football' ? (
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between text-white/80">
                  <span>⚽ Sports Stories</span>
                  <span className="font-bold text-emerald-400">{countryStats.sportsCount}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>🏆 National Team Updates</span>
                  <span className="text-emerald-400/90 font-bold">Active</span>
                </div>
                <div className="text-[9px] text-white/30 italic mt-1">Trending Sports News</div>
              </div>
            ) : activeCategory === 'worldcup' ? (
              <div className="text-[11px] space-y-1">
                <div className="text-cyan-400 font-extrabold text-[10px] tracking-wide uppercase">🏆 FIFA World Cup 2026</div>
                <div className="flex justify-between text-white/80">
                  <span>📊 Group Standing</span>
                  <span className="font-bold text-cyan-300">{countryStats.groupStanding}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>⚽ Next Match</span>
                  <span className="font-semibold text-white/60">Scheduled</span>
                </div>
              </div>
            ) : activeCategory === 'weather' ? (
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between text-white/80 items-center">
                  <span>Current Temp</span>
                  <span className="font-bold text-orange-400 text-xs">{countryStats.temperature}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Condition</span>
                  <span className="font-medium text-white/80">{countryStats.weatherCondition}</span>
                </div>
                {countryStats.weatherAlert && (
                  <div className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-1 animate-pulse">
                    ⚠ {countryStats.weatherAlert}
                  </div>
                )}
              </div>
            ) : activeCategory === 'technology' ? (
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between text-white/80">
                  <span>💻 Tech Updates</span>
                  <span className="font-bold text-purple-400">{countryStats.techCount}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>🤖 AI Developments</span>
                  <span className="text-purple-400/90 font-bold">Live</span>
                </div>
                <div className="text-[9px] text-white/30 italic mt-1">Innovation Hub active</div>
              </div>
            ) : (
              // Default Stats View (Feature 8)
              <div className="text-[10px] space-y-1 text-white/75">
                <div className="flex justify-between">
                  <span>👥 Population</span>
                  <span className="font-bold text-white">{countryStats.population}</span>
                </div>
                <div className="flex justify-between">
                  <span>📰 News Feed</span>
                  <span className="font-bold text-cyan-400">{countryStats.newsCount} Stories</span>
                </div>
                {countryStats.isWorldCupTeam && (
                  <div className="text-[9px] text-cyan-400 font-bold mt-1 flex items-center gap-1">
                    <span>🏆</span> World Cup Participating Team
                  </div>
                )}
              </div>
            )}

            {/* Tap/Click Instruction */}
            <div className="border-t border-white/5 pt-1.5 mt-0.5 text-center text-[9px] text-white/30 uppercase tracking-wider font-bold">
              Click globe to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Modern Premium Floating FPS Performance Monitor & Collapsible HUD (Rule 8 & Rule 11)
// Decoupled sub-component to prevent full GlobeScene re-renders on every FPS update
// ============================================================
interface FpsPerformancePanelProps {
  failsafeActive: boolean;
  isMobile: boolean;
  visibleLabelsCount: number;
  visibleCountriesCount: number;
  activeTextureUrl: string;
  globeView: string;
  onResetFailsafe: () => void;
}

function FpsPerformancePanel({
  failsafeActive,
  isMobile,
  visibleLabelsCount,
  visibleCountriesCount,
  activeTextureUrl,
  globeView,
  onResetFailsafe,
}: FpsPerformancePanelProps) {
  const [fps, setFps] = useState(60);
  const [showDebug, setShowDebug] = useState(false);
  const [memoryUsage, setMemoryUsage] = useState('N/A');

  // Measure FPS locally so its state changes only re-render this leaf component!
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let animId: number;

    const measure = () => {
      frames++;
      const time = performance.now();
      if (time >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (time - lastTime)));
        frames = 0;
        lastTime = time;

        // Estimate memory usage on tick
        try {
          const perf = window.performance as any;
          if (perf && perf.memory) {
            setMemoryUsage(`${Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)} MB`);
          }
        } catch (e) {}
      }
      animId = requestAnimationFrame(measure);
    };
    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  const getTextureName = (url: string) => {
    if (!url) return 'None';
    if (url.startsWith('data:')) return 'Canvas Generated';
    return url.substring(url.lastIndexOf('/') + 1);
  };

  return (
    <div className="absolute top-4 left-4 z-[90] flex flex-col gap-2 pointer-events-auto">
      {/* Clickable Badge */}
      <div 
        onClick={() => setShowDebug(!showDebug)}
        className="flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide uppercase shadow-lg border border-white/5 cursor-pointer hover:bg-white/10 transition-colors select-none"
        style={{
          background: 'rgba(10, 10, 18, 0.75)',
          backdropFilter: 'blur(12px)',
          color: failsafeActive ? '#ef4444' : fps >= 55 ? '#10b981' : fps >= 45 ? '#f59e0b' : '#ef4444'
        }}
        title="Click to toggle Performance Debug Panel"
      >
        <span className={`h-1.5 w-1.5 rounded-full bg-current ${failsafeActive ? 'animate-ping' : 'animate-pulse'}`} />
        <span>{failsafeActive ? 'FAILSAFE' : `${fps} FPS`}</span>
        <span className="text-white/20">|</span>
        <span className="text-white/50">{isMobile ? 'Mobile' : '60FPS Target'}</span>
      </div>

      {/* Collapsible Debug Panel (Rule 8) */}
      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-56 rounded-2xl border border-white/10 p-3 flex flex-col gap-2 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(12,12,25,0.96) 0%, rgba(5,5,15,0.96) 100%)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Performance HUD</span>
              <button 
                onClick={() => setShowDebug(false)}
                className="text-white/30 hover:text-white text-[9px]"
              >
                ✕
              </button>
            </div>

            <div className="text-[10px] space-y-1.5 text-white/80">
              <div className="flex justify-between">
                <span className="text-white/45">Framerate</span>
                <span className={`font-bold ${fps >= 55 ? 'text-emerald-400' : fps >= 45 ? 'text-amber-400' : 'text-rose-400'}`}>{fps} FPS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/45">View Mode</span>
                <span className="font-bold text-cyan-400 uppercase">{globeView}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/45">Visible Labels</span>
                <span className="font-bold text-white">{visibleLabelsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/45">Countries Layer</span>
                <span className="font-bold text-white">{visibleCountriesCount}</span>
              </div>
              <div className="flex justify-between flex-col">
                <span className="text-white/45 mb-0.5">Active Texture</span>
                <span className="font-semibold text-white/80 text-[9px] truncate" title={activeTextureUrl}>
                  {getTextureName(activeTextureUrl)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/45">JS Heap Memory</span>
                <span className="font-semibold text-white/80">{memoryUsage}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1">
                <span className="text-white/45">Failsafe Mode</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  failsafeActive ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' : 'bg-white/5 text-white/45'
                }`}>
                  {failsafeActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {failsafeActive && (
              <button
                onClick={onResetFailsafe}
                className="w-full mt-1.5 py-1.5 rounded-lg bg-red-600/30 border border-red-500/40 text-red-200 font-bold text-[9px] hover:bg-red-500/40 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Reset Failsafe Mode
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

