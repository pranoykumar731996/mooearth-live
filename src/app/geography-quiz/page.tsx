import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import { GAME_LANDING_CONFIGS, fetchQuestionsForGameMode } from '@/services/gameLandingService';
import GameLandingTemplate from '@/components/Games/GameLandingTemplate';

const config = GAME_LANDING_CONFIGS['geography-quiz'];

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: {
    canonical: config.canonical,
    languages: generateHreflangs('/geography-quiz'),
  },
  openGraph: {
    title: config.metaTitle,
    description: config.metaDescription,
    url: config.canonical,
    type: 'website',
    siteName: 'MooEarth Live',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: config.h1,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: config.metaTitle,
    description: config.metaDescription,
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};

export default function GeographyQuizPage() {
  const initialQuestions = fetchQuestionsForGameMode('geography-quiz');

  return (
    <GameLandingTemplate
      config={config}
      initialQuestions={initialQuestions}
    />
  );
}
