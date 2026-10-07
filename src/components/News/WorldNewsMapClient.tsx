'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { WorldNewsStory } from '@/services/worldNewsService';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';

interface WorldNewsMapClientProps {
  stories: WorldNewsStory[];
  initialCategory?: string;
}

export default function WorldNewsMapClient({
  stories,
  initialCategory = 'all',
}: WorldNewsMapClientProps) {
  const [selectedStory, setSelectedStory] = useState<WorldNewsStory | null>(
    stories.length > 0 ? stories[0] : null
  );
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRegion, setActiveRegion] = useState<string>('all');

  // Filtered stories based on search and category
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      // Category filter
      if (activeCategory !== 'all' && story.category !== activeCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = story.title.toLowerCase().includes(q);
        const matchesCountry = story.country.toLowerCase().includes(q);
        const matchesSummary = story.summary.toLowerCase().includes(q);
        const matchesSource = story.source.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCountry && !matchesSummary && !matchesSource) {
          return false;
        }
      }
      return true;
    });
  }, [stories, activeCategory, searchQuery]);

  // Format relative timestamp
  function formatTimeAgo(isoString: string): string {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  }

  const categories = [
    { id: 'all', label: 'All Stories', emoji: '🌐' },
    { id: 'breaking', label: 'Breaking', emoji: '🔴' },
    { id: 'technology', label: 'Technology', emoji: '💻' },
    { id: 'business', label: 'Markets', emoji: '📈' },
    { id: 'sports', label: 'Sports', emoji: '⚽' },
  ];

  return (
    <div className="space-y-6" id="interactive-news-map-viewport">
      {/* Control Bar: Search & Category Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px] max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search country, headline, wire..."
            className="w-full px-4 py-2 pl-9 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <span className="absolute left-3 top-2.5 text-xs text-white/40">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-white/40 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3D Globe & Active Story Viewer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 3D Globe Viewer */}
        <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-white/10 bg-[#020208] shadow-2xl relative min-h-[500px]">
          <WebGLGlobeViewer
            initialView="standard"
            height="560px"
            selectedCountry={selectedStory?.country || null}
            onCountrySelect={country => {
              if (country) {
                const match = stories.find(s => s.country.toLowerCase() === country.toLowerCase());
                if (match) setSelectedStory(match);
              }
            }}
          />

          {/* Map Overlay Stats */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-cyan-300">
              ● {filteredStories.length} Live Geocoded Markers
            </div>
            <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/60">
              Rotatable 3D WebGL
            </div>
          </div>
        </div>

        {/* Right: Selected Story Spotlight Drawer */}
        <div className="lg:col-span-4 space-y-4">
          {selectedStory ? (
            <div className="p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-white/[0.04] to-black/80 shadow-2xl space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider">
                  📍 {selectedStory.city}, {selectedStory.country}
                </span>
                <span className="text-[11px] font-mono text-white/50">
                  {formatTimeAgo(selectedStory.publishedAt)}
                </span>
              </div>

              {/* Headline */}
              <h3 className="text-lg font-black text-white leading-snug">
                {selectedStory.title}
              </h3>

              {/* Factual Summary */}
              <p className="text-xs text-white/70 leading-relaxed">
                {selectedStory.summary}
              </p>

              {/* Verified Source Attribution */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 font-mono uppercase text-[10px]">Wire Source:</span>
                  <span className="font-bold text-cyan-400">{selectedStory.source}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 font-mono uppercase text-[10px]">Coordinates:</span>
                  <span className="font-mono text-white/60">
                    {selectedStory.lat.toFixed(2)}°, {selectedStory.lng.toFixed(2)}°
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={selectedStory.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Read Full Article at {selectedStory.source}</span>
                  <span>&rarr;</span>
                </a>

                {selectedStory.countrySlug && selectedStory.countrySlug !== 'global' && (
                  <Link
                    href={`/countries/${selectedStory.countrySlug}/news`}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-xs text-center border border-white/10 transition-colors"
                  >
                    View All {selectedStory.country} News Dispatches &rarr;
                  </Link>
                )}
              </div>

              {/* Related Stories */}
              {selectedStory.relatedStories.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono text-white/40 uppercase block">Related Stories:</span>
                  {selectedStory.relatedStories.map(rel => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => {
                        const target = stories.find(s => s.id === rel.id);
                        if (target) setSelectedStory(target);
                      }}
                      className="w-full text-left p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] text-xs text-white/70 hover:text-white transition-colors block truncate"
                    >
                      &bull; {rel.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] text-center text-white/40 text-xs">
              Select any marker on the map to view verified wire dispatch.
            </div>
          )}
        </div>
      </div>

      {/* Live Dispatches Ticker List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <span>📡</span> Live Wire Markers ({filteredStories.length})
          </h3>
          <span className="text-[11px] text-white/40 font-mono">
            Click to inspect marker on globe
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStories.slice(0, 9).map(story => {
            const isSelected = selectedStory?.id === story.id;
            return (
              <div
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-cyan-400 font-semibold truncate max-w-[65%]">
                    📍 {story.country}
                  </span>
                  <span className="text-white/40 font-mono">
                    {formatTimeAgo(story.publishedAt)}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                  {story.title}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                  <span>Source: {story.source}</span>
                  <span className="text-cyan-400 font-semibold">View Pin &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
