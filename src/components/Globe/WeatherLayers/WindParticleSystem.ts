// ============================================================
// MooEarth Live — 3D Globe Wind Particle System
// ============================================================
// Real animated wind particles driven by Open-Meteo meteorological vectors.
// Renders dynamic streamlines anchored to latitude/longitude coordinates on the
// existing 3D Earth globe using Three.js LineSegments with speed-based color gradients.

import * as THREE from 'three';
import type { GlobalGridPointData } from '@/services/weather/globalGridService';
import { interpolateGridWeatherAt } from '@/services/weather/globalGridService';

interface WindParticle {
  lat: number;
  lng: number;
  age: number;
  maxAge: number;
  speed: number;
}

export interface WindParticleSystemOptions {
  radius?: number; // Globe radius (default 100)
  particleCount?: number; // Default 1800 (desktop) or 600 (mobile)
  isMobile?: boolean;
  reducedMotion?: boolean;
}

/**
 * Convert geographic (lat, lng) to Three.js Cartesian Vector3
 * matching react-globe.gl coordinate orientation.
 */
export function geoToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (90 - lng) * (Math.PI / 180);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta)
  );
}

/**
 * Maps wind speed (km/h) to standard meteorological color palette:
 * - < 15 km/h: Light cyan / sky blue
 * - 15 - 30 km/h: Emerald / teal
 * - 30 - 50 km/h: Vivid amber / yellow
 * - 50 - 70 km/h: Orange / coral
 * - > 70 km/h: Magenta / red (gale / storm)
 */
export function getWindColor(speedKmh: number): THREE.Color {
  if (speedKmh < 15) {
    return new THREE.Color(0x00e5ff); // Cyan
  } else if (speedKmh < 30) {
    return new THREE.Color(0x10b981); // Emerald
  } else if (speedKmh < 50) {
    return new THREE.Color(0xfacc15); // Yellow
  } else if (speedKmh < 70) {
    return new THREE.Color(0xf97316); // Orange
  } else {
    return new THREE.Color(0xef4444); // Red/Storm
  }
}

export class WindParticleSystem {
  private radius: number;
  private particleCount: number;
  private particles: WindParticle[] = [];
  private stations: GlobalGridPointData[] = [];
  private hourlyIndex: number = 0;
  private mesh: THREE.LineSegments | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.LineBasicMaterial | null = null;
  private positions: Float32Array;
  private colors: Float32Array;
  private isMobile: boolean;
  private reducedMotion: boolean;

  constructor(options: WindParticleSystemOptions = {}) {
    this.radius = (options.radius ?? 100) * 1.0035; // Hover slightly above globe surface
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
    this.particleCount = options.particleCount ?? (this.isMobile ? 600 : 1800);

    // 2 vertices per particle streamline (head and tail)
    this.positions = new Float32Array(this.particleCount * 2 * 3);
    this.colors = new Float32Array(this.particleCount * 2 * 3);

    this.initParticles();
    this.initMesh();
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createRandomParticle());
    }
  }

  private createRandomParticle(): WindParticle {
    return {
      lat: (Math.random() - 0.5) * 160, // -80 to +80 deg
      lng: (Math.random() - 0.5) * 360, // -180 to +180 deg
      age: Math.floor(Math.random() * 80),
      maxAge: 60 + Math.floor(Math.random() * 60), // 60-120 frames
      speed: 15,
    };
  }

  private initMesh() {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.LineSegments(this.geometry, this.material);
    this.mesh.name = 'weather-wind-particles';
  }

  public getMesh(): THREE.LineSegments | null {
    return this.mesh;
  }

  public setStations(stations: GlobalGridPointData[]) {
    this.stations = stations;
  }

  public setHourlyIndex(index: number) {
    this.hourlyIndex = index;
  }

  public setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    if (this.material) {
      this.material.opacity = reduced ? 0.35 : 0.85;
    }
  }

  /**
   * Advance simulation by one frame.
   * Advects particles along real meteorological vectors (u, v).
   */
  public update() {
    if (!this.mesh || !this.geometry || this.stations.length === 0) return;

    const timeScale = this.reducedMotion ? 0.04 : 0.16;
    const tailScale = 0.08;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];

      // Sample real wind vector at current particle location
      const vector = interpolateGridWeatherAt(p.lat, p.lng, this.stations, this.hourlyIndex);
      p.speed = vector.windSpeed;

      // Advect particle: u is eastward (deg lon), v is northward (deg lat)
      // Conversion from km/h to degrees per frame:
      const cosLat = Math.max(0.1, Math.cos(p.lat * (Math.PI / 180)));
      const deltaLat = (vector.v * timeScale) / 111.0;
      const deltaLng = (vector.u * timeScale) / (111.0 * cosLat);

      p.lat += deltaLat;
      p.lng += deltaLng;
      p.age++;

      // Longitude wrapping
      if (p.lng > 180) p.lng -= 360;
      if (p.lng < -180) p.lng += 360;

      // Respawn expired or out-of-bounds particles
      if (p.age >= p.maxAge || Math.abs(p.lat) > 85) {
        this.particles[i] = this.createRandomParticle();
        continue;
      }

      // Compute 3D positions for head and tail
      // Head position
      const head = geoToVector3(p.lat, p.lng, this.radius);
      // Tail position: trail slightly behind along velocity
      const tailLat = p.lat - (vector.v * tailScale) / 111.0;
      const tailLng = p.lng - (vector.u * tailScale) / (111.0 * cosLat);
      const tail = geoToVector3(tailLat, tailLng, this.radius);

      // Color based on wind speed
      const color = getWindColor(p.speed);
      // Fade in at birth, fade out at death
      const progress = p.age / p.maxAge;
      const alpha = Math.sin(progress * Math.PI);
      const r = color.r * alpha;
      const g = color.g * alpha;
      const b = color.b * alpha;

      // Head vertex
      const idxHead = i * 2;
      this.positions[idxHead * 3] = head.x;
      this.positions[idxHead * 3 + 1] = head.y;
      this.positions[idxHead * 3 + 2] = head.z;
      this.colors[idxHead * 3] = r;
      this.colors[idxHead * 3 + 1] = g;
      this.colors[idxHead * 3 + 2] = b;

      // Tail vertex (slightly dimmer for sleek streak effect)
      const idxTail = i * 2 + 1;
      this.positions[idxTail * 3] = tail.x;
      this.positions[idxTail * 3 + 1] = tail.y;
      this.positions[idxTail * 3 + 2] = tail.z;
      this.colors[idxTail * 3] = r * 0.3;
      this.colors[idxTail * 3 + 1] = g * 0.3;
      this.colors[idxTail * 3 + 2] = b * 0.3;
    }

    // Notify Three.js to upload updated buffers
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Clean up WebGL resources
   */
  public dispose() {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.mesh = null;
    this.particles = [];
  }
}
