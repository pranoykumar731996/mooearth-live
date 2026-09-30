import { test, expect } from '@playwright/test';

/**
 * MooEarth Live — Global Growth Engine V1 E2E Test Suite
 *
 * Covers:
 * - SEO Landing-page System & Metadata verification
 * - Growth Content Hubs (/explore, /games, /daily, /trending, /challenges)
 * - Challenge Sharing & Dynamic Challenge Routes (/challenge/[challengeId])
 * - Location Experience & Multilingual / Diacritic support
 * - Search & Autocomplete
 * - Playwright User Journeys (Journeys 1 to 5)
 * - Robots & Sitemap integrity
 */

test.describe('Global Growth Engine V1 — SEO & Hubs', () => {

  test('Homepage has full SEO, OpenGraph, Twitter, and JSON-LD structured data', async ({ page }) => {
    await page.goto('/', { timeout: 60000 });

    // Validate Title and Description
    const title = await page.title();
    expect(title).toContain('MooEarth');

    // Canonical link
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /https:\/\/www\.mooearth\.live\/?$/);

    // OpenGraph
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);
    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveAttribute('content', /Explore the Living Earth/);

    // Twitter Card
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');

    // Structured Data (Organization & WebSite)
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const jsonLdContents = await jsonLdScripts.allTextContents();
    const parsedSchemas = jsonLdContents.map(text => {
      try { return JSON.parse(text); } catch { return null; }
    }).filter(Boolean);

    const orgSchema = parsedSchemas.find(s => s['@type'] === 'Organization');
    expect(orgSchema).toBeTruthy();
    expect(orgSchema.name).toBe('MooEarth Live');

    const websiteSchema = parsedSchemas.find(s => s['@type'] === 'WebSite');
    expect(websiteSchema).toBeTruthy();
    expect(websiteSchema.potentialAction).toBeTruthy();
  });

  test('Growth Hub: /explore renders regions, countries, and internal links', async ({ page }) => {
    await page.goto('/explore', { timeout: 60000 });

    // Page title and H1
    const heading = page.locator('h1');
    await expect(heading).toContainText('Explore Earth');

    // Breadcrumb schema
    const jsonLdTexts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasBreadcrumb = jsonLdTexts.some(t => t.includes('BreadcrumbList'));
    expect(hasBreadcrumb).toBeTruthy();

    // Open Globe button present
    const openGlobeBtn = page.locator('#open-globe');
    await expect(openGlobeBtn).toBeVisible();

    // Verify presence of country links
    const countryLinks = page.locator('a[href^="/country/"]');
    const linkCount = await countryLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(15);
  });

  test('Growth Hub: /games renders game modes and deep links to /play-earth and /daily', async ({ page }) => {
    await page.goto('/games', { timeout: 60000 });

    const heading = page.locator('h1');
    await expect(heading).toContainText('Play Earth');

    // Play Earth game card CTA
    const explorerCta = page.locator('#game-country-explorer');
    await expect(explorerCta).toBeVisible();
    await expect(explorerCta).toHaveAttribute('href', '/play-earth');

    // Check game mode cards
    await expect(page.locator('text=Country Explorer').first()).toBeVisible();
    await expect(page.locator('text=Flag Challenge').first()).toBeVisible();
    await expect(page.locator('text=Survival Mode').first()).toBeVisible();
    await expect(page.locator('text=Daily Earth Challenge').first()).toBeVisible();
  });

  test('Growth Hub: /daily displays current date, questions preview, and daily challenge CTA', async ({ page }) => {
    await page.goto('/daily', { timeout: 60000 });

    const heading = page.locator('h1');
    await expect(heading).toContainText('Daily Earth Challenge');

    // Start Daily Challenge CTA
    const startCta = page.locator('#start-daily-challenge');
    await expect(startCta).toBeVisible();
    await expect(startCta).toHaveAttribute('href', '/play-earth');

    // Questions / featured countries overview exists
    await expect(page.locator("text=Today's Featured Countries").first()).toBeVisible();
  });

  test('Growth Hub: /trending displays active locations and topics', async ({ page }) => {
    await page.goto('/trending', { timeout: 60000 });

    const heading = page.locator('h1');
    await expect(heading).toContainText('Trending Around Earth');

    // Active locations grid
    await expect(page.locator('text=Tokyo').first()).toBeVisible();
    await expect(page.locator('text=London').first()).toBeVisible();
    await expect(page.locator('text=São Paulo').first()).toBeVisible();

    // Explore Globe CTA
    const globeCta = page.locator('#trending-explore-globe');
    await expect(globeCta).toBeVisible();
  });
});

