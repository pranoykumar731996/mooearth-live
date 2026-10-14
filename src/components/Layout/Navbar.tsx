// ============================================================
// MooEarth Live — Navbar Component
// ============================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { WorldEvent, EventCategory } from '@/types';
import SearchBar from '@/components/Search/SearchBar';
import InstallButton from '@/components/UI/InstallButton';
import LanguageSelector from '@/components/UI/LanguageSelector';
import { useTranslation } from '@/contexts/LanguageContext';
import { BRANDING } from '@/config/branding';
import { ApiStatus } from '@/hooks/useLiveEvents';
import { COUNTRY_COORDINATES } from '@/lib/constants';

interface NavbarProps {
  events: WorldEvent[];
  activeCategory?: EventCategory | null;
  apiStatus: ApiStatus;
  onSearch: (query: string) => void;
  onSelectEvent: (event: WorldEvent) => void;
  onSelectCountry?: (country: string | null) => void;
  onSelectLocation?: (location: any | null) => void;
  selectedCountry?: string | null;
  selectedLocation?: any | null;
  currentUser: { username: string; avatar: string; country: string } | null;
  onAuthClick: () => void;
  onSignOut: () => void;
  onProfileClick: () => void;
  onLeaderboardClick: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isCinematicModeActive: boolean;
  onToggleCinematicMode: () => void;
  isPlayEarthActive: boolean;
  onTogglePlayEarth: () => void;
  showDebugConsole?: boolean;
  onToggleDebug?: () => void;
  isWeatherActive?: boolean;
  onToggleWeather?: () => void;
}

