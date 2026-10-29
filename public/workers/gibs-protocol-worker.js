// gibs-protocol-worker.js
// MapLibre Web Worker Script: Intercepts NASA GIBS TrueColor & Geostationary Infrared tiles and EUMETSAT Meteosat IR tiles
// 1. gibs-alpha: Automatically converts near-black void pixels (RGB < 25) and dark oceanic/space borders
//    into 100% transparent pixels (alpha = 0), completely eliminating black cutoffs and dark blocks across GOES & Himawari.
// 2. eumet-alpha: Harmonizes EUMETSAT Meteosat IR (msg_fes:ir108) with the standard meteorological Dvorak/BD curve
//    (clear ocean/land transparent, low/mid clouds translucent grayscale, convective storm cores color-enhanced),
//    matching NOAA GOES-16/18 and JMA Himawari-9 identically across the entire globe!

if (typeof self !== 'undefined' && self.addProtocol) {
  // Protocol 1: NASA GIBS TrueColor & Infrared Alpha Void / Dark Border Keying
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
        const d = imgData.data;
        const len = d.length;

        const isInfra = realUrl.includes('Band13') || realUrl.includes('Infrared') || realUrl.includes('IR');

        for (let i = 0; i < len; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];

          if (isInfra) {
            // NASA GIBS Band 13 Infrared:
            // Near-black edge voids or deep space margins
            const isVoid = (r < 25 && g < 25 && b < 25) ||
                           (r < 38 && g < 38 && b < 38 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8);
            if (isVoid) {
              d[i + 3] = 0;
              continue;
            }

            const isGray = Math.abs(r - g) <= 6 && Math.abs(g - b) <= 6;
            if (isGray) {
              if (r <= 114) {
                // Clear warm ocean and land surface (> 280 K): 100% transparent (basemap shows through!)
                d[i + 3] = 0;
              } else if (r < 145) {
                // Soft translucent natural low clouds
                d[i + 3] = Math.round(((r - 114) / (145 - 114)) * 190);
              } else {
                // Mid and high cold clouds
                d[i + 3] = 230;
              }
            }
            // Vivid colored Dvorak convective storm cores retain full alpha 255
          } else {
            // TrueColor: Key out missing orbital swaths and void pixels
            if (r < 22 && g < 22 && b < 22) {
              d[i + 3] = 0;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const cleanBitmap = await createImageBitmap(canvas);
        return { data: cleanBitmap };
      } catch {
        return { data: await blob.arrayBuffer() };
      }
    }

    return { data: await blob.arrayBuffer() };
  });

  // Protocol 2: EUMETSAT Meteosat Calibrated Dvorak/BD Curve Harmonizer
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
        const d = imgData.data;
        const len = d.length;

        for (let i = 0; i < len; i += 4) {
          const val = d[i]; // Grayscale thermal brightness value (0 = warm, 255 = extreme cold)

          if (val < 30) {
            // Warm clear ocean and land surface: 100% transparent (reveals basemap)
            d[i] = 0;
            d[i + 1] = 0;
            d[i + 2] = 0;
            d[i + 3] = 0;
          } else if (val < 140) {
            // Normal low-to-mid level clouds: smooth natural grayscale with progressive alpha ramp
            const alpha = Math.min(210, Math.round(((val - 30) / (140 - 30)) * 180));
            const cloudGray = Math.min(240, Math.round(180 + val * 0.35));
            d[i] = cloudGray;
            d[i + 1] = cloudGray;
            d[i + 2] = cloudGray;
            d[i + 3] = alpha;
          } else if (val < 175) {
            // Freezing high cirrus / transition (Dvorak Cyan / Teal: 235-225K)
            d[i] = 0;
            d[i + 1] = 210;
            d[i + 2] = 240;
            d[i + 3] = 220;
          } else if (val < 205) {
            // Convective storm core (Dvorak Emerald Green: 225-215K)
            d[i] = 0;
            d[i + 1] = 225;
            d[i + 2] = 70;
            d[i + 3] = 235;
          } else if (val < 225) {
            // Strong storm updraft (Dvorak Electric Yellow: 215-205K)
            d[i] = 255;
            d[i + 1] = 225;
            d[i + 2] = 0;
            d[i + 3] = 245;
          } else if (val < 240) {
            // Severe storm eyewall (Dvorak Crimson Red: 205-195K)
            d[i] = 255;
            d[i + 1] = 60;
            d[i + 2] = 0;
            d[i + 3] = 255;
          } else {
            // Extreme overshooting storm top (Dvorak Magenta / Pink: < 195K)
            d[i] = 235;
            d[i + 1] = 0;
            d[i + 2] = 245;
            d[i + 3] = 255;
          }
        }

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
