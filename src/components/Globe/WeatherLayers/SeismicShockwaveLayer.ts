// ============================================================
// MooEarth Live — 3D Globe Seismic Shockwave & Hypocenter Layer
// ============================================================
// Genuine planetary earthquake & tectonic visualization.
// Driven by real USGS Earthquake Hazards Program GeoJSON telemetry.
// Renders 3D subterranean focal depth pillars, hypocenters, and epicentral beads:
// - Shallow Crustal (< 70 km): High-intensity Magma Red (0xef4444)
// - Intermediate (70 - 300 km): Radiant Amber / Gold (0xf59e0b)
// - Deep Subduction (> 300 km): Wadati-Benioff Electric Cyan (0x38bdf8)
// Scales with real Richter Magnitude (Mw) and pulses in real time.

import * as THREE from 'three';
import type { WorldEvent } from '@/types';
import { geoToVector3 } from './WindParticleSystem';

export interface SeismicShockwaveLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
  reducedMotion?: boolean;
}

/**
 * Maps hypocenter focal depth (km) to scientific seismology classification:
 * - < 70 km: Shallow Crustal (Red / High Surface Damage)
 * - 70 - 300 km: Intermediate (Amber / Gold)
 * - > 300 km: Deep Subduction Wadati-Benioff Zone (Electric Cyan)
 */
export function getFocalDepthColor(depthKm: number): THREE.Color {
  if (depthKm < 70) {
    return new THREE.Color(0xef4444); // Shallow (Red)
  } else if (depthKm < 300) {
    return new THREE.Color(0xf59e0b); // Intermediate (Amber)
  } else {
    return new THREE.Color(0x38bdf8); // Deep Subduction (Electric Cyan)
  }
}

/**
 * Human-readable focal depth classification according to seismological standards.
 */
export function getFocalDepthLabel(depthKm: number): string {
  if (depthKm < 70) return 'Shallow Crustal (<70 km)';
  if (depthKm < 300) return 'Intermediate (70–300 km)';
  return 'Deep Subduction (>300 km)';
}

/**
 * Human-readable Richter magnitude descriptor according to USGS standards.
 */
export function getRichterCategoryLabel(magnitude: number): string {
  if (magnitude < 3.0) return 'Minor Microquake';
  if (magnitude < 4.5) return 'Light Tremor';
  if (magnitude < 5.5) return 'Moderate Earthquake';
  if (magnitude < 6.5) return 'Strong Earthquake';
  if (magnitude < 7.5) return 'Major Destructive Earthquake';
  return 'Great Cataclysmic Earthquake';
}

interface QuakePillarInstance {
  eventId: string;
  group: THREE.Group;
  surfaceBead: THREE.Mesh;
  hypoBead: THREE.Mesh;
  pillarLine: THREE.Line;
  magnitude: number;
  depthKm: number;
  baseColor: THREE.Color;
}

