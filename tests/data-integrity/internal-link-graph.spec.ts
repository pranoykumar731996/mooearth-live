import { test, expect } from '@playwright/test';
import {
  CANONICAL_COUNTRIES,
  getAllCountries,
  getCountryBySlug,
  resolveCanonicalSlug,
} from '../../src/data/countries';
import {
  CANONICAL_CITIES,
  getAllCities,
  getCityBySlug,
  resolveCanonicalCitySlug,
} from '../../src/data/places';
import {
  CANONICAL_CONTINENTS,
  getAllContinents,
  getContinentBySlug,
  getContinentForCountry,
  getCountriesForContinent,
} from '../../src/data/continents';
import {
  getCountryKnowledgeGraph,
  getCityKnowledgeGraph,
  getContinentKnowledgeGraph,
} from '../../src/lib/seo/knowledgeGraph';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 11: INTERNAL LINKING & KNOWLEDGE GRAPH', () => {

  // =========================================================================
  // 1. ORPHAN PAGES DETECTION
  // =========================================================================
  test.describe('Orphan Pages Detection', () => {
    test('Zero Orphan Countries: Every sovereign country has inbound links from its continent hub', () => {
      const allCountries = getAllCountries();
      const allContinents = getAllContinents();

      // Collect all country links present across all 7 continental hubs
      const linkedCountrySlugs = new Set<string>();
      for (const continent of allContinents) {
        const kg = getContinentKnowledgeGraph(continent);
        for (const country of kg.memberCountries) {
          linkedCountrySlugs.add(country.slug);
        }
      }

      // Check for orphan countries
      const orphanCountries: string[] = [];
      for (const country of allCountries) {
        if (!linkedCountrySlugs.has(country.slug)) {
          orphanCountries.push(country.slug);
        }
      }

      expect(orphanCountries).toEqual([]);
      expect(linkedCountrySlugs.size).toBe(195);
    });

    test('Zero Orphan Cities: Every canonical city has inbound links from its parent country and continent', () => {
      const cities = getAllCities();
      const allContinents = getAllContinents();

      // Build inbound link map for cities
      const inboundCityLinks = new Map<string, string[]>();
      for (const city of cities) {
        inboundCityLinks.set(city.slug, []);
      }

      // 1. From country knowledge graphs
      for (const country of getAllCountries()) {
        const kg = getCountryKnowledgeGraph(country);
        for (const { city } of kg.canonicalCities) {
          inboundCityLinks.get(city.slug)?.push(`country:${country.slug}`);
        }
      }

      // 2. From continent knowledge graphs
      for (const continent of allContinents) {
        const kg = getContinentKnowledgeGraph(continent);
        for (const city of kg.canonicalCities) {
          inboundCityLinks.get(city.slug)?.push(`continent:${continent.slug}`);
        }
      }

      // 3. From sister cities
      for (const city of cities) {
        const kg = getCityKnowledgeGraph(city);
        for (const sister of kg.sisterCities) {
          inboundCityLinks.get(sister.slug)?.push(`sister-city:${city.slug}`);
        }
      }

      const orphanCities: string[] = [];
      for (const [slug, inbounds] of inboundCityLinks.entries()) {
        if (inbounds.length === 0) {
          orphanCities.push(slug);
        }
      }

      expect(orphanCities).toEqual([]);
      // Verify every canonical city has at least 2 inbound linking sources
      for (const [slug, inbounds] of inboundCityLinks.entries()) {
        expect(inbounds.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('Zero Orphan Continents: Every continent has inbound links from member countries and sibling hubs', () => {
      const allContinents = getAllContinents();
      const allCountries = getAllCountries();

      const continentInboundCounts = new Map<string, number>();
      for (const cont of allContinents) {
        continentInboundCounts.set(cont.slug, 0);
      }

      // Inbound links from countries
      for (const country of allCountries) {
        const cont = getContinentForCountry(country);
        continentInboundCounts.set(cont.slug, (continentInboundCounts.get(cont.slug) || 0) + 1);
      }

      // Inbound links from sibling continents
      for (const cont of allContinents) {
        const kg = getContinentKnowledgeGraph(cont);
        for (const sibling of kg.siblingContinents) {
          continentInboundCounts.set(sibling.slug, (continentInboundCounts.get(sibling.slug) || 0) + 1);
        }
      }

      for (const [slug, count] of continentInboundCounts.entries()) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 2. BROKEN & DEAD LINKS DETECTION
  // =========================================================================
  test.describe('Broken & Dead Links Detection', () => {
    test('Zero Broken Country Slugs in Knowledge Graph breadcrumbs and subpages', () => {
      const allCountries = getAllCountries();
      const brokenUrls: string[] = [];

      for (const country of allCountries) {
        const kg = getCountryKnowledgeGraph(country);

        // Check breadcrumb URLs
        for (const crumb of kg.breadcrumbs) {
          if (crumb.href.includes('undefined') || crumb.href.includes('null')) {
            brokenUrls.push(`Breadcrumb: ${country.slug} -> ${crumb.href}`);
          }
        }

        // Check subpage URLs
        const subpages = Object.values(kg.intentSubpages);
        for (const sp of subpages) {
          if (sp.href.includes('undefined') || sp.href.includes('null') || !sp.href.startsWith('/')) {
            brokenUrls.push(`Subpage: ${country.slug} -> ${sp.href}`);
          }
        }

        // Check dedicated game link
        if (!kg.dedicatedGame.href.startsWith(`/games/geography/${country.slug}`)) {
          brokenUrls.push(`Game: ${country.slug} -> ${kg.dedicatedGame.href}`);
        }

        // Check related countries
        for (const rel of kg.relatedCountries) {
          if (!getCountryBySlug(rel.slug)) {
            brokenUrls.push(`Related country: ${country.slug} -> ${rel.slug}`);
          }
        }
      }

      expect(brokenUrls).toEqual([]);
    });

    test('Zero Broken City Slugs in City Knowledge Graph and major city resolvers', () => {
      const allCities = getAllCities();
      const brokenCityLinks: string[] = [];

      for (const city of allCities) {
        const kg = getCityKnowledgeGraph(city);

        // Check parent country
        if (!kg.parentCountry) {
          brokenCityLinks.push(`City missing parent country: ${city.slug}`);
        }

        // Check sister cities exist in CANONICAL_CITIES
        for (const sister of kg.sisterCities) {
          if (!getCityBySlug(sister.slug)) {
            brokenCityLinks.push(`Sister city not found: ${city.slug} -> ${sister.slug}`);
          }
        }

        // Check breadcrumbs
        for (const crumb of kg.breadcrumbs) {
          if (crumb.href.includes('undefined') || crumb.href.includes('null')) {
            brokenCityLinks.push(`City crumb: ${city.slug} -> ${crumb.href}`);
          }
        }
      }

      expect(brokenCityLinks).toEqual([]);
    });

    test('Zero Broken Links in Continent Knowledge Graph hubs', () => {
      const allContinents = getAllContinents();
      const brokenLinks: string[] = [];

      for (const continent of allContinents) {
        const kg = getContinentKnowledgeGraph(continent);

        // Check member countries
        for (const country of kg.memberCountries) {
          if (!getCountryBySlug(country.slug)) {
            brokenLinks.push(`Continent member country invalid: ${continent.slug} -> ${country.slug}`);
          }
        }

        // Check sibling continents
        for (const sib of kg.siblingContinents) {
          if (!getContinentBySlug(sib.slug)) {
            brokenLinks.push(`Sibling continent invalid: ${continent.slug} -> ${sib.slug}`);
          }
          if (sib.slug === continent.slug) {
            brokenLinks.push(`Self-referencing sibling: ${continent.slug}`);
          }
        }

        // Check breadcrumbs
        for (const crumb of kg.breadcrumbs) {
          if (crumb.href.includes('undefined') || crumb.href.includes('null')) {
            brokenLinks.push(`Continent crumb: ${continent.slug} -> ${crumb.href}`);
          }
        }
      }

      expect(brokenLinks).toEqual([]);
    });
  });

  // =========================================================================
  // 3. EXCESSIVE LINKS & ANTI-SPAM DETECTION
  // =========================================================================
  test.describe('Excessive Links Detection (Anti-Spam & Link Dilution Guard)', () => {
    test('Breadcrumbs comply with hierarchical limits (max 5 levels)', () => {
      for (const country of getAllCountries()) {
        const kg = getCountryKnowledgeGraph(country);
        expect(kg.breadcrumbs.length).toBeLessThanOrEqual(5);
        expect(kg.breadcrumbs.length).toBeGreaterThanOrEqual(3);
      }

      for (const city of getAllCities()) {
        const kg = getCityKnowledgeGraph(city);
        expect(kg.breadcrumbs.length).toBeLessThanOrEqual(5);
        expect(kg.breadcrumbs.length).toBeGreaterThanOrEqual(4);
      }

      for (const continent of getAllContinents()) {
        const kg = getContinentKnowledgeGraph(continent);
        expect(kg.breadcrumbs.length).toBeLessThanOrEqual(4);
      }
    });

    test('Related country links are curated (bounded up to 8 nations, no giant keyword lists)', () => {
      for (const country of getAllCountries()) {
        const kg = getCountryKnowledgeGraph(country);
        expect(kg.relatedCountries.length).toBeLessThanOrEqual(8);
      }
    });

    test('Canonical city links per country are bounded (no keyword dumps)', () => {
      for (const country of getAllCountries()) {
        const kg = getCountryKnowledgeGraph(country);
        // Curated canonical cities per country must not exceed 10
        expect(kg.canonicalCities.length).toBeLessThanOrEqual(10);
      }
    });

    test('No duplicate internal links in any Knowledge Graph navigation section', () => {
      for (const country of getAllCountries()) {
        const kg = getCountryKnowledgeGraph(country);

        // Check related countries for uniqueness
        const relatedSlugs = kg.relatedCountries.map(c => c.slug);
        const uniqueRelated = new Set(relatedSlugs);
        expect(uniqueRelated.size).toBe(relatedSlugs.length);

        // Check canonical cities for uniqueness
        const citySlugs = kg.canonicalCities.map(c => c.city.slug);
        const uniqueCities = new Set(citySlugs);
        expect(uniqueCities.size).toBe(citySlugs.length);
      }

      for (const city of getAllCities()) {
        const kg = getCityKnowledgeGraph(city);
        const sisterSlugs = kg.sisterCities.map(s => s.slug);
        const uniqueSisters = new Set(sisterSlugs);
        expect(uniqueSisters.size).toBe(sisterSlugs.length);
      }
    });
  });

  // =========================================================================
  // 4. INCORRECT COUNTRY LINKS DETECTION
  // =========================================================================
  test.describe('Incorrect Country Links Detection', () => {
    test('Every canonical city links to its authentic sovereign country', () => {
      const cityCountryMap: Record<string, string> = {
        'tokyo': 'japan',
        'kyoto': 'japan',
        'osaka': 'japan',
        'new-delhi': 'india',
        'mumbai': 'india',
        'bengaluru': 'india',
        'paris': 'france',
        'nice': 'france',
        'lyon': 'france',
        'london': 'united-kingdom',
        'edinburgh': 'united-kingdom',
        'berlin': 'germany',
        'munich': 'germany',
        'new-york-city': 'united-states',
        'san-francisco': 'united-states',
        'sao-paulo': 'brazil',
      };

      for (const [citySlug, expectedCountrySlug] of Object.entries(cityCountryMap)) {
        const city = getCityBySlug(citySlug);
        expect(city).toBeDefined();
        if (city) {
          const kg = getCityKnowledgeGraph(city);
          expect(kg.parentCountry).not.toBeNull();
          expect(kg.parentCountry?.slug).toBe(expectedCountrySlug);
          expect(city.countrySlug).toBe(expectedCountrySlug);
        }
      }
    });

    test('Every country maps to its authentic geographical continent', () => {
      const testCases: Record<string, string> = {
        'india': 'asia',
        'japan': 'asia',
        'china': 'asia',
        'france': 'europe',
        'germany': 'europe',
        'united-kingdom': 'europe',
        'united-states': 'north-america',
        'canada': 'north-america',
        'mexico': 'north-america',
        'brazil': 'south-america',
        'argentina': 'south-america',
        'egypt': 'africa',
        'south-africa': 'africa',
        'nigeria': 'africa',
        'australia': 'oceania',
        'new-zealand': 'oceania',
      };

      for (const [countrySlug, expectedContinentSlug] of Object.entries(testCases)) {
        const country = getCountryBySlug(countrySlug);
        expect(country).toBeDefined();
        if (country) {
          const continent = getContinentForCountry(country);
          expect(continent.slug).toBe(expectedContinentSlug);
        }
      }
    });

    test('Related country links never link a country to itself', () => {
      for (const country of getAllCountries()) {
        const kg = getCountryKnowledgeGraph(country);
        for (const related of kg.relatedCountries) {
          expect(related.slug).not.toBe(country.slug);
        }
      }
    });

    test('Sister city links never link a city to itself and belong to the same country', () => {
      for (const city of getAllCities()) {
        const kg = getCityKnowledgeGraph(city);
        for (const sister of kg.sisterCities) {
          expect(sister.slug).not.toBe(city.slug);
          expect(sister.countrySlug).toBe(city.countrySlug);
        }
      }
    });
  });

  // =========================================================================
  // 5. PROMPT SPECIFIC KNOWLEDGE GRAPH BENCHMARKS
  // =========================================================================
  test.describe('Prompt Knowledge Graph Traversal Benchmarks', () => {
    test('India Traversal Example: World Map → Continents → India → News/Geo/Quiz → Delhi/Mumbai → Asia', () => {
      const india = getCountryBySlug('india');
      expect(india).toBeDefined();
      if (!india) return;

      const kg = getCountryKnowledgeGraph(india);

      // 1. Breadcrumbs traversal
      expect(kg.breadcrumbs[0].href).toBe('/');
      expect(kg.breadcrumbs[1].href).toBe('/world-map');
      expect(kg.breadcrumbs[2].href).toBe('/continents/asia');
      expect(kg.breadcrumbs[3].href).toBe('/countries/india');

      // 2. Continent connection
      expect(kg.continent.slug).toBe('asia');
      expect(kg.continent.name).toBe('Asia');

      // 3. Subpage portals
      expect(kg.intentSubpages.news.href).toBe('/countries/india/news');
      expect(kg.intentSubpages.geography.href).toBe('/countries/india/geography');
      expect(kg.intentSubpages.quiz.href).toBe('/countries/india/quiz');
      expect(kg.intentSubpages.weather.href).toBe('/countries/india/weather');
      expect(kg.intentSubpages.map.href).toBe('/countries/india/map');

      // 4. Dedicated Game
      expect(kg.dedicatedGame.href).toBe('/games/geography/india');

      // 5. Connected Canonical Cities: New Delhi, Mumbai (from prompt specification)
      const citySlugs = kg.canonicalCities.map(c => c.city.slug);
      expect(citySlugs).toContain('new-delhi');
      expect(citySlugs).toContain('mumbai');

      // 6. Test New Delhi City Knowledge Graph
      const delhi = getCityBySlug('new-delhi');
      expect(delhi).toBeDefined();
      if (delhi) {
        const delhiKg = getCityKnowledgeGraph(delhi);
        expect(delhiKg.parentCountry?.slug).toBe('india');
        expect(delhiKg.continent.slug).toBe('asia');
        expect(delhiKg.sisterCities.map(s => s.slug)).toContain('mumbai');
      }

      // 7. Test Mumbai City Knowledge Graph
      const mumbai = getCityBySlug('mumbai');
      expect(mumbai).toBeDefined();
      if (mumbai) {
        const mumbaiKg = getCityKnowledgeGraph(mumbai);
        expect(mumbaiKg.parentCountry?.slug).toBe('india');
        expect(mumbaiKg.continent.slug).toBe('asia');
        expect(mumbaiKg.sisterCities.map(s => s.slug)).toContain('new-delhi');
      }
    });

    test('Japan Traversal Example: World Map → Continents → Japan → Tokyo → News/Weather/Geo/Quiz → Asia', () => {
      const japan = getCountryBySlug('japan');
      expect(japan).toBeDefined();
      if (!japan) return;

      const kg = getCountryKnowledgeGraph(japan);

      // 1. Breadcrumbs traversal
      expect(kg.breadcrumbs[0].href).toBe('/');
      expect(kg.breadcrumbs[1].href).toBe('/world-map');
      expect(kg.breadcrumbs[2].href).toBe('/continents/asia');
      expect(kg.breadcrumbs[3].href).toBe('/countries/japan');

      // 2. Continent connection
      expect(kg.continent.slug).toBe('asia');

      // 3. Subpage portals
      expect(kg.intentSubpages.news.href).toBe('/countries/japan/news');
      expect(kg.intentSubpages.weather.href).toBe('/countries/japan/weather');
      expect(kg.intentSubpages.geography.href).toBe('/countries/japan/geography');
      expect(kg.intentSubpages.quiz.href).toBe('/countries/japan/quiz');

      // 4. Tokyo City Hub Connection
      const tokyo = getCityBySlug('tokyo');
      expect(tokyo).toBeDefined();
      if (tokyo) {
        const tokyoKg = getCityKnowledgeGraph(tokyo);
        expect(tokyoKg.parentCountry?.slug).toBe('japan');
        expect(tokyoKg.continent.slug).toBe('asia');
        expect(tokyoKg.sisterCities.map(s => s.slug)).toContain('kyoto');
      }
    });

    test('City slug resolver correctly recognizes capital aliases and city names', () => {
      expect(resolveCanonicalCitySlug('New Delhi')).toBe('new-delhi');
      expect(resolveCanonicalCitySlug('Delhi')).toBe('new-delhi');
      expect(resolveCanonicalCitySlug('Mumbai')).toBe('mumbai');
      expect(resolveCanonicalCitySlug('Bombay')).toBe('mumbai');
      expect(resolveCanonicalCitySlug('Tokyo')).toBe('tokyo');
      expect(resolveCanonicalCitySlug('Kyoto')).toBe('kyoto');
      expect(resolveCanonicalCitySlug('Paris')).toBe('paris');
      expect(resolveCanonicalCitySlug('London')).toBe('london');
      expect(resolveCanonicalCitySlug('Munich')).toBe('munich');
      expect(resolveCanonicalCitySlug('New York City')).toBe('new-york-city');
      expect(resolveCanonicalCitySlug('New York')).toBe('new-york-city');
      expect(resolveCanonicalCitySlug('São Paulo')).toBe('sao-paulo');
      expect(resolveCanonicalCitySlug('Sao Paulo')).toBe('sao-paulo');
      expect(resolveCanonicalCitySlug('NonExistentCity')).toBeNull();
    });
  });
});
