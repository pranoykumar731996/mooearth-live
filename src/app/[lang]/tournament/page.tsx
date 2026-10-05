import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TournamentClient from '@/components/Tournament/TournamentClient';
import { SUPPORTED_LOCALES, isSupportedLocale, generateHreflangs, LOCALES_META } from '@/lib/i18n';

interface LocalizedTournamentPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.filter((l) => l !== 'en').map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedTournamentPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const title = 'Global Nations Cup — Weekly Earth Tournament | MooEarth Live';
  const description = 'Represent your country in the weekly high-stakes 3D Earth Championship. 10 speedrun geography questions, score points for your national team, and earn championship badges.';
  const canonicalUrl = `https://www.mooearth.live/${lang}/tournament`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/tournament'),
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
          alt: `${title} — Global Nations Cup`,
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

export default async function LocalizedTournamentPage({ params }: LocalizedTournamentPageProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const meta = LOCALES_META[lang];

  return (
    <div dir={meta.dir} lang={lang} className="min-h-screen bg-[#050716] text-white">
      <TournamentClient />
    </div>
  );
}
