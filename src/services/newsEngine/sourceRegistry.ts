// ============================================================
// MooEarth Live — Source Permission Registry & Compliance Audit
// ============================================================
// Catalogs terms, license URLs, permission statuses, and restrictions
// for all news sources, RSS feeds, APIs, and public data providers.
// Strict Legal Rule: Unknown or disputed permissions trigger review
// rather than automatic approval.
// ============================================================

export type SourcePermissionStatus =
  | 'approved'       // Verified license or public domain / open government data
  | 'restricted'     // Specific use only (e.g. metadata/attribution only; no commercial scraping or full-text AI)
  | 'pending_review' // Unverified or disputed; requires human legal/editorial review
  | 'blocked';       // Expressly prohibited by terms, paywall, or takedown notice

export interface SourcePermissionRecord {
  provider: string;
  domain: string;
  termsUrl: string;
  licenseUrl?: string;
  permissionStatus: SourcePermissionStatus;
  authorizedUseCases: string[];
  isCommercialUseAuthorized: boolean;
  displayRequirement: string;
  storageRequirement: string;
  attributionRequirement: string;
  aiProcessingAllowed: boolean;
  reviewDate: string;
  supportingEvidence: string;
}

/**
 * Curated Registry of Known News Providers, Agencies, and Official Repositories
 */
