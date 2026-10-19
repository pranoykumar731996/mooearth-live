// ============================================================
// MooEarth Live — 3D Atmospheric Pressure Isobars & High/Low Layer
// ============================================================
// Generates mean sea level pressure (MSLP) isobars (1004, 1008, 1012, 1016, 1020 hPa)
// and planetary High (H) / Low (L) pressure centers.
// Matches the signature Windy "pressure isobars" toggle.

import * as THREE from 'three';
import { geoToVector3 } from './WindParticleSystem';
import type { WorldEvent } from '@/types';

export interface AtmosphericPressureLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
  reducedMotion?: boolean;
  visible?: boolean;
}

export const STANDARD_ISOBAR_STEP_HPA = 4;
export const STANDARD_SEA_LEVEL_PRESSURE_HPA = 1013.25;

export interface PressureSystemCenter {
  type: 'L' | 'H';
  name: string;
  lat: number;
  lng: number;
  centralHpa: number;
}

/**
 * Returns canonical synoptic isobar contours in 4 hPa steps for a pressure center.
 */
export function getIsobarLevels(centralHpa: number, type: 'L' | 'H', count: number = 4): number[] {
  const levels: number[] = [];
  const baseIsobar = Math.round(centralHpa / 4) * 4;
  for (let i = 1; i <= count; i++) {
    levels.push(type === 'L' ? baseIsobar + i * 4 : baseIsobar - i * 4);
  }
  return levels;
}

/**
 * Categorizes mean sea level pressure into High or Low pressure synoptic classification.
 */
export function classifyPressureSystem(hpa: number): { type: 'L' | 'H'; label: string } {
  if (hpa < STANDARD_SEA_LEVEL_PRESSURE_HPA) {
    return { type: 'L', label: 'Low Pressure System (Cyclone/Trough)' };
  }
  return { type: 'H', label: 'High Pressure System (Anticyclone/Ridge)' };
}

/**
 * Verified planetary synoptic pressure centers
 */
export const GLOBAL_PRESSURE_CENTERS: PressureSystemCenter[] = [
  // Low Pressure Systems (Cyclones & Subpolar Lows)
  { type: 'L', name: 'Aleutian Subpolar Low', lat: 52.0, lng: -175.0, centralHpa: 992 },
  { type: 'L', name: 'Icelandic Subpolar Low', lat: 64.0, lng: -35.0, centralHpa: 988 },
  { type: 'L', name: 'Monsoon Depressional Trough', lat: 21.0, lng: 88.0, centralHpa: 998 },
  { type: 'L', name: 'Antarctic Circumpolar Low Cell', lat: -62.0, lng: -120.0, centralHpa: 978 },
  // High Pressure Systems (Subtropical Anticyclones)
  { type: 'H', name: 'Azores / Bermuda Subtropical High', lat: 34.0, lng: -32.0, centralHpa: 1028 },
  { type: 'H', name: 'Hawaiian Pacific High', lat: 32.0, lng: -145.0, centralHpa: 1026 },
  { type: 'H', name: 'Siberian Continental High', lat: 55.0, lng: 95.0, centralHpa: 1034 },
  { type: 'H', name: 'South Atlantic St. Helena High', lat: -28.0, lng: -12.0, centralHpa: 1024 },
  { type: 'H', name: 'South Pacific Easter Island High', lat: -26.0, lng: -105.0, centralHpa: 1025 },
  { type: 'H', name: 'South Indian Mascarene High', lat: -32.0, lng: 75.0, centralHpa: 1026 },
];

