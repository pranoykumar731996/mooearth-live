import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WarRoomClient from '@/components/WarRoom/WarRoomClient';
import { SUPPORTED_LOCALES, isSupportedLocale, generateHreflangs, LOCALES_META } from '@/lib/i18n';

interface LocalizedWarRoomPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.filter((l) => l !== 'en').map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedWarRoomPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const title = 'War Room — Live Planetary Situational Dashboard | MooEarth Live';
  const description = 'Track breaking global events, geopolitical hotspots, scientific breakthroughs, and live international reaction on MooEarth Live 3D Situation Room.';
  const canonicalUrl = `https://www.mooearth.live/${lang}/war-room`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/war-room'),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale: lang,
      siteName: 'MooEarth Live',
      type: 'website',
      images: [
        {
          url: 'https://www.mooearth.live/globe-preview.png',
          width: 1200,
          height: 630,
          alt: `${title} — Real-Time 3D Situation Room`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.mooearth.live/globe-preview.png'],
    },
  };
}

export default async function LocalizedWarRoomPage({ params }: LocalizedWarRoomPageProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const meta = LOCALES_META[lang];

  return (
    <div dir={meta.dir} lang={lang} className="min-h-screen bg-[#050716] text-white">
      <WarRoomClient />
    </div>
  );
}
