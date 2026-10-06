import { Metadata } from 'next';
import Link from 'next/link';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { generateHreflangs } from '@/lib/i18n';
import { COUNTRY_METADATA } from '@/data/questions/countryMetadata';
import { resolveCanonicalSlug } from '@/data/countries';

const pageTitle = 'World Geography Hub — Continents, Countries & Capitals';
const fullTitle = 'World Geography Hub — Continents, Countries & Capitals | MooEarth Live';
const description = 'Master world geography with MooEarth Live. Explore the 7 continents, 5 oceans, sovereign countries, capital cities, and test your knowledge with interactive geography games.';

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/geography',
    languages: generateHreflangs('/geography'),
  },
  openGraph: {
    title: fullTitle,
    description,
    url: 'https://www.mooearth.live/geography',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live — World Geography Hub',
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

export default function GeographyHubPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Geography', item: 'https://www.mooearth.live/geography' },
    ],
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    url: 'https://www.mooearth.live/geography',
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
    about: {
      '@type': 'Thing',
      name: 'World Geography Education and Continental Studies',
    },
  };

  const continents = [
    {
      name: 'Asia',
      emoji: '🌏',
      area: '44,579,000 km²',
      population: '4.75 Billion',
      countries: 49,
      highestPoint: 'Mount Everest (8,848m)',
      longestRiver: 'Yangtze River (6,300 km)',
      description: 'The largest and most populous continent, spanning the Arabian desert, Siberian tundra, and Himalayan peaks.',
    },
    {
      name: 'Africa',
      emoji: '🌍',
      area: '30,370,000 km²',
      population: '1.43 Billion',
      countries: 54,
      highestPoint: 'Mount Kilimanjaro (5,895m)',
      longestRiver: 'Nile River (6,650 km)',
      description: 'The second-largest continent, featuring the Sahara Desert, Congo Basin rainforest, and Great Rift Valley.',
    },
    {
      name: 'Europe',
      emoji: '🌍',
      area: '10,180,000 km²',
      population: '742 Million',
      countries: 44,
      highestPoint: 'Mount Elbrus (5,642m)',
      longestRiver: 'Volga River (3,530 km)',
      description: 'A peninsula of peninsulas bounded by the Atlantic, Arctic, and Mediterranean, dense with historic capitals.',
    },
    {
      name: 'North America',
      emoji: '🌎',
      area: '24,709,000 km²',
      population: '592 Million',
      countries: 23,
      highestPoint: 'Denali (6,190m)',
      longestRiver: 'Mississippi-Missouri (6,275 km)',
      description: 'Extending from the Arctic archipelago to the Isthmus of Panama, encompassing vast plains, lakes, and mountain ranges.',
    },
    {
      name: 'South America',
      emoji: '🌎',
      area: '17,840,000 km²',
      population: '434 Million',
      countries: 12,
      highestPoint: 'Aconcagua (6,961m)',
      longestRiver: 'Amazon River (6,400 km)',
      description: 'Home to the world\'s largest river basin by discharge (Amazon) and the longest continental mountain range (Andes).',
    },
    {
      name: 'Australia & Oceania',
      emoji: '🌏',
      area: '8,525,989 km²',
      population: '45 Million',
      countries: 14,
      highestPoint: 'Puncak Jaya (4,884m)',
      longestRiver: 'Murray River (2,508 km)',
      description: 'An island continent and thousands of Pacific atolls and archipelagos across Polynesia, Micronesia, and Melanesia.',
    },
    {
      name: 'Antarctica',
      emoji: '🧊',
      area: '14,200,000 km²',
      population: '~1,000 – 5,000 (Research Staff)',
      countries: 0,
      highestPoint: 'Vinson Massif (4,892m)',
      longestRiver: 'Onyx River (meltwater)',
      description: 'The southernmost, coldest, driest, and windiest continent, covered by an ice sheet holding 70% of Earth\'s fresh water.',
    },
  ];

  const oceans = [
    { name: 'Pacific Ocean', area: '165.25M km²', maxDepth: 'Mariana Trench (10,994m)', fact: 'Covers over 30% of Earth\'s surface — larger than all land masses combined.' },
    { name: 'Atlantic Ocean', area: '106.46M km²', maxDepth: 'Puerto Rico Trench (8,376m)', fact: 'Separates the Old World from the Americas, containing the Mid-Atlantic Ridge.' },
    { name: 'Indian Ocean', area: '70.56M km²', maxDepth: 'Java Trench (7,290m)', fact: 'Bounded by Asia, Africa, and Australia, crucial for global maritime trade corridors.' },
    { name: 'Southern Ocean', area: '20.33M km²', maxDepth: 'South Sandwich Trench (7,434m)', fact: 'Encircles Antarctica with the Antarctic Circumpolar Current.' },
    { name: 'Arctic Ocean', area: '14.06M km²', maxDepth: 'Molloy Deep (5,550m)', fact: 'The smallest and shallowest ocean, covered by seasonal polar sea ice.' },
  ];

  // Featured Capitals for interactive reference
  const sampleCapitals = [
    { country: 'Japan', capital: 'Tokyo', continent: 'Asia', flag: '🇯🇵' },
    { country: 'France', capital: 'Paris', continent: 'Europe', flag: '🇫🇷' },
    { country: 'United States', capital: 'Washington D.C.', continent: 'North America', flag: '🇺🇸' },
    { country: 'Brazil', capital: 'Brasília', continent: 'South America', flag: '🇧🇷' },
    { country: 'Australia', capital: 'Canberra', continent: 'Oceania', flag: '🇦🇺' },
    { country: 'South Africa', capital: 'Pretoria / Cape Town', continent: 'Africa', flag: '🇿🇦' },
    { country: 'India', capital: 'New Delhi', continent: 'Asia', flag: '🇮🇳' },
    { country: 'Germany', capital: 'Berlin', continent: 'Europe', flag: '🇩🇪' },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        {/* Header & Breadcrumbs */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">Geography</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-emerald-400 text-xs font-mono tracking-widest uppercase font-semibold block mb-1">
                Planetary Geography Portal
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-400">
                World Geography — Continents, Countries & Capitals
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              A comprehensive educational guide to Earth&apos;s landmasses, oceans, sovereign capitals, and interactive geography learning games.
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Section 1: The 7 Continents */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">The Seven Continents of Earth</h2>
              <p className="text-xs text-white/60">Key geographic dimensions, population estimates, and highest physical elevations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {continents.map(continent => (
                <div
                  key={continent.name}
                  className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{continent.emoji}</span>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {continent.countries} Countries
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white">{continent.name}</h3>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">{continent.description}</p>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-xs text-white/70 font-mono">
                    <div className="flex justify-between">
                      <span className="text-white/40">Area:</span>
                      <span className="text-white/90">{continent.area}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Population:</span>
                      <span className="text-white/90">{continent.population}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Peak:</span>
                      <span className="text-emerald-300 truncate max-w-[180px]">{continent.highestPoint}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: The 5 World Oceans */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">The Five World Oceans</h2>
              <p className="text-xs text-white/60">Earth&apos;s interconnected hydrosphere covering 71% of the planetary surface.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {oceans.map(ocean => (
                <div key={ocean.name} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-2">
                  <span className="text-2xl block">🌊</span>
                  <h3 className="text-sm font-bold text-cyan-300">{ocean.name}</h3>
                  <div className="text-[11px] text-white/60 font-mono space-y-1">
                    <div>Area: {ocean.area}</div>
                    <div>Max Depth: {ocean.maxDepth}</div>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed pt-2 border-t border-white/5">
                    {ocean.fact}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Capital Cities Directory */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-white">World Capitals & Sovereign Nations</h2>
                <p className="text-xs text-white/60">Official government seats and administrative capitals across the globe.</p>
              </div>
              <Link href="/world-map" className="text-xs text-emerald-400 hover:underline">
                View all countries &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sampleCapitals.map(item => (
                <Link
                  key={item.country}
                  href={`/countries/${resolveCanonicalSlug(item.country) || item.country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-emerald-500/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">{item.flag}</span>
                    <span className="text-[10px] font-mono text-white/40">{item.continent}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {item.country}
                  </h4>
                  <p className="text-xs text-white/60">Capital: <span className="text-white/90 font-medium">{item.capital}</span></p>
                </Link>
              ))}
            </div>
          </section>

          {/* Section 4: Interactive Geography Games */}
          <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-purple-950/40 border border-emerald-500/30 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider block mb-1">
                  Sharpen Your Knowledge
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Interactive Geography Quizzes & Challenges
                </h2>
                <p className="text-xs sm:text-sm text-white/70 max-w-xl mt-1">
                  Master capital cities, national flags, and geographic coordinates with our gamified learning engines.
                </p>
              </div>

              <Link
                href="/games"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-sm hover:opacity-90 shadow-lg text-center shrink-0 transition-opacity"
              >
                Play Geography Games &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Link href="/daily" className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-400/50 transition-all">
                <span className="text-lg mb-1 block">📅</span>
                <h3 className="text-sm font-bold text-white mb-1">Daily Geography Question</h3>
                <p className="text-[11px] text-white/60">New daily questions curated from worldwide geography curricula.</p>
              </Link>

              <Link href="/play-earth" className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-400/50 transition-all">
                <span className="text-lg mb-1 block">🌐</span>
                <h3 className="text-sm font-bold text-white mb-1">3D Globe Trivia</h3>
                <p className="text-[11px] text-white/60">Answer questions directly pinned to 3D spherical locations on the planet.</p>
              </Link>

              <Link href="/tournament" className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-purple-400/50 transition-all">
                <span className="text-lg mb-1 block">🏆</span>
                <h3 className="text-sm font-bold text-white mb-1">Global Nations Cup</h3>
                <p className="text-[11px] text-white/60">Represent your nation on the worldwide geography leaderboard.</p>
              </Link>
            </div>
          </section>

          {/* Section 5: Related Hubs */}
          <section className="pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">Related Hubs:</span>
            <Link href="/world-geography" className="text-emerald-400 hover:underline">World Geography Atlas & Records</Link>
            <Link href="/world-map" className="text-emerald-400 hover:underline">Interactive World Map</Link>
            <Link href="/interactive-world-map" className="text-emerald-400 hover:underline">Clickable World Map</Link>
            <Link href="/globe" className="text-emerald-400 hover:underline">3D Globe Hub</Link>
            <Link href="/interactive-globe" className="text-emerald-400 hover:underline">3D Globe Simulator</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