export const SOURCE_PERMISSION_REGISTRY: Record<string, SourcePermissionRecord> = {
  // ── Primary Public Repositories & Government Agencies ──────
  'usgs.gov': {
    provider: 'U.S. Geological Survey (USGS)',
    domain: 'usgs.gov',
    termsUrl: 'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    permissionStatus: 'approved',
    authorizedUseCases: ['public_dataset_access', 'earthquake_monitoring', 'primary_reporting'],
    isCommercialUseAuthorized: true,
    displayRequirement: 'Direct attribution to USGS public domain data.',
    storageRequirement: 'Permanent archiving permitted (U.S. Government public domain).',
    attributionRequirement: 'Mandatory source citation (USGS).',
    aiProcessingAllowed: true,
    reviewDate: '2026-10-15',
    supportingEvidence: 'U.S. Federal Government works reside in the public domain under 17 U.S.C. § 105.',
  },
  'noaa.gov': {
    provider: 'National Oceanic and Atmospheric Administration (NOAA)',
    domain: 'noaa.gov',
    termsUrl: 'https://www.noaa.gov/protecting-our-data-and-privacy',
    permissionStatus: 'approved',
    authorizedUseCases: ['weather_telemetry', 'storm_alerts', 'satellite_ingestion'],
    isCommercialUseAuthorized: true,
    displayRequirement: 'Direct attribution to NOAA.',
    storageRequirement: 'Permanent archiving permitted (public domain).',
    attributionRequirement: 'Mandatory source citation (NOAA).',
    aiProcessingAllowed: true,
    reviewDate: '2026-10-15',
    supportingEvidence: 'U.S. Federal Government public domain data under 17 U.S.C. § 105.',
  },
  'who.int': {
    provider: 'World Health Organization (WHO)',
    domain: 'who.int',
    termsUrl: 'https://www.who.int/about/policies/publishing/copyright',
    permissionStatus: 'approved',
    authorizedUseCases: ['public_health_alerts', 'official_communiques'],
    isCommercialUseAuthorized: true,
    displayRequirement: 'Factual summary with link to original WHO release.',
    storageRequirement: 'Metadata and facts only; no wholesale reproduction of WHO publications.',
    attributionRequirement: 'Explicit attribution to World Health Organization.',
    aiProcessingAllowed: true,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Open public health guidance published for global awareness under open access terms.',
  },
  'un.org': {
    provider: 'United Nations',
    domain: 'un.org',
    termsUrl: 'https://www.un.org/en/about-us/terms-of-use',
    permissionStatus: 'approved',
    authorizedUseCases: ['diplomatic_communiques', 'treaty_records', 'resolutions'],
    isCommercialUseAuthorized: true,
    displayRequirement: 'Attribution to UN official press dispatches.',
    storageRequirement: 'Metadata and facts only.',
    attributionRequirement: 'Explicit attribution to United Nations.',
    aiProcessingAllowed: true,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Official press releases and public documents.',
  },

  // ── Open Research & Aggregation Frameworks ─────────────────
  'gdeltproject.org': {
    provider: 'The GDELT Project',
    domain: 'gdeltproject.org',
    termsUrl: 'https://www.gdeltproject.org/about.html',
    permissionStatus: 'approved',
    authorizedUseCases: ['global_event_pulse', 'headline_metadata', 'sentiment_indexing'],
    isCommercialUseAuthorized: true,
    displayRequirement: 'Attribution as GDELT Open Research Data.',
    storageRequirement: 'Transient caching of article URLs and timestamps.',
    attributionRequirement: 'GDELT Global News Pulse citation.',
    aiProcessingAllowed: true,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Open research initiative supported by Google Cloud and academic partners.',
  },

  // ── Google News RSS & Aggregation Endpoints ────────────────
  'news.google.com': {
    provider: 'Google News RSS Service',
    domain: 'news.google.com',
    termsUrl: 'https://policies.google.com/terms',
    permissionStatus: 'restricted',
    authorizedUseCases: ['personal_rss_reader_only'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Direct unaltered headline link back to publisher.',
    storageRequirement: 'Zero permanent archiving; strictly ephemeral session transit.',
    attributionRequirement: 'Attribution to Google News / original publisher.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Google Terms of Service prohibit scraping, automated querying, commercial redistribution, and internal RPC exploitation without express agreement.',
  },

  // ── Major Commercial News Publishers (Unlicensed Direct Scrapes are Restricted) ───
  'reuters.com': {
    provider: 'Reuters',
    domain: 'reuters.com',
    termsUrl: 'https://www.reuters.com/terms-of-use/',
    permissionStatus: 'restricted',
    authorizedUseCases: ['metadata_attribution_only', 'raw_facts_only'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Headline metadata with direct canonical link back to Reuters.',
    storageRequirement: 'No caching of full-text article paragraphs.',
    attributionRequirement: 'Mandatory attribution: Reuters.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Thomson Reuters terms prohibit automated scraping, extraction, and commercial redistribution without Reuters Connect license.',
  },
  'apnews.com': {
    provider: 'Associated Press (AP)',
    domain: 'apnews.com',
    termsUrl: 'https://apnews.com/terms-of-service',
    permissionStatus: 'restricted',
    authorizedUseCases: ['metadata_attribution_only', 'raw_facts_only'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Headline metadata with direct canonical link back to AP.',
    storageRequirement: 'No full-text storage.',
    attributionRequirement: 'Mandatory attribution: Associated Press.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'AP terms expressly prohibit AI ingestion and commercial aggregation without AP Content API license.',
  },
  'bbc.co.uk': {
    provider: 'BBC News',
    domain: 'bbc.co.uk',
    termsUrl: 'https://www.bbc.co.uk/usingthebbc/terms-of-use/',
    permissionStatus: 'restricted',
    authorizedUseCases: ['public_rss_feed_metadata'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to BBC News with direct link.',
    storageRequirement: 'Ephemeral caching of RSS metadata only.',
    attributionRequirement: 'Clear BBC News badge.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'BBC RSS Terms are limited to personal, non-commercial use unless licensed via BBC Studios.',
  },
  'theguardian.com': {
    provider: 'The Guardian',
    domain: 'theguardian.com',
    termsUrl: 'https://www.theguardian.com/help/terms-of-service',
    permissionStatus: 'restricted',
    authorizedUseCases: ['open_platform_api_only', 'rss_metadata'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to The Guardian with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'The Guardian attribution.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Guardian terms prohibit commercial web scraping; requires Guardian Open Platform API commercial key.',
  },

  // ── Paywalled / Access-Controlled Publishers (Strictly Blocked / Restricted) ───
  'wsj.com': {
    provider: 'The Wall Street Journal (Dow Jones)',
    domain: 'wsj.com',
    termsUrl: 'https://www.dowjones.com/terms-of-use/',
    permissionStatus: 'blocked',
    authorizedUseCases: ['none_without_dow_jones_syndication'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Do not display article text.',
    storageRequirement: 'Zero storage.',
    attributionRequirement: 'N/A',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Strict subscription paywall and proprietary terms. Scrape/bypass strictly prohibited.',
  },
  'ft.com': {
    provider: 'Financial Times',
    domain: 'ft.com',
    termsUrl: 'https://help.ft.com/legal-privacy/terms-and-conditions/',
    permissionStatus: 'blocked',
    authorizedUseCases: ['none_without_ft_syndication'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Do not display article text.',
    storageRequirement: 'Zero storage.',
    attributionRequirement: 'N/A',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Paywalled publisher; commercial aggregation requires FT Enterprise Syndication.',
  },
  'nytimes.com': {
    provider: 'The New York Times',
    domain: 'nytimes.com',
    termsUrl: 'https://help.nytimes.com/hc/en-us/articles/115014893428-Terms-of-Service',
    permissionStatus: 'blocked',
    authorizedUseCases: ['none_without_licensing'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Do not display article text.',
    storageRequirement: 'Zero storage.',
    attributionRequirement: 'N/A',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'NYT Terms explicitly forbid AI training, crawling, or commercial re-dissemination.',
  },
  'bloomberg.com': {
    provider: 'Bloomberg News',
    domain: 'bloomberg.com',
    termsUrl: 'https://www.bloomberg.com/notices/tos/',
    permissionStatus: 'blocked',
    authorizedUseCases: ['none_without_bloomberg_terminal_license'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Do not display article text.',
    storageRequirement: 'Zero storage.',
    attributionRequirement: 'N/A',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Proprietary financial terminal data and strict subscription paywall.',
  },
};

/**
 * Normalizes host/domain from a URL or raw domain string
 */
export function normalizeDomain(domainOrUrl: string): string {
  if (!domainOrUrl) return '';
  try {
    const raw = domainOrUrl.includes('://')
      ? new URL(domainOrUrl).hostname
      : domainOrUrl;
    return raw.replace(/^www\./, '').toLowerCase().trim();
  } catch {
    return domainOrUrl.toLowerCase().trim();
  }
}

/**
 * Checks the permission status and legal restrictions for a source domain.
 * STRICT RULE: Unknown or unverified domains default to 'pending_review'
 * with commercial use disabled.
 */
export function checkSourcePermission(domainOrUrl: string): SourcePermissionRecord {
  const domain = normalizeDomain(domainOrUrl);

  if (!domain) {
    return {
      provider: 'Unknown Provider',
      domain: 'unknown',
      termsUrl: '',
      permissionStatus: 'pending_review',
      authorizedUseCases: [],
      isCommercialUseAuthorized: false,
      displayRequirement: 'Restricted pending review.',
      storageRequirement: 'Zero storage.',
      attributionRequirement: 'Required.',
      aiProcessingAllowed: false,
      reviewDate: new Date().toISOString().split('T')[0],
      supportingEvidence: 'No domain provided; access restricted.',
    };
  }

  // Check exact domain match
  if (SOURCE_PERMISSION_REGISTRY[domain]) {
    return SOURCE_PERMISSION_REGISTRY[domain];
  }

  // Check parent domain match (e.g. news.bbc.co.uk -> bbc.co.uk)
  for (const [key, record] of Object.entries(SOURCE_PERMISSION_REGISTRY)) {
    if (domain === key || domain.endsWith(`.${key}`)) {
      return record;
    }
  }

  // Check for public government / primary domains (.gov, .mil, un.org, etc.)
  if (domain.endsWith('.gov') || domain.endsWith('.mil')) {
    return {
      provider: `Official Government Service (${domain})`,
      domain,
      termsUrl: `https://${domain}`,
      permissionStatus: 'approved',
      authorizedUseCases: ['public_records', 'official_announcements'],
      isCommercialUseAuthorized: true,
      displayRequirement: 'Attribution to official government dispatch.',
      storageRequirement: 'Facts and metadata permitted.',
      attributionRequirement: `Attribution to ${domain}.`,
      aiProcessingAllowed: true,
      reviewDate: new Date().toISOString().split('T')[0],
      supportingEvidence: 'Official government domain recognized as public record.',
    };
  }

  // DEFAULT SAFE HARBOR: Unknown domains are NEVER automatically approved.
  // Must be marked as pending_review with commercial use false.
  return {
    provider: domain,
    domain,
    termsUrl: `https://${domain}`,
    permissionStatus: 'pending_review',
    authorizedUseCases: ['factual_indexing_pending_audit'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Direct link back to source with explicit disclaimer.',
    storageRequirement: 'Transient metadata only; no full-text storage.',
    attributionRequirement: `Explicit attribution to ${domain}.`,
    aiProcessingAllowed: false,
    reviewDate: new Date().toISOString().split('T')[0],
    supportingEvidence: 'Unregistered domain; permission unverified. Automatically routed to review under Phase 4 compliance protocol.',
  };
}

/**
 * Checks whether an article source is approved for full AI text ingestion
 */
export function isSourceApprovedForAi(domainOrUrl: string): boolean {
  const perm = checkSourcePermission(domainOrUrl);
  return perm.permissionStatus === 'approved' && perm.aiProcessingAllowed;
}

/**
 * Checks whether a source is approved for commercial display
 */
export function isSourceApprovedForCommercialDisplay(domainOrUrl: string): boolean {
  const perm = checkSourcePermission(domainOrUrl);
  return perm.permissionStatus === 'approved' && perm.isCommercialUseAuthorized;
}
