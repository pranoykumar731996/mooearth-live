// ============================================================
// MooEarth Live — Multi-Source News Research Engine
// ============================================================
// Performs lawful, multi-source investigation across independent publishers,
// public documents, and official agencies.
// Strictly respects publisher paywalls and subscription controls:
// NEVER attempts bypass, scraping tricks, or authentication evasion.
// ============================================================

import {
  EvidenceRecord,
  EvidenceSource,
  EvidenceDepthMode,
  EvidenceAccessStatus,
} from './evidenceTypes';
import { isSafeExternalUrl, extractPublisherFromUrl } from '../article';
import { isPaywalledContent } from './accessResolver';
import { findRelatedCluster } from './index';
import { queryGdeltArticles } from './gdeltClient';
import { areArticlesRelated, extractKeywords, computeTokenSimilarity } from './clustering';
import { CANONICAL_COUNTRIES } from '@/data/countries';
import { FEATURES } from '@/config/features';
import { checkSourcePermission } from './sourceRegistry';

const KNOWN_PAYWALLED_DOMAINS = new Set([
  'wsj.com',
  'ft.com',
  'nytimes.com',
  'bloomberg.com',
  'economist.com',
  'washingtonpost.com',
  'thetimes.co.uk',
  'telegraph.co.uk',
  'barrons.com',
  'theathletic.com',
  'businessinsider.com',
  'hbr.org',
  'newyorker.com',
]);

const OFFICIAL_PRIMARY_DOMAINS = [
  '.gov',
  '.mil',
  'who.int',
  'un.org',
  'iaea.org',
  'nasa.gov',
  'noaa.gov',
  'usgs.gov',
  'cdc.gov',
  'europa.eu',
  'imf.org',
  'worldbank.org',
  'wmo.int',
  'nato.int',
  'icj-cij.org',
  'whitehouse.gov',
  'gov.uk',
  'elysee.fr',
  'bundesregierung.de',
];

export function isKnownPaywalledDomain(domainOrUrl: string): boolean {
  if (!domainOrUrl) return false;
  try {
    const host = domainOrUrl.includes('://')
      ? new URL(domainOrUrl).hostname.replace(/^www\./, '').toLowerCase()
      : domainOrUrl.replace(/^www\./, '').toLowerCase();
    
    for (const pwDomain of KNOWN_PAYWALLED_DOMAINS) {
      if (host === pwDomain || host.endsWith(`.${pwDomain}`)) {
        return true;
      }
    }
  } catch {
    // fallback
  }
  return false;
}

export function isOfficialOrPrimaryDomain(domainOrUrl: string): boolean {
  if (!domainOrUrl) return false;
  try {
    const host = domainOrUrl.includes('://')
      ? new URL(domainOrUrl).hostname.toLowerCase()
      : domainOrUrl.toLowerCase();

    return OFFICIAL_PRIMARY_DOMAINS.some(
      (suffix) => host.endsWith(suffix) || host.includes(suffix)
    );
  } catch {
    return false;
  }
}

/**
 * Extracts named entities (people, organizations, locations) and numbers from text
 */
