// ============================================================
// MooEarth Live — Global News Coverage Engine 2.0: Story Clustering
// ============================================================

import { EngineArticle, StoryCluster, PublisherSource } from './types';

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'almost', 'also', 'amid', 'among',
  'and', 'another', 'around', 'because', 'before', 'being', 'between', 'both',
  'breaking', 'could', 'during', 'every', 'first', 'from', 'have', 'having',
  'into', 'just', 'more', 'most', 'near', 'over', 'says', 'said', 'since',
  'some', 'still', 'than', 'that', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'through', 'under', 'upon', 'were', 'what', 'when', 'where',
  'which', 'while', 'with', 'would', 'year', 'years',
]);

/**
 * Tokenize a headline into normalized keyword stems
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return Array.from(new Set(cleaned));
}

/**
 * Computes Jaccard similarity score between two token arrays (0.0 to 1.0)
 */
export function computeTokenSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Check if two articles likely describe the exact same breaking news event
 */
export function areArticlesRelated(a: EngineArticle, b: EngineArticle): boolean {
  if (a.sourceUrl === b.sourceUrl) return true;

  const tokensA = extractKeywords(a.title);
  const tokensB = extractKeywords(b.title);
  const similarity = computeTokenSimilarity(tokensA, tokensB);

  // Exact or near-exact headline match
  if (similarity >= 0.5) return true;

  // Medium overlap if country and publication date match within 48 hours
  const sameCountry =
    a.country !== 'International' &&
    b.country !== 'International' &&
    a.country.toLowerCase() === b.country.toLowerCase();

  const timeDiff = Math.abs(new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  const within48Hours = timeDiff < 48 * 3600 * 1000;

  if (sameCountry && within48Hours && similarity >= 0.28) {
    return true;
  }

  return false;
}

/**
 * Clusters an array of articles, selecting the best primary article and collecting secondary sources
 */
export function clusterAndDeduplicateArticles(articles: EngineArticle[]): StoryCluster[] {
  const clusters: StoryCluster[] = [];
  const assigned = new Set<string>();

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    if (assigned.has(article.id)) continue;

    const clusterGroup: EngineArticle[] = [article];
    assigned.add(article.id);

    for (let j = i + 1; j < articles.length; j++) {
      const candidate = articles[j];
      if (assigned.has(candidate.id)) continue;

      if (areArticlesRelated(article, candidate)) {
        clusterGroup.push(candidate);
        assigned.add(candidate.id);
      }
    }

    // Rank articles within the cluster to pick the best primary representation:
    // 1. Accessibility tier ('full' > 'synthesis' > 'dispatch')
    // 2. Length of summary/content
    // 3. Newest publication date
    const sorted = [...clusterGroup].sort((a, b) => {
      const tierRank: Record<string, number> = { full: 3, synthesis: 2, dispatch: 1 };
      const rankA = tierRank[a.accessLevel] || 0;
      const rankB = tierRank[b.accessLevel] || 0;
      if (rankA !== rankB) return rankB - rankA;

      const lenA = (a.fullContent?.length || 0) + (a.summary?.length || 0);
      const lenB = (b.fullContent?.length || 0) + (b.summary?.length || 0);
      if (lenA !== lenB) return lenB - lenA;

      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    const primary = sorted[0];
    const related = sorted.slice(1);

    // Build unique related publisher sources list
    const publisherMap = new Map<string, PublisherSource>();
    for (const r of related) {
      if (r.publisher && r.publisher !== primary.publisher) {
        publisherMap.set(r.publisher, {
          publisher: r.publisher,
          url: r.sourceUrl,
          title: r.title,
          publishedAt: r.publishedAt,
          domain: r.publisherDomain,
        });
      }
    }

    const relatedSources = Array.from(publisherMap.values());
    const topicKeywords = extractKeywords(primary.title).slice(0, 5);

    // Augment the primary article with cluster details
    primary.relatedSources = relatedSources;
    primary.topicKeywords = topicKeywords;

    clusters.push({
      clusterId: `cluster-${primary.id}`,
      primaryArticle: primary,
      relatedArticles: related,
      topicKeywords,
      coverageCount: clusterGroup.length,
    });
  }

  return clusters;
}
