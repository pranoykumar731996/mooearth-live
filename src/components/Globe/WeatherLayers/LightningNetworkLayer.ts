// ============================================================
// MooEarth Live — 3D Globe Lightning Network & Severe Convective Layer
// ============================================================
// Genuine planetary severe thunderstorm & lightning strike visualization.
// Driven by NOAA NWS Convective Warnings & RainViewer Doppler Network telemetry.
// Features:
// - Dynamic 3D branching fractal lightning bolts from cloud base to ground crust
// - High-voltage return stroke ionization flash and atmospheric corona bloom
// - Ground shockwave dissipation rings
// - Multi-stage thermal aging heatmap dots (Fresh White -> Amber -> Crimson Ember)
// - 60 FPS performance optimized with automatic WebGL buffer disposal.

import * as THREE from 'three';
import type { WorldEvent } from '@/types';
import { geoToVector3 } from './WindParticleSystem';

export interface LightningNetworkLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
  reducedMotion?: boolean;
}

interface ActiveBolt {
  line: THREE.Line;
  branchLine: THREE.Line | null;
  geometry: THREE.BufferGeometry;
  branchGeometry: THREE.BufferGeometry | null;
  material: THREE.LineBasicMaterial;
  groundGlow: THREE.Mesh;
  groundMaterial: THREE.MeshBasicMaterial;
  startTime: number;
  duration: number; // in seconds (e.g. 0.22s)
  isDisposed: boolean;
}

interface AgingStrikeDot {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  strikeTime: number; // in seconds
}

