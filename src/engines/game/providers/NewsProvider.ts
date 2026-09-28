// ============================================================
// MooEarth Live — Infinite Earth Game Engine: News Provider
// ============================================================
// Generates challenges from the existing live news pipeline.
// Reuses fetchLiveNews() and WorldEvent data already flowing
// through the MooEarth news ingestion system.
//
// Challenge Types:
//   NEWS_DETECTIVE        — Identify the country from news clues
//   NEWS_LOCATION         — Find where a news event happened (globe tap)
//   BREAKING_NEWS_CHALLENGE — Time-sensitive breaking news location hunt

import {
  ChallengeRequest,
  ChallengeType,
  DataProvider,
  EarthChallenge,
  ProviderStatus,
  ChallengeDifficulty,
} from '../types';
import { AntiRepeatEngine } from '../AntiRepeatEngine';
import { adjustTimeLimit } from '../DifficultyEngine';
import { getDefaultTimeLimit, getBasePoints } from '../registry';
import { WorldEvent } from '@/types';
import { fetchLiveNews } from '@/services/news';
import { demoEvents } from '@/data/events';
import { COUNTRY_METADATA, CountryMeta } from '@/data/questions/countryMetadata';

// ---- Configuration ----

const NEWS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---- Cache ----

interface NewsCacheEntry {
  events: WorldEvent[];
  fetchedAt: number;
  expiresAt: number;
}

let newsCache: NewsCacheEntry | null = null;

// ---- Helpers ----

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genId(type: string, target: string): string {
  return `news-${type}-${target.replace(/\s/g, '').toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Strip country mentions from text to create redacted clues */
function redactCountryFromText(text: string, country: string): string {
  const patterns = [
    new RegExp(`\\b${country}\\b`, 'gi'),
    // Also redact common variations
    new RegExp(`\\b${country}'s\\b`, 'gi'),
    new RegExp(`\\bin ${country}\\b`, 'gi'),
  ];
  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

/** Get random decoy countries that are different from the answer */
function getDecoyCountries(correctCountry: string, count: number): string[] {
  const allCountries = (Object.values(COUNTRY_METADATA) as CountryMeta[])
    .map(m => m.name)
    .filter(n => n.toLowerCase() !== correctCountry.toLowerCase());
  return shuffle(allCountries).slice(0, count);
}

// ---- Data Fetching ----

async function getNewsEvents(): Promise<WorldEvent[]> {
  const now = Date.now();

  if (newsCache && now < newsCache.expiresAt) {
    return newsCache.events;
  }

  try {
    const result = await fetchLiveNews();
    const events = (result.events || []).filter(
      e => e.country && e.title && e.lat && e.lng
    );

    const finalEvents = events.length >= 4 ? events : demoEvents;

    newsCache = {
      events: finalEvents,
      fetchedAt: now,
      expiresAt: now + NEWS_CACHE_TTL_MS,
    };

    return finalEvents;
  } catch {
    return newsCache?.events || demoEvents;
  }
}

// ---- Challenge Generators ----

