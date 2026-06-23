/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorldEvent } from '@/types';
import { getCoordinatesForCountry } from '@/lib/constants';

// Map common football teams/cities to coordinates
const stadiumMap: Record<string, { lat: number; lng: number; country: string; city: string }> = {
  'Real Madrid': { lat: 40.4530, lng: -3.6883, country: 'Spain', city: 'Madrid' },
  'Barcelona': { lat: 41.3809, lng: 2.1228, country: 'Spain', city: 'Barcelona' },
  'Manchester United': { lat: 53.4631, lng: -2.2913, country: 'United Kingdom', city: 'Manchester' },
  'Liverpool': { lat: 53.4308, lng: -2.9608, country: 'United Kingdom', city: 'Liverpool' },
  'Bayern Munich': { lat: 48.2188, lng: 11.6247, country: 'Germany', city: 'Munich' },
  'PSG': { lat: 48.8414, lng: 2.2530, country: 'France', city: 'Paris' },
  'Juventus': { lat: 45.1096, lng: 7.6413, country: 'Italy', city: 'Turin' },
  'AC Milan': { lat: 45.4781, lng: 9.1240, country: 'Italy', city: 'Milan' },
  'London': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', city: 'London' },
  'Madrid': { lat: 40.4168, lng: -3.7038, country: 'Spain', city: 'Madrid' },
  'Paris': { lat: 48.8566, lng: 2.3522, country: 'France', city: 'Paris' },
  'Rome': { lat: 41.9028, lng: 12.4964, country: 'Italy', city: 'Rome' },
  'Berlin': { lat: 52.5200, lng: 13.4050, country: 'Germany', city: 'Berlin' },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816, country: 'Argentina', city: 'Buenos Aires' },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729, country: 'Brazil', city: 'Rio de Janeiro' },
};

// Venue coordinates mapping for World Cup 2026
const venueMap: Record<string, { lat: number; lng: number; country: string; city: string }> = {
  'Estadio Azteca': { lat: 19.3029, lng: -99.1505, country: 'Mexico', city: 'Mexico City' },
  'Estadio Akron': { lat: 20.6819, lng: -103.4627, country: 'Mexico', city: 'Guadalajara' },
  'Estadio BBVA': { lat: 25.6650, lng: -100.2472, country: 'Mexico', city: 'Monterrey' },
  'BMO Field': { lat: 43.6332, lng: -79.4186, country: 'Canada', city: 'Toronto' },
  'BC Place': { lat: 49.2768, lng: -123.1120, country: 'Canada', city: 'Vancouver' },
  'MetLife Stadium': { lat: 40.8135, lng: -74.0743, country: 'United States', city: 'East Rutherford' },
  'SoFi Stadium': { lat: 33.9534, lng: -118.3387, country: 'United States', city: 'Los Angeles' },
  'AT&T Stadium': { lat: 32.7473, lng: -97.0945, country: 'United States', city: 'Dallas' },
  'Hard Rock Stadium': { lat: 25.9580, lng: -80.2389, country: 'United States', city: 'Miami' },
  'NRG Stadium': { lat: 29.6847, lng: -95.4107, country: 'United States', city: 'Houston' },
  'Lumen Field': { lat: 47.5952, lng: -122.3316, country: 'United States', city: 'Seattle' },
  "Levi's Stadium": { lat: 37.4033, lng: -121.9694, country: 'United States', city: 'Santa Clara' },
  'Lincoln Financial Field': { lat: 39.9008, lng: -75.1675, country: 'United States', city: 'Philadelphia' },
  'Mercedes-Benz Stadium': { lat: 33.7553, lng: -84.4006, country: 'United States', city: 'Atlanta' },
  'Arrowhead Stadium': { lat: 39.0489, lng: -94.4839, country: 'United States', city: 'Kansas City' },
  'Gillette Stadium': { lat: 42.0909, lng: -71.2643, country: 'United States', city: 'Foxborough' },
};

function getVenueInfo(venueName: string, cityName: string, countryName: string) {
  if (venueName && venueMap[venueName]) return venueMap[venueName];
  for (const [key, val] of Object.entries(venueMap)) {
    if (venueName && (venueName.includes(key) || key.includes(venueName))) return val;
  }
  
  const geo = getCoordinatesForCountry(countryName) || { lat: 40.4168, lng: -3.7038 };
  return {
    lat: geo.lat,
    lng: geo.lng,
    country: countryName || 'World',
    city: cityName || 'Host City'
  };
}

// Caching structure
let cacheMatches: any = null;
let cacheMatchesTime = 0;

let cacheStandings: any = null;
let cacheStandingsTime = 0;

let cacheScorers: any = null;
let cacheScorersTime = 0;

const cacheStatistics: Record<number, { data: any; time: number }> = {};

