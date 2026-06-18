import { Metadata } from 'next';
import HomePage from '../page';

const title = 'Live Business News, Market Indices & Trade Reports | MooEarth Live';
const description = 'Follow real-time stock indexes, trade summaries, GDP growth indicators, inflation statistics, and commercial developments on MooEarth Live.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/business',
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/business',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  }
};

export default function BusinessShortcutPage() {
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
        'name': 'Business',
        'item': 'https://www.mooearth.live/business'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialCategory="business" />
    </>
  );
}
