import { PlanetaryTelemetry } from '@/types';
import { BoundedMap } from '@/lib/rate-limiter';
import { generatePlanetaryBriefing, getPlanetaryEventById, isPlanetaryCategory } from './planetaryEngine';

export interface ArticleDetails {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  country: string;
  category: string;
  aiSummary: string;
  fullContent: string;
  keyFacts: string[];
  author?: string;
  image?: string;
  description?: string;
  accessLevel?: 'full' | 'synthesis' | 'dispatch';
  accessLabel?: string;
  relatedSources?: Array<{ publisher: string; url: string; title: string }>;
  topicKeywords?: string[];
  debug?: {
    articleId: string;
    publisher: string;
    sourceUrl: string;
    contentRetrieved: boolean;
    summaryGenerated: boolean;
    cacheHit: boolean;
    validationPassed: boolean;
    [key: string]: any;
  };

  // Multi-Source Depth & Evidence Fields
  depthMode?: 'briefing' | 'multi_source' | 'deep_dive';
  publicationStatus?:
    | 'verified'
    | 'provisional'
    | 'under_review'
    | 'takedown_tombstone'
    | 'published_full'
    | 'published_briefing'
    | 'limited_evidence';
  newlyReportedFacts?: string[];
  attributedStatements?: Array<{
    statement: string;
    sourcePublisher: string;
    sourceUrl: string;
    quoteType: 'direct_quote' | 'indirect_paraphrase' | 'official_finding';
    attributionStrength: 'explicit_named' | 'organizational' | 'background';
    isContested?: boolean;
    speakerOrOrg?: string;
    quoteOrClaim?: string;
  }>;
  timelineDevelopments?: Array<{
    timeOrDate?: string;
    timeOrPhase?: string;
    event?: string;
    development?: string;
    significance?: string;
    sourcePublisher?: string;
  }>;
  historicalBackground?: string;
  analysisAndImplications?: string;
  competingAccountsOrContradictions?: string[];
  unresolvedQuestions?: string[];
  evidenceRecord?: any;
  sourceTransparency?: any;
  telemetry?: any;
}

// Curated premium images for each category
export const CATEGORY_IMAGES: Record<string, string> = {
  sports: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800',
  weather: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=800',
  seismic: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800',
  severe_weather: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=800',
  wildfires: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?q=80&w=800',
  space_weather: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800',
  climate_oceans: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?q=80&w=800',
  science_nature: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800',
};

// Bounded server-side in-memory cache for expanded briefings (max 500 entries, FIFO eviction)
const articleCache = new BoundedMap<string, ArticleDetails>(500);

function cleanText(str?: string): string {
  if (!str) return '';
  return str.trim();
}

/**
 * Generates an objective briefing for any planetary, weather, or sporting event.
 */
export async function fetchOrGenerateArticleDetails(
  id: string,
  url: string,
  title: string,
  summary: string,
  country: string,
  category: string,
  publishedAt: string,
  lat?: number,
  lng?: number,
  telemetry?: PlanetaryTelemetry
): Promise<ArticleDetails> {
  const cleanTitle = cleanText(title);
  const cleanSummary = cleanText(summary);
  const canonicalKey = cleanTitle.toLowerCase();
  const specificKey = `${id}_${canonicalKey}`;

  // 1. Check in-memory cache
  if (articleCache.has(specificKey)) {
    return articleCache.get(specificKey)!;
  }
  if (articleCache.has(canonicalKey)) {
    return articleCache.get(canonicalKey)!;
  }

  // 2. Resolve planetary telemetry if available
  let resolvedTelemetry = telemetry;
  let resolvedLat = lat;
  let resolvedLng = lng;

  if (!resolvedTelemetry || resolvedLat === undefined || resolvedLng === undefined) {
    const pe = await getPlanetaryEventById(id);
    if (pe) {
      resolvedTelemetry = resolvedTelemetry || pe.planetaryTelemetry;
      if (resolvedLat === undefined) resolvedLat = pe.lat;
      if (resolvedLng === undefined) resolvedLng = pe.lng;
    }
  }

  // 3. Generate structured scientific briefing
  const briefing = await generatePlanetaryBriefing({
    id,
    title: cleanTitle,
    summary: cleanSummary,
    country,
    category,
    publishedAt,
    sourceUrl: url,
    lat: resolvedLat,
    lng: resolvedLng,
    telemetry: resolvedTelemetry,
  });

  articleCache.set(canonicalKey, briefing);
  articleCache.set(specificKey, briefing);
  return briefing;
}

export function getArticleDetails(id: string): ArticleDetails | null {
  return articleCache.get(id) || null;
}
