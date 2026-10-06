import { Metadata } from 'next';
import Link from 'next/link';
import InteractiveWorldMapAtlas from '@/components/Map/InteractiveWorldMapAtlas';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { generateHreflangs } from '@/lib/i18n';

const pageTitle = 'Clickable Interactive World Map with Countries';
const fullTitle = 'Clickable Interactive World Map with Countries | MooEarth Live';
const description = 'Filter, click, and explore countries across all 7 continents with our clickable interactive world map. Inspect national borders, capitals, and geographic data in real time.';

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/interactive-world-map',
    languages: generateHreflangs('/interactive-world-map'),
  },
  openGraph: {
    title: fullTitle,
    description,
    url: 'https://www.mooearth.live/interactive-world-map',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live — Clickable Interactive World Map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: fullTitle,
    description,
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export default function InteractiveWorldMapPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Interactive World Map', item: 'https://www.mooearth.live/interactive-world-map' },
    ],
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    url: 'https://www.mooearth.live/interactive-world-map',
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
    about: {
      '@type': 'Thing',
      name: 'Clickable World Map with Country Borders and Demographic Filters',
    },
  };

  const continentStats = [
    { name: 'Asia', countries: '49', population: '4.75 Billion', area: '44.58M km²', largest: 'China / India' },
    { name: 'Africa', countries: '54', population: '1.43 Billion', area: '30.37M km²', largest: 'Nigeria / Algeria' },
    { name: 'Europe', countries: '44', population: '742 Million', area: '10.18M km²', largest: 'Germany / France' },
    { name: 'North America', countries: '23', population: '592 Million', area: '24.71M km²', largest: 'USA / Canada' },
    { name: 'South America', countries: '12', population: '434 Million', area: '17.84M km²', largest: 'Brazil / Argentina' },
    { name: 'Oceania', countries: '14', population: '45 Million', area: '8.52M km²', largest: 'Australia' },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Navigation Breadcrumbs & Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">Interactive World Map</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase font-semibold block mb-1">
                Territorial & Demographic Explorer
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                Clickable Interactive World Map & Country Explorer
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Tap any country to reveal capital cities, population metrics, local flags, and direct links to live data hubs.
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Main Clickable Map Atlas Tool */}
          <section aria-label="Clickable World Map Atlas Tool">
            <InteractiveWorldMapAtlas initialRegion="All" />
          </section>

          {/* Continental Comparative Overview Table */}
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Continental Comparison & Territorial Metrics</h2>
              <p className="text-xs text-white/60">Overview of geographic surface area, population, and sovereign state counts across Earth.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04] text-white/70 font-mono">
                    <th className="p-4">Continent</th>
                    <th className="p-4">Sovereign Nations</th>
                    <th className="p-4">Estimated Population</th>
                    <th className="p-4">Land Surface Area</th>
                    <th className="p-4">Anchor Economies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {continentStats.map(stat => (
                    <tr key={stat.name} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        <span className="text-cyan-400">●</span> {stat.name}
                      </td>
                      <td className="p-4 font-mono">{stat.countries}</td>
                      <td className="p-4 font-mono">{stat.population}</td>
                      <td className="p-4 font-mono">{stat.area}</td>
                      <td className="p-4 text-white/60">{stat.largest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Cartography Information: Mercator vs Spherical Projection */}
          <section className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <h2 className="text-xl font-bold text-white">Flat Map Cartography & Map Projections</h2>
            <p className="text-xs leading-relaxed text-white/70">
              Transforming a three-dimensional sphere onto a two-dimensional plane requires mathematical projection. While the traditional Mercator projection preserves straight rhumb lines for oceanic navigation, it exaggerates the size of high-latitude landmasses (such as Greenland and Antarctica).
            </p>
            <p className="text-xs leading-relaxed text-white/70">
              For spatial balance and comparative understanding, MooEarth Live pairs flat interactive country tables with our true 3D WebGL globe, allowing users to cross-verify real continental proportions against flat interactive lists.
            </p>
          </section>

          {/* Related Links */}
          <section className="pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">Related Hubs:</span>
            <Link href="/world-map" className="text-cyan-400 hover:underline">World Map Hub</Link>
            <Link href="/globe" className="text-cyan-400 hover:underline">3D Globe Hub</Link>
            <Link href="/interactive-globe" className="text-cyan-400 hover:underline">3D Globe Simulator</Link>
            <Link href="/geography" className="text-cyan-400 hover:underline">World Geography Hub</Link>
            <Link href="/games" className="text-cyan-400 hover:underline">Geography Games</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
