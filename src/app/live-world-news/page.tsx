import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import { fetchWorldNewsMapData } from '@/services/worldNewsService';
import WorldNewsMapTemplate, { WorldNewsTemplateConfig } from '@/components/News/WorldNewsMapTemplate';

const config: WorldNewsTemplateConfig = {
  title: 'Live World News — Breaking Global Events Desk & News Map | MooEarth Live',
  metaDescription: 'Real-time live world news desk on MooEarth Live. Follow breaking international stories geocoded by country, verified publisher attribution, timestamps, and live 3D map visualization.',
  h1: 'Live World News — Breaking Global Events Desk & Map',
  badge: 'Live Breaking Wire Desk',
  canonicalUrl: 'https://www.mooearth.live/live-world-news',
  currentRouteSlug: 'live-world-news',
  heroSummary: 'The breaking international news desk on MooEarth Live. Continuous live wire synchronization, direct primary publisher attribution, and real-time geographic map tracking across 195 nations.',
};

export const metadata: Metadata = {
  title: config.title,
  description: config.metaDescription,
  alternates: {
    canonical: config.canonicalUrl,
    languages: generateHreflangs('/live-world-news'),
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

export default async function LiveWorldNewsPage() {
  const data = await fetchWorldNewsMapData();

  return (
    <WorldNewsMapTemplate
      config={config}
      data={data}
    />
  );
}
