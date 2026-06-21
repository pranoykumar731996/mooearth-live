// ============================================================
// MooEarth Live — Centralized Feature Flags Configuration
// ============================================================

export const FEATURES = {
  // Flag to temporarily disable the article translation system (UI & API)
  enableTranslation: process.env.NEXT_PUBLIC_ENABLE_TRANSLATION === 'true'
};
