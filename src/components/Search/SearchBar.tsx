'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent, EventCategory } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import { useSearch } from '@/hooks/useSearch';
import { trackEvent } from '@/services/analytics';

interface SearchBarProps {
  events: WorldEvent[];
  activeCategory?: EventCategory | null;
  onSearch: (query: string) => void;
  onSelectEvent: (event: WorldEvent) => void;
  onSelectCountry?: (country: string | null) => void;
}

const PLACEHOLDER_TEXTS = [
  "Ask MooEarth AI...",
  "Show football in Brazil...",
  "Latest technological breakthroughs...",
  "Weather updates in Mexico...",
  "Business news in London..."
];

export default function SearchBar({ events, activeCategory, onSearch, onSelectEvent, onSelectCountry }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { query, debouncedQuery, setQuery, results, countryResult, clearSearch } = useSearch({ events, activeCategory });

  // Sync debounced query to parent for external effects & track search events
  useEffect(() => {
    onSearch(debouncedQuery);
    if (debouncedQuery.trim()) {
      trackEvent('search', 'query', debouncedQuery, 1, {
        success: results.length > 0 || !!countryResult,
        countrySearched: countryResult || undefined
      });
    }
  }, [debouncedQuery, onSearch, results, countryResult]);

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
      onSelectEvent(event);
    },
    [onSelectEvent, clearSearch]
  );

  const handleSelectCountry = useCallback(
    (country: string) => {
      clearSearch();
      setIsFocused(false);
      if (onSelectCountry) onSelectCountry(country);
    },
    [onSelectCountry, clearSearch]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
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
        {/* Animated background glow on focus */}
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full h-full bg-transparent text-sm font-medium text-white outline-none z-10"
          />
          
          {/* Animated Placeholder */}
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
                Ask MooEarth AI...
              </span>
            )}
          </AnimatePresence>
        </div>

        {query && (
          <button
            onClick={() => {
              clearSearch();
              onSearch('');
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
        {isFocused && (results.length > 0 || countryResult || !query) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-[calc(100%+12px)] w-full rounded-2xl overflow-hidden glass z-[100]"
            style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(0,229,255,0.1)' }}
          >
            {query ? (
              <>
                <div className="p-2 border-b border-white/5 bg-black/40">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2">AI Suggestions</span>
                </div>
                <div className="p-2 space-y-1">
                  {countryResult && (
                    <button
                      onClick={() => handleSelectCountry(countryResult)}
                      className="w-full flex items-center gap-4 px-3 py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-400/60 transition-all text-left cursor-pointer group mb-2"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-cyan-400/20 border border-cyan-400/30 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                        <span className="text-sm">🌍</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white group-hover:text-cyan-100 truncate transition-colors">
                          View Reactions in {countryResult}
                        </p>
                        <p className="text-[11px] font-medium text-cyan-400 mt-0.5 tracking-wide">
                          Live Emotion & Sentiment
                        </p>
                      </div>
                    </button>
                  )}
                  {results.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleSelect(event)}
                      className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                        <span className="text-sm">{(CATEGORY_MAP[event.category] || CATEGORY_MAP.breaking).emoji}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white/90 group-hover:text-white truncate transition-colors">{event.title}</p>
                        <p className="text-[11px] font-medium text-cyan-400/60 mt-0.5 tracking-wide">
                          {event.city}, {event.country}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : activeCategory === 'worldcup' ? (
              <>
                <div className="p-2 border-b border-white/5 bg-black/40">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2">🔥 Popular Teams</span>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { name: 'Mexico', emoji: '🇲🇽', desc: 'Group A • Host Nation' },
                    { name: 'Argentina', emoji: '🇦🇷', desc: 'Group I • Defending Champions' },
                    { name: 'USA', emoji: '🇺🇸', desc: 'Group D • Host Nation' },
                    { name: 'Canada', emoji: '🇨🇦', desc: 'Group B • Host Nation' },
                    { name: 'Brazil', emoji: '🇧🇷', desc: 'Group C • 5-Time Champions' },
                    { name: 'Morocco', emoji: '🇲🇦', desc: 'Group C • 2022 Semi-finalists' }
                  ].map((team) => (
                    <button
                      key={team.name}
                      onClick={() => {
                        setQuery(team.name);
                        trackEvent('search', 'suggested_team_click', team.name);
                      }}
                      className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                        <span className="text-base">{team.emoji}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {team.name}
                        </p>
                        <p className="text-[10px] font-medium text-white/40 mt-0.5">
                          {team.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="p-2 border-b border-white/5 bg-black/40">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest px-2">🔥 Trending Destinations</span>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { name: 'Brazil', emoji: '🇧🇷', matches: '2 Matches Active', views: '12k fans' },
                    { name: 'Japan', emoji: '🇯🇵', matches: '1 Match Active', views: '8.5k fans' },
                    { name: 'India', emoji: '🇮🇳', matches: '0 Matches Active', views: '23.4k fans' },
                    { name: 'Morocco', emoji: '🇲🇦', matches: '1 Match Active', views: '9.1k fans' }
                  ].map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handleSelectCountry(c.name)}
                      className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                        <span className="text-base">{c.emoji}</span>
                      </div>
                      <div className="min-w-0 flex-1 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {c.name}
                          </p>
                          <p className="text-[10px] font-medium text-white/40 mt-0.5">
                            {c.matches}
                          </p>
                        </div>
                        <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20 font-bold shrink-0">
                          📈 {c.views}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
