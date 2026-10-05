import { Metadata } from 'next';
import WarRoomClient from '@/components/WarRoom/WarRoomClient';
import { generateHreflangs } from '@/lib/i18n';

const title = 'War Room — Live Planetary Situational Dashboard | MooEarth Live';
const description = 'Track breaking global events, geopolitical hotspots, scientific breakthroughs, and live international reaction on MooEarth Live 3D Situation Room.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/war-room',
    languages: generateHreflangs('/war-room'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/war-room',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/globe-preview.png',
        width: 1200,
        height: 630,
        alt: `${title} — Real-Time 3D Situation Room`,
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

export default function WarRoomPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'MooEarth Live War Room',
    url: 'https://www.mooearth.live/war-room',
    description: 'Real-time 3D planetary tracking of breaking global news and geopolitical hotspots.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WarRoomClient />
    </>
  );
}
