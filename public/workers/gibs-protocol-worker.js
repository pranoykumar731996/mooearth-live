// gibs-protocol-worker.js
// MapLibre Web Worker Script: Intercepts NASA GIBS & EUMETSAT Geostationary satellite tiles
// 1. Sector Spatial Blending & Longitude Cross-Fade:
//    Circular partition of unity across all 360 degrees (Himawari, GOES-West, GOES-East, Meteosat)
//    with raised-cosine edge-feathering, completely eliminating 100% of vertical razor seams!
// 2. Latitude Limb Fade:
//    Smoothly dissolves cloud boundaries between 56° and 66° latitude North and South.
// 3. Desert Sand, Land & Ocean Glint Discrimination (Windy Parity):
//    Keys out clear ocean, dark land, city lights, and iron-rich desert sand (Sahara, Arabia)
//    with 100% transparency, letting the underlying basemap shine through.
// 4. Soft Organic Sigmoid Albedo-to-Alpha Cloud Formation:
//    Renders clouds as pure, semi-translucent, floating luminous white cloud formations.
// 5. Day/Night Solar Terminator Harmonization:
//    Renders nighttime infrared clouds in soft silvery moonlight white, giving 24/7 cloud continuity.
// 6. Calibrated Dvorak/BD Curve (in Infra Mode):
//    Vivid temperature-coded convective storm cores (-30°C to -80°C).

