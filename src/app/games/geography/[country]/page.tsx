import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCountryBySlug, getAllCountrySlugs } from '@/data/countries';
import { fetchQuizForCountry } from '@/services/countryQuizService';
import { GameLandingConfig } from '@/services/gameLandingService';
import GameLandingTemplate from '@/components/Games/GameLandingTemplate';

interface CountryGamePageProps {
  params: Promise<{
    country: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllCountrySlugs();
  return slugs.map(slug => ({
    country: slug,
  }));
}

export async function generateMetadata({ params }: CountryGamePageProps): Promise<Metadata> {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    return {
      title: 'Country Game Not Found | MooEarth Live',
      description: 'The requested geography game could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const title = `${country.name} Geography Game — Interactive Country Challenge | MooEarth Live`;
  const description = `Play the interactive geography game for ${country.name} on MooEarth Live. Test your knowledge of ${country.name}'s capital (${country.capital}), landmark (${country.landmark}), borders, and geography.`;
  const canonicalUrl = `https://www.mooearth.live/games/geography/${country.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'MooEarth Live',
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${country.name} Geography Game - MooEarth Live`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.mooearth.live/icons/icon-512.png'],
    },
  };
}

export default async function CountryGeographyGamePage({ params }: CountryGamePageProps) {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    notFound();
  }

  const quizResult = fetchQuizForCountry(country.name);
  const questions = quizResult.questions.slice(0, 5);

  const config: GameLandingConfig = {
    slug: `games/geography/${country.slug}`,
    name: `${country.name} Geography Game`,
    emoji: country.flag || '🌍',
    badge: `Country Trial &bull; ${country.region}`,
    h1: `${country.name} Geography Game & Country Challenge`,
    metaTitle: `${country.name} Geography Game — Interactive Country Challenge | MooEarth Live`,
    metaDescription: `Play the interactive geography game for ${country.name} on MooEarth Live. Test your knowledge of ${country.name}'s capital (${country.capital}), landmark (${country.landmark}), and regional geography.`,
    difficulty: `Country Specialist (${country.region})`,
    difficultyLevel: 'medium',
    timePerQuestion: 15,
    questionCount: questions.length,
    detailedDescription: [
      `Step into the official Play Earth knowledge trial for ${country.name}. Explore interactive questions covering sovereign borders, administrative capitals, cultural landmarks, and physical landscapes.`,
      `Did you know? The official capital of ${country.name} is ${country.capital}, and its most celebrated national landmark is ${country.landmark}. Located in ${country.region}, it forms a vital part of the world's geopolitical and environmental tapestry.`,
      `Play right in your browser. Answer each timed question to earn XP, receive instant verified explanations, unlock a spoiler-free scorecard, and challenge friends to beat your score.`,
    ],
    howToPlay: [
      { step: 1, title: 'Inspect the Question', text: `Read questions testing your knowledge of ${country.name}'s landmarks, borders, capital, and regional geography.` },
      { step: 2, title: 'Beat the Timer', text: 'Select your answer from the 4 options within 15 seconds to earn top speed bonus points.' },
      { step: 3, title: 'Learn the Fun Fact', text: `Discover interesting cultural and geographical trivia about ${country.name} after every question.` },
      { step: 4, title: 'Share & Challenge', text: `Copy your ${country.name} scorecard and challenge friends to a 1v1 battle.` },
    ],
    scoringRules: [
      '1,000 Base XP per correct answer',
      '+500 Maximum speed bonus for quick response',
      'Wordle-style zero-spoiler scorecard upon completion',
      'Direct link to 1v1 challenge arena',
    ],
    canonical: `https://www.mooearth.live/games/geography/${country.slug}`,
    gameModeKey: 'country-specific',
    relatedSlugs: ['games', 'country-quiz', 'capital-quiz', 'flag-quiz', 'world-map-quiz', 'geography-games'],
  };

  return (
    <GameLandingTemplate
      config={config}
      initialQuestions={questions}
      countryName={country.name}
      countrySlug={country.slug}
    />
  );
}
