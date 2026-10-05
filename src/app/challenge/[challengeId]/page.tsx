import { Metadata } from 'next';
import { Suspense } from 'react';
import ChallengeArenaClient from '@/components/Challenge/ChallengeArenaClient';

interface ChallengePageProps {
  params: Promise<{ challengeId: string }>;
}

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const { challengeId } = await params;

  const isDaily = challengeId.startsWith('daily-');
  const dateMatch = challengeId.match(/daily-(\d{4})(\d{2})(\d{2})/);
  const dateStr = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';

  const title = isDaily
    ? `⚔️ 1v1 Daily Earth Challenge ${dateStr} | MooEarth Live`
    : `⚔️ 1v1 Earth Challenge | MooEarth Live`;
  const description = isDaily
    ? `Someone challenged you to beat their Daily Earth Challenge record! Play the exact same 5 questions and prove your world knowledge on MooEarth Live.`
    : `Accept this MooEarth 1v1 Earth Challenge. Beat their score on our interactive 3D globe.`;

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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Daily', item: 'https://www.mooearth.live/daily' },
      { '@type': 'ListItem', position: 3, name: '1v1 Challenge', item: `https://www.mooearth.live/challenge/${challengeId}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={
        <div style={{
          minHeight: '100vh',
          background: '#05040d',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          Loading Battle Arena...
        </div>
      }>
        <ChallengeArenaClient challengeId={challengeId} />
      </Suspense>
    </>
  );
}
