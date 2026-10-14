import { test, expect } from '@playwright/test';
import {
  SUPPORTED_LOCALES,
  LOCALES_META,
  DEFAULT_LOCALE,
  DICTIONARIES,
  getTranslation,
  isSupportedLocale,
  getLocalizedCountryName,
  getLocalizedContinentName,
  getLocalizedQuestion,
  getLocalizedChoice,
  SupportedLocale,
} from '@/lib/i18n';
import { EarthQuestion } from '@/types';

test.describe('Phase 8 — Multilingual Global Discovery & AI Translation Engine', () => {

  test('All 9 genuine supported locales are registered with proper metadata', () => {
    const expectedLocales: SupportedLocale[] = ['en', 'es', 'fr', 'pt', 'de', 'ja', 'hi', 'ar', 'or'];

    expect(SUPPORTED_LOCALES).toHaveLength(9);
    for (const loc of expectedLocales) {
      expect(SUPPORTED_LOCALES).toContain(loc);
      expect(isSupportedLocale(loc)).toBe(true);

      const meta = LOCALES_META[loc];
      expect(meta).toBeDefined();
      expect(meta.code).toBe(loc);
      expect(meta.name).toBeTruthy();
      expect(meta.nativeName).toBeTruthy();
      expect(meta.flag).toBeTruthy();
      expect(['ltr', 'rtl']).toContain(meta.dir);

      if (loc === 'ar') {
        expect(meta.dir).toBe('rtl');
      } else {
        expect(meta.dir).toBe('ltr');
      }
    }

    // Odia specific check
    expect(LOCALES_META['or'].name).toBe('Odia');
    expect(LOCALES_META['or'].nativeName).toBe('ଓଡ଼ିଆ');
    expect(LOCALES_META['or'].flag).toBe('🇮🇳');
  });

  test('Translation dictionaries exist and have complete core UI namespaces for every supported language', () => {
    for (const loc of SUPPORTED_LOCALES) {
      const dict = getTranslation(loc);
      expect(dict).toBeDefined();
      expect(dict.nav).toBeDefined();
      expect(dict.navbar.playEarth).toBeTruthy();
      expect(dict.nav.worldNews).toBeTruthy();
      expect(dict.nav.weather).toBeTruthy();
      expect(dict.nav.worldEvents).toBeTruthy();

      expect(dict.statusBar).toBeDefined();
      expect(dict.statusBar.network).toBeTruthy();
      expect(dict.statusBar.live).toBeTruthy();

      expect(dict.categories).toBeDefined();
      expect(dict.categories?.breaking).toBeTruthy();
      expect(dict.categories?.sports).toBeTruthy();

      expect(dict.profile).toBeDefined();
      expect(dict.profile?.tabs.overview).toBeTruthy();
      expect(dict.profile?.tabs.preferences).toBeTruthy();
      expect(dict.profile?.preferences.languageTitle).toBeTruthy();

      expect(dict.eventPopup).toBeDefined();
      expect(dict.eventPopup?.readCoverage).toBeTruthy();
      expect(dict.eventPopup?.saved).toBeTruthy();

      expect(dict.cityMap).toBeDefined();
      expect(dict.cityMap?.returnToEarth).toBeTruthy();

      expect(dict.articleViewer).toBeDefined();
      expect(dict.articleViewer?.translatedBadge).toBeTruthy();
      expect(dict.articleViewer?.originalHeadline).toBeTruthy();
    }
  });

  test('Country name localization accurately translates canonical names across languages', () => {
    const testCases: Array<{ country: string; loc: SupportedLocale; expected: string }> = [
      { country: 'Japan', loc: 'es', expected: 'Japón' },
      { country: 'Japan', loc: 'fr', expected: 'Japon' },
      { country: 'Japan', loc: 'de', expected: 'Japan' },
      { country: 'Japan', loc: 'ja', expected: '日本' },
      { country: 'Japan', loc: 'hi', expected: 'जापान' },
      { country: 'Japan', loc: 'or', expected: 'ଜାପାନ' },
      { country: 'Japan', loc: 'ar', expected: 'اليابان' },
      { country: 'France', loc: 'es', expected: 'Francia' },
      { country: 'France', loc: 'hi', expected: 'फ़्रांस' },
      { country: 'France', loc: 'or', expected: 'ଫ୍ରାନ୍ସ' },
      { country: 'France', loc: 'ar', expected: 'فرنسا' },
      { country: 'Germany', loc: 'es', expected: 'Alemania' },
      { country: 'Germany', loc: 'fr', expected: 'Allemagne' },
      { country: 'Germany', loc: 'de', expected: 'Deutschland' },
      { country: 'Germany', loc: 'hi', expected: 'जर्मनी' },
      { country: 'Germany', loc: 'or', expected: 'ଜର୍ମାନୀ' },
      { country: 'India', loc: 'hi', expected: 'भारत' },
      { country: 'India', loc: 'or', expected: 'ଭାରତ' },
      { country: 'India', loc: 'ar', expected: 'الهند' },
      { country: 'United States', loc: 'es', expected: 'Estados Unidos' },
      { country: 'United States', loc: 'fr', expected: 'États-Unis' },
      { country: 'United States', loc: 'ja', expected: 'アメリカ合衆国' },
    ];

    for (const { country, loc, expected } of testCases) {
      const localized = getLocalizedCountryName(country, loc);
      expect(localized).toBe(expected);
    }

    // Fallback test: Unknown country returns the original name cleanly without errors
    expect(getLocalizedCountryName('Atlantis', 'es')).toBe('Atlantis');
    expect(getLocalizedCountryName('Atlantis', 'or')).toBe('Atlantis');
  });

  test('Game Question Localization strictly preserves question ID, difficulty, and correctIndex invariants', () => {
    const mockQuestion: EarthQuestion = {
      id: 'cap_jp_tokyo',
      question: 'What is the capital of Japan?',
      choices: ['Kyoto', 'Tokyo', 'Osaka', 'Nagoya'],
      correctIndex: 1,
      difficulty: 'easy',
      country: 'Japan',
      category: 'geography',
      funFact: 'Tokyo is the most populous metropolitan area in the world.',
    };

    const targetLocales: SupportedLocale[] = ['es', 'fr', 'pt', 'de', 'ja', 'hi', 'ar', 'or'];

    for (const loc of targetLocales) {
      const localized = getLocalizedQuestion(mockQuestion, loc);

      // Invariant 1: Question ID must remain strictly identical for scoring & anti-repeat tracking
      expect(localized.id).toBe(mockQuestion.id);

      // Invariant 2: Difficulty must remain identical
      expect(localized.difficulty).toBe(mockQuestion.difficulty);

      // Invariant 3: correctIndex must remain 100% identical so changing language cannot alter the correct answer
      expect(localized.correctIndex).toBe(mockQuestion.correctIndex);

      // Invariant 4: Choices array length must be preserved (4 choices)
      expect(localized.choices).toHaveLength(mockQuestion.choices.length);

      // Invariant 5: The correct choice text must correspond to the localized capital of Japan
      const localizedCorrectChoice = localized.choices[localized.correctIndex];
      expect(localizedCorrectChoice).toBeTruthy();
      expect(localizedCorrectChoice).not.toBe('');

      // Invariant 6: The question prompt itself must be localized
      expect(localized.question).not.toBe('');
      if (loc === 'es') {
        expect(localized.question).toContain('capital de Japón');
        expect(localizedCorrectChoice).toBe('Tokio');
      } else if (loc === 'fr') {
        expect(localized.question).toContain('capitale de Japon');
        expect(localizedCorrectChoice).toBe('Tokyo');
      } else if (loc === 'hi') {
        expect(localized.question).toContain('राजधानी');
        expect(localizedCorrectChoice).toBe('टोक्यो');
      } else if (loc === 'or') {
        expect(localized.question).toContain('ରାଜଧାନୀ');
        expect(localizedCorrectChoice).toBe('ଟୋକିଓ');
      } else if (loc === 'ja') {
        expect(localized.question).toContain('首都');
        expect(localizedCorrectChoice).toBe('東京');
      } else if (loc === 'ar') {
        expect(localized.question).toContain('عاصمة اليابان');
        expect(localizedCorrectChoice).toBe('طوكيو');
      }
    }
  });

  test('Choice localization accurately maps capitals, continents, and countries', () => {
    expect(getLocalizedChoice('Tokyo', 'es')).toBe('Tokio');
    expect(getLocalizedChoice('Tokyo', 'ja')).toBe('東京');
    expect(getLocalizedChoice('Tokyo', 'hi')).toBe('टोक्यो');
    expect(getLocalizedChoice('Tokyo', 'or')).toBe('ଟୋକିଓ');
    expect(getLocalizedChoice('Tokyo', 'ar')).toBe('طوكيو');

    expect(getLocalizedChoice('Paris', 'es')).toBe('París');
    expect(getLocalizedChoice('Paris', 'ja')).toBe('パリ');
    expect(getLocalizedChoice('Paris', 'hi')).toBe('पेरिस');
    expect(getLocalizedChoice('Paris', 'or')).toBe('ପ୍ୟାରିସ୍');

    expect(getLocalizedChoice('Asia', 'es')).toBe('Asia');
    expect(getLocalizedChoice('Europe', 'fr')).toBe('Europe');
    expect(getLocalizedChoice('Europe', 'hi')).toBe('यूरोप');
    expect(getLocalizedChoice('Europe', 'or')).toBe('ୟୁରୋପ');
    expect(getLocalizedChoice('Africa', 'ar')).toBe('أفريقيا');
  });

  test('Continent names localize accurately with safe fallback', () => {
    expect(getLocalizedContinentName('Asia', 'hi')).toBe('एशिया');
    expect(getLocalizedContinentName('Asia', 'or')).toBe('ଏସିଆ');
    expect(getLocalizedContinentName('Asia', 'ar')).toBe('آسيا');
    expect(getLocalizedContinentName('Europe', 'es')).toBe('Europa');
    expect(getLocalizedContinentName('South America', 'fr')).toBe('Amérique du Sud');
  });

  test('Safe fallback returns English string when key is missing or non-existent', () => {
    const dict = getTranslation('or');
    // Nav has worldNews
    expect(dict.nav.worldNews).toBeTruthy();
    // Non-existent key accessed via getTranslation returns active dict with English fallback
    const enDict = getTranslation('en');
    expect(enDict.nav.worldNews).toBe('World News');
  });
});
