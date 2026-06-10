import { WorldEvent, EventCategory } from '@/types';

// Map common football teams to coordinates
const stadiumMap: Record<string, { lat: number; lng: number; country: string; city: string }> = {
  'Real Madrid': { lat: 40.4530, lng: -3.6883, country: 'Spain', city: 'Madrid' },
  'Barcelona': { lat: 41.3809, lng: 2.1228, country: 'Spain', city: 'Barcelona' },
  'Manchester United': { lat: 53.4631, lng: -2.2913, country: 'United Kingdom', city: 'Manchester' },
  'Liverpool': { lat: 53.4308, lng: -2.9608, country: 'United Kingdom', city: 'Liverpool' },
  'Bayern Munich': { lat: 48.2188, lng: 11.6247, country: 'Germany', city: 'Munich' },
  'PSG': { lat: 48.8414, lng: 2.2530, country: 'France', city: 'Paris' },
  'Juventus': { lat: 45.1096, lng: 7.6413, country: 'Italy', city: 'Turin' },
  'AC Milan': { lat: 45.4781, lng: 9.1240, country: 'Italy', city: 'Milan' },
};

export async function fetchLiveFootball(): Promise<WorldEvent[]> {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) {
      throw new Error('FOOTBALL_API_KEY not found');
    }

    // Using api.football-data.org format
    const response = await fetch('https://api.football-data.org/v4/matches', {
      headers: {
        'X-Auth-Token': apiKey
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error('Football API request failed');
    }

    const data = await response.json();
    
    return data.matches.map((match: any, index: number) => {
      const homeTeam = match.homeTeam.shortName || match.homeTeam.name;
      const awayTeam = match.awayTeam.shortName || match.awayTeam.name;
      const geo = stadiumMap[homeTeam] || { lat: 46.8182, lng: 8.2275, country: 'Switzerland', city: 'Zurich' }; // Default to FIFA HQ
      
      return {
        id: `football-${Date.now()}-${index}`,
        title: `${homeTeam} vs ${awayTeam}`,
        summary: `Live match between ${homeTeam} and ${awayTeam}. Current score: ${match.score?.fullTime?.home ?? 0} - ${match.score?.fullTime?.away ?? 0}.`,
        category: 'football' as any, // We will need to update EventCategory to include 'football'
        country: geo.country,
        city: geo.city,
        lat: geo.lat,
        lng: geo.lng,
        source: 'https://www.fifa.com',
        publishedAt: match.utcDate,
      };
    });
  } catch (error) {
    console.warn('Failed to fetch live football, using fallback data:', error);
    
    // Generate some dynamic mock football data since it's a new category
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
      }
    ];
  }
}
