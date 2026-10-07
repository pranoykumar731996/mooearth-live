import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import { fetchWorldNewsMapData } from '@/services/worldNewsService';
import WorldNewsMapTemplate, { WorldNewsTemplateConfig } from '@/components/News/WorldNewsMapTemplate';

const config: WorldNewsTemplateConfig = {
  title: 'World News — Live Global Events Map & Breaking Wire Dispatches | MooEarth Live',
  metaDescription: 'Explore verified live world news on MooEarth Live. Real-time global event markers, interactive 3D map, international wire dispatches, and authentic source attributions.',
  h1: 'World News — Live Global Events & Real-Time Dispatches',
  badge: 'Global News Desk',
  canonicalUrl: 'https://www.mooearth.live/world-news',
  currentRouteSlug: 'world-news',
  heroSummary: 'Real-time verified international journalism mapped to sovereign territories on an interactive 3D globe. Browse live events with direct publisher attributions and geographic coordinates.',
};

export const metadata: Metadata = {
  title: config.title,
  description: config.metaDescription,
  alternates: {
    canonical: config.canonicalUrl,
    languages: generateHreflangs('/world-news'),
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

export default async function WorldNewsPage() {
  const data = await fetchWorldNewsMapData();

  return (
    <WorldNewsMapTemplate
      config={config}
      data={data}
    />
  );
}
