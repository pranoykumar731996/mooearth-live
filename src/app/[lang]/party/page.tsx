import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PartyArenaClient from '@/components/Party/PartyArenaClient';
import { SUPPORTED_LOCALES, isSupportedLocale, generateHreflangs, LOCALES_META } from '@/lib/i18n';

interface LocalizedPartyPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.filter((l) => l !== 'en').map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedPartyPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const title = 'Classroom & Party Trivia Arena — Live Multiplayer Quiz | MooEarth Live';
  const description = 'Host and join live multiplayer geography and world news trivia battles. Perfect for classrooms, parties, and live streamers. Free in your browser on MooEarth Live.';
  const canonicalUrl = `https://www.mooearth.live/${lang}/party`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/party'),
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
          alt: `${title} — Multiplayer Party Mode`,
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

export default async function LocalizedPartyPage({ params }: LocalizedPartyPageProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const meta = LOCALES_META[lang];

  return (
    <div dir={meta.dir} lang={lang} className="min-h-screen bg-[#060814] text-white">
      <PartyArenaClient />
    </div>
  );
}
