import { Metadata } from 'next';
import HomePage from '../page';

const title = 'FIFA World Cup 2026 Live Updates, Groups & Schedules | MooEarth Live';
const description = 'Follow every match, group stage ranking, live scoreboard, and fan celebration for the FIFA World Cup 2026 on MooEarth Live\'s interactive 3D globe.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/fifa',
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/fifa',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  }
};

export default function FifaShortcutPage() {
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
        'name': 'FIFA World Cup 2026',
        'item': 'https://www.mooearth.live/fifa'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialCategory="worldcup" />
    </>
  );
}
