// ============================================================
// MooEarth Live — Country Intent Quality Gate
// ============================================================
// Central SEO indexing gate for country-specific intent hubs:
//   /countries/[country]/news
//   /countries/[country]/geography
//   /countries/[country]/weather
//   /countries/[country]/map
//   /countries/[country]/quiz
//
// Rejection Invariants:
//   1. Empty pages (no real items, empty bodies)
//   2. Missing data (null/undefined critical attributes)
//   3. Duplicate pages (non-canonical aliases, redundant intents)
//   4. Temporary errors (upstream API timeouts, 5xx responses, 429s)

import { getCountryBySlug, resolveCanonicalSlug, CountryRecord } from '@/data/countries';

export type CountryIntent = 'news' | 'geography' | 'weather' | 'map' | 'quiz';

export interface QualityGateResult {
  shouldIndex: boolean;
  reason: string;
  canonicalSlug: string | null;
  country: CountryRecord | null;
  robotsDirective: {
    index: boolean;
    follow: boolean;
  };
}

export interface NewsIntentData {
  articles: Array<{
    title: string;
    summary?: string;
    source?: string;
    publishedAt?: string;
  }>;
  isTemporaryError?: boolean;
}

export interface WeatherIntentData {
  observation: {
    temperature: number;
    apparentTemperature?: number;
    weatherCode?: number;
    weatherDescription?: string;
    windSpeed?: number;
    timestamp?: string;
  } | null;
  isTemporaryError?: boolean;
}

export interface QuizIntentData {
  questions: Array<{
    id: string;
    question: string;
    choices?: string[];
    correctIndex?: number;
    options?: string[];
    correctAnswer?: string;
  }>;
}

/**
 * Evaluates whether a country × intent combination possesses sufficient,
 * factual real-world data to be indexed by search engines.
 */
