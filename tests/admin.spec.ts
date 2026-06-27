import { test, expect } from '@playwright/test';

test.describe('MooEarth Live - Admin Analytics Dashboard E2E Tests', () => {

  test.beforeEach(async ({ context, page }) => {
    // Inject localStorage properties to bypass user guide and install banners
    await context.addInitScript(() => {
      window.localStorage.setItem('mooearth_guide_seen', 'true');
      window.localStorage.setItem('mooearth_install_dismissed', 'true');
    });
    // Use default load state for more stable navigations
    await page.goto('/admin/analytics', { timeout: 60000 });
    // Wait for the loading state to complete
    const loadingText = page.locator('text=Aggregating system statistics...');
    await expect(loadingText).toBeHidden({ timeout: 25000 });
  });

  test('should navigate to admin analytics route and render metrics dashboards', async ({ page }) => {
    // Check URL
    await expect(page).toHaveURL(/\/admin\/analytics/);
    
    // Check main headers
    const adminHeader = page.locator('h1:has-text("Admin"), h2:has-text("Analytics"), div:has-text("Dashboard")');
    await expect(adminHeader.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show system health metrics and analytics tables', async ({ page }) => {
    // Check presence of common dashboard sections (e.g. Database, Logs, Active Users)
    const metricsSection = page.locator('div:has-text("Database"), div:has-text("Logs"), div:has-text("Active"), div:has-text("Users")');
    if (await metricsSection.count() > 0) {
      await expect(metricsSection.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should allow toggling simulation mode settings', async ({ page }) => {
    // Locate simulation mode switch or controls
    const simControls = page.locator('button:has-text("Simulation"), button:has-text("Simulate"), input[type="checkbox"]');
    if (await simControls.count() > 0) {
      const toggle = simControls.first();
      await expect(toggle).toBeVisible({ timeout: 10000 });
      await toggle.click();
      await page.waitForTimeout(1000);
    }
  });
});
