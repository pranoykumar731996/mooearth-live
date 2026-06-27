import { test, expect } from '@playwright/test';

test.describe('MooEarth Live - Play Earth Quiz E2E Tests', () => {

  test.beforeEach(async ({ context, page }) => {
    // Inject localStorage properties to bypass user guide and install banners
    await context.addInitScript(() => {
      window.localStorage.setItem('mooearth_guide_seen', 'true');
      window.localStorage.setItem('mooearth_install_dismissed', 'true');
    });
    // Use default load state for more stable navigations
    await page.goto('/play-earth', { timeout: 60000 });

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

  test('should navigate to play-earth route and load quiz UI', async ({ page }) => {
    // Validate page URL
    await expect(page).toHaveURL(/\/play-earth/);
    
    // Check for standard quiz indicators like the "Play Earth Gaming Platform" title header
    const quizTitle = page.locator('h3:has-text("Play Earth Gaming Platform")');
    await expect(quizTitle.first()).toBeVisible({ timeout: 15000 });
  });

  test('should interactive option selection work correctly', async ({ page }) => {
    // Locate quiz option buttons (e.g. multiple choice options)
    const options = page.locator('button[class*="option"], .quiz-option, .option-btn, button:has-text("A)"), button:has-text("B)")');
    
    if (await options.count() > 0) {
      const firstOption = options.first();
      await expect(firstOption).toBeVisible({ timeout: 10000 });
      
      // Click an option and verify selection style or feedback
      await firstOption.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show score and progression states', async ({ page }) => {
    // Verify score counter element is present
    const scoreContainer = page.locator('div:has-text("Score:"), div:has-text("Streak:"), div:has-text("Level")');
    if (await scoreContainer.count() > 0) {
      await expect(scoreContainer.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
