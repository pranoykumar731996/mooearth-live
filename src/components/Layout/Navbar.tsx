// ============================================================
// EarthPulse AI — Navbar Component
// ============================================================

'use client';

import { WorldEvent } from '@/types';
import SearchBar from '@/components/Search/SearchBar';
import InstallButton from '@/components/UI/InstallButton';

interface NavbarProps {
  events: WorldEvent[];
  onSearch: (query: string) => void;
  onSelectEvent: (event: WorldEvent) => void;
}

export default function Navbar({ events, onSearch, onSelectEvent }: NavbarProps) {
  return (
    <nav
      id="navbar"
      className="fixed top-0 left-0 right-0 z-40 h-16
                 flex items-center justify-between px-4 sm:px-6
                 backdrop-blur-xl border-b border-white/[0.06]"
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
            EarthPulse
            <span className="text-cyan-400"> AI</span>
          </h1>
          <p className="text-[10px] text-white/30 leading-none -mt-0.5 tracking-wider">
            SEE THE WORLD COME ALIVE
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4 sm:mx-8">
        <SearchBar events={events} onSearch={onSearch} onSelectEvent={onSelectEvent} />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 shrink-0">
        <InstallButton />
        {/* Profile placeholder */}
        <div
          id="profile-avatar"
          className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20
                     border border-white/10 flex items-center justify-center
                     text-white/40 text-sm cursor-pointer
                     hover:border-cyan-500/30 transition-all duration-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>
    </nav>
  );
}
