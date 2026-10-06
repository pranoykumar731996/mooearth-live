import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCountryBySlug } from '@/data/countries';
import { fetchNewsForCountry } from '@/services/countryNewsService';
import { shouldIndexCountryIntentPage } from '@/lib/seo/countryIntentQualityGate';
import GlobalFooter from '@/components/Layout/GlobalFooter';

interface CountryNewsPageProps {
  params: Promise<{
    country: string;
  }>;
}

export async function generateMetadata({ params }: CountryNewsPageProps): Promise<Metadata> {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    return {
      title: 'Country Not Found | MooEarth Live',
      description: 'The requested sovereign nation could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const newsResult = await fetchNewsForCountry(country.name);
  const gateResult = shouldIndexCountryIntentPage(country.slug, 'news', newsResult);

  const title = `${country.name} News & Live Updates — Verified Wire Dispatches | MooEarth Live`;
  const description = `Read real-time, verified news dispatches and breaking stories from ${country.name} (${country.capital}). Direct source attributions, timestamps, and live regional context.`;
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/news`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: gateResult.robotsDirective,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${country.name} News - MooEarth Live`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.mooearth.live/icons/icon-512.png'],
    },
  };
}

export default async function CountryNewsPage({ params }: CountryNewsPageProps) {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    notFound();
  }

  const newsResult = await fetchNewsForCountry(country.name);
  const { articles, isTemporaryError } = newsResult;
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/news`;

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
        name: 'World Map',
        item: 'https://www.mooearth.live/world-map',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: country.name,
        item: `https://www.mooearth.live/countries/${country.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'News',
        item: canonicalUrl,
      },
    ],
  };

  // CollectionPage JSON-LD
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${country.name} Live News & Global Dispatches`,
    description: `Real-time news stories and media wire coverage for ${country.name}.`,
    url: canonicalUrl,
    about: {
      '@type': 'Country',
      name: country.name,
    },
    hasPart: articles.slice(0, 10).map((art, idx) => ({
      '@type': 'NewsArticle',
      position: idx + 1,
      headline: art.title,
      description: art.summary,
      url: art.originalUrl,
      datePublished: art.publishedAt,
      publisher: {
        '@type': 'Organization',
        name: art.source,
      },
      contentLocation: {
        '@type': 'Place',
        name: art.location,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Header & Breadcrumb */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/world-map" className="hover:text-cyan-400 transition-colors">World Map</Link>
            <span>/</span>
            <Link href={`/countries/${country.slug}`} className="hover:text-cyan-400 transition-colors">{country.name}</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">News</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl" role="img" aria-label={`Flag of ${country.name}`}>{country.flag}</span>
                <div>
                  <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase font-semibold block">
                    Verified News Desk &bull; {country.region}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    {articles.length} Live Stories Logged &bull; Capital: {country.capital}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {country.name} News & Live Global Dispatches
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Real-time verified journalism from credible news agencies covering politics, economy, tech, and cultural events across {country.name}.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-8 flex-1">
          {/* Quick Intent Navigation Pill Bar */}
          <nav aria-label="Country Intent Navigation" className="flex flex-wrap items-center gap-2 text-xs border-b border-white/5 pb-4">
            <span className="text-white/40 uppercase font-mono text-[10px] mr-1">Explore {country.name}:</span>
            <Link href={`/countries/${country.slug}`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              Overview Atlas
            </Link>
            <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
              📰 News (Active)
            </span>
            <Link href={`/countries/${country.slug}/geography`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🏔️ Geography
            </Link>
            <Link href={`/countries/${country.slug}/weather`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🌤️ Weather
            </Link>
            <Link href={`/countries/${country.slug}/map`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🗺️ 3D Map
            </Link>
            <Link href={`/countries/${country.slug}/quiz`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🎮 Quiz
            </Link>
          </nav>

          {/* Temporary Error Notice if applicable */}
          {isTemporaryError && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
              ⚠️ Upstream news feed temporarily slow. Showing verified dispatch archive.
            </div>
          )}

          {/* Articles Feed */}
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((art) => (
                <article
                  key={art.id}
                  className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono uppercase text-[10px] border border-cyan-500/20 truncate">
                        {art.source}
                      </span>
                      <time dateTime={art.publishedAt} className="text-white/40 font-mono text-[11px] shrink-0">
                        {new Date(art.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>

                    <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {art.title}
                    </h2>

                    <p className="text-sm text-white/70 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-white/40 font-mono text-[11px] flex items-center gap-1">
                      <span>📍</span> {art.location}
                    </span>
                    <a
                      href={art.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                    >
                      Original Source &rarr;
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-4">
              <span className="text-4xl">📡</span>
              <h2 className="text-xl font-bold text-white">No Breaking Wire Dispatches Logged</h2>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                No active news events are currently indexed for {country.name}. Browse global news or inspect neighboring countries.
              </p>
              <Link
                href="/news"
                className="inline-block px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
              >
                Browse Global News Room &rarr;
              </Link>
            </div>
          )}

          {/* Related Navigation */}
          <section className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">More {country.name} Links:</span>
            <Link href={`/countries/${country.slug}/geography`} className="text-cyan-400 hover:underline">Physical Geography</Link>
            <Link href={`/countries/${country.slug}/weather`} className="text-cyan-400 hover:underline">Live Weather Telemetry</Link>
            <Link href={`/countries/${country.slug}/map`} className="text-cyan-400 hover:underline">Interactive 3D Map</Link>
            <Link href={`/countries/${country.slug}/quiz`} className="text-cyan-400 hover:underline">Geography Quiz Challenge</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
