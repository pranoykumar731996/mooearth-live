// ============================================================
// MooEarth Live — 3D Globe Auroral Oval & Solar Wind Layer
// ============================================================
// Genuine planetary space weather & magnetospheric auroral curtain visualization.
// Driven by NOAA Space Weather Prediction Center (SWPC) planetary Kp index telemetry.
// Features:
// - Twin Northern (Borealis) and Southern (Australis) auroral oval curtain ribbons
// - Kp-driven geomagnetic equatorward expansion (Kp 1 -> Kp 9 storm scaling)
// - Double-emission spectral gradients:
//   * Lower curtain: Atomic oxygen 557.7 nm electric emerald green (0x10b981 / 0x34d399)
//   * Upper crown: Ionized molecular nitrogen 630 nm violet/magenta (0xec4899 / 0xa855f7)
// - Dynamic 60 FPS undulating curtain wave harmonics
// - Elevated high-altitude ionosphere geometry ensuring stunning visibility from space.

import * as THREE from 'three';
import type { WorldEvent } from '@/types';
import { geoToVector3 } from './WindParticleSystem';

export interface AuroralOvalLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
  reducedMotion?: boolean;
}

/**
 * Returns human-readable geomagnetic storm classification for a given Kp index.
 */
export function getKpStormScaleLabel(kp: number): string {
  if (kp >= 9) return 'G5 Extreme Geomagnetic Storm';
  if (kp >= 8) return 'G4 Severe Geomagnetic Storm';
  if (kp >= 7) return 'G3 Strong Geomagnetic Storm';
  if (kp >= 6) return 'G2 Moderate Geomagnetic Storm';
  if (kp >= 5) return 'G1 Minor Geomagnetic Storm';
  if (kp >= 4) return 'Active Geomagnetic Field';
  return 'Quiet / Nominal Magnetosphere';
}

/**
 * Returns auroral curtain glow color based on Kp index.
 */
export function getAuroraGlowColor(kp: number): THREE.Color {
  if (kp >= 7) return new THREE.Color(0xec4899); // Magenta / Crimson storm aurora
  if (kp >= 5) return new THREE.Color(0xa855f7); // Violet-Emerald storm
  return new THREE.Color(0x34d399); // Electric Emerald nominal aurora
}

interface AuroralCurtainInstance {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshBasicMaterial;
  poleLat: number;
  poleLng: number;
  isNorth: boolean;
  baseRadiusDeg: number;
  segments: number;
}

