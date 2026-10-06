import { Metadata } from 'next';
import Link from 'next/link';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { generateHreflangs } from '@/lib/i18n';

const title = 'Explore Earth — Discover Places Around the World | MooEarth Live';
const description = 'Explore countries, cities, and locations around the world on MooEarth Live\'s interactive 3D globe. Discover news, weather, sports, and events from any place on Earth.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/explore',
    languages: generateHreflangs('/explore'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/explore',
    type: 'website',
    siteName: 'MooEarth Live',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

// Organize countries by region
const REGIONS: Record<string, string[]> = {
  'Asia': ['India', 'Japan', 'China', 'South Korea'],
  'Europe': ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium', 'Croatia'],
  'Americas': ['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia', 'Uruguay'],
  'Africa & Middle East': ['Morocco', 'Senegal'],
  'Oceania': ['Australia'],
};

export default function ExplorePage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Explore', item: 'https://www.mooearth.live/explore' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030308 0%, #0a1a2e 50%, #030308 100%)',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <header style={{
          padding: '24px 24px 0',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.6, marginBottom: '32px' }}>
            <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span>Explore</span>
          </nav>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, #00e5ff, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🌍 Explore Earth
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '600px', lineHeight: 1.6, margin: '0 0 48px' }}>
            Discover what&apos;s happening around the world. Select a country to explore its news, sports, weather, and culture on the interactive globe.
          </p>
        </header>

        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px 80px',
        }}>
          {/* Open Globe CTA */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Link
              href="/"
              id="open-globe"
              style={{
                display: 'inline-block',
                padding: '14px 40px',
                background: 'linear-gradient(135deg, #00e5ff, #0077ff)',
                borderRadius: '12px',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              🌐 Open Interactive Globe
            </Link>
          </div>

          {/* Regions */}
          {Object.entries(REGIONS).map(([region, countries]) => (
            <section key={region} style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>
                {region}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
              }}>
                {countries.map((country) => {
                  const slug = country.toLowerCase();
                  const coordData = COUNTRY_COORDINATES[slug];
                  return (
                    <Link
                      key={country}
                      href={`/country/${encodeURIComponent(slug)}`}
                      style={{
                        display: 'block',
                        padding: '16px 20px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        color: 'white',
                        textDecoration: 'none',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{country}</div>
                      {coordData && (
                        <div style={{ fontSize: '13px', opacity: 0.5 }}>{coordData.city}</div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Topics */}
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>Browse by Topic</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {[
                { name: 'News', href: '/news', emoji: '📰' },
                { name: 'Sports', href: '/sports', emoji: '🏅' },
                { name: 'Technology', href: '/technology', emoji: '💻' },
                { name: 'Business', href: '/business', emoji: '📈' },
                { name: 'Weather', href: '/weather', emoji: '🌤️' },
              ].map((topic) => (
                <Link
                  key={topic.name}
                  href={topic.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  <span>{topic.emoji}</span>
                  <span>{topic.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Footer Links */}
          <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '32px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', opacity: 0.5 }}>Related</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Link href="/games" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Play Earth</Link>
              <Link href="/daily" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Daily Challenge</Link>
              <Link href="/trending" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Trending</Link>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
