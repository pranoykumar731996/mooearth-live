import React from 'react';
import Link from 'next/link';
import WorldEventsClient from './WorldEventsClient';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { WorldMajorEvent } from '@/services/worldEventsService';

interface WorldEventsTemplateProps {
  currentPath: '/world-events' | '/live-events';
  title: string;
  subtitle: string;
  badgeText: string;
  events: WorldMajorEvent[];
}

export default function WorldEventsTemplate({
  currentPath,
  title,
  subtitle,
  badgeText,
  events,
}: WorldEventsTemplateProps) {
  const canonicalUrl = `https://www.mooearth.live${currentPath}`;

  // Breadcrumbs JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.mooearth.live',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: canonicalUrl,
      },
    ],
  };

  // Structured Data ItemList of Events
  const eventsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description: subtitle,
    url: canonicalUrl,
    numberOfItems: events.length,
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        name: event.title,
        description: event.summary,
        startDate: event.dateTime,
        location: {
          '@type': 'Place',
          name: `${event.location.city}, ${event.location.country}`,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: event.location.lat,
            longitude: event.location.lng,
          },
        },
        organizer: {
          '@type': 'NewsMediaOrganization',
          name: event.source,
          url: event.sourceUrl,
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Navigation & Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80 font-medium">World Events Desk</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold">
                  {badgeText}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Live Wire Synchronized • {events.length} Verified Events
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {title}
              </h1>

              <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            </div>

            {/* Quick Switcher Between Event Routes */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/world-events"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  currentPath === '/world-events'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                🌍 Global Events Hub
              </Link>
              <Link
                href="/live-events"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  currentPath === '/live-events'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                🔴 Live Events Desk
              </Link>
              <Link
                href="/world-news-map"
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
              >
                🗺️ World News Map
              </Link>
              <Link
                href="/weather-map"
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
              >
                🌪️ Weather Map
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Section 1: Interactive 3D WebGL Globe & Event Client */}
          <section aria-label="Interactive 3D World Events Map" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌍</span> Interactive Globe &amp; Geocoded Major Events
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Rotate the 3D globe to discover genuine international developments with verified primary sources.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 hidden sm:inline-block">
                Last synchronized: {new Date().toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC
              </span>
            </div>

            <WorldEventsClient events={events} />
          </section>

          {/* Section 2: Server-Rendered Prerendered Event Articles (For Search Crawlers) */}
          <section
            aria-label="Server-Rendered Verified Global Events"
            className="space-y-6 pt-8 border-t border-white/10"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">
                Live Verified International Event Dispatches
              </h2>
              <p className="text-sm text-white/60">
                Direct primary wire reporting geolocated to sovereign territories with independent publisher attributions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(event => (
                <article
                  key={event.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      📍 {event.location.city}, {event.location.country}
                    </span>
                    <time dateTime={event.dateTime} className="text-[10px] font-mono text-white/40">
                      {new Date(event.dateTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {event.title}
                  </h3>

                  <p className="text-xs text-white/70 line-clamp-3">
                    {event.summary}
                  </p>

                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/60">
                    <strong className="text-cyan-400 block font-mono text-[10px] uppercase">Context:</strong>
                    {event.context}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs border-t border-white/5">
                    <span className="text-[11px] text-white/50">
                      Source: <strong className="text-white/80">{event.source}</strong>
                    </span>
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Verify Article →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Section 3: Server-Rendered Editorial Explanatory Content (SEO Depth) */}
          <section
            aria-label="Global Events Geolocation and Editorial Framework"
            className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6 text-white/80 text-sm leading-relaxed"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Geographic Event Clustering &amp; Source Verification Pipeline
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-cyan-300">
                  Spatial Journalism &amp; Geocoded Event Epicenters
                </h3>
                <p>
                  International developments do not occur in abstract media vacuums—they emerge from physical territories shaped by geography, sovereign borders, and regional infrastructure. MooEarth Live bridges raw wire telemetry with interactive spherical coordinates to represent global happenings on a 3D Earth globe.
                </p>
                <p>
                  Whether tracking geopolitical summits in Brussels, scientific milestones in Tokyo, or agricultural shifts across the Amazon basin, our spatial engine links every development to its geographic epicenter.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-cyan-300">
                  Zero Synthetic Events &amp; Absolute Source Integrity
                </h3>
                <p>
                  MooEarth maintains strict source integrity invariants: zero synthetic, fabricated, or hallucinated events are ever injected into production feeds.
                </p>
                <p>
                  Every headline, date/time timestamp, and geographic marker maps to authentic reporting from established international news agencies including Reuters, the Associated Press, BBC News, and verified institutional wire services.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/60">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-white">Explore Regional Hubs:</span>
                <Link href="/world-news" className="hover:text-cyan-400 underline">Global News Hub</Link>
                <Link href="/weather" className="hover:text-cyan-400 underline">World Weather</Link>
                <Link href="/world-news-map" className="hover:text-cyan-400 underline">World News Map</Link>
                <Link href="/countries/united-states" className="hover:text-cyan-400 underline">United States</Link>
                <Link href="/countries/japan" className="hover:text-cyan-400 underline">Japan</Link>
                <Link href="/countries/germany" className="hover:text-cyan-400 underline">Germany</Link>
              </div>
              <Link href="/live-world-news" className="text-cyan-400 hover:text-cyan-300 font-medium">
                View Live Breaking Wire →
              </Link>
            </div>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
