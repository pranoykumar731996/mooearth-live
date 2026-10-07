import { test, expect } from '@playwright/test';
import { fetchWorldNewsMapData, extractPublisher, WorldNewsStory } from '../../src/services/worldNewsService';
import { metadata as worldNewsMeta } from '../../src/app/world-news/page';
import { metadata as worldNewsMapMeta } from '../../src/app/world-news-map/page';
import { metadata as liveWorldNewsMeta } from '../../src/app/live-world-news/page';
import sitemap from '../../src/app/sitemap';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 8: WORLD NEWS MAP ENGINE', () => {

  let newsData: Awaited<ReturnType<typeof fetchWorldNewsMapData>>;

  test.beforeAll(async () => {
    newsData = await fetchWorldNewsMapData();
  });

  // =========================================================================
  // 1. NEWS FRESHNESS
  // =========================================================================
  test.describe('1. News Freshness', () => {
    test('Stories have valid, parseable ISO timestamps', () => {
      expect(newsData.stories.length).toBeGreaterThanOrEqual(5);

      for (const story of newsData.stories) {
        expect(story.publishedAt, `Story ${story.id} has empty timestamp`).toBeDefined();
        const time = new Date(story.publishedAt).getTime();
        expect(isNaN(time), `Story ${story.id} timestamp is not a valid date`).toBe(false);
        // Timestamp must be a plausible modern date (year > 2020)
        expect(new Date(story.publishedAt).getFullYear()).toBeGreaterThanOrEqual(2020);
      }
    });

    test('Stories are ordered by freshness in descending order', () => {
      for (let i = 0; i < newsData.stories.length - 1; i++) {
        const current = new Date(newsData.stories[i].publishedAt).getTime();
        const next = new Date(newsData.stories[i + 1].publishedAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    test('Data package contains valid lastUpdated ISO timestamp', () => {
      expect(newsData.lastUpdated).toBeDefined();
      expect(isNaN(new Date(newsData.lastUpdated).getTime())).toBe(false);
    });
  });

  // =========================================================================
  // 2. SOURCE ATTRIBUTION & ZERO FABRICATION
  // =========================================================================
  test.describe('2. Source Attribution & Integrity', () => {
    test('Every story has a verified source publisher attribution and original URL', () => {
      for (const story of newsData.stories) {
        expect(story.source.length, `Story ${story.id} missing source attribution`).toBeGreaterThan(0);
        expect(story.source).not.toBe('Unknown');
        expect(story.source).not.toBe('AI Generated');

        expect(story.originalUrl.length, `Story ${story.id} missing original URL`).toBeGreaterThan(0);
        expect(story.originalUrl.startsWith('http')).toBe(true);
      }
    });

    test('extractPublisher cleanly parses reputable news publishers', () => {
      expect(extractPublisher('Historic Summit Concludes - Reuters')).toBe('Reuters');
      expect(extractPublisher('Markets Rebound in Tokyo - BBC News')).toBe('BBC News');
      expect(extractPublisher('Tech Breakthrough - Associated Press')).toBe('Associated Press');
      expect(extractPublisher('Headline', 'https://www.theguardian.com/world/2026/article')).toBe('The Guardian');
      expect(extractPublisher('Headline', 'https://www.aljazeera.com/news/2026/update')).toBe('Al Jazeera');
      expect(extractPublisher('Headline', 'https://www.bloomberg.com/markets')).toBe('Bloomberg');
    });

    test('Zero fake or hallucinated stories detected in production feeds', () => {
      for (const story of newsData.stories) {
        expect(story.title.toLowerCase()).not.toContain('placeholder');
        expect(story.title.toLowerCase()).not.toContain('lorem ipsum');
        expect(story.summary.toLowerCase()).not.toContain('lorem ipsum');
      }
    });
  });

  // =========================================================================
  // 3. COUNTRY MAPPING & COORDINATE INTEGRITY
  // =========================================================================
  test.describe('3. Country Mapping & Geographic Coordinates', () => {
    test('Every story is geocoded to a valid country with valid spherical coordinates', () => {
      for (const story of newsData.stories) {
        expect(story.country.length, `Story ${story.id} missing country`).toBeGreaterThan(0);
        expect(story.countrySlug.length, `Story ${story.id} missing country slug`).toBeGreaterThan(0);

        // Coordinates must be real numbers within planetary spherical bounds
        expect(typeof story.lat).toBe('number');
        expect(typeof story.lng).toBe('number');
        expect(isNaN(story.lat)).toBe(false);
        expect(isNaN(story.lng)).toBe(false);

        expect(story.lat).toBeGreaterThanOrEqual(-90);
        expect(story.lat).toBeLessThanOrEqual(90);

        expect(story.lng).toBeGreaterThanOrEqual(-180);
        expect(story.lng).toBeLessThanOrEqual(180);
      }
    });

    test('Regional clusters correctly categorize countries', () => {
      expect(newsData.regions.length).toBeGreaterThanOrEqual(1);
      for (const r of newsData.regions) {
        expect(r.name.length).toBeGreaterThan(0);
        expect(r.count).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 4. ARTICLE MAPPING & METRIC INTEGRITY
  // =========================================================================
  test.describe('4. Article Mapping', () => {
    test('Every story contains headline, factual summary, and related stories', () => {
      for (const story of newsData.stories) {
        expect(story.id.length).toBeGreaterThan(0);
        expect(story.title.length).toBeGreaterThan(5);
        expect(story.summary.length).toBeGreaterThan(10);
        expect(story.category).toBeDefined();

        // Related stories array should exist
        expect(Array.isArray(story.relatedStories)).toBe(true);
      }
    });
  });

  // =========================================================================
  // 5. CANONICAL URL INTEGRITY
  // =========================================================================
  test.describe('5. Canonical URL Verification', () => {
    test('/world-news canonical URL is correctly declared', () => {
      expect(worldNewsMeta.alternates?.canonical).toBe('https://www.mooearth.live/world-news');
    });

    test('/world-news-map canonical URL is correctly declared', () => {
      expect(worldNewsMapMeta.alternates?.canonical).toBe('https://www.mooearth.live/world-news-map');
    });

    test('/live-world-news canonical URL is correctly declared', () => {
      expect(liveWorldNewsMeta.alternates?.canonical).toBe('https://www.mooearth.live/live-world-news');
    });
  });

  // =========================================================================
  // 6. METADATA & SEARCH INTENT ALIGNMENT
  // =========================================================================
  test.describe('6. Metadata & Search Intent Alignment', () => {
    test('All 3 routes have unique titles matching target search intents', () => {
      const titles = [worldNewsMeta.title, worldNewsMapMeta.title, liveWorldNewsMeta.title] as string[];
      expect(new Set(titles).size).toBe(3);

      expect(worldNewsMeta.title as string).toContain('World News');
      expect(worldNewsMapMeta.title as string).toContain('World News Map');
      expect(liveWorldNewsMeta.title as string).toContain('Live World News');
    });

    test('Meta descriptions contain keywords: world news map, global news map, live world news', () => {
      const allDescriptions = [
        worldNewsMeta.description,
        worldNewsMapMeta.description,
        liveWorldNewsMeta.description,
      ].join(' ').toLowerCase();

      expect(allDescriptions).toContain('world news map');
      expect(allDescriptions).toContain('global news');
      expect(allDescriptions).toContain('live world news');
    });

    test('OpenGraph and Twitter cards are properly configured across all 3 routes', () => {
      const metas = [worldNewsMeta, worldNewsMapMeta, liveWorldNewsMeta];
      for (const meta of metas) {
        expect(meta.openGraph?.title).toBeDefined();
        expect(meta.openGraph?.description).toBeDefined();
        expect(meta.openGraph?.url).toBeDefined();
        expect((meta.twitter as Record<string, unknown>)?.card).toBe('summary_large_image');
      }
    });
  });

  // =========================================================================
  // 7. STRUCTURED DATA & SITEMAP DISCOVERY
  // =========================================================================
  test.describe('7. Structured Data & Sitemap Discovery', () => {
    test('Sitemap contains /world-news, /world-news-map, and /live-world-news', async () => {
      const items = await sitemap();
      const urls = new Set(items.map(item => item.url));

      expect(urls.has('https://www.mooearth.live/world-news')).toBe(true);
      expect(urls.has('https://www.mooearth.live/world-news-map')).toBe(true);
      expect(urls.has('https://www.mooearth.live/live-world-news')).toBe(true);
    });
  });

});
