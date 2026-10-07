import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getAllContinents } from '@/data/continents';
import GlobalFooter from '@/components/Layout/GlobalFooter';

export const metadata: Metadata = {
  title: 'Continents of the World — Global Continental Atlas | MooEarth Live',
  description: 'Explore the 7 continents of planet Earth on MooEarth Live. Comprehensive physical geography, sovereign country directories, major cities, and interactive 3D globe visualization.',
  alternates: {
    canonical: 'https://www.mooearth.live/continents',
  },
  openGraph: {
    title: 'Continents of the World — Global Continental Atlas | MooEarth Live',
    description: 'Explore the 7 continents of planet Earth on MooEarth Live. Discover member nations, major cities, topography, and real-time planetary telemetry.',
    url: 'https://www.mooearth.live/continents',
    type: 'website',
    images: [{ url: 'https://www.mooearth.live/icons/icon-512.png', width: 512, height: 512, alt: 'Continents of the World' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Continents of the World — Global Continental Atlas | MooEarth Live',
    description: 'Explore the 7 continents of planet Earth on MooEarth Live.',
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export default function ContinentsIndexPage() {
  const continents = getAllContinents();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'World Map', item: 'https://www.mooearth.live/world-map' },
      { '@type': 'ListItem', position: 3, name: 'Continents', item: 'https://www.mooearth.live/continents' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        {/* Navigation Breadcrumb & Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/world-map" className="hover:text-emerald-400 transition-colors">World Map</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">Continents</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-emerald-400 text-xs font-mono tracking-widest uppercase font-semibold block mb-1">
                Planetary Landmass Directory
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-400">
                Continents of the World
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Explore Earth’s 7 primary continental landmasses. Sovereign country registries, physical landforms, demographic centers, and interactive cartography.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Quick Hub Navigation */}
          <nav aria-label="Global Atlas Navigation" className="flex flex-wrap items-center gap-2 text-xs border-b border-white/5 pb-4">
            <span className="text-white/40 uppercase font-mono text-[10px] mr-1">Global Atlases:</span>
            <Link href="/world-map" className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🗺️ Interactive World Map
            </Link>
            <Link href="/globe" className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🌍 3D Spherical Globe
            </Link>
            <Link href="/geography" className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🏔️ Geography Hub
            </Link>
            <Link href="/world-geography" className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🧭 Planetary Extremes
            </Link>
            <Link href="/games" className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🎮 Geography Games
            </Link>
          </nav>

          {/* Continents Grid */}
          <section aria-label="Continents Directory" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {continents.map(continent => (
              <Link
                key={continent.slug}
                href={`/continents/${continent.slug}`}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all group flex flex-col justify-between space-y-4 shadow-lg shadow-black/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{continent.emoji}</span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      {continent.countriesCount} Sovereign Countries
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {continent.name}
                  </h2>
                  <p className="text-xs text-white/70 mt-2 line-clamp-3 leading-relaxed">
                    {continent.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] text-white/60 font-mono">
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase">Surface Area</span>
                    <span className="text-white font-semibold">{continent.areaKm2}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase">Population</span>
                    <span className="text-white font-semibold">{continent.population}</span>
                  </div>
                  <div className="col-span-2 pt-1 flex items-center justify-between text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span className="text-xs font-sans font-semibold">Inspect Continental Atlas</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </section>

          {/* Contextual Planetary Links */}
          <section className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">Related Directories:</span>
            <Link href="/world-map" className="text-emerald-400 hover:underline">195 Sovereign Countries Map</Link>
            <Link href="/weather-map" className="text-emerald-400 hover:underline">Global 3D Weather Map</Link>
            <Link href="/world-news-map" className="text-emerald-400 hover:underline">World News Map</Link>
            <Link href="/world-events" className="text-emerald-400 hover:underline">Major World Events</Link>
            <Link href="/daily" className="text-emerald-400 hover:underline">Daily Earth Challenge</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