export class AuroralOvalLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private rootGroup: THREE.Group;
  private kpIndex: number = 4.8; // Baseline active geomagnetic field
  private curtains: AuroralCurtainInstance[] = [];

  constructor(options: AuroralOvalLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'AuroralOvalLayer';

    this.initCurtains();
  }

  /**
   * Initializes the Northern (Borealis) and Southern (Australis) auroral ribbons.
   */
  private initCurtains(): void {
    const segments = this.isMobile ? 54 : 96;

    // Northern Geomagnetic Dipole (~81.5°N, -83.0°W)
    const northCurtain = this.createCurtain(81.5, -83.0, true, segments);
    this.curtains.push(northCurtain);
    this.rootGroup.add(northCurtain.mesh);

    // Southern Geomagnetic Dipole (~-79.5°S, 108.5°E)
    const southCurtain = this.createCurtain(-79.5, 108.5, false, segments);
    this.curtains.push(southCurtain);
    this.rootGroup.add(southCurtain.mesh);
  }

  /**
   * Constructs a 3D ribbon mesh forming an auroral oval curtain.
   */
  private createCurtain(poleLat: number, poleLng: number, isNorth: boolean, segments: number): AuroralCurtainInstance {
    const vertexCount = (segments + 1) * 2;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const indices: number[] = [];

    // Indices for triangle strip
    for (let i = 0; i < segments; i++) {
      const top1 = i * 2;
      const bottom1 = i * 2 + 1;
      const top2 = (i + 1) * 2;
      const bottom2 = (i + 1) * 2 + 1;

      indices.push(top1, bottom1, top2);
      indices.push(bottom1, bottom2, top2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(indices);

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);

    const instance: AuroralCurtainInstance = {
      mesh,
      geometry,
      material,
      poleLat,
      poleLng,
      isNorth,
      baseRadiusDeg: 17.5,
      segments,
    };

    this.updateCurtainGeometry(instance, 0);
    return instance;
  }

  /**
   * Updates curtain vertex positions & colors based on Kp index and time-based harmonic wave motion.
   */
  private updateCurtainGeometry(curtain: AuroralCurtainInstance, timeSec: number): void {
    const posAttr = curtain.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = curtain.geometry.getAttribute('color') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    // Equatorward expansion: base 17.5° expands up to 38° during G5 storms (Kp 9)
    const ovalRadiusDeg = curtain.baseRadiusDeg + Math.min(this.kpIndex, 9) * 2.4;

    // Colors: Green for lower boundary, Violet/Magenta for upper crown
    const isStorm = this.kpIndex >= 5.5;
    const lowerColor = new THREE.Color(0x34d399); // Oxygen 557.7 nm emerald
    const upperColor = isStorm ? new THREE.Color(0xec4899) : new THREE.Color(0xa855f7); // Nitrogen violet/magenta

    // Pole center in 3D
    const polePos = geoToVector3(curtain.poleLat, curtain.poleLng, this.radius);
    const poleNormal = polePos.clone().normalize();

    // Create an orthonormal coordinate frame tangent to the pole
    const arbitrary = Math.abs(poleNormal.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const tangentU = new THREE.Vector3().crossVectors(poleNormal, arbitrary).normalize();
    const tangentV = new THREE.Vector3().crossVectors(poleNormal, tangentU).normalize();

    // Snug ionospheric curtain bounds closely hugging the polar upper atmosphere
    const lowerAlt = this.radius * 1.006; // Lower auroral ionosphere
    const upperAlt = this.radius * 1.018; // Upper auroral crown

    for (let i = 0; i <= curtain.segments; i++) {
      const angle = (i / curtain.segments) * Math.PI * 2;

      // Undulating wave harmonics simulating dynamic auroral curtains
      const wave1 = Math.sin(angle * 5.0 - timeSec * 1.8) * 0.8;
      const wave2 = Math.sin(angle * 9.0 + timeSec * 2.4) * 0.4;
      const totalWave = wave1 + wave2;

      const currentRadiusDeg = ovalRadiusDeg + totalWave;
      const currentRadiusRad = THREE.MathUtils.degToRad(currentRadiusDeg);

      // Local tangent circle around magnetic pole
      const x = Math.cos(angle) * Math.sin(currentRadiusRad);
      const y = Math.sin(angle) * Math.sin(currentRadiusRad);
      const z = Math.cos(currentRadiusRad);

      const localDir = new THREE.Vector3()
        .addScaledVector(tangentU, x)
        .addScaledVector(tangentV, y)
        .addScaledVector(poleNormal, z)
        .normalize();

      // Lower curtain vertex (emerald green)
      const lowerPos = localDir.clone().multiplyScalar(lowerAlt);
      positions[i * 6] = lowerPos.x;
      positions[i * 6 + 1] = lowerPos.y;
      positions[i * 6 + 2] = lowerPos.z;

      colors[i * 6] = lowerColor.r;
      colors[i * 6 + 1] = lowerColor.g;
      colors[i * 6 + 2] = lowerColor.b;

      // Upper curtain vertex (violet/magenta crown with subtle harmonic wave lift)
      const lift = 1.0 + totalWave * 0.012;
      const upperPos = localDir.clone().multiplyScalar(upperAlt * lift);
      positions[i * 6 + 3] = upperPos.x;
      positions[i * 6 + 1 + 3] = upperPos.y;
      positions[i * 6 + 2 + 3] = upperPos.z;

      colors[i * 6 + 3] = upperColor.r;
      colors[i * 6 + 1 + 3] = upperColor.g;
      colors[i * 6 + 2 + 3] = upperColor.b;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  /**
   * Filter and set active space weather events to update real planetary Kp.
   */
  public setEvents(events: WorldEvent[]): void {
    const spaceEvents = events.filter((e) => e.category === 'space_weather');
    for (const event of spaceEvents) {
      if (typeof event.planetaryTelemetry?.kpIndex === 'number') {
        this.kpIndex = Math.max(3.5, event.planetaryTelemetry.kpIndex);
        break;
      }
    }
  }

  /**
   * 60 FPS animation update loop.
   */
  public update(time: number, delta: number = 0.016): void {
    if (this.reducedMotion) return;

    const timeSec = time * 0.001;

    for (const curtain of this.curtains) {
      this.updateCurtainGeometry(curtain, timeSec);
      // Breathing opacity modulation
      const pulse = 0.82 + Math.sin(timeSec * 2.2) * 0.16;
      curtain.material.opacity = pulse;
    }
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  public dispose(): void {
    for (const curtain of this.curtains) {
      this.rootGroup.remove(curtain.mesh);
      curtain.geometry.dispose();
      curtain.material.dispose();
    }
    this.curtains = [];
  }
}
