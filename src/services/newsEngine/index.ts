// ============================================================
// MooEarth Live — Global News Coverage Engine 2.0: Orchestrator
// ============================================================

import { EngineArticle, StoryCluster } from './types';
import { GLOBAL_PUBLISHER_FEEDS, fetchRssFeedArticles } from './rssFeeds';
import { queryGdeltArticles } from './gdeltClient';
import { clusterAndDeduplicateArticles, areArticlesRelated } from './clustering';
import { resolveArticleAccess } from './accessResolver';
import { WorldEvent, EventCategory } from '@/types';
import { getCountryByName } from '@/data/countries';

export * from './types';
export * from './rssFeeds';
export * from './gdeltClient';
export * from './clustering';
export * from './accessResolver';

// Master in-memory cache for news clusters (90-second TTL)
interface EngineCache {
  timestamp: number;
  clusters: StoryCluster[];
}

const engineCacheMap = new Map<string, EngineCache>();
const CACHE_TTL_MS = 90_000;

/**
 * Fetch and aggregate news from multiple discovery sources across languages and categories
 */
export async function getGlobalNewsClusters(options?: {
  category?: EventCategory | 'all';
  language?: string;
  forceRefresh?: boolean;
}): Promise<StoryCluster[]> {
  const now = Date.now();
  const lang = options?.language || 'en';
  const category = options?.category && options.category !== 'all' ? options.category : undefined;
  const cacheKey = `${lang}__${category || 'all'}`;

  const cached = engineCacheMap.get(cacheKey);
  if (!options?.forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.clusters;
  }

  // 1. Select RSS feeds matching language and category
  const targetFeeds = GLOBAL_PUBLISHER_FEEDS.filter((feed) => {
    const langMatch = feed.language === 'en' || feed.language === lang;
    if (!langMatch) return false;
    if (category) {
      return feed.category === category || (feed.category === 'breaking' && feed.weight && feed.weight >= 9);
    }
    return true;
  });

  // 2. Fetch direct RSS feeds concurrently (with 5-second per-feed timeout)
  const feedPromises = targetFeeds.map((config) =>
    fetchRssFeedArticles(config, options?.forceRefresh)
  );

  // 3. Asynchronously fetch GDELT global pulse (safe with 5s timeout & throttle)
  const gdeltQuery = category ? `${category} world` : 'world';
  const gdeltPromise = queryGdeltArticles({
    query: gdeltQuery,
    language: lang,
    maxRecords: 12,
  }).catch(() => [] as EngineArticle[]);

  const [feedResults, gdeltArticles] = await Promise.all([
    Promise.allSettled(feedPromises),
    gdeltPromise,
  ]);

  const rawArticles: EngineArticle[] = [];

  for (const res of feedResults) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      rawArticles.push(...res.value);
    }
  }

  if (Array.isArray(gdeltArticles) && gdeltArticles.length > 0) {
    rawArticles.push(...gdeltArticles);
  }

  // 4. Cluster similar stories, deduplicate headlines, and assign multi-publisher sources
  const clusters = clusterAndDeduplicateArticles(rawArticles);

  if (clusters.length > 0) {
    engineCacheMap.set(cacheKey, {
      timestamp: now,
      clusters,
    });
  }

  return clusters.length > 0 ? clusters : (cached?.clusters || []);
}

/**
 * Converts EngineArticle to WorldEvent compatible with MooEarth Globe & Map
 */
export function engineArticleToWorldEvent(
  article: EngineArticle,
  clusterIndex = 0
): WorldEvent {
  return {
    id: article.id || `news-event-${clusterIndex}`,
    title: article.title,
    summary: article.summary,
    category: article.category || 'breaking',
    country: article.country,
    city: article.city || 'Global',
    lat: article.lat,
    lng: article.lng,
    source: article.sourceUrl,
    publishedAt: article.publishedAt,
  };
}

/**
 * Retrieve global news feed converted to WorldEvents
 */
export async function getGlobalNewsFeed(options?: {
  category?: EventCategory | 'all';
  language?: string;
  forceRefresh?: boolean;
}): Promise<WorldEvent[]> {
  const clusters = await getGlobalNewsClusters({
    language: options?.language,
    forceRefresh: options?.forceRefresh,
  });

  let filtered = clusters.map((c) => c.primaryArticle);

  if (options?.category && options.category !== 'all') {
    filtered = filtered.filter((a) => a.category === options.category);
  }

  return filtered.map((article, idx) => engineArticleToWorldEvent(article, idx));
}