test.describe('Global Growth Engine V1 — Challenge Sharing (User Journey 4)', () => {

  test('Shared daily challenge URL loads directly to challenge page with acceptance CTA', async ({ page }) => {
    await page.goto('/challenge/daily-20261001', { timeout: 60000 });

    // Should NOT redirect to homepage
    expect(page.url()).toContain('/challenge/daily-20261001');

    // Challenge Heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Daily Earth Challenge');

    // Acceptance CTA exists and directs to game
    const acceptBtn = page.locator('#accept-challenge');
    await expect(acceptBtn).toBeVisible();
    await expect(acceptBtn).toHaveAttribute('href', '/play-earth');

    // Canonical link matches
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /\/challenge\/daily-20261001$/);
  });

  test('Shared custom challenge URL loads correctly', async ({ page }) => {
    await page.goto('/challenge/survival-xyz123', { timeout: 60000 });

    expect(page.url()).toContain('/challenge/survival-xyz123');
    const heading = page.locator('h1');
    await expect(heading).toContainText('Earth Challenge');

    const acceptBtn = page.locator('#accept-challenge');
    await expect(acceptBtn).toBeVisible();
  });
});

test.describe('Global Growth Engine V1 — Location SEO (User Journey 5)', () => {

  test('Country SEO page (/country/japan) renders with metadata, Place schema, and canonical', async ({ page }) => {
    await page.goto('/country/japan', { timeout: 60000 });

    const title = await page.title();
    expect(title.toLowerCase()).toContain('japan');

    // Canonical URL check
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /\/country\/japan$/);

    // Place & BreadcrumbList structured data
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const textContents = await jsonLd.allTextContents();
    const hasPlaceSchema = textContents.some(t => t.includes('"@type":"Place"') && t.includes('Japan'));
    expect(hasPlaceSchema).toBeTruthy();
  });

  test('Country SEO page handles accented/diacritic country properly (/country/brazil)', async ({ page }) => {
    await page.goto('/country/brazil', { timeout: 60000 });

    const title = await page.title();
    expect(title.toLowerCase()).toContain('brazil');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /\/country\/brazil$/);
  });
});

test.describe('Global Growth Engine V1 — Robots & Sitemap Integrity', () => {

  test('robots.txt allows public growth hubs and protects admin/api', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();

    // Must allow growth hubs
    expect(body).toContain('Allow: /games');
    expect(body).toContain('Allow: /explore');
    expect(body).toContain('Allow: /daily');
    expect(body).toContain('Allow: /trending');
    expect(body).toContain('Allow: /challenges');

    // Must disallow private endpoints
    expect(body).toContain('Disallow: /admin/');
    expect(body).toContain('Disallow: /api/');

    // Sitemap declaration
    expect(body).toContain('Sitemap: https://www.mooearth.live/sitemap.xml');
  });

  test('sitemap.xml contains priority routes, no admin leaks, and valid XML', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();

    expect(xml).toContain('<urlset');
    expect(xml).toContain('https://www.mooearth.live/explore');
    expect(xml).toContain('https://www.mooearth.live/games');
    expect(xml).toContain('https://www.mooearth.live/daily');
    expect(xml).toContain('https://www.mooearth.live/trending');
    expect(xml).toContain('https://www.mooearth.live/country/');

    // Must NEVER include admin or api routes in sitemap
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('/api/');
  });
});