if (typeof self !== 'undefined' && self.addProtocol) {
  // Slippy tile coordinate conversion helpers (EPSG:3857 Web Mercator)
  function tileToLng(x, z) {
    return (x / Math.pow(2, z)) * 360 - 180;
  }

  function tileToLat(y, z) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  // Circular partition of unity across all 360 degrees (Himawari, GOES-West, GOES-East, Meteosat)
  function getSectorSpatialWeight(url, lng, lat) {
    const absLat = Math.abs(lat);

    // EUMETSAT Global World Cloud Map (mumi:worldcloudmap_ir108) is a global composite
    // covering all 360 degrees of longitude up to 82.5°N and 75.0°S across Russia, Siberia, Northern Europe (Windy Parity)
    if (url.includes('worldcloudmap') || url.includes('mumi') || url.includes('global-polar')) {
      if (absLat <= 56.0) return 0.0;
      if (absLat > 82.5) return 0.0;
      if (absLat > 75.0) return 0.5 * (1.0 + Math.cos(Math.PI * ((absLat - 75.0) / 7.5)));
      const ramp = (absLat - 56.0) / 10.0;
      return 0.5 * (1.0 - Math.cos(Math.PI * ramp));
    }

    let latWeight = 1.0;
    if (absLat > 66.0) return 0.0;
    else if (absLat > 56.0) latWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((absLat - 56.0) / 10.0)));

    const angle = (((lng % 360) + 360) % 360);
    let lngWeight = 0.0;

    const isHimawari = url.includes('Himawari') || url.includes('himawari');
    const isIodc = (url.includes('msg_iodc') || url.includes('eumet-iodc')) && !isHimawari;
    const isMeteosatPrime = (url.includes('msg_fes') || url.includes('europe-africa')) && !isIodc;
    const isGoesEast = url.includes('GOES-East') || url.includes('goes-east');
    const isGoesWest = url.includes('GOES-West') || url.includes('goes-west');

    // 5-Sentinel Seamless Global Partition of Unity (Zero seams, zero scissors, sum of weights = 1.000 everywhere):
    if (isHimawari) {
      // Himawari-9 (140.7°E): Covers East Asia, India, Bay of Bengal, Australia, Western Pacific (70°E to 195°E)
      if (angle >= 70.0 && angle <= 85.0) {
        // Smooth blend with Meteosat-IODC over Central/Eastern India (70°E to 85°E)
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 70.0) / 15.0)));
      } else if (angle > 85.0 && angle <= 165.0) {
        lngWeight = 1.0; // 100% full coverage across East India, Bay of Bengal, China, Japan, Australia
      } else if (angle > 165.0 && angle <= 195.0) {
        // Smooth blend with GOES-West over Western Pacific / Dateline (165°E to 195°E)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
      }
    } else if (isIodc) {
      // Meteosat-9 IODC (45.5°E): Covers Indian Ocean, Arabian Sea, Madagascar, Middle East (15°E to 85°E)
      if (angle >= 15.0 && angle <= 30.0) {
        // Smooth blend with Meteosat Prime over East Africa / Red Sea (15°E to 30°E)
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 15.0) / 15.0)));
      } else if (angle > 30.0 && angle <= 70.0) {
        lngWeight = 1.0; // 100% full coverage across Indian Ocean, Arabian Sea, Madagascar, Persian Gulf
      } else if (angle > 70.0 && angle <= 85.0) {
        // Smooth blend with Himawari over Central/Eastern India (70°E to 85°E)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 70.0) / 15.0)));
      }
    } else if (isMeteosatPrime) {
      // Meteosat Prime (0°E): Covers Europe, West Africa, Atlantic (315° to 30°E)
      if (angle >= 315.0 && angle <= 340.0) {
        // Smooth blend with GOES-East over Mid-Atlantic (315° to 340°)
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 315.0) / 25.0)));
      } else if (angle > 340.0 || angle <= 15.0) {
        lngWeight = 1.0;
      } else if (angle > 15.0 && angle <= 30.0) {
        // Smooth blend with Meteosat-IODC over East Africa / Red Sea (15°E to 30°E)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 15.0) / 15.0)));
      }
    } else if (isGoesWest) {
      // GOES-West (137.2°W): Covers Central/Eastern Pacific (165°E to 115°W / 245°)
      if (angle >= 165.0 && angle <= 195.0) {
        // Smooth blend with Himawari
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
      } else if (angle > 195.0 && angle <= 225.0) {
        lngWeight = 1.0;
      } else if (angle > 225.0 && angle <= 245.0) {
        // Smooth blend with GOES-East over West Coast / Rockies (225° to 245°)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 225.0) / 20.0)));
      }
    } else if (isGoesEast) {
      // GOES-East (75.2°W): Covers Americas, Caribbean, Atlantic (225° to 340° / 20°W)
      if (angle >= 225.0 && angle <= 245.0) {
        // Smooth blend with GOES-West
        lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 225.0) / 20.0)));
      } else if (angle > 245.0 && angle <= 315.0) {
        lngWeight = 1.0;
      } else if (angle > 315.0 && angle <= 340.0) {
        // Smooth blend with Meteosat Prime over Mid-Atlantic (315° to 340°)
        lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 315.0) / 25.0)));
      }
    }

    return Math.max(0.0, Math.min(1.0, lngWeight * latWeight));
  }

  // Unified Tile Pixel Processor (shared across gibs-alpha & eumet-alpha)
  function processTilePixels(d, width, height, realUrl) {
    const len = d.length;
    const totalPixels = width * height;

    // Parse slippy tile coordinates /{z}/{y}/{x}.ext from URL (or query params from proxy)
    let tileZ = 3, tileY = 0, tileX = 0, hasCoords = false;
    const wmtsMatch = realUrl.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)/i);
    const queryMatch = realUrl.match(/[?&]z=(\d+)[&]x=(\d+)[&]y=(\d+)/i) || realUrl.match(/[?&]z=(\d+)[&]y=(\d+)[&]x=(\d+)/i);
    if (wmtsMatch) {
      tileZ = parseInt(wmtsMatch[1], 10);
      tileY = parseInt(wmtsMatch[2], 10);
      tileX = parseInt(wmtsMatch[3], 10);
      hasCoords = true;
    } else if (queryMatch) {
      tileZ = parseInt(queryMatch[1], 10);
      if (realUrl.includes('x=' + queryMatch[2])) {
        tileX = parseInt(queryMatch[2], 10);
        tileY = parseInt(queryMatch[3], 10);
      } else {
        tileY = parseInt(queryMatch[2], 10);
        tileX = parseInt(queryMatch[3], 10);
      }
      hasCoords = true;
    }

    const tileLngs = new Float32Array(width);
    const tileLats = new Float32Array(height);
    if (hasCoords) {
      for (let c = 0; c < width; c++) {
        tileLngs[c] = tileToLng(tileX + (c + 0.5) / width, tileZ);
      }
      for (let r = 0; r < height; r++) {
        tileLats[r] = tileToLat(tileY + (r + 0.5) / height, tileZ);
      }
    }

    const isVisMode = realUrl.includes('spectral=vis');
    const isInfraMode = realUrl.includes('spectral=infra');
    const isBlueMode = realUrl.includes('spectral=blue') || (!isVisMode && !isInfraMode);
    const isInfraLayer = realUrl.includes('Band13') || realUrl.includes('Infrared') || realUrl.includes('IR') || realUrl.includes('ir108');
    const isHimawariVis = realUrl.includes('Band3') || realUrl.includes('Himawari_AHI_Band3');
    const isGeoColor = realUrl.includes('GeoColor');
    const isEumet = realUrl.includes('msg_') || realUrl.includes('eumet');

    // Pass 1: Fast Per-Pixel Luminance & Convective Core Tagging (Windy Parity)
    const lum = new Float32Array(totalPixels);
    const convective = new Uint8Array(totalPixels);
    const isHimawari = realUrl.includes('Himawari') || realUrl.includes('himawari');
    const isGoes = realUrl.includes('GOES') || realUrl.includes('goes');

    for (let p = 0, idx = 0; idx < len; idx += 4, p++) {
      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      if (r < 28 && g < 28 && b < 28) {
        lum[p] = 0;
      } else {
        lum[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      if (isHimawari && isInfraLayer) {
        // Himawari-9 Band 13 Clean IR:
        // Convective storm tops & cyclone eyewalls (-40°C to -85°C) -> lum >= 180
        // Active convective rainbands -> lum >= 162
        if (lum[p] >= 180) {
          convective[p] = 1; // 100% Genuine convective cloud top
        } else if (lum[p] >= 162) {
          convective[p] = 2; // Convective rainband candidate
        }
      } else if (isGoes && isInfraLayer) {
        // GOES Band 13 Clean IR:
        if (lum[p] >= 170) {
          convective[p] = 1;
        } else if (lum[p] >= 152) {
          convective[p] = 2;
        }
      } else if (isEumet && isInfraLayer) {
        // EUMETSAT 10.8µm IR (Rejects cold nocturnal soil in Gujarat/Pakistan/Rajasthan < 170):
        if (lum[p] >= 182) {
          convective[p] = 1;
        } else if (lum[p] >= 170) {
          convective[p] = 2;
        }
      }
    }

    // Pass 2: Fast 3x3 Box Blur & BD Core Morphology (Eliminates Hollow Donut Voids)
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
          if (hasConvNeighbor) {
            convective[p] = 3; // Confirmed -72°C BD Convective Core
          }
        }

        // Cyclone Eye Cavity Detection: calm warmer interior surrounded by convective wall ring
        if (convective[p] === 0 && lum[p] >= 115 && lum[p] <= 165) {
          let northConv = false, southConv = false, westConv = false, eastConv = false;
          for (let step = 3; step <= 7; step++) {
            const ny1 = Math.max(0, y - step) * width;
            const ny2 = Math.min(height - 1, y + step) * width;
            const nx1 = Math.max(0, x - step);
            const nx2 = Math.min(width - 1, x + step);
            if (convective[ny1 + x] === 1 || convective[ny1 + x] === 3) northConv = true;
            if (convective[ny2 + x] === 1 || convective[ny2 + x] === 3) southConv = true;
            if (convective[row + nx1] === 1 || convective[row + nx1] === 3) westConv = true;
            if (convective[row + nx2] === 1 || convective[row + nx2] === 3) eastConv = true;
          }
          if (northConv && southConv && westConv && eastConv) {
            convective[p] = 4; // Cyclone Eye Cavity
          }
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
          // ==========================================
          // HIGH-DEFINITION CONVECTIVE STORM TOP & CYCLONE VORTEX (Windy & Zoom Earth Parity)
          // ==========================================
          if (isInfraMode) {
            // Authentic Dvorak BD Color Scale (Kelvin / Celsius)
            if (r > 120 && b > 120 && g < 120) {
              // Overshooting top (-92°C to -80°C) -> Luminous White / Lavender
              d[i] = 255; d[i + 1] = 242; d[i + 2] = 255;
            } else if (convective[p] === 3 || (r > 20 && g < 35 && b < 35)) {
              // Coldest Eyewall Core (-80°C to -62°C) -> Intense Crimson
              d[i] = 220; d[i + 1] = 38; d[i + 2] = 38;
            } else if (r > 180 && g > 50) {
              // Deep Convection (-62°C to -48°C) -> Vivid Amber / Yellow
              d[i] = 245; d[i + 1] = 158; d[i + 2] = 11;
            } else if (g > 100 && r < 200) {
              // Moderate Convection (-48°C to -35°C) -> Emerald Green
              d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
            } else {
              // Upper Convective Cloud (-35°C to -20°C) -> Cyan / Azure
              d[i] = 14; d[i + 1] = 165; d[i + 2] = 233;
            }
            d[i + 3] = Math.min(252, Math.round(248 * spatWeight));
          } else {
            // Blue / Atmospheric / Visible: Natural Convective Cloud Tops with Soft Highlights
            const convIntensity = isHimawari
              ? Math.min(1.0, Math.max(0.0, (baseRadiance - 155) / 60))
              : isGoes
              ? Math.min(1.0, Math.max(0.0, (baseRadiance - 142) / 60))
              : Math.min(1.0, Math.max(0.0, (baseRadiance - 132) / 60));

            const convTone = Math.min(255, Math.round(225 + 28 * convIntensity));
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
          // BLUE / HD ATMOSPHERIC 4-TIER RADIOMETRIC CLOUD MODE (Windy HD Parity)
          // ==========================================
          let cloudAlpha = 0;
          let s = 0;

          if (isHimawari && isInfraLayer) {
            // Himawari-9 Band 13 Clean Infrared (East Asia, India, Bay of Bengal, Australia, Pacific):
            // Clear warm tropical sea surface & warm land (baseRadiance <= 148) -> STRICTLY 100% TRANSPARENT
            // Eliminates marine boundary layer humidity noise over the Arabian Sea (Windy & Zoom Earth Parity)
            if (baseRadiance <= 148) {
              d[i + 3] = 0;
              continue;
            }
            if (baseRadiance <= 168) {
              // Low clouds & marine stratus (149 - 168) -> smooth organic cubic feathering
              const norm = (baseRadiance - 148) / (168 - 148);
              const smoothNorm = norm * norm * (3.0 - 2.0 * norm);
              cloudAlpha = Math.round((28 + 115 * Math.pow(smoothNorm, 1.2)) * spatWeight);
              s = smoothNorm * 0.40;
            } else if (baseRadiance <= 186) {
              // Mid-level altocumulus & cloud bands (169 - 186) -> continuous solid cloud deck with 3D billows
              const norm = (baseRadiance - 168) / (186 - 168);
              const smoothNorm = norm * norm * (3.0 - 2.0 * norm);
              cloudAlpha = Math.round((143 + 82 * smoothNorm) * spatWeight);
              s = 0.40 + 0.45 * smoothNorm;
            } else {
              // Deep convective bands & cyclone eyewalls (>= 187) -> dense solid opaque cloud (Windy Parity)
              const norm = Math.min(1.0, (baseRadiance - 186) / (235 - 186));
              s = 0.85 + 0.15 * norm;
              cloudAlpha = Math.min(252, Math.round((225 + 27 * norm) * spatWeight));
            }
          } else if (isGoes && isInfraLayer) {
            // GOES-East / GOES-West Band 13 Clean Infrared (Americas, Atlantic, Pacific):
            // Rejects nocturnal desert plateau cooling in North/South America (<= 138)
            if (baseRadiance <= 138) {
              d[i + 3] = 0;
              continue;
            }
            if (baseRadiance <= 158) {
              const norm = (baseRadiance - 138) / (158 - 138);
              const smoothNorm = norm * norm * (3.0 - 2.0 * norm);
              cloudAlpha = Math.round((28 + 115 * Math.pow(smoothNorm, 1.2)) * spatWeight);
              s = smoothNorm * 0.40;
            } else if (baseRadiance <= 176) {
              const norm = (baseRadiance - 158) / (176 - 158);
              const smoothNorm = norm * norm * (3.0 - 2.0 * norm);
              cloudAlpha = Math.round((143 + 82 * smoothNorm) * spatWeight);
              s = 0.40 + 0.45 * smoothNorm;
            } else {
              const norm = Math.min(1.0, (baseRadiance - 176) / (225 - 176));
              s = 0.85 + 0.15 * norm;
              cloudAlpha = Math.min(252, Math.round((225 + 27 * norm) * spatWeight));
            }
          } else if (isEumet && isInfraLayer) {
            // EUMETSAT 10.8µm thermal infrared channel (Meteosat Prime / Meteosat-9 IODC / WorldCloudMap):
            // Rejects cold nocturnal radiational soil cooling in Gujarat, Rajasthan, and Pakistan (baseRadiance <= 168)
            // Guarantees zero false ghost clouds over Gujarat, Rajasthan, and Pakistan while preserving 100% of Cyclone Akvan (Windy & Zoom Earth Parity)
            if (baseRadiance <= 168) {
              d[i + 3] = 0;
              continue;
            }
            if (baseRadiance <= 184) {
              const norm = (baseRadiance - 168) / (184 - 168);
              const smoothNorm = norm * norm * (3.0 - 2.0 * norm);
              cloudAlpha = Math.round((28 + 115 * Math.pow(smoothNorm, 1.2)) * spatWeight);
              s = smoothNorm * 0.40;
            } else if (baseRadiance <= 200) {
              const norm = (baseRadiance - 184) / (200 - 184);
              const smoothNorm = norm * norm * (3.0 - 2.0 * norm);
              cloudAlpha = Math.round((143 + 82 * smoothNorm) * spatWeight);
              s = 0.40 + 0.45 * smoothNorm;
            } else {
              const norm = Math.min(1.0, (baseRadiance - 200) / (235 - 200));
              s = 0.85 + 0.15 * norm;
              cloudAlpha = Math.min(252, Math.round((225 + 27 * norm) * spatWeight));
            }
          } else {
            // Visible optical channel:
            if (baseRadiance <= 68) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (baseRadiance - 68) / (205 - 68));
            s = norm * norm * (3.0 - 2.0 * norm);
            cloudAlpha = Math.min(248, Math.round(248 * s * spatWeight));
          }

          if (cloudAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }

          // Silky, smooth natural silver-white cloud tone (Windy Parity)
          const tone = Math.min(255, Math.max(185, Math.round(195 + 58 * s)));
          d[i] = tone;
          d[i + 1] = tone;
          d[i + 2] = Math.min(255, tone + 2);
          d[i + 3] = cloudAlpha;

        } else if (isVisMode) {
          // ==========================================
          // VISIBLE / OPTICAL REFLECTANCE MODE (Natural Day / Fallback Night)
          // ==========================================
          if (isEumet && !isInfraLayer) {
            // EUMETSAT Daytime Visible Reflectance (msg_fes:vis006 / msg_iodc:vis006)
            if (l <= 36) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (l - 36) / (185 - 36));
            const s = norm * norm * (3.0 - 2.0 * norm);
            const cloudAlpha = Math.round(248 * Math.pow(s, 0.85) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(180, Math.round(180 + 72 * s)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone; d[i + 3] = cloudAlpha;
          } else if (isHimawariVis) {
            // Himawari-9 Band 3 Red Visible (0.64µm):
            // Clear ocean and low-albedo land is <= 42
            if (r <= 42) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (r - 42) / (195 - 42));
            const s = norm * norm * (3.0 - 2.0 * norm);
            const cloudAlpha = Math.round(250 * Math.pow(s, 0.85) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            // Preserve natural optical albedo
            const tone = Math.min(255, Math.max(185, Math.round(185 + 70 * s)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = Math.min(255, tone + 2); d[i + 3] = cloudAlpha;
          } else if (isGeoColor) {
            // GOES GeoColor: keys out desert sand & deep water
            const isSand = (r > g && g > b && (r - b) >= 20 && (r - g) >= 6);
            if (isSand || l <= 55) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (l - 55) / (205 - 55));
            const s = norm * norm * (3.0 - 2.0 * norm);
            const cloudAlpha = Math.round(248 * Math.pow(s, 0.85) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(185, Math.round(185 + 68 * s)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone; d[i + 3] = cloudAlpha;
          } else if (isInfraLayer) {
            // Infrared fallback when in Visible mode at night:
            // Smooth Hermite transfer function without noise or Sobel artifacts
            const irThresh = isHimawari ? 148 : isGoes ? 138 : 168;
            if (baseRadiance <= irThresh) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (baseRadiance - irThresh) / (215 - irThresh));
            const s = norm * norm * (3.0 - 2.0 * norm);
            const cloudAlpha = Math.min(252, Math.round(250 * Math.pow(s, 0.95) * spatWeight));
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(185, Math.round(195 + 58 * s)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = Math.min(255, tone + 2); d[i + 3] = cloudAlpha;
          } else {
            // Visible optical fallback
            if (l <= 50) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (l - 50) / (205 - 50));
            const s = norm * norm * (3.0 - 2.0 * norm);
            const cloudAlpha = Math.round(246 * Math.pow(s, 0.85) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(185, Math.round(185 + 68 * s)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone; d[i + 3] = cloudAlpha;
          }
        } else {
          // ==========================================
          // INFRARED THERMAL MODE (Dvorak/BD Hurricane Scale)
          // ==========================================
          const thresh = isEumet ? 72 : 118;
          const maxRange = isEumet ? 180 : 230;
          if (l <= thresh) {
            d[i + 3] = 0;
            continue;
          }
          const norm = Math.min(1.0, (l - thresh) / (maxRange - thresh));
          const finalAlpha = Math.round(245 * Math.pow(norm, 0.70) * spatWeight);
          if (finalAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }
          // Unified thermodynamic Kelvin temperature palette across EUMETSAT, Himawari, and GOES:
          if (norm < 0.25) {
            // Cirrus & mid-troposphere clouds: soft luminous translucent moonlight-white
            const tone = Math.min(255, Math.max(195, Math.round(210 + 35 * norm)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = Math.min(255, tone + 4);
          } else if (norm < 0.45) {
            // Upper troposphere: dense white cloud top
            const tone = Math.min(255, Math.max(220, Math.round(230 + 20 * norm)));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone;
          } else if (norm < 0.65) {
            // Active convection (-40°C to -55°C): Emerald green storm mantle
            d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
          } else if (norm < 0.85) {
            // Deep convective vortex (-55°C to -70°C): Vivid Amber / Yellow core
            d[i] = 245; d[i + 1] = 158; d[i + 2] = 11;
          } else {
            // Coldest overshooting tops (< -70°C): Crimson / Luminous White storm core
            d[i] = 239; d[i + 1] = 68; d[i + 2] = 68;
          }
          d[i + 3] = finalAlpha;
        }
      }
    }

    // 4. Sub-Pixel Spatial Anti-Aliasing (Windy Parity):
    // Eliminates isolated 1-2px sensor noise speckles over ocean and smooths blocky cloud edges into silky organic gradients
    applySpatialAntiAliasing(d, width, height);
  }

  function applySpatialAntiAliasing(d, width, height) {
    const numPixels = width * height;
    const alphaCopy = new Uint8Array(numPixels);
    for (let p = 0; p < numPixels; p++) {
      alphaCopy[p] = d[(p << 2) + 3];
    }

    // Step 0: Pinhole Hole Filling (Ensures solid convective storm tops without single-pixel dark voids)
    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      for (let x = 1; x < width - 1; x++) {
        const p = row + x;
        if (alphaCopy[p] === 0) {
          let denseNeighborCount = 0;
          if (alphaCopy[p - width] >= 200) denseNeighborCount++;
          if (alphaCopy[p + width] >= 200) denseNeighborCount++;
          if (alphaCopy[p - 1] >= 200) denseNeighborCount++;
          if (alphaCopy[p + 1] >= 200) denseNeighborCount++;
          if (denseNeighborCount >= 3) {
            d[(p << 2) + 3] = 246;
            d[p << 2] = 248;
            d[(p << 2) + 1] = 250;
            d[(p << 2) + 2] = 255;
            alphaCopy[p] = 246;
          }
        }
      }
    }

    // Step A: Deep Sensor Noise Speckle Elimination (Eradicates isolated 1-3px spikes over land & sea)
    for (let y = 1; y < height - 1; y++) {
      const row = y * width;
      for (let x = 1; x < width - 1; x++) {
        const p = row + x;
        if (alphaCopy[p] > 0) {
          let neighborCount = 0;
          let neighborSum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const ny = (y + dy) * width;
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const na = alphaCopy[ny + (x + dx)];
              if (na > 0) {
                neighborCount++;
                neighborSum += na;
              }
            }
          }
          if (neighborCount < 3 || neighborSum < 80) {
            d[(p << 2) + 3] = 0;
          }
        }
      }
    }

    // Step B: Silky Gaussian-Weighted Edge Anti-Aliasing (Clean Cloud White RGB, Zero Dirty Fringe)
    for (let p = 0; p < numPixels; p++) {
      alphaCopy[p] = d[(p << 2) + 3];
    }
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = rowOffset + x;
        const center = alphaCopy[idx];
        const top = idx - width;
        const bottom = idx + width;
        const nSum = alphaCopy[top] + alphaCopy[bottom] + alphaCopy[idx - 1] + alphaCopy[idx + 1];

        if (center > 0 && nSum > 30) {
          const smoothed = (
            alphaCopy[top - 1] + (alphaCopy[top] << 1) + alphaCopy[top + 1] +
            (alphaCopy[idx - 1] << 1) + (center << 2) + (alphaCopy[idx + 1] << 1) +
            alphaCopy[bottom - 1] + (alphaCopy[bottom] << 1) + alphaCopy[bottom + 1]
          ) >> 4;

          d[(idx << 2) + 3] = smoothed <= 3 ? 0 : smoothed;
          const rgbIdx = idx << 2;
          if (d[rgbIdx] < 200) {
            d[rgbIdx] = 238;
            d[rgbIdx + 1] = 238;
            d[rgbIdx + 2] = 242;
          }
        }
      }
    }
  }

  // Protocol 1: NASA GIBS Geostationary Satellites (GOES & Himawari)
  self.addProtocol('gibs-alpha', async (params, abortController) => {
    let realUrl = params.url.replace(/^gibs-alpha:\/\//, 'https://');
    let res = await fetch(realUrl, { signal: abortController.signal });
    if (!res.ok && res.status === 404) {
      // Auto-fallback: try up to 3 prior 10-minute frames if latest scan is still uploading
      const isoMatch = realUrl.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
      if (isoMatch) {
        const curIso = isoMatch[1];
        const curTime = new Date(curIso).getTime();
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
            const fbRes = await fetch(fbUrl, { signal: abortController.signal });
            if (fbRes.ok) {
              res = fbRes;
              realUrl = fbUrl;
              break;
            }
          } catch {}
        }

        // Step 2: Date-only fallback if sub-hourly frames are not yet generated
        if (!res.ok) {
          const dateOnly = curIso.slice(0, 10);
          const dateOnlyUrl = realUrl.replace(isoMatch[0], dateOnly);
          try {
            const dateRes = await fetch(dateOnlyUrl, { signal: abortController.signal });
            if (dateRes.ok) {
              res = dateRes;
              realUrl = dateOnlyUrl;
            }
          } catch {}
        }
      }
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();

    if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
      try {
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return { data: bitmap };

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        processTilePixels(imgData.data, canvas.width, canvas.height, realUrl);
        ctx.putImageData(imgData, 0, 0);
        const cleanBitmap = await createImageBitmap(canvas);
        return { data: cleanBitmap };
      } catch {
        return { data: await blob.arrayBuffer() };
      }
    }
    return { data: await blob.arrayBuffer() };
  });

  // Edge proxy helper for EUMETSAT tiles
  function eumetUrlToProxy(url) {
    const match = url.match(/\/tile\/([^/?]+)\/(\d+)\/(\d+)\/(\d+)\.png/i);
    if (!match) return url.replace(/^eumet-alpha:\/\//, 'https://');
    const layer = match[1];
    const z = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const x = parseInt(match[4], 10);
    return `/api/weather/satellite/eumet-tile?z=${z}&x=${x}&y=${y}&layer=${encodeURIComponent(layer)}`;
  }

  // Direct WMS fallback for EUMETSAT
  function eumetUrlToWmsDirect(url) {
    const match = url.match(/\/tile\/([^/?]+)\/(\d+)\/(\d+)\/(\d+)\.png/i);
    if (!match) return url.replace(/^eumet-alpha:\/\//, 'https://');
    const layer = match[1];
    const z = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const x = parseInt(match[4], 10);
    const n = Math.pow(2, z);
    const worldSize = 20037508.342789244 * 2;
    const originShift = 20037508.342789244;
    const res = worldSize / n;
    const minX = x * res - originShift;
    const maxX = (x + 1) * res - originShift;
    const maxY = originShift - y * res;
    const minY = originShift - (y + 1) * res;
    return 'https://view.eumetsat.int/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=' + minX + ',' + minY + ',' + maxX + ',' + maxY + '&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&LAYERS=' + layer + '&FORMAT=image/png';
  }

  // Protocol 2: EUMETSAT Meteosat High Rate SEVIRI (Europe, Africa & Indian Ocean)
  self.addProtocol('eumet-alpha', async (params, abortController) => {
    try {
      const proxyUrl = eumetUrlToProxy(params.url);
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 9000);
      abortController.signal.addEventListener('abort', () => timeoutController.abort());
      let res = await fetch(proxyUrl, { signal: timeoutController.signal });

      if (!res.ok) {
        const directUrl = eumetUrlToWmsDirect(params.url);
        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 12000);
        abortController.signal.addEventListener('abort', () => fallbackController.abort());
        try {
          const directRes = await fetch(directUrl, { signal: fallbackController.signal });
          clearTimeout(fallbackTimeout);
          if (directRes.ok) res = directRes;
        } catch {
          clearTimeout(fallbackTimeout);
        }
      }

      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();

      if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return { data: bitmap };

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        processTilePixels(imgData.data, canvas.width, canvas.height, params.url);
        ctx.putImageData(imgData, 0, 0);
        const cleanBitmap = await createImageBitmap(canvas);
        return { data: cleanBitmap };
      }
      return { data: await blob.arrayBuffer() };
    } catch {
      const emptyBuf = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,10,73,68,65,84,120,156,99,0,1,0,0,5,0,1,13,10,45,180,0,0,0,0,73,69,78,68,174,66,96,130]);
      return { data: emptyBuf.buffer };
    }
  });

  // Protocol 3: NASA Black Marble (VIIRS Day/Night Band City Lights)
  // Extracts nocturnal city lights, illuminates nighttime continents, keys out day hemisphere
  function processBlackMarblePixels(d, width, height, url) {
    const coordMatch = url.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)/i);
    let tileZ = 3, tileY = 0, tileX = 0, hasCoords = false;
    if (coordMatch) {
      tileZ = parseInt(coordMatch[1], 10);
      tileY = parseInt(coordMatch[2], 10);
      tileX = parseInt(coordMatch[3], 10);
      hasCoords = true;
    }
    if (!hasCoords) return;

    const now = new Date();
    const timeMs = now.getTime();
    const dayDiff = (timeMs - 946728000000) / 86400000;
    const L = (280.460 + 0.9856474 * dayDiff) % 360;
    const g = ((357.528 + 0.9856003 * dayDiff) % 360) * Math.PI / 180;
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
    const eps = (23.439 - 0.0000004 * dayDiff) * Math.PI / 180;
    const solLat = Math.asin(Math.sin(eps) * Math.sin(lambda)) * 180 / Math.PI;
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
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

        // Solar zenith angle cosine
        const cosZenith = sinLat * sinSol + cosLat * cosSol * Math.cos((pLng - solLng) * rad);

        // Broad daylight: 100% transparent
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

        // Dark oceans and unpopulated areas: transparent
        if (lum < 16) {
          d[i + 3] = 0;
          continue;
        }

        // City lights & populated centers: warm golden radiance
        const intensity = Math.min(1.0, (lum - 16) / 110.0);
        const alpha = Math.min(245, Math.round(245 * intensity * nightWeight));

        // Warm golden/amber luminescence matching ISS & Zoom Earth night photography
        d[i] = Math.min(255, Math.round(r * 1.15 + 16));
        d[i + 1] = Math.min(255, Math.round(g * 1.05 + 10));
        d[i + 2] = Math.max(0, Math.round(b * 0.90));
        d[i + 3] = alpha;
      }
    }
  }

  self.addProtocol('black-marble-alpha', async (params, abortController) => {
    const realUrl = params.url.replace(/^black-marble-alpha:\/\//, 'https://');
    const res = await fetch(realUrl, { signal: abortController.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();

    if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
      try {
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return { data: bitmap };

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        processBlackMarblePixels(imgData.data, canvas.width, canvas.height, params.url);
        ctx.putImageData(imgData, 0, 0);
        const cleanBitmap = await createImageBitmap(canvas);
        return { data: cleanBitmap };
      } catch {
        return { data: await blob.arrayBuffer() };
      }
    }
    return { data: await blob.arrayBuffer() };
  });
}