export default function Navbar({
  events,
  activeCategory,
  apiStatus,
  onSearch,
  onSelectEvent,
  onSelectCountry,
  onSelectLocation,
  selectedCountry,
  selectedLocation,
  currentUser,
  onAuthClick,
  onSignOut,
  onProfileClick,
  onLeaderboardClick,
  isMuted,
  onToggleMute,
  isCinematicModeActive,
  onToggleCinematicMode,
  isPlayEarthActive,
  onTogglePlayEarth,
  showDebugConsole = false,
  onToggleDebug,
  isWeatherActive = false,
  onToggleWeather,
}: NavbarProps) {
  const { t } = useTranslation();
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Compute direct Weather Radar URL preserving current location / coordinates
  const weatherUrl = selectedLocation && selectedLocation.lat != null && selectedLocation.lng != null
    ? `/weather?lat=${selectedLocation.lat.toFixed(4)}&lng=${selectedLocation.lng.toFixed(4)}&city=${encodeURIComponent(selectedLocation.name || '')}&country=${encodeURIComponent(selectedLocation.country || '')}`
    : selectedCountry && (COUNTRY_COORDINATES[selectedCountry.toLowerCase()] || COUNTRY_COORDINATES[selectedCountry])
    ? `/weather?lat=${(COUNTRY_COORDINATES[selectedCountry.toLowerCase()] || COUNTRY_COORDINATES[selectedCountry]).lat.toFixed(4)}&lng=${(COUNTRY_COORDINATES[selectedCountry.toLowerCase()] || COUNTRY_COORDINATES[selectedCountry]).lng.toFixed(4)}&country=${encodeURIComponent(selectedCountry)}`
    : '/weather';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isDevParam = params.get('dev') === 'true' || params.get('developer') === 'true';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isDevStorage = localStorage.getItem('mooearth_dev') === 'true';
      
      if (isDevParam) {
        localStorage.setItem('mooearth_dev', 'true');
        setIsDeveloper(true);
      } else if (isDevStorage || isLocal) {
        setIsDeveloper(true);
      }

      try {
        const now = new Date();
        const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
        const saved = localStorage.getItem(`mooearth_daily_${today}`);
        if (saved) setDailyCompleted(true);
        const streakVal = parseInt(localStorage.getItem('mooearth_daily_streak') || '0', 10);
        setDailyStreak(streakVal);
      } catch {
        // Fallback
      }
    }
  }, []);

  const isSystemActive = apiStatus?.newsActive && apiStatus?.footballActive && apiStatus?.earthCastActive;
  const isSystemDegraded = !isSystemActive && (apiStatus?.newsActive || apiStatus?.footballActive);

  const badgeClass = isSystemActive
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
    : isSystemDegraded
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
    : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]';

  const dotPingClass = isSystemActive ? 'bg-emerald-400' : isSystemDegraded ? 'bg-amber-400' : 'bg-red-400';
  const dotColorClass = isSystemActive ? 'bg-emerald-500' : isSystemDegraded ? 'bg-amber-500' : 'bg-red-500';
  const badgeLabel = isSystemActive
    ? t('navbar.liveDataActive', 'LIVE DATA ACTIVE')
    : isSystemDegraded
    ? t('navbar.partialLiveData', 'PARTIAL LIVE DATA')
    : t('navbar.liveDataOffline', 'LIVE DATA OFFLINE');

  return (
    <nav
      id="navbar"
      className="fixed top-0 left-0 right-0 z-50 h-16
                 flex items-center justify-between px-4 sm:px-6
                 backdrop-blur-xl border-b border-white/[0.06] pointer-events-auto"
      style={{
        background: 'linear-gradient(180deg, rgba(5,5,15,0.85) 0%, rgba(5,5,15,0.6) 100%)',
      }}
    >
      {/* Mobile Search Overlay Mode (Dedicated full-width header, preventing overlap with language selector) */}
      {isMobileSearchActive && (
        <div className="fixed inset-x-0 top-0 h-16 z-[100] bg-[#070712] border-b border-white/10 px-3 flex items-center gap-2.5 shadow-2xl">
          <button 
            type="button"
            onClick={() => setIsMobileSearchActive(false)}
            aria-label="Back to navigation (Close Search)"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:text-white active:bg-white/15 transition-colors cursor-pointer shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <SearchBar 
              events={events} 
              activeCategory={activeCategory} 
              onSearch={onSearch} 
              onSelectEvent={(e) => {
                onSelectEvent(e);
                setIsMobileSearchActive(false);
              }} 
              onSelectCountry={(c) => {
                if (onSelectCountry) onSelectCountry(c);
                setIsMobileSearchActive(false);
              }}
              onSelectLocation={(loc) => {
                if (onSelectLocation) onSelectLocation(loc);
                setIsMobileSearchActive(false);
              }} 
            />
          </div>
        </div>
      )}

      {/* Logo & Status Badge */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600
                          items-center justify-center text-base shadow-lg shadow-cyan-500/20">
            🌍
          </div>
          {/* Mobile Logo Text matching user screenshot */}
          <div className="block sm:hidden">
            <div className="text-sm font-black tracking-tight text-white leading-none">
              <span className="text-cyan-400 font-black">public</span> MooEarth
            </div>
          </div>
          {/* Desktop Logo Text */}
          <div className="hidden sm:block">
            <div className="text-base font-bold text-white leading-tight">
              MooEarth
              <span className="text-cyan-400"> Live</span>
            </div>
            <p className="text-[10px] text-white/30 leading-none -mt-0.5 tracking-wider">
              {BRANDING.tagline}
            </p>
          </div>
        </div>

        {/* Live Data Production Badge & Freshness */}
        {isDeveloper && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="relative group pointer-events-auto cursor-help">
              <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 transition-all duration-300 border backdrop-blur-md ${badgeClass}`}>
                <span className="w-1.5 h-1.5 rounded-full relative flex">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotPingClass}`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColorClass}`} />
                </span>
                <span>{badgeLabel}</span>
              </div>

              {/* Tooltip */}
              <div className="absolute left-0 top-8 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 scale-95 group-hover:scale-100 origin-top-left">
                <div className="glass px-4 py-3 rounded-2xl text-[10px] font-semibold text-white/90 whitespace-nowrap shadow-xl border border-white/10 flex flex-col gap-2 bg-[#090915]/95 min-w-[150px]">
                  <div className="text-[9px] uppercase tracking-wider text-white/45 border-b border-white/5 pb-1">API Connections</div>
                  <div className="flex items-center justify-between gap-4">
                    <span>News Feed API</span>
                    <span className={apiStatus?.newsActive ? 'text-emerald-400' : 'text-red-400'}>
                      {apiStatus?.newsActive ? '🟢 Connected' : '🔴 Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Football API</span>
                    <span className={apiStatus?.footballActive ? 'text-emerald-400' : 'text-red-400'}>
                      {apiStatus?.footballActive ? '🟢 Connected' : '🔴 Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>EarthCast AI</span>
                    <span className={apiStatus?.earthCastActive ? 'text-emerald-400' : 'text-red-400'}>
                      {apiStatus?.earthCastActive ? '🟢 Connected' : '🔴 Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Freshness Badge */}
            {(() => {
              const getCategoryFreshness = () => {
                if (!apiStatus?.freshness) return null;
                let catKey = activeCategory ? activeCategory.toLowerCase().trim() : 'breaking';
                if (catKey === 'sports') catKey = 'football';
                if (catKey === 'home') catKey = 'breaking';
                return apiStatus.freshness[catKey] || apiStatus.freshness['breaking'] || null;
              };
              const currentFreshness = getCategoryFreshness();
              if (!currentFreshness) return null;
              
              const freshnessBadgeClass = currentFreshness.status === 'Live'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                : currentFreshness.status === 'Recent'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
                
              const dotClass = currentFreshness.status === 'Live'
                ? 'bg-emerald-500'
                : currentFreshness.status === 'Recent'
                ? 'bg-amber-500'
                : 'bg-red-500';
                
              const label = currentFreshness.status === 'Live'
                ? 'LIVE (0-15m)'
                : currentFreshness.status === 'Recent'
                ? 'RECENT (15-60m)'
                : 'STALE (>60m)';
                
              return (
                <div 
                  id="freshness-badge"
                  className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 border backdrop-blur-md transition-all duration-300 ${freshnessBadgeClass}`}
                  title={`Last fetched: ${new Date(currentFreshness.lastRetrieved).toLocaleString()}\nAPI response age: ${currentFreshness.apiResponseAgeSeconds}s`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  <span>{label}</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="hidden sm:block flex-1 max-w-md mx-4 sm:mx-8">
        <SearchBar events={events} activeCategory={activeCategory} onSearch={onSearch} onSelectEvent={onSelectEvent} onSelectCountry={onSelectCountry} onSelectLocation={onSelectLocation} />
      </div>

      {/* Right Section */}
      <div className="flex items-center shrink-0">
        {/* Mobile-Only Header Icon Bar (Responsive, non-clipped, accessible dropdown) */}
        {!isMobileSearchActive && (
          <div ref={mobileMenuRef} className="relative flex sm:hidden items-center gap-1.5 xs:gap-2">
            {/* Search Icon (Mobile) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchActive(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer rounded-xl bg-white/5 border border-white/10 shrink-0"
              title={t('navbar.search', 'Search')}
              aria-label={t('navbar.search', 'Search')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Direct Weather Radar Navigation (Mobile - Fix 4) */}
            <Link
              href={weatherUrl}
              className="h-9 px-2 xs:px-2.5 rounded-xl flex items-center gap-1 font-bold text-[10px] tracking-wider border border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 active:scale-95 transition-all shadow-[0_0_12px_rgba(0,229,255,0.2)] shrink-0"
              title="Open Weather Radar & Forecast"
              aria-label="Open Weather Radar & Forecast"
            >
              <span className="text-xs">🌦️</span>
              <span className="font-extrabold text-[9px] tracking-wider">RADAR</span>
            </Link>

            {/* Language Selector (Mobile - Never overlaps search) */}
            <div className="shrink-0">
              <LanguageSelector compact={true} />
            </div>

            {/* More Menu Toggle (Mobile - Fix 3: Play Earth, Daily, Leaderboards, About, Profile) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition-all cursor-pointer shrink-0 ${
                isMobileMenuOpen
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
              }`}
              title="More Options & Games"
              aria-label="More navigation and gaming features"
              aria-expanded={isMobileMenuOpen}
            >
              {currentUser ? (
                <span className="text-base">{currentUser.avatar}</span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                  <circle cx="5" cy="12" r="1.5" />
                </svg>
              )}
            </button>

            {/* Accessible Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
              <div 
                className="absolute right-0 top-11 w-64 rounded-2xl bg-[#080d22]/98 border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-2 z-[70] backdrop-blur-2xl flex flex-col gap-1 animate-fadeIn"
                role="menu"
                aria-orientation="vertical"
              >
                {/* Menu Header */}
                <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50 uppercase tracking-wider">
                  <span>Features & Games</span>
                  <button 
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white/40 hover:text-white p-1"
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>

                {/* Play Earth Mode */}
                <button
                  type="button"
                  onClick={() => {
                    onTogglePlayEarth();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer border ${
                    isPlayEarthActive
                      ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-black shadow-[0_0_15px_rgba(52,211,153,0.6)]'
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>🎮 {t('navbar.playEarth', 'Play Earth')}</span>
                  </span>
                  <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    11+ MODES
                  </span>
                </button>

                {/* Daily Challenge */}
                <Link
                  href="/daily"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold transition-all border ${
                    dailyCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{dailyCompleted ? '✅' : '📅'}</span>
                    <span>{t('navbar.dailyChallenge', 'Daily Challenge')}</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    {dailyCompleted ? 'DONE' : dailyStreak > 0 ? `🔥 ${dailyStreak}` : 'PLAY'}
                  </span>
                </Link>

                {/* Leaderboards */}
                <button
                  type="button"
                  onClick={() => {
                    onLeaderboardClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                >
                  <span className="text-sm">🏆</span>
                  <span>{t('navbar.leaderboards', 'Global Leaderboards')}</span>
                </button>

                {/* About & Legal */}
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <span className="text-sm">ℹ️</span>
                  <span>{t('navbar.aboutLegal', 'About & Legal')}</span>
                </Link>

                {/* Audio Mute/Unmute */}
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-sm">{isMuted ? '🔇' : '🔊'}</span>
                    <span>{isMuted ? t('navbar.unmuteAudio', 'Unmute Sound') : t('navbar.muteAudio', 'Mute Sound')}</span>
                  </span>
                  <span className="text-[10px] font-mono text-white/40">
                    {isMuted ? 'OFF' : 'ON'}
                  </span>
                </button>

                {/* Developer Debug Console */}
                {isDeveloper && onToggleDebug && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleDebug();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer text-left"
                  >
                    <span className="text-sm">⚙️</span>
                    <span>{showDebugConsole ? 'Hide UX Debug Console' : 'Show UX Debug Console'}</span>
                  </button>
                )}

                {/* User Profile or Sign In */}
                <div className="pt-1 mt-1 border-t border-white/10">
                  {currentUser ? (
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          onProfileClick();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 text-left cursor-pointer min-h-[40px] flex-1 min-w-0"
                      >
                        <span className="text-lg shrink-0">{currentUser.avatar}</span>
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">@{currentUser.username}</div>
                          <div className="text-[9px] text-cyan-400 font-mono truncate">{currentUser.country}</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 font-mono font-bold shrink-0 ml-2 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onAuthClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.2)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>👤</span>
                      <span>{t('navbar.signIn', 'SIGN IN')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <button
            onClick={onTogglePlayEarth}
            title={isPlayEarthActive ? t('playEarthOverlay.exitMode', 'Exit Play Earth Mode') : `${t('navbar.playEarth', 'Play Earth')} — ${t('navbar.modesBadge', '11+ MODES')}!`}
            className={`relative h-9 px-3.5 rounded-xl flex items-center gap-2 text-xs font-black tracking-wider border transition-all duration-300 pointer-events-auto cursor-pointer group ${
              isPlayEarthActive
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.8)] animate-pulse'
                : 'bg-gradient-to-r from-emerald-500/20 via-teal-500/25 to-cyan-500/20 border-emerald-400/50 text-emerald-300 hover:border-emerald-300 hover:shadow-[0_0_22px_rgba(16,185,129,0.5)] shadow-[0_0_14px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/20'
            }`}
          >
            {/* Blinking green live beacon */}
            <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981] absolute top-1 right-1" />
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping absolute top-1 right-1" />
            <span className="text-base group-hover:scale-110 transition-transform">🎮</span>
            <span className="font-black text-emerald-200">{t('navbar.playEarth', 'PLAY EARTH')}</span>
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-widest animate-pulse">
              {t('navbar.modesBadge', '11+ MODES')}
            </span>
          </button>

          {/* Daily Challenge Button (Desktop) */}
          <Link
            href="/daily"
            title={dailyCompleted ? "Today's Daily Challenge Completed! View Results" : "Play Today's Daily Earth Challenge!"}
            className={`relative h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold tracking-wider border transition-all pointer-events-auto cursor-pointer group ${
              dailyCompleted
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400'
                : 'border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-300 hover:border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            }`}
          >
            <span className="text-sm">{dailyCompleted ? '✅' : '📅'}</span>
            <span className="font-extrabold text-[11px]">{dailyCompleted ? 'DAILY DONE' : 'DAILY'}</span>
            {dailyStreak > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                🔥{dailyStreak}
              </span>
            )}
          </Link>

          {/* Weather Intelligence Platform Direct Navigation (Desktop - Fix 4) */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <Link
              href={weatherUrl}
              title="Open MooEarth Weather Intelligence Radar Platform"
              className="relative h-9 px-3.5 rounded-xl flex items-center gap-2 text-xs font-bold tracking-wider border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 via-blue-500/20 to-cyan-500/15 text-cyan-200 hover:text-white hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(6,182,212,0.4)] shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all pointer-events-auto cursor-pointer group"
            >
              <span className="text-base group-hover:scale-110 transition-transform">🌦️</span>
              <span className="font-extrabold text-cyan-200">WEATHER RADAR</span>
            </Link>

            {onToggleWeather && (
              <button
                type="button"
                onClick={onToggleWeather}
                title={isWeatherActive ? "Turn Off 3D Globe Weather Overlay" : "Turn On 3D Globe Weather Overlay"}
                className={`h-9 px-2.5 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                  isWeatherActive
                    ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black shadow-[0_0_12px_rgba(0,229,255,0.6)]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-cyan-300 hover:border-cyan-500/40'
                }`}
              >
                {isWeatherActive ? 'GLOBE: ON' : 'GLOBE LAYER'}
              </button>
            )}
          </div>

          {/* Phase 3: Cinematic Mode Toggle */}
          <button
            onClick={onToggleCinematicMode}
            title={isCinematicModeActive ? "Stop Watch the World React Mode" : t('navbar.cinematicMode', 'Watch the World React')}
            className={`hidden md:flex w-9 h-9 rounded-xl items-center justify-center text-sm border transition-all duration-300 pointer-events-auto cursor-pointer relative ${
              isCinematicModeActive
                ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {isCinematicModeActive ? (
              <>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-1 right-1 animate-[ping_1.5s_infinite]" />
                📺
              </>
            ) : (
              '🌍'
            )}
          </button>

          {/* Phase 7: Sound Toggle Button */}
          <button
            onClick={onToggleMute}
            title={isMuted ? t('navbar.unmuteAudio', 'Unmute Audio') : t('navbar.muteAudio', 'Mute Audio')}
            className={`hidden md:flex w-9 h-9 rounded-xl items-center justify-center text-sm border transition-all duration-300 pointer-events-auto cursor-pointer ${
              !isMuted
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Global Leaderboard Button */}
          <button
            onClick={onLeaderboardClick}
            title={t('navbar.leaderboards', 'Leaderboards')}
            className="hidden sm:flex w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-amber-400 transition-all duration-300 pointer-events-auto cursor-pointer items-center justify-center text-sm"
          >
            🏆
          </button>

          {/* Debug Console Toggle Button */}
          {isDeveloper && onToggleDebug && (
            <button
              onClick={onToggleDebug}
              title={showDebugConsole ? "Hide UX Debug Console" : "Show UX Debug Console"}
              className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-sm border transition-all duration-300 pointer-events-auto cursor-pointer ${
                showDebugConsole
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              ⚙️
            </button>
          )}

          {/* Phase 2: Multilingual Language Selector */}
          <LanguageSelector />

          <InstallButton />
          {currentUser ? (
            <div className="hidden sm:flex items-center gap-2 group relative">
              <button
                id="profile-avatar"
                onClick={onProfileClick}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/25 to-blue-500/25
                           border border-cyan-400/30 flex items-center justify-center
                           text-xl cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.2)]
                           hover:border-cyan-400/60 hover:scale-105 transition-all duration-300 pointer-events-auto"
              >
                {currentUser.avatar}
              </button>
              {/* Tooltip on hover */}
              <div className="absolute right-0 top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="glass px-3 py-1.5 rounded-xl text-[10px] font-semibold text-white/90 whitespace-nowrap shadow-xl border border-white/5 flex flex-col items-center">
                  <span>@{currentUser.username} ({currentUser.country})</span>
                  <span className="text-cyan-400 text-[8px] mt-0.5 uppercase tracking-widest font-bold">{t('navbar.viewProfileStats', 'View Profile & Stats')}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="hidden sm:block px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_25px_rgba(0,229,255,0.45)] transition-all duration-300 pointer-events-auto cursor-pointer"
            >
              {t('navbar.signIn', 'SIGN IN')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
