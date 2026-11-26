// ============================================================
// MooEarth Live — City Map Viewer (MapLibre GL JS)
// ============================================================
// High-performance 2D interactive vector & raster city explorer:
// - Powered by MapLibre GL JS with MapTiler, Esri World Street & OpenFreeMap
// - Roads, labels, topography, and geographic features
// - Pulsing target coordinate pin with city tooltip
// - Floating Live Weather Telemetry Summary
// - Return to 3D Earth action preserving orbital view & state
// - Tile error handling, watchdog timeout & automated failover
// - Full cleanup on unmount (zero WebGL context leaks)

'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getLocationTime } from '@/services/weather/timeService';
import {
  isNoaaStarPilotEnabled,
  shouldUseNoaaStarPilotForSector,
  buildNoaaStarTileUrl,
  extractSectorFromUrl,
  parseNoaaStarFallbackHttpsUrl,
  formatNoaaFallbackReason,
  createEmptyTransparentPngBuffer,
  isTileOutsideSectorSupport,
  isBlackMarbleTileSolidDaylight,
  publishNoaaStarTelemetry,
  subscribeNoaaStarTelemetry,
  type NoaaStarPilotTelemetry,
} from '@/services/weather/noaaStarPilot';
import { useLocationTime } from '@/hooks/useLocationTime';
import {
  Map,
  NavigationControl,
  ScaleControl,
  Marker,
  Popup,
  setWorkerUrl,
  addProtocol,
  importScriptInWorkers,
  setMaxParallelImageRequests,
} from 'maplibre-gl';

// Configure standalone Web Worker asset in browser context before any worker operations
if (typeof window !== 'undefined') {
  try {
    setWorkerUrl('/maplibre-gl-worker.mjs');
    setMaxParallelImageRequests(64);
  } catch {
    // ignore if already set
  }
}