// In-Memory Diagnostics state
export interface DiagnosticData {
  apiStatus: 'HEALTHY' | 'UNHEALTHY' | 'NOT_TESTED';
  apiKeyLoaded: boolean;
  apiKeyMasked: string;
  leagueId: number;
  seasonId: number;
  lastRequestTime: string | null;
  lastResponseTime: string | null;
  lastResponseStatus: number | null;
  requestsLimit: number | null;
  requestsRemaining: number | null;
  errorLogs: { timestamp: string; error: string }[];
  rawResponsePreview: any;
}

const diagnostics: DiagnosticData = {
  apiStatus: 'NOT_TESTED',
  apiKeyLoaded: false,
  apiKeyMasked: '',
  leagueId: 1,
  seasonId: 2026,
  lastRequestTime: null,
  lastResponseTime: null,
  lastResponseStatus: null,
  requestsLimit: null,
  requestsRemaining: null,
  errorLogs: [],
  rawResponsePreview: null
};

// Mask API Key
const key = process.env.FOOTBALL_API_KEY;
diagnostics.apiKeyLoaded = !!key;
if (key) {
  diagnostics.apiKeyMasked = key.substring(0, 5) + '...' + key.substring(key.length - 5);
}

function logError(msg: string) {
  console.warn(`[Football Service Error]: ${msg}`);
  diagnostics.errorLogs.unshift({
    timestamp: new Date().toISOString(),
    error: msg
  });
  if (diagnostics.errorLogs.length > 20) {
    diagnostics.errorLogs.pop();
  }
}

async function callFootballApi(endpoint: string): Promise<any> {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    const errorMsg = 'FOOTBALL_API_KEY is not defined in the environment';
    logError(errorMsg);
    diagnostics.apiStatus = 'UNHEALTHY';
    throw new Error(errorMsg);
  }

  diagnostics.lastRequestTime = new Date().toISOString();
  
  try {
    const response = await fetch(`https://v3.football.api-sports.io/${endpoint}`, {
      headers: {
        'x-apisports-key': apiKey
      },
      cache: 'no-store'
    });

    diagnostics.lastResponseTime = new Date().toISOString();
    diagnostics.lastResponseStatus = response.status;

    // Capture rate limits from headers
    const limitHeader = response.headers.get('x-ratelimit-requests-limit');
    const remainingHeader = response.headers.get('x-ratelimit-requests-remaining');
    if (limitHeader) diagnostics.requestsLimit = parseInt(limitHeader, 10);
    if (remainingHeader) diagnostics.requestsRemaining = parseInt(remainingHeader, 10);

    if (!response.ok) {
      const errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      logError(errorMsg);
      diagnostics.apiStatus = 'UNHEALTHY';
      throw new Error(errorMsg);
    }

    const data = await response.json();
    diagnostics.rawResponsePreview = data;

    if (data.errors && Object.keys(data.errors).length > 0) {
      const errorMsg = typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors);
      logError(`API returned errors: ${errorMsg}`);
      diagnostics.apiStatus = 'UNHEALTHY';
      throw new Error(`Football API error: ${errorMsg}`);
    }

    diagnostics.apiStatus = 'HEALTHY';
    return data;
  } catch (error: any) {
    logError(error?.message || 'Unknown network or parsing error');
    diagnostics.apiStatus = 'UNHEALTHY';
    throw error;
  }
}

// -------------------------------------------------------------
// Original function (kept for general sports page / backwards compatibility)
// -------------------------------------------------------------
export async function fetchLiveFootball(): Promise<{ events: WorldEvent[]; active: boolean }> {
  try {
    const data = await callFootballApi('fixtures?live=all');
    const matches = data.response || [];

    const events = matches.map((match: any, index: number) => {
      const homeTeam = match.teams?.home?.name || 'Unknown Home';
      const awayTeam = match.teams?.away?.name || 'Unknown Away';
      const city = match.fixture?.venue?.city || '';
      const country = match.league?.country || 'Unknown';
      
      const geo = stadiumMap[homeTeam] || stadiumMap[city] || getCoordinatesForCountry(country) || { 
        lat: 40.4168, 
        lng: -3.7038, 
        country: country, 
        city: city || 'Unknown City'
      }; 
      
      return {
        id: `football-${match.fixture?.id || Date.now()}-${index}`,
        title: `${homeTeam} vs ${awayTeam}`,
        summary: `Live match in ${match.league?.name || 'Unknown League'}. Current score: ${match.goals?.home ?? 0} - ${match.goals?.away ?? 0}.`,
        category: 'football' as any,
        country: geo.country,
        city: geo.city,
        lat: geo.lat,
        lng: geo.lng,
        source: 'https://www.api-football.com',
        publishedAt: match.fixture?.date || new Date().toISOString(),
        footballData: {
          homeTeam,
          awayTeam,
          homeScore: match.goals?.home ?? 0,
          awayScore: match.goals?.away ?? 0,
          status: match.fixture?.status?.short || 'LIVE',
          elapsed: match.fixture?.status?.elapsed || 0,
          goals: match.events?.filter((e: any) => e.type === 'Goal').map((e: any) => ({
            team: e.team.id === match.teams?.home?.id ? 'home' : 'away',
            player: e.player.name,
            time: e.time.elapsed
          })) || [],
          cards: match.events?.filter((e: any) => e.type === 'Card').map((e: any) => ({
            team: e.team.id === match.teams?.home?.id ? 'home' : 'away',
            player: e.player.name,
            type: e.detail.includes('Yellow') ? 'Yellow' : 'Red',
            time: e.time.elapsed
          })) || [],
          leagueId: match.league?.id,
        }
      };
    });
    return { events, active: true };
  } catch (error) {
    return { events: [], active: false };
  }
}

