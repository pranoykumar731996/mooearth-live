// ============================================================
// MooEarth Live — Weather Search Component
// ============================================================
// Global location search with debounce, autocomplete dropdown,
// and smooth results. Mobile-first design.

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GeocodingResult, GeocodingResponse } from '@/services/weather/types';

interface WeatherSearchProps {
  onSelectLocation: (result: GeocodingResult) => void;
  placeholder?: string;
}

export default function WeatherSearch({
  onSelectLocation,
  placeholder = 'Search any city, country, or place...',
}: WeatherSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/weather/geocoding?q=${encodeURIComponent(searchQuery)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data: GeocodingResponse = await res.json();
        setResults(data.results);
        setIsOpen(data.results.length > 0);
        setActiveIndex(-1);
      }
    } catch {
      // Silently fail on search errors
    } finally {
      setIsLoading(false);
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

  // Handle selection
  const handleSelect = useCallback(
    (result: GeocodingResult) => {
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
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(results[activeIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [isOpen, activeIndex, results, handleSelect]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pl-10 rounded-2xl bg-white/[0.06] border border-white/10 
                     text-sm text-white placeholder-white/40 
                     focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.08]
                     transition-all duration-200"
          aria-label="Search locations"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        <span className="absolute left-3.5 top-3 text-white/40">
          {isLoading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          className="absolute z-50 mt-2 w-full rounded-2xl bg-[#0a0a1a]/95 backdrop-blur-xl 
                     border border-white/10 shadow-2xl shadow-black/40 overflow-hidden"
          role="listbox"
        >
          {results.map((result, idx) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors
                ${idx === activeIndex ? 'bg-cyan-500/10' : 'hover:bg-white/[0.04]'}
                ${idx > 0 ? 'border-t border-white/5' : ''}`}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <span className="mt-0.5 text-cyan-400 text-sm shrink-0">📍</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {result.name}
                </div>
                <div className="text-xs text-white/50 truncate mt-0.5">
                  {[result.admin1, result.country].filter(Boolean).join(', ')}
                  {result.population ? ` · Pop. ${(result.population / 1000).toFixed(0)}K` : ''}
                </div>
              </div>
              <div className="ml-auto shrink-0 text-right">
                <div className="text-[10px] font-mono text-white/30 mt-0.5">
                  {result.latitude.toFixed(2)}°, {result.longitude.toFixed(2)}°
                </div>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-[10px] text-white/30 border-t border-white/5 font-mono">
            Geocoding by Open-Meteo.com
          </div>
        </div>
      )}
    </div>
  );
}