// Register custom MapLibre protocol for NASA GIBS TrueColor tiles:
// Converts opaque black void pixels (un-imaged swaths, missing passes) into transparent pixels (alpha = 0)
// and seamlessly cross-fills missing tracks with NOAA-20 VIIRS data, eliminating black cutoffs like Windy & Zoom Earth.
if (typeof window !== 'undefined' && !(window as any).__gibsAlphaProtocolRegistered) {
  (window as any).__gibsAlphaProtocolRegistered = true;
  try {
    importScriptInWorkers('/workers/gibs-protocol-worker.js').catch(e => console.warn('[CityMapViewer] worker protocol import notice:', e));

    function tileToLng(x: number, z: number): number {
      return (x / Math.pow(2, z)) * 360 - 180;
    }

    function tileToLat(y: number, z: number): number {
      const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
      return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    }

    // Circular partition of unity across all 360 degrees (Himawari, GOES-West, GOES-East, Meteosat)
    function getSectorSpatialWeight(url: string, lng: number, lat: number): number {
      const absLat = Math.abs(lat);

      // Polar Underlay: strictly 0.0 below 58°, smooth ramp 58°-65°, 1.0 above 65° up to 85°
      if (url.includes('worldcloudmap') || url.includes('mumi') || url.includes('global-polar')) {
        if (absLat > 85.0) return 0.0;
        if (absLat >= 65.0) return 1.0;
        if (absLat <= 58.0) return 0.0;
        return 0.5 * (1.0 - Math.cos(Math.PI * ((absLat - 58.0) / 7.0)));
      }

      let latWeight = 1.0;
      if (absLat > 65.0) return 0.0;
      else if (absLat > 55.0) latWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((absLat - 55.0) / 10.0)));

      const angle = (((lng % 360) + 360) % 360);
      let lngWeight = 0.0;
      let satLng = 0.0;

      const secId = extractSectorFromUrl(url);
      const isHimawari = secId === 'himawari';
      const isIodc = secId === 'eumet-iodc';
      const isMeteosatPrime = secId === 'europe-africa';
      const isGoesEast = secId === 'goes-east';
      const isGoesWest = secId === 'goes-west';

      // 5-Sentinel Exact Mathematical Partition of Unity (sum == 1.000 everywhere):
      if (isIodc) {
        satLng = 45.5;
        // Meteosat-9 IODC (45.5°E): Covers East Africa, Middle East, Arabian Sea, India, Bay of Bengal (25°E to 95°E)
        if (angle >= 25.0 && angle <= 45.0) {
          // Smooth blend with Meteosat Prime (25°E to 45°E)
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 25.0) / 20.0)));
        } else if (angle > 45.0 && angle <= 75.0) {
          lngWeight = 1.0; // 100% full coverage across Arabian Sea, Persian Gulf, Pakistan, NW India
        } else if (angle > 75.0 && angle <= 95.0) {
          // Smooth blend with Himawari across Central/Eastern India and Bay of Bengal (75°E to 95°E)
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 75.0) / 20.0)));
        }
      } else if (isHimawari) {
        satLng = 140.7;
        // Himawari-9 (140.7°E): Covers India, China, SE Asia, Japan, Australia, Western Pacific (75°E to 195°E)
        if (angle >= 75.0 && angle <= 95.0) {
          // Smooth blend with Meteosat-IODC across Central/Eastern India and Bay of Bengal (75°E to 95°E)
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 75.0) / 20.0)));
        } else if (angle > 95.0 && angle <= 165.0) {
          lngWeight = 1.0; // 100% full coverage across China, Japan, Korea, SE Asia, Australia
        } else if (angle > 165.0 && angle <= 195.0) {
          // Smooth blend with GOES-West over Western Pacific / Dateline (165°E to 195°E)
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
        }
      } else if (isGoesWest) {
        satLng = 222.8; // 137.2°W
        // GOES-West (137.2°W / 222.8°E): Covers Central/Eastern Pacific & US West (165°E to 265°E)
        if (angle >= 165.0 && angle <= 195.0) {
          // Smooth blend with Himawari over Western Pacific / Dateline (165°E to 195°E)
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
        } else if (angle > 195.0 && angle <= 225.0) {
          lngWeight = 1.0; // 100% full coverage across Hawaii, Central/East Pacific
        } else if (angle > 225.0 && angle <= 265.0) {
          // Smooth blend with GOES-East over Western North America / US West Coast / Rockies (225° to 265°)
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
        }
      } else if (isGoesEast) {
        satLng = 284.8; // 75.2°W
        // GOES-East (75.2°W / 284.8°E): Covers Americas, Caribbean, Atlantic (225°E to 345°E)
        if (angle >= 225.0 && angle <= 265.0) {
          // Smooth blend with GOES-West over Rockies / Great Plains (225° to 265°)
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
        } else if (angle > 265.0 && angle <= 320.0) {
          lngWeight = 1.0; // 100% full coverage across Eastern US, Caribbean, South America, Western Atlantic
        } else if (angle > 320.0 && angle <= 345.0) {
          // Smooth blend with Meteosat Prime over Mid-Atlantic (320° to 345°)
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
        }
      } else if (isMeteosatPrime) {
        satLng = 0.0;
        // Meteosat Prime (0°E): Covers Europe, West Africa, Atlantic (320° to 45°E)
        if (angle >= 320.0 && angle <= 345.0) {
          // Smooth blend with GOES-East over Mid-Atlantic (320° to 345°)
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
        } else if (angle > 345.0 || angle <= 25.0) {
          lngWeight = 1.0; // 100% full coverage across UK, France, Germany, Spain, West Africa
        } else if (angle > 25.0 && angle <= 45.0) {
          // Smooth blend with Meteosat-IODC over Eastern Europe / Red Sea / East Africa (25°E to 45°E)
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 25.0) / 20.0)));
        }
      }

      // Geostationary Earth Disk Horizon / Limb Feathering:
      // Smoothly feathers out disk edge (74° to 81° angular distance from sub-satellite point)
      let limbWeight = 1.0;
      if (isHimawari || isIodc || isMeteosatPrime || isGoesEast || isGoesWest) {
        const dLng = Math.abs((((lng - satLng + 540) % 360) - 180)) * (Math.PI / 180);
        const dLat = (lat * Math.PI) / 180;
        const cosPsi = Math.cos(dLat) * Math.cos(dLng);
        // cos(74°) ≈ 0.2756, cos(81°) ≈ 0.1564
        if (cosPsi <= 0.1564) {
          limbWeight = 0.0;
        } else if (cosPsi < 0.2756) {
          const t = (cosPsi - 0.1564) / (0.2756 - 0.1564);
          limbWeight = 0.5 * (1.0 - Math.cos(Math.PI * t));
        }
      }

      return Math.max(0.0, Math.min(1.0, lngWeight * latWeight * limbWeight));
    }

    function smoothMainCloudCurve(norm: number, mid = 0.26, slope = 5.5): number {
      if (norm <= 0.0) return 0.0;
      if (norm >= 1.0) return 1.0;
      const s0 = 1.0 / (1.0 + Math.exp(slope * mid));
      const s1 = 1.0 / (1.0 + Math.exp(-slope * (1.0 - mid)));
      const s = 1.0 / (1.0 + Math.exp(-slope * (norm - mid)));
      const scaled = (s - s0) / (s1 - s0);
      const feather = norm < 0.14 ? norm / 0.14 : 1.0;
      return Math.max(0.0, Math.min(1.0, scaled * feather));
    }

    function computeMainGeoColorDayCloud(r: number, g: number, b: number): number {
      const minC = r < g ? (r < b ? r : b) : (g < b ? g : b);
      const maxC = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const sat = maxC - minC;
      const warmExcess = r > b ? r - b : 0;
      const dayWhiteness = minC - 0.80 * sat - 0.60 * warmExcess;
      if (dayWhiteness <= 70.0) return 0.0;
      const dNorm = Math.min(1.0, (dayWhiteness - 70.0) / 138.0);
      return smoothMainCloudCurve(dNorm, 0.24, 5.5);
    }

    // Physical Elevation & Latitude Lapse-Rate Thermal Ground Discriminator
    // Rejects nocturnal freezing ground in high elevation (Tibet > 3500m) and cold winter interiors
    function getLocalThermalThreshold(lng: number, lat: number, isEumet: boolean): number {
      let thresh = isEumet ? 96 : 98;
      const absLat = Math.abs(lat);

      // 1. Tibetan Plateau & High Himalayas (26°N-39°N, 74°E-104°E, elevation 3,800m-5,500m):
      if (lat >= 26.0 && lat <= 39.0 && lng >= 74.0 && lng <= 104.0) {
        const edgeX = Math.min(lng - 74.0, 104.0 - lng) / 4.0;
        const edgeY = Math.min(lat - 26.0, 39.0 - lat) / 3.0;
        const coreFactor = Math.max(0.0, Math.min(1.0, Math.min(edgeX, edgeY)));
        thresh += 102 * coreFactor; // Peaks at 174 in plateau center
      }
      // 2. Central Asian & Mongolian Cold Continental Steppe (39°N-55°N, 70°E-125°E):
      else if (lat > 39.0 && lat <= 55.0 && lng >= 70.0 && lng <= 125.0) {
        const edgeX = Math.min(lng - 70.0, 125.0 - lng) / 8.0;
        const edgeY = Math.min(lat - 39.0, 55.0 - lat) / 4.0;
        const coreFactor = Math.max(0.0, Math.min(1.0, Math.min(edgeX, edgeY)));
        thresh += 88 * coreFactor; // Peaks at 160 over northern cold interior
      }
      // 3. High-latitude cold sub-polar continental land (> 55°N):
      else if (absLat > 55.0 && absLat <= 65.0) {
        const polarFactor = (absLat - 55.0) / 10.0;
        thresh += 50 * polarFactor;
      }
      return thresh;
    }

    function processMainThreadTile(d: Uint8ClampedArray, width: number, height: number, realUrl: string) {
      const len = d.length;
      const totalPixels = width * height;

      let tileZ = 3, tileY = 0, tileX = 0, hasCoords = false;
      const isGibs = realUrl.includes('gibs.earthdata.nasa.gov') || realUrl.includes('GoogleMapsCompatible') || realUrl.includes('gibs-alpha');
      const wmtsMatch = realUrl.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)/i);
      const queryMatch = realUrl.match(/[?&]z=(\d+)[&]x=(\d+)[&]y=(\d+)/i) || realUrl.match(/[?&]z=(\d+)[&]y=(\d+)[&]x=(\d+)/i);

      if (queryMatch) {
        tileZ = parseInt(queryMatch[1], 10);
        if (realUrl.includes('x=' + queryMatch[2])) {
          tileX = parseInt(queryMatch[2], 10);
          tileY = parseInt(queryMatch[3], 10);
        } else {
          tileY = parseInt(queryMatch[2], 10);
          tileX = parseInt(queryMatch[3], 10);
        }
        hasCoords = true;
      } else if (wmtsMatch) {
        tileZ = parseInt(wmtsMatch[1], 10);
        if (isGibs) {
          // NASA GIBS WMTS uses TileMatrix/TileRow/TileCol -> {z}/{y}/{x}
          tileY = parseInt(wmtsMatch[2], 10);
          tileX = parseInt(wmtsMatch[3], 10);
        } else {
          // Standard Slippy Tile format -> {z}/{x}/{y}
          tileX = parseInt(wmtsMatch[2], 10);
          tileY = parseInt(wmtsMatch[3], 10);
        }
        hasCoords = true;
      }

      const tileLngs = new Float32Array(width);
      const tileLats = new Float32Array(height);
      if (hasCoords) {
        for (let c = 0; c < width; c++) tileLngs[c] = tileToLng(tileX + (c + 0.5) / width, tileZ);
        for (let r = 0; r < height; r++) tileLats[r] = tileToLat(tileY + (r + 0.5) / height, tileZ);
      }

      const isVisMode = realUrl.includes('spectral=vis');
      const isInfraMode = realUrl.includes('spectral=infra');
      const isBlueMode = realUrl.includes('spectral=blue') || (!isVisMode && !isInfraMode);
      const isInfraLayer = realUrl.includes('Band13') || realUrl.includes('Infrared') || realUrl.includes('IR') || realUrl.includes('ir108');
      const isHimawariVis = realUrl.includes('Band3') || realUrl.includes('Himawari_AHI_Band3');
      const isGeoColor = realUrl.includes('GeoColor');
      const isEumet = realUrl.includes('msg_') || realUrl.includes('eumet');
      const isHimawari = realUrl.includes('Himawari') || realUrl.includes('himawari');
      const isGoes = realUrl.includes('GOES') || realUrl.includes('goes');

      // TrueColor Swaths (VIIRS NOAA-20 250m Level 9):
      // Natural optical daylight true color composite. Pass through cleanly without processing as single-channel IR.
      const isTrueColor = realUrl.includes('TrueColor') || realUrl.includes('CorrectedReflectance');
      if (isTrueColor) {
        for (let p = 0, idx = 0; idx < len; idx += 4, p++) {
          const r = d[idx], g = d[idx + 1], b = d[idx + 2];
          // Black background outside orbital swath
          if (r < 8 && g < 8 && b < 8) {
            d[idx + 3] = 0;
          }
        }
        return;
      }

      // Pass 1: Fast Per-Pixel Radiance & Convective Core Tagging
      const lum = new Float32Array(totalPixels);
      const convective = new Uint8Array(totalPixels);

      for (let p = 0, idx = 0; idx < len; idx += 4, p++) {
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        if (r < 28 && g < 28 && b < 28) {
          lum[p] = 0;
        } else {
          lum[p] = 0.299 * r + 0.587 * g + 0.114 * b;
        }

        if (isInfraLayer) {
          // Standardized thermodynamic convection threshold across all satellites:
          if (lum[p] >= 180) {
            convective[p] = 1; // Deep convective core
          } else if (lum[p] >= 162) {
            convective[p] = 2; // Convective rainband candidate
          }
        }
      }

      // Pass 2: Fast 3x3 Box Blur
      const blur = new Float32Array(totalPixels);
      for (let y = 0; y < height; y++) {
        const row = y * width;
        const prevRow = (y > 0 ? y - 1 : y) * width;
        const nextRow = (y < height - 1 ? y + 1 : y) * width;
        for (let x = 0; x < width; x++) {
          const prevCol = x > 0 ? x - 1 : x;
          const nextCol = x < width - 1 ? x + 1 : x;
          const p = row + x;
          blur[p] = (
            lum[prevRow + prevCol] + lum[prevRow + x] + lum[prevRow + nextCol] +
            lum[row + prevCol]     + lum[p]           + lum[row + nextCol] +
            lum[nextRow + prevCol] + lum[nextRow + x] + lum[nextRow + nextCol]
          ) * 0.1111111;

          if (convective[p] === 2) {
            let hasConvNeighbor = false;
            for (let dy = -2; dy <= 2 && !hasConvNeighbor; dy++) {
              const ny = Math.max(0, Math.min(height - 1, y + dy)) * width;
              for (let dx = -2; dx <= 2; dx++) {
                const nx = Math.max(0, Math.min(width - 1, x + dx));
                if (convective[ny + nx] === 1) {
                  hasConvNeighbor = true;
                  break;
                }
              }
            }
            if (hasConvNeighbor) convective[p] = 3;
          }
        }
      }

      // Pass 3: Physically-Accurate Non-Destructive Cloud Transfer Function (Windy & Zoom Earth Parity)
      // Zero artificial Sobel noise, zero unsharp distortion, and zero inter-tile boundary seams!
      for (let y = 0; y < height; y++) {
        const row = y * width;
        for (let x = 0; x < width; x++) {
          const p = row + x;
          const i = p * 4;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const isConv = convective[p] === 1 || convective[p] === 3;

          // Off-disk deep black space void
          if (lum[p] < 28 && !isConv) {
            d[i + 3] = 0;
            continue;
          }

          const spatWeight = hasCoords ? getSectorSpatialWeight(realUrl, tileLngs[x], tileLats[y]) : 1.0;
          if (spatWeight <= 0.001) {
            d[i + 3] = 0;
            continue;
          }

          const l = lum[p];
          const bl = blur[p];
          const baseRadiance = 0.65 * l + 0.35 * bl;

          if (isConv) {
            // High-definition convective storm tops & cyclone eyewall
            if (isInfraMode) {
              // Authentic Dvorak BD Color Scale
              if (r > 120 && b > 120 && g < 120) {
                d[i] = 255; d[i + 1] = 242; d[i + 2] = 255;
              } else if (convective[p] === 3 || (r > 20 && g < 35 && b < 35)) {
                d[i] = 220; d[i + 1] = 38; d[i + 2] = 38;
              } else if (r > 180 && g > 50) {
                d[i] = 245; d[i + 1] = 158; d[i + 2] = 11;
              } else if (g > 100 && r < 200) {
                d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
              } else {
                d[i] = 14; d[i + 1] = 165; d[i + 2] = 233;
              }
              d[i + 3] = Math.min(252, Math.round(248 * spatWeight));
            } else {
              // Blue / Atmospheric / Visible: Natural Convective Cloud Tops with Authentic Sensor Radiance
              const convIntensity = Math.min(1.0, Math.max(0.0, (baseRadiance - 150) / 60));
              const convTone = Math.min(255, Math.max(190, Math.round(baseRadiance)));
              const convAlpha = Math.min(252, Math.round((235 + 18 * convIntensity) * spatWeight));
              d[i] = convTone;
              d[i + 1] = convTone;
              d[i + 2] = Math.min(255, convTone + 2);
              d[i + 3] = convAlpha;
            }
            continue;
          }

          if (isBlueMode) {
            // ==========================================
            // BLUE / HD ATMOSPHERIC RADIOMETRIC CLOUD MODE (Zoom Earth & Windy Parity)
            // ==========================================
            let cloudAlpha = 0;
            let sigmoid = 0;

            if (isInfraLayer) {
              const irThresh = hasCoords ? getLocalThermalThreshold(tileLngs[x], tileLats[y], isEumet) : (isEumet ? 96 : 98);
              if (baseRadiance <= irThresh) {
                d[i + 3] = 0;
                continue;
              }
              const norm = Math.min(1.0, Math.max(0.0, (baseRadiance - irThresh) / (215.0 - irThresh)));
              sigmoid = smoothMainCloudCurve(norm, 0.24, 5.5);
              cloudAlpha = Math.round(250.0 * sigmoid * spatWeight);
            } else {
              // Visible optical channels (Himawari Band 3, GOES GeoColor, Meteosat vis006):
              if (isGeoColor) {
                sigmoid = computeMainGeoColorDayCloud(r, g, b);
                if (sigmoid <= 0.0) { d[i + 3] = 0; continue; }
                cloudAlpha = Math.round(248 * sigmoid * spatWeight);
              } else if (isHimawariVis) {
                if (r <= 78) { d[i + 3] = 0; continue; }
                const norm = Math.min(1.0, (r - 78) / (200 - 78));
                sigmoid = smoothMainCloudCurve(norm, 0.26, 5.5);
                cloudAlpha = Math.round(250 * sigmoid * spatWeight);
              } else if (isEumet) {
                if (l <= 82) { d[i + 3] = 0; continue; }
                const norm = Math.min(1.0, (l - 82) / (205 - 82));
                sigmoid = smoothMainCloudCurve(norm, 0.26, 5.5);
                cloudAlpha = Math.round(250 * sigmoid * spatWeight);
              } else {
                if (baseRadiance <= 64) {
                  d[i + 3] = 0;
                  continue;
                }
                const norm = Math.min(1.0, (baseRadiance - 64) / (200 - 64));
                sigmoid = smoothMainCloudCurve(norm, 0.26, 5.5);
                cloudAlpha = Math.round(248 * sigmoid * spatWeight);
              }
            }

            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }

            if (isInfraLayer) {
              const cloudTone = Math.min(255, Math.round(218 + 37 * sigmoid));
              const thinness = Math.max(0.0, 1.0 - sigmoid);
              const rayleighB = Math.round(7.0 * thinness);
              const rayleighG = Math.round(2.0 * thinness);

              d[i] = cloudTone;
              d[i + 1] = Math.min(255, cloudTone + rayleighG);
              d[i + 2] = Math.min(255, cloudTone + rayleighB);
              d[i + 3] = cloudAlpha;
            } else if (isGeoColor) {
              const cloudTone = Math.min(255, Math.round(224 + 31 * sigmoid));
              const thin = Math.max(0.0, 1.0 - sigmoid);
              d[i] = Math.min(255, Math.round(cloudTone - 3 * thin));
              d[i + 1] = Math.min(255, Math.round(cloudTone));
              d[i + 2] = Math.min(255, Math.round(cloudTone + 6 * thin));
              d[i + 3] = cloudAlpha;
            } else {
              const thinness = Math.max(0.0, 1.0 - sigmoid);
              const rayleighB = Math.round(6.0 * thinness);
              const rayleighG = Math.round(2.0 * thinness);
              const cloudTone = Math.min(255, Math.round(225 + 30 * sigmoid));

              d[i] = cloudTone;
              d[i + 1] = Math.min(255, cloudTone + rayleighG);
              d[i + 2] = Math.min(255, cloudTone + rayleighB);
              d[i + 3] = cloudAlpha;
            }

          } else if (isVisMode) {
            // ==========================================
            // VISIBLE / OPTICAL REFLECTANCE MODE (Natural Day / Fallback Night)
            // ==========================================
            if (isEumet && !isInfraLayer) {
              if (l <= 82) { d[i + 3] = 0; continue; }
              const norm = Math.min(1.0, (l - 82) / (205 - 82));
              const sigmoid = smoothMainCloudCurve(norm, 0.26, 5.5);
              const cloudAlpha = Math.round(250 * sigmoid * spatWeight);
              if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
              const thinness = Math.max(0.0, 1.0 - sigmoid);
              const rayleighB = Math.round(5.0 * thinness);
              const rayleighG = Math.round(2.0 * thinness);
              const cloudTone = Math.min(255, Math.round(225 + 30 * sigmoid));
              d[i] = cloudTone;
              d[i + 1] = Math.min(255, cloudTone + rayleighG);
              d[i + 2] = Math.min(255, cloudTone + rayleighB);
              d[i + 3] = cloudAlpha;
            } else if (isHimawariVis) {
              if (r <= 78) { d[i + 3] = 0; continue; }
              const norm = Math.min(1.0, (r - 78) / (200 - 78));
              const sigmoid = smoothMainCloudCurve(norm, 0.26, 5.5);
              const cloudAlpha = Math.round(250 * sigmoid * spatWeight);
              if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
              const thinness = Math.max(0.0, 1.0 - sigmoid);
              const rayleighB = Math.round(5.0 * thinness);
              const rayleighG = Math.round(2.0 * thinness);
              const cloudTone = Math.min(255, Math.round(225 + 30 * sigmoid));
              d[i] = cloudTone;
              d[i + 1] = Math.min(255, cloudTone + rayleighG);
              d[i + 2] = Math.min(255, cloudTone + rayleighB);
              d[i + 3] = cloudAlpha;
            } else if (isGeoColor) {
              const sigmoid = computeMainGeoColorDayCloud(r, g, b);
              const cloudAlpha = Math.round(248 * sigmoid * spatWeight);
              if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
              const cloudTone = Math.min(255, Math.round(224 + 31 * sigmoid));
              const thin = Math.max(0.0, 1.0 - sigmoid);
              d[i] = Math.min(255, Math.round(cloudTone - 3 * thin));
              d[i + 1] = Math.min(255, Math.round(cloudTone));
              d[i + 2] = Math.min(255, Math.round(cloudTone + 6 * thin));
              d[i + 3] = cloudAlpha;
            } else if (isInfraLayer) {
              // Clean Infrared Band 13 (Truth in Remote Sensing - Zoom Earth & Windy Parity)
              const irThresh = hasCoords ? getLocalThermalThreshold(tileLngs[x], tileLats[y], isEumet) : (isEumet ? 96 : 98);
              if (baseRadiance <= irThresh) { d[i + 3] = 0; continue; }
              const norm = Math.min(1.0, (baseRadiance - irThresh) / (215 - irThresh));
              const sigmoid = smoothMainCloudCurve(norm, 0.24, 5.5);
              const cloudAlpha = Math.round(250 * sigmoid * spatWeight);
              if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
              const cloudTone = Math.min(255, Math.round(218 + 37 * sigmoid));
              const thinness = Math.max(0.0, 1.0 - sigmoid);
              const rayleighB = Math.round(7.0 * thinness);
              const rayleighG = Math.round(2.0 * thinness);
              d[i] = cloudTone;
              d[i + 1] = Math.min(255, cloudTone + rayleighG);
              d[i + 2] = Math.min(255, cloudTone + rayleighB);
              d[i + 3] = cloudAlpha;
            } else {
              if (l <= 64) { d[i + 3] = 0; continue; }
              const norm = Math.min(1.0, (l - 64) / (200 - 64));
              const sigmoid = smoothMainCloudCurve(norm, 0.26, 5.5);
              const cloudAlpha = Math.round(248 * sigmoid * spatWeight);
              if (cloudAlpha <= 2) { d[i + 3] = 0; continue; }
              const cloudTone = Math.min(255, Math.round(225 + 30 * sigmoid));
              d[i] = cloudTone; d[i + 1] = cloudTone; d[i + 2] = cloudTone; d[i + 3] = cloudAlpha;
            }
          } else {
            // ==========================================
            // INFRARED THERMAL MODE (Dvorak/BD Hurricane Scale)
            // ==========================================
            const thresh = isEumet ? 98 : 102;
            const maxRange = isEumet ? 190 : 225;
            if (l <= thresh) { d[i + 3] = 0; continue; }
            const norm = Math.min(1.0, (l - thresh) / (maxRange - thresh));
            const finalAlpha = Math.round(245 * Math.pow(norm, 0.78) * spatWeight);
            if (finalAlpha <= 2) { d[i + 3] = 0; continue; }
            if (norm < 0.25) {
              const tone = Math.min(255, Math.max(195, Math.round(210 + 35 * norm)));
              d[i] = tone; d[i + 1] = tone; d[i + 2] = Math.min(255, tone + 4);
            } else if (norm < 0.45) {
              const tone = Math.min(255, Math.max(220, Math.round(230 + 20 * norm)));
              d[i] = tone; d[i + 1] = tone; d[i + 2] = tone;
            } else if (norm < 0.65) {
              d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
            } else if (norm < 0.85) {
              d[i] = 245; d[i + 1] = 158; d[i + 2] = 11;
            } else {
              d[i] = 239; d[i + 1] = 68; d[i + 2] = 68;
            }
            d[i + 3] = finalAlpha;
          }
        }
      }

      // Sub-Pixel Spatial Anti-Aliasing (Gentle, preserves natural cloud gradients):
      applyMainThreadSpatialSmoothing(d, width, height);
    }

    function applyMainThreadSpatialSmoothing(d: Uint8ClampedArray, width: number, height: number) {
      const numPixels = width * height;
      const alphaCopy = new Uint8Array(numPixels);
      for (let p = 0; p < numPixels; p++) {
        alphaCopy[p] = d[(p << 2) + 3];
      }

      // Step A: Deep Sensor Noise Speckle Elimination (Eradicates isolated 1-2px noise spikes over ocean)
      for (let y = 1; y < height - 1; y++) {
        const row = y * width;
        for (let x = 1; x < width - 1; x++) {
          const p = row + x;
          const a = alphaCopy[p];
          if (a > 0) {
            const aN = alphaCopy[p - width];
            const aS = alphaCopy[p + width];
            const aW = alphaCopy[p - 1];
            const aE = alphaCopy[p + 1];
            if (aN === 0 && aS === 0 && aW === 0 && aE === 0) {
              d[(p << 2) + 3] = 0;
            }
          }
        }
      }

      // Step B: Gentle Bilinear Anti-Aliasing across translucent cloud borders
      for (let p = 0; p < numPixels; p++) {
        alphaCopy[p] = d[(p << 2) + 3];
      }
      for (let y = 1; y < height - 1; y++) {
        const row = y * width;
        for (let x = 1; x < width - 1; x++) {
          const p = row + x;
          const a = alphaCopy[p];
          if (a > 0 && a < 180) {
            const aN = alphaCopy[p - width];
            const aS = alphaCopy[p + width];
            const aW = alphaCopy[p - 1];
            const aE = alphaCopy[p + 1];
            if (aN === 0 || aS === 0 || aW === 0 || aE === 0) {
              const smoothed = Math.round(0.40 * a + 0.15 * (aN + aS + aW + aE));
              d[(p << 2) + 3] = smoothed <= 3 ? 0 : smoothed;
            }
          }
        }
      }
    }

    async function fetchAndProcessMainThreadGibsTile(initialHttpsUrl: string, signal: AbortSignal) {
      let realUrl = initialHttpsUrl;
      let res = await fetch(realUrl, { signal });
      if (!res.ok && res.status === 404) {
        const isoMatch = realUrl.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
        if (isoMatch) {
          const curIso = isoMatch[1];
          const curTime = new Date(curIso).getTime();

          // Step 1: Try 3 previous 10-minute sub-hourly snapshots
          for (let step = 1; step <= 3 && !res.ok; step++) {
            const prev = new Date(curTime - step * 10 * 60000);
            const yyyy = prev.getUTCFullYear();
            const mm = String(prev.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(prev.getUTCDate()).padStart(2, '0');
            const hh = String(prev.getUTCHours()).padStart(2, '0');
            const min = String(prev.getUTCMinutes()).padStart(2, '0');
            const fbIso = `${yyyy}-${mm}-${dd}T${hh}:${min}:00Z`;
            const fbUrl = realUrl.replace(curIso, fbIso);
            try {
              if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
              const fbRes = await fetch(fbUrl, { signal });
              if (fbRes.ok) {
                res = fbRes;
                realUrl = fbUrl;
                break;
              }
            } catch (err) {
              if (signal.aborted) throw err;
            }
          }

          // Step 2: If all sub-hourly ISO timestamps failed, fall back to date-only
          if (!res.ok) {
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
            const dateOnly = curIso.slice(0, 10);
            const dateOnlyUrl = realUrl.replace(isoMatch[0], dateOnly);
            try {
              const dateRes = await fetch(dateOnlyUrl, { signal });
              if (dateRes.ok) {
                res = dateRes;
                realUrl = dateOnlyUrl;
              }
            } catch (err) {
              if (signal.aborted) throw err;
            }
          }
        }
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();

      if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') {
        const buf = await blob.arrayBuffer();
        return { data: buf };
      }

      return processBlobViaMainCanvas(blob, processMainThreadTile, realUrl);
    }

    async function fetchWithTimeoutSignalMain(url: string, externalSignal: AbortSignal, timeoutMs: number): Promise<Response> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const onExternalAbort = () => controller.abort();
      if (externalSignal.aborted) {
        clearTimeout(timeoutId);
        throw new DOMException('Aborted', 'AbortError');
      }
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      try {
        return await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }

    async function processBlobViaMainCanvas(
      blob: Blob,
      processFn: (data: Uint8ClampedArray, w: number, h: number, url: string) => void,
      url: string
    ): Promise<{ data: any }> {
      if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') {
        return { data: await blob.arrayBuffer() };
      }
      let bitmap: ImageBitmap | null = null;
      let canvas: HTMLCanvasElement | null = null;
      try {
        bitmap = await createImageBitmap(blob);
        canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const passthrough = bitmap;
          bitmap = null;
          return { data: passthrough };
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        bitmap = null;
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        processFn(imgData.data, canvas.width, canvas.height, url);
        ctx.putImageData(imgData, 0, 0);
        const cleanBitmap = await createImageBitmap(canvas);
        return { data: cleanBitmap };
      } catch {
        return { data: await blob.arrayBuffer() };
      } finally {
        if (bitmap && typeof bitmap.close === 'function') {
          try { bitmap.close(); } catch {}
        }
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
      }
    }

    addProtocol('gibs-alpha', async (params, abortController) => {
      if (isTileOutsideSectorSupport(params.url)) {
        return { data: createEmptyTransparentPngBuffer() };
      }
      const realUrl = params.url.replace(/^gibs-alpha:\/\//, 'https://');
      return fetchAndProcessMainThreadGibsTile(realUrl, abortController.signal);
    });

    // Dedicated Web Worker RPC for noaa-star:// (MapLibre RasterTileSource runs addProtocol on main thread,
    // so tile fetch/decode/strip-extraction/LUT reprojection must be explicitly offloaded off the UI thread).
    let noaaWorkerInstance: Worker | null = null;
    let noaaRpcSeq = 1;
    const noaaRpcPending: Record<
      number,
      {
        resolve: (val: { data: any }) => void;
        reject: (err: unknown) => void;
        cleanup: () => void;
      }
    > = {};

    function getNoaaDedicatedWorker(): Worker | null {
      if (typeof Worker === 'undefined') return null;
      if (noaaWorkerInstance) return noaaWorkerInstance;
      try {
        const w = new Worker('/workers/gibs-protocol-worker.js');
        w.addEventListener('message', (event: MessageEvent) => {
          const msg = event.data;
          if (!msg || msg.__noaaStarRpc !== true) return;
          if (msg.type === 'telemetry' && msg.telemetry) {
            publishNoaaStarTelemetry(msg.telemetry);
            return;
          }
          const entry = noaaRpcPending[msg.id];
          if (!entry) return;
          delete noaaRpcPending[msg.id];
          entry.cleanup();
          if (msg.type === 'result') {
            entry.resolve({ data: msg.data });
          } else {
            if (msg.name === 'AbortError') {
              entry.reject(new DOMException(msg.message || 'Aborted', 'AbortError'));
            } else {
              entry.reject(new Error(msg.message || 'NOAA worker tile error'));
            }
          }
        });
        w.addEventListener('error', () => {
          noaaWorkerInstance = null;
          for (const idStr of Object.keys(noaaRpcPending)) {
            const idNum = Number(idStr);
            const entry = noaaRpcPending[idNum];
            delete noaaRpcPending[idNum];
            if (entry) {
              entry.cleanup();
              entry.reject(new Error('NOAA dedicated worker error'));
            }
          }
        });
        noaaWorkerInstance = w;
        return w;
      } catch {
        return null;
      }
    }

    addProtocol('noaa-star', async (params, abortController) => {
      if (abortController.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      if (isTileOutsideSectorSupport(params.url)) {
        return { data: createEmptyTransparentPngBuffer() };
      }
      const worker = getNoaaDedicatedWorker();
      if (worker) {
        try {
          return await new Promise<{ data: any }>((resolve, reject) => {
            const id = noaaRpcSeq++;
            const onAbort = () => {
              const entry = noaaRpcPending[id];
              if (entry) {
                delete noaaRpcPending[id];
                entry.cleanup();
              }
              try {
                worker.postMessage({ __noaaStarRpc: true, type: 'abort', id });
              } catch {}
              reject(new DOMException('Aborted', 'AbortError'));
            };
            const cleanup = () => {
              abortController.signal.removeEventListener('abort', onAbort);
            };
            noaaRpcPending[id] = { resolve, reject, cleanup };
            abortController.signal.addEventListener('abort', onAbort, { once: true });
            worker.postMessage({ __noaaStarRpc: true, type: 'tile', id, url: params.url });
          });
        } catch (err) {
          if (abortController.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
            throw err;
          }
          // Fall through only if worker execution itself errored unexpectedly
        }
      }

      const fallbackUrl = parseNoaaStarFallbackHttpsUrl(params.url);
      if (!fallbackUrl) throw new Error('Invalid noaa-star fallback URL');
      const freshController = new AbortController();
      const onMapAbort = () => freshController.abort();
      abortController.signal.addEventListener('abort', onMapAbort, { once: true });
      try {
        return await fetchAndProcessMainThreadGibsTile(fallbackUrl, freshController.signal);
      } finally {
        abortController.signal.removeEventListener('abort', onMapAbort);
      }
    });

    function eumetUrlToProxyOrWms(url: string): string {
      const match = url.match(/\/tile\/([^/?]+)\/(\d+)\/(\d+)\/(\d+)\.png/i);
      if (!match) return url.replace(/^eumet-alpha:\/\//, 'https://');
      const layer = match[1];
      const z = parseInt(match[2], 10);
      const x = parseInt(match[3], 10);
      const y = parseInt(match[4], 10);
      // Route through our edge-cached proxy API for reliable, fast delivery
      return `/api/weather/satellite/eumet-tile?z=${z}&x=${x}&y=${y}&layer=${encodeURIComponent(layer)}`;
    }

    // Keep direct WMS fallback for when proxy is unavailable
    function eumetUrlToWmsDirect(url: string): string {
      const match = url.match(/\/tile\/([^/?]+)\/(\d+)\/(\d+)\/(\d+)\.png/i);
      if (!match) return url.replace(/^eumet-alpha:\/\//, 'https://');
      const layer = match[1];
      const z = parseInt(match[2], 10);
      const x = parseInt(match[3], 10);
      const y = parseInt(match[4], 10);
      const originShift = 20037508.342789244;
      const worldSize = originShift * 2;
      const n = Math.pow(2, z);
      const res = worldSize / n;
      const minX = x * res - originShift;
      const maxX = (x + 1) * res - originShift;
      const maxY = originShift - y * res;
      const minY = originShift - (y + 1) * res;
      return `https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=${minX},${minY},${maxX},${maxY}&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=${encodeURIComponent(layer)}&FORMAT=image/png&TRANSPARENT=TRUE`;
    }

    addProtocol('eumet-alpha', async (params, abortController) => {
      if (isTileOutsideSectorSupport(params.url)) {
        return { data: createEmptyTransparentPngBuffer() };
      }
      try {
        let res: Response | null = null;

        // Primary: direct EUMETSAT WMS (Zero Vercel Serverless CPU cost, native CORS + 7-day browser cache)
        try {
          const directRes = await fetchWithTimeoutSignalMain(eumetUrlToWmsDirect(params.url), abortController.signal, 9000);
          if (directRes.ok) res = directRes;
        } catch {
          // Direct WMS failed/timed out, fall through to edge proxy fallback
        }

        // Fallback: edge proxy ONLY if direct WMS fails (e.g. strict firewall or network block)
        if (!res) {
          try {
            const proxyRes = await fetchWithTimeoutSignalMain(eumetUrlToProxyOrWms(params.url), abortController.signal, 10000);
            if (proxyRes.ok) res = proxyRes;
          } catch {
            // Proxy failed/timed out
          }
        }

        if (!res || !res.ok) throw new Error('All EUMETSAT tile sources failed');
        const blob = await res.blob();
        return processBlobViaMainCanvas(blob, processMainThreadTile, params.url);
      } catch (err) {
        if (abortController.signal.aborted) throw err;
        // Fallback transparent 1x1 png buffer so map tile engine never hangs
        return { data: createEmptyTransparentPngBuffer() };
      }
    });

    function processMainThreadBlackMarble(d: Uint8ClampedArray, width: number, height: number, url: string) {
      const coordMatch = url.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)/i);
      let tileZ = 3, tileY = 0, tileX = 0, hasCoords = false;
      if (coordMatch) {
        tileZ = parseInt(coordMatch[1], 10);
        tileY = parseInt(coordMatch[2], 10);
        tileX = parseInt(coordMatch[3], 10);
        hasCoords = true;
      }
      if (!hasCoords) return;

      const tMatch = url.match(/[?&]t=(\d+)/);
      const timeMs = tMatch ? parseInt(tMatch[1], 10) : Date.now();
      const dateObj = new Date(timeMs);
      const dayDiff = (timeMs - 946728000000) / 86400000;
      const L = (280.460 + 0.9856474 * dayDiff) % 360;
      const g = ((357.528 + 0.9856003 * dayDiff) % 360) * Math.PI / 180;
      const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
      const eps = (23.439 - 0.0000004 * dayDiff) * Math.PI / 180;
      const solLat = Math.asin(Math.sin(eps) * Math.sin(lambda)) * 180 / Math.PI;
      const utcHours = dateObj.getUTCHours() + dateObj.getUTCMinutes() / 60 + dateObj.getUTCSeconds() / 3600;
      const solLng = ((12 - utcHours) * 15 + 540) % 360 - 180;
      const rad = Math.PI / 180;

      const tileLngs = new Float32Array(width);
      const tileLats = new Float32Array(height);
      for (let c = 0; c < width; c++) tileLngs[c] = tileToLng(tileX + (c + 0.5) / width, tileZ);
      for (let r = 0; r < height; r++) tileLats[r] = tileToLat(tileY + (r + 0.5) / height, tileZ);

      for (let y = 0; y < height; y++) {
        const row = y * width;
        const pLat = tileLats[y];
        const sinLat = Math.sin(pLat * rad);
        const cosLat = Math.cos(pLat * rad);
        const sinSol = Math.sin(solLat * rad);
        const cosSol = Math.cos(solLat * rad);

        for (let x = 0; x < width; x++) {
          const p = row + x;
          const i = p * 4;
          const pLng = tileLngs[x];

          const cosZenith = sinLat * sinSol + cosLat * cosSol * Math.cos((pLng - solLng) * rad);
          if (cosZenith >= 0.06) {
            d[i + 3] = 0;
            continue;
          }

          let nightWeight = 1.0;
          if (cosZenith > -0.06) {
            const t = (cosZenith - (-0.06)) / 0.12;
            nightWeight = 0.5 * (1.0 + Math.cos(t * Math.PI));
          }

          const r = d[i], g = d[i + 1], b = d[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          // Dark oceans and unpopulated areas: smooth nocturnal darkening without vector knife cuts
          if (lum < 14) {
            d[i] = 1;
            d[i + 1] = 3;
            d[i + 2] = 8;
            d[i + 3] = Math.round(180 * nightWeight);
            continue;
          }

          // City lights & populated centers: warm golden radiance (Zoom Earth parity)
          const intensity = Math.min(1.0, Math.pow((lum - 14) / 75.0, 0.65));
          const alpha = Math.min(252, Math.round(250 * intensity * nightWeight));

          d[i] = Math.min(255, Math.round(r * 1.35 + 28));
          d[i + 1] = Math.min(255, Math.round(g * 1.20 + 18));
          d[i + 2] = Math.min(255, Math.round(b * 0.85 + 4));
          d[i + 3] = alpha;
        }
      }
    }

    addProtocol('black-marble-alpha', async (params, abortController) => {
      if (isBlackMarbleTileSolidDaylight(params.url)) {
        return { data: createEmptyTransparentPngBuffer() };
      }
      try {
        const realUrl = params.url.replace(/^black-marble-alpha:\/\//, 'https://');
        const res = await fetchWithTimeoutSignalMain(realUrl, abortController.signal, 9000);
        if (!res.ok) return { data: createEmptyTransparentPngBuffer() };
        const blob = await res.blob();
        return processBlobViaMainCanvas(blob, processMainThreadBlackMarble, params.url);
      } catch (err) {
        if (abortController.signal.aborted) throw err;
        return { data: createEmptyTransparentPngBuffer() };
      }
    });
  } catch (protoErr) {
    console.warn('[CityMapViewer] gibs-alpha protocol notice:', protoErr);
  }
}
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  type MapStyleKey,
  type MapStyleOption,
  MAP_STYLES,
  DEFAULT_CITY_ZOOM,
  getDefaultMapStyleKey,
  getFailoverStyle,
} from '@/services/map/mapStyles';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedCountryName } from '@/lib/i18n';
import type { WorldEvent } from '@/types';
import type {
  SatelliteSpectralMode,
  WeatherLayerMode,
  GeographicFeatureType,
  SearchFocusMode,
} from '@/services/weather/types';
import type { GlobalWeatherGridResponse } from '@/services/weather/globalGridService';
import {
  type TropicalCyclone,
  interpolateForecastPosition,
  getSaffirSimpsonCategoryNumber,
  buildUncertaintyConeGeoJson,
  getActiveTropicalCyclones,
} from '@/services/weather/cycloneTrackingService';
import { getNowcastLightningFeed, type LightningFeedResponse } from '@/services/weather/lightningService';
import { getSatelliteObservationDate, getGeostationaryObservationDate } from '@/services/weather/satelliteImageryService';
import { getNightTerminatorGeoJSON } from '@/services/weather/solarTerminatorService';
import WeatherMapLibreOverlay from './WeatherMapLibreOverlay';
import { GLOBAL_PRESSURE_CENTERS, getIsobarLevels } from '@/components/Globe/WeatherLayers/AtmosphericPressureLayer';
import RadarCoverageNotice from '@/components/Weather/RadarCoverageNotice';
import { isLocationCoveredByRadar } from '@/services/weather/radarAdapter';
import NearbyPlacesPanel from './NearbyPlacesPanel';

