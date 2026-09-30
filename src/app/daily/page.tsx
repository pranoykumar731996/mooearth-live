import { Metadata } from 'next';
import Link from 'next/link';
import { getDailyEarthQuestion } from '@/data/questions/index';
import { COUNTRY_METADATA } from '@/data/questions/countryMetadata';

const title = 'Daily Earth Challenge — Test Your World Knowledge | MooEarth Live';
const description = 'Take on today\'s Daily Earth Challenge. 10 geography questions, build your streak, earn XP, and compete with players worldwide. A new challenge every day on MooEarth Live.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/daily' },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/daily',
    type: 'website',
    siteName: 'MooEarth Live',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function DailyChallengePage() {
  const dateStr = getTodayDateStr();

  // Generate preview questions to show on this SSR page
  const previewQuestions = Array.from({ length: 10 }, (_, i) => {
    const q = getDailyEarthQuestion(dateStr, i);
    return {
      index: i + 1,
      country: q.country,
      difficulty: q.difficulty,
    };
  });

  // Get unique countries featured today
  const featuredCountries = [...new Set(previewQuestions.map(q => q.country))];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Games', item: 'https://www.mooearth.live/games' },
      { '@type': 'ListItem', position: 3, name: 'Daily Challenge', item: 'https://www.mooearth.live/daily' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030308 0%, #1a0a2e 50%, #030308 100%)',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <header style={{
          padding: '24px 24px 0',
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.6, marginBottom: '32px' }}>
            <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/games" style={{ color: '#00e5ff', textDecoration: 'none' }}>Games</Link>
            <span>/</span>
            <span>Daily Challenge</span>
          </nav>

          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌍</div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 5vw, 3rem)',
              fontWeight: 800,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Daily Earth Challenge
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.6, margin: '0 0 8px' }}>
              {dateStr}
            </p>
            <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>
              10 questions about the world. Build your streak. Earn XP. Challenge your friends.
            </p>
          </div>
        </header>

        <main style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 24px 48px',
        }}>
          {/* Start Challenge CTA */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}>
            <Link
              href="/play-earth"
              id="start-daily-challenge"
              style={{
                display: 'inline-block',
                padding: '16px 48px',
                background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                borderRadius: '12px',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '18px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              ▶ Start Today&apos;s Challenge
            </Link>
          </div>

          {/* Today's Featured Countries */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', opacity: 0.8 }}>
              Today&apos;s Featured Countries
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {featuredCountries.map((country) => {
                const meta = Object.values(COUNTRY_METADATA).find(m => m.name === country);
                return (
                  <Link
                    key={country}
                    href={`/country/${encodeURIComponent(country.toLowerCase())}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '14px',
                    }}
                  >
                    <span>{meta?.flag || '🌍'}</span>
                    <span>{country}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Challenge Info */}
          <section style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '48px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>How It Works</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>New Daily</h3>
                <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>A fresh set of 10 questions every day at midnight UTC.</p>
              </div>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔥</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Build Streaks</h3>
                <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>Play every day to maintain and grow your streak.</p>
              </div>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏆</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Earn XP</h3>
                <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>Score points for correct answers and speed bonuses.</p>
              </div>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📤</div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Share & Compete</h3>
                <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>Share your score and challenge friends to beat it.</p>
              </div>
            </div>
          </section>

          {/* Internal Links */}
          <section>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', opacity: 0.5 }}>More Games</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Link href="/games" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>All Games</Link>
              <Link href="/explore" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Explore Earth</Link>
              <Link href="/trending" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Trending</Link>
              <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Globe</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
