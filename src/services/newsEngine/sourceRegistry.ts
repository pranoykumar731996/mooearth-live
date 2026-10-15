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

  // ── Global Publisher Feeds (Audited Individually for RSS Metadata Only) ─────
  'aljazeera.com': {
    provider: 'Al Jazeera Media Network',
    domain: 'aljazeera.com',
    termsUrl: 'https://network.aljazeera.net/en/terms-and-conditions',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to Al Jazeera with direct canonical link.',
    storageRequirement: 'Ephemeral metadata only.',
    attributionRequirement: 'Al Jazeera citation.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Terms prohibit unauthorized commercial syndication and full-text AI reproduction.',
  },
  'france24.com': {
    provider: 'France 24 (France Médias Monde)',
    domain: 'france24.com',
    termsUrl: 'https://www.france24.com/en/terms-use',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to France 24 with link.',
    storageRequirement: 'Ephemeral metadata only.',
    attributionRequirement: 'France 24 citation.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'French public broadcaster terms restrict commercial reproduction; metadata dispatch permitted.',
  },
  'dw.com': {
    provider: 'Deutsche Welle (DW)',
    domain: 'dw.com',
    termsUrl: 'https://www.dw.com/en/terms-of-use/a-1721543',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to Deutsche Welle with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'DW attribution.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'German public broadcaster terms prohibit commercial exploitation without DW Content license.',
  },
  'npr.org': {
    provider: 'National Public Radio (NPR)',
    domain: 'npr.org',
    termsUrl: 'https://www.npr.org/about-npr/179876898/terms-of-use',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to NPR with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'NPR attribution.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'NPR terms strictly govern use of NPR feeds and trademarks for commercial purposes.',
  },
  'thehindu.com': {
    provider: 'The Hindu (THG Publishing)',
    domain: 'thehindu.com',
    termsUrl: 'https://www.thehindu.com/termsofuse/',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to The Hindu with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'The Hindu citation.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Indian publisher terms forbid reproduction, mirroring, or scraping without written license.',
  },
  'cbc.ca': {
    provider: 'CBC/Radio-Canada',
    domain: 'cbc.ca',
    termsUrl: 'https://www.cbc.ca/aboutcbc/discover/termsofuse.html',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to CBC News with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'CBC News citation.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Canadian public broadcaster terms require permission for commercial use of feeds.',
  },
  'cnbc.com': {
    provider: 'CNBC (NBCUniversal)',
    domain: 'cnbc.com',
    termsUrl: 'https://www.nbcuniversal.com/terms',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to CNBC with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'CNBC citation.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'NBCUniversal terms strictly forbid scraping, AI training, and unauthorized re-dissemination.',
  },
  'arstechnica.com': {
    provider: 'Ars Technica (Condé Nast)',
    domain: 'arstechnica.com',
    termsUrl: 'https://www.condenast.com/user-agreement',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to Ars Technica with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'Ars Technica citation.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Condé Nast user agreement prohibits commercial scraping and unauthorized distribution.',
  },
  'theverge.com': {
    provider: 'The Verge (Vox Media)',
    domain: 'theverge.com',
    termsUrl: 'https://www.voxmedia.com/terms-of-use',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to The Verge with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'The Verge citation.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Vox Media terms prohibit automated extraction and commercial aggregation.',
  },
  'phys.org': {
    provider: 'Phys.org (Science X)',
    domain: 'phys.org',
    termsUrl: 'https://sciencex.com/help/terms/',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to Phys.org with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'Phys.org citation.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Science X terms permit personal RSS access; commercial full-text redistribution prohibited.',
  },
  'abc.net.au': {
    provider: 'Australian Broadcasting Corporation (ABC)',
    domain: 'abc.net.au',
    termsUrl: 'https://about.abc.net.au/terms-of-use/',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to ABC News with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'ABC News Australia attribution.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Australian statutory corporation terms prohibit commercial use of feeds without ABC Commercial license.',
  },
  'elpais.com': {
    provider: 'El País (PRISA Media)',
    domain: 'elpais.com',
    termsUrl: 'https://elpais.com/estaticos/aviso-legal/',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to El País with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'El País attribution.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Spanish press publisher protected under EU DSM Directive Article 15; scraping/TDM expressly opted out.',
  },
  'nhk.or.jp': {
    provider: 'NHK (Japan Broadcasting Corporation)',
    domain: 'nhk.or.jp',
    termsUrl: 'https://www.nhk.or.jp/rules/',
    permissionStatus: 'restricted',
    authorizedUseCases: ['rss_headline_metadata_linking'],
    isCommercialUseAuthorized: false,
    displayRequirement: 'Attribution to NHK World with link.',
    storageRequirement: 'Transient metadata only.',
    attributionRequirement: 'NHK attribution.',
    aiProcessingAllowed: false,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Japanese public broadcaster terms prohibit unauthorized reproduction and commercial distribution.',
  },

  // ── Open Meteorological & Scientific Data APIs ──────────────
  'open-meteo.com': {
    provider: 'Open-Meteo Weather API',
    domain: 'open-meteo.com',
    termsUrl: 'https://open-meteo.com/en/terms',
    permissionStatus: 'approved',
    authorizedUseCases: ['weather_forecast_telemetry', 'historical_weather', 'climate_layers'],
    isCommercialUseAuthorized: true,
    displayRequirement: 'Attribution to Open-Meteo as weather provider.',
    storageRequirement: 'Caching of numerical forecasts permitted under Open Data terms.',
    attributionRequirement: 'Open-Meteo Weather API attribution.',
    aiProcessingAllowed: true,
    reviewDate: '2026-10-15',
    supportingEvidence: 'Open weather data platform utilizing public meteorological models (NOAA GFS, ECMWF, DWD ICON, JMA GSM) under open attribution license.',
  },
};

