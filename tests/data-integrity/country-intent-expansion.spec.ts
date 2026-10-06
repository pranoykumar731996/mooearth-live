import { test, expect } from '@playwright/test';
import {
  shouldIndexCountryIntentPage,
  CountryIntent,
} from '../../src/lib/seo/countryIntentQualityGate';
import { getCountryBySlug, getAllCountries } from '../../src/data/countries';
import { fetchNewsForCountry } from '../../src/services/countryNewsService';
import { fetchCountryWeather } from '../../src/services/weatherService';
import { fetchQuizForCountry } from '../../src/services/countryQuizService';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 5: COUNTRY SEARCH INTENT EXPANSION', () => {

  // =========================================================================
  // 1. CENTRAL QUALITY GATE: shouldIndexCountryIntentPage()
  // =========================================================================
  test.describe('Central Quality Gate: shouldIndexCountryIntentPage() Invariant Rules', () => {

    test('Rejects unknown, unverified, or malformed country slugs', () => {
      const unknownSlugs = ['atlantis', 'mars-colony', 'unknown-territory'];
      for (const slug of unknownSlugs) {
        for (const intent of ['news', 'geography', 'weather', 'map', 'quiz'] as CountryIntent[]) {
          const res = shouldIndexCountryIntentPage(slug, intent);
          expect(res.shouldIndex).toBe(false);
          expect(res.robotsDirective.index).toBe(false);
          expect(res.robotsDirective.follow).toBe(false);
          expect(res.reason).toContain('Unknown or unverified sovereign country');
        }
      }

      const emptySlugs = ['', '   '];
      for (const slug of emptySlugs) {
        for (const intent of ['news', 'geography', 'weather', 'map', 'quiz'] as CountryIntent[]) {
          const res = shouldIndexCountryIntentPage(slug, intent);
          expect(res.shouldIndex).toBe(false);
          expect(res.robotsDirective.index).toBe(false);
          expect(res.robotsDirective.follow).toBe(false);
          expect(res.reason).toContain('Missing or invalid country slug string');
        }
      }
    });

    test('Rejects duplicate alias slugs to prevent canonical equity cannibalization', () => {
      const aliasPairs: [string, string][] = [
        ['usa', 'united-states'],
        ['uk', 'united-kingdom'],
        ['uae', 'united-arab-emirates'],
        ['russian-federation', 'russia'],
      ];

      for (const [aliasSlug, canonicalSlug] of aliasPairs) {
        for (const intent of ['news', 'geography', 'weather', 'map', 'quiz'] as CountryIntent[]) {
          const res = shouldIndexCountryIntentPage(aliasSlug, intent);
          expect(res.shouldIndex).toBe(false);
          // Follow is true so link equity flows to the canonical page, but noindex prevents duplicate penalty
          expect(res.robotsDirective.index).toBe(false);
          expect(res.robotsDirective.follow).toBe(true);
          expect(res.canonicalSlug).toBe(canonicalSlug);
          expect(res.reason).toContain('is an alias for canonical');
        }
      }
    });

    test('News Gate: rejects empty news content', () => {
      const res = shouldIndexCountryIntentPage('japan', 'news', { articles: [] });
      expect(res.shouldIndex).toBe(false);
      expect(res.robotsDirective.index).toBe(false);
      expect(res.robotsDirective.follow).toBe(true);
      expect(res.reason).toContain('Zero real news events found');
    });

    test('News Gate: rejects temporary upstream errors', () => {
      const res = shouldIndexCountryIntentPage('india', 'news', {
        articles: [],
        isTemporaryError: true,
      });
      expect(res.shouldIndex).toBe(false);
      expect(res.robotsDirective.index).toBe(false);
      expect(res.robotsDirective.follow).toBe(true);
      expect(res.reason).toContain('Temporary news upstream provider error');
    });

    test('News Gate: accepts verified articles with headlines and sources', () => {
      const res = shouldIndexCountryIntentPage('india', 'news', {
        articles: [
          {
            title: 'ISRO Announces Advanced Earth Observation Satellite Launch',
            source: 'Press Trust of India',
            publishedAt: new Date().toISOString(),
          },
        ],
      });
      expect(res.shouldIndex).toBe(true);
      expect(res.robotsDirective.index).toBe(true);
      expect(res.robotsDirective.follow).toBe(true);
      expect(res.reason).toContain('Verified');
    });

    test('Weather Gate: rejects missing observation or null readings', () => {
      const resNull = shouldIndexCountryIntentPage('brazil', 'weather', { observation: null });
      expect(resNull.shouldIndex).toBe(false);
      expect(resNull.robotsDirective.index).toBe(false);
      expect(resNull.reason).toContain('Missing live weather telemetry');

      const resNaN = shouldIndexCountryIntentPage('brazil', 'weather', {
        observation: { temperature: NaN },
      });
      expect(resNaN.shouldIndex).toBe(false);
      expect(resNaN.robotsDirective.index).toBe(false);
    });

    test('Weather Gate: rejects temporary upstream 5xx/timeout errors', () => {
      const res = shouldIndexCountryIntentPage('brazil', 'weather', {
        observation: null,
        isTemporaryError: true,
      });
      expect(res.shouldIndex).toBe(false);
      expect(res.robotsDirective.index).toBe(false);
      expect(res.robotsDirective.follow).toBe(true);
      expect(res.reason).toContain('Temporary weather provider network failure');
    });

    test('Weather Gate: accepts verified real-world telemetry', () => {
      const res = shouldIndexCountryIntentPage('brazil', 'weather', {
        observation: {
          temperature: 24.5,
          weatherCode: 1,
          weatherDescription: 'Mainly clear',
        },
      });
      expect(res.shouldIndex).toBe(true);
      expect(res.robotsDirective.index).toBe(true);
      expect(res.robotsDirective.follow).toBe(true);
      expect(res.reason).toContain('Verified live weather telemetry');
    });

    test('Geography Gate: accepts canonical physical landscape records', () => {
      const country = getCountryBySlug('france')!;
      const res = shouldIndexCountryIntentPage('france', 'geography', country);
      expect(res.shouldIndex).toBe(true);
      expect(res.robotsDirective.index).toBe(true);
      expect(res.robotsDirective.follow).toBe(true);
    });

    test('Map Gate: verifies cartographic bounds and metropolitan locations', () => {
      const country = getCountryBySlug('germany')!;
      const res = shouldIndexCountryIntentPage('germany', 'map', country);
      expect(res.shouldIndex).toBe(true);
      expect(res.robotsDirective.index).toBe(true);
      expect(res.robotsDirective.follow).toBe(true);
    });

    test('Quiz Gate: rejects fewer than 3 questions', () => {
      const res = shouldIndexCountryIntentPage('india', 'quiz', {
        questions: [
          {
            id: 'q1',
            question: 'Capital of India?',
            choices: ['New Delhi', 'Mumbai'],
            correctIndex: 0,
          },
        ],
      });
      expect(res.shouldIndex).toBe(false);
      expect(res.robotsDirective.index).toBe(false);
      expect(res.reason).toContain('Insufficient Play Earth questions');
    });

    test('Quiz Gate: rejects malformed questions without choices or answers', () => {
      const res = shouldIndexCountryIntentPage('india', 'quiz', {
        questions: [
          { id: 'q1', question: 'Q1?', choices: [], correctIndex: 0 },
          { id: 'q2', question: 'Q2?', choices: ['A'], correctIndex: 0 },
          { id: 'q3', question: 'Q3?', choices: ['A', 'B'], correctIndex: -1 },
        ],
      });
      expect(res.shouldIndex).toBe(false);
      expect(res.robotsDirective.index).toBe(false);
      expect(res.reason).toContain('malformed');
    });

    test('Quiz Gate: accepts verified Play Earth question bank', () => {
      const res = shouldIndexCountryIntentPage('india', 'quiz', {
        questions: [
          { id: 'q1', question: 'Capital of India?', choices: ['New Delhi', 'Mumbai', 'Kolkata'], correctIndex: 0 },
          { id: 'q2', question: 'Highest mountain in India?', choices: ['Kangchenjunga', 'K2', 'Nanda Devi'], correctIndex: 0 },
          { id: 'q3', question: 'Currency of India?', choices: ['Rupee', 'Yen', 'Dinar'], correctIndex: 0 },
        ],
      });
      expect(res.shouldIndex).toBe(true);
      expect(res.robotsDirective.index).toBe(true);
      expect(res.robotsDirective.follow).toBe(true);
      expect(res.reason).toContain('Verified 3 authentic Play Earth geography questions');
    });
  });

  // =========================================================================
  // 2. LIVE INTEGRATIONS & AUTHENTIC SERVICE FEEDS
  // =========================================================================
  test.describe('Real-World Service Integrations: News, Weather, Quiz', () => {

    test('News Service: retrieves authentic wire dispatches with source attribution', async () => {
      const sampleCountries = ['India', 'Japan', 'United States'];

      for (const countryName of sampleCountries) {
        const news = await fetchNewsForCountry(countryName);
        expect(Array.isArray(news.articles)).toBe(true);
        expect(typeof news.isTemporaryError).toBe('boolean');

        for (const art of news.articles) {
          expect(art.title).toBeTruthy();
          expect(art.source).toBeTruthy();
          expect(art.originalUrl).toBeTruthy();
          expect(art.originalUrl).toMatch(/^https?:\/\//);
          expect(art.location).toBeTruthy();
          expect(art.publishedAt).toBeTruthy();
        }
      }
    });

    test('Weather Service: queries Open-Meteo and never fabricates readings', async () => {
      const testCoordinates = [
        { name: 'Tokyo (Japan)', lat: 35.68, lng: 139.69 },
        { name: 'New Delhi (India)', lat: 28.61, lng: 77.21 },
        { name: 'Paris (France)', lat: 48.85, lng: 2.35 },
      ];

      for (const loc of testCoordinates) {
        const res = await fetchCountryWeather(loc.lat, loc.lng);

        if (res.isTemporaryError) {
          // If network / API limit triggered, observation MUST be null (never synthetic)
          expect(res.observation).toBeNull();
        } else {
          expect(res.observation).not.toBeNull();
          const obs = res.observation!;
          expect(typeof obs.temperature).toBe('number');
          expect(isNaN(obs.temperature)).toBe(false);
          expect(typeof obs.relativeHumidity).toBe('number');
          expect(typeof obs.windSpeed).toBe('number');
          expect(obs.weatherDescription).toBeTruthy();
          expect(obs.weatherEmoji).toBeTruthy();
          expect(obs.timestamp).toBeTruthy();
        }
      }
    });

    test('Quiz Service: queries Play Earth question engine without fake questions', () => {
      const testCountries = ['India', 'Japan', 'Brazil', 'France', 'Germany', 'Australia'];

      for (const countryName of testCountries) {
        const quizData = fetchQuizForCountry(countryName);
        expect(quizData.countryName).toBe(countryName);
        expect(quizData.questions.length).toBeGreaterThanOrEqual(3);

        for (const q of quizData.questions) {
          expect(q.id).toBeTruthy();
          expect(q.question).toBeTruthy();
          expect(q.choices.length).toBeGreaterThanOrEqual(2);
          expect(typeof q.correctIndex).toBe('number');
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(q.choices.length);
          const correctAnswer = q.choices[q.correctIndex];
          expect(correctAnswer).toBeTruthy();
        }
      }
    });
  });

  // =========================================================================
  // 3. COUNTRY × INTENT COMBINATIONS MATRIX
  // =========================================================================
  test.describe('Country × Intent Combination Matrix Evaluation', () => {
    const representativeSlugs = [
      'india',
      'japan',
      'brazil',
      'france',
      'germany',
      'united-states',
      'south-africa',
      'canada',
      'australia',
      'italy',
    ];

    const intents: CountryIntent[] = ['news', 'geography', 'weather', 'map', 'quiz'];

    for (const slug of representativeSlugs) {
      for (const intent of intents) {
        test(`Country × Intent: /countries/${slug}/${intent} evaluation`, async () => {
          const country = getCountryBySlug(slug);
          expect(country).not.toBeNull();

          let mockPayload: any = country;
          if (intent === 'news') {
            mockPayload = await fetchNewsForCountry(country!.name);
          } else if (intent === 'weather') {
            mockPayload = await fetchCountryWeather(country!.coordinates.lat, country!.coordinates.lng);
          } else if (intent === 'quiz') {
            mockPayload = fetchQuizForCountry(country!.name);
          }

          const gateResult = shouldIndexCountryIntentPage(slug, intent, mockPayload);

          if (intent === 'weather') {
            if (mockPayload.isTemporaryError || !mockPayload.observation) {
              expect(gateResult.shouldIndex).toBe(false);
              expect(gateResult.robotsDirective.index).toBe(false);
            } else {
              expect(gateResult.shouldIndex).toBe(true);
              expect(gateResult.robotsDirective.index).toBe(true);
            }
          } else if (intent === 'news') {
            if (mockPayload.isTemporaryError || !mockPayload.articles || mockPayload.articles.length === 0) {
              expect(gateResult.shouldIndex).toBe(false);
              expect(gateResult.robotsDirective.index).toBe(false);
            } else {
              expect(gateResult.shouldIndex).toBe(true);
              expect(gateResult.robotsDirective.index).toBe(true);
            }
          } else if (intent === 'quiz') {
            if (!mockPayload.questions || mockPayload.questions.length < 3) {
              expect(gateResult.shouldIndex).toBe(false);
              expect(gateResult.robotsDirective.index).toBe(false);
            } else {
              expect(gateResult.shouldIndex).toBe(true);
              expect(gateResult.robotsDirective.index).toBe(true);
            }
          } else {
            // Geography & Map for canonical countries always pass
            expect(gateResult.shouldIndex).toBe(true);
            expect(gateResult.robotsDirective.index).toBe(true);
            expect(gateResult.robotsDirective.follow).toBe(true);
            expect(gateResult.canonicalSlug).toBe(slug);
          }
        });
      }
    }
  });
});
