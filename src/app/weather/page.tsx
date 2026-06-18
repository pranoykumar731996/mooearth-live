import { Metadata } from 'next';
import HomePage from '../page';

const title = 'Real-time Global Weather Maps & Climate Updates | MooEarth Live';
const description = 'Monitor dynamic weather shifts, high-pressure systems, storm paths, temperature readings, and climate sensor grids globally on MooEarth Live.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/weather',
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/weather',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  }
};

export default function WeatherShortcutPage() {
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
        'name': 'Weather',
        'item': 'https://www.mooearth.live/weather'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomePage initialCategory="weather" />
    </>
  );
}
