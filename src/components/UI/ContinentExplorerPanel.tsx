// ============================================================
// MooEarth Live — Continent Explorer Panel
// ============================================================
// Macroscopic planetary HUD for continental landmasses:
// - Continental demographics, land area, sovereign nation counts
// - Geographic superlatives (highest peak, longest river, biomes)
// - Member nations directory with 1-click camera focus
// - Iconic continental wonders & landmarks
// - Direct link to comprehensive /continents/[slug] portal

'use client';

import React, { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ContinentRecord, getCountriesForContinent } from '@/data/continents';
import { ICONIC_LANDMARKS, WorldPlace } from '@/data/worldPlaces';
import { CountryFlag } from '@/components/UI/CountryFlag';
import { findCountryMeta } from '@/data/questions/countryMetadata';

interface ContinentExplorerPanelProps {
  continent: ContinentRecord;
  onClose: () => void;
  onSelectCountry?: (country: string) => void;
  onSelectWonder?: (wonder: WorldPlace) => void;
  onOpenWeather?: (continent: ContinentRecord) => void;
  onFocusContinent?: (continent: ContinentRecord) => void;
  isMobile?: boolean;
}

export default function ContinentExplorerPanel({
  continent,
  onClose,
  onSelectCountry,
  onSelectWonder,
  onOpenWeather,
  onFocusContinent,
  isMobile = false,
}: ContinentExplorerPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  // Member sovereign countries in this continent
  const memberCountries = useMemo(() => {
    return getCountriesForContinent(continent.slug);
  }, [continent.slug]);

  // Wonders located in this continent
  const continentalWonders = useMemo(() => {
    return ICONIC_LANDMARKS.filter(w => {
      const reg = w.region.toLowerCase();
      const slug = continent.slug.toLowerCase();
      if (slug === 'asia' && reg === 'asia') return true;
      if (slug === 'africa' && reg === 'africa') return true;
      if (slug === 'europe' && reg === 'europe') return true;
      if (slug === 'north-america' && (reg === 'americas' || reg === 'north-america')) {
        return w.country === 'United States' || w.country === 'Canada' || w.country === 'Mexico';
      }
      if (slug === 'south-america' && (reg === 'americas' || reg === 'south-america')) {
        return w.country === 'Brazil' || w.country === 'Peru' || w.country === 'Argentina' || w.country === 'Chile';
      }
      if (slug === 'oceania' && (reg === 'oceania' || reg === 'australia')) return true;
      return false;
    });
  }, [continent.slug]);

  return (
    <motion.aside
      key={`continent-panel-${continent.slug}`}
      initial={{ opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 40 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 40 : 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`glass-panel border border-cyan-500/20 shadow-[0_12px_45px_rgba(0,0,0,0.7)] flex flex-col z-40 overflow-hidden ${
        isMobile
          ? 'fixed bottom-4 left-4 right-4 max-h-[84vh] rounded-3xl'
          : 'fixed right-6 top-24 bottom-24 w-[390px] rounded-3xl'
      }`}
      style={{
        background: 'linear-gradient(180deg, rgba(8, 14, 28, 0.96) 0%, rgba(3, 6, 14, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Radial neon glow headers */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="p-5 border-b border-white/[0.08] relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[9px] font-mono font-bold tracking-wider text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              PLANETARY LANDMASS
            </span>
            <span className="text-[10px] text-white/40 font-mono">
              EARTH REGION
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight truncate flex items-center gap-2.5">
            <span className="text-3xl select-none">{continent.emoji}</span>
            <span>{continent.name}</span>
          </h2>

          <p className="text-xs text-white/50 font-medium truncate mt-0.5">
            {continent.countriesCount > 0 ? `${continent.countriesCount} Sovereign Nations` : 'Scientific Research Realm'} • {continent.population}
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close Continent Explorer"
          className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin relative z-10">
        {/* Quick Actions Bar */}
        <div className="flex gap-2">
          {onOpenWeather && (
            <button
              onClick={() => onOpenWeather(continent)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 hover:text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>🌦️</span>
              <span>WEATHER</span>
            </button>
          )}

          {onFocusContinent && (
            <button
              onClick={() => onFocusContinent(continent)}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Center 3D Globe camera on continent"
            >
              <span>🎯</span>
              <span>RE-CENTER</span>
            </button>
          )}

          <Link
            href={`/continents/${continent.slug}`}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="Open comprehensive Continent Hub"
          >
            <span>HUB</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>

        {/* Macroscopic Geography Metrics */}
        <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">TOTAL LAND AREA</div>
            <div className="text-xs font-black text-white mt-1 truncate">{continent.areaKm2}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">HUMAN POPULATION</div>
            <div className="text-xs font-black text-cyan-300 mt-1 truncate">{continent.population}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">HIGHEST PEAK</div>
            <div className="text-xs font-bold text-white/90 mt-1 truncate" title={continent.highestPoint}>
              {continent.highestPoint}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">LONGEST RIVER</div>
            <div className="text-xs font-bold text-white/90 mt-1 truncate" title={continent.longestRiver}>
              {continent.longestRiver}
            </div>
          </div>
        </div>

        {/* Description & Climate Overview */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
          <div className="text-[9px] font-mono uppercase tracking-widest text-cyan-400/80 font-bold">
            GEOGRAPHIC OVERVIEW
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            {continent.description}
          </p>
          <div className="pt-1.5 border-t border-white/[0.04]">
            <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 font-bold mb-1">
              CLIMATE & BIOMES
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">
              {continent.climateOverview}
            </p>
          </div>
        </div>

        {/* Continental Wonders Section */}
        {continentalWonders.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-white/40 uppercase px-0.5">
              <span>NATURAL WONDERS & LANDMARKS</span>
              <span>{continentalWonders.length} SITES</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {continentalWonders.map((wonder) => (
                <div
                  key={wonder.id}
                  onClick={() => onSelectWonder?.(wonder)}
                  className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{wonder.flag}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-200 truncate transition-colors">
                        {wonder.name}
                      </h4>
                      <p className="text-[9px] text-white/40 truncate">
                        {wonder.country} • {wonder.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 shrink-0">
                    FOCUS ↗
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sovereign Nations Roster */}
        {memberCountries.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-white/40 uppercase px-0.5">
              <span>MEMBER NATIONS</span>
              <span>{memberCountries.length} COUNTRIES</span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {memberCountries.map((c) => {
                const meta = findCountryMeta(c.name);
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectCountry?.(c.name)}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.05] hover:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-2 text-left group"
                  >
                    <CountryFlag flag={meta?.flag} className="w-5 h-3.5 object-cover rounded shadow-sm shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white group-hover:text-cyan-200 truncate">
                        {c.name}
                      </div>
                      <div className="text-[8px] text-white/40 truncate">
                        {c.capital}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer link to full Directory */}
      <div className="p-3.5 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-white/60">
        <span className="text-[10px] text-white/40">EXPLORE WORLD ATLAS:</span>
        <Link
          href="/continents"
          className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>7 Continents Directory</span>
          <span>→</span>
        </Link>
      </div>
    </motion.aside>
  );
}
