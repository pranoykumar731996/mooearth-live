// ============================================================
// MooEarth Live — Infinite Earth Game Engine: AI Mission Provider
// ============================================================
// Synthesizes multi-source intelligence combining live news events,
// real-time weather, solar day/night status, and geopolitical borders
// into high-stakes narrative reconnaissance missions.
//
// Challenge Types:
//   AI_COMBINED_MISSION — Multi-source satellite & intelligence recon

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
import { COUNTRY_METADATA, CountryMeta } from '@/data/questions/countryMetadata';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { fetchLiveNews } from '@/services/news';
import { WorldEvent } from '@/types';

// ---- Mission Codename Generator ----

const CODENAME_PREFIXES = [
  'OPERATION ECLIPSE',
  'OPERATION HORIZON',
  'OPERATION CIPHER',
  'OPERATION MERIDIAN',
  'OPERATION NIGHTFALL',
  'OPERATION SENTINEL',
  'OPERATION VANGUARD',
  'OPERATION ZEPHYR',
  'OPERATION AEGIS',
  'OPERATION CROSSWIND',
];

const CODENAME_SUFFIXES = [
  'PRIME',
  'RECON',
  'DELTA',
  'OMEGA',
  'VECTOR',
  'SHADOW',
  'GENESIS',
  'NEXUS',
];