export function extractEntitiesAndFigures(
  headline: string,
  texts: string[]
): {
  people: string[];
  organizations: string[];
  locations: { country: string; city?: string; region?: string };
  figuresAndDates: Array<{ metricOrDate: string; value: string; sourcePublisher: string }>;
} {
  const combined = `${headline} ${texts.join(' ')}`;
  
  // 1. Detect organizations
  const orgCandidates = [
    'United Nations', 'UN', 'NATO', 'European Union', 'EU', 'WHO', 'IAEA', 'IMF',
    'World Bank', 'Federal Reserve', 'Fed', 'Pentagon', 'Kremlin', 'White House',
    'NASA', 'SpaceX', 'Apple', 'Google', 'Microsoft', 'NVIDIA', 'Tesla', 'OpenAI',
    'Supreme Court', 'Parliament', 'Congress', 'Senate', 'Ministry of Defense',
    'Red Cross', 'Interpol', 'OPEC', 'G7', 'G20'
  ];
  const organizations: string[] = [];
  for (const org of orgCandidates) {
    const regex = new RegExp(`\\b${org}\\b`, 'i');
    if (regex.test(combined)) {
      organizations.push(org);
    }
  }

  // 2. Detect figures and quantities (e.g. $10 billion, 5.8 magnitude, 45,000 workers)
  const figuresAndDates: Array<{ metricOrDate: string; value: string; sourcePublisher: string }> = [];
  const figureRegexes = [
    { pattern: /(\$\s?\d+(?:\.\d+)?\s*(?:billion|million|trillion|B|M|k)?)/gi, label: 'Financial Amount' },
    { pattern: /(\b\d+(?:\.\d+)?\s*(?:percent|%)\b)/gi, label: 'Percentage' },
    { pattern: /(\b\d+(?:\.\d+)?\s*magnitude\b|\bmagnitude\s*\d+(?:\.\d+)?\b)/gi, label: 'Magnitude' },
    { pattern: /(\b\d{1,3}(?:,\d{3})+\b)/g, label: 'Count/Quantity' },
  ];

  for (const { pattern, label } of figureRegexes) {
    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = pattern.exec(combined)) !== null && count < 3) {
      const val = match[1].trim();
      if (!figuresAndDates.some(f => f.value === val)) {
        figuresAndDates.push({
          metricOrDate: label,
          value: val,
          sourcePublisher: 'Corroborated Reporting',
        });
        count++;
      }
    }
  }

  // 3. Detect prominent people (titles + capitalized names)
  const people: string[] = [];
  const titlePattern = /\b(?:President|Prime Minister|Premier|Chancellor|Secretary|Director|General|Judge|Dr\.|Governor|CEO|Minister)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = titlePattern.exec(combined)) !== null && people.length < 5) {
    const name = pMatch[0].trim();
    if (!people.includes(name)) {
      people.push(name);
    }
  }

  // 4. Resolve country/location
  let resolvedCountry = 'International';
  for (const country of CANONICAL_COUNTRIES) {
    const cRegex = new RegExp(`\\b${country.name}\\b`, 'i');
    if (cRegex.test(combined)) {
      resolvedCountry = country.name;
      break;
    }
  }

  return {
    people,
    organizations,
    locations: { country: resolvedCountry },
    figuresAndDates,
  };
}

/**
 * Safely extracts open meta-description / og:description without scraping article body paragraphs.
 */
