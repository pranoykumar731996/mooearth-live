// ============================================================
// MooEarth Live — 3D Globe Cyclone Vortex & Storm Track Layer
// ============================================================
// Genuine planetary tropical cyclone & hurricane visualization.
// Driven by real NASA EONET and NOAA National Hurricane Center data.
// Renders dynamic swirling logarithmic vortices with Coriolis physics:
// - Counter-clockwise in the Northern Hemisphere (lat >= 0)
// - Clockwise in the Southern Hemisphere (lat < 0)
// - Saffir-Simpson intensity rings & calm Eye of the Storm
// - Historical track ribbon tracing previous observed positions.

import * as THREE from 'three';
import type { WorldEvent } from '@/types';
import { geoToVector3 } from './WindParticleSystem';

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
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

interface StormVortexInstance {
  eventId: string;
  group: THREE.Group;
  rotationPivot: THREE.Group;
  eyeMesh: THREE.Mesh;
  outerRingMesh: THREE.LineLoop;
  particlesMesh: THREE.Points;
  particlesPositions: Float32Array;
  particlesAngles: Float32Array;
  particlesDistances: Float32Array;
  trackLine?: THREE.Line;
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
  private sharedMaterial: THREE.PointsMaterial | null = null;

  constructor(options: CycloneVortexLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'CycloneVortexLayer';

    if (typeof window !== 'undefined') {
      this.particleTexture = createSoftParticleTexture();
    }
  }

