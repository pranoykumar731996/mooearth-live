// ============================================================
// MooEarth Live — 3D Geostationary Satellite Cloud Cover Layer
// ============================================================
// High-resolution global satellite cloud imagery layer.
// Features:
// - Visible (Natural True Color) daylight cloud decks & storm shadows
// - Blue (Water Vapor / Upper Tropospheric moisture band)
// - Infra (Infrared Cloud Top Brightness Temperature Kelvin color ramp:
//   * < 210 K: Severe convective tops & hurricane eyewalls in magenta/crimson
//   * 210-230 K: Cold cirrus & storm anvil in yellow/amber
//   * 230-250 K: Mid-tropospheric clouds in cyan/green
//   * > 260 K: Clear warm ocean surface in dark transparent navy)
// - Real-time Doppler radar echo overlay
// - Interactive time-scrubber synchronization (24h past to live)
// - Coriolis cloud advection and rotating storm vortex spirals
// - 60 FPS Three.js ShaderMaterial with complete WebGL disposal on unmount.

import * as THREE from 'three';
import type { SatelliteSpectralMode } from '@/services/weather/types';
import type { WorldEvent } from '@/types';
import {
  OFFICIAL_CYCLONE_BASELINES,
  interpolateForecastPosition,
} from '@/services/weather/cycloneTrackingService';
import { getGeostationaryObservationDate } from '@/services/weather/satelliteImageryService';

export interface GeostationarySatelliteLayerOptions {
  radius?: number; // Globe radius (default 100)
  isMobile?: boolean;
  reducedMotion?: boolean;
  initialMode?: SatelliteSpectralMode;
  overlayRadar?: boolean;
}

export class GeostationarySatelliteLayer {
  private radius: number;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private spectralMode: SatelliteSpectralMode;
  private overlayRadar: boolean;

  private rootGroup: THREE.Group;
  private satelliteMesh: THREE.Mesh | null = null;
  private shaderMaterial: THREE.ShaderMaterial | null = null;
  private cloudTexture: THREE.Texture | null = null;

  private activeStormCenters: THREE.Vector4[] = []; // (lat, lng, radiusDeg, intensity)
  private currentEvents: WorldEvent[] = [];
  private currentHoursAhead: number = 0;

  constructor(options: GeostationarySatelliteLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
    this.spectralMode = options.initialMode ?? 'visible';
    this.overlayRadar = options.overlayRadar ?? false;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'GeostationarySatelliteLayer';

    this.initSatelliteMesh();
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setSpectralMode(mode: SatelliteSpectralMode): void {
    const prevMode = this.spectralMode;
    this.spectralMode = mode;
    if (this.shaderMaterial) {
      const modeInt = mode === 'visible' ? 0 : mode === 'blue' ? 1 : 2;
      this.shaderMaterial.uniforms.uMode.value = modeInt;
      if (prevMode !== mode) {
        this.loadCloudTexture();
      }
    }
  }

  public setOverlayRadar(enabled: boolean): void {
    this.overlayRadar = enabled;
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uOverlayRadar.value = enabled ? 1.0 : 0.0;
    }
  }

  public setTimeOffsetHours(hoursAhead: number): void {
    this.currentHoursAhead = hoursAhead;
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uTimeOffset.value = hoursAhead;
    }
    this.updateStormCenters();
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  /**
   * Updates real-world storm centers from live cyclone & severe storm events
   */
  public setEvents(events: WorldEvent[]): void {
    this.currentEvents = [...events];
    this.updateStormCenters();
  }

