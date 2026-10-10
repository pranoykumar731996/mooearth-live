// ============================================================
// MooEarth Live — Weather Regional News Integration
// ============================================================
// Displays live verified news articles for the selected country/region.
// Connects weather location telemetry with MooEarth's news engine
// while strictly maintaining data pipeline independence.

'use client';

import React, { useEffect, useState } from 'react';
import type { WorldEvent } from '@/types';

interface WeatherNewsSectionProps {
  country?: string | null;
  locationName?: string | null;
  className?: string;
}

export default function WeatherNewsSection({
  country,
  locationName,
  className = '',
}: WeatherNewsSectionProps) {
  const [news, setNews] = useState<WorldEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country && !locationName) {
      setNews([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const allEvents: WorldEvent[] = data.events || [];
        const target = (country || locationName || '').toLowerCase().trim();

        // Match by country or location name
        const matched = allEvents.filter((ev) => {
          const evCountry = (ev.country || '').toLowerCase();
          const evTitle = (ev.title || '').toLowerCase();
          return evCountry.includes(target) || target.includes(evCountry) || evTitle.includes(target);
        });

        // If no direct country match, pick general world events
        setNews(matched.length > 0 ? matched.slice(0, 4) : allEvents.slice(0, 3));
      })
      .catch(() => {
        if (isMounted) setNews([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [country, locationName]);

  if (!country && !locationName) return null;

  return (
    <div className={`mt-4 pt-4 border-t border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white/90">
          <span>📰</span>
          <span>Regional News & Earth Events</span>
        </div>
        <span className="text-[10px] text-white/40 font-mono">
          {country || locationName}
        </span>
      </div>

      {/* Pipeline Independence Notice */}
      <p className="text-[10px] text-white/35 leading-tight mb-3">
        Independent telemetry: Meteorological data and news articles originate from distinct automated data streams.
      </p>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-2">
          <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
        </div>
      )}

      {/* Articles List */}
      {!loading && news.length > 0 && (
        <div className="space-y-2">
          {news.map((item) => {
            const articleUrl = `/news?country=${encodeURIComponent(item.country || '')}`;
            return (
              <a
                key={item.id}
                href={articleUrl}
                className="block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all group"
              >
                <div className="text-xs font-semibold text-white/90 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug mb-1">
                  {item.title}
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/45">
                  <span className="truncate max-w-[150px]">{item.source || 'Verified Source'}</span>
                  <span className="text-cyan-400/70 font-mono group-hover:text-cyan-300">
                    Explore News →
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {!loading && news.length === 0 && (
        <div className="text-center py-3 text-[11px] text-white/30">
          No live events currently cataloged for this region.
        </div>
      )}
    </div>
  );
}
