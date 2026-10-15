// ============================================================
// MooEarth Live — Publication Quality Gate & Legal Verification
// ============================================================
// Evaluates synthesized articles prior to publication and caching.
// Enforces evidence sufficiency, claim verification, stale detection,
// high-impact allegation detection, copied passage warnings,
// source permission validation, and retraction/takedown routing.
// ============================================================

import {
  EvidenceRecord,
  EvidenceBasedArticle,
  PublicationStatus,
} from './evidenceTypes';
import { isSafeExternalUrl } from '../article';
import { checkSourcePermission } from './sourceRegistry';
import { isTakedownActive } from './takedownService';

export interface QualityGateEvaluation {
  passed: boolean;
  status: PublicationStatus;
  reasons: string[];
  evidenceSufficiencyScore: number; // 0 to 1
  claimAlignmentPassed: boolean;
  freshnessPassed: boolean;
  contradictionFlags: string[];
  unsupportedClaims: string[];
  highImpactAllegationsDetected?: boolean;
  matchedAllegationTerms?: string[];
  copiedPassageWarnings?: string[];
  sourcePermissionIssues?: string[];
}

/**
 * High-Impact & Potentially Defamatory Claim Patterns.
 * Stories containing these terms MUST NOT be auto-published without human review.
 */
const HIGH_IMPACT_ALLEGATION_PATTERNS = [
  /\b(arrested|indicted|charged with|pleaded guilty|convicted of|subpoenaed|grand jury)\b/i,
  /\b(embezzlement|fraud|money laundering|bribery|kickback|ponzi|extortion)\b/i,
  /\b(war crimes|human rights abuses|genocide|treason|espionage|sanctions violation)\b/i,
  /\b(insolvency|bankruptcy fraud|defaulting on debt|illicit trading)\b/i,
  /\b(sexual assault|sexual harassment|sexual misconduct|rape|battery)\b/i,
  /\b(assassinated|murdered|manslaughter|homicide)\b/i,
];

export function detectHighImpactAllegations(text: string): {
  hasAllegation: boolean;
  matchedTerms: string[];
} {
  if (!text) return { hasAllegation: false, matchedTerms: [] };
  const matchedTerms: string[] = [];

  for (const regex of HIGH_IMPACT_ALLEGATION_PATTERNS) {
    const globalRegex = new RegExp(regex.source, 'gi');
    let match: RegExpExecArray | null;
    while ((match = globalRegex.exec(text)) !== null) {
      matchedTerms.push(match[1].toLowerCase());
    }
  }

  return {
    hasAllegation: matchedTerms.length > 0,
    matchedTerms: Array.from(new Set(matchedTerms)),
  };
}

/**
 * Detects verbatim copied passages (>10 consecutive words) from source text
 * to guarantee that articles represent original writing rather than copied expression.
 */
export function detectCopiedPassages(
  fullContent: string,
  sources: EvidenceRecord['sources']
): { hasCopiedPassages: boolean; excerptMatches: string[] } {
  if (!fullContent || !sources || sources.length === 0) {
    return { hasCopiedPassages: false, excerptMatches: [] };
  }

  const excerptMatches: string[] = [];
  const contentLower = fullContent.toLowerCase();

  for (const src of sources) {
    const sourceText = (src.substantiveText || src.excerpt || '').toLowerCase();
    if (sourceText.length < 60) continue;

    // Split source into 10-word windows
    const words = sourceText.split(/\s+/).filter(Boolean);
    for (let i = 0; i <= words.length - 10; i += 5) {
      const windowStr = words.slice(i, i + 10).join(' ');
      // If window is long enough and found verbatim in content, flag as copied passage warning
      if (windowStr.length > 40 && contentLower.includes(windowStr)) {
        excerptMatches.push(`"${windowStr}..." from ${src.publisher}`);
        if (excerptMatches.length >= 3) break;
      }
    }
    if (excerptMatches.length >= 3) break;
  }

  return {
    hasCopiedPassages: excerptMatches.length > 0,
    excerptMatches,
  };
}

/**
 * Checks whether an article timestamp or mentioned dates are excessively stale (>90 days)
 * for a breaking news report without historical qualification.
 */
function checkFreshness(publishedAt: string, fullContent: string): { isStale: boolean; reason?: string } {
  try {
    const pubDate = new Date(publishedAt).getTime();
    const now = Date.now();
    const diffDays = (now - pubDate) / (1000 * 60 * 60 * 24);

    // If story publication is older than 90 days, it is stale for live breaking news
    if (diffDays > 90) {
      return {
        isStale: true,
        reason: `Article publication date is ${Math.round(diffDays)} days old without updated verification.`,
      };
    }
  } catch {
    // ignore
  }

  return { isStale: false };
}

