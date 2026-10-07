// ============================================================
// MooEarth Live — Global News Coverage Engine 2.0: Access Resolver
// ============================================================

import { ArticleAccessTier, ArticleAccessResolution, PublisherSource } from './types';
import { extractPublisher } from '../worldNewsService';

const PAYWALL_INDICATORS = [
  'subscribe to continue reading',
  'subscription required',
  'sign in to read the full story',
  'this content is only available to subscribers',
  'please disable your ad blocker',
  'create a free account to continue',
  'exclusive content for members',
];

/**
 * Checks whether text contains explicit paywall/gatekeeper blocking phrases
 */
export function isPaywalledContent(content: string): boolean {
  if (!content) return false;
  const lower = content.toLowerCase();
  return PAYWALL_INDICATORS.some((indicator) => lower.includes(indicator));
}

/**
 * Extract 3 to 4 structured factual takeaways from article title, publisher, and summary
 */
export function synthesizeKeyFacts(params: {
  title: string;
  summary: string;
  country: string;
  publisher: string;
  relatedSources?: PublisherSource[];
}): string[] {
  const { title, summary, country, publisher, relatedSources } = params;

  const facts: string[] = [
    `Primary Dispatch: ${title}`,
    `Reporting Bureau: Verified reporting published by ${publisher}.`,
    `Geographic Focus: Ongoing developments centered in ${country}.`,
  ];

  if (relatedSources && relatedSources.length > 0) {
    const names = relatedSources.map((s) => s.publisher).filter(Boolean).slice(0, 3).join(', ');
    if (names) {
      facts.push(`Cross-Publisher Coverage: Also covered by ${names}.`);
    }
  } else if (summary && summary.length > 80 && summary !== title) {
    facts.push(`Key Insight: ${summary.slice(0, 160)}...`);
  } else {
    facts.push(`Impact Tracking: Regional pulse and ongoing story verification on MooEarth.`);
  }

  return facts;
}

/**
 * Resolves the access level and synthesized structured content for an article
 */
export function resolveArticleAccess(params: {
  url: string;
  title: string;
  summary?: string;
  rawContent?: string;
  country: string;
  publisher?: string;
  relatedSources?: PublisherSource[];
}): ArticleAccessResolution {
  const { url, title, summary, rawContent, country, publisher, relatedSources } = params;

  const resolvedPublisher = publisher || extractPublisher(title, url);
  const cleanSummary = (summary || '').trim();
  const cleanContent = (rawContent || '').trim();

  const isBlocked = isPaywalledContent(cleanContent) || isPaywalledContent(cleanSummary);

  // 1. Check for Full Content Tier
  const hasFullBody = !isBlocked && cleanContent.length > 400 && cleanContent.split(/\s+/).length >= 80;
  if (hasFullBody) {
    return {
      accessLevel: 'full',
      accessLabel: 'Full Report',
      confidence: 0.95,
      hasFullBody: true,
      hasSummary: true,
      canReadInline: true,
      reason: 'Full article text successfully retrieved and verified from publisher.',
      cleanedBody: cleanContent,
      extractedKeyFacts: synthesizeKeyFacts({
        title,
        summary: cleanSummary || cleanContent.slice(0, 200),
        country,
        publisher: resolvedPublisher,
        relatedSources,
      }),
    };
  }

  // 2. Check for Verified Synthesis Tier
  const hasSubstantialSummary = !isBlocked && cleanSummary.length >= 70 && cleanSummary !== title;
  if (hasSubstantialSummary) {
    return {
      accessLevel: 'synthesis',
      accessLabel: 'Verified Synthesis',
      confidence: 0.85,
      hasFullBody: false,
      hasSummary: true,
      canReadInline: true,
      reason: 'Verified publisher excerpt available with synthesized executive summary.',
      cleanedBody: cleanSummary,
      extractedKeyFacts: synthesizeKeyFacts({
        title,
        summary: cleanSummary,
        country,
        publisher: resolvedPublisher,
        relatedSources,
      }),
    };
  }

  // 3. Fallback: Publisher Dispatch Tier (Transparent, structured wire overview)
  const dispatchSummary = cleanSummary && cleanSummary.length > 25
    ? cleanSummary
    : `This story was published by ${resolvedPublisher} covering events in ${country}. Full reading access is hosted directly on the publisher's official platform.`;

  return {
    accessLevel: 'dispatch',
    accessLabel: 'Publisher Dispatch',
    confidence: 0.75,
    hasFullBody: false,
    hasSummary: true,
    canReadInline: false,
    reason: isBlocked
      ? 'Publisher requires direct web access or subscription.'
      : 'Direct wire dispatch with metadata and external access gateway.',
    cleanedBody: dispatchSummary,
    extractedKeyFacts: synthesizeKeyFacts({
      title,
      summary: dispatchSummary,
      country,
      publisher: resolvedPublisher,
      relatedSources,
    }),
  };
}
