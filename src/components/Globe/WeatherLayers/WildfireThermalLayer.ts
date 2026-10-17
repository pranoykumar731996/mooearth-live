// ============================================================
// MooEarth Live — 3D Globe Wildfire Thermal Plume & Smoke Layer
// ============================================================
// Genuine planetary wildfire & thermal anomaly visualization.
// Driven by NASA FIRMS (MODIS / VIIRS) and NASA EONET thermal telemetry.
// Features:
// - Convective flame core particles swirling upward from the Earth's crust
// - Rising smoke & aerosol plume particles expanding into the upper troposphere
// - Thermodynamic heat radiation ground disc breathing with Fire Radiative Power (MW)
// - Real-time 60 FPS animation loop with strict WebGL memory management.

import * as THREE from 'three';
import type { WorldEvent } from '@/types';
import { geoToVector3 } from './WindParticleSystem';

export interface WildfireThermalLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
  reducedMotion?: boolean;
}

/**
 * Maps Fire Radiative Power (MW) to incandescent thermal color:
 * - >= 500 MW: Extreme Convective Firestorm (Intense Magma Crimson)
 * - >= 200 MW: High-Intensity Crown Fire (Vibrant Blaze Orange)
 * - >= 80 MW: Moderate Active Front (Radiant Amber Gold)
 * - < 80 MW: Low-Intensity Surface Anomaly (Warm Yellow)
 */
export function getWildfireIntensityColor(frpMw: number): THREE.Color {
  if (frpMw >= 500) {
    return new THREE.Color(0xef4444); // Crimson
  } else if (frpMw >= 200) {
    return new THREE.Color(0xf97316); // Blaze Orange
  } else if (frpMw >= 80) {
    return new THREE.Color(0xfbbf24); // Amber Gold
  } else {
    return new THREE.Color(0xfef08a); // Warm Yellow
  }
}

/**
 * Human-readable wildfire thermal classification.
 */
export function getWildfireIntensityLabel(frpMw: number): string {
  if (frpMw >= 500) return 'Extreme PyroCb Firestorm';
  if (frpMw >= 200) return 'High-Intensity Crown Fire';
  if (frpMw >= 80) return 'Active Surface Fire Front';
  return 'Thermal Hotspot / Smoldering';
}

interface ParticleData {
  offset: THREE.Vector3;
  velocity: number;
  phase: number;
  maxHeight: number;
  spread: number;
}

interface FireInstance {
  eventId: string;
  group: THREE.Group;
  frpMw: number;
  flamePoints: THREE.Points;
  smokePoints: THREE.Points;
  groundGlow: THREE.Mesh;
  flameGeo: THREE.BufferGeometry;
  smokeGeo: THREE.BufferGeometry;
  flameMat: THREE.PointsMaterial;
  smokeMat: THREE.PointsMaterial;
  groundMat: THREE.MeshBasicMaterial;
  flameData: ParticleData[];
  smokeData: ParticleData[];
  surfacePos: THREE.Vector3;
  normal: THREE.Vector3;
}