export class SeismicShockwaveLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private rootGroup: THREE.Group;
  private quakes: Map<string, QuakePillarInstance> = new Map();

  constructor(options: SeismicShockwaveLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'SeismicShockwaveLayer';
  }

  /**
   * Filter and populate active USGS earthquake events.
   */
  public setEvents(events: WorldEvent[]): void {
    const seismicEvents = events.filter((e) => e.category === 'seismic');
    const activeIds = new Set(seismicEvents.map((e) => e.id));

    // Remove quakes no longer in feed
    for (const [id, quake] of Array.from(this.quakes.entries())) {
      if (!activeIds.has(id)) {
        this.rootGroup.remove(quake.group);
        this.disposeQuakeInstance(quake);
        this.quakes.delete(id);
      }
    }

    // Add or update active quakes (limit to top 15 on mobile, 35 on desktop for optimal 60 FPS)
    const maxQuakes = this.isMobile ? 15 : 35;
    const sortedQuakes = [...seismicEvents].sort((a, b) => {
      const magA = a.planetaryTelemetry?.magnitude || 0;
      const magB = b.planetaryTelemetry?.magnitude || 0;
      return magB - magA; // Prioritize highest magnitude
    }).slice(0, maxQuakes);

    for (const event of sortedQuakes) {
      if (!this.quakes.has(event.id)) {
        const quake = this.createQuakeInstance(event);
        if (quake) {
          this.quakes.set(event.id, quake);
          this.rootGroup.add(quake.group);
        }
      }
    }
  }

  /**
   * Constructs a 3D subterranean focal depth pillar and epicenter bead on the globe.
   */
  private createQuakeInstance(event: WorldEvent): QuakePillarInstance | null {
    const lat = event.lat;
    const lng = event.lng;
    const mag = event.planetaryTelemetry?.magnitude || 4.0;
    const depthKm = event.planetaryTelemetry?.depthKm || 10.0;

    const group = new THREE.Group();
    group.name = `quake-${event.id}`;

    // 1. Surface Epicenter Coordinate (R * 1.002)
    const surfacePos = geoToVector3(lat, lng, this.radius * 1.0025);

    // 2. Subterranean Hypocenter Coordinate
    // Real depth scale: 0 to 700 km mapped down into Earth mantle (up to 15% of globe radius)
    const depthRatio = Math.min(depthKm / 700, 1.0);
    const hypoRadius = this.radius * (1.0 - depthRatio * 0.16);
    const hypoPos = geoToVector3(lat, lng, hypoRadius);

    const baseColor = getFocalDepthColor(depthKm);

    // 3. 3D Subterranean Laser Pillar (Surface to Hypocenter)
    const pillarPoints = [surfacePos, hypoPos];
    const pillarGeo = new THREE.BufferGeometry().setFromPoints(pillarPoints);
    const pillarMat = new THREE.LineBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.8,
      linewidth: 2,
      depthWrite: false,
    });
    const pillarLine = new THREE.Line(pillarGeo, pillarMat);
    group.add(pillarLine);

    // 4. Surface Epicenter Bead (Scaled by Richter Magnitude)
    // Mag 3 = 0.5 units, Mag 7 = 1.6 units
    const beadSize = Math.max(0.4, (mag / 7.0) * 1.4);
    const beadGeo = new THREE.SphereGeometry(beadSize, 12, 12);
    const beadMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const surfaceBead = new THREE.Mesh(beadGeo, beadMat);
    surfaceBead.position.copy(surfacePos);
    group.add(surfaceBead);

    // 5. Hypocenter Core Bead (Deep in the Earth mantle)
    const hypoGeo = new THREE.SphereGeometry(beadSize * 0.7, 8, 8);
    const hypoMat = new THREE.MeshBasicMaterial({
      color: baseColor.clone().multiplyScalar(0.7),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const hypoBead = new THREE.Mesh(hypoGeo, hypoMat);
    hypoBead.position.copy(hypoPos);
    group.add(hypoBead);

    return {
      eventId: event.id,
      group,
      surfaceBead,
      hypoBead,
      pillarLine,
      magnitude: mag,
      depthKm,
      baseColor,
    };
  }

  /**
   * 60 FPS animation update loop.
   */
  public update(time: number, delta: number): void {
    if (this.reducedMotion) return;

    for (const quake of Array.from(this.quakes.values())) {
      // Pulse surface bead based on magnitude
      const pulseSpeed = 0.004 + (quake.magnitude / 9.0) * 0.006;
      const pulse = 1.0 + Math.sin(time * pulseSpeed) * 0.25;
      quake.surfaceBead.scale.set(pulse, pulse, pulse);

      // Pulse hypocenter core out-of-phase
      const hypoPulse = 1.0 + Math.cos(time * pulseSpeed) * 0.2;
      quake.hypoBead.scale.set(hypoPulse, hypoPulse, hypoPulse);
    }
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  private disposeQuakeInstance(quake: QuakePillarInstance): void {
    quake.surfaceBead.geometry.dispose();
    quake.hypoBead.geometry.dispose();
    quake.pillarLine.geometry.dispose();

    if (Array.isArray(quake.surfaceBead.material)) {
      quake.surfaceBead.material.forEach((m) => m.dispose());
    } else {
      quake.surfaceBead.material.dispose();
    }

    if (Array.isArray(quake.hypoBead.material)) {
      quake.hypoBead.material.forEach((m) => m.dispose());
    } else {
      quake.hypoBead.material.dispose();
    }

    if (Array.isArray(quake.pillarLine.material)) {
      quake.pillarLine.material.forEach((m) => m.dispose());
    } else {
      quake.pillarLine.material.dispose();
    }
  }

  public dispose(): void {
    for (const quake of Array.from(this.quakes.values())) {
      this.rootGroup.remove(quake.group);
      this.disposeQuakeInstance(quake);
    }
    this.quakes.clear();
  }
}
