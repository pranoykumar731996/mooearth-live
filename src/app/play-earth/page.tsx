import { Metadata } from 'next';
import HomePage from '../page';
import { generateHreflangs } from '@/lib/i18n';

const pageTitle = 'Interactive 3D Globe & Trivia Explorer';
const fullTitle = 'Interactive 3D Globe & Trivia Explorer | MooEarth Live';
const description = 'Explore the interactive 3D Earth globe on MooEarth Live. Rotate the planet, touch any country, and test your global knowledge with daily geography challenges, flag quizzes, and trivia.';

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/play-earth',
    languages: generateHreflangs('/play-earth'),
  },
  openGraph: {
    title: fullTitle,
    description,
    url: 'https://www.mooearth.live/play-earth',
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live — Interactive 3D Globe & Trivia Explorer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: fullTitle,
    description,
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  }
};

export default function PlayEarthShortcutPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://www.mooearth.live'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Play Earth',
        'item': 'https://www.mooearth.live/play-earth'
      }
    ]
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    url: 'https://www.mooearth.live/play-earth',
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'MooEarth Live',
      url: 'https://www.mooearth.live',
    },
    about: {
      '@type': 'Thing',
      name: 'Interactive 3D Globe and World Exploration Games',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <HomePage initialPlayEarthActive={true} />
    </>
  );
}
