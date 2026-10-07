// ============================================================
// MooEarth Live — Language & Translation Context
// ============================================================

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  SupportedLocale,
  LocaleMeta,
  TranslationDictionary,
  SUPPORTED_LOCALES,
  LOCALES_META,
  DEFAULT_LOCALE,
  DICTIONARIES,
  getTranslation,
  isSupportedLocale,
} from '@/lib/i18n';

export interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (newLocale: SupportedLocale) => void;
  t: (path: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  meta: LocaleMeta;
  allLocales: SupportedLocale[];
  dict: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

/**
 * Traverses an object using dot notation path (e.g. 'nav.home' or 'statusBar.activeStories')
 */
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

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Helper to detect locale from pathname
  const detectLocaleFromPath = useCallback((path: string): SupportedLocale | null => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0 && isSupportedLocale(segments[0])) {
      return segments[0];
    }
    return null;
  }, []);

  // Determine initial state
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (initialLocale && isSupportedLocale(initialLocale)) {
      return initialLocale;
    }
    const fromPath = detectLocaleFromPath(pathname);
    if (fromPath) {
      return fromPath;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mooearth_locale');
      if (saved && isSupportedLocale(saved)) {
        return saved;
      }
    }
    return DEFAULT_LOCALE;
  });

  // Sync state when pathname changes (e.g., user navigates to /es or /)
  useEffect(() => {
    const fromPath = detectLocaleFromPath(pathname);
    if (fromPath && fromPath !== locale) {
      setLocaleState(fromPath);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mooearth_locale', fromPath);
      }
    }
  }, [pathname, detectLocaleFromPath, locale]);

  // Sync HTML document attributes (lang & dir for RTL support)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRtl = locale === 'ar';
      document.documentElement.lang = locale;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

      if (isRtl) {
        document.documentElement.classList.add('rtl-mode');
      } else {
        document.documentElement.classList.remove('rtl-mode');
      }
    }
  }, [locale]);

  // Switch locale handler
  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      if (!isSupportedLocale(newLocale)) return;

      setLocaleState(newLocale);

      if (typeof window !== 'undefined') {
        localStorage.setItem('mooearth_locale', newLocale);
        const isRtl = newLocale === 'ar';
        document.documentElement.lang = newLocale;
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        if (isRtl) {
          document.documentElement.classList.add('rtl-mode');
        } else {
          document.documentElement.classList.remove('rtl-mode');
        }

        window.dispatchEvent(
          new CustomEvent('mooearth-locale-change', { detail: { locale: newLocale } })
        );
      }

      // Update URL route path cleanly
      const segments = pathname.split('/').filter(Boolean);
      const hasLangPrefix = segments.length > 0 && isSupportedLocale(segments[0]);
      const cleanSegments = hasLangPrefix ? segments.slice(1) : segments;

      let newPath = '';
      if (newLocale === 'en') {
        newPath = cleanSegments.length === 0 ? '/' : `/${cleanSegments.join('/')}`;
      } else {
        newPath = cleanSegments.length === 0 ? `/${newLocale}` : `/${newLocale}/${cleanSegments.join('/')}`;
      }

      if (typeof window !== 'undefined' && window.location.search) {
        newPath += window.location.search;
      }

      if (typeof window !== 'undefined' && window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
    },
    [pathname]
  );

  // Active translation dictionary
  const dict = useMemo(() => {
    return getTranslation(locale);
  }, [locale]);

  const fallbackDict = useMemo(() => {
    return DICTIONARIES[DEFAULT_LOCALE];
  }, []);

  // Translation lookup function with safe English and string fallbacks
  const t = useCallback(
    (path: string, fallback?: string): string => {
      // 1. Try active dictionary
      const val = resolvePath(dict, path);
      if (val !== undefined) return val;

      // 2. Try English fallback dictionary
      const fallbackVal = resolvePath(fallbackDict, path);
      if (fallbackVal !== undefined) return fallbackVal;

      // 3. Fallback to provided string or the key itself
      return fallback !== undefined ? fallback : path;
    },
    [dict, fallbackDict]
  );

  const isRTL = locale === 'ar';
  const dir: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr';
  const meta = LOCALES_META[locale] || LOCALES_META[DEFAULT_LOCALE];

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dir,
      isRTL,
      meta,
      allLocales: SUPPORTED_LOCALES,
      dict,
    }),
    [locale, setLocale, t, dir, isRTL, meta, dict]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * Hook to access full language state and controller
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider (e.g. testing or isolated render)
    const defaultDict = DICTIONARIES[DEFAULT_LOCALE];
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (path: string, fallback?: string) => resolvePath(defaultDict, path) || fallback || path,
      dir: 'ltr',
      isRTL: false,
      meta: LOCALES_META[DEFAULT_LOCALE],
      allLocales: SUPPORTED_LOCALES,
      dict: defaultDict,
    };
  }
  return context;
}

/**
 * Hook specifically for translations
 */
export function useTranslation() {
  const { t, locale, dir, isRTL, dict } = useLanguage();
  return { t, locale, dir, isRTL, dict };
}
