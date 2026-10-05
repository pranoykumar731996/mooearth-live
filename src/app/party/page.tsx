import { Metadata } from 'next';
import PartyArenaClient from '@/components/Party/PartyArenaClient';
import { generateHreflangs } from '@/lib/i18n';

const title = 'Classroom & Party Trivia Arena — Live Multiplayer Quiz | MooEarth Live';
const description = 'Host and join live multiplayer geography and world news trivia battles. Perfect for classrooms, parties, and live streamers. Free in your browser on MooEarth Live.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/party',
    languages: generateHreflangs('/party'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/party',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/globe-preview.png',
        width: 1200,
        height: 630,
        alt: `${title} — Multiplayer Party Mode`,
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

export default function PartyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'MooEarth Party & Classroom Arena',
    description: 'Live synchronized 3D geography and news multiplayer quiz.',
    genre: ['Educational Game', 'Trivia', 'Multiplayer'],
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    url: 'https://www.mooearth.live/party',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PartyArenaClient />
    </>
  );
}
