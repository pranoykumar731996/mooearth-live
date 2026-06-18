import { Metadata } from 'next';
import HomePage from '../page';

const title = 'Latest World News & Live Breaking Updates | MooEarth Live';
const description = 'Explore real-time breaking news, global discussions, and emotional pulse analyses across all countries on MooEarth Live\'s interactive 3D globe.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/news',
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/news',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  }
};

export default function NewsShortcutPage() {
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
        'name': 'News',
        'item': 'https://www.mooearth.live/news'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialCategory="breaking" />
    </>
  );
}
