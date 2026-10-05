'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { fallbackEvents } from '@/data/events';
import { WorldEvent } from '@/types';
import LanguageSelector from '@/components/UI/LanguageSelector';

// Dynamically import GlobeScene for tactical 3D mini-view
const GlobeScene = dynamic(() => import('@/components/Globe/GlobeScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] flex items-center justify-center bg-[#070a1e] rounded-2xl border border-cyan-500/20 text-cyan-400 font-mono text-xs">
      <span className="inline-block animate-spin mr-2">🌐</span> Initializing 3D Tactical Radar...
    </div>
  ),
});

interface WarRoomClientProps {
  initialEventId?: string;
}

export default function WarRoomClient({ initialEventId }: WarRoomClientProps) {
  const [mounted, setMounted] = useState(false);
  const events: WorldEvent[] = useMemo(() => fallbackEvents, []);
  
  // Selected event
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId && events.some(e => e.id === initialEventId) ? initialEventId : events[0]?.id || 'evt-001'
  );

  const activeEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);

  // Live telemetry metrics
  const [viewerCount, setViewerCount] = useState(14820);
  const [utcTime, setUtcTime] = useState('');
  const [pollVoted, setPollVoted] = useState<string | null>(null);
  const [pollVotes, setPollVotes] = useState({ yes: 74, no: 26 });
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Live UTC Clock
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    // Fluctuating viewer count simulation
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 19) - 8);
    }, 4000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(viewerInterval);
    };
  }, []);

  // Megathread Reddit/Twitter copy builder
  function getMegathreadCopy(): string {
    if (!activeEvent) return '';
    return `🔴 LIVE 3D SITUATION ROOM: ${activeEvent.title}\n` +
      `📍 Location: ${activeEvent.city}, ${activeEvent.country} (${activeEvent.lat.toFixed(2)}°N, ${activeEvent.lng.toFixed(2)}°E)\n` +
      `🛰️ Category: ${activeEvent.category.toUpperCase()} | 👥 ${viewerCount.toLocaleString()} Tracking Live\n` +
      `🌐 Real-Time Interactive 3D Map: https://www.mooearth.live/war-room/${activeEvent.id}`;
  }

  function handleCopyMegathread() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(getMegathreadCopy()).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    });
  }

  function handleVote(choice: 'yes' | 'no') {
    if (pollVoted) return;
    setPollVoted(choice);
    if (choice === 'yes') {
      setPollVotes(prev => ({ ...prev, yes: prev.yes + 1 }));
    } else {
      setPollVotes(prev => ({ ...prev, no: prev.no + 1 }));
    }
  }

  if (!mounted || !activeEvent) return null;

  return (
    <div className="min-h-screen bg-[#04060f] text-white flex flex-col font-sans relative selection:bg-rose-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[500px] bg-red-600/10 blur-[150px]" />
        <div className="absolute bottom-0 right-10 w-[600px] h-[400px] bg-cyan-600/10 blur-[140px]" />
      </div>

      {/* Situation Room Header */}
      <header className="relative z-20 border-b border-red-500/20 bg-[#080b18]/90 backdrop-blur-md px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-red-600/30">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-red-400 via-rose-200 to-white bg-clip-text text-transparent">
                  WAR ROOM
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
                  LIVE SITUATION
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block">
                MooEarth Planetary Operations Center
              </span>
            </div>
          </Link>
        </div>

        {/* Live Telemetry Bar */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>UTC: <strong className="text-white">{utcTime || 'SYNCHRONIZING...'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300">
            <span>👁️</span>
            <span>{viewerCount.toLocaleString()} OBSERVERS</span>
          </div>
          <Link
            href="/daily"
            className="hidden sm:inline-flex px-3 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 transition-colors"
          >
            🌍 Daily Challenge
          </Link>
          <LanguageSelector compact={true} />
        </div>
      </header>

      {/* Main War Room Body */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {/* Left Column: Event Dossier & Timeline (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Dossier Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0a0e24]/90 border border-white/15 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  Level 4 Spotlight
                </span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase">
                  {activeEvent.category}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Lat: {activeEvent.lat.toFixed(4)}° | Lng: {activeEvent.lng.toFixed(4)}°
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-4">
              {activeEvent.title}
            </h1>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 mb-6">
              <span>📍 Hotspot:</span>
              <span className="text-cyan-300">{activeEvent.city}, {activeEvent.country}</span>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-6 font-normal">
              {activeEvent.summary}
            </p>

            {/* Situation Intel Timeline */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <span>📡</span> Tactical Bulletin Timeline
              </h3>
              <div className="space-y-3.5 relative pl-4 border-l-2 border-red-500/40">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[11px] font-mono text-red-400 font-bold block">12 MINUTES AGO</span>
                  <p className="text-xs text-white mt-0.5">
                    High density global telemetry detected. Observers in {activeEvent.country} report significant international reaction.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-[11px] font-mono text-slate-400 block">38 MINUTES AGO</span>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Official declaration dispatched. Multiple regional news networks have updated bulletin leads.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <span className="text-[11px] font-mono text-slate-500 block">1 HOUR AGO</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    First situational alert logged by MooEarth global feed monitoring network.
                  </p>
                </div>
              </div>
            </div>

            {/* Megathread / Social Dispatch Action */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white block">Seed Situation Room Megathread</span>
                <span className="text-[11px] text-slate-400">Copy pre-formatted live tracking dispatch for Reddit, Discord, or X</span>
              </div>
              <button
                onClick={handleCopyMegathread}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 font-bold text-xs text-white shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105"
              >
                <span>📋</span> {copiedToast ? 'Copied to Clipboard! ✅' : 'Copy Megathread Dispatch'}
              </button>
            </div>
          </div>

          {/* Situation Poll */}
          <div className="p-6 rounded-2xl bg-[#0a0e24]/90 border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <span>🗳️</span> Global Community Assessment
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Will this event significantly impact global financial and geopolitical policies this month?
            </p>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <button
                onClick={() => handleVote('yes')}
                disabled={!!pollVoted}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                  pollVoted === 'yes'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
              >
                <span>Yes, Major Impact</span>
                <span className="font-mono">{pollVotes.yes}%</span>
              </button>
              <button
                onClick={() => handleVote('no')}
                disabled={!!pollVoted}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                  pollVoted === 'no'
                    ? 'bg-red-500/20 border-red-400 text-red-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
              >
                <span>No, Transitory</span>
                <span className="font-mono">{pollVotes.no}%</span>
              </button>
            </div>
            {pollVoted && (
              <span className="text-[10px] text-emerald-400 font-mono block text-center">
                ✓ Vote registered across 14,800+ global observers.
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Tactical Hotspots & Minimap (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Tactical 3D Minimap */}
          <div className="p-4 rounded-2xl bg-[#0a0e24]/90 border border-cyan-500/30 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Orbital Tactical Lock
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Target: {activeEvent.city}
              </span>
            </div>

            <div className="w-full h-80 rounded-xl overflow-hidden relative border border-white/10">
              <GlobeScene
                events={[activeEvent]}
                selectedEvent={activeEvent}
                selectedCountry={activeEvent.country}
                onSelectEvent={() => {}}
                onSelectCountry={() => {}}
                globeView="night"
                isFocusMode={true}
              />
              {/* Tactical Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border border-red-500/40 border-dashed animate-spin" />
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 absolute" />
              </div>
            </div>
          </div>

          {/* Active Global Hotspots Switcher */}
          <div className="p-5 rounded-2xl bg-[#0a0e24]/90 border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <span>🌐</span> Active World Hotspots ({events.length})
            </h3>
            <div className="space-y-2">
              {events.slice(0, 5).map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                    evt.id === selectedEventId
                      ? 'bg-red-500/15 border-red-500/50 text-white shadow-md shadow-red-500/10'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-bold truncate text-white">{evt.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      📍 {evt.city}, {evt.country} • {evt.category.toUpperCase()}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-red-400 shrink-0 font-bold">
                    {evt.id === selectedEventId ? 'ACTIVE' : 'TRACK'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
