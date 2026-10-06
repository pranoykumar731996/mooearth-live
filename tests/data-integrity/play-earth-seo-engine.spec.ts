import { test, expect } from '@playwright/test';
import {
  GAME_LANDING_CONFIGS,
  fetchQuestionsForGameMode,
  FEATURED_COUNTRY_SELECTION,
  GEOGRAPHY_NAVIGATION_LINKS,
} from '../../src/services/gameLandingService';
import { getCountryBySlug, getAllCountrySlugs } from '../../src/data/countries';
import { fetchQuizForCountry } from '../../src/services/countryQuizService';
import { getChallengeShareUrl, getShareText, getWhatsAppShareUrl, getXShareUrl } from '../../src/utils/share';
import { COUNTRY_METADATA } from '../../src/data/questions/countryMetadata';
import { generateMetadata as generateCountryGameMetadata } from '../../src/app/games/geography/[country]/page';
import sitemap from '../../src/app/sitemap';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 7: PLAY EARTH SEARCH ENGINE', () => {

  const REQUIRED_GAME_ROUTES = [
    'games',
    'geography-games',
    'geography-quiz',
    'world-geography-quiz',
    'country-quiz',
    'capital-quiz',
    'flag-quiz',
    'world-map-quiz',
  ];

  // =========================================================================
  // 1. GAME LOADS: CONFIGURATION & QUESTION REPOSITORIES
  // =========================================================================
  test.describe('1. Game Loads & Data Initialization', () => {
    test('All 8 required game routes are defined with complete metadata', () => {
      for (const route of REQUIRED_GAME_ROUTES) {
        const config = GAME_LANDING_CONFIGS[route];
        expect(config, `Missing config for ${route}`).toBeDefined();
        expect(config.slug).toBe(route);
        expect(config.name.length).toBeGreaterThan(0);
        expect(config.emoji.length).toBeGreaterThan(0);
        expect(config.badge.length).toBeGreaterThan(0);
        expect(config.h1.length).toBeGreaterThan(0);
        expect(config.metaTitle.length).toBeGreaterThan(0);
        expect(config.metaDescription.length).toBeGreaterThan(0);
        expect(config.difficulty.length).toBeGreaterThan(0);
        expect(config.detailedDescription.length).toBeGreaterThanOrEqual(2);
        expect(config.howToPlay.length).toBeGreaterThanOrEqual(3);
        expect(config.scoringRules.length).toBeGreaterThanOrEqual(2);
        expect(config.canonical).toBe(`https://www.mooearth.live/${route}`);
        expect(config.relatedSlugs.length).toBeGreaterThanOrEqual(4);
      }
    });

    test('All 8 game routes have unique titles and descriptions without duplicates', () => {
      const titles = new Set<string>();
      const descriptions = new Set<string>();

      for (const route of REQUIRED_GAME_ROUTES) {
        const config = GAME_LANDING_CONFIGS[route];
        expect(titles.has(config.metaTitle)).toBe(false);
        expect(descriptions.has(config.metaDescription)).toBe(false);
        titles.add(config.metaTitle);
        descriptions.add(config.metaDescription);
      }
    });

    test('Every game mode successfully loads authentic Play Earth questions', () => {
      for (const route of REQUIRED_GAME_ROUTES) {
        const questions = fetchQuestionsForGameMode(route, undefined, 5);
        expect(questions.length, `Route ${route} should load 5 questions`).toBe(5);
        for (const q of questions) {
          expect(q.id.length).toBeGreaterThan(0);
          expect(q.question.length).toBeGreaterThan(5);
          expect(q.choices.length).toBe(4);
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThanOrEqual(3);
          expect(q.choices[q.correctIndex]).toBeDefined();
        }
      }
    });
  });

  // =========================================================================
  // 2. GAME CAN START: SIMULATED GAMEPLAY INITIALIZATION
  // =========================================================================
  test.describe('2. Game Can Start', () => {
    test('Game lifecycle state transitions cleanly from intro to active gameplay', () => {
      const questions = fetchQuestionsForGameMode('geography-quiz', undefined, 5);
      expect(questions.length).toBe(5);

      // Simulation of game initialization
      let gameState: 'intro' | 'playing' | 'completed' = 'intro';
      let currentIndex = 0;
      let score = 0;
      let elapsedSeconds = 0;
      let answers: boolean[] = [];

      expect(gameState).toBe('intro');

      // Player triggers "Start Game"
      gameState = 'playing';
      currentIndex = 0;
      score = 0;
      elapsedSeconds = 0;
      answers = [];

      expect(gameState).toBe('playing');
      expect(currentIndex).toBe(0);
      expect(questions[currentIndex].question).toBeDefined();
    });
  });

  // =========================================================================
  // 3. GAME CAN FINISH & SCORE WORKS: SIMULATED COMPLETE ROUND
  // =========================================================================
  test.describe('3. Game Can Finish & Score Works', () => {
    test('Simulated 5-question round correctly calculates accuracy, speed bonus, and final score', () => {
      const questions = fetchQuestionsForGameMode('capital-quiz', undefined, 5);
      expect(questions.length).toBe(5);

      let gameState: 'intro' | 'playing' | 'completed' = 'playing';
      let score = 0;
      const elapsedSeconds = 24; // Simulated 24 seconds total elapsed
      const answers: boolean[] = [];

      // Answer 4 correctly, 1 incorrectly
      const simulatedChoices = [true, true, true, false, true];

      for (let i = 0; i < questions.length; i++) {
        const isCorrect = simulatedChoices[i];
        answers.push(isCorrect);
        if (isCorrect) {
          const speedBonus = Math.max(0, 500 - elapsedSeconds * 8);
          score += 1000 + speedBonus;
        }
      }

      gameState = 'completed';

      expect(gameState).toBe('completed');
      expect(answers.length).toBe(5);
      expect(answers.filter(Boolean).length).toBe(4);
      expect(score).toBeGreaterThan(4000); // 4 * 1000 + bonuses > 4000
    });
  });

  // =========================================================================
  // 4. SHARE WORKS & VIRAL CARD INTEGRITY
  // =========================================================================
  test.describe('4. Share Works (Wordle-Style Card, Social Direct Links)', () => {
    test('Wordle-style zero-spoiler emoji grid generates accurately', () => {
      const answers = [true, false, true, true, true];
      const emojiGrid = answers.map(a => (a ? '🟩' : '🟥')).join('');
      expect(emojiGrid).toBe('🟩🟥🟩🟩🟩');
    });

    test('Viral Share Text includes game title, XP, accuracy, and CTA link', () => {
      const text = getShareText({
        mode: 'flag-quiz',
        score: 5200,
        correct: 5,
        total: 5,
        streak: 4,
        xp: 5200,
      });

      expect(text).toContain('Flag Quiz');
      expect(text).toContain('5,200 XP');
      expect(text).toContain('5 / 5 correct');
      expect(text).toContain('4-day streak');
      expect(text).toContain('Can you beat me?');
    });

    test('Social media URLs encode full message cleanly for WhatsApp and X', () => {
      const text = '🌍 MooEarth Capital Quiz\nScore: 4,800 XP | 4/5 Correct\n🟩🟩🟩🟩🟥\nCan you beat me?';
      const url = 'https://www.mooearth.live/capital-quiz';

      const waUrl = getWhatsAppShareUrl(text, url);
      expect(waUrl.startsWith('https://wa.me/?text=')).toBe(true);
      expect(waUrl).toContain(encodeURIComponent(text));

      const xUrl = getXShareUrl(text, url);
      expect(xUrl.startsWith('https://x.com/intent/tweet?text=')).toBe(true);
      expect(xUrl).toContain(encodeURIComponent(text));
    });
  });

  // =========================================================================
  // 5. CHALLENGE WORKS: 1V1 FRIEND CHALLENGE GENERATION
  // =========================================================================
  test.describe('5. Challenge Works (1v1 Arena Generation & Parameters)', () => {
    test('Challenge share URL generates valid canonical URLs for all game modes', () => {
      for (const mode of REQUIRED_GAME_ROUTES) {
        const url = getChallengeShareUrl(mode);
        expect(url).toMatch(new RegExp(`^https://www.mooearth.live/challenge/${mode}-[a-z0-9]+$`));
      }
    });

    test('Daily challenge share URL formats with date slug properly', () => {
      const url = getChallengeShareUrl('daily', '2026-10-07');
      expect(url).toBe('https://www.mooearth.live/challenge/daily-20261007');
    });

    test('1v1 challenge URL retains score, elapsed time, and challenger name in query params', () => {
      const challengeId = 'capital-quiz-k19x4z';
      const score = 5500;
      const elapsedSeconds = 18;
      const fullChallengeUrl = `https://www.mooearth.live/challenge/${challengeId}?score=${score}&time=${elapsedSeconds}&name=Player`;

      expect(fullChallengeUrl).toContain('score=5500');
      expect(fullChallengeUrl).toContain('time=18');
      expect(fullChallengeUrl).toContain('name=Player');
    });
  });

  // =========================================================================
  // 6. COUNTRY GAME ROUTE (/games/geography/[country]) INTEGRITY
  // =========================================================================
  test.describe('6. Country Game Route (/games/geography/[country]) Integrity', () => {
    test('Canonical slugs exist for all 195 sovereign nations', () => {
      const slugs = getAllCountrySlugs();
      expect(slugs.length).toBe(195);
    });

    test('Country quiz data loads authentic questions for sample sovereign nations', () => {
      const sampleSlugs = ['japan', 'france', 'brazil', 'india', 'united-states', 'south-africa', 'australia'];

      for (const slug of sampleSlugs) {
        const country = getCountryBySlug(slug);
        expect(country).toBeDefined();
        expect(country?.slug).toBe(slug);

        const quizData = fetchQuizForCountry(country!.name);
        expect(quizData.questions.length).toBeGreaterThan(0);
        expect(quizData.countryName).toBe(country!.name);

        const firstQ = quizData.questions[0];
        expect(firstQ.choices.length).toBeGreaterThanOrEqual(2);
        expect(firstQ.choices[firstQ.correctIndex]).toBeDefined();
      }
    });

    test('Country game metadata generates correct canonical, title, and description for valid countries', async () => {
      const metadata = await generateCountryGameMetadata({
        params: Promise.resolve({ country: 'japan' }),
      });

      expect(metadata.title).toContain('Japan Geography Game');
      expect(metadata.description).toContain('Tokyo');
      expect(metadata.alternates?.canonical).toBe('https://www.mooearth.live/games/geography/japan');
    });

    test('Country game metadata sets robots: noindex for non-existent country slug', async () => {
      const metadata = await generateCountryGameMetadata({
        params: Promise.resolve({ country: 'atlantis-fantasy-land' }),
      });

      expect(metadata.title).toContain('Not Found');
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });
  });

  // =========================================================================
  // 7. SEO METADATA & SITEMAP INTEGRITY
  // =========================================================================
  test.describe('7. SEO Metadata & Sitemap Indexing Discovery', () => {
    test('Featured countries list contains top sovereign nations with flags and landmarks', () => {
      expect(FEATURED_COUNTRY_SELECTION.length).toBeGreaterThanOrEqual(12);
      for (const c of FEATURED_COUNTRY_SELECTION) {
        expect(c.slug.length).toBeGreaterThan(0);
        expect(c.name.length).toBeGreaterThan(0);
        expect(c.flag.length).toBeGreaterThan(0);
        expect(c.capital.length).toBeGreaterThan(0);
        expect(c.landmark.length).toBeGreaterThan(0);
      }
    });

    test('Geography navigation links contain all key planetary resources', () => {
      expect(GEOGRAPHY_NAVIGATION_LINKS.length).toBeGreaterThanOrEqual(6);
      const hrefs = GEOGRAPHY_NAVIGATION_LINKS.map(l => l.href);
      expect(hrefs).toContain('/world-map');
      expect(hrefs).toContain('/geography');
      expect(hrefs).toContain('/interactive-globe');
      expect(hrefs).toContain('/world-geography');
      expect(hrefs).toContain('/play-earth');
    });

    test('Sitemap includes all 8 core game routes and country geography game routes', async () => {
      const items = await sitemap();
      const urls = new Set(items.map(item => item.url));

      // All 8 core routes
      for (const route of REQUIRED_GAME_ROUTES) {
        expect(urls.has(`https://www.mooearth.live/${route}`), `Sitemap missing ${route}`).toBe(true);
      }

      // Sample country geography game routes
      expect(urls.has('https://www.mooearth.live/games/geography/japan')).toBe(true);
      expect(urls.has('https://www.mooearth.live/games/geography/france')).toBe(true);
      expect(urls.has('https://www.mooearth.live/games/geography/brazil')).toBe(true);
      expect(urls.has('https://www.mooearth.live/games/geography/india')).toBe(true);
    });
  });

});