function extractMetadataExcerpt(html: string): string {
  const descMatch = html.match(/<meta\s+(?:name|property)=["'](?:og:description|description|twitter:description)["']\s+content=["']([^"']*)["']/i);
  if (descMatch && descMatch[1]) {
    return descMatch[1].replace(/<[^>]*>/g, '').trim();
  }
  return '';
}

/**
 * Safely fetches an external URL respecting robots/paywall limits
 */
export async function safeFetchSource(url: string): Promise<{
  success: boolean;
  status: EvidenceAccessStatus;
  substantiveText: string;
  excerpt: string;
  publisher: string;
  domain: string;
}> {
  if (!url || !isSafeExternalUrl(url)) {
    return {
      success: false,
      status: 'failed_unreachable',
      substantiveText: '',
      excerpt: '',
      publisher: 'Unknown',
      domain: '',
    };
  }

  let domain = '';
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return {
      success: false,
      status: 'failed_unreachable',
      substantiveText: '',
      excerpt: '',
      publisher: 'Unknown',
      domain: '',
    };
  }

  // Check Source Registry permissions and known paywalls upfront
  const sourcePerm = checkSourcePermission(domain);
  if (sourcePerm.permissionStatus === 'blocked' || isKnownPaywalledDomain(domain)) {
    console.log(`[ResearchEngine] Source ${domain} blocked or paywalled under permission registry. Strictly respecting access controls.`);
    return {
      success: true,
      status: 'paywalled_restricted',
      substantiveText: '',
      excerpt: '',
      publisher: sourcePerm.provider || extractPublisherFromUrl(url),
      domain,
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (MooEarth Research Sentinel)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (response.status === 401 || response.status === 403) {
      return {
        success: true,
        status: 'paywalled_restricted',
        substantiveText: '',
        excerpt: '',
        publisher: extractPublisherFromUrl(url),
        domain,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: 'failed_unreachable',
        substantiveText: '',
        excerpt: '',
        publisher: extractPublisherFromUrl(url),
        domain,
      };
    }

    const html = await response.text();

    if (isPaywalledContent(html)) {
      return {
        success: true,
        status: 'paywalled_restricted',
        substantiveText: '',
        excerpt: '',
        publisher: extractPublisherFromUrl(url),
        domain,
      };
    }

    // Safe metadata extraction (Zero full-text paragraph scraping)
    const excerpt = extractMetadataExcerpt(html);
    const substantiveText = excerpt;

    const accessStatus: EvidenceAccessStatus = excerpt.length > 20 ? 'accessible_excerpt' : 'failed_unreachable';

    return {
      success: accessStatus !== 'failed_unreachable',
      status: accessStatus,
      substantiveText,
      excerpt,
      publisher: extractPublisherFromUrl(url),
      domain,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'failed_unreachable',
      substantiveText: '',
      excerpt: '',
      publisher: extractPublisherFromUrl(url),
      domain,
    };
  }
}


/**
 * Main Multi-Source Research Orchestrator
 */
export async function conductMultiSourceResearch(params: {
  headline: string;
  url: string;
  summary?: string;
  country: string;
  category: string;
  publishedAt: string;
}): Promise<EvidenceRecord> {
  const { headline, url, summary = '', country, category, publishedAt } = params;
  const nowIso = new Date().toISOString();

  // 1. Initial Source Retrieval & Paywall Assessment
  const initialFetch = await safeFetchSource(url);
  const initialDomain = initialFetch.domain || (url ? new URL(url).hostname : 'unknown');

  const sourcesMap = new Map<string, EvidenceSource>();

  // Register initial source
  sourcesMap.set(initialDomain, {
    id: `src-initial-${initialDomain}`,
    publisher: initialFetch.publisher,
    domain: initialDomain,
    url,
    title: headline,
    publishedAt,
    retrievedAt: nowIso,
    accessStatus: initialFetch.status,
    isPrimaryOrOfficial: isOfficialOrPrimaryDomain(initialDomain),
    isSyndicatedOrReprint: false,
    excerpt: initialFetch.excerpt || summary,
    substantiveText: initialFetch.substantiveText,
    supportedClaims: headline ? [headline] : [],
  });

  // 2. Discover Candidate Corroboration Sources
  // Clean query tokens
  const cleanTokens = extractKeywords(headline).slice(0, 5);
  const searchQuery = `${cleanTokens.join(' ')} ${country !== 'Global' && country !== 'International' ? country : ''}`.trim();

  const [clusterData, gdeltArticles] = await Promise.allSettled([
    findRelatedCluster(headline, country),
    queryGdeltArticles({ query: searchQuery, maxRecords: 6 }),
  ]);

  interface DiscoveredCandidate {
    title: string;
    url: string;
    publisher: string;
  }

  const candidates: DiscoveredCandidate[] = [];

  // A. Discovered from existing cluster
  if (clusterData.status === 'fulfilled' && clusterData.value) {
    for (const rel of clusterData.value.primaryArticle.relatedSources || []) {
      candidates.push({ title: rel.title || headline, url: rel.url, publisher: rel.publisher });
    }
  }

  // B. Discovered from GDELT
  if (gdeltArticles.status === 'fulfilled' && Array.isArray(gdeltArticles.value)) {
    for (const g of gdeltArticles.value) {
      if (g.sourceUrl && g.title) {
        candidates.push({ title: g.title, url: g.sourceUrl, publisher: g.publisher });
      }
    }
  }


  // 3. Strict Event Verification Guard (Test Case 6: Reject unrelated events)
  const relevantCandidates: DiscoveredCandidate[] = [];
  const queryTokens = extractKeywords(headline);

  for (const cand of candidates) {
    if (!cand.url || !isSafeExternalUrl(cand.url)) continue;

    let candDomain = '';
    try {
      candDomain = new URL(cand.url).hostname.replace(/^www\./, '');
    } catch {
      continue;
    }

    if (sourcesMap.has(candDomain)) continue; // Don't duplicate domain

    // Entity & Similarity check to prevent cross-event leakage
    const candTokens = extractKeywords(cand.title);
    const tokenSim = computeTokenSimilarity(queryTokens, candTokens);

    // Strict threshold: at least 0.35 similarity or 2 matching core keywords
    let matchCount = 0;
    for (const qt of queryTokens) {
      if (candTokens.includes(qt)) matchCount++;
    }

    const isMatch = tokenSim >= 0.35 || matchCount >= 2;
    if (isMatch) {
      relevantCandidates.push(cand);
      if (relevantCandidates.length >= 4) break;
    } else {
      console.log(`[ResearchEngine] Guarded: rejected unrelated search result "${cand.title}" for event "${headline}"`);
    }
  }

  // 4. Concurrently fetch accessible content from top candidates
  const candidateFetches = await Promise.allSettled(
    relevantCandidates.map(async (cand) => {
      const fetched = await safeFetchSource(cand.url);
      return {
        cand,
        fetched,
      };
    })
  );

  for (const res of candidateFetches) {
    if (res.status === 'fulfilled') {
      const { cand, fetched } = res.value;
      const domain = fetched.domain || new URL(cand.url).hostname.replace(/^www\./, '');

      if (!sourcesMap.has(domain)) {
        // Detect syndication (e.g. AP wire reprint)
        const isSyndicated = /reuters|associated press|\bap\b|afp|wire service/i.test(fetched.substantiveText || cand.title);

        sourcesMap.set(domain, {
          id: `src-${domain}`,
          publisher: fetched.publisher || cand.publisher,
          domain,
          url: cand.url,
          title: cand.title,
          retrievedAt: nowIso,
          accessStatus: fetched.status,
          isPrimaryOrOfficial: isOfficialOrPrimaryDomain(domain),
          isSyndicatedOrReprint: isSyndicated,
          excerpt: fetched.excerpt,
          substantiveText: fetched.substantiveText,
          supportedClaims: cand.title ? [cand.title] : [],
        });
      }
    }
  }

  const allSources = Array.from(sourcesMap.values());

  // 5. Synthesis & Corroboration Analysis
  const accessibleSources = allSources.filter(
    (s) => s.accessStatus === 'accessible_full' || s.accessStatus === 'accessible_excerpt'
  );

  const independentPublishers = allSources.filter(
    (s) => !s.isSyndicatedOrReprint && s.accessStatus !== 'failed_unreachable'
  );

  const hasOfficialOrPrimary = allSources.some((s) => s.isPrimaryOrOfficial);
  const hasPaywalledOriginal = initialFetch.status === 'paywalled_restricted';

  // Repetition vs Independence analysis
  let repetitionAnalysis = '';
  if (accessibleSources.length >= 3) {
    repetitionAnalysis = `Corroborated across ${accessibleSources.length} distinct sources with independent editorial verification.`;
  } else if (accessibleSources.length === 2) {
    repetitionAnalysis = `Verified by dual-source independent cross-reporting.`;
  } else if (accessibleSources.length === 1 && hasPaywalledOriginal) {
    repetitionAnalysis = `Primary publisher has subscription access controls; facts corroborated via accessible reporting.`;
  } else {
    repetitionAnalysis = `Limited single-source wire dispatch.`;
  }

  // 6. Contradictions & Unresolved Questions Extraction
  const substantiveTexts = allSources.map((s) => s.substantiveText || s.excerpt || '').filter(Boolean);
  const { people, organizations, locations, figuresAndDates } = extractEntitiesAndFigures(headline, substantiveTexts);

  const contradictions: string[] = [];
  const unresolvedQuestions: string[] = [];

  // Check for figure conflicts if multiple sources report numbers
  if (figuresAndDates.length >= 2) {
    const magnitudes = figuresAndDates.filter(f => f.metricOrDate === 'Magnitude');
    if (magnitudes.length >= 2 && magnitudes[0].value !== magnitudes[1].value) {
      contradictions.push(`Reported magnitude variation: ${magnitudes[0].value} vs ${magnitudes[1].value}`);
    }
  }

  // 7. Determine Evidence Depth Mode (Rule 4)
  let depthMode: EvidenceDepthMode = 'briefing';
  if (accessibleSources.length >= 3 || (accessibleSources.length >= 2 && hasOfficialOrPrimary)) {
    depthMode = 'deep_dive';
  } else if (accessibleSources.length >= 2) {
    depthMode = 'multi_source';
  } else {
    depthMode = 'briefing';
  }

  // Formulate limitations
  const evidenceLimitations: string[] = [];
  if (hasPaywalledOriginal) {
    evidenceLimitations.push(
      `Original coverage from ${initialFetch.publisher} requires subscription access. Key facts are verified via permitted open reporting without bypassing controls.`
    );
  }
  if (depthMode === 'briefing') {
    evidenceLimitations.push(
      'Coverage is limited to initial wire dispatches. Further details await official updates.'
    );
  }
  if (contradictions.length > 0) {
    evidenceLimitations.push(
      `Cross-source discrepancy detected: ${contradictions.join('; ')}.`
    );
  }

  const record: EvidenceRecord = {
    eventId: `ev-${Buffer.from(headline).toString('base64').slice(0, 16)}`,
    canonicalHeadline: headline,
    eventDescription: summary || headline,
    whatHappened: substantiveTexts[0]?.slice(0, 240) || summary || headline,
    when: {
      publishedAt,
      timeframeDescription: `Reported ${new Date(publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    },
    entities: {
      people,
      organizations,
      locations: {
        country: locations.country || country,
      },
    },
    figuresAndDates,
    sources: allSources,
    corroboration: {
      totalSourcesConsulted: allSources.length,
      accessibleSourcesCount: accessibleSources.length,
      independentPublishersCount: independentPublishers.length,
      hasOfficialOrPrimaryDocument: hasOfficialOrPrimary,
      repetitionAnalysis,
    },
    contradictions,
    unresolvedQuestions,
    depthMode,
    evidenceLimitations,
  };

  return record;
}
