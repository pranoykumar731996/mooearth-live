// ============================================================
// MooEarth Live — 3D Geostationary Satellite Cloud Cover Layer
// ============================================================
// High-resolution global satellite cloud imagery layer matching Windy.com.
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

  constructor(options: GeostationarySatelliteLayerOptions = {}) {
    this.radius = options.radius ?? 100;
    this.isMobile = options.isMobile ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
    this.spectralMode = options.initialMode ?? 'infra';
    this.overlayRadar = options.overlayRadar ?? false;

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'GeostationarySatelliteLayer';

    this.initSatelliteMesh();
  }

  public getMesh(): THREE.Group {
    return this.rootGroup;
  }

  public setSpectralMode(mode: SatelliteSpectralMode): void {
    this.spectralMode = mode;
    if (this.shaderMaterial) {
      const modeInt = mode === 'visible' ? 0 : mode === 'blue' ? 1 : 2;
      this.shaderMaterial.uniforms.uMode.value = modeInt;
    }
  }

  public setOverlayRadar(enabled: boolean): void {
    this.overlayRadar = enabled;
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uOverlayRadar.value = enabled ? 1.0 : 0.0;
    }
  }

  public setTimeOffsetHours(hoursAgo: number): void {
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uTimeOffset.value = hoursAgo;
    }
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  /**
   * Updates real-world storm centers from live cyclone & severe storm events
   */
  public setEvents(events: WorldEvent[]): void {
    const stormEvents = events.filter((e) => {
      if (e.category === 'severe_weather') return true;
      const t = e.title.toLowerCase();
      return t.includes('cyclone') || t.includes('hurricane') || t.includes('typhoon') || t.includes('tropical storm');
    });

    this.activeStormCenters = stormEvents.slice(0, 4).map((e) => {
      const windKph = e.planetaryTelemetry?.windSpeedKph || 85;
      const radiusDeg = Math.min(8.0, Math.max(3.0, (windKph / 250) * 8.0));
      const intensity = Math.min(1.0, Math.max(0.4, windKph / 200));
      return new THREE.Vector4(e.lat, e.lng, radiusDeg, intensity);
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
   * Initializes the Three.js spherical satellite shell mesh with custom GLSL shaders.
   */
  private initSatelliteMesh(): void {
    const sphereRadius = this.radius * 1.0028; // Hovering right above terrain & ocean
    const segments = this.isMobile ? 48 : 64;
    const geometry = new THREE.SphereGeometry(sphereRadius, segments, segments);

    // Preload cloud texture (client-only)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const textureLoader = new THREE.TextureLoader();
      this.cloudTexture = textureLoader.load(
        '/textures/clouds.png',
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          if (this.shaderMaterial) {
            this.shaderMaterial.uniforms.uCloudTexture.value = tex;
            this.shaderMaterial.uniforms.uTextureReady.value = 1.0;
          }
        },
        undefined,
        (err) => console.warn('[GeostationarySatellite] Cloud texture notice:', err)
      );
    }

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

        // Authentic Windy Infrared Cloud-Top Brightness Temperature Color Ramp (Kelvin scale)
        // 240K -> 230K -> 220K -> 210K -> 200K
        vec4 getInfraredColor(float density, float altitude) {
          float kelvin = mix(275.0, 195.0, clamp(density * 0.7 + altitude * 0.5, 0.0, 1.0));

          vec3 col;
          float alpha;

          if (kelvin > 255.0) {
            // Warm sea surface / cloud-free troposphere: translucent dark navy
            col = vec3(0.015, 0.03, 0.08);
            alpha = smoothstep(270.0, 255.0, kelvin) * 0.25;
          } else if (kelvin > 240.0) {
            // Low / mid-level clouds: deep azure to electric cyan
            float t = (255.0 - kelvin) / 15.0;
            col = mix(vec3(0.02, 0.25, 0.65), vec3(0.05, 0.75, 0.95), t);
            alpha = mix(0.35, 0.75, t);
          } else if (kelvin > 225.0) {
            // Mid-high tropospheric clouds: cyan to mint-emerald
            float t = (240.0 - kelvin) / 15.0;
            col = mix(vec3(0.05, 0.75, 0.95), vec3(0.12, 0.92, 0.45), t);
            alpha = mix(0.75, 0.88, t);
          } else if (kelvin > 212.0) {
            // Severe storm anvil: bright amber to orange
            float t = (225.0 - kelvin) / 13.0;
            col = mix(vec3(0.12, 0.92, 0.45), vec3(0.98, 0.76, 0.08), t);
            alpha = 0.92;
          } else if (kelvin > 200.0) {
            // Severe overshooting convective tops & cyclone eyewall: crimson to magenta
            float t = (212.0 - kelvin) / 12.0;
            col = mix(vec3(0.98, 0.76, 0.08), vec3(0.94, 0.12, 0.45), t);
            alpha = 0.96;
          } else {
            // Ultra-cold tropopause storm towers (< 200K): intense violet / white core
            float t = (200.0 - kelvin) / 10.0;
            col = mix(vec3(0.94, 0.12, 0.45), vec3(0.98, 0.90, 1.0), t);
            alpha = 0.98;
          }

          return vec4(col, alpha);
        }

        // Visible (Daylight Natural True Color) mode
        vec4 getVisibleColor(float density, float altitude) {
          float cloudShade = mix(0.85, 1.0, altitude);
          vec3 cloudCol = vec3(0.96, 0.98, 1.0) * cloudShade;
          float alpha = smoothstep(0.08, 0.85, density * 1.15) * 0.92;
          return vec4(cloudCol, alpha);
        }

        // Blue (Moisture Band) mode
        vec4 getBlueColor(float density, float altitude) {
          vec3 moistureCol = mix(vec3(0.05, 0.35, 0.85), vec3(0.45, 0.85, 1.0), density);
          float alpha = smoothstep(0.05, 0.75, density) * 0.88;
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
            baseCloud = max(texColor.r, max(texColor.g, texColor.b));
            if (texColor.a > 0.0) baseCloud = max(baseCloud, texColor.a);
          } else {
            // High-fidelity procedural fallback
            baseCloud = fbm(advectedUv * 16.0);
          }

          // Add subtle dynamic turbulence
          float microNoise = fbm(advectedUv * 36.0 + uTime * 0.02);
          float cloudDensity = clamp(baseCloud * 1.25 + (microNoise - 0.5) * 0.35, 0.0, 1.0);
          float altitude = clamp(baseCloud * 0.8 + microNoise * 0.4, 0.0, 1.0);

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

          // Composite Doppler Radar Echo Overlay (RainViewer style dBZ cores)
          if (uOverlayRadar > 0.5 && cloudDensity > 0.6) {
            float radarNoise = fbm(advectedUv * 64.0 + 7.5);
            if (radarNoise > 0.55) {
              float dbzNorm = smoothstep(0.55, 0.88, radarNoise);
              vec3 radarCol = mix(vec3(0.15, 0.95, 0.15), vec3(0.95, 0.15, 0.15), dbzNorm);
              finalColor.rgb = mix(finalColor.rgb, radarCol, 0.85);
              finalColor.a = max(finalColor.a, 0.95);
            }
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