function generateNewsDetective(
  events: WorldEvent[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  const usableEvents = events.filter(e => e.country && e.summary && e.summary.length > 20);
  if (usableEvents.length === 0) return null;

  const event = shuffle(usableEvents)[0];
  const redactedSummary = redactCountryFromText(event.summary, event.country);
  const redactedTitle = redactCountryFromText(event.title, event.country);

  // Build multiple-choice options
  const decoys = getDecoyCountries(event.country, 3);
  const choices = shuffle([event.country, ...decoys]);
  const correctIndex = choices.indexOf(event.country);

  // Clue building based on difficulty
  let clue: string;
  if (difficulty === 'easy') {
    clue = `📰 "${redactedTitle}"\n\n${redactedSummary}`;
  } else if (difficulty === 'medium') {
    clue = `📰 "${redactedTitle}"`;
  } else {
    // Hard/expert: only the first part of the summary
    const words = redactedSummary.split(' ').slice(0, 12).join(' ');
    clue = `📰 "${words}..."`;
  }

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('NEWS_DETECTIVE'), difficulty);

  return {
    id: genId('detective', event.country),
    type: 'NEWS_DETECTIVE',
    engine: 'news',
    difficulty,
    responseType: 'multiple_choice',
    question: `🕵️ Which country is this news story about?`,
    hint: clue,
    choices,
    correctIndex,
    explanation: `📰 ${event.title}\n\nThis story is about ${event.country}. ${event.summary.slice(0, 100)}...`,
    targetCountry: event.country,
    targetCity: event.city,
    targetCoordinates: { lat: event.lat, lng: event.lng },
    points: getBasePoints('NEWS_DETECTIVE', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint(
      'news', 'NEWS_DETECTIVE', event.country, event.publishedAt
    ),
    source: event.source,
    sourceDataTimestamp: event.publishedAt,
    data: {
      originalTitle: event.title,
      originalSummary: event.summary,
      newsId: event.id,
    },
  };
}

function generateNewsLocation(
  events: WorldEvent[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  const usableEvents = events.filter(
    e => e.country && e.lat && e.lng && e.title
  );
  if (usableEvents.length === 0) return null;

  const event = shuffle(usableEvents)[0];

  // For easy: give the country name, ask to find it on globe
  // For harder: redact the country, give only the headline
  const questionText = difficulty === 'easy' || difficulty === 'medium'
    ? `📰 This event happened in ${event.country}. Find it on the globe:\n"${event.title}"`
    : `📰 Find where this event happened:\n"${redactCountryFromText(event.title, event.country)}"`;

  const hint = difficulty === 'easy'
    ? `Hint: Look in ${event.city || event.country}.`
    : undefined;

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('NEWS_LOCATION'), difficulty);

  return {
    id: genId('location', event.country),
    type: 'NEWS_LOCATION',
    engine: 'news',
    difficulty,
    responseType: 'globe_tap',
    question: questionText,
    hint,
    explanation: `📰 ${event.title}\n\n📍 ${event.city}, ${event.country}`,
    targetCountry: event.country,
    targetCity: event.city,
    targetCoordinates: { lat: event.lat, lng: event.lng },
    points: getBasePoints('NEWS_LOCATION', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint(
      'news', 'NEWS_LOCATION', event.country, event.publishedAt
    ),
    source: event.source,
    sourceDataTimestamp: event.publishedAt,
    data: {
      originalTitle: event.title,
      newsId: event.id,
    },
  };
}

function generateBreakingNewsChallenge(
  events: WorldEvent[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  // Breaking news: prioritize the most recent events
  const now = Date.now();
  const recentEvents = events
    .filter(e => {
      const age = now - new Date(e.publishedAt).getTime();
      return age < 2 * 60 * 60 * 1000; // Within last 2 hours
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const targetEvents = recentEvents.length > 0 ? recentEvents : events;
  if (targetEvents.length === 0) return null;

  const event = targetEvents[0]; // Most recent event

  const hint = difficulty === 'easy'
    ? `🔴 BREAKING: "${event.title}" — Find ${event.country} on the globe!`
    : `🔴 BREAKING: "${redactCountryFromText(event.title, event.country)}" — Where did this happen?`;

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('BREAKING_NEWS_CHALLENGE'), difficulty);

  return {
    id: genId('breaking', event.country),
    type: 'BREAKING_NEWS_CHALLENGE',
    engine: 'news',
    difficulty,
    responseType: 'globe_tap',
    question: `🔴 BREAKING NEWS — Find the country!`,
    hint,
    explanation: `🔴 ${event.title}\n\n📍 ${event.city}, ${event.country}\n\nBreaking stories earn bonus points!`,
    targetCountry: event.country,
    targetCity: event.city,
    targetCoordinates: { lat: event.lat, lng: event.lng },
    points: getBasePoints('BREAKING_NEWS_CHALLENGE', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint(
      'news', 'BREAKING_NEWS_CHALLENGE', event.country, event.publishedAt
    ),
    source: event.source,
    sourceDataTimestamp: event.publishedAt,
    data: {
      originalTitle: event.title,
      originalSummary: event.summary,
      newsId: event.id,
      isBreaking: true,
      ageMs: now - new Date(event.publishedAt).getTime(),
    },
  };
}

// ---- Provider Implementation ----

const SUPPORTED_TYPES: ChallengeType[] = [
  'NEWS_DETECTIVE',
  'NEWS_LOCATION',
  'BREAKING_NEWS_CHALLENGE',
];

export const NewsProvider: DataProvider = {
  engine: 'news',
  supportedTypes: SUPPORTED_TYPES,

  async isAvailable(): Promise<boolean> {
    try {
      if (newsCache && Date.now() < newsCache.expiresAt) return true;
      const events = await getNewsEvents();
      return events.length > 0;
    } catch {
      return newsCache !== null;
    }
  },

  getStatus(): ProviderStatus {
    return {
      name: 'News Provider (Google News RSS)',
      engine: 'news',
      available: newsCache !== null,
      lastSuccessfulFetch: newsCache?.fetchedAt ?? null,
      lastError: null,
      cacheStatus: newsCache
        ? Date.now() < newsCache.expiresAt ? 'fresh' : 'stale'
        : 'empty',
      latencyMs: null,
    };
  },

  async generateChallenge(request: ChallengeRequest): Promise<EarthChallenge | null> {
    const difficulty = request.difficulty || 'medium';

    let events: WorldEvent[];
    try {
      events = await getNewsEvents();
    } catch {
      return null;
    }

    if (events.length === 0) return null;

    if (request.type) {
      return generateNewsByType(request.type, events, difficulty);
    }

    const shuffledTypes = shuffle(SUPPORTED_TYPES);
    for (const type of shuffledTypes) {
      const challenge = generateNewsByType(type, events, difficulty);
      if (challenge) return challenge;
    }

    return null;
  },
};

function generateNewsByType(
  type: ChallengeType,
  events: WorldEvent[],
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  switch (type) {
    case 'NEWS_DETECTIVE':
      return generateNewsDetective(events, difficulty);
    case 'NEWS_LOCATION':
      return generateNewsLocation(events, difficulty);
    case 'BREAKING_NEWS_CHALLENGE':
      return generateBreakingNewsChallenge(events, difficulty);
    default:
      return null;
  }
}
