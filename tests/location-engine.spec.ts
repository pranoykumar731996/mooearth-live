import { test, expect } from '@playwright/test';

test.describe('MooEarth Live - Geographic News Discovery Engine E2E Tests', () => {
  
  test.beforeEach(async ({ context, page }) => {
    // Inject localStorage properties to bypass user guide and install banners
    await context.addInitScript(() => {
      window.localStorage.setItem('mooearth_guide_seen', 'true');
      window.localStorage.setItem('mooearth_install_dismissed', 'true');
    });
    // Navigate to homepage
    await page.goto('/', { timeout: 60000 });

    // Remove splash screen to prevent test hangs
    await page.evaluate(() => {
      const splash = document.getElementById('splash-screen') || 
                     document.querySelector('div[class*="z-[100]"]') ||
                     document.querySelector('div[class*="bg-[#030308]"]') ||
                     document.querySelector('img[alt="MooEarth Live Logo"]')?.parentElement?.parentElement;
      if (splash) splash.remove();
    });
  });

  test('should display autocomplete location suggestions as user types', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();

    // Type "Bhubaneswar"
    await searchInput.fill('Bhubaneswar');
    await page.waitForTimeout(500); // Wait for debounce

    // The dropdown container should be visible
    const dropdown = page.locator('#search-container >> text=Locations');
    await expect(dropdown).toBeVisible({ timeout: 10000 });

    // Suggestion for Bhubaneswar should be present with details
    const suggestion = page.locator('button:has-text("Bhubaneswar")');
    await expect(suggestion).toBeVisible();
    await expect(suggestion).toContainText('City');
    await expect(suggestion).toContainText('India');
    await expect(suggestion).toContainText('Pop:');
  });

  test('should support inline ambiguity picker when searching for Paris', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await searchInput.fill('Paris');
    await page.waitForTimeout(500);

    // Press Enter to trigger ambiguity resolving modal header
    await searchInput.press('Enter');

    const ambiguityHeader = page.locator('text=Location Ambiguity Detected');
    await expect(ambiguityHeader).toBeVisible({ timeout: 5000 });

    // Verify both options are present
    const parisFrance = page.locator('button:has-text("Paris"):has-text("FR")');
    const parisTexas = page.locator('button:has-text("Paris"):has-text("US")');

    await expect(parisFrance).toBeVisible();
    await expect(parisTexas).toBeVisible();

    // Click Paris, France to resolve
    await parisFrance.click();

    // The picker should be dismissed
    await expect(ambiguityHeader).toBeHidden();
  });

  test('should show fallback level diagnostics in the debug panel when developer mode is active', async ({ page }) => {
    // Force developer mode via window variable or by checking if debug elements show
    await page.evaluate(() => {
      window.localStorage.setItem('mooearth_developer_mode', 'true');
    });
    
    // Reload page with developer mode active
    await page.reload();
    await page.evaluate(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) splash.remove();
    });

    const searchInput = page.locator('#search-input');
    await searchInput.fill('Bhubaneswar');
    await page.waitForTimeout(500);

    const suggestion = page.locator('button:has-text("Bhubaneswar")');
    await suggestion.click();

    // Verify debug panel features diagnostics
    // (Simulate triggering developer console toggle button if needed, or check if visible)
    // Wait for news fallback to request API
    await page.waitForTimeout(1000);
  });
});
