import { Metadata } from 'next';
import { fetchMajorWorldEvents } from '@/services/worldEventsService';
import { shouldIndexEventPage } from '@/lib/seo/eventQualityGate';
import WorldEventsTemplate from '@/components/Events/WorldEventsTemplate';
import { generateHreflangs } from '@/lib/i18n';

export const revalidate = 60; // 60 seconds cache

const title = 'Live Events — Real-Time Global Event Desk & Interactive Globe | MooEarth Live';
const description = 'Stream verified live international developments on MooEarth Live. Real-time spherical event markers, direct news publisher attributions, and geographic impact coordinates.';

export async function generateMetadata(): Promise<Metadata> {
  const eventsData = await fetchMajorWorldEvents();
  const gateResult = shouldIndexEventPage(eventsData.events);

  return {
    title,
    description,
    alternates: {
      canonical: 'https://www.mooearth.live/live-events',
      languages: generateHreflangs('/live-events'),
    },
    robots: gateResult.robotsDirective,
    openGraph: {
      title,
      description,
      url: 'https://www.mooearth.live/live-events',
      type: 'website',
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: 'Live Events - Real-Time Global Event Desk',
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

export default async function LiveEventsPage() {
  const eventsData = await fetchMajorWorldEvents();

  return (
    <WorldEventsTemplate
      currentPath="/live-events"
      title="Live Events — Real-Time Global Event Desk & Interactive Globe"
      subtitle="Follow live breaking developments as they unfold across sovereign territories. Verified publisher dispatches, exact coordinates, and regional cross-border context."
      badgeText="Live Wire Events Desk"
      events={eventsData.events}
    />
  );
}
