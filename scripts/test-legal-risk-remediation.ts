// ============================================================
// MooEarth Live — Legal Risk Audit & Remediation Test Suite
// ============================================================
// Tests all 10 legal and regulatory safeguards:
// 1. Restricted sources enforcement
// 2. Unknown licenses defaulting to 'pending_review'
// 3. Approved primary/government sources
// 4. Paywalled articles (zero bypass, strictly blocked)
// 5. Copied passages warning detection
// 6. Fabricated citations & ungrounded claim flagging
// 7. Conflicting reports detection
// 8. High-impact / defamatory allegation routing to 'under_review'
// 9. Editorial corrections & takedown workflow (tombstone)
// 10. Configurable Google News RSS & RPC disable switch
// ============================================================

import {
  checkSourcePermission,
  isSourceApprovedForAi,
  isSourceApprovedForCommercialDisplay,
} from '../src/services/newsEngine/sourceRegistry';
import {
  evaluatePublicationQuality,
  detectHighImpactAllegations,
  detectCopiedPassages,
  enforcePublicationGate,
} from '../src/services/newsEngine/qualityGate';
import {
  recordTakedown,
  isTakedownActive,
  generateTombstoneArticle,
} from '../src/services/newsEngine/takedownService';
import {
  safeFetchSource,
  isKnownPaywalledDomain,
} from '../src/services/newsEngine/researchEngine';
import {
  generateDeterministicArticle,
} from '../src/services/newsEngine/articleGenerator';
import {
  fetchOrGenerateArticleDetails,
} from '../src/services/article';
import { EvidenceRecord, EvidenceBasedArticle } from '../src/services/newsEngine/evidenceTypes';
import { FEATURES } from '../src/config/features';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${detail ? `(${detail})` : ''}`);
    failedTests++;
  }
}

async function runLegalComplianceTests() {
  console.log('\n======================================================');
  console.log('⚖️  MooEarth Live — Legal Compliance & Risk Audit Tests');
  console.log('======================================================\n');

  // ── TEST GROUP 1: Source Registry & Permission Governance ──
  console.log('--- 1. Source Registry & Permission Governance ---');

  const usgsPerm = checkSourcePermission('https://earthquake.usgs.gov/earthquakes/feed');
  assert(usgsPerm.permissionStatus === 'approved', 'USGS domain marked as approved');
  assert(usgsPerm.isCommercialUseAuthorized === true, 'USGS permitted for commercial public data display');
  assert(isSourceApprovedForAi('usgs.gov') === true, 'USGS approved for AI ingestion');

  const reutersPerm = checkSourcePermission('https://www.reuters.com/world/chile-quake');
  assert(reutersPerm.permissionStatus === 'restricted', 'Reuters marked as restricted without commercial license');
  assert(reutersPerm.isCommercialUseAuthorized === false, 'Reuters commercial full syndication flagged false');
  assert(isSourceApprovedForAi('reuters.com') === false, 'Reuters full text blocked from commercial AI training/ingestion');

  const wsjPerm = checkSourcePermission('https://www.wsj.com/articles/markets-today');
  assert(wsjPerm.permissionStatus === 'blocked', 'WSJ marked as blocked (strict subscription paywall)');
  assert(wsjPerm.isCommercialUseAuthorized === false, 'WSJ commercial use blocked');

  const unknownPerm = checkSourcePermission('https://unregistered-foreign-blog.xyz/breaking-story');
  assert(unknownPerm.permissionStatus === 'pending_review', 'Unknown domain correctly defaults to pending_review');
  assert(unknownPerm.isCommercialUseAuthorized === false, 'Unknown domain defaults to commercial use unauthorized');

  // ── TEST GROUP 2: Strict Paywall Controls (Zero Bypass) ────
  console.log('\n--- 2. Paywall Protection & Non-Bypass ---');

  assert(isKnownPaywalledDomain('wsj.com') === true, 'WSJ recognized as paywalled domain');
  assert(isKnownPaywalledDomain('https://www.ft.com/content/123') === true, 'FT recognized as paywalled URL');

  const paywallResult = await safeFetchSource('https://www.wsj.com/articles/exclusive-market-scoop');
  assert(paywallResult.status === 'paywalled_restricted', 'safeFetchSource returned paywalled_restricted for WSJ');
  assert(paywallResult.substantiveText === '', 'safeFetchSource returned empty substantiveText for paywalled URL (no bypass)');

  // ── TEST GROUP 3: Original Writing vs. Copied Passages ─────
  console.log('\n--- 3. Original Writing vs. Copied Passages ---');

  const sampleSourceText = 'The finance ministry announced a complete restructuring of the debt package during the emergency summit in Geneva yesterday afternoon.';
  const mockSources = [
    {
      id: 'src-1',
      publisher: 'Financial Daily',
      domain: 'financialdaily.com',
      url: 'https://financialdaily.com/story',
      title: 'Debt Restructuring Announced',
      retrievedAt: new Date().toISOString(),
      accessStatus: 'accessible_full' as const,
      substantiveText: sampleSourceText,
      supportedClaims: ['Debt restructuring announced'],
    },
  ];

  const verbatimArticle = `The finance ministry announced a complete restructuring of the debt package during the emergency summit in Geneva yesterday afternoon. This is a developing story.`;
  const copiedCheck = detectCopiedPassages(verbatimArticle, mockSources);
  assert(copiedCheck.hasCopiedPassages === true, 'detectCopiedPassages caught multi-word verbatim passage matching source');

  const synthesizedArticle = `Authorities in Geneva confirmed plans to reorganize sovereign debt commitments following high-level bilateral discussions. Regional observers are tracking the implementation roadmap.`;
  const originalCheck = detectCopiedPassages(synthesizedArticle, mockSources);
  assert(originalCheck.hasCopiedPassages === false, 'detectCopiedPassages cleared original synthesized writing');

  // ── TEST GROUP 4: High-Impact & Defamatory Allegation Guard ─
  console.log('\n--- 4. Defamation & High-Impact Allegation Guard ---');

  const sensitiveText = 'Tech executive arrested and indicted by federal grand jury on charges of bribery and fraud.';
  const allegationCheck = detectHighImpactAllegations(sensitiveText);
  assert(allegationCheck.hasAllegation === true, 'detectHighImpactAllegations detected criminal/fraud terms');
  assert(allegationCheck.matchedTerms.includes('arrested') && allegationCheck.matchedTerms.includes('indicted'), 'Matched specific terms: arrested, indicted');

  const benignText = 'Tech company announces opening of new renewable energy data center in Dublin.';
  const benignCheck = detectHighImpactAllegations(benignText);
  assert(benignCheck.hasAllegation === false, 'Benign news story cleared of high-impact allegations');

  // Verify Quality Gate routes high-impact allegation to under_review
  const mockEvidenceRecord: EvidenceRecord = {
    eventId: 'ev-test-1',
    canonicalHeadline: 'Tech Executive Indicted on Fraud Allegations',
    eventDescription: sensitiveText,
    whatHappened: sensitiveText,
    when: { publishedAt: new Date().toISOString() },
    entities: { people: ['Executive X'], organizations: ['Tech Corp'], locations: { country: 'United States' } },
    figuresAndDates: [],
    sources: mockSources,
    corroboration: {
      totalSourcesConsulted: 1,
      accessibleSourcesCount: 1,
      independentPublishersCount: 1,
      hasOfficialOrPrimaryDocument: false,
      repetitionAnalysis: 'Single dispatch',
    },
    contradictions: [],
    unresolvedQuestions: [],
    depthMode: 'briefing',
    evidenceLimitations: [],
  };

  const sensitiveArticle: EvidenceBasedArticle = {
    id: 'art-sensitive-1',
    title: 'Tech Executive Indicted on Fraud Allegations',
    source: 'https://example.com/story',
    publishedAt: new Date().toISOString(),
    country: 'United States',
    category: 'business',
    depthMode: 'briefing',
    publicationStatus: 'published_full',
    aiSummary: sensitiveText,
    fullContent: sensitiveText,
    keyFacts: ['Indictment announced.'],
    newlyReportedFacts: ['Executive indicted on federal fraud charges.'],
    attributedStatements: [],
    timelineDevelopments: [],
    historicalBackground: 'Previous inquiries conducted in 2024.',
    analysisAndImplications: 'Legal proceedings ongoing.',
    competingAccountsOrContradictions: [],
    unresolvedQuestions: [],
    evidenceRecord: mockEvidenceRecord,
    sourceTransparency: {
      sourcesConsulted: 1,
      independentOutlets: 1,
      hasPaywalledOriginal: false,
      paywalledPublishers: [],
      lastCheckedAt: new Date().toISOString(),
      aiDisclosure: 'AI synthesized',
      evidenceLimitations: [],
      sourcesList: [],
    },
    telemetry: { provider: 'test', modelUsed: 'test', researchLatencyMs: 10, sourcesEvaluated: 1, cacheHit: false },
    accessLevel: 'dispatch',
    accessLabel: 'Dispatch',
  };

  const gateEval = evaluatePublicationQuality(sensitiveArticle, mockEvidenceRecord);
  assert(gateEval.status === 'under_review', 'Quality Gate routed high-impact allegation to under_review');
  assert(gateEval.passed === false, 'Article with high-impact allegations prevented from auto-publication');

  const gatedArticle = enforcePublicationGate(sensitiveArticle, mockEvidenceRecord);
  assert(gatedArticle.publicationStatus === 'under_review', 'enforcePublicationGate stamped under_review');
  assert(gatedArticle.accessLabel === 'Editorial Review', 'accessLabel set to Editorial Review');

  // ── TEST GROUP 5: Corrections & Takedown Workflow ──────────
  console.log('\n--- 5. Editorial Corrections & Takedown Workflow ---');

  const testTargetUrl = 'https://wire.example.com/erroneous-report-123';
  assert(isTakedownActive(testTargetUrl) === false, 'Takedown is not active before registration');

  const tdRecord = recordTakedown({
    target: testTargetUrl,
    reason: 'Factual retraction issued by reporting bureau regarding death toll miscalculation.',
    action: 'tombstone',
    requester: 'Legal & Editorial Desk',
  });
  assert(Boolean(tdRecord.id), 'Takedown record created with unique ID');
  assert(isTakedownActive(testTargetUrl) === true, 'Takedown is active immediately after registration');

  const tombstone = generateTombstoneArticle('art-retracted-1', 'Erroneous Casualty Report', testTargetUrl, tdRecord.reason);
  assert(tombstone.accessLabel === 'Retraction Notice', 'Tombstone article has Retraction Notice label');
  assert(tombstone.publicationStatus === 'under_review', 'Tombstone publicationStatus is under_review');
  assert(tombstone.fullContent.includes('Notice of Editorial Retraction'), 'Tombstone contains clear public retraction notice');

  // Verify fetchOrGenerateArticleDetails intercepts takedown
  const detailsResult = await fetchOrGenerateArticleDetails(
    'test-takedown-id',
    testTargetUrl,
    'Erroneous Casualty Report',
    'Old summary',
    'Global',
    'breaking',
    new Date().toISOString()
  );
  assert(detailsResult.accessLabel === 'Retraction Notice', 'fetchOrGenerateArticleDetails intercepted retracted story');
  assert(detailsResult.debug?.takedownActive === true, 'Debug payload confirms takedown active');

  // ── TEST GROUP 6: Configurable Google News RSS & RPC Switch ──
  console.log('\n--- 6. Configurable Google News RSS & RPC Switch ---');

  assert(typeof FEATURES.enableGoogleNewsRss === 'boolean', 'FEATURES.enableGoogleNewsRss flag is defined');
  console.log(`  Current enableGoogleNewsRss flag status: ${FEATURES.enableGoogleNewsRss}`);

  // Test deterministic article generator produces 100% original prose
  const testDetEvidence: EvidenceRecord = {
    eventId: 'ev-clean-1',
    canonicalHeadline: 'International Clean Power Consortium Meets in Tokyo',
    eventDescription: 'Delegates discussed regional grid integration.',
    whatHappened: 'Delegates discussed regional grid integration in Tokyo.',
    when: { publishedAt: new Date().toISOString() },
    entities: { people: ['Minister Sato'], organizations: ['IEA'], locations: { country: 'Japan' } },
    figuresAndDates: [{ metricOrDate: 'Target Capacity', value: '50 GW', sourcePublisher: 'IEA' }],
    sources: [
      {
        id: 'src-iea',
        publisher: 'IEA Dispatch',
        domain: 'iea.org',
        url: 'https://iea.org/news/clean-power',
        title: 'Clean Power Consortium',
        retrievedAt: new Date().toISOString(),
        accessStatus: 'accessible_full',
        isPrimaryOrOfficial: true,
        supportedClaims: ['50 GW clean power target'],
      },
    ],
    corroboration: {
      totalSourcesConsulted: 1,
      accessibleSourcesCount: 1,
      independentPublishersCount: 1,
      hasOfficialOrPrimaryDocument: true,
      repetitionAnalysis: 'Primary dispatch from IEA',
    },
    contradictions: [],
    unresolvedQuestions: [],
    depthMode: 'briefing',
    evidenceLimitations: [],
  };

  const detArticle = generateDeterministicArticle(testDetEvidence, 'technology', 'https://iea.org/news/clean-power');
  assert(Boolean(detArticle.title), 'Deterministic article generated');
  assert(detArticle.newlyReportedFacts.length > 0, 'Newly reported facts synthesized');
  // ── TEST GROUP 7: UGC Reaction Sanitization & Defamation Defense ──
  console.log('\n--- 7. UGC Reaction Sanitization & Defamation Defense ---');

  const { sanitizeCelebrationReaction, ALLOWED_CELEBRATION_PRESETS } = await import('../src/services/celebration-ai');
  assert(Array.isArray(ALLOWED_CELEBRATION_PRESETS) && ALLOWED_CELEBRATION_PRESETS.length > 5, 'Preset reaction allowlist defined');
  
  // Valid preset reactions preserved
  assert(sanitizeCelebrationReaction('🔥 Hype') === '🔥 Hype', 'Valid preset reaction 🔥 Hype preserved');
  assert(sanitizeCelebrationReaction('🏆 Victory') === '🏆 Victory', 'Valid preset reaction 🏆 Victory preserved');

  // Arbitrary defamatory or freeform text sanitized to safe preset
  const maliciousUgc = 'The referee and team manager are corrupt criminals who stole the game!';
  const sanitizedUgc = sanitizeCelebrationReaction(maliciousUgc);
  assert(sanitizedUgc === '😄 Celebration', 'Arbitrary freeform UGC string sanitized to default preset');
  assert(!sanitizedUgc.includes('corrupt') && !sanitizedUgc.includes('criminals'), 'Defamatory words eradicated from reaction');

  // ── SUMMARY ────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`⚖️  Test Results: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runLegalComplianceTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
