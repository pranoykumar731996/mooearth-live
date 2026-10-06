import { Metadata } from 'next';
import Link from 'next/link';
import { generateHreflangs } from '@/lib/i18n';
import { resolveCanonicalSlug } from '@/data/countries';

const title = 'Trending Around Earth — What\'s Happening Now | MooEarth Live';
const description = 'Discover what\'s trending around the world right now. See the most active locations, top stories, and popular games on MooEarth Live.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/trending',
    languages: generateHreflangs('/trending'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/trending',
    type: 'website',
    siteName: 'MooEarth Live',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

// Editorial/deterministic trending locations (until real analytics data is collected)
const TRENDING_LOCATIONS = [
  { name: 'Tokyo', country: 'Japan', emoji: '🇯🇵', signal: 'Sports & Tech' },
  { name: 'New Delhi', country: 'India', emoji: '🇮🇳', signal: 'Breaking News' },
  { name: 'London', country: 'United Kingdom', emoji: '🇬🇧', signal: 'Football' },
  { name: 'Paris', country: 'France', emoji: '🇫🇷', signal: 'Events' },
  { name: 'São Paulo', country: 'Brazil', emoji: '🇧🇷', signal: 'Sports' },
  { name: 'Washington D.C.', country: 'United States', emoji: '🇺🇸', signal: 'Politics' },
  { name: 'Berlin', country: 'Germany', emoji: '🇩🇪', signal: 'Technology' },
  { name: 'Seoul', country: 'South Korea', emoji: '🇰🇷', signal: 'Entertainment' },
];

const TRENDING_TOPICS = [
  { name: 'World News', href: '/news', emoji: '📰' },
  { name: 'Football', href: '/sports', emoji: '⚽' },
  { name: 'Technology', href: '/technology', emoji: '💻' },
  { name: 'Weather', href: '/weather', emoji: '🌤️' },
  { name: 'Business', href: '/business', emoji: '📈' },
];

export default function TrendingPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Trending', item: 'https://www.mooearth.live/trending' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030308 0%, #2a0a1e 50%, #030308 100%)',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <header style={{
          padding: '24px 24px 0',
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.6, marginBottom: '32px' }}>
            <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span>Trending</span>
          </nav>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🔥 Trending Around Earth
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '600px', lineHeight: 1.6, margin: '0 0 48px' }}>
            The most active locations and topics around the world right now.
          </p>
        </header>

        <main style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0 24px 80px',
        }}>
          {/* Trending Locations */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', opacity: 0.8 }}>
              🌍 Active Locations
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {TRENDING_LOCATIONS.map((loc, index) => (
                <Link
                  key={loc.name}
                  href={`/countries/${resolveCanonicalSlug(loc.country) || encodeURIComponent(loc.country.toLowerCase())}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 20px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: 'white',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    opacity: 0.3,
                    minWidth: '24px',
                  }}>
                    #{index + 1}
                  </span>
                  <span style={{ fontSize: '28px' }}>{loc.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{loc.name}</div>
                    <div style={{ fontSize: '13px', opacity: 0.5 }}>{loc.country} · {loc.signal}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Trending Topics */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', opacity: 0.8 }}>
              📊 Popular Topics
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {TRENDING_TOPICS.map((topic) => (
                <Link
                  key={topic.name}
                  href={topic.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: 500,
                  }}
                >
                  <span>{topic.emoji}</span>
                  <span>{topic.name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Daily Challenge CTA */}
          <section style={{
            background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(245,158,11,0.15))',
            border: '1px solid rgba(236,72,153,0.2)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '48px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌍</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Daily Earth Challenge</h2>
            <p style={{ fontSize: '15px', opacity: 0.6, marginBottom: '20px' }}>
              Test your world knowledge with today&apos;s challenge.
            </p>
            <Link
              href="/daily"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                borderRadius: '10px',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Play Now
            </Link>
          </section>

          {/* Footer Links */}
          <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', opacity: 0.5 }}>Discover More</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Link href="/explore" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Explore Earth</Link>
              <Link href="/games" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Games</Link>
              <Link href="/" id="trending-explore-globe" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Globe</Link>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