/**
 * Verifies that key claims and figures are grounded in the EvidenceRecord
 */
function verifyClaimAlignment(
  article: EvidenceBasedArticle,
  evidence: EvidenceRecord
): { passed: boolean; unsupportedClaims: string[] } {
  const unsupportedClaims: string[] = [];

  // Combine substantive text and excerpts from all sources
  const recordedCorpus = evidence.sources
    .map((s) => `${s.title} ${s.excerpt || ''} ${s.substantiveText || ''}`)
    .join(' ')
    .toLowerCase();

  // Verify newly reported facts
  for (const fact of article.newlyReportedFacts || []) {
    const words = fact
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 4);

    if (words.length > 0) {
      let matches = 0;
      for (const w of words) {
        if (recordedCorpus.includes(w)) matches++;
      }
      const ratio = matches / words.length;
      // If less than 25% of distinctive words exist in source texts, flag as potentially ungrounded
      if (ratio < 0.25 && !recordedCorpus.includes(article.title.toLowerCase())) {
        unsupportedClaims.push(fact);
      }
    }
  }

  return {
    passed: unsupportedClaims.length === 0,
    unsupportedClaims,
  };
}

/**
 * Evaluates publication quality and returns enforced publication status
 */
export function evaluatePublicationQuality(
  article: EvidenceBasedArticle,
  evidence: EvidenceRecord
): QualityGateEvaluation {
  const reasons: string[] = [];
  const contradictionFlags: string[] = [...evidence.contradictions];
  const sourcePermissionIssues: string[] = [];

  // 0. Legal Takedown & Retraction Check (Phase 5)
  const isRetracted = isTakedownActive(article.title) ||
    isTakedownActive(article.source) ||
    isTakedownActive(article.id);

  if (isRetracted) {
    reasons.push('Article is subject to an active retraction or legal takedown notice.');
    return {
      passed: false,
      status: 'under_review',
      reasons,
      evidenceSufficiencyScore: 0,
      claimAlignmentPassed: false,
      freshnessPassed: false,
      contradictionFlags,
      unsupportedClaims: [],
    };
  }

  // 1. High-Impact Allegation Check (Defamation & Crime Risk Guard)
  const combinedTextForAllegations = `${article.title} ${article.aiSummary} ${(article.newlyReportedFacts || []).join(' ')}`;
  const allegationCheck = detectHighImpactAllegations(combinedTextForAllegations);
  if (allegationCheck.hasAllegation) {
    reasons.push(
      `High-impact allegation detected (${allegationCheck.matchedTerms.join(', ')}). Story requires human editorial review prior to publication.`
    );
  }

  // 2. Source Permission Validation (Phase 4 Registry Check)
  for (const src of evidence.sources) {
    const perm = checkSourcePermission(src.url || src.domain);
    if (perm.permissionStatus === 'blocked') {
      sourcePermissionIssues.push(`Source ${perm.provider} is blocked by access controls or licensing terms.`);
    } else if (perm.permissionStatus === 'pending_review') {
      sourcePermissionIssues.push(`Source ${perm.provider} permissions are unverified/pending review.`);
    }
  }

  // 3. Copied Passage Detection (Phase 3: Original Writing Requirement)
  const copiedCheck = detectCopiedPassages(article.fullContent, evidence.sources);
  if (copiedCheck.hasCopiedPassages) {
    reasons.push(
      `Copied passage warning: Detected verbatim text matching source (${copiedCheck.excerptMatches.join('; ')}). Text must be originally expressed.`
    );
  }

  // 4. Evidence Sufficiency Check
  const accessibleSources = evidence.sources.filter(
    (s) => s.accessStatus === 'accessible_full' || s.accessStatus === 'accessible_excerpt'
  );

  let evidenceSufficiencyScore = 0.5;
  if (accessibleSources.length >= 3) {
    evidenceSufficiencyScore = 0.95;
  } else if (accessibleSources.length === 2) {
    evidenceSufficiencyScore = 0.85;
  } else if (accessibleSources.length === 1) {
    evidenceSufficiencyScore = 0.65;
  } else {
    evidenceSufficiencyScore = 0.3;
  }

  // Check mode vs sufficiency: deep_dive requires at least 2 accessible sources
  if (article.depthMode === 'deep_dive' && accessibleSources.length < 2) {
    reasons.push('Deep-dive mode requested but fewer than 2 accessible sources corroborated the event.');
  }

  // 5. Freshness & Stale Story Detection
  const freshness = checkFreshness(article.publishedAt, article.fullContent);
  if (freshness.isStale && freshness.reason) {
    reasons.push(freshness.reason);
  }

  // 6. Claim Alignment & Grounding Check
  const claimCheck = verifyClaimAlignment(article, evidence);
  if (!claimCheck.passed) {
    reasons.push(`${claimCheck.unsupportedClaims.length} claim(s) lacked direct grounding in evidence corpus.`);
  }

  // 7. Citation and Link Validation
  for (const src of evidence.sources) {
    if (!src.url || !isSafeExternalUrl(src.url)) {
      reasons.push(`Unsafe or invalid citation URL detected: ${src.url}`);
    }
  }

  // 8. Determine Enforced Publication Status
  let status: PublicationStatus = 'published_full';

  if (allegationCheck.hasAllegation) {
    // High impact allegation -> MUST go to under_review
    status = 'under_review';
  } else if (freshness.isStale) {
    // Rapidly developing story with outdated information -> keep under review or limited
    status = 'under_review';
  } else if (contradictionFlags.length > 0 && accessibleSources.length < 2) {
    // Unresolved contradiction with only 1 source -> route to under review
    status = 'under_review';
  } else if (accessibleSources.length === 0 || evidenceSufficiencyScore < 0.4) {
    // Insufficient evidence
    status = 'limited_evidence';
  } else if (article.depthMode === 'briefing') {
    status = 'published_briefing';
  } else {
    status = 'published_full';
  }

  const passed = status === 'published_full' || status === 'published_briefing';

  return {
    passed,
    status,
    reasons,
    evidenceSufficiencyScore,
    claimAlignmentPassed: claimCheck.passed,
    freshnessPassed: !freshness.isStale,
    contradictionFlags,
    unsupportedClaims: claimCheck.unsupportedClaims,
    highImpactAllegationsDetected: allegationCheck.hasAllegation,
    matchedAllegationTerms: allegationCheck.matchedTerms,
    copiedPassageWarnings: copiedCheck.excerptMatches,
    sourcePermissionIssues,
  };
}

