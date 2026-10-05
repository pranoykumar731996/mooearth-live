import { test, expect } from '@playwright/test';

test.describe('Phase 1 Virality & Growth Engine E2E Tests', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('mooearth_guide_seen', 'true');
      window.localStorage.setItem('mooearth_install_dismissed', 'true');
    });
  });

  test('should load interactive Daily Earth Challenge and render start button', async ({ page }) => {
    await page.goto('/daily', { timeout: 60000 });

    // Expect heading to be visible
    const heading = page.locator('h1:has-text("Daily Earth Challenge")');
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Expect start button to be visible
    const startBtn = page.locator('#start-daily-challenge-btn');
    await expect(startBtn).toBeVisible({ timeout: 10000 });

    // Click start and verify game begins
    await startBtn.click();

    // Verify first question appears with 4 choices
    const questionText = page.locator('h2');
    await expect(questionText.first()).toBeVisible({ timeout: 10000 });
  });

  test('should load 1v1 Challenge Arena with opponent stats', async ({ page }) => {
    await page.goto('/challenge/daily-20261005?score=5200&time=34&name=Sarah', { timeout: 60000 });

    // Verify challenger name in header / title
    const challengerText = page.locator('text=Sarah Challenged You!');
    await expect(challengerText).toBeVisible({ timeout: 15000 });

    // Verify target score display
    const targetScore = page.locator('text=5,200');
    await expect(targetScore).toBeVisible({ timeout: 10000 });

    // Verify Accept Challenge button
    const acceptBtn = page.locator('#accept-challenge-btn');
    await expect(acceptBtn).toBeVisible({ timeout: 10000 });
  });

  test('should load Embeddable 3D Globe with attribution badge', async ({ page }) => {
    await page.goto('/embed/globe?country=Japan', { timeout: 60000 });

    // Verify Powered by MooEarth Live attribution badge
    const badge = page.locator('#mooearth-embed-badge');
    await expect(badge).toBeVisible({ timeout: 20000 });
    await expect(badge).toHaveAttribute('href', /mooearth\.live/);
  });
});
