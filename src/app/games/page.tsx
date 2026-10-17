// ============================================================
// MooEarth Live — Games Hub Destination Page
// ============================================================
// Destination 2 of 2: Dedicated Earth Gaming & Multiplayer Hub.
// Contains all existing Earth games, location-based multiplayer,
// tournaments, and progress systems.

import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import { GAME_LANDING_CONFIGS, fetchQuestionsForGameMode } from '@/services/gameLandingService';
import GamesHubClient from './GamesHubClient';

const config = GAME_LANDING_CONFIGS['games'];

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: {
    canonical: config.canonical,
    languages: generateHreflangs('/games'),
  },
  openGraph: {
    title: config.metaTitle,
    description: config.metaDescription,
    url: config.canonical,
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: config.h1,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: config.metaTitle,
    description: config.metaDescription,
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export default function GamesPage() {
  const initialQuestions = fetchQuestionsForGameMode('games');

  // Breadcrumb Schema.org JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.mooearth.live',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Games Hub',
        item: 'https://www.mooearth.live/games',
      },
    ],
  };

  // VideoGame / WebApplication Schema.org JSON-LD
  const gameJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: config.h1,
    url: config.canonical,
    description: config.metaDescription,
    genre: ['Geography', 'Trivia', 'Educational', 'Multiplayer', 'Tournament'],
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
      <GamesHubClient initialQuestions={initialQuestions} />
    </>
  );
}
