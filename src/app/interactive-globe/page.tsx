import { Metadata } from 'next';
import Link from 'next/link';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { generateHreflangs } from '@/lib/i18n';

const pageTitle = 'Interactive 3D Globe Simulator & Virtual Earth';
const fullTitle = 'Interactive 3D Globe Simulator & Virtual Earth | MooEarth Live';
const description = 'Experience the interactive 3D globe simulator on MooEarth Live. Toggle day/night layers, track live global events, inspect coordinates, and explore the virtual Earth.';

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/interactive-globe',
    languages: generateHreflangs('/interactive-globe'),
  },
  openGraph: {
    title: fullTitle,
    description,
    url: 'https://www.mooearth.live/interactive-globe',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live — Interactive Globe Simulator',
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

export default function InteractiveGlobeSimulatorPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Interactive Globe', item: 'https://www.mooearth.live/interactive-globe' },
    ],
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    url: 'https://www.mooearth.live/interactive-globe',
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
    about: {
      '@type': 'Thing',
      name: 'Virtual Earth 3D Simulation and Interactive Coordinate Telemetry',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-purple-500 selection:text-white">
        {/* Navigation Breadcrumbs & Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">Interactive Globe</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-purple-400 text-xs font-mono tracking-widest uppercase font-semibold block mb-1">
                Real-Time 3D Simulation Engine
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-400">
                Interactive 3D Globe Simulator & Virtual Earth
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Toggle day/night orbital layers, simulate real-time Earth telemetry, and inspect spatial coordinates in high definition.
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Main 3D Simulator Viewport */}
          <section aria-label="Interactive 3D Globe Simulation Engine" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between text-xs text-white/60 gap-2">
              <span className="flex items-center gap-1.5 font-semibold text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                Multi-Layer Telemetry Active
              </span>
              <span>Hardware-accelerated WebGL shader pipeline &bull; 60 FPS target</span>
            </div>
            <WebGLGlobeViewer height="640px" initialView="night" />
          </section>

          {/* Simulator Layer Architecture Features */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Geospatial Simulation Layers</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold mb-3 text-sm">
                  01
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Standard Spheroid</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  High-fidelity true-color surface imagery showing land masses, topography, vegetation belts, and continental shelf bathymetry.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-3 text-sm">
                  02
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Night Lights</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Composite nocturnal illumination mapping global electrical grids, metropolitan hubs, maritime transport lanes, and oil field flares.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-3 text-sm">
                  03
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Cloud Atmosphere</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Semi-transparent atmospheric cloud cover with Fresnel rim lighting simulating the Rayleigh scattering of sunlight through Earth&apos;s atmosphere.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-3 text-sm">
                  04
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Discovery Pulse</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Color-coded event arcs and real-time pulse beacons visualizing breaking global news, athletic celebrations, and human emotional telemetry.
                </p>
              </div>
            </div>
          </section>

          {/* Technical Specifications Guide */}
          <section className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h2 className="text-xl font-bold text-white">How the 3D Virtual Earth Coordinates Work</h2>
            <div className="space-y-3 text-xs leading-relaxed text-white/70">
              <p>
                Every location on Earth is indexed by a standard geographic coordinate pair: <strong>Latitude (&phi;)</strong> measuring angular distance north or south of the Equator, and <strong>Longitude (&lambda;)</strong> measuring distance east or west of the Prime Meridian in Greenwich, England.
              </p>
              <p>
                MooEarth Live converts these spherical coordinates into 3D Cartesian coordinates (X, Y, Z) using standard trigonometric spherical mapping:
              </p>
              <pre className="p-4 rounded-xl bg-black/60 font-mono text-[11px] text-cyan-300 border border-white/5 overflow-x-auto">
{`x = R * cos(latitude) * sin(longitude)
y = R * sin(latitude)
z = R * cos(latitude) * cos(longitude)`}
              </pre>
              <p>
                This ensures pinpoint accuracy when rendering national borders, cities, event markers, and orbital arcs across the globe.
              </p>
            </div>
          </section>

          {/* Connected Hubs */}
          <section className="pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">Explore Next:</span>
            <Link href="/globe" className="text-cyan-400 hover:underline">3D Globe Hub</Link>
            <Link href="/world-map" className="text-cyan-400 hover:underline">Interactive World Map</Link>
            <Link href="/interactive-world-map" className="text-cyan-400 hover:underline">Clickable World Map</Link>
            <Link href="/play-earth" className="text-cyan-400 hover:underline">Play Earth Game</Link>
            <Link href="/geography" className="text-cyan-400 hover:underline">World Geography</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