// -------------------------------------------------------------
// World Cup Matches Endpoint
// -------------------------------------------------------------
export async function fetchWorldCupMatches(refresh = false): Promise<any[]> {
  const now = Date.now();
  if (!refresh && cacheMatches && (now - cacheMatchesTime < 30000)) {
    return cacheMatches;
  }

  try {
    const data = await callFootballApi('fixtures?league=1&season=2026');
    const rawMatches = data.response || [];

    // Map raw API matches to WCMatchData shape
    const formattedMatches = await Promise.all(rawMatches.map(async (item: any) => {
      const homeTeam = item.teams.home.name;
      const awayTeam = item.teams.away.name;
      const round = item.league.round;
      
      // Determine stage
      let stage: 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'TPP' | 'F' = 'group';
      if (round.includes('Round of 32')) stage = 'R32';
      else if (round.includes('Round of 16')) stage = 'R16';
      else if (round.includes('Quarter-finals')) stage = 'QF';
      else if (round.includes('Semi-finals')) stage = 'SF';
      else if (round.includes('3rd Place') || round.includes('Third Place')) stage = 'TPP';
      else if (round.includes('Final')) stage = 'F';

      // Parse group name
      let group = 'KO';
      if (stage === 'group') {
        const groupMatch = round.match(/Group\s+([A-L])/i);
        group = groupMatch ? groupMatch[1].toUpperCase() : 'A';
      }

      const venueInfo = getVenueInfo(item.fixture.venue.name, item.fixture.venue.city, item.league.country);

      const baseMatch = {
        id: `wc26-${item.fixture.id}`,
        homeTeam,
        awayTeam,
        kickoff: item.fixture.date,
        venue: {
          name: item.fixture.venue.name || 'TBD Stadium',
          city: venueInfo.city,
          country: venueInfo.country,
          lat: venueInfo.lat,
          lng: venueInfo.lng,
        },
        group,
        matchDay: round.includes('-') ? parseInt(round.split('-')[1], 10) || 1 : 1,
        stage,
        finalHomeScore: item.goals.home ?? 0,
        finalAwayScore: item.goals.away ?? 0,
        goals: [] as any[],
        cards: [] as any[],
        apiData: {
          status: item.fixture.status.short,
          elapsed: item.fixture.status.elapsed || 0,
          homeScore: item.goals.home ?? 0,
          awayScore: item.goals.away ?? 0
        }
      };

      // If the match is currently live, fetch its full detail (goals, cards, events)
      const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(item.fixture.status.short);
      if (isLive) {
        try {
          const detailRes = await callFootballApi(`fixtures?id=${item.fixture.id}`);
          if (detailRes.response && detailRes.response.length > 0) {
            const detail = detailRes.response[0];
            baseMatch.goals = detail.events?.filter((e: any) => e.type === 'Goal').map((e: any) => ({
              team: e.team.id === detail.teams?.home?.id ? 'home' : 'away',
              player: e.player.name,
              time: e.time.elapsed
            })) || [];
            
            baseMatch.cards = detail.events?.filter((e: any) => e.type === 'Card').map((e: any) => ({
              team: e.team.id === detail.teams?.home?.id ? 'home' : 'away',
              player: e.player.name,
              type: e.detail.includes('Yellow') ? 'Yellow' : 'Red',
              time: e.time.elapsed
            })) || [];
          }
        } catch (detailErr) {
          logError(`Failed to fetch details for live match ${item.fixture.id}: ${detailErr}`);
        }
      }

      return baseMatch;
    }));

    cacheMatches = formattedMatches;
    cacheMatchesTime = now;
    return formattedMatches;
  } catch (error) {
    if (cacheMatches) {
      logError('Fixture fetch failed. Returning cached data.');
      return cacheMatches;
    }
    throw error;
  }
}

