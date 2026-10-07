// ============================================================
// MooEarth Live — i18n Central Module
// ============================================================

import { SupportedLocale, TranslationDictionary } from './types';
import { DICTIONARIES, SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALES_META } from './dictionaries';
import { getLocalizedCountryName } from './countryNames';

export * from './types';
export * from './dictionaries';
export * from './countryNames';

/**
 * Retrieve translation dictionary for a given locale, falling back to English
 */
export function getTranslation(locale: string = DEFAULT_LOCALE): TranslationDictionary {
  const norm = locale.toLowerCase() as SupportedLocale;
  if (DICTIONARIES[norm]) {
    return DICTIONARIES[norm];
  }
  return DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Check if a string is a supported locale code
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale.toLowerCase() as SupportedLocale);
}

/**
 * Generate hreflang language alternate URLs for Next.js metadata
 */
export function generateHreflangs(path: string, baseUrl: string = 'https://www.mooearth.live'): Record<string, string> {
  const cleanPath = (!path || path === '/') ? '' : (path.startsWith('/') ? path : `/${path}`);
  const alternates: Record<string, string> = {
    'x-default': `${baseUrl}${cleanPath}`,
  };

  SUPPORTED_LOCALES.forEach((locale) => {
    if (locale === DEFAULT_LOCALE) {
      alternates[locale] = `${baseUrl}${cleanPath}`;
    } else {
      alternates[locale] = `${baseUrl}/${locale}${cleanPath}`;
    }
  });

  return alternates;
}

/**
 * Returns a localized path string prefixed with the locale (except for default locale 'en')
 */
export function getLocalizedPath(path: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const cleanPath = (!path || path === '/') ? '' : (path.startsWith('/') ? path : `/${path}`);
  if (locale === DEFAULT_LOCALE) {
    return cleanPath || '/';
  }
  return `/${locale}${cleanPath}`;
}

/**
 * Returns the canonical URL for a given route path and locale
 */
export function getCanonicalUrl(path: string, locale: SupportedLocale = DEFAULT_LOCALE, baseUrl: string = 'https://www.mooearth.live'): string {
  const cleanPath = (!path || path === '/') ? '' : (path.startsWith('/') ? path : `/${path}`);
  if (locale === DEFAULT_LOCALE) {
    return `${baseUrl}${cleanPath}`;
  }
  return `${baseUrl}/${locale}${cleanPath}`;
}
