import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCountryBySlug } from '@/data/countries';
import { shouldIndexCountryIntentPage } from '@/lib/seo/countryIntentQualityGate';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { getContinentForCountry } from '@/data/continents';
import { getCountryKnowledgeGraph, resolveCanonicalCitySlug } from '@/lib/seo/knowledgeGraph';

interface CountryGeographyPageProps {
  params: Promise<{
    country: string;
  }>;
}

export async function generateMetadata({ params }: CountryGeographyPageProps): Promise<Metadata> {
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

  const gateResult = shouldIndexCountryIntentPage(decoded, 'geography', country);

  const title = `${country.name} Geography, Terrain & Natural Landmarks | MooEarth Live`;
  const description = `Comprehensive physical geography of ${country.name} (${country.region}). Surface area ${country.areaKm2.toLocaleString()} km², natural landmark (${country.landmark}), climate zones, and spatial topography.`;
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/geography`;

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
          alt: `${country.name} Geography - MooEarth Live`,
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

export default async function CountryGeographyPage({ params }: CountryGeographyPageProps) {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    notFound();
  }

  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/geography`;
  const continent = getContinentForCountry(country);
  const kg = getCountryKnowledgeGraph(country);

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
        name: continent.name,
        item: `https://www.mooearth.live/continents/${continent.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: country.name,
        item: `https://www.mooearth.live/countries/${country.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: 'Geography',
        item: canonicalUrl,
      },
    ],
  };

  // Place & Landform JSON-LD
  const placeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Landform',
    name: `${country.name} Physical Geography`,
    description: country.geography,
    url: canonicalUrl,
    containedInPlace: {
      '@type': 'Country',
      name: country.name,
      identifier: country.id,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: country.coordinates.lat,
      longitude: country.coordinates.lng,
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Surface Area',
        value: `${country.areaKm2.toLocaleString()} km²`,
      },
      {
        '@type': 'PropertyValue',
        name: 'Natural Landmark',
        value: country.landmark,
      },
      {
        '@type': 'PropertyValue',
        name: 'Climate Classification',
        value: country.climate,
      },
      {
        '@type': 'PropertyValue',
        name: 'Capital City',
        value: country.capital,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Header & Breadcrumb */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4 flex-wrap">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/world-map" className="hover:text-cyan-400 transition-colors">World Map</Link>
            <span>/</span>
            <Link href={`/continents/${continent.slug}`} className="hover:text-cyan-400 transition-colors">{continent.name}</Link>
            <span>/</span>
            <Link href={`/countries/${country.slug}`} className="hover:text-cyan-400 transition-colors">{country.name}</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">Geography</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl" role="img" aria-label={`Flag of ${country.name}`}>{country.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/continents/${continent.slug}`}
                      className="text-cyan-400 hover:text-cyan-300 text-xs font-mono tracking-widest uppercase font-semibold transition-colors"
                    >
                      {continent.name} Atlas
                    </Link>
                    <span className="text-white/20">&bull;</span>
                    <span className="text-xs text-white/40 font-mono">{country.subregion}</span>
                  </div>
                  <span className="text-xs text-white/40 font-mono">
                    Surface Area: {country.areaKm2.toLocaleString()} km² &bull; GPS Centroid: {country.coordinates.lat.toFixed(2)}°, {country.coordinates.lng.toFixed(2)}°
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {country.name} Geography, Terrain & Natural Landmarks
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Complete physical landform profile for {country.name}. Explore topographical features, climate belts, natural boundaries, and planetary records.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Quick Intent Navigation Pill Bar */}
          <nav aria-label="Country Intent Navigation" className="flex flex-wrap items-center gap-2 text-xs border-b border-white/5 pb-4">
            <span className="text-white/40 uppercase font-mono text-[10px] mr-1">Explore {country.name}:</span>
            <Link href={`/countries/${country.slug}`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              Overview Atlas
            </Link>
            <Link href={`/countries/${country.slug}/news`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              📰 News
            </Link>
            <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
              🏔️ Geography (Active)
            </span>
            <Link href={`/countries/${country.slug}/weather`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🌤️ Weather
            </Link>
            <Link href={`/countries/${country.slug}/map`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🗺️ 3D Map
            </Link>
            <Link href={`/countries/${country.slug}/quiz`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🎮 Quiz
            </Link>
            <Link href={`/continents/${continent.slug}`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🌍 {continent.name} Hub
            </Link>
          </nav>

          {/* Key Geographic Dimensions Grid */}
          <section aria-label="Geographic Dimension Metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Total Area</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {country.areaKm2.toLocaleString()} km²
              </span>
              <span className="text-[11px] text-white/40 mt-1 block">Sovereign land & inland waters</span>
            </div>
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Capital City</span>
              <span className="text-xl font-bold text-white mt-1 block truncate">
                {country.capital}
              </span>
              <span className="text-[11px] text-white/40 mt-1 block">Administrative seat</span>
            </div>
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Continental Region</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {country.region}
              </span>
              <span className="text-[11px] text-white/40 mt-1 block">{country.subregion}</span>
            </div>
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">GPS Coordinates</span>
              <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
                {country.coordinates.lat.toFixed(2)}°, {country.coordinates.lng.toFixed(2)}°
              </span>
              <span className="text-[11px] text-white/40 mt-1 block">Geometric centroid</span>
            </div>
          </section>

          {/* Physical Landscapes & Terrain Narrative */}
          <section aria-label="Physical Landscape Analysis" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🏔️</span> Physical Terrain & Landscape Systems
              </h2>
              <p className="text-base text-white/80 leading-relaxed">
                {country.geography}
              </p>
              <div className="pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-white/40 block font-mono text-[10px] uppercase">Climate Classification</span>
                  <span className="text-white font-semibold text-sm block">{country.climate}</span>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-white/40 block font-mono text-[10px] uppercase">Notable Natural Landmark</span>
                  <span className="text-cyan-300 font-semibold text-sm block">{country.landmark}</span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-950/20 to-purple-950/20 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block mb-1">Geographic Fact</span>
                <h3 className="text-lg font-bold text-white mb-2">Did You Know?</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  {country.funFact}
                </p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <Link
                  href="/world-geography"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  Explore Planetary Extremes &rarr;
                </Link>
              </div>
            </div>
          </section>

          {/* Major Urban & Demographic Centers */}
          <section aria-label="Major Urban Centers" className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>🏙️</span> Major Geographic & Metropolitan Hubs
              </h2>
              <p className="text-xs text-white/60">
                Primary demographic, industrial, and administrative centers distributed across {country.name}.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {country.majorCities.map((city, idx) => {
                const canonicalCitySlug = resolveCanonicalCitySlug(city);
                if (canonicalCitySlug) {
                  return (
                    <Link
                      key={city}
                      href={`/cities/${canonicalCitySlug}`}
                      className="group p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-cyan-500/50 flex flex-col justify-between space-y-2 transition-all shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-cyan-400 uppercase">
                            {idx === 0 ? 'Capital City' : 'Metropolitan Hub'}
                          </span>
                          <span className="text-[10px] text-cyan-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors mt-1">{city}</h3>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono">Explore City Atlas</span>
                    </Link>
                  );
                }

                return (
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
                );
              })}
            </div>
          </section>

          {/* Neighboring Sovereign Borders & Continental Atlas */}
          <section aria-label="Bordering Nations" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌐</span> Regional Boundaries & Neighbors in {country.region}
                </h2>
                <p className="text-xs text-white/60">
                  Bordering sovereign states and maritime partners sharing geographic borders with {country.name}.
                </p>
              </div>
              <Link
                href={`/continents/${continent.slug}`}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono tracking-wider transition-colors inline-flex items-center gap-1 shrink-0"
              >
                {continent.name} Continental Atlas &rarr;
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/continents/${continent.slug}`}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-semibold text-emerald-300 flex items-center gap-1.5"
              >
                <span>🌍</span> Entire {continent.name} Continental Atlas &rarr;
              </Link>
              {country.relatedSlugs.map(slug => (
                <Link
                  key={slug}
                  href={`/countries/${slug}/geography`}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-colors text-xs font-semibold text-white/90"
                >
                  {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Geography &rarr;
                </Link>
              ))}
            </div>
          </section>

          {/* Knowledge Graph Internal Links */}
          <section className="pt-8 border-t border-white/10 space-y-5">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">Contextual Knowledge Graph</span>
              <h2 className="text-base font-bold text-white">Connected Portals for {country.name}</h2>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Link href={`/countries/${country.slug}`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🏛️ Overview Atlas
              </Link>
              <Link href={`/countries/${country.slug}/news`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                📰 Live News Dispatches
              </Link>
              <Link href={`/countries/${country.slug}/weather`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🌤️ Live Weather
              </Link>
              <Link href={`/countries/${country.slug}/map`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🗺️ Interactive 3D Map
              </Link>
              <Link href={`/countries/${country.slug}/quiz`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🎮 Quiz Challenge
              </Link>
              <Link href={`/games/geography/${country.slug}`} className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors">
                🎯 {country.name} Game
              </Link>
              <Link href={`/continents/${continent.slug}`} className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors">
                🌍 {continent.name} Hub
              </Link>
            </div>

            {kg.canonicalCities.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-white/50 font-mono block mb-2">Major Canonical Cities in {country.name}:</span>
                <div className="flex flex-wrap gap-2">
                  {kg.canonicalCities.map(({ city, href, isCapital }) => (
                    <Link
                      key={city.slug}
                      href={href}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 text-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>📍</span> {city.name} {isCapital && <span className="text-[10px] text-cyan-400 font-mono">(Capital)</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
