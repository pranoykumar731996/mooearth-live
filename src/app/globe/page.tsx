import { Metadata } from 'next';
import Link from 'next/link';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { generateHreflangs } from '@/lib/i18n';
import { COUNTRY_METADATA } from '@/data/questions/countryMetadata';
import { resolveCanonicalSlug } from '@/data/countries';

const pageTitle = 'Interactive 3D Globe — Explore Earth in Real Time';
const fullTitle = 'Interactive 3D Globe — Explore Earth in Real Time | MooEarth Live';
const description = 'Explore our living planet on MooEarth Live\'s interactive 3D globe. Rotate the Earth, discover sovereign countries, inspect global events, and test your geography knowledge.';

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/globe',
    languages: generateHreflangs('/globe'),
  },
  openGraph: {
    title: fullTitle,
    description,
    url: 'https://www.mooearth.live/globe',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live — Interactive 3D Globe',
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

export default function GlobeHubPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: '3D Globe', item: 'https://www.mooearth.live/globe' },
    ],
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    url: 'https://www.mooearth.live/globe',
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
    about: {
      '@type': 'Thing',
      name: 'Interactive 3D Earth Globe and Geospatial Visualization',
    },
  };

  // Curated country discovery list across continents
  const featuredCountries = [
    'United States', 'Brazil', 'United Kingdom', 'Germany', 'France',
    'Japan', 'India', 'Australia', 'South Africa', 'Canada',
    'Mexico', 'Argentina', 'South Korea', 'Italy', 'Spain'
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Navigation Breadcrumbs */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">Globe</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase font-semibold block mb-1">
                Virtual Planetary Exploration
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                Interactive 3D Globe & Earth Explorer
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Spin, zoom, and inspect sovereign nations on a true spherical coordinate projection of Earth.
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Section 1: Working 3D Globe */}
          <section aria-label="3D Globe Interactive Viewer" className="space-y-3">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live WebGL Orbit System
              </span>
              <span>Drag to rotate &bull; Scroll to zoom &bull; Click country to target</span>
            </div>
            <WebGLGlobeViewer height="600px" initialView="standard" />
          </section>

          {/* Section 2: Explanation of 3D Earth Exploration */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl font-bold">
                🌐
              </div>
              <h2 className="text-xl font-bold text-white">Spherical Cartography</h2>
              <p className="text-xs leading-relaxed text-white/60">
                Unlike flat 2D maps that introduce Mercator distortions near the poles, MooEarth Live renders Earth on a true 3D spheroid. Continents, oceanic trenches, and geopolitical boundaries preserve realistic proportions and spatial relationships.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl font-bold">
                ☀️
              </div>
              <h2 className="text-xl font-bold text-white">Real-Time Illumination</h2>
              <p className="text-xs leading-relaxed text-white/60">
                Switch between day and night layers to observe Earth&apos;s terminator line and nocturnal city lights. Urban hubs, coastlines, and population density corridors shine vividly against the darkness of deep space.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
                📡
              </div>
              <h2 className="text-xl font-bold text-white">Live Event Telemetry</h2>
              <p className="text-xs leading-relaxed text-white/60">
                The globe plots real-time pulses, international news dispatches, football match reactions, and weather patterns. Tap any sovereign nation on the surface to unlock its localized data stream and cultural insights.
              </p>
            </div>
          </section>

          {/* Section 3: Country Discovery Grid */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-white">Sovereign Country Discovery</h2>
                <p className="text-xs text-white/60">Explore verified profiles, capital cities, and demographic data across continents.</p>
              </div>
              <Link 
                href="/world-map"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 group"
              >
                Browse Full Country Atlas <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {featuredCountries.map(country => {
                const meta = COUNTRY_METADATA[country];
                return (
                  <Link
                    key={country}
                    href={`/countries/${resolveCanonicalSlug(country) || country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{meta?.flag || '🌍'}</span>
                      <span className="text-[10px] text-white/40 uppercase font-mono">{meta?.continent || 'Global'}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{country}</h3>
                      <p className="text-[11px] text-white/50">{meta?.capital ? `Cap: ${meta.capital}` : 'Explore profile'}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Section 4: Interactive Geography Games Showcase */}
          <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-purple-950/40 border border-emerald-500/30 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider block mb-1">
                  Test Your World Knowledge
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Play Earth & Geography Challenges
                </h2>
                <p className="text-xs sm:text-sm text-white/70 max-w-xl mt-1">
                  Combine 3D globe visualization with fast-paced geography quizzes. Identify national flags, capital cities, landmarks, and regional coordinates.
                </p>
              </div>

              <Link
                href="/play-earth"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-sm hover:opacity-90 shadow-lg shadow-emerald-500/20 text-center shrink-0 transition-opacity"
              >
                Launch 3D Trivia &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <Link href="/daily" className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-400/50 transition-all">
                <span className="text-lg mb-1 block">🏆</span>
                <h3 className="text-sm font-bold text-white mb-1">Daily Earth Challenge</h3>
                <p className="text-[11px] text-white/60">Compete in the daily global question set and build an unstoppable streak.</p>
              </Link>

              <Link href="/games" className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-400/50 transition-all">
                <span className="text-lg mb-1 block">🎯</span>
                <h3 className="text-sm font-bold text-white mb-1">Geography Game Hub</h3>
                <p className="text-[11px] text-white/60">Flags, capitals, country shapes, and population ranking mini-games.</p>
              </Link>

              <Link href="/tournament" className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-purple-400/50 transition-all">
                <span className="text-lg mb-1 block">⚔️</span>
                <h3 className="text-sm font-bold text-white mb-1">Global Nations Cup</h3>
                <p className="text-[11px] text-white/60">Weekly tournament bracket battling nations across geographic trivia.</p>
              </Link>

              <Link href="/war-room" className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/50 transition-all">
                <span className="text-lg mb-1 block">🚨</span>
                <h3 className="text-sm font-bold text-white mb-1">Situation War Room</h3>
                <p className="text-[11px] text-white/60">Track breaking planetary crises, weather storms, and global headlines live.</p>
              </Link>
            </div>
          </section>

          {/* Section 5: Planetary Reference & Related Resources */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Planetary Data & Educational Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <span className="text-[10px] text-white/40 block uppercase font-mono">Equatorial Circumference</span>
                <span className="text-base font-bold text-cyan-400 font-mono">40,075 km</span>
                <span className="text-[10px] text-white/50 block mt-1">(24,901 miles)</span>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <span className="text-[10px] text-white/40 block uppercase font-mono">Surface Area</span>
                <span className="text-base font-bold text-cyan-400 font-mono">510.1M km²</span>
                <span className="text-[10px] text-white/50 block mt-1">70.8% Water, 29.2% Land</span>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <span className="text-[10px] text-white/40 block uppercase font-mono">Rotational Velocity</span>
                <span className="text-base font-bold text-cyan-400 font-mono">1,670 km/h</span>
                <span className="text-[10px] text-white/50 block mt-1">At Equator (23.4° Axial Tilt)</span>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <span className="text-[10px] text-white/40 block uppercase font-mono">Sovereign Nations</span>
                <span className="text-base font-bold text-cyan-400 font-mono">195 States</span>
                <span className="text-[10px] text-white/50 block mt-1">193 UN Members + 2 Observers</span>
              </div>
            </div>

            {/* Related Navigation Links */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
              <span className="text-white font-semibold">Related Hubs:</span>
              <Link href="/interactive-globe" className="text-cyan-400 hover:underline">3D Globe Simulator</Link>
              <Link href="/world-map" className="text-cyan-400 hover:underline">Interactive World Map</Link>
              <Link href="/interactive-world-map" className="text-cyan-400 hover:underline">Clickable World Map</Link>
              <Link href="/geography" className="text-cyan-400 hover:underline">World Geography</Link>
              <Link href="/world-geography" className="text-cyan-400 hover:underline">World Geography Atlas</Link>
            </div>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
