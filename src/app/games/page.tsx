import { Metadata } from 'next';
import Link from 'next/link';
import { generateHreflangs } from '@/lib/i18n';

const title = 'Earth Games — Play Interactive Geography Challenges | MooEarth Live';
const description = 'Test your knowledge of the world with interactive geography games. Play country explorer, flag challenge, capital challenge, survival mode, beat the clock, and daily earth challenges on MooEarth Live.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/games',
    languages: generateHreflangs('/games'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/games',
    type: 'website',
    siteName: 'MooEarth Live',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

const GAME_MODES = [
  {
    id: 'country-explorer',
    name: 'Country Explorer',
    emoji: '🌍',
    description: 'Explore any country on the globe and answer trivia questions about it.',
    color: '#00e5ff',
    href: '/play-earth',
  },
  {
    id: 'flag-challenge',
    name: 'Flag Challenge',
    emoji: '🏁',
    description: 'Identify countries by their flags. Test your vexillology knowledge across difficulty levels.',
    color: '#f59e0b',
    href: '/play-earth',
  },
  {
    id: 'capital-challenge',
    name: 'Capital Challenge',
    emoji: '🏛️',
    description: 'Match capital cities to their countries. From easy to expert difficulty.',
    color: '#8b5cf6',
    href: '/play-earth',
  },
  {
    id: 'survival',
    name: 'Survival Mode',
    emoji: '💀',
    description: 'How many countries can you survive? One wrong answer and it\'s game over.',
    color: '#ef4444',
    href: '/play-earth',
  },
  {
    id: 'beat-the-clock',
    name: 'Beat the Clock',
    emoji: '⏱️',
    description: 'Race against time. Answer as many questions as you can before the clock runs out.',
    color: '#10b981',
    href: '/play-earth',
  },
  {
    id: 'daily-challenge',
    name: 'Daily Earth Challenge',
    emoji: '📅',
    description: 'A new set of 10 questions every day. Build your streak and compete globally.',
    color: '#ec4899',
    href: '/daily',
  },
];

export default function GamesPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Games', item: 'https://www.mooearth.live/games' },
    ],
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Earth Games',
    description,
    url: 'https://www.mooearth.live/games',
    isPartOf: { '@type': 'WebSite', name: 'MooEarth Live', url: 'https://www.mooearth.live' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030308 0%, #0a0a2e 50%, #030308 100%)',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {/* Header */}
        <header style={{
          padding: '24px 24px 0',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.6, marginBottom: '32px' }}>
            <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span>Games</span>
          </nav>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, #00e5ff, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🌍 Play Earth
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '600px', lineHeight: 1.6, margin: '0 0 48px' }}>
            Test your knowledge of the world. Explore countries, identify flags, match capitals, and compete in daily challenges.
          </p>
        </header>

        {/* Game Modes Grid */}
        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px 80px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px',
        }}>
          {GAME_MODES.map((mode) => (
            <Link
              key={mode.id}
              href={mode.href}
              id={`game-${mode.id}`}
              style={{
                display: 'block',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '32px',
                textDecoration: 'none',
                color: 'white',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{mode.emoji}</div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                margin: '0 0 8px',
                color: mode.color,
              }}>
                {mode.name}
              </h2>
              <p style={{ fontSize: '15px', opacity: 0.6, lineHeight: 1.5, margin: 0 }}>
                {mode.description}
              </p>
            </Link>
          ))}
        </main>

        {/* Internal Links */}
        <footer style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px 48px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '32px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', opacity: 0.5 }}>Related</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/daily" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Daily Challenge</Link>
            <Link href="/explore" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Explore Earth</Link>
            <Link href="/trending" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Trending</Link>
            <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Globe</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
