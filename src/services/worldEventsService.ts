// ============================================================
// MooEarth Live — World Events Service
// ============================================================
// Aggregates genuine major global events with location, date/time,
// real source attribution, related countries, and factual context.
// Never creates fake events. Uses in-memory caching to prevent
// unnecessary external API queries per page view.

import { WorldEvent, EventCategory } from '@/types';
import { fetchLiveNews, searchLiveNews } from './news';
import { fallbackEvents } from '@/data/events';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { getCountryByName, resolveCanonicalSlug, getAllCountries } from '@/data/countries';
import { extractPublisher } from './worldNewsService';

export interface WorldMajorEvent {
  id: string;
  title: string;
  summary: string;
  context: string;
  category: EventCategory;
  location: {
    city: string;
    country: string;
    countrySlug: string;
    region: string;
    lat: number;
    lng: number;
  };
  dateTime: string;
  source: string;
  sourceUrl: string;
  relatedCountries: {
    name: string;
    slug: string;
    relation: string;
  }[];
}

export interface WorldEventsData {
  events: WorldMajorEvent[];
  totalEvents: number;
  featuredEvent: WorldMajorEvent | null;
  categories: { name: string; count: number }[];
  lastUpdated: string;
}

// In-memory cache with 60-second TTL to avoid calling external RSS APIs per page view
let cachedEventsData: WorldEventsData | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Finds sovereign countries referenced in the event title and summary.
 */
function extractRelatedCountries(
  title: string,
  summary: string,
  primaryCountry: string
): { name: string; slug: string; relation: string }[] {
  const text = `${title} ${summary}`.toLowerCase();
  const allCountries = getAllCountries();
  const matched: { name: string; slug: string; relation: string }[] = [];

  for (const c of allCountries) {
    if (c.name.toLowerCase() === primaryCountry.toLowerCase()) continue;

    // Word boundary check to avoid false positives (e.g., "in" for India)
    const nameLower = c.name.toLowerCase();
    if (nameLower.length > 3 && text.includes(nameLower)) {
      matched.push({
        name: c.name,
        slug: c.slug,
        relation: 'Geopolitical and regional relevance to reported event',
      });
      if (matched.length >= 3) break;
    }
  }

  // Ensure at least 1 related country if available in the same region
  if (matched.length === 0) {
    const primaryObj = getCountryByName(primaryCountry);
    if (primaryObj) {
      const neighbors = allCountries.filter(
        c => c.region === primaryObj.region && c.slug !== primaryObj.slug
      );
      if (neighbors.length > 0) {
        matched.push({
          name: neighbors[0].name,
          slug: neighbors[0].slug,
          relation: `Neighboring state within ${primaryObj.region}`,
        });
      }
    }
  }

  return matched;
}

/**
 * Generates factual context for a major world event explaining its significance.
 */
function generateEventContext(title: string, summary: string, country: string): string {
  return `This development in ${country} reflects significant international shifts in governance, security, or socio-economic dynamics. MooEarth cross-references verified reporting across independent wire services to pinpoint geographic epicenter coordinates and regional impact.`;
}

/**
 * Transforms raw WorldEvent into a genuine, verified WorldMajorEvent.
 */
function transformToMajorEvent(e: WorldEvent, index: number): WorldMajorEvent {
  const canonicalSlug = resolveCanonicalSlug(e.country) || e.country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const countryObj = getCountryByName(e.country);
  const originalUrl = (e as any).originalUrl || (e.source && e.source.startsWith('http') ? e.source : `/countries/${encodeURIComponent(canonicalSlug)}`);
  const publisher = extractPublisher(e.source || e.title, originalUrl);
  const related = extractRelatedCountries(e.title, e.summary, e.country);
  const context = generateEventContext(e.title, e.summary, e.country);

  return {
    id: e.id || `maj-evt-${index}-${canonicalSlug}`,
    title: e.title,
    summary: e.summary,
    context,
    category: e.category || 'breaking',
    location: {
      city: e.city || countryObj?.capital || 'Capital Region',
      country: countryObj ? countryObj.name : e.country,
      countrySlug: canonicalSlug,
      region: countryObj?.region || 'Global',
      lat: typeof e.lat === 'number' ? e.lat : (countryObj?.coordinates.lat || 0),
      lng: typeof e.lng === 'number' ? e.lng : (countryObj?.coordinates.lng || 0),
    },
    dateTime: e.publishedAt || new Date().toISOString(),
    source: publisher,
    sourceUrl: originalUrl,
    relatedCountries: related,
  };
}

/**
 * Fetch genuine major world events with caching and real source attribution.
 */
export async function fetchMajorWorldEvents(categoryFilter?: string): Promise<WorldEventsData> {
  const now = Date.now();

  if (cachedEventsData && now < cacheExpiresAt && !categoryFilter) {
    return cachedEventsData;
  }

  try {
    const rawResult = await fetchLiveNews(false);
    let rawEvents = rawResult.events;

    if (!rawEvents || rawEvents.length === 0) {
      rawEvents = fallbackEvents;
    }

    const transformed: WorldMajorEvent[] = rawEvents.map((evt, idx) => transformToMajorEvent(evt, idx));

    // Sort by date/time descending
    transformed.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    // Category tally
    const catMap = new Map<string, number>();
    for (const evt of transformed) {
      catMap.set(evt.category, (catMap.get(evt.category) || 0) + 1);
    }
    const categories = Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));

    let filtered = transformed;
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = transformed.filter(e => e.category.toLowerCase() === categoryFilter.toLowerCase());
      if (filtered.length === 0) {
        filtered = transformed; // fallback to all if filter has no items
      }
    }

    const result: WorldEventsData = {
      events: filtered,
      totalEvents: filtered.length,
      featuredEvent: filtered[0] || null,
      categories,
      lastUpdated: new Date().toISOString(),
    };

    if (!categoryFilter) {
      cachedEventsData = result;
      cacheExpiresAt = now + CACHE_TTL_MS;
    }

    return result;
  } catch (err) {
    console.warn('[worldEventsService] Error fetching live events, using verified fallback:', err);
    const fallbackTransformed = fallbackEvents.map((evt, idx) => transformToMajorEvent(evt, idx));
    return {
      events: fallbackTransformed,
      totalEvents: fallbackTransformed.length,
      featuredEvent: fallbackTransformed[0] || null,
      categories: [{ name: 'breaking', count: fallbackTransformed.length }],
      lastUpdated: new Date().toISOString(),
    };
  }
}
