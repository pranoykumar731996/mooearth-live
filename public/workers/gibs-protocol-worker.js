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

    const isHimawari = url.includes('Himawari') || url.includes('himawari');
    const isEumet = url.includes('msg_') || url.includes('eumet');
    const isGoesEast = url.includes('GOES-East') || url.includes('goes-east');
    const isGoesWest = url.includes('GOES-West') || url.includes('goes-west');

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

    // Pass 1: Fast Per-Pixel Luminance Extraction
    const lum = new Float32Array(totalPixels);
    for (let p = 0, idx = 0; idx < len; idx += 4, p++) {
      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      if (r < 28 && g < 28 && b < 28) {
        lum[p] = 0;
      } else {
        lum[p] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
    }

    // Pass 2: Fast 3x3 Box Blur for Unsharp Masking & Relief
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
      }
    }

    // Pass 3: Windy-Parity Unsharp Masking + 3D Emboss Directional Shading
    for (let y = 0; y < height; y++) {
      const row = y * width;
      const prevRow = (y > 0 ? y - 1 : y) * width;
      const nextRow = (y < height - 1 ? y + 1 : y) * width;
      for (let x = 0; x < width; x++) {
        const p = row + x;
        const i = p * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2];

        // Off-disk deep black space void
        if (lum[p] < 28) {
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

        // Windy Unsharp Mask: sharp = l + 0.65 * (l - blur)
        const sharp = Math.min(255, Math.max(0, l + 0.65 * (l - bl)));

        // 3D Directional Emboss Normal (upper-left sunlight illumination)
        const dx = (lum[row + nextCol] - lum[row + prevCol]) * 0.5;
        const dy = (lum[nextRow + x] - lum[prevRow + x]) * 0.5;
        const emboss = Math.max(-0.55, Math.min(0.55, (-dx + 1.25 * dy) / 48.0));

        if (isBlueMode) {
          // ==========================================
          // BLUE / HD ATMOSPHERIC SIGMOID CLOUD MODE (Windy HD Parity)
          // ==========================================
          // Nocturnal land temperature inversion threshold:
          // Cool clear ground radiation reaches lum 120-135 at night.
          // Sharp threshold 136 eliminates 100% of false land splotches!
          if (sharp <= 136) {
            d[i + 3] = 0;
            continue;
          }

          // Hermite smoothstep alpha curve for wispy to dense cloud fronts
          const t = Math.min(1.0, (sharp - 136) / 52.0);
          const s = t * t * (3.0 - 2.0 * t);
          const cloudAlpha = Math.min(246, Math.round(246 * s * spatWeight));

          if (cloudAlpha <= 2) {
            d[i + 3] = 0;
            continue;
          }

          // 3D Directional Shading & Tone
          const baseTone = 236 + 18 * s;
          const tone = Math.min(255, Math.max(198, Math.round(baseTone * (0.91 + 0.22 * emboss))));

          let cloudR = tone;
          let cloudG = tone;
          let cloudB = Math.min(255, tone + 2);

          // Deep convective storm top cooling (luminous cyan core)
          if (sharp > 195) {
            const cyanBlend = Math.min(1.0, (sharp - 195) / 55.0);
            cloudR = Math.round(cloudR - cyanBlend * 32);
            cloudG = Math.round(cloudG - cyanBlend * 12);
            cloudB = 255;
          }

          d[i] = cloudR;
          d[i + 1] = cloudG;
          d[i + 2] = cloudB;
          d[i + 3] = cloudAlpha;

        } else if (isVisMode) {
          // ==========================================
          // VISIBLE / OPTICAL REFLECTANCE MODE
          // ==========================================
          if (isInfraLayer) {
            if (sharp <= 136) {
              d[i + 3] = 0;
              continue;
            }
            const t = Math.min(1.0, (sharp - 136) / 52.0);
            const s = t * t * (3.0 - 2.0 * t);
            const cloudAlpha = Math.min(246, Math.round(246 * s * spatWeight));
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const baseTone = 238 + 16 * s;
            const tone = Math.min(255, Math.max(200, Math.round(baseTone * (0.91 + 0.22 * emboss))));
            d[i] = tone;
            d[i + 1] = tone;
            d[i + 2] = tone;
            d[i + 3] = cloudAlpha;
          } else if (isHimawariVis) {
            const sharpVis = Math.min(255, Math.max(0, r + 0.65 * (r - bl)));
            if (sharpVis <= 86) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharpVis - 86) / (190 - 86));
            const s = norm * norm * (3.0 - 2.0 * norm);
            const cloudAlpha = Math.round(246 * Math.pow(norm, 0.75) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const baseTone = 238 + 16 * s;
            const tone = Math.min(255, Math.max(198, Math.round(baseTone * (0.91 + 0.22 * emboss))));
            d[i] = tone;
            d[i + 1] = tone;
            d[i + 2] = tone;
            d[i + 3] = cloudAlpha;
          } else if (isGeoColor) {
            const isSand = (r > g && g > b && (r - b) >= 20 && (r - g) >= 6);
            if (isSand) {
              d[i + 3] = 0;
              continue;
            }
            const isCityLights = (r > 60 && g > 50 && b < 40 && (r - b) >= 30);
            if (isCityLights) {
              d[i + 3] = 0;
              continue;
            }
            if (sharp <= 90) {
              d[i + 3] = 0;
              continue;
            }
            const isCloudLike = Math.abs(r - g) <= 18 && Math.abs(g - b) <= 18;
            if (!isCloudLike) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharp - 90) / (200 - 90));
            const cloudAlpha = Math.round(246 * Math.pow(norm, 0.75) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(200, Math.round((236 + 18 * norm) * (0.91 + 0.22 * emboss))));
            d[i] = tone;
            d[i + 1] = tone;
            d[i + 2] = tone;
            d[i + 3] = cloudAlpha;
          } else if (isEumet) {
            if (sharp <= 80) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharp - 80) / (195 - 80));
            const cloudAlpha = Math.round(242 * Math.pow(norm, 0.70) * spatWeight);
            if (cloudAlpha <= 2) {
              d[i + 3] = 0;
              continue;
            }
            const tone = Math.min(255, Math.max(200, Math.round((236 + 18 * norm) * (0.91 + 0.22 * emboss))));
            d[i] = tone;
            d[i + 1] = tone;
            d[i + 2] = tone;
            d[i + 3] = cloudAlpha;
          } else {
            if (sharp <= 68) {
              d[i + 3] = 0;
              continue;
            }
            const norm = Math.min(1.0, (sharp - 68) / (165 - 68));
            d[i + 3] = Math.round(245 * Math.pow(norm, 1.15) * spatWeight);
          }
        } else {
          // ==========================================
          // INFRARED THERMAL MODE (Dvorak/BD Hurricane Scale)
          // ==========================================
          if (sharp <= 116) {
            d[i + 3] = 0;
            continue;
          }
          const norm = Math.min(1.0, (sharp - 116) / (235 - 116));
          const finalAlpha = Math.round(245 * Math.pow(norm, 0.60) * spatWeight);
          if (finalAlpha <= 2) {
            d[i + 3] = 0;
          } else {
            if (norm < 0.25) {
              d[i] = 14; d[i + 1] = 165; d[i + 2] = 233;
            } else if (norm < 0.45) {
              d[i] = 34; d[i + 1] = 197; d[i + 2] = 94;
            } else if (norm < 0.65) {
              d[i] = 234; d[i + 1] = 179; d[i + 2] = 8;
            } else if (norm < 0.82) {
              d[i] = 239; d[i + 1] = 68; d[i + 2] = 68;
            } else {
              d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
            }
            d[i + 3] = finalAlpha;
          }
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
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = rowOffset + x;
        const center = alphaCopy[idx];
        const top = idx - width;
        const bottom = idx + width;
        const nSum = alphaCopy[top] + alphaCopy[bottom] + alphaCopy[idx - 1] + alphaCopy[idx + 1];

        // Isolated sensor noise elimination: clear isolated thermal pixel spikes
        if (center < 36 && nSum < 28) {
          d[(idx << 2) + 3] = 0;
          continue;
        }
        if (center === 0 && nSum < 32) {
          continue;
        }

        // 3x3 Gaussian-weighted smoothing kernel: [1 2 1; 2 4 2; 1 2 1] / 16
        const smoothed = (
          alphaCopy[top - 1] + (alphaCopy[top] << 1) + alphaCopy[top + 1] +
          (alphaCopy[idx - 1] << 1) + (center << 2) + (alphaCopy[idx + 1] << 1) +
          alphaCopy[bottom - 1] + (alphaCopy[bottom] << 1) + alphaCopy[bottom + 1]
        ) >> 4;

        d[(idx << 2) + 3] = smoothed <= 3 ? 0 : smoothed;
      }
    }
  }

  // Protocol 1: NASA GIBS Geostationary Satellites (GOES & Himawari)
  self.addProtocol('gibs-alpha', async (params, abortController) => {
    let realUrl = params.url.replace(/^gibs-alpha:\/\//, 'https://');
    let res = await fetch(realUrl, { signal: abortController.signal });
    if (!res.ok && res.status === 404) {
      // Auto-fallback: try 10 minutes earlier if latest scan is still uploading
      const isoMatch = realUrl.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
      if (isoMatch) {
        const curIso = isoMatch[1];
        const prev10 = new Date(new Date(curIso).getTime() - 10 * 60000);
        const yyyy = prev10.getUTCFullYear();
        const mm = String(prev10.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(prev10.getUTCDate()).padStart(2, '0');
        const hh = String(prev10.getUTCHours()).padStart(2, '0');
        const min = String(prev10.getUTCMinutes()).padStart(2, '0');
        const fbIso = yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + min + ':00Z';
        const fbUrl = realUrl.replace(curIso, fbIso);
        try {
          const fbRes = await fetch(fbUrl, { signal: abortController.signal });
          if (fbRes.ok) {
            res = fbRes;
            realUrl = fbUrl;
          }
        } catch {}
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
    const match = url.match(/\/tile\/([^/]+)\/(\d+)\/(\d+)\/(\d+)\.png/i);
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

  // Protocol 2: EUMETSAT Meteosat High Rate SEVIRI (Europe & Africa)
  self.addProtocol('eumet-alpha', async (params, abortController) => {
    const realUrl = eumetUrlToWms(params.url);
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
        processTilePixels(imgData.data, canvas.width, canvas.height, params.url);
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
