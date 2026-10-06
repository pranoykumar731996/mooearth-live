import { Metadata } from 'next';
import Link from 'next/link';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { generateHreflangs } from '@/lib/i18n';

const pageTitle = 'World Geography Atlas & Earth Records';
const fullTitle = 'World Geography Atlas & Earth Records | MooEarth Live';
const description = 'Discover world geography records, extreme landforms, physical geography guides, and continental milestones on MooEarth Live. Explore rivers, peaks, deserts, and trivia.';

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/world-geography',
    languages: generateHreflangs('/world-geography'),
  },
  openGraph: {
    title: fullTitle,
    description,
    url: 'https://www.mooearth.live/world-geography',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live — World Geography Atlas',
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

export default function WorldGeographyPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'World Geography', item: 'https://www.mooearth.live/world-geography' },
    ],
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    url: 'https://www.mooearth.live/world-geography',
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
    about: {
      '@type': 'Thing',
      name: 'Physical Geography Atlas, Earth Records, and Geographic Landmarks',
    },
  };

  const extremePeaks = [
    { name: 'Mount Everest', range: 'Himalayas', elevation: '8,848.86 m', location: 'Nepal / China' },
    { name: 'K2', range: 'Karakoram', elevation: '8,611 m', location: 'Pakistan / China' },
    { name: 'Kangchenjunga', range: 'Himalayas', elevation: '8,586 m', location: 'India / Nepal' },
    { name: 'Aconcagua', range: 'Andes', elevation: '6,961 m', location: 'Argentina (Highest in Americas)' },
    { name: 'Denali', range: 'Alaska Range', elevation: '6,190 m', location: 'United States' },
    { name: 'Mount Kilimanjaro', range: 'Eastern Rift', elevation: '5,895 m', location: 'Tanzania (Free-standing volcano)' },
  ];

  const extremeRivers = [
    { name: 'Nile River', length: '6,650 km (4,132 mi)', outflow: 'Mediterranean Sea', continent: 'Africa' },
    { name: 'Amazon River', length: '6,400 km (3,977 mi)', outflow: 'Atlantic Ocean', continent: 'South America (Largest by volume)' },
    { name: 'Yangtze River', length: '6,300 km (3,915 mi)', outflow: 'East China Sea', continent: 'Asia' },
    { name: 'Mississippi-Missouri', length: '6,275 km (3,902 mi)', outflow: 'Gulf of Mexico', continent: 'North America' },
  ];

  const extremeDeserts = [
    { name: 'Antarctic Desert', area: '14.2M km²', type: 'Polar Cold Desert', location: 'Antarctica' },
    { name: 'Arctic Desert', area: '13.9M km²', type: 'Polar Cold Desert', location: 'Northern Polar Region' },
    { name: 'Sahara Desert', area: '9.2M km²', type: 'Subtropical Hot Desert', location: 'North Africa' },
    { name: 'Arabian Desert', area: '2.3M km²', type: 'Subtropical Hot Desert', location: 'Western Asia' },
    { name: 'Gobi Desert', area: '1.3M km²', type: 'Cold Winter Rain Shadow', location: 'China / Mongolia' },
  ];

  const referenceLines = [
    { name: 'The Equator (0° Latitude)', description: 'Divides Northern and Southern Hemispheres; spans 40,075 km across 13 sovereign nations.' },
    { name: 'The Prime Meridian (0° Longitude)', description: 'Passes through Greenwich, London; defines universal Coordinated Universal Time (UTC) reference.' },
    { name: 'Tropic of Cancer (23.4° N)', description: 'Northernmost latitude where the Sun can appear directly overhead at June solstice.' },
    { name: 'Tropic of Capricorn (23.4° S)', description: 'Southernmost latitude where the Sun can appear directly overhead at December solstice.' },
    { name: 'International Date Line (180° Longitude)', description: 'Imaginary boundary zigzagging through the Pacific where calendar day transitions.' },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
        {/* Navigation Breadcrumbs & Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">World Geography Atlas</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-amber-400 text-xs font-mono tracking-widest uppercase font-semibold block mb-1">
                Earth Records & Physical Geography
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-400">
                World Geography Atlas & Earth Records
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              A comprehensive physical geography compendium of planetary extremes, record landforms, and cartographic divisions.
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Section 1: Highest Mountain Summits */}
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Planetary Summits & Major Mountain Ranges</h2>
              <p className="text-xs text-white/60">Earth&apos;s highest continental elevations and tectonic uplift zones.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {extremePeaks.map(peak => (
                <div key={peak.name} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">{peak.range}</span>
                    <h3 className="text-base font-bold text-white">{peak.name}</h3>
                    <p className="text-xs text-white/50">{peak.location}</p>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="text-white/40">Elevation:</span>
                    <span className="font-mono font-bold text-amber-300">{peak.elevation}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Major River Systems */}
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Longest Continental River Systems</h2>
              <p className="text-xs text-white/60">Major fluvial drainage basins shaping human civilization and ecosystems.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {extremeRivers.map(river => (
                <div key={river.name} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                  <span className="text-2xl block">🌊</span>
                  <h3 className="text-base font-bold text-cyan-300">{river.name}</h3>
                  <div className="text-xs text-white/60 space-y-1 font-mono">
                    <div>Length: <strong className="text-white">{river.length}</strong></div>
                    <div>Outflow: {river.outflow}</div>
                    <div className="text-white/40">{river.continent}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Largest Deserts */}
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Largest Global Deserts & Arid Biomes</h2>
              <p className="text-xs text-white/60">Regions receiving less than 250 millimeters of precipitation per year.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {extremeDeserts.map(desert => (
                <div key={desert.name} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1.5">
                  <span className="text-2xl block">🏜️</span>
                  <h3 className="text-sm font-bold text-amber-300">{desert.name}</h3>
                  <div className="text-[11px] font-mono text-white/70">Area: {desert.area}</div>
                  <div className="text-[11px] text-white/50">{desert.type}</div>
                  <div className="text-[10px] text-white/40 pt-1 border-t border-white/5">{desert.location}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Cartographic Reference Coordinates */}
          <section className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h2 className="text-xl font-bold text-white">Key Geographic Lines of Reference</h2>
            <div className="space-y-3">
              {referenceLines.map(line => (
                <div key={line.name} className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-amber-300 font-mono shrink-0">{line.name}</h3>
                  <p className="text-xs text-white/70">{line.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Cross-Navigation */}
          <section className="pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">Related Hubs:</span>
            <Link href="/geography" className="text-amber-400 hover:underline">World Geography Hub</Link>
            <Link href="/world-map" className="text-amber-400 hover:underline">Interactive World Map</Link>
            <Link href="/interactive-world-map" className="text-amber-400 hover:underline">Clickable World Map</Link>
            <Link href="/globe" className="text-amber-400 hover:underline">3D Globe Hub</Link>
            <Link href="/games" className="text-amber-400 hover:underline">Geography Trivia Games</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
