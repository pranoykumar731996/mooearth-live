// ============================================================
// MooEarth Live — Navbar Component
// ============================================================

'use client';

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
  currentUser: { username: string; avatar: string; country: string } | null;
  onAuthClick: () => void;
  onSignOut: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isCinematicModeActive: boolean;
  onToggleCinematicMode: () => void;
  isPlayEarthActive: boolean;
  onTogglePlayEarth: () => void;
}

export default function Navbar({
  events,
  activeCategory,
  apiStatus,
  onSearch,
  onSelectEvent,
  onSelectCountry,
  currentUser,
  onAuthClick,
  onSignOut,
  isMuted,
  onToggleMute,
  isCinematicModeActive,
  onToggleCinematicMode,
  isPlayEarthActive,
  onTogglePlayEarth,
}: NavbarProps) {
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
      {/* Logo & Status Badge */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600
                          flex items-center justify-center text-base shadow-lg shadow-cyan-500/20">
            🌍
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-white leading-tight">
              MooEarth
              <span className="text-cyan-400"> Live</span>
            </h1>
            <p className="text-[10px] text-white/30 leading-none -mt-0.5 tracking-wider">
              {BRANDING.tagline}
            </p>
          </div>
        </div>

        {/* Live Data Production Badge */}
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
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4 sm:mx-8">
        <SearchBar events={events} activeCategory={activeCategory} onSearch={onSearch} onSelectEvent={onSelectEvent} onSelectCountry={onSelectCountry} />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Play Earth Game Mode Toggle */}
        <button
          onClick={onTogglePlayEarth}
          title={isPlayEarthActive ? 'Exit Play Earth Mode' : 'Play Earth — Quiz the World!'}
          className={`relative h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-black tracking-wider border transition-all duration-300 pointer-events-auto cursor-pointer ${
            isPlayEarthActive
              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-[0_0_18px_rgba(0,255,136,0.3)] animate-[neon-pulse_2s_ease-in-out_infinite]'
              : 'bg-white/5 border-white/10 text-white/60 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400/30 hover:shadow-[0_0_15px_rgba(0,255,136,0.15)]'
          }`}
        >
          {isPlayEarthActive && (
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping absolute top-1 right-1" />
          )}
          <span>🎮</span>
          <span className="hidden sm:inline">PLAY EARTH</span>
        </button>

        {/* Phase 3: Cinematic Mode Toggle */}
        <button
          onClick={onToggleCinematicMode}
          title={isCinematicModeActive ? "Stop Watch the World React Mode" : "Start Watch the World React Mode"}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm border transition-all duration-300 pointer-events-auto cursor-pointer relative ${
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
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm border transition-all duration-300 pointer-events-auto cursor-pointer ${
            !isMuted
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <InstallButton />
        {currentUser ? (
          <div className="flex items-center gap-2 group relative">
            <div
              id="profile-avatar"
              onClick={onSignOut}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/25 to-blue-500/25
                         border border-cyan-400/30 flex items-center justify-center
                         text-xl cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.2)]
                         hover:border-cyan-400/60 hover:scale-105 transition-all duration-300 pointer-events-auto"
            >
              {currentUser.avatar}
            </div>
            {/* Tooltip on hover */}
            <div className="absolute right-0 top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="glass px-3 py-1.5 rounded-xl text-[10px] font-semibold text-white/90 whitespace-nowrap shadow-xl border border-white/5 flex flex-col items-center">
                <span>@{currentUser.username} ({currentUser.country})</span>
                <span className="text-red-400/70 text-[8px] mt-0.5 uppercase tracking-widest font-bold">Click to Sign Out</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onAuthClick}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_25px_rgba(0,229,255,0.45)] transition-all duration-300 pointer-events-auto cursor-pointer"
          >
            SIGN IN
          </button>
        )}
      </div>
    </nav>
  );
}
