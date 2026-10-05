import { Metadata } from 'next';
import DailyChallengeClient from '@/components/Daily/DailyChallengeClient';

const title = 'Daily Earth Challenge — Test Your World Knowledge | MooEarth Live';
const description = 'Take on today\'s Daily Earth Challenge. 5 synchronized geography questions, build your streak, earn XP, and compete with players worldwide. A new challenge every day on MooEarth Live.';

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

export default function DailyChallengePage() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DailyChallengeClient />
    </>
  );
}
