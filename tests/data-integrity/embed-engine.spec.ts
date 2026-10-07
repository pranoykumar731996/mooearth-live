import { test, expect } from '@playwright/test';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 12: EMBED & ORGANIC AUTHORITY ENGINE', () => {

  // =========================================================================
  // 1. EMBED DOCUMENTATION & GENERATOR PAGE (/embed)
  // =========================================================================
  test.describe('1. Documentation Hub & Generator Engine (/embed)', () => {
    test('Route /embed loads with 200 OK, single H1, and valid metadata', async ({ page }) => {
      const response = await page.goto('/embed');
      expect(response?.status()).toBe(200);

      // Verify single H1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      const h1Text = await page.locator('h1').textContent();
      expect(h1Text).toContain('Embed the Living Planet');

      // Canonical link
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe('https://www.mooearth.live/embed');
    });

    test('Documentation explains all 4 required audiences: Schools, Bloggers, Publishers, Newsletters', async ({ page }) => {
      await page.goto('/embed');

      // Check section exists
      const useCasesSection = page.locator('#use-cases');
      await expect(useCasesSection).toBeVisible();

      // 1. Schools & Educators
      const schoolsHeading = page.locator('text=How Schools, Colleges & Educators Can Use It');
      await expect(schoolsHeading).toBeVisible();
      const schoolsText = await page.locator('text=LMS Integration').textContent();
      expect(schoolsText).toBeTruthy();

      // 2. Bloggers & Creators
      const bloggersHeading = page.locator('text=How Bloggers, Essayists & Creators Can Use It');
      await expect(bloggersHeading).toBeVisible();

      // 3. Digital Publishers & Newsrooms
      const publishersHeading = page.locator('text=How Publishers & Newsrooms Can Use It');
      await expect(publishersHeading).toBeVisible();

      // 4. Newsletters & Curators
      const newslettersHeading = page.locator('text=How Newsletters & Curated Digests Can Use It');
      await expect(newslettersHeading).toBeVisible();
    });

    test('Anti-Spam & Organic Distribution Policy banner is prominently displayed', async ({ page }) => {
      await page.goto('/embed');

      const policyHeading = page.locator('text=Legitimate Organic Authority & Anti-Spam Policy');
      await expect(policyHeading).toBeVisible();

      const policyContent = await page.locator('text=strictly rejects automated link schemes').textContent();
      expect(policyContent).toBeTruthy();
    });

    test('Schema.org structured data includes WebApplication, HowTo, and BreadcrumbList', async ({ page }) => {
      await page.goto('/embed');

      const jsonLdElements = await page.locator('script[type="application/ld+json"]').allTextContents();
      let foundWebApplication = false;
      let foundHowTo = false;
      let foundBreadcrumbList = false;

      for (const raw of jsonLdElements) {
        try {
          const parsed = JSON.parse(raw);
          const graph = parsed['@graph'] || [parsed];
          for (const item of graph) {
            if (item['@type'] === 'WebApplication') foundWebApplication = true;
            if (item['@type'] === 'HowTo') foundHowTo = true;
            if (item['@type'] === 'BreadcrumbList') foundBreadcrumbList = true;
          }
        } catch {
          // ignore parsing error if non-JSON
        }
      }

      expect(foundWebApplication).toBe(true);
      expect(foundHowTo).toBe(true);
      expect(foundBreadcrumbList).toBe(true);
    });

    test('Interactive Embed Generator updates parameters and produces valid iframe markup', async ({ page }) => {
      await page.goto('/embed');

      // Verify Generator section
      const generator = page.locator('[data-testid="embed-generator-section"]');
      await expect(generator).toBeVisible();

      // Select theme: Light
      await page.click('[data-testid="theme-btn-light"]');

      // Select layer: Weather
      await page.click('[data-testid="view-opt-weather"]');

      // Select country: Japan
      await page.selectOption('[data-testid="embed-country-select"]', 'japan');

      // Select category: Breaking
      await page.selectOption('[data-testid="embed-category-select"]', 'breaking');

      // Check generated code contains selected parameters
      const codeSnippet = await page.locator('pre').textContent();
      expect(codeSnippet).toContain('<iframe');
      expect(codeSnippet).toContain('theme=light');
      expect(codeSnippet).toContain('view=weather');
      expect(codeSnippet).toContain('country=japan');
      expect(codeSnippet).toContain('category=breaking');
      expect(codeSnippet).toContain('loading="lazy"');
      expect(codeSnippet).toContain('allow="accelerometer; gyroscope; magnetometer; fullscreen"');
      expect(codeSnippet).toContain('utm_source=embed');

      // Test Copy button state
      const copyBtn = page.locator('[data-testid="copy-embed-code-btn"]');
      await copyBtn.click();
      await expect(copyBtn).toContainText(/COPIED/i);
    });
  });

  // =========================================================================
  // 2. EMBED GLOBE WIDGET (/embed/globe) — DESKTOP VIEWPORT
  // =========================================================================
  test.describe('2. Iframe Verification on Desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Loads /embed/globe on desktop with status badge and attribution link', async ({ page }) => {
      const response = await page.goto('/embed/globe');
      expect(response?.status()).toBe(200);

      // Verify container rendered
      const container = page.locator('[data-testid="embed-globe-container"]');
      await expect(container).toBeVisible();

      // Verify status badge
      const statusBadge = page.locator('[data-testid="embed-status-badge"]');
      await expect(statusBadge).toBeVisible();
      await expect(statusBadge).toContainText('Live 3D Earth');

      // Verify MooEarth attribution badge
      const badge = page.locator('[data-testid="mooearth-embed-badge"]');
      await expect(badge).toBeVisible();
      await expect(badge).toContainText('Powered by MooEarth Live');

      // Verify UTM tracking parameters in badge link
      const href = await badge.getAttribute('href');
      expect(href).toContain('https://www.mooearth.live?');
      expect(href).toContain('utm_source=embed');
      expect(href).toContain('utm_medium=globe_widget');
      expect(href).toContain('utm_campaign=organic_embed');
      expect(await badge.getAttribute('target')).toBe('_blank');

      // Verify fullscreen launcher button
      const fullscreenBtn = page.locator('[data-testid="embed-fullscreen-btn"]');
      await expect(fullscreenBtn).toBeVisible();
    });
  });

  // =========================================================================
  // 3. EMBED GLOBE WIDGET (/embed/globe) — MOBILE VIEWPORT
  // =========================================================================
  test.describe('3. Iframe Verification on Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE / Mobile

    test('Loads /embed/globe on mobile without layout overflow and scales badges', async ({ page }) => {
      const response = await page.goto('/embed/globe');
      expect(response?.status()).toBe(200);

      const container = page.locator('[data-testid="embed-globe-container"]');
      await expect(container).toBeVisible();

      // Check no horizontal scroll overflow on mobile
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allowance for subpixel rounding

      // Verify attribution badge is present and legible on mobile
      const badge = page.locator('[data-testid="mooearth-embed-badge"]');
      await expect(badge).toBeVisible();
      await expect(badge).toContainText('Powered by MooEarth Live');

      // Verify status badge is present
      const statusBadge = page.locator('[data-testid="embed-status-badge"]');
      await expect(statusBadge).toBeVisible();
    });
  });

  // =========================================================================
  // 4. EMBED GLOBE WIDGET (/embed/globe) — DARK MODE
  // =========================================================================
  test.describe('4. Iframe Verification in Dark Mode', () => {
    test('Default and theme=dark render obsidian dark background', async ({ page }) => {
      await page.goto('/embed/globe?theme=dark');

      const container = page.locator('[data-testid="embed-globe-container"]');
      await expect(container).toBeVisible();

      const themeAttr = await container.getAttribute('data-theme');
      expect(themeAttr).toBe('dark');

      // Verify toggle button offers switch to light
      const toggle = page.locator('[data-testid="embed-theme-toggle"]');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-label', /light/i);
    });
  });

  // =========================================================================
  // 5. EMBED GLOBE WIDGET (/embed/globe) — LIGHT MODE
  // =========================================================================
  test.describe('5. Iframe Verification in Light Mode', () => {
    test('theme=light renders light slate background and toggles back to dark', async ({ page }) => {
      await page.goto('/embed/globe?theme=light');

      const container = page.locator('[data-testid="embed-globe-container"]');
      await expect(container).toBeVisible();

      // Theme attribute should be light
      const themeAttr = await container.getAttribute('data-theme');
      expect(themeAttr).toBe('light');

      // Verify attribution badge exists in light mode
      const badge = page.locator('[data-testid="mooearth-embed-badge"]');
      await expect(badge).toBeVisible();
      await expect(badge).toContainText('Powered by MooEarth Live');

      // Click the theme toggle button to switch to dark
      const toggle = page.locator('[data-testid="embed-theme-toggle"]');
      await toggle.click();

      // Should dynamically switch theme to dark
      const switchedTheme = await container.getAttribute('data-theme');
      expect(switchedTheme).toBe('dark');
    });
  });

  // =========================================================================
  // 6. QUERY PARAMETERS & FALLBACK VERIFICATION
  // =========================================================================
  test.describe('6. Query Parameters & Accessible Fallback', () => {
    test('country=japan focuses target and includes country in UTM attribution URL', async ({ page }) => {
      await page.goto('/embed/globe?country=Japan');

      const statusBadge = page.locator('[data-testid="embed-status-badge"]');
      await expect(statusBadge).toContainText('Focus: Japan');

      const badge = page.locator('[data-testid="mooearth-embed-badge"]');
      const href = await badge.getAttribute('href');
      expect(href).toContain('country=Japan');
    });

    test('category parameter is reflected in status badge', async ({ page }) => {
      await page.goto('/embed/globe?category=weather');

      const statusBadge = page.locator('[data-testid="embed-status-badge"]');
      await expect(statusBadge).toContainText('weather');
    });

    test('robots.txt allows /embed and disallows /embed/globe', async ({ request }) => {
      const response = await request.get('/robots.txt');
      expect(response.status()).toBe(200);

      const text = await response.text();
      expect(text).toContain('Allow: /embed');
      expect(text).toContain('Disallow: /embed/globe');
    });

    test('sitemap.xml contains /embed', async ({ request }) => {
      const response = await request.get('/sitemap.xml');
      expect(response.status()).toBe(200);

      const text = await response.text();
      expect(text).toContain('https://www.mooearth.live/embed');
    });
  });
});
