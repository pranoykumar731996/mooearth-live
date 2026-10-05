import { Metadata } from 'next';
import WarRoomClient from '@/components/WarRoom/WarRoomClient';
import { generateHreflangs } from '@/lib/i18n';
import { fallbackEvents } from '@/data/events';

interface WarRoomEventPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export async function generateMetadata({ params }: WarRoomEventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = fallbackEvents.find((e) => e.id === eventId);
  const title = event
    ? `War Room: ${event.title} | MooEarth Live`
    : 'War Room: Live Planetary Situation | MooEarth Live';
  const description = event
    ? `Live 3D tactical coverage of ${event.title} in ${event.city}, ${event.country}. Real-time telemetry, viewer reactions, and situation timeline.`
    : 'Real-time 3D planetary tracking of breaking global news and geopolitical hotspots.';

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.mooearth.live/war-room/${eventId}`,
      languages: generateHreflangs(`/war-room/${eventId}`),
    },
    openGraph: {
      title,
      description,
      url: `https://www.mooearth.live/war-room/${eventId}`,
      type: 'article',
      siteName: 'MooEarth Live',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function WarRoomEventPage({ params }: WarRoomEventPageProps) {
  const { eventId } = await params;

  return <WarRoomClient initialEventId={eventId} />;
}
