import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GAME_LANDING_CONFIGS, fetchQuestionsForGameMode, GameLandingConfig } from '@/services/gameLandingService';
import GameLandingTemplate from '@/components/Games/GameLandingTemplate';
import {
  SUPPORTED_LOCALES,
  SupportedLocale,
  isSupportedLocale,
  getTranslation,
  generateHreflangs,
  getCanonicalUrl,
} from '@/lib/i18n';

interface LocalizedGamesProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedGamesProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const canonicalUrl = getCanonicalUrl('/games', lang);

  return {
    title: dict.gamesHub.title,
    description: dict.gamesHub.description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/games'),
    },
    openGraph: {
      title: dict.gamesHub.title,
      description: dict.gamesHub.description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'MooEarth Live',
      locale: lang,
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${dict.gamesHub.h1} — MooEarth Live`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.gamesHub.title,
      description: dict.gamesHub.description,
      images: ['https://www.mooearth.live/icons/icon-512.png'],
    },
  };
}

export default async function LocalizedGamesPage({ params }: LocalizedGamesProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const canonicalUrl = getCanonicalUrl('/games', lang);
  const baseConfig = GAME_LANDING_CONFIGS['games'];
  const initialQuestions = fetchQuestionsForGameMode('games');

  const config: GameLandingConfig = {
    ...baseConfig,
    h1: dict.gamesHub.h1,
    name: dict.gamesHub.h1,
    metaTitle: dict.gamesHub.title,
    metaDescription: dict.gamesHub.description,
    badge: dict.gamesHub.badge,
    canonical: canonicalUrl,
  };

  return (
    <GameLandingTemplate
      config={config}
      initialQuestions={initialQuestions}
      locale={lang as SupportedLocale}
    />
  );
}
