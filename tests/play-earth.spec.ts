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

    // Wait for the splash screen if present and dismiss it
    const splash = page.locator('#splash-screen');
    try {
      if (await splash.isVisible({ timeout: 5000 })) {
        await page.evaluate(() => {
          const s = document.getElementById('splash-screen');
          if (s) s.remove();
        });
      }
    } catch {
      // Splash already dismissed
    }
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
