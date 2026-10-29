// gibs-protocol-worker.js
// MapLibre Web Worker Script: Intercepts NASA GIBS TrueColor JPEG tiles and EUMETSAT Meteosat IR tiles
// 1. gibs-alpha: Automatically converts near-black void pixels (RGB < 22, un-imaged swaths, missing passes)
//    into 100% transparent pixels (alpha = 0), completely eliminating black cutoffs and voids.
// 2. eumet-alpha: Harmonizes EUMETSAT Meteosat IR (msg_fes:ir108) with the standard meteorological Dvorak/BD curve
//    (clear ocean/land transparent, mid clouds grayscale, convective storm cores color-enhanced),
//    matching NOAA GOES-16/18 and JMA Himawari-9 identically across the entire globe!

if (typeof self !== 'undefined' && self.addProtocol) {
  // Protocol 1: NASA GIBS TrueColor Alpha Void Keying
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

        for (let i = 0; i < len; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // NASA GIBS missing swath and void pixels are near-black (RGB < 22)
          if (r < 22 && g < 22 && b < 22) {
            d[i + 3] = 0; // Transparent: ocean and terrain basemap show through!
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

  // Protocol 2: EUMETSAT Meteosat Dvorak/BD Curve Harmonizer
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
          const val = d[i]; // Grayscale thermal brightness value

          if (val < 26) {
            // Warm clear ocean and land surface: 100% transparent (reveals basemap)
            d[i] = 0;
            d[i + 1] = 0;
            d[i + 2] = 0;
            d[i + 3] = 0;
          } else if (val < 155) {
            // Normal mid-level and high clouds: smooth natural grayscale with progressive alpha ramp
            const alpha = val < 70 ? Math.round(((val - 26) / (70 - 26)) * 240) : 255;
            d[i] = val;
            d[i + 1] = val;
            d[i + 2] = val;
            d[i + 3] = alpha;
          } else if (val < 170) {
            // Freezing convective storm top (Dvorak Cyan / Teal: 210-220K)
            d[i] = 0;
            d[i + 1] = 230;
            d[i + 2] = 240;
            d[i + 3] = 255;
          } else if (val < 185) {
            // Deep convective core (Dvorak Green / Yellow: 200-210K)
            d[i] = 255;
            d[i + 1] = 220;
            d[i + 2] = 0;
            d[i + 3] = 255;
          } else if (val < 200) {
            // Severe storm eyewall (Dvorak Red / Orange: < 200K)
            d[i] = 255;
            d[i + 1] = 50;
            d[i + 2] = 0;
            d[i + 3] = 255;
          } else {
            // Extreme overshooting storm top (Dvorak Magenta / Purple: < 195K)
            d[i] = 220;
            d[i + 1] = 0;
            d[i + 2] = 255;
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
