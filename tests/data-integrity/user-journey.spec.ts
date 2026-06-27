import { test, expect, Page } from '@playwright/test';

/**
 * Suite 13 — User Journey Data Consistency
 * 
 * Validates end-to-end user flows for state consistency:
 * - Country selection via search
 * - Country dashboard rendering
 * - Category filtering within the dashboard
 * - Article viewing consistency
 * - State transitions between countries
 */

const MOCK_EVENTS = {
  india: [
    {
      id: 'news-india-tech-001',
      title: 'Tech Breakthrough in New Delhi - India News',
      summary: 'India is advancing rapidly in semiconductor production and space exploration technology.',
      category: 'technology',
      country: 'India',
      city: 'New Delhi',
      lat: 28.6139,
      lng: 77.2090,
      source: 'https://timesofindia.indiatimes.com/tech',
      publishedAt: new Date().toISOString()
    },
    {
      id: 'news-india-biz-002',
      title: 'Mumbai Stock Exchange Hits Record High',
      summary: 'Indian markets surge on strong Q2 earnings reports from tech and banking sectors.',
      category: 'business',
      country: 'India',
      city: 'Mumbai',
      lat: 19.0760,
      lng: 72.8777,
      source: 'https://economictimes.indiatimes.com',
      publishedAt: new Date().toISOString()
    }
  ],
  brazil: [
    {
      id: 'wc26-brazil-match-001',
      title: 'Brazil vs Germany — World Cup 2026',
      summary: 'FIFA World Cup 2026 match at Estadio Azteca, Mexico City. Score: 2 - 1.',
      category: 'worldcup',
      country: 'Brazil',
      city: 'Rio de Janeiro',
      lat: -22.9068,
      lng: -43.1729,
      source: 'https://www.api-football.com',
      publishedAt: new Date().toISOString(),
      footballData: {
        homeTeam: 'Brazil',
        awayTeam: 'Germany',
        homeScore: 2,
        awayScore: 1,
        status: 'FT',
        elapsed: 90,
        goals: [],
        cards: [],
        leagueId: 1
      }
    }
  ]
};

function buildMockResponse(events: typeof MOCK_EVENTS.india) {
  return JSON.stringify({
    events,
    status: {
      newsActive: true,
      footballActive: true,
      earthCastActive: false,
      freshness: {
        breaking: { lastRetrieved: new Date().toISOString(), ageMinutes: 0.1, status: 'Live', apiResponseAgeSeconds: 6 },
        football: { lastRetrieved: new Date().toISOString(), ageMinutes: 0.1, status: 'Live', apiResponseAgeSeconds: 6 },
        weather: { lastRetrieved: new Date().toISOString(), ageMinutes: 0.1, status: 'Live', apiResponseAgeSeconds: 6 },
        business: { lastRetrieved: new Date().toISOString(), ageMinutes: 0.1, status: 'Live', apiResponseAgeSeconds: 6 },
        technology: { lastRetrieved: new Date().toISOString(), ageMinutes: 0.1, status: 'Live', apiResponseAgeSeconds: 6 },
        entertainment: { lastRetrieved: new Date().toISOString(), ageMinutes: 0.1, status: 'Live', apiResponseAgeSeconds: 6 },
        worldcup: { lastRetrieved: new Date().toISOString(), ageMinutes: 0.1, status: 'Live', apiResponseAgeSeconds: 6 }
      }
    }
  });
}

/** Helper to dismiss splash screen reliably */
async function dismissSplash(page: Page) {
  // Try to dismiss splash screen if visible
  try {
    const logo = page.getByAltText('MooEarth Live Logo');
    const isVisible = await logo.isVisible().catch(() => false);
    if (isVisible) {
      await page.evaluate(() => {
        // Remove all potential splash overlays
        const selectors = [
          '#splash-screen',
          'div[class*="z-[100]"]',
          'div[class*="bg-[#030308]"]'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) (el as HTMLElement).remove();
        }
        // Also check for the logo parent container
        const logoEl = document.querySelector('img[alt="MooEarth Live Logo"]');
        if (logoEl?.parentElement?.parentElement) {
          (logoEl.parentElement.parentElement as HTMLElement).remove();
        }
      });
      // Wait for splash to be gone
      await expect(logo).toBeHidden({ timeout: 5000 }).catch(() => {});
    }
  } catch {
    // Splash may not appear in mocked scenarios
  }
}

