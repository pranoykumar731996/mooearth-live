// ============================================================
// MooEarth Live — Stop the Earth: Game Landing Page
// ============================================================
// Server component with full SEO metadata for /games/stop-the-earth

import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import StopTheEarthClient from './StopTheEarthClient';

export const metadata: Metadata = {
  title: 'Stop the Earth — Geography Guessing Game | MooEarth Live',
  description: 'Spin the Earth, pick a country, and locate real places on an interactive map. Test your geography with distance-based scoring across 195 countries and 500+ verified locations.',
  alternates: {
    canonical: 'https://www.mooearth.live/games/stop-the-earth',
    languages: generateHreflangs('/games/stop-the-earth'),
  },
  openGraph: {
    title: 'Stop the Earth — Geography Guessing Game | MooEarth Live',
    description: 'Spin the Earth, pick a country, and locate real places on an interactive map. Test your geography knowledge with 500+ verified places across 195 countries.',
    url: 'https://www.mooearth.live/games/stop-the-earth',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Stop the Earth — Geography Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stop the Earth — Geography Guessing Game',
    description: 'Spin the Earth, pick a country, and locate real places on an interactive map.',
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export default function StopTheEarthPage() {
  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Games', item: 'https://www.mooearth.live/games' },
      { '@type': 'ListItem', position: 3, name: 'Stop the Earth', item: 'https://www.mooearth.live/games/stop-the-earth' },
    ],
  };

  // VideoGame JSON-LD
  const gameJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'Stop the Earth — Geography Guessing Game',
    url: 'https://www.mooearth.live/games/stop-the-earth',
    description: 'An interactive geography guessing game where players locate real places on a map and earn points based on distance accuracy.',
    genre: ['Geography', 'Puzzle', 'Educational'],
    gamePlatform: ['Web Browser', 'Mobile Browser'],
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    author: {
      '@type': 'Organization',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />
      <StopTheEarthClient />
    </>
  );
}
