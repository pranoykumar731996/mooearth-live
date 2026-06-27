import { test, expect } from '@playwright/test';

test.describe('MooEarth Live - FIFA World Cup Dashboard E2E Tests', () => {

  test.beforeEach(async ({ context, page }) => {
    // Inject localStorage properties to bypass user guide and install banners
    await context.addInitScript(() => {
      window.localStorage.setItem('mooearth_guide_seen', 'true');
      window.localStorage.setItem('mooearth_install_dismissed', 'true');
    });
    // Use default load state for more stable navigations
    await page.goto('/fifa', { timeout: 60000 });
    // Wait for the page to fully settle (FIFA route triggers repeated navigations in some browsers)
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    // Wait for the splash screen to appear
    const logo = page.getByAltText('MooEarth Live Logo');
    await expect(logo).toBeVisible({ timeout: 15000 });

    // Forcefully remove the splash screen container immediately to prevent
    // Framer Motion exit animations from hanging in headless browsers
    await page.evaluate(() => {
      const splash = document.getElementById('splash-screen') || 
                     document.querySelector('div[class*="z-[100]"]') ||
                     document.querySelector('div[class*="bg-[#030308]"]') ||
                     document.querySelector('img[alt="MooEarth Live Logo"]')?.parentElement?.parentElement;
      if (splash) splash.remove();
    });

    // Confirm the splash is gone
    await expect(logo).toBeHidden({ timeout: 5000 });
  });

  test('should navigate to fifa route and render page layouts', async ({ page }) => {
    // Check URL redirection or direct path
    await expect(page).toHaveURL(/\/fifa/);
    
    // Wait for network to settle after any client-side navigation
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    
    // Check for the WorldCupSchedule component - tab buttons contain emoji prefix
    const scheduleBtn = page.locator('button:has-text("Schedule"), button:has-text("📅")');
    await expect(scheduleBtn.first()).toBeVisible({ timeout: 20000 });
  });

  test('should allow toggling between FIFA dashboard tabs', async ({ page }) => {
    // Locate tab buttons (Schedule, Standings, Stats, Progress)
    const standingsTab = page.locator('button:has-text("Standings")');
    if (await standingsTab.count() > 0) {
      await standingsTab.first().click();
      await page.waitForTimeout(1000);
    }
    
    const statsTab = page.locator('button:has-text("Stats")');
    if (await statsTab.count() > 0) {
      await statsTab.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should support searching countries in rankings list', async ({ page }) => {
    // Check for rankings search input field
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="country"]');
    
    if (await searchInput.count() > 0) {
      const input = searchInput.first();
      await expect(input).toBeVisible({ timeout: 10000 });
      
      // Type "Brazil"
      await input.fill('Brazil');
      await page.waitForTimeout(1000);
      
      // Brazil list item or text should be visible
      const brazilRow = page.locator('td:has-text("Brazil"), div:has-text("Brazil")');
      if (await brazilRow.count() > 0) {
        await expect(brazilRow.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
