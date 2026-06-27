import { test, expect } from '@playwright/test';

test.describe('Suite 14 — API Resilience & Fallback Validation', () => {

  let errors: Error[] = [];

  test.beforeEach(({ page }) => {
    errors = [];
    page.on('pageerror', (err) => {
      errors.push(err);
    });
  });

  test.afterEach(() => {
    // Assert no unhandled runtime exceptions occurred during the test
    expect(errors).toEqual([]);
  });

  test('should handle 500 Server Error gracefully', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Verify navbar status badge changes or app stays functional
    const navbar = page.locator('#navbar');
    await expect(navbar).toBeVisible();
  });

  test('should handle 429 Rate Limit gracefully', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too Many Requests' })
      });
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const navbar = page.locator('#navbar');
    await expect(navbar).toBeVisible();
  });

  test('should handle Timeout / Abort gracefully', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await route.abort('timedout');
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const navbar = page.locator('#navbar');
    await expect(navbar).toBeVisible();
  });

  test('should handle Invalid JSON response gracefully', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"invalid": json'
      });
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const navbar = page.locator('#navbar');
    await expect(navbar).toBeVisible();
  });

  test('should handle Empty response gracefully', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [], status: {} })
      });
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const navbar = page.locator('#navbar');
    await expect(navbar).toBeVisible();
  });

  test('should handle Slow Response (delay) gracefully', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [],
          status: {
            newsActive: true,
            footballActive: true,
            earthCastActive: false
          }
        })
      });
    });

    await page.goto('/');
    // Verify loading spinner or state shows initially
    await page.waitForTimeout(3000);

    const navbar = page.locator('#navbar');
    await expect(navbar).toBeVisible();
  });
});
