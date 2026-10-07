'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';
import { WorldMajorEvent } from '@/services/worldEventsService';

interface WorldEventsClientProps {
  events: WorldMajorEvent[];
  initialSelectedId?: string;
}

export default function WorldEventsClient({
  events,
  initialSelectedId,
}: WorldEventsClientProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialSelectedId || events[0]?.id || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedEvent =
    events.find(e => e.id === selectedEventId) || events[0] || null;

  const filteredEvents = events.filter(e => {
    const matchesCategory =
      selectedCategory === 'all' ||
      e.category.toLowerCase() === selectedCategory.toLowerCase();

    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.location.country.toLowerCase().includes(q) ||
      e.location.city.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q)
    );
  });

  const categories = [
    { id: 'all', label: 'All Events', icon: '🌐' },
    { id: 'breaking', label: 'Breaking', icon: '🔴' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'business', label: 'Business', icon: '📈' },
    { id: 'weather', label: 'Climate & Weather', icon: '🌪️' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
  ];

  return (
    <div className="space-y-6" id="interactive-events-map-viewport">
      {/* Category Filter Pills & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px] max-w-sm">
          <input
            type="text"
            placeholder="Search headline, country, source..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-9 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <span className="absolute left-3 top-2.5 text-xs text-white/40">🔍</span>
        </div>
      </div>

      {/* 3D WebGL Globe Viewport & Event Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Globe */}
        <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-white/10 bg-[#020208] shadow-2xl relative min-h-[500px]">
          <WebGLGlobeViewer
            selectedCountry={selectedEvent ? selectedEvent.location.country : undefined}
            height="560px"
          />
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-cyan-300">
              ● {filteredEvents.length} Major Geocoded Events
            </div>
            <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/60">
              3D Interactive Globe
            </div>
          </div>
        </div>

        {/* Selected Event Spotlight Drawer */}
        <div className="lg:col-span-4 space-y-4">
          {selectedEvent && (
            <div className="p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-white/[0.04] to-black/80 shadow-2xl space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider">
                  📍 {selectedEvent.location.city}, {selectedEvent.location.country}
                </span>
                <time
                  dateTime={selectedEvent.dateTime}
                  className="text-[11px] font-mono text-white/50"
                >
                  {new Date(selectedEvent.dateTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
              </div>

              <h3 className="text-lg font-black text-white leading-snug">
                {selectedEvent.title}
              </h3>

              <p className="text-xs text-white/70 leading-relaxed">
                {selectedEvent.summary}
              </p>

              {/* Factual Context */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-mono text-cyan-300 font-bold block">
                  Geographic &amp; Strategic Context:
                </span>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  {selectedEvent.context}
                </p>
              </div>

              {/* Attribution and Coordinates */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 font-mono uppercase text-[10px]">Primary Source:</span>
                  <span className="font-bold text-cyan-400">{selectedEvent.source}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 font-mono uppercase text-[10px]">Epicenter:</span>
                  <span className="font-mono text-white/60">
                    {selectedEvent.location.lat.toFixed(2)}°, {selectedEvent.location.lng.toFixed(2)}°
                  </span>
                </div>
              </div>

              {/* Related Countries Pills */}
              {selectedEvent.relatedCountries.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase block">
                    Related Sovereign States:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEvent.relatedCountries.map(rel => (
                      <Link
                        key={rel.slug}
                        href={`/countries/${rel.slug}`}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] border border-white/10 transition-colors"
                        title={rel.relation}
                      >
                        🌐 {rel.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={selectedEvent.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Verify Original Reporting at {selectedEvent.source}</span>
                  <span>→</span>
                </a>
                <Link
                  href={`/countries/${selectedEvent.location.countrySlug}`}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-xs text-center border border-white/10 transition-colors"
                >
                  Explore {selectedEvent.location.country} Country Hub →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Event Cards */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <span>📡</span> Verified Event Dispatches ({filteredEvents.length})
          </h3>
          <span className="text-[11px] text-white/40 font-mono">
            Click to target coordinate on 3D globe
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEvents.map(evt => {
            const isSelected = evt.id === selectedEventId;
            return (
              <div
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-cyan-400 font-semibold truncate max-w-[65%]">
                    📍 {evt.location.country}
                  </span>
                  <span className="text-white/40 font-mono text-[10px]">
                    {new Date(evt.dateTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                  {evt.title}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                  <span className="truncate max-w-[60%]">Source: {evt.source}</span>
                  <span className="text-cyan-400 font-semibold">Inspect Event →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
