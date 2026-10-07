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

interface LocalizedGeographyQuizProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedGeographyQuizProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const canonicalUrl = getCanonicalUrl('/geography-quiz', lang);

  return {
    title: dict.geographyQuiz.title,
    description: dict.geographyQuiz.description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/geography-quiz'),
    },
    openGraph: {
      title: dict.geographyQuiz.title,
      description: dict.geographyQuiz.description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'MooEarth Live',
      locale: lang,
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${dict.geographyQuiz.h1} — MooEarth Live`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.geographyQuiz.title,
      description: dict.geographyQuiz.description,
      images: ['https://www.mooearth.live/icons/icon-512.png'],
    },
  };
}

export default async function LocalizedGeographyQuizPage({ params }: LocalizedGeographyQuizProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const canonicalUrl = getCanonicalUrl('/geography-quiz', lang);
  const baseConfig = GAME_LANDING_CONFIGS['geography-quiz'];
  const initialQuestions = fetchQuestionsForGameMode('geography-quiz');

  const config: GameLandingConfig = {
    ...baseConfig,
    h1: dict.geographyQuiz.h1,
    name: dict.geographyQuiz.h1,
    metaTitle: dict.geographyQuiz.title,
    metaDescription: dict.geographyQuiz.description,
    badge: dict.geographyQuiz.badge,
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
