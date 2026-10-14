// ============================================================
// MooEarth Live — Centralized Feature Flags Configuration
// ============================================================

export const FEATURES = {
  // Flag to enable the article translation system (UI & API) - default enabled unless explicitly 'false'
  enableTranslation: process.env.NEXT_PUBLIC_ENABLE_TRANSLATION !== 'false'
};