function getRandomCodename(): string {
  const prefix = CODENAME_PREFIXES[Math.floor(Math.random() * CODENAME_PREFIXES.length)];
  const suffix = CODENAME_SUFFIXES[Math.floor(Math.random() * CODENAME_SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}

// ---- Helpers ----

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genId(target: string): string {
  return `ai-mission-${target.replace(/\s/g, '').toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Check if it's currently daytime or nighttime at target longitude */
function getDayNightStatus(lng: number): { isDay: boolean; phase: string } {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const offset = Math.round(lng / 15);
  const localHour = ((utcHours + offset) % 24 + 24) % 24;
  const isDay = localHour >= 6 && localHour < 19;
  return {
    isDay,
    phase: isDay ? 'Daylight (Sunlit)' : 'Night (Cover of Darkness)',
  };
}

/** Filter and redact country mentions from headline */
function redactCountry(text: string, country: string): string {
  const patterns = [
    new RegExp(`\\b${country}\\b`, 'gi'),
    new RegExp(`\\b${country}'s\\b`, 'gi'),
    new RegExp(`\\bin ${country}\\b`, 'gi'),
  ];
  let res = text;
  for (const p of patterns) {
    res = res.replace(p, '[REDACTED_NATION]');
  }
  return res;
}

/** Fetch cached or live events */
let cachedEvents: WorldEvent[] = [];
let eventsCacheTime = 0;
const EVENTS_CACHE_TTL = 5 * 60 * 1000;

async function getLiveEventsSafe(): Promise<WorldEvent[]> {
  const now = Date.now();
  if (cachedEvents.length > 0 && now - eventsCacheTime < EVENTS_CACHE_TTL) {
    return cachedEvents;
  }
  try {
    const res = await fetchLiveNews();
    if (res && res.events && res.events.length > 0) {
      cachedEvents = res.events;
      eventsCacheTime = now;
      return cachedEvents;
    }
  } catch (err) {
    console.warn('[AIMissionProvider] Live news fetch fallback:', err);
  }
  return cachedEvents;
}

// ---- AI Mission Provider Implementation ----

export const AIMissionProvider: DataProvider = {
  engine: 'ai_mission',

  async isAvailable(): Promise<boolean> {
    return true; // Always available with robust offline fallback
  },

  supportedTypes: ['AI_COMBINED_MISSION'],

  getStatus(): ProviderStatus {
    return {
      name: 'AI Mission Provider (Multi-Source Synthesis)',
      engine: 'ai_mission',
      available: true,
      lastSuccessfulFetch: eventsCacheTime || Date.now(),
      lastError: null,
      cacheStatus: cachedEvents.length > 0 ? 'fresh' : 'empty',
      latencyMs: null,
    };
  },

  async generateChallenge(request: ChallengeRequest): Promise<EarthChallenge | null> {
    const difficulty: ChallengeDifficulty = request.difficulty || 'medium';
    const validCountryNames = Object.keys(COUNTRY_METADATA).filter(k => Boolean(COUNTRY_COORDINATES[k]));
    if (validCountryNames.length === 0) return null;

    let targetCountryName = request.targetCountry || selectCountryForDifficulty(difficulty);
    if (!targetCountryName || !COUNTRY_COORDINATES[targetCountryName] || !COUNTRY_METADATA[targetCountryName]) {
      targetCountryName = validCountryNames[Math.floor(Math.random() * validCountryNames.length)];
    }

    const countryMeta = COUNTRY_METADATA[targetCountryName] as CountryMeta | undefined;
    const countryCoords = COUNTRY_COORDINATES[targetCountryName];
    if (!countryMeta || !countryCoords) return null;

    // 1. Telemetry 1: Solar & Chrono Data
    const { isDay, phase } = getDayNightStatus(countryCoords.lng);

    // 2. Telemetry 2: Live News / Intelligence Intercept
    const liveEvents = await getLiveEventsSafe();
    const matchingEvent = liveEvents.find(
      e => e.country && e.country.toLowerCase() === targetCountryName.toLowerCase()
    );

    let interceptClue: string;
    let articleUrl: string | undefined;
    let headlineSource: string | undefined;

    if (matchingEvent && matchingEvent.title) {
      interceptClue = `Signal Intercept: "${redactCountry(matchingEvent.title, targetCountryName)}"`;
      articleUrl = matchingEvent.source;
      headlineSource = matchingEvent.source;
    } else {
      // Fallback geopolitical telemetry
      const capital = countryMeta.capital;
      const continent = countryMeta.continent;
      interceptClue = `Geopolitical Intel: Government headquarters stationed at ${capital} within the ${continent} theatre.`;
    }

    // 3. Telemetry 3: Geodesic & Border Recon
    const neighbours = countryMeta.neighbours && countryMeta.neighbours.length > 0
      ? countryMeta.neighbours.slice(0, 3).join(', ')
      : 'Surrounded by maritime coastal boundaries';
    const borderClue = `Border Radar: Shares verified territorial perimeter with ${neighbours}.`;

    // 4. Mission Narrative Briefing
    const codename = getRandomCodename();
    const missionBriefing = [
      `🌐 [${codename}] MULTI-SPECTRUM INTELLIGENCE DISPATCH:`,
      `1. CHRONO SENSOR: Target territory is currently operating under ${phase}.`,
      `2. SATELLITE RADAR: ${borderClue}`,
      `3. COMM INTERCEPT: ${interceptClue}`,
      `Lock onto and tap the target nation on the 3D globe.`
    ].join('\n\n');

    // 5. Decoys for multiple choice or path options
    const allMetaCountries = Object.values(COUNTRY_METADATA) as CountryMeta[];
    const sameContinent = allMetaCountries
      .filter(m => m.name !== targetCountryName && m.continent === countryMeta.continent)
      .map(m => m.name);
    const otherCountries = allMetaCountries
      .filter(m => m.name !== targetCountryName)
      .map(m => m.name);

    const pool = sameContinent.length >= 3 ? sameContinent : otherCountries;
    const decoys = shuffle(pool).slice(0, 3);
    const choices = shuffle([targetCountryName, ...decoys]);
    const correctIndex = choices.indexOf(targetCountryName);

    const basePoints = getBasePoints('AI_COMBINED_MISSION', difficulty);
    const baseTimeLimit = getDefaultTimeLimit('AI_COMBINED_MISSION');
    const timeLimit = adjustTimeLimit(baseTimeLimit, difficulty);

    const challenge: EarthChallenge = {
      id: genId(targetCountryName),
      engine: 'ai_mission',
      type: 'AI_COMBINED_MISSION',
      difficulty,
      question: missionBriefing,
      hint: borderClue,
      choices,
      correctIndex,
      targetCountry: targetCountryName,
      targetCoordinates: {
        lat: countryCoords.lat,
        lng: countryCoords.lng,
      },
      responseType: 'globe_tap',
      explanation: `${targetCountryName} is the target nation satisfying all intelligence criteria. It is located in ${countryMeta.continent}, borders ${neighbours}, and its capital is ${countryMeta.capital}.${headlineSource ? ` Live report from ${headlineSource}.` : ''}`,
      timeLimit,
      points: basePoints,
      source: 'MooEarth AI Intelligence Engine (Multi-Source Synthesis)',
      generatedAt: new Date().toISOString(),
      fingerprint: AntiRepeatEngine.computeFingerprint(
        'ai_mission',
        'AI_COMBINED_MISSION',
        targetCountryName,
        codename
      ),
      data: {
        codename,
        phase,
        interceptClue,
        articleUrl,
      },
    };

    return challenge;
  },
};
