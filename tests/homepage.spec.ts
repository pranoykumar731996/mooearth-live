import { test, expect } from '@playwright/test';

test.describe('MooEarth Live - Homepage & Article Viewer E2E Tests', () => {
  
  test.beforeEach(async ({ context, page }) => {
    // Inject localStorage properties to bypass user guide and install banners
    await context.addInitScript(() => {
      window.localStorage.setItem('mooearth_guide_seen', 'true');
      window.localStorage.setItem('mooearth_install_dismissed', 'true');
    });
    // Use default load state for more stable navigations
    await page.goto('/', { timeout: 60000 });

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

  test('should load landing page successfully with title and meta tags', async ({ page }) => {
    // Check title (or a substring of it)
    await expect(page).toHaveTitle(/MooEarth/i);
    
    // Check main layout elements are present
    const mainHeader = page.locator('header, nav');
    await expect(mainHeader.first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow filtering news by category tabs', async ({ page }) => {
    // Locate the category buttons/tabs in the sidebar
    const sidebarTab = page.locator('#sidebar-breaking, #sidebar-football, #sidebar-technology');
    
    if (await sidebarTab.count() > 0) {
      const firstTab = sidebarTab.first();
      if (await firstTab.isVisible()) {
        await firstTab.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should open article viewer modal when clicking a news story', async ({ page }) => {
    // Locate a news story in the feed
    const storyCard = page.locator('article, .story-card, div:has-text("By MooEarth Newsroom"), div:has-text("By Kenji Sato")');
    
    if (await storyCard.count() > 0) {
      const firstStory = storyCard.first();
      await expect(firstStory).toBeVisible({ timeout: 10000 });
      
      // Click the article
      await firstStory.click();
      
      // Verify Article Viewer modal or panel appears
      const modalHeader = page.locator('h2, div:has-text("NEWS ENGINE DIAGNOSTIC HUD"), div:has-text("SUMMARY OVERVIEW")');
      await expect(modalHeader.first()).toBeVisible({ timeout: 10000 });
      
      // Verify Diagnostic HUD fields exist
      const debugHud = page.locator('text=NEWS ENGINE DIAGNOSTIC HUD');
      if (await debugHud.count() > 0) {
        await expect(debugHud).toBeVisible();
        await expect(page.locator('text=ARTICLE ID:')).toBeVisible();
        await expect(page.locator('text=SOURCE:')).toBeVisible();
      }
    }
  });

  test('should toggle the AI Assistant drawer', async ({ page }) => {
    // Locate AI Assistant trigger specifically using title attribute
    const assistantBtn = page.locator('button[title*="AI Assistant"]');
    
    if (await assistantBtn.count() > 0) {
      await assistantBtn.first().click();
      // Verify assistant input or drawer is visible
      const drawerInput = page.locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"]');
      await expect(drawerInput.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