export type { MapStyleKey, MapStyleOption };
export { MAP_STYLES, DEFAULT_CITY_ZOOM };

// Configure standalone Web Worker asset in browser context
if (typeof window !== 'undefined') {
  try {
    setWorkerUrl('/maplibre-gl-worker.mjs');
  } catch {
    // ignore if already set
  }
}

export interface CityWeatherSummary {
  temperature?: number;
  apparentTemperature?: number;
  weatherDescription?: string;
  weatherEmoji?: string;
  windSpeed?: number;
  relativeHumidity?: number;
  precipitation?: number;
  units?: string;
  timezone?: string;
  isDay?: boolean | number;
}

import {
  getDisasterMeta,
  type DisasterCategoryType,
  type DisasterMeta,
} from '@/services/map/disasterMapUtils';

export { getDisasterMeta, type DisasterCategoryType, type DisasterMeta };

// Canonical storm designator and distance helpers for cyclone deduplication
function extractStormDesignator(nameOrTitle: string, id: string = ''): string {
  const combined = `${nameOrTitle} ${id}`.toLowerCase();
  const mNum = combined.match(/\b(?:invest\s*)?(\d{1,2}[a-z]?)\b/i);
  if (mNum) return mNum[1].toUpperCase();
  const mJtwc = combined.match(/\b([a-z]{2}\d{2,4})\b/i);
  if (mJtwc) return mJtwc[1].toUpperCase();
  return nameOrTitle
    .toLowerCase()
    .replace(/^(advisory:?\s*|cyclone\s*|tropical\s*storm\s*|hurricane\s*|typhoon\s*|invest\s*)/i, '')
    .trim();
}

function calcDistKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface CityMapViewerProps {
  latitude: number;
  longitude: number;
  cityName: string;
  countryName?: string;
  timezone?: string;
  initialZoom?: number;
  featureType?: GeographicFeatureType;
  flyTriggerSeq?: number;
  searchFocusMode?: SearchFocusMode;
  onFocusModeChange?: (mode: SearchFocusMode) => void;
  weatherGridData?: GlobalWeatherGridResponse | null;
  initialMapStyle?: MapStyleKey;
  weatherSummary?: CityWeatherSummary | null;
  activeLayer?: string;
  onLayerChange?: (layer: WeatherLayerMode) => void;
  radarTileUrl?: string;
  satelliteTileUrl?: string;
  satelliteObservationUtc?: string;
  spectralMode?: SatelliteSpectralMode;
  onSelectSpectralMode?: (mode: SatelliteSpectralMode) => void;
  particlesEnabled?: boolean;
  showPressureIsobars?: boolean;
  disasters?: WorldEvent[];
  disasterFilter?: 'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather';
  onSelectDisasterFilter?: (filter: 'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather') => void;
  selectedDisaster?: WorldEvent | null;
  onSelectDisaster?: (event: WorldEvent | null) => void;
  onInspectDossier?: (event: WorldEvent) => void;
  cyclones?: TropicalCyclone[];
  timelineHoursAhead?: number;
  selectedCyclone?: TropicalCyclone | null;
  onSelectCyclone?: (cyclone: TropicalCyclone | null) => void;
  onReturnToEarth: () => void;
  onOpenWeather?: () => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

function createLocationPopupHtml(
  cityName: string,
  countryName?: string,
  latitude?: number,
  longitude?: number,
  weather?: CityWeatherSummary | null,
  timezone?: string
): string {
  const hasWeather = Boolean(weather && typeof weather.temperature === 'number');
  const tempStr = hasWeather && weather?.temperature !== undefined
    ? `${Math.round(weather.temperature)}°${weather.units === 'fahrenheit' ? 'F' : 'C'}`
    : '';

  const timeInfo = typeof latitude === 'number' && typeof longitude === 'number'
    ? getLocationTime(latitude, longitude, timezone || weather?.timezone)
    : null;

  return `
    <div style="background: rgba(5,5,18,0.96); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(6,182,212,0.45); border-radius: 14px; padding: 10px 14px; color: #fff; font-family: monospace; font-size: 11px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); max-width: 285px;">
      <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px;">
        <div style="font-weight: 800; color: #67e8f9; font-size: 13px; line-height: 1.25;">${cityName}</div>
        ${countryName ? `<div style="color: rgba(255,255,255,0.65); font-size: 10px; flex-shrink: 0;">${countryName}</div>` : ''}
      </div>

      ${timeInfo ? `
        <!-- Live Ticking Local Time & Solar Condition (Option 1) -->
        <div id="city-popup-time-badge" style="display: flex; align-items: center; justify-content: space-between; margin: 6px 0 4px 0; padding: 4px 8px; border-radius: 8px; background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(148, 163, 184, 0.3);">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span id="city-popup-time-icon" style="font-size: 13px;">${timeInfo.solar.icon}</span>
            <span id="city-popup-time-str" style="font-weight: 800; color: #f8fafc; font-size: 12px; letter-spacing: 0.5px;">${timeInfo.timeSeconds12}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span id="city-popup-time-period" style="color: #94a3b8; font-size: 9px; font-weight: 600;">${timeInfo.solar.label}</span>
            <span id="city-popup-time-tz" style="color: #38bdf8; font-size: 9px; font-weight: 700; background: rgba(56, 189, 248, 0.12); padding: 1px 4px; border-radius: 4px;">${timeInfo.tzCode}</span>
          </div>
        </div>
      ` : ''}

      ${hasWeather && weather ? `
        <div style="display: flex; align-items: center; gap: 6px; margin: 4px 0; padding: 4px 8px; border-radius: 8px; background: rgba(6,182,212,0.12); border: 1px solid rgba(6,182,212,0.3);">
          <span style="font-size: 16px;">${weather.weatherEmoji || '🌤️'}</span>
          <span style="font-weight: 800; color: #ffffff; font-size: 13px;">${tempStr}</span>
          <span style="color: rgba(255,255,255,0.75); font-size: 10px; margin-left: 2px;">${weather.weatherDescription || ''}</span>
        </div>
      ` : `
        <div style="display: flex; align-items: center; gap: 6px; margin: 4px 0; padding: 4px 8px; border-radius: 8px; background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.2);">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #22d3ee; box-shadow: 0 0 8px #22d3ee;"></span>
          <span style="color: #67e8f9; font-size: 10px; font-weight: 600;">Fetching live weather telemetry...</span>
        </div>
      `}

      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; font-size: 9px; color: rgba(6,182,212,0.85); font-weight: 600;">
        <span>${typeof latitude === 'number' && typeof longitude === 'number' ? `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` : ''}</span>
        ${timeInfo ? `<span style="color: rgba(255,255,255,0.45); font-family: monospace;">${timeInfo.tzOffset}</span>` : ''}
      </div>

      ${cityName !== 'World Map' ? `
        <div style="display: flex; gap: 6px; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
          <button type="button" data-moo-action="zoom-max" style="flex: 1; padding: 4px 6px; border-radius: 6px; background: rgba(6,182,212,0.18); border: 1px solid rgba(6,182,212,0.45); color: #a5f3fc; font-size: 9px; font-weight: 700; cursor: pointer;">🔭 Zoom In Max</button>
          <button type="button" data-moo-action="temp-view" style="flex: 1; padding: 4px 6px; border-radius: 6px; background: rgba(245,158,11,0.18); border: 1px solid rgba(245,158,11,0.45); color: #fde68a; font-size: 9px; font-weight: 700; cursor: pointer;">🌡️ Temperature</button>
        </div>
      ` : ''}
    </div>
  `;
}

function formatMilestoneDate(timestamp?: string, leadHours: number = 0): string {
  if (!timestamp) return `+${leadHours}h`;
  try {
    const targetDate = new Date(timestamp);
    const now = new Date();
    const isToday =
      targetDate.getDate() === now.getDate() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getFullYear() === now.getFullYear();
    const tomorrow = new Date(now.getTime() + 86400000);
    const isTomorrow =
      targetDate.getDate() === tomorrow.getDate() &&
      targetDate.getMonth() === tomorrow.getMonth() &&
      targetDate.getFullYear() === tomorrow.getFullYear();
    const timeStr = targetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '');
    if (isToday) return `Today - ${timeStr}`;
    if (isTomorrow) return `Tomorrow - ${timeStr}`;
    const weekday = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
    const day = targetDate.getDate();
    return `${weekday} ${day} - ${timeStr}`;
  } catch {
    return `+${leadHours}h`;
  }
}

/**
 * Formats forecast track waypoint timestamps matching Windy.com specifications
 * Example: "Tue 18 12:00", "Wed 19 00:00" (concise UTC time milestone)
 */
function formatWindyTrackTime(timestamp?: string, leadHours: number = 0): string {
  if (!timestamp) return `+${leadHours}h`;
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return `+${leadHours}h`;
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const day = d.getUTCDate();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    return `${weekday} ${day} ${hours}:${mins}`;
  } catch {
    return `+${leadHours}h`;
  }
}

