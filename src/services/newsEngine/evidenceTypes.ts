// ============================================================
// MooEarth Live — Multi-Source Research & Evidence Depth Types
// ============================================================

export type EvidenceAccessStatus =
  | 'accessible_full'
  | 'accessible_excerpt'
  | 'paywalled_restricted'
  | 'failed_unreachable';

export type EvidenceDepthMode = 'briefing' | 'multi_source' | 'deep_dive';

export type PublicationStatus =
  | 'published_full'
  | 'published_briefing'
  | 'limited_evidence'
  | 'under_review';

export interface EvidenceSource {
  id: string;
  publisher: string;
  domain: string;
  url: string;
  title: string;
  publishedAt?: string;
  retrievedAt: string;
  accessStatus: EvidenceAccessStatus;
  isPrimaryOrOfficial?: boolean;
  isSyndicatedOrReprint?: boolean;
  excerpt?: string;
  substantiveText?: string;
  supportedClaims: string[];
}

export interface EvidenceRecord {
  eventId: string;
  canonicalHeadline: string;
  eventDescription: string;
  whatHappened: string;
  when: {
    occurredAt?: string;
    publishedAt: string;
    timeframeDescription?: string;
  };
  entities: {
    people: string[];
    organizations: string[];
    locations: {
      country: string;
      city?: string;
      region?: string;
    };
  };
  figuresAndDates: Array<{
    metricOrDate: string;
    value: string;
    sourcePublisher: string;
  }>;
  sources: EvidenceSource[];
  corroboration: {
    totalSourcesConsulted: number;
    accessibleSourcesCount: number;
    independentPublishersCount: number;
    hasOfficialOrPrimaryDocument: boolean;
    repetitionAnalysis: string;
  };
  contradictions: string[];
  unresolvedQuestions: string[];
  depthMode: EvidenceDepthMode;
  evidenceLimitations: string[];
}

export interface AttributedStatement {
  quoteOrClaim: string;
  speakerOrOrg: string;
  sourcePublisher: string;
  isDirectQuote: boolean;
}

export interface TimelineDevelopment {
  timeOrPhase: string;
  development: string;
  sourcePublisher: string;
}

export interface SourceTransparencyReport {
  sourcesConsulted: number;
  independentOutlets: number;
  hasPaywalledOriginal: boolean;
  paywalledPublishers: string[];
  lastCheckedAt: string;
  aiDisclosure: string;
  evidenceLimitations: string[];
  sourcesList: Array<{
    publisher: string;
    title: string;
    url: string;
    domain: string;
    publishedAt?: string;
    accessStatus: EvidenceAccessStatus;
    isPrimaryOrOfficial?: boolean;
    isSyndicated?: boolean;
  }>;
}

export interface ResearchTelemetry {
  provider: string;
  modelUsed: string;
  tokensUsed?: number;
  estimatedCostUsd?: number;
  researchLatencyMs: number;
  sourcesEvaluated: number;
  cacheHit: boolean;
}

export interface EvidenceBasedArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  country: string;
  category: string;
  depthMode: EvidenceDepthMode;
  publicationStatus: PublicationStatus;
  
  // Executive briefing
  aiSummary: string;
  fullContent: string;
  keyFacts: string[];

  // Fact vs context separation
  newlyReportedFacts: string[];
  attributedStatements: AttributedStatement[];
  timelineDevelopments: TimelineDevelopment[];
  historicalBackground: string;
  analysisAndImplications: string;
  competingAccountsOrContradictions: string[];
  unresolvedQuestions: string[];

  // Transparency & Evidence Record
  evidenceRecord: EvidenceRecord;
  sourceTransparency: SourceTransparencyReport;
  telemetry: ResearchTelemetry;

  // Metadata
  author?: string;
  image?: string;
  accessLevel: 'full' | 'synthesis' | 'dispatch';
  accessLabel: string;
  relatedSources?: Array<{ publisher: string; url: string; title: string }>;
  topicKeywords?: string[];
  debug?: Record<string, any>;
}
