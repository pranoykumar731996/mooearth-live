// ============================================================
// MooEarth Live — Location Intelligence Panel (Phase 4)
// ============================================================
// Interactive global discovery panel for countries and cities:
// - Canonical identity, flag, capital, region, population
// - Live local digital clock computed via IANA timezone
// - Real Open-Meteo weather telemetry + 5-day daily forecast strip
// - Curated news dispatches with publisher attribution, timestamps,
//   direct article links, and clear AI-generated summary badges
// - 1-Click transitions: "Explore City Map" (MapLibre) and "Return to Earth"
// - Stale response protection, loading skeletons, error & retry handling
// - Mobile-responsive compact sheet (never covers entire globe)

'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationRecord } from '@/data/locations';
import { WorldEvent } from '@/types';
import { CountryFlag } from '@/components/UI/CountryFlag';
import {
  CanonicalLocation,
  resolveCanonicalLocation,
  fetchLiveLocationWeather,
  deduplicateNewsArticles,
} from '@/services/locationIntelligence';
import {
  saveGuestPlace,
  removeGuestPlace,
  isPlaceSavedLocal,
  recordDiscoveryHistory,
  SavedPlace,
} from '@/services/personalizationService';
import type { ForecastResponse } from '@/services/weather/types';

export interface LocationIntelligencePanelProps {
  country?: string | null;
  location?: LocationRecord | null;
  activeCategory?: string | null;
  onClose: () => void;
  onSelectCountry?: (country: string | null) => void;
  onSelectLocation?: (location: LocationRecord | null) => void;
  onSelectArticle?: (article: WorldEvent) => void;
  onFocusCoordinates?: (coords: { lat: number; lng: number }) => void;
  isMobile?: boolean;
}