export class LightningNetworkLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private rootGroup: THREE.Group;
  private activeEvents: WorldEvent[] = [];
  private activeBolts: ActiveBolt[] = [];
  private agingDots: AgingStrikeDot[] = [];
  private nextStrikeTimes: Map<string, number> = new Map();

  // Shared geometries to minimize GPU allocation
  private glowGeometry: THREE.SphereGeometry;
  private dotGeometry: THREE.SphereGeometry;

  constructor(options: LightningNetworkLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'LightningNetworkLayer';

    this.glowGeometry = new THREE.SphereGeometry(1.2, 10, 10);
    this.dotGeometry = new THREE.SphereGeometry(0.35, 6, 6);
  }

  /**
   * Filter and set active severe weather / thunderstorm events.
   */
  public setEvents(events: WorldEvent[]): void {
    this.activeEvents = events.filter((e) => {
      if (e.category !== 'severe_weather') return false;
      const rate = e.planetaryTelemetry?.lightningStrikeRatePerMin;
      const type = e.planetaryTelemetry?.stormWarningType;
      return typeof rate === 'number' || !!type || e.title.toLowerCase().includes('thunderstorm') || e.title.toLowerCase().includes('tornado');
    });

    // Clean up timers for events no longer present
    const activeIds = new Set(this.activeEvents.map((e) => e.id));
    for (const key of Array.from(this.nextStrikeTimes.keys())) {
      if (!activeIds.has(key)) {
        this.nextStrikeTimes.delete(key);
      }
    }
  }

  /**
   * Generates a realistic 3D fractal lightning bolt with midpoint displacement.
   */
  private generateBoltPoints(start: THREE.Vector3, end: THREE.Vector3, iterations = 3): { main: THREE.Vector3[]; branch?: THREE.Vector3[] } {
    let segments: [THREE.Vector3, THREE.Vector3][] = [[start.clone(), end.clone()]];

    for (let i = 0; i < iterations; i++) {
      const nextSegments: [THREE.Vector3, THREE.Vector3][] = [];
      const jitterScale = 1.6 / (i + 1);

      for (const [p1, p2] of segments) {
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        // Displace mid perpendicular to ray
        const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
        const randVec = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize();
        const normal = new THREE.Vector3().crossVectors(dir, randVec).normalize();
        mid.addScaledVector(normal, (Math.random() - 0.5) * jitterScale);

        nextSegments.push([p1, mid]);
        nextSegments.push([mid, p2]);
      }
      segments = nextSegments;
    }

    const mainPoints: THREE.Vector3[] = [];
    if (segments.length > 0) {
      mainPoints.push(segments[0][0]);
      for (const seg of segments) {
        mainPoints.push(seg[1]);
      }
    }

    // Branch off from segment ~40% down the bolt
    let branchPoints: THREE.Vector3[] | undefined;
    if (mainPoints.length > 4 && Math.random() > 0.3) {
      const branchStart = mainPoints[Math.floor(mainPoints.length * 0.4)];
      const branchEnd = branchStart.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2.2,
          (Math.random() - 0.5) * 2.2,
          (Math.random() - 0.5) * 2.2
        )
      );
      const branchMid = new THREE.Vector3().addVectors(branchStart, branchEnd).multiplyScalar(0.5);
      branchMid.x += (Math.random() - 0.5) * 0.8;
      branchMid.y += (Math.random() - 0.5) * 0.8;
      branchMid.z += (Math.random() - 0.5) * 0.8;
      branchPoints = [branchStart, branchMid, branchEnd];
    }

    return { main: mainPoints, branch: branchPoints };
  }

  /**
   * Spawns a new lightning strike at the given coordinates.
   */
  private triggerStrike(lat: number, lng: number, currentTime: number): void {
    if (this.reducedMotion) return;

    // Enforce max concurrent bolts (3 on mobile, 8 on desktop)
    const maxConcurrent = this.isMobile ? 3 : 8;
    if (this.activeBolts.length >= maxConcurrent) {
      const oldest = this.activeBolts.shift();
      if (oldest) this.disposeBolt(oldest);
    }

    // Randomize strike target within convective cell cluster (approx. ±0.6 degrees)
    const offsetLat = lat + (Math.random() - 0.5) * 0.7;
    const offsetLng = lng + (Math.random() - 0.5) * 0.7;

    // Cloud height: R * 1.018; Ground: R * 1.0025
    const cloudPos = geoToVector3(offsetLat + (Math.random() - 0.5) * 0.4, offsetLng + (Math.random() - 0.5) * 0.4, this.radius * 1.018);
    const groundPos = geoToVector3(offsetLat, offsetLng, this.radius * 1.0025);

    const { main, branch } = this.generateBoltPoints(cloudPos, groundPos, 3);

    // 1. Main Bolt Line
    const boltGeo = new THREE.BufferGeometry().setFromPoints(main);
    const boltMat = new THREE.LineBasicMaterial({
      color: 0xecfeff, // Electric Ice White
      transparent: true,
      opacity: 1.0,
      linewidth: 2,
      depthWrite: false,
    });
    const boltLine = new THREE.Line(boltGeo, boltMat);
    this.rootGroup.add(boltLine);

    // 2. Secondary Branch Line (if generated)
    let branchLine: THREE.Line | null = null;
    let branchGeo: THREE.BufferGeometry | null = null;
    if (branch && branch.length > 0) {
      branchGeo = new THREE.BufferGeometry().setFromPoints(branch);
      branchLine = new THREE.Line(branchGeo, boltMat);
      this.rootGroup.add(branchLine);
    }

    // 3. Ground Ionization Corona Bloom
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Radiant Cyan Corona
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    const groundGlow = new THREE.Mesh(this.glowGeometry, groundMat);
    groundGlow.position.copy(groundPos);
    this.rootGroup.add(groundGlow);

    this.activeBolts.push({
      line: boltLine,
      branchLine,
      geometry: boltGeo,
      branchGeometry: branchGeo,
      material: boltMat,
      groundGlow,
      groundMaterial: groundMat,
      startTime: currentTime,
      duration: 0.24, // 240 ms flash
      isDisposed: false,
    });

    // 4. Add to Aging Strike Heatmap
    this.addAgingStrikeDot(groundPos, currentTime);
  }

  /**
   * Adds an aging strike dot at the contact point.
   */
  private addAgingStrikeDot(pos: THREE.Vector3, currentTime: number): void {
    const maxDots = this.isMobile ? 15 : 40;
    if (this.agingDots.length >= maxDots) {
      const oldDot = this.agingDots.shift();
      if (oldDot) {
        this.rootGroup.remove(oldDot.mesh);
        oldDot.material.dispose();
      }
    }

    const mat = new THREE.MeshBasicMaterial({
      color: 0xecfeff, // Starts bright white-blue
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const dotMesh = new THREE.Mesh(this.dotGeometry, mat);
    dotMesh.position.copy(pos);
    this.rootGroup.add(dotMesh);

    this.agingDots.push({
      mesh: dotMesh,
      material: mat,
      strikeTime: currentTime,
    });
  }

  /**
   * 60 FPS animation update loop.
   */
  public update(time: number, delta: number): void {
    const timeSec = time * 0.001;

    // 1. Process active severe weather storms & trigger new strikes
    for (const event of this.activeEvents) {
      const strikeRate = event.planetaryTelemetry?.lightningStrikeRatePerMin || 35;
      // Mean interval in seconds (e.g. 60 / 35 = ~1.7s)
      const meanInterval = 60 / Math.max(10, strikeRate);

      let nextTime = this.nextStrikeTimes.get(event.id);
      if (nextTime === undefined) {
        // Random initial delay
        nextTime = timeSec + Math.random() * meanInterval;
        this.nextStrikeTimes.set(event.id, nextTime);
      }

      if (timeSec >= nextTime) {
        this.triggerStrike(event.lat, event.lng, timeSec);
        // Exponential Poisson-like randomized interval for realistic lightning clustering
        const jitter = meanInterval * (0.4 + Math.random() * 1.2);
        this.nextStrikeTimes.set(event.id, timeSec + jitter);
      }
    }

    // 2. Animate and fade out active lightning discharge bolts
    for (let i = this.activeBolts.length - 1; i >= 0; i--) {
      const bolt = this.activeBolts[i];
      const elapsed = timeSec - bolt.startTime;

      if (elapsed >= bolt.duration) {
        this.rootGroup.remove(bolt.line);
        if (bolt.branchLine) this.rootGroup.remove(bolt.branchLine);
        this.rootGroup.remove(bolt.groundGlow);
        this.disposeBolt(bolt);
        this.activeBolts.splice(i, 1);
      } else {
        // Multi-stroke strobe simulation (2 rapid micro-flashes)
        const strobe = Math.sin((elapsed / bolt.duration) * Math.PI * 4.0);
        const opacity = Math.max(0, Math.min(1.0, Math.exp(-elapsed * 9.0) * (0.8 + 0.3 * Math.abs(strobe))));
        bolt.material.opacity = opacity;
        bolt.groundMaterial.opacity = opacity * 0.9;

        // Ground glow expansion
        const scale = 1.0 + (elapsed / bolt.duration) * 1.8;
        bolt.groundGlow.scale.set(scale, scale, scale);
      }
    }

    // 3. Update aging strike dots (Fade from Electric White -> Amber -> Red Ember -> Dispose)
    for (let i = this.agingDots.length - 1; i >= 0; i--) {
      const dot = this.agingDots[i];
      const age = timeSec - dot.strikeTime;

      if (age > 90) { // Keep dots for 90 seconds
        this.rootGroup.remove(dot.mesh);
        dot.material.dispose();
        this.agingDots.splice(i, 1);
      } else if (age < 5) {
        dot.material.color.setHex(0xecfeff); // Electric White
        dot.material.opacity = 0.9;
      } else if (age < 30) {
        dot.material.color.setHex(0xf59e0b); // Radiant Amber
        dot.material.opacity = 0.7;
      } else {
        dot.material.color.setHex(0xef4444); // Cooling Red Ember
        dot.material.opacity = Math.max(0.15, 0.7 * (1.0 - (age - 30) / 60));
      }
    }
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  private disposeBolt(bolt: ActiveBolt): void {
    if (bolt.isDisposed) return;
    bolt.isDisposed = true;

    bolt.geometry.dispose();
    bolt.material.dispose();
    if (bolt.branchGeometry) bolt.branchGeometry.dispose();
    bolt.groundMaterial.dispose();
  }

  public dispose(): void {
    for (const bolt of this.activeBolts) {
      this.rootGroup.remove(bolt.line);
      if (bolt.branchLine) this.rootGroup.remove(bolt.branchLine);
      this.rootGroup.remove(bolt.groundGlow);
      this.disposeBolt(bolt);
    }
    this.activeBolts = [];

    for (const dot of this.agingDots) {
      this.rootGroup.remove(dot.mesh);
      dot.material.dispose();
    }
    this.agingDots = [];

    this.glowGeometry.dispose();
    this.dotGeometry.dispose();
    this.nextStrikeTimes.clear();
  }
}
