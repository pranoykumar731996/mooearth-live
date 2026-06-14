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
    console.warn('Failed to fetch live football:', error);
    return { events: [], active: false };
  }
}
