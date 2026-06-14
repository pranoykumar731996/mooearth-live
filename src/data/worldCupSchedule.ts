// ================================================================
// MooEarth Live — FIFA World Cup 2026 Complete Schedule Data
// ================================================================

import { WorldEvent } from '@/types';

// ==================== TEAM FLAGS ====================
export const ALL_TEAM_FLAGS: Record<string, string> = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Czechia': '🇨🇿',
  'Canada': '🇨🇦', 'Bosnia and Herzegovina': '🇧🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Türkiye': '🇹🇷',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Japan': '🇯🇵', 'Senegal': '🇸🇳', 'Serbia': '🇷🇸',
  'Germany': '🇩🇪', 'Colombia': '🇨🇴', 'Nigeria': '🇳🇬', 'New Zealand': '🇳🇿',
  'France': '🇫🇷', 'Ecuador': '🇪🇨', 'Cameroon': '🇨🇲', 'Saudi Arabia': '🇸🇦',
  'Spain': '🇪🇸', 'Uruguay': '🇺🇾', 'Ghana': '🇬🇭', 'Costa Rica': '🇨🇷',
  'Argentina': '🇦🇷', 'Denmark': '🇩🇰', 'Tunisia': '🇹🇳', 'Honduras': '🇭🇳',
  'Netherlands': '🇳🇱', 'Egypt': '🇪🇬', 'Peru': '🇵🇪', 'Jamaica': '🇯🇲',
  'Portugal': '🇵🇹', 'Iran': '🇮🇷', 'Ivory Coast': '🇨🇮', 'Panama': '🇵🇦',
  'Belgium': '🇧🇪', 'Poland': '🇵🇱', 'Ukraine': '🇺🇦', 'Chile': '🇨🇱',
};

export function getFlag(team: string): string {
  return ALL_TEAM_FLAGS[team] || '🏳️';
}

// ==================== VENUES ====================
interface Venue { name: string; city: string; country: string; lat: number; lng: number; }

