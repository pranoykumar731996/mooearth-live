import { test, expect } from '@playwright/test';

test.describe('Phase 2: Multilingual SEO Hubs & Party Arena', () => {

  test('Spanish Localized Home (/es) renders with correct metadata & hreflangs', async ({ page }) => {
    await page.goto('/es');
    await expect(page).toHaveTitle(/MooEarth Live/);
    
    // Check hreflang alternates in head
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/es');

    const hreflangs = await page.locator('link[rel="alternate"][hreflang]').count();
    expect(hreflangs).toBeGreaterThanOrEqual(7);
  });

  test('Japanese Localized Home (/ja) renders with correct metadata', async ({ page }) => {
    await page.goto('/ja');
    await expect(page).toHaveTitle(/MooEarth Live/);
    
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/ja');
  });

  test('Localized Country Hub (/es/country/spain) renders localized title and schema', async ({ page }) => {
    await page.goto('/es/country/spain');
    await expect(page).toHaveTitle(/España/);
    
    // Check JSON-LD Place schema
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Localized Country Hub (/ja/country/japan) renders Japanese country title', async ({ page }) => {
    await page.goto('/ja/country/japan');
    await expect(page).toHaveTitle(/日本/);
  });

  test('Localized Daily Challenge (/es/daily) renders in Spanish', async ({ page }) => {
    await page.goto('/es/daily');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Reto Diario').or(page.locator('text=Tierra'))).toBeVisible();
  });

  test('Party Arena (/party) allows creating a tournament room with PIN', async ({ page }) => {
    await page.goto('/party');
    
    // Fill nickname
    const nicknameInput = page.locator('input[placeholder*="Atlas"]');
    await expect(nicknameInput).toBeVisible();
    await nicknameInput.fill('GeoChampion');

    // Click Host Room
    const hostBtn = page.locator('button:has-text("Host New Tournament")');
    await hostBtn.click();

    // Verify Lobby
    await expect(page.locator('text=Tournament Lobby')).toBeVisible();
    await expect(page.locator('text=GeoChampion')).toBeVisible();
    await expect(page.locator('button:has-text("Launch Round 1")')).toBeVisible();
  });

  test('Party Arena (/party/784210) pre-fills room PIN from URL param', async ({ page }) => {
    await page.goto('/party/784210');
    const pinInput = page.locator('input[placeholder*="PIN"]');
    await expect(pinInput).toBeVisible();
    await expect(pinInput).toHaveValue('784210');
  });

});
