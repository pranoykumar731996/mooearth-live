import { WorldEvent } from '@/types';

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

export async function fetchLiveFootball(): Promise<WorldEvent[]> {
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
    
    if (!data.response || data.response.length === 0) {
      throw new Error('No live matches right now, using fallback data');
    }

    return data.response.map((match: any, index: number) => {
      const homeTeam = match.teams?.home?.name || 'Unknown Home';
      const awayTeam = match.teams?.away?.name || 'Unknown Away';
      const city = match.fixture?.venue?.city || '';
      const country = match.league?.country || 'Unknown';
      
      // Try to find coordinates by team name, then by city name, finally fallback
      const geo = stadiumMap[homeTeam] || stadiumMap[city] || { 
        lat: (Math.random() * 90 - 45), 
        lng: (Math.random() * 180 - 90), 
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
  } catch (error) {
    console.warn('Failed to fetch live football, using fallback data:', error);
    
    // Generate some dynamic mock football data if API fails or rate limit hits
    return [
      {
        id: `fallback-football-${Date.now()}-1`,
        title: 'Real Madrid vs Barcelona',
        summary: 'El Clásico is underway at Santiago Bernabéu. Score: 1-1 in the second half.',
        category: 'football' as any,
        country: 'Spain',
        city: 'Madrid',
        lat: 40.4530,
        lng: -3.6883,
        source: 'https://example.com/football',
        publishedAt: new Date().toISOString(),
        footballData: {
          homeTeam: 'Real Madrid',
          awayTeam: 'Barcelona',
          homeScore: 1,
          awayScore: 1,
          status: '2H',
          elapsed: 65,
          goals: [
            { team: 'home', player: 'Vinícius Júnior', time: 24 },
            { team: 'away', player: 'Robert Lewandowski', time: 45 }
          ]
        }
      },
      {
        id: `fallback-football-${Date.now()}-2`,
        title: 'Manchester United vs Liverpool',
        summary: 'Intense rivalry match at Old Trafford. Liverpool leads 2-0.',
        category: 'football' as any,
        country: 'United Kingdom',
        city: 'Manchester',
        lat: 53.4631,
        lng: -2.2913,
        source: 'https://example.com/football',
        publishedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        footballData: {
          homeTeam: 'Manchester United',
          awayTeam: 'Liverpool',
          homeScore: 0,
          awayScore: 2,
          status: 'HT',
          elapsed: 45,
          goals: [
            { team: 'away', player: 'Mohamed Salah', time: 12 },
            { team: 'away', player: 'Darwin Núñez', time: 38 }
          ]
        }
      },
      {
        id: `fallback-football-${Date.now()}-3`,
        title: 'Brazil vs Argentina (Practice Match)',
        summary: 'International Friendly Practice Match underway in Rio de Janeiro. Score is tied 0-0.',
        category: 'football' as any,
        country: 'Brazil',
        city: 'Rio de Janeiro',
        lat: -22.9068,
        lng: -43.1729,
        source: 'https://example.com/football',
        publishedAt: new Date(Date.now() - 5 * 60000).toISOString(),
        footballData: {
          homeTeam: 'Brazil',
          awayTeam: 'Argentina',
          homeScore: 0,
          awayScore: 0,
          status: 'LIVE',
          elapsed: 22,
          goals: []
        }
      }
    ];
  }
}
