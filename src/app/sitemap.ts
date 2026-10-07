import { MetadataRoute } from 'next';
import { getAllCountries } from '@/data/countries';
import { getAllCities } from '@/data/places';
import { fallbackEvents } from '@/data/events';
import { SUPPORTED_LOCALES } from '@/lib/i18n';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.mooearth.live';
  
  // 1. Core Pages — highest priority
  const corePages = [
    '',
    '/globe',
    '/world-map',
    '/interactive-globe',
    '/interactive-world-map',
    '/geography',
    '/world-geography',
    '/explore',
    '/games',
    '/geography-games',
    '/geography-quiz',
    '/world-geography-quiz',
    '/country-quiz',
    '/capital-quiz',
    '/flag-quiz',
    '/world-map-quiz',
    '/daily',
    '/party',
    '/war-room',
    '/tournament',
    '/challenges',
    '/trending',
    '/play-earth',
    '/world-news',
    '/world-news-map',
    '/live-world-news',
    '/weather',
    '/world-weather',
    '/weather-map',
    '/world-events',
    '/live-events',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0
  }));

  // 1b. Country Geography Games
  const countryGamePages = getAllCountries().map(country => ({
    url: `${baseUrl}/games/geography/${country.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85
  }));

  // 1c. Sovereign Country Weather Pages
  const countryWeatherPages = getAllCountries().map(country => ({
    url: `${baseUrl}/weather/${country.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85
  }));

  // 1d. Canonical City Weather Pages
  const cityWeatherPages = getAllCities().map(city => ({
    url: `${baseUrl}/weather/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85
  }));

  // 2. Content Category Pages
  const contentPages = [
    '/news',
    '/sports',
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

  // 4. Canonical 195 Sovereign Countries Hubs
  const canonicalCountryPages = getAllCountries().map(country => ({
    url: `${baseUrl}/countries/${country.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // 5. Dynamic Articles & War Room Situation Pages
  const articles = fallbackEvents.map(event => ({
    url: `${baseUrl}/article/${event.id}`,
    lastModified: new Date(event.publishedAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }));

  const warRoomPages = fallbackEvents.map(event => ({
    url: `${baseUrl}/war-room/${event.id}`,
    lastModified: new Date(event.publishedAt || new Date()),
    changeFrequency: 'daily' as const,
    priority: 0.8
  }));

  // 6. Multilingual Hubs (Spanish, French, Portuguese, German, Japanese, Hindi, Arabic)
  const nonEnLocales = SUPPORTED_LOCALES.filter(l => l !== 'en');
  const multilingualPages: MetadataRoute.Sitemap = [];

  nonEnLocales.forEach(lang => {
    // Localized Home
    multilingualPages.push({
      url: `${baseUrl}/${lang}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.95
    });
    // Localized Daily Challenge
    multilingualPages.push({
      url: `${baseUrl}/${lang}/daily`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.95
    });
    // Localized Countries
    getAllCountries().forEach(country => {
      multilingualPages.push({
        url: `${baseUrl}/${lang}/country/${country.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.85
      });
    });
  });

  // 7. Legal & Info Pages
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
    ...countryGamePages,
    ...countryWeatherPages,
    ...cityWeatherPages,
    ...contentPages,
    ...categories,
    ...canonicalCountryPages,
    ...multilingualPages,
    ...articles,
    ...warRoomPages,
    ...legalPages
  ];
}
