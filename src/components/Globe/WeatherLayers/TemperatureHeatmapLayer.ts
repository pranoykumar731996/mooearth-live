// ============================================================
// MooEarth Live — 3D Globe Temperature Heatmap Layer
// ============================================================
// Genuine planetary temperature visualization mapped onto the 3D Earth.
// Uses Open-Meteo temperature telemetry from reference stations to render
// an interpolated thermal canvas texture across the globe.

import * as THREE from 'three';
import type { GlobalGridPointData } from '@/services/weather/globalGridService';
import { interpolateGridWeatherAt } from '@/services/weather/globalGridService';

export interface TemperatureLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
}

/**
 * Maps temperature (°C) to RGBA color components.
 */
export function getThermalColorRgb(tempC: number): [number, number, number, number] {
  // Clamped range: -40°C to +45°C
  if (tempC <= -25) {
    // Deep polar freeze: violet / purple
    return [109, 40, 217, 180];
  } else if (tempC <= -10) {
    // Freezing: indigo / royal blue
    return [37, 99, 235, 175];
  } else if (tempC <= 0) {
    // Near freezing: cyan / ice blue
    return [6, 182, 212, 170];
  } else if (tempC <= 10) {
    // Chilly: emerald / teal
    return [16, 185, 129, 165];
  } else if (tempC <= 20) {
    // Mild / comfortable: lime / yellow-green
    return [132, 204, 22, 165];
  } else if (tempC <= 28) {
    // Warm: amber / golden yellow
    return [245, 158, 11, 170];
  } else if (tempC <= 36) {
    // Hot: orange / coral
    return [249, 115, 22, 180];
  } else {
    // Extreme heat: crimson / dark red
    return [220, 38, 38, 195];
  }
}

export class TemperatureHeatmapLayer {
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

  constructor(options: TemperatureLayerOptions = {}) {
    this.radius = (options.radius ?? 100) * 1.0014;
    // 128x64 or 256x128 provides smooth equirectangular interpolation
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
      opacity: 0.48,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.y = -Math.PI / 2; // Match three-globe globeObj rotation so Prime Meridian aligns at +Z
    this.mesh.name = 'weather-temperature-heatmap';
  }

  public getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  public setStations(stations: GlobalGridPointData[]) {
    this.stations = stations;
    this.renderHeatmap();
  }

  public setHourlyIndex(index: number) {
    if (this.hourlyIndex === index) return;
    this.hourlyIndex = index;
    this.renderHeatmap();
  }

  /**
   * Re-evaluates thermal field for the current hourly index and updates texture.
   */
  public renderHeatmap() {
    if (!this.canvas || !this.ctx || !this.texture || this.stations.length === 0 || this.isUpdating) {
      return;
    }

    this.isUpdating = true;
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    const imgData = this.ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      // Latitude: +90 at top (y=0), -90 at bottom (y=height-1)
      const lat = 90 - (y / (height - 1)) * 180;

      for (let x = 0; x < width; x++) {
        // Longitude: -180 at left (x=0), +180 at right (x=width-1)
        const lng = -180 + (x / (width - 1)) * 360;

        const weather = interpolateGridWeatherAt(lat, lng, this.stations, this.hourlyIndex);
        const [r, g, b, a] = getThermalColorRgb(weather.temperature);

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
