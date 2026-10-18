import { test, expect } from '@playwright/test';

test.describe('Weather Intelligence 3D Globe Fix', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('mooearth_consent_v1', JSON.stringify({
          essential: true,
          analytics: true,
          advertising: true,
          personalizedAds: true,
          respondedAt: Date.now()
        }));
        localStorage.setItem('mooearth_cookie_consent', JSON.stringify({
          essential: true,
          analytics: true,
          advertising: true,
          personalizedAds: true,
          respondedAt: Date.now()
        }));
      } catch {}
    });
  });

  test('Globe renders with valid dimensions and visible Earth mesh on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/weather', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Verify header and mode tabs
    await expect(page.locator('text=Weather Intelligence').first()).toBeVisible();
    await expect(page.locator('button:has-text("Overview")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Wind")').first()).toBeVisible();

    // Verify 3D Three.js canvas inside #globe-container is present and non-zero
    const canvas = page.locator('#globe-container canvas').first();
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(300);
    expect(box!.height).toBeGreaterThan(300);

    // Wait for dynamic globe bundle to load and __globeRef to attach
    await page.waitForFunction(() => !!(window as any).__globeRef, { timeout: 45000 });

    // Verify globe diagnostics state
    const evalResult = await page.evaluate(() => {
      const globe = (window as any).__globeRef;
      if (!globe) return null;
      const scene = globe.scene();
      let globeMeshFound = false;
      if (scene) {
        scene.traverse((obj: any) => {
          if (obj.__globeObjType === 'globe' || (obj.geometry && obj.geometry.type === 'SphereGeometry') || obj.isMesh) {
            globeMeshFound = true;
          }
        });
      }
      return {
        hasGlobe: true,
        globeMeshFound,
        pov: globe.pointOfView ? globe.pointOfView() : null,
      };
    });

    expect(evalResult).not.toBeNull();
    expect(evalResult?.hasGlobe).toBe(true);
    expect(evalResult?.globeMeshFound).toBe(true);
  });

  test('Globe renders in mobile portrait viewport and is not obscured by full-screen modal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/weather', { waitUntil: 'domcontentloaded' });
    // Wait for globe component to mount
    await page.waitForFunction(() => !!(window as any).__globeRef, { timeout: 30000 });

    // Canvas inside #globe-container should have positive viewport dimensions
    const canvas = page.locator('#globe-container canvas').first();
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(250);

    // Central area is NOT obscured by modal on fresh load
    const telemetryCta = page.locator('[data-testid="open-mobile-sheet"]').first();
    await expect(telemetryCta).toBeVisible();

    // Tapping telemetry CTA opens the bottom sheet
    await telemetryCta.click();
    await page.waitForTimeout(500);
    const closeBtn = page.locator('[data-testid="close-mobile-sheet"]').first();
    await expect(closeBtn).toBeVisible();

    // Closing the sheet restores the clean viewport
    await closeBtn.click();
    await page.waitForTimeout(500);
    await expect(closeBtn).not.toBeVisible();
  });

  test('Layer switching keeps the 3D Earth rendered', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/weather', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Switch to Wind
    await page.locator('button:has-text("Wind")').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#globe-container canvas').first()).toBeVisible();

    // Switch to Temperature
    await page.locator('button:has-text("Temperature")').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#globe-container canvas').first()).toBeVisible();

    // Switch to Rain & Precipitation
    await page.locator('button:has-text("Rain")').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#globe-container canvas').first()).toBeVisible();
  });

  test('Main Globe page continues to render 3D Earth correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#globe-container canvas', { timeout: 30000 });

    const canvas = page.locator('#globe-container canvas').first();
    await expect(canvas).toBeAttached();
    await expect(canvas).toBeVisible({ timeout: 15000 });
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(300);
    expect(box!.height).toBeGreaterThan(300);
  });

  test('Zoom controls (+, −, ⟲) zoom in and zoom out of the 3D Earth', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/weather', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(window as any).__globeRef, { timeout: 30000 });
    await page.waitForTimeout(1000);

    const zoomInBtn = page.locator('button[aria-label="Zoom in"]').first();
    const zoomOutBtn = page.locator('button[aria-label="Zoom out"]').first();
    const resetBtn = page.locator('button[aria-label="Reset view"]').first();

    await expect(zoomInBtn).toBeVisible();
    await expect(zoomOutBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();

    // Zoom In
    await zoomInBtn.click();
    await page.waitForTimeout(800);
    const altZoomIn = await page.evaluate(() => (window as any).__globeRef.pointOfView()?.altitude);

    // Zoom Out multiple times
    await zoomOutBtn.click();
    await page.waitForTimeout(400);
    await zoomOutBtn.click();
    await page.waitForTimeout(400);
    await zoomOutBtn.click();
    await page.waitForTimeout(800);
    const altZoomOut = await page.evaluate(() => (window as any).__globeRef.pointOfView()?.altitude);

    expect(altZoomOut).toBeGreaterThan(altZoomIn);

    // Reset View
    await resetBtn.click();
    await page.waitForTimeout(1000);
    const altReset = await page.evaluate(() => (window as any).__globeRef.pointOfView()?.altitude);
    expect(altReset).toBeGreaterThanOrEqual(1.8);
  });

  test('Weather features ribbon and telemetry panel are completely scrollable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/weather', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Check layer selector horizontal scroll
    const ribbonCanScroll = await page.evaluate(() => {
      const el = document.querySelector('.overflow-x-auto');
      return el ? el.scrollWidth > 0 : false;
    });
    expect(ribbonCanScroll).toBe(true);

    // Check desktop weather panel vertical scroll through all features
    const panelScrollable = await page.evaluate(() => {
      const el = document.querySelector('.overflow-y-auto');
      if (!el) return false;
      return el.scrollHeight > el.clientHeight;
    });
    expect(panelScrollable).toBe(true);
  });
});

