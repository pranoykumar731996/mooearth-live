// ============================================================
// MooEarth.Live — Personalized Event & Discovery Ranking Service
// ============================================================
// Transparent preference-based ranking and filtering:
// - Ranks events by user-selected countries and topics
// - Preserves original sources, timestamps, and real coordinates
// - Safe fallback to global feed if personal filter returns empty
// - Never fabricates content or hallucinates publisher data

import { WorldEvent } from '@/types';
import { UserPreferences } from './personalizationService';
import { matchCountry } from '@/data/questions';

export interface PersonalizedFeedResult {
  events: WorldEvent[];
  isPersonalized: boolean;
  matchedCount: number;
  fallbackTriggered: boolean;
  reason?: string;
}

/**
 * Rank or filter a list of live WorldEvents based on user preferences.
 * If strictFilter is true and results are empty, automatically returns
 * the general feed with fallbackTriggered: true to prevent empty screens.
 */
export function rankPersonalizedEvents(
  events: WorldEvent[],
  preferences: UserPreferences | null,
  options: {
    strictFilter?: boolean;
    maxResults?: number;
  } = {}
): PersonalizedFeedResult {
  const { strictFilter = false, maxResults = 100 } = options;

  if (!events || events.length === 0) {
    return {
      events: [],
      isPersonalized: false,
      matchedCount: 0,
      fallbackTriggered: false,
    };
  }

  // If no preferences or user has not configured favorites, return original feed
  if (!preferences || (!preferences.favoriteCountries.length && !preferences.favoriteTopics.length)) {
    return {
      events: events.slice(0, maxResults),
      isPersonalized: false,
      matchedCount: 0,
      fallbackTriggered: false,
    };
  }

  const favCountriesLower = preferences.favoriteCountries.map((c) => c.toLowerCase().trim());
  const favTopicsLower = preferences.favoriteTopics.map((t) => t.toLowerCase().trim());

  // Score each event based on user affinity
  const scored = events.map((event) => {
    let score = 0;
    let countryMatched = false;
    let topicMatched = false;

    // Check country affinity
    if (event.country) {
      const eventCountryLower = event.country.toLowerCase().trim();
      const isCountryMatch = favCountriesLower.some(
        (fav) => eventCountryLower === fav || matchCountry(event.country, fav)
      );
      if (isCountryMatch) {
        score += 15;
        countryMatched = true;
      }
    }

    // Check topic affinity
    if (event.category) {
      const eventCatLower = event.category.toLowerCase().trim();
      const isTopicMatch = favTopicsLower.some(
        (fav) =>
          fav === eventCatLower ||
          (fav === 'events' && (eventCatLower === 'science_nature' || eventCatLower === 'seismic'))
      );
      if (isTopicMatch) {
        score += 8;
        topicMatched = true;
      }
    }

    return {
      event,
      score,
      isRelevant: countryMatched || topicMatched,
    };
  });

  const matchedEvents = scored.filter((item) => item.isRelevant);

  if (strictFilter) {
    // If strict filter mode requested:
    if (matchedEvents.length > 0) {
      return {
        events: matchedEvents
          .sort((a, b) => b.score - a.score)
          .map((item) => item.event)
          .slice(0, maxResults),
        isPersonalized: true,
        matchedCount: matchedEvents.length,
        fallbackTriggered: false,
      };
    } else {
      // Graceful fallback to general feed so user never gets a broken blank screen
      return {
        events: events.slice(0, maxResults),
        isPersonalized: false,
        matchedCount: 0,
        fallbackTriggered: true,
        reason: 'No events matched your selected interests. Displaying global live feed.',
      };
    }
  }

  // Soft ranking: Boost matching events to the top while keeping other global events accessible
  const ranked = [...scored].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Secondary sort by publication date
    return new Date(b.event.publishedAt).getTime() - new Date(a.event.publishedAt).getTime();
  });

  return {
    events: ranked.map((item) => item.event).slice(0, maxResults),
    isPersonalized: matchedEvents.length > 0,
    matchedCount: matchedEvents.length,
    fallbackTriggered: false,
  };
}