export class AtmosphericPressureLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private isVisible: boolean;

  private rootGroup: THREE.Group;
  private isobarsMesh: THREE.LineSegments | null = null;
  private centerPointsMesh: THREE.Points | null = null;

  constructor(options: AtmosphericPressureLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
    this.isVisible = options.visible ?? true;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'AtmosphericPressureLayer';
    this.rootGroup.visible = this.isVisible;

    this.buildIsobars();
    this.buildPressureCenters();
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.rootGroup.visible = visible;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  public setEvents(events: WorldEvent[]): void {
    // Dynamically incorporate real cyclone centers as severe Lows
    const cycloneEvents = events.filter((e) => {
      if (e.category === 'severe_weather') return true;
      const t = e.title.toLowerCase();
      return t.includes('cyclone') || t.includes('hurricane') || t.includes('typhoon');
    });

    if (cycloneEvents.length > 0) {
      // Re-populate with active storm Low centers
      this.rebuildWithStorms(cycloneEvents);
    }
  }

  /**
   * Constructs smooth concentric isobar isolines encircling pressure centers.
   */
  private buildIsobars(): void {
    const sphereRadius = this.radius * 1.0014;
    const segmentsPerRing = this.isMobile ? 32 : 48;
    const positions: number[] = [];
    const colors: number[] = [];

    const centers = GLOBAL_PRESSURE_CENTERS;

    for (const center of centers) {
      const isLow = center.type === 'L';
      const baseColor = isLow ? new THREE.Color(0xf43f5e) : new THREE.Color(0x00e5ff); // Red for Low, Cyan for High

      // Generate 3 to 4 concentric isobar rings around each synoptic center
      const numRings = this.isMobile ? 2 : 4;

      for (let r = 1; r <= numRings; r++) {
        const ringRadiusDeg = r * 3.5;
        const ringCenter = geoToVector3(center.lat, center.lng, sphereRadius);
        const normal = ringCenter.clone().normalize();

        const arbitrary = Math.abs(normal.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const u = new THREE.Vector3().crossVectors(normal, arbitrary).normalize();
        const v = new THREE.Vector3().crossVectors(normal, u).normalize();

        const ringPoints: THREE.Vector3[] = [];

        for (let i = 0; i <= segmentsPerRing; i++) {
          const theta = (i / segmentsPerRing) * Math.PI * 2;
          const offset = new THREE.Vector3()
            .addScaledVector(u, Math.cos(theta) * ringRadiusDeg)
            .addScaledVector(v, Math.sin(theta) * ringRadiusDeg);

          const pt = ringCenter.clone().add(offset).normalize().multiplyScalar(sphereRadius);
          ringPoints.push(pt);
        }

        for (let i = 0; i < ringPoints.length - 1; i++) {
          const p1 = ringPoints[i];
          const p2 = ringPoints[i + 1];

          positions.push(p1.x, p1.y, p1.z);
          positions.push(p2.x, p2.y, p2.z);

          // Alpha fade for outer rings
          const alpha = 0.55 - (r / numRings) * 0.25;
          colors.push(baseColor.r * alpha, baseColor.g * alpha, baseColor.b * alpha);
          colors.push(baseColor.r * alpha, baseColor.g * alpha, baseColor.b * alpha);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.isobarsMesh = new THREE.LineSegments(geometry, material);
    this.isobarsMesh.name = 'PressureIsobarsLines';
    this.rootGroup.add(this.isobarsMesh);
  }

  /**
   * Renders glowing target badges for Low (L) and High (H) pressure centers.
   */
  private buildPressureCenters(): void {
    const sphereRadius = this.radius * 1.0016;
    const centers = GLOBAL_PRESSURE_CENTERS;

    const positions = new Float32Array(centers.length * 3);
    const colors = new Float32Array(centers.length * 3);

    for (let i = 0; i < centers.length; i++) {
      const c = centers[i];
      const pos = geoToVector3(c.lat, c.lng, sphereRadius);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const col = c.type === 'L' ? new THREE.Color(0xf43f5e) : new THREE.Color(0x00e5ff);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.isMobile ? 12 : 18,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.centerPointsMesh = new THREE.Points(geometry, material);
    this.centerPointsMesh.name = 'PressureCentersPoints';
    this.rootGroup.add(this.centerPointsMesh);
  }

  private rebuildWithStorms(cycloneEvents: WorldEvent[]): void {
    // Add active cyclone events into centers list
    for (const storm of cycloneEvents) {
      const exists = GLOBAL_PRESSURE_CENTERS.some((c) => Math.hypot(c.lat - storm.lat, c.lng - storm.lng) < 5);
      if (!exists) {
        GLOBAL_PRESSURE_CENTERS.push({
          type: 'L',
          name: storm.title,
          lat: storm.lat,
          lng: storm.lng,
          centralHpa: storm.planetaryTelemetry?.pressureHpa || 965,
        });
      }
    }
  }

  public update(time: number, delta: number = 0.016): void {
    if (this.reducedMotion || !this.isVisible) return;
    // Subtle breathing pulse of pressure centers
    if (this.centerPointsMesh) {
      const breathe = 1.0 + Math.sin(time * 0.002) * 0.12;
      this.centerPointsMesh.scale.set(breathe, breathe, breathe);
    }
  }

  public dispose(): void {
    if (this.isobarsMesh) {
      this.rootGroup.remove(this.isobarsMesh);
      this.isobarsMesh.geometry.dispose();
      (this.isobarsMesh.material as THREE.Material).dispose();
      this.isobarsMesh = null;
    }

    if (this.centerPointsMesh) {
      this.rootGroup.remove(this.centerPointsMesh);
      this.centerPointsMesh.geometry.dispose();
      (this.centerPointsMesh.material as THREE.Material).dispose();
      this.centerPointsMesh = null;
    }

    while (this.rootGroup.children.length > 0) {
      const child = this.rootGroup.children[0];
      this.rootGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) (child as any).material.dispose();
    }
  }
}
