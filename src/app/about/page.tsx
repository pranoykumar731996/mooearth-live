import { Metadata } from 'next';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import PageCloseBar from '@/components/Layout/PageCloseBar';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about MooEarth Live (also known as MooEarth or Moo Earth), the interactive 3D globe platform connecting people to world exploration, geography discovery, and real-time planetary telemetry.',
  alternates: {
    canonical: 'https://www.mooearth.live/about',
  },
  openGraph: {
    title: 'About Us | MooEarth Live',
    description: 'Learn about MooEarth Live (also known as MooEarth or Moo Earth), the interactive 3D globe platform connecting people to world exploration, geography discovery, and real-time planetary telemetry.',
    url: 'https://www.mooearth.live/about',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'About MooEarth Live',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | MooEarth Live',
    description: 'Learn about MooEarth Live (also known as MooEarth or Moo Earth), the interactive 3D globe platform connecting people to world exploration, geography discovery, and real-time planetary telemetry.',
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export default function About() {
  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About MooEarth Live',
    url: 'https://www.mooearth.live/about',
    description: 'Learn about MooEarth Live, the interactive 3D globe and real-time world exploration platform.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
  };

  return (
    <div className="h-screen overflow-y-auto scrollbar-thin bg-[var(--background)] pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <PageCloseBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <div className="max-w-4xl mx-auto bg-[var(--surface-color)]/30 border border-white/5 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden mt-4">
        <div className="p-8 sm:p-12 md:p-16 text-[var(--foreground)] prose prose-invert prose-emerald max-w-none prose-headings:text-emerald-400">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            About MooEarth Live
          </h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Connecting You to Every Country on Earth</h2>
              <p>MooEarth.Live is an interactive global platform designed to help people discover what&apos;s happening anywhere in the world.</p>
              <p>Our mission is simple:</p>
              <p><strong>Touch any country on the globe or search for any nation, and instantly explore its real-time planetary telemetry, meteorological patterns, sports, geography challenges, and cultural insights—all in one place.</strong></p>
              <p>We believe the world should be easier to explore.</p>
              <p>Instead of searching across dozens of websites, MooEarth.Live brings global scientific and geographical information together through an interactive 3D Earth experience.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
              <p>Our mission is to make every country on Earth instantly accessible through spatial information and open planetary telemetry.</p>
              <p>Whether you want to track global earthquakes and space weather, explore another nation&apos;s geography, monitor severe storms, or discover what&apos;s happening across planetary systems in real time, MooEarth.Live helps you experience the world through a single interactive platform.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Why MooEarth.Live Exists</h2>
              <p>Today, finding planetary and geographical information about different countries often means switching between disparate space agency dashboards, weather radars, sports databases, and static atlases.</p>
              <p>We wanted to build something different.</p>
              <p>A place where the Earth itself becomes your navigation.</p>
              <p>Simply rotate the globe, tap any country, or search for its name, and immediately discover what&apos;s happening there.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">What You Can Explore</h2>
              <ul className="list-none space-y-4">
                <li><strong>🌍 Interactive 3D Globe:</strong> Navigate the world seamlessly with cinematic atmosphere shaders, night-time city lights, and high-resolution topological bump mapping.</li>
                <li><strong>🌋 Planetary & Seismic Telemetry:</strong> Track global earthquakes in real time with Richter-scaled shockwaves, focal depth layers, and tectonic fault boundary analysis powered by the USGS.</li>
                <li><strong>🌪️ Severe Storms & Atmospheric Dynamics:</strong> Monitor cyclonic systems, pressure gradients, and extreme meteorological anomalies.</li>
                <li><strong>🚀 Space Weather & Aurora Forecasts:</strong> Real-time solar storm alerts, geomagnetic disturbance indices (Kp 0&ndash;9), and auroral visibility predictions from NOAA SWPC.</li>
                <li><strong>🔥 Wildfire & Thermal Tracking:</strong> View active thermal anomalies and Fire Radiative Power (MW) across global biomes via NASA MODIS and VIIRS satellite sensors.</li>
                <li><strong>🌤️ Meteorological Intelligence:</strong> Access global weather forecasts, precipitation vectors, and air quality indices powered by Open-Meteo.</li>
                <li><strong>⚽ Football & Stadium Visualizations:</strong> Follow international match fixtures, live match states, and 3D stadium locations.</li>
                <li><strong>🎮 Geography & Discovery Games:</strong> Test your knowledge with Flag Quiz, Country Quiz, Capital Quiz, and daily multiplayer challenges.</li>
                <li><strong>🔬 Objective Scientific Briefings:</strong> Access deep, scientifically grounded briefings backed by direct sensor telemetry from international scientific agencies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
              <p>We envision MooEarth.Live becoming the world&apos;s interactive planetary and geographic globe.</p>
              <p>A platform where anyone can explore any country, understand what&apos;s happening there in real time, and experience global environmental phenomena from an intuitive perspective.</p>
              <p>Whether it&apos;s seismic anomalies, severe weather fronts, international football, space weather disturbances, or geographical discovery, our goal is to make the entire world easier to understand.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Our Commitment</h2>
              <p>We are committed to building a fast, reliable, mobile-friendly platform that makes exploring the world simple, engaging, and accessible for everyone.</p>
              <p>Whether you&apos;re monitoring planetary dynamics, exploring a new country, tracking an international match, or expanding your geographical knowledge, MooEarth.Live is your window to the world.</p>
              <p><strong>One Globe. Every Country. Every Discovery.</strong> It&apos;s what we made this interactive platform for.</p>
            </section>
          </div>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}
