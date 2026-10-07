import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCountryBySlug } from '@/data/countries';
import { shouldIndexCountryIntentPage } from '@/lib/seo/countryIntentQualityGate';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { getContinentForCountry } from '@/data/continents';
import { getCountryKnowledgeGraph, resolveCanonicalCitySlug } from '@/lib/seo/knowledgeGraph';

interface CountryMapPageProps {
  params: Promise<{
    country: string;
  }>;
}

export async function generateMetadata({ params }: CountryMapPageProps): Promise<Metadata> {
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

  const gateResult = shouldIndexCountryIntentPage(decoded, 'map', country);

  const title = `${country.name} Interactive 3D Map & Satellite Coordinates | MooEarth Live`;
  const description = `Explore ${country.name} on the interactive 3D WebGL globe. Precise geospatial centroid (${country.coordinates.lat.toFixed(2)}°, ${country.coordinates.lng.toFixed(2)}°), capital ${country.capital}, and metropolitan coordinates.`;
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/map`;

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
          alt: `${country.name} Interactive Map - MooEarth Live`,
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

export default async function CountryMapPage({ params }: CountryMapPageProps) {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    notFound();
  }

  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/map`;
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
        name: 'Interactive Map',
        item: canonicalUrl,
      },
    ],
  };

  // Map & Place JSON-LD
  const mapJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Map',
    name: `${country.name} Interactive 3D Geospatial Map`,
    description: `3D WebGL planetary map of ${country.name} centered at latitude ${country.coordinates.lat}, longitude ${country.coordinates.lng}.`,
    url: canonicalUrl,
    about: {
      '@type': 'Country',
      name: country.name,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: country.coordinates.lat,
        longitude: country.coordinates.lng,
      },
    },
  };

  const latCardinal = country.coordinates.lat >= 0 ? 'N' : 'S';
  const lngCardinal = country.coordinates.lng >= 0 ? 'E' : 'W';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mapJsonLd) }}
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
            <span className="text-white/80 font-medium">Interactive Map</span>
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
                    <span className="text-xs text-white/40 font-mono">Geospatial Cartography</span>
                  </div>
                  <span className="text-xs text-white/40 font-mono">
                    Centroid: {Math.abs(country.coordinates.lat).toFixed(2)}°{latCardinal}, {Math.abs(country.coordinates.lng).toFixed(2)}°{lngCardinal} &bull; Capital: {country.capital}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {country.name} Interactive 3D Globe & Map
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Full-scale WebGL spherical visualization. Orbit, inspect terrain topography, rotate view layers, and discover demographic epicenters.
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
            <Link href={`/countries/${country.slug}/news`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              📰 News
            </Link>
            <Link href={`/countries/${country.slug}/geography`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🏔️ Geography
            </Link>
            <Link href={`/countries/${country.slug}/weather`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🌤️ Weather
            </Link>
            <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
              🗺️ 3D Map (Active)
            </span>
            <Link href={`/countries/${country.slug}/quiz`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🎮 Quiz
            </Link>
            <Link href={`/continents/${continent.slug}`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🌍 {continent.name} Hub
            </Link>
          </nav>

          {/* 3D WebGL Globe Stage */}
          <section aria-label="Interactive 3D Globe Viewport" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between text-xs text-white/60 gap-2 px-1">
              <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Planetary Focus: {country.name} ({country.capital})
              </span>
              <span className="font-mono text-[11px] text-white/50">
                WebGL 2.0 Hardware Accelerated &bull; Rotation Enabled
              </span>
            </div>

            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl relative">
              <WebGLGlobeViewer
                height="620px"
                selectedCountry={country.name}
                initialView="standard"
              />
            </div>
          </section>

          {/* Coordinate Telemetry HUD */}
          <section aria-label="Geodetic Coordinate Parameters" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Latitude</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {country.coordinates.lat.toFixed(4)}° {latCardinal}
              </span>
              <span className="text-[11px] text-white/40 mt-1 block">WGS84 Equator offset</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Longitude</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {country.coordinates.lng.toFixed(4)}° {lngCardinal}
              </span>
              <span className="text-[11px] text-white/40 mt-1 block">Prime Meridian offset</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Primary Capital</span>
              <span className="text-xl font-bold text-white mt-1 block truncate">
                {country.capital}
              </span>
              <span className="text-[11px] text-white/40 mt-1 block">Administrative hub</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Territorial Bounds</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {country.areaKm2.toLocaleString()} km²
              </span>
              <span className="text-[11px] text-white/40 mt-1 block">{country.subregion}</span>
            </div>
          </section>

          {/* Major Metropolitan Spatial Reference */}
          <section aria-label="Metropolitan Location Index" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>📍</span> Metropolitan Centers & Cartographic Anchors
            </h2>
            <p className="text-sm text-white/70">
              Key urban hubs across {country.name} rendered on the spherical coordinate projection:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
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
                            {idx === 0 ? '★ Capital' : `City #${idx + 1}`}
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
                    className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-between space-y-2"
                  >
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">
                      {idx === 0 ? '★ Capital' : `City #${idx + 1}`}
                    </span>
                    <span className="text-sm font-bold text-white">{city}</span>
                    <span className="text-[10px] text-white/40 font-mono">{country.name}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Regional Borders & Continental Atlas */}
          <section aria-label="Neighboring Cartographic Links" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌐</span> Regional Map Connectors in {country.region}
                </h2>
                <p className="text-sm text-white/70">
                  Explore 3D globe coordinates for neighboring sovereign nations and continental hubs:
                </p>
              </div>
              <Link
                href={`/continents/${continent.slug}`}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono tracking-wider transition-colors inline-flex items-center gap-1 shrink-0"
              >
                {continent.name} Hub &rarr;
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href={`/continents/${continent.slug}`}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-semibold text-emerald-300 flex items-center gap-1.5"
              >
                <span>🌍</span> {continent.name} Continental Atlas &rarr;
              </Link>
              <Link
                href="/world-map"
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-colors text-xs font-semibold text-white/90 flex items-center gap-1.5"
              >
                <span>🗺️</span> Global World Map &rarr;
              </Link>
              {country.relatedSlugs.map(slug => (
                <Link
                  key={slug}
                  href={`/countries/${slug}/map`}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-colors text-xs font-semibold text-white/90"
                >
                  {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} 3D Map &rarr;
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
              <Link href={`/countries/${country.slug}/geography`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🏔️ Physical Geography
              </Link>
              <Link href={`/countries/${country.slug}/weather`} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 transition-colors">
                🌤️ Live Weather
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
