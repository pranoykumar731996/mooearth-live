import { test, expect } from '@playwright/test';

test.describe('MOOEARTH LIVE — SEO PHASE 1: TECHNICAL SEO & INDEXING FOUNDATION', () => {

  // =========================================================================
  // 1. ROBOTS.TXT VERIFICATION
  // =========================================================================
  test('Robots.txt: returns 200, allows public SEO routes, disallows private routes, declares sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);

    const text = await response.text();

    // User-agent directive
    expect(text).toContain('User-Agent: *');

    // Public SEO routes must be allowed
    const requiredAllows = [
      'Allow: /',
      'Allow: /globe',
      'Allow: /world-map',
      'Allow: /countries',
      'Allow: /games',
      'Allow: /news',
      'Allow: /weather',
      'Allow: /explore',
      'Allow: /daily',
      'Allow: /challenges',
      'Allow: /tournament',
      'Allow: /war-room',
    ];

    for (const allowRule of requiredAllows) {
      expect(text).toContain(allowRule);
    }

    // Private areas must be disallowed
    const requiredDisallows = [
      'Disallow: /admin/',
      'Disallow: /api/',
      'Disallow: /auth/',
      'Disallow: /account/',
      'Disallow: /debug/',
      'Disallow: /private/',
    ];

    for (const disallowRule of requiredDisallows) {
      expect(text).toContain(disallowRule);
    }

    // Canonical Sitemap declaration
    expect(text).toContain('Sitemap: https://www.mooearth.live/sitemap.xml');
  });

  // =========================================================================
  // 2. SITEMAP.XML VERIFICATION
  // =========================================================================
  test('Sitemap.xml: returns 200, valid XML, only canonical 200 URLs, no private or embed URLs', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const xml = await response.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('</urlset>');

    // Extract all loc URLs
    const locMatches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
    expect(locMatches.length).toBeGreaterThan(15);

    const urls = locMatches.map(m => m.replace(/<\/?loc>/g, '').trim());

    // Check every URL uses canonical hostname https://www.mooearth.live
    for (const url of urls) {
      expect(url.startsWith('https://www.mooearth.live')).toBeTruthy();
      expect(url.includes('http://')).toBeFalsy();
      expect(url.includes('https://mooearth.live/')).toBeFalsy(); // No apex non-www
    }

    // Must NOT contain embed widget or private paths
    expect(xml).not.toContain('/embed/');
    expect(xml).not.toContain('/admin/');
    expect(xml).not.toContain('/api/');
    expect(xml).not.toContain('/auth/');
    expect(xml).not.toContain('/debug/');
    expect(xml).not.toContain('/private/');
    expect(xml).not.toContain('/challenge/'); // No private challenge URLs

    // Must contain core public hubs
    const requiredUrls = [
      'https://www.mooearth.live',
      'https://www.mooearth.live/explore',
      'https://www.mooearth.live/games',
      'https://www.mooearth.live/daily',
      'https://www.mooearth.live/news',
      'https://www.mooearth.live/sports',
      'https://www.mooearth.live/weather',
      'https://www.mooearth.live/business',
      'https://www.mooearth.live/technology',
      'https://www.mooearth.live/challenges',
      'https://www.mooearth.live/tournament',
      'https://www.mooearth.live/trending',
      'https://www.mooearth.live/about',
      'https://www.mooearth.live/privacy',
      'https://www.mooearth.live/terms',
    ];

    for (const reqUrl of requiredUrls) {
      expect(urls).toContain(reqUrl);
    }

    // Deduplication check: every URL must be unique
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });

  // =========================================================================
  // 3. HOMEPAGE INDEXABILITY & METADATA
  // =========================================================================
  test('Homepage: returns 200, indexable, canonical tag, meta description, single H1, structured data', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'load' });
    expect(response?.status()).toBe(200);

    // Title
    const title = await page.title();
    expect(title).toContain('MooEarth Live');

    // Canonical tag (must be absolute https://www.mooearth.live)
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://www.mooearth.live');

    // Meta Description
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveCount(1);
    const descContent = await metaDesc.getAttribute('content');
    expect(descContent).toBeTruthy();
    expect(descContent!.length).toBeGreaterThan(20);

    // No accidental noindex
    const robotsMeta = page.locator('meta[name="robots"]');
    if (await robotsMeta.count() > 0) {
      const robotsContent = await robotsMeta.getAttribute('content');
      expect(robotsContent).not.toContain('noindex');
    }

    // Single logical H1
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    const h1Text = await h1Elements.first().textContent();
    expect(h1Text).toContain('MooEarth Live');

    // Server-rendered crawlable semantic content section
    const semanticSection = page.locator('section[aria-label="About MooEarth Live"]');
    await expect(semanticSection).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/explore"]')).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/news"]')).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/games"]')).toHaveCount(1);

    // Organization and WebSite JSON-LD structured data
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasOrg = jsonLdScripts.some(t => t.includes('"@type":"Organization"') && t.includes('https://www.mooearth.live'));
    const hasWebSite = jsonLdScripts.some(t => t.includes('"@type":"WebSite"') && t.includes('https://www.mooearth.live'));
    expect(hasOrg).toBeTruthy();
    expect(hasWebSite).toBeTruthy();
  });

  // =========================================================================
  // 4. CANONICAL CONSISTENCY ACROSS PUBLIC HUBS
  // =========================================================================
  test('Canonical Consistency: all public hubs use absolute https://www.mooearth.live URLs', async ({ page }) => {
    const hubTests = [
      { path: '/explore', expectedCanonical: 'https://www.mooearth.live/explore' },
      { path: '/news', expectedCanonical: 'https://www.mooearth.live/news' },
      { path: '/sports', expectedCanonical: 'https://www.mooearth.live/sports' },
      { path: '/weather', expectedCanonical: 'https://www.mooearth.live/weather' },
      { path: '/business', expectedCanonical: 'https://www.mooearth.live/business' },
      { path: '/technology', expectedCanonical: 'https://www.mooearth.live/technology' },
      { path: '/games', expectedCanonical: 'https://www.mooearth.live/games' },
      { path: '/daily', expectedCanonical: 'https://www.mooearth.live/daily' },
      { path: '/challenges', expectedCanonical: 'https://www.mooearth.live/challenges' },
      { path: '/tournament', expectedCanonical: 'https://www.mooearth.live/tournament' },
      { path: '/war-room', expectedCanonical: 'https://www.mooearth.live/war-room' },
      { path: '/trending', expectedCanonical: 'https://www.mooearth.live/trending' },
      { path: '/about', expectedCanonical: 'https://www.mooearth.live/about' },
      { path: '/privacy', expectedCanonical: 'https://www.mooearth.live/privacy' },
      { path: '/terms', expectedCanonical: 'https://www.mooearth.live/terms' },
    ];

    for (const { path, expectedCanonical } of hubTests) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', expectedCanonical);
    }
  });

  // =========================================================================
  // 5. REDIRECTS (LEGACY PATHS & ALIASES)
  // =========================================================================
  test('Redirects: legacy aliases return permanent 308 redirects to 200 destinations', async ({ request }) => {
    const redirectTests = [
      { source: '/country', target: '/explore' },
      { source: '/countries', target: '/explore' },
      { source: '/globe', target: '/' },
      { source: '/world-map', target: '/explore' },
      { source: '/challenge', target: '/challenges' },
    ];

    for (const { source, target } of redirectTests) {
      const response = await request.get(source, { maxRedirects: 0 });
      // Next.js permanent redirect status is 308
      expect(response.status()).toBe(308);
      const location = response.headers()['location'];
      expect(location).toBe(target);
    }
  });

  // =========================================================================
  // 6. TECHNICAL SEO AUDIT: EMBED WIDGET NOINDEX
  // =========================================================================
  test('Embed widget: /embed/globe has noindex metadata to prevent iframe indexing', async ({ page }) => {
    const response = await page.goto('/embed/globe', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveCount(1);
    const content = await robotsMeta.getAttribute('content');
    expect(content).toContain('noindex');
  });

  // =========================================================================
  // 7. INTERNAL LINKS HEALTH CHECK
  // =========================================================================
  test('Internal links: all primary navigation targets respond with 200 OK', async ({ request }) => {
    const routes = [
      '/',
      '/explore',
      '/news',
      '/sports',
      '/weather',
      '/business',
      '/technology',
      '/games',
      '/daily',
      '/challenges',
      '/tournament',
      '/party',
      '/war-room',
      '/trending',
      '/about',
      '/contact',
      '/privacy',
      '/terms',
    ];

    for (const route of routes) {
      const res = await request.get(route);
      expect(res.status()).toBe(200);
    }
  });
});
