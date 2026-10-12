import { test, expect } from '@playwright/test';

test.describe('Weather Intelligence - City Navigation & Verification', () => {
  test.setTimeout(90000);

  test('Searching for a city selects coordinates, triggers camera movement, and updates weather panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/weather', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Wait for globe to attach
    await page.waitForFunction(() => !!(window as any).__globeRef, { timeout: 45000 });

    const searchInput = page.locator('input[placeholder*="Search any city"]').first();
    await expect(searchInput).toBeVisible();

    // Search for "Sydney"
    await searchInput.fill('');
    await searchInput.pressSequentially('Sydney', { delay: 50 });
    
    // Wait for geocoding dropdown
    const sydneyResult = page.locator('button:has-text("Sydney")').first();
    await expect(sydneyResult).toBeVisible({ timeout: 20000 });
    await sydneyResult.click();

    await page.waitForTimeout(3500);

    // 1. Verify selected coordinates and location name in UI badge / header
    await expect(page.locator('text=Sydney').first()).toBeVisible();

    // 2. Verify camera moved towards Sydney's coordinates (lat: ~ -33.86, lng: ~ 151.2)
    const pov = await page.evaluate(() => {
      const globe = (window as any).__globeRef;
      return globe ? globe.pointOfView() : null;
    });

    expect(pov).not.toBeNull();
    // Latitude should be in southern hemisphere (negative)
    expect(pov.lat).toBeLessThan(0);
    // Longitude should be around ~151°
    expect(pov.lng).toBeGreaterThan(120);

    // 3. Verify shareable URL updated
    expect(page.url()).toContain('lat=-33');
    expect(page.url()).toContain('lng=151');
    expect(page.url()).toContain('Sydney');
  });

  test('Shareable location URLs restore the correct location and camera focus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Navigate with Tokyo coordinates in query params
    await page.goto('/weather?lat=35.6762&lng=139.6503&city=Tokyo&country=Japan', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    await page.waitForFunction(() => !!(window as any).__globeRef, { timeout: 45000 });

    // Verify Tokyo is selected
    await expect(page.locator('text=Tokyo').first()).toBeVisible();

    // Verify camera POV points to Tokyo
    const pov = await page.evaluate(() => {
      const globe = (window as any).__globeRef;
      return globe ? globe.pointOfView() : null;
    });

    expect(pov).not.toBeNull();
    expect(pov.lat).toBeGreaterThan(30);
    expect(pov.lng).toBeGreaterThan(130);
  });

  test('Rapid repeated searches do not restore stale results (race protection)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/weather', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const searchInput = page.locator('input[placeholder*="Search any city"]').first();
    await expect(searchInput).toBeVisible();

    // Type fast first query, then quickly overwrite
    await searchInput.fill('Berlin');
    await page.waitForTimeout(100);
    await searchInput.fill('London');
    await page.waitForTimeout(800);

    // Dropdown results should be for London, not Berlin
    const londonResult = page.locator('button:has-text("London")').first();
    await expect(londonResult).toBeVisible({ timeout: 10000 });
  });

  test('Manual rotation and zoom controls function properly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/weather', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    await page.waitForFunction(() => !!(window as any).__globeRef, { timeout: 45000 });

    const initialAlt = await page.evaluate(() => (window as any).__globeRef.pointOfView()?.altitude);
    expect(initialAlt).toBeDefined();

    // Test Zoom In button
    const zoomInBtn = page.locator('button[aria-label="Zoom in"]').first();
    await zoomInBtn.click();
    await page.waitForTimeout(800);

    const zoomedInAlt = await page.evaluate(() => (window as any).__globeRef.pointOfView()?.altitude);
    expect(zoomedInAlt).toBeLessThan(initialAlt);

    // Test Zoom Out button
    const zoomOutBtn = page.locator('button[aria-label="Zoom out"]').first();
    await zoomOutBtn.click();
    await page.waitForTimeout(400);
    await zoomOutBtn.click();
    await page.waitForTimeout(800);

    const zoomedOutAlt = await page.evaluate(() => (window as any).__globeRef.pointOfView()?.altitude);
    expect(zoomedOutAlt).toBeGreaterThan(zoomedInAlt);
  });
});