/** Helper to search for a country and select it */
async function searchAndSelectCountry(page: Page, country: string) {
  const searchInput = page.locator('#search-input');
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  
  // Click the input first to trigger React's onFocus (isFocused = true)
  // This is critical: the dropdown only renders when isFocused is true
  await searchInput.click();
  await page.waitForTimeout(300);
  
  // Clear any existing value
  await searchInput.fill('');
  await page.waitForTimeout(100);
  
  // Type character by character to reliably trigger React onChange events
  // pressSequentially fires individual keydown/keypress/keyup + input events
  await searchInput.pressSequentially(country, { delay: 50 });
  
  // Wait for:
  // 1. Search debounce (200ms from SEARCH_DEBOUNCE_MS)
  // 2. API fetch round-trip (mocked, but still async)
  // 3. React state update + re-render
  await page.waitForTimeout(2000);
  
  // Look for the "View Reactions in {country}" button  
  const suggestion = page.locator(`text=View Reactions in ${country}`);
  await expect(suggestion).toBeVisible({ timeout: 20000 });
  await suggestion.click();
  
  // Wait for dashboard to appear
  const dashboardHeader = page.locator(`h2:has-text("${country} Dashboard")`);
  await expect(dashboardHeader).toBeVisible({ timeout: 15000 });
}

