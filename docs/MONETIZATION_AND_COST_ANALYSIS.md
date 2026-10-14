# MooEarth.Live — Phase 9: Monetization Foundation & Revenue Experiments

**Production Environment:** [https://mooearth.live](https://mooearth.live/)  
**Repository:** [https://github.com/pranoykumar731996/mooearth-live](https://github.com/pranoykumar731996/mooearth-live)  
**Status:** Implemented, Tested & Verified (Off-by-Default Foundation)  
**Date:** October 2026  

---

## 1. Executive Summary & Architecture Audit

Phase 9 establishes an ethical, privacy-respecting, and mathematically sustainable monetization foundation for MooEarth.Live. In strict adherence to system constraints, no live paid billing or intrusive advertisements have been activated in production before demonstrated demand. Core 3D globe exploration, real-time news reading, climate maps, and geography gaming remain 100% free and unhindered.

### 1.1 Existing Architecture & Feature Verification
- **Multilingual System (Phase 8):** Fully verified and active. Supports 9 localized routes (`en`, `es`, `fr`, `pt`, `de`, `ja`, `hi`, `ar`, `or`) with Groq Qwen 2.5 72B / Gemini Flash fallback caching and 993 static SEO routes.
- **Visitor & Engagement Analytics:** Session tracking is managed locally in memory with throttled 30-second writes to Firebase Firestore (`sessions` collection) and Google Analytics 4 (Measurement ID `G-G16SE85311`). No sensitive GPS, biometric, or precise telemetry is logged.
- **Authentication & User Profiles:** Google Firebase Auth is integrated with guest mode fallback (`personalizationService.ts`). Guest bookmarks and history persist in IndexedDB/localStorage; authenticated users sync across devices without paywalls.
- **Advertising & Consent History:** Prior to Phase 9, no advertising network was active, and consent controls were non-standard. Phase 9 implements Google Consent Mode v2 and a persistent Privacy & Cookie Preferences center complying with GDPR and CCPA/CPRA.

---

## 2. Infrastructure Costs & Unit Economics

Operating costs for MooEarth.Live have been cataloged from actual infrastructure configurations:

| Service Category | Provider / Engine | Current Tier & Pricing | Cost per 1,000 Engaged Visitors |
| :--- | :--- | :--- | :--- |
| **Hosting & CDN** | Vercel Serverless / Edge | Hobby / Pro Tier (Edge CDN Caching) | ~$0.08 |
| **Database & Auth** | Google Firebase (Firestore + Auth) | Spark / Blaze (Throttled sync) | ~$0.05 |
| **AI News Summaries** | Groq (Llama 3.3 70B & Qwen 2.5) | On-demand tokens (~$0.0001/req) | ~$0.12 |
| **Weather & Maps** | MapLibre GL + Open-Meteo / TileServer | Self-hosted vector tiles & public APIs | ~$0.04 |
| **Analytics & Telemetry** | GA4 + Firebase Sessions | Free Tier | $0.00 |
| **Total Operating Run-Rate** | **Blended Cloud Stack** | **~$0.29 – $0.35 per 1k Visitors** | **~$0.00035 / visitor** |

*Note: Infrastructure costs remain low due to aggressive client-side caching, vector tiles, and throttled Firebase write intervals.*

---

## 3. Advertising Provider Evaluation & Eligibility

### 3.1 Google AdSense
- **Status:** Integrated via configuration (Off-by-default; `NEXT_PUBLIC_ENABLE_ADS=false`).
- **Eligibility:** Requires site traffic volume, original content verification, and complete legal policies (`/privacy`, `/cookies`, `/advertising`, `/ai-transparency`).
- **Placement Safety:** Units (`article_bottom`, `article_sidebar`, `news_feed_banner`) are strictly isolated from the 3D globe canvas, map gesture controls, and daily challenge cards.
- **CLS Prevention:** All ad containers have fixed min-height reservations (`min-h-[250px]` or `min-h-[90px]`) and collapse gracefully to 0 height when disabled or blocked.

### 3.2 Ethical Direct Sponsorships
- **Status:** Integrated via declarative registry (`src/config/sponsorships.ts`).
- **Policy:** Guaranteed editorial separation. Sponsors cannot influence news rankings, AI summaries, or country profiles. Attributions are marked with explicit badges ("Educational Partner", "Sponsored Educational Challenge").

---

## 4. Privacy, Consent & Regulatory Compliance

- **Google Consent Mode v2:** Default denial for `analytics_storage`, `ad_storage`, `ad_user_data`, and `ad_personalization`.
- **Granular Controls:** Users can accept all, reject non-essential, or customize categories in `ConsentBanner.tsx` and the Profile Dashboard Privacy tab.
- **Data Protection:** Zero private profile information, bookmarks, search keywords, or coordinates are transmitted to ad networks.

---

## 5. MooEarth Plus — Demand Validation Strategy

Rather than prematurely adding Stripe/Paddle processing, Phase 9 deploys an empirical demand validation modal (`MooEarthPlusModal.tsx`) accessible via the Profile Dashboard.

### 5.1 Proposed Feature Hypotheses to Test:
1. **Ad-Free Planetary Exploration:** Completely distraction-free browsing across news reports and map layers.
2. **Unlimited Saved Places & Curations:** Extended collections, travel itineraries, and tagged pinboards.
3. **Deep Planetary Intelligence & Radar:** High-resolution atmospheric precipitation radar and comparative country metrics.
4. **Pro Map Export:** High-res graphic card exports for teachers, researchers, and journalists.

### 5.2 Pricing Hypothesis:
- **Target Price:** ~$2.99 / month or ~$24.00 / year.
- **Success Criteria to Launch Billing:** >250 confirmed waitlist submissions with >15% intent conversion from modal views.

---

## 6. Revenue & Engagement Telemetry Event Schema

All events are deduplicated and tracked via `src/services/analytics.ts`:

| Event Name | Category | Action | Parameters Tracked |
| :--- | :--- | :--- | :--- |
| `monetization` | `ad_impression` | `placement_id` | `format` (e.g. `rectangle`, `banner`) |
| `monetization` | `ad_click` | `placement_id` | `placement_id` |
| `monetization` | `plus_modal_open` | `source` | `profile_modal`, `user_trigger` |
| `monetization` | `plus_interest_submit` | `source` | `features_count`, `features` list |
| `monetization` | `sponsorship_view` | `campaign_id` | `sponsor` name |
| `monetization` | `sponsorship_click` | `campaign_id` | `sponsor` name |
| `monetization` | `consent_update` | `choice` | `analytics`, `advertising`, `personalized` |

---

## 7. Rollout & Rollback Instructions

### Activation (When Ready)
1. Set `NEXT_PUBLIC_ENABLE_ADS=true` and configure `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX` in environment variables.
2. Deploy via Vercel: `git push origin main`.
3. Verify consent signals via DevTools Application Storage and GA4 DebugView.

### Instant Rollback (Safe Deactivation)
1. Set `NEXT_PUBLIC_ENABLE_ADS=false` in Vercel project settings or `.env.production`.
2. Redeploy. All ad containers immediately collapse to 0 height with zero broken UI or network requests.
