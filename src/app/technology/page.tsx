import { Metadata } from 'next';
import HomePage from '../page';

const title = 'Latest Technology News & Tech Trends | MooEarth Live';
const description = 'Explore real-time technology breakthroughs, global product launches, and digital innovation trends on MooEarth Live\'s interactive 3D emotional globe.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/technology',
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/technology',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  }
};

export default function TechnologyShortcutPage() {
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
        'name': 'Technology',
        'item': 'https://www.mooearth.live/technology'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialCategory="technology" />
    </>
  );
}
