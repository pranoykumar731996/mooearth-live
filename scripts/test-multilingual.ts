import { SupportedLocale } from '../src/lib/i18n/types';
import { getTranslation, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../src/lib/i18n';
import { getLocalizedCountryName, getLocalizedContinentName, LOCALIZED_COUNTRIES } from '../src/lib/i18n/countryNames';

console.log('🌐 Starting MooEarth Live Multilingual System Validation...\n');

let failedTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

function resolvePath(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  if (typeof current === 'string' && current.trim().length > 0) {
    return current;
  }
  return undefined;
}

function t(path: string, locale: SupportedLocale, fallback?: string): string {
  const dict = getTranslation(locale);
  const val = resolvePath(dict, path);
  if (val) return val;
  const defaultDict = getTranslation(DEFAULT_LOCALE);
  const defVal = resolvePath(defaultDict, path);
  if (defVal) return defVal;
  return fallback ?? path;
}

// 1. Verify Supported Locales Count & Codes
const expectedLocales: SupportedLocale[] = ['en', 'es', 'fr', 'pt', 'de', 'ja', 'hi', 'ar'];
assert(
  SUPPORTED_LOCALES.length === 8 && expectedLocales.every(loc => SUPPORTED_LOCALES.includes(loc)),
  `All 8 expected locales are supported (${SUPPORTED_LOCALES.join(', ')})`
);

// 2. Verify Every Supported Locale has a Dictionary with Core Sections
for (const locale of SUPPORTED_LOCALES) {
  const dict = getTranslation(locale);
  assert(!!dict, `Dictionary exists for locale: [${locale}]`);
  assert(!!dict.navbar, `Navbar translations exist for [${locale}]`);
  assert(!!dict.sidebar, `Sidebar translations exist for [${locale}]`);
  assert(!!dict.liveFeed, `LiveFeed translations exist for [${locale}]`);
  assert(!!dict.countryHub, `CountryHub translations exist for [${locale}]`);
  assert(!!dict.common, `Common translations exist for [${locale}]`);
  assert(!!dict.gamesHub, `GamesHub translations exist for [${locale}]`);
  assert(!!dict.categories, `Categories translations exist for [${locale}]`);
}

// 3. Verify Translation Key Fallback
const missingKeyFallback = t('nonexistent.nested.key', 'fr', 'Mon Fallback');
assert(missingKeyFallback === 'Mon Fallback', 't() returns fallback when key does not exist');

// 4. Verify Translations for Spanish
assert(
  t('navbar.playEarth', 'es') === 'JUGAR TIERRA',
  'Spanish navbar.playEarth is translated to "JUGAR TIERRA"'
);
assert(
  t('sidebar.sports', 'es') === 'Deportes',
  'Spanish sidebar.sports is translated to "Deportes"'
);

// 5. Verify Translations for French
assert(
  t('navbar.playEarth', 'fr') === 'JOUER TERRE',
  'French navbar.playEarth is translated to "JOUER TERRE"'
);
assert(
  t('sidebar.weather', 'fr') === 'Météo',
  'French sidebar.weather is translated to "Météo"'
);

// 6. Verify Translations for German
assert(
  t('navbar.playEarth', 'de') === 'ERDE SPIELEN',
  'German navbar.playEarth is translated to "ERDE SPIELEN"'
);
assert(
  t('sidebar.business', 'de') === 'Wirtschaft',
  'German sidebar.business is translated to "Wirtschaft"'
);

// 7. Verify Translations for Japanese
assert(
  t('navbar.playEarth', 'ja') === '地球をプレイ',
  'Japanese navbar.playEarth is translated to "地球をプレイ"'
);
assert(
  t('sidebar.sports', 'ja') === 'スポーツ',
  'Japanese sidebar.sports is translated to "スポーツ"'
);

// 8. Verify Translations for Hindi
assert(
  t('navbar.playEarth', 'hi') === 'प्ले अर्थ',
  'Hindi navbar.playEarth is translated to "प्ले अर्थ"'
);
assert(
  t('sidebar.weather', 'hi') === 'मौसम',
  'Hindi sidebar.weather is translated to "मौसम"'
);

// 9. Verify Translations for Arabic (RTL)
assert(
  t('navbar.playEarth', 'ar') === 'العب الأرض',
  'Arabic navbar.playEarth is translated to "العب الأرض"'
);
assert(
  t('sidebar.news', 'ar') === 'الأخبار',
  'Arabic sidebar.news is translated to "الأخبار"'
);

// 10. Verify Country Name Localization
const testCountries = [
  { key: 'spain', es: 'España', ar: 'إسبانيا', ja: 'スペイン', hi: 'स्पेन' },
  { key: 'brazil', es: 'Brasil', ar: 'البرازيل', ja: 'ブラジル', hi: 'ब्राज़ील' },
  { key: 'japan', es: 'Japón', ar: 'اليابان', ja: '日本', hi: 'जापान' },
  { key: 'germany', es: 'Alemania', ar: 'ألمانيا', ja: 'ドイツ', hi: 'जर्मनी' },
];

for (const tc of testCountries) {
  assert(getLocalizedCountryName(tc.key, 'es') === tc.es, `Localizes ${tc.key} in Spanish to ${tc.es}`);
  assert(getLocalizedCountryName(tc.key, 'ar') === tc.ar, `Localizes ${tc.key} in Arabic to ${tc.ar}`);
  assert(getLocalizedCountryName(tc.key, 'ja') === tc.ja, `Localizes ${tc.key} in Japanese to ${tc.ja}`);
  assert(getLocalizedCountryName(tc.key, 'hi') === tc.hi, `Localizes ${tc.key} in Hindi to ${tc.hi}`);
}

// 11. Verify Continent Localization
assert(getLocalizedContinentName('asia', 'ja') === 'アジア', 'Localizes continent Asia to Japanese');
assert(getLocalizedContinentName('europe', 'es') === 'Europa', 'Localizes continent Europe to Spanish');
assert(getLocalizedContinentName('africa', 'ar') === 'إفريقيا', 'Localizes continent Africa to Arabic');

console.log(`\n========================================`);
console.log(`Validation Results: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 Multilingual system test passed flawlessly!');
}
