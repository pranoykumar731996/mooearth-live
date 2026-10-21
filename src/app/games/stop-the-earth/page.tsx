// ============================================================
// MooEarth Live — Geo Locator Finder: Game Landing Page
// ============================================================
// Server component with full SEO metadata for Geo Locator Finder

import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import StopTheEarthClient from './StopTheEarthClient';

export const metadata: Metadata = {
  title: 'Geo Locator Finder — 2D Satellite Geography Game | MooEarth Live',
  description: 'Pick a country, explore authentic 2D satellite maps, and locate real landmarks and cities. Test your geography with precision distance-based scoring across 195 countries.',
  alternates: {
    canonical: 'https://www.mooearth.live/games/stop-the-earth',
    languages: generateHreflangs('/games/stop-the-earth'),
  },
  openGraph: {
    title: 'Geo Locator Finder — 2D Satellite Geography Game | MooEarth Live',
    description: 'Pick a country and find real landmarks and heritage sites on high-resolution 2D satellite maps. Test your geography skills across 195 countries.',
    url: 'https://www.mooearth.live/games/stop-the-earth',
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

export default function StopTheEarthPage() {
  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mooearth.live' },
      { '@type': 'ListItem', position: 2, name: 'Games', item: 'https://www.mooearth.live/games' },
      { '@type': 'ListItem', position: 3, name: 'Geo Locator Finder', item: 'https://www.mooearth.live/games/stop-the-earth' },
    ],
  };

  // VideoGame JSON-LD
  const gameJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'Geo Locator Finder — 2D Satellite Geography Game',
    url: 'https://www.mooearth.live/games/stop-the-earth',
    description: 'An interactive geography game where players find real places on a 2D satellite map and earn points based on distance accuracy.',
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
