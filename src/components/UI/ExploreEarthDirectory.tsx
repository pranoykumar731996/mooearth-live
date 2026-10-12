// ============================================================
// MooEarth Live — Explore Earth & World Directory Component
// ============================================================
// Unified Planetary Exploration interface for:
// 1. 🌍 Earth: 7 Continents, Planetary Landmasses & Natural Wonders
// 2. 🏳️ Countries: A-Z sovereign directory with fuzzy search
// 3. 🏙️ Cities: Global metropolises and provincial capitals

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CANONICAL_CONTINENTS, ContinentRecord, CONTINENT_CENTROIDS } from '@/data/continents';
import { ICONIC_LANDMARKS, WorldPlace } from '@/data/worldPlaces';
import { locations, LocationRecord } from '@/data/locations';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { findCountryMeta } from '@/data/questions/countryMetadata';
import { CountryFlag } from '@/components/UI/CountryFlag';
import { getLocalizedCountryName, getLocalizedContinentName, SupportedLocale } from '@/lib/i18n';
import { useTranslation } from '@/contexts/LanguageContext';

interface ExploreEarthDirectoryProps {
  selectedCountry: string | null;
  onSelectCountry: (country: string | null) => void;
  selectedLocation: LocationRecord | null;
  onSelectLocation: (location: LocationRecord | null) => void;
  selectedContinent?: ContinentRecord | null;
  onSelectContinent?: (continent: ContinentRecord | null) => void;
  onFlyToCoordinates?: (coords: { lat: number; lng: number; altitude: number }) => void;
  playHoverBlip: () => void;
  locale?: SupportedLocale;
}

