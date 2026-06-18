import { MetadataRoute } from 'next';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { demoEvents } from '@/data/events';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.mooearth.live';
  
  // 1. Core Pages & Category Shortcuts
  const staticPages = [
    '',
    '/news',
    '/sports',
    '/weather',
    '/business',
    '/technology',
    '/fifa',
    '/play-earth'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0
  }));

  // 2. Dynamic Categories
  const categories = [
    'breaking', 'sports', 'football', 'technology', 'business', 'weather', 'entertainment', 'worldcup'
  ].map(cat => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8
  }));

  // 3. Dynamic Countries
  const countries = Object.keys(COUNTRY_COORDINATES).map(countryKey => {
    const countryName = COUNTRY_COORDINATES[countryKey].country;
    return {
      url: `${baseUrl}/country/${encodeURIComponent(countryName.toLowerCase())}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9
    };
  });

  // 4. Dynamic Articles
  const articles = demoEvents.map(event => ({
    url: `${baseUrl}/article/${event.id}`,
    lastModified: new Date(event.publishedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }));

  return [
    ...staticPages,
    ...categories,
    ...countries,
    ...articles
  ];
}
