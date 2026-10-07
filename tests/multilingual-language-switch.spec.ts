import { test, expect } from '@playwright/test';

test.describe('MooEarth Live — Reactive Multilingual System & Language Switching', () => {

  test.beforeEach(async ({ page }) => {
    // Dismiss splash and first-time guide modals so tests can interact directly
    await page.addInitScript(() => {
      localStorage.setItem('mooearth_guide_seen', 'true');
      sessionStorage.setItem('mooearth_splash_seen', 'true');
    });
  });

  test('Selecting Spanish (es) on Desktop dynamically translates Navbar, Status Bar, and Sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and open desktop language selector
    const langBtn = page.locator('#language-selector-btn');
    await expect(langBtn).toBeVisible({ timeout: 15000 });
    await langBtn.click();

    // Select Spanish
    const esOption = page.locator('#locale-option-es');
    await expect(esOption).toBeVisible({ timeout: 5000 });
    await esOption.click();

    // HTML lang attribute should update to 'es' and dir should be 'ltr'
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    // Navbar PLAY EARTH should update to Spanish ('JUGAR TIERRA')
    await expect(page.locator('text=JUGAR TIERRA').first()).toBeVisible({ timeout: 5000 });

    // Status bar should update to Spanish ('Red Planeta Vivo')
    await expect(page.locator('text=Red Planeta Vivo').first()).toBeVisible({ timeout: 5000 });

    // LocalStorage should persist 'es'
    const storedLocale = await page.evaluate(() => localStorage.getItem('mooearth_locale'));
    expect(storedLocale).toBe('es');
  });

  test('Selecting Arabic (ar) dynamically updates UI and enables RTL layout (dir="rtl")', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find and open desktop language selector
    const langBtn = page.locator('#language-selector-btn');
    await expect(langBtn).toBeVisible({ timeout: 15000 });
    await langBtn.click();

    // Select Arabic
    const arOption = page.locator('#locale-option-ar');
    await expect(arOption).toBeVisible({ timeout: 5000 });
    await arOption.click();

    // HTML should have dir="rtl" and lang="ar"
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Navbar PLAY EARTH should update to Arabic
    await expect(page.locator('text=العب الأرض').first()).toBeVisible({ timeout: 5000 });

    // Status bar Living Earth Network should update to Arabic
    await expect(page.locator('text=شبكة كوكب الأرض الحي').first()).toBeVisible({ timeout: 5000 });

    // LocalStorage should persist 'ar'
    const storedLocale = await page.evaluate(() => localStorage.getItem('mooearth_locale'));
    expect(storedLocale).toBe('ar');
  });

  test('Selecting Japanese (ja) translates UI and persists across page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const langBtn = page.locator('#language-selector-btn');
    await expect(langBtn).toBeVisible({ timeout: 15000 });
    await langBtn.click();

    const jaOption = page.locator('#locale-option-ja');
    await expect(jaOption).toBeVisible({ timeout: 5000 });
    await jaOption.click();

    // HTML attributes & translations
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.locator('text=地球をプレイ').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=リビングアース・ネットワーク').first()).toBeVisible({ timeout: 5000 });

    // Reload page to test persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should remain Japanese after reload
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.locator('text=地球をプレイ').first()).toBeVisible({ timeout: 5000 });
  });

  test('Selecting Hindi (hi) translates UI elements properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const langBtn = page.locator('#language-selector-btn');
    await expect(langBtn).toBeVisible({ timeout: 15000 });
    await langBtn.click();

    const hiOption = page.locator('#locale-option-hi');
    await expect(hiOption).toBeVisible({ timeout: 5000 });
    await hiOption.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(page.locator('text=प्ले अर्थ').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=जीवंत पृथ्वी नेटवर्क').first()).toBeVisible({ timeout: 5000 });
  });

  test('Selecting German (de) translates UI elements properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const langBtn = page.locator('#language-selector-btn');
    await expect(langBtn).toBeVisible({ timeout: 15000 });
    await langBtn.click();

    const deOption = page.locator('#locale-option-de');
    await expect(deOption).toBeVisible({ timeout: 5000 });
    await deOption.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('text=ERDE SPIELEN').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Lebendiges Erdnetzwerk').first()).toBeVisible({ timeout: 5000 });
  });

  test('Selecting French (fr) translates UI elements properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const langBtn = page.locator('#language-selector-btn');
    await expect(langBtn).toBeVisible({ timeout: 15000 });
    await langBtn.click();

    const frOption = page.locator('#locale-option-fr');
    await expect(frOption).toBeVisible({ timeout: 5000 });
    await frOption.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('text=JOUER TERRE').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Réseau Terre Vivante').first()).toBeVisible({ timeout: 5000 });
  });

  test('Mobile viewport: selecting Portuguese (pt) via mobile language selector translates UI', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Mobile selector button should be visible
    const mobileLangBtn = page.locator('#language-selector-btn-mobile');
    await expect(mobileLangBtn).toBeVisible({ timeout: 15000 });
    await mobileLangBtn.click();

    const ptOption = page.locator('#locale-option-pt-mobile');
    await expect(ptOption).toBeVisible({ timeout: 5000 });
    await ptOption.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
    await expect(page.locator('text=JOGAR').first()).toBeVisible({ timeout: 5000 });
    const storedLocale = await page.evaluate(() => localStorage.getItem('mooearth_locale'));
    expect(storedLocale).toBe('pt');
  });

});
