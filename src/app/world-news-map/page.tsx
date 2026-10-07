import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import { fetchWorldNewsMapData } from '@/services/worldNewsService';
import WorldNewsMapTemplate, { WorldNewsTemplateConfig } from '@/components/News/WorldNewsMapTemplate';

const config: WorldNewsTemplateConfig = {
  title: 'World News Map — Interactive 3D Globe & Live Events Map | MooEarth Live',
  metaDescription: 'Interactive world news map on MooEarth Live. Explore geocoded global news markers on a 3D Earth globe. Verified stories, live timestamps, original sources, and regional context.',
  h1: 'World News Map — Interactive 3D Globe & Global Events Map',
  badge: '3D World News Map',
  canonicalUrl: 'https://www.mooearth.live/world-news-map',
  currentRouteSlug: 'world-news-map',
  heroSummary: 'Visualize live global events on a rotatable 3D world map. Every marker pins verified news reporting to precise latitude and longitude coordinates with authentic source attributions.',
};

export const metadata: Metadata = {
  title: config.title,
  description: config.metaDescription,
  alternates: {
    canonical: config.canonicalUrl,
    languages: generateHreflangs('/world-news-map'),
  },
  openGraph: {
    title: config.title,
    description: config.metaDescription,
    url: config.canonicalUrl,
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
    title: config.title,
    description: config.metaDescription,
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export const revalidate = 60; // Revalidate every minute for live news freshness

export default async function WorldNewsMapPage() {
  const data = await fetchWorldNewsMapData();

  return (
    <WorldNewsMapTemplate
      config={config}
      data={data}
    />
  );
}
