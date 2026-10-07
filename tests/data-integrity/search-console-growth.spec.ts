import { test, expect } from '@playwright/test';
import {
  detectStrikingDistanceQueries,
  detectHighImpressionLowCtr,
  detectNewContentOpportunities,
  detectCountryOpportunities,
  detectLanguageOpportunities,
  detectGamesSearchTraffic,
  detectCitiesSearchTraffic,
  generateSeoGrowthReport,
  SearchConsoleQueryRecord,
  OrganicTelemetryRecord
} from '../../src/lib/seo/searchConsoleGrowthEngine';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 13: SEARCH CONSOLE GROWTH ENGINE', () => {

  // =========================================================================
  // 1. UNIT & ALGORITHM INTEGRITY TESTS (OPPORTUNITY DETECTION)
  // =========================================================================
  test.describe('1. Opportunity Detection Algorithms', () => {
    const sampleQuerySet: SearchConsoleQueryRecord[] = [
      { query: 'live 3d globe map', page: '/globe', country: 'United States', device: 'desktop', clicks: 420, impressions: 3500, ctr: 0.12, position: 2.1 },
      { query: 'daily geography challenge', page: '/games/daily-challenge', country: 'United States', device: 'desktop', clicks: 85, impressions: 2100, ctr: 0.040, position: 7.4 }, // Striking distance (5-20)
      { query: 'world flag quiz online free', page: '/games/flag-quiz', country: 'United Kingdom', device: 'desktop', clicks: 110, impressions: 2800, ctr: 0.039, position: 11.2 }, // Striking distance (5-20)
      { query: 'japan population and facts', page: '/countries/japan', country: 'Japan', device: 'mobile', clicks: 45, impressions: 980, ctr: 0.046, position: 14.8 }, // Striking distance (5-20)
      { query: 'tokyo live weather 3d', page: '/cities/tokyo', country: 'Japan', device: 'mobile', clicks: 32, impressions: 750, ctr: 0.042, position: 8.5 }, // Striking distance, city search
      { query: 'capital cities trivia game', page: '/games/capital-guess', country: 'India', device: 'desktop', clicks: 60, impressions: 1400, ctr: 0.042, position: 6.8 }, // Striking distance, game search
      { query: 'brazil climate live map', page: '/countries/brazil', country: 'Brazil', device: 'desktop', clicks: 12, impressions: 600, ctr: 0.020, position: 18.5 }, // Striking distance
      { query: 'random query out of range', page: '/', country: 'Global', device: 'desktop', clicks: 2, impressions: 50, ctr: 0.04, position: 45.0 } // > 20 position
    ];

    test('detectStrikingDistanceQueries isolates queries ranking between 5.0 and 20.0', () => {
      const striking = detectStrikingDistanceQueries(sampleQuerySet);
      expect(striking.length).toBeGreaterThan(0);
      striking.forEach(item => {
        expect(item.currentPosition).toBeGreaterThanOrEqual(5.0);
        expect(item.currentPosition).toBeLessThanOrEqual(20.0);
        expect(item.priority).toBeDefined();
        expect(item.actionableStep).toBeTruthy();
        expect(item.estimatedTop3Clicks).toBeGreaterThan(0);
      });

      // Verify sorted by impressions descending (highest opportunity first)
      for (let i = 0; i < striking.length - 1; i++) {
        expect(striking[i].impressions).toBeGreaterThanOrEqual(striking[i + 1].impressions);
      }
    });

    test('detectHighImpressionLowCtr isolates high-impression queries with CTR under 3%', () => {
      const pagesToImprove = detectHighImpressionLowCtr(sampleQuerySet, 0.03);
      expect(pagesToImprove.length).toBeGreaterThanOrEqual(1);
      pagesToImprove.forEach(item => {
        expect(item.impressions).toBeGreaterThanOrEqual(50);
        expect(item.issue).toBeTruthy();
        expect(item.suggestedTitle).toBeTruthy();
        expect(item.suggestedMetaDescription).toBeTruthy();
      });
    });

    test('detectNewContentOpportunities provides high-intent content expansion targets', () => {
      const newContent = detectNewContentOpportunities(sampleQuerySet);
      expect(newContent.length).toBeGreaterThanOrEqual(5);
      newContent.forEach(item => {
        expect(item.topic).toBeTruthy();
        expect(item.suggestedSlug).toContain('/');
        expect(item.targetIntent).toBeTruthy();
        expect(item.targetCategory).toBeTruthy();
        expect(item.estimatedDemand).toBeDefined();
      });
    });

    test('detectCountryOpportunities ranks fastest growing markets with language tags', () => {
      const countryOpps = detectCountryOpportunities(sampleQuerySet);
      expect(countryOpps.length).toBeGreaterThanOrEqual(5);
      countryOpps.forEach(opp => {
        expect(opp.countryCode).toBeTruthy();
        expect(opp.growthRatePercent).toBeGreaterThan(0);
        expect(opp.recommendedAction).toBeTruthy();
      });
      // Check sorting by growth rate
      for (let i = 0; i < countryOpps.length - 1; i++) {
        expect(countryOpps[i].growthRatePercent).toBeGreaterThanOrEqual(countryOpps[i + 1].growthRatePercent);
      }
    });

    test('detectLanguageOpportunities covers global priority languages', () => {
      const langOpps = detectLanguageOpportunities(sampleQuerySet);
      expect(langOpps.length).toBeGreaterThanOrEqual(7);
      const locales = langOpps.map(l => l.locale);
      ['es', 'fr', 'pt', 'ja', 'hi', 'de', 'ar'].forEach(locale => {
        expect(locales).toContain(locale);
      });
    });

    test('detectGamesSearchTraffic detects queries targeting game modes', () => {
      const gameTraffic = detectGamesSearchTraffic(sampleQuerySet);
      expect(gameTraffic.length).toBeGreaterThanOrEqual(2);
      gameTraffic.forEach(item => {
        expect(item.gameId).toBeTruthy();
        expect(item.gameTitle).toBeTruthy();
        expect(item.gameConversionRate).toBeGreaterThan(0);
      });
    });

    test('detectCitiesSearchTraffic detects queries targeting world cities', () => {
      const cityTraffic = detectCitiesSearchTraffic(sampleQuerySet);
      expect(cityTraffic.length).toBeGreaterThanOrEqual(1);
      expect(cityTraffic[0].cityName).toBe('Tokyo');
      expect(cityTraffic[0].intent).toBeTruthy();
    });

    test('Rule verification: never fabricate Search Console data flag is enforced', () => {
      const report = generateSeoGrowthReport([], []);
      expect(report.summary.indexedPagesCount).toBeGreaterThanOrEqual(921); // Real verified SSG page count
      expect(report.summary.connectionStatus).toBe('AWAITING_CREDENTIALS');
      expect(report.summary.connectionMessage).toContain('Awaiting Google Search Console Service Account');
      expect(report.summary.lastUpdated).toBeTruthy();
    });
  });

  // =========================================================================
  // 2. API ENDPOINT RESILIENCE & DATA ACCURACY
  // =========================================================================
  test.describe('2. Admin SEO API Endpoints', () => {
    test('GET /api/admin/seo-report returns 200 with complete report structure', async ({ request }) => {
      const response = await request.get('/api/admin/seo-report');
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.summary).toBeDefined();
      expect(data.summary.indexedPagesCount).toBeGreaterThanOrEqual(921);
      expect(data.summary.connectionStatus).toBeDefined();

      // Verify all 5 mandated opportunity categories exist in JSON payload
      expect(data.topOpportunities).toBeInstanceOf(Array);
      expect(data.pagesToImprove).toBeInstanceOf(Array);
      expect(data.newContentOpportunities).toBeInstanceOf(Array);
      expect(data.countryOpportunities).toBeInstanceOf(Array);
      expect(data.languageOpportunities).toBeInstanceOf(Array);

      // Verify games and cities search tracking
      expect(data.gamesSearchTelemetry).toBeInstanceOf(Array);
      expect(data.citiesSearchTelemetry).toBeInstanceOf(Array);
    });

    test('POST /api/admin/seo-report accepts organic telemetry events', async ({ request }) => {
      const telemetryEvent: OrganicTelemetryRecord = {
        referrer: 'https://www.google.com/search?q=interactive+3d+world+map',
        searchEngine: 'google',
        landingPage: '/games/daily-challenge',
        query: 'interactive 3d world map',
        country: 'United States',
        language: 'en-US',
        device: 'desktop',
        pageType: 'game',
        isReturnUser: true,
        playedGame: true,
        sharedContent: false,
        timestamp: Date.now()
      };

      const response = await request.post('/api/admin/seo-report', {
        data: telemetryEvent
      });
      expect(response.status()).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
    });

    test('GET /api/admin/seo-export?format=markdown exports complete structured report', async ({ request }) => {
      const response = await request.get('/api/admin/seo-export?format=markdown');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/markdown');

      const markdown = await response.text();
      expect(markdown).toContain('MOOEARTH LIVE — GLOBAL SEO SEARCH CONSOLE GROWTH REPORT');
      expect(markdown).toContain('1. TOP OPPORTUNITIES (STRIKING DISTANCE: POSITIONS 5–20)');
      expect(markdown).toContain('2. PAGES TO IMPROVE');
      expect(markdown).toContain('3. NEW CONTENT OPPORTUNITIES');
      expect(markdown).toContain('4. COUNTRY OPPORTUNITIES');
      expect(markdown).toContain('5. LANGUAGE OPPORTUNITIES');
      expect(markdown).toContain('6. GAMES RECEIVING SEARCH TRAFFIC');
      expect(markdown).toContain('7. CITIES RECEIVING SEARCH TRAFFIC');
    });
  });

  // =========================================================================
  // 3. ADMIN SEO DASHBOARD UI VERIFICATION (/admin/seo)
  // =========================================================================
  test.describe('3. Admin SEO Dashboard UI (/admin/seo)', () => {
    test('Dashboard loads with 200 OK, single H1, and authentic status badge', async ({ page }) => {
      const response = await page.goto('/admin/seo');
      expect(response?.status()).toBe(200);

      // Wait for client fetch to complete and H1 to be visible
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Verify single H1
      const h1Count = await h1.count();
      expect(h1Count).toBe(1);
      const h1Text = await h1.textContent();
      expect(h1Text).toContain('Search Console Intelligence');

      // Verify GSC connection badge
      const statusBadge = page.locator('[data-testid="gsc-connection-badge"]');
      await expect(statusBadge).toBeVisible();
      const statusText = await statusBadge.textContent();
      expect(statusText).toMatch(/(CONNECTED|AWAITING_CREDENTIALS)/);
    });

    test('Displays all 6 Core Performance KPI cards including 921 indexed pages', async ({ page }) => {
      await page.goto('/admin/seo');

      await expect(page.locator('[data-testid="kpi-indexed-pages"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-organic-visitors"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-impressions"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-clicks"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-avg-position"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-game-conversion"]')).toBeVisible();

      // Check indexed pages value shows >= 921
      const indexedPagesText = await page.locator('[data-testid="kpi-indexed-pages"]').textContent();
      expect(Number(indexedPagesText?.replace(/\D/g, ''))).toBeGreaterThanOrEqual(921);
    });

    test('Displays all 5 required opportunity detection sections', async ({ page }) => {
      await page.goto('/admin/seo');

      // 1. TOP OPPORTUNITIES
      const topOpps = page.locator('[data-testid="top-opportunities"]');
      await expect(topOpps).toBeVisible();
      const topOppsText = await topOpps.textContent();
      expect(topOppsText).toContain('TOP OPPORTUNITIES');

      // 2. PAGES TO IMPROVE
      const pagesToImprove = page.locator('[data-testid="pages-to-improve"]');
      await expect(pagesToImprove).toBeVisible();
      const pagesText = await pagesToImprove.textContent();
      expect(pagesText).toContain('PAGES TO IMPROVE');

      // 3. NEW CONTENT OPPORTUNITIES
      const newContent = page.locator('[data-testid="new-content-opportunities"]');
      await expect(newContent).toBeVisible();
      const newContentText = await newContent.textContent();
      expect(newContentText).toContain('NEW CONTENT OPPORTUNITIES');

      // 4. COUNTRY OPPORTUNITIES
      const countryOpps = page.locator('[data-testid="country-opportunities"]');
      await expect(countryOpps).toBeVisible();
      const countryText = await countryOpps.textContent();
      expect(countryText).toContain('COUNTRY OPPORTUNITIES');

      // 5. LANGUAGE OPPORTUNITIES
      const langOpps = page.locator('[data-testid="language-opportunities"]');
      await expect(langOpps).toBeVisible();
      const langText = await langOpps.textContent();
      expect(langText).toContain('LANGUAGE OPPORTUNITIES');
    });

    test('Displays Games and Cities search traffic analytics panels', async ({ page }) => {
      await page.goto('/admin/seo');

      const gamesPanel = page.locator('[data-testid="games-search-traffic"]');
      await expect(gamesPanel).toBeVisible();

      const citiesPanel = page.locator('[data-testid="cities-search-traffic"]');
      await expect(citiesPanel).toBeVisible();
    });

    test('Export Report button is present and links to export endpoint', async ({ page }) => {
      await page.goto('/admin/seo');

      const exportBtn = page.locator('text=Export Report (.md)');
      await expect(exportBtn).toBeVisible();
      const href = await exportBtn.getAttribute('href');
      expect(href).toContain('/api/admin/seo-export?format=markdown');
    });
  });
});
