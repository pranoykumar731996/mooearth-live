'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { COUNTRY_METADATA } from '@/data/questions/countryMetadata';

interface InteractiveWorldMapAtlasProps {
  initialRegion?: string;
  className?: string;
}

export default function InteractiveWorldMapAtlas({
  initialRegion = 'All',
  className = '',
}: InteractiveWorldMapAtlasProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  const regions = ['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

  // All countries in metadata
  const allCountries = useMemo(() => {
    return Object.values(COUNTRY_METADATA);
  }, []);

  // Filtered country list based on region and search query
  const filteredCountries = useMemo(() => {
    return allCountries.filter(country => {
      const matchesRegion =
        selectedRegion === 'All' ||
        (selectedRegion === 'Americas'
          ? country.continent.includes('America')
          : country.continent.toLowerCase().includes(selectedRegion.toLowerCase()));

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        country.name.toLowerCase().includes(query) ||
        country.capital.toLowerCase().includes(query) ||
        country.continent.toLowerCase().includes(query);

      return matchesRegion && matchesSearch;
    });
  }, [allCountries, selectedRegion, searchQuery]);

  const activeCountryData = useMemo(() => {
    if (!activeCountry) return null;
    return COUNTRY_METADATA[activeCountry] || null;
  }, [activeCountry]);

  return (
    <div data-testid="interactive-world-map-atlas" className={`space-y-6 ${className}`}>
      {/* Search & Region Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
        {/* Region Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => {
                setSelectedRegion(region);
                setActiveCountry(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedRegion === region
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[240px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search country or capital..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Selected Country Active Inspector Card */}
      {activeCountryData && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950/60 to-cyan-950/40 border border-cyan-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fadeIn">
          <div className="flex items-start gap-4">
            <span className="text-4xl p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
              {activeCountryData.flag || '🌐'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white">{activeCountryData.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  {activeCountryData.continent}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1 max-w-xl">
                {activeCountryData.funFact || 'Discover breaking news, weather, and real-time insights for this nation.'}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/50">
                <span>🏛️ Capital: <strong className="text-white/80">{activeCountryData.capital}</strong></span>
                <span>👥 Population: <strong className="text-white/80">{activeCountryData.population}</strong></span>
                {activeCountryData.currency && (
                  <span>💰 Currency: <strong className="text-white/80">{activeCountryData.currency}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/country/${encodeURIComponent(activeCountryData.name.toLowerCase())}`}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
            >
              Open Full Country Hub &rarr;
            </Link>
            <button
              onClick={() => setActiveCountry(null)}
              className="px-3 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-white/40 px-1 font-mono">
        <span>SHOWING {filteredCountries.length} COUNTRIES ({selectedRegion.toUpperCase()})</span>
        <span>CLICK TO INSPECT DETAILS</span>
      </div>

      {/* Interactive Country Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredCountries.map(country => {
          const isSelected = activeCountry === country.name;
          return (
            <div
              key={country.name}
              onClick={() => setActiveCountry(country.name)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{country.flag || '🌍'}</span>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                  {country.continent}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {country.name}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-white/50 mt-1">
                  <span>Cap: {country.capital}</span>
                  <span>Pop: {country.population}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-cyan-400/80 hover:text-cyan-300 font-medium">Quick Inspect</span>
                <Link
                  href={`/country/${encodeURIComponent(country.name.toLowerCase())}`}
                  onClick={e => e.stopPropagation()}
                  className="text-white/40 hover:text-white transition-colors"
                  title={`Go to ${country.name} hub`}
                >
                  Hub &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
