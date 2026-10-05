import { MetadataRoute } from 'next';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { fallbackEvents } from '@/data/events';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.mooearth.live';
  
  // 1. Core Pages — highest priority
  const corePages = [
    '',
    '/explore',
    '/games',
    '/daily',
    '/challenges',
    '/trending',
    '/play-earth',
    '/embed/globe',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0
  }));

  // 2. Content Category Pages
  const contentPages = [
    '/news',
    '/sports',
    '/weather',
    '/business',
    '/technology',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9
  }));

  // 3. Dynamic Categories
  const categories = [
    'breaking', 'sports', 'football', 'technology', 'business', 'weather', 'entertainment'
  ].map(cat => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8
  }));

  // 4. Dynamic Countries — only include countries with verified coordinate data
  const countries = Object.keys(COUNTRY_COORDINATES).map(countryKey => {
    const countryName = COUNTRY_COORDINATES[countryKey].country;
    return {
      url: `${baseUrl}/country/${encodeURIComponent(countryName.toLowerCase())}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9
    };
  });

  // Deduplicate country URLs (e.g., 'usa', 'united states', 'us' all resolve to same country)
  const seenCountryUrls = new Set<string>();
  const uniqueCountries = countries.filter(c => {
    if (seenCountryUrls.has(c.url)) return false;
    seenCountryUrls.add(c.url);
    return true;
  });

  // 5. Dynamic Articles
  const articles = fallbackEvents.map(event => ({
    url: `${baseUrl}/article/${event.id}`,
    lastModified: new Date(event.publishedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }));

  // 6. Legal & Info Pages
  const legalPages = [
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
    '/copyright',
    '/dmca',
    '/disclaimer',
    '/data-sources',
    '/accessibility',
    '/community',
    '/security',
    '/ai-transparency',
    '/advertising',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.3
  }));

  return [
    ...corePages,
    ...contentPages,
    ...categories,
    ...uniqueCountries,
    ...articles,
    ...legalPages
  ];
}