export default function LocationIntelligencePanel({
  country,
  location,
  activeCategory,
  onClose,
  onSelectCountry,
  onSelectLocation,
  onSelectArticle,
  onFocusCoordinates,
  isMobile = false,
}: LocationIntelligencePanelProps) {
  // 1. Resolve Canonical Location Data
  const canonical: CanonicalLocation | null = useMemo(() => {
    return resolveCanonicalLocation({ country, location });
  }, [country, location]);

  // Request IDs for Stale Response Guard
  const weatherRequestIdRef = useRef<number>(0);
  const newsRequestIdRef = useRef<number>(0);

  // Weather Telemetry State
  const [weatherData, setWeatherData] = useState<ForecastResponse | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // News Dispatches State
  const [articles, setArticles] = useState<WorldEvent[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Live Local Digital Clock State
  const [localTime, setLocalTime] = useState<string>('');
  const [localDate, setLocalDate] = useState<string>('');
  const [timeZoneLabel, setTimeZoneLabel] = useState<string>('');
  const [isTimeUnavailable, setIsTimeUnavailable] = useState<boolean>(false);

  // Active Tab for Mobile / Compact View
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'weather'>('overview');

  // Coordinates used for weather and city map (capital coordinates for country, or city coordinates)
  const targetCoordinates = useMemo(() => {
    if (!canonical) return null;
    if (canonical.type === 'country' && canonical.capitalCoordinates) {
      return canonical.capitalCoordinates;
    }
    return { lat: canonical.lat, lng: canonical.lng };
  }, [canonical]);

  // Canonical Bookmark identity
  const placeId = useMemo(() => {
    if (!canonical) return '';
    return canonical.type === 'country'
      ? `country_${canonical.country.toLowerCase().replace(/\s+/g, '_')}`
      : `city_${canonical.name.toLowerCase().replace(/\s+/g, '_')}_${canonical.country.toLowerCase().replace(/\s+/g, '_')}`;
  }, [canonical]);

  const [isSaved, setIsSaved] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    if (!placeId) return;
    setIsSaved(isPlaceSavedLocal(placeId));

    // Listen for cross-component bookmark sync
    const handleSync = (e: any) => {
      if (e.detail?.key === 'saved_places') {
        setIsSaved(isPlaceSavedLocal(placeId));
      }
    };
    window.addEventListener('mooearth_personalization_update', handleSync);
    return () => window.removeEventListener('mooearth_personalization_update', handleSync);
  }, [placeId]);

  // Record discovery history when location dossier is explored
  useEffect(() => {
    if (!canonical || !targetCoordinates || !placeId) return;
    recordDiscoveryHistory({
      id: placeId,
      type: canonical.type,
      title: canonical.name,
      subtitle: canonical.type === 'country' ? canonical.region || 'Sovereign Nation' : canonical.country,
      country: canonical.country,
      coordinates: targetCoordinates,
      flag: canonical.flag,
    });
  }, [canonical, targetCoordinates, placeId]);

  const handleToggleBookmark = () => {
    if (!canonical || !targetCoordinates || !placeId) return;
    if (isSaved) {
      removeGuestPlace(placeId);
      setIsSaved(false);
    } else {
      const place: SavedPlace = {
        id: placeId,
        type: canonical.type,
        name: canonical.name,
        country: canonical.country,
        state: canonical.state,
        coordinates: targetCoordinates,
        flag: canonical.flag,
        savedAt: Date.now(),
      };
      saveGuestPlace(place);
      setIsSaved(true);
    }
  };

  const handleShareLocation = async () => {
    if (!canonical || !targetCoordinates) return;
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/?${
          canonical.type === 'country'
            ? `country=${encodeURIComponent(canonical.country)}`
            : `city=${encodeURIComponent(canonical.name)}&lat=${targetCoordinates.lat.toFixed(4)}&lng=${targetCoordinates.lng.toFixed(4)}`
        }`
      : '';
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${canonical.name} — MooEarth Live`,
          text: `Explore real-time weather and planetary intelligence for ${canonical.name} on MooEarth.Live!`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

  // ── 2. Live Local Digital Clock ─────────────────────────────
  useEffect(() => {
    if (!canonical) return;

    // Use canonical timezone, or timezone reported by live weather, or attempt fallback
    const resolvedTz = canonical.timezone || weatherData?.timezone;

    if (!resolvedTz) {
      setIsTimeUnavailable(true);
      return;
    }

    setIsTimeUnavailable(false);

    const updateClock = () => {
      try {
        const now = new Date();
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: resolvedTz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: resolvedTz,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        setLocalTime(timeFormatter.format(now));
        setLocalDate(dateFormatter.format(now));
        setTimeZoneLabel(resolvedTz.split('/').pop()?.replace(/_/g, ' ') || resolvedTz);
      } catch {
        setIsTimeUnavailable(true);
      }
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [canonical, weatherData?.timezone]);

  // ── 3. Live Weather Telemetry Fetcher with Stale Guard ───────
  const loadWeather = useCallback(async (coords: { lat: number; lng: number }, force = false) => {
    const requestId = ++weatherRequestIdRef.current;
    setIsWeatherLoading(true);
    setWeatherError(null);

    try {
      const data = await fetchLiveLocationWeather(coords.lat, coords.lng, { forceRefresh: force });
      // Stale response guard: ignore if a newer location was requested in the meantime
      if (requestId === weatherRequestIdRef.current) {
        setWeatherData(data);
        setIsWeatherLoading(false);
      }
    } catch (err: unknown) {
      if (requestId === weatherRequestIdRef.current) {
        const msg = err instanceof Error ? err.message : 'Weather service temporarily unavailable';
        setWeatherError(msg);
        setIsWeatherLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!targetCoordinates) {
      setWeatherData(null);
      setIsWeatherLoading(false);
      return;
    }
    loadWeather(targetCoordinates);
  }, [targetCoordinates, loadWeather]);

  // ── 4. News Pipeline Fetcher with Stale Guard ────────────────
  const loadNews = useCallback(async (loc: CanonicalLocation) => {
    const requestId = ++newsRequestIdRef.current;
    setIsNewsLoading(true);
    setNewsError(null);

    try {
      let newsItems: WorldEvent[] = [];

      if (loc.type === 'country') {
        const catParam = activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : '';
        const res = await fetch(`/api/reactions?country=${encodeURIComponent(loc.name)}${catParam}&t=${Date.now()}`);
        if (!res.ok) throw new Error('Failed to retrieve national headlines');
        const data = await res.json();
        newsItems = data.reaction?.headlines || [];
      } else {
        const catParam = activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : '';
        const res = await fetch(`/api/events?locationId=${encodeURIComponent(loc.id)}${catParam}`);
        if (!res.ok) throw new Error('Failed to retrieve location dispatches');
        const data = await res.json();
        newsItems = data.events || [];
      }

      // Stale response guard
      if (requestId === newsRequestIdRef.current) {
        const deduped = deduplicateNewsArticles(newsItems);
        setArticles(deduped);
        setIsNewsLoading(false);
      }
    } catch (err: unknown) {
      if (requestId === newsRequestIdRef.current) {
        const msg = err instanceof Error ? err.message : 'News wire temporarily unavailable';
        setNewsError(msg);
        setIsNewsLoading(false);
      }
    }
  }, [activeCategory]);

  useEffect(() => {
    if (!canonical) {
      setArticles([]);
      setIsNewsLoading(false);
      return;
    }
    loadNews(canonical);
  }, [canonical, loadNews]);

  // Keyboard escape listener to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!canonical) return null;

  // City Map navigation target URL
  const cityMapUrl = targetCoordinates
    ? `/weather?view=city&lat=${targetCoordinates.lat.toFixed(4)}&lng=${targetCoordinates.lng.toFixed(4)}&city=${encodeURIComponent(canonical.capital || canonical.name)}&country=${encodeURIComponent(canonical.country)}`
    : '/weather?view=city';

  // Weather Radar navigation target URL
  const weatherRadarUrl = targetCoordinates
    ? `/weather?lat=${targetCoordinates.lat.toFixed(4)}&lng=${targetCoordinates.lng.toFixed(4)}&city=${encodeURIComponent(canonical.capital || canonical.name)}&country=${encodeURIComponent(canonical.country)}`
    : '/weather';

  return (
    <motion.aside
      key={`loc-panel-${canonical.id}`}
      initial={{ opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 40 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 40 : 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`glass-panel border border-cyan-500/25 shadow-[0_16px_50px_rgba(0,0,0,0.75)] flex flex-col z-40 overflow-hidden ${
        isMobile
          ? 'fixed bottom-3 left-3 right-3 max-h-[min(72vh,calc(100vh-135px))] rounded-3xl'
          : 'fixed right-6 top-24 bottom-24 w-[400px] rounded-3xl'
      }`}
      style={{
        background: 'linear-gradient(180deg, rgba(8, 14, 30, 0.97) 0%, rgba(3, 6, 14, 0.99) 100%)',
        backdropFilter: 'blur(28px)',
        ...(isMobile ? {
          left: 'max(12px, env(safe-area-inset-left))',
          right: 'max(12px, env(safe-area-inset-right))',
          bottom: 'max(12px, env(safe-area-inset-bottom))',
        } : {}),
      }}
      aria-label={`${canonical.name} Location Intelligence Panel`}
      role="region"
    >
      {/* Ambient Radial Neon Background */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Share Toast Notification */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 z-50 py-2.5 px-4 rounded-xl bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-bold text-center shadow-lg backdrop-blur-md"
          >
            📋 Location link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: Title, Flag, Badges, Close Button */}
      <div className="p-3.5 sm:p-5 border-b border-white/[0.08] relative z-10 flex items-start justify-between gap-2 shrink-0">
        <div className="min-w-0 flex-1 pr-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-[9px] font-mono font-bold tracking-wider text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {canonical.type === 'country' ? 'SOVEREIGN NATION' : 'GLOBAL METROPOLIS'}
            </span>
            {canonical.region && (
              <span className="text-[10px] text-white/40 font-mono uppercase truncate">
                {canonical.region}
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate flex items-center gap-2">
            <span className="truncate">{canonical.name}</span>
            <CountryFlag flag={canonical.flag} className="w-5 h-3.5 object-cover rounded shadow shrink-0" />
          </h2>

          <div className="flex items-center gap-2 text-xs text-white/60 font-medium truncate mt-0.5">
            {canonical.type === 'country' && canonical.capital ? (
              <span className="truncate">Capital: <span className="text-cyan-300 font-semibold">{canonical.capital}</span></span>
            ) : (
              <span className="truncate">
                {canonical.state && `${canonical.state}, `}
                <button
                  onClick={() => onSelectCountry?.(canonical.country)}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                  title={`Explore ${canonical.country} Country Hub`}
                >
                  {canonical.country}
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            aria-label={isSaved ? `Remove ${canonical.name} from saved places` : `Save ${canonical.name} to bookmarks`}
            className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isSaved
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)] scale-105'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/50 hover:text-amber-300'
            }`}
            title={isSaved ? 'Saved in your places (Click to remove)' : 'Bookmark location'}
          >
            <span className="text-sm leading-none">{isSaved ? '★' : '☆'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShareLocation}
            aria-label="Share location link"
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer"
            title="Share Location Link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>

          {/* Return to Earth / Close Button - 44x44 touch target */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Return to Earth (Close Panel)"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/25 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shrink-0"
            title="Return to Earth Orbit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Tab Selector (Compact Navigation) */}
      {isMobile && (
        <div className="flex border-b border-white/[0.08] bg-black/30 p-1 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 text-[11px] font-bold font-mono tracking-wider rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={`flex-1 py-1.5 text-[11px] font-bold font-mono tracking-wider rounded-xl transition-all ${
              activeTab === 'weather'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            WEATHER
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-1.5 text-[11px] font-bold font-mono tracking-wider rounded-xl transition-all ${
              activeTab === 'news'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            DISPATCHES ({articles.length})
          </button>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin relative z-10">
        
        {/* SECTION A: Overview Telemetry (Clock + Geography Grid) */}
        {(!isMobile || activeTab === 'overview') && (
          <div className="space-y-3">
            {/* Live Ticking Local Digital Clock */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-purple-950/30 border border-cyan-500/25 flex items-center justify-between shadow-sm">
              <div className="min-w-0">
                <div className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  LOCAL TIME & DATE
                </div>
                {isTimeUnavailable ? (
                  <div className="text-sm font-semibold text-white/50 font-mono mt-1">
                    Local time unavailable
                  </div>
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                      {localTime || '--:--:--'}
                    </div>
                    <div className="text-[10px] text-white/50 font-mono truncate">
                      {localDate} • {timeZoneLabel || 'UTC'}
                    </div>
                  </>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl shrink-0">
                ⏱️
              </div>
            </div>

            {/* Demographics & Coordinates Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">POPULATION</div>
                <div className="text-xs sm:text-sm font-black text-white mt-0.5 truncate">
                  {canonical.population || 'Undisclosed'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">COORDINATES</div>
                <div className="text-xs font-bold text-cyan-200 mt-1 truncate">
                  {canonical.lat.toFixed(2)}°, {canonical.lng.toFixed(2)}°
                </div>
              </div>
            </div>

            {/* Country Metadata: Languages & Currency (when available) */}
            {canonical.type === 'country' && (canonical.languages || canonical.currency) && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] font-mono space-y-1">
                {canonical.languages && (
                  <div className="flex justify-between text-white/70">
                    <span className="text-white/40">LANGUAGES:</span>
                    <span className="text-right truncate max-w-[200px]">{canonical.languages}</span>
                  </div>
                )}
                {canonical.currency && (
                  <div className="flex justify-between text-white/70">
                    <span className="text-white/40">CURRENCY:</span>
                    <span className="text-right truncate max-w-[200px]">{canonical.currency}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION B: Location-Aware Weather & Daily Forecast Strip */}
        {(!isMobile || activeTab === 'overview' || activeTab === 'weather') && (
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest uppercase">
              <span className="text-cyan-400 flex items-center gap-1.5">
                <span>🌦️</span>
                <span>METEOROLOGICAL TELEMETRY</span>
              </span>
              <span className="text-white/40">LIVE OPEN-METEO</span>
            </div>

            {/* Weather State Handling: Loading, Error with Retry, Success */}
            {isWeatherLoading ? (
              <div className="py-6 text-center text-xs text-cyan-400/70 font-mono animate-pulse flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                <span>Reading atmospheric conditions...</span>
              </div>
            ) : weatherError ? (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-center space-y-2">
                <p className="text-xs text-red-300 font-mono">Weather observation unavailable.</p>
                {targetCoordinates && (
                  <button
                    onClick={() => loadWeather(targetCoordinates, true)}
                    className="px-3 py-1 text-[10px] font-mono font-bold bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 rounded-lg transition-colors cursor-pointer"
                  >
                    RETRY WEATHER TELEMETRY
                  </button>
                )}
              </div>
            ) : weatherData && weatherData.current ? (
              <div className="space-y-3">
                {/* Current Conditions Block */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl">{weatherData.current.weatherEmoji || '🌡️'}</span>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                        {Math.round(weatherData.current.temperature)}°C
                      </div>
                      <div className="text-xs text-white/70 font-medium">
                        {weatherData.current.weatherDescription}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[10px] font-mono space-y-0.5 text-white/50">
                    <div>HUMIDITY: <span className="text-white/80 font-bold">{weatherData.current.relativeHumidity}%</span></div>
                    <div>WIND: <span className="text-white/80 font-bold">{Math.round(weatherData.current.windSpeed)} km/h</span></div>
                    <div>FEELS LIKE: <span className="text-white/80 font-bold">{Math.round(weatherData.current.apparentTemperature)}°C</span></div>
                  </div>
                </div>

                {/* Observation Timestamp */}
                <div className="text-[9px] font-mono text-white/40 flex items-center justify-between border-t border-white/[0.06] pt-1.5">
                  <span>CURRENT OBSERVATION</span>
                  <span>{weatherData.current.time ? new Date(weatherData.current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
                </div>

                {/* 5-Day Forecast Strip */}
                {weatherData.daily && weatherData.daily.time && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/40">
                      5-DAY FORECAST OUTLOOK
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                      {weatherData.daily.time.slice(0, 5).map((dateStr, i) => {
                        const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
                        const maxT = Math.round(weatherData.daily.temperatureMax[i] ?? 0);
                        const minT = Math.round(weatherData.daily.temperatureMin[i] ?? 0);
                        return (
                          <div key={dateStr} className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <div className="text-[9px] text-white/50 uppercase">{dayName}</div>
                            <div className="text-sm my-0.5">
                              {weatherData.current.weatherEmoji || '🌤️'}
                            </div>
                            <div className="text-[10px] font-bold text-white/90">{maxT}°</div>
                            <div className="text-[8px] text-white/40">{minT}°</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-white/40 font-mono text-center py-2">
                No active weather observation for this coordinate.
              </div>
            )}
          </div>
        )}

        {/* SECTION C: 1-Click Navigation Actions */}
        <div className="space-y-2 pt-1">
          {/* Action 1: Explore City Map in MapLibre GL JS */}
          <Link
            href={cityMapUrl}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500/25 via-blue-600/25 to-purple-600/25 hover:from-cyan-500/40 hover:to-purple-600/40 border border-cyan-400/40 text-cyan-200 hover:text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer group"
            data-testid="explore-city-maplibre-btn"
          >
            <span className="text-base group-hover:scale-110 transition-transform">🗺️</span>
            <span>EXPLORE {canonical.type === 'country' ? `${canonical.capital?.toUpperCase() || canonical.name.toUpperCase()} CITY MAP` : 'CITY MAP'}</span>
            <span className="text-xs text-cyan-400 font-bold">→</span>
          </Link>

          {/* Action 2 & 3: Quick Camera & Return / Radar Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (onFocusCoordinates && targetCoordinates) {
                  onFocusCoordinates(targetCoordinates);
                }
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Center 3D Globe camera on location"
            >
              <span>🎯</span>
              <span>CENTER CAMERA</span>
            </button>

            <Link
              href={weatherRadarUrl}
              className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Open full interactive Planetary Weather Radar"
            >
              <span>🌦️</span>
              <span>WEATHER RADAR</span>
            </Link>
          </div>
        </div>

        {/* SECTION D: Country/City News with AI Summaries & Publisher Attribution */}
        {(!isMobile || activeTab === 'overview' || activeTab === 'news') && (
          <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest uppercase text-white/50 px-0.5">
              <span>VERIFIED WIRE DISPATCHES</span>
              <span>{articles.length} RECORDED</span>
            </div>

            {/* News State Handling */}
            {isNewsLoading ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center text-xs text-cyan-400/70 font-mono animate-pulse">
                Scanning planetary event telemetry feeds...
              </div>
            ) : newsError ? (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-center space-y-2">
                <p className="text-xs text-red-300 font-mono">{newsError}</p>
                <button
                  onClick={() => loadNews(canonical)}
                  className="px-3 py-1 text-[10px] font-mono font-bold bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 rounded-lg transition-colors cursor-pointer"
                >
                  RETRY NEWS FEED
                </button>
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                {articles.slice(0, 6).map((art) => {
                  const publisher = art.source?.startsWith('http')
                    ? (() => {
                        try { return new URL(art.source).hostname.replace(/^www\./, ''); } catch { return 'Global Wire'; }
                      })()
                    : (art.source || 'Verified Wire');

                  const hasValidExternalLink = art.source && art.source.startsWith('http');

                  return (
                    <article
                      key={art.id}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/30 transition-all space-y-1.5 group"
                    >
                      {/* Publisher & Timestamp */}
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="font-bold text-cyan-400 uppercase tracking-wider truncate max-w-[180px]">
                          {publisher}
                        </span>
                        <span className="text-white/40">
                          {art.publishedAt
                            ? new Date(art.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'Recent'}
                        </span>
                      </div>

                      {/* Headline */}
                      <h3
                        onClick={() => onSelectArticle?.(art)}
                        className="text-xs font-semibold text-white/95 group-hover:text-cyan-200 leading-snug cursor-pointer transition-colors line-clamp-2"
                      >
                        {art.title}
                      </h3>

                      {/* AI-Generated Summary Banner & Text */}
                      {art.summary && art.summary !== art.title && (
                        <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/15 space-y-1">
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-[8px] font-mono font-bold text-cyan-300">
                            <span>🤖</span>
                            <span>AI-GENERATED SUMMARY</span>
                          </div>
                          <p className="text-[10px] text-white/70 leading-relaxed line-clamp-2">
                            {art.summary}
                          </p>
                        </div>
                      )}

                      {/* Source Link Preservation */}
                      {hasValidExternalLink && (
                        <div className="pt-0.5 flex justify-end">
                          <a
                            href={art.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-mono font-bold text-cyan-400/80 hover:text-cyan-300 hover:underline inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Read source on {publisher}</span>
                            <span>↗</span>
                          </a>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center text-xs text-white/40 font-mono">
                No recent verified wire dispatches recorded for {canonical.name}.
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer: Return to Earth Orbital Action */}
      <div className="p-3.5 border-t border-white/[0.08] bg-black/50 flex items-center justify-between text-xs font-mono shrink-0">
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>🌍</span>
          <span>RETURN TO EARTH</span>
        </button>

        {canonical.type === 'city' && (
          <button
            onClick={() => onSelectCountry?.(canonical.country)}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{canonical.country} Hub</span>
            <span>→</span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}