export class WildfireThermalLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private rootGroup: THREE.Group;
  private fires: Map<string, FireInstance> = new Map();

  // Shared geometry for ground disc
  private groundGlowGeo: THREE.SphereGeometry;

  constructor(options: WildfireThermalLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'WildfireThermalLayer';

    this.groundGlowGeo = new THREE.SphereGeometry(1.0, 10, 10);
  }

  /**
   * Filter and populate active wildfire events.
   */
  public setEvents(events: WorldEvent[]): void {
    const wildfireEvents = events.filter((e) => e.category === 'wildfires');
    const activeIds = new Set(wildfireEvents.map((e) => e.id));

    // Remove fires no longer in feed
    for (const [id, fire] of Array.from(this.fires.entries())) {
      if (!activeIds.has(id)) {
        this.rootGroup.remove(fire.group);
        this.disposeFireInstance(fire);
        this.fires.delete(id);
      }
    }

    // Limit active fires (15 on mobile, 35 on desktop)
    const maxFires = this.isMobile ? 15 : 35;
    const sortedFires = [...wildfireEvents].sort((a, b) => {
      const frpA = a.planetaryTelemetry?.fireRadiativePowerMw || 50;
      const frpB = b.planetaryTelemetry?.fireRadiativePowerMw || 50;
      return frpB - frpA; // Prioritize largest thermal energy
    }).slice(0, maxFires);

    for (const event of sortedFires) {
      if (!this.fires.has(event.id)) {
        const fire = this.createFireInstance(event);
        if (fire) {
          this.fires.set(event.id, fire);
          this.rootGroup.add(fire.group);
        }
      }
    }
  }

  /**
   * Constructs the 3D flame updraft and rising smoke plume for a wildfire.
   */
  private createFireInstance(event: WorldEvent): FireInstance | null {
    const lat = event.lat;
    const lng = event.lng;
    const frpMw = event.planetaryTelemetry?.fireRadiativePowerMw || 100;

    const group = new THREE.Group();
    group.name = `wildfire-${event.id}`;

    const surfacePos = geoToVector3(lat, lng, this.radius * 1.0025);
    const normal = surfacePos.clone().normalize();

    // 1. Convective Flame Core Particles
    const flameCount = this.isMobile ? 14 : 28;
    const flamePositions = new Float32Array(flameCount * 3);
    const flameColors = new Float32Array(flameCount * 3);
    const flameData: ParticleData[] = [];

    const baseColor = getWildfireIntensityColor(frpMw);
    const yellowColor = new THREE.Color(0xfef08a);
    const crimsonColor = new THREE.Color(0xef4444);

    for (let i = 0; i < flameCount; i++) {
      const phase = Math.random() * Math.PI * 2;
      const velocity = 0.8 + Math.random() * 0.8;
      const maxHeight = 0.8 + (Math.min(frpMw, 800) / 800) * 1.2; // 0.8 to 2.0 units height
      const spread = 0.4 + (Math.min(frpMw, 800) / 800) * 0.5;

      flameData.push({
        offset: new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread
        ),
        velocity,
        phase,
        maxHeight,
        spread,
      });

      // Initial positions
      flamePositions[i * 3] = surfacePos.x;
      flamePositions[i * 3 + 1] = surfacePos.y;
      flamePositions[i * 3 + 2] = surfacePos.z;

      // Color gradient from white-yellow to flame red
      const t = Math.random();
      const col = t < 0.4 ? yellowColor.clone().lerp(baseColor, t / 0.4) : baseColor.clone().lerp(crimsonColor, (t - 0.4) / 0.6);
      flameColors[i * 3] = col.r;
      flameColors[i * 3 + 1] = col.g;
      flameColors[i * 3 + 2] = col.b;
    }

    const flameGeo = new THREE.BufferGeometry();
    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    flameGeo.setAttribute('color', new THREE.BufferAttribute(flameColors, 3));

    const flameMat = new THREE.PointsMaterial({
      size: this.isMobile ? 1.6 : 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flamePoints = new THREE.Points(flameGeo, flameMat);
    group.add(flamePoints);

    // 2. Rising Smoke & Aerosol Plume Particles
    const smokeCount = this.isMobile ? 16 : 36;
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeColors = new Float32Array(smokeCount * 3);
    const smokeData: ParticleData[] = [];

    const charcoalColor = new THREE.Color(0x334155);
    const ashColor = new THREE.Color(0x64748b);

    for (let i = 0; i < smokeCount; i++) {
      const phase = Math.random() * Math.PI * 2;
      const velocity = 0.4 + Math.random() * 0.5;
      const maxHeight = 1.8 + (Math.min(frpMw, 800) / 800) * 2.2; // Rises into upper troposphere
      const spread = 0.8 + (Math.min(frpMw, 800) / 800) * 1.2;

      smokeData.push({
        offset: new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread
        ),
        velocity,
        phase,
        maxHeight,
        spread,
      });

      smokePositions[i * 3] = surfacePos.x;
      smokePositions[i * 3 + 1] = surfacePos.y;
      smokePositions[i * 3 + 2] = surfacePos.z;

      const col = charcoalColor.clone().lerp(ashColor, Math.random());
      smokeColors[i * 3] = col.r;
      smokeColors[i * 3 + 1] = col.g;
      smokeColors[i * 3 + 2] = col.b;
    }

    const smokeGeo = new THREE.BufferGeometry();
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    smokeGeo.setAttribute('color', new THREE.BufferAttribute(smokeColors, 3));

    const smokeMat = new THREE.PointsMaterial({
      size: this.isMobile ? 2.4 : 3.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const smokePoints = new THREE.Points(smokeGeo, smokeMat);
    group.add(smokePoints);

    // 3. Ground Thermal Radiation Glow
    const glowScale = Math.max(0.6, Math.min(2.0, (frpMw / 300) * 1.2));
    const groundMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const groundGlow = new THREE.Mesh(this.groundGlowGeo, groundMat);
    groundGlow.position.copy(surfacePos);
    groundGlow.scale.set(glowScale, glowScale, glowScale);
    group.add(groundGlow);

    return {
      eventId: event.id,
      group,
      frpMw,
      flamePoints,
      smokePoints,
      groundGlow,
      flameGeo,
      smokeGeo,
      flameMat,
      smokeMat,
      groundMat,
      flameData,
      smokeData,
      surfacePos,
      normal,
    };
  }

  /**
   * 60 FPS update loop modulating thermal updrafts, flame flickering, and smoke billowing.
   */
  public update(time: number, delta: number): void {
    if (this.reducedMotion) return;

    const timeSec = time * 0.001;

    for (const fire of Array.from(this.fires.values())) {
      // 1. Update flame particles
      const flamePosAttr = fire.flameGeo.getAttribute('position') as THREE.BufferAttribute;
      const flamePositions = flamePosAttr.array as Float32Array;

      for (let i = 0; i < fire.flameData.length; i++) {
        const d = fire.flameData[i];
        // Convective cycling progress (0 to 1)
        const progress = (timeSec * d.velocity + d.phase) % 1.0;
        const h = progress * d.maxHeight;

        // Swirling lateral turbulence
        const swirlAngle = timeSec * 2.5 + d.phase;
        const lateralRadius = d.spread * (0.3 + progress * 0.7);
        const lateralX = Math.cos(swirlAngle) * lateralRadius;
        const lateralY = Math.sin(swirlAngle) * lateralRadius;

        // Position = surfacePos + normal * h + lateral displacement
        flamePositions[i * 3] = fire.surfacePos.x + fire.normal.x * h + lateralX;
        flamePositions[i * 3 + 1] = fire.surfacePos.y + fire.normal.y * h + lateralY;
        flamePositions[i * 3 + 2] = fire.surfacePos.z + fire.normal.z * h;
      }
      flamePosAttr.needsUpdate = true;

      // 2. Update smoke plume particles (rises higher and expands wider)
      const smokePosAttr = fire.smokeGeo.getAttribute('position') as THREE.BufferAttribute;
      const smokePositions = smokePosAttr.array as Float32Array;

      for (let i = 0; i < fire.smokeData.length; i++) {
        const d = fire.smokeData[i];
        const progress = (timeSec * d.velocity + d.phase) % 1.0;
        // Starts above flame tips (h from 0.6 up to maxHeight)
        const h = 0.6 + progress * d.maxHeight;

        // Smoke billows outward as it rises
        const billowRadius = d.spread * (0.5 + progress * 1.5);
        const billowAngle = timeSec * 1.2 + d.phase;
        const billowX = Math.cos(billowAngle) * billowRadius;
        const billowY = Math.sin(billowAngle) * billowRadius;

        smokePositions[i * 3] = fire.surfacePos.x + fire.normal.x * h + billowX;
        smokePositions[i * 3 + 1] = fire.surfacePos.y + fire.normal.y * h + billowY;
        smokePositions[i * 3 + 2] = fire.surfacePos.z + fire.normal.z * h;
      }
      smokePosAttr.needsUpdate = true;

      // 3. Ground thermal radiation pulse
      const pulse = 1.0 + Math.sin(timeSec * 3.0) * 0.15;
      const baseScale = Math.max(0.6, Math.min(2.0, (fire.frpMw / 300) * 1.2));
      fire.groundGlow.scale.set(baseScale * pulse, baseScale * pulse, baseScale * pulse);
    }
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  private disposeFireInstance(fire: FireInstance): void {
    fire.flameGeo.dispose();
    fire.smokeGeo.dispose();
    fire.flameMat.dispose();
    fire.smokeMat.dispose();
    fire.groundMat.dispose();
  }

  public dispose(): void {
    for (const fire of Array.from(this.fires.values())) {
      this.rootGroup.remove(fire.group);
      this.disposeFireInstance(fire);
    }
    this.fires.clear();
    this.groundGlowGeo.dispose();
  }
}
