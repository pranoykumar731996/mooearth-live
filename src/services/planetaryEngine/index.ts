// ============================================================
// MooEarth Live — Planetary Engine: Central Coordinator
// ============================================================

import { PlanetaryEvent } from './types';
import { EventCategory, WorldEvent } from '@/types';
import { fetchUsgsEarthquakes } from './usgsClient';
import { fetchNasaEonetEvents } from './nasaEonetClient';
import { fetchNoaaSpaceWeather } from './noaaSpaceWeatherClient';
import { fetchNasaEarthObservatory } from './nasaEarthObsClient';

export * from './types';
export * from './usgsClient';
export * from './nasaEonetClient';
export * from './noaaSpaceWeatherClient';
export * from './nasaEarthObsClient';

interface CachedPlanetaryStream {
  events: PlanetaryEvent[];
  cachedAt: number;
}

let inMemoryCache: CachedPlanetaryStream | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Fetches all active planetary events across scientific feeds
 */
export async function fetchLivePlanetaryEvents(refresh = false): Promise<PlanetaryEvent[]> {
  const now = Date.now();

  if (!refresh && inMemoryCache && now - inMemoryCache.cachedAt < CACHE_TTL_MS) {
    return inMemoryCache.events;
  }

  // Concurrent scientific ingestion with fault isolation
  const results = await Promise.allSettled([
    fetchUsgsEarthquakes(7000),
    fetchNasaEonetEvents(8000),
    fetchNoaaSpaceWeather(6000),
    fetchNasaEarthObservatory(7000),
  ]);

  const allEvents: PlanetaryEvent[] = [];
  const seenIds = new Set<string>();

  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      for (const ev of res.value) {
        if (!seenIds.has(ev.id)) {
          seenIds.add(ev.id);
          allEvents.push(ev);
        }
      }
    }
  }

  // Sort by recency (most recent first)
  allEvents.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  if (allEvents.length > 0) {
    inMemoryCache = {
      events: allEvents,
      cachedAt: now,
    };
  } else if (inMemoryCache) {
    // Retain previous cache if temporary network failure occurs
    return inMemoryCache.events;
  }

  return allEvents;
}

/**
 * Searches planetary events by text query and optional category filter
 */
export async function searchPlanetaryEvents(
  query: string,
  category?: EventCategory | 'all',
  limit = 40
): Promise<PlanetaryEvent[]> {
  const allEvents = await fetchLivePlanetaryEvents();
  const q = query.trim().toLowerCase();

  return allEvents
    .filter((e) => {
      const matchesCategory = !category || category === 'all' || e.category === category;
      if (!matchesCategory) return false;

      if (!q) return true;

      return (
        e.title.toLowerCase().includes(q) ||
        e.country.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q)
      );
    })
    .slice(0, limit);
}

/**
 * Fetches active planetary events for a specific country
 */
export async function fetchPlanetaryEventsForCountry(
  countryName: string,
  limit = 20
): Promise<PlanetaryEvent[]> {
  const allEvents = await fetchLivePlanetaryEvents();
  const target = countryName.trim().toLowerCase();

  return allEvents
    .filter((e) => {
      const c = e.country.toLowerCase();
      return c === target || c.includes(target) || target.includes(c);
    })
    .slice(0, limit);
}

/**
 * Converts a PlanetaryEvent to standard WorldEvent for seamless UI/Globe compatibility
 */
export function planetaryEventToWorldEvent(pe: PlanetaryEvent): WorldEvent {
  return {
    id: pe.id,
    title: pe.title,
    summary: pe.summary,
    category: pe.category,
    country: pe.country,
    city: pe.city,
    lat: pe.lat,
    lng: pe.lng,
    source: pe.source,
    publishedAt: pe.publishedAt,
    url: pe.url,
    thumbnail: pe.thumbnail,
    planetaryTelemetry: pe.planetaryTelemetry,
  };
}
