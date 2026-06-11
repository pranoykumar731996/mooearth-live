// ============================================================
// MooEarth Live — Navbar Component
// ============================================================

'use client';

import { WorldEvent } from '@/types';
import SearchBar from '@/components/Search/SearchBar';
import InstallButton from '@/components/UI/InstallButton';
import { BRANDING } from '@/config/branding';

interface NavbarProps {
  events: WorldEvent[];
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
}

export default function Navbar({
  events,
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
}: NavbarProps) {
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
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
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

      {/* Search */}
      <div className="flex-1 max-w-md mx-4 sm:mx-8">
        <SearchBar events={events} onSearch={onSearch} onSelectEvent={onSelectEvent} onSelectCountry={onSelectCountry} />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 shrink-0">
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
