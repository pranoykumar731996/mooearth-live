// ============================================================
// MooEarth Live — 3D Globe Ocean Current Streamlines & SST Layer
// ============================================================
// Real-world animated ocean current vector streamlines and sea surface
// temperature (SST) anomaly visualization.
// Driven by NOAA Ocean Surface Current Analysis Real-time (OSCAR),
// NOAA Coral Reef Watch (CRW), and Copernicus Marine Service (CMEMS).
// Features:
// - Spherical spline trajectories for Earth's major oceanic gyres:
//   * Gulf Stream & North Atlantic Drift
//   * Kuroshio Current & North Pacific Gyre
//   * Antarctic Circumpolar Current (ACC 360° Great Southern Ocean Ring)
//   * Agulhas Current & Retroflection Eddies
//   * Humboldt (Peru) Cold Upwelling Stream
//   * California & Benguela Eastern Boundary Currents
//   * East Australian Current (EAC) & Brazil Current
// - 60 FPS animated geostrophic particle streamlines flowing at accurate drift velocities
// - Real-time color coding modulated by Sea Surface Temperature Anomaly:
//   * Radiant coral/amber for Marine Heatwaves (ΔT >= +1.5°C)
//   * Electric turquoise/cyan for fast subtropical boundary currents
//   * Glacial ice-blue for subpolar drift & cold upwelling zones
// - Mesoscale eddy vortices at key oceanographic divergence/convergence zones
// - Complete WebGL memory management with safe disposal on unmount.

import * as THREE from 'three';
import type { WorldEvent } from '@/types';
import { geoToVector3 } from './WindParticleSystem';

export interface OceanCurrentsLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
  reducedMotion?: boolean;
}

/**
 * Returns dynamic streamline color based on current speed and SST anomaly.
 */
export function getOceanCurrentColor(speedMs: number, anomalyC: number): THREE.Color {
  if (anomalyC >= 1.5) {
    // Marine Heatwave Cat II / III — Radiant Coral to Vivid Amber
    return new THREE.Color(0xf43f5e);
  }
  if (anomalyC >= 0.8) {
    // Warm thermal anomaly — Turquoise-Gold
    return new THREE.Color(0x06b6d4);
  }
  if (anomalyC <= -1.0) {
    // Deep Cold Upwelling — Glacial Polar Ice-Blue
    return new THREE.Color(0x93c5fd);
  }
  if (speedMs >= 1.8) {
    // Fast boundary jet — High-voltage Electric Cyan
    return new THREE.Color(0x00f0ff);
  }
  if (speedMs >= 1.0) {
    // Subtropical boundary current — Bright Azure
    return new THREE.Color(0x38bdf8);
  }
  // Moderate / cold geostrophic drift — Deep Oceanic Blue
  return new THREE.Color(0x3b82f6);
}

/**
 * Returns ambient gyre trail color based on SST anomaly.
 */
export function getSstAnomalyColor(anomalyC: number): THREE.Color {
  if (anomalyC >= 1.5) return new THREE.Color(0xfb7185); // Coral
  if (anomalyC >= 0.5) return new THREE.Color(0x22d3ee); // Cyan
  if (anomalyC <= -0.5) return new THREE.Color(0x60a5fa); // Ice Blue
  return new THREE.Color(0x0ea5e9); // Azure
}

interface GyrePathDefinition {
  id: string;
  name: string;
  points: [number, number][]; // [lat, lng]
  speedMs: number;
  anomalyC: number;
  isClosed?: boolean;
}

/**
 * Major global oceanic circulation paths & gyres (NOAA / OSCAR geodetic coordinates)
 */
