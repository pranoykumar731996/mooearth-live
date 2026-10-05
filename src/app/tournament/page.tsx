import { Metadata } from 'next';
import TournamentClient from '@/components/Tournament/TournamentClient';
import { generateHreflangs } from '@/lib/i18n';

const title = 'Global Nations Cup — Weekly Earth Tournament | MooEarth Live';
const description = 'Represent your country in the weekly high-stakes 3D Earth Championship. 10 speedrun geography questions, score points for your national team, and earn championship badges.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/tournament',
    languages: generateHreflangs('/tournament'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/tournament',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/globe-preview.png',
        width: 1200,
        height: 630,
        alt: `${title} — Global Nations Cup`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://www.mooearth.live/globe-preview.png'],
  },
};

export default function TournamentPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'MooEarth Global Nations Cup',
    description: 'Weekly high-stakes geography and world news tournament.',
    genre: ['Trivia', 'Tournament', 'Geography', 'Multiplayer'],
    applicationCategory: 'GameApplication',
    url: 'https://www.mooearth.live/tournament',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TournamentClient />
    </>
  );
}