// -------------------------------------------------------------
// World Cup Standings Endpoint
// -------------------------------------------------------------
export async function fetchWorldCupStandings(refresh = false): Promise<any> {
  const now = Date.now();
  if (!refresh && cacheStandings && (now - cacheStandingsTime < 300000)) {
    return cacheStandings;
  }

  try {
    const data = await callFootballApi('standings?league=1&season=2026');
    const standingsList = data.response?.[0]?.league?.standings || [];

    // Parse the API standings structure into the local format (Record<string, TeamStats[]>)
    const parsedStandings: Record<string, any[]> = {};

    standingsList.forEach((groupArray: any[]) => {
      groupArray.forEach((item: any) => {
        const groupRaw = item.group || 'A';
        const groupKey = groupRaw.replace(/Group\s+/i, '').trim().toUpperCase();

        if (!parsedStandings[groupKey]) {
          parsedStandings[groupKey] = [];
        }

        parsedStandings[groupKey].push({
          team: item.team.name,
          played: item.all.played || 0,
          won: item.all.win || 0,
          drawn: item.all.draw || 0,
          lost: item.all.lose || 0,
          gf: item.all.goals.for || 0,
          ga: item.all.goals.against || 0,
          gd: item.goalsDiff ?? 0,
          points: item.points || 0,
          rank: item.rank || 1
        });
      });
    });

    // Ensure they are sorted by rank
    Object.keys(parsedStandings).forEach(k => {
      parsedStandings[k].sort((a, b) => a.rank - b.rank);
    });

    cacheStandings = parsedStandings;
    cacheStandingsTime = now;
    return parsedStandings;
  } catch (error) {
    if (cacheStandings) {
      logError('Standings fetch failed. Returning cached standings.');
      return cacheStandings;
    }
    throw error;
  }
}

// -------------------------------------------------------------
// World Cup Top Scorers Endpoint
// -------------------------------------------------------------
export async function fetchWorldCupScorers(refresh = false): Promise<any[]> {
  const now = Date.now();
  if (!refresh && cacheScorers && (now - cacheScorersTime < 300000)) {
    return cacheScorers;
  }

  try {
    const data = await callFootballApi('players/topscorers?league=1&season=2026');
    const rawScorers = data.response || [];

    const formattedScorers = rawScorers.map((item: any) => {
      const stats = item.statistics?.[0] || {};
      return {
        player: item.player.name || 'Unknown Player',
        team: stats.team?.name || 'TBD',
        goals: stats.goals?.total || 0,
        assists: stats.goals?.assists || 0,
        matchesPlayed: stats.games?.appearences || 0,
        photo: item.player.photo
      };
    });

    cacheScorers = formattedScorers;
    cacheScorersTime = now;
    return formattedScorers;
  } catch (error) {
    if (cacheScorers) {
      logError('Scorers fetch failed. Returning cached scorers.');
      return cacheScorers;
    }
    throw error;
  }
}

// -------------------------------------------------------------
// Match Statistics Endpoint
// -------------------------------------------------------------
export async function fetchMatchStatistics(fixtureId: number, refresh = false): Promise<any> {
  const now = Date.now();
  if (!refresh && cacheStatistics[fixtureId] && (now - cacheStatistics[fixtureId].time < 30000)) {
    return cacheStatistics[fixtureId].data;
  }

  try {
    const data = await callFootballApi(`fixtures/statistics?fixture=${fixtureId}`);
    const statsResponse = data.response || [];

    // Parse statistics for HUD Match Center
    const result = {
      home: { possession: '50%', shots: 0, corners: 0 },
      away: { possession: '50%', shots: 0, corners: 0 }
    };

    if (statsResponse.length >= 2) {
      const parseStatsForTeam = (teamObj: any) => {
        const stats = teamObj.statistics || [];
        const findVal = (typeStr: string) => {
          const item = stats.find((s: any) => s.type === typeStr);
          return item ? item.value : null;
        };

        return {
          possession: findVal('Ball Possession') || '50%',
          shots: findVal('Total Shots') || findVal('Shots on Goal') || 0,
          corners: findVal('Corner Kicks') || 0
        };
      };

      result.home = parseStatsForTeam(statsResponse[0]) as any;
      result.away = parseStatsForTeam(statsResponse[1]) as any;
    }

    cacheStatistics[fixtureId] = {
      data: result,
      time: now
    };
    return result;
  } catch (error) {
    if (cacheStatistics[fixtureId]) {
      logError(`Statistics fetch failed for ${fixtureId}. Returning cached statistics.`);
      return cacheStatistics[fixtureId].data;
    }
    return {
      home: { possession: '50%', shots: 0, corners: 0 },
      away: { possession: '50%', shots: 0, corners: 0 }
    };
  }
}

// -------------------------------------------------------------
// Admin Diagnostics Retrieve
// -------------------------------------------------------------
export function getWorldCupDiagnostics(): DiagnosticData {
  return diagnostics;
}