/**
 * Retrieve country-specific news coverage using multi-source engine
 */
export async function getCountryNewsEngineFeed(
  countryName: string,
  language = 'en'
): Promise<EngineArticle[]> {
  if (!countryName) return [];

  const canonical = getCountryByName(countryName);
  const normalizedCountry = (canonical ? canonical.name : countryName).toLowerCase();

  // 1. Check existing global clusters for matches
  const globalClusters = await getGlobalNewsClusters({ language });
  const matchedFromClusters: EngineArticle[] = [];

  for (const cluster of globalClusters) {
    const art = cluster.primaryArticle;
    const countryMatch = art.country.toLowerCase() === normalizedCountry;
    const titleMatch = art.title.toLowerCase().includes(normalizedCountry);
    const summaryMatch = art.summary.toLowerCase().includes(normalizedCountry);

    if (countryMatch || titleMatch || summaryMatch) {
      matchedFromClusters.push(art);
    }
  }

  if (matchedFromClusters.length >= 3) {
    return matchedFromClusters;
  }

  // 2. Query GDELT for additional country-targeted coverage
  const countryCode = canonical ? canonical.iso2 : undefined;
  const gdeltResults = await queryGdeltArticles({
    query: canonical ? canonical.name : countryName,
    countryCode,
    language,
    maxRecords: 8,
  });

  const combined = [...matchedFromClusters, ...gdeltResults];
  const countryClusters = clusterAndDeduplicateArticles(combined);

  return countryClusters.map((c) => c.primaryArticle);
}

/**
 * Search global news stories across all discovery sources
 */
export async function searchGlobalNewsFeed(
  query: string,
  language = 'en'
): Promise<WorldEvent[]> {
  if (!query || !query.trim()) {
    return getGlobalNewsFeed({ language });
  }

  const queryTokens = query.toLowerCase().trim().split(/\s+/);
  const clusters = await getGlobalNewsClusters({ language });

  const scored = clusters
    .map((cluster) => {
      const art = cluster.primaryArticle;
      const titleLower = art.title.toLowerCase();
      const summaryLower = art.summary.toLowerCase();
      const countryLower = art.country.toLowerCase();

      let score = 0;
      for (const t of queryTokens) {
        if (titleLower.includes(t)) score += 5;
        if (countryLower.includes(t)) score += 4;
        if (summaryLower.includes(t)) score += 2;
      }

      return { article: art, score };
    })
  if (scored.length >= 4) {
    return scored.map((item, idx) => engineArticleToWorldEvent(item.article, idx));
  }

  // If local cluster results are sparse, dynamically query GDELT for global coverage
  try {
    const gdeltLive = await queryGdeltArticles({
      query,
      language,
      maxRecords: 8,
    });
    if (gdeltLive.length > 0) {
      const combined = [...scored.map((s) => s.article), ...gdeltLive];
      const newClusters = clusterAndDeduplicateArticles(combined);
      return newClusters.map((c, idx) => engineArticleToWorldEvent(c.primaryArticle, idx));
    }
  } catch {
    // Graceful fallback to existing scored items
  }

  return scored.map((item, idx) => engineArticleToWorldEvent(item.article, idx));
}

/**
 * Finds a matching story cluster for a given headline to retrieve cross-publisher coverage
 */
export async function findRelatedCluster(
  title: string,
  country?: string
): Promise<StoryCluster | null> {
  if (!title) return null;
  const clusters = await getGlobalNewsClusters();
  const queryTarget: EngineArticle = {
    id: 'lookup-probe',
    title,
    summary: '',
    sourceUrl: '',
    publisher: '',
    publisherDomain: '',
    category: 'breaking',
    country: country || 'International',
    city: 'Global',
    lat: 0,
    lng: 0,
    publishedAt: new Date().toISOString(),
    language: 'en',
    accessLevel: 'dispatch',
    accessLabel: 'Publisher Dispatch',
    sourceType: 'wire',
  };

  for (const cluster of clusters) {
    if (areArticlesRelated(queryTarget, cluster.primaryArticle)) {
      return cluster;
    }
    for (const rel of cluster.relatedArticles) {
      if (areArticlesRelated(queryTarget, rel)) {
        return cluster;
      }
    }
  }

  return null;
}

