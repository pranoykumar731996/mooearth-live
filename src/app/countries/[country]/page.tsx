import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCountryBySlug, getAllCountrySlugs, getCountryByName } from '@/data/countries';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { fallbackEvents } from '@/data/events';

interface CountryPageProps {
  params: Promise<{
    country: string;
  }>;
}

export async function generateStaticParams() {
  return getAllCountrySlugs().map(slug => ({
    country: slug,
  }));
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    return {
      title: 'Country Not Found | MooEarth Live',
      description: 'The requested sovereign nation could not be located in the MooEarth Live country directory.',
    };
  }

  const title = `${country.name} — Interactive Map, Geography & Country Atlas | MooEarth Live`;
  const description = `Explore ${country.name} (${country.capital}, ${country.region}) on MooEarth Live. Discover physical geography, major cities (${country.majorCities.slice(0, 3).join(', ')}), real-time weather, latest news, and interactive 3D globe visualization.`;
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
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
          alt: `${country.name} - MooEarth Live`,
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

export default async function CountryHubPage({ params }: CountryPageProps) {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    notFound();
  }

  // Canonical structured data
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}`;

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
        item: canonicalUrl,
      },
    ],
  };

  const countryPlaceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Country',
    name: country.name,
    alternateName: country.iso3,
    identifier: country.id,
    description: country.geography,
    url: canonicalUrl,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: country.coordinates.lat,
      longitude: country.coordinates.lng,
    },
    containedInPlace: {
      '@type': 'Place',
      name: country.region,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: country.iso2,
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Capital',
        value: country.capital,
      },
      {
        '@type': 'PropertyValue',
        name: 'Population',
        value: country.population,
      },
      {
        '@type': 'PropertyValue',
        name: 'Area',
        value: `${country.areaKm2.toLocaleString()} km²`,
      },
      {
        '@type': 'PropertyValue',
        name: 'Currency',
        value: country.currency,
      },
    ],
  };

  // Find relevant events
  const relevantEvents = fallbackEvents.filter(
    evt =>
      evt.country?.toLowerCase() === country.name.toLowerCase() ||
      evt.title?.toLowerCase().includes(country.name.toLowerCase()) ||
      evt.summary?.toLowerCase().includes(country.name.toLowerCase())
  );

  // Resolve related neighbor country objects
  const relatedCountries = country.relatedSlugs
    .map(slug => getCountryBySlug(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(countryPlaceJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Breadcrumb Navigation & Page Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/world-map" className="hover:text-cyan-400 transition-colors">World Map</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">{country.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl" role="img" aria-label={`Flag of ${country.name}`}>{country.flag}</span>
                <div>
                  <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase font-semibold block">
                    {country.region} &bull; {country.subregion}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    ISO: {country.iso2} / {country.iso3} &bull; ID: {country.id}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {country.name} — Interactive Map, Geography & Country Atlas
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Comprehensive sovereign guide to {country.name}. Explore interactive 3D globe telemetry, physical landscapes, major urban centers, and real-time world events.
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Key Quick Metrics Bar */}
          <section aria-label="Quick Country Facts" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">Capital City</span>
              <span className="text-sm font-bold text-white mt-1 block truncate" title={country.capital}>
                {country.capital}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">Population</span>
              <span className="text-sm font-bold text-cyan-300 mt-1 block">
                {country.population}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">Surface Area</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {country.areaKm2.toLocaleString()} km²
              </span>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">Currency</span>
              <span className="text-sm font-bold text-white mt-1 block truncate" title={country.currency}>
                {country.currency}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">Official Languages</span>
              <span className="text-sm font-bold text-white mt-1 block truncate" title={country.languages}>
                {country.languages}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">Centroid Coordinates</span>
              <span className="text-sm font-mono font-bold text-emerald-400 mt-1 block">
                {country.coordinates.lat.toFixed(2)}°, {country.coordinates.lng.toFixed(2)}°
              </span>
            </div>
          </section>

          {/* Interactive Globe & 3D Spatial Map */}
          <section aria-label="Interactive 3D Globe Viewport" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between text-xs text-white/60 gap-2">
              <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                3D Globe Orbiting: {country.name}
              </span>
              <span>Coordinates: {country.coordinates.lat}&deg; N, {country.coordinates.lng}&deg; E &bull; WebGL Accelerated</span>
            </div>
            <WebGLGlobeViewer
              height="580px"
              selectedCountry={country.name}
              initialView="standard"
            />
          </section>

          {/* Geography & Physical Landscape */}
          <section aria-label="Geography and Landscape" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>🏔️</span> Physical Geography & Terrain
              </h2>
              <p className="text-sm text-white/80 leading-relaxed">
                {country.geography}
              </p>
              <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-white/40 block font-mono text-[10px] uppercase">Climate Classification</span>
                  <span className="text-white/90 font-medium mt-0.5 block">{country.climate}</span>
                </div>
                <div>
                  <span className="text-white/40 block font-mono text-[10px] uppercase">Notable Natural Landmark</span>
                  <span className="text-cyan-300 font-medium mt-0.5 block">{country.landmark}</span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-950/20 to-purple-950/20 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block mb-1">Geographic Fact</span>
                <h3 className="text-base font-bold text-white mb-2">Did You Know?</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  {country.funFact}
                </p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <Link
                  href="/world-geography"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  Explore Planetary Extremes Atlas &rarr;
                </Link>
              </div>
            </div>
          </section>

          {/* Major Cities Directory */}
          <section aria-label="Major Cities" className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>🏙️</span> Major Cities of {country.name}
              </h2>
              <p className="text-xs text-white/60">
                Primary metropolitan centers, administrative districts, and demographic hubs.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {country.majorCities.map((city, idx) => (
                <div
                  key={city}
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-between space-y-2 hover:border-cyan-500/30 transition-all"
                >
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 block uppercase">
                      {idx === 0 ? 'Capital City' : 'Metropolitan Hub'}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{city}</h3>
                  </div>
                  <span className="text-[11px] text-white/40 font-mono">{country.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Live Weather & Climate Conditions */}
          <section aria-label="Weather and Climate" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌤️</span> Climate & Atmospheric Profile
                </h2>
                <p className="text-xs text-white/60">
                  Regional climate conditions centered on {country.capital} ({country.coordinates.lat.toFixed(2)}°, {country.coordinates.lng.toFixed(2)}°).
                </p>
              </div>
              <Link
                href="/weather"
                className="text-xs text-cyan-400 hover:underline shrink-0"
              >
                View Global Weather Map &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-white/40 block text-[10px] font-mono uppercase">Primary Climate Zone</span>
                <span className="text-white font-bold text-sm block">{country.climate}</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-white/40 block text-[10px] font-mono uppercase">Capital Weather Reference</span>
                <span className="text-white font-bold text-sm block">{country.capital} Coordinates</span>
                <span className="text-cyan-300 font-mono">{country.coordinates.lat.toFixed(2)}&deg; N / {country.coordinates.lng.toFixed(2)}&deg; E</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-white/40 block text-[10px] font-mono uppercase">Continent Climate Belt</span>
                <span className="text-white font-bold text-sm block">{country.region} ({country.subregion})</span>
              </div>
            </div>
          </section>

          {/* Latest Relevant Events / News */}
          <section aria-label="Latest News and Events" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>📰</span> Latest News & Live Events in {country.name}
                </h2>
                <p className="text-xs text-white/60">Real-time global news dispatches, cultural events, and technological breakthroughs.</p>
              </div>
              <Link href="/news" className="text-xs text-cyan-400 hover:underline shrink-0">
                View all world news &rarr;
              </Link>
            </div>

            {relevantEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relevantEvents.map(evt => (
                  <div key={evt.id} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono uppercase text-[10px] border border-cyan-500/20">
                        {evt.category}
                      </span>
                      <span className="text-white/40 font-mono text-[10px]">{evt.city || country.name}</span>
                    </div>
                    <h3 className="text-base font-bold text-white hover:text-cyan-300 transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                      {evt.summary}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-2">
                <p className="text-xs text-white/50">
                  No breaking alerts currently logged for {country.name}. Connect with live global feeds or inspect neighboring regional news.
                </p>
                <Link
                  href="/news"
                  className="inline-block text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Explore Global News Dispatch Feed &rarr;
                </Link>
              </div>
            )}
          </section>

          {/* Interactive Earth Games Section */}
          <section aria-label="Country Games and Trivia" className="p-6 sm:p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 via-black to-blue-950/20 space-y-4">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider block mb-1">Gamified Geography</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Play {country.name} Geography Games</h2>
              <p className="text-xs text-white/60">Test your knowledge of {country.name}’s flag, capital, borders, and history.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Link
                href={`/play-earth?country=${encodeURIComponent(country.name)}`}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-400/50 transition-all group"
              >
                <div className="text-2xl mb-1">🎮</div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Play Earth Quiz
                </h3>
                <p className="text-xs text-white/50 mt-1">Play procedural geography trivia centered on {country.name}.</p>
              </Link>

              <Link
                href="/daily"
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-purple-400/50 transition-all group"
              >
                <div className="text-2xl mb-1">📅</div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Daily Challenge
                </h3>
                <p className="text-xs text-white/50 mt-1">Compete against global players in today’s timed world quest.</p>
              </Link>

              <Link
                href="/challenges"
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-400/50 transition-all group"
              >
                <div className="text-2xl mb-1">🏆</div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Flag & Capital Arena
                </h3>
                <p className="text-xs text-white/50 mt-1">Master all 195 sovereign nation flags and world capitals.</p>
              </Link>
            </div>
          </section>

          {/* Related & Neighboring Countries */}
          <section aria-label="Neighboring and Related Countries" className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>🌐</span> Related & Neighboring Countries
              </h2>
              <p className="text-xs text-white/60">Explore bordering nations and regional partners in {country.region}.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {relatedCountries.map(rel => (
                <Link
                  key={rel.slug}
                  href={`/countries/${rel.slug}`}
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all group flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl" role="img" aria-label={`Flag of ${rel.name}`}>{rel.flag}</span>
                    <span className="text-[10px] font-mono text-white/40">{rel.iso2}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {rel.name}
                    </h3>
                    <p className="text-[11px] text-white/50 truncate">Capital: {rel.capital}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Internal Navigation Links */}
          <section className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">More Destinations:</span>
            <Link href="/world-map" className="text-cyan-400 hover:underline">World Map Atlas</Link>
            <Link href="/globe" className="text-cyan-400 hover:underline">3D Globe Explorer</Link>
            <Link href="/interactive-world-map" className="text-cyan-400 hover:underline">Clickable World Map</Link>
            <Link href="/geography" className="text-cyan-400 hover:underline">World Geography Hub</Link>
            <Link href="/world-geography" className="text-cyan-400 hover:underline">Physical Geography Records</Link>
            <Link href="/games" className="text-cyan-400 hover:underline">Geography Games</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
