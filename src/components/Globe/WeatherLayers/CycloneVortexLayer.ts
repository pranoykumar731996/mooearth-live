// ============================================================
// MooEarth Live — 3D Globe Cyclone Vortex & Storm Track Layer
// ============================================================
// Genuine planetary tropical cyclone & hurricane visualization.
// Driven by real NASA EONET and NOAA National Hurricane Center data.
// Features:
// - Physical Coriolis logarithmic spiral vortices:
//   * Counter-clockwise in the Northern Hemisphere (lat >= 0)
//   * Clockwise in the Southern Hemisphere (lat < 0)
// - Saffir-Simpson intensity categorization & glowing Eye of the Storm
// - High-altitude convective cloud particles with soft alpha particle maps
// - Multi-segment historical track ribbons with direction vectors
// - Built-in authentic tropical cyclones baseline so storms are ALWAYS active.

import * as THREE from 'three';
import type { WorldEvent } from '@/types';
import { geoToVector3 } from './WindParticleSystem';
import {
  OFFICIAL_CYCLONE_BASELINES,
  cycloneToWorldEvent,
  interpolateForecastPosition,
  type TropicalCyclone,
} from '@/services/weather/cycloneTrackingService';

export interface CycloneVortexLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
  reducedMotion?: boolean;
}

/**
 * Maps wind speed in km/h to Saffir-Simpson Hurricane Wind Scale colors:
 * - < 63 km/h: Tropical Depression (Cyan)
 * - 63 - 118 km/h: Tropical Storm (Teal / Emerald)
 * - 119 - 153 km/h: Category 1 (Vivid Yellow)
 * - 154 - 177 km/h: Category 2 (Vibrant Amber / Orange)
 * - 178 - 208 km/h: Category 3 (Crimson Red / Major)
 * - 209 - 251 km/h: Category 4 (Hot Magenta / Devastating)
 * - > 252 km/h: Category 5 (Hyper Violet / Catastrophic)
 */
export function getSaffirSimpsonColor(windSpeedKph: number): THREE.Color {
  if (windSpeedKph < 63) {
    return new THREE.Color(0x06b6d4); // Cyan (Depression)
  } else if (windSpeedKph < 119) {
    return new THREE.Color(0x10b981); // Emerald (Tropical Storm)
  } else if (windSpeedKph < 154) {
    return new THREE.Color(0xfacc15); // Yellow (Cat 1)
  } else if (windSpeedKph < 178) {
    return new THREE.Color(0xf97316); // Orange (Cat 2)
  } else if (windSpeedKph < 209) {
    return new THREE.Color(0xef4444); // Red (Cat 3 Major)
  } else if (windSpeedKph < 252) {
    return new THREE.Color(0xe11d48); // Magenta (Cat 4)
  } else {
    return new THREE.Color(0xa855f7); // Hyper Violet (Cat 5)
  }
}

/**
 * Categorizes wind speed into a human-readable Saffir-Simpson label.
 */
export function getCycloneCategoryLabel(windSpeedKph: number): string {
  if (windSpeedKph < 63) return 'Tropical Depression';
  if (windSpeedKph < 119) return 'Tropical Storm';
  if (windSpeedKph < 154) return 'Cat 1 Hurricane';
  if (windSpeedKph < 178) return 'Cat 2 Hurricane';
  if (windSpeedKph < 209) return 'Cat 3 Major Hurricane';
  if (windSpeedKph < 252) return 'Cat 4 Devastating Hurricane';
  return 'Cat 5 Catastrophic Hurricane';
}

/**
 * Creates a circular soft-particle sprite texture dynamically via HTML Canvas.
 */
function createSoftParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Baseline real-world tropical cyclones synchronized with official forecast registry.
 */
export const BASELINE_CYCLONE_EVENTS: WorldEvent[] = OFFICIAL_CYCLONE_BASELINES.map(cycloneToWorldEvent);

interface StormVortexInstance {
  eventId: string;
  group: THREE.Group;
  rotationPivot: THREE.Group;
  eyeMesh: THREE.Mesh;
  eyeCoreBadge: THREE.Mesh;
  outerRingMesh: THREE.LineLoop;
  particlesMesh: THREE.Points;
  particlesPositions: Float32Array;
  particlesAngles: Float32Array;
  particlesDistances: Float32Array;
  trackLine?: THREE.Line;
  coneGroup?: THREE.Group;
  spinDirection: number; // 1 for Northern counter-clockwise, -1 for Southern clockwise
  spinVelocity: number;
  baseRadius: number;
}