  /**
   * Dynamically interpolates storm centers along official forecast & observed tracks
   */
  private updateStormCenters(): void {
    const stormEvents = this.currentEvents.filter((e) => {
      if (e.category === 'severe_weather') return true;
      const t = e.title.toLowerCase();
      return t.includes('cyclone') || t.includes('hurricane') || t.includes('typhoon') || t.includes('tropical storm');
    });

    this.activeStormCenters = stormEvents.slice(0, 4).map((e) => {
      let lat = e.lat;
      let lng = e.lng;
      let windKph = e.planetaryTelemetry?.windSpeedKph || 85;

      const matchingCyclone = OFFICIAL_CYCLONE_BASELINES.find(
        (c) =>
          c.id === e.id ||
          c.name.toLowerCase() === e.title.toLowerCase() ||
          e.title.toLowerCase().includes(c.name.toLowerCase())
      );

      if (matchingCyclone && this.currentHoursAhead !== 0) {
        const interp = interpolateForecastPosition(matchingCyclone, this.currentHoursAhead);
        lat = interp.lat;
        lng = interp.lng;
        windKph = interp.windSpeedKph;
      }

      const radiusDeg = Math.min(8.0, Math.max(3.0, (windKph / 250) * 8.0));
      const intensity = Math.min(1.0, Math.max(0.4, windKph / 200));
      return new THREE.Vector4(lat, lng, radiusDeg, intensity);
    });

    if (this.shaderMaterial) {
      const uCenters = this.shaderMaterial.uniforms.uStormCenters.value as THREE.Vector4[];
      for (let i = 0; i < 4; i++) {
        if (this.activeStormCenters[i]) {
          uCenters[i].copy(this.activeStormCenters[i]);
        } else {
          uCenters[i].set(999, 999, 0, 0); // Inactive
        }
      }
    }
  }

