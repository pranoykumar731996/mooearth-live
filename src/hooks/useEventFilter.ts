// ============================================================
// MooEarth Live — Event Filter Hook
// ============================================================

'use client';

import { useMemo } from 'react';
import { EventCategory, WorldEvent } from '@/types';
import { matchCountry } from '@/data/questions';

interface UseEventFilterOptions {
  events: WorldEvent[];
  searchQuery: string;
  activeCategory: EventCategory | null;
  selectedCountry?: string | null;
  isReactionData?: boolean;
}

export function useEventFilter({
  events,
  searchQuery,
  activeCategory,
  selectedCountry,
  isReactionData = false,
}: UseEventFilterOptions): WorldEvent[] {
  return useMemo(() => {
    let filtered = events;

    // Filter by selected country if active
    if (selectedCountry) {
      filtered = filtered.filter((e) => matchCountry(e.country, selectedCountry));
    }

    // Filter by category - skip if this is reaction data (server-side reactions are pre-filtered / have fallback headlines)
    if (activeCategory && !isReactionData) {
      filtered = filtered.filter((e) => {
        if (activeCategory === 'worldcup') {
          return e.category === 'worldcup' || e.category === 'football';
        }
        if (activeCategory === 'sports' || activeCategory === 'football') {
          return e.category === 'sports' || e.category === 'football' || e.category === 'worldcup';
        }
        return e.category === activeCategory;
      });
    }

    // Filter by search query
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

    return filtered;
  }, [events, searchQuery, activeCategory, selectedCountry, isReactionData]);
}
