import { Metadata } from 'next';
import PartyArenaClient from '@/components/Party/PartyArenaClient';
import { generateHreflangs } from '@/lib/i18n';

interface PartyRoomPageProps {
  params: Promise<{
    roomCode: string;
  }>;
}

export async function generateMetadata({ params }: PartyRoomPageProps): Promise<Metadata> {
  const { roomCode } = await params;
  const title = `Join Tournament Room #${roomCode} | MooEarth Live Party Arena`;
  const description = `You've been invited to battle in room #${roomCode} on MooEarth Live. Test your geography and world news trivia in 3D.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.mooearth.live/party/${roomCode}`,
      languages: generateHreflangs(`/party/${roomCode}`),
    },
    openGraph: {
      title,
      description,
      url: `https://www.mooearth.live/party/${roomCode}`,
      type: 'website',
      siteName: 'MooEarth Live',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PartyRoomPage({ params }: PartyRoomPageProps) {
  const { roomCode } = await params;

  return <PartyArenaClient initialRoomCode={roomCode} />;
}
