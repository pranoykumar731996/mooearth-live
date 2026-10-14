// ============================================================
// MooEarth Live — Event Filter & Personalized Ranking Hook
// ============================================================

'use client';

import { useMemo } from 'react';
import { EventCategory, WorldEvent } from '@/types';
import { matchCountry } from '@/data/questions';
import { UserPreferences } from '@/services/personalizationService';
import { rankPersonalizedEvents } from '@/services/personalizedNews';

interface UseEventFilterOptions {
  events: WorldEvent[];
  searchQuery: string;
  activeCategory: EventCategory | null;
  selectedCountry?: string | null;
  isReactionData?: boolean;
  preferences?: UserPreferences | null;
}

export function useEventFilter({
  events,
  searchQuery,
  activeCategory,
  selectedCountry,
  isReactionData = false,
  preferences = null,
}: UseEventFilterOptions): WorldEvent[] {
  return useMemo(() => {
    let filtered = events;

    // 1. Filter by selected country if active
    if (selectedCountry) {
      filtered = filtered.filter((e) => matchCountry(e.country, selectedCountry));
    }

    // 2. Filter by category - skip if this is reaction data
    if (activeCategory && !isReactionData) {
      filtered = filtered.filter((e) => {
        if (activeCategory === 'sports' || activeCategory === 'football') {
          return e.category === 'sports' || e.category === 'football';
        }
        return e.category === activeCategory;
      });
    }

    // 3. Filter by search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.city.toLowerCase().includes(query) ||
          e.country.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query) ||
          e.summary.toLowerCase().includes(query)
      );
    }

    // 4. Personalized Ranking (if user preferences are enabled and not in a specific country zoom)
    if (preferences && preferences.isPersonalizedFeedActive && !selectedCountry && !isReactionData) {
      const personalized = rankPersonalizedEvents(filtered, preferences);
      filtered = personalized.events;
    }

    return filtered;
  }, [events, searchQuery, activeCategory, selectedCountry, isReactionData, preferences]);
}