  /**
   * Filter and populate active tropical cyclones / severe storms from real events.
   */
  public setEvents(events: WorldEvent[]): void {
    // 1. Identify active severe storm / cyclone events
    const cycloneEvents = events.filter((e) => {
      if (e.category === 'severe_weather') return true;
      const titleLower = e.title.toLowerCase();
      return (
        titleLower.includes('hurricane') ||
        titleLower.includes('cyclone') ||
        titleLower.includes('typhoon') ||
        titleLower.includes('tropical storm') ||
        titleLower.includes('tropical depression')
      );
    });

    const activeIds = new Set(cycloneEvents.map((e) => e.id));

    // 2. Remove storms no longer active
    for (const [id, storm] of Array.from(this.storms.entries())) {
      if (!activeIds.has(id)) {
        this.rootGroup.remove(storm.group);
        this.disposeStormInstance(storm);
        this.storms.delete(id);
      }
    }

    // 3. Add or update active storms
    for (const event of cycloneEvents) {
      if (this.storms.has(event.id)) {
        // Storm already exists; update wind speed and position if shifted
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
    const windSpeedKph = event.planetaryTelemetry?.windSpeedKph || 65; // Default tropical breeze fallback

    // 1. Position on sphere surface (1.002 to prevent z-fighting with ocean/land)
    const worldPos = geoToVector3(lat, lng, this.radius * 1.0025);
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
    // Rotation velocity scaled by real wind speed (faster winds = faster rotation)
    const spinVelocity = 0.008 + (Math.min(windSpeedKph, 280) / 280) * 0.024;

    const stormColor = getSaffirSimpsonColor(windSpeedKph);

    // 5. Eyewall Ring (Center calm eye surrounded by glowing storm eyewall)
    const eyeRadiusInner = 0.35;
    const eyeRadiusOuter = 0.85;
    const eyeGeo = new THREE.RingGeometry(eyeRadiusInner, eyeRadiusOuter, 32);
    const eyeMat = new THREE.MeshBasicMaterial({
      color: stormColor,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.z = 0.02; // Elevated slightly
    rotationPivot.add(eyeMesh);

    // 6. Outer Wind Radii Boundary Ring (Gale-force envelope)
    const outerRadius = 2.4 + Math.min(windSpeedKph / 70, 2.2);
    const outerRingSegments = 48;
    const outerRingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= outerRingSegments; i++) {
      const theta = (i / outerRingSegments) * Math.PI * 2;
      outerRingPoints.push(new THREE.Vector3(Math.cos(theta) * outerRadius, Math.sin(theta) * outerRadius, 0.01));
    }
    const outerRingGeo = new THREE.BufferGeometry().setFromPoints(outerRingPoints);
    const outerRingMat = new THREE.LineBasicMaterial({
      color: stormColor,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerRingMesh = new THREE.LineLoop(outerRingGeo, outerRingMat);
    rotationPivot.add(outerRingMesh);

    // 7. Logarithmic Spiral Particle Arms (The Swirling Cloud Clouds)
    const numArms = 3; // 3 major spiral convective feeder bands
    const particlesPerArm = this.isMobile ? 35 : 85;
    const totalParticles = numArms * particlesPerArm;

    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const angles = new Float32Array(totalParticles);
    const distances = new Float32Array(totalParticles);

    let pIdx = 0;
    const bConst = 0.32; // Logarithmic spiral growth rate

    for (let arm = 0; arm < numArms; arm++) {
      const armOffset = (arm * (Math.PI * 2)) / numArms;

      for (let i = 0; i < particlesPerArm; i++) {
        // Distribute along spiral from eye to outer radius
        const t = i / (particlesPerArm - 1);
        const theta = t * 2.8; // ~160 degrees of spiral sweep
        const r = eyeRadiusOuter + Math.exp(bConst * theta) * 0.5 * (outerRadius / 2.5);

        // Add natural convective turbulence/jitter
        const jitterR = (Math.random() - 0.5) * 0.25;
        const jitterTheta = (Math.random() - 0.5) * 0.15;

        const finalTheta = armOffset + theta * spinDirection + jitterTheta;
        const finalR = Math.max(eyeRadiusInner, r + jitterR);

        const x = Math.cos(finalTheta) * finalR;
        const y = Math.sin(finalTheta) * finalR;
        const z = 0.04 + Math.random() * 0.05; // Elevated in local Z

        positions[pIdx * 3] = x;
        positions[pIdx * 3 + 1] = y;
        positions[pIdx * 3 + 2] = z;

        angles[pIdx] = finalTheta;
        distances[pIdx] = finalR;

        // Color gradient: Core matches Saffir-Simpson intensity, outer edges fade to oceanic cyan
        const edgeRatio = t;
        const pColor = stormColor.clone().lerp(new THREE.Color(0xffffff), 0.25);
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
      size: this.isMobile ? 1.4 : 2.0,
      ...(this.particleTexture ? { map: this.particleTexture } : {}),
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    rotationPivot.add(particlesMesh);

    // 8. Historical Track Ribbon (Connect previous observed positions on Earth surface)
    let trackLine: THREE.Line | undefined;
    const trackPoints = event.planetaryTelemetry?.trackPoints;
    if (trackPoints && trackPoints.length > 1) {
      const trackWorldPoints: THREE.Vector3[] = [];
      for (const pt of trackPoints) {
        trackWorldPoints.push(geoToVector3(pt.lat, pt.lng, this.radius * 1.002));
      }
      // World points need to be converted to local space of the parent group
      const localTrackPoints = trackWorldPoints.map((wp) => group.worldToLocal(wp.clone()));
      const trackGeo = new THREE.BufferGeometry().setFromPoints(localTrackPoints);
      const trackMat = new THREE.LineBasicMaterial({
        color: stormColor,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      trackLine = new THREE.Line(trackGeo, trackMat);
      group.add(trackLine);
    }

    return {
      eventId: event.id,
      group,
      rotationPivot,
      eyeMesh,
      outerRingMesh,
      particlesMesh,
      particlesPositions: positions,
      particlesAngles: angles,
      particlesDistances: distances,
      trackLine,
      spinDirection,
      spinVelocity,
      baseRadius: outerRadius,
    };
  }

  /**
   * Updates storm location & orientation if live coordinates update.
   */
  private updateStormPosition(storm: StormVortexInstance, event: WorldEvent): void {
    const worldPos = geoToVector3(event.lat, event.lng, this.radius * 1.0025);
    storm.group.position.copy(worldPos);
    const surfaceNormal = worldPos.clone().normalize();
    const defaultNormal = new THREE.Vector3(0, 0, 1);
    storm.group.quaternion.setFromUnitVectors(defaultNormal, surfaceNormal);
  }

  /**
   * Frame-by-frame 60 FPS animation loop (called by GlobeScene render tick).
   */
  public update(time: number, delta: number): void {
    if (this.reducedMotion) return;

    for (const storm of Array.from(this.storms.values())) {
      // 1. Rotate the vortex around local Earth surface normal
      storm.rotationPivot.rotation.z += storm.spinDirection * storm.spinVelocity;

      // 2. Pulse the Eye of the Storm subtly (simulating convective breathing)
      const pulse = 1.0 + Math.sin(time * 0.003) * 0.06;
      storm.eyeMesh.scale.set(pulse, pulse, 1.0);

      // 3. Dynamic spiral drift (particles drift inward toward the eye)
      const posAttr = storm.particlesMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      if (posAttr) {
        const positions = posAttr.array as Float32Array;
        const count = storm.particlesAngles.length;

        for (let i = 0; i < count; i++) {
          // Slowly pull inward
          storm.particlesDistances[i] -= 0.004;

          // If reached the eye, respawn at outer arm radius
          if (storm.particlesDistances[i] < 0.6) {
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
    // Geometries
    storm.eyeMesh.geometry.dispose();
    storm.outerRingMesh.geometry.dispose();
    storm.particlesMesh.geometry.dispose();
    if (storm.trackLine) storm.trackLine.geometry.dispose();

    // Materials
    if (Array.isArray(storm.eyeMesh.material)) {
      storm.eyeMesh.material.forEach((m) => m.dispose());
    } else {
      storm.eyeMesh.material.dispose();
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

    if (this.sharedMaterial) {
      this.sharedMaterial.dispose();
      this.sharedMaterial = null;
    }
  }
}