export class CycloneVortexLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private rootGroup: THREE.Group;
  private particleTexture: THREE.CanvasTexture | null = null;
  private storms: Map<string, StormVortexInstance> = new Map();
  private currentEvents: WorldEvent[] = [];
  private currentHoursAhead: number = 0;

  constructor(options: CycloneVortexLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'CycloneVortexLayer';

    if (typeof window !== 'undefined') {
      this.particleTexture = createSoftParticleTexture();
    }

    // Initialize empty; only populate when live events are received
  }

  /**
   * Synchronizes cyclone vortex position and wind dynamics with the forecast timeline scrubber.
   * Handles historical observed hours (-24h to 0h) and forecast lead hours (+1h to +120h).
   */
  public setTimelineHoursAhead(hoursAhead: number): void {
    this.currentHoursAhead = hoursAhead;
    for (const [eventId, storm] of Array.from(this.storms.entries())) {
      const event = this.currentEvents.find((e) => e.id === eventId);
      if (!event) continue;

      let interpLat = event.lat;
      let interpLng = event.lng;
      let interpWind = event.planetaryTelemetry?.windSpeedKph || 140;

      // 1. Check if event maps to a verified cyclone in official registry
      const matchingCyclone = OFFICIAL_CYCLONE_BASELINES.find(
        (c) =>
          c.id === event.id ||
          c.name.toLowerCase() === event.title.toLowerCase() ||
          event.title.toLowerCase().includes(c.name.toLowerCase())
      );

      if (matchingCyclone) {
        const interp = interpolateForecastPosition(matchingCyclone, this.currentHoursAhead);
        interpLat = interp.lat;
        interpLng = interp.lng;
        interpWind = interp.windSpeedKph;
      } else if (
        Array.isArray(event.planetaryTelemetry?.forecastCone) &&
        event.planetaryTelemetry.forecastCone.length > 0 &&
        this.currentHoursAhead > 0
      ) {
        // Fallback: interpolate along custom forecast cone nodes if present
        const nodes = event.planetaryTelemetry.forecastCone;
        const allNodes = [
          { timeHours: 0, centerLat: event.lat, centerLng: event.lng },
          ...nodes,
        ];
        let p1 = allNodes[0];
        let p2 = allNodes[allNodes.length - 1];
        for (let i = 0; i < allNodes.length - 1; i++) {
          if (
            this.currentHoursAhead >= allNodes[i].timeHours &&
            this.currentHoursAhead <= allNodes[i + 1].timeHours
          ) {
            p1 = allNodes[i];
            p2 = allNodes[i + 1];
            break;
          }
        }
        const span = p2.timeHours - p1.timeHours;
        const t = span <= 0 ? 0 : (this.currentHoursAhead - p1.timeHours) / span;
        interpLat = p1.centerLat + (p2.centerLat - p1.centerLat) * t;
        interpLng = p1.centerLng + (p2.centerLng - p1.centerLng) * t;
      } else if (this.currentHoursAhead === 0) {
        interpLat = event.lat;
        interpLng = event.lng;
      }

      // Update 3D world position and Earth normal orientation
      const worldPos = geoToVector3(interpLat, interpLng, this.radius * 1.0016);
      storm.group.position.copy(worldPos);
      const surfaceNormal = worldPos.clone().normalize();
      const defaultNormal = new THREE.Vector3(0, 0, 1);
      storm.group.quaternion.setFromUnitVectors(defaultNormal, surfaceNormal);

      // Dynamically update spin velocity based on predicted wind speed
      storm.spinVelocity = 0.012 + (Math.min(interpWind, 280) / 280) * 0.028;
    }
  }

  /**
   * Filter and populate active tropical cyclones / severe storms.
   * Strictly live data: never injects stale historical baselines like Cyclone Dana (2024).
   */
  public setEvents(events: WorldEvent[]): void {
    this.currentEvents = [...events];
    const cycloneEvents = events.filter((e) => {
      const titleLower = (e.title || '').toLowerCase();
      const isExplicitCyclone = e.planetaryTelemetry?.stormWarningType === 'tropical_cyclone';
      return (
        isExplicitCyclone ||
        titleLower.includes('hurricane') ||
        titleLower.includes('cyclone') ||
        titleLower.includes('typhoon') ||
        titleLower.includes('tropical storm') ||
        titleLower.includes('tropical depression')
      );
    });

    const activeList = [...cycloneEvents];
    const activeIds = new Set(activeList.map((e) => e.id));

    // Remove storms no longer active
    for (const [id, storm] of Array.from(this.storms.entries())) {
      if (!activeIds.has(id)) {
        this.rootGroup.remove(storm.group);
        this.disposeStormInstance(storm);
        this.storms.delete(id);
      }
    }

    // Add or update active storms
    for (const event of activeList) {
      if (this.storms.has(event.id)) {
        const storm = this.storms.get(event.id)!;
        this.updateStormPosition(storm, event);
      } else {
        const storm = this.createStormInstance(event);
        if (storm) {
          this.storms.set(event.id, storm);
          this.rootGroup.add(storm.group);
        }
      }
    }
  }

  /**
   * Constructs an individual Three.js cyclone vortex on the globe surface.
   */
  private createStormInstance(event: WorldEvent): StormVortexInstance | null {
    const lat = event.lat;
    const lng = event.lng;
    const windSpeedKph = event.planetaryTelemetry?.windSpeedKph || 140;

    // 1. Position on sphere surface (tightly elevated to radius * 1.0016 to eliminate zoom parallax)
    const worldPos = geoToVector3(lat, lng, this.radius * 1.0016);
    const surfaceNormal = worldPos.clone().normalize();

    // 2. Parent group at storm world coordinates
    const group = new THREE.Group();
    group.name = `cyclone-${event.id}`;
    group.position.copy(worldPos);

    // Orient group so local +Z points directly outward along surface normal
    const defaultNormal = new THREE.Vector3(0, 0, 1);
    group.quaternion.setFromUnitVectors(defaultNormal, surfaceNormal);

    // 3. Rotation Pivot (spins around local Z axis = Earth normal at storm center)
    const rotationPivot = new THREE.Group();
    group.add(rotationPivot);

    // 4. Physical Coriolis rotation:
    // Northern Hemisphere (lat >= 0): Counter-clockwise (+1)
    // Southern Hemisphere (lat < 0): Clockwise (-1)
    const spinDirection = lat >= 0 ? 1 : -1;
    const spinVelocity = 0.012 + (Math.min(windSpeedKph, 280) / 280) * 0.028;

    const stormColor = getSaffirSimpsonColor(windSpeedKph);

    // 5. Eyewall Ring (Center calm eye surrounded by glowing storm eyewall)
    const eyeRadiusInner = 0.8;
    const eyeRadiusOuter = 1.8;
    const eyeGeo = new THREE.RingGeometry(eyeRadiusInner, eyeRadiusOuter, 36);
    const eyeMat = new THREE.MeshBasicMaterial({
      color: stormColor,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.z = 0.02;
    rotationPivot.add(eyeMesh);

    // Center Calm Eye Core Badge
    const coreGeo = new THREE.CircleGeometry(eyeRadiusInner * 0.7, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7, // Calm Deep Ocean Blue inside eye
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const eyeCoreBadge = new THREE.Mesh(coreGeo, coreMat);
    eyeCoreBadge.position.z = 0.018;
    rotationPivot.add(eyeCoreBadge);

    // 6. Outer Wind Radii Boundary Ring (Gale-force envelope)
    // Realistic scale: 5.5 to 9.5 units on a 100-radius sphere (~400-800 km diameter)
    const outerRadius = 5.5 + Math.min(windSpeedKph / 60, 4.0);
    const outerRingSegments = 54;
    const outerRingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= outerRingSegments; i++) {
      const theta = (i / outerRingSegments) * Math.PI * 2;
      outerRingPoints.push(new THREE.Vector3(Math.cos(theta) * outerRadius, Math.sin(theta) * outerRadius, 0.01));
    }
    const outerRingGeo = new THREE.BufferGeometry().setFromPoints(outerRingPoints);
    const outerRingMat = new THREE.LineBasicMaterial({
      color: stormColor,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerRingMesh = new THREE.LineLoop(outerRingGeo, outerRingMat);
    rotationPivot.add(outerRingMesh);

    // 7. Logarithmic Spiral Particle Arms (The Swirling Cloud Bands)
    const numArms = 3;
    const particlesPerArm = this.isMobile ? 55 : 110;
    const totalParticles = numArms * particlesPerArm;

    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const angles = new Float32Array(totalParticles);
    const distances = new Float32Array(totalParticles);

    let pIdx = 0;
    const bConst = 0.35; // Logarithmic spiral growth rate

    for (let arm = 0; arm < numArms; arm++) {
      const armOffset = (arm * (Math.PI * 2)) / numArms;

      for (let i = 0; i < particlesPerArm; i++) {
        const t = i / (particlesPerArm - 1);
        const theta = t * 3.2; // ~180 degrees sweep
        const r = eyeRadiusOuter + Math.exp(bConst * theta) * 0.7 * (outerRadius / 4.0);

        const jitterR = (Math.random() - 0.5) * 0.45;
        const jitterTheta = (Math.random() - 0.5) * 0.22;

        const finalTheta = armOffset + theta * spinDirection + jitterTheta;
        const finalR = Math.max(eyeRadiusInner, r + jitterR);

        const x = Math.cos(finalTheta) * finalR;
        const y = Math.sin(finalTheta) * finalR;
        const z = 0.015 + Math.random() * 0.025;

        positions[pIdx * 3] = x;
        positions[pIdx * 3 + 1] = y;
        positions[pIdx * 3 + 2] = z;

        angles[pIdx] = finalTheta;
        distances[pIdx] = finalR;

        // Gradient: Brilliant storm color near eyewall fading to white clouds at outer periphery
        const pColor = stormColor.clone().lerp(new THREE.Color(0xffffff), 0.35);
        colors[pIdx * 3] = pColor.r;
        colors[pIdx * 3 + 1] = pColor.g;
        colors[pIdx * 3 + 2] = pColor.b;

        pIdx++;
      }
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: this.isMobile ? 3.2 : 4.6,
      ...(this.particleTexture ? { map: this.particleTexture } : {}),
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    rotationPivot.add(particlesMesh);

    // 8. Historical Track Ribbon
    let trackLine: THREE.Line | undefined;
    const trackPoints = event.planetaryTelemetry?.trackPoints;
    if (trackPoints && trackPoints.length > 1) {
      const trackWorldPoints: THREE.Vector3[] = [];
      for (const pt of trackPoints) {
        trackWorldPoints.push(geoToVector3(pt.lat, pt.lng, this.radius * 1.0014));
      }
      const localTrackPoints = trackWorldPoints.map((wp) => group.worldToLocal(wp.clone()));
      const trackGeo = new THREE.BufferGeometry().setFromPoints(localTrackPoints);
      const trackMat = new THREE.LineBasicMaterial({
        color: stormColor,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      });
      trackLine = new THREE.Line(trackGeo, trackMat);
      group.add(trackLine);
    }

    // 9. Official 5-Day Forecast Cone of Uncertainty (NOAA NHC / JTWC / IMD)
    let coneGroup: THREE.Group | undefined;
    const forecastCone = event.planetaryTelemetry?.forecastCone;
    if (forecastCone && forecastCone.length > 0) {
      coneGroup = new THREE.Group();
      coneGroup.name = `ForecastCone_${event.id}`;

      // Projected track center line through all cone nodes
      const coneLineWorldPoints: THREE.Vector3[] = [
        geoToVector3(event.lat, event.lng, this.radius * 1.0014),
      ];

      for (const node of forecastCone) {
        const centerPos = geoToVector3(node.centerLat, node.centerLng, this.radius * 1.0014);
        coneLineWorldPoints.push(centerPos);

        // Uncertainty circle ring on sphere surface around each forecast lead time
        const radiusWorld = (node.errorRadiusKm / 6371) * this.radius;
        const ringSegments = 24;
        const ringWorldPoints: THREE.Vector3[] = [];
        const normal = centerPos.clone().normalize();
        let u = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
        if (u.lengthSq() < 0.001) u = new THREE.Vector3(1, 0, 0).cross(normal).normalize();
        const v = normal.clone().cross(u).normalize();

        for (let j = 0; j <= ringSegments; j++) {
          const theta = (j / ringSegments) * Math.PI * 2;
          const offset = u.clone().multiplyScalar(Math.cos(theta) * radiusWorld)
            .add(v.clone().multiplyScalar(Math.sin(theta) * radiusWorld));
          ringWorldPoints.push(centerPos.clone().add(offset).normalize().multiplyScalar(this.radius * 1.0014));
        }

        const localRingPoints = ringWorldPoints.map((wp) => group.worldToLocal(wp.clone()));
        const ringGeo = new THREE.BufferGeometry().setFromPoints(localRingPoints);
        const ringMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8, // Sky cyan
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        });
        const ringLine = new THREE.Line(ringGeo, ringMat);
        coneGroup.add(ringLine);
      }

      // Projected track center line
      const localLinePoints = coneLineWorldPoints.map((wp) => group.worldToLocal(wp.clone()));
      const lineGeo = new THREE.BufferGeometry().setFromPoints(localLinePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      });
      const coneCenterLine = new THREE.Line(lineGeo, lineMat);
      coneGroup.add(coneCenterLine);

      group.add(coneGroup);
    }

    return {
      eventId: event.id,
      group,
      rotationPivot,
      eyeMesh,
      eyeCoreBadge,
      outerRingMesh,
      particlesMesh,
      particlesPositions: positions,
      particlesAngles: angles,
      particlesDistances: distances,
      trackLine,
      coneGroup,
      spinDirection,
      spinVelocity,
      baseRadius: outerRadius,
    };
  }

  /**
   * Updates storm location & orientation if live coordinates update.
   */
  private updateStormPosition(storm: StormVortexInstance, event: WorldEvent): void {
    const worldPos = geoToVector3(event.lat, event.lng, this.radius * 1.0016);
    storm.group.position.copy(worldPos);
    const surfaceNormal = worldPos.clone().normalize();
    const defaultNormal = new THREE.Vector3(0, 0, 1);
    storm.group.quaternion.setFromUnitVectors(defaultNormal, surfaceNormal);
  }

  /**
   * Frame-by-frame 60 FPS animation loop.
   */
  public update(time: number, delta: number = 0.016): void {
    if (this.reducedMotion) return;

    for (const storm of Array.from(this.storms.values())) {
      // 1. Rotate the vortex around local Earth surface normal
      storm.rotationPivot.rotation.z += storm.spinDirection * storm.spinVelocity;

      // 2. Pulse the Eye of the Storm (simulating convective breathing)
      const pulse = 1.0 + Math.sin(time * 0.003) * 0.08;
      storm.eyeMesh.scale.set(pulse, pulse, 1.0);
      storm.eyeCoreBadge.scale.set(pulse, pulse, 1.0);

      // 3. Dynamic spiral drift (particles drift inward toward the eye)
      const posAttr = storm.particlesMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      if (posAttr) {
        const positions = posAttr.array as Float32Array;
        const count = storm.particlesAngles.length;

        for (let i = 0; i < count; i++) {
          storm.particlesDistances[i] -= 0.006;

          // If reached the eye, respawn at outer arm radius
          if (storm.particlesDistances[i] < 0.9) {
            storm.particlesDistances[i] = storm.baseRadius * (0.85 + Math.random() * 0.3);
          }

          const angle = storm.particlesAngles[i];
          const dist = storm.particlesDistances[i];

          positions[i * 3] = Math.cos(angle) * dist;
          positions[i * 3 + 1] = Math.sin(angle) * dist;
        }

        posAttr.needsUpdate = true;
      }
    }
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  private disposeStormInstance(storm: StormVortexInstance): void {
    storm.eyeMesh.geometry.dispose();
    storm.eyeCoreBadge.geometry.dispose();
    storm.outerRingMesh.geometry.dispose();
    storm.particlesMesh.geometry.dispose();
    if (storm.trackLine) storm.trackLine.geometry.dispose();

    if (Array.isArray(storm.eyeMesh.material)) {
      storm.eyeMesh.material.forEach((m) => m.dispose());
    } else {
      storm.eyeMesh.material.dispose();
    }

    if (Array.isArray(storm.eyeCoreBadge.material)) {
      storm.eyeCoreBadge.material.forEach((m) => m.dispose());
    } else {
      storm.eyeCoreBadge.material.dispose();
    }

    if (Array.isArray(storm.outerRingMesh.material)) {
      storm.outerRingMesh.material.forEach((m) => m.dispose());
    } else {
      storm.outerRingMesh.material.dispose();
    }

    if (Array.isArray(storm.particlesMesh.material)) {
      storm.particlesMesh.material.forEach((m) => m.dispose());
    } else {
      storm.particlesMesh.material.dispose();
    }

    if (storm.trackLine) {
      if (Array.isArray(storm.trackLine.material)) {
        storm.trackLine.material.forEach((m) => m.dispose());
      } else {
        storm.trackLine.material.dispose();
      }
    }

    if (storm.coneGroup) {
      storm.coneGroup.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
    }
  }

  public dispose(): void {
    for (const storm of Array.from(this.storms.values())) {
      this.rootGroup.remove(storm.group);
      this.disposeStormInstance(storm);
    }
    this.storms.clear();

    if (this.particleTexture) {
      this.particleTexture.dispose();
      this.particleTexture = null;
    }
  }
}
