'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent, EventCategory } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import { useSearch } from '@/hooks/useSearch';
import { trackEvent } from '@/services/analytics';
import { locations, LocationRecord } from '@/data/locations';

interface SearchBarProps {
  events: WorldEvent[];
  activeCategory?: EventCategory | null;
  onSearch: (query: string) => void;
  onSelectEvent: (event: WorldEvent) => void;
  onSelectCountry?: (country: string | null) => void;
  onSelectLocation?: (location: LocationRecord | null) => void;
}

const PLACEHOLDER_TEXTS = [
  "Search Bhubaneswar, London, Tokyo...",
  "Show California news...",
  "Latest technology in Japan...",
  "Weather updates in Paris...",
  "Business news in London..."
];

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode === '-99') return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🏳️';
  }
};

export default function SearchBar({
  events,
  activeCategory,
  onSearch,
  onSelectEvent,
  onSelectCountry,
  onSelectLocation
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isAmbiguityActive, setIsAmbiguityActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    debouncedQuery,
    setQuery,
    results,
    locationResults,
    countryResult,
    clearSearch
  } = useSearch({ events, activeCategory });

  // Sync debounced query to parent for external effects & track search events
  useEffect(() => {
    onSearch(debouncedQuery);
    if (debouncedQuery.trim()) {
      trackEvent('search', 'query', debouncedQuery, 1, {
        success: results.length > 0 || locationResults.length > 0,
        countrySearched: countryResult || undefined
      });
    }
  }, [debouncedQuery, onSearch, results, countryResult, locationResults]);

  // Animate placeholders
  useEffect(() => {
    if (isFocused || query) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isFocused, query]);

  const handleSelect = useCallback(
    (event: WorldEvent) => {
      clearSearch();
      setIsFocused(false);
      setIsAmbiguityActive(false);
      onSelectEvent(event);
    },
    [onSelectEvent, clearSearch]
  );

  const handleSelectLocation = useCallback(
    (loc: LocationRecord) => {
      clearSearch();
      setIsFocused(false);
      setIsAmbiguityActive(false);

      if (onSelectLocation) {
        onSelectLocation(loc);
      }
      
      // Backward compatibility trigger
      if (onSelectCountry && loc.type === 'country') {
        onSelectCountry(loc.name);
      } else if (onSelectCountry) {
        onSelectCountry(loc.country);
      }
    },
    [onSelectLocation, onSelectCountry, clearSearch]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Check if we have multiple exact or partial location matches to resolve ambiguity
      const queryLower = query.toLowerCase().trim();
      const directMatches = locationResults.filter(l => 
        l.name.toLowerCase() === queryLower || 
        l.aliases?.some(a => a.toLowerCase() === queryLower)
      );

      const candidates = directMatches.length > 0 ? directMatches : locationResults;

      if (candidates.length === 1) {
        handleSelectLocation(candidates[0]);
      } else if (candidates.length > 1) {
        setIsAmbiguityActive(true);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setIsAmbiguityActive(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-lg" id="search-container">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-full
                    glass transition-all duration-300 relative overflow-hidden group
                    ${
                      isFocused || query
                        ? 'border-cyan-500/50 shadow-[0_0_40px_rgba(0,229,255,0.2)] bg-black/40'
                        : 'border-white/10 bg-black/20 hover:bg-black/30 hover:border-white/20'
                    }`}
      >
        <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10 opacity-0 transition-opacity duration-500 ${isFocused ? 'opacity-100' : ''}`} />

        <svg
          className={`shrink-0 relative z-10 transition-colors duration-300 ${isFocused ? 'text-cyan-400' : 'text-white/40'}`}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        
        <div className="flex-1 relative h-6 flex items-center z-10">
          <input
            id="search-input"
            type="text"
            aria-label="Search globe locations, news and events"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsAmbiguityActive(false);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            className="w-full h-full bg-transparent text-sm font-medium text-white outline-none z-10"
          />
          
          <AnimatePresence mode="wait">
            {!query && !isFocused && (
              <motion.span
                key={placeholderIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="absolute text-sm text-white/40 pointer-events-none"
              >
                {PLACEHOLDER_TEXTS[placeholderIdx]}
              </motion.span>
            )}
            {(!query && isFocused) && (
              <span className="absolute text-sm text-white/20 pointer-events-none">
                Search city, state, or country...
              </span>
            )}
          </AnimatePresence>
        </div>

        {query && (
          <button
            onClick={() => {
              clearSearch();
              onSearch('');
              setIsAmbiguityActive(false);
            }}
            className="relative z-10 text-white/30 hover:text-white transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isFocused && (locationResults.length > 0 || results.length > 0 || !query) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-[calc(100%+12px)] w-full rounded-2xl overflow-hidden glass z-[100]"
            style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(0,229,255,0.1)' }}
          >
            {/* Ambiguity Location Picker Alert */}
            {isAmbiguityActive && locationResults.length > 1 && (
              <div className="p-3 bg-cyan-950/40 border-b border-white/5">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-1">
                  🔍 Location Ambiguity Detected
                </span>
                <span className="text-[11px] text-white/60">
                  Multiple matches found for &quot;{query}&quot;. Please select the correct location:
                </span>
              </div>
            )}

            {query ? (
              <>
                {/* 1. Geographic Locations */}
                {locationResults.length > 0 && (
                  <>
                    <div className="p-2 border-b border-white/5 bg-black/40">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2">
                        {isAmbiguityActive ? 'Select Matching Location' : 'Locations'}
                      </span>
                    </div>
                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
                      {locationResults.map((loc) => {
                        const icon = loc.type === 'city' ? '📍' : loc.type === 'state' ? '🏛️' : '🌍';
                        const flag = getFlagEmoji(loc.countryCode);
                        const labelType = loc.type === 'city' ? 'City' : loc.type === 'state' ? 'State' : 'Country';
                        const subtitle = loc.type === 'city' 
                          ? `${loc.state ? loc.state + ', ' : ''}${loc.country}`
                          : loc.type === 'state' ? loc.country : '';

                        return (
                          <button
                            key={loc.id}
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                              <span className="text-sm">{icon}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                                {loc.name} {flag}
                              </p>
                              <p className="text-[10px] font-semibold text-white/40 mt-0.5">
                                {labelType} {subtitle && `• ${subtitle}`} • Pop: {(loc.population / 1000000).toFixed(2)}M
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* 2. Events & Headlines (Hidden in ambiguity mode to prevent clutter) */}
                {!isAmbiguityActive && results.length > 0 && (
                  <>
                    <div className="p-2 border-b border-white/5 bg-black/40">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest px-2">Related Articles</span>
                    </div>
                    <div className="p-2 space-y-1">
                      {results.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleSelect(event)}
                          className="w-full flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                            <span className="text-sm">{(CATEGORY_MAP[event.category] || CATEGORY_MAP.breaking).emoji}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white/90 group-hover:text-white truncate transition-colors">{event.title}</p>
                            <p className="text-[9px] font-semibold text-cyan-400/60 mt-0.5 tracking-wide">
                              {event.city ? `${event.city}, ` : ''}{event.country}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              // Default view: Trending destinations
              <>
                <div className="p-2 border-b border-white/5 bg-black/40">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest px-2">🔥 Trending Destinations</span>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { id: 'city-bhubaneswar-in', name: 'Bhubaneswar', country: 'India', code: 'IN', type: 'city', icon: '📍' },
                    { id: 'city-tokyo-jp', name: 'Tokyo', country: 'Japan', code: 'JP', type: 'city', icon: '📍' },
                    { id: 'state-california-us', name: 'California', country: 'United States', code: 'US', type: 'state', icon: '🏛️' },
                    { id: 'city-saopaulo-br', name: 'São Paulo', country: 'Brazil', code: 'BR', type: 'city', icon: '📍' }
                  ].map((dest) => {
                    const flag = getFlagEmoji(dest.code);
                    const dbLoc = locations.find(l => l.id === dest.id);
                    return (
                      <button
                        key={dest.id}
                        onClick={() => dbLoc && handleSelectLocation(dbLoc)}
                        className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                          <span className="text-sm">{dest.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {dest.name} {flag}
                            </p>
                            <p className="text-[10px] font-semibold text-white/40 mt-0.5">
                              {dest.type.toUpperCase()} • {dest.country}
                            </p>
                          </div>
                          <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-bold shrink-0">
                            EXPLORE
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
