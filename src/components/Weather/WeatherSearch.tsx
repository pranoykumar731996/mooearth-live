// ============================================================
// MooEarth Live — Weather & Global Location Search Component
// ============================================================
// Worldwide location search with debouncing, autocomplete dropdown,
// category badges (Airports, Mountains, Streets, Landmarks, Cities),
// address hierarchy, keyboard navigation, and empty/error states.
// 100% Free / Open-Data Powered.

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GeocodingResult, GeocodingResponse, GeographicFeatureType } from '@/services/weather/types';

interface WeatherSearchProps {
  onSelectLocation: (result: GeocodingResult) => void;
  onClear?: () => void;
  placeholder?: string;
  initialQuery?: string;
}

const FEATURE_CONFIG: Record<
  GeographicFeatureType,
  { icon: string; label: string; badgeClass: string }
> = {
  airport: {
    icon: '✈️',
    label: 'Airport',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  mountain: {
    icon: '🏔️',
    label: 'Mountain',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  landmark: {
    icon: '🏛️',
    label: 'Landmark',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  water: {
    icon: '🌊',
    label: 'Water',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  park: {
    icon: '🌳',
    label: 'Park',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  },
  station: {
    icon: '🚆',
    label: 'Station',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  street: {
    icon: '🛣️',
    label: 'Street',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  },
  address: {
    icon: '📍',
    label: 'Address',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  administrative: {
    icon: '🗺️',
    label: 'Region',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  country: {
    icon: '🌐',
    label: 'Country',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  city: {
    icon: '🏙️',
    label: 'City',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
};

export default function WeatherSearch({
  onSelectLocation,
  onClear,
  placeholder = 'Search cities, streets, landmarks, airports...',
  initialQuery,
}: WeatherSearchProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // Sync external initialQuery changes (e.g. globe click or URL change)
  useEffect(() => {
    if (initialQuery !== undefined) {
      if (document.activeElement === inputRef.current) {
        // User is currently typing in the search box - do not stomp over their typed text!
        return;
      }
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Debounced search with race-condition protection
  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      setHasSearched(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const thisRequestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/weather/geocoding?q=${encodeURIComponent(trimmed)}&count=10`,
        { signal: controller.signal }
      );

      if (thisRequestId !== requestIdRef.current) return;

      if (res.ok) {
        const data: GeocodingResponse = await res.json();
        const items = data.results || [];
        setResults(items);
        setProvider(data.provider || 'open-data');
        setHasSearched(true);
        setIsOpen(true);
        setActiveIndex(-1);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || 'Failed to search locations');
        setIsOpen(true);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (thisRequestId === requestIdRef.current) {
        setError('Connection interrupted. Please try again.');
        setIsOpen(true);
      }
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => handleSearch(value), 300);
    },
    [handleSearch]
  );

  // Clear query
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setError(null);
    setHasSearched(false);
    inputRef.current?.focus();
    onClear?.();
  }, [onClear]);

  // Handle selection with full display name
  const handleSelect = useCallback(
    (result: GeocodingResult) => {
      const displayName =
        result.displayName ||
        [
          result.name,
          result.admin1 && result.admin1.toLowerCase() !== result.name.toLowerCase()
            ? result.admin1
            : null,
          result.country,
        ]
          .filter(Boolean)
          .join(', ');

      setQuery(result.name);
      setIsOpen(false);
      setResults([]);
      onSelectLocation(result);
    },
    [onSelectLocation]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        handleSelect(results[activeIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [isOpen, activeIndex, results, handleSelect]
  );

  // Close dropdown on outside click or touch
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Cleanup debounce and abort controller
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if ((results.length > 0 || (hasSearched && query.trim().length >= 2)) && !isOpen) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-2 sm:px-4 py-1.5 sm:py-2 pl-7 sm:pl-10 pr-6 sm:pr-9 rounded-xl sm:rounded-2xl 
                     bg-white/[0.07] border border-white/10 
                     text-xs sm:text-sm text-white placeholder-white/40 
                     focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.1]
                     transition-all duration-200"
          aria-label="Search locations worldwide"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
          {isLoading ? (
            <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 sm:right-2.5 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 text-white/40 hover:text-white transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          className="fixed left-3 right-3 top-[54px] sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:w-full z-50 sm:mt-2
                     max-h-[68vh] sm:max-h-[460px] overflow-y-auto overscroll-contain
                     rounded-2xl bg-[#080816]/95 backdrop-blur-2xl 
                     border border-white/10 shadow-2xl shadow-black/80 divide-y divide-white/5"
          role="listbox"
        >
          {/* Error State */}
          {error && (
            <div className="px-4 py-4 text-center">
              <div className="text-amber-400 text-xs mb-1">⚠️ {error}</div>
              <button
                type="button"
                onClick={() => handleSearch(query)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono mt-1"
              >
                Retry Search
              </button>
            </div>
          )}

          {/* Empty State */}
          {!error && !isLoading && hasSearched && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-6 text-center text-white/50">
              <span className="text-2xl mb-2 block">🔍</span>
              <p className="text-xs text-white/70 font-medium">No locations found matching &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-white/40 mt-1 max-w-[260px] mx-auto">
                Try searching for a nearby city, street name, airport, or landmark.
              </p>
            </div>
          )}

          {/* Result Items */}
          {results.map((result, idx) => {
            const featureType: GeographicFeatureType = result.type || 'city';
            const feature = FEATURE_CONFIG[featureType] || FEATURE_CONFIG.city;
            const subtitle = result.displayName && result.displayName !== result.name
              ? result.displayName
              : [result.admin1, result.country].filter(Boolean).join(', ');

            return (
              <button
                key={`${result.id}-${idx}`}
                type="button"
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full text-left px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-start gap-2.5 sm:gap-3 transition-colors
                  ${idx === activeIndex ? 'bg-cyan-500/15' : 'hover:bg-white/[0.04]'}`}
                role="option"
                aria-selected={idx === activeIndex}
              >
                {/* Feature Icon */}
                <span className="mt-0.5 text-base shrink-0 select-none" title={feature.label}>
                  {feature.icon}
                </span>

                <div className="min-w-0 flex-1">
                  {/* Primary Name & Category Tag */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white leading-snug break-words">
                      {result.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full border uppercase tracking-wider font-mono font-medium ${feature.badgeClass}`}
                    >
                      {feature.label}
                    </span>
                  </div>

                  {/* Subtitle / Full Address Line */}
                  {subtitle && (
                    <div className="text-xs text-white/60 font-normal mt-0.5 truncate leading-tight">
                      {subtitle}
                    </div>
                  )}

                  {/* Geographic Coordinates & Details */}
                  <div className="text-xs text-white/40 mt-1 flex items-center gap-2 flex-wrap font-mono text-[10px]">
                    <span className="text-cyan-400/80">
                      {result.latitude.toFixed(3)}°, {result.longitude.toFixed(3)}°
                    </span>
                    {result.population ? (
                      <span className="text-white/35">
                        · Pop. {(result.population / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}K
                      </span>
                    ) : null}
                    {result.country && (
                      <span className="text-white/30 truncate">
                        · {result.country}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Footer Attribution & Results Count */}
          {results.length > 0 && (
            <div className="px-4 py-2 text-[10px] text-white/30 font-mono flex items-center justify-between bg-black/20 select-none">
              <span className="truncate">OpenStreetMap &middot; {provider || 'Photon OSM'}</span>
              <span className="shrink-0">{results.length} results</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
