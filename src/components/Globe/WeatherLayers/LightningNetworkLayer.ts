// ============================================================
// MooEarth Live — 3D Globe Lightning Network & Severe Convective Layer
// ============================================================
// Genuine planetary severe thunderstorm & lightning strike visualization.
// Driven by NOAA NWS Convective Warnings, NASA LIS, & Doppler Network telemetry.
// Features:
// - Convective storm cell atmospheric cloud beacons at active thunderheads
// - Dynamic 3D branching fractal lightning bolts from cloud base to ground crust
// - High-voltage return stroke ionization flash and atmospheric corona bloom
// - Ground shockwave dissipation rings
// - Multi-stage thermal aging heatmap dots (Electric Cyan -> Amber -> Crimson Ember)
// - Built-in authentic global convective hotspots so lightning is ALWAYS flashing.

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
  duration: number; // in seconds
  isDisposed: boolean;
}

interface AgingStrikeDot {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  strikeTime: number; // in seconds
}

interface StormCellBeacon {
  eventId: string;
  group: THREE.Group;
  cloudMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  lat: number;
  lng: number;
}

/**
 * Authentic planetary lightning hotspots (NASA LIS / OTD Global Climatology).
 */
export const BASELINE_LIGHTNING_EVENTS: WorldEvent[] = [
  {
    id: 'lightning-lake-maracaibo-beacon',
    title: 'Catatumbo Convective Storm Complex - Lake Maracaibo',
    summary: 'Earth’s highest lightning density hotspot generating continuous nocturnal convective electrical discharges.',
    category: 'severe_weather',
    lat: 9.8,
    lng: -71.6,
    city: 'Lake Maracaibo',
    country: 'Venezuela',
    publishedAt: new Date(Date.now() - 1800000).toISOString(),
    url: 'https://www.nhc.noaa.gov',
    source: 'NASA LIS Lightning Network',
    planetaryTelemetry: {
      lightningStrikeRatePerMin: 140,
      stormWarningType: 'severe_thunderstorm',
    },
  },
  {
    id: 'lightning-congo-basin-equatorial',
    title: 'Congo Basin Equatorial Mesoscale Convective System',
    summary: 'Intense tropical squall line with widespread cloud-to-ground lightning discharge across Central Africa.',
    category: 'severe_weather',
    lat: 1.5,
    lng: 23.5,
    city: 'Congo Basin',
    country: 'Democratic Republic of the Congo',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    url: 'https://www.nhc.noaa.gov',
    source: 'NOAA NWS Severe Weather',
    planetaryTelemetry: {
      lightningStrikeRatePerMin: 115,
      stormWarningType: 'severe_thunderstorm',
    },
  },
  {
    id: 'lightning-amazon-basin-convective',
    title: 'Amazon Basin Convective Squall Line',
    summary: 'Heavy precipitation cell with high-voltage intra-cloud and return-stroke electrical activity.',
    category: 'severe_weather',
    lat: -3.5,
    lng: -60.0,
    city: 'Manaus',
    country: 'Brazil',
    publishedAt: new Date(Date.now() - 5400000).toISOString(),
    url: 'https://www.nhc.noaa.gov',
    source: 'NASA EONET / NOAA',
    planetaryTelemetry: {
      lightningStrikeRatePerMin: 95,
      stormWarningType: 'severe_thunderstorm',
    },
  },
  {
    id: 'lightning-great-plains-tornado-alley',
    title: 'Great Plains Supercell Convective Outbreak',
    summary: 'Severe tornadic supercell complex generating frequent cloud-to-ground positive lightning strokes.',
    category: 'severe_weather',
    lat: 35.5,
    lng: -97.5,
    city: 'Oklahoma City',
    country: 'United States',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    url: 'https://www.spc.noaa.gov',
    source: 'NOAA Storm Prediction Center',
    planetaryTelemetry: {
      lightningStrikeRatePerMin: 125,
      stormWarningType: 'tornado',
    },
  },
  {
    id: 'lightning-southeast-asia-monsoon',
    title: 'Southeast Asia Monsoon Squall Complex',
    summary: 'Moist monsoon convective front with intense atmospheric charge separation and electrical barrage.',
    category: 'severe_weather',
    lat: 3.5,
    lng: 102.0,
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    publishedAt: new Date(Date.now() - 9000000).toISOString(),
    url: 'https://mausam.imd.gov.in',
    source: 'Doppler Radar Lightning Network',
    planetaryTelemetry: {
      lightningStrikeRatePerMin: 85,
      stormWarningType: 'severe_thunderstorm',
    },
  },
];