export default function ExploreEarthDirectory({
  selectedCountry,
  onSelectCountry,
  selectedLocation,
  onSelectLocation,
  selectedContinent,
  onSelectContinent,
  onFlyToCoordinates,
  playHoverBlip,
  locale = 'en',
}: ExploreEarthDirectoryProps) {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<'earth' | 'countries' | 'cities'>('countries');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Grouped countries for A-Z country browsing
  const countryList = useMemo(() => Object.keys(COUNTRY_COORDINATES).sort(), []);
  
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countryList;
    const q = searchQuery.toLowerCase();
    return countryList.filter(c => c.toLowerCase().includes(q));
  }, [countryList, searchQuery]);

  const groupedCountries = useMemo(() => {
    const groups: Record<string, string[]> = {};
    filteredCountries.forEach(c => {
      const firstLetter = c[0].toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(c);
    });
    return groups;
  }, [filteredCountries]);

  // 2. City list from locations registry
  const cityList = useMemo(() => {
    return locations.filter(loc => loc.type === 'city');
  }, []);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cityList;
    const q = searchQuery.toLowerCase();
    return cityList.filter(
      loc =>
        loc.name.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q) ||
        (loc.state && loc.state.toLowerCase().includes(q)) ||
        loc.aliases?.some(a => a.toLowerCase().includes(q))
    );
  }, [cityList, searchQuery]);

  // 3. Wonders / Landmarks filtered
  const filteredWonders = useMemo(() => {
    if (!searchQuery.trim()) return ICONIC_LANDMARKS;
    const q = searchQuery.toLowerCase();
    return ICONIC_LANDMARKS.filter(
      w =>
        w.name.toLowerCase().includes(q) ||
        w.country.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle clicking a Continent
  const handleContinentClick = (cont: ContinentRecord) => {
    playHoverBlip();
    if (onSelectContinent) {
      onSelectContinent(cont);
    }
    const centroid = CONTINENT_CENTROIDS[cont.slug] || { lat: 20, lng: 0, altitude: 2.1 };
    if (onFlyToCoordinates) {
      onFlyToCoordinates(centroid);
    }
  };

  // Handle clicking an Iconic Landmark / Wonder
  const handleWonderClick = (wonder: WorldPlace) => {
    playHoverBlip();
    const locRecord: LocationRecord = {
      id: `wonder-${wonder.id}`,
      name: wonder.name,
      type: 'city', // Triggers altitude zoom 1.15 and radar pin
      country: wonder.country,
      countryCode: wonder.countryCode,
      lat: wonder.coordinates.lat,
      lng: wonder.coordinates.lng,
      population: 0,
      timezone: 'UTC',
      adminLevel: 2,
      aliases: [wonder.description],
    };
    onSelectLocation(locRecord);
    if (onFlyToCoordinates) {
      onFlyToCoordinates({ lat: wonder.coordinates.lat, lng: wonder.coordinates.lng, altitude: 1.15 });
    }
  };

  return (
    <div className="space-y-3">
      {/* 3-Way Sub-Navigation Switcher */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
        <button
          onClick={() => {
            setSubTab('earth');
            setSearchQuery('');
            playHoverBlip();
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
            subTab === 'earth'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <span>🌍</span>
          <span>EARTH</span>
        </button>

        <button
          onClick={() => {
            setSubTab('countries');
            setSearchQuery('');
            playHoverBlip();
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
            subTab === 'countries'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <span>🏳️</span>
          <span>COUNTRIES</span>
        </button>

        <button
          onClick={() => {
            setSubTab('cities');
            setSearchQuery('');
            playHoverBlip();
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
            subTab === 'cities'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <span>🏙️</span>
          <span>CITIES</span>
        </button>
      </div>

      {/* Global Search Input */}
      <input
        type="text"
        placeholder={
          subTab === 'earth'
            ? 'Search continents & wonders...'
            : subTab === 'countries'
            ? 'Search countries...'
            : 'Search global cities...'
        }
        aria-label="Search earth places"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
      />

      {/* ── 1. EXPLORE EARTH TAB ────────────────────────────────────────── */}
      {subTab === 'earth' && (
        <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1 scrollbar-thin">
          {/* Continents Section */}
          <div className="space-y-2">
            <div className="text-[9px] font-black text-cyan-400/60 uppercase tracking-widest px-1">
              7 CONTINENTAL LANDMASSES ({CANONICAL_CONTINENTS.length})
            </div>

            <div className="space-y-1.5">
              {CANONICAL_CONTINENTS.map((cont) => (
                <div
                  key={cont.slug}
                  onClick={() => handleContinentClick(cont)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    selectedContinent?.slug === cont.slug
                      ? 'border-cyan-500/50 bg-cyan-500/15 shadow-sm'
                      : 'bg-white/[0.02] hover:bg-white/5 border-white/[0.04] hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                      {cont.emoji}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {cont.name}
                      </div>
                      <div className="text-[9px] text-white/40 truncate">
                        {cont.countriesCount} Nations • {cont.population}
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-bold text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 shrink-0">
                    FOCUS ↗
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Planetary Wonders Section */}
          <div className="space-y-2 pt-1 border-t border-white/5">
            <div className="text-[9px] font-black text-cyan-400/60 uppercase tracking-widest px-1">
              NATURAL WONDERS & LANDMARKS ({filteredWonders.length})
            </div>

            <div className="space-y-1.5">
              {filteredWonders.slice(0, 15).map((wonder) => (
                <div
                  key={wonder.id}
                  onClick={() => handleWonderClick(wonder)}
                  className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/[0.04] hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{wonder.flag}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {wonder.name}
                      </div>
                      <div className="text-[9px] text-white/40 truncate">
                        {wonder.country} • {wonder.region}
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-bold text-white/40 group-hover:text-cyan-400 transition-colors shrink-0">
                    FLY TO ↗
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. EXPLORE COUNTRIES TAB ────────────────────────────────────── */}
      {subTab === 'countries' && (
        <div className="space-y-3">
          {/* A-Z Jump Bar */}
          <div className="flex gap-1 overflow-x-auto py-1 px-0.5 scrollbar-none border-b border-white/[0.04]">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
              const hasCountries = Object.keys(groupedCountries).includes(letter);
              return (
                <button
                  key={letter}
                  disabled={!hasCountries}
                  onClick={() => {
                    const elem = document.getElementById(`explore-country-letter-${letter}`);
                    if (elem) {
                      elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                    playHoverBlip();
                  }}
                  className={`text-[9px] font-black w-4.5 h-4.5 rounded shrink-0 flex items-center justify-center transition-all ${
                    hasCountries
                      ? 'text-cyan-400 hover:bg-cyan-500/20 cursor-pointer'
                      : 'text-white/10 cursor-not-allowed'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1 scrollbar-thin">
            {Object.keys(groupedCountries).sort().map((letter) => (
              <div key={letter} id={`explore-country-letter-${letter}`} className="space-y-1.5 scroll-mt-2">
                <div className="text-[9px] font-black text-cyan-400/50 uppercase tracking-widest px-1 py-0.5 border-b border-white/5">
                  {letter} ({groupedCountries[letter].length})
                </div>
                {groupedCountries[letter].map((c) => {
                  const meta = findCountryMeta(c);
                  return (
                    <div
                      key={c}
                      onClick={() => {
                        onSelectCountry(c);
                        onSelectLocation(null);
                        if (onSelectContinent) onSelectContinent(null);
                        const coords = COUNTRY_COORDINATES[c.toLowerCase()] || COUNTRY_COORDINATES[c];
                        if (coords && onFlyToCoordinates) {
                          onFlyToCoordinates({ lat: coords.lat, lng: coords.lng, altitude: 1.6 });
                        }
                        playHoverBlip();
                      }}
                      className={`p-2 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/[0.03] hover:border-white/10 cursor-pointer flex items-center justify-between transition-all ${
                        selectedCountry === c ? 'border-cyan-500/40 bg-cyan-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CountryFlag flag={meta?.flag} className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white truncate">
                            {getLocalizedCountryName(c, locale)}
                          </div>
                          <div className="text-[9px] text-white/40 truncate">
                            {meta?.capital} • {getLocalizedContinentName(meta?.continent || '', locale)}
                          </div>
                        </div>
                      </div>
                      <span className="text-[8px] text-white/30 font-bold tracking-tight shrink-0">
                        {t('explorePanel.focus', 'FOCUS ↗')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {Object.keys(groupedCountries).length === 0 && (
              <div className="text-center py-6 text-[10px] text-white/30">
                No countries match &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. EXPLORE CITIES TAB ───────────────────────────────────────── */}
      {subTab === 'cities' && (
        <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1 scrollbar-thin">
          <div className="text-[9px] font-black text-cyan-400/60 uppercase tracking-widest px-1">
            GLOBAL METROPOLISES & CAPITALS ({filteredCities.length})
          </div>

          <div className="space-y-1.5">
            {filteredCities.map((city) => {
              const meta = findCountryMeta(city.country);
              const isSelected = selectedLocation?.id === city.id;
              return (
                <div
                  key={city.id}
                  onClick={() => {
                    onSelectLocation(city);
                    onSelectCountry(city.country);
                    if (onSelectContinent) onSelectContinent(null);
                    if (onFlyToCoordinates) {
                      onFlyToCoordinates({ lat: city.lat, lng: city.lng, altitude: 1.15 });
                    }
                    playHoverBlip();
                  }}
                  className={`p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/5 border cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-cyan-500/50 bg-cyan-500/15 shadow-sm'
                      : 'border-white/[0.03] hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CountryFlag flag={meta?.flag} className="w-5 h-3.5 object-cover rounded shadow-sm shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{city.name}</span>
                        {city.adminLevel === 1 && (
                          <span className="text-[8px] font-mono px-1 rounded bg-white/10 text-white/50">PROV</span>
                        )}
                      </div>
                      <div className="text-[9px] text-white/40 truncate">
                        {city.state ? `${city.state}, ` : ''}{city.country}
                        {city.population > 0 && ` • ${(city.population / 1_000_000).toFixed(1)}M`}
                      </div>
                    </div>
                  </div>

                  <span className="text-[8px] font-mono font-bold text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 shrink-0">
                    EXPLORE ↗
                  </span>
                </div>
              );
            })}

            {filteredCities.length === 0 && (
              <div className="text-center py-6 text-[10px] text-white/30">
                No cities match &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