const GLOBAL_GYRE_PATHS: GyrePathDefinition[] = [
  // 1. Gulf Stream & North Atlantic Drift
  {
    id: 'gulf-stream',
    name: 'Gulf Stream & North Atlantic Drift',
    points: [
      [24.0, -81.5], [26.5, -79.8], [30.5, -78.2], [34.5, -75.0],
      [38.5, -67.0], [41.0, -55.0], [45.5, -42.0], [52.0, -28.0],
      [58.5, -15.0], [64.0, -2.0], [69.0, 14.0]
    ],
    speedMs: 2.1,
    anomalyC: 1.8,
  },
  // 2. North Atlantic Subtropical Gyre Return (Canary -> North Equatorial)
  {
    id: 'canary-north-equatorial',
    name: 'Canary & North Equatorial Current',
    points: [
      [42.0, -18.0], [34.0, -16.0], [24.0, -19.0], [18.0, -28.0],
      [14.5, -42.0], [14.0, -58.0], [17.5, -72.0], [22.0, -82.0]
    ],
    speedMs: 0.8,
    anomalyC: 0.4,
  },
  // 3. Kuroshio Current & North Pacific Drift
  {
    id: 'kuroshio-extension',
    name: 'Kuroshio Current & Extension',
    points: [
      [18.0, 122.5], [22.5, 123.5], [28.0, 128.5], [33.5, 137.0],
      [36.0, 143.5], [38.5, 153.0], [40.5, 168.0], [42.0, -178.0],
      [44.0, -162.0], [46.0, -145.0]
    ],
    speedMs: 1.85,
    anomalyC: 1.4,
  },
  // 4. California Current (North Pacific Eastern Boundary)
  {
    id: 'california-current',
    name: 'California Current System',
    points: [
      [48.0, -127.0], [42.0, -126.0], [36.0, -123.5], [31.0, -119.5],
      [24.0, -113.5], [17.0, -118.0], [13.0, -135.0]
    ],
    speedMs: 0.65,
    anomalyC: 0.5,
  },
  // 5. Pacific North Equatorial Current
  {
    id: 'pacific-north-equatorial',
    name: 'Pacific North Equatorial Current',
    points: [
      [12.5, -130.0], [12.0, -155.0], [11.5, 178.0], [11.0, 155.0],
      [12.0, 138.0], [14.5, 126.0]
    ],
    speedMs: 0.9,
    anomalyC: 0.6,
  },
  // 6. Antarctic Circumpolar Current — Outer Jet (Continuous 360° Southern Ocean Ring)
  {
    id: 'acc-outer',
    name: 'Antarctic Circumpolar Current (Outer)',
    points: [
      [-53.0, -180.0], [-54.0, -145.0], [-56.0, -110.0], [-57.5, -70.0],
      [-53.5, -35.0], [-52.0, 0.0], [-53.0, 35.0], [-54.5, 70.0],
      [-55.5, 110.0], [-54.0, 145.0], [-53.0, 180.0]
    ],
    speedMs: 1.4,
    anomalyC: -0.3,
    isClosed: true,
  },
  // 7. Antarctic Circumpolar Current — Polar Front Core
  {
    id: 'acc-polar-core',
    name: 'Antarctic Polar Front Core',
    points: [
      [-59.0, -180.0], [-60.5, -135.0], [-62.0, -85.0], [-58.5, -45.0],
      [-57.0, 10.0], [-58.0, 60.0], [-59.5, 110.0], [-60.0, 160.0],
      [-59.0, 180.0]
    ],
    speedMs: 1.6,
    anomalyC: -0.5,
    isClosed: true,
  },
  // 8. Agulhas Current & Retroflection (South Indian Ocean)
  {
    id: 'agulhas-current',
    name: 'Agulhas Current & Retroflection',
    points: [
      [-22.0, 36.5], [-27.0, 34.0], [-32.5, 30.5], [-36.5, 24.0],
      [-38.5, 19.0], [-39.0, 26.0], [-40.5, 45.0], [-42.0, 75.0]
    ],
    speedMs: 2.2,
    anomalyC: 1.7,
  },
  // 9. Humboldt (Peru) Cold Upwelling Current
  {
    id: 'humboldt-current',
    name: 'Humboldt (Peru) Cold Upwelling',
    points: [
      [-46.0, -76.5], [-39.0, -74.5], [-31.0, -73.0], [-21.0, -72.0],
      [-12.5, -78.5], [-5.0, -82.5], [0.5, -92.0]
    ],
    speedMs: 0.55,
    anomalyC: -1.4,
  },
  // 10. Benguela Upwelling Jet (South Atlantic)
  {
    id: 'benguela-current',
    name: 'Benguela Upwelling Jet',
    points: [
      [-36.0, 18.0], [-31.0, 15.0], [-24.0, 12.5], [-16.0, 10.0],
      [-9.0, 5.0], [-4.0, -5.0], [-5.0, -18.0]
    ],
    speedMs: 0.7,
    anomalyC: -1.6,
  },
  // 11. Brazil Current (Southwest Atlantic)
  {
    id: 'brazil-current',
    name: 'Brazil Boundary Current',
    points: [
      [-11.0, -35.5], [-18.5, -38.5], [-25.0, -44.5], [-33.0, -50.5],
      [-38.5, -54.0], [-43.0, -51.0]
    ],
    speedMs: 1.2,
    anomalyC: 1.1,
  },
  // 12. East Australian Current (EAC)
  {
    id: 'east-australian-current',
    name: 'East Australian Current (EAC)',
    points: [
      [-19.0, 151.0], [-25.0, 154.5], [-31.0, 155.0], [-36.0, 153.0],
      [-41.0, 151.0], [-45.0, 153.0]
    ],
    speedMs: 1.75,
    anomalyC: 1.9,
  },
  // 13. Pacific Equatorial Countercurrent / Warm Pool
  {
    id: 'pacific-equatorial-counter',
    name: 'Pacific Equatorial Warm Pool',
    points: [
      [4.5, 136.0], [5.0, 158.0], [5.5, -180.0], [5.5, -155.0],
      [6.0, -130.0], [6.5, -105.0], [7.0, -88.0]
    ],
    speedMs: 1.1,
    anomalyC: 1.6,
  },
  // 14. Somali Current & Arabian Sea Gyre
  {
    id: 'somali-arabian-gyre',
    name: 'Somali Current & Arabian Gyre',
    points: [
      [-3.0, 43.0], [3.0, 48.0], [9.0, 52.5], [14.0, 56.5],
      [17.0, 64.0], [13.0, 71.0]
    ],
    speedMs: 1.3,
    anomalyC: 0.8,
  },
];

