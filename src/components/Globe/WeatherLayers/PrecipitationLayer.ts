// ============================================================
// MooEarth Live — 3D Globe Precipitation Forecast Layer
// ============================================================
// Genuine planetary precipitation visualization mapped onto the 3D Earth.
// Uses Open-Meteo numerical weather prediction model telemetry (rain & snow)
// to render an interpolated precipitation canvas texture.
// Explicitly labeled as model forecast telemetry — not live radar.

import * as THREE from 'three';
import type { GlobalGridPointData } from '@/services/weather/globalGridService';
import { interpolateGridWeatherAt } from '@/services/weather/globalGridService';

export interface PrecipitationLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
}

/**
 * Maps precipitation (mm) and temperature (°C) to RGBA color components.
 * 0 mm = completely transparent.
 */
export function getPrecipitationColorRgb(precipMm: number, tempC: number): [number, number, number, number] {
  if (precipMm < 0.05) {
    // Dry / zero precipitation
    return [0, 0, 0, 0];
  }

  // Snow detection: sub-zero temperatures with precipitation
  if (tempC <= 0) {
    if (precipMm < 1.0) {
      return [224, 242, 254, 150]; // Light snow (ice blue)
    } else {
      return [241, 245, 249, 210]; // Heavy snow (snow white)
    }
  }

  // Liquid rain intensity thresholds (mm/h)
  if (precipMm < 0.5) {
    // Very light drizzle: translucent mint green
    return [52, 211, 153, 130];
  } else if (precipMm < 2.0) {
    // Light rain: cyan / teal
    return [6, 182, 212, 160];
  } else if (precipMm < 6.0) {
    // Moderate rain: royal blue
    return [37, 99, 235, 185];
  } else if (precipMm < 15.0) {
    // Heavy rain: purple / violet
    return [147, 51, 234, 210];
  } else {
    // Torrential rain / storm cell: bright magenta
    return [244, 63, 94, 235];
  }
}

export class PrecipitationLayer {
  private radius: number;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private texture: THREE.CanvasTexture | null = null;
  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshBasicMaterial | null = null;
  private stations: GlobalGridPointData[] = [];
  private hourlyIndex: number = 0;
  private canvasWidth: number;
  private canvasHeight: number;
  private isUpdating: boolean = false;

  constructor(options: PrecipitationLayerOptions = {}) {
    this.radius = (options.radius ?? 100) * 1.0015;
    this.canvasWidth = options.isMobile ? 128 : 256;
    this.canvasHeight = options.isMobile ? 64 : 128;

    this.initCanvasAndMesh();
  }

  private initCanvasAndMesh() {
    if (typeof document === 'undefined') return;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    this.geometry = new THREE.SphereGeometry(this.radius, 48, 48);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.y = -Math.PI / 2; // Match three-globe globeObj rotation so Prime Meridian aligns at +Z
    this.mesh.name = 'weather-precipitation-layer';
  }

  public getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  public setStations(stations: GlobalGridPointData[]) {
    this.stations = stations;
    this.renderPrecipitation();
  }

  public setHourlyIndex(index: number) {
    if (this.hourlyIndex === index) return;
    this.hourlyIndex = index;
    this.renderPrecipitation();
  }

  /**
   * Re-evaluates precipitation field for the current hourly index and updates texture.
   */
  public renderPrecipitation() {
    if (!this.canvas || !this.ctx || !this.texture || this.stations.length === 0 || this.isUpdating) {
      return;
    }

    this.isUpdating = true;
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const imgData = this.ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      const lat = 90 - (y / (height - 1)) * 180;

      for (let x = 0; x < width; x++) {
        const lng = -180 + (x / (width - 1)) * 360;

        const weather = interpolateGridWeatherAt(lat, lng, this.stations, this.hourlyIndex);
        const [r, g, b, a] = getPrecipitationColorRgb(weather.precipitation, weather.temperature);

        const pixelIndex = (y * width + x) * 4;
        data[pixelIndex] = r;
        data[pixelIndex + 1] = g;
        data[pixelIndex + 2] = b;
        data[pixelIndex + 3] = a;
      }
    }

    this.ctx.putImageData(imgData, 0, 0);
    this.texture.needsUpdate = true;
    this.isUpdating = false;
  }

  public dispose() {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
    this.canvas = null;
    this.ctx = null;
    this.mesh = null;
  }
}
