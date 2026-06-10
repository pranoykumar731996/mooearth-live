// ============================================================
// EarthPulse AI — Globe Scene (Dynamic Import Wrapper)
// ============================================================

'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { WorldEvent, EventArc } from '@/types';
import { CATEGORY_MAP, GLOBE_CONFIG } from '@/lib/constants';
import { useGlobeControls } from '@/hooks/useGlobeControls';
import EventPopup from './EventPopup';
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
}

export default function GlobeScene({
  events,
  selectedEvent,
  onSelectEvent,
}: GlobeSceneProps) {
  const { globeRef, initControls, flyTo, pauseRotation, resumeRotation } = useGlobeControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [introDone, setIntroDone] = useState(false);
  const lastInteractionTime = useRef<number>(Date.now());

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
    
    // Check if clouds already added
    if (scene.children.some((c: any) => c.name === 'clouds')) return;

    // Enhance globe material
    const globeMaterial = globe.globeMaterial();
    globeMaterial.bumpScale = 15;
    globeMaterial.specular = new THREE.Color('grey');
    globeMaterial.shininess = 35;

    // Add clouds
    new THREE.TextureLoader().load(GLOBE_CONFIG.cloudsImageUrl, (cloudsTexture) => {
      const cloudsGeometry = new THREE.SphereGeometry(globe.getGlobeRadius() * 1.006, 75, 75);
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

      const rotateClouds = () => {
        clouds.rotation.y += 0.0002;
        requestAnimationFrame(rotateClouds);
      };
      rotateClouds();
    });

    // Enhance lighting
    const directionalLight = scene.children.find((obj3d: any) => obj3d.type === 'DirectionalLight');
    if (directionalLight) {
      directionalLight.intensity = 3.5;
      directionalLight.position.set(1, 1, 1); // Adjust angle for better dramatic effect
    }
    
    const ambientLight = scene.children.find((obj3d: any) => obj3d.type === 'AmbientLight');
    if (ambientLight) {
      ambientLight.intensity = 0.5; // Slightly brighter ambient
    }
  }, [globeRef, introDone]);

  // Fly to selected event
  useEffect(() => {
    if (selectedEvent && introDone) {
      flyTo({ lat: selectedEvent.lat, lng: selectedEvent.lng, altitude: 1.2 });
      recordInteraction();
    }
  }, [selectedEvent, flyTo, introDone, recordInteraction]);

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

  // Connection arcs — pair adjacent events
  const arcsData = useMemo<EventArc[]>(() => {
    const arcs: EventArc[] = [];
    for (let i = 0; i < events.length; i += 2) {
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
  }, [events]);

  // Ring data
  const ringsData = useMemo(
    () =>
      events.map((e) => ({
        lat: e.lat,
        lng: e.lng,
        maxR: GLOBE_CONFIG.ringMaxRadius,
        propagationSpeed: GLOBE_CONFIG.ringPropagationSpeed,
        repeatPeriod: GLOBE_CONFIG.ringRepeatPeriod,
        color: CATEGORY_MAP[e.category].glowColor,
        event: e,
      })),
    [events]
  );

  // HTML marker elements
  const htmlMarkerRenderer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => {
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
    [onSelectEvent, pauseRotation, recordInteraction]
  );

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
          globeImageUrl={GLOBE_CONFIG.globeImageUrl}
          bumpImageUrl={GLOBE_CONFIG.bumpImageUrl}
          backgroundImageUrl=""
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={true}
          atmosphereColor={GLOBE_CONFIG.atmosphereColor}
          atmosphereAltitude={GLOBE_CONFIG.atmosphereAltitude}

          // Connection Arcs
          arcsData={arcsData}
          arcColor="color"
          arcDashLength={GLOBE_CONFIG.arcDashLength}
          arcDashGap={GLOBE_CONFIG.arcDashGap}
          arcDashInitialGap={GLOBE_CONFIG.arcDashInitialGap}
          arcDashAnimateTime={GLOBE_CONFIG.arcDashAnimateTime}
          arcAltitude={GLOBE_CONFIG.arcAltitude}

          // HTML markers
          htmlElementsData={events}
          htmlElement={htmlMarkerRenderer}
          htmlAltitude={GLOBE_CONFIG.markerAltitude}

          // Rings
          ringsData={ringsData}
          ringColor="color"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"

          // Globe interaction
          onGlobeClick={() => {
            onSelectEvent(null);
            resumeRotation();
            recordInteraction();
          }}

          // Performance
          animateIn={true}
          rendererConfig={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        />
      )}

      {/* Event popup overlay */}
      <EventPopup
        event={selectedEvent}
        onClose={() => {
          onSelectEvent(null);
          resumeRotation();
        }}
      />
    </div>
  );
}
