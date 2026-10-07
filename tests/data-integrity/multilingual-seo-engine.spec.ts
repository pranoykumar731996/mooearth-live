import { test, expect } from '@playwright/test';
import {
  SUPPORTED_LOCALES,
  LOCALES_META,
  DICTIONARIES,
  getTranslation,
  isSupportedLocale,
  generateHreflangs,
  getLocalizedPath,
  getCanonicalUrl,
  getLocalizedCountryName,
  SupportedLocale,
} from '../../src/lib/i18n';
import sitemap from '../../src/app/sitemap';
import { generateMetadata as generateWorldMapMeta } from '../../src/app/[lang]/world-map/page';
import { generateMetadata as generateWeatherMeta } from '../../src/app/[lang]/weather/page';
import { generateMetadata as generateWorldNewsMeta } from '../../src/app/[lang]/world-news/page';
import { generateMetadata as generateWorldEventsMeta } from '../../src/app/[lang]/world-events/page';
import { generateMetadata as generateGamesMeta } from '../../src/app/[lang]/games/page';
import { generateMetadata as generateGeoQuizMeta } from '../../src/app/[lang]/geography-quiz/page';
import { generateMetadata as generateFlagQuizMeta } from '../../src/app/[lang]/flag-quiz/page';
import { generateMetadata as generateCountryQuizMeta } from '../../src/app/[lang]/country-quiz/page';
import { generateMetadata as generateCountryMeta } from '../../src/app/[lang]/country/[country]/page';
import { generateMetadata as generateDailyMeta } from '../../src/app/[lang]/daily/page';
import { generateMetadata as generateHomeMeta } from '../../src/app/[lang]/page';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 10: MULTILINGUAL INTERNATIONAL SEO', () => {

  // =========================================================================
  // 1. PRIORITY LANGUAGES ARCHITECTURE & METADATA
  // =========================================================================
  test.describe('1. Priority Languages Architecture', () => {
    test('Contains exactly the 8 priority languages', () => {
      const expected: SupportedLocale[] = ['en', 'es', 'fr', 'pt', 'de', 'ja', 'hi', 'ar'];
      expect(SUPPORTED_LOCALES).toHaveLength(8);
      for (const lang of expected) {
        expect(SUPPORTED_LOCALES).toContain(lang);
        expect(isSupportedLocale(lang)).toBe(true);
      }
    });

    test('Locale metadata defines correct native names, flags, and text directions', () => {
      for (const lang of SUPPORTED_LOCALES) {
        const meta = LOCALES_META[lang];
        expect(meta).toBeDefined();
        expect(meta.code).toBe(lang);
        expect(meta.name).toBeTruthy();
        expect(meta.nativeName).toBeTruthy();
        expect(meta.flag).toBeTruthy();
        if (lang === 'ar') {
          expect(meta.dir).toBe('rtl');
        } else {
          expect(meta.dir).toBe('ltr');
        }
      }
    });

    test('generateHreflangs generates reciprocal cluster including all 8 languages and x-default', () => {
      const paths = ['/world-map', '/weather', '/world-news', '/games', '/daily'];
      for (const p of paths) {
        const alternates = generateHreflangs(p);
        expect(alternates['x-default']).toBe(`https://www.mooearth.live${p}`);
        expect(alternates['en']).toBe(`https://www.mooearth.live${p}`);
        for (const lang of SUPPORTED_LOCALES.filter((l) => l !== 'en')) {
          expect(alternates[lang]).toBe(`https://www.mooearth.live/${lang}${p}`);
        }
      }
    });

    test('getCanonicalUrl and getLocalizedPath produce consistent URLs without double slashes', () => {
      expect(getCanonicalUrl('/world-map', 'en')).toBe('https://www.mooearth.live/world-map');
      expect(getCanonicalUrl('/world-map', 'es')).toBe('https://www.mooearth.live/es/world-map');
      expect(getCanonicalUrl('/', 'ja')).toBe('https://www.mooearth.live/ja');
      expect(getCanonicalUrl('', 'ar')).toBe('https://www.mooearth.live/ar');

      expect(getLocalizedPath('/world-map', 'en')).toBe('/world-map');
      expect(getLocalizedPath('/world-map', 'fr')).toBe('/fr/world-map');
      expect(getLocalizedPath('/', 'de')).toBe('/de');
    });
  });

  // =========================================================================
  // 2. DICTIONARY FIDELITY & HIGH-QUALITY CURATION (NO MACHINE GIBBERISH)
  // =========================================================================
  test.describe('2. High-Quality Curated Dictionaries', () => {
    test('Every locale dictionary contains complete modules for core pages, games, and navigation', () => {
      for (const lang of SUPPORTED_LOCALES) {
        const dict = getTranslation(lang);
        expect(dict.locale).toBe(lang);

        // Navigation
        expect(dict.nav.home).toBeTruthy();
        expect(dict.nav.games).toBeTruthy();
        expect(dict.nav.weather).toBeTruthy();
        expect(dict.nav.news).toBeTruthy();
        expect(dict.nav.worldMap).toBeTruthy();

        // World Map Module
        expect(dict.worldMap.title).toContain('MooEarth Live');
        expect(dict.worldMap.h1).toBeTruthy();
        expect(dict.worldMap.description.length).toBeGreaterThan(30);
        expect(dict.worldMap.badge).toBeTruthy();
        expect(dict.worldMap.summary.length).toBeGreaterThan(30);
        expect(dict.worldMap.regionAfricaEuropeTitle).toBeTruthy();
        expect(dict.worldMap.regionAsiaOceaniaTitle).toBeTruthy();
        expect(dict.worldMap.regionAmericasTitle).toBeTruthy();

        // Weather Module
        expect(dict.weather.title).toContain('MooEarth Live');
        expect(dict.weather.h1).toBeTruthy();
        expect(dict.weather.description.length).toBeGreaterThan(30);
        expect(dict.weather.summary.length).toBeGreaterThan(30);
        expect(dict.weather.radarHeading).toBeTruthy();

        // World News Module
        expect(dict.worldNews.title).toContain('MooEarth Live');
        expect(dict.worldNews.h1).toBeTruthy();
        expect(dict.worldNews.description.length).toBeGreaterThan(30);
        expect(dict.worldNews.summary.length).toBeGreaterThan(30);

        // World Events Module
        expect(dict.worldEvents.title).toContain('MooEarth Live');
        expect(dict.worldEvents.h1).toBeTruthy();
        expect(dict.worldEvents.description.length).toBeGreaterThan(30);
        expect(dict.worldEvents.summary.length).toBeGreaterThan(30);

        // Top Games Modules
        expect(dict.gamesHub.h1).toBeTruthy();
        expect(dict.geographyQuiz.h1).toBeTruthy();
        expect(dict.flagQuiz.h1).toBeTruthy();
        expect(dict.countryQuiz.h1).toBeTruthy();
      }
    });

    test('Non-Latin languages (Arabic, Japanese, Hindi) contain authentic respective scripts', () => {
      // Arabic contains Arabic script
      const arDict = getTranslation('ar');
      expect(/[\u0600-\u06FF]/.test(arDict.worldMap.h1)).toBe(true);
      expect(/[\u0600-\u06FF]/.test(arDict.weather.h1)).toBe(true);
      expect(/[\u0600-\u06FF]/.test(arDict.worldNews.h1)).toBe(true);

      // Japanese contains Japanese kanji/hiragana/katakana
      const jaDict = getTranslation('ja');
      expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(jaDict.worldMap.h1)).toBe(true);
      expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(jaDict.weather.h1)).toBe(true);
      expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(jaDict.worldNews.h1)).toBe(true);

      // Hindi contains Devanagari script
      const hiDict = getTranslation('hi');
      expect(/[\u0900-\u097F]/.test(hiDict.worldMap.h1)).toBe(true);
      expect(/[\u0900-\u097F]/.test(hiDict.weather.h1)).toBe(true);
      expect(/[\u0900-\u097F]/.test(hiDict.worldNews.h1)).toBe(true);
    });

    test('Top countries are mapped and localized across all 8 languages', () => {
      const testCountries = [
        'spain', 'france', 'germany', 'brazil', 'japan',
        'india', 'united states', 'egypt', 'saudi arabia'
      ];
      for (const country of testCountries) {
        for (const lang of SUPPORTED_LOCALES) {
          const locName = getLocalizedCountryName(country, lang);
          expect(locName).toBeTruthy();
          expect(locName.length).toBeGreaterThan(1);
        }
      }

      // Check specific linguistic landmarks
      expect(getLocalizedCountryName('japan', 'ja')).toBe('日本');
      expect(getLocalizedCountryName('india', 'hi')).toBe('भारत');
      expect(getLocalizedCountryName('egypt', 'ar')).toBe('مصر');
      expect(getLocalizedCountryName('germany', 'de')).toBe('Deutschland');
      expect(getLocalizedCountryName('spain', 'es')).toBe('España');
      expect(getLocalizedCountryName('france', 'fr')).toBe('France');
      expect(getLocalizedCountryName('brazil', 'pt')).toBe('Brasil');
    });
  });

  // =========================================================================
  // 3. SERVER METADATA GENERATION FOR EACH ROUTE & LOCALE
  // =========================================================================
  test.describe('3. Route-Specific Metadata & Canonical Integrity', () => {
    test('generateMetadata for /world-map creates valid localized metadata across all locales', async () => {
      for (const lang of SUPPORTED_LOCALES) {
        const meta = await generateWorldMapMeta({ params: Promise.resolve({ lang }) });
        expect(meta.title).toBeTruthy();
        expect(meta.description).toBeTruthy();
        expect(meta.alternates?.canonical).toBe(getCanonicalUrl('/world-map', lang));
        const langs = meta.alternates?.languages as Record<string, string>;
        expect(langs?.['x-default']).toBe('https://www.mooearth.live/world-map');
        expect(langs?.[lang]).toBe(getCanonicalUrl('/world-map', lang));
      }
    });

    test('generateMetadata for /weather creates valid localized metadata across all locales', async () => {
      for (const lang of SUPPORTED_LOCALES) {
        const meta = await generateWeatherMeta({ params: Promise.resolve({ lang }) });
        expect(meta.title).toBeTruthy();
        expect(meta.description).toBeTruthy();
        expect(meta.alternates?.canonical).toBe(getCanonicalUrl('/weather', lang));
      }
    });

    test('generateMetadata for /world-news creates valid localized metadata across all locales', async () => {
      for (const lang of SUPPORTED_LOCALES) {
        const meta = await generateWorldNewsMeta({ params: Promise.resolve({ lang }) });
        expect(meta.title).toBeTruthy();
        expect(meta.description).toBeTruthy();
        expect(meta.alternates?.canonical).toBe(getCanonicalUrl('/world-news', lang));
      }
    });

    test('generateMetadata for /world-events creates valid localized metadata across all locales', async () => {
      for (const lang of SUPPORTED_LOCALES) {
        const meta = await generateWorldEventsMeta({ params: Promise.resolve({ lang }) });
        expect(meta.title).toBeTruthy();
        expect(meta.description).toBeTruthy();
        expect(meta.alternates?.canonical).toBe(getCanonicalUrl('/world-events', lang));
      }
    });

    test('generateMetadata for /games and quizzes creates valid localized metadata across all locales', async () => {
      for (const lang of SUPPORTED_LOCALES) {
        const gamesMeta = await generateGamesMeta({ params: Promise.resolve({ lang }) });
        expect(gamesMeta.title).toBeTruthy();
        expect(gamesMeta.alternates?.canonical).toBe(getCanonicalUrl('/games', lang));

        const geoMeta = await generateGeoQuizMeta({ params: Promise.resolve({ lang }) });
        expect(geoMeta.title).toBeTruthy();
        expect(geoMeta.alternates?.canonical).toBe(getCanonicalUrl('/geography-quiz', lang));

        const flagMeta = await generateFlagQuizMeta({ params: Promise.resolve({ lang }) });
        expect(flagMeta.title).toBeTruthy();
        expect(flagMeta.alternates?.canonical).toBe(getCanonicalUrl('/flag-quiz', lang));

        const countryMeta = await generateCountryQuizMeta({ params: Promise.resolve({ lang }) });
        expect(countryMeta.title).toBeTruthy();
        expect(countryMeta.alternates?.canonical).toBe(getCanonicalUrl('/country-quiz', lang));
      }
    });

    test('generateMetadata for top country hubs creates localized titles and canonical tags', async () => {
      const sampleCountries = ['japan', 'france', 'egypt', 'brazil'];
      for (const country of sampleCountries) {
        for (const lang of SUPPORTED_LOCALES) {
          const meta = await generateCountryMeta({ params: Promise.resolve({ lang, country }) });
          expect(meta.title).toBeTruthy();
          expect(meta.description).toBeTruthy();
          expect(meta.alternates?.canonical).toBe(getCanonicalUrl(`/country/${country}`, lang));
        }
      }
    });

    test('generateMetadata for /daily creates valid localized metadata', async () => {
      for (const lang of SUPPORTED_LOCALES) {
        const meta = await generateDailyMeta({ params: Promise.resolve({ lang }) });
        expect(meta.title).toBeTruthy();
        expect(meta.alternates?.canonical).toBe(getCanonicalUrl('/daily', lang));
      }
    });

    test('generateMetadata for localized home creates valid title and canonical', async () => {
      for (const lang of SUPPORTED_LOCALES) {
        const meta = await generateHomeMeta({ params: Promise.resolve({ lang }) });
        expect(meta.title).toBeTruthy();
        expect(meta.alternates?.canonical).toBe(getCanonicalUrl('/', lang));
      }
    });
  });

  // =========================================================================
  // 4. SITEMAP MULTILINGUAL INDEXATION
  // =========================================================================
  test.describe('4. Sitemap Multilingual URLs', () => {
    test('sitemap includes localized core pages, quizzes, and country hubs', async () => {
      const items = await sitemap();
      const urls = items.map((i) => i.url);

      const nonEnLocales = SUPPORTED_LOCALES.filter((l) => l !== 'en');
      for (const lang of nonEnLocales) {
        // Home and Daily
        expect(urls).toContain(`https://www.mooearth.live/${lang}`);
        expect(urls).toContain(`https://www.mooearth.live/${lang}/daily`);

        // Core Pages & Top Search Hubs
        expect(urls).toContain(`https://www.mooearth.live/${lang}/world-map`);
        expect(urls).toContain(`https://www.mooearth.live/${lang}/weather`);
        expect(urls).toContain(`https://www.mooearth.live/${lang}/world-news`);
        expect(urls).toContain(`https://www.mooearth.live/${lang}/world-events`);
        expect(urls).toContain(`https://www.mooearth.live/${lang}/games`);
        expect(urls).toContain(`https://www.mooearth.live/${lang}/geography-quiz`);
        expect(urls).toContain(`https://www.mooearth.live/${lang}/flag-quiz`);
        expect(urls).toContain(`https://www.mooearth.live/${lang}/country-quiz`);

        // Sample Sovereign Country Hub
        expect(urls).toContain(`https://www.mooearth.live/${lang}/country/japan`);
        expect(urls).toContain(`https://www.mooearth.live/${lang}/country/france`);
      }
    });
  });
});
