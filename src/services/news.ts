import { WorldEvent, EventCategory } from '@/types';
import { demoEvents } from '@/data/events';

// Map common keywords to coordinates
const geoMap: Record<string, { lat: number; lng: number; country: string; city: string }> = {
  'US': { lat: 38.9072, lng: -77.0369, country: 'United States', city: 'Washington D.C.' },
  'UK': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', city: 'London' },
  'Japan': { lat: 35.6762, lng: 139.6503, country: 'Japan', city: 'Tokyo' },
  'China': { lat: 39.9042, lng: 116.4074, country: 'China', city: 'Beijing' },
  'India': { lat: 28.6139, lng: 77.2090, country: 'India', city: 'New Delhi' },
  'Brazil': { lat: -15.7938, lng: -47.8827, country: 'Brazil', city: 'Brasília' },
  'Australia': { lat: -35.2809, lng: 149.1300, country: 'Australia', city: 'Canberra' },
  'Germany': { lat: 52.5200, lng: 13.4050, country: 'Germany', city: 'Berlin' },
  'France': { lat: 48.8566, lng: 2.3522, country: 'France', city: 'Paris' },
  'Canada': { lat: 45.4215, lng: -75.6972, country: 'Canada', city: 'Ottawa' },
};

function assignCoordinates(title: string, content: string) {
  const text = `${title} ${content}`.toLowerCase();
  
  for (const [key, data] of Object.entries(geoMap)) {
    if (text.includes(key.toLowerCase())) {
      return data;
    }
  }

  // Default fallback (randomish distribution to make it look active)
  const keys = Object.keys(geoMap);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return geoMap[randomKey];
}

export async function fetchLiveNews(): Promise<WorldEvent[]> {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      throw new Error('NEWS_API_KEY not found');
    }

    // Using GNews API or NewsAPI format
    const response = await fetch(`https://gnews.io/api/v4/top-headlines?category=general&lang=en&max=10&apikey=${apiKey}`, {
      next: { revalidate: 60 } // cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error('News API request failed');
    }

    const data = await response.json();
    
    return data.articles.map((article: any, index: number) => {
      const geo = assignCoordinates(article.title, article.description || '');
      
      return {
        id: `news-${Date.now()}-${index}`,
        title: article.title,
        summary: article.description || 'No summary available.',
        category: 'breaking' as EventCategory,
        country: geo.country,
        city: geo.city,
        lat: geo.lat,
        lng: geo.lng,
        source: article.url,
        publishedAt: article.publishedAt,
      };
    });
  } catch (error) {
    console.warn('Failed to fetch live news, using fallback data:', error);
    // Return fallback demo events
    return demoEvents.filter(e => e.category !== 'sports').map(e => ({
      ...e,
      id: `fallback-news-${Date.now()}-${e.id}`
    }));
  }
}
