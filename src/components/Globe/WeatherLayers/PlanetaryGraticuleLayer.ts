// ============================================================
// MooEarth Live — 3D Planetary Graticule Grid Layer (Nullschool Style)
// ============================================================
// Real 3D spherical coordinate grid matching earth.nullschool.net:
// - Parallels of latitude every 15° with Tropics & Polar Circles
// - Meridians of longitude every 15° with Prime Meridian & Antimeridian
// - High-contrast luminous Equator in electric cyan
// - Lightweight Three.js LineSegments with Additive Blending (60+ FPS)
// - Clean memory disposal on unmount

import * as THREE from 'three';
import { geoToVector3 } from './WindParticleSystem';

export interface PlanetaryGraticuleLayerOptions {
  radius?: number;
  isMobile?: boolean;
}

export class PlanetaryGraticuleLayer {
  private radius: number;
  private isMobile: boolean;
  private rootGroup: THREE.Group;
  private standardMesh: THREE.LineSegments | null = null;
  private cardinalMesh: THREE.LineSegments | null = null;

  constructor(options: PlanetaryGraticuleLayerOptions = {}) {
    this.radius = (options.radius ?? 100) * 1.0022; // Hover subtly above globe surface
    this.isMobile = options.isMobile ?? false;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'PlanetaryGraticuleLayer';

    this.initGraticules();
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setVisible(visible: boolean): void {
    this.rootGroup.visible = visible;
  }

  private initGraticules(): void {
    const standardPositions: number[] = [];
    const cardinalPositions: number[] = [];

    const latStep = 15;
    const lngStep = this.isMobile ? 30 : 15;
    const circleResolution = this.isMobile ? 5 : 2.5; // step in degrees along arcs

    // 1. Parallels of Latitude (-75° to +75° in steps of 15°)
    for (let lat = -75; lat <= 75; lat += latStep) {
      const isEquator = lat === 0;
      const targetArray = isEquator ? cardinalPositions : standardPositions;

      for (let lng = -180; lng < 180; lng += circleResolution) {
        const nextLng = lng + circleResolution;
        const p1 = geoToVector3(lat, lng, this.radius);
        const p2 = geoToVector3(lat, nextLng, this.radius);
        targetArray.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }

    // 2. Tropics (+23.5° Cancer, -23.5° Capricorn) & Polar Circles (±66.5°)
    const specialLats = [23.5, -23.5, 66.5, -66.5];
    for (const lat of specialLats) {
      for (let lng = -180; lng < 180; lng += circleResolution * 2) {
        const nextLng = lng + circleResolution * 2;
        const p1 = geoToVector3(lat, lng, this.radius);
        const p2 = geoToVector3(lat, nextLng, this.radius);
        standardPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }

    // 3. Meridians of Longitude (-180° to +180° in steps of 15° or 30°)
    for (let lng = -180; lng < 180; lng += lngStep) {
      const isCardinal = lng === 0 || lng === 180 || lng === -180;
      const targetArray = isCardinal ? cardinalPositions : standardPositions;

      for (let lat = -80; lat < 80; lat += circleResolution) {
        const nextLat = lat + circleResolution;
        const p1 = geoToVector3(lat, lng, this.radius);
        const p2 = geoToVector3(nextLat, lng, this.radius);
        targetArray.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }

    // Standard Grid Mesh
    const stdGeo = new THREE.BufferGeometry();
    stdGeo.setAttribute('position', new THREE.Float32BufferAttribute(standardPositions, 3));
    const stdMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.standardMesh = new THREE.LineSegments(stdGeo, stdMat);
    this.rootGroup.add(this.standardMesh);

    // Cardinal Grid Mesh (Equator & Prime Meridian - Electric Cyan Accent)
    const cardGeo = new THREE.BufferGeometry();
    cardGeo.setAttribute('position', new THREE.Float32BufferAttribute(cardinalPositions, 3));
    const cardMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.cardinalMesh = new THREE.LineSegments(cardGeo, cardMat);
    this.rootGroup.add(this.cardinalMesh);
  }

  public dispose(): void {
    if (this.standardMesh) {
      this.rootGroup.remove(this.standardMesh);
      this.standardMesh.geometry.dispose();
      (this.standardMesh.material as THREE.Material).dispose();
      this.standardMesh = null;
    }
    if (this.cardinalMesh) {
      this.rootGroup.remove(this.cardinalMesh);
      this.cardinalMesh.geometry.dispose();
      (this.cardinalMesh.material as THREE.Material).dispose();
      this.cardinalMesh = null;
    }
    while (this.rootGroup.children.length > 0) {
      const child = this.rootGroup.children[0];
      this.rootGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) (child as any).material.dispose();
    }
  }
}
