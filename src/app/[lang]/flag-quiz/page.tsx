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

interface LocalizedFlagQuizProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedFlagQuizProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const canonicalUrl = getCanonicalUrl('/flag-quiz', lang);

  return {
    title: dict.flagQuiz.title,
    description: dict.flagQuiz.description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/flag-quiz'),
    },
    openGraph: {
      title: dict.flagQuiz.title,
      description: dict.flagQuiz.description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'MooEarth Live',
      locale: lang,
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${dict.flagQuiz.h1} — MooEarth Live`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.flagQuiz.title,
      description: dict.flagQuiz.description,
      images: ['https://www.mooearth.live/icons/icon-512.png'],
    },
  };
}

export default async function LocalizedFlagQuizPage({ params }: LocalizedFlagQuizProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const canonicalUrl = getCanonicalUrl('/flag-quiz', lang);
  const baseConfig = GAME_LANDING_CONFIGS['flag-quiz'];
  const initialQuestions = fetchQuestionsForGameMode('flag-quiz');

  const config: GameLandingConfig = {
    ...baseConfig,
    h1: dict.flagQuiz.h1,
    name: dict.flagQuiz.h1,
    metaTitle: dict.flagQuiz.title,
    metaDescription: dict.flagQuiz.description,
    badge: dict.flagQuiz.badge,
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