// ── In-Memory Dynamic Suspension Registry ────────────────────
// Enables instant runtime suspension of any domain/source by editorial or legal desk
const suspendedSourcesMap = new Map<string, { reason: string; timestamp: string }>();

/**
 * Immediately suspends a news source or provider domain
 */
export function suspendSource(domainOrUrl: string, reason: string): boolean {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) return false;
  suspendedSourcesMap.set(domain, { reason, timestamp: new Date().toISOString() });
  console.log(`[SourceRegistry] Source suspended immediately: ${domain}. Reason: ${reason}`);
  return true;
}

/**
 * Checks if a domain is actively suspended
 */
export function isSourceSuspended(domainOrUrl: string): boolean {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) return false;
  if (suspendedSourcesMap.has(domain)) return true;
  for (const key of suspendedSourcesMap.keys()) {
    if (domain === key || domain.endsWith(`.${key}`)) return true;
  }
  return false;
}

/**
 * Reinstates a previously suspended source
 */
export function reinstateSource(domainOrUrl: string): boolean {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) return false;
  return suspendedSourcesMap.delete(domain);
}

/**
 * Lists all actively suspended sources
 */
export function listSuspendedSources(): Array<{ domain: string; reason: string; timestamp: string }> {
  return Array.from(suspendedSourcesMap.entries()).map(([domain, data]) => ({
    domain,
    reason: data.reason,
    timestamp: data.timestamp,
  }));
}

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
 * STRICT COMPLIANCE RULE:
 * 1. Suspended sources are immediately blocked.
 * 2. Unregistered or ambiguous domains default to 'pending_review' with commercial/AI disabled.
 * 3. Official government domains are NOT assumed unrestricted; uncataloged official sites require review.
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

  // 1. Check immediate runtime suspension
  if (isSourceSuspended(domain)) {
    const suspendedData = suspendedSourcesMap.get(domain);
    return {
      provider: domain,
      domain,
      termsUrl: `https://${domain}`,
      permissionStatus: 'blocked',
      authorizedUseCases: [],
      isCommercialUseAuthorized: false,
      displayRequirement: 'Access suspended by editorial or legal desk.',
      storageRequirement: 'Zero storage.',
      attributionRequirement: 'N/A',
      aiProcessingAllowed: false,
      reviewDate: new Date().toISOString().split('T')[0],
      supportingEvidence: `Source suspended: ${suspendedData?.reason || 'Administrative action'}`,
    };
  }

  // 2. Check exact domain match in curated registry
  if (SOURCE_PERMISSION_REGISTRY[domain]) {
    return SOURCE_PERMISSION_REGISTRY[domain];
  }

  // 3. Check parent domain match (e.g. news.bbc.co.uk -> bbc.co.uk, feeds.a.dj.com -> wsj.com)
  for (const [key, record] of Object.entries(SOURCE_PERMISSION_REGISTRY)) {
    if (domain === key || domain.endsWith(`.${key}`)) {
      return record;
    }
  }

  // 4. Specific known government subdomains handled under parent agencies
  if (domain.endsWith('.usgs.gov')) return SOURCE_PERMISSION_REGISTRY['usgs.gov'];
  if (domain.endsWith('.noaa.gov')) return SOURCE_PERMISSION_REGISTRY['noaa.gov'];

  // 5. DEFAULT SAFE HARBOR: Unknown or uncataloged domains (including generic .gov/.mil)
  // are NEVER automatically assumed unrestricted. Must be reviewed individually.
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
    supportingEvidence: domain.endsWith('.gov') || domain.endsWith('.mil')
      ? 'Uncataloged government body. Individual datasets, agency images, and contractor works must be audited individually rather than presumed unrestricted.'
      : 'Unregistered domain; permission unverified. Automatically routed to review under Phase 4 compliance protocol.',
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