export default function CityMapViewer({
  latitude,
  longitude,
  cityName,
  countryName,
  timezone,
  initialZoom = 12.8,
  featureType,
  flyTriggerSeq = 0,
  searchFocusMode = 'place-max',
  onFocusModeChange,
  weatherGridData = null,
  initialMapStyle = 'atmospheric-satellite',
  weatherSummary,
  activeLayer = 'wind',
  onLayerChange,
  radarTileUrl,
  satelliteTileUrl,
  satelliteObservationUtc,
  spectralMode = 'blue',
  onSelectSpectralMode,
  particlesEnabled = true,
  showPressureIsobars = false,
  disasters = [],
  disasterFilter: disasterFilterProp,
  onSelectDisasterFilter,
  selectedDisaster = null,
  onSelectDisaster,
  onInspectDossier,
  cyclones = [],
  timelineHoursAhead = 0,
  selectedCyclone = null,
  onSelectCyclone,
  onReturnToEarth,
  onOpenWeather,
  onMapClick,
  className = '',
}: CityMapViewerProps) {
  const { locale, dict } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const disasterMarkersRef = useRef<{ marker: Marker; event: WorldEvent; popup: Popup }[]>([]);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveTime = useLocationTime(latitude, longitude, timezone || weatherSummary?.timezone);

  const [activeStyleKey, setActiveStyleKey] = useState<MapStyleKey>(() => initialMapStyle || getDefaultMapStyleKey());
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentBearing, setCurrentBearing] = useState(0);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isSatelliteHudDismissed, setIsSatelliteHudDismissed] = useState(true);
  const [isRadarNoticeDismissed, setIsRadarNoticeDismissed] = useState(false);

  useEffect(() => {
    setIsRadarNoticeDismissed(false);
    if (activeLayer === 'satellite' || activeLayer === 'clouds') {
      setActiveStyleKey('atmospheric-satellite');
    } else if (activeLayer === 'wind') {
      setActiveStyleKey('wind-dark');
    }
  }, [activeLayer]);

  // Disaster filtering, visibility and collapsible bar state on 2D map
  const [internalDisasterFilter, setInternalDisasterFilter] = useState<'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather'>('all');
  const activeDisasterFilter = disasterFilterProp !== undefined ? disasterFilterProp : internalDisasterFilter;
  const setDisasterFilter = useCallback((val: 'all' | 'cyclones' | 'seismic' | 'wildfires' | 'thunderstorms' | 'space_weather') => {
    setInternalDisasterFilter(val);
    onSelectDisasterFilter?.(val);
  }, [onSelectDisasterFilter]);
  const [showDisasters, setShowDisasters] = useState(true);
  // Filtered disaster list: strictly isolates selected hazard (no unwanted hazard markers)
  const filteredDisasters = useMemo(() => {
    if (!disasters || disasters.length === 0) return [];
    if (activeDisasterFilter === 'all') return disasters;
    return disasters.filter((d) => {
      const type = getDisasterMeta(d).type;
      if (activeDisasterFilter === 'cyclones') return type === 'cyclone';
      if (activeDisasterFilter === 'seismic') return type === 'seismic';
      if (activeDisasterFilter === 'wildfires') return type === 'wildfires';
      if (activeDisasterFilter === 'thunderstorms') return type === 'thunderstorms';
      if (activeDisasterFilter === 'space_weather') return type === 'space_weather' || d.category === 'space_weather';
      return type === activeDisasterFilter;
    });
  }, [disasters, activeDisasterFilter]);

  // Real-time Nowcast Lightning telemetry feed (default false to match Windy's clean aesthetic)
  const [lightningFeed, setLightningFeed] = useState<LightningFeedResponse | null>(null);
  const [showLightning, setShowLightning] = useState(false);

  // Satellite Resolution Mode: 'live' (10-15m geostationary) vs 'hd' (250m NOAA-20 VIIRS TrueColor swath)
  const [satelliteResolution, setSatelliteResolution] = useState<'live' | 'hd'>('live');

  // 3-minute auto-refresh heartbeat for live satellite data (sub-hourly cadence like Windy)
  const [satelliteRefreshTick, setSatelliteRefreshTick] = useState(0);
  useEffect(() => {
    const isSatView = activeLayer === 'satellite' || activeLayer === 'clouds' || activeLayer === 'overview' || activeLayer === 'hurricane';
    if (!isSatView) return;
    const refreshInterval = setInterval(() => {
      setSatelliteRefreshTick((prev) => prev + 1);
    }, 180000); // 3 minutes = 180,000ms
    return () => clearInterval(refreshInterval);
  }, [activeLayer]);

  // Dynamic Geostationary satellite observation date & physical scan latency
  const satelliteObservation = useMemo(() => {
    // satelliteRefreshTick dependency ensures re-computation every 3 minutes
    void satelliteRefreshTick;
    return getGeostationaryObservationDate(timelineHoursAhead < 0 ? Math.abs(timelineHoursAhead) : 0);
  }, [timelineHoursAhead, satelliteRefreshTick]);

  const satelliteLatencyLabel = useMemo(() => {
    const diffMs = Math.max(0, Date.now() - satelliteObservation.timestampMs);
    const diffMin = Math.max(5, Math.round(diffMs / 60000));
    if (diffMin < 60) return `${diffMin}m ago`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
  }, [satelliteObservation.timestampMs]);

  const [noaaStarTelemetry, setNoaaStarTelemetry] = useState<NoaaStarPilotTelemetry | null>(null);
  useEffect(() => {
    if (!isNoaaStarPilotEnabled()) return;
    return subscribeNoaaStarTelemetry((msg) => setNoaaStarTelemetry(msg));
  }, []);

  useEffect(() => {
    setLightningFeed(getNowcastLightningFeed(disasters));
    const interval = setInterval(() => {
      setLightningFeed(getNowcastLightningFeed(disasters));
    }, 45000);
    return () => clearInterval(interval);
  }, [disasters]);

  // Persistent ref tracking latest city coordinates & metadata without triggering map re-initialization
  const currentLocationRef = useRef({ latitude, longitude, cityName, countryName, initialZoom });
  currentLocationRef.current = { latitude, longitude, cityName, countryName, initialZoom };

  // Last known weather summary ref to prevent flickering / disappearing telemetry on location selection
  const lastKnownWeatherRef = useRef<CityWeatherSummary | null>(null);
  if (weatherSummary) {
    lastKnownWeatherRef.current = weatherSummary;
  }
  const activeWeatherSummary = weatherSummary || lastKnownWeatherRef.current;

  // Stable ref for onMapClick to prevent recreating initMap on parent re-renders
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Track last flown location target to prevent resetting user's free map exploration
  const lastFlownTargetRef = useRef<string>('');
  const userMapClickCoordRef = useRef<string>('');

  // Initialize or reconfigure MapLibre
  const initMap = useCallback(
    (styleKey: MapStyleKey) => {
      if (!mapContainerRef.current) return;

      // Clear any pending watchdog timer
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }

      // Clean up previous instance if any
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore cleanup errors
        }
        mapRef.current = null;
      }

      setIsMapLoaded(false);
      setHasMapError(false);
      setErrorMessage(null);

      const styleDef = MAP_STYLES[styleKey] || MAP_STYLES['satellite'];
      const initCoords = currentLocationRef.current;

      try {
        const map = new Map({
          container: mapContainerRef.current,
          style: styleDef.style,
          center: [initCoords.longitude, initCoords.latitude],
          zoom: initCoords.initialZoom,
          minZoom: 1.8,
          maxZoom: 18.0,
          renderWorldCopies: false,
          pitch: 0,
          bearing: 0,
          attributionControl: false,
        });

        // Add standard navigation controls (Zoom + Pitch/Compass)
        const nav = new NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        });
        if (typeof window !== 'undefined') (window as any)._map = map;
        map.addControl(nav, 'top-right');

        // Add scale bar
        const scale = new ScaleControl({
          maxWidth: 120,
          unit: 'metric',
        });
        map.addControl(scale, 'bottom-left');

        // Create glowing location pin element if a specific city is selected
        const isSpecificCity = initCoords.cityName && initCoords.cityName !== 'World Map';
        if (isSpecificCity) {
          const pinEl = document.createElement('div');
          pinEl.className = 'city-map-pin-container group cursor-pointer';
          pinEl.innerHTML = `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></span>
              <span class="absolute w-5 h-5 rounded-full bg-cyan-500/50"></span>
              <div class="relative w-3.5 h-3.5 rounded-full bg-cyan-300 border-2 border-white shadow-[0_0_12px_rgba(6,182,212,1)]"></div>
            </div>
          `;

          // Create custom popup tooltip
          const popup = new Popup({
            offset: 20,
            closeButton: true,
            className: 'city-map-popup',
          }).setHTML(
            createLocationPopupHtml(initCoords.cityName, initCoords.countryName, initCoords.latitude, initCoords.longitude, activeWeatherSummary, timezone)
          );

          // Attach marker
          const marker = new Marker({ element: pinEl, anchor: 'center' })
            .setLngLat([initCoords.longitude, initCoords.latitude])
            .setPopup(popup)
            .addTo(map);

          markerRef.current = marker;
        } else {
          markerRef.current = null;
        }

        // Map lifecycle listeners
        map.on('load', () => {
          if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
            watchdogTimerRef.current = null;
          }
          setIsMapLoaded(true);
        });

        map.on('move', () => {
          setCurrentZoom(Number(map.getZoom().toFixed(1)));
          setCurrentPitch(Math.round(map.getPitch()));
          setCurrentBearing(Math.round(map.getBearing()));
        });

        // Click on map coordinates to inspect weather telemetry
        map.on('click', (e) => {
          const target = e.originalEvent.target as HTMLElement;
          if (target?.closest('.disaster-map-marker-container') || target?.closest('.maplibregl-popup')) {
            return;
          }
          const lat = Number(e.lngLat.lat.toFixed(4));
          const lng = Number(e.lngLat.lng.toFixed(4));
          userMapClickCoordRef.current = `${lat.toFixed(4)},${lng.toFixed(4)}`;
          onMapClickRef.current?.({ lat, lng });
        });

        // Watchdog timer: If vector style hangs or network stalls for > 7.0s, failover safely
        watchdogTimerRef.current = setTimeout(() => {
          if (!mapRef.current) return;
          if (
            styleKey === 'satellite' ||
            styleKey === 'atmospheric-satellite' ||
            styleKey === 'wind-dark' ||
            styleKey === 'windy-satellite'
          ) {
            setIsMapLoaded(true);
            return;
          }
          const isLoaded = mapRef.current.loaded();
          if (!isLoaded) {
            console.warn(`[CityMapViewer] Tile watchdog timeout (7000ms) on style "${styleKey}". Initiating failover...`);
            const failoverKey = getFailoverStyle(styleKey, true);
            if (failoverKey !== styleKey) {
              setFallbackNotice(
                `Tile provider "${MAP_STYLES[styleKey]?.label || styleKey}" is responding slowly. Switched to high-availability ${MAP_STYLES[failoverKey]?.label}.`
              );
              setActiveStyleKey(failoverKey);
            } else {
              setIsMapLoaded(true);
            }
          }
        }, 7000);

        map.on('error', (e) => {
          // Check for critical style loading or authorization failures
          const errStr = e?.error?.message || '';
          // Ignore non-fatal individual tile loading errors or raster 404s during rapid zoom/pan
          if (
            errStr.includes('tile') ||
            errStr.includes('status: 404') ||
            errStr.includes('status 404') ||
            errStr.includes('HTTP 404') ||
            errStr.includes('404')
          ) {
            return;
          }
          const isCritical =
            (errStr.includes('Failed to fetch') && (errStr.includes('style') || errStr.includes('sprite'))) ||
            errStr.includes('Worker failed to load') ||
            errStr.includes('401') ||
            errStr.includes('403');

          if (isCritical) {
            console.warn(`[CityMapViewer] MapLibre error encountered on style "${styleKey}":`, e.error);
            if (styleKey === 'satellite' || styleKey === 'windy-satellite' || styleKey === 'atmospheric-satellite' || styleKey === 'wind-dark') {
              // Atmospheric satellite has multiple fallback tile sources; do not trigger disruptive failover
              return;
            }
            const failoverKey = getFailoverStyle(styleKey, true);
            if (failoverKey !== styleKey) {
              setFallbackNotice(
                `Connection issue with "${MAP_STYLES[styleKey]?.label || styleKey}". Switched to fallback ${MAP_STYLES[failoverKey]?.label}.`
              );
              setActiveStyleKey(failoverKey);
            } else {
              setHasMapError(true);
              setErrorMessage('Tile or network failure. You can retry or choose an alternative map style.');
            }
          }
        });

        mapRef.current = map;
        if (typeof window !== 'undefined') (window as any).__mooMap = map;
      } catch (err: any) {
        console.error('Failed to initialize MapLibre GL map:', err);
        setHasMapError(true);
        setErrorMessage(err?.message || 'Unable to initialize WebGL city map.');
      }
    },
    []
  );

  // Mount effect (strictly on mount or explicit styleKey change)
  useEffect(() => {
    initMap(activeStyleKey);

    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      disasterMarkersRef.current.forEach(({ marker }) => {
        try {
          marker.remove();
        } catch {
          // ignore
        }
      });
      disasterMarkersRef.current = [];
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore cleanup error
        }
        mapRef.current = null;
      }
    };
  }, [initMap, activeStyleKey]);

  const placeMaxTargetZoom = useMemo(() => {
    if (featureType === 'country') return 5.5;
    if (featureType === 'administrative') return 10.5;
    if (featureType === 'mountain') return 15.5;
    return 17.5;
  }, [featureType]);

  const handleQuickZoomMax = useCallback(() => {
    onFocusModeChange?.('place-max');
    if (activeLayer === 'temperature') {
      onLayerChange?.('satellite');
    }
    if (mapRef.current && cityName && cityName !== 'World Map') {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: placeMaxTargetZoom,
        pitch: 0,
        bearing: 0,
        speed: 1.35,
        essential: true,
      });
    }
  }, [onFocusModeChange, activeLayer, onLayerChange, cityName, longitude, latitude, placeMaxTargetZoom]);

  const handleQuickTempView = useCallback(() => {
    onFocusModeChange?.('temperature');
    onLayerChange?.('temperature');
    onOpenWeather?.();
    if (mapRef.current && cityName && cityName !== 'World Map') {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: featureType === 'country' ? 5.0 : 9.0,
        pitch: 0,
        bearing: 0,
        speed: 1.25,
        essential: true,
      });
    }
  }, [onFocusModeChange, onLayerChange, onOpenWeather, cityName, longitude, latitude, featureType]);

  // Delegated click handler for popup quick-action buttons ("Zoom In Max" & "Temperature")
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    const onPopupActionClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest('[data-moo-action]') as HTMLElement | null;
      if (!btn) return;
      const action = btn.getAttribute('data-moo-action');
      if (action === 'zoom-max') {
        handleQuickZoomMax();
      } else if (action === 'temp-view') {
        handleQuickTempView();
      }
    };
    container.addEventListener('click', onPopupActionClick);
    return () => container.removeEventListener('click', onPopupActionClick);
  }, [handleQuickZoomMax, handleQuickTempView]);

  // Handle fly-to coordinate updates ONLY when the destination or explicit search trigger changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    if (!cityName || cityName === 'World Map') return;

    const targetKey = `${cityName}:${latitude.toFixed(4)},${longitude.toFixed(4)}:${flyTriggerSeq}:${initialZoom.toFixed(1)}`;
    if (lastFlownTargetRef.current === targetKey) {
      // Already at this target - DO NOT disrupt user's free panning or zooming!
      return;
    }
    lastFlownTargetRef.current = targetKey;

    const isFromMapClick = userMapClickCoordRef.current === `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const targetZoom = isFromMapClick ? mapRef.current.getZoom() : initialZoom;

    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom: targetZoom,
      speed: 1.35,
      essential: true,
    });

    const popupHtml = createLocationPopupHtml(cityName, countryName, latitude, longitude, activeWeatherSummary, timezone);

    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
      const popup = markerRef.current.getPopup();
      if (popup) {
        popup.setHTML(popupHtml);
        try {
          popup.addTo(mapRef.current);
        } catch {
          // popup display optional
        }
      }
    } else {
      const pinEl = document.createElement('div');
      pinEl.className = 'city-map-pin-container group cursor-pointer';
      pinEl.innerHTML = `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></span>
          <span class="absolute w-5 h-5 rounded-full bg-cyan-500/50"></span>
          <div class="relative w-3.5 h-3.5 rounded-full bg-cyan-300 border-2 border-white shadow-[0_0_12px_rgba(6,182,212,1)]"></div>
        </div>
      `;
      const popup = new Popup({
        offset: 20,
        closeButton: true,
        className: 'city-map-popup',
      }).setHTML(popupHtml);

      markerRef.current = new Marker({ element: pinEl, anchor: 'center' })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(mapRef.current);
      try {
        popup.addTo(mapRef.current);
      } catch {
        // popup display optional
      }
    }
  }, [latitude, longitude, cityName, countryName, initialZoom, flyTriggerSeq, isMapLoaded]);

  // Live ticking local time DOM update for active map pin popup without re-rendering MapLibre (Option 1)
  useEffect(() => {
    const timer = setInterval(() => {
      const timeEl = document.getElementById('city-popup-time-str');
      if (timeEl && typeof latitude === 'number' && typeof longitude === 'number') {
        const info = getLocationTime(latitude, longitude, timezone || activeWeatherSummary?.timezone);
        timeEl.textContent = info.timeSeconds12;
        const iconEl = document.getElementById('city-popup-time-icon');
        if (iconEl) iconEl.textContent = info.solar.icon;
        const periodEl = document.getElementById('city-popup-time-period');
        if (periodEl) periodEl.textContent = info.solar.label;
        const tzEl = document.getElementById('city-popup-time-tz');
        if (tzEl) tzEl.textContent = info.tzCode;
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [latitude, longitude, timezone, activeWeatherSummary?.timezone]);

  // Synchronize pin popup whenever activeWeatherSummary updates WITHOUT touching map camera
  useEffect(() => {
    if (markerRef.current && activeWeatherSummary) {
      markerRef.current.getPopup()?.setHTML(
        createLocationPopupHtml(cityName, countryName, latitude, longitude, activeWeatherSummary, timezone)
      );
    }
  }, [activeWeatherSummary, cityName, countryName, latitude, longitude]);

  // Synchronize 2D camera with selectedDisaster when user clicks a hazard card or marker
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !selectedDisaster) return;
    if (typeof selectedDisaster.lat !== 'number' || typeof selectedDisaster.lng !== 'number') return;
    if (isNaN(selectedDisaster.lat) || isNaN(selectedDisaster.lng)) return;

    mapRef.current.flyTo({
      center: [selectedDisaster.lng, selectedDisaster.lat],
      zoom: Math.max(mapRef.current.getZoom(), 5.5),
      speed: 1.2,
      essential: true,
    });

    const match = disasterMarkersRef.current.find((m) => m.event.id === selectedDisaster.id);
    if (match) {
      try {
        match.popup.addTo(mapRef.current);
      } catch {
        // ignore
      }
    }
  }, [selectedDisaster, isMapLoaded]);

  // Synchronize 2D Disaster and Cyclone Markers with MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Clear previous markers
    disasterMarkersRef.current.forEach(({ marker }) => {
      try {
        marker.remove();
      } catch {
        // ignore
      }
    });
    disasterMarkersRef.current = [];

    if ((!showDisasters && activeLayer !== 'hurricane') || activeLayer === 'wind') return;

    // 1. Gather all tracked cyclones from cyclones prop AND any cyclone events in filteredDisasters
    const allTrackedCyclones: TropicalCyclone[] = [...cyclones];
    filteredDisasters.forEach((d) => {
      const meta = getDisasterMeta(d);
      if (meta.type === 'cyclone' && typeof d.lat === 'number' && typeof d.lng === 'number') {
        const dCode = extractStormDesignator(d.title, d.id);
        const alreadyInList = allTrackedCyclones.some((c) => {
          if (c.id === d.id) return true;
          const cCode = extractStormDesignator(c.name, c.id);
          if (cCode && dCode && cCode === dCode) return true;
          if (typeof c.lat === 'number' && typeof c.lng === 'number') {
            return calcDistKm(c.lat, c.lng, d.lat, d.lng) < 350;
          }
          return false;
        });
        if (!alreadyInList) {
          const convertedFeed = getActiveTropicalCyclones([d], false);
          if (convertedFeed.cyclones.length > 0) {
            allTrackedCyclones.push(convertedFeed.cyclones[0]);
          }
        }
      }
    });

    // 2. Spatial & canonical deduplication to ensure exactly ONE authoritative cyclone per physical system
    const uniqueTrackedCyclones: TropicalCyclone[] = [];
    allTrackedCyclones.forEach((c) => {
      const cCode = extractStormDesignator(c.name, c.id);
      const dupIdx = uniqueTrackedCyclones.findIndex((existing) => {
        if (existing.id === c.id) return true;
        const existCode = extractStormDesignator(existing.name, existing.id);
        if (cCode && existCode && cCode === existCode) return true;
        if (typeof existing.lat === 'number' && typeof existing.lng === 'number' && typeof c.lat === 'number' && typeof c.lng === 'number') {
          return calcDistKm(existing.lat, existing.lng, c.lat, c.lng) < 350;
        }
        return false;
      });

      if (dupIdx >= 0) {
        const existing = uniqueTrackedCyclones[dupIdx];
        const cPts = c.forecastPoints?.length || c.forecastCone?.length || 0;
        const existPts = existing.forecastPoints?.length || existing.forecastCone?.length || 0;
        if (cPts > existPts || (cPts === existPts && c.windSpeedKph > existing.windSpeedKph)) {
          uniqueTrackedCyclones[dupIdx] = c;
        }
      } else {
        uniqueTrackedCyclones.push(c);
      }
    });

    // 3. Guarantee that EVERY tracked cyclone in uniqueTrackedCyclones has a dedicated animated spinning marker!
    const eventsToRender: WorldEvent[] = [];
    uniqueTrackedCyclones.forEach((c) => {
      const matchInDisasters = filteredDisasters.find((d) => {
        if (d.id === c.id) return true;
        const meta = getDisasterMeta(d);
        if (meta.type !== 'cyclone') return false;
        const dCode = extractStormDesignator(d.title, d.id);
        const cCode = extractStormDesignator(c.name, c.id);
        return Boolean(cCode && dCode && cCode === dCode);
      });

      eventsToRender.push({
        id: c.id,
        title: matchInDisasters?.title || (c.name.toLowerCase().includes('cyclone') || c.name.toLowerCase().includes('tropical') || c.name.toLowerCase().includes('typhoon') ? c.name : `Cyclone ${c.name}`),
        category: 'severe_weather',
        lat: c.lat,
        lng: c.lng,
        city: c.basin,
        country: c.agency,
        summary: matchInDisasters?.summary || c.summary,
        publishedAt: c.advisoryIssuedAt || c.lastUpdated || new Date().toISOString(),
        source: c.attribution,
        planetaryTelemetry: {
          windSpeedKph: c.windSpeedKph,
          pressureHpa: c.pressureHpa,
          stormWarningType: 'tropical_cyclone',
        },
      });
    });

    // 4. Add non-cyclone disasters (seismic, wildfires, thunderstorms, etc.) and any standalone events
    if (showDisasters) {
      filteredDisasters.forEach((d) => {
        const meta = getDisasterMeta(d);
        if (meta.type === 'cyclone') {
          const dCode = extractStormDesignator(d.title, d.id);
          const alreadyRendered = eventsToRender.some((e) => {
            if (e.id === d.id) return true;
            const eCode = extractStormDesignator(e.title, e.id);
            if (dCode && eCode && dCode === eCode) return true;
            if (typeof e.lat === 'number' && typeof e.lng === 'number' && typeof d.lat === 'number' && typeof d.lng === 'number') {
              return calcDistKm(e.lat, e.lng, d.lat, d.lng) < 350;
            }
            return false;
          });
          if (!alreadyRendered) {
            eventsToRender.push(d);
          }
        } else {
          eventsToRender.push(d);
        }
      });
    }

    if (eventsToRender.length === 0) return;

    eventsToRender.forEach((event) => {
      if (typeof event.lat !== 'number' || typeof event.lng !== 'number') return;
      if (isNaN(event.lat) || isNaN(event.lng)) return;

      const meta = getDisasterMeta(event);
      const isSelected = selectedDisaster?.id === event.id || (selectedCyclone && (selectedCyclone.id === event.id || selectedCyclone.name.toLowerCase() === event.title.toLowerCase()));

      // Check if this event corresponds to an active tracked tropical cyclone
      const matchingCyclone = meta.type === 'cyclone'
        ? (uniqueTrackedCyclones.find((c) => c.id === event.id || c.name.toLowerCase().includes(event.title.toLowerCase()) || event.title.toLowerCase().includes(c.name.toLowerCase())) ||
           cyclones.find((c) => c.id === event.id || c.name.toLowerCase().includes(event.title.toLowerCase()) || event.title.toLowerCase().includes(c.name.toLowerCase())) || null)
        : null;

      // Position computation: interpolate along official forecast/observed path ONLY when actively in hurricane layer
      let markerLat = event.lat;
      let markerLng = event.lng;
      let markerWind = event.planetaryTelemetry?.windSpeedKph || 120;
      let markerCategory = meta.categoryLabel;
      let isForecast = false;
      let leadHours = 0;

      if (matchingCyclone && activeLayer === 'hurricane' && timelineHoursAhead > 0) {
        const interpolated = interpolateForecastPosition(matchingCyclone, timelineHoursAhead);
        markerLat = interpolated.lat;
        markerLng = interpolated.lng;
        markerWind = interpolated.windSpeedKph;
        markerCategory = interpolated.stageName || meta.categoryLabel;
        isForecast = interpolated.isForecast;
        leadHours = interpolated.leadHours;
      }

      // Build marker DOM element
      const el = document.createElement('div');
      el.className = `disaster-map-marker-container disaster-${meta.type} cursor-pointer group`;
      el.setAttribute('data-disaster-id', event.id);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `${event.title} - ${markerCategory}`);

      el.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; user-select: none;">
          <!-- Animated outer ring based on hazard type -->
          ${
            meta.type === 'cyclone'
              ? `<div style="position: absolute; width: 62px; height: 62px; top: -12px; border-radius: 9999px; border: 2px dashed rgba(6,182,212,0.85); animation: cyclone-spin 4s linear infinite; pointer-events: none;"></div>
                 <div style="position: absolute; width: 82px; height: 82px; top: -22px; border-radius: 9999px; background: radial-gradient(circle, rgba(6,182,212,0.3) 0%, rgba(6,182,212,0.06) 55%, transparent 75%); animation: marker-glow-pulse 2.5s ease-in-out infinite; pointer-events: none;"></div>`
              : meta.type === 'seismic'
              ? `<div style="position: absolute; width: 50px; height: 50px; top: -8px; border-radius: 9999px; border: 2px solid rgba(244,63,94,0.7); animation: seismic-shockwave 2s ease-out infinite; pointer-events: none;"></div>
                 <div style="position: absolute; width: 44px; height: 44px; top: -5px; border-radius: 9999px; background: rgba(244,63,94,0.25); animation: marker-glow-pulse 2s ease-in-out infinite; pointer-events: none;"></div>`
              : meta.type === 'wildfires'
              ? `<div style="position: absolute; width: 46px; height: 46px; top: -6px; border-radius: 9999px; background: radial-gradient(circle, rgba(249,115,22,0.45) 0%, transparent 70%); animation: marker-glow-pulse 2s ease-in-out infinite; pointer-events: none;"></div>`
              : `<div style="position: absolute; width: 44px; height: 44px; top: -5px; border-radius: 9999px; border: 1.5px solid ${meta.colorHex}; opacity: 0.6; animation: marker-glow-pulse 2.5s ease-in-out infinite; pointer-events: none;"></div>`
          }

          <!-- Core Badge: Central Cyclone Eye or Hazard Icon -->
          <div style="
            position: relative;
            width: ${meta.type === 'cyclone' ? '38px' : '34px'};
            height: ${meta.type === 'cyclone' ? '38px' : '34px'};
            border-radius: 9999px;
            background: ${meta.type === 'cyclone' ? 'radial-gradient(circle at 35% 35%, #0f172a 0%, #020617 100%)' : '#060818'};
            border: 2px solid ${isSelected ? '#ffffff' : meta.colorHex};
            box-shadow: 0 0 ${isSelected ? '22px' : '14px'} ${meta.glowRgba};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${meta.type === 'cyclone' ? '20px' : '16px'};
            transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          ">
            ${
              meta.type === 'cyclone'
                ? `<span style="display: inline-block; animation: cyclone-spin 3s linear infinite; filter: drop-shadow(0 0 6px ${meta.colorHex});">${meta.icon}</span>
                   <span style="
                     position: absolute;
                     bottom: -4px;
                     right: -4px;
                     width: 17px;
                     height: 17px;
                     border-radius: 9999px;
                     background: ${meta.badgeBg};
                     border: 1.5px solid ${meta.badgeBorder};
                     color: #ffffff;
                     font-family: monospace;
                     font-size: 9px;
                     font-weight: 900;
                     display: flex;
                     align-items: center;
                     justify-content: center;
                     box-shadow: 0 2px 6px rgba(0,0,0,0.8);
                   ">
                     ${matchingCyclone ? (matchingCyclone.saffirSimpsonScale > 0 ? matchingCyclone.saffirSimpsonScale : (matchingCyclone.category.toLowerCase().includes('typhoon') ? 'T' : 'S')) : '1'}
                   </span>`
                : meta.icon
            }
          </div>

          <!-- Instant Name & Telemetry Label Pill (Prominent for Cyclones or active selection) -->
          ${
            meta.type === 'cyclone' || isSelected
              ? `<div style="
                  margin-top: 4px;
                  padding: 2.5px 7px;
                  border-radius: 8px;
                  background: rgba(5, 5, 18, 0.95);
                  border: 1px solid ${isSelected ? '#ffffff' : `${meta.colorHex}66`};
                  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);
                  white-space: nowrap;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                  pointer-events: none;
                  font-family: monospace;
                  font-size: 10px;
                  backdrop-filter: blur(8px);
                ">
                  <span style="font-weight: 700; color: #ffffff;">${meta.cleanTitle}</span>
                  <span style="
                    padding: 1px 4px;
                    border-radius: 4px;
                    background: ${meta.badgeBg};
                    border: 1px solid ${meta.badgeBorder};
                    color: ${meta.colorHex};
                    font-weight: 800;
                    font-size: 9px;
                  ">${markerCategory}</span>
                  ${
                    matchingCyclone && timelineHoursAhead !== 0
                      ? `<span style="
                          padding: 1px 4px;
                          border-radius: 4px;
                          background: ${isForecast ? 'rgba(244,63,94,0.3)' : 'rgba(56,189,248,0.3)'};
                          border: 1px solid ${isForecast ? '#f43f5e' : '#38bdf8'};
                          color: #ffffff;
                          font-weight: 800;
                          font-size: 8px;
                        ">${isForecast ? `+${leadHours}h FCST` : `${timelineHoursAhead}h OBS`}</span>`
                      : ''
                  }
                </div>`
              : ''
          }
        </div>
      `;

      // Custom Popup
      const popup = new Popup({
        offset: 24,
        closeButton: true,
        className: 'disaster-map-popup',
        maxWidth: '320px',
      }).setHTML(`
        <div style="
          background: rgba(6, 8, 24, 0.97);
          backdrop-filter: blur(20px);
          border: 1px solid ${meta.colorHex}66;
          border-radius: 16px;
          padding: 14px 16px;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px ${meta.glowRgba}33;
          min-width: 250px;
          max-width: 300px;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">${meta.icon}</span>
              <span style="font-family: monospace; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${meta.colorHex};">
                ${meta.type === 'cyclone' ? 'TROPICAL CYCLONE' : meta.type === 'seismic' ? 'SEISMIC EVENT' : meta.type === 'wildfires' ? 'THERMAL WILDFIRE' : meta.type === 'space_weather' ? 'SPACE WEATHER' : 'SEVERE STORM'}
              </span>
            </div>
            <span style="font-family: monospace; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: ${meta.badgeBg}; border: 1px solid ${meta.badgeBorder}; color: ${meta.colorHex};">
              ${markerCategory}
            </span>
          </div>

          <div style="font-size: 13px; font-weight: 800; color: #ffffff; line-height: 1.3; margin-bottom: 3px;">
            ${event.title}
          </div>

          <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6); margin-bottom: 8px; font-family: monospace;">
            📍 ${event.city ? `${event.city}` : ''}${event.country ? ` · ${event.country}` : ''} (${markerLat.toFixed(2)}°, ${markerLng.toFixed(2)}°)
          </div>

          ${
            matchingCyclone && isForecast
              ? `<div style="margin-bottom: 6px; padding: 4px 8px; border-radius: 6px; background: rgba(244,63,94,0.18); border: 1px solid rgba(244,63,94,0.4); font-size: 10px; font-weight: 700; color: #fca5a5;">
                  🔮 Official Forecast Position (+${leadHours}h)
                </div>`
              : ''
          }

          <div style="font-size: 11px; line-height: 1.45; color: rgba(255, 255, 255, 0.8); margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${event.summary}
          </div>

          <!-- Telemetry Badge Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 6px 8px; border-radius: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06); font-family: monospace; font-size: 10px; margin-bottom: 10px;">
            ${markerWind ? `
              <div><span style="color: rgba(255,255,255,0.4);">WIND:</span> <strong style="color: #67e8f9;">${Math.round(markerWind)} km/h</strong></div>
            ` : ''}
            ${event.planetaryTelemetry?.pressureHpa ? `
              <div><span style="color: rgba(255,255,255,0.4);">PRES:</span> <strong style="color: #67e8f9;">${event.planetaryTelemetry.pressureHpa} hPa</strong></div>
            ` : ''}
            ${event.planetaryTelemetry?.magnitude ? `
              <div><span style="color: rgba(255,255,255,0.4);">MAG:</span> <strong style="color: #fda4af;">M ${event.planetaryTelemetry.magnitude.toFixed(1)}</strong></div>
            ` : ''}
            ${event.planetaryTelemetry?.fireRadiativePowerMw ? `
              <div><span style="color: rgba(255,255,255,0.4);">FRP:</span> <strong style="color: #fcd34d;">${event.planetaryTelemetry.fireRadiativePowerMw} MW</strong></div>
            ` : ''}
            ${event.source ? `
              <div style="grid-column: span 2;"><span style="color: rgba(255,255,255,0.4);">SRC:</span> <strong style="color: rgba(255,255,255,0.85);">${event.source}</strong></div>
            ` : ''}
          </div>

          <button type="button" class="inspect-dossier-btn" data-event-id="${event.id}" style="
            width: 100%;
            padding: 7px 10px;
            border-radius: 10px;
            background: linear-gradient(135deg, ${meta.colorHex}22, ${meta.colorHex}44);
            border: 1px solid ${meta.colorHex}88;
            color: #ffffff;
            font-family: monospace;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          ">
            <span>${
              meta.type === 'cyclone' ? '📊 Inspect Cyclone Dossier' :
              meta.type === 'seismic' ? '🌋 Inspect Seismic Dossier' :
              meta.type === 'wildfires' ? '🔥 Inspect Wildfire Dossier' :
              meta.type === 'space_weather' ? '🌌 Inspect Space Weather Dossier' :
              '⚡ Inspect Hazard Dossier'
            }</span>
            <span>↗</span>
          </button>
        </div>
      `);

      // Click / touch handler on marker
      const handleSelect = (e: Event) => {
        e.stopPropagation();
        onSelectDisaster?.(event);
        if (matchingCyclone) {
          onSelectCyclone?.(matchingCyclone);
        }
        map.flyTo({
          center: [markerLng, markerLat],
          zoom: Math.max(map.getZoom(), 5.5),
          speed: 1.2,
          essential: true,
        });
        popup.addTo(map);
      };

      el.addEventListener('click', handleSelect);
      el.addEventListener('touchend', handleSelect);

      // Popup dossier inspect button handler
      popup.on('open', () => {
        const pEl = popup.getElement();
        if (pEl) {
          const btn = pEl.querySelector(`.inspect-dossier-btn[data-event-id="${event.id}"]`);
          if (btn) {
            btn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              if (matchingCyclone) {
                onSelectCyclone?.(matchingCyclone);
              }
              if (onInspectDossier) {
                onInspectDossier(event);
              } else {
                onSelectDisaster?.(event);
              }
            });
          }
        }
      });

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([markerLng, markerLat])
        .setPopup(popup)
        .addTo(map);

      disasterMarkersRef.current.push({ marker, event, popup });

      // If this event was already selected, open its popup
      if (isSelected) {
        try {
          popup.addTo(map);
        } catch {
          // ignore
        }
      }
    });

    return () => {
      disasterMarkersRef.current.forEach(({ marker }) => {
        try {
          marker.remove();
        } catch {
          // ignore
        }
      });
      disasterMarkersRef.current = [];
    };
  }, [filteredDisasters, showDisasters, isMapLoaded, onSelectDisaster, selectedDisaster?.id, cyclones, timelineHoursAhead, selectedCyclone?.id, onSelectCyclone]);

  // Handle outside selectedDisaster updates (e.g. from top dashboard pills)
  useEffect(() => {
    if (selectedDisaster && mapRef.current && isMapLoaded) {
      mapRef.current.flyTo({
        center: [selectedDisaster.lng, selectedDisaster.lat],
        zoom: Math.max(mapRef.current.getZoom(), 5.5),
        speed: 1.2,
        essential: true,
      });
      const entry = disasterMarkersRef.current.find((m) => m.event.id === selectedDisaster.id);
      if (entry) {
        try {
          entry.popup.addTo(mapRef.current);
        } catch {
          // ignore
        }
      }
    }
  }, [selectedDisaster, isMapLoaded]);


  // Synchronize MapLibre GeoJSON Hazard Vector Layers (Seismic shockwaves, Cyclone gale radii, Wildfire halos)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const beforeLayerId =
      map.getLayer('esri-satellite-labels-layer') ? 'esri-satellite-labels-layer' :
      map.getLayer('carto-labels-layer') ? 'carto-labels-layer' :
      undefined;

    // 1. Quakes FeatureCollection
    const shouldRenderSeismic = showDisasters && (activeDisasterFilter === 'seismic' || activeDisasterFilter === 'all');
    const seismicFeatures: any[] = (!shouldRenderSeismic ? [] : filteredDisasters)
      .filter((d) => getDisasterMeta(d).type === 'seismic' && typeof d.lat === 'number' && typeof d.lng === 'number' && !isNaN(d.lat) && !isNaN(d.lng))
      .map((d) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
        properties: {
          id: d.id,
          magnitude: d.planetaryTelemetry?.magnitude || 5.0,
          depth: d.planetaryTelemetry?.depthKm || 10,
        },
      }));

    const seismicData = { type: 'FeatureCollection', features: seismicFeatures };
    const seismicSourceId = 'hazard-seismic-pulse-source';
    const seismicOuterLayerId = 'hazard-seismic-pulse-outer';
    const seismicInnerLayerId = 'hazard-seismic-pulse-inner';

    try {
      const existingSeismicSource = map.getSource(seismicSourceId) as any;
      if (existingSeismicSource && typeof existingSeismicSource.setData === 'function') {
        existingSeismicSource.setData(seismicData);
      } else if (!existingSeismicSource) {
        map.addSource(seismicSourceId, { type: 'geojson', data: seismicData as any });
        map.addLayer(
          {
            id: seismicOuterLayerId,
            type: 'circle',
            source: seismicSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, ['*', ['get', 'magnitude'], 3.5], 6, ['*', ['get', 'magnitude'], 8], 10, ['*', ['get', 'magnitude'], 16]],
              'circle-color': '#f43f5e',
              'circle-opacity': 0.16,
              'circle-stroke-width': 1.8,
              'circle-stroke-color': '#fb7185',
              'circle-stroke-opacity': 0.75,
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: seismicInnerLayerId,
            type: 'circle',
            source: seismicSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 6, 8, 10, 14],
              'circle-color': '#e11d48',
              'circle-opacity': 0.6,
              'circle-stroke-width': 1.2,
              'circle-stroke-color': '#ffffff',
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback if style is reloading
    }

    // 2. Cyclone Wind Radii FeatureCollection (centered on authoritative tracked cyclones)
    const activeCyclonesForRadii: TropicalCyclone[] = [...cyclones];
    if (showDisasters) {
      filteredDisasters.forEach((d) => {
        const meta = getDisasterMeta(d);
        if (meta.type === 'cyclone' && typeof d.lat === 'number' && typeof d.lng === 'number') {
          const dCode = extractStormDesignator(d.title, d.id);
          const alreadyInList = activeCyclonesForRadii.some((c) => {
            if (c.id === d.id) return true;
            const cCode = extractStormDesignator(c.name, c.id);
            if (cCode && dCode && cCode === dCode) return true;
            if (typeof c.lat === 'number' && typeof c.lng === 'number') {
              return calcDistKm(c.lat, c.lng, d.lat, d.lng) < 350;
            }
            return false;
          });
          if (!alreadyInList) {
            const convertedFeed = getActiveTropicalCyclones([d], false);
            if (convertedFeed.cyclones.length > 0) {
              activeCyclonesForRadii.push(convertedFeed.cyclones[0]);
            }
          }
        }
      });
    }

    const cycloneFeatures: any[] = activeCyclonesForRadii
      .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number' && !isNaN(c.lat) && !isNaN(c.lng))
      .map((c) => {
        let ptLng = c.lng;
        let ptLat = c.lat;
        let ptWind = c.windSpeedKph || 120;
        if (activeLayer === 'hurricane' && timelineHoursAhead > 0) {
          const interp = interpolateForecastPosition(c, timelineHoursAhead);
          ptLng = interp.lng;
          ptLat = interp.lat;
          ptWind = interp.windSpeedKph;
        }
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [ptLng, ptLat] },
          properties: {
            id: c.id,
            wind: ptWind,
          },
        };
      });

    const cycloneData = { type: 'FeatureCollection', features: cycloneFeatures };
    const cycloneSourceId = 'hazard-cyclone-radii-source';
    const cycloneOuterLayerId = 'hazard-cyclone-gale-outer';
    const cycloneInnerLayerId = 'hazard-cyclone-core-inner';

    try {
      const existingCycloneSource = map.getSource(cycloneSourceId) as any;
      if (existingCycloneSource && typeof existingCycloneSource.setData === 'function') {
        existingCycloneSource.setData(cycloneData);
      } else if (!existingCycloneSource) {
        map.addSource(cycloneSourceId, { type: 'geojson', data: cycloneData as any });
        map.addLayer(
          {
            id: cycloneOuterLayerId,
            type: 'circle',
            source: cycloneSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 14, 5, 38, 8, 90, 11, 240],
              'circle-color': 'rgba(6, 182, 212, 0.08)',
              'circle-stroke-width': 1.8,
              'circle-stroke-color': '#00e5ff',
              'circle-stroke-opacity': 0.75,
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: cycloneInnerLayerId,
            type: 'circle',
            source: cycloneSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 5, 14, 8, 35, 11, 90],
              'circle-color': 'rgba(6, 182, 212, 0.22)',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#38bdf8',
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // 3. Wildfire Thermal Halo FeatureCollection
    const shouldRenderWildfires = showDisasters && (activeDisasterFilter === 'wildfires' || activeDisasterFilter === 'all');
    const wildfireFeatures: any[] = (!shouldRenderWildfires ? [] : filteredDisasters)
      .filter((d) => getDisasterMeta(d).type === 'wildfires' && typeof d.lat === 'number' && typeof d.lng === 'number' && !isNaN(d.lat) && !isNaN(d.lng))
      .map((d) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
        properties: {
          id: d.id,
          frp: d.planetaryTelemetry?.fireRadiativePowerMw || 50,
        },
      }));

    const wildfireData = { type: 'FeatureCollection', features: wildfireFeatures };
    const wildfireSourceId = 'hazard-wildfire-source';
    const wildfireLayerId = 'hazard-wildfire-halo';

    try {
      const existingWildfireSource = map.getSource(wildfireSourceId) as any;
      if (existingWildfireSource && typeof existingWildfireSource.setData === 'function') {
        existingWildfireSource.setData(wildfireData);
      } else if (!existingWildfireSource) {
        map.addSource(wildfireSourceId, { type: 'geojson', data: wildfireData as any });
        map.addLayer(
          {
            id: wildfireLayerId,
            type: 'circle',
            source: wildfireSourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 6, 6, 15, 10, 30],
              'circle-color': '#f97316',
              'circle-opacity': 0.22,
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#f59e0b',
              'circle-stroke-opacity': 0.7,
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // 4. Tropical Cyclone Uncertainty Cone & Track Geometry
    // In Windy & Zoom Earth, cyclone paths & forecast tracks are ALWAYS visible whenever cyclones are present on the map
    const shouldRenderCycloneTracks = showDisasters && activeLayer !== 'wind';

    const activeConeFeatures: any[] = [];
    const activeHistoryTrackFeatures: any[] = [];
    const activeForecastTrackFeatures: any[] = [];
    const activeForecastNodeFeatures: any[] = [];

    if (shouldRenderCycloneTracks) {
      // Consolidate tracked cyclones from cyclones prop AND any cyclone events in filteredDisasters
      const allTrackedCyclones: TropicalCyclone[] = [...cyclones];

      filteredDisasters.forEach((d) => {
        const meta = getDisasterMeta(d);
        if (meta.type === 'cyclone' && typeof d.lat === 'number' && typeof d.lng === 'number') {
          const dCode = extractStormDesignator(d.title, d.id);
          const alreadyInList = allTrackedCyclones.some((c) => {
            if (c.id === d.id) return true;
            const cCode = extractStormDesignator(c.name, c.id);
            if (cCode && dCode && cCode === dCode) return true;
            if (typeof c.lat === 'number' && typeof c.lng === 'number') {
              return calcDistKm(c.lat, c.lng, d.lat, d.lng) < 350;
            }
            return false;
          });
          if (!alreadyInList) {
            const convertedFeed = getActiveTropicalCyclones([d], false);
            if (convertedFeed.cyclones.length > 0) {
              allTrackedCyclones.push(convertedFeed.cyclones[0]);
            }
          }
        }
      });

      // Spatial & canonical deduplication to guarantee exactly ONE track per physical cyclone system
      const uniqueTrackedCyclones: TropicalCyclone[] = [];
      allTrackedCyclones.forEach((c) => {
        const cCode = extractStormDesignator(c.name, c.id);
        const dupIdx = uniqueTrackedCyclones.findIndex((existing) => {
          if (existing.id === c.id) return true;
          const existCode = extractStormDesignator(existing.name, existing.id);
          if (cCode && existCode && cCode === existCode) return true;
          if (typeof existing.lat === 'number' && typeof existing.lng === 'number' && typeof c.lat === 'number' && typeof c.lng === 'number') {
            return calcDistKm(existing.lat, existing.lng, c.lat, c.lng) < 350;
          }
          return false;
        });

        if (dupIdx >= 0) {
          // Keep the record that has more forecast track points or higher reported intensity
          const existing = uniqueTrackedCyclones[dupIdx];
          const cPts = c.forecastPoints?.length || 0;
          const existPts = existing.forecastPoints?.length || 0;
          if (cPts > existPts || (cPts === existPts && c.windSpeedKph > existing.windSpeedKph)) {
            uniqueTrackedCyclones[dupIdx] = c;
          }
        } else {
          uniqueTrackedCyclones.push(c);
        }
      });

      uniqueTrackedCyclones.forEach((c) => {
        // A. Uncertainty Cone Polygon
        const coneGeoJson = c.uncertaintyConeGeoJson || (c.forecastCone && c.forecastCone.length > 0 ? buildUncertaintyConeGeoJson(c.lat, c.lng, c.forecastCone) : null);
        if (coneGeoJson) {
          activeConeFeatures.push({
            type: 'Feature',
            geometry: coneGeoJson,
            properties: { id: c.id, name: c.name },
          });
        }

        // B. Observed Historical Track LineString
        const histTrack = c.historicalTrack && c.historicalTrack.length > 1
          ? c.historicalTrack
          : [
              { timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), lat: c.lat - (c.lat >= 0 ? 0.8 : -0.8), lng: c.lng + (c.lng >= 0 ? 1.2 : -1.2), windSpeedKph: c.windSpeedKph * 0.85, stageName: c.category, isForecast: false, leadHours: 0 },
              { timestamp: new Date().toISOString(), lat: c.lat, lng: c.lng, windSpeedKph: c.windSpeedKph, stageName: c.category, isForecast: false, leadHours: 0 },
            ];
        const coords = histTrack
          .filter((p) => typeof p.lng === 'number' && typeof p.lat === 'number')
          .map((p) => [p.lng, p.lat]);
        if (coords.length > 1) {
          activeHistoryTrackFeatures.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
            properties: { id: c.id, name: c.name },
          });
        }

        // C. Official Forecast Track LineString
        let forecastPts = c.forecastPoints;
        if ((!forecastPts || forecastPts.length === 0) && c.forecastCone && c.forecastCone.length > 0) {
          forecastPts = c.forecastCone.map((fc) => ({
            timestamp: new Date(Date.now() + fc.hoursAhead * 3600000).toISOString(),
            lat: fc.lat,
            lng: fc.lng,
            windSpeedKph: fc.predictedWindKph,
            windSpeedKnots: Math.round(fc.predictedWindKph / 1.852),
            stageName: fc.predictedCategory,
            isForecast: true,
            leadHours: fc.hoursAhead,
          }));
        }

        if (forecastPts && forecastPts.length > 0) {
          const forecastCoords = [[c.lng, c.lat], ...forecastPts.map((p) => [p.lng, p.lat])];
          activeForecastTrackFeatures.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: forecastCoords },
            properties: { id: c.id, name: c.name },
          });

          // D. Forecast Nodes - Filter to milestones spaced >= 12h apart to prevent unreadable label collisions
          const sortedPts = [...forecastPts].sort((a, b) => (a.leadHours || 0) - (b.leadHours || 0));
          const filteredForecastPts: typeof forecastPts = [];
          let lastLeadHours = -999;
          sortedPts.forEach((p) => {
            const lead = p.leadHours || 0;
            if (lead === 0 || lead - lastLeadHours >= 12) {
              filteredForecastPts.push(p);
              lastLeadHours = lead;
            }
          });

          filteredForecastPts.forEach((p) => {
            const windKt = p.windSpeedKnots || Math.round(p.windSpeedKph / 1.852);
            const milestoneTitle = formatMilestoneDate(p.timestamp, p.leadHours);
            const timeLabel = formatWindyTrackTime(p.timestamp, p.leadHours);
            const sshwsScale = getSaffirSimpsonCategoryNumber(p.windSpeedKph);
            const sshwsText = sshwsScale > 0 ? `SSHWS category ${sshwsScale}` : (p.stageName || 'Tropical Cyclone');
            const cardSubtitle = `${windKt}kt${p.pressureHpa ? ` · ${p.pressureHpa}hPa` : ''}`;
            const labelText = `${milestoneTitle}\n${cardSubtitle}`;
            const nodeBadge = sshwsScale > 0 ? `${sshwsScale}` : (p.stageName?.toLowerCase().includes('depression') ? 'D' : 'S');

            activeForecastNodeFeatures.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
              properties: {
                id: c.id,
                name: c.name,
                leadHours: p.leadHours || 0,
                windSpeedKph: p.windSpeedKph,
                windSpeedKnots: windKt,
                pressureHpa: p.pressureHpa || '',
                stageName: p.stageName || sshwsText,
                sshwsText,
                milestoneTitle,
                timeLabel,
                cardSubtitle,
                labelText,
                nodeBadge,
              },
            });
          });
        }
      });
    }

    // Add / Update Uncertainty Cone
    const coneData = { type: 'FeatureCollection', features: activeConeFeatures };
    const coneSourceId = 'hazard-cyclone-cone-source';
    const coneFillLayerId = 'hazard-cyclone-cone-fill';
    const coneOutlineLayerId = 'hazard-cyclone-cone-outline';

    try {
      const existingConeSource = map.getSource(coneSourceId) as any;
      if (existingConeSource && typeof existingConeSource.setData === 'function') {
        existingConeSource.setData(coneData);
      } else if (!existingConeSource) {
        map.addSource(coneSourceId, { type: 'geojson', data: coneData as any });
        map.addLayer(
          {
            id: coneFillLayerId,
            type: 'fill',
            source: coneSourceId,
            paint: {
              'fill-color': 'rgba(255, 255, 255, 0.16)',
              'fill-opacity': 0.85,
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: coneOutlineLayerId,
            type: 'line',
            source: coneSourceId,
            paint: {
              'line-color': '#ffffff',
              'line-width': 2.0,
              'line-dasharray': [4, 3],
              'line-opacity': 0.85,
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // Add / Update Historical Observed Track
    const historyData = { type: 'FeatureCollection', features: activeHistoryTrackFeatures };
    const historySourceId = 'hazard-cyclone-history-track-source';
    const historyCasingLayerId = 'hazard-cyclone-history-track-casing';
    const historyLayerId = 'hazard-cyclone-history-track-line';

    try {
      const existingHistorySource = map.getSource(historySourceId) as any;
      if (existingHistorySource && typeof existingHistorySource.setData === 'function') {
        existingHistorySource.setData(historyData);
      } else if (!existingHistorySource) {
        map.addSource(historySourceId, { type: 'geojson', data: historyData as any });
        // Dark contrast casing underneath track
        map.addLayer(
          {
            id: historyCasingLayerId,
            type: 'line',
            source: historySourceId,
            paint: {
              'line-color': '#020617',
              'line-width': 5.0,
              'line-opacity': 0.85,
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: historyLayerId,
            type: 'line',
            source: historySourceId,
            paint: {
              'line-color': '#38bdf8',
              'line-width': 2.8,
              'line-opacity': 0.95,
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // Add / Update Forecast Track
    const forecastData = { type: 'FeatureCollection', features: activeForecastTrackFeatures };
    const forecastSourceId = 'hazard-cyclone-forecast-track-source';
    const forecastCasingLayerId = 'hazard-cyclone-forecast-track-casing';
    const forecastLayerId = 'hazard-cyclone-forecast-track-line';

    try {
      const existingForecastSource = map.getSource(forecastSourceId) as any;
      if (existingForecastSource && typeof existingForecastSource.setData === 'function') {
        existingForecastSource.setData(forecastData);
      } else if (!existingForecastSource) {
        map.addSource(forecastSourceId, { type: 'geojson', data: forecastData as any });
        // Dark contrast casing underneath forecast track
        map.addLayer(
          {
            id: forecastCasingLayerId,
            type: 'line',
            source: forecastSourceId,
            paint: {
              'line-color': '#020617',
              'line-width': 5.0,
              'line-opacity': 0.85,
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: forecastLayerId,
            type: 'line',
            source: forecastSourceId,
            paint: {
              'line-color': '#ffffff',
              'line-width': 2.8,
              'line-dasharray': [3, 2],
              'line-opacity': 1.0,
            },
          },
          beforeLayerId
        );
      }
    } catch {
      // Safe fallback
    }

    // Add / Update Forecast Nodes
    const nodesData = { type: 'FeatureCollection', features: activeForecastNodeFeatures };
    const nodesSourceId = 'hazard-cyclone-forecast-nodes-source';
    const nodesLayerId = 'hazard-cyclone-forecast-nodes-circle';
    const nodesLabelLayerId = 'hazard-cyclone-forecast-nodes-label';
    const nodesTimeLayerId = 'hazard-cyclone-forecast-nodes-time';

    try {
      const existingNodesSource = map.getSource(nodesSourceId) as any;
      if (existingNodesSource && typeof existingNodesSource.setData === 'function') {
        existingNodesSource.setData(nodesData);
        if (map.getLayer(nodesLabelLayerId)) {
          map.setLayoutProperty(nodesLabelLayerId, 'text-field', ['get', 'nodeBadge']);
          map.setLayoutProperty(nodesLabelLayerId, 'text-size', 9);
          map.setLayoutProperty(nodesLabelLayerId, 'text-offset', [0, 0]);
          map.setLayoutProperty(nodesLabelLayerId, 'text-anchor', 'center');
        }
        if (!map.getLayer(nodesTimeLayerId)) {
          map.addLayer(
            {
              id: nodesTimeLayerId,
              type: 'symbol',
              source: nodesSourceId,
              layout: {
                'text-field': ['get', 'timeLabel'],
                'text-size': 10,
                'text-offset': [0, 1.45],
                'text-anchor': 'top',
                'text-allow-overlap': true,
                'text-ignore-placement': true,
              },
              paint: {
                'text-color': '#ffffff',
                'text-halo-color': 'rgba(2, 6, 23, 0.95)',
                'text-halo-width': 2.0,
              },
            },
            beforeLayerId
          );
        } else {
          map.setLayoutProperty(nodesTimeLayerId, 'text-field', ['get', 'timeLabel']);
        }
      } else if (!existingNodesSource) {
        map.addSource(nodesSourceId, { type: 'geojson', data: nodesData as any });
        map.addLayer(
          {
            id: nodesLayerId,
            type: 'circle',
            source: nodesSourceId,
            paint: {
              'circle-radius': 9,
              'circle-color': [
                'step',
                ['get', 'windSpeedKph'],
                '#64748b',
                63, '#0284c7',
                119, '#dc2626',
                154, '#b91c1c',
                178, '#991b1b',
                210, '#7f1d1d',
              ],
              'circle-stroke-width': 2.2,
              'circle-stroke-color': '#ffffff',
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: nodesLabelLayerId,
            type: 'symbol',
            source: nodesSourceId,
            layout: {
              'text-field': ['get', 'nodeBadge'],
              'text-size': 9,
              'text-offset': [0, 0],
              'text-anchor': 'center',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': 'rgba(6, 8, 24, 0.95)',
              'text-halo-width': 1.5,
            },
          },
          beforeLayerId
        );
        map.addLayer(
          {
            id: nodesTimeLayerId,
            type: 'symbol',
            source: nodesSourceId,
            layout: {
              'text-field': ['get', 'timeLabel'],
              'text-size': 10,
              'text-offset': [0, 1.45],
              'text-anchor': 'top',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': 'rgba(2, 6, 23, 0.95)',
              'text-halo-width': 2.0,
            },
          },
          beforeLayerId
        );

        // Click popup displaying the reference-grade milestone card
        map.on('click', nodesLayerId, (e: any) => {
          const feat = e.features?.[0];
          if (!feat) return;
          const props = feat.properties;
          const coords = (feat.geometry as any).coordinates.slice();
          new Popup({ className: 'city-map-popup', closeButton: true, offset: 12 })
            .setLngLat(coords)
            .setHTML(`
              <div style="background: rgba(6, 8, 24, 0.96); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 10px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.85); min-width: 175px;">
                <div style="font-size: 11px; font-weight: 800; color: #ffffff; margin-bottom: 3px;">${props?.milestoneTitle || 'Forecast Milestone'}</div>
                <div style="font-size: 12px; font-family: monospace; font-weight: 700; color: #38bdf8; margin-bottom: 3px;">
                  ${props?.windSpeedKnots || '--'}kt ${props?.pressureHpa ? `<span style="color: rgba(255,255,255,0.4);">|</span> ${props.pressureHpa}hPa` : ''}
                </div>
                <div style="font-size: 10px; font-weight: 700; color: #f43f5e; text-transform: uppercase; letter-spacing: 0.05em;">
                  ${props?.sshwsText || ''}
                </div>
                <div style="font-size: 9px; color: rgba(255,255,255,0.5); margin-top: 4px; font-family: monospace;">
                  ${props?.name || ''} • Official Forecast (+${props?.leadHours || 0}h)
                </div>
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseenter', nodesLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', nodesLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }
    } catch {
      // Safe fallback
    }

    return () => {
      [
        'hazard-seismic-pulse-inner',
        'hazard-seismic-pulse-outer',
        'hazard-cyclone-core-inner',
        'hazard-cyclone-gale-outer',
        'hazard-wildfire-halo',
        'hazard-cyclone-cone-fill',
        'hazard-cyclone-cone-outline',
        'hazard-cyclone-history-track-casing',
        'hazard-cyclone-history-track-line',
        'hazard-cyclone-forecast-track-casing',
        'hazard-cyclone-forecast-track-line',
        'hazard-cyclone-forecast-nodes-circle',
        'hazard-cyclone-forecast-nodes-label',
        'hazard-cyclone-forecast-nodes-time',
      ].forEach((lId) => {
        try {
          if (map.getLayer(lId)) map.removeLayer(lId);
        } catch {
          // ignore
        }
      });
      [
        'hazard-seismic-pulse-source',
        'hazard-cyclone-radii-source',
        'hazard-wildfire-source',
        'hazard-cyclone-cone-source',
        'hazard-cyclone-history-track-source',
        'hazard-cyclone-forecast-track-source',
        'hazard-cyclone-forecast-nodes-source',
      ].forEach((sId) => {
        try {
          if (map.getSource(sId)) map.removeSource(sId);
        } catch {
          // ignore
        }
      });
    };
  }, [filteredDisasters, showDisasters, isMapLoaded, cyclones, activeLayer, activeDisasterFilter, timelineHoursAhead]);

  // Synchronize NOAA Radar Raster Layer with MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const sourceId = 'noaa-mrms-radar-source';
    const layerId = 'noaa-mrms-radar-layer';
    const defaultTileUrl = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png';
    const activeTileUrl = radarTileUrl || defaultTileUrl;

    if (activeLayer === 'radar') {
      try {
        const existingSource = map.getSource(sourceId) as any;
        if (existingSource) {
          // If the tile URL changed (e.g., user stepped through past radar frames), swap smoothly
          if (existingSource.tiles?.[0] !== activeTileUrl) {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
            map.removeSource(sourceId);
            map.addSource(sourceId, {
              type: 'raster',
              tiles: [activeTileUrl],
              tileSize: 256,
              bounds: [-128.0, 24.0, -66.0, 50.0],
            });
            map.addLayer({
              id: layerId,
              type: 'raster',
              source: sourceId,
              paint: {
                'raster-opacity': 0.75,
                'raster-fade-duration': 150,
              },
            });
          }
        } else {
          map.addSource(sourceId, {
            type: 'raster',
            tiles: [activeTileUrl],
            tileSize: 256,
            bounds: [-128.0, 24.0, -66.0, 50.0],
          });
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': 0.75,
              'raster-fade-duration': 300,
            },
          });
        }
      } catch (err) {
        console.warn('[MapLibre Radar] Layer sync notice:', err);
      }
    } else {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch {
        // Silently ignore cleanup errors
      }
    }
  }, [activeLayer, isMapLoaded, radarTileUrl]);

  // ── Synchronize 2D MSLP Atmospheric Isobars & Pressure Centers ───────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    const isIsobarsActive = activeLayer === 'pressure' || (showPressureIsobars && activeLayer === 'pressure');
    const ISOBAR_SOURCE_ID = 'mooearth-isobars-source';
    const ISOBAR_LINE_LAYER_ID = 'mooearth-isobars-line-layer';
    const ISOBAR_CENTERS_LAYER_ID = 'mooearth-isobars-centers-layer';

    if (!isIsobarsActive) {
      try {
        if (map.getLayer(ISOBAR_CENTERS_LAYER_ID)) map.removeLayer(ISOBAR_CENTERS_LAYER_ID);
        if (map.getLayer(ISOBAR_LINE_LAYER_ID)) map.removeLayer(ISOBAR_LINE_LAYER_ID);
        if (map.getSource(ISOBAR_SOURCE_ID)) map.removeSource(ISOBAR_SOURCE_ID);
      } catch (e) {
        // Cleanup
      }
      return;
    }

    const buildIsobarsGeoJson = () => {
      const features: any[] = [];
      GLOBAL_PRESSURE_CENTERS.forEach((center) => {
        const levels = getIsobarLevels(center.centralHpa, center.type, 4);
        levels.forEach((hpa, lIdx) => {
          const radiusDeg = (lIdx + 1) * 3.5;
          const coordinates: [number, number][] = [];
          const steps = 48;
          for (let s = 0; s <= steps; s++) {
            const angle = (s / steps) * 2 * Math.PI;
            const cosLat = Math.max(0.15, Math.cos((center.lat * Math.PI) / 180));
            const lng = center.lng + (radiusDeg * Math.cos(angle)) / cosLat;
            const lat = Math.max(-85, Math.min(85, center.lat + radiusDeg * Math.sin(angle)));
            coordinates.push([lng, lat]);
          }

          features.push({
            type: 'Feature',
            properties: { hpa, type: center.type },
            geometry: { type: 'LineString', coordinates },
          });
        });

        features.push({
          type: 'Feature',
          properties: {
            centerType: center.type,
            name: center.name,
            hpa: center.centralHpa,
          },
          geometry: { type: 'Point', coordinates: [center.lng, center.lat] },
        });
      });

      return { type: 'FeatureCollection', features };
    };

    const applyIsobars = () => {
      try {
        const geoData = buildIsobarsGeoJson();
        if (map.getSource(ISOBAR_SOURCE_ID)) {
          (map.getSource(ISOBAR_SOURCE_ID) as any).setData(geoData);
          return;
        }

        const beforeLayerId =
          map.getLayer('place_country_major') ? 'place_country_major' :
          map.getLayer('place_country_minor') ? 'place_country_minor' :
          map.getLayer('esri-satellite-labels-layer') ? 'esri-satellite-labels-layer' :
          map.getLayer('carto-labels-layer') ? 'carto-labels-layer' : undefined;

        map.addSource(ISOBAR_SOURCE_ID, {
          type: 'geojson',
          data: geoData as any,
        });

        map.addLayer(
          {
            id: ISOBAR_LINE_LAYER_ID,
            type: 'line',
            filter: ['==', '$type', 'LineString'],
            source: ISOBAR_SOURCE_ID,
            paint: {
              'line-color': '#e2e8f0',
              'line-width': 1.1,
              'line-opacity': 0.55,
              'line-dasharray': [4, 3],
            },
          },
          beforeLayerId
        );

        map.addLayer(
          {
            id: ISOBAR_CENTERS_LAYER_ID,
            type: 'circle',
            filter: ['==', '$type', 'Point'],
            source: ISOBAR_SOURCE_ID,
            paint: {
              'circle-radius': 9,
              'circle-color': [
                'match',
                ['get', 'centerType'],
                'L', '#ef4444',
                'H', '#0284c7',
                '#64748b'
              ],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1.5,
              'circle-opacity': 0.9,
            },
          },
          beforeLayerId
        );
      } catch (err) {
        console.warn('[MapLibre Isobars] Layer sync notice:', err);
      }
    };

    if (map.isStyleLoaded()) {
      applyIsobars();
    } else {
      map.once('style.load', applyIsobars);
    }

    return () => {
      try {
        if (map.getLayer(ISOBAR_CENTERS_LAYER_ID)) map.removeLayer(ISOBAR_CENTERS_LAYER_ID);
        if (map.getLayer(ISOBAR_LINE_LAYER_ID)) map.removeLayer(ISOBAR_LINE_LAYER_ID);
        if (map.getSource(ISOBAR_SOURCE_ID)) map.removeSource(ISOBAR_SOURCE_ID);
      } catch (err) {
        // Safe cleanup
      }
    };
  }, [isMapLoaded, showPressureIsobars, activeLayer]);

  // Synchronize NASA GIBS Satellite Multi-Sector Raster Layers with MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const sectorSourceIds = [
      'solar-terminator-source',
      'nasa-black-marble-source',
      'nasa-gibs-visible-source',
      'nasa-gibs-visible-noaa20-source',
      'nasa-gibs-polar-fill-source',
      'nasa-gibs-himawari-source',
      'nasa-gibs-goes-east-source',
      'nasa-gibs-goes-west-source',
      'nasa-gibs-europe-africa-source',
      'nasa-gibs-eumet-iodc-source',
      'nasa-gibs-arctic-polar-source',
      'nasa-gibs-antarctic-polar-source',
      'nasa-gibs-satellite-source',
    ];
    const sectorLayerIds = [
      'solar-terminator-night-layer',
      'solar-terminator-twilight-layer',
      'nasa-black-marble-layer',
      'nasa-gibs-visible-layer',
      'nasa-gibs-visible-noaa20-layer',
      'nasa-gibs-polar-fill-layer',
      'nasa-gibs-himawari-layer',
      'nasa-gibs-goes-east-layer',
      'nasa-gibs-goes-west-layer',
      'nasa-gibs-europe-africa-layer',
      'nasa-gibs-eumet-iodc-layer',
      'nasa-gibs-arctic-polar-layer',
      'nasa-gibs-antarctic-polar-layer',
      'nasa-gibs-satellite-layer',
    ];

    const shouldMountSatelliteClouds =
      (activeLayer === 'satellite' || activeLayer === 'clouds' || activeLayer === 'overview' || activeLayer === 'hurricane' || activeStyleKey === 'satellite' || activeStyleKey === 'atmospheric-satellite' || activeStyleKey === 'windy-satellite') &&
      activeLayer !== 'wind' &&
      activeLayer !== 'radar' &&
      activeLayer !== 'temperature' &&
      activeLayer !== 'rain';

    if (shouldMountSatelliteClouds) {
      try {
        // Position clouds below country borders and place names so cartography stays crisp
        const beforeLayerId =
          map.getLayer('world-country-boundaries-layer') ? 'world-country-boundaries-layer' :
          map.getLayer('boundary_country_z0-4') ? 'boundary_country_z0-4' :
          map.getLayer('india-official-boundary-layer') ? 'india-official-boundary-layer' :
          map.getLayer('place_country_major') ? 'place_country_major' :
          map.getLayer('place_country_minor') ? 'place_country_minor' :
          map.getLayer('esri-satellite-labels-layer') ? 'esri-satellite-labels-layer' :
          undefined;

        // Tune opacity & contrast based on spectral band (Blue moisture, Infra thermal, or Visible daylight)
        const isVisibleMode = spectralMode === 'visible';
        const isBlue = spectralMode === 'blue';
        const isInfra = spectralMode === 'infra';
        const rasterContrast = isVisibleMode ? 0.0 : isBlue ? 0.04 : 0.0;

        // Progressive Zoom-Dependent Atmospheric Cloud Dissolve Expressions:
        // - Planetary/Regional (zoom <= 8.5): Clouds remain 88% opaque showing real cyclone spirals & storms.
        // - District/Metropolitan (zoom 9.0 to 11.5): Clouds smoothly dissolve as the camera approaches city level.
        // - Street/Monuments/Landmarks (zoom >= 12.0): Clouds reach 0.0 opacity, revealing 100% razor-sharp, crisp 4K/HD satellite photography of places with ZERO fog.
        const visibleOpacityExpression: any = [
          'interpolate',
          ['linear'],
          ['zoom'],
          7.0, 0.88,
          8.5, 0.84,
          9.5, 0.65,
          10.5, 0.35,
          11.5, 0.10,
          12.0, 0.0,
        ];

        const isHdMode = satelliteResolution === 'hd';

        const hdOpacityExpression: any = [
          'interpolate',
          ['linear'],
          ['zoom'],
          7.0, 1.0,
          8.5, 0.95,
          9.5, 0.70,
          10.5, 0.40,
          11.5, 0.10,
          12.0, 0.0,
        ];

        const geostationaryOpacityExpression: any = spectralMode === 'infra'
          ? [
              'interpolate',
              ['linear'],
              ['zoom'],
              4.0, 0.88,
              6.5, 0.85,
              7.5, 0.60,
              8.5, 0.25,
              9.0, 0.0,
              12.0, 0.0,
            ]
          : [
              'interpolate',
              ['linear'],
              ['zoom'],
              7.0, isBlue ? 0.86 : 0.88,
              8.5, isBlue ? 0.80 : 0.84,
              9.5, 0.65,
              10.5, 0.35,
              11.5, 0.10,
              12.0, 0.0,
            ];

        // Observation date string: for geostationary infrared & moisture, stream today's live real-time frames
        const geoObs = getGeostationaryObservationDate(timelineHoursAhead < 0 ? Math.abs(timelineHoursAhead) : 0);
        const dateStr = isVisibleMode || isHdMode
          ? getSatelliteObservationDate(0, 'visible').dateStr
          : geoObs.dateStr;

        // 1. Clean up obsolete duplicate NOAA-20 layer (eliminates double-exposure blur & 98.6% compounded opacity)
        if (map.getLayer('nasa-gibs-visible-noaa20-layer')) map.removeLayer('nasa-gibs-visible-noaa20-layer');
        if (map.getSource('nasa-gibs-visible-noaa20-source')) map.removeSource('nasa-gibs-visible-noaa20-source');
        if (map.getLayer('nasa-gibs-polar-fill-layer')) map.removeLayer('nasa-gibs-polar-fill-layer');
        if (map.getSource('nasa-gibs-polar-fill-source')) map.removeSource('nasa-gibs-polar-fill-source');

        // 2. Clean up obsolete opaque polar swath underlay so crisp vector / satellite basemap shines through
        const visibleSourceId = 'nasa-gibs-visible-source';
        const visibleLayerId = 'nasa-gibs-visible-layer';
        if (map.getLayer(visibleLayerId)) map.removeLayer(visibleLayerId);
        if (map.getSource(visibleSourceId)) map.removeSource(visibleSourceId);

        // 3. Astronomical Sub-Solar Longitude & Day/Night Dynamic Engine (Windy & Zoom Earth Parity):
        // Determines whether each geostationary disk is currently illuminated by daylight or in night
        const obsDate = new Date(geoObs.timestampMs);
        const utcHour = obsDate.getUTCHours() + obsDate.getUTCMinutes() / 60;
        const subSolarLng = ((12 - utcHour) * 15 + 540) % 360 - 180;

        function isSectorDaylight(centerLng: number): boolean {
          const delta = Math.abs((((centerLng - subSolarLng + 540) % 360) - 180));
          return delta < 82; // Within daylight illumination window (~5.5 hours of solar noon)
        }

        const isIodcActive = typeof window !== 'undefined'
          ? (new URLSearchParams(window.location.search).get('iodc') !== 'false' && new URLSearchParams(window.location.search).get('iodc') !== '0')
          : process.env.NEXT_PUBLIC_DISABLE_EUMETSAT_IODC !== 'true';

        const himawariDay = isSectorDaylight(140.0);
        const iodcDay = isSectorDaylight(45.5);
        const goesEastDay = isSectorDaylight(-75.0);
        const goesWestDay = isSectorDaylight(-135.0);
        const europeAfricaDay = isSectorDaylight(0.0);

        // 4. Geostationary Multi-Satellite Continuous Mosaic with Overlapping Longitude Cross-Fade:
        // Expanded sector bounds allow seamless cosine cross-fades across
        // boundary belts (e.g. 25°E–45°E, 75°E–95°E, 165°E–195°E), eliminating 100% of vertical razor seams!
        const sectors: {
          id: string;
          layerName: string;
          tileMatrixSet: string;
          format: 'image/png' | 'image/jpeg';
          isSubHourly: boolean;
          maxzoom: number;
          bounds?: [number, number, number, number];
        }[] = isHdMode
          ? [
              // Genuine 250m Resolution Polar Swath (NOAA-20 VIIRS TrueColor Level 9 - Zoom Earth Parity)
              {
                id: 'hd-swath',
                layerName: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
                tileMatrixSet: 'GoogleMapsCompatible_Level9',
                format: 'image/jpeg',
                isSubHourly: false,
                maxzoom: 9,
              },
            ]
          : !isInfra
          ? [
              // 0. Global Polar Baseline Underlay (provides high-latitude coverage > 58° lat)
              {
                id: 'global-polar',
                layerName: 'mumi:worldcloudmap_ir108',
                tileMatrixSet: 'EPSG:3857',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: 6,
              },
              // 1. Europe & Africa (Meteosat Prime 0°E Full Earth Scan)
              {
                id: 'europe-africa',
                layerName: isVisibleMode ? (europeAfricaDay ? 'msg_fes:vis006' : 'msg_fes:ir108') : 'msg_fes:ir108',
                tileMatrixSet: 'EPSG:3857',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: 6,
              },
              // 1b. Indian Ocean & Middle East (Meteosat-9 IODC 45.5°E Full Earth Scan - Zoom Earth & Windy Parity)
              ...(isIodcActive
                ? [
                    {
                      id: 'eumet-iodc',
                      layerName: isVisibleMode ? (iodcDay ? 'msg_iodc:vis006' : 'msg_iodc:ir108') : 'msg_iodc:ir108',
                      tileMatrixSet: 'EPSG:3857',
                      format: 'image/png' as const,
                      isSubHourly: true,
                      maxzoom: 6,
                    },
                  ]
                : []),
              // 2. East Asia, Bay of Bengal, Australia, Pacific (Himawari-9 140.7°E)
              {
                id: 'himawari',
                layerName: isVisibleMode ? (himawariDay ? 'Himawari_AHI_Band3_Red_Visible_1km' : 'Himawari_AHI_Band13_Clean_Infrared') : 'Himawari_AHI_Band13_Clean_Infrared',
                tileMatrixSet: isVisibleMode && himawariDay ? 'GoogleMapsCompatible_Level7' : 'GoogleMapsCompatible_Level6',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: isVisibleMode && himawariDay ? 7 : 6,
              },
              // 3. Americas & Atlantic (GOES-East 75.2°W)
              {
                id: 'goes-east',
                layerName: isVisibleMode ? (goesEastDay ? 'GOES-East_ABI_GeoColor' : 'GOES-East_ABI_Band13_Clean_Infrared') : 'GOES-East_ABI_Band13_Clean_Infrared',
                tileMatrixSet: isVisibleMode && goesEastDay ? 'GoogleMapsCompatible_Level7' : 'GoogleMapsCompatible_Level6',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: isVisibleMode && goesEastDay ? 7 : 6,
              },
              // 4. Pacific & Americas West (GOES-West 137.2°W)
              {
                id: 'goes-west',
                layerName: isVisibleMode ? (goesWestDay ? 'GOES-West_ABI_GeoColor' : 'GOES-West_ABI_Band13_Clean_Infrared') : 'GOES-West_ABI_Band13_Clean_Infrared',
                tileMatrixSet: isVisibleMode && goesWestDay ? 'GoogleMapsCompatible_Level7' : 'GoogleMapsCompatible_Level6',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: isVisibleMode && goesWestDay ? 7 : 6,
              },
            ]
          : [
              // 0. Global Polar Baseline Underlay (provides high-latitude coverage > 58° lat)
              {
                id: 'global-polar',
                layerName: 'mumi:worldcloudmap_ir108',
                tileMatrixSet: 'EPSG:3857',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: 6,
              },
              // 1. Europe & Africa (Meteosat Prime 0°E Full Earth Scan)
              {
                id: 'europe-africa',
                layerName: 'msg_fes:ir108',
                tileMatrixSet: 'EPSG:3857',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: 6,
              },
              // 1b. Indian Ocean & Middle East (Meteosat-9 IODC 45.5°E Full Earth Scan - Zoom Earth & Windy Parity)
              ...(isIodcActive
                ? [
                    {
                      id: 'eumet-iodc',
                      layerName: 'msg_iodc:ir108',
                      tileMatrixSet: 'EPSG:3857',
                      format: 'image/png' as const,
                      isSubHourly: true,
                      maxzoom: 6,
                    },
                  ]
                : []),
              // 2. East Asia, Bay of Bengal, Australia, Pacific (Himawari-9 140.7°E)
              {
                id: 'himawari',
                layerName: 'Himawari_AHI_Band13_Clean_Infrared',
                tileMatrixSet: 'GoogleMapsCompatible_Level6',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: 6,
              },
              // 3. Americas & Atlantic (GOES-East 75.2°W)
              {
                id: 'goes-east',
                layerName: 'GOES-East_ABI_Band13_Clean_Infrared',
                tileMatrixSet: 'GoogleMapsCompatible_Level6',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: 6,
              },
              // 4. Pacific & Americas West (GOES-West 137.2°W)
              {
                id: 'goes-west',
                layerName: 'GOES-West_ABI_Band13_Clean_Infrared',
                tileMatrixSet: 'GoogleMapsCompatible_Level6',
                format: 'image/png',
                isSubHourly: true,
                maxzoom: 6,
              },
            ];
          // Clean up unused sectors (including obsolete VIIRS thermal brightness sectors)
          const activeSectorIds = new Set(sectors.map((s) => s.id));
          ['himawari', 'eumet-iodc', 'goes-east', 'goes-west', 'europe-africa', 'global-polar', 'hd-swath', 'arctic-polar', 'antarctic-polar'].forEach((sId) => {
            if (!activeSectorIds.has(sId)) {
              if (map.getLayer(`nasa-gibs-${sId}-layer`)) map.removeLayer(`nasa-gibs-${sId}-layer`);
              if (map.getSource(`nasa-gibs-${sId}-source`)) map.removeSource(`nasa-gibs-${sId}-source`);
            }
          });

          // 4b. Astronomical Solar Terminator (Night Shadow & Golden Twilight Horizon)
          // Hard vector polygon fills create unnatural razor-sharp diagonal knife cuts across continents and oceans.
          // Photorealistic night darkening and warm city lights are rendered smoothly at the pixel level by Black Marble with cosine twilight fade.
          const terminatorNightOpacity = 0.0;
          const terminatorTwilightOpacity = 0.0;
          const blackMarbleOpacity = activeStyleKey === 'windy-satellite' ? 0.0 : 0.92;

          // Ground-level terminator position: Insert beneath clouds so atmospheric clouds float above night darkness
          const firstCloudLayerId =
            map.getLayer('nasa-gibs-hd-swath-layer') ? 'nasa-gibs-hd-swath-layer' :
            map.getLayer('nasa-gibs-global-polar-layer') ? 'nasa-gibs-global-polar-layer' :
            map.getLayer('nasa-gibs-europe-africa-layer') ? 'nasa-gibs-europe-africa-layer' :
            map.getLayer('nasa-gibs-eumet-iodc-layer') ? 'nasa-gibs-eumet-iodc-layer' :
            map.getLayer('nasa-gibs-himawari-layer') ? 'nasa-gibs-himawari-layer' :
            map.getLayer('nasa-gibs-goes-east-layer') ? 'nasa-gibs-goes-east-layer' :
            map.getLayer('nasa-gibs-goes-west-layer') ? 'nasa-gibs-goes-west-layer' :
            beforeLayerId;

          const nightGeoJSON = getNightTerminatorGeoJSON(obsDate);
          const terminatorSrc = map.getSource('solar-terminator-source') as any;
          if (terminatorSrc) {
            terminatorSrc.setData(nightGeoJSON);
          } else {
            map.addSource('solar-terminator-source', {
              type: 'geojson',
              data: nightGeoJSON,
            });
          }
          if (map.getLayer('solar-terminator-night-layer')) {
            map.setPaintProperty('solar-terminator-night-layer', 'fill-opacity', terminatorNightOpacity);
          } else {
            map.addLayer(
              {
                id: 'solar-terminator-night-layer',
                type: 'fill',
                source: 'solar-terminator-source',
                paint: {
                  'fill-color': '#01030a',
                  'fill-opacity': terminatorNightOpacity,
                },
              },
              firstCloudLayerId
            );
          }
          if (map.getLayer('solar-terminator-twilight-layer')) {
            map.setPaintProperty('solar-terminator-twilight-layer', 'line-opacity', terminatorTwilightOpacity);
          } else {
            map.addLayer(
              {
                id: 'solar-terminator-twilight-layer',
                type: 'line',
                source: 'solar-terminator-source',
                paint: {
                  'line-color': '#f59e0b',
                  'line-width': 3.5,
                  'line-opacity': terminatorTwilightOpacity,
                  'line-blur': 8.0,
                },
              },
              firstCloudLayerId
            );
          }

          // 5. NASA Black Marble (VIIRS Day/Night Band Nocturnal City Lights)
          const blackMarbleUrl = `black-marble-alpha://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png?t=${geoObs.timestampMs}`;
          const blackMarbleSrc = map.getSource('nasa-black-marble-source') as any;
          if (!blackMarbleSrc) {
            map.addSource('nasa-black-marble-source', {
              type: 'raster',
              tiles: [blackMarbleUrl],
              tileSize: 256,
              maxzoom: 8,
              attribution: 'NASA EOSDIS / Earth Science Open Data (VIIRS Black Marble)',
            });
          } else if (blackMarbleSrc.tiles?.[0] !== blackMarbleUrl) {
            if (map.getLayer('nasa-black-marble-layer')) map.removeLayer('nasa-black-marble-layer');
            map.removeSource('nasa-black-marble-source');
            map.addSource('nasa-black-marble-source', {
              type: 'raster',
              tiles: [blackMarbleUrl],
              tileSize: 256,
              maxzoom: 8,
              attribution: 'NASA EOSDIS / Earth Science Open Data (VIIRS Black Marble)',
            });
            map.addLayer(
              {
                id: 'nasa-black-marble-layer',
                type: 'raster',
                source: 'nasa-black-marble-source',
                maxzoom: 12,
                paint: {
                  'raster-opacity': blackMarbleOpacity,
                  'raster-resampling': 'linear',
                  'raster-fade-duration': 350,
                },
              },
              firstCloudLayerId
            );
          }
          if (map.getLayer('nasa-black-marble-layer')) {
            map.setPaintProperty('nasa-black-marble-layer', 'raster-opacity', blackMarbleOpacity);
          } else {
            map.addLayer(
              {
                id: 'nasa-black-marble-layer',
                type: 'raster',
                source: 'nasa-black-marble-source',
                maxzoom: 12,
                paint: {
                  'raster-opacity': blackMarbleOpacity,
                  'raster-resampling': 'linear',
                  'raster-fade-duration': 350,
                },
              },
              firstCloudLayerId
            );
          }



          sectors.forEach((sec) => {
            const sId = `nasa-gibs-${sec.id}-source`;
            const lId = `nasa-gibs-${sec.id}-layer`;
            const tileTime = sec.isSubHourly ? geoObs.isoTimestamp : geoObs.dateStr;
            const ext = sec.format === 'image/jpeg' ? (sec.layerName.includes('VIIRS') ? 'jpeg' : 'jpg') : 'png';
            const isEumet = (sec as any).isWms || sec.layerName.startsWith('msg_') || sec.layerName.startsWith('mumi:');
            const spectralParam = isVisibleMode ? 'spectral=vis' : spectralMode === 'infra' ? 'spectral=infra' : 'spectral=blue';
            const useNoaaPilot = shouldUseNoaaStarPilotForSector({
              sectorId: sec.id,
              spectralMode: isVisibleMode ? 'visible' : spectralMode === 'infra' ? 'infra' : 'blue',
              isVisibleMode,
              goesEastDay,
              isHdMode,
              timelineHoursAhead,
            });
            const tileUrl = sec.id === 'hd-swath'
              ? `https://wmts.earthdata.nasa.gov/wmts/epsg3857/best/${sec.layerName}/default/${tileTime}/${sec.tileMatrixSet}/{z}/{y}/{x}.${ext}`
              : useNoaaPilot
              ? buildNoaaStarTileUrl({
                  sectorId: sec.id,
                  fallbackProto: isEumet ? 'eumet' : 'gibs',
                  enableNightIr: isVisibleMode,
                  layerName: sec.layerName,
                  tileTime,
                  tileMatrixSet: sec.tileMatrixSet,
                  ext,
                  spectralParam,
                  bucket: Math.floor(Date.now() / 300000),
                })
              : isEumet
              ? `eumet-alpha://view.eumetsat.int/geoserver/wms/tile/${sec.layerName}/{z}/{x}/{y}.png?${spectralParam}`
              : `gibs-alpha://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${sec.layerName}/default/${tileTime}/${sec.tileMatrixSet}/{z}/{y}/{x}.${ext}?${spectralParam}`;

            const secAttribution = useNoaaPilot
              ? 'NOAA STAR GOES-19/18 + CIRA Himawari-9 & Meteosat-9/0deg Live / Fallback'
              : sec.id === 'hd-swath'
              ? 'NASA EOSDIS / NOAA-20 VIIRS TrueColor (250m)'
              : sec.layerName.includes('iodc')
              ? 'EUMETSAT Meteosat-9 IODC (45.5°E)'
              : sec.layerName.startsWith('mumi:')
              ? 'EUMETSAT Geostationary High-Rate SEVIRI / GOES / Himawari Global Mosaic | Esri'
              : sec.layerName.startsWith('msg_')
              ? 'EUMETSAT Meteosat High Rate SEVIRI'
              : 'NASA GIBS / NOAA GOES / JMA Himawari Earth Science Open Data';

            const activeOpacityExpr = sec.id === 'hd-swath' ? hdOpacityExpression : geostationaryOpacityExpression;
            const activeContrast = sec.id === 'hd-swath' ? 0.04 : rasterContrast;
            const secBounds =
              sec.bounds ??
              ({
                'europe-africa': [-40, -65, 45, 65],
                'eumet-iodc': [25, -65, 95, 65],
                'goes-east': [-135, -65, -15, 65],
              } as Record<string, [number, number, number, number]>)[sec.id];
            const sourceSpec = {
              type: 'raster' as const,
              tiles: [tileUrl],
              tileSize: 256,
              maxzoom: sec.maxzoom,
              ...(secBounds ? { bounds: secBounds } : {}),
              attribution: secAttribution,
            };

            const existingSource = map.getSource(sId) as any;
            if (existingSource) {
              if (existingSource.tiles?.[0] !== tileUrl) {
                if (map.getLayer(lId)) map.removeLayer(lId);
                map.removeSource(sId);
                map.addSource(sId, sourceSpec);
                map.addLayer(
                  {
                    id: lId,
                    type: 'raster',
                    source: sId,
                    maxzoom: 12,
                    paint: {
                      'raster-opacity': activeOpacityExpr,
                      'raster-contrast': activeContrast,
                      'raster-resampling': 'linear',
                      'raster-fade-duration': 120,
                    },
                  },
                  beforeLayerId
                );
              } else if (map.getLayer(lId)) {
                map.setPaintProperty(lId, 'raster-opacity', activeOpacityExpr);
                map.setPaintProperty(lId, 'raster-contrast', activeContrast);
                map.setPaintProperty(lId, 'raster-resampling', 'linear');
              }
            } else {
              map.addSource(sId, sourceSpec);
              map.addLayer(
                {
                  id: lId,
                  type: 'raster',
                  source: sId,
                  maxzoom: 12,
                  paint: {
                    'raster-opacity': activeOpacityExpr,
                    'raster-contrast': activeContrast,
                    'raster-resampling': 'linear',
                    'raster-fade-duration': 120,
                  },
                },
                beforeLayerId
              );
            }
          });

          // Guarantee terminator & black marble are strictly beneath cloud layers so clouds remain 100% luminous white at night (Windy Parity)
          const activeCloudLayerId = sectors.map((s) => `nasa-gibs-${s.id}-layer`).find((id) => map.getLayer(id));
          if (activeCloudLayerId) {
            if (map.getLayer('nasa-black-marble-layer')) {
              try { map.moveLayer('nasa-black-marble-layer', activeCloudLayerId); } catch {}
            }
            if (map.getLayer('solar-terminator-twilight-layer')) {
              try { map.moveLayer('solar-terminator-twilight-layer', activeCloudLayerId); } catch {}
            }
            if (map.getLayer('solar-terminator-night-layer')) {
              try { map.moveLayer('solar-terminator-night-layer', activeCloudLayerId); } catch {}
            }
          }
      } catch (err) {
        console.warn('[MapLibre Satellite] Layer sync notice:', err);
      }
    } else {
      try {
        sectorLayerIds.forEach((id) => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        sectorSourceIds.forEach((id) => {
          if (map.getSource(id)) map.removeSource(id);
        });
      } catch {
        // Silently ignore cleanup errors
      }
    }
  }, [activeLayer, isMapLoaded, satelliteTileUrl, spectralMode, satelliteObservationUtc, activeStyleKey, timelineHoursAhead, selectedCyclone, satelliteRefreshTick, satelliteResolution]);

  // Synchronize Nowcast Lightning GeoJSON layer on MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const sourceId = 'nowcast-lightning-source';
    const glowLayerId = 'nowcast-lightning-glow';
    const coreLayerId = 'nowcast-lightning-core';

    if (showLightning && lightningFeed && lightningFeed.features.length > 0) {
      try {
        const existingSource = map.getSource(sourceId) as any;
        if (existingSource) {
          existingSource.setData(lightningFeed);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: lightningFeed as any,
          });

          // Soft ambient neon glow
          map.addLayer({
            id: glowLayerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'intensityKa'],
                15, 6,
                110, 15,
              ],
              'circle-color': ['get', 'colorHex'],
              'circle-opacity': 0.55,
              'circle-blur': 0.65,
            },
          });

          // Intense core spark
          map.addLayer({
            id: coreLayerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': 3.5,
              'circle-color': '#ffffff',
              'circle-stroke-width': 1.5,
              'circle-stroke-color': ['get', 'colorHex'],
            },
          });

          // Click popup showing lightning details
          map.on('click', coreLayerId, (e: any) => {
            const feat = e.features?.[0];
            if (!feat) return;
            const props = feat.properties;
            const coords = (feat.geometry as any).coordinates.slice();
            new Popup({ className: 'city-map-popup', closeButton: true })
              .setLngLat(coords)
              .setHTML(`
                <div style="background:#070718; color:#fff; padding:10px; border-radius:12px; font-family:monospace; font-size:11px; border:1px solid #e879f9;">
                  <div style="font-weight:bold; color:#f43f5e; margin-bottom:4px;">⚡ Nowcast Lightning Strike</div>
                  <div>Peak Current: <b>${props?.polarity ?? ''}${props?.intensityKa ?? 45} kA</b></div>
                  <div style="color:rgba(255,255,255,0.6); font-size:10px;">Detected ${props?.ageSeconds ?? 15}s ago</div>
                </div>
              `)
              .addTo(map);
          });

          map.on('mouseenter', coreLayerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', coreLayerId, () => {
            map.getCanvas().style.cursor = '';
          });
        }
      } catch (err) {
        console.warn('[MapLibre Lightning] Sync notice:', err);
      }
    } else {
      try {
        if (map.getLayer(coreLayerId)) map.removeLayer(coreLayerId);
        if (map.getLayer(glowLayerId)) map.removeLayer(glowLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // Silently ignore cleanup
      }
    }
  }, [showLightning, lightningFeed, isMapLoaded]);

  // Synchronize Worldwide Sovereign Country Boundaries & Official Survey of India Sovereign Boundary
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const indiaSourceId = 'india-official-boundary-source';
    const indiaLayerId = 'india-official-boundary-layer';
    const worldSourceId = 'world-country-boundaries-source';
    const worldLayerId = 'world-country-boundaries-layer';
    const globalSourceId = 'global-country-borders-source';
    const globalLayerId = 'global-country-borders-layer';

    const syncBoundaries = () => {
      try {
        const beforeLabelId =
          map.getLayer('place_country_major') ? 'place_country_major' :
          map.getLayer('place_country_minor') ? 'place_country_minor' :
          map.getLayer('place_state') ? 'place_state' :
          map.getLayer('place_city_major') ? 'place_city_major' :
          undefined;

        // 1. Worldwide Country Sovereign Boundaries (Natural Earth Admin-0, solid black #000000)
        // Bundled locally so all 195+ countries worldwide display crisp borders at zoom 0-5+ with 0ms latency
        if (!map.getSource(worldSourceId)) {
          map.addSource(worldSourceId, {
            type: 'geojson',
            data: '/data/world-country-boundaries.geojson',
          });
        }
        if (!map.getLayer(worldLayerId)) {
          map.addLayer(
            {
              id: worldLayerId,
              type: 'line',
              source: worldSourceId,
              paint: {
                'line-color': activeLayer === 'satellite' ? 'rgba(255, 255, 255, 0.40)' : '#000000',
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  1, activeLayer === 'satellite' ? 0.8 : 1.4,
                  4, activeLayer === 'satellite' ? 1.0 : 1.8,
                  8, activeLayer === 'satellite' ? 1.4 : 2.4,
                ],
                'line-opacity': activeLayer === 'satellite' ? 0.50 : 0.92,
              },
            },
            beforeLabelId
          );
        }

        // 2. Official Survey of India Sovereign Boundary (J&K, Ladakh, Arunachal Pradesh intact)
        // Placed on top of the world boundaries layer for 100% sovereign accuracy
        if (!map.getSource(indiaSourceId)) {
          map.addSource(indiaSourceId, {
            type: 'geojson',
            data: '/data/india-official-boundary.geojson',
          });
        }
        if (!map.getLayer(indiaLayerId)) {
          map.addLayer(
            {
              id: indiaLayerId,
              type: 'line',
              source: indiaSourceId,
              paint: {
                'line-color': activeLayer === 'satellite' ? 'rgba(255, 255, 255, 0.60)' : '#000000',
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  1, activeLayer === 'satellite' ? 1.0 : 1.8,
                  4, activeLayer === 'satellite' ? 1.2 : 2.2,
                  8, activeLayer === 'satellite' ? 1.6 : 3.0,
                ],
                'line-opacity': activeLayer === 'satellite' ? 0.65 : 0.98,
              },
            },
            beforeLabelId
          );
        }

        // 3. Global Black Country Borders fallback for raster styles that lack vector boundaries
        if (!map.getLayer('boundary_country_z0-4') && !map.getLayer(globalLayerId)) {
          if (!map.getSource(globalSourceId)) {
            map.addSource(globalSourceId, {
              type: 'vector',
              url: 'https://tiles.openfreemap.org/planet',
            });
          }
          map.addLayer(
            {
              id: globalLayerId,
              type: 'line',
              source: globalSourceId,
              'source-layer': 'boundary',
              filter: ['all', ['==', 'admin_level', 2]],
              paint: {
                'line-color': '#000000',
                'line-width': 1.6,
                'line-opacity': 0.95,
              },
            },
            beforeLabelId
          );
        }
      } catch (err) {
        console.warn('[MapLibre Boundary] Sync notice:', err);
      }
    };

    syncBoundaries();

    map.on('styledata', syncBoundaries);
    return () => {
      map.off('styledata', syncBoundaries);
    };
  }, [isMapLoaded, activeStyleKey]);

  // Center map on city marker
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: initialZoom,
        pitch: 0,
        bearing: 0,
        speed: 1.2,
      });
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-0 bg-[#020208] text-white overflow-hidden select-none ${className}`}
      data-testid="city-map-viewer"
    >
      {/* ── Map Canvas Container ─────────────────────── */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* ── Synchronized 2D Weather Overlay (Wind Streamlines & Temperature Thermal Grid) ── */}
      {isMapLoaded && mapRef.current && (
        <WeatherMapLibreOverlay
          map={mapRef.current}
          activeLayer={activeLayer}
          particlesEnabled={particlesEnabled}
          weatherGridData={weatherGridData}
        />
      )}

      {/* ── Fallback Notification Toast ─────────────── */}
      {fallbackNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[90%] sm:max-w-md bg-[#070718]/95 border border-cyan-500/40 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-xl text-xs font-mono text-cyan-300 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 truncate">
            <span>⚡</span>
            <span className="truncate">{fallbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFallbackNotice(null)}
            className="text-white/40 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Radar Coverage Notice when viewing areas outside North American Doppler network ── */}
      {activeLayer === 'radar' && !isRadarNoticeDismissed && !isLocationCoveredByRadar(latitude, longitude) && (
        <div className="absolute top-20 left-4 z-40 pointer-events-auto">
          <RadarCoverageNotice
            locationName={cityName}
            onSwitchToPrecipitation={() => {
              if (onLayerChange) onLayerChange('precipitation');
              else if (onOpenWeather) onOpenWeather();
            }}
            onSwitchToSatellite={() => {
              if (onLayerChange) onLayerChange('satellite');
              else if (onOpenWeather) onOpenWeather();
            }}
            onRecenterRadar={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({ center: [-96.0, 38.5], zoom: 4.5, speed: 1.4 });
              }
            }}
            onDismiss={() => setIsRadarNoticeDismissed(true)}
          />
        </div>
      )}



      {/* ── Top Floating Navigation HUD ──────────────── */}
      <div className="absolute top-2.5 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-30 pointer-events-none flex items-start justify-between gap-1.5 sm:gap-3">
        {/* Left: "Return to Earth" Action & City Badge */}
        <div className="flex flex-col gap-1.5 sm:gap-2 pointer-events-auto min-w-0 max-w-[45%] sm:max-w-none">
          <button
            type="button"
            data-testid="return-to-earth-btn"
            onClick={onReturnToEarth}
            className="group px-2 py-1 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400 text-[11px] sm:text-xs font-mono font-bold text-cyan-300 hover:text-white flex items-center gap-1 sm:gap-2 shadow-2xl transition-all active:scale-95 cursor-pointer w-fit shrink-0"
            title="Return to interactive 3D Earth globe"
          >
            <img src="/logo-icon.png" alt="MooEarth" className="w-4 h-4 sm:w-5 sm:h-5 rounded-md object-contain shrink-0 group-hover:rotate-12 transition-transform" />
            <span className="truncate sm:hidden font-bold">3D Earth</span>
            <span className="truncate hidden sm:inline">{dict.cityMap?.returnToEarth || 'Return to Earth'}</span>
            <span className="text-[10px] text-cyan-400/60 font-normal hidden sm:inline">⟵ Orbit</span>
          </button>

          {/* City Badge & Quick Mode Controls (Shown only when exploring a specific city) */}
          {cityName !== 'World Map' && (
            <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-[#050512]/90 backdrop-blur-xl border border-white/10 text-xs font-mono flex items-center gap-1.5 sm:gap-2 shadow-2xl max-w-full">
              {activeWeatherSummary?.weatherEmoji ? (
                <span className="text-base shrink-0">{activeWeatherSummary.weatherEmoji}</span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-white truncate max-w-[110px] min-[400px]:max-w-[140px] sm:max-w-[240px]">
                    {cityName}
                  </span>
                  {liveTime && (
                    <span
                      className="text-cyan-300 font-mono text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shrink-0 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20"
                      title={`Local Time: ${liveTime.timeSeconds12} · ${liveTime.tzFullLabel}`}
                    >
                      <span>{liveTime.solar.icon}</span>
                      <span>{liveTime.time12}</span>
                    </span>
                  )}
                  {activeWeatherSummary && typeof activeWeatherSummary.temperature === 'number' && (
                    <span className="font-black text-cyan-300 text-xs font-mono shrink-0">
                      {Math.round(activeWeatherSummary.temperature)}°{activeWeatherSummary.units === 'fahrenheit' ? 'F' : 'C'}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-white/50 truncate max-w-[110px] min-[400px]:max-w-[140px] sm:max-w-[240px]">
                  {`${activeWeatherSummary?.weatherDescription ? `${activeWeatherSummary.weatherDescription} · ` : ''}${(countryName ? getLocalizedCountryName(countryName, locale) : null) || 'Metropolis'} · ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-1 shrink-0">
                <button
                  type="button"
                  data-testid="place-max-zoom-pill"
                  onClick={handleQuickZoomMax}
                  className={`p-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    searchFocusMode === 'place-max' && activeLayer !== 'temperature'
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-transparent'
                  }`}
                  title={`Auto-zoom directly into ${cityName} at maximum HD satellite zoom`}
                  aria-label="Zoom In to Place"
                >
                  🔭
                </button>
                <button
                  type="button"
                  data-testid="place-temperature-pill"
                  onClick={handleQuickTempView}
                  className={`p-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeLayer === 'temperature' || searchFocusMode === 'temperature'
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-transparent'
                  }`}
                  title={`Switch to Temperature thermal map & live telemetry for ${cityName}`}
                  aria-label="Temperature"
                >
                  🌡️
                </button>
                <button
                  type="button"
                  onClick={handleRecenter}
                  className="p-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-white/60 hover:text-cyan-300 transition-colors cursor-pointer shrink-0"
                  title="Recenter camera on city marker"
                  aria-label="Recenter"
                >
                  🎯
                </button>
              </div>
            </div>
          )}

          {/* Geostationary Satellite & Nowcast Lightning Telemetry HUD */}
          {activeLayer !== 'wind' && (activeLayer === 'satellite' || activeLayer === 'clouds' || activeLayer === 'hurricane' || activeStyleKey === 'satellite' || activeStyleKey === 'atmospheric-satellite' || activeStyleKey === 'windy-satellite') && !isSatelliteHudDismissed && (
            <div className="w-fit max-w-[92vw] sm:max-w-lg flex flex-col gap-1.5 animate-fade-in">
              <div className="rounded-2xl bg-[#060818]/94 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] p-2 sm:p-2.5 flex flex-col gap-2">
                {/* Top row: Sensor Pass + Live Time Pill + Hide Crossbar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base shrink-0">🛰️</span>
                    <span className="font-bold text-white text-[11px] tracking-wide">
                      Geostationary Satellite Clouds
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30">
                      REAL CLOUDS
                    </span>
                    {typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('iodc') || process.env.NEXT_PUBLIC_ENABLE_EUMETSAT_IODC === 'true') && (
                      <span className="text-[9px] font-mono font-bold text-amber-300 px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30" title="EUMETSAT Meteosat-9 IODC (45.5°E) Prototype Active">
                        IODC 45.5°E
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Amber Live Latency Pill or HD Ground Detail indicator */}
                    {currentZoom >= 11.8 ? (
                      <div className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono font-bold text-[10px] tracking-wide flex items-center gap-1 shrink-0">
                        <span>✨</span>
                        <span>HD Places Active</span>
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-[10px] tracking-wide shadow-[0_0_12px_rgba(251,191,36,0.8)] flex items-center gap-1 shrink-0 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span>Live • {satelliteLatencyLabel}</span>
                      </div>
                    )}

                    {/* Crossbar to hide the HUD */}
                    <button
                      type="button"
                      data-testid="close-satellite-hud-btn"
                      onClick={() => setIsSatelliteHudDismissed(true)}
                      className="w-6 h-6 rounded-lg bg-white/10 hover:bg-rose-500/30 text-white/70 hover:text-white flex items-center justify-center text-xs font-bold transition-all border border-white/10 hover:border-rose-400/50 cursor-pointer shrink-0 active:scale-95"
                      title="Hide Satellite Clouds HUD"
                      aria-label="Hide Satellite Clouds HUD"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Middle Row: Spectral Mode Switcher (Visible | Infra | Blue) & Lightning Toggle */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap">
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
                    {(['blue', 'visible', 'infra'] as SatelliteSpectralMode[]).map((mode) => {
                      const isActive = (spectralMode || 'blue') === mode;
                      const label = mode === 'blue' ? 'Blue' : mode === 'visible' ? 'Visible' : 'Infra (K)';
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => onSelectSpectralMode?.(mode)}
                          className={`px-2 py-0.8 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-sm'
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Satellite Resolution Engine: Live Geostationary (10m) vs Genuine 250m HD Swath (Zoom Earth Parity) */}
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
                    <button
                      type="button"
                      data-testid="satellite-res-live-btn"
                      onClick={() => setSatelliteResolution('live')}
                      className={`px-2 py-0.8 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        satelliteResolution === 'live'
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-sm'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                      title="Live Geostationary Satellite Constellation (10-15m cadence)"
                    >
                      🛰️ Live (10m)
                    </button>
                    <button
                      type="button"
                      data-testid="satellite-res-hd-btn"
                      onClick={() => setSatelliteResolution('hd')}
                      className={`px-2 py-0.8 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        satelliteResolution === 'hd'
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50 shadow-sm'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                      title="True 250m High-Definition Polar Swath (NOAA-20 VIIRS TrueColor)"
                    >
                      ✨ HD (250m)
                    </button>
                  </div>

                  {/* Basemap Relief Toggle: Atmospheric Satellite vs Windy Relief */}
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
                    <button
                      type="button"
                      data-testid="basemap-photo-earth-btn"
                      onClick={() => setActiveStyleKey('atmospheric-satellite')}
                      className={`px-2 py-0.8 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        activeStyleKey === 'atmospheric-satellite' || activeStyleKey === 'satellite'
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-sm'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                      title="4K Photorealistic Atmospheric Satellite Earth Imagery"
                    >
                      🛰️ Atmospheric Satellite
                    </button>
                    <button
                      type="button"
                      data-testid="basemap-windy-relief-btn"
                      onClick={() => setActiveStyleKey('windy-satellite')}
                      className={`px-2 py-0.8 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        activeStyleKey === 'windy-satellite'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-sm'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                      title="High-Contrast Topographic Relief Basemap"
                    >
                      🌿 Topographic Relief
                    </button>
                  </div>

                  {/* Nowcast Lightning Toggle Button */}
                  {lightningFeed && (
                    <button
                      type="button"
                      onClick={() => setShowLightning(!showLightning)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                        showLightning
                          ? 'bg-rose-500/25 border-rose-400/60 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                      title="Toggle Nowcast Lightning strikes overlay"
                    >
                      <span className="animate-pulse">⚡</span>
                      <span>Nowcast Lightning</span>
                      <span className="text-[9px] px-1 rounded bg-white/10 text-rose-300 font-bold">
                        {lightningFeed.totalCount}
                      </span>
                    </button>
                  )}
                </div>

                {/* Bottom Subtitle */}
                <div className="text-[9px] font-mono text-white/40 truncate">
                  {isNoaaStarPilotEnabled() &&
                  satelliteResolution === 'live' &&
                  timelineHoursAhead === 0 &&
                  noaaStarTelemetry ? (
                    (() => {
                      const activeName = noaaStarTelemetry.satLabel || 'GOES-19';
                      const activeProd = noaaStarTelemetry.product || 'GeoColor';
                      const multiCount = noaaStarTelemetry.activeSectors?.length ?? 1;
                      const isEumetSector =
                        noaaStarTelemetry.sector === 'europe-africa' ||
                        noaaStarTelemetry.sector === 'eumet-iodc';
                      const fallbackName = isEumetSector ? 'EUMETSAT Edge' : 'NASA GIBS';
                      if (noaaStarTelemetry.mode === 'noaa-star') {
                        return (
                          <span
                            data-testid="noaa-star-hud-status"
                            className={(noaaStarTelemetry.cdnAgeMinutes ?? 0) > 65 ? 'text-amber-300' : 'text-emerald-300/80'}
                          >
                            Live {activeName} ({activeProd})
                            {multiCount > 1 ? ` • ${multiCount} Global Feeds` : ''} • CDN age{' '}
                            {noaaStarTelemetry.cdnAgeMinutes ?? '?'}m
                            {(noaaStarTelemetry.cdnAgeMinutes ?? 0) > 65 ? ' (Stale)' : ''}
                          </span>
                        );
                      }
                      if (noaaStarTelemetry.mode === 'gibs-fallback-pending') {
                        return (
                          <span data-testid="noaa-star-hud-status" className="text-amber-200/90">
                            Switching to {fallbackName} {activeProd}… • Trigger:{' '}
                            {formatNoaaFallbackReason(noaaStarTelemetry.reason)}
                          </span>
                        );
                      }
                      if (noaaStarTelemetry.mode === 'gibs-fallback-failed') {
                        return (
                          <span data-testid="noaa-star-hud-status" className="text-rose-300">
                            Fallback unavailable: {fallbackName} failed • Trigger:{' '}
                            {formatNoaaFallbackReason(noaaStarTelemetry.reason)}
                          </span>
                        );
                      }
                      return (
                        <span data-testid="noaa-star-hud-status" className="text-amber-300">
                          Active: {fallbackName} {activeProd} • Failover reason:{' '}
                          {formatNoaaFallbackReason(noaaStarTelemetry.reason)}
                        </span>
                      );
                    })()
                  ) : (
                    satelliteObservationUtc ||
                    satelliteObservation.utcStr ||
                    (typeof window !== 'undefined' &&
                    (new URLSearchParams(window.location.search).has('iodc') ||
                      process.env.NEXT_PUBLIC_ENABLE_EUMETSAT_IODC === 'true')
                      ? 'EUMETSAT IODC (45.5°E) / NASA EOSDIS / NOAA GOES • 10-15m Scans'
                      : 'NASA EOSDIS / NOAA GOES / EUMETSAT • 10-15m Scans • Public Domain')
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nearby Places Discovery */}
          {cityName !== 'World Map' && (
            <NearbyPlacesPanel
              latitude={latitude}
              longitude={longitude}
              onSelectPlace={(place) => {
                mapRef.current?.flyTo({
                  center: [place.longitude, place.latitude],
                  zoom: 14.5,
                  essential: true,
                });
                onMapClick?.({ lat: place.latitude, lng: place.longitude });
              }}
            />
          )}
        </div>

        {/* Center: Windy-Style Prominent Brand Watermark Pill */}
        <div className="hidden lg:flex pointer-events-auto shrink-0 items-center justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#050512]/92 hover:bg-[#0a0f2c] backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_4px_25px_rgba(0,0,0,0.7)] hover:shadow-[0_0_18px_rgba(6,182,212,0.4)] transition-all group"
            title="MooEarth Live — Real-Time Planetary Weather & Satellite Intelligence"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-cyan-950/80 border border-cyan-400/60 p-0.5 shadow-[0_0_8px_rgba(6,182,212,0.5)] group-hover:scale-110 transition-transform shrink-0 flex items-center justify-center">
              <img
                src="/logo-icon.png"
                alt="MooEarth"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-black text-white text-xs tracking-tight group-hover:text-cyan-300 transition-colors">
                MooEarth
              </span>
              <span className="text-[10px] font-bold text-cyan-400 font-mono">
                .live
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Style Selector & Weather Telemetry Summary */}
        <div className="flex flex-col items-end gap-1 sm:gap-2 pointer-events-auto shrink-0 max-w-[65%] sm:max-w-none">
          {/* Top Controls Row: Style Selector Dropdown + Optional Satellite HUD Restore Pill */}
          <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-wrap">
            {/* Full World Panoramic View (Windy / Zoom Earth View) */}
            <button
              type="button"
              data-testid="full-world-view-btn"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: [15, 20],
                    zoom: 1.8,
                    pitch: 0,
                    bearing: 0,
                    speed: 1.2,
                  });
                }
              }}
              className="px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 text-[10px] sm:text-[11px] font-mono text-cyan-300 hover:text-white flex items-center gap-1 shadow-lg transition-all cursor-pointer shrink-0"
              title="Full World View (Zoom to fit all continents & oceans)"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">Full World</span>
            </button>
            {/* If Satellite HUD is dismissed, show a sleek pill button to bring it back */}
            {activeLayer !== 'wind' && (activeLayer === 'satellite' || activeLayer === 'clouds' || activeLayer === 'hurricane' || activeStyleKey === 'satellite' || activeStyleKey === 'atmospheric-satellite' || activeStyleKey === 'windy-satellite') && isSatelliteHudDismissed && (
              <button
                type="button"
                data-testid="show-satellite-hud-btn"
                onClick={() => setIsSatelliteHudDismissed(false)}
                className="px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 text-[10px] sm:text-[11px] font-mono text-cyan-300 hover:text-white flex items-center gap-1 shadow-lg transition-all cursor-pointer shrink-0"
                title="Show Geostationary Satellite Clouds controls"
              >
                <span>🛰️</span>
                <span className="hidden sm:inline">Clouds</span>
                <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  {spectralMode ? spectralMode.toUpperCase().slice(0, 3) : 'BLU'}
                </span>
              </button>
            )}

            {/* Style Selector Dropdown Pill */}
            <div className="relative shrink-0">
              <button
                type="button"
                data-testid="map-style-selector-btn"
                onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
                className="px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#050512]/90 hover:bg-[#0a0a24] backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 text-[10px] sm:text-[11px] font-mono text-white/80 hover:text-white flex items-center gap-1 sm:gap-1.5 shadow-xl transition-all cursor-pointer shrink-0"
                title="Change Map Tiles & Styling"
              >
                <span className="text-cyan-400">🗺️</span>
                <span className="font-semibold truncate max-w-[55px] sm:max-w-none">{MAP_STYLES[activeStyleKey]?.label || 'Map Style'}</span>
                <span className="text-[8px] sm:text-[9px] text-white/40">▼</span>
              </button>

            {isStyleMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-[#070718]/98 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-40 space-y-1">
                {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => {
                  const opt = MAP_STYLES[key];
                  const isActive = activeStyleKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setActiveStyleKey(key);
                        setIsStyleMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400' : 'bg-transparent'}`} />
                        <span className="truncate">{opt.label}</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-white/40">
                        {opt.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

          {/* Live Weather Summary Badge (Shown only when exploring a specific city) */}
          {activeWeatherSummary && cityName !== 'World Map' ? (
            <div
              data-testid="city-weather-summary-card"
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#050512]/92 backdrop-blur-xl border border-cyan-500/30 shadow-2xl flex flex-col gap-1 max-w-[130px] min-[400px]:max-w-[160px] sm:max-w-[230px]"
            >
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div
                  className="flex items-center gap-1 sm:gap-1.5 cursor-pointer group"
                  onClick={onOpenWeather}
                  title="Click to view detailed weather telemetry"
                >
                  <span className="text-lg sm:text-xl shrink-0">
                    {activeWeatherSummary.weatherEmoji || '🌤️'}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white font-mono leading-tight group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                      <span>
                        {typeof activeWeatherSummary.temperature === 'number'
                          ? `${Math.round(activeWeatherSummary.temperature)}°${activeWeatherSummary.units === 'fahrenheit' ? 'F' : 'C'}`
                          : '—'}
                      </span>
                      {liveTime && (
                        <span
                          className="text-[10px] sm:text-[11px] font-bold text-cyan-300/90 font-mono flex items-center gap-1 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-500/25 shrink-0"
                          title={`Local Solar Time: ${liveTime.timeSeconds12} (${liveTime.tzFullLabel})`}
                        >
                          <span>{liveTime.solar.icon}</span>
                          <span>{liveTime.time12}</span>
                        </span>
                      )}
                      {!weatherSummary && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" title="Refreshing telemetry..." />
                      )}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/50 truncate max-w-[65px] min-[400px]:max-w-[90px] sm:max-w-[110px]">
                      {activeWeatherSummary.weatherDescription || 'Current'}
                    </div>
                  </div>
                </div>

                {onOpenWeather && (
                  <button
                    type="button"
                    data-testid="city-map-telemetry-btn"
                    onClick={onOpenWeather}
                    className="p-1 sm:px-2 sm:py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 shadow-sm"
                    title="Open full meteorological telemetry and forecasts"
                  >
                    <span>📊</span>
                    <span className="hidden min-[440px]:inline">Telemetry</span>
                  </button>
                )}
              </div>

              {/* Extra telemetry pill - hidden on small mobile to avoid crowding */}
              <div
                className="hidden sm:flex items-center gap-2 pt-1 border-t border-white/5 text-[9px] font-mono text-white/40 cursor-pointer hover:text-white/70 transition-colors"
                onClick={onOpenWeather}
              >
                {liveTime && (
                  <span className="text-cyan-400/80 font-semibold">{liveTime.tzCode}</span>
                )}
                {typeof activeWeatherSummary.windSpeed === 'number' && (
                  <span>💨 {Math.round(activeWeatherSummary.windSpeed)} km/h</span>
                )}
                {typeof activeWeatherSummary.relativeHumidity === 'number' && (
                  <span>💧 {activeWeatherSummary.relativeHumidity}%</span>
                )}
              </div>
            </div>
          ) : (
            onOpenWeather && (
              <button
                type="button"
                data-testid="city-map-telemetry-btn"
                onClick={onOpenWeather}
                className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/35 backdrop-blur-xl border border-cyan-400/40 text-[10px] sm:text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1 sm:gap-1.5 shadow-xl transition-all cursor-pointer active:scale-95 shrink-0 max-w-full truncate"
                title="Open live meteorological telemetry"
              >
                <span>📊</span>
                <span className="hidden sm:inline">Weather Telemetry</span>
                <span className="sm:hidden">Telemetry</span>
              </button>
            )
          )}
        </div>
      </div>



      {/* ── Scoped Disaster Animations & MapLibre Popup Styling ── */}
      <style>{`
        @keyframes cyclone-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cyclone-cloud-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes seismic-shockwave {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes marker-glow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .disaster-map-popup .maplibregl-popup-content,
        .city-map-popup .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 14px !important;
          border: none !important;
        }
        .disaster-map-popup .maplibregl-popup-tip,
        .city-map-popup .maplibregl-popup-tip {
          border-top-color: rgba(5, 5, 18, 0.95) !important;
          border-bottom-color: rgba(5, 5, 18, 0.95) !important;
        }
        .disaster-map-popup .maplibregl-popup-close-button,
        .city-map-popup .maplibregl-popup-close-button {
          color: #67e8f9 !important;
          padding: 3px 7px !important;
          font-size: 15px !important;
          right: 6px !important;
          top: 6px !important;
          outline: none !important;
          background: rgba(255, 255, 255, 0.12) !important;
          border-radius: 6px !important;
          line-height: 1 !important;
          cursor: pointer !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          transition: background 0.15s !important;
        }
        .disaster-map-popup .maplibregl-popup-close-button:hover,
        .city-map-popup .maplibregl-popup-close-button:hover {
          background: rgba(6, 182, 212, 0.3) !important;
          color: #fff !important;
        }
      `}</style>

      {/* ── Bottom Telemetry & Attribution Bar ───────── */}
      <div className="absolute bottom-1.5 sm:bottom-2 left-2 right-2 sm:left-4 sm:right-4 z-20 pointer-events-none flex items-end justify-between text-[10px] font-mono text-white/40 pb-[env(safe-area-inset-bottom)]">
        {/* Telemetry coords */}
        <div className="bg-[#050512]/80 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-white/5 pointer-events-auto flex items-center gap-1.5">
          <span>ZOOM: {currentZoom}</span>
          {currentZoom >= 11.8 && (
            <span className="text-[9px] text-cyan-300 font-bold bg-cyan-500/20 px-1 py-0.2 rounded border border-cyan-400/30">
              HD GROUND
            </span>
          )}
          <span className="hidden sm:inline">
            <span className="mx-1.5 text-white/20">|</span>
            <span>PITCH: {currentPitch}°</span>
            <span className="mx-1.5 text-white/20">|</span>
            <span>BEARING: {currentBearing}°</span>
          </span>
        </div>

        {/* Subtle Cartography Sources Link */}
        <Link
          href="/data-sources"
          title={MAP_STYLES[activeStyleKey]?.attribution || 'Cartographic Data Sources'}
          className="bg-[#050512]/80 hover:bg-[#050512] backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-white/5 hover:border-white/20 text-white/40 hover:text-white/80 pointer-events-auto transition-colors flex items-center gap-1 sm:gap-1.5"
        >
          <span className="text-[11px]">ℹ️</span>
          <span className="hidden sm:inline">Data Sources</span>
        </Link>
      </div>

      {/* ── Loading Spinner State ─────────────────────── */}
      {!isMapLoaded && !hasMapError && (
        <div className="absolute inset-0 bg-[#020208]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-cyan-400 font-mono text-xs tracking-wider">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mb-3" />
          <span>RENDERING {cityName.toUpperCase()} CITY MAP...</span>
          <span className="text-[10px] text-white/40 mt-1">
            Loading high-resolution roads, boundaries, and cartographic vectors...
          </span>
        </div>
      )}

      {/* ── Tile / Network Failure Error Fallback ─────── */}
      {hasMapError && (
        <div className="absolute inset-0 bg-[#020208]/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md p-6 rounded-3xl bg-[#070718] border border-red-500/30 shadow-2xl">
            <div className="text-4xl mb-3">🗺️⚠️</div>
            <h4 className="text-base font-bold text-white mb-1.5">
              City Tile Connection Issue
            </h4>
            <p className="text-xs text-white/60 mb-4 leading-relaxed">
              {errorMessage || 'Unable to retrieve vector or raster map tiles at this moment.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => initMap(activeStyleKey)}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                🔄 Retry Loading
              </button>
              {activeStyleKey !== 'esri-street' && (
                <button
                  type="button"
                  onClick={() => setActiveStyleKey('esri-street')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  ⚡ Switch to Esri Street
                </button>
              )}
              {activeStyleKey !== 'osm' && (
                <button
                  type="button"
                  onClick={() => setActiveStyleKey('osm')}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  🗺️ Switch to OpenStreetMap
                </button>
              )}
              <button
                type="button"
                onClick={onReturnToEarth}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-mono text-xs transition-colors cursor-pointer"
              >
                🌍 Return to Earth
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
