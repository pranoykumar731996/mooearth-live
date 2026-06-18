import { Metadata } from 'next';
import HomePage from '../page';

const title = 'Play Earth - Interactive Global Trivia Game | MooEarth Live';
const description = 'Test your global trivia knowledge on geography, sports, weather, history, and science. Answer country-specific questions on MooEarth Live\'s interactive 3D globe.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/play-earth',
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/play-earth',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialPlayEarthActive={true} />
    </>
  );
}
