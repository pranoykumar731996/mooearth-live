// ============================================================
// MooEarth Live — City Explorer Panel
// ============================================================
// Rich interactive drawer/card for city-level planetary exploration:
// - Live local digital clock computed via city timezone
// - Demographics, population, geographic coordinates
// - 1-Click "Turn on Weather" integration
// - Local city news dispatches via /api/events?locationId=...
// - Direct camera fly-to and country portal links

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LocationRecord } from '@/data/locations';
import { WorldEvent } from '@/types';
import { CountryFlag } from '@/components/UI/CountryFlag';
import { findCountryMeta } from '@/data/questions/countryMetadata';

interface CityExplorerPanelProps {
  location: LocationRecord;
  events?: WorldEvent[];
  isLoadingEvents?: boolean;
  onClose: () => void;
  onSelectCountry?: (country: string | null) => void;
  onSelectEvent?: (event: WorldEvent) => void;
  onOpenWeather?: (location: LocationRecord) => void;
  onFocusCity?: (location: LocationRecord) => void;
  isMobile?: boolean;
}

export default function CityExplorerPanel({
  location,
  events = [],
  isLoadingEvents = false,
  onClose,
  onSelectCountry,
  onSelectEvent,
  onOpenWeather,
  onFocusCity,
  isMobile = false,
}: CityExplorerPanelProps) {
  // Live ticking local clock
  const [localTime, setLocalTime] = useState<string>('');
  const [localDate, setLocalDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: location.timezone || 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: location.timezone || 'UTC',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        setLocalTime(timeFormatter.format(now));
        setLocalDate(dateFormatter.format(now));
      } catch {
        // Fallback to UTC if timezone invalid
        const now = new Date();
        setLocalTime(now.toTimeString().split(' ')[0]);
        setLocalDate(now.toDateString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [location.timezone]);

  // Country metadata & flag
  const countryMeta = useMemo(() => {
    return findCountryMeta(location.country);
  }, [location.country]);

  // Format population nicely
  const formattedPopulation = useMemo(() => {
    if (!location.population || location.population <= 0) return 'Undisclosed';
    if (location.population >= 1_000_000) {
      return `${(location.population / 1_000_000).toFixed(1)} Million`;
    }
    if (location.population >= 1_000) {
      return `${(location.population / 1_000).toFixed(0)}K`;
    }
    return location.population.toLocaleString();
  }, [location.population]);

  return (
    <motion.aside
      key={`city-panel-${location.id}`}
      initial={{ opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 40 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 40 : 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`glass-panel border border-cyan-500/20 shadow-[0_12px_45px_rgba(0,0,0,0.7)] flex flex-col z-40 overflow-hidden ${
        isMobile
          ? 'fixed bottom-4 left-4 right-4 max-h-[82vh] rounded-3xl'
          : 'fixed right-6 top-24 bottom-24 w-[380px] rounded-3xl'
      }`}
      style={{
        background: 'linear-gradient(180deg, rgba(10, 16, 32, 0.96) 0%, rgba(4, 7, 16, 0.98) 100%)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Radial neon glow header */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Close */}
      <div className="p-5 border-b border-white/[0.08] relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-mono font-bold tracking-wider text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              CITY EXPLORER
            </span>
            <span className="text-[10px] text-white/40 font-mono">
              {location.adminLevel === 1 ? 'PROVINCE' : 'METROPOLIS'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate flex items-center gap-2">
            <span>{location.name}</span>
            <CountryFlag flag={countryMeta?.flag} className="w-5 h-3.5 object-cover rounded shadow shrink-0" />
          </h2>

          <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium truncate mt-0.5">
            {location.state && <span>{location.state}, </span>}
            <button
              onClick={() => onSelectCountry?.(location.country)}
              className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
            >
              {location.country}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close City Explorer"
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin relative z-10">
        {/* Live Local Clock & Timezone Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-purple-950/30 border border-cyan-500/25 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[9px] font-mono uppercase tracking-widest text-cyan-400/80 font-bold">
              LOCAL TIME
            </div>
            <div className="text-lg sm:text-xl font-black font-mono tracking-tight text-white mt-0.5">
              {localTime || '--:--:--'}
            </div>
            <div className="text-[10px] text-white/40 font-mono truncate">
              {localDate} • {location.timezone || 'UTC'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl shrink-0">
            ⏱️
          </div>
        </div>

        {/* Geographic & Demographics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">POPULATION</div>
            <div className="text-sm font-black text-white mt-0.5 truncate">{formattedPopulation}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">COORDINATES</div>
            <div className="text-xs font-bold text-white/90 mt-1 truncate">
              {location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex gap-2">
          {onOpenWeather && (
            <button
              onClick={() => onOpenWeather(location)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 hover:text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <span>🌦️</span>
              <span>LIVE WEATHER</span>
            </button>
          )}

          {onFocusCity && (
            <button
              onClick={() => onFocusCity(location)}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Center 3D Globe camera on city"
            >
              <span>🎯</span>
              <span>CENTER</span>
            </button>
          )}

          <Link
            href={`/weather?lat=${location.lat.toFixed(4)}&lng=${location.lng.toFixed(4)}&city=${encodeURIComponent(location.name)}&country=${encodeURIComponent(location.country)}`}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
            title="Open dedicated Weather Radar"
          >
            <span>RADAR</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>

        {/* Local News Feed */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-white/40 uppercase px-0.5">
            <span>LOCAL DISPATCHES</span>
            <span>{events.length} ACTIVE</span>
          </div>

          {isLoadingEvents ? (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center text-xs text-white/40 animate-pulse">
              Fetching location dispatches...
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {events.slice(0, 5).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent?.(evt)}
                  className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-cyan-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider truncate">
                      {evt.source || 'WIRE'}
                    </span>
                    <span className="text-[9px] text-white/30">•</span>
                    <span className="text-[9px] text-white/40">
                      {evt.publishedAt ? new Date(evt.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white/90 group-hover:text-cyan-200 line-clamp-2 leading-snug transition-colors">
                    {evt.title}
                  </h4>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center text-xs text-white/40">
              No local wire dispatches currently recorded for {location.name}.
            </div>
          )}
        </div>
      </div>

      {/* Footer link to parent Country */}
      <div className="p-3.5 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-white/60">
        <span className="text-[10px] text-white/40">EXPLORE REGION:</span>
        <button
          onClick={() => onSelectCountry?.(location.country)}
          className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{location.country} Country Hub</span>
          <span>→</span>
        </button>
      </div>
    </motion.aside>
  );
}
