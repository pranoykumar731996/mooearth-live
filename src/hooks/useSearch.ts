import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { WorldEvent, EventCategory } from '@/types';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

interface UseSearchProps {
  events: WorldEvent[];
  activeCategory?: EventCategory | null;
}

export function useSearch({ events, activeCategory }: UseSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [serverResults, setServerResults] = useState<WorldEvent[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setServerResults([]);
  }, []);

  // Fetch search results from server when query changes
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setServerResults([]);
      return;
    }

    let isMounted = true;

    async function fetchSearchResults() {
      try {
        const catParam = activeCategory ? `&category=${activeCategory}` : '';
        const res = await fetch(`/api/events?q=${encodeURIComponent(q)}${catParam}`);
        if (!res.ok) throw new Error('Search request failed');
        const data = await res.json();
        
        if (isMounted) {
          setServerResults(data.events || []);
        }
      } catch (err) {
        console.error('Failed to fetch search results from server:', err);
      }
    }

    fetchSearchResults();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeCategory]);

  // Calculate countryResult dynamically
  const countryResult = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return null;

    // Combine local events and server results to scan for matching countries
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
  }, [events, serverResults, debouncedQuery]);

  // Calculate results dynamically (combining local filtered items and server-fetched results)
  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    const localFiltered = events.filter((e) => {
      return (
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.country && e.country.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (countryResult && e.country === countryResult)
      );
    });

    // Merge and deduplicate by ID
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

    return combined.slice(0, countryResult ? 4 : 8);
  }, [events, debouncedQuery, countryResult, serverResults]);

  return {
    query,
    debouncedQuery,
    setQuery: handleChange,
    results,
    countryResult,
    clearSearch
  };
}

