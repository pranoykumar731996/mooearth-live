// ============================================================
// MooEarth Live — Geo Locator Finder: Game Landing Page
// ============================================================

import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import StopTheEarthClient from '../stop-the-earth/StopTheEarthClient';

export const metadata: Metadata = {
  title: 'Geo Locator Finder — 2D Satellite Geography Game | MooEarth Live',
  description: 'Pick a country, explore authentic 2D satellite maps, and locate real landmarks and cities. Test your geography with precision distance-based scoring across 195 countries.',
  alternates: {
    canonical: 'https://www.mooearth.live/games/geo-locator-finder',
    languages: generateHreflangs('/games/geo-locator-finder'),
  },
  openGraph: {
    title: 'Geo Locator Finder — 2D Satellite Geography Game | MooEarth Live',
    description: 'Pick a country and find real landmarks and heritage sites on high-resolution 2D satellite maps. Test your geography skills across 195 countries.',
    url: 'https://www.mooearth.live/games/geo-locator-finder',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Geo Locator Finder — Satellite Geography Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Geo Locator Finder — 2D Satellite Geography Game',
    description: 'Pick a country and locate real places on authentic 2D satellite terrain.',
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export default function GeoLocatorFinderPage() {
  return <StopTheEarthClient />;
}
