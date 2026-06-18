import { Metadata } from 'next';
import HomePage from '../page';

const title = 'Live Sports Updates, Matches & Results | MooEarth Live';
const description = 'Follow real-time sports results, tournament tables, player stats, and match highlights on MooEarth Live\'s interactive 3D globe.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/sports',
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/sports',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  }
};

export default function SportsShortcutPage() {
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
        'name': 'Sports',
        'item': 'https://www.mooearth.live/sports'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialCategory="sports" />
    </>
  );
}
