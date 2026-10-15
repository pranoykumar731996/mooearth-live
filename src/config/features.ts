// ============================================================
// MooEarth Live — Centralized Feature Flags Configuration
// ============================================================

export const FEATURES = {
  // Flag to enable the article translation system (UI & API) - default enabled unless explicitly 'false'
  enableTranslation: process.env.NEXT_PUBLIC_ENABLE_TRANSLATION !== 'false',
  // Flag to enable advertising integration (default false, strictly off until configured)
  enableAds: process.env.NEXT_PUBLIC_ENABLE_ADS === 'true',
  // Flag to enable MooEarth Plus premium interest validation modal & buttons
  enablePlusValidation: process.env.NEXT_PUBLIC_ENABLE_PLUS_VALIDATION !== 'false',
  // Flag to enable sponsorship framework and labeled educational partner cards
  enableSponsorships: process.env.NEXT_PUBLIC_ENABLE_SPONSORSHIPS !== 'false',
  // Flag to enable Google News RSS ingestion & batchexecute resolution
  // Phase 2 Compliance: Disabled by default for commercial audit safety unless explicitly set to 'true'.
  // Alternative licensed providers recommended: NewsAPI.org, Bing News Search API, Reuters Connect.
  enableGoogleNewsRss: process.env.ENABLE_GOOGLE_NEWS_RSS === 'true',
};