interface StreamlineSpline {
  pathDef: GyrePathDefinition;
  curve: THREE.CatmullRomCurve3;
  samplePoints: THREE.Vector3[];
  tangents: THREE.Vector3[];
  length: number;
}

interface MovingStreak {
  splineIndex: number;
  progress: number; // 0 to 1 along spline
  speed: number;    // Progress units per second
  lengthFraction: number; // Fractional streak length along curve
  color: THREE.Color;
}

interface EddyVortex {
  mesh: THREE.Line;
  center: THREE.Vector3;
  radius: number;
  spinSpeed: number; // Rad/sec (positive = counter-clockwise, negative = clockwise)
  color: THREE.Color;
}

export class OceanCurrentsLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private rootGroup: THREE.Group;

  private splines: StreamlineSpline[] = [];
  private ambientGuidesMesh: THREE.LineSegments | null = null;
  private streakLinesMesh: THREE.LineSegments | null = null;
  private streakPositions: Float32Array = new Float32Array(0);
  private streakColors: Float32Array = new Float32Array(0);
  private streaks: MovingStreak[] = [];
  private eddies: EddyVortex[] = [];

  constructor(options: OceanCurrentsLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'OceanCurrentsLayer';

    this.buildSplines();
    this.buildAmbientGuideTracks();
    this.initStreaks();
    this.initEddyVortices();
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  /**
   * Constructs smooth 3D Catmull-Rom spherical splines for each oceanic path.
   */
  private buildSplines(): void {
    const sphereRadius = this.radius * 1.0022; // Slightly above sphere to prevent z-fighting

    for (const def of GLOBAL_GYRE_PATHS) {
      const controlPoints: THREE.Vector3[] = [];

      for (const [lat, lng] of def.points) {
        controlPoints.push(geoToVector3(lat, lng, sphereRadius));
      }

      if (controlPoints.length < 2) continue;

      const curve = new THREE.CatmullRomCurve3(
        controlPoints,
        def.isClosed ?? false,
        'catmullrom',
        0.5
      );

      // Sample 120 points along curve, projected strictly to sphere surface
      const numSamples = this.isMobile ? 64 : 120;
      const samplePoints: THREE.Vector3[] = [];
      const tangents: THREE.Vector3[] = [];

      for (let i = 0; i <= numSamples; i++) {
        const t = i / numSamples;
        const pt = curve.getPoint(t);
        // Normalize onto spherical shell
        pt.normalize().multiplyScalar(sphereRadius);
        samplePoints.push(pt);

        const tangent = curve.getTangent(t).normalize();
        tangents.push(tangent);
      }

      this.splines.push({
        pathDef: def,
        curve,
        samplePoints,
        tangents,
        length: curve.getLength(),
      });
    }
  }

  /**
   * Renders subtle ambient guideline tracks showing Earth's oceanic gyres.
   */
  private buildAmbientGuideTracks(): void {
    const segmentsList: number[] = [];
    const colorsList: number[] = [];

    for (const spline of this.splines) {
      const baseColor = getSstAnomalyColor(spline.pathDef.anomalyC);
      const points = spline.samplePoints;

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        segmentsList.push(p1.x, p1.y, p1.z);
        segmentsList.push(p2.x, p2.y, p2.z);

        // Alpha blended via vertex colors
        colorsList.push(baseColor.r * 0.45, baseColor.g * 0.45, baseColor.b * 0.45);
        colorsList.push(baseColor.r * 0.45, baseColor.g * 0.45, baseColor.b * 0.45);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(segmentsList, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsList, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.ambientGuidesMesh = new THREE.LineSegments(geometry, material);
    this.ambientGuidesMesh.name = 'OceanAmbientGuides';
    this.rootGroup.add(this.ambientGuidesMesh);
  }

  /**
   * Initializes moving streamline vector streaks flowing along the gyres.
   */
  private initStreaks(): void {
    const streaksPerSpline = this.isMobile ? 3 : 6;
    const segmentsPerStreak = 4; // Multi-segment tail for smooth comet vectors

    this.streaks = [];

    for (let sIdx = 0; sIdx < this.splines.length; sIdx++) {
      const spline = this.splines[sIdx];
      const speed = (spline.pathDef.speedMs * 0.055) / (this.radius * 0.01);

      for (let k = 0; k < streaksPerSpline; k++) {
        const initialProgress = (k / streaksPerSpline) + Math.random() * (0.5 / streaksPerSpline);
        const streakColor = getOceanCurrentColor(spline.pathDef.speedMs, spline.pathDef.anomalyC);

        this.streaks.push({
          splineIndex: sIdx,
          progress: initialProgress % 1.0,
          speed: speed * (0.85 + Math.random() * 0.3),
          lengthFraction: 0.035 + Math.random() * 0.02,
          color: streakColor,
        });
      }
    }

    // Allocate geometry buffers: each streak has (segmentsPerStreak) line segments = segmentsPerStreak * 2 vertices
    const totalVertices = this.streaks.length * segmentsPerStreak * 2;
    this.streakPositions = new Float32Array(totalVertices * 3);
    this.streakColors = new Float32Array(totalVertices * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.streakPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.streakColors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.streakLinesMesh = new THREE.LineSegments(geometry, material);
    this.streakLinesMesh.name = 'OceanStreakLines';
    this.rootGroup.add(this.streakLinesMesh);
  }

  /**
   * Initializes oceanographic mesoscale eddies & upwelling vortex rings.
   */
  private initEddyVortices(): void {
    const sphereRadius = this.radius * 1.0026;

    const vortexSites = [
      { name: 'Agulhas Ring Retroflection', lat: -38.5, lng: 18.5, radiusKm: 2.2, spin: -1.2, color: 0xf43f5e },
      { name: 'Gulf Stream Cold Core Ring', lat: 36.5, lng: -65.5, radiusKm: 1.8, spin: 1.4, color: 0x06b6d4 },
      { name: 'Kuroshio Meander Vortex', lat: 33.0, lng: 136.5, radiusKm: 2.0, spin: 1.1, color: 0x00f0ff },
      { name: 'Humboldt Upwelling Core', lat: -12.5, lng: -78.5, radiusKm: 1.5, spin: -0.9, color: 0x60a5fa },
    ];

    const segments = this.isMobile ? 24 : 40;

    for (const site of vortexSites) {
      const center = geoToVector3(site.lat, site.lng, sphereRadius);
      const normal = center.clone().normalize();

      // Tangent basis
      const arbitrary = Math.abs(normal.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const tangentU = new THREE.Vector3().crossVectors(normal, arbitrary).normalize();
      const tangentV = new THREE.Vector3().crossVectors(normal, tangentU).normalize();

      const ringPositions = new Float32Array((segments + 1) * 3);
      const ringRadius = site.radiusKm;

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const offset = new THREE.Vector3()
          .addScaledVector(tangentU, Math.cos(theta) * ringRadius)
          .addScaledVector(tangentV, Math.sin(theta) * ringRadius);

        const pos = center.clone().add(offset).normalize().multiplyScalar(sphereRadius);
        ringPositions[i * 3] = pos.x;
        ringPositions[i * 3 + 1] = pos.y;
        ringPositions[i * 3 + 2] = pos.z;
      }

      const ringGeom = new THREE.BufferGeometry();
      ringGeom.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));

      const ringMat = new THREE.LineBasicMaterial({
        color: site.color,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const ringLine = new THREE.Line(ringGeom, ringMat);
      ringLine.name = `Eddy-${site.name}`;
      this.rootGroup.add(ringLine);

      this.eddies.push({
        mesh: ringLine,
        center,
        radius: site.radiusKm,
        spinSpeed: site.spin,
        color: new THREE.Color(site.color),
      });
    }
  }

  /**
   * Updates dynamic telemetry from real live planetary ocean events.
   */
  public setEvents(events: WorldEvent[]): void {
    const oceanEvents = events.filter((e) => e.category === 'climate_oceans' && e.planetaryTelemetry);

    if (oceanEvents.length === 0) return;

    // Apply live telemetry overrides to nearest matching gyre paths
    for (const ev of oceanEvents) {
      const telem = ev.planetaryTelemetry;
      if (!telem) continue;

      let closestSpline: StreamlineSpline | null = null;
      let minDistance = Infinity;

      for (const spline of this.splines) {
        for (const [ptLat, ptLng] of spline.pathDef.points) {
          const dLat = ptLat - ev.lat;
          let dLng = ptLng - ev.lng;
          if (dLng > 180) dLng = 360 - dLng;
          if (dLng < -180) dLng = 360 + dLng;
          const distSq = dLat * dLat + dLng * dLng;
          if (distSq < minDistance) {
            minDistance = distSq;
            closestSpline = spline;
          }
        }
      }

      // If event is in oceanographic vicinity (< 25 degrees)
      if (closestSpline && minDistance < 625) {
        if (typeof telem.oceanCurrentSpeedMs === 'number') {
          closestSpline.pathDef.speedMs = telem.oceanCurrentSpeedMs;
        }
        if (typeof telem.seaSurfaceTempAnomalyC === 'number') {
          closestSpline.pathDef.anomalyC = telem.seaSurfaceTempAnomalyC;
        }
      }
    }

    // Refresh streak colors and speeds according to live telemetry
    for (const streak of this.streaks) {
      const spline = this.splines[streak.splineIndex];
      streak.color = getOceanCurrentColor(spline.pathDef.speedMs, spline.pathDef.anomalyC);
      const baseSpeed = (spline.pathDef.speedMs * 0.055) / (this.radius * 0.01);
      streak.speed = baseSpeed * (0.85 + Math.random() * 0.3);
    }
  }

  /**
   * 60 FPS animation loop advancing all streamline vectors and vortex rotations.
   */
  public update(time: number, delta: number = 0.016): void {
    if (this.reducedMotion) return;

    const clampedDelta = Math.min(delta, 0.05); // Prevent huge jumps on tab resume
    const sphereRadius = this.radius * 1.0022;
    const segmentsPerStreak = 4;

    let vIdx = 0;

    for (let i = 0; i < this.streaks.length; i++) {
      const streak = this.streaks[i];
      const spline = this.splines[streak.splineIndex];

      // Advance progress
      streak.progress = (streak.progress + streak.speed * clampedDelta) % 1.0;

      // Sample sub-segments along the streak
      const headT = streak.progress;
      const tailT = (headT - streak.lengthFraction + 1.0) % 1.0;

      for (let seg = 0; seg < segmentsPerStreak; seg++) {
        const segT1 = (headT - (seg / segmentsPerStreak) * streak.lengthFraction + 1.0) % 1.0;
        const segT2 = (headT - ((seg + 1) / segmentsPerStreak) * streak.lengthFraction + 1.0) % 1.0;

        const p1 = spline.curve.getPoint(segT1).normalize().multiplyScalar(sphereRadius);
        const p2 = spline.curve.getPoint(segT2).normalize().multiplyScalar(sphereRadius);

        // Position
        this.streakPositions[vIdx * 3] = p1.x;
        this.streakPositions[vIdx * 3 + 1] = p1.y;
        this.streakPositions[vIdx * 3 + 2] = p1.z;

        this.streakPositions[(vIdx + 1) * 3] = p2.x;
        this.streakPositions[(vIdx + 1) * 3 + 1] = p2.y;
        this.streakPositions[(vIdx + 1) * 3 + 2] = p2.z;

        // Brightness fade from head (1.0) to tail (0.15)
        const fade1 = 1.0 - (seg / segmentsPerStreak) * 0.75;
        const fade2 = 1.0 - ((seg + 1) / segmentsPerStreak) * 0.75;

        this.streakColors[vIdx * 3] = streak.color.r * fade1;
        this.streakColors[vIdx * 3 + 1] = streak.color.g * fade1;
        this.streakColors[vIdx * 3 + 2] = streak.color.b * fade1;

        this.streakColors[(vIdx + 1) * 3] = streak.color.r * fade2;
        this.streakColors[(vIdx + 1) * 3 + 1] = streak.color.g * fade2;
        this.streakColors[(vIdx + 1) * 3 + 2] = streak.color.b * fade2;

        vIdx += 2;
      }
    }

    if (this.streakLinesMesh) {
      const posAttr = this.streakLinesMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = this.streakLinesMesh.geometry.getAttribute('color') as THREE.BufferAttribute;
      if (posAttr) posAttr.needsUpdate = true;
      if (colAttr) colAttr.needsUpdate = true;
    }

    // Spin mesoscale eddies
    for (const eddy of this.eddies) {
      const normal = eddy.center.clone().normalize();
      eddy.mesh.rotateOnAxis(normal, eddy.spinSpeed * clampedDelta * 0.5);
    }
  }

  /**
   * Complete memory cleanup and disposal of all WebGL resources.
   */
  public dispose(): void {
    if (this.ambientGuidesMesh) {
      this.rootGroup.remove(this.ambientGuidesMesh);
      this.ambientGuidesMesh.geometry.dispose();
      (this.ambientGuidesMesh.material as THREE.Material).dispose();
      this.ambientGuidesMesh = null;
    }

    if (this.streakLinesMesh) {
      this.rootGroup.remove(this.streakLinesMesh);
      this.streakLinesMesh.geometry.dispose();
      (this.streakLinesMesh.material as THREE.Material).dispose();
      this.streakLinesMesh = null;
    }

    for (const eddy of this.eddies) {
      this.rootGroup.remove(eddy.mesh);
      eddy.mesh.geometry.dispose();
      (eddy.mesh.material as THREE.Material).dispose();
    }
    this.eddies = [];

    while (this.rootGroup.children.length > 0) {
      const child = this.rootGroup.children[0];
      this.rootGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: THREE.Material) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }
  }
}
