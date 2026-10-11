// ============================================================
// MooEarth Live — Weather Search Component
// ============================================================
// Global location search with debounce, autocomplete dropdown,
// and smooth results. Mobile-first responsive design.

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GeocodingResult, GeocodingResponse } from '@/services/weather/types';

interface WeatherSearchProps {
  onSelectLocation: (result: GeocodingResult) => void;
  placeholder?: string;
  initialQuery?: string;
}

export default function WeatherSearch({
  onSelectLocation,
  placeholder = 'Search any city, country, or place...',
  initialQuery,
}: WeatherSearchProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // Sync external initialQuery changes (e.g. globe click or URL change)
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Debounced search with race-condition protection
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Abort any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const thisRequestId = ++requestIdRef.current;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/weather/geocoding?q=${encodeURIComponent(searchQuery)}`,
        { signal: controller.signal }
      );
      // Discard if a newer request was made while this one was in flight
      if (thisRequestId !== requestIdRef.current) return;
      if (res.ok) {
        const data: GeocodingResponse = await res.json();
        setResults(data.results || []);
        setIsOpen((data.results || []).length > 0);
        setActiveIndex(-1);
      }
    } catch (err: unknown) {
      // Silently ignore abort errors and stale responses
      if (err instanceof DOMException && err.name === 'AbortError') return;
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
    inputRef.current?.focus();
  }, []);

  // Handle selection with full display name
  const handleSelect = useCallback(
    (result: GeocodingResult) => {
      const parts = [result.name];
      if (result.admin1 && result.admin1.toLowerCase() !== result.name.toLowerCase()) {
        parts.push(result.admin1);
      }
      if (result.country) {
        parts.push(result.country);
      }
      const fullDisplayName = parts.join(', ');

      setQuery(fullDisplayName);
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
      } else if (e.key === 'Enter' && activeIndex >= 0) {
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
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 pl-9 sm:pl-10 pr-8 sm:pr-9 rounded-xl sm:rounded-2xl 
                     bg-white/[0.07] border border-white/10 
                     text-xs sm:text-sm text-white placeholder-white/40 
                     focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.1]
                     transition-all duration-200"
          aria-label="Search locations"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
          {isLoading ? (
            <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none">
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
            className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown — full mobile width unconstrained */}
      {isOpen && results.length > 0 && (
        <div
          className="fixed left-3 right-3 top-[54px] sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:w-full z-50 sm:mt-2
                     max-h-[65vh] sm:max-h-[420px] overflow-y-auto overscroll-contain
                     rounded-2xl bg-[#080816]/95 backdrop-blur-2xl 
                     border border-white/10 shadow-2xl shadow-black/80"
          role="listbox"
        >
          {results.map((result, idx) => {
            const hasAdmin = result.admin1 && result.admin1.toLowerCase() !== result.name.toLowerCase();
            return (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full text-left px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-start gap-2.5 sm:gap-3 transition-colors
                  ${idx === activeIndex ? 'bg-cyan-500/15' : 'hover:bg-white/[0.04]'}
                  ${idx > 0 ? 'border-t border-white/5' : ''}`}
                role="option"
                aria-selected={idx === activeIndex}
              >
                <span className="mt-0.5 text-cyan-400 text-sm shrink-0">📍</span>
                <div className="min-w-0 flex-1">
                  {/* Full Location Name: City, Region, Country */}
                  <div className="text-sm font-semibold text-white leading-snug break-words">
                    <span>{result.name}</span>
                    {hasAdmin && (
                      <span className="text-white/70 font-normal">, {result.admin1}</span>
                    )}
                    {result.country && (
                      <span className="text-cyan-300/80 font-normal">, {result.country}</span>
                    )}
                  </div>
                  {/* Metadata: Coordinates & Population */}
                  <div className="text-xs text-white/40 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-white/40">
                      {result.latitude.toFixed(2)}°, {result.longitude.toFixed(2)}°
                    </span>
                    {result.population ? (
                      <span className="text-[11px] text-white/35">
                        · Pop. {(result.population / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}K
                      </span>
                    ) : null}
                    {result.timezone && (
                      <span className="text-[10px] text-white/25 hidden xs:inline">
                        · {result.timezone}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          <div className="px-4 py-2 text-[10px] text-white/30 border-t border-white/5 font-mono flex items-center justify-between">
            <span>Geocoding by Open-Meteo.com</span>
            <span>{results.length} results</span>
          </div>
        </div>
      )}
    </div>
  );
}
