// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Time Provider
// ============================================================
// Generates timezone and day/night challenges using computed
// UTC offsets and solar position. Zero network dependency.
//
// Challenge Types:
//   TIMEZONE_CHALLENGE   — Guess current local time at a city
//   DAY_NIGHT_CHALLENGE  — Find a location where it's day/night

import {
  ChallengeRequest,
  ChallengeType,
  DataProvider,
  EarthChallenge,
  ProviderStatus,
  ChallengeDifficulty,
} from '../types';
import { AntiRepeatEngine } from '../AntiRepeatEngine';
import { adjustTimeLimit, selectCountryForDifficulty } from '../DifficultyEngine';
import { getDefaultTimeLimit, getBasePoints } from '../registry';
import { COUNTRY_COORDINATES } from '@/lib/constants';

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
  return `time-${type}-${target.replace(/\s/g, '').toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Approximate UTC offset from longitude (1 hour per 15° of longitude) */
function estimateUtcOffset(lng: number): number {
  return Math.round(lng / 15);
}

/** Get approximate local time at a given longitude */
function getLocalTime(lng: number): Date {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const offset = estimateUtcOffset(lng);

  const local = new Date(now);
  local.setUTCHours(utcHours + offset, utcMinutes);
  return local;
}

/** Format time as HH:MM (12-hour) */
function formatTime12h(date: Date): string {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/** Check if it's approximately daytime at a given longitude */
function isDaylight(lng: number): boolean {
  const localTime = getLocalTime(lng);
  const hour = localTime.getUTCHours();
  return hour >= 6 && hour < 20; // Simplified 6 AM to 8 PM
}

// ---- Challenge Generators ----

function generateTimezoneChallenge(
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  const entries = Object.entries(COUNTRY_COORDINATES);
  if (entries.length < 4) return null;

  const shuffled = shuffle(entries);
  const [targetKey, targetData] = shuffled[0];

  const localTime = getLocalTime(targetData.lng);
  const correctTimeStr = formatTime12h(localTime);

  // Generate wrong answers (±1-4 hours off)
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, 4]).slice(0, 3);
  const wrongTimes = offsets.map(off => {
    const wrong = new Date(localTime);
    wrong.setUTCHours(wrong.getUTCHours() + off);
    return formatTime12h(wrong);
  });

  const choices = shuffle([correctTimeStr, ...wrongTimes]);
  const correctIndex = choices.indexOf(correctTimeStr);

  const hint = difficulty === 'easy'
    ? `Hint: ${targetData.city || targetKey} is approximately UTC${estimateUtcOffset(targetData.lng) >= 0 ? '+' : ''}${estimateUtcOffset(targetData.lng)}.`
    : undefined;

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('TIMEZONE_CHALLENGE'), difficulty);

  return {
    id: genId('tz', targetData.country || targetKey),
    type: 'TIMEZONE_CHALLENGE',
    engine: 'time',
    difficulty,
    responseType: 'multiple_choice',
    question: `🕐 What is the approximate current local time in ${targetData.city || targetKey}, ${targetData.country || targetKey}?`,
    hint,
    choices,
    correctIndex,
    explanation: `The current time in ${targetData.city || targetKey} is approximately ${correctTimeStr} (UTC${estimateUtcOffset(targetData.lng) >= 0 ? '+' : ''}${estimateUtcOffset(targetData.lng)}).`,
    targetCountry: targetData.country || targetKey,
    targetCity: targetData.city || targetKey,
    targetCoordinates: { lat: targetData.lat, lng: targetData.lng },
    points: getBasePoints('TIMEZONE_CHALLENGE', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint(
      'time', 'TIMEZONE_CHALLENGE', targetData.country || targetKey
    ),
  };
}

function generateDayNightChallenge(
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  const entries = Object.entries(COUNTRY_COORDINATES);
  if (entries.length < 2) return null;

  // Decide if we're looking for daytime or nighttime
  const seekDay = Math.random() > 0.5;
  const label = seekDay ? 'daytime' : 'nighttime';
  const emoji = seekDay ? '☀️' : '🌙';

  // Find matching cities
  const matching = entries.filter(([, d]) => isDaylight(d.lng) === seekDay);
  if (matching.length === 0) return null;

  const target = shuffle(matching)[0];
  const [targetKey, targetData] = target;

  const hint = difficulty === 'easy'
    ? `Hint: Look for locations ${seekDay ? 'facing the sun (in the light zone)' : 'away from the sun (in the shadow zone)'}.`
    : undefined;

  const timeLimit = adjustTimeLimit(getDefaultTimeLimit('DAY_NIGHT_CHALLENGE'), difficulty);

  return {
    id: genId('daynight', targetData.country || targetKey),
    type: 'DAY_NIGHT_CHALLENGE',
    engine: 'time',
    difficulty,
    responseType: 'globe_tap',
    question: `${emoji} Find a country where it is currently ${label}.`,
    hint,
    explanation: `${emoji} ${targetData.city || targetKey}, ${targetData.country || targetKey} is currently experiencing ${label} (local time: ~${formatTime12h(getLocalTime(targetData.lng))}).`,
    targetCountry: targetData.country || targetKey,
    targetCity: targetData.city || targetKey,
    targetCoordinates: { lat: targetData.lat, lng: targetData.lng },
    points: getBasePoints('DAY_NIGHT_CHALLENGE', difficulty),
    timeLimit,
    generatedAt: new Date().toISOString(),
    fingerprint: AntiRepeatEngine.computeFingerprint(
      'time', 'DAY_NIGHT_CHALLENGE', `${label}:${targetData.country || targetKey}`
    ),
    data: {
      seekingDaylight: seekDay,
      localTime: formatTime12h(getLocalTime(targetData.lng)),
    },
  };
}

// ---- Provider Implementation ----

const SUPPORTED_TYPES: ChallengeType[] = [
  'TIMEZONE_CHALLENGE',
  'DAY_NIGHT_CHALLENGE',
];

export const TimeProvider: DataProvider = {
  engine: 'time',
  supportedTypes: SUPPORTED_TYPES,

  async isAvailable(): Promise<boolean> {
    return true; // Always available — no network dependency
  },

  getStatus(): ProviderStatus {
    return {
      name: 'Time Provider',
      engine: 'time',
      available: true,
      lastSuccessfulFetch: Date.now(),
      lastError: null,
      cacheStatus: 'fresh',
      latencyMs: 0,
    };
  },

  async generateChallenge(request: ChallengeRequest): Promise<EarthChallenge | null> {
    const difficulty = request.difficulty || 'medium';

    if (request.type) {
      return generateTimeByType(request.type, difficulty);
    }

    const shuffledTypes = shuffle(SUPPORTED_TYPES);
    for (const type of shuffledTypes) {
      const challenge = generateTimeByType(type, difficulty);
      if (challenge) return challenge;
    }

    return null;
  },
};

function generateTimeByType(
  type: ChallengeType,
  difficulty: ChallengeDifficulty
): EarthChallenge | null {
  switch (type) {
    case 'TIMEZONE_CHALLENGE':
      return generateTimezoneChallenge(difficulty);
    case 'DAY_NIGHT_CHALLENGE':
      return generateDayNightChallenge(difficulty);
    default:
      return null;
  }
}
