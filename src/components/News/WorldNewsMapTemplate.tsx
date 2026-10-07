import React from 'react';
import Link from 'next/link';
import { WorldNewsMapData, WorldNewsStory } from '@/services/worldNewsService';
import WorldNewsMapClient from './WorldNewsMapClient';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { FEATURED_COUNTRY_SELECTION } from '@/services/gameLandingService';
import {
  SupportedLocale,
  getLocalizedPath,
  getCanonicalUrl,
  getTranslation,
  LOCALES_META,
} from '@/lib/i18n';

export interface WorldNewsTemplateConfig {
  title: string;
  metaDescription: string;
  h1: string;
  badge: string;
  canonicalUrl: string;
  currentRouteSlug: string;
  heroSummary: string;
}

interface WorldNewsMapTemplateProps {
  config: WorldNewsTemplateConfig;
  data: WorldNewsMapData;
  locale?: SupportedLocale;
}

export default function WorldNewsMapTemplate({
  config,
  data,
  locale = 'en',
}: WorldNewsMapTemplateProps) {
  const { stories, totalStories, lastUpdated } = data;
  const dict = getTranslation(locale);
  const meta = LOCALES_META[locale];
  const canonicalUrl = getCanonicalUrl('/' + config.currentRouteSlug, locale);
  const getHref = (path: string) => getLocalizedPath(path, locale);

  // Breadcrumb Schema.org JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: dict.nav.home,
        item: getCanonicalUrl('/', locale),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: config.title,
        item: canonicalUrl,
      },
    ],
  };

  // ItemList & NewsArticle Schema.org JSON-LD for rich Google News indexing
  const newsItemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: config.h1,
    description: config.metaDescription,
    url: config.canonicalUrl,
    numberOfItems: stories.length,
    itemListElement: stories.slice(0, 15).map((story, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'NewsArticle',
        headline: story.title,
        description: story.summary,
        datePublished: story.publishedAt,
        dateModified: story.publishedAt,
        url: story.originalUrl,
        publisher: {
          '@type': 'NewsMediaOrganization',
          name: story.source,
          url: story.originalUrl,
        },
        contentLocation: {
          '@type': 'Place',
          name: `${story.city}, ${story.country}`,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: story.lat,
            longitude: story.lng,
          },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsItemListJsonLd) }}
      />

      <div dir={meta.dir} lang={locale} className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Navigation Breadcrumb & Hero Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link href={getHref('/')} className="hover:text-cyan-400 transition-colors">
              {dict.nav.home}
            </Link>
            <span>/</span>
            <span className="text-white/80 font-medium">{config.badge}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold">
                  {config.badge}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Live Wire Synchronized &bull; {totalStories} Verified Events
                </span>
              </div>

              {/* Single H1 Tag */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {config.h1}
              </h1>

              <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
                {config.heroSummary}
              </p>
            </div>

            {/* Sub-Route Navigation Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/world-news-map"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  config.currentRouteSlug === 'world-news-map'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                🗺️ World News Map
              </Link>
              <Link
                href="/live-world-news"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  config.currentRouteSlug === 'live-world-news'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                🔴 Live World News
              </Link>
              <Link
                href="/world-news"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  config.currentRouteSlug === 'world-news'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                🌐 Global News Hub
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* SECTION 1: INTERACTIVE 3D GLOBE & REAL-TIME NEWS MAP */}
          <section aria-label="Interactive 3D World News Map" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌍</span> Interactive Globe & Live Geocoded Markers
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Rotate the 3D globe to discover real-time dispatches with precise coordinate markers.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 hidden sm:inline-block">
                Last synchronized: {new Date(lastUpdated).toLocaleTimeString()} UTC
              </span>
            </div>

            <WorldNewsMapClient stories={stories} />
          </section>

          {/* SECTION 2: SERVER-RENDERED EXPLANATORY SEO CONTENT (CRITICAL FOR CRAWLERS) */}
          <section aria-label="About the World News Map" className="p-6 sm:p-10 rounded-3xl border border-white/10 bg-white/[0.02] space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>📖</span> How the MooEarth World News Map Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-white/70 leading-relaxed">
              <div className="space-y-2">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5 text-base">
                  <span>📍</span> Precision Geographic Mapping
                </div>
                <p>
                  Every international news dispatch is geocoded to its actual sovereign country and regional municipality.
                  Rather than abstract headline feeds, events are visually contextualized on a true spherical coordinate grid.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5 text-base">
                  <span>📰</span> Uncompromising Source Integrity
                </div>
                <p>
                  MooEarth strictly aggregates verified wire reports from reputable publishers worldwide including Reuters,
                  Associated Press, BBC News, and international desks. We never fabricate events or substitute AI hallucination for original reporting.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5 text-base">
                  <span>⚡</span> Multi-Perspective Global Context
                </div>
                <p>
                  Browse breaking stories across six planetary regions. Cross-reference events with our country atlases,
                  live weather telemetry, and satellite layers to comprehend the geopolitical climate of our living planet.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: SERVER-RENDERED NEWS ARTICLES FEED (SSR Prerendered for Crawlers) */}
          <section aria-label="Verified Global News Dispatches" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>📡</span> Latest Verified World News Dispatches
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Server-rendered dispatches with full source attribution, timestamps, and geographic coordinates.
                </p>
              </div>
              <span className="text-xs font-mono text-white/50">
                Displaying {stories.length} verified reports
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map(story => (
                <article
                  key={story.id}
                  className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Location & Timestamp Meta */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <Link
                        href={`/countries/${story.countrySlug}/news`}
                        className="text-cyan-400 hover:underline font-bold truncate max-w-[70%]"
                      >
                        📍 {story.city}, {story.country}
                      </Link>
                      <time dateTime={story.publishedAt} className="text-white/40">
                        {new Date(story.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </time>
                    </div>

                    {/* Headline */}
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      <a
                        href={story.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {story.title}
                      </a>
                    </h3>

                    {/* Factual Summary */}
                    <p className="text-xs text-white/70 leading-relaxed line-clamp-4">
                      {story.summary}
                    </p>
                  </div>

                  {/* Source Attribution & Outbound Link */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-white/50">
                      Source: <strong className="text-white/90">{story.source}</strong>
                    </span>
                    <a
                      href={story.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <span>Read Original</span>
                      <span>&rarr;</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* SECTION 4: COUNTRY NEWS HUBS DIRECTORY */}
          <section aria-label="Country News Directory" className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🏛️</span> Sovereign Country News Desks
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Access dedicated live news feeds for sovereign nations across the globe.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
              {FEATURED_COUNTRY_SELECTION.map(c => (
                <Link
                  key={c.slug}
                  href={`/countries/${c.slug}/news`}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.07] text-center space-y-1 transition-all group"
                >
                  <span className="text-2xl block">{c.flag}</span>
                  <span className="text-xs font-semibold text-white/90 group-hover:text-cyan-300 block truncate">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-cyan-400/80 block font-mono">
                    Live News &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* SECTION 5: RELATED EXPLORATION LINKS */}
          <section aria-label="Related Planetary Explorations" className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">Explore More of MooEarth Live:</span>
            <Link href={getHref('/world-map')} className="text-cyan-400 hover:underline">Interactive World Map</Link>
            <Link href={getHref('/interactive-globe')} className="text-cyan-400 hover:underline">3D Interactive Globe</Link>
            <Link href={getHref('/games')} className="text-cyan-400 hover:underline">Earth Games Hub</Link>
            <Link href={getHref('/geography')} className="text-cyan-400 hover:underline">Physical Geography Atlas</Link>
            <Link href={getHref('/cities')} className="text-cyan-400 hover:underline">World Cities Directory</Link>
            <Link href={getHref('/daily')} className="text-cyan-400 hover:underline">Daily Earth Challenge</Link>
          </section>
        </main>

        <GlobalFooter locale={locale} />
      </div>
    </>
  );
}
