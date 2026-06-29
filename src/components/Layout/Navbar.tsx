// ============================================================
// MooEarth Live — Navbar Component
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WorldEvent, EventCategory } from '@/types';
import SearchBar from '@/components/Search/SearchBar';
import InstallButton from '@/components/UI/InstallButton';
import { BRANDING } from '@/config/branding';
import { ApiStatus } from '@/hooks/useLiveEvents';

interface NavbarProps {
  events: WorldEvent[];
  activeCategory?: EventCategory | null;
  apiStatus: ApiStatus;
  onSearch: (query: string) => void;
  onSelectEvent: (event: WorldEvent) => void;
  onSelectCountry?: (country: string | null) => void;
  onSelectLocation?: (location: any | null) => void;
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
}

export default function Navbar({
  events,
  activeCategory,
  apiStatus,
  onSearch,
  onSelectEvent,
  onSelectCountry,
  onSelectLocation,
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
}: NavbarProps) {
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

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
  const badgeLabel = isSystemActive ? 'LIVE DATA ACTIVE' : isSystemDegraded ? 'PARTIAL LIVE DATA' : 'LIVE DATA OFFLINE';

  return (
    <nav
      id="navbar"
      className="fixed top-0 left-0 right-0 z-40 h-16
                 flex items-center justify-between px-4 sm:px-6
                 backdrop-blur-xl border-b border-white/[0.06] pointer-events-auto"
      style={{
        background: 'linear-gradient(180deg, rgba(5,5,15,0.85) 0%, rgba(5,5,15,0.6) 100%)',
      }}
    >
      {/* Mobile Search Overlay Mode */}
      {isMobileSearchActive && (
        <div className="absolute inset-0 z-50 bg-[#070712] flex items-center px-4 gap-3">
          <button 
            onClick={() => setIsMobileSearchActive(false)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            ←
          </button>
          <div className="flex-1">
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
          <div className="flex items-center gap-2">
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
        {/* Mobile-Only Header Icon Bar (matches user screenshot design) */}
        <div className="flex sm:hidden items-center gap-3">
          {/* Search Icon */}
          <button
            onClick={() => setIsMobileSearchActive(true)}
            className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* About & Legal Icon (Mobile) */}
          <Link href="/about">
            <button
              className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="About & Legal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
          </Link>

          {/* Play Earth Game Mode (Gamepad Icon) */}
          <button
            onClick={onTogglePlayEarth}
            className={`w-9 h-9 flex items-center justify-center active:scale-95 transition-all cursor-pointer relative ${
              isPlayEarthActive ? 'text-emerald-400' : 'text-white/80 hover:text-white'
            }`}
            title={isPlayEarthActive ? 'Exit Play Earth Mode' : 'Play Earth — Quiz the World!'}
          >
            {/* Blinking green light always visible to make it recognizable */}
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_#10b981]" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />

            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="3" />
              <line x1="6" y1="12" x2="10" y2="12" />
              <line x1="8" y1="10" x2="8" y2="14" />
              <line x1="15" y1="13" x2="15.01" y2="13" />
              <line x1="18" y1="11" x2="18.01" y2="11" />
            </svg>
          </button>

          <button
            onClick={onLeaderboardClick}
            className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Leaderboards"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M7.5 13.5v7.25L12 18.5l4.5 2.25v-7.25" />
              <path d="M12 2L4.5 5.5v5a7.5 7.5 0 0 0 15 0v-5L12 2Z" />
            </svg>
          </button>

          {isDeveloper && onToggleDebug && (
            <button
              onClick={onToggleDebug}
              className={`w-9 h-9 flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                showDebugConsole ? 'text-cyan-400' : 'text-white/80 hover:text-white'
              }`}
              title={showDebugConsole ? "Hide UX Debug Console" : "Show UX Debug Console"}
            >
              ⚙️
            </button>
          )}

          {currentUser ? (
            <button
              onClick={onProfileClick}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/25 to-blue-500/25
                         border border-cyan-400/30 flex items-center justify-center
                         text-base cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.2)]
                         hover:border-cyan-400/60 active:scale-95 transition-all duration-300 pointer-events-auto"
              title={`Profile: @${currentUser.username}`}
            >
              {currentUser.avatar}
            </button>
          ) : (
            <button
              onClick={onAuthClick}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-[9px] tracking-wider shadow-[0_0_10px_rgba(0,229,255,0.15)] active:scale-95 transition-all duration-300 pointer-events-auto"
            >
              SIGN IN
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          <button
            onClick={onTogglePlayEarth}
            title={isPlayEarthActive ? 'Exit Play Earth Mode' : 'Play Earth — Quiz the World!'}
            className={`relative h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 text-xs font-black tracking-wider border transition-all duration-300 pointer-events-auto cursor-pointer ${
              isPlayEarthActive
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-[0_0_18px_rgba(0,255,136,0.3)] animate-[neon-pulse_2s_ease-in-out_infinite]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400/30 hover:shadow-[0_0_15px_rgba(0,255,136,0.15)]'
            }`}
          >
            {/* Blinking green light always visible to make it recognizable */}
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_#10b981] absolute top-1 right-1" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping absolute top-1 right-1" />
            <span>🎮</span>
            <span className="hidden sm:inline">PLAY EARTH</span>
          </button>

          {/* Phase 3: Cinematic Mode Toggle */}
          <button
            onClick={onToggleCinematicMode}
            title={isCinematicModeActive ? "Stop Watch the World React Mode" : "Start Watch the World React Mode"}
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
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
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
            title="View Leaderboards"
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
                  <span className="text-cyan-400 text-[8px] mt-0.5 uppercase tracking-widest font-bold">View Profile & Stats</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="hidden sm:block px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_25px_rgba(0,229,255,0.45)] transition-all duration-300 pointer-events-auto cursor-pointer"
            >
              SIGN IN
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
