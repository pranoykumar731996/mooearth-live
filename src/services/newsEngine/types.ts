// ============================================================
// MooEarth Live — Global News Coverage Engine 2.0: Types
// ============================================================

import { EventCategory, WorldEvent } from '@/types';

/** Access level tier for an article */
export type ArticleAccessTier = 'full' | 'synthesis' | 'dispatch';

export interface PublisherSource {
  publisher: string;
  url: string;
  title: string;
  publishedAt?: string;
  domain?: string;
}

export interface EngineArticle {
  id: string;
  title: string;
  summary: string;
  fullContent?: string;
  sourceUrl: string;
  publisher: string;
  publisherDomain: string;
  category: EventCategory;
  country: string;
  city: string;
  lat: number;
  lng: number;
  publishedAt: string; // ISO 8601
  language: string;    // e.g. 'en', 'es', 'fr', 'ar', 'de', 'ja', 'hi', 'pt'
  accessLevel: ArticleAccessTier;
  accessLabel: string;
  imageUrl?: string;
  sourceType: 'rss' | 'gdelt' | 'wire' | 'verified_feed';
  relatedSources?: PublisherSource[];
  topicKeywords?: string[];
}

export interface StoryCluster {
  clusterId: string;
  primaryArticle: EngineArticle;
  relatedArticles: EngineArticle[];
  topicKeywords: string[];
  coverageCount: number;
}

export interface RssFeedConfig {
  id: string;
  name: string;
  url: string;
  region: string;
  countryHint?: string;
  language: string;
  category: EventCategory;
  weight?: number;
}

export interface GdeltDocItem {
  url: string;
  title: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

export interface ArticleAccessResolution {
  accessLevel: ArticleAccessTier;
  accessLabel: string;
  confidence: number;
  hasFullBody: boolean;
  hasSummary: boolean;
  canReadInline: boolean;
  reason: string;
  cleanedBody?: string;
  extractedKeyFacts?: string[];
}
