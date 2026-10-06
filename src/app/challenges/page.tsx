import { Metadata } from 'next';
import Link from 'next/link';
import { generateHreflangs } from '@/lib/i18n';

const title = 'Earth Challenges — Compete & Share | MooEarth Live';
const description = 'Challenge your friends to Earth quizzes. Share your scores, build streaks, and compete on global leaderboards. Daily, weekly, and event-driven challenges on MooEarth Live.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/challenges',
    languages: generateHreflangs('/challenges'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/challenges',
    type: 'website',
    siteName: 'MooEarth Live',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

const CHALLENGE_TYPES = [
  {
    name: 'Daily Earth Challenge',
    emoji: '📅',
    description: '10 new questions every day. Build your streak and compete globally.',
    color: '#ec4899',
    href: '/daily',
    frequency: 'Every day',
  },
  {
    name: 'Country Explorer',
    emoji: '🌍',
    description: 'Explore a random country and answer questions about it.',
    color: '#00e5ff',
    href: '/play-earth',
    frequency: 'Anytime',
  },
  {
    name: 'Survival Challenge',
    emoji: '💀',
    description: 'How many countries can you survive? One wrong answer ends it all.',
    color: '#ef4444',
    href: '/play-earth',
    frequency: 'Anytime',
  },
  {
    name: 'Beat the Clock',
    emoji: '⏱️',
    description: 'Race against time with 30s, 60s, or 120s rounds.',
    color: '#10b981',
    href: '/play-earth',
    frequency: 'Anytime',
  },
  {
    name: 'Flag Master',
    emoji: '🏁',
    description: 'Identify flags from around the world at varying difficulty levels.',
    color: '#f59e0b',
    href: '/play-earth',
    frequency: 'Anytime',
  },
  {
    name: 'Capital Cities',
    emoji: '🏛️',
    description: 'Match every capital city to its country.',
    color: '#8b5cf6',
    href: '/play-earth',
    frequency: 'Anytime',
  },
];

export default function ChallengesPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Challenges', item: 'https://www.mooearth.live/challenges' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030308 0%, #0a0a2e 50%, #030308 100%)',
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
            <span>Challenges</span>
          </nav>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🏆 Earth Challenges
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '600px', lineHeight: 1.6, margin: '0 0 48px' }}>
            Compete, share your scores, and challenge friends to beat your record.
          </p>
        </header>

        <main style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0 24px 80px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '48px',
          }}>
            {CHALLENGE_TYPES.map((challenge) => (
              <Link
                key={challenge.name}
                href={challenge.href}
                style={{
                  display: 'block',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '28px',
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{challenge.emoji}</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: challenge.color }}>
                  {challenge.name}
                </h2>
                <p style={{ fontSize: '14px', opacity: 0.6, lineHeight: 1.5, margin: '0 0 12px' }}>
                  {challenge.description}
                </p>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  opacity: 0.5,
                }}>
                  {challenge.frequency}
                </span>
              </Link>
            ))}
          </div>

          {/* How sharing works */}
          <section style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '48px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>📤 Share Your Scores</h2>
            <p style={{ fontSize: '15px', opacity: 0.6, lineHeight: 1.6 }}>
              After completing any challenge, share your score with friends via WhatsApp, X (Twitter), Telegram, Facebook,
              or copy a direct link. Your friends will see the challenge and try to beat your score.
            </p>
          </section>

          {/* Footer Links */}
          <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', opacity: 0.5 }}>Discover More</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Link href="/games" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>All Games</Link>
              <Link href="/daily" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Daily Challenge</Link>
              <Link href="/explore" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Explore Earth</Link>
              <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Globe</Link>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
