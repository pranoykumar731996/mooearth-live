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

interface LocalizedCountryQuizProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedCountryQuizProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const canonicalUrl = getCanonicalUrl('/country-quiz', lang);

  return {
    title: dict.countryQuiz.title,
    description: dict.countryQuiz.description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/country-quiz'),
    },
    openGraph: {
      title: dict.countryQuiz.title,
      description: dict.countryQuiz.description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'MooEarth Live',
      locale: lang,
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${dict.countryQuiz.h1} — MooEarth Live`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.countryQuiz.title,
      description: dict.countryQuiz.description,
      images: ['https://www.mooearth.live/icons/icon-512.png'],
    },
  };
}

export default async function LocalizedCountryQuizPage({ params }: LocalizedCountryQuizProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const canonicalUrl = getCanonicalUrl('/country-quiz', lang);
  const baseConfig = GAME_LANDING_CONFIGS['country-quiz'];
  const initialQuestions = fetchQuestionsForGameMode('country-quiz');

  const config: GameLandingConfig = {
    ...baseConfig,
    h1: dict.countryQuiz.h1,
    name: dict.countryQuiz.h1,
    metaTitle: dict.countryQuiz.title,
    metaDescription: dict.countryQuiz.description,
    badge: dict.countryQuiz.badge,
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