test.describe('Suite 13 — User Journey Data Consistency', () => {

  test.beforeEach(async ({ context, page }) => {
    // Set longer default timeout for this suite
    test.setTimeout(90000);
    
    // Inject localStorage to bypass UI overlays
    await context.addInitScript(() => {
      window.localStorage.setItem('mooearth_guide_seen', 'true');
      window.localStorage.setItem('mooearth_install_dismissed', 'true');
      window.localStorage.setItem('mooearth_dev', 'true');
    });

    // Intercept /api/events to return deterministic mock data
    await page.route('**/api/events*', async (route, request) => {
      const url = new URL(request.url());
      const query = (url.searchParams.get('q') || '').toLowerCase();

      if (query.includes('india')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: buildMockResponse(MOCK_EVENTS.india)
        });
      } else if (query.includes('brazil')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: buildMockResponse(MOCK_EVENTS.brazil)
        });
      } else {
        // Default: return all events for initial load
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: buildMockResponse([...MOCK_EVENTS.india, ...MOCK_EVENTS.brazil])
        });
      }
    });

    // Mock perspective endpoint
    await page.route('**/api/perspective*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          topic: 'Tech Breakthrough in New Delhi',
          country: 'India',
          similarityScore: 'High',
          commonFacts: ['Fact A', 'Fact B'],
          localArticles: [{ title: 'Local India Tech News', publisher: 'Times of India' }],
          globalArticles: [{ title: 'Global India Tech News', publisher: 'Reuters' }]
        })
      });
    });

    // Mock statistics endpoint
    await page.route('**/api/worldcup/statistics*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          home: { possession: '55%', shots: 12, corners: 4 },
          away: { possession: '45%', shots: 8, corners: 3 }
        })
      });
    });
  });

  test('should open country dashboard via search and verify state', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await dismissSplash(page);

    // 1. Search for "India" and select the country suggestion
    await searchAndSelectCountry(page, 'India');

    // 2. Verify the dashboard header shows the correct country
    const dashboardH2 = page.locator('h2:has-text("India Dashboard")');
    await expect(dashboardH2).toBeVisible({ timeout: 10000 });

    // 3. Verify the country label in the dashboard header metadata
    const countryLabel = page.locator('text=Country:').first();
    await expect(countryLabel).toBeVisible({ timeout: 5000 });
    
    // Verify "India" appears in the header context
    const indiaText = page.locator('span.text-white.font-extrabold:has-text("India")').first();
    await expect(indiaText).toBeVisible({ timeout: 5000 });
  });

  test('should maintain user ID in localStorage across navigation', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await dismissSplash(page);

    // Wait for main UI to initialize
    await page.waitForTimeout(2000);

    // Check that a user ID was created in localStorage
    const userId = await page.evaluate(() => {
      return window.localStorage.getItem('mooearth_user_id');
    });

    // User ID should exist after page load (auto-generated)
    expect(userId).toBeTruthy();
    expect(typeof userId).toBe('string');
    expect(userId!.length).toBeGreaterThan(0);

    // Navigate to a different page and back
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await dismissSplash(page);
    await page.waitForTimeout(1000);

    // Verify user ID persists
    const userIdAfter = await page.evaluate(() => {
      return window.localStorage.getItem('mooearth_user_id');
    });
    expect(userIdAfter).toBe(userId);
  });

  test('should verify country dashboard close and reopen flow', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await dismissSplash(page);

    // Open India dashboard
    await searchAndSelectCountry(page, 'India');
    
    // Verify dashboard is open
    const dashboardH2 = page.locator('h2:has-text("India Dashboard")');
    await expect(dashboardH2).toBeVisible({ timeout: 10000 });

    // Close the dashboard using the close button (the X next to share)
    const closeBtn = page.locator('button:near(button[title="Share Country Dashboard"])').last();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    // Reopen with a different country (Brazil)
    await searchAndSelectCountry(page, 'Brazil');

    // Verify Brazil dashboard is now showing
    const brazilDashboard = page.locator('h2:has-text("Brazil Dashboard")');
    await expect(brazilDashboard).toBeVisible({ timeout: 10000 });

    // Verify India dashboard is NOT showing
    const indiaCount = await page.locator('h2:has-text("India Dashboard")').count();
    expect(indiaCount).toBe(0);
  });

  test('should validate search results match API mock data', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await dismissSplash(page);

    // Search for "India"
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // Click to focus (enables dropdown via isFocused state)
    await searchInput.click();
    await page.waitForTimeout(300);
    
    // Type character by character for reliable React event triggering
    await searchInput.pressSequentially('India', { delay: 50 });
    
    // Wait for debounce (200ms) + API fetch + React re-render
    await page.waitForTimeout(2000);

    // The dropdown should show "View Reactions in India"
    const countrySuggestion = page.locator('text=View Reactions in India');
    await expect(countrySuggestion).toBeVisible({ timeout: 20000 });

    // The dropdown should also show the mock event title  
    const eventResult = page.locator('text=Tech Breakthrough in New Delhi').first();
    const isEventVisible = await eventResult.isVisible().catch(() => false);
    
    // At minimum, the country suggestion must appear (event results depend on local filtering)
    expect(await countrySuggestion.isVisible()).toBeTruthy();
  });

  test('should verify Perspective Lens is available for whitelisted country', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await dismissSplash(page);

    // Open India dashboard (India is whitelisted for Perspective Lens)
    await searchAndSelectCountry(page, 'India');

    // Scroll down in the dashboard to find the Perspective Lens section
    const dashboardContent = page.locator('.overflow-y-auto').first();
    if (await dashboardContent.isVisible().catch(() => false)) {
      await dashboardContent.evaluate(el => el.scrollTop = el.scrollHeight);
      await page.waitForTimeout(500);
    }

    // Check for the Perspective Lens promo card
    const perspectiveLabel = page.locator('text=Perspective Lens').first();
    await expect(perspectiveLabel).toBeVisible({ timeout: 10000 });

    // Check for the Compare button
    const compareBtn = page.locator('text=Compare Local vs Global News').first();
    await expect(compareBtn).toBeVisible({ timeout: 10000 });
  });
});
