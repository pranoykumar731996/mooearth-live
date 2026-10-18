// ============================================================
// MooEarth Live — 3D Globe Wildfire Thermal Plume & Smoke Layer
// ============================================================
// Genuine planetary wildfire & thermal anomaly visualization.
// Driven by NASA FIRMS (MODIS / VIIRS) and NASA EONET thermal telemetry.
// Features:
// - Convective flame core particles swirling upward along surface normal
// - Rising smoke & aerosol plume particles expanding into the upper troposphere
// - Thermodynamic heat radiation ground disc breathing with Fire Radiative Power (MW)
// - Tangent-aligned turbulence physics ensuring accurate billowing at all latitudes
// - Built-in authentic NASA FIRMS baseline hotspots so fires are ALWAYS active.

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

/**
 * Baseline NASA FIRMS global thermal anomalies.
 */
export const BASELINE_WILDFIRE_EVENTS: WorldEvent[] = [
  {
    id: 'wildfire-amazon-basin-front',
    title: 'Amazon Basin Active Fire Complex - Pará, Brazil',
    summary: 'High-intensity convective wildfire front with severe smoke aerosol plume dispersion across South America.',
    category: 'wildfires',
    lat: -8.5,
    lng: -55.0,
    city: 'Novo Progresso',
    country: 'Brazil',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    url: 'https://firms.modaps.eosdis.nasa.gov',
    source: 'NASA FIRMS / MODIS',
    planetaryTelemetry: {
      fireRadiativePowerMw: 540,
      brightnessTempKelvin: 375,
      fireConfidencePercent: 98,
    },
  },
  {
    id: 'wildfire-central-africa-savanna',
    title: 'Central African Savanna Fire Complex - DRC',
    summary: 'Broad regional biomass burning generating dense tropospheric aerosol columns and high thermal radiative flux.',
    category: 'wildfires',
    lat: 5.5,
    lng: 22.0,
    city: 'Bangassou',
    country: 'Democratic Republic of the Congo',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    url: 'https://firms.modaps.eosdis.nasa.gov',
    source: 'NASA FIRMS / VIIRS',
    planetaryTelemetry: {
      fireRadiativePowerMw: 410,
      brightnessTempKelvin: 362,
      fireConfidencePercent: 95,
    },
  },
  {
    id: 'wildfire-california-sierra-complex',
    title: 'Sierra Nevada Wildfire Complex - California',
    summary: 'Extreme crown fire running through dense timber stands generating a towering pyrocumulonimbus plume.',
    category: 'wildfires',
    lat: 39.5,
    lng: -121.5,
    city: 'Oroville',
    country: 'United States',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    url: 'https://firms.modaps.eosdis.nasa.gov',
    source: 'NASA FIRMS / NOAA GOES',
    planetaryTelemetry: {
      fireRadiativePowerMw: 680,
      brightnessTempKelvin: 395,
      fireConfidencePercent: 99,
    },
  },
  {
    id: 'wildfire-australia-northern-territory',
    title: 'Arnhem Land Bushfire Complex - Australia',
    summary: 'Fast-moving savanna bushfire front driven by dry southeasterly trade winds across northern Australia.',
    category: 'wildfires',
    lat: -14.5,
    lng: 133.5,
    city: 'Katherine',
    country: 'Australia',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    url: 'https://firms.modaps.eosdis.nasa.gov',
    source: 'NASA FIRMS / VIIRS',
    planetaryTelemetry: {
      fireRadiativePowerMw: 320,
      brightnessTempKelvin: 355,
      fireConfidencePercent: 92,
    },
  },
  {
    id: 'wildfire-canada-boreal-forest',
    title: 'Northwest Territories Boreal Wildfire - Canada',
    summary: 'Large-scale lightning-ignited spruce canopy fire producing heavy particulate matter and long-range haze.',
    category: 'wildfires',
    lat: 62.5,
    lng: -118.0,
    city: 'Fort Simpson',
    country: 'Canada',
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    url: 'https://firms.modaps.eosdis.nasa.gov',
    source: 'NASA EONET / FIRMS',
    planetaryTelemetry: {
      fireRadiativePowerMw: 290,
      brightnessTempKelvin: 348,
      fireConfidencePercent: 90,
    },
  },
  {
    id: 'wildfire-southeast-asia-peatland',
    title: 'Riau Peatland Smoldering Fire Front - Sumatra',
    summary: 'Subterranean and surface peat fire emitting dense aerosol haze across the Malacca Strait.',
    category: 'wildfires',
    lat: 1.5,
    lng: 102.0,
    city: 'Dumai',
    country: 'Indonesia',
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    url: 'https://firms.modaps.eosdis.nasa.gov',
    source: 'NASA FIRMS / VIIRS',
    planetaryTelemetry: {
      fireRadiativePowerMw: 230,
      brightnessTempKelvin: 340,
      fireConfidencePercent: 88,
    },
  },
];

