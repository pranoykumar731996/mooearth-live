#!/usr/bin/env tsx
// ============================================================
// MooEarth.Live — Phase 9 Monetization & Revenue Invariants Test
// ============================================================

import {
  getStoredConsent,
  acceptAllConsent,
  rejectNonEssentialConsent,
  updateConsentState,
  hasUserResponded
} from '../src/services/consentService';
import {
  AD_PLACEMENTS,
  canRenderAd,
  getAdvertisingConfig
} from '../src/config/advertising';
import {
  SPONSORSHIP_CAMPAIGNS,
  getSponsorshipPlacement
} from '../src/config/sponsorships';
import { FEATURES } from '../src/config/features';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAILED: ${message}`);
  }
}

console.log('\n' + '═'.repeat(65));
console.log(' 💰 Phase 9: Monetization Foundation & Revenue Test Suite');
console.log('═'.repeat(65) + '\n');

// ────────────────────────────────────────────────────────────
// Section 1: Privacy & Consent Management
// ────────────────────────────────────────────────────────────
console.log(' [1/4] Auditing Privacy & Consent Invariants...');

// Mock browser storage for in-process Node execution
const mockStorage: Record<string, string> = {};
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    removeItem: (key: string) => { delete mockStorage[key]; }
  },
  dispatchEvent: () => true
};
(globalThis as any).localStorage = (globalThis as any).window.localStorage;
(globalThis as any).CustomEvent = class CustomEvent { constructor(public type: string) {} };

assert(!hasUserResponded(), 'Initial state correctly identifies no explicit consent choice yet');

const defaultConsent = getStoredConsent();
assert(defaultConsent.essential === true, 'Strictly necessary cookies are always enabled');
assert(defaultConsent.analytics === false, 'Analytics tracking denied by default before consent');
assert(defaultConsent.advertising === false, 'Advertising tracking denied by default before consent');

const accepted = acceptAllConsent();
assert(accepted.analytics === true && accepted.advertising === true, 'Accept all grants analytics and advertising');
assert(hasUserResponded() === true, 'Accept all registers user response');

const rejected = rejectNonEssentialConsent();
assert(rejected.essential === true, 'Essential remains active after rejecting non-essential');
assert(rejected.analytics === false && rejected.advertising === false, 'Reject non-essential disables tracking and ads');

const custom = updateConsentState({ analytics: true, advertising: false });
assert(custom.analytics === true && custom.advertising === false, 'Granular preference customization persists correctly');

// ────────────────────────────────────────────────────────────
// Section 2: Advertising Invariants & CLS Protection
// ────────────────────────────────────────────────────────────
console.log('\n [2/4] Auditing Advertising Invariants & CLS Protection...');

const adConfig = getAdvertisingConfig();
assert(adConfig.enabled === false, 'Advertising is disabled by default in production base config');

// Placement dimensions
assert(Boolean(AD_PLACEMENTS.article_bottom), 'Placement article_bottom is registered');
assert(Boolean(AD_PLACEMENTS.article_sidebar), 'Placement article_sidebar is registered');
assert(Boolean(AD_PLACEMENTS.news_feed_banner), 'Placement news_feed_banner is registered');
assert(Boolean(AD_PLACEMENTS.weather_page_banner), 'Placement weather_page_banner is registered');

assert(AD_PLACEMENTS.article_bottom.format === 'rectangle', 'article_bottom has fixed format to avoid CLS');
assert(AD_PLACEMENTS.news_feed_banner.format === 'banner', 'news_feed_banner has banner format to avoid CLS');
assert(AD_PLACEMENTS.weather_page_banner.format === 'banner', 'weather_page_banner has banner format to avoid CLS');

// canRenderAd contract
assert(!canRenderAd('article_bottom', false), 'canRenderAd returns false when advertising is globally disabled');
assert(!canRenderAd('article_bottom', true), 'canRenderAd returns false when user is Plus subscriber');

// ────────────────────────────────────────────────────────────
// Section 3: Sponsorship Framework & Editorial Separation
// ────────────────────────────────────────────────────────────
console.log('\n [3/4] Auditing Sponsorship Ethical Separation & Transparency...');

assert(Boolean(SPONSORSHIP_CAMPAIGNS.challenge_partner), 'Challenge educational partnership campaign registered');

const campaign = getSponsorshipPlacement('challenge_partner');
assert(campaign !== null, 'Sponsorship campaign can be retrieved');
if (campaign) {
  assert(Boolean(campaign.sponsorName), 'Sponsor name is prominently disclosed');
  assert(Boolean(campaign.badgeLabel), 'Attribution badge label is strictly present');
  assert(Boolean(campaign.ctaUrl), 'Partner outbound link exists');
  assert(campaign.editorialSeparation === true, 'Strict editorial separation flag is active');
}

// ────────────────────────────────────────────────────────────
// Section 4: Revenue & Feature Flags Readiness
// ────────────────────────────────────────────────────────────
console.log('\n [4/4] Auditing Feature Flag Isolation...');

assert(typeof FEATURES.enableAds === 'boolean', 'FEATURES.enableAds flag is defined');
assert(typeof FEATURES.enablePlusValidation === 'boolean', 'FEATURES.enablePlusValidation flag is defined');
assert(typeof FEATURES.enableSponsorships === 'boolean', 'FEATURES.enableSponsorships flag is defined');
assert(FEATURES.enablePlusValidation === true, 'Plus demand validation is active to collect waitlist signals');

console.log('\n' + '─'.repeat(65));
console.log(` Summary: ${passedTests}/${totalTests} tests passed (${failedTests} failed)`);
console.log('═'.repeat(65) + '\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
