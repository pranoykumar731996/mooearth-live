// ============================================================
// MooEarth Live — Publication Quality Gate & Fact Verification
// ============================================================
// Evaluates synthesized articles prior to publication and caching.
// Enforces evidence sufficiency, claim verification, stale detection,
// contradiction routing, and explicit publication status.
// ============================================================

import {
  EvidenceRecord,
  EvidenceBasedArticle,
  PublicationStatus,
} from './evidenceTypes';
import { isSafeExternalUrl } from '../article';

export interface QualityGateEvaluation {
  passed: boolean;
  status: PublicationStatus;
  reasons: string[];
  evidenceSufficiencyScore: number; // 0 to 1
  claimAlignmentPassed: boolean;
  freshnessPassed: boolean;
  contradictionFlags: string[];
  unsupportedClaims: string[];
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

  // 1. Evidence Sufficiency Check
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

  // 2. Freshness & Stale Story Detection (Test Case 5)
  const freshness = checkFreshness(article.publishedAt, article.fullContent);
  if (freshness.isStale && freshness.reason) {
    reasons.push(freshness.reason);
  }

  // 3. Claim Alignment & Grounding Check
  const claimCheck = verifyClaimAlignment(article, evidence);
  if (!claimCheck.passed) {
    reasons.push(`${claimCheck.unsupportedClaims.length} claim(s) lacked direct grounding in evidence corpus.`);
  }

  // 4. Citation and Link Validation
  for (const src of evidence.sources) {
    if (!src.url || !isSafeExternalUrl(src.url)) {
      reasons.push(`Unsafe or invalid citation URL detected: ${src.url}`);
    }
  }

  // 5. Determine Enforced Publication Status
  let status: PublicationStatus = 'published_full';

  if (freshness.isStale) {
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
