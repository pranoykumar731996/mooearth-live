import { Metadata } from 'next';
import Link from 'next/link';
import InteractiveWorldMapAtlas from '@/components/Map/InteractiveWorldMapAtlas';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { generateHreflangs } from '@/lib/i18n';

const pageTitle = 'Interactive World Map — Explore Countries & Continents';
const fullTitle = 'Interactive World Map — Explore Countries & Continents | MooEarth Live';
const description = 'Navigate every country, continent, and territory on our interactive world map. Search sovereign nations, discover capitals, and explore live international insights.';

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/world-map',
    languages: generateHreflangs('/world-map'),
  },
  openGraph: {
    title: fullTitle,
    description,
    url: 'https://www.mooearth.live/world-map',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live — Interactive World Map',
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

export default function WorldMapPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'World Map', item: 'https://www.mooearth.live/world-map' },
    ],
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    url: 'https://www.mooearth.live/world-map',
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
    about: {
      '@type': 'Thing',
      name: 'Interactive World Map and Continental Atlas',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        {/* Navigation Breadcrumbs & Hero Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">World Map</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-emerald-400 text-xs font-mono tracking-widest uppercase font-semibold block mb-1">
                Global Cartographic Atlas
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-400">
                Interactive World Map & Country Atlas
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Filter by continent, search capitals, and explore sovereign states with live demographic intelligence.
            </p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Interactive Map Atlas Component */}
          <section aria-label="Interactive World Map Explorer">
            <InteractiveWorldMapAtlas initialRegion="All" />
          </section>

          {/* Regional Continental Breakdown */}
          <section className="space-y-6 pt-6 border-t border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white">Major Continental Regions & Cartography</h2>
              <p className="text-xs text-white/60">Overview of the primary geographic landmasses across Earth.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-2xl mb-2 block">🌍</span>
                <h3 className="text-base font-bold text-white mb-1">Africa & Europe</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Home to over 100 sovereign states spanning the Mediterranean, Sahara, European plains, and the Great Rift Valley. High density of diverse languages, legal traditions, and historic capitals.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-2xl mb-2 block">🌏</span>
                <h3 className="text-base font-bold text-white mb-1">Asia & Oceania</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  The most populous continental sphere, encompassing the Himalayas, vast archipelagos of Southeast Asia, the Pacific Rim, and the Australian continent.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-2xl mb-2 block">🌎</span>
                <h3 className="text-base font-bold text-white mb-1">The Americas</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Stretching from the Canadian Arctic across the Rocky Mountains, Central American isthmus, and Amazon Basin down to Tierra del Fuego in Argentina.
                </p>
              </div>
            </div>
          </section>

          {/* Cross-Platform Navigation & Related Hubs */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Prefer 3D Spherical Navigation?</h3>
              <p className="text-xs text-white/60 mt-0.5">
                Switch to the full 3D WebGL globe to view Earth with realistic planetary curvature and day/night cycles.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/globe"
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
              >
                Launch 3D Globe &rarr;
              </Link>
              <Link
                href="/geography"
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white/80 hover:text-white text-xs transition-colors"
              >
                World Geography &rarr;
              </Link>
            </div>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