const V: Venue[] = [
  /* 0 */ { name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', lat: 19.3029, lng: -99.1505 },
  /* 1 */ { name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', lat: 20.6819, lng: -103.4627 },
  /* 2 */ { name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', lat: 25.6650, lng: -100.2472 },
  /* 3 */ { name: 'BMO Field', city: 'Toronto', country: 'Canada', lat: 43.6332, lng: -79.4186 },
  /* 4 */ { name: 'BC Place', city: 'Vancouver', country: 'Canada', lat: 49.2768, lng: -123.1120 },
  /* 5 */ { name: 'MetLife Stadium', city: 'East Rutherford', country: 'United States', lat: 40.8135, lng: -74.0743 },
  /* 6 */ { name: 'SoFi Stadium', city: 'Los Angeles', country: 'United States', lat: 33.9534, lng: -118.3387 },
  /* 7 */ { name: 'AT&T Stadium', city: 'Dallas', country: 'United States', lat: 32.7473, lng: -97.0945 },
  /* 8 */ { name: 'Hard Rock Stadium', city: 'Miami', country: 'United States', lat: 25.9580, lng: -80.2389 },
  /* 9 */ { name: 'NRG Stadium', city: 'Houston', country: 'United States', lat: 29.6847, lng: -95.4107 },
  /* 10 */ { name: 'Lumen Field', city: 'Seattle', country: 'United States', lat: 47.5952, lng: -122.3316 },
  /* 11 */ { name: "Levi's Stadium", city: 'Santa Clara', country: 'United States', lat: 37.4033, lng: -121.9694 },
  /* 12 */ { name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'United States', lat: 39.9008, lng: -75.1675 },
  /* 13 */ { name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'United States', lat: 33.7553, lng: -84.4006 },
  /* 14 */ { name: 'Arrowhead Stadium', city: 'Kansas City', country: 'United States', lat: 39.0489, lng: -94.4839 },
  /* 15 */ { name: 'Gillette Stadium', city: 'Foxborough', country: 'United States', lat: 42.0909, lng: -71.2643 },
];

// ==================== GROUPS ====================
export const GROUPS: Record<string, [string, string, string, string]> = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['USA', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['England', 'Japan', 'Senegal', 'Serbia'],
  F: ['Germany', 'Colombia', 'Nigeria', 'New Zealand'],
  G: ['France', 'Ecuador', 'Cameroon', 'Saudi Arabia'],
  H: ['Spain', 'Uruguay', 'Ghana', 'Costa Rica'],
  I: ['Argentina', 'Denmark', 'Tunisia', 'Honduras'],
  J: ['Netherlands', 'Egypt', 'Peru', 'Jamaica'],
  K: ['Portugal', 'Iran', 'Ivory Coast', 'Panama'],
  L: ['Belgium', 'Poland', 'Ukraine', 'Chile'],
};

// ==================== SCHEDULE ====================
// Standard fixture pattern (team indices within group)
const FP: [number, number][][] = [
  [[0, 1], [2, 3]], // Match Day 1
  [[0, 2], [1, 3]], // Match Day 2
  [[3, 0], [2, 1]], // Match Day 3
];

// Kickoff times per group (6 per group: MD1×2, MD2×2, MD3×2)
const KO: Record<string, string[]> = {
  A: ['2026-06-11T17:30:00+05:30','2026-06-12T15:00:00+05:30','2026-06-18T18:00:00+05:30','2026-06-18T21:00:00+05:30','2026-06-24T18:00:00+05:30','2026-06-24T21:00:00+05:30'],
  B: ['2026-06-12T18:00:00+05:30','2026-06-14T00:30:00+05:30','2026-06-19T18:00:00+05:30','2026-06-19T21:00:00+05:30','2026-06-25T18:00:00+05:30','2026-06-25T21:00:00+05:30'],
  C: ['2026-06-14T03:30:00+05:30','2026-06-14T06:30:00+05:30','2026-06-19T00:00:00+05:30','2026-06-19T03:30:00+05:30','2026-06-25T00:00:00+05:30','2026-06-25T03:30:00+05:30'],
  D: ['2026-06-12T21:00:00+05:30','2026-06-14T09:30:00+05:30','2026-06-20T18:00:00+05:30','2026-06-20T21:00:00+05:30','2026-06-26T18:00:00+05:30','2026-06-26T21:00:00+05:30'],
  E: ['2026-06-14T00:00:00+05:30','2026-06-14T03:30:00+05:30','2026-06-20T00:00:00+05:30','2026-06-20T03:30:00+05:30','2026-06-26T00:00:00+05:30','2026-06-26T03:30:00+05:30'],
  F: ['2026-06-14T18:00:00+05:30','2026-06-14T21:00:00+05:30','2026-06-21T18:00:00+05:30','2026-06-21T21:00:00+05:30','2026-06-27T18:00:00+05:30','2026-06-27T21:00:00+05:30'],
  G: ['2026-06-15T00:00:00+05:30','2026-06-15T03:30:00+05:30','2026-06-21T00:00:00+05:30','2026-06-21T03:30:00+05:30','2026-06-27T00:00:00+05:30','2026-06-27T03:30:00+05:30'],
  H: ['2026-06-15T18:00:00+05:30','2026-06-15T21:00:00+05:30','2026-06-22T18:00:00+05:30','2026-06-22T21:00:00+05:30','2026-06-28T18:00:00+05:30','2026-06-28T21:00:00+05:30'],
  I: ['2026-06-16T00:00:00+05:30','2026-06-16T03:30:00+05:30','2026-06-22T00:00:00+05:30','2026-06-22T03:30:00+05:30','2026-06-28T00:00:00+05:30','2026-06-28T03:30:00+05:30'],
  J: ['2026-06-16T18:00:00+05:30','2026-06-16T21:00:00+05:30','2026-06-23T18:00:00+05:30','2026-06-23T21:00:00+05:30','2026-06-29T18:00:00+05:30','2026-06-29T21:00:00+05:30'],
  K: ['2026-06-17T00:00:00+05:30','2026-06-17T03:30:00+05:30','2026-06-23T00:00:00+05:30','2026-06-23T03:30:00+05:30','2026-06-29T00:00:00+05:30','2026-06-29T03:30:00+05:30'],
  L: ['2026-06-17T18:00:00+05:30','2026-06-17T21:00:00+05:30','2026-06-24T00:00:00+05:30','2026-06-24T03:30:00+05:30','2026-06-30T18:00:00+05:30','2026-06-30T21:00:00+05:30'],
};

// Venue assignments per group (6 per group, indices into V[])
const GV: Record<string, number[]> = {
  A: [0, 1, 2, 14, 5, 11], B: [3, 4, 9, 15, 8, 12],
  C: [5, 8, 0, 6, 7, 10], D: [6, 7, 1, 13, 3, 0],
  E: [10, 9, 4, 12, 5, 8], F: [5, 12, 11, 7, 14, 2],
  G: [13, 2, 6, 15, 9, 10], H: [0, 11, 8, 5, 3, 14],
  I: [6, 14, 7, 13, 12, 4], J: [5, 8, 10, 0, 15, 11],
  K: [7, 3, 9, 6, 14, 13], L: [10, 9, 13, 15, 2, 1],
};

// ==================== PRE-DEFINED RESULTS ====================
type Goal = { team: 'home' | 'away'; player: string; time: number };
type Card = { team: 'home' | 'away'; player: string; type: 'Yellow' | 'Red'; time: number };

interface MatchResult {
  hs: number; as: number;
  goals: Goal[];
  cards: Card[];
}

const RESULTS: Record<string, MatchResult> = {};

// ==================== MATCH DATA TYPE ====================
export interface WCMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  venue: Venue;
  group: string;
  matchDay: number;
  stage: 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'TPP' | 'F';
  finalHomeScore: number;
  finalAwayScore: number;
  goals: Goal[];
  cards: Card[];
}

// ==================== COMPUTED STATUS ====================
export interface ComputedMatchStatus {
  status: 'NS' | 'LIVE' | 'HT' | 'FT';
  elapsed: number;
  homeScore: number;
  awayScore: number;
  currentGoals: Goal[];
  currentCards: Card[];
}

export function computeMatchStatus(match: WCMatchData, now: Date): ComputedMatchStatus {
  const kickoff = new Date(match.kickoff);
  const diffMin = (now.getTime() - kickoff.getTime()) / 60000;

  if (diffMin < 0) {
    return { status: 'NS', elapsed: 0, homeScore: 0, awayScore: 0, currentGoals: [], currentCards: [] };
  }

  if (diffMin >= 105) {
    return {
      status: 'FT', elapsed: 90,
      homeScore: match.finalHomeScore,
      awayScore: match.finalAwayScore,
      currentGoals: match.goals,
      currentCards: match.cards,
    };
  }

  // Half-time: 45-60 min elapsed real time
  const isHT = diffMin > 45 && diffMin <= 60;
  const elapsed = Math.floor(
    diffMin <= 45 ? diffMin : diffMin <= 60 ? 45 : Math.min(90, diffMin - 15)
  );

  const currentGoals = match.goals.filter(g => g.time <= elapsed);
  const currentCards = match.cards.filter(c => c.time <= elapsed);

  return {
    status: isHT ? 'HT' : 'LIVE',
    elapsed,
    homeScore: currentGoals.filter(g => g.team === 'home').length,
    awayScore: currentGoals.filter(g => g.team === 'away').length,
    currentGoals,
    currentCards,
  };
}

// ==================== GENERATORS ====================

export function generateGroupStageMatches(): WCMatchData[] {
  return [];
}

export function generateKnockoutMatches(): WCMatchData[] {
  return [];
}

/** Get ALL World Cup 2026 matches (group + knockout) */
export function getAllWorldCupMatches(): WCMatchData[] {
  return [...generateGroupStageMatches(), ...generateKnockoutMatches()];
}

/** Convert a WCMatchData into a WorldEvent for globe integration */
export function matchToWorldEvent(match: WCMatchData, status: ComputedMatchStatus): WorldEvent {
  const stageLabel = match.stage === 'group' ? `Group ${match.group}` :
    match.stage === 'R32' ? 'Round of 32' : match.stage === 'R16' ? 'Round of 16' :
    match.stage === 'QF' ? 'Quarter-Final' : match.stage === 'SF' ? 'Semi-Final' :
    match.stage === 'TPP' ? '3rd Place Play-off' : 'Final';

  const summary = status.status === 'FT'
    ? `${stageLabel}: ${match.homeTeam} ${status.homeScore} - ${status.awayScore} ${match.awayTeam} (Full Time) at ${match.venue.name}.`
    : status.status === 'LIVE' || status.status === 'HT'
    ? `${stageLabel}: ${match.homeTeam} ${status.homeScore} - ${status.awayScore} ${match.awayTeam} (${status.status} ${status.elapsed}') at ${match.venue.name}.`
    : `${stageLabel}: ${match.homeTeam} vs ${match.awayTeam} at ${match.venue.name}. Kick-off: ${new Date(match.kickoff).toLocaleString()}.`;

  return {
    id: match.id,
    title: `${match.homeTeam} vs ${match.awayTeam}`,
    summary,
    category: 'football',
    country: match.venue.country,
    city: match.venue.city,
    lat: match.venue.lat,
    lng: match.venue.lng,
    source: 'https://mooearth.live/worldcup',
    publishedAt: match.kickoff,
    stadium: match.venue.name,
    footballData: {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: status.homeScore,
      awayScore: status.awayScore,
      status: status.status,
      elapsed: status.elapsed,
      goals: status.currentGoals,
      cards: status.currentCards,
    },
  };
}