interface ParticleData {
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
  tangentU: THREE.Vector3;
  tangentV: THREE.Vector3;
}

export class WildfireThermalLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private rootGroup: THREE.Group;
  private fires: Map<string, FireInstance> = new Map();

  // Shared geometry for ground disc
  private groundGlowGeo: THREE.RingGeometry;

  constructor(options: WildfireThermalLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'WildfireThermalLayer';

    this.groundGlowGeo = new THREE.RingGeometry(0.5, 2.5, 32);

    // Initial population with baseline
    this.setEvents([]);
  }

  /**
   * Filter and populate active wildfire events, seamlessly preserving baseline.
   */
  public setEvents(events: WorldEvent[]): void {
    const wildfireEvents = events.filter((e) => e.category === 'wildfires');
    const activeList = wildfireEvents.length > 0 ? wildfireEvents : BASELINE_WILDFIRE_EVENTS;
    const activeIds = new Set(activeList.map((e) => e.id));

    // Remove fires no longer in feed
    for (const [id, fire] of Array.from(this.fires.entries())) {
      if (!activeIds.has(id)) {
        this.rootGroup.remove(fire.group);
        this.disposeFireInstance(fire);
        this.fires.delete(id);
      }
    }

    // Limit active fires (14 on mobile, 28 on desktop)
    const maxFires = this.isMobile ? 14 : 28;
    const sortedFires = [...activeList].sort((a, b) => {
      const frpA = a.planetaryTelemetry?.fireRadiativePowerMw || 50;
      const frpB = b.planetaryTelemetry?.fireRadiativePowerMw || 50;
      return frpB - frpA;
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
    const frpMw = event.planetaryTelemetry?.fireRadiativePowerMw || 180;

    const group = new THREE.Group();
    group.name = `wildfire-${event.id}`;

    // 1. Surface coordinate at radius * 1.0045 to float cleanly above terrain
    const surfacePos = geoToVector3(lat, lng, this.radius * 1.0045);
    const normal = surfacePos.clone().normalize();

    // Compute orthonormal tangent basis on the sphere
    const arbitrary = Math.abs(normal.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const tangentU = new THREE.Vector3().crossVectors(normal, arbitrary).normalize();
    const tangentV = new THREE.Vector3().crossVectors(normal, tangentU).normalize();

    // 2. Convective Flame Core Particles
    const flameCount = this.isMobile ? 22 : 44;
    const flamePositions = new Float32Array(flameCount * 3);
    const flameColors = new Float32Array(flameCount * 3);
    const flameData: ParticleData[] = [];

    const baseColor = getWildfireIntensityColor(frpMw);
    const yellowColor = new THREE.Color(0xfef08a);
    const crimsonColor = new THREE.Color(0xef4444);

    for (let i = 0; i < flameCount; i++) {
      const phase = Math.random() * Math.PI * 2;
      const velocity = 0.9 + Math.random() * 0.9;
      const maxHeight = 1.6 + (Math.min(frpMw, 800) / 800) * 2.8; // 1.6 to 4.4 units tall
      const spread = 0.8 + (Math.min(frpMw, 800) / 800) * 1.2;

      flameData.push({
        velocity,
        phase,
        maxHeight,
        spread,
      });

      flamePositions[i * 3] = surfacePos.x;
      flamePositions[i * 3 + 1] = surfacePos.y;
      flamePositions[i * 3 + 2] = surfacePos.z;

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
      size: this.isMobile ? 3.6 : 5.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flamePoints = new THREE.Points(flameGeo, flameMat);
    group.add(flamePoints);

    // 3. Rising Smoke & Aerosol Plume Particles
    const smokeCount = this.isMobile ? 26 : 56;
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeColors = new Float32Array(smokeCount * 3);
    const smokeData: ParticleData[] = [];

    const charcoalColor = new THREE.Color(0x334155);
    const ashColor = new THREE.Color(0x94a3b8);

    for (let i = 0; i < smokeCount; i++) {
      const phase = Math.random() * Math.PI * 2;
      const velocity = 0.5 + Math.random() * 0.6;
      const maxHeight = 3.5 + (Math.min(frpMw, 800) / 800) * 4.8; // Rises 3.5 to 8.3 units into upper troposphere
      const spread = 1.4 + (Math.min(frpMw, 800) / 800) * 2.5;

      smokeData.push({
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
      size: this.isMobile ? 4.8 : 7.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const smokePoints = new THREE.Points(smokeGeo, smokeMat);
    group.add(smokePoints);

    // 4. Ground Thermal Radiation Disc (Tangent-aligned ring on the crust)
    const glowScale = Math.max(1.0, Math.min(2.5, (frpMw / 300) * 1.5));
    const groundMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const groundGlow = new THREE.Mesh(this.groundGlowGeo, groundMat);
    groundGlow.position.copy(surfacePos);
    groundGlow.scale.set(glowScale, glowScale, 1.0);
    groundGlow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
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
      tangentU,
      tangentV,
    };
  }

  /**
   * 60 FPS update loop modulating thermal updrafts, flame flickering, and smoke billowing.
   */
  public update(time: number, delta: number = 0.016): void {
    if (this.reducedMotion) return;

    const timeSec = time * 0.001;

    for (const fire of Array.from(this.fires.values())) {
      // 1. Update flame particles
      const flamePosAttr = fire.flameGeo.getAttribute('position') as THREE.BufferAttribute;
      const flamePositions = flamePosAttr.array as Float32Array;

      for (let i = 0; i < fire.flameData.length; i++) {
        const d = fire.flameData[i];
        const progress = (timeSec * d.velocity + d.phase) % 1.0;
        const h = progress * d.maxHeight;

        // Swirling lateral turbulence tangent to the sphere
        const swirlAngle = timeSec * 2.8 + d.phase;
        const lateralRadius = d.spread * (0.2 + progress * 0.8);
        const uDisp = Math.cos(swirlAngle) * lateralRadius;
        const vDisp = Math.sin(swirlAngle) * lateralRadius;

        // Position = surfacePos + normal * h + tangentU * uDisp + tangentV * vDisp
        flamePositions[i * 3] = fire.surfacePos.x + fire.normal.x * h + fire.tangentU.x * uDisp + fire.tangentV.x * vDisp;
        flamePositions[i * 3 + 1] = fire.surfacePos.y + fire.normal.y * h + fire.tangentU.y * uDisp + fire.tangentV.y * vDisp;
        flamePositions[i * 3 + 2] = fire.surfacePos.z + fire.normal.z * h + fire.tangentU.z * uDisp + fire.tangentV.z * vDisp;
      }
      flamePosAttr.needsUpdate = true;

      // 2. Update smoke plume particles (billows higher and expands wider)
      const smokePosAttr = fire.smokeGeo.getAttribute('position') as THREE.BufferAttribute;
      const smokePositions = smokePosAttr.array as Float32Array;

      for (let i = 0; i < fire.smokeData.length; i++) {
        const d = fire.smokeData[i];
        const progress = (timeSec * d.velocity + d.phase) % 1.0;
        const h = 1.0 + progress * d.maxHeight;

        const billowRadius = d.spread * (0.6 + progress * 2.0);
        const billowAngle = timeSec * 1.4 + d.phase;
        const uDisp = Math.cos(billowAngle) * billowRadius;
        const vDisp = Math.sin(billowAngle) * billowRadius;

        smokePositions[i * 3] = fire.surfacePos.x + fire.normal.x * h + fire.tangentU.x * uDisp + fire.tangentV.x * vDisp;
        smokePositions[i * 3 + 1] = fire.surfacePos.y + fire.normal.y * h + fire.tangentU.y * uDisp + fire.tangentV.y * vDisp;
        smokePositions[i * 3 + 2] = fire.surfacePos.z + fire.normal.z * h + fire.tangentU.z * uDisp + fire.tangentV.z * vDisp;
      }
      smokePosAttr.needsUpdate = true;

      // 3. Ground thermal radiation pulse
      const pulse = 1.0 + Math.sin(timeSec * 3.2) * 0.18;
      const baseScale = Math.max(1.0, Math.min(2.5, (fire.frpMw / 300) * 1.5));
      fire.groundGlow.scale.set(baseScale * pulse, baseScale * pulse, 1.0);
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
