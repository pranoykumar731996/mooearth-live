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
    expect(title).toBe('MooEarth Live — Interactive 3D Globe & World Explorer');

    // Canonical tag (must be absolute https://www.mooearth.live)
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://www.mooearth.live');

    // Meta Description
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveCount(1);
    const descContent = await metaDesc.getAttribute('content');
    expect(descContent).toBeTruthy();
    expect(descContent!.length).toBeGreaterThan(50);
    expect(descContent).toContain('MooEarth Live');

    // No accidental noindex
    const robotsMeta = page.locator('meta[name="robots"]');
    if (await robotsMeta.count() > 0) {
      const robotsContent = await robotsMeta.getAttribute('content');
      expect(robotsContent).not.toContain('noindex');
    }

    // Single logical H1 communicating interactive 3D Earth / world exploration
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    const h1Text = await h1Elements.first().textContent();
    expect(h1Text).toBe('MooEarth Live — Interactive 3D Earth & World Exploration');

    // Server-rendered crawlable semantic content section
    const semanticSection = page.locator('section[aria-label="About MooEarth Live"]');
    await expect(semanticSection).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/explore"]')).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/news"]')).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/games"]')).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/about"]')).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/contact"]')).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/privacy"]')).toHaveCount(1);
    await expect(semanticSection.locator('a[href="/terms"]')).toHaveCount(1);

    // Natural Brand entity occurrences in server-rendered content
    const sectionText = await semanticSection.textContent();
    expect(sectionText).toContain('MooEarth Live');
    expect(sectionText).toContain('MooEarth');
    expect(sectionText).toContain('Moo Earth');

    // Organization, WebSite, and WebPage JSON-LD structured data
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasOrg = jsonLdScripts.some(t => t.includes('"@type":"Organization"') && t.includes('MooEarth Live') && t.includes('Moo Earth'));
    const hasWebSite = jsonLdScripts.some(t => t.includes('"@type":"WebSite"') && t.includes('MooEarth Live') && t.includes('Moo Earth'));
    const hasWebPage = jsonLdScripts.some(t => t.includes('"@type":"WebPage"') && t.includes('MooEarth Live'));
    expect(hasOrg).toBeTruthy();
    expect(hasWebSite).toBeTruthy();
    expect(hasWebPage).toBeTruthy();

    // Verify factual information: NO invented ratings, aggregateRating, or review in schema
    for (const jsonText of jsonLdScripts) {
      expect(jsonText).not.toContain('aggregateRating');
      expect(jsonText).not.toContain('"ratingValue"');
      expect(jsonText).not.toContain('"reviewCount"');
    }
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

  // =========================================================================
  // 8. PHASE 2: OPEN GRAPH & SOCIAL METADATA
  // =========================================================================
  test('Open Graph & Twitter Cards: Homepage, 3D Globe, and World Map have valid metadata', async ({ page }) => {
    // 1. Homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const ogTitleHome = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescHome = await page.locator('meta[property="og:description"]').getAttribute('content');
    const ogUrlHome = await page.locator('meta[property="og:url"]').getAttribute('content');
    const ogImageHome = await page.locator('meta[property="og:image"]').getAttribute('content');
    const twitterCardHome = await page.locator('meta[name="twitter:card"]').getAttribute('content');

    expect(ogTitleHome).toBe('MooEarth Live — Interactive 3D Globe & World Explorer');
    expect(ogDescHome).toBeTruthy();
    expect(ogUrlHome).toBe('https://www.mooearth.live');
    expect(ogImageHome).toContain('/icons/icon-512.png');
    expect(twitterCardHome).toBe('summary_large_image');

    // 2. Globe (/play-earth)
    await page.goto('/play-earth', { waitUntil: 'domcontentloaded' });
    const ogTitleGlobe = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogUrlGlobe = await page.locator('meta[property="og:url"]').getAttribute('content');
    const ogImageGlobe = await page.locator('meta[property="og:image"]').getAttribute('content');

    expect(ogTitleGlobe).toContain('Interactive 3D Globe');
    expect(ogUrlGlobe).toBe('https://www.mooearth.live/play-earth');
    expect(ogImageGlobe).toContain('/icons/icon-512.png');

    // 3. World Map (/explore)
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    const ogTitleMap = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogUrlMap = await page.locator('meta[property="og:url"]').getAttribute('content');
    const ogImageMap = await page.locator('meta[property="og:image"]').getAttribute('content');

    expect(ogTitleMap).toContain('Interactive World Map');
    expect(ogUrlMap).toBe('https://www.mooearth.live/explore');
    expect(ogImageMap).toContain('/icons/icon-512.png');
  });

  // =========================================================================
  // 9. PHASE 2: TRUST PAGES METADATA & INTEGRITY
  // =========================================================================
  test('Trust Pages: /about, /contact, /privacy, /terms are complete, indexable, and branded', async ({ page }) => {
    const trustPages = [
      {
        path: '/about',
        expectedTitle: 'About Us | MooEarth Live',
        h1Substring: 'About',
        expectedCanonical: 'https://www.mooearth.live/about',
      },
      {
        path: '/contact',
        expectedTitle: 'Contact Us | MooEarth Live',
        h1Substring: 'Contact',
        expectedCanonical: 'https://www.mooearth.live/contact',
      },
      {
        path: '/privacy',
        expectedTitle: 'Privacy Policy | MooEarth Live',
        h1Substring: 'Privacy Policy',
        expectedCanonical: 'https://www.mooearth.live/privacy',
      },
      {
        path: '/terms',
        expectedTitle: 'Terms of Service | MooEarth Live',
        h1Substring: 'Terms of Service',
        expectedCanonical: 'https://www.mooearth.live/terms',
      },
    ];

    for (const trustPage of trustPages) {
      const response = await page.goto(trustPage.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);

      const title = await page.title();
      expect(title).toBe(trustPage.expectedTitle);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(trustPage.expectedCanonical);

      const h1Text = await page.locator('h1').textContent();
      expect(h1Text).toContain(trustPage.h1Substring);

      const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(metaDesc).toBeTruthy();
      expect(metaDesc!.length).toBeGreaterThan(20);
    }
  });

  // =========================================================================
  // 10. PHASE 2: MOBILE VIEWPORT & SERVER-RENDERED CONTENT VERIFICATION
  // =========================================================================
  test('Mobile Viewport: server-rendered SEO content and single H1 are preserved on mobile', async ({ browser }) => {
    // Emulate iPhone mobile viewport
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    const page = await context.newPage();
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Single H1 intact on mobile
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('MooEarth Live — Interactive 3D Earth & World Exploration');

    // Semantic section intact on mobile
    const semanticSection = page.locator('section[aria-label="About MooEarth Live"]');
    await expect(semanticSection).toHaveCount(1);

    await context.close();
  });
});
