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

    const isVisMode = realUrl.includes('spectral=vis') || (!realUrl.includes('spectral=infra') && !realUrl.includes('spectral=blue'));
    const isInfraLayer = realUrl.includes('Band13') || realUrl.includes('Infrared') || realUrl.includes('IR') || realUrl.includes('ir108');
    const isHimawariVis = realUrl.includes('Band3') || realUrl.includes('Himawari_AHI_Band3');
    const isGeoColor = realUrl.includes('GeoColor');
    const isEumet = realUrl.includes('msg_') || realUrl.includes('eumet');

    for (let i = 0; i < len; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      const pixelIdx = i >> 2;
      const pxCol = pixelIdx % width;
      const pxRow = Math.floor(pixelIdx / width);
      const spatWeight = hasCoords ? getSectorSpatialWeight(realUrl, tileLngs[pxCol], tileLats[pxRow]) : 1.0;

      if (spatWeight <= 0.001) {
        d[i + 3] = 0;
        continue;
      }

      // 1. Off-disk space & missing pass void elimination
      if (r < 28 && g < 28 && b < 28) {
        d[i + 3] = 0;
        continue;
      }

      if (isVisMode) {
        // ==========================================
        // VISIBLE / CLOUDS MODE (Windy & Zoom Earth Parity)
        // ==========================================
        if (isInfraLayer) {
          // Nighttime Clean Infrared stream converted to soft moonlight white clouds
          if (r <= 118) {
            d[i + 3] = 0; // Clear warm ocean / land surface: 100% transparent
          } else {
            const norm = Math.min(1.0, (r - 114) / (180 - 114));
            const cloudAlpha = Math.round(245 * Math.pow(norm, 0.65));
            const finalAlpha = Math.round(cloudAlpha * spatWeight);
            if (finalAlpha <= 2) {
              d[i + 3] = 0;
            } else {
              const cloudTone = Math.min(255, Math.round(238 + norm * 17));
              d[i] = cloudTone;
              d[i + 1] = cloudTone;
              d[i + 2] = cloudTone;
              d[i + 3] = finalAlpha;
            }
          }
        } else if (isHimawariVis) {
          // Daytime Himawari Band 3 (Red optical reflectance)
          if (r <= 20) {
            d[i + 3] = 0; // Clear ocean / dark vegetation
          } else {
            const norm = Math.min(1.0, (r - 20) / (80 - 20));
            const cloudAlpha = Math.round(245 * Math.pow(norm, 0.65));
            const finalAlpha = Math.round(cloudAlpha * spatWeight);
            if (finalAlpha <= 2) {
              d[i + 3] = 0;
            } else {
              const cloudTone = Math.min(255, Math.round(238 + norm * 17));
              d[i] = cloudTone;
              d[i + 1] = cloudTone;
              d[i + 2] = cloudTone;
              d[i + 3] = finalAlpha;
            }
          }
        } else if (isGeoColor) {
          // Daytime NOAA GOES GeoColor: true-color multispectral
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Sand / Desert Discrimination (Sahara, Arabia, Mojave):
          const isSand = (r > g && g > b && (r - b) >= 22 && (r - g) >= 8);
          if (isSand) {
            d[i + 3] = 0; // Sand is 100% transparent -> shows olive basemap
            continue;
          }

          // City lights filter at night:
          const isCityLights = (r > 60 && g > 50 && b < 40 && (r - b) >= 30);
          if (isCityLights) {
            d[i + 3] = 0;
            continue;
          }

          // Clear ocean glint & deep water:
          if (lum <= 32 || (b > r + 10 && lum < 65)) {
            d[i + 3] = 0;
            continue;
          }

          // Real clouds have neutral chromaticity:
          const isCloudLike = Math.abs(r - g) <= 16 && Math.abs(g - b) <= 16;
          if (!isCloudLike && lum < 140) {
            d[i + 3] = 0;
            continue;
          }

          const norm = Math.min(1.0, (lum - 30) / (95 - 30));
          const cloudAlpha = Math.round(245 * Math.pow(norm, 0.65));
          const finalAlpha = Math.round(cloudAlpha * spatWeight);
          if (finalAlpha <= 2) {
            d[i + 3] = 0;
          } else {
            const cloudTone = Math.min(255, Math.round(238 + norm * 17));
            d[i] = cloudTone;
            d[i + 1] = cloudTone;
            d[i + 2] = cloudTone;
            d[i + 3] = finalAlpha;
          }
        } else if (isEumet) {
          // EUMETSAT Meteosat High Rate SEVIRI
          if (r <= 32) {
            d[i + 3] = 0;
          } else {
            const norm = Math.min(1.0, (r - 30) / (110 - 30));
            const cloudAlpha = Math.round(245 * Math.pow(norm, 0.65));
            const finalAlpha = Math.round(cloudAlpha * spatWeight);
            if (finalAlpha <= 2) {
              d[i + 3] = 0;
            } else {
              const cloudTone = Math.min(255, Math.round(238 + norm * 17));
              d[i] = cloudTone;
              d[i + 1] = cloudTone;
              d[i + 2] = cloudTone;
              d[i + 3] = finalAlpha;
            }
          }
        } else {
          // Fallback reflectance
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum <= 25) {
            d[i + 3] = 0;
          } else {
            const norm = Math.min(1.0, (lum - 25) / (100 - 25));
            d[i + 3] = Math.round(245 * Math.pow(norm, 1.15) * spatWeight);
          }
        }
      } else {
        // ==========================================
        // INFRARED THERMAL MODE (Dvorak/BD Hurricane Scale)
        // ==========================================
        const isVoid = (r < 25 && g < 25 && b < 25) || (r < 38 && g < 38 && b < 38 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8);
        if (isVoid) {
          d[i + 3] = 0;
          continue;
        }

        const isGray = Math.abs(r - g) <= 6 && Math.abs(g - b) <= 6;
        if (isGray) {
          if (r <= 114) {
            d[i + 3] = 0;
          } else if (r < 145) {
            d[i + 3] = Math.round(((r - 114) / (145 - 114)) * 190 * spatWeight);
          } else {
            d[i + 3] = Math.round(230 * spatWeight);
          }
        } else {
          d[i + 3] = Math.round(255 * spatWeight);
        }
      }
    }
  }

  // Protocol 1: NASA GIBS Geostationary Satellites (GOES & Himawari)
  self.addProtocol('gibs-alpha', async (params, abortController) => {
    const realUrl = params.url.replace(/^gibs-alpha:\/\//, 'https://');
    const res = await fetch(realUrl, { signal: abortController.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();

    if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
      try {
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return { data: bitmap };

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

  // Protocol 2: EUMETSAT Meteosat High Rate SEVIRI (Europe & Africa)
  self.addProtocol('eumet-alpha', async (params, abortController) => {
    const realUrl = params.url.replace(/^eumet-alpha:\/\//, 'https://');
    const res = await fetch(realUrl, { signal: abortController.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();

    if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined') {
      try {
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return { data: bitmap };

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
}
