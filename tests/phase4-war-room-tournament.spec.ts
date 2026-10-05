import { test, expect } from '@playwright/test';

test.describe('Phase 4: War Room Event Surges & Global Nations Tournament', () => {

  test('War Room (/war-room) loads live situation room and tactical telemetry', async ({ page }) => {
    await page.goto('/war-room');
    await expect(page).toHaveTitle(/War Room/);

    // Verify Situation Room Header & Telemetry
    await expect(page.locator('text=WAR ROOM')).toBeVisible();
    await expect(page.locator('text=LIVE SITUATION')).toBeVisible();
    await expect(page.locator('text=/\\d+ OBSERVERS/').first()).toBeVisible();

    // Verify Megathread Copy Button
    const copyBtn = page.locator('button:has-text("Copy Megathread Dispatch")');
    await expect(copyBtn).toBeVisible();

    // Verify Active Hotspots Switcher
    const hotspotList = page.locator('text=Active World Hotspots');
    await expect(hotspotList).toBeVisible();
  });

  test('Dynamic War Room Event (/war-room/evt-002) focuses on specific hotspot', async ({ page }) => {
    await page.goto('/war-room/evt-002');
    await expect(page).toHaveTitle(/India/);
    await expect(page.locator('h1')).toContainText('India');
  });

  test('Global Nations Cup (/tournament) loads roster and Nations Leaderboard', async ({ page }) => {
    await page.goto('/tournament');
    await expect(page).toHaveTitle(/Global Nations Cup/);

    // Verify Championship Header
    await expect(page.locator('text=The Global Nations Cup')).toBeVisible();
    await expect(page.locator('text=Live Nations Leaderboard')).toBeVisible();

    // Enter Call-sign
    const callsignInput = page.locator('input[placeholder*="CaptainAtlas"]');
    await expect(callsignInput).toBeVisible();
    await callsignInput.fill('AtlasPrime');

    // Launch Championship
    const launchBtn = page.locator('button:has-text("Launch Championship")');
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Verify Playing view: Question 1 of 10 and 10s timer
    await expect(page.locator('text=Question 1 of 10')).toBeVisible();
    await expect(page.locator('text=10s').or(page.locator('text=9s'))).toBeVisible();
  });

});
