// ============================================================
// EarthPulse AI — Search Bar Component
// ============================================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

interface SearchBarProps {
  events: WorldEvent[];
  onSearch: (query: string) => void;
  onSelectEvent: (event: WorldEvent) => void;
}

export default function SearchBar({ events, onSearch, onSelectEvent }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<WorldEvent[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(value);
        const q = value.trim().toLowerCase();
        if (q.length > 0) {
          setResults(
            events.filter(
              (e) =>
                e.title.toLowerCase().includes(q) ||
                e.city.toLowerCase().includes(q) ||
                e.country.toLowerCase().includes(q) ||
                e.category.toLowerCase().includes(q)
            ).slice(0, 6)
          );
        } else {
          setResults([]);
        }
      }, SEARCH_DEBOUNCE_MS);
    },
    [events, onSearch]
  );

  const handleSelect = useCallback(
    (event: WorldEvent) => {
      setQuery(event.city);
      setResults([]);
      setIsFocused(false);
      onSelectEvent(event);
    },
    [onSelectEvent]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md" id="search-container">
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl
                    backdrop-blur-xl border transition-all duration-300
                    ${
                      isFocused
                        ? 'border-cyan-500/40 shadow-[0_0_30px_rgba(0,229,255,0.1)] bg-white/[0.07]'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06]'
                    }`}
      >
        <svg
          className="text-white/40 shrink-0"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search countries, cities, topics..."
          className="flex-1 bg-transparent text-sm text-white placeholder-white/30
                     outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              onSearch('');
              setResults([]);
            }}
            className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isFocused && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full rounded-xl overflow-hidden
                       backdrop-blur-xl border border-white/10 z-[100]"
            style={{ background: 'rgba(10,10,20,0.95)' }}
          >
            {results.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelect(event)}
                className="w-full flex items-center gap-3 px-4 py-3
                           hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_MAP[event.category].color }}
                />
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{event.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {event.city}, {event.country}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
