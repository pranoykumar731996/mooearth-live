import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coordinates Not Found | MooEarth Live',
  description: 'The requested geographic coordinates or page could not be located on the living Earth globe.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030308] text-white flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="max-w-2xl w-full text-center relative z-10 py-12">
        {/* Animated Beacon */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs uppercase tracking-widest mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
          Planetary Telemetry Signal Lost • 404
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
          COORDINATES NOT FOUND
        </h1>

        <p className="text-base sm:text-lg text-white/70 max-w-lg mx-auto mb-10 leading-relaxed">
          The planetary waypoint or dossier you requested does not exist or has rotated out of satellite coverage. Re-align your instruments using the navigational links below.
        </p>

        {/* Quick Nav Portals */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-10 text-left">
          <Link
            href="/"
            className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 transition-all group cursor-pointer"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🌍</div>
            <div className="text-xs font-bold text-white group-hover:text-cyan-300">3D Globe</div>
            <div className="text-[10px] text-white/40">Living planet home</div>
          </Link>

          <Link
            href="/play-earth"
            className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-500/40 transition-all group cursor-pointer"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🎮</div>
            <div className="text-xs font-bold text-white group-hover:text-emerald-300">Play Earth</div>
            <div className="text-[10px] text-white/40">Discovery mode</div>
          </Link>

          <Link
            href="/daily"
            className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-amber-500/40 transition-all group cursor-pointer"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📅</div>
            <div className="text-xs font-bold text-white group-hover:text-amber-300">Daily Challenge</div>
            <div className="text-[10px] text-white/40">Today&apos;s 5 questions</div>
          </Link>

          <Link
            href="/weather"
            className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 transition-all group cursor-pointer"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🌤️</div>
            <div className="text-xs font-bold text-white group-hover:text-cyan-300">Weather Radar</div>
            <div className="text-[10px] text-white/40">Live Open-Meteo</div>
          </Link>

          <Link
            href="/world-map"
            className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-purple-500/40 transition-all group cursor-pointer"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🗺️</div>
            <div className="text-xs font-bold text-white group-hover:text-purple-300">World Atlas</div>
            <div className="text-[10px] text-white/40">195 Countries</div>
          </Link>

          <Link
            href="/world-events"
            className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-rose-500/40 transition-all group cursor-pointer"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🪐</div>
            <div className="text-xs font-bold text-white group-hover:text-rose-300">World Events</div>
            <div className="text-[10px] text-white/40">Planetary telemetry</div>
          </Link>
        </div>

        {/* Primary Return Button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all"
          >
            <span>⬅</span>
            <span>Return to Orbit</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-white/40">
        © 2026 MooEarth.Live • Real-Time World Intelligence &amp; Planetary Gaming
      </footer>
    </div>
  );
}