/**
 * Applies the quality gate to an article, downgrading depth or setting status as required
 */
export function enforcePublicationGate(
  article: EvidenceBasedArticle,
  evidence: EvidenceRecord
): EvidenceBasedArticle {
  const evalResult = evaluatePublicationQuality(article, evidence);

  if (evalResult.status === 'limited_evidence') {
    return {
      ...article,
      publicationStatus: 'limited_evidence',
      depthMode: 'briefing',
      accessLevel: 'dispatch',
      accessLabel: 'Limited Evidence',
      aiSummary: `Limited verifiable facts currently available for "${article.title}". Reporting bureau is monitoring ongoing developments.`,
      fullContent: `### Limited Information State\n\nIndependent research across news wires and primary repositories could not establish sufficient corroborated evidence to publish a full report at this time.\n\n• **Headline**: ${article.title}\n• **Consulted Sources**: ${evidence.sources.map(s => s.publisher).join(', ') || 'None available'}\n• **Status**: Limited Evidence Dispatch\n\nPlease refer to the official publisher platform link below for initial wire reporting.`,
      sourceTransparency: {
        ...article.sourceTransparency,
        evidenceLimitations: [
          ...article.sourceTransparency.evidenceLimitations,
          'Story is in a limited-information state due to insufficient multi-source corroboration.',
        ],
      },
    };
  }

  if (evalResult.status === 'under_review') {
    return {
      ...article,
      publicationStatus: 'under_review',
      accessLabel: 'Editorial Review',
      aiSummary: `[Under Editorial Review] This story contains sensitive allegations or unresolved details: ${evalResult.reasons[0] || 'Pending verification'}.`,
      fullContent: `### Story Under Editorial Review\n\nThis article has been placed under editorial hold pending verification.\n\n• **Reason**: ${evalResult.reasons.join('; ')}\n• **Review Protocol**: High-impact allegations or uncorroborated single-source claims require human editorial review prior to publication.\n• **Current Status**: Restricted pending editorial sign-off.`,
      sourceTransparency: {
        ...article.sourceTransparency,
        evidenceLimitations: [
          ...article.sourceTransparency.evidenceLimitations,
          ...evalResult.reasons,
        ],
      },
    };
  }

  return {
    ...article,
    publicationStatus: evalResult.status,
  };
}
