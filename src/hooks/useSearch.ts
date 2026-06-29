import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { WorldEvent, EventCategory } from '@/types';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';
import { LocationRecord } from '@/data/locations';

interface UseSearchProps {
  events: WorldEvent[];
  activeCategory?: EventCategory | null;
}

export function useSearch({ events, activeCategory }: UseSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [serverResults, setServerResults] = useState<WorldEvent[]>([]);
  const [locationResults, setLocationResults] = useState<LocationRecord[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (!value.trim()) {
      setDebouncedQuery('');
      setServerResults([]);
      setLocationResults([]);
      return;
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setServerResults([]);
    setLocationResults([]);
  }, []);

  // Fetch search results & locations from server when query changes
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      return;
    }

    let isMounted = true;

    async function performSearch() {
      try {
        // Fetch locations autocomplete
        const locRes = await fetch(`/api/locations?q=${encodeURIComponent(q)}`);
        const locData = await locRes.json();
        
        // Fetch events search
        const catParam = activeCategory ? `&category=${activeCategory}` : '';
        const eventRes = await fetch(`/api/events?q=${encodeURIComponent(q)}${catParam}`);
        const eventData = await eventRes.json();

        if (isMounted) {
          setLocationResults(locData.locations || []);
          setServerResults(eventData.events || []);
        }
      } catch (err) {
        console.error('Failed to execute search queries:', err);
      }
    }

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeCategory]);

  // Calculate countryResult dynamically (for backward compatibility)
  const countryResult = useMemo(() => {
    if (activeCategory === 'worldcup') return null;
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return null;

    // First check if any of the autocomplete locations is a country
    const firstCountryLoc = locationResults.find(l => l.type === 'country');
    if (firstCountryLoc) return firstCountryLoc.name;

    const allEvents = [...events, ...serverResults];
    const activeEventCountries = allEvents.map(e => e.country).filter(Boolean);
    const uniqueCountries = Array.from(new Set(activeEventCountries));

    for (const c of uniqueCountries) {
      if (c) {
        const countryLower = c.toLowerCase();
        if (q.includes(countryLower) || (q.length >= 3 && countryLower.startsWith(q))) {
          return c;
        }
      }
    }
    return null;
  }, [events, serverResults, locationResults, debouncedQuery, activeCategory]);

  // Calculate results dynamically (events)
  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    const localFiltered = events.filter((e) => {
      if (activeCategory) {
        if (activeCategory === 'worldcup') {
          if (e.category !== 'worldcup') return false;
        } else if (activeCategory === 'football') {
          if (e.category !== 'football') return false;
        } else if (activeCategory === 'sports') {
          if (e.category !== 'sports' && e.category !== 'football' && e.category !== 'worldcup') return false;
        } else {
          if (e.category !== activeCategory) return false;
        }
      }

      return (
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.country && e.country.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
      );
    });

    const seen = new Set<string>();
    const combined: WorldEvent[] = [];

    for (const e of localFiltered) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        combined.push(e);
      }
    }

    for (const e of serverResults) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        combined.push(e);
      }
    }

    return combined.slice(0, 6);
  }, [events, debouncedQuery, serverResults, activeCategory]);

  return {
    query,
    debouncedQuery,
    setQuery: handleChange,
    results,
    locationResults,
    countryResult,
    clearSearch
  };
}
