import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllContinentSlugs,
  getContinentBySlug,
} from '@/data/continents';
import { getContinentKnowledgeGraph } from '@/lib/seo/knowledgeGraph';
import GlobalFooter from '@/components/Layout/GlobalFooter';

interface ContinentPageProps {
  params: Promise<{
    continent: string;
  }>;
}

export async function generateStaticParams() {
  return getAllContinentSlugs().map(slug => ({
    continent: slug,
  }));
}

export async function generateMetadata({ params }: ContinentPageProps): Promise<Metadata> {
  const { continent: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const continent = getContinentBySlug(decoded);

  if (!continent) {
    return {
      title: 'Continent Not Found | MooEarth Live',
      description: 'The requested continental landmass could not be located in the MooEarth Live atlas.',
      robots: { index: false, follow: false },
    };
  }

  const title = `${continent.name} — Interactive Map, Sovereign Countries & Continental Atlas | MooEarth Live`;
  const description = `Explore ${continent.name} on MooEarth Live. Discover ${continent.countriesCount} sovereign nations, major cities, physical geography (${continent.highestPoint}, ${continent.longestRiver}), and interactive 3D globe visualization.`;
  const canonicalUrl = `https://www.mooearth.live/continents/${continent.slug}`;

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
          alt: `${continent.name} Continental Atlas - MooEarth Live`,
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

export default async function ContinentPage({ params }: ContinentPageProps) {
  const { continent: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const continent = getContinentBySlug(decoded);

  if (!continent) {
    notFound();
  }

  const kg = getContinentKnowledgeGraph(continent);
  const canonicalUrl = `https://www.mooearth.live/continents/${continent.slug}`;

  // Structured Data
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: kg.breadcrumbs.map(b => ({
      '@type': 'ListItem',
      position: b.position,
      name: b.name,
      item: `https://www.mooearth.live${b.href}`,
    })),
  };

  const continentPlaceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Continent',
    name: continent.name,
    description: continent.description,
    url: canonicalUrl,
    containedInPlace: {
      '@type': 'Place',
      name: 'Planet Earth',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(continentPlaceJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        {/* Navigation Breadcrumbs & Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/world-map" className="hover:text-emerald-400 transition-colors">World Map</Link>
            <span>/</span>
            <Link href="/continents" className="hover:text-emerald-400 transition-colors">Continents</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">{continent.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{continent.emoji}</span>
                <div>
                  <span className="text-emerald-400 text-xs font-mono tracking-widest uppercase font-semibold block">
                    Continental Atlas &bull; {continent.countriesCount} Sovereign Nations
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    Surface Area: {continent.areaKm2} &bull; Population: {continent.population}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-400">
                {continent.name} — Continental Atlas & Sovereign Nations
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              {continent.description}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Quick Metrics Bar */}
          <section aria-label="Continental Dimensions" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Surface Area</span>
              <span className="text-base font-bold text-white mt-1 block">{continent.areaKm2}</span>
              <span className="text-[11px] text-white/40 mt-0.5 block">Total Landmass</span>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Population</span>
              <span className="text-base font-bold text-cyan-300 mt-1 block">{continent.population}</span>
              <span className="text-[11px] text-white/40 mt-0.5 block">Estimated Inhabitants</span>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Highest Point</span>
              <span className="text-base font-bold text-white mt-1 block truncate" title={continent.highestPoint}>
                {continent.highestPoint}
              </span>
              <span className="text-[11px] text-white/40 mt-0.5 block">Continental Apex</span>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Longest River</span>
              <span className="text-base font-bold text-white mt-1 block truncate" title={continent.longestRiver}>
                {continent.longestRiver}
              </span>
              <span className="text-[11px] text-white/40 mt-0.5 block">Primary Drainage</span>
            </div>
          </section>

          {/* Member Sovereign Nations Grid */}
          <section aria-label="Sovereign Nations in Continent" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🏛️</span> Sovereign Nations in {continent.name} ({kg.memberCountries.length})
                </h2>
                <p className="text-xs text-white/60">
                  Sovereign countries, administrative capitals, demographics, and localized atlases.
                </p>
              </div>
              <Link href="/world-map" className="text-xs text-emerald-400 hover:underline shrink-0">
                View Full 195 Sovereign Countries Map &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {kg.memberCountries.map(country => (
                <Link
                  key={country.slug}
                  href={`/countries/${country.slug}`}
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all group flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl" role="img" aria-label={`Flag of ${country.name}`}>
                      {country.flag}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">{country.iso2}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                      {country.name}
                    </h3>
                    <p className="text-[11px] text-white/50 truncate">Cap: {country.capital}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">{country.population}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Canonical Cities Located in This Continent */}
          {kg.canonicalCities.length > 0 && (
            <section aria-label="Major Cities in Continent" className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🏙️</span> Major Metropolitan Centers in {continent.name}
                </h2>
                <p className="text-xs text-white/60">
                  Metropolitan hubs with real-time meteorological observations, coordinates, and urban guides.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kg.canonicalCities.map(city => (
                  <Link
                    key={city.id}
                    href={`/cities/${city.slug}`}
                    className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-white/[0.05] transition-all group flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] uppercase border border-cyan-500/20">
                          {city.isCapital ? 'National Capital' : 'Metropolitan Hub'}
                        </span>
                        <span className="text-white/40 font-mono text-[11px]">{city.countryCode}</span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {city.name}
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">
                        {city.state ? `${city.state}, ` : ''}{city.country}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/40 font-mono">
                      <span>Coordinates: {city.coordinates.lat.toFixed(1)}°, {city.coordinates.lng.toFixed(1)}°</span>
                      <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Regional Climate & Physical Geography Narrative */}
          <section aria-label="Regional Climate and Terrain" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>🏔️</span> Physical Landscape & Atmospheric Dynamics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-white/80 leading-relaxed">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-emerald-300">Geological & Topographical Formations</h3>
                <p>
                  {continent.description} The continental landmass reaches its geographic zenith at {continent.highestPoint}, with drainage basins feeding major river systems such as the {continent.longestRiver}.
                </p>
                <p>
                  Regional sub-divisions include {continent.subregions.join(', ')}, each presenting distinct hydrological cycles and mineral wealth.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-emerald-300">Atmospheric & Climate Systems</h3>
                <p>
                  {continent.climateOverview}
                </p>
                <p>
                  Atmospheric readings across {continent.name} are monitored continuously through Open-Meteo numerical weather telemetry stations.
                </p>
              </div>
            </div>
          </section>

          {/* Interactive Earth Games & Quizzes */}
          <section aria-label="Continental Quizzes" className="p-6 sm:p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 via-black to-blue-950/20 space-y-4">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider block mb-1">Interactive Earth Gaming</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Play {continent.name} Geography Challenges</h2>
              <p className="text-xs text-white/60">Test your planetary literacy across {continent.name} flags, capitals, and geopolitical borders.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {kg.relatedGames.map(game => (
                <Link
                  key={game.href}
                  href={game.href}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-purple-400/50 hover:bg-white/[0.06] transition-all group space-y-1"
                >
                  <div className="text-2xl mb-1">{game.emoji}</div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-white/50">{game.subtitle}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Sibling Continents Directory */}
          <section aria-label="Other Continents" className="space-y-4">
            <h2 className="text-xl font-bold text-white">Explore Other Continents</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {kg.siblingContinents.map(sib => (
                <Link
                  key={sib.slug}
                  href={`/continents/${sib.slug}`}
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-white/[0.05] transition-all group flex flex-col justify-between space-y-2 text-center"
                >
                  <span className="text-2xl">{sib.emoji}</span>
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {sib.name}
                    </h3>
                    <span className="text-[10px] text-white/40 block mt-0.5">{sib.countriesCount} Countries</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Internal Navigation Links */}
          <section className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">More Global Portals:</span>
            <Link href="/world-map" className="text-emerald-400 hover:underline">Interactive World Map</Link>
            <Link href="/continents" className="text-emerald-400 hover:underline">All Continents Directory</Link>
            <Link href="/geography" className="text-emerald-400 hover:underline">World Geography Hub</Link>
            <Link href="/weather-map" className="text-emerald-400 hover:underline">Global 3D Weather Map</Link>
            <Link href="/world-news-map" className="text-emerald-400 hover:underline">World News Map</Link>
            <Link href="/games" className="text-emerald-400 hover:underline">Geography Games Hub</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
