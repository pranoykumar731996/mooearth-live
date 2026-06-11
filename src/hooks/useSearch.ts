import { useState, useCallback, useRef, useEffect } from 'react';
import { WorldEvent } from '@/types';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

// A comprehensive list of countries to ensure we can always map a search
// to a geographic location, even if no active live events are happening there.
const GLOBAL_COUNTRIES = [
  'United States', 'United Kingdom', 'Japan', 'China', 'India', 'Brazil',
  'Australia', 'Germany', 'France', 'Canada', 'Mexico', 'Spain', 'Italy',
  'Argentina', 'South Korea', 'Russia', 'South Africa', 'Nigeria', 'Egypt',
  'Saudi Arabia', 'Turkey', 'Indonesia', 'Netherlands', 'Switzerland', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'Portugal', 'Greece', 'New Zealand',
  'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines', 'Colombia',
  'Chile', 'Peru', 'Venezuela', 'Morocco', 'Kenya', 'Ghana', 'UAE', 'Israel',
  'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Ukraine', 'Poland', 'Romania'
];

interface UseSearchProps {
  events: WorldEvent[];
}

export function useSearch({ events }: UseSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<WorldEvent[]>([]);
  const [countryResult, setCountryResult] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Parse and match query to countries and events
  const executeSearch = useCallback((q: string) => {
    if (!q || q.trim().length === 0) {
      setResults([]);
      setCountryResult(null);
      return;
    }

    const lowerQ = q.trim().toLowerCase();

    // 1. Detect and match countries
    let foundCountry: string | null = null;
    const activeEventCountries = events.map(e => e.country).filter(Boolean);
    const uniqueCountries = Array.from(new Set([...GLOBAL_COUNTRIES, ...activeEventCountries]));

    // Match if query contains the country (e.g. "brazil reactions")
    // or if the country starts with the query (e.g. "braz")
    for (const c of uniqueCountries) {
      if (c) {
        const countryLower = c.toLowerCase();
        if (lowerQ.includes(countryLower) || (lowerQ.length >= 3 && countryLower.startsWith(lowerQ))) {
          foundCountry = c;
          break; // Prefer the first strong match
        }
      }
    }
    setCountryResult(foundCountry);

    // 2. Filter events
    const filtered = events.filter((e) => {
      // Fuzzy match against title, city, country, category
      return (
        (e.title && e.title.toLowerCase().includes(lowerQ)) ||
        (e.city && e.city.toLowerCase().includes(lowerQ)) ||
        (e.country && e.country.toLowerCase().includes(lowerQ)) ||
        (e.category && e.category.toLowerCase().includes(lowerQ)) ||
        // Always include events from the matched country to ensure results aren't empty
        (foundCountry && e.country === foundCountry)
      );
    });

    // If we found a country, we prioritize it as a special action item
    // so we can show slightly fewer raw event results to save space
    setResults(filtered.slice(0, foundCountry ? 4 : 8));
  }, [events]);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
      executeSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  }, [executeSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setCountryResult(null);
  }, []);

  // Ensure search updates if underlying events change while query is active
  useEffect(() => {
    if (debouncedQuery) {
      executeSearch(debouncedQuery);
    }
  }, [events, debouncedQuery, executeSearch]);

  return {
    query,
    setQuery: handleChange,
    results,
    countryResult,
    clearSearch
  };
}