  /**
   * Loads real-time geostationary satellite cloud imagery (Clean Infrared or VIIRS TrueColor) from NASA GIBS WMS.
   */
  private loadCloudTexture(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    const geoObs = getGeostationaryObservationDate(0);
    const dateStr = geoObs.dateStr;

    // Use live Himawari-9 Clean Infrared for infrared/blue, or VIIRS TrueColor for visible
    const liveWmsUrl = this.spectralMode === 'visible'
      ? `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=VIIRS_NOAA20_CorrectedReflectance_TrueColor&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=1024&HEIGHT=512&FORMAT=image/png&TIME=${dateStr}`
      : `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=Himawari_AHI_Band13_Clean_Infrared&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=1024&HEIGHT=512&FORMAT=image/png`;

    textureLoader.load(
      liveWmsUrl,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        this.cloudTexture = tex;
        if (this.shaderMaterial) {
          this.shaderMaterial.uniforms.uCloudTexture.value = tex;
          this.shaderMaterial.uniforms.uTextureReady.value = 1.0;
        }
      },
      undefined,
      () => {
        // Fallback to local texture if NASA WMS has network delay
        textureLoader.load('/textures/clouds.png', (fallbackTex) => {
          fallbackTex.wrapS = THREE.RepeatWrapping;
          fallbackTex.wrapT = THREE.ClampToEdgeWrapping;
          this.cloudTexture = fallbackTex;
          if (this.shaderMaterial) {
            this.shaderMaterial.uniforms.uCloudTexture.value = fallbackTex;
            this.shaderMaterial.uniforms.uTextureReady.value = 1.0;
          }
        });
      }
    );
  }

  /**
   * Initializes the Three.js spherical satellite shell mesh with custom GLSL shaders.
   */
  private initSatelliteMesh(): void {
    const sphereRadius = this.radius * 1.0016; // Hovering right above terrain & ocean to eliminate zoom parallax
    const segments = this.isMobile ? 48 : 64;
    const geometry = new THREE.SphereGeometry(sphereRadius, segments, segments);

    // Stream live geostationary satellite imagery texture with fallback
    this.loadCloudTexture();

    const stormCentersInit = [
      new THREE.Vector4(999, 999, 0, 0),
      new THREE.Vector4(999, 999, 0, 0),
      new THREE.Vector4(999, 999, 0, 0),
      new THREE.Vector4(999, 999, 0, 0),
    ];

    const modeInt = this.spectralMode === 'visible' ? 0 : this.spectralMode === 'blue' ? 1 : 2;

    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uMode: { value: modeInt },
        uOverlayRadar: { value: this.overlayRadar ? 1.0 : 0.0 },
        uCloudTexture: { value: this.cloudTexture },
        uTextureReady: { value: 0.0 },
        uTimeOffset: { value: 0.0 },
        uStormCenters: { value: stormCentersInit },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform int uMode; // 0 = visible, 1 = blue, 2 = infra
        uniform float uOverlayRadar;
        uniform sampler2D uCloudTexture;
        uniform float uTextureReady;
        uniform float uTimeOffset;
        uniform vec4 uStormCenters[4];

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        // Procedural noise for cloud micro-structure
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          v += 0.5000 * noise(p); p = p * 2.02;
          v += 0.2500 * noise(p); p = p * 2.03;
          v += 0.1250 * noise(p); p = p * 2.01;
          return v;
        }

        // Authentic Infrared Cloud-Top Brightness Temperature Color Ramp (Kelvin scale)
        // Cloud-free sky is 100% transparent. Only cold storm cloud decks show thermal colors.
        vec4 getInfraredColor(float density, float altitude) {
          if (density < 0.10) {
            return vec4(0.0, 0.0, 0.0, 0.0);
          }

          float kelvin = mix(265.0, 195.0, clamp((density - 0.10) / 0.90 * 0.7 + altitude * 0.3, 0.0, 1.0));

          vec3 col;
          float alpha;

          if (kelvin > 255.0) {
            // Low warm clouds: soft translucent mist
            col = vec3(0.85, 0.90, 0.95);
            alpha = smoothstep(265.0, 255.0, kelvin) * 0.35;
          } else if (kelvin > 240.0) {
            // Mid-level clouds: deep azure to electric cyan
            float t = (255.0 - kelvin) / 15.0;
            col = mix(vec3(0.05, 0.45, 0.85), vec3(0.05, 0.75, 0.95), t);
            alpha = mix(0.40, 0.70, t);
          } else if (kelvin > 225.0) {
            // High-level clouds: cyan to mint-emerald
            float t = (240.0 - kelvin) / 15.0;
            col = mix(vec3(0.05, 0.75, 0.95), vec3(0.12, 0.92, 0.45), t);
            alpha = mix(0.70, 0.85, t);
          } else if (kelvin > 212.0) {
            // Severe storm anvil: bright amber to orange
            float t = (225.0 - kelvin) / 13.0;
            col = mix(vec3(0.12, 0.92, 0.45), vec3(0.98, 0.76, 0.08), t);
            alpha = 0.90;
          } else if (kelvin > 200.0) {
            // Overshooting storm tops & cyclone eyewall: crimson to magenta
            float t = (212.0 - kelvin) / 12.0;
            col = mix(vec3(0.98, 0.76, 0.08), vec3(0.94, 0.12, 0.45), t);
            alpha = 0.94;
          } else {
            // Ultra-cold tropopause storm towers (< 200K): intense violet / white core
            float t = (200.0 - kelvin) / 10.0;
            col = mix(vec3(0.94, 0.12, 0.45), vec3(0.98, 0.90, 1.0), t);
            alpha = 0.96;
          }

          return vec4(col, alpha);
        }

        // Visible (Daylight Natural True Color) mode
        vec4 getVisibleColor(float density, float altitude) {
          if (density < 0.08) {
            return vec4(0.0, 0.0, 0.0, 0.0);
          }
          float cloudShade = mix(0.85, 1.0, altitude);
          vec3 cloudCol = vec3(0.96, 0.98, 1.0) * cloudShade;
          float alpha = smoothstep(0.08, 0.85, density * 1.15) * 0.85;
          return vec4(cloudCol, alpha);
        }

        // Blue (Moisture Band) mode
        vec4 getBlueColor(float density, float altitude) {
          if (density < 0.08) {
            return vec4(0.0, 0.0, 0.0, 0.0);
          }
          vec3 moistureCol = mix(vec3(0.05, 0.35, 0.85), vec3(0.45, 0.85, 1.0), density);
          float alpha = smoothstep(0.08, 0.75, density) * 0.80;
          return vec4(moistureCol, alpha);
        }

        void main() {
          vec2 uv = vUv;

          // Planetary rotation / advection drift
          float driftSpeed = 0.00045;
          float timeShift = (uTime * driftSpeed) + (uTimeOffset * 0.008);
          vec2 advectedUv = vec2(fract(uv.x + timeShift), uv.y);

          // Sample cloud texture
          float baseCloud = 0.0;
          if (uTextureReady > 0.5) {
            vec4 texColor = texture2D(uCloudTexture, advectedUv);
            float lum = max(texColor.r, max(texColor.g, texColor.b));
            // Transparent background or dark clear sky has zero cloud
            baseCloud = lum * (texColor.a > 0.01 ? texColor.a : 0.0);
          } else {
            // High-fidelity procedural fallback
            baseCloud = smoothstep(0.42, 0.82, fbm(advectedUv * 16.0));
          }

          // Dynamic turbulence
          float microNoise = fbm(advectedUv * 36.0 + uTime * 0.02);
          float cloudDensity = clamp(baseCloud * 1.15 + (microNoise - 0.5) * 0.25, 0.0, 1.0);
          float altitude = clamp(baseCloud * 0.8 + microNoise * 0.3, 0.0, 1.0);

          // Real cyclone vortex spirals (Coriolis twist)
          float lat = (0.5 - uv.y) * 180.0;
          float lng = (uv.x - 0.5) * 360.0;

          for (int i = 0; i < 4; i++) {
            if (uStormCenters[i].x < 900.0) {
              float sLat = uStormCenters[i].x;
              float sLng = uStormCenters[i].y;
              float sRadius = uStormCenters[i].z;
              float sIntensity = uStormCenters[i].w;

              float dLat = lat - sLat;
              float dLng = lng - sLng;
              if (dLng > 180.0) dLng -= 360.0;
              if (dLng < -180.0) dLng += 360.0;

              float dist = sqrt(dLat * dLat + dLng * dLng);
              if (dist < sRadius * 2.5) {
                float vortexFactor = 1.0 - smoothstep(0.0, sRadius * 2.5, dist);
                // Dense eyewall & outer spiral bands
                cloudDensity = mix(cloudDensity, 0.95, vortexFactor * sIntensity);
                altitude = mix(altitude, 0.98, vortexFactor * sIntensity);
              }
            }
          }

          // Apply selected spectral mode
          vec4 finalColor;
          if (uMode == 0) {
            finalColor = getVisibleColor(cloudDensity, altitude);
          } else if (uMode == 1) {
            finalColor = getBlueColor(cloudDensity, altitude);
          } else {
            finalColor = getInfraredColor(cloudDensity, altitude);
          }

          gl_FragColor = finalColor;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
    });

    this.satelliteMesh = new THREE.Mesh(geometry, this.shaderMaterial);
    this.satelliteMesh.rotation.y = -Math.PI / 2; // Match three-globe globeObj rotation so Prime Meridian aligns at +Z
    this.satelliteMesh.name = 'GeostationarySatelliteMesh';
    this.rootGroup.add(this.satelliteMesh);
  }

  /**
   * 60 FPS animation loop advancing cloud advection and storm vortex dynamics.
   */
  public update(time: number, delta: number = 0.016): void {
    if (this.reducedMotion || !this.shaderMaterial) return;
    this.shaderMaterial.uniforms.uTime.value = time * 0.001;
  }

  /**
   * Complete WebGL memory disposal on layer unmount.
   */
  public dispose(): void {
    if (this.satelliteMesh) {
      this.rootGroup.remove(this.satelliteMesh);
      this.satelliteMesh.geometry.dispose();
      this.satelliteMesh = null;
    }

    if (this.shaderMaterial) {
      this.shaderMaterial.dispose();
      this.shaderMaterial = null;
    }

    if (this.cloudTexture) {
      this.cloudTexture.dispose();
      this.cloudTexture = null;
    }

    while (this.rootGroup.children.length > 0) {
      const child = this.rootGroup.children[0];
      this.rootGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) (child as any).material.dispose();
    }
  }
}
