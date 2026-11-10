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

  // Circular partition of unity across all 360 degrees (zero deviation globally):
  function getSectorSpatialWeight(url, lng, lat) {
    const absLat = Math.abs(lat);
    let latWeight = 1.0;
    if (absLat > 66.0) return 0.0;
    else if (absLat > 56.0) latWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((absLat - 56.0) / 10.0)));

    const angle = (((lng % 360) + 360) % 360);
    let lngWeight = 0.0;

    const hasIodc = !url.includes('has_iodc=0');
    const isIodc = url.includes('msg_iodc') || url.includes('eumet-iodc');
    const isHimawari = url.includes('Himawari') || url.includes('himawari');
    const isEumet = (url.includes('msg_') || url.includes('eumet')) && !isIodc;
    const isGoesEast = url.includes('GOES-East') || url.includes('goes-east');
    const isGoesWest = url.includes('GOES-West') || url.includes('goes-west');

    if (hasIodc) {
      // Continuous 5-Satellite Partition of Unity with EUMETSAT IODC (45.5°E)
      if (isIodc) {
        if (angle >= 25.0 && angle <= 45.0) {
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 25.0) / 20.0)));
        } else if (angle > 45.0 && angle <= 75.0) {
          lngWeight = 1.0;
        } else if (angle > 75.0 && angle <= 95.0) {
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 75.0) / 20.0)));
        }
      } else if (isHimawari) {
        if (angle >= 75.0 && angle <= 95.0) {
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 75.0) / 20.0)));
        } else if (angle > 95.0 && angle <= 165.0) {
          lngWeight = 1.0;
        } else if (angle > 165.0 && angle <= 195.0) {
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
        }
      } else if (isGoesWest) {
        if (angle >= 165.0 && angle <= 195.0) {
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
        } else if (angle > 195.0 && angle <= 225.0) {
          lngWeight = 1.0;
        } else if (angle > 225.0 && angle <= 265.0) {
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
        }
      } else if (isGoesEast) {
        if (angle >= 225.0 && angle <= 265.0) {
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
        } else if (angle > 265.0 && angle <= 320.0) {
          lngWeight = 1.0;
        } else if (angle > 320.0 && angle <= 345.0) {
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
        }
      } else if (isEumet) {
        if (angle >= 320.0 && angle <= 345.0) {
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
        } else if (angle > 345.0 || angle <= 25.0) {
          lngWeight = 1.0;
        } else if (angle > 25.0 && angle <= 45.0) {
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 25.0) / 20.0)));
        }
      }
    } else {
      // Standard 4-Satellite Baseline Partition of Unity (Production Default)
      if (isHimawari) {
        if (angle >= 45.0 && angle <= 65.0) {
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 45.0) / 20.0)));
        } else if (angle > 65.0 && angle <= 165.0) {
          lngWeight = 1.0;
        } else if (angle > 165.0 && angle <= 195.0) {
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
        }
      } else if (isGoesWest) {
        if (angle >= 165.0 && angle <= 195.0) {
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 165.0) / 30.0)));
        } else if (angle > 195.0 && angle <= 225.0) {
          lngWeight = 1.0;
        } else if (angle > 225.0 && angle <= 265.0) {
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
        }
      } else if (isGoesEast) {
        if (angle >= 225.0 && angle <= 265.0) {
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 225.0) / 40.0)));
        } else if (angle > 265.0 && angle <= 320.0) {
          lngWeight = 1.0;
        } else if (angle > 320.0 && angle <= 345.0) {
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
        }
      } else if (isEumet) {
        if (angle >= 320.0 && angle <= 345.0) {
          lngWeight = 0.5 * (1.0 - Math.cos(Math.PI * ((angle - 320.0) / 25.0)));
        } else if (angle > 345.0 || angle <= 45.0) {
          lngWeight = 1.0;
        } else if (angle > 45.0 && angle <= 65.0) {
          lngWeight = 0.5 * (1.0 + Math.cos(Math.PI * ((angle - 45.0) / 20.0)));
        }
      }
    }

    return Math.max(0.0, Math.min(1.0, lngWeight * latWeight));
  }

  // Unified Tile Pixel Processor (shared across gibs-alpha & eumet-alpha)
  function processTilePixels(d, width, height, realUrl) {
    const len = d.length;
    const totalPixels = width * height;

    // Parse slippy tile coordinates /{z}/{y}/{x}.ext from URL
    const coordMatch = realUrl.match(/\/(\d+)\/(\d+)\/(\d+)\.(png|jpg|jpeg)/i);
    let tileZ = 3, tileY = 0, tileX = 0, hasCoords = false;
    if (coordMatch) {
      tileZ = parseInt(coordMatch[1], 10);
      tileY = parseInt(coordMatch[2], 10);
      tileX = parseInt(coordMatch[3], 10);
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
    const isGibsBand13 = isInfraLayer && !isEumet;

    for (let p = 0, idx = 0; idx < len; idx += 4, p++) {
      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      if (r < 28 && g < 28 && b < 28) {
        lum[p] = 0;
      } else {
        lum[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      if (isGibsBand13) {
        const chroma = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        if (chroma > 18) {
          if (b > 50 || g > 30 || r > 30) {
            convective[p] = 1; // 100% Genuine convective cloud top (-20°C to -92°C)
          }
        } else if (r <= 54 && g <= 54 && b <= 54) {
          convective[p] = 2; // -72°C BD core candidate
        }
      } else if (isEumet && isInfraLayer) {
        if (lum[p] >= 185) {
          convective[p] = 1; // Genuine coldest convective cloud tops in EUMETSAT SEVIRI IR
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
      }
    }

    // Pass 3: Windy-Parity Directional Emboss Shading & Continuous Cloud Rendering
    for (let y = 0; y < height; y++) {
      const row = y * width;
      const prevRow = (y > 0 ? y - 1 : y) * width;
      const nextRow = (y < height - 1 ? y + 1 : y) * width;
      for (let x = 0; x < width; x++) {
        const p = row + x;
        const i = p * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const isConv = convective[p] === 1 || convective[p] === 3;

        // Off-disk deep black space void (convective cores are protected)
        if (lum[p] < 28 && !isConv) {
          d[i + 3] = 0;
          continue;
        }

        const spatWeight = hasCoords ? getSectorSpatialWeight(realUrl, tileLngs[x], tileLats[y]) : 1.0;
        if (spatWeight <= 0.001) {
          d[i + 3] = 0;
          continue;
        }

        const prevCol = x > 0 ? x - 1 : x;
        const nextCol = x < width - 1 ? x + 1 : x;
        const l = lum[p];
        const bl = blur[p];

        // Windy Unsharp Mask: sharp = l + 0.35 * (l - blur)
        const sharp = Math.min(255, Math.max(0, l + 0.35 * (l - bl)));

        // 3D Directional Emboss Normal (upper-left sunlight illumination)
        const dx = (lum[row + nextCol] - lum[row + prevCol]) * 0.5;
        const dy = (lum[nextRow + x] - lum[prevRow + x]) * 0.5;
        const emboss = Math.max(-0.45, Math.min(0.45, (-dx + 1.25 * dy) / 48.0));

        if (isConv) {
          // ==========================================
          // SOLID DEEP CONVECTIVE STORM TOP (Zero Donut Holes!)
          // ==========================================
          const convAlpha = Math.min(250, Math.round(250 * spatWeight));
          if (isInfraMode) {
            // Thermodynamic Color Scale (Kelvin / Celsius)
            if (r > 120 && b > 120 && g < 120) {
              // Overshooting top (-92°C to -80°C) -> Luminous White / Pink
              d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
            } else if (convective[p] === 3 || (r > 20 && g < 35 && b < 35)) {
              // Coldest BD Core (-80°C to -60°C) -> Intense Crimson
              d[i] = 239; d[i + 1] = 68; d[i + 2] = 68;
            } else if (r > 180 && g > 50) {
              // Deep Convection (-58°C to -44°C) -> Amber / Yellow
              d[i] = 245; d[i + 1] = 158; d[i + 2] = 11;
            } else if (g > 100 && r < 200) {
              // Moderate Convection (-44°C to -30°C) -> Emerald Green
              d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
            } else {
              // Upper Cloud (-30°C to -20°C) -> Sky Blue
              d[i] = 14; d[i + 1] = 165; d[i + 2] = 233;
            }
            d[i + 3] = convAlpha;
          } else {
            // Blue / Atmospheric / Visible: Solid dense white with crystalline sheen
            const tone = Math.min(255, Math.max(220, Math.round(248 * (0.94 + 0.14 * emboss))));
            d[i] = Math.max(220, tone - 6);
            d[i + 1] = tone;
            d[i + 2] = 255;
            d[i + 3] = convAlpha;
          }
          continue;
        }

        if (isBlueMode) {
          // ==========================================
          // BLUE / HD ATMOSPHERIC SIGMOID CLOUD MODE (Windy HD Parity)
          // ==========================================
          let cloudAlpha = 0;
          let s = 0;

          if (isEumet && isInfraLayer) {
            // EUMETSAT linear infrared (38 threshold eliminates warm ground & ocean, preserves all clouds)
            if (sharp <= 38) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharp - 38) / (205 - 38));
            s = norm * norm * (3.0 - 2.0 * norm);
            cloudAlpha = Math.min(246, Math.round(246 * s * spatWeight));
          } else if (isGibsBand13) {
            // NASA GIBS Band 13 grayscale clouds (-5°C threshold eliminates Tibet/India ground)
            if (sharp <= 152) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharp - 152) / (235 - 152));
            s = norm * norm * (3.0 - 2.0 * norm);
            cloudAlpha = Math.min(246, Math.round(246 * s * spatWeight));
          } else {
            // Visible optical channel (82 threshold eliminates ocean & land)
            if (sharp <= 82) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharp - 82) / (210 - 82));
            s = norm * norm * (3.0 - 2.0 * norm);
            cloudAlpha = Math.min(246, Math.round(246 * s * spatWeight));
          }

          if (cloudAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }

          // 3D Directional Shading & Tone
          const baseTone = 236 + 18 * s;
          const tone = Math.min(255, Math.max(200, Math.round(baseTone * (0.92 + 0.18 * emboss))));

          d[i] = tone;
          d[i + 1] = tone;
          d[i + 2] = Math.min(255, tone + 2);
          d[i + 3] = cloudAlpha;

        } else if (isVisMode) {
          // ==========================================
          // VISIBLE / OPTICAL REFLECTANCE MODE
          // ==========================================
          if (isEumet && !isInfraLayer) {
            // EUMETSAT IODC Daytime Visible Reflectance (msg_iodc:vis006)
            if (sharp <= 80) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharp - 80) / (205 - 80));
            const s = norm * norm * (3.0 - 2.0 * norm);
            const cloudAlpha = Math.round(246 * Math.pow(norm, 0.72) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(200, Math.round((236 + 18 * s) * (0.91 + 0.22 * emboss))));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone; d[i + 3] = cloudAlpha;
          } else if (isHimawariVis) {
            const sharpVis = Math.min(255, Math.max(0, r + 0.65 * (r - bl)));
            if (sharpVis <= 86) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharpVis - 86) / (195 - 86));
            const s = norm * norm * (3.0 - 2.0 * norm);
            const cloudAlpha = Math.round(246 * Math.pow(norm, 0.75) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(198, Math.round((238 + 16 * s) * (0.91 + 0.22 * emboss))));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone; d[i + 3] = cloudAlpha;
          } else if (isGeoColor) {
            const isSand = (r > g && g > b && (r - b) >= 20 && (r - g) >= 6);
            if (isSand || sharp <= 88) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharp - 88) / (205 - 88));
            const cloudAlpha = Math.round(246 * Math.pow(norm, 0.75) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(200, Math.round((236 + 18 * norm) * (0.91 + 0.22 * emboss))));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone; d[i + 3] = cloudAlpha;
          } else {
            // Nighttime infrared fallback
            const thresh = isEumet ? 38 : 152;
            const maxRange = isEumet ? 205 : 235;
            if (sharp <= thresh) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharp - thresh) / (maxRange - thresh));
            const s = norm * norm * (3.0 - 2.0 * norm);
            const cloudAlpha = Math.min(246, Math.round(246 * s * spatWeight));
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(200, Math.round((236 + 18 * s) * (0.91 + 0.22 * emboss))));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = tone; d[i + 3] = cloudAlpha;
          }
        } else {
          // ==========================================
          // INFRARED THERMAL MODE (Dvorak/BD Hurricane Scale)
          // ==========================================
          const thresh = isEumet ? 38 : 152;
          const maxRange = isEumet ? 205 : 235;
          if (sharp <= thresh) {
            d[i + 3] = 0;
            continue;
          }
          const norm = Math.min(1.0, (sharp - thresh) / (maxRange - thresh));
          const finalAlpha = Math.round(245 * Math.pow(norm, 0.65) * spatWeight);
          if (finalAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }
          // Unified thermodynamic Kelvin temperature palette across EUMETSAT, Himawari, and GOES:
          if (norm < 0.25) {
            // Cirrus & mid-troposphere clouds: soft luminous translucent moonlight-white
            const tone = Math.min(255, Math.max(200, Math.round((215 + 30 * norm) * (0.92 + 0.18 * emboss))));
            d[i] = tone; d[i + 1] = tone; d[i + 2] = Math.min(255, tone + 4);
          } else if (norm < 0.45) {
            // Upper troposphere: dense white cloud top
            const tone = Math.min(255, Math.max(225, Math.round((235 + 18 * norm) * (0.92 + 0.18 * emboss))));
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

  // Converts Slippy tile request URL to standard EUMETView OGC WMS EPSG:3857 BBOX query
  function eumetUrlToWms(url) {
    const match = url.match(/\/tile\/([^/?]+)\/(\d+)\/(\d+)\/(\d+)\.png/i);
    if (!match) return url.replace(/^eumet-alpha:\/\//, 'https://');
    let layer = match[1];
    // Optimize European/African infrared cloud cache: use fast pre-rendered worldcloudmap_ir108 (sub-second)
    // rather than on-the-fly msg_fes:ir108 which times out after 3.5s
    if (layer === 'msg_fes:ir108') {
      layer = 'mumi:worldcloudmap_ir108';
    }
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

  // Protocol 2: EUMETSAT Meteosat High Rate SEVIRI (Europe & Africa)
  self.addProtocol('eumet-alpha', async (params, abortController) => {
    try {
      const realUrl = eumetUrlToWms(params.url);
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 6000);
      abortController.signal.addEventListener('abort', () => timeoutController.abort());
      const res = await fetch(realUrl, { signal: timeoutController.signal });
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
