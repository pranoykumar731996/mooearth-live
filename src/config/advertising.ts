// ============================================================
// MooEarth.Live — Advertising Configuration & Placement Registry
// ============================================================
// Guarantees:
// 1. Off-by-default (enabled only when NEXT_PUBLIC_ENABLE_ADS === 'true').
// 2. Strict separation from editorial content and AI summaries.
// 3. No layout shifts (CLS prevention with reserved min-heights).
// 4. Zero credentials exposed; slots & client ID strictly via env vars.
// 5. Zero ad units inside interactive 3D globe, city maps, or game interaction zones.

import { getConsentPreferences } from '@/services/consentService';

export type AdProvider = 'none' | 'adsense' | 'custom_sponsor';

export type AdPlacementId =
  | 'article_bottom'
  | 'article_sidebar'
  | 'news_feed_banner'
  | 'weather_page_banner';

export interface AdPlacementConfig {
  id: AdPlacementId;
  label: string;
  minHeight: number;
  format: 'banner' | 'rectangle' | 'horizontal';
  description: string;
  slotEnvVar: string;
  slot?: string;
}

export const AD_PLACEMENTS: Record<AdPlacementId, AdPlacementConfig> = {
  article_bottom: {
    id: 'article_bottom',
    label: 'Article Bottom',
    minHeight: 250,
    format: 'rectangle',
    description: 'Clean rectangle unit below the complete verified report',
    slotEnvVar: 'NEXT_PUBLIC_AD_SLOT_ARTICLE_BOTTOM',
    slot: process.env.NEXT_PUBLIC_AD_SLOT_ARTICLE_BOTTOM || '',
  },
  article_sidebar: {
    id: 'article_sidebar',
    label: 'Article Sidebar',
    minHeight: 250,
    format: 'rectangle',
    description: 'Desktop sidebar widget placed below country and category context',
    slotEnvVar: 'NEXT_PUBLIC_AD_SLOT_ARTICLE_SIDEBAR',
    slot: process.env.NEXT_PUBLIC_AD_SLOT_ARTICLE_SIDEBAR || '',
  },
  news_feed_banner: {
    id: 'news_feed_banner',
    label: 'News Feed Banner',
    minHeight: 90,
    format: 'banner',
    description: 'Separated discovery feed banner outside ticker navigation',
    slotEnvVar: 'NEXT_PUBLIC_AD_SLOT_NEWS_FEED',
    slot: process.env.NEXT_PUBLIC_AD_SLOT_NEWS_FEED || '',
  },
  weather_page_banner: {
    id: 'weather_page_banner',
    label: 'Weather Dossier Banner',
    minHeight: 90,
    format: 'banner',
    description: 'Non-intrusive horizontal banner placed below live weather telemetry',
    slotEnvVar: 'NEXT_PUBLIC_AD_SLOT_WEATHER_BANNER',
    slot: process.env.NEXT_PUBLIC_AD_SLOT_WEATHER_BANNER || '',
  },
};

export const AD_CONFIG = {
  // Master toggle: Ads are strictly disabled unless explicitly turned on via env
  enabled: process.env.NEXT_PUBLIC_ENABLE_ADS === 'true',
  provider: (process.env.NEXT_PUBLIC_AD_PROVIDER as AdProvider) || 'adsense',
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '',
  testMode: process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_AD_TEST_MODE === 'true',
  collapseWhenDisabled: true,
  lazyLoadOffsetPx: 200,
};

/** Get the configured advertising runtime config */
export function getAdvertisingConfig() {
  return {
    enabled: AD_CONFIG.enabled,
    provider: AD_CONFIG.provider,
    client: AD_CONFIG.clientId,
    testMode: AD_CONFIG.testMode,
    collapseWhenDisabled: AD_CONFIG.collapseWhenDisabled,
    lazyLoadOffsetPx: AD_CONFIG.lazyLoadOffsetPx
  };
}

/** Get the configured slot ID for a specific placement */
export function getAdSlotId(placementId: AdPlacementId): string {
  return AD_PLACEMENTS[placementId]?.slot || '';
}

/** Determines whether an ad placement can and should render */
export function canRenderAd(placementId: AdPlacementId, isPlusSubscriber: boolean = false): boolean {
  if (isPlusSubscriber) return false;
  if (!AD_CONFIG.enabled) return false;
  
  // Verify user consent
  const consent = getConsentPreferences();
  if (!consent.advertising) return false;

  // In production with AdSense, require valid publisher client ID
  if (AD_CONFIG.provider === 'adsense' && !AD_CONFIG.clientId && !AD_CONFIG.testMode) {
    return false;
  }

  return Boolean(AD_PLACEMENTS[placementId]);
}
