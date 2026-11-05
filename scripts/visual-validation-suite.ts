import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\prano\\.gemini\\antigravity\\brain\\2ca940a1-d12e-45c0-990e-b258bcb983b6\\visual-validation';

interface ValidationTarget {
  name: string;
  slug: string;
  lat: number;
  lng: number;
  zoom: number;
  notes: string;
}

const TARGETS: ValidationTarget[] = [
  {
    name: 'Central Asia (Uzbekistan / Turkmenistan)',
    slug: 'central-asia',
    lat: 41.0,
    lng: 64.0,
    zoom: 4.8,
    notes: 'Himawari western cutoff edge; tests IODC 98% coverage vs Himawari 75% void',
  },
  {
    name: 'Iran & Middle East (Tehran / Caspian Sea)',
    slug: 'iran-middle-east',
    lat: 32.5,
    lng: 53.0,
    zoom: 4.5,
    notes: 'Complete Himawari void (100% transparent in baseline); tests IODC restoration',
  },
  {
    name: 'India & Bay of Bengal',
    slug: 'india-bay-of-bengal',
    lat: 19.5,
    lng: 82.0,
    zoom: 4.8,
    notes: 'Overlap zone (82°E) between IODC and Himawari; tests cloud continuity',
  },
  {
    name: 'Northern India & Tibet (Himalayas)',
    slug: 'tibet-himalayas',
    lat: 31.0,
    lng: 84.0,
    zoom: 4.8,
    notes: 'High-altitude cold terrain; tests terrain contrast and cloud-top stability',
  },
  {
    name: 'Equatorial Indian Ocean',
    slug: 'equatorial-indian-ocean',
    lat: -2.0,
    lng: 75.0,
    zoom: 4.5,
    notes: 'Intertropical Convergence Zone (ITCZ) convective bands across central IODC disk',
  },
  {
    name: 'West Sector Boundary (25°E–45°E: Red Sea & Horn of Africa)',
    slug: 'boundary-west-prime-iodc',
    lat: 20.0,
    lng: 38.0,
    zoom: 4.2,
    notes: 'Smooth cosine blend between Meteosat-11 Prime (0°) and Meteosat-9 IODC (45.5°E)',
  },
  {
    name: 'East Sector Boundary (75°E–95°E: Central India & Bay of Bengal)',
    slug: 'boundary-east-iodc-himawari',
    lat: 20.0,
    lng: 85.0,
    zoom: 4.2,
    notes: 'Smooth cosine blend between Meteosat-9 IODC (45.5°E) and Himawari-9 (140.7°E)',
  },
];

async function captureValidationSuite() {
  console.log('====================================================');
  console.log('📸 MOOEARTH VISUAL VALIDATION SUITE (Playwright)');
  console.log('====================================================');

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  await context.addInitScript(() => {
    try {
      localStorage.setItem('mooearth_cookie_consent', 'true');
      localStorage.setItem('cookie-consent', 'accepted');
      localStorage.setItem('mooearth_privacy_accepted', 'true');
    } catch {}
  });

  const page = await context.newPage();

  // Test both Baseline (default) and IODC Active (?iodc=true)
  const configurations = [
    { label: 'Baseline (Production Default: Himawari + Meteosat-Prime)', param: '', fileSuffix: 'baseline' },
    { label: 'IODC Prototype Active (?iodc=true: 5-Satellite Continuous Mosaic)', param: '&iodc=true', fileSuffix: 'iodc' },
  ];

  for (const config of configurations) {
    console.log(`\n----------------------------------------------------`);
    console.log(`🚀 Running Suite: ${config.label}`);
    console.log(`----------------------------------------------------`);

    for (const target of TARGETS) {
      const url = `http://localhost:3000/?layer=satellite&lat=${target.lat}&lng=${target.lng}&zoom=${target.zoom}${config.param}`;
      console.log(`\nCapturing [${target.name}] (zoom ${target.zoom}, lat ${target.lat}, lng ${target.lng})...`);
      console.log(`  URL: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (err: any) {
        console.log(`  Notice during load: ${err.message}, waiting for tiles...`);
      }

      // Wait for MapLibre satellite layers to be attached
      await page.waitForFunction(() => {
        const map = (window as any)._map;
        return map && (map.getLayer('nasa-gibs-himawari-layer') || map.getLayer('nasa-gibs-eumet-iodc-layer'));
      }, { timeout: 12000 }).catch(() => {});

      // Allow WebGL tiles to download, unpack in worker, and render
      await page.waitForTimeout(4000);

      // Dismiss any remaining dialogs or banners
      await page.evaluate(() => {
        const cookieBanner = document.querySelector('[role="dialog"], .cookie-banner');
        if (cookieBanner) (cookieBanner as HTMLElement).style.display = 'none';
      }).catch(() => {});

      const filename = `${target.slug}-${config.fileSuffix}.png`;
      const outPath = path.join(ARTIFACT_DIR, filename);

      await page.screenshot({ path: outPath, fullPage: false });
      const stats = fs.statSync(outPath);
      console.log(`  ✅ Captured: ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
    }
  }

  // Also capture full-world regional view for both modes
  console.log(`\n----------------------------------------------------`);
  console.log(`🌍 Capturing Global Multi-Sector Overview...`);
  console.log(`----------------------------------------------------`);

  for (const config of configurations) {
    const worldUrl = `http://localhost:3000/?layer=satellite&lat=20.0&lng=70.0&zoom=2.8${config.param}`;
    try {
      await page.goto(worldUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch {}
    await page.waitForTimeout(4000);
    const worldFile = `global-overview-${config.fileSuffix}.png`;
    const worldPath = path.join(ARTIFACT_DIR, worldFile);
    await page.screenshot({ path: worldPath });
    console.log(`  ✅ Global View Captured: ${worldFile}`);
  }

  await browser.close();
  console.log(`\nAll visual validation screenshots saved to:\n${ARTIFACT_DIR}`);
}

captureValidationSuite().catch((err) => {
  console.error('Validation suite failed:', err);
  process.exit(1);
});
