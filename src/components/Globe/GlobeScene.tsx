// ============================================================
// MooEarth Live — Globe Scene (Dynamic Import Wrapper)
// ============================================================

'use client';

import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { WorldEvent, EventArc, EventCategory } from '@/types';
import { CATEGORY_MAP, GLOBE_CONFIG, COUNTRY_COORDINATES, getCountryGlowColors } from '@/lib/constants';
import { findCountryMeta } from '@/data/questions/countryMetadata';
import { LocationRecord, locations } from '@/data/locations';
import { getCountriesForContinent } from '@/data/continents';
import { useGlobeControls, GlobeApi } from '@/hooks/useGlobeControls';
import { useCinematicCamera } from '@/hooks/useCinematicCamera';
import { GoalCelebration } from '@/hooks/useGoalCelebration';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/services/analytics';
import { CountryFlag } from '@/components/UI/CountryFlag';
import { WindParticleSystem, TemperatureHeatmapLayer, PrecipitationLayer, CycloneVortexLayer, SeismicShockwaveLayer, LightningNetworkLayer, WildfireThermalLayer, AuroralOvalLayer, OceanCurrentsLayer, GeostationarySatelliteLayer, AtmosphericPressureLayer, BASELINE_CYCLONE_EVENTS, BASELINE_LIGHTNING_EVENTS, BASELINE_SEISMIC_EVENTS, BASELINE_WILDFIRE_EVENTS, BASELINE_SPACE_WEATHER_EVENTS, getCycloneCategoryLabel, getRichterCategoryLabel, getWildfireIntensityLabel, getKpStormScaleLabel } from './WeatherLayers';
import type { WeatherLayerMode, UnitPreferences, SatelliteSpectralMode } from '@/services/weather/types';
import type { GlobalWeatherGridResponse } from '@/services/weather/globalGridService';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

// Dynamic import — react-globe.gl requires window/WebGL
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => null,
});

interface GlobeSceneProps {
  events: WorldEvent[];
  allEvents?: WorldEvent[]; // Full unfiltered planetary events feed
  selectedEvent: WorldEvent | null;
  onSelectEvent: (event: WorldEvent | null) => void;
  selectedCountry?: string | null;
  onSelectCountry?: (country: string | null) => void;
  selectedLocation?: LocationRecord | null;
  onSelectLocation?: (location: LocationRecord | null) => void;
  selectedContinent?: string | null;
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
  globeView?: 'standard' | 'night' | 'weather' | 'satellite' | 'discovery';
  weatherLayerMode?: WeatherLayerMode;
  weatherTimelineIndex?: number;
  weatherGridData?: GlobalWeatherGridResponse | null;
  weatherUnits?: UnitPreferences;
  satelliteSpectralMode?: SatelliteSpectralMode;
  overlayRadar?: boolean;
  showPressureIsobars?: boolean;
  particlesEnabled?: boolean;
  isDashboardOpen?: boolean;
  isFocusMode?: boolean;
  isStopTheEarthSpinning?: boolean;
  isStopTheEarthActive?: boolean;
  onStopTheEarthCoordCaptured?: (coord: { lat: number; lng: number; timestamp?: number }) => void;
  stopTheEarthTargetCoord?: { lat: number; lng: number } | null;
  onInitGlobeApi?: (api: GlobeApi) => void;
  onGlobeClick?: (coords: { lat: number; lng: number }) => void;
}
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

let _blueprintTextureCache: string | null = null;

