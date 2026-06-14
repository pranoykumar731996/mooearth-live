// ============================================================
// MooEarth Live — Globe Scene (Dynamic Import Wrapper)
// ============================================================

'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { WorldEvent, EventArc } from '@/types';
import { CATEGORY_MAP, GLOBE_CONFIG, COUNTRY_COORDINATES } from '@/lib/constants';
import { useGlobeControls } from '@/hooks/useGlobeControls';
import { useCinematicCamera } from '@/hooks/useCinematicCamera';
import { GoalCelebration } from '@/hooks/useGoalCelebration';
import * as THREE from 'three';

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
}

// Robust helper to match celebration country names with GeoJSON country names (handles USA, UK, England, etc.)
const matchCountryNames = (c1?: string | null, c2?: string | null) => {
  if (!c1 || !c2) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const n1 = norm(c1);
  const n2 = norm(c2);
  if (n1 === n2) return true;
  if (n1 === 'unitedstates' && n2 === 'unitedstatesofamerica') return true;
  if (n1 === 'unitedstatesofamerica' && n2 === 'unitedstates') return true;
  if (n1 === 'usa' && (n2 === 'unitedstates' || n2 === 'unitedstatesofamerica')) return true;
  if (n1 === 'unitedkingdom' && n2 === 'england') return true;
  if (n1 === 'england' && n2 === 'unitedkingdom') return true;
  return false;
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
}: GlobeSceneProps) {
  const { globeRef, initControls, flyTo, pauseRotation, resumeRotation } = useGlobeControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [introDone, setIntroDone] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [globalMood, setGlobalMood] = useState<Record<string, number>>({});
  const lastInteractionTime = useRef<number>(Date.now());
  const atmosphereMeshRef = useRef<any>(null);
  const celebrationProcessedRef = useRef<string | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // 1-second clock timer for performance-optimized WebGL visual breathing oscillations
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Progressive Texture URLs
  const [globeTextureUrl, setGlobeTextureUrl] = useState(GLOBE_CONFIG.globePlaceholderUrl);
  const [cloudsTextureUrl, setCloudsTextureUrl] = useState(GLOBE_CONFIG.cloudsPlaceholderUrl);

  // Preload high-resolution textures in background
  useEffect(() => {
    const globeImg = new Image();
    globeImg.src = GLOBE_CONFIG.globeImageUrl;
    globeImg.onload = () => {
      setGlobeTextureUrl(GLOBE_CONFIG.globeImageUrl);
    };

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
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [initControls, globeRef]);

  // Cloud layer and advanced lighting
  useEffect(() => {
    if (!globeRef.current || !introDone) return;
    
    const globe = globeRef.current;
    const scene = globe.scene();
    if (!scene) return;
    
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
  }, [globeRef, introDone, cloudsTextureUrl, isMobile]);

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
      const atmosphereMesh = scene.children.find(
        (c: any) => c.type === 'Mesh' && c.material?.type === 'ShaderMaterial' && c !== scene.children[0]
      );
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
      const hasPenaltyShootout = events.some(e => e.footballData?.status === 'PEN');
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
  }, [globeRef, introDone, globalEnergyScore, isCinematicModeActive, events, celebration, earthCastActive, earthCastAudioLevel]);

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
        let startTime = performance.now();
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

  // Ring data (Goal Shockwaves + Default Pulse + Celebration Mega-Rings)
  const ringsData = useMemo(() => {
    const rings: any[] = [];
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
  }, [events, celebration, isMobile]);

  // HTML marker elements
  const htmlMarkerRenderer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => {
      const isCelebration = d.isCelebration;
      
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

      return el;
    },
    [onSelectEvent, pauseRotation, recordInteraction, onSelectCelebration, flyTo]
  );

  const getEmotionColorForCountry = useCallback((name: string) => {
    if (!name) return undefined;
    if (emotionMap[name]) return emotionMap[name];
    const matchKey = Object.keys(emotionMap).find(key => matchCountryNames(key, name));
    return matchKey ? emotionMap[matchKey] : undefined;
  }, [emotionMap]);

  // Polygon Colors (Global Mood Map + Celebration Override)
  const getPolygonColor = useCallback((feat: any) => {
    const name = feat.properties.NAME;
    const isSelected = selectedCountry === name;
    
    // Check if it's a live match country
    const isLiveMatchCountry = events.some(e => 
      e.category === 'football' &&
      e.footballData &&
      (e.footballData.status === 'LIVE' || e.footballData.status === 'HT' || e.footballData.status === 'PEN') &&
      (matchCountryNames(e.footballData.homeTeam, name) || matchCountryNames(e.footballData.awayTeam, name))
    );

    const pulse = 1 + Math.sin(now / 600) * 0.15;
    const isPulsing = isSelected || isLiveMatchCountry;

    // During celebration, make the scoring country GLOW brightly
    if (celebration?.active && matchCountryNames(celebration.country, name)) {
      return `${celebration.colors.primary}cc`; // Very bright
    }
    
    if (isSelected) {
      const alpha = isPulsing ? 0.6 * pulse : 0.6;
      return `rgba(0, 229, 255, ${alpha.toFixed(3)})`;
    }

    const emotionColor = getEmotionColorForCountry(name);
    if (emotionColor) {
      if (isPulsing) {
        return adjustOpacity(emotionColor, pulse);
      }
      return emotionColor;
    }
    
    const intensity = globalMood[name] || 0;
    let baseColor = 'rgba(255, 255, 255, 0.015)';
    if (intensity > 0.7) baseColor = `rgba(255, 100, 0, ${0.2 + intensity * 0.3})`;
    else if (intensity > 0.4) baseColor = `rgba(16, 185, 129, ${0.15 + intensity * 0.3})`;
    else if (intensity > 0) baseColor = `rgba(59, 130, 246, ${0.1 + intensity * 0.2})`;
    
    if (isPulsing && baseColor !== 'rgba(255, 255, 255, 0.015)') {
      return adjustOpacity(baseColor, pulse);
    }
    return baseColor;
  }, [globalMood, selectedCountry, getEmotionColorForCountry, celebration, events, now, adjustOpacity]);

  // Polygon Altitude (3D Emotional Heatmap + Celebration)
  const getPolygonAltitude = useCallback((feat: any) => {
    const name = feat.properties.NAME;
    const isSelected = selectedCountry === name;
    
    // Check if it's a live match country
    const isLiveMatchCountry = events.some(e => 
      e.category === 'football' &&
      e.footballData &&
      (e.footballData.status === 'LIVE' || e.footballData.status === 'HT' || e.footballData.status === 'PEN') &&
      (matchCountryNames(e.footballData.homeTeam, name) || matchCountryNames(e.footballData.awayTeam, name))
    );

    const pulse = 1 + Math.sin(now / 600) * 0.15;
    const isPulsing = isSelected || isLiveMatchCountry;
    const multiplier = isPulsing ? pulse : 1.0;

    // During celebration, the scoring country RISES dramatically
    if (celebration?.active && matchCountryNames(celebration.country, name)) {
      return 0.15; // Highest possible extrusion
    }
    
    if (isSelected) {
      return 0.12 * multiplier;
    }

    const emotionColor = getEmotionColorForCountry(name);
    if (emotionColor) {
      let baseAlt = 0.03;
      if (emotionColor.includes('255, 215, 0')) baseAlt = 0.08; // Gold
      else if (emotionColor.includes('239, 68, 68')) baseAlt = 0.06; // Red
      else if (emotionColor.includes('128, 0, 128')) baseAlt = 0.04; // Purple
      else if (emotionColor.includes('249, 115, 22')) baseAlt = 0.05; // Orange
      else if (emotionColor.includes('16, 185, 129')) baseAlt = 0.06; // Green
      return baseAlt * multiplier;
    }
    
    const intensity = globalMood[name] || 0;
    return (0.01 + (intensity * 0.03)) * multiplier;
  }, [globalMood, selectedCountry, getEmotionColorForCountry, celebration, events, now]);

  // Polygon Side Glow (Matching Cap Color)
  const getPolygonSideColor = useCallback((feat: any) => {
    const name = feat.properties.NAME;
    const isSelected = selectedCountry === name;
    
    const isLiveMatchCountry = events.some(e => 
      e.category === 'football' &&
      e.footballData &&
      (e.footballData.status === 'LIVE' || e.footballData.status === 'HT' || e.footballData.status === 'PEN') &&
      (matchCountryNames(e.footballData.homeTeam, name) || matchCountryNames(e.footballData.awayTeam, name))
    );

    const pulse = 1 + Math.sin(now / 600) * 0.15;
    const isPulsing = isSelected || isLiveMatchCountry;
    const sideOpacity = isPulsing ? 0.5 * pulse : 0.5;
    
    // During celebration, sides glow with the country's color
    if (celebration?.active && matchCountryNames(celebration.country, name)) {
      return `${celebration.colors.primary}99`;
    }
    
    const capColor = getPolygonColor(feat);
    return capColor.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/, `rgba($1, $2, $3, ${sideOpacity.toFixed(3)})`);
  }, [getPolygonColor, celebration, selectedCountry, events, now]);

  // Stable Globe Callbacks & Memoized Configs
  const getPolygonStrokeColor = useCallback(() => 'rgba(255,255,255,0.05)', []);

  const handlePolygonClick = useCallback((feat: any) => {
    const name = feat.properties.NAME;
    if (onSelectCountry) onSelectCountry(name);
    onSelectEvent(null);
    pauseRotation();
    recordInteraction();
  }, [onSelectCountry, onSelectEvent, pauseRotation, recordInteraction]);

  const handlePolygonHover = useCallback((feat: any) => {
    const el = document.body;
    el.style.cursor = feat ? 'pointer' : 'default';
  }, []);

  const handleGlobeClick = useCallback(() => {
    onSelectEvent(null);
    if (onSelectCountry) onSelectCountry(null);
    resumeRotation();
    recordInteraction();
  }, [onSelectEvent, onSelectCountry, resumeRotation, recordInteraction]);

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
    >
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}

          // Textures & Atmosphere
          globeImageUrl={globeTextureUrl}
          bumpImageUrl={GLOBE_CONFIG.bumpImageUrl}
          backgroundImageUrl=""
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor={celebration?.active ? celebration.colors.primary : GLOBE_CONFIG.atmosphereColor}
          atmosphereAltitude={celebration?.active ? (isMobile ? 0.35 : 0.4) : (isMobile ? 0.2 : GLOBE_CONFIG.atmosphereAltitude)}

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
          polygonsTransitionDuration={isMobile ? 500 : 1500} // Faster transitions on mobile
          onPolygonClick={handlePolygonClick}
          onPolygonHover={isMobile ? undefined : handlePolygonHover} // Disable raycasting hover queries on touch screens

          // Globe interaction
          onGlobeClick={handleGlobeClick}

          // Performance
          animateIn={true}
          rendererConfig={rendererConfig}
        />
      )}
    </div>
  );
}
