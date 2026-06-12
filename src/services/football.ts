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

export async function fetchLiveFootball(): Promise<{ events: WorldEvent[]; active: boolean }> {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      throw new Error('FOOTBALL_API_KEY not found');
    }

    // Using API-Sports Live Fixtures endpoint
    const response = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: {
        'x-apisports-key': apiKey
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Football API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      const errorMsg = typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors);
      throw new Error(`Football API error: ${errorMsg}`);
    }
    
    if (!data.response) {
      throw new Error('Invalid response from football API');
    }

    const matches = data.response || [];

    const events = matches.map((match: any, index: number) => {
      const homeTeam = match.teams?.home?.name || 'Unknown Home';
      const awayTeam = match.teams?.away?.name || 'Unknown Away';
      const city = match.fixture?.venue?.city || '';
      const country = match.league?.country || 'Unknown';
      
      // Try to find coordinates by team name, then by city name, then by country capital, finally fallback
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
        }
      };
    });

    return { events, active: true };
  } catch (error) {
    console.warn('Failed to fetch live football, using fallback mock data:', error);
    const fallbackMatches = generateMockFootballMatches();
    return { events: fallbackMatches, active: true };
  }
}

function generateMockFootballMatches(): WorldEvent[] {
  const now = Date.now();
  return [
    {
      id: `football-fallback-1-${now}`,
      title: 'Mexico vs South Africa',
      summary: 'Live match in World Cup Group Stage. Final score: Mexico 2 - 0 South Africa.',
      category: 'football' as any,
      country: 'Mexico',
      city: 'Mexico City',
      lat: 19.4326,
      lng: -99.1332,
      source: 'https://mooearth.live/match/mex-rsa',
      publishedAt: new Date(now - 120 * 60000).toISOString(), // Finished today
      footballData: {
        homeTeam: 'Mexico',
        awayTeam: 'South Africa',
        homeScore: 2,
        awayScore: 0,
        status: 'FT',
        elapsed: 90,
        goals: [
          { team: 'home', player: 'Santiago Giménez', time: 34 },
          { team: 'home', player: 'Henry Martín', time: 78 }
        ],
        cards: [
          { team: 'home', player: 'Edson Álvarez', type: 'Red', time: 82 },
          { team: 'away', player: 'Percy Tau', type: 'Red', time: 45 }
        ]
      }
    },
    {
      id: `football-fallback-2-${now}`,
      title: 'South Korea vs Czechia',
      summary: 'Live match in World Cup Group Stage. Final score: South Korea 2 - 1 Czechia.',
      category: 'football' as any,
      country: 'South Korea',
      city: 'Seoul',
      lat: 37.5665,
      lng: 126.9780,
      source: 'https://mooearth.live/match/kor-cze',
      publishedAt: new Date(now - 90 * 60000).toISOString(), // Finished today
      footballData: {
        homeTeam: 'South Korea',
        awayTeam: 'Czechia',
        homeScore: 2,
        awayScore: 1,
        status: 'FT',
        elapsed: 90,
        goals: [
          { team: 'home', player: 'Son Heung-min', time: 12 },
          { team: 'away', player: 'Patrik Schick', time: 64 },
          { team: 'home', player: 'Hwang Hee-chan', time: 89 }
        ],
        cards: []
      }
    },
    {
      id: `football-fallback-3-${now}`,
      title: 'Canada vs Bosnia and Herzegovina',
      summary: 'World Cup Group Stage. Scheduled for tomorrow at 12:30 AM.',
      category: 'football' as any,
      country: 'Canada',
      city: 'Ottawa',
      lat: 45.4215,
      lng: -75.6972,
      source: 'https://mooearth.live/match/can-bih',
      publishedAt: new Date(now + 10 * 60 * 60000).toISOString(), // Tomorrow
      footballData: {
        homeTeam: 'Canada',
        awayTeam: 'Bosnia and Herzegovina',
        homeScore: 0,
        awayScore: 0,
        status: 'NS',
        elapsed: 0,
        goals: [],
        cards: []
      }
    },
    {
      id: `football-fallback-4-${now}`,
      title: 'USA vs Paraguay',
      summary: 'World Cup Group Stage. Scheduled for tomorrow at 6:30 AM.',
      category: 'football' as any,
      country: 'United States',
      city: 'Washington D.C.',
      lat: 38.9072,
      lng: -77.0369,
      source: 'https://mooearth.live/match/usa-par',
      publishedAt: new Date(now + 16 * 60 * 60000).toISOString(), // Tomorrow
      footballData: {
        homeTeam: 'USA',
        awayTeam: 'Paraguay',
        homeScore: 0,
        awayScore: 0,
        status: 'NS',
        elapsed: 0,
        goals: [],
        cards: []
      }
    },
    {
      id: `football-fallback-5-${now}`,
      title: 'Qatar vs Switzerland',
      summary: 'World Cup Group Stage. Scheduled for Sun, 14 Jun at 12:30 AM.',
      category: 'football' as any,
      country: 'Qatar',
      city: 'Doha',
      lat: 25.2854,
      lng: 51.5310,
      source: 'https://mooearth.live/match/qat-sui',
      publishedAt: new Date(now + 34 * 60 * 60000).toISOString(),
      footballData: {
        homeTeam: 'Qatar',
        awayTeam: 'Switzerland',
        homeScore: 0,
        awayScore: 0,
        status: 'NS',
        elapsed: 0,
        goals: [],
        cards: []
      }
    },
    {
      id: `football-fallback-6-${now}`,
      title: 'Brazil vs Morocco',
      summary: 'World Cup Group Stage. Scheduled for Sun, 14 Jun at 3:30 AM.',
      category: 'football' as any,
      country: 'Brazil',
      city: 'Brasília',
      lat: -15.7938,
      lng: -47.8827,
      source: 'https://mooearth.live/match/bra-mar',
      publishedAt: new Date(now + 37 * 60 * 60000).toISOString(),
      footballData: {
        homeTeam: 'Brazil',
        awayTeam: 'Morocco',
        homeScore: 0,
        awayScore: 0,
        status: 'NS',
        elapsed: 0,
        goals: [],
        cards: []
      }
    },
    {
      id: `football-fallback-7-${now}`,
      title: 'Haiti vs Scotland',
      summary: 'World Cup Group Stage. Scheduled for Sun, 14 Jun at 6:30 AM.',
      category: 'football' as any,
      country: 'Haiti',
      city: 'Port-au-Prince',
      lat: 18.5392,
      lng: -72.3350,
      source: 'https://mooearth.live/match/hai-sco',
      publishedAt: new Date(now + 40 * 60 * 60000).toISOString(),
      footballData: {
        homeTeam: 'Haiti',
        awayTeam: 'Scotland',
        homeScore: 0,
        awayScore: 0,
        status: 'NS',
        elapsed: 0,
        goals: [],
        cards: []
      }
    },
    {
      id: `football-fallback-8-${now}`,
      title: 'Australia vs Türkiye',
      summary: 'World Cup Group Stage. Scheduled for Sun, 14 Jun at 9:30 AM.',
      category: 'football' as any,
      country: 'Australia',
      city: 'Canberra',
      lat: -35.2809,
      lng: 149.1300,
      source: 'https://mooearth.live/match/aus-tur',
      publishedAt: new Date(now + 43 * 60 * 60000).toISOString(),
      footballData: {
        homeTeam: 'Australia',
        awayTeam: 'Türkiye',
        homeScore: 0,
        awayScore: 0,
        status: 'NS',
        elapsed: 0,
        goals: [],
        cards: []
      }
    }
  ];
}