export function shouldIndexCountryIntentPage(
  countrySlug: string,
  intent: CountryIntent,
  data?: any
): QualityGateResult {
  if (!countrySlug || typeof countrySlug !== 'string' || countrySlug.trim().length === 0) {
    return {
      shouldIndex: false,
      reason: 'Missing or invalid country slug string',
      canonicalSlug: null,
      country: null,
      robotsDirective: { index: false, follow: false },
    };
  }

  const normalized = countrySlug.trim().toLowerCase();
  const canonical = resolveCanonicalSlug(normalized);
  const country = getCountryBySlug(normalized);

  // Invariant 1: Country existence
  if (!country || !canonical) {
    return {
      shouldIndex: false,
      reason: `Unknown or unverified sovereign country: "${countrySlug}"`,
      canonicalSlug: null,
      country: null,
      robotsDirective: { index: false, follow: false },
    };
  }

  // Invariant 2: Duplicate prevention (alias slug vs canonical slug)
  if (normalized !== country.slug) {
    return {
      shouldIndex: false,
      reason: `Slug "${normalized}" is an alias for canonical "${country.slug}". Prevent duplicate indexation.`,
      canonicalSlug: country.slug,
      country,
      robotsDirective: { index: false, follow: true },
    };
  }

  // Intent-Specific Quality Validations
  switch (intent) {
    case 'news': {
      const newsData = data as NewsIntentData | undefined;

      // Temporary error guard
      if (newsData?.isTemporaryError) {
        return {
          shouldIndex: false,
          reason: 'Temporary news upstream provider error or rate-limit.',
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      // Empty / missing content guard
      const articles = newsData?.articles || [];
      if (!articles || articles.length === 0) {
        return {
          shouldIndex: false,
          reason: `Zero real news events found for ${country.name}. Rejecting empty indexation.`,
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      // Content fidelity validation
      const validArticles = articles.filter(
        a => a.title && a.title.trim().length > 10 && a.source
      );

      if (validArticles.length === 0) {
        return {
          shouldIndex: false,
          reason: 'News articles missing required headlines or source attribution.',
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      return {
        shouldIndex: true,
        reason: `Verified ${validArticles.length} authentic news articles with sources for ${country.name}.`,
        canonicalSlug: country.slug,
        country,
        robotsDirective: { index: true, follow: true },
      };
    }

    case 'geography': {
      // Geography relies on our canonical 195 dataset
      if (!country.geography || country.geography.length < 20) {
        return {
          shouldIndex: false,
          reason: `Insufficient physical terrain records for ${country.name}.`,
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      if (!country.capital || !country.region || !country.landmark) {
        return {
          shouldIndex: false,
          reason: `Missing essential geographical metadata for ${country.name}.`,
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      return {
        shouldIndex: true,
        reason: `Complete canonical physical geography verified for ${country.name}.`,
        canonicalSlug: country.slug,
        country,
        robotsDirective: { index: true, follow: true },
      };
    }

    case 'weather': {
      const weatherData = data as WeatherIntentData | undefined;

      // Temporary upstream error guard
      if (weatherData?.isTemporaryError) {
        return {
          shouldIndex: false,
          reason: 'Temporary weather provider network failure or rate limit.',
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      // Must have actual observation with real temperature
      const obs = weatherData?.observation;
      if (!obs || typeof obs.temperature !== 'number' || isNaN(obs.temperature)) {
        return {
          shouldIndex: false,
          reason: `Missing live weather telemetry observations for ${country.name}.`,
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      // Must have coordinates
      if (!country.coordinates || typeof country.coordinates.lat !== 'number') {
        return {
          shouldIndex: false,
          reason: `Missing GPS centroid coordinates for ${country.name}.`,
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      return {
        shouldIndex: true,
        reason: `Verified live weather telemetry (${obs.temperature}°C) for ${country.name}.`,
        canonicalSlug: country.slug,
        country,
        robotsDirective: { index: true, follow: true },
      };
    }

    case 'map': {
      // Coordinates validation
      const { lat, lng } = country.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        return {
          shouldIndex: false,
          reason: `Invalid geospatial coordinates for ${country.name}.`,
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return {
          shouldIndex: false,
          reason: `Geospatial coordinates out of bounds for ${country.name}.`,
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      if (!country.majorCities || country.majorCities.length === 0) {
        return {
          shouldIndex: false,
          reason: `Zero metropolitan locations registered for ${country.name}.`,
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      return {
        shouldIndex: true,
        reason: `Valid cartographic bounds and ${country.majorCities.length} metropolitan hubs for ${country.name}.`,
        canonicalSlug: country.slug,
        country,
        robotsDirective: { index: true, follow: true },
      };
    }

    case 'quiz': {
      const quizData = data as QuizIntentData | undefined;
      const questions = quizData?.questions || [];

      // Minimum 3 valid questions required for a rich educational indexable quiz hub
      if (questions.length < 3) {
        return {
          shouldIndex: false,
          reason: `Insufficient Play Earth questions (${questions.length}/3 minimum) for ${country.name}.`,
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      // Check structure of questions (no empty choices, valid answer)
      const validQuestions = questions.filter(q => {
        if (!q.question) return false;
        if (q.choices && q.choices.length >= 2 && typeof q.correctIndex === 'number' && q.choices[q.correctIndex]) {
          return true;
        }
        if (q.options && q.options.length >= 2 && q.correctAnswer) {
          return true;
        }
        return false;
      });

      if (validQuestions.length < 3) {
        return {
          shouldIndex: false,
          reason: 'Quiz questions contain malformed options or missing correct answers.',
          canonicalSlug: country.slug,
          country,
          robotsDirective: { index: false, follow: true },
        };
      }

      return {
        shouldIndex: true,
        reason: `Verified ${validQuestions.length} authentic Play Earth geography questions for ${country.name}.`,
        canonicalSlug: country.slug,
        country,
        robotsDirective: { index: true, follow: true },
      };
    }

    default:
      return {
      shouldIndex: false,
      reason: `Unsupported country intent: "${intent}"`,
      canonicalSlug: country.slug,
      country,
      robotsDirective: { index: false, follow: false },
    };
  }
}