const getBlueprintGridTexture = () => {
  if (!_blueprintTextureCache) _blueprintTextureCache = createBlueprintGridTexture();
  return _blueprintTextureCache;
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

const GlobeScene = React.memo(function GlobeScene({
  events,
  allEvents,
  selectedEvent,
  onSelectEvent,
  selectedCountry,
  onSelectCountry,
  selectedLocation,
  onSelectLocation,
  selectedContinent = null,
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
  globeView = 'satellite',
  weatherLayerMode = 'overview',
  weatherTimelineIndex = 0,
  weatherGridData = null,
  weatherUnits,
  satelliteSpectralMode = 'visible',
  overlayRadar = false,
  showPressureIsobars = false,
  particlesEnabled = true,
  isDashboardOpen = false,
  isFocusMode = false,
  isStopTheEarthSpinning = false,
  isStopTheEarthActive = false,
  onStopTheEarthCoordCaptured,
  stopTheEarthTargetCoord = null,
  onInitGlobeApi,
  onGlobeClick,
}: GlobeSceneProps) {
  const { globeRef, initControls, flyTo, zoomIn, zoomOut, pauseRotation, resumeRotation, spinRapidly, freezeRotation, getPointOfView } = useGlobeControls();
  const [failsafeActive, setFailsafeActive] = useState(false);
  const lowFpsSecondsRef = useRef(0);
  const highFpsSecondsRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [introDone, setIntroDone] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [globalMood, setGlobalMood] = useState<Record<string, number>>({});

  // ── 3D Weather Layers Refs (Phase 2 Real Weather Visualizations) ──
  const windParticleSystemRef = useRef<WindParticleSystem | null>(null);
  const temperatureLayerRef = useRef<TemperatureHeatmapLayer | null>(null);
  const precipitationLayerRef = useRef<PrecipitationLayer | null>(null);
  const cycloneVortexLayerRef = useRef<CycloneVortexLayer | null>(null);
  const seismicShockwaveLayerRef = useRef<SeismicShockwaveLayer | null>(null);
  const lightningNetworkLayerRef = useRef<LightningNetworkLayer | null>(null);
  const wildfireThermalLayerRef = useRef<WildfireThermalLayer | null>(null);
  const auroralOvalLayerRef = useRef<AuroralOvalLayer | null>(null);
  const oceanCurrentsLayerRef = useRef<OceanCurrentsLayer | null>(null);
  const geostationarySatelliteLayerRef = useRef<GeostationarySatelliteLayer | null>(null);
  const atmosphericPressureLayerRef = useRef<AtmosphericPressureLayer | null>(null);

  // Stop The Earth active/spinning refs for instant 60fps frame loop reading
  const isStopTheEarthSpinningRef = useRef(isStopTheEarthSpinning);
  const isStopTheEarthActiveRef = useRef(isStopTheEarthActive);
  const stopAlreadyTriggeredRef = useRef(false);

  useEffect(() => {
    isStopTheEarthSpinningRef.current = isStopTheEarthSpinning;
    isStopTheEarthActiveRef.current = isStopTheEarthActive;

    if (isStopTheEarthSpinning) {
      stopAlreadyTriggeredRef.current = false;
    }

    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;

    if (isStopTheEarthSpinning) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 16.0;
      controls.enableRotate = false; // Lock camera dragging during 5s spin so pointerdown is pure stop
      controls.enableZoom = false;
      controls.enablePan = false;
    } else if (isStopTheEarthActive) {
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0;
      controls.enableRotate = true;  // Allow user to rotate globe to inspect the stopped point
      controls.enableZoom = true;    // Allow user to zoom in/out to inspect the stopped location
      controls.enablePan = false;
    } else {
      // Restore normal controls outside game
      controls.enableRotate = true;
      controls.enableZoom = true;
      controls.enablePan = true;
    }
  }, [isStopTheEarthSpinning, isStopTheEarthActive, globeRef]);

  // Expose GlobeApi to parent component once ready
  useEffect(() => {
    if (globeRef.current && onInitGlobeApi) {
      onInitGlobeApi({
        getPointOfView,
        flyTo,
        zoomIn,
        zoomOut,
        pauseRotation,
        resumeRotation,
        spinRapidly,
        freezeRotation,
      });
    }
  }, [onInitGlobeApi, getPointOfView, flyTo, zoomIn, zoomOut, pauseRotation, resumeRotation, spinRapidly, freezeRotation, globeRef]);

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
        e.category === activeCategory
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

  // Precompute continent-matching countries map for O(1) continental landmass rendering
  const continentCountriesMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!selectedContinent) return map;
    const list = getCountriesForContinent(selectedContinent);
    list.forEach(c => {
      map[c.name.toLowerCase()] = true;
    });
    return map;
  }, [selectedContinent]);
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
  const activeHtmlMarkersRef = useRef<Map<HTMLElement, { lat: number; lng: number }>>(new Map());

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

  // Clear html marker cache when event data or view mode changes
  useEffect(() => {
    htmlMarkersCacheRef.current.clear();
    activeHtmlMarkersRef.current.clear();
  }, [events, celebrations, selectedLocation, globeView]);

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

  // Mobile state detection (Immediate client detection + resize listener)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
    return false;
  });
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Progressive Texture URLs & Lazy Loader (Rule 1 & Rule-2)
  const [globeTextureUrl, setGlobeTextureUrl] = useState(() => {
    if (globeView === 'weather' || globeView === 'satellite' || globeView === 'discovery' || isPlayEarthActive) {
      return '/textures/globe-day.jpg';
    }
    return GLOBE_CONFIG.globePlaceholderUrl;
  });
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
    } else if (globeView === 'discovery' || isPlayEarthActive) {
      targetTexture = '/textures/globe-day.jpg';
    } else if (globeView === 'weather' || globeView === 'satellite') {
      targetTexture = '/textures/globe-day.jpg';
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
  }, [globeView, isPlayEarthActive]);

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

  // Resize observer & robust viewport dimension measurement
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measureAndSetDimensions = (w?: number, h?: number) => {
      const parent = el.parentElement;
      const rect = el.getBoundingClientRect();
      const parentRect = parent ? parent.getBoundingClientRect() : null;

      let finalWidth = w ?? rect.width ?? el.clientWidth;
      let finalHeight = h ?? rect.height ?? el.clientHeight;

      if (!finalWidth || finalWidth <= 0) {
        finalWidth = (parentRect && parentRect.width > 0) ? parentRect.width : (parent?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800));
      }
      if (!finalHeight || finalHeight <= 0) {
        finalHeight = (parentRect && parentRect.height > 0) ? parentRect.height : (parent?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600));
      }

      finalWidth = Math.max(Math.floor(finalWidth), 300);
      finalHeight = Math.max(Math.floor(finalHeight), 300);

      setDimensions(prev => {
        if (Math.abs(prev.width - finalWidth) < 2 && Math.abs(prev.height - finalHeight) < 2) {
          return prev;
        }
        return { width: finalWidth, height: finalHeight };
      });
    };

    // Initial immediate measurement
    measureAndSetDimensions();

    const observer = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      const { width, height } = entries[0].contentRect;
      measureAndSetDimensions(width, height);
    });

    observer.observe(el);
    if (el.parentElement) {
      observer.observe(el.parentElement);
    }

    const handleResize = () => measureAndSetDimensions();
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
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

  // Intro animation & init with retry until globeRef is ready
  useEffect(() => {
    let isMounted = true;
    let animTimer: NodeJS.Timeout | null = null;
    let attempts = 0;

    const tryInit = () => {
      if (!isMounted) return;
      attempts++;

      if (globeRef.current) {
        if (typeof window !== 'undefined') {
          (window as any).__globeRef = globeRef.current;
        }
        initControls();
        // Globe diagnostics logging — dev-only to avoid leaking internal state in production
        if (process.env.NODE_ENV !== 'production') {
          try {
            const globe = globeRef.current;
            const scene = globe.scene();
            const camera = globe.camera();
            const pov = globe.pointOfView ? globe.pointOfView() : null;
            console.log('[GLOBE_DIAGNOSTICS] ' + JSON.stringify({
              globeView,
              globeTextureUrl,
              dimensions,
              pov,
              cameraPos: camera ? { x: camera.position.x, y: camera.position.y, z: camera.position.z } : null,
              sceneChildrenCount: scene ? scene.children.length : 0,
              sceneChildren: scene ? scene.children.map((c: any) => ({
                type: c.type,
                name: c.name || '(unnamed)',
                visible: c.visible,
                isMesh: !!c.isMesh,
                matType: c.material ? c.material.type : null,
                hasMap: c.material ? !!c.material.map : null,
              })) : [],
            }));
          } catch (diagErr) {
            console.error('[GLOBE_DIAGNOSTICS_ERR]', diagErr);
          }
        }
        try {
          if (globeView === 'weather') {
            globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);
            setIntroDone(true);
          } else {
            // Start far away
            globeRef.current.pointOfView(GLOBE_CONFIG.introPov, 0);
            // Animate in smoothly
            animTimer = setTimeout(() => {
              if (!isMounted) return;
              globeRef.current?.pointOfView(GLOBE_CONFIG.defaultPov, 3000);
              setTimeout(() => {
                if (isMounted) setIntroDone(true);
              }, 3000);
            }, 150);
          }

          // Cap pixel ratio on high-DPI screens to prevent WebGL from rendering at massive resolutions (1.0 on mobile for 60fps)
          const renderer = globeRef.current.renderer();
          if (renderer) {
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 2.0));
          }
        } catch (e) {
          console.warn('[Globe] Init error', e);
          if (isMounted) setIntroDone(true);
        }
        return true;
      }

      // Retry up to 150 times (every 100ms for up to 15 seconds)
      if (attempts < 150) {
        animTimer = setTimeout(tryInit, 100);
      } else {
        // Fallback: mark intro done so child effects are not permanently blocked
        if (isMounted) setIntroDone(true);
      }
      return false;
    };

    // First attempt
    animTimer = setTimeout(tryInit, 150);

    return () => {
      isMounted = false;
      if (animTimer) clearTimeout(animTimer);
    };
  }, [initControls, globeRef, isMobile, dimensions.width]);

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

    // Enhance lighting for crystal-clear globe visibility
    let directionalLight = scene.children.find((obj3d: any) => obj3d.type === 'DirectionalLight');
    if (directionalLight) {
      directionalLight.intensity = (globeView === 'discovery' || isPlayEarthActive || globeView === 'weather' || globeView === 'satellite') ? 4.0 : 3.5;
      directionalLight.position.set(1, 1, 1);
    } else {
      directionalLight = new THREE.DirectionalLight(0xffffff, (globeView === 'satellite') ? 4.0 : 3.5);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
    }
    
    let ambientLight = scene.children.find((obj3d: any) => obj3d.type === 'AmbientLight');
    if (ambientLight) {
      ambientLight.intensity = (globeView === 'discovery' || isPlayEarthActive || globeView === 'weather' || globeView === 'satellite') ? 1.6 : 0.8;
    } else {
      ambientLight = new THREE.AmbientLight(0xffffff, (globeView === 'satellite') ? 1.6 : 0.8);
      scene.add(ambientLight);
    }

    // Show clouds ONLY on desktop standard and weather views, and NOT in failsafe mode (Rule 1 & Rule 11)
    const showClouds = !isMobile && (globeView === 'standard' || globeView === 'weather') && !failsafeActive;

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
  }, [globeRef, introDone, cloudsTextureUrl, isMobile, globeView, failsafeActive, isPlayEarthActive]);

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

      // 2. Earth Atmosphere Breathing (Desktop only to avoid matrix recomputation every frame on mobile)
      let atmosphereMesh = cachedAtmosphereMeshRef.current;
      if (!atmosphereMesh) {
        atmosphereMesh = scene.children.find(
          (c: any) => c.type === 'Mesh' && c.material?.type === 'ShaderMaterial' && c !== scene.children[0]
        );
        if (atmosphereMesh) {
          cachedAtmosphereMeshRef.current = atmosphereMesh;
        }
      }

      if (!isMobile && atmosphereMesh && atmosphereMesh.material) {
        // Slow oscillation of size (breathing scale)
        const breatheScale = 1.0 + Math.sin(time * 0.0007) * 0.012;
        atmosphereMesh.scale.set(breatheScale, breatheScale, breatheScale);

        // Modulate glow coefficient (breathing density) if uniform is present
        if (atmosphereMesh.material.uniforms?.coefficient) {
          atmosphereMesh.material.uniforms.coefficient.value = 0.1 + Math.sin(time * 0.0009) * 0.025;
        }
      }

      // 3. Modulate Auto-Rotate Speed (Phase 8 Rotation & Phase 10 Energy + Stop The Earth Rapid Spin)
      const controls = globe.controls();
      if (controls) {
        if (isStopTheEarthSpinningRef.current && !stopAlreadyTriggeredRef.current) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 16.0; // Rapid cinematic 5-second whirl
        } else if (isStopTheEarthActiveRef.current || stopAlreadyTriggeredRef.current) {
          controls.autoRotate = false;
          controls.autoRotateSpeed = 0; // Frozen completely on stop
        } else {
          const baseSpeed = isCinematicModeActive ? 0.75 : GLOBE_CONFIG.autoRotateSpeed;
          // Global excitement accelerates rotation
          const energyMultiplier = 1.0 + (globalEnergyScore / 80);
          // Subtle breathing factor (15s period)
          const breathingFactor = 1.0 + Math.sin(time * 0.0004) * 0.12;
          controls.autoRotateSpeed = baseSpeed * energyMultiplier * breathingFactor;
        }
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

      // 6. Real Animated Wind Particles Update (Phase 2 Weather Intelligence)
      // Skip all weather and planetary layers when in game mode (only real 3D globe)
      if (!isPlayEarthActive) {
        if (windParticleSystemRef.current) {
          windParticleSystemRef.current.update();
        }

        // 7. Real Animated Cyclone & Hurricane Vortices (Phase 1 Atmospheric Dynamics)
        if (cycloneVortexLayerRef.current) {
          const m = cycloneVortexLayerRef.current.getMesh();
          if (m?.visible) {
            cycloneVortexLayerRef.current.update(time, 0.016);
          }
        }

        // 8. Real Animated Earthquake Seismic Pillars & Hypocenters (Phase 2 Geophysics)
        if (seismicShockwaveLayerRef.current) {
          const m = seismicShockwaveLayerRef.current.getMesh();
          if (m?.visible) {
            seismicShockwaveLayerRef.current.update(time, 0.016);
          }
        }

        // 9. Real Animated Lightning Network Flash Engine (Phase 3 Severe Convective Storms)
        if (lightningNetworkLayerRef.current) {
          const m = lightningNetworkLayerRef.current.getMesh();
          if (m?.visible) {
            lightningNetworkLayerRef.current.update(time, 0.016);
          }
        }

        // 10. Real Animated Wildfire Convective Plumes & Smoke Embers (Phase 4 Thermal Physics)
        if (wildfireThermalLayerRef.current) {
          const m = wildfireThermalLayerRef.current.getMesh();
          if (m?.visible) {
            wildfireThermalLayerRef.current.update(time, 0.016);
          }
        }

        // 11. Real Animated Auroral Oval Curtains & Ionospheric Waves (Phase 5 Space Weather)
        if (auroralOvalLayerRef.current) {
          const m = auroralOvalLayerRef.current.getMesh();
          if (m?.visible) {
            auroralOvalLayerRef.current.update(time, 0.016);
          }
        }

        // 12. Real Animated Ocean Current Streamlines & SST Anomaly Vector Engine (Phase 6 Marine Physics)
        if (oceanCurrentsLayerRef.current) {
          const m = oceanCurrentsLayerRef.current.getMesh();
          if (m?.visible) {
            oceanCurrentsLayerRef.current.update(time, 0.016);
          }
        }

        // 13. Live Geostationary Satellite Cloud Cover & Convective Tops Engine (Windy Satellite)
        if (geostationarySatelliteLayerRef.current) {
          geostationarySatelliteLayerRef.current.update(time, 0.016);
        }

        // 14. Mean Sea Level Pressure (MSLP) Isobars & High/Low Synoptic Centers (Windy Isobars)
        if (atmosphericPressureLayerRef.current) {
          atmosphericPressureLayerRef.current.update(time, 0.016);
        }
      }

      // 15. Horizon Occlusion Culling for CSS2D HTML markers
      // Hides markers located on the far hemisphere of the Earth so they never float in outer space
      const currGlobe = globeRef.current;
      if (currGlobe && activeHtmlMarkersRef.current.size > 0) {
        const camera = currGlobe.camera ? currGlobe.camera() : null;
        if (camera) {
          const camPos = camera.position;
          const camDist = camPos.length();
          const globeRadius = currGlobe.getGlobeRadius ? currGlobe.getGlobeRadius() : 100;
          // Exact spherical horizon threshold: cos(theta_h) = globeRadius / camDist
          const horizonCos = (globeRadius / Math.max(camDist, 0.001)) - 0.02;

          activeHtmlMarkersRef.current.forEach((coord, el) => {
            if (!el.isConnected) {
              activeHtmlMarkersRef.current.delete(el);
              return;
            }

            const phi = (90 - coord.lat) * (Math.PI / 180);
            const theta = (90 - coord.lng) * (Math.PI / 180);
            const sinPhi = Math.sin(phi);
            const nx = sinPhi * Math.cos(theta);
            const ny = Math.cos(phi);
            const nz = sinPhi * Math.sin(theta);

            const dot = (nx * camPos.x + ny * camPos.y + nz * camPos.z) / camDist;
            const isVisible = dot > horizonCos;

            if (!isVisible) {
              if (el.style.opacity !== '0') {
                el.style.opacity = '0';
                el.style.pointerEvents = 'none';
                el.style.visibility = 'hidden';
              }
            } else {
              if (el.style.opacity !== '1') {
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
                el.style.visibility = 'visible';
              }
            }
          });
        }
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameId);
  }, [globeRef, introDone, globalEnergyScore, isCinematicModeActive, hasPenaltyShootout, celebration, earthCastActive, earthCastAudioLevel]);

  // ── Weather Layers Three.js Management (Wind, Temperature, Precipitation) ──
  useEffect(() => {
    if (!globeRef.current || !introDone) return;
    const globe = globeRef.current;
    const scene = globe.scene();
    if (!scene) return;

    const isWeather = globeView === 'weather';
    const stations = weatherGridData?.stations || [];
    const radius = globe.getGlobeRadius();

    // 1. Wind Particles Layer: active in 'wind' and 'overview' when viewing weather
    const shouldShowWind = isWeather && (weatherLayerMode === 'wind' || weatherLayerMode === 'overview');
    if (shouldShowWind) {
      if (!windParticleSystemRef.current) {
        windParticleSystemRef.current = new WindParticleSystem({
          radius,
          isMobile,
          reducedMotion: prefersReducedMotion(),
        });
        const mesh = windParticleSystemRef.current.getMesh();
        if (mesh) scene.add(mesh);
      }
      if (stations.length > 0) {
        windParticleSystemRef.current.setStations(stations);
        windParticleSystemRef.current.setHourlyIndex(weatherTimelineIndex);
      }
    } else if (windParticleSystemRef.current) {
      const mesh = windParticleSystemRef.current.getMesh();
      if (mesh) scene.remove(mesh);
      windParticleSystemRef.current.dispose();
      windParticleSystemRef.current = null;
    }

    // 2. Temperature Heatmap Layer: active in 'temperature'
    const shouldShowTemp = isWeather && weatherLayerMode === 'temperature';
    if (shouldShowTemp) {
      if (!temperatureLayerRef.current) {
        temperatureLayerRef.current = new TemperatureHeatmapLayer({
          radius,
          isMobile,
        });
        const mesh = temperatureLayerRef.current.getMesh();
        if (mesh) scene.add(mesh);
      }
      if (stations.length > 0) {
        temperatureLayerRef.current.setStations(stations);
        temperatureLayerRef.current.setHourlyIndex(weatherTimelineIndex);
      }
    } else if (temperatureLayerRef.current) {
      const mesh = temperatureLayerRef.current.getMesh();
      if (mesh) scene.remove(mesh);
      temperatureLayerRef.current.dispose();
      temperatureLayerRef.current = null;
    }

    // 3. Precipitation Layer: active in 'precipitation'
    const shouldShowPrecip = isWeather && weatherLayerMode === 'precipitation';
    if (shouldShowPrecip) {
      if (!precipitationLayerRef.current) {
        precipitationLayerRef.current = new PrecipitationLayer({
          radius,
          isMobile,
        });
        const mesh = precipitationLayerRef.current.getMesh();
        if (mesh) scene.add(mesh);
      }
      if (stations.length > 0) {
        precipitationLayerRef.current.setStations(stations);
        precipitationLayerRef.current.setHourlyIndex(weatherTimelineIndex);
      }
    } else if (precipitationLayerRef.current) {
      const mesh = precipitationLayerRef.current.getMesh();
      if (mesh) scene.remove(mesh);
      precipitationLayerRef.current.dispose();
      precipitationLayerRef.current = null;
    }

    return () => {
      // Discard weather meshes on unmount or when transitioning away from weather view
      if (globeView !== 'weather') {
        if (windParticleSystemRef.current) {
          const m = windParticleSystemRef.current.getMesh();
          if (m) scene.remove(m);
          windParticleSystemRef.current.dispose();
          windParticleSystemRef.current = null;
        }
        if (temperatureLayerRef.current) {
          const m = temperatureLayerRef.current.getMesh();
          if (m) scene.remove(m);
          temperatureLayerRef.current.dispose();
          temperatureLayerRef.current = null;
        }
        if (precipitationLayerRef.current) {
          const m = precipitationLayerRef.current.getMesh();
          if (m) scene.remove(m);
          precipitationLayerRef.current.dispose();
          precipitationLayerRef.current = null;
        }
      }
    };
  }, [globeRef, introDone, globeView, weatherLayerMode, weatherTimelineIndex, weatherGridData, isMobile]);

  // Priority telemetry feed for 3D planetary phenomena: prefer unfiltered allEvents, fallback to events
  const planetaryFeed = useMemo(() => {
    if (allEvents && allEvents.length > 0) return allEvents;
    return events || [];
  }, [allEvents, events]);

  // ── 3D Planetary Geophysics & Weather Layers (Phases 1–6 Mount Lifecycle) ──
  useEffect(() => {
    if (!globeRef.current || !introDone) return;
    const globe = globeRef.current;
    const scene = globe.scene();
    if (!scene) return;

    // In game mode: strictly suppress all weather & planetary disaster layers (only real 3D Earth globe)
    if (isPlayEarthActive) {
      if (cycloneVortexLayerRef.current) {
        const m = cycloneVortexLayerRef.current.getMesh();
        if (m) scene.remove(m);
        cycloneVortexLayerRef.current.dispose();
        cycloneVortexLayerRef.current = null;
      }
      if (seismicShockwaveLayerRef.current) {
        const m = seismicShockwaveLayerRef.current.getMesh();
        if (m) scene.remove(m);
        seismicShockwaveLayerRef.current.dispose();
        seismicShockwaveLayerRef.current = null;
      }
      if (lightningNetworkLayerRef.current) {
        const m = lightningNetworkLayerRef.current.getMesh();
        if (m) scene.remove(m);
        lightningNetworkLayerRef.current.dispose();
        lightningNetworkLayerRef.current = null;
      }
      if (wildfireThermalLayerRef.current) {
        const m = wildfireThermalLayerRef.current.getMesh();
        if (m) scene.remove(m);
        wildfireThermalLayerRef.current.dispose();
        wildfireThermalLayerRef.current = null;
      }
      if (auroralOvalLayerRef.current) {
        const m = auroralOvalLayerRef.current.getMesh();
        if (m) scene.remove(m);
        auroralOvalLayerRef.current.dispose();
        auroralOvalLayerRef.current = null;
      }
      if (oceanCurrentsLayerRef.current) {
        const m = oceanCurrentsLayerRef.current.getMesh();
        if (m) scene.remove(m);
        oceanCurrentsLayerRef.current.dispose();
        oceanCurrentsLayerRef.current = null;
      }
      return;
    }

    const radius = globe.getGlobeRadius();
    const reducedMotion = prefersReducedMotion();

    // 1. Cyclone Vortex Layer (Phase 1 Atmospheric Dynamics)
    if (!cycloneVortexLayerRef.current) {
      cycloneVortexLayerRef.current = new CycloneVortexLayer({
        radius,
        isMobile,
        reducedMotion,
      });
      const mesh = cycloneVortexLayerRef.current.getMesh();
      if (mesh) scene.add(mesh);
    }

    // 2. Seismic Shockwave & Hypocenter Layer (Phase 2 Geophysics)
    if (!seismicShockwaveLayerRef.current) {
      seismicShockwaveLayerRef.current = new SeismicShockwaveLayer({
        radius,
        isMobile,
        reducedMotion,
      });
      const mesh = seismicShockwaveLayerRef.current.getMesh();
      if (mesh) scene.add(mesh);
    }

    // 3. Lightning Network & Severe Convective Layer (Phase 3 Severe Storms)
    if (!lightningNetworkLayerRef.current) {
      lightningNetworkLayerRef.current = new LightningNetworkLayer({
        radius,
        isMobile,
        reducedMotion,
      });
      const mesh = lightningNetworkLayerRef.current.getMesh();
      if (mesh) scene.add(mesh);
    }

    // 4. Wildfire Thermal Plume & Smoke Layer (Phase 4 Thermal Physics)
    if (!wildfireThermalLayerRef.current) {
      wildfireThermalLayerRef.current = new WildfireThermalLayer({
        radius,
        isMobile,
        reducedMotion,
      });
      const mesh = wildfireThermalLayerRef.current.getMesh();
      if (mesh) scene.add(mesh);
    }

    // 5. Auroral Oval & Solar Wind Layer (Phase 5 Space Weather)
    if (!auroralOvalLayerRef.current) {
      auroralOvalLayerRef.current = new AuroralOvalLayer({
        radius,
        isMobile,
        reducedMotion,
      });
      const mesh = auroralOvalLayerRef.current.getMesh();
      if (mesh) scene.add(mesh);
    }

    // 6. Ocean Current Streamlines & Marine Heatwave Layer (Phase 6 Marine Physics)
    if (!oceanCurrentsLayerRef.current) {
      oceanCurrentsLayerRef.current = new OceanCurrentsLayer({
        radius,
        isMobile,
        reducedMotion,
      });
      const mesh = oceanCurrentsLayerRef.current.getMesh();
      if (mesh) scene.add(mesh);
    }

    return () => {
      if (cycloneVortexLayerRef.current) {
        const m = cycloneVortexLayerRef.current.getMesh();
        if (m) scene.remove(m);
        cycloneVortexLayerRef.current.dispose();
        cycloneVortexLayerRef.current = null;
      }
      if (seismicShockwaveLayerRef.current) {
        const m = seismicShockwaveLayerRef.current.getMesh();
        if (m) scene.remove(m);
        seismicShockwaveLayerRef.current.dispose();
        seismicShockwaveLayerRef.current = null;
      }
      if (lightningNetworkLayerRef.current) {
        const m = lightningNetworkLayerRef.current.getMesh();
        if (m) scene.remove(m);
        lightningNetworkLayerRef.current.dispose();
        lightningNetworkLayerRef.current = null;
      }
      if (wildfireThermalLayerRef.current) {
        const m = wildfireThermalLayerRef.current.getMesh();
        if (m) scene.remove(m);
        wildfireThermalLayerRef.current.dispose();
        wildfireThermalLayerRef.current = null;
      }
      if (auroralOvalLayerRef.current) {
        const m = auroralOvalLayerRef.current.getMesh();
        if (m) scene.remove(m);
        auroralOvalLayerRef.current.dispose();
        auroralOvalLayerRef.current = null;
      }
      if (oceanCurrentsLayerRef.current) {
        const m = oceanCurrentsLayerRef.current.getMesh();
        if (m) scene.remove(m);
        oceanCurrentsLayerRef.current.dispose();
        oceanCurrentsLayerRef.current = null;
      }
    };
  }, [globeRef, introDone, isMobile, isPlayEarthActive]);

  // ── Sync Planetary Telemetry Data into Phases 1–6 Layers ──
  useEffect(() => {
    if (cycloneVortexLayerRef.current) {
      cycloneVortexLayerRef.current.setEvents(planetaryFeed);
    }
    if (seismicShockwaveLayerRef.current) {
      seismicShockwaveLayerRef.current.setEvents(planetaryFeed);
    }
    if (lightningNetworkLayerRef.current) {
      lightningNetworkLayerRef.current.setEvents(planetaryFeed);
    }
    if (wildfireThermalLayerRef.current) {
      wildfireThermalLayerRef.current.setEvents(planetaryFeed);
    }
    if (auroralOvalLayerRef.current) {
      auroralOvalLayerRef.current.setEvents(planetaryFeed);
    }
    if (oceanCurrentsLayerRef.current) {
      oceanCurrentsLayerRef.current.setEvents(planetaryFeed);
    }
  }, [planetaryFeed]);

  // ── Sync Three.js Weather & Geophysical Layer Visibility & Categorical Isolation ──
  useEffect(() => {
    const isCycloneVisible = !isPlayEarthActive && (globeView === 'weather' || activeCategory === 'weather' || activeCategory === 'severe_weather' || activeCategory === null);
    if (cycloneVortexLayerRef.current) {
      const mesh = cycloneVortexLayerRef.current.getMesh();
      if (mesh) mesh.visible = isCycloneVisible;
    }

    const isLightningVisible = !isPlayEarthActive && (globeView === 'weather' || activeCategory === 'weather' || activeCategory === 'severe_weather' || activeCategory === null);
    if (lightningNetworkLayerRef.current) {
      const mesh = lightningNetworkLayerRef.current.getMesh();
      if (mesh) mesh.visible = isLightningVisible;
    }

    const isSeismicVisible = !isPlayEarthActive && globeView !== 'weather' && (activeCategory === 'seismic' || activeCategory === null);
    if (seismicShockwaveLayerRef.current) {
      const mesh = seismicShockwaveLayerRef.current.getMesh();
      if (mesh) mesh.visible = isSeismicVisible;
    }

    const isWildfireVisible = !isPlayEarthActive && globeView !== 'weather' && (activeCategory === 'wildfires' || activeCategory === null);
    if (wildfireThermalLayerRef.current) {
      const mesh = wildfireThermalLayerRef.current.getMesh();
      if (mesh) mesh.visible = isWildfireVisible;
    }

    // Auroral oval space weather curtain: ONLY visible in space weather mode, NEVER in weather radar or general overview!
    const isAuroralVisible = !isPlayEarthActive && globeView !== 'weather' && activeCategory === 'space_weather';
    if (auroralOvalLayerRef.current) {
      const mesh = auroralOvalLayerRef.current.getMesh();
      if (mesh) mesh.visible = isAuroralVisible;
    }

    const isOceanVisible = !isPlayEarthActive && (weatherLayerMode === 'marine' || weatherLayerMode === 'waves' || activeCategory === 'climate_oceans');
    if (oceanCurrentsLayerRef.current) {
      const mesh = oceanCurrentsLayerRef.current.getMesh();
      if (mesh) mesh.visible = isOceanVisible;
    }
  }, [globeView, activeCategory, weatherLayerMode, isPlayEarthActive]);

  // When an event dossier report is active, suppress HTML disaster markers so animations never overlap the report
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const markers = document.querySelectorAll('.cyclone-disaster-marker, .thunderstorm-disaster-marker');
    markers.forEach((m: any) => {
      m.style.visibility = selectedEvent ? 'hidden' : 'visible';
    });
  }, [selectedEvent]);

  // ── 3D Geostationary Satellite Cloud Cover Layer (Windy Satellite Visible / Blue / Infra) ──
  useEffect(() => {
    if (!globeRef.current || !introDone) return;
    const globe = globeRef.current;
    const scene = globe.scene();
    if (!scene) return;

    // Only activate in Weather mode when satellite/radar/clouds layer is explicitly chosen (suppressed in game mode)
    const isSatOrWeather = !isPlayEarthActive && globeView === 'weather' && 
      (weatherLayerMode === 'satellite' || weatherLayerMode === 'radar' || weatherLayerMode === 'clouds');

    if (isSatOrWeather) {
      const radius = globe.getGlobeRadius();

      if (!geostationarySatelliteLayerRef.current) {
        geostationarySatelliteLayerRef.current = new GeostationarySatelliteLayer({
          radius,
          isMobile,
          reducedMotion: prefersReducedMotion(),
          initialMode: satelliteSpectralMode,
          overlayRadar,
        });
        const mesh = geostationarySatelliteLayerRef.current.getMesh();
        if (mesh) scene.add(mesh);
      }

      // Update parameters
      geostationarySatelliteLayerRef.current.setSpectralMode(satelliteSpectralMode);
      geostationarySatelliteLayerRef.current.setOverlayRadar(overlayRadar);
      geostationarySatelliteLayerRef.current.setTimeOffsetHours(weatherTimelineIndex);
      geostationarySatelliteLayerRef.current.setEvents(events || []);
    } else if (geostationarySatelliteLayerRef.current) {
      const m = geostationarySatelliteLayerRef.current.getMesh();
      if (m) scene.remove(m);
      geostationarySatelliteLayerRef.current.dispose();
      geostationarySatelliteLayerRef.current = null;
    }

    return () => {
      if (globeView !== 'weather' || isPlayEarthActive) {
        if (geostationarySatelliteLayerRef.current) {
          const m = geostationarySatelliteLayerRef.current.getMesh();
          if (m) scene.remove(m);
          geostationarySatelliteLayerRef.current.dispose();
          geostationarySatelliteLayerRef.current = null;
        }
      }
    };
  }, [globeRef, introDone, globeView, weatherLayerMode, satelliteSpectralMode, overlayRadar, weatherTimelineIndex, events, isMobile, isPlayEarthActive]);

  // ── 3D Mean Sea Level Pressure (MSLP) Isobars & High/Low Layer (Windy Isobars) ──
  useEffect(() => {
    if (!globeRef.current || !introDone) return;
    const globe = globeRef.current;
    const scene = globe.scene();
    if (!scene) return;

    const shouldShow =
      !isPlayEarthActive &&
      (showPressureIsobars || weatherLayerMode === 'pressure') &&
      (globeView === 'weather' || globeView === 'satellite' || weatherLayerMode !== undefined);

    if (shouldShow) {
      const radius = globe.getGlobeRadius();

      if (!atmosphericPressureLayerRef.current) {
        atmosphericPressureLayerRef.current = new AtmosphericPressureLayer({
          radius,
          isMobile,
          reducedMotion: prefersReducedMotion(),
          visible: true,
        });
        const mesh = atmosphericPressureLayerRef.current.getMesh();
        if (mesh) scene.add(mesh);
      }

      atmosphericPressureLayerRef.current.setVisible(true);
      atmosphericPressureLayerRef.current.setEvents(events || []);
    } else if (atmosphericPressureLayerRef.current) {
      atmosphericPressureLayerRef.current.setVisible(false);
    }

    return () => {
      if ((!showPressureIsobars && weatherLayerMode !== 'pressure' || isPlayEarthActive) && atmosphericPressureLayerRef.current) {
        const m = atmosphericPressureLayerRef.current.getMesh();
        if (m) scene.remove(m);
        atmosphericPressureLayerRef.current.dispose();
        atmosphericPressureLayerRef.current = null;
      }
    };
  }, [globeRef, introDone, showPressureIsobars, globeView, weatherLayerMode, events, isMobile, isPlayEarthActive]);

  // Page visibility listener — reduce simulation overhead when hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isReduced = document.hidden || prefersReducedMotion();
      windParticleSystemRef.current?.setReducedMotion(isReduced);
      cycloneVortexLayerRef.current?.setReducedMotion(isReduced);
      seismicShockwaveLayerRef.current?.setReducedMotion(isReduced);
      lightningNetworkLayerRef.current?.setReducedMotion(isReduced);
      wildfireThermalLayerRef.current?.setReducedMotion(isReduced);
      auroralOvalLayerRef.current?.setReducedMotion(isReduced);
      oceanCurrentsLayerRef.current?.setReducedMotion(isReduced);
      geostationarySatelliteLayerRef.current?.setReducedMotion(isReduced);
      atmosphericPressureLayerRef.current?.setReducedMotion(isReduced);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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

  // Fly to selected event, location, or country
  useEffect(() => {
    if (introDone) {
      if (selectedEvent) {
        flyTo({ lat: selectedEvent.lat, lng: selectedEvent.lng, altitude: 1.2 });
        recordInteraction();
      } else if (selectedLocation) {
        const zoomAltitude = selectedLocation.type === 'city' ? 1.15 : selectedLocation.type === 'state' ? 1.45 : 1.8;
        flyTo({ lat: selectedLocation.lat, lng: selectedLocation.lng, altitude: zoomAltitude });
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
  }, [selectedEvent, selectedCountry, selectedLocation, introDone, flyTo, recordInteraction, countries]);

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
    if (!introDone || isFocusMode) return;
    const interval = setInterval(() => {
      if (Date.now() - lastInteractionTime.current < 30000) return;
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      if (randomEvent) onSelectEvent(randomEvent);
    }, 15000);
    return () => clearInterval(interval);
  }, [events, onSelectEvent, introDone, isFocusMode]);

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

      return {
        id: name,
        lat,
        lng,
        name,
        flag,
        labelRank,
        popEst,
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
      // If zoomed out (alt > 1.2) in Europe, show only the major European countries (unless in game mode where all countries must be discoverable)
      if (!isPlayEarthActive && label.isEurope && alt > 1.2) {
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
    } else if (isPlayEarthActive) {
      maxLabels = isMobile ? 14 : 60; // More visible labels during gameplay to easily find nations
    } else if (isMobile) {
      maxLabels = 10;
    } else if (alt > 2.0) {
      maxLabels = 12; // Far Zoom (10-15 target)
    } else if (alt >= 1.0) {
      maxLabels = 30; // Medium Zoom (25-40 target)
    }

    return selected.slice(0, maxLabels);
  }, [labelsData, zoomAltitude, selectedCountry, hoveredPolygon, MAJOR_COUNTRIES, isMobile, liveMatchCountriesMap, categoryMatchingCountriesMap, failsafeActive, isPlayEarthActive]);

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
    
    const planetaryEvents = countryEvents.filter(e => e.category !== 'sports' && e.category !== 'football');
    const sportsEvents = countryEvents.filter(e => e.category === 'sports' || e.category === 'football');
    
    const meta = findCountryMeta(name);
    
    const totalEvents = countryEvents.length > 0 ? countryEvents.length : Math.max(3, (name.length * 3) % 15 + 3);
    const sportsCount = sportsEvents.length * 2 + Math.max(2, (name.length * 3) % 15 + 2);
    const planetaryCount = planetaryEvents.length > 0 ? planetaryEvents.length : Math.max(1, (name.length % 5) + 1);
    
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

    return {
      name,
      capital: meta?.capital || 'N/A',
      population: meta?.population || (selectedCountryFeature.properties.POP_EST ? `${(selectedCountryFeature.properties.POP_EST / 1000000).toFixed(1)}M` : 'N/A'),
      flag: meta?.flag || getFlagEmoji(selectedCountryFeature.properties.ISO_A2),
      eventCount: totalEvents,
      planetaryCount,
      sportsCount,
      temperature: `${currentTemp}°C`,
      weatherCondition: weatherCond,
      weatherAlert: alert,
      lastUpdatedMin: Math.max(1, (name.length * 3) % 15),
    };
  }, [selectedCountryFeature, events]);


  // Combine normal events and celebration uploads
  const combinedHtmlData = useMemo(() => {
    // In gameplay mode, omit news event HTML markers from the 3D globe for maximum performance & clear view
    if (isPlayEarthActive || isStopTheEarthActive) {
      const gameMarkers: any[] = [];
      if (isStopTheEarthActive && stopTheEarthTargetCoord) {
        gameMarkers.push({
          id: `stop-the-earth-beacon-${stopTheEarthTargetCoord.lat.toFixed(2)}-${stopTheEarthTargetCoord.lng.toFixed(2)}`,
          lat: stopTheEarthTargetCoord.lat,
          lng: stopTheEarthTargetCoord.lng,
          isStopTheEarthBeacon: true,
        });
      }
      return gameMarkers;
    }

    const data: any[] = [];

    // In standard / discovery / night / blueprint view, render event markers
    if (globeView !== 'weather') {
      const eventSlice = isMobile ? events.slice(0, 8) : events;
      eventSlice.forEach(e => {
        data.push({ ...e, isEvent: true });
      });

      if (celebrations) {
        const celebSlice = isMobile ? celebrations.slice(0, 2) : celebrations;
        celebSlice.forEach(c => {
          data.push({
            ...c,
            isCelebration: true,
            category: 'sports', // Map category for default fallback styling
          });
        });
      }
    }

    const selLoc = selectedLocation as any;
    if (selLoc && selLoc.type === 'city') {
      // Always add the weather city pin marker for selected location
      data.push({
        id: `weather-city-pin-${selLoc.lat.toFixed(4)}-${selLoc.lng.toFixed(4)}`,
        title: selLoc.name,
        summary: `${selLoc.name}, ${selLoc.state ? selLoc.state + ', ' : ''}${selLoc.country}`,
        category: 'weather',
        country: selLoc.country,
        city: selLoc.name,
        lat: selLoc.lat,
        lng: selLoc.lng,
        isWeatherCityPin: true,
        locationRecord: selLoc,
      });
    }

    // Populate curated anchor cities across continents for planetary location exploration
    if (!selLoc && (globeView === 'weather' || globeView === 'standard' || globeView === 'discovery')) {
      const cityList = locations.filter(l => l.type === 'city');
      const maxWeatherCities = globeView === 'weather' ? (isMobile ? 3 : 6) : (isMobile ? 6 : 12);
      cityList.slice(0, maxWeatherCities).forEach(city => {
        data.push({
          id: `weather-city-pin-${city.lat.toFixed(4)}-${city.lng.toFixed(4)}`,
          title: city.name,
          summary: `${city.name}, ${city.country}`,
          category: 'weather',
          country: city.country,
          city: city.name,
          lat: city.lat,
          lng: city.lng,
          isWeatherCityPin: true,
          locationRecord: city,
        });
      });
    }

    const disasterFeed = (allEvents && allEvents.length > 0) ? allEvents : events;

    // Populate active tropical cyclone & hurricane disaster markers (Windy / NOAA NHC standard)
    if (globeView === 'weather' || weatherLayerMode === 'hurricane' || weatherLayerMode === 'wind') {
      const cycloneList = disasterFeed.filter((e) => {
        const t = (e.title || '').toLowerCase();
        const isExplicitCyclone = e.planetaryTelemetry?.stormWarningType === 'tropical_cyclone';
        return (
          isExplicitCyclone ||
          t.includes('cyclone') ||
          t.includes('hurricane') ||
          t.includes('typhoon') ||
          t.includes('tropical storm')
        );
      });
      const activeCyclones = cycloneList.length > 0 ? cycloneList : BASELINE_CYCLONE_EVENTS;
      activeCyclones.forEach((storm) => {
        data.push({
          id: `cyclone-disaster-${storm.id}`,
          title: storm.title,
          lat: storm.lat,
          lng: storm.lng,
          isCycloneDisaster: true,
          event: storm,
        });
      });
    }

    // Populate active severe thunderstorm & lightning convective complex disaster markers
    if (globeView === 'weather' && (weatherLayerMode === 'precipitation' || weatherLayerMode === 'radar' || weatherLayerMode === 'overview')) {
      const lightningList = disasterFeed.filter((e) => {
        const t = (e.title || '').toLowerCase();
        const isExplicitCyclone = e.planetaryTelemetry?.stormWarningType === 'tropical_cyclone';
        return (
          !isExplicitCyclone &&
          (t.includes('lightning') || t.includes('thunderstorm') || t.includes('convective') || t.includes('squall')) &&
          !t.includes('cyclone') && !t.includes('hurricane') && !t.includes('typhoon')
        );
      });
      const activeLightning = lightningList.length > 0 ? lightningList.slice(0, 3) : BASELINE_LIGHTNING_EVENTS.slice(0, 3);
      activeLightning.forEach((storm) => {
        data.push({
          id: `lightning-disaster-${storm.id}`,
          title: storm.title,
          lat: storm.lat,
          lng: storm.lng,
          isThunderstormDisaster: true,
          event: storm,
        });
      });
    }

    // Populate active earthquake & seismic rupture disaster markers (USGS standard)
    if (globeView === 'weather' || activeCategory === 'seismic') {
      const seismicList = disasterFeed.filter((e) => {
        if (e.category === 'seismic') return true;
        const t = (e.title || '').toLowerCase();
        return t.includes('earthquake') || t.includes('richter') || t.includes('magnitude');
      });
      const activeQuakes = seismicList.length > 0 ? seismicList.slice(0, isMobile ? 2 : 4) : BASELINE_SEISMIC_EVENTS.slice(0, isMobile ? 2 : 4);
      activeQuakes.forEach((quake) => {
        data.push({
          id: `seismic-disaster-${quake.id}`,
          title: quake.title,
          lat: quake.lat,
          lng: quake.lng,
          isSeismicDisaster: true,
          event: quake,
        });
      });
    }

    // Populate active wildfire & thermal hotspot disaster markers (NASA FIRMS / VIIRS standard)
    if (globeView === 'weather' || activeCategory === 'wildfires') {
      const fireList = disasterFeed.filter((e) => {
        if (e.category === 'wildfires') return true;
        const t = (e.title || '').toLowerCase();
        return t.includes('wildfire') || t.includes('bushfire') || t.includes('forest fire');
      });
      const activeFires = fireList.length > 0 ? fireList.slice(0, isMobile ? 2 : 4) : BASELINE_WILDFIRE_EVENTS.slice(0, isMobile ? 2 : 4);
      activeFires.forEach((fire) => {
        data.push({
          id: `wildfire-disaster-${fire.id}`,
          title: fire.title,
          lat: fire.lat,
          lng: fire.lng,
          isWildfireDisaster: true,
          event: fire,
        });
      });
    }

    // Populate active space weather & auroral storm disaster markers (NOAA SWPC standard)
    if (globeView === 'weather' || activeCategory === 'space_weather') {
      const spaceList = disasterFeed.filter((e) => {
        if (e.category === 'space_weather') return true;
        const t = (e.title || '').toLowerCase();
        return t.includes('geomagnetic') || t.includes('aurora') || t.includes('solar storm');
      });
      const activeSpace = spaceList.length > 0 ? spaceList.slice(0, 2) : BASELINE_SPACE_WEATHER_EVENTS.slice(0, 2);
      activeSpace.forEach((sw) => {
        data.push({
          id: `space-weather-disaster-${sw.id}`,
          title: sw.title,
          lat: sw.lat,
          lng: sw.lng,
          isSpaceWeatherDisaster: true,
          event: sw,
        });
      });
    }

    return data;
  }, [events, celebrations, selectedLocation, isStopTheEarthActive, isPlayEarthActive, stopTheEarthTargetCoord, isMobile, globeView, weatherLayerMode, activeCategory]);

  // HTML marker elements
  const htmlMarkerRenderer = useCallback(
     
    (d: any) => {
      const isCelebration = d.isCelebration;
      const markerId = d.id || `${d.lat}-${d.lng}-${isCelebration ? 'celeb' : 'event'}`;
      
      // Return cached element if available to prevent DOM reflow/allocation jank
      // Weather city pin markers get a unique ID per location, so skip cache for stale pins
      if (!d.isWeatherCityPin && htmlMarkersCacheRef.current.has(markerId)) {
        const cached = htmlMarkersCacheRef.current.get(markerId)!;
        activeHtmlMarkersRef.current.set(cached, { lat: Number(d.lat), lng: Number(d.lng) });
        return cached;
      }

      // ── Dedicated Weather City Pin Marker ────────────────────────
      if (d.isWeatherCityPin) {
        if (htmlMarkersCacheRef.current.has(markerId)) {
          const cached = htmlMarkersCacheRef.current.get(markerId)!;
          activeHtmlMarkersRef.current.set(cached, { lat: Number(d.lat), lng: Number(d.lng) });
          return cached;
        }

        const cityName = d.title || d.city || 'Location';
        const countryName = d.country || '';
        const label = countryName ? `${cityName}, ${countryName}` : cityName;
        const isSelected = selectedLocation && (
          selectedLocation.id === d.locationRecord?.id ||
          (selectedLocation.lat === d.lat && selectedLocation.lng === d.lng)
        );

        const el = document.createElement('div');
        el.className = 'weather-city-pin-marker';
        el.style.cssText = `
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          pointer-events: none;
          transform: translateY(-14px);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out;
          opacity: 0;
          visibility: hidden;
          user-select: none;
        `;
        el.innerHTML = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <!-- Sleek pin dot -->
            <div style="
              width: ${isSelected ? '14px' : '10px'}; height: ${isSelected ? '14px' : '10px'};
              border-radius: 50%;
              background: ${isSelected ? '#00ffc4' : '#00e5ff'};
              box-shadow: 0 0 ${isSelected ? '12px rgba(0, 255, 196, 0.9)' : '8px rgba(0, 229, 255, 0.7)'};
              border: 1.5px solid #ffffff;
              z-index: 2;
            "></div>
          </div>
          <!-- Vertical pin tail line -->
          <div style="
            width: 2px; height: 12px;
            background: linear-gradient(to bottom, ${isSelected ? 'rgba(0,255,196,0.9)' : 'rgba(0,229,255,0.8)'}, transparent);
            margin-top: -1px;
          "></div>
          <!-- City label -->
          <div style="
            margin-top: 2px;
            padding: 2px 8px;
            border-radius: 8px;
            background: ${isSelected ? 'rgba(0, 30, 25, 0.94)' : 'rgba(5, 5, 18, 0.88)'};
            border: 1px solid ${isSelected ? 'rgba(0, 255, 196, 0.6)' : 'rgba(0, 229, 255, 0.35)'};
            backdrop-filter: blur(8px);
            white-space: nowrap;
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          ">
            <span style="
              font-size: 10px;
              font-weight: 700;
              color: ${isSelected ? '#00ffc4' : '#00e5ff'};
              letter-spacing: 0.3px;
              font-family: system-ui, -apple-system, sans-serif;
            ">${label}</span>
          </div>
        `;

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'translateY(-18px) scale(1.12)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translateY(-16px) scale(1)';
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
          flyTo({ lat: d.lat, lng: d.lng, altitude: 1.15 }, 1200);
          if (onSelectLocation && d.locationRecord) {
            onSelectLocation(d.locationRecord);
          } else if (onSelectLocation) {
            onSelectLocation({
              id: d.id,
              name: d.city || d.title,
              type: 'city',
              country: d.country,
              countryCode: '',
              lat: d.lat,
              lng: d.lng,
              population: 0,
              timezone: 'UTC',
              adminLevel: 2,
            });
          }
        });

        // Inject keyframe animation if not already present
        if (typeof document !== 'undefined' && !document.getElementById('weather-pin-keyframes')) {
          const style = document.createElement('style');
          style.id = 'weather-pin-keyframes';
          style.textContent = `
            @keyframes weather-pin-pulse {
              0%, 100% { transform: scale(1); opacity: 0.7; }
              50% { transform: scale(1.6); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }

        htmlMarkersCacheRef.current.set(markerId, el);
        activeHtmlMarkersRef.current.set(el, { lat: Number(d.lat), lng: Number(d.lng) });
        return el;
      }

      // ── Dedicated Tropical Cyclone & Hurricane Disaster Marker ────
      if (d.isCycloneDisaster) {
        if (htmlMarkersCacheRef.current.has(markerId)) {
          const cached = htmlMarkersCacheRef.current.get(markerId)!;
          activeHtmlMarkersRef.current.set(cached, { lat: Number(d.lat), lng: Number(d.lng) });
          return cached;
        }

        const storm = d.event as WorldEvent;
        const windSpeed = storm.planetaryTelemetry?.windSpeedKph || 120;
        const catLabel = getCycloneCategoryLabel(windSpeed);

        const el = document.createElement('div');
        el.className = 'cyclone-disaster-marker group';
        el.style.cssText = `
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          pointer-events: none;
          user-select: none;
          transform: translateY(-50%);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out;
          opacity: 0;
          visibility: hidden;
        `;

        el.innerHTML = `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <!-- Outer rotating Coriolis storm eye ring -->
            <div style="
              position: absolute; inset: -4px;
              border-radius: 50%;
              border: 2px dashed rgba(244, 63, 94, 0.85);
              animation: spin 5s linear infinite;
            "></div>
            <!-- Inner glowing eye badge -->
            <div style="
              width: 32px; height: 32px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(13, 17, 38, 0.95) 0%, rgba(225, 29, 72, 0.85) 100%);
              border: 2px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              box-shadow: 0 0 20px rgba(244, 63, 94, 0.9), inset 0 0 8px rgba(255, 255, 255, 0.6);
            ">
              🌀
            </div>
          </div>
          <!-- Storm label badge -->
          <div style="
            margin-top: 4px;
            padding: 2px 8px;
            border-radius: 9999px;
            background: rgba(8, 10, 26, 0.92);
            border: 1px solid rgba(244, 63, 94, 0.6);
            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="font-size: 9px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px;">${storm.title}</span>
            <span style="font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; background: rgba(244, 63, 94, 0.3); color: #fda4af;">${catLabel}</span>
          </div>
        `;

        const triggerCycloneSelect = (e: Event) => {
          e.stopPropagation();
          pauseRotation();
          recordInteraction();
          flyTo({ lat: d.lat, lng: d.lng, altitude: 1.15 }, 1200);
          onSelectEvent(storm);
        };

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translateY(-50%) scale(1)';
        });
        el.addEventListener('touchstart', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        }, { passive: true });

        const stopProp = (e: Event) => e.stopPropagation();
        el.addEventListener('pointerdown', stopProp);
        el.addEventListener('pointerup', stopProp);
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('mouseup', stopProp);

        el.addEventListener('click', triggerCycloneSelect);
        el.addEventListener('touchend', triggerCycloneSelect);

        htmlMarkersCacheRef.current.set(markerId, el);
        activeHtmlMarkersRef.current.set(el, { lat: Number(d.lat), lng: Number(d.lng) });
        return el;
      }

      // ── Dedicated Severe Thunderstorm & Lightning Hotspot Marker ──
      if (d.isThunderstormDisaster) {
        if (htmlMarkersCacheRef.current.has(markerId)) {
          const cached = htmlMarkersCacheRef.current.get(markerId)!;
          activeHtmlMarkersRef.current.set(cached, { lat: Number(d.lat), lng: Number(d.lng) });
          return cached;
        }

        const storm = d.event as WorldEvent;
        const strikeRate = storm.planetaryTelemetry?.lightningStrikeRatePerMin || 90;

        const el = document.createElement('div');
        el.className = 'thunderstorm-disaster-marker group';
        el.style.cssText = `
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          pointer-events: none;
          user-select: none;
          transform: translateY(-50%);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out;
          opacity: 0;
          visibility: hidden;
        `;

        el.innerHTML = `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <!-- Electric pulsing halo -->
            <div style="
              position: absolute; inset: -3px;
              border-radius: 50%;
              border: 2px solid rgba(250, 204, 21, 0.85);
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <!-- Inner core electrical badge -->
            <div style="
              width: 28px; height: 28px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(13, 17, 38, 0.95) 0%, rgba(202, 138, 4, 0.85) 100%);
              border: 2px solid #fef08a;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 0 20px rgba(250, 204, 21, 0.9), inset 0 0 8px rgba(254, 240, 138, 0.6);
            ">
              ⚡
            </div>
          </div>
          <!-- Storm label badge -->
          <div style="
            margin-top: 4px;
            padding: 2px 8px;
            border-radius: 9999px;
            background: rgba(8, 10, 26, 0.92);
            border: 1px solid rgba(250, 204, 21, 0.6);
            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="font-size: 9px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px;">${storm.title}</span>
            <span style="font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; background: rgba(250, 204, 21, 0.3); color: #fef08a;">${strikeRate}/min</span>
          </div>
        `;

        const triggerStormSelect = (e: Event) => {
          e.stopPropagation();
          pauseRotation();
          recordInteraction();
          flyTo({ lat: d.lat, lng: d.lng, altitude: 1.15 }, 1200);
          onSelectEvent(storm);
        };

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translateY(-50%) scale(1)';
        });
        el.addEventListener('touchstart', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        }, { passive: true });

        const stopProp = (e: Event) => e.stopPropagation();
        el.addEventListener('pointerdown', stopProp);
        el.addEventListener('pointerup', stopProp);
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('mouseup', stopProp);

        el.addEventListener('click', triggerStormSelect);
        el.addEventListener('touchend', triggerStormSelect);

        htmlMarkersCacheRef.current.set(markerId, el);
        activeHtmlMarkersRef.current.set(el, { lat: Number(d.lat), lng: Number(d.lng) });
        return el;
      }

      // ── Dedicated Earthquake & Seismic Rupture Disaster Marker ──
      if (d.isSeismicDisaster) {
        if (htmlMarkersCacheRef.current.has(markerId)) {
          const cached = htmlMarkersCacheRef.current.get(markerId)!;
          activeHtmlMarkersRef.current.set(cached, { lat: Number(d.lat), lng: Number(d.lng) });
          return cached;
        }

        const quake = d.event as WorldEvent;
        const mag = typeof quake.planetaryTelemetry?.magnitude === 'number' ? quake.planetaryTelemetry.magnitude : 6.2;

        const el = document.createElement('div');
        el.className = 'seismic-disaster-marker group';
        el.style.cssText = `
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          pointer-events: none;
          user-select: none;
          transform: translateY(-50%);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out;
          opacity: 0;
          visibility: hidden;
        `;

        el.innerHTML = `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <!-- Outer pulsing shockwave rings -->
            <div style="
              position: absolute; inset: -4px;
              border-radius: 50%;
              border: 2px dashed rgba(244, 63, 94, 0.85);
              animation: ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <!-- Inner core seismic badge -->
            <div style="
              width: 28px; height: 28px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(20, 10, 15, 0.95) 0%, rgba(225, 29, 72, 0.85) 100%);
              border: 2px solid #fda4af;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 0 20px rgba(244, 63, 94, 0.9), inset 0 0 8px rgba(253, 164, 175, 0.6);
            ">
              🌋
            </div>
          </div>
          <!-- Quake label badge -->
          <div style="
            margin-top: 4px;
            padding: 2px 8px;
            border-radius: 9999px;
            background: rgba(15, 8, 12, 0.92);
            border: 1px solid rgba(244, 63, 94, 0.6);
            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="font-size: 9px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px;">${quake.title.split('-')[0].trim()}</span>
            <span style="font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; background: rgba(244, 63, 94, 0.35); color: #fda4af;">M ${mag.toFixed(1)}</span>
          </div>
        `;

        const triggerQuakeSelect = (e: Event) => {
          e.stopPropagation();
          pauseRotation();
          recordInteraction();
          flyTo({ lat: d.lat, lng: d.lng, altitude: 1.15 }, 1200);
          onSelectEvent(quake);
        };

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translateY(-50%) scale(1)';
        });
        el.addEventListener('touchstart', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        }, { passive: true });

        const stopProp = (e: Event) => e.stopPropagation();
        el.addEventListener('pointerdown', stopProp);
        el.addEventListener('pointerup', stopProp);
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('mouseup', stopProp);

        el.addEventListener('click', triggerQuakeSelect);
        el.addEventListener('touchend', triggerQuakeSelect);

        htmlMarkersCacheRef.current.set(markerId, el);
        activeHtmlMarkersRef.current.set(el, { lat: Number(d.lat), lng: Number(d.lng) });
        return el;
      }

      // ── Dedicated Wildfire & Thermal Hotspot Disaster Marker ──
      if (d.isWildfireDisaster) {
        if (htmlMarkersCacheRef.current.has(markerId)) {
          const cached = htmlMarkersCacheRef.current.get(markerId)!;
          activeHtmlMarkersRef.current.set(cached, { lat: Number(d.lat), lng: Number(d.lng) });
          return cached;
        }

        const fire = d.event as WorldEvent;
        const frp = typeof fire.planetaryTelemetry?.fireRadiativePowerMw === 'number' ? fire.planetaryTelemetry.fireRadiativePowerMw : 350;

        const el = document.createElement('div');
        el.className = 'wildfire-disaster-marker group';
        el.style.cssText = `
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          pointer-events: none;
          user-select: none;
          transform: translateY(-50%);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out;
          opacity: 0;
          visibility: hidden;
        `;

        el.innerHTML = `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <!-- Outer thermal convective halo -->
            <div style="
              position: absolute; inset: -3px;
              border-radius: 50%;
              border: 2px solid rgba(249, 115, 22, 0.85);
              animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <!-- Inner flame core badge -->
            <div style="
              width: 28px; height: 28px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(20, 10, 5, 0.95) 0%, rgba(234, 88, 12, 0.9) 100%);
              border: 2px solid #fed7aa;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 0 20px rgba(249, 115, 22, 0.9), inset 0 0 8px rgba(254, 215, 170, 0.6);
            ">
              🔥
            </div>
          </div>
          <!-- Fire label badge -->
          <div style="
            margin-top: 4px;
            padding: 2px 8px;
            border-radius: 9999px;
            background: rgba(18, 10, 5, 0.92);
            border: 1px solid rgba(249, 115, 22, 0.6);
            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="font-size: 9px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px;">${fire.title.split('-')[0].trim()}</span>
            <span style="font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; background: rgba(249, 115, 22, 0.35); color: #fed7aa;">${frp} MW</span>
          </div>
        `;

        const triggerFireSelect = (e: Event) => {
          e.stopPropagation();
          pauseRotation();
          recordInteraction();
          flyTo({ lat: d.lat, lng: d.lng, altitude: 1.15 }, 1200);
          onSelectEvent(fire);
        };

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translateY(-50%) scale(1)';
        });
        el.addEventListener('touchstart', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        }, { passive: true });

        const stopProp = (e: Event) => e.stopPropagation();
        el.addEventListener('pointerdown', stopProp);
        el.addEventListener('pointerup', stopProp);
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('mouseup', stopProp);

        el.addEventListener('click', triggerFireSelect);
        el.addEventListener('touchend', triggerFireSelect);

        htmlMarkersCacheRef.current.set(markerId, el);
        activeHtmlMarkersRef.current.set(el, { lat: Number(d.lat), lng: Number(d.lng) });
        return el;
      }

      // ── Dedicated Space Weather & Auroral Storm Disaster Marker ──
      if (d.isSpaceWeatherDisaster) {
        if (htmlMarkersCacheRef.current.has(markerId)) {
          const cached = htmlMarkersCacheRef.current.get(markerId)!;
          activeHtmlMarkersRef.current.set(cached, { lat: Number(d.lat), lng: Number(d.lng) });
          return cached;
        }

        const sw = d.event as WorldEvent;
        const kp = typeof sw.planetaryTelemetry?.kpIndex === 'number' ? sw.planetaryTelemetry.kpIndex : 6.0;

        const el = document.createElement('div');
        el.className = 'space-weather-disaster-marker group';
        el.style.cssText = `
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          pointer-events: none;
          user-select: none;
          transform: translateY(-50%);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out;
          opacity: 0;
          visibility: hidden;
        `;

        el.innerHTML = `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <!-- Outer rotating auroral ring -->
            <div style="
              position: absolute; inset: -4px;
              border-radius: 50%;
              border: 2px dashed rgba(168, 85, 247, 0.85);
              animation: spin 6s linear infinite;
            "></div>
            <!-- Inner cosmic plasma core badge -->
            <div style="
              width: 28px; height: 28px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(13, 10, 28, 0.95) 0%, rgba(126, 34, 206, 0.85) 100%);
              border: 2px solid #d8b4fe;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 0 20px rgba(168, 85, 247, 0.9), inset 0 0 8px rgba(216, 180, 254, 0.6);
            ">
              🌌
            </div>
          </div>
          <!-- Space weather label badge -->
          <div style="
            margin-top: 4px;
            padding: 2px 8px;
            border-radius: 9999px;
            background: rgba(10, 8, 22, 0.92);
            border: 1px solid rgba(168, 85, 247, 0.6);
            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
            backdrop-filter: blur(8px);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="font-size: 9px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px;">${sw.title.split('-')[0].trim()}</span>
            <span style="font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; background: rgba(168, 85, 247, 0.35); color: #e9d5ff;">Kp ${kp.toFixed(1)}</span>
          </div>
        `;

        const triggerSpaceSelect = (e: Event) => {
          e.stopPropagation();
          pauseRotation();
          recordInteraction();
          flyTo({ lat: d.lat, lng: d.lng, altitude: 1.15 }, 1200);
          onSelectEvent(sw);
        };

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translateY(-50%) scale(1)';
        });
        el.addEventListener('touchstart', () => {
          el.style.transform = 'translateY(-50%) scale(1.18)';
        }, { passive: true });

        const stopProp = (e: Event) => e.stopPropagation();
        el.addEventListener('pointerdown', stopProp);
        el.addEventListener('pointerup', stopProp);
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('mouseup', stopProp);

        el.addEventListener('click', triggerSpaceSelect);
        el.addEventListener('touchend', triggerSpaceSelect);

        htmlMarkersCacheRef.current.set(markerId, el);
        activeHtmlMarkersRef.current.set(el, { lat: Number(d.lat), lng: Number(d.lng) });
        return el;
      }

      if (d.isStopTheEarthBeacon) {
        const el = document.createElement('div');
        el.className = 'stop-the-earth-target-beacon';
        el.style.cssText = `
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        `;
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(6,182,212,0.95) 0%, rgba(14,165,233,0.4) 60%, transparent 100%);
            border: 2px solid #00f0ff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 30px rgba(0,240,255,0.95), inset 0 0 12px rgba(0,240,255,0.7);
            font-size: 22px;
            animation: bounce 1.2s infinite;
          ">
            🎯
          </div>
          <div style="
            position: absolute;
            top: 50%; left: 50%;
            width: 60px; height: 60px;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            border: 2px dashed rgba(250,204,21,0.9);
            animation: spin 3s linear infinite;
          "></div>
        `;
        htmlMarkersCacheRef.current.set(markerId, el);
        activeHtmlMarkersRef.current.set(el, { lat: Number(d.lat), lng: Number(d.lng) });
        return el;
      }

      if (isCelebration) {
        const typeEmoji = d.type === 'video' ? '🎥' : d.type === 'image' ? '📸' : '🎤';
        const color = d.type === 'video' ? '#00e5ff' : d.type === 'image' ? '#e040fb' : '#00e676';
        const shadowColor = d.type === 'video' ? 'rgba(0, 229, 255, 0.4)' : d.type === 'image' ? 'rgba(224, 64, 251, 0.4)' : 'rgba(0, 230, 118, 0.4)';

        const el = document.createElement('div');
        el.className = 'globe-celebration-marker';
        el.style.cssText = `
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease-out;
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
        activeHtmlMarkersRef.current.set(el, { lat: Number(d.lat), lng: Number(d.lng) });
        return el;
      }

      const event = d as WorldEvent & { color?: string };
      const config = CATEGORY_MAP[event.category] || CATEGORY_MAP.seismic || { emoji: '🌐', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.5)', bgColor: 'rgba(239, 68, 68, 0.15)' };

      const el = document.createElement('div');
      el.className = 'globe-marker';
      el.style.cssText = `
        position: relative;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease-out;
      `;

      // Inner glowing core with emoji (omit continuous ripple div on mobile for 60fps)
      el.innerHTML = `
        <div style="
          width: ${isMobile ? '24px' : '28px'};
          height: ${isMobile ? '24px' : '28px'};
          border-radius: 50%;
          background: rgba(10,10,15,0.85);
          border: 1.5px solid ${config.color};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px ${config.glowColor};
          font-size: ${isMobile ? '11px' : '13px'};
          position: relative;
          z-index: 2;
          pointer-events: auto;
        ">
          ${config.emoji}
        </div>
        ${!isMobile ? `
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
        "></div>` : ''}
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
        if ((d.isWeatherCityPin || d.isCityPin) && onSelectLocation) {
          flyTo({ lat: d.lat, lng: d.lng, altitude: 1.15 }, 1200);
          if (d.locationRecord) {
            onSelectLocation(d.locationRecord);
          } else {
            onSelectLocation({
              id: d.id,
              name: d.city || d.title,
              type: 'city',
              country: d.country,
              countryCode: '',
              lat: d.lat,
              lng: d.lng,
              population: 0,
              timezone: 'UTC',
              adminLevel: 2,
            });
          }
          return;
        }
        onSelectEvent(event);
      });

      htmlMarkersCacheRef.current.set(markerId, el);
      activeHtmlMarkersRef.current.set(el, { lat: Number(d.lat), lng: Number(d.lng) });
      return el;
    },
    [onSelectEvent, pauseRotation, recordInteraction, onSelectCelebration, flyTo, onSelectLocation, selectedLocation]
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
    if (globeView === 'night') {
      if (isSelected) return 'rgba(0, 229, 255, 0.2)';
      return 'rgba(0, 0, 0, 0)'; // Fully transparent caps so city night lights shine through!
    }

    if (globeView === 'satellite') {
      if (isSelected) return 'rgba(255, 255, 255, 0.20)';
      if (hoveredPolygon && hoveredPolygon.properties.NAME === name) return 'rgba(255, 255, 255, 0.08)';
      return 'rgba(0, 0, 0, 0)'; // 100% crystal-clear transparent flat cap so daytime satellite surface is completely visible
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

    if (globeView === 'discovery' || isPlayEarthActive) {
      if (isSelected) {
        return 'rgba(16, 185, 129, 0.65)'; // High-visibility emerald target glow
      }
      if (hoveredPolygon && hoveredPolygon.properties.NAME === name) {
        return 'rgba(0, 229, 255, 0.35)'; // High-visibility cyan hover highlight
      }
      // Crystal clear transparent caps so the daytime Earth map is 100% visible
      return 'rgba(255, 255, 255, 0.02)';
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

    // Continental Landmass Glow (Phase 2.2)
    if (selectedContinent && continentCountriesMap[name.toLowerCase()]) {
      return 'rgba(0, 229, 255, 0.22)'; // Soft cyber-cyan continental aura
    }

    // 5. Category-Aware Globe Glow (Feature 2) (O(1) lookup)
    if (activeCategory) {
      const hasMatchingEvent = !!categoryMatchingCountriesMap[name];
      
      if (hasMatchingEvent) {
        switch (activeCategory) {
          case 'sports':
          case 'football':
            return `rgba(16, 185, 129, 0.45)`; // Green
          case 'weather':
          case 'severe_weather':
            return `rgba(249, 115, 22, 0.45)`; // Orange
          case 'seismic':
          case 'wildfires':
            return `rgba(239, 68, 68, 0.45)`; // Red
          case 'space_weather':
          case 'climate_oceans':
          case 'science_nature':
            return `rgba(59, 130, 246, 0.45)`; // Cyan/Blue
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
  }, [globalMood, selectedCountry, getEmotionColorForCountry, celebration, liveMatchCountriesMap, adjustOpacity, categoryMatchingCountriesMap, isPlayEarthActive, activeCategory, globeView, selectedContinent, continentCountriesMap]);

  // Polygon Altitude (3D Emotional Heatmap + Celebration + Live Match)
  const getPolygonAltitude = useCallback((feat: any) => {
    // Failsafe Mode (Rule 11) or Mobile: force flat 3D mesh altitude to eliminate thousands of side-wall polygons
    if (failsafeActive || isMobile) {
      const name = feat.properties.NAME;
      if (selectedCountry === name) return 0.04;
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

    if (globeView === 'discovery' || isPlayEarthActive) {
      if (isSelected) return 0.08;
      if (hoveredPolygon && hoveredPolygon.properties.NAME === name) return 0.04;
      return 0.003;
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

    if (selectedContinent && continentCountriesMap[name.toLowerCase()]) {
      return 0.035; // Macroscopic elevation for active continent
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
  }, [globalMood, selectedCountry, getEmotionColorForCountry, celebration, liveMatchCountriesMap, globeView, failsafeActive, selectedContinent, continentCountriesMap]);

  // Polygon Side Glow (Matching Cap Color)
  const getPolygonSideColor = useCallback((feat: any) => {
    // Failsafe Mode (Rule 11) or Mobile: disable expensive side-wall color calculations
    if (failsafeActive || isMobile) {
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

    if (globeView === 'discovery' || isPlayEarthActive) {
      return isSelected ? 'rgba(16, 185, 129, 0.8)' : 'rgba(0, 229, 255, 0.25)';
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

    if (selectedContinent && continentCountriesMap[name.toLowerCase()]) {
      return 'rgba(0, 255, 196, 0.85)'; // Radiant emerald-cyan boundary for continental unit
    }
    
    if (hoveredPolygon && hoveredPolygon.properties.NAME === name) {
      return 'rgba(255, 255, 255, 0.7)'; // Bright white on hover
    }

    if (globeView === 'discovery' || isPlayEarthActive) {
      if (hoveredPolygon && hoveredPolygon.properties.NAME === name) {
        return 'rgba(255, 255, 255, 1.0)'; // Pure bright white border on hover
      }
      return 'rgba(0, 229, 255, 0.7)'; // Clear bright cyan borders
    }

    if (globeView === 'satellite' || globeView === 'night' || globeView === 'standard') {
      return 'rgba(255, 255, 255, 0.04)'; // Clean seamless surface without harsh white border lining
    }
    
    return 'rgba(255, 255, 255, 0.05)'; // Clean minimal borders so globe features are clearly visible
  }, [selectedCountry, hoveredPolygon, adjustOpacity, globeView, failsafeActive, selectedContinent, continentCountriesMap]);

  // Unified pointer handler for STOP THE EARTH using Three.js Raycaster
  const handleStopTheEarthPointer = useCallback((clientX: number, clientY: number, fallbackCoords?: { lat: number; lng: number }) => {
    // Only active during spinning phase
    if (!isStopTheEarthSpinningRef.current) return;
    // Section 8: Prevent double click. First valid click wins!
    if (stopAlreadyTriggeredRef.current) return;

    const globe = globeRef.current;
    if (!globe) return;

    let finalLat: number | null = null;
    let finalLng: number | null = null;

    // 1. Raycaster calculation via toGlobeCoords(x, y)
    const renderer = globe.renderer?.();
    const domElement = renderer?.domElement;
    if (domElement) {
      const rect = domElement.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        const globeCoords = globe.toGlobeCoords?.(x, y);
        if (globeCoords && typeof globeCoords.lat === 'number' && typeof globeCoords.lng === 'number') {
          finalLat = globeCoords.lat;
          finalLng = globeCoords.lng;
        }
      }
    }

    // 2. Direct Three.js Raycaster intersection against globe mesh
    if (finalLat === null || finalLng === null) {
      if (fallbackCoords && typeof fallbackCoords.lat === 'number' && typeof fallbackCoords.lng === 'number') {
        finalLat = fallbackCoords.lat;
        finalLng = fallbackCoords.lng;
      } else if (domElement && globe.camera && globe.scene) {
        const camera = globe.camera();
        const scene = globe.scene();
        const rect = domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const hit = intersects.find((i: any) => {
          const obj = i.object;
          return obj && (obj.__globeObjType || obj.parent?.__globeObjType || obj.type === 'Mesh');
        });
        if (hit && globe.toGeoCoords) {
          const geo = globe.toGeoCoords(hit.point);
          if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number') {
            finalLat = geo.lat;
            finalLng = geo.lng;
          }
        }
      }
    }

    // 3. Section 4: "if pointer does not intersect globe: ignore interaction"
    if (finalLat === null || finalLng === null) {
      return;
    }

    // Mark stop already triggered so double click is ignored
    stopAlreadyTriggeredRef.current = true;

    // Immediately freeze the globe rotation at exact current orientation
    freezeRotation();

    // Immediately notify with exact coordinates
    if (onStopTheEarthCoordCaptured) {
      onStopTheEarthCoordCaptured({
        lat: finalLat,
        lng: finalLng,
        timestamp: Date.now(),
      });
    }
  }, [freezeRotation, globeRef, onStopTheEarthCoordCaptured]);

  // Attach immediate pointerdown listener to canvas for zero-delay stop
  useEffect(() => {
    if (!globeRef.current) return;
    const renderer = globeRef.current.renderer?.();
    const domElement = renderer?.domElement;
    if (!domElement) return;

    const onCanvasPointerDown = (e: PointerEvent) => {
      if (!isStopTheEarthSpinningRef.current) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      handleStopTheEarthPointer(e.clientX, e.clientY);
    };

    domElement.addEventListener('pointerdown', onCanvasPointerDown, { capture: true, passive: true });
    return () => {
      domElement.removeEventListener('pointerdown', onCanvasPointerDown, { capture: true } as any);
    };
  }, [globeRef, handleStopTheEarthPointer]);

  const handlePolygonClick = useCallback((feat: any, event?: any, coords?: { lat: number; lng: number; altitude: number }) => {
    if (isStopTheEarthSpinningRef.current) {
      const clientX = typeof event?.clientX === 'number' ? event.clientX : (window.innerWidth / 2);
      const clientY = typeof event?.clientY === 'number' ? event.clientY : (window.innerHeight / 2);
      handleStopTheEarthPointer(clientX, clientY, coords);
      return;
    }
    if (isStopTheEarthActiveRef.current) {
      return;
    }

    const name = feat?.properties?.NAME;
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
  }, [onSelectCountry, onSelectEvent, pauseRotation, recordInteraction, handleStopTheEarthPointer]);

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

  const handleGlobeClick = useCallback((coords?: { lat: number; lng: number }, event?: any) => {
    if (isStopTheEarthSpinningRef.current) {
      const clientX = typeof event?.clientX === 'number' ? event.clientX : (window.innerWidth / 2);
      const clientY = typeof event?.clientY === 'number' ? event.clientY : (window.innerHeight / 2);
      handleStopTheEarthPointer(clientX, clientY, coords);
      return;
    }
    if (isStopTheEarthActiveRef.current) {
      return;
    }

    // Direct 3D Surface Proximity Tap: if user clicks near an active natural disaster (cyclone, earthquake, wildfire, storm, auroral center)
    if (coords && combinedHtmlData.length > 0) {
      const hitDisaster = combinedHtmlData.find((item: any) => {
        if (!item.event || (!item.isCycloneDisaster && !item.isThunderstormDisaster && !item.isSeismicDisaster && !item.isWildfireDisaster && !item.isSpaceWeatherDisaster)) return false;
        const dLat = Math.abs(item.lat - coords.lat);
        let dLng = Math.abs(item.lng - coords.lng);
        if (dLng > 180) dLng = 360 - dLng;
        // Cyclones have large gale envelopes (~7 deg / ~770km), other disasters ~4.5 deg (~500km)
        const maxDistSq = item.isCycloneDisaster ? 49.0 : 20.25;
        return (dLat * dLat + dLng * dLng) < maxDistSq;
      });

      if (hitDisaster && hitDisaster.event) {
        pauseRotation();
        recordInteraction();
        flyTo({ lat: hitDisaster.lat, lng: hitDisaster.lng, altitude: 1.15 }, 1200);
        onSelectEvent(hitDisaster.event);
        return;
      }
    }

    onSelectEvent(null);
    if (onSelectCountry) onSelectCountry(null);
    if (onGlobeClick && coords) onGlobeClick(coords);
    resumeRotation();
    recordInteraction();
  }, [onSelectEvent, onSelectCountry, onGlobeClick, resumeRotation, recordInteraction, handleStopTheEarthPointer, combinedHtmlData, pauseRotation, flyTo]);

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
    powerPreference: 'high-performance' as const,
    precision: isMobile ? ('mediump' as const) : ('highp' as const)
  }), [isMobile]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full isolate z-0"
      id="globe-container"
      style={{
        opacity: 1,
        touchAction: 'none',
        isolation: 'isolate',
      }}
      onPointerDown={(e) => {
        recordInteraction();
        if (isStopTheEarthSpinningRef.current) {
          handleStopTheEarthPointer(e.clientX, e.clientY);
        }
      }}
      onWheel={recordInteraction}
      onMouseLeave={() => setHoveredPolygon(null)}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}

          // Textures & Atmosphere (Rule 1 & Rule 2 & Rule 11)
          globeImageUrl={globeTextureUrl}
          bumpImageUrl={failsafeActive || isMobile ? "" : GLOBE_CONFIG.bumpImageUrl}
          backgroundImageUrl=""
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor={
            celebration?.active 
              ? celebration.colors.primary 
              : (globeView === 'discovery' || isPlayEarthActive)
              ? '#55ccff'
              : globeView === 'night'
              ? '#00e5ff'
              : (globeView === 'weather' || globeView === 'satellite')
              ? '#87ceeb'
              : GLOBE_CONFIG.atmosphereColor
          }
          atmosphereAltitude={
            celebration?.active 
              ? (isMobile ? 0.35 : 0.4) 
              : failsafeActive
              ? 0.05
              : (globeView === 'discovery' || isPlayEarthActive)
              ? 0.16
              : globeView === 'night'
              ? 0.28
              : (globeView === 'weather' || globeView === 'satellite')
              ? 0.15
              : (isMobile ? 0.2 : GLOBE_CONFIG.atmosphereAltitude)
          }

          // HTML markers
          htmlElementsData={combinedHtmlData}
          htmlElement={htmlMarkerRenderer}
          htmlAltitude={GLOBE_CONFIG.markerAltitude}

          // Polygons (Countries)
          polygonsData={countries}
          polygonCapColor={getPolygonColor}
          polygonSideColor={getPolygonSideColor}
          polygonStrokeColor={getPolygonStrokeColor}
          polygonAltitude={getPolygonAltitude}
          polygonsTransitionDuration={failsafeActive || isMobile ? 0 : 600} // Disable transitions on mobile for 60fps
          onPolygonClick={handlePolygonClick}
          onPolygonHover={isMobile ? undefined : handlePolygonHover} // Disable raycasting hover queries on touch screens

          // Labels (Feature 1, 7, 10, 4)
          labelsData={filteredLabels}
          labelLat={(d: any) => d.lat}
          labelLng={(d: any) => d.lng}
          labelText={(d: any) => {
            const hasLiveMatch = !!liveMatchCountriesMap[d.name];
            
            // 3D Canvas text rendering struggles with emojis universally, causing [?] boxes.
            // Stripping all flags and emojis completely to ensure clean text rendering.
            
            // Fix: Three.js default font crashes on accents/diacritics (e.g. Côte d'Ivoire, Curaçao)
            // with "Cannot read properties of undefined (reading 'yMax')". 
            // We must normalize to pure ASCII.
            const asciiName = d.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x00-\x7F]/g, "");

            let text = asciiName;
            if (isPlayEarthActive) {
              text = asciiName;
            } else if (hasLiveMatch) {
              text = `${asciiName} LIVE`;
            }
            
            return text;
          }}
          labelColor={(d: any) => {
            if (selectedCountry && matchCountryNames(selectedCountry, d.name)) {
              return '#00ffc4'; // Bright emerald cyan
            }
            if (hoveredPolygon && matchCountryNames(hoveredPolygon.properties.NAME, d.name)) {
              return '#ffffff'; // Bright pure white
            }
            return (globeView === 'discovery' || isPlayEarthActive) ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
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
      {/* Hidden in production — only shown in development for debugging */}
      {process.env.NODE_ENV !== 'production' && (
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
      )}

      {/* Instant Disaster Title HUD Pill (shows instantly when touching or selecting any natural disaster) */}
      <AnimatePresence>
        {selectedEvent && !isPlayEarthActive && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] max-w-[92vw] sm:max-w-md pointer-events-auto cursor-pointer"
            onClick={() => onSelectEvent(selectedEvent)}
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0d1126]/95 via-[#18112c]/95 to-[#0d1126]/95 border border-rose-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_24px_rgba(244,63,94,0.35)] backdrop-blur-xl">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
                {selectedEvent.category === 'severe_weather' && (selectedEvent.title.toLowerCase().includes('cyclone') || selectedEvent.title.toLowerCase().includes('typhoon') || selectedEvent.title.toLowerCase().includes('hurricane')) ? '🌀' :
                 selectedEvent.category === 'severe_weather' ? '⚡' :
                 selectedEvent.category === 'seismic' ? '🌋' :
                 selectedEvent.category === 'wildfires' ? '🔥' : '⚠️'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-white text-xs sm:text-sm truncate tracking-tight">{selectedEvent.title}</h4>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/40 shrink-0">
                    LIVE
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/60 truncate">
                  <span>{selectedEvent.city ? `${selectedEvent.city}, ` : ''}{selectedEvent.country || 'Global Telemetry'}</span>
                  {selectedEvent.planetaryTelemetry?.windSpeedKph && (
                    <span className="text-cyan-300 font-bold">• {selectedEvent.planetaryTelemetry.windSpeedKph} km/h</span>
                  )}
                  {selectedEvent.planetaryTelemetry?.magnitude && (
                    <span className="text-amber-300 font-bold">• M {selectedEvent.planetaryTelemetry.magnitude.toFixed(1)}</span>
                  )}
                  {selectedEvent.planetaryTelemetry?.fireRadiativePowerMw && (
                    <span className="text-orange-300 font-bold">• {selectedEvent.planetaryTelemetry.fireRadiativePowerMw} MW</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEvent(null);
                }}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating details card (Feature 2 & Feature 8) */}
      <AnimatePresence>
        {selectedCountry && countryStats && !isDashboardOpen && !isPlayEarthActive && (
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
                <CountryFlag flag={countryStats.flag} className="w-6 h-4 object-cover rounded-[2px] shadow-sm shrink-0" />
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
            {activeCategory === 'sports' || activeCategory === 'football' ? (
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between text-white/80">
                  <span>⚽ Sports Events</span>
                  <span className="font-bold text-emerald-400">{countryStats.sportsCount}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>🏆 National Team Updates</span>
                  <span className="text-emerald-400/90 font-bold">Active</span>
                </div>
                <div className="text-[9px] text-white/30 italic mt-1">Live Football Telemetry</div>
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
            ) : activeCategory === 'seismic' || activeCategory === 'severe_weather' || activeCategory === 'wildfires' ? (
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between text-white/80">
                  <span>🌋 Earth Observatories</span>
                  <span className="font-bold text-amber-400">{countryStats.planetaryCount}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>📡 Telemetry Sensor Grid</span>
                  <span className="text-cyan-400/90 font-bold">Online</span>
                </div>
                <div className="text-[9px] text-white/30 italic mt-1">Real-time USGS & NASA feed</div>
              </div>
            ) : (
              // Default Stats View
              <div className="text-[10px] space-y-1 text-white/75">
                <div className="flex justify-between">
                  <span>👥 Population</span>
                  <span className="font-bold text-white">{countryStats.population}</span>
                </div>
                <div className="flex justify-between">
                  <span>🌐 Active Events</span>
                  <span className="font-bold text-cyan-400">{countryStats.eventCount} Pulses</span>
                </div>
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
});

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

export default GlobeScene;
