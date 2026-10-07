import { Metadata } from 'next';
import { fetchMajorWorldEvents } from '@/services/worldEventsService';
import { shouldIndexEventPage } from '@/lib/seo/eventQualityGate';
import WorldEventsTemplate from '@/components/Events/WorldEventsTemplate';
import { generateHreflangs } from '@/lib/i18n';

export const revalidate = 60; // 60 seconds cache

const title = 'World Events — Live Global Events Map & International Developments | MooEarth Live';
const description = 'Explore verified major world events on MooEarth Live. 3D interactive globe, geocoded event markers, primary wire sources, related sovereign states, and regional context.';

export async function generateMetadata(): Promise<Metadata> {
  const eventsData = await fetchMajorWorldEvents();
  const gateResult = shouldIndexEventPage(eventsData.events);

  return {
    title,
    description,
    alternates: {
      canonical: 'https://www.mooearth.live/world-events',
      languages: generateHreflangs('/world-events'),
    },
    robots: gateResult.robotsDirective,
    openGraph: {
      title,
      description,
      url: 'https://www.mooearth.live/world-events',
      type: 'website',
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: 'World Events - Live Global Events Map',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.mooearth.live/icons/icon-512.png'],
    },
  };
}

export default async function WorldEventsPage() {
  const eventsData = await fetchMajorWorldEvents();

  return (
    <WorldEventsTemplate
      currentPath="/world-events"
      title="World Events — Live Global Events Map & International Developments"
      subtitle="Track verified major international events on an interactive 3D globe. Authentic primary sources, exact geographic epicenters, related countries, and factual strategic context."
      badgeText="Global Events Observatory"
      events={eventsData.events}
    />
  );
}
