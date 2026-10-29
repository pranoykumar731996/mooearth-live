// gibs-protocol-worker.js
// MapLibre Web Worker Script: Intercepts NASA GIBS TrueColor JPEG tiles
// Automatically converts near-black void pixels (RGB < 22, un-imaged swaths, missing passes)
// into 100% transparent pixels (alpha = 0), completely eliminating black cutoffs and voids
// exactly like Windy and Zoom Earth!

if (typeof self !== 'undefined' && self.addProtocol) {
  self.addProtocol('gibs-alpha', async (params, abortController) => {
    const realUrl = params.url.replace(/^gibs-alpha:\/\//, 'https://');
    const res = await fetch(realUrl, { signal: abortController.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob = await res.blob();

    // In modern Web Workers, OffscreenCanvas and createImageBitmap are universally supported
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
      } catch (err) {
        return { data: await blob.arrayBuffer() };
      }
    }

    return { data: await blob.arrayBuffer() };
  });
}
