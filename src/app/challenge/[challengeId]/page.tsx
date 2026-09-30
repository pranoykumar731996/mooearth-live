import { Metadata } from 'next';
import Link from 'next/link';

interface ChallengePageProps {
  params: Promise<{ challengeId: string }>;
}

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const { challengeId } = await params;

  // Parse challenge ID format: daily-YYYYMMDD or custom-XXXX
  const isDaily = challengeId.startsWith('daily-');
  const dateMatch = challengeId.match(/daily-(\d{4})(\d{2})(\d{2})/);
  const dateStr = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';

  const title = isDaily
    ? `Daily Earth Challenge ${dateStr} | MooEarth Live`
    : `Earth Challenge | MooEarth Live`;
  const description = isDaily
    ? `Can you beat this Daily Earth Challenge score? Play 10 geography questions and test your world knowledge on MooEarth Live.`
    : `Accept this MooEarth Earth Challenge. Test your knowledge of the world on our interactive 3D globe.`;

  return {
    title,
    description,
    alternates: { canonical: `/challenge/${challengeId}` },
    openGraph: {
      title,
      description,
      url: `https://www.mooearth.live/challenge/${challengeId}`,
      type: 'website',
      siteName: 'MooEarth Live',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { challengeId } = await params;
  const isDaily = challengeId.startsWith('daily-');

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Games', item: 'https://www.mooearth.live/games' },
      { '@type': 'ListItem', position: 3, name: 'Challenge', item: `https://www.mooearth.live/challenge/${challengeId}` },
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '72px', marginBottom: '24px' }}>🌍</div>

          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 800,
            margin: '0 0 12px',
            background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {isDaily ? 'Daily Earth Challenge' : 'Earth Challenge'}
          </h1>

          <p style={{ fontSize: '16px', opacity: 0.6, marginBottom: '32px', lineHeight: 1.5 }}>
            {isDaily
              ? 'Someone challenged you! Can you beat their score?'
              : 'Accept this challenge and test your world knowledge.'
            }
          </p>

          {/* Challenge CTA */}
          <Link
            href="/play-earth"
            id="accept-challenge"
            style={{
              display: 'inline-block',
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
              borderRadius: '12px',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '18px',
              marginBottom: '24px',
            }}
          >
            ▶ Accept Challenge
          </Link>

          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '13px', opacity: 0.4, marginBottom: '16px' }}>
              Challenge ID: {challengeId}
            </p>
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '32px',
            flexWrap: 'wrap',
          }}>
            <Link href="/daily" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Daily Challenge</Link>
            <Link href="/games" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>All Games</Link>
            <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '14px' }}>Explore Globe</Link>
          </div>
        </div>
      </div>
    </>
  );
}
