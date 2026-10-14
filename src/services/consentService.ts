// ============================================================
// MooEarth.Live — Privacy & Consent Management Service
// ============================================================
// Compliance: GDPR (EU), CCPA/CPRA (California), ePrivacy Directive
// Ensures:
// 1. Strict default-denied for non-essential cookies and tracking.
// 2. Google Consent Mode v2 integration.
// 3. Transparent user controls and preference management.
// 4. Zero transmission of personal or sensitive data.

export interface ConsentPreferences {
  essential: true; // Always true, required for authentication, saved places & language
  analytics: boolean; // Anonymous traffic & feature usage telemetry
  advertising: boolean; // Display of advertisements
  personalizedAds: boolean; // Personalized vs contextual ads
  respondedAt: number | null; // Timestamp of consent action
}

const CONSENT_STORAGE_KEY = 'mooearth_consent_v1';

export const DEFAULT_CONSENT: ConsentPreferences = {
  essential: true,
  analytics: false,
  advertising: false,
  personalizedAds: false,
  respondedAt: null,
};

/** Get the current user consent preferences from localStorage */
export function getConsentPreferences(): ConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw);
    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      advertising: Boolean(parsed.advertising),
      personalizedAds: Boolean(parsed.personalizedAds),
      respondedAt: parsed.respondedAt ? Number(parsed.respondedAt) : null,
    };
  } catch {
    return DEFAULT_CONSENT;
  }
}

/** Check if the user has already chosen their consent preferences */
export function hasUserAnsweredConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.respondedAt === 'number' && parsed.respondedAt > 0;
  } catch {
    return false;
  }
}

/** Save consent choices, update Google Consent Mode v2, and notify app listeners */
export function setConsentPreferences(prefs: Partial<ConsentPreferences>): ConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;

  const current = getConsentPreferences();
  const updated: ConsentPreferences = {
    essential: true,
    analytics: prefs.analytics !== undefined ? Boolean(prefs.analytics) : current.analytics,
    advertising: prefs.advertising !== undefined ? Boolean(prefs.advertising) : current.advertising,
    personalizedAds: prefs.personalizedAds !== undefined ? Boolean(prefs.personalizedAds) : current.personalizedAds,
    respondedAt: Date.now(),
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[ConsentService] Failed to save consent preferences:', e);
  }

  // Update Google Consent Mode v2 if gtag is available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      analytics_storage: updated.analytics ? 'granted' : 'denied',
      ad_storage: updated.advertising ? 'granted' : 'denied',
      ad_user_data: updated.advertising && updated.personalizedAds ? 'granted' : 'denied',
      ad_personalization: updated.advertising && updated.personalizedAds ? 'granted' : 'denied',
    });
  }

  // Dispatch global window event for components (e.g. AdUnit, Analytics) to react immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mooearth_consent_changed', { detail: updated }));
  }

  return updated;
}

/** Convenient helper to accept all categories */
export function acceptAllConsent(): ConsentPreferences {
  return setConsentPreferences({
    analytics: true,
    advertising: true,
    personalizedAds: true,
  });
}

/** Convenient helper to reject all optional categories (strictly essential only) */
export function rejectOptionalConsent(): ConsentPreferences {
  return setConsentPreferences({
    analytics: false,
    advertising: false,
    personalizedAds: false,
  });
}

// Aliases for intuitive API usage
export const getStoredConsent = getConsentPreferences;
export const hasUserResponded = hasUserAnsweredConsent;
export const updateConsentState = setConsentPreferences;
export const rejectNonEssentialConsent = rejectOptionalConsent;
