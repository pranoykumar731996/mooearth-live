import { test, expect } from '@playwright/test';
import {
  CANONICAL_COUNTRIES,
  getAllCountries,
  getAllCountrySlugs,
  getCountryBySlug,
  getCountryById,
  getCountryByName,
  resolveCanonicalSlug,
} from '../../src/data/countries';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 4: COUNTRY HUB ENGINE', () => {

  // =========================================================================
  // 1. CANONICAL DATASET INTEGRITY & 195-SOVEREIGN NATION BENCHMARK
  // =========================================================================
  test('Country Dataset: contains exactly 195 UN-recognized sovereign nations', () => {
    const countries = getAllCountries();
    expect(countries.length).toBe(195);
    expect(CANONICAL_COUNTRIES.length).toBe(195);
  });

  test('Country Dataset: 0 duplicate IDs, slugs, or ISO2 codes', () => {
    const countries = getAllCountries();
    const idSet = new Set<string>();
    const slugSet = new Set<string>();
    const iso2Set = new Set<string>();

    for (const c of countries) {
      expect(idSet.has(c.id)).toBeFalsy();
      idSet.add(c.id);

      expect(slugSet.has(c.slug)).toBeFalsy();
      slugSet.add(c.slug);

      expect(iso2Set.has(c.iso2)).toBeFalsy();
      iso2Set.add(c.iso2);
    }

    expect(idSet.size).toBe(195);
    expect(slugSet.size).toBe(195);
    expect(iso2Set.size).toBe(195);
  });

  test('Country Dataset: all 195 countries have complete, non-empty demographic & geographic data', () => {
    const countries = getAllCountries();

    for (const c of countries) {
      // Basic identity
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.slug).toBeTruthy();
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
      expect(c.iso2).toMatch(/^[A-Z]{2}$/);
      expect(c.iso3).toMatch(/^[A-Z]{3}$/);

      // Geography & Demographics
      expect(c.capital).toBeTruthy();
      expect(c.region).toBeTruthy();
      expect(c.subregion).toBeTruthy();
      expect(typeof c.coordinates.lat).toBe('number');
      expect(typeof c.coordinates.lng).toBe('number');
      expect(c.coordinates.lat).toBeGreaterThanOrEqual(-90);
      expect(c.coordinates.lat).toBeLessThanOrEqual(90);
      expect(c.coordinates.lng).toBeGreaterThanOrEqual(-180);
      expect(c.coordinates.lng).toBeLessThanOrEqual(180);

      expect(c.population).toBeTruthy();
      expect(c.areaKm2).toBeGreaterThan(0);
      expect(c.currency).toBeTruthy();
      expect(c.languages).toBeTruthy();
      expect(c.flag).toBeTruthy();

      // Enriched content
      expect(c.majorCities.length).toBeGreaterThanOrEqual(1);
      expect(c.geography.length).toBeGreaterThan(20);
      expect(c.landmark).toBeTruthy();
      expect(c.climate).toBeTruthy();
      expect(c.funFact.length).toBeGreaterThan(20);
      expect(c.relatedSlugs.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('Country Dataset: zero broken related country slug references', () => {
    const countries = getAllCountries();
    const slugSet = new Set(getAllCountrySlugs());

    for (const c of countries) {
      for (const related of c.relatedSlugs) {
        expect(slugSet.has(related)).toBeTruthy();
      }
    }
  });

  // =========================================================================
  // 2. QUERY API & RESOLUTION ENGINE
  // =========================================================================
  test('Slug Resolution: accurately resolves canonical slugs and common aliases', () => {
    // Exact canonical lookups
    expect(getCountryBySlug('india')?.name).toBe('India');
    expect(getCountryBySlug('japan')?.name).toBe('Japan');
    expect(getCountryBySlug('brazil')?.name).toBe('Brazil');
    expect(getCountryBySlug('france')?.name).toBe('France');
    expect(getCountryBySlug('germany')?.name).toBe('Germany');
    expect(getCountryBySlug('united-states')?.name).toBe('United States');

    // Aliases
    expect(getCountryBySlug('usa')?.slug).toBe('united-states');
    expect(getCountryBySlug('us')?.slug).toBe('united-states');
    expect(getCountryBySlug('uk')?.slug).toBe('united-kingdom');
    expect(getCountryBySlug('uae')?.slug).toBe('united-arab-emirates');
    expect(getCountryBySlug('south-korea')?.slug).toBe('south-korea');
    expect(getCountryBySlug('korea')?.slug).toBe('south-korea');
    expect(getCountryBySlug('russia')?.slug).toBe('russia');
    expect(getCountryBySlug('vatican')?.slug).toBe('vatican-city');

    // ID lookups
    expect(getCountryById('IN')?.name).toBe('India');
    expect(getCountryById('jp')?.name).toBe('Japan');
    expect(getCountryById('USA')?.name).toBe('United States');

    // Name lookups
    expect(getCountryByName('India')?.slug).toBe('india');
    expect(getCountryByName('United States')?.slug).toBe('united-states');

    // resolveCanonicalSlug helper
    expect(resolveCanonicalSlug('usa')).toBe('united-states');
    expect(resolveCanonicalSlug('Great Britain')).toBe('united-kingdom');
    expect(resolveCanonicalSlug('JP')).toBe('japan');
    expect(resolveCanonicalSlug('non-existent-nation-xyz')).toBeNull();
  });

  test('Slug Resolution: invalid or non-existent country returns null', () => {
    expect(getCountryBySlug('invalid-country-xyz')).toBeNull();
    expect(getCountryBySlug('')).toBeNull();
    expect(getCountryById('ZZZ')).toBeNull();
  });

  // =========================================================================
  // 3. E2E RENDERING, METADATA & 404 GATE
  // =========================================================================
  const testCountries = [
    { slug: 'india', name: 'India', capital: 'New Delhi' },
    { slug: 'japan', name: 'Japan', capital: 'Tokyo' },
    { slug: 'brazil', name: 'Brazil', capital: 'Brasília' },
    { slug: 'france', name: 'France', capital: 'Paris' },
    { slug: 'germany', name: 'Germany', capital: 'Berlin' },
    { slug: 'united-states', name: 'United States', capital: 'Washington D.C.' },
  ];

  for (const tc of testCountries) {
    test(`Country Page /countries/${tc.slug}: returns 200, single H1, canonical URL, breadcrumbs & JSON-LD`, async ({ page }) => {
      const response = await page.goto(`/countries/${tc.slug}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);

      // Title & Description
      const title = await page.title();
      expect(title).toContain(tc.name);
      expect(title).toContain('MooEarth Live');

      const metaDesc = page.locator('meta[name="description"]');
      await expect(metaDesc).toHaveCount(1);
      const descContent = await metaDesc.getAttribute('content');
      expect(descContent).toContain(tc.name);
      expect(descContent).toContain(tc.capital);

      // Canonical URL
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute('href', `https://www.mooearth.live/countries/${tc.slug}`);

      // Single H1 heading
      const h1s = page.locator('h1');
      await expect(h1s).toHaveCount(1);
      const h1Text = await h1s.first().textContent();
      expect(h1Text).toContain(tc.name);

      // Breadcrumb Navigation
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb).toContainText(tc.name);

      // JSON-LD Structured Data
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();
      expect(count).toBeGreaterThanOrEqual(2);

      let foundCountrySchema = false;
      let foundBreadcrumbSchema = false;

      for (let i = 0; i < count; i++) {
        const text = await jsonLdScripts.nth(i).textContent();
        if (!text) continue;
        const parsed = JSON.parse(text);
        if (parsed['@type'] === 'Country') {
          foundCountrySchema = true;
          expect(parsed.name).toBe(tc.name);
          expect(parsed.url).toBe(`https://www.mooearth.live/countries/${tc.slug}`);
        }
        if (parsed['@type'] === 'BreadcrumbList') {
          foundBreadcrumbSchema = true;
        }
      }

      expect(foundCountrySchema).toBeTruthy();
      expect(foundBreadcrumbSchema).toBeTruthy();
    });
  }

  test('Invalid Country: returns 404 Not Found for non-existent country slug', async ({ page }) => {
    const response = await page.goto('/countries/non-existent-fantasy-kingdom', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(404);
  });

  // =========================================================================
  // 4. SITEMAP VERIFICATION FOR 195 COUNTRY HUBS
  // =========================================================================
  test('Sitemap: includes all 195 canonical /countries/[slug] URLs with zero duplicates', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const xml = await response.text();
    const slugs = getAllCountrySlugs();

    for (const slug of slugs) {
      const expectedUrl = `https://www.mooearth.live/countries/${slug}`;
      expect(xml).toContain(expectedUrl);
    }
  });
});
