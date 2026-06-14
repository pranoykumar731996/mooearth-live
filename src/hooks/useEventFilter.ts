// ============================================================
// MooEarth Live — Event Filter Hook
// ============================================================

'use client';

import { useMemo } from 'react';
import { EventCategory, WorldEvent } from '@/types';

interface UseEventFilterOptions {
  events: WorldEvent[];
  searchQuery: string;
  activeCategory: EventCategory | null;
}

export function useEventFilter({
  events,
  searchQuery,
  activeCategory,
}: UseEventFilterOptions): WorldEvent[] {
  return useMemo(() => {
    let filtered = events;

    // Filter by category
    if (activeCategory) {
      filtered = filtered.filter((e) => {
        if (activeCategory === 'worldcup') {
          return e.category === 'worldcup' || e.category === 'football';
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
  }, [events, searchQuery, activeCategory]);
}
