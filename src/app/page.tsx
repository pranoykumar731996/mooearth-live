// ============================================================
// MooEarth Live — Default Homepage: Weather Radar
// ============================================================
// Destination 1 of 2: Global Weather Intelligence & Live Radar
// 3D Interactive Earth Globe + MapLibre City Map + 8 Weather Layers +
// Forecast Timeline + Floating Weather Dock + Meteorological Telemetry.

import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import HomePageClient from './HomePageClient';

const title = 'MooEarth Live — Interactive 3D Weather Radar & Earth Intelligence';
const description = 'Explore real-time weather on an interactive 3D globe and live city radar map. Satellite spectral layers, precipitation radar, storm & cyclone tracking, wind streams, and 7-day meteorological forecasts.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live',
    languages: generateHreflangs('/'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live — Interactive 3D Weather Radar & Earth Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export interface HomePageProps {
  initialCountry?: string;
  initialPlayEarthActive?: boolean;
  initialCategory?: string;
}

export default function HomePage(_props?: HomePageProps) {
  return <HomePageClient />;
}