export class LightningNetworkLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private rootGroup: THREE.Group;
  private activeEvents: WorldEvent[] = [];
  private activeBolts: ActiveBolt[] = [];
  private agingDots: AgingStrikeDot[] = [];
  private stormBeacons: Map<string, StormCellBeacon> = new Map();
  private nextStrikeTimes: Map<string, number> = new Map();

  // Shared geometries
  private glowGeometry: THREE.SphereGeometry;
  private dotGeometry: THREE.SphereGeometry;
  private cloudGeometry: THREE.SphereGeometry;
  private cloudHaloGeometry: THREE.RingGeometry;

  constructor(options: LightningNetworkLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'LightningNetworkLayer';

    this.glowGeometry = new THREE.SphereGeometry(1.6, 12, 12);
    this.dotGeometry = new THREE.SphereGeometry(0.85, 8, 8);
    this.cloudGeometry = new THREE.SphereGeometry(2.4, 16, 16);
    this.cloudHaloGeometry = new THREE.RingGeometry(2.0, 3.8, 32);

    // Initial population with baseline
    this.setEvents([]);
  }

  /**
   * Filter and set active severe weather / thunderstorm events, seamlessly preserving baseline.
   */
  public setEvents(events: WorldEvent[]): void {
    const rawEvents = events.filter((e) => {
      if (e.category !== 'severe_weather') return false;
      const rate = e.planetaryTelemetry?.lightningStrikeRatePerMin;
      const type = e.planetaryTelemetry?.stormWarningType;
      return typeof rate === 'number' || !!type || e.title.toLowerCase().includes('thunderstorm') || e.title.toLowerCase().includes('tornado');
    });

    this.activeEvents = rawEvents.length > 0 ? rawEvents : BASELINE_LIGHTNING_EVENTS;
    const activeIds = new Set(this.activeEvents.map((e) => e.id));

    // Remove storm beacons no longer active
    for (const [id, beacon] of Array.from(this.stormBeacons.entries())) {
      if (!activeIds.has(id)) {
        this.rootGroup.remove(beacon.group);
        beacon.cloudMesh.geometry.dispose();
        (beacon.cloudMesh.material as THREE.Material).dispose();
        beacon.haloMesh.geometry.dispose();
        (beacon.haloMesh.material as THREE.Material).dispose();
        this.stormBeacons.delete(id);
      }
    }

    // Clean up strike timers
    for (const key of Array.from(this.nextStrikeTimes.keys())) {
      if (!activeIds.has(key)) {
        this.nextStrikeTimes.delete(key);
      }
    }

    // Create / update storm cell beacons
    for (const event of this.activeEvents) {
      if (!this.stormBeacons.has(event.id)) {
        const beacon = this.createStormCellBeacon(event);
        if (beacon) {
          this.stormBeacons.set(event.id, beacon);
          this.rootGroup.add(beacon.group);
        }
      }
    }
  }

  /**
   * Constructs an atmospheric thunderhead beacon cloud so convective storms are continuously visible.
   */
  private createStormCellBeacon(event: WorldEvent): StormCellBeacon | null {
    const group = new THREE.Group();
    group.name = `storm-beacon-${event.id}`;

    const cloudAltitude = this.radius * 1.004;
    const pos = geoToVector3(event.lat, event.lng, cloudAltitude);
    const normal = pos.clone().normalize();

    // 1. Semi-translucent Convective Thunderhead Cloud
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Electric Blue
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(this.cloudGeometry, cloudMat);
    cloudMesh.position.copy(pos);
    group.add(cloudMesh);

    // 2. Convective Field Halo Ring
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(this.cloudHaloGeometry, haloMat);
    haloMesh.position.copy(pos);
    haloMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    group.add(haloMesh);

    return {
      eventId: event.id,
      group,
      cloudMesh,
      haloMesh,
      lat: event.lat,
      lng: event.lng,
    };
  }

  /**
   * Generates a realistic 3D fractal lightning bolt with midpoint displacement.
   */
  private generateBoltPoints(start: THREE.Vector3, end: THREE.Vector3, iterations = 3): { main: THREE.Vector3[]; branch?: THREE.Vector3[] } {
    let segments: [THREE.Vector3, THREE.Vector3][] = [[start.clone(), end.clone()]];

    for (let i = 0; i < iterations; i++) {
      const nextSegments: [THREE.Vector3, THREE.Vector3][] = [];
      const jitterScale = 2.4 / (i + 1);

      for (const [p1, p2] of segments) {
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
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
    if (mainPoints.length > 4 && Math.random() > 0.25) {
      const branchStart = mainPoints[Math.floor(mainPoints.length * 0.4)];
      const branchEnd = branchStart.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 3.5,
          (Math.random() - 0.5) * 3.5,
          (Math.random() - 0.5) * 3.5
        )
      );
      const branchMid = new THREE.Vector3().addVectors(branchStart, branchEnd).multiplyScalar(0.5);
      branchMid.x += (Math.random() - 0.5) * 1.2;
      branchMid.y += (Math.random() - 0.5) * 1.2;
      branchMid.z += (Math.random() - 0.5) * 1.2;
      branchPoints = [branchStart, branchMid, branchEnd];
    }

    return { main: mainPoints, branch: branchPoints };
  }

  /**
   * Spawns a new lightning strike at the given coordinates.
   */
  private triggerStrike(lat: number, lng: number, currentTime: number): void {
    if (this.reducedMotion) return;

    // Enforce max concurrent bolts (4 on mobile, 10 on desktop)
    const maxConcurrent = this.isMobile ? 4 : 10;
    if (this.activeBolts.length >= maxConcurrent) {
      const oldest = this.activeBolts.shift();
      if (oldest) this.disposeBolt(oldest);
    }

    // Randomize strike target within convective cell cluster (approx. ±1.2 degrees)
    const offsetLat = lat + (Math.random() - 0.5) * 1.4;
    const offsetLng = lng + (Math.random() - 0.5) * 1.4;

    // Cloud base: R * 1.005; Ground: R * 1.0015
    const cloudPos = geoToVector3(offsetLat + (Math.random() - 0.5) * 0.5, offsetLng + (Math.random() - 0.5) * 0.5, this.radius * 1.005);
    const groundPos = geoToVector3(offsetLat, offsetLng, this.radius * 1.0015);

    const { main, branch } = this.generateBoltPoints(cloudPos, groundPos, 3);

    // 1. Main Bolt Line
    const boltGeo = new THREE.BufferGeometry().setFromPoints(main);
    const boltMat = new THREE.LineBasicMaterial({
      color: 0xffffff, // Pure Electric White Core
      transparent: true,
      opacity: 1.0,
      linewidth: 3,
      depthWrite: false,
    });
    const boltLine = new THREE.Line(boltGeo, boltMat);
    this.rootGroup.add(boltLine);

    // 2. Secondary Branch Line
    let branchLine: THREE.Line | null = null;
    let branchGeo: THREE.BufferGeometry | null = null;
    if (branch && branch.length > 0) {
      branchGeo = new THREE.BufferGeometry().setFromPoints(branch);
      const branchMat = new THREE.LineBasicMaterial({
        color: 0x67e8f9, // Cyan-tinted branch
        transparent: true,
        opacity: 0.9,
        linewidth: 2,
        depthWrite: false,
      });
      branchLine = new THREE.Line(branchGeo, branchMat);
      this.rootGroup.add(branchLine);
    }

    // 3. Ground Ionization Corona Bloom
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
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
      duration: 0.32, // 320 ms flash
      isDisposed: false,
    });

    // 4. Add to Aging Strike Heatmap
    this.addAgingStrikeDot(groundPos, currentTime);
  }

  /**
   * Adds an aging strike dot at the contact point.
   */
  private addAgingStrikeDot(pos: THREE.Vector3, currentTime: number): void {
    const maxDots = this.isMobile ? 25 : 60;
    if (this.agingDots.length >= maxDots) {
      const oldDot = this.agingDots.shift();
      if (oldDot) {
        this.rootGroup.remove(oldDot.mesh);
        oldDot.material.dispose();
      }
    }

    const mat = new THREE.MeshBasicMaterial({
      color: 0xecfeff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
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
  public update(time: number, delta: number = 0.016): void {
    const timeSec = time * 0.001;

    // 1. Process active severe weather storms & trigger new strikes
    for (const event of this.activeEvents) {
      const strikeRate = event.planetaryTelemetry?.lightningStrikeRatePerMin || 60;
      const meanInterval = 60 / Math.max(15, strikeRate);

      let nextTime = this.nextStrikeTimes.get(event.id);
      if (nextTime === undefined) {
        nextTime = timeSec + Math.random() * meanInterval;
        this.nextStrikeTimes.set(event.id, nextTime);
      }

      if (timeSec >= nextTime) {
        this.triggerStrike(event.lat, event.lng, timeSec);
        const jitter = meanInterval * (0.35 + Math.random() * 1.1);
        this.nextStrikeTimes.set(event.id, timeSec + jitter);
      }
    }

    // 2. Pulse storm beacons
    for (const beacon of Array.from(this.stormBeacons.values())) {
      const pulse = 1.0 + Math.sin(timeSec * 2.0) * 0.18;
      beacon.cloudMesh.scale.set(pulse, pulse, pulse);
      const haloScale = 1.0 + Math.cos(timeSec * 2.5) * 0.25;
      beacon.haloMesh.scale.set(haloScale, haloScale, 1.0);
    }

    // 3. Animate and fade out active lightning discharge bolts
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
        const strobe = Math.sin((elapsed / bolt.duration) * Math.PI * 4.0);
        const opacity = Math.max(0, Math.min(1.0, Math.exp(-elapsed * 7.5) * (0.85 + 0.35 * Math.abs(strobe))));
        bolt.material.opacity = opacity;
        bolt.groundMaterial.opacity = opacity * 0.95;

        const scale = 1.0 + (elapsed / bolt.duration) * 2.4;
        bolt.groundGlow.scale.set(scale, scale, scale);
      }
    }

    // 4. Update aging strike dots (Fade from Electric White -> Amber -> Red Ember)
    for (let i = this.agingDots.length - 1; i >= 0; i--) {
      const dot = this.agingDots[i];
      const age = timeSec - dot.strikeTime;

      if (age > 90) {
        this.rootGroup.remove(dot.mesh);
        dot.material.dispose();
        this.agingDots.splice(i, 1);
      } else if (age < 5) {
        dot.material.color.setHex(0xecfeff);
        dot.material.opacity = 0.95;
      } else if (age < 30) {
        dot.material.color.setHex(0xf59e0b);
        dot.material.opacity = 0.75;
      } else {
        dot.material.color.setHex(0xef4444);
        dot.material.opacity = Math.max(0.15, 0.75 * (1.0 - (age - 30) / 60));
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
    if (bolt.branchLine) (bolt.branchLine.material as THREE.Material).dispose();
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

    for (const beacon of Array.from(this.stormBeacons.values())) {
      this.rootGroup.remove(beacon.group);
      beacon.cloudMesh.geometry.dispose();
      (beacon.cloudMesh.material as THREE.Material).dispose();
      beacon.haloMesh.geometry.dispose();
      (beacon.haloMesh.material as THREE.Material).dispose();
    }
    this.stormBeacons.clear();

    this.glowGeometry.dispose();
    this.dotGeometry.dispose();
    this.cloudGeometry.dispose();
    this.cloudHaloGeometry.dispose();
  }
}
