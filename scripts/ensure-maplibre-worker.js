// ============================================================
// MooEarth Live — Ensure MapLibre Web Worker is present in /public
// ============================================================
// Next.js bundlers isolate modules, requiring MapLibre's Web Worker
// to be served as a standalone static asset to prevent worker load errors.

const fs = require('fs');
const path = require('path');

const srcWorker = path.join(__dirname, '..', 'node_modules', 'maplibre-gl', 'dist', 'maplibre-gl-worker.mjs');
const srcDevWorker = path.join(__dirname, '..', 'node_modules', 'maplibre-gl', 'dist', 'maplibre-gl-worker-dev.mjs');
const publicDir = path.join(__dirname, '..', 'public');
const destWorker = path.join(publicDir, 'maplibre-gl-worker.mjs');
const destDevWorker = path.join(publicDir, 'maplibre-gl-worker-dev.mjs');

function copyIfSrcExists(src, dest) {
  if (fs.existsSync(src)) {
    if (!fs.existsSync(dest) || fs.statSync(src).size !== fs.statSync(dest).size) {
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
      console.log(`[maplibre-worker] Copied ${path.basename(src)} to ${path.relative(process.cwd(), dest)}`);
    } else {
      console.log(`[maplibre-worker] ${path.basename(dest)} is up to date.`);
    }
  } else {
    console.warn(`[maplibre-worker] Source worker not found at ${src}`);
  }
}

try {
  copyIfSrcExists(srcWorker, destWorker);
  copyIfSrcExists(srcDevWorker, destDevWorker);
} catch (err) {
  console.error('[maplibre-worker] Error ensuring worker file:', err);
}
