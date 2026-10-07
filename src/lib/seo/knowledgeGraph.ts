// ============================================================
// MooEarth Live — Internal Linking & Knowledge Graph Engine
// ============================================================

import { CountryRecord } from '@/data/countries/types';
import { getCountryBySlug } from '@/data/countries';
import { CANONICAL_CITIES, getCityBySlug, resolveCanonicalCitySlug } from '@/data/places';
export { resolveCanonicalCitySlug };
import { CityRecord } from '@/types/places';
import {
  ContinentRecord,
  getContinentBySlug,
  getContinentForCountry,
  getCountriesForContinent,
} from '@/data/continents';

export interface BreadcrumbItem {
  name: string;
  href: string;
  position: number;
}

export interface ContextualLinkItem {
  title: string;
  subtitle?: string;
  href: string;
  emoji?: string;
  badge?: string;
}

export interface CountryKnowledgeGraph {
  country: CountryRecord;
  continent: ContinentRecord;
  breadcrumbs: BreadcrumbItem[];
  intentSubpages: {
    news: ContextualLinkItem;
    geography: ContextualLinkItem;
    weather: ContextualLinkItem;
    quiz: ContextualLinkItem;
    map: ContextualLinkItem;
  };
  dedicatedGame: ContextualLinkItem;
  canonicalCities: {
    city: CityRecord;
    href: string;
    isCapital: boolean;
  }[];
  relatedCountries: CountryRecord[];
  globalHubLinks: ContextualLinkItem[];
}

export interface CityKnowledgeGraph {
  city: CityRecord;
  parentCountry: CountryRecord | null;
  continent: ContinentRecord;
  breadcrumbs: BreadcrumbItem[];
  sisterCities: CityRecord[];
  parentCountrySubpages: {
    hub: ContextualLinkItem;
    news: ContextualLinkItem;
    weather: ContextualLinkItem;
    geography: ContextualLinkItem;
    quiz: ContextualLinkItem;
    game: ContextualLinkItem;
  };
}

export interface ContinentKnowledgeGraph {
  continent: ContinentRecord;
  breadcrumbs: BreadcrumbItem[];
  memberCountries: CountryRecord[];
  featuredCountries: CountryRecord[];
  canonicalCities: CityRecord[];
  siblingContinents: ContinentRecord[];
  relatedGames: ContextualLinkItem[];
}

/**
 * Builds the complete Knowledge Graph context for a sovereign nation.
 */
export function getCountryKnowledgeGraph(country: CountryRecord): CountryKnowledgeGraph {
  const continent = getContinentForCountry(country);

  // Canonical breadcrumb trail: Home > World Map > Continent > Country
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/', position: 1 },
    { name: 'World Map', href: '/world-map', position: 2 },
    { name: continent.name, href: `/continents/${continent.slug}`, position: 3 },
    { name: country.name, href: `/countries/${country.slug}`, position: 4 },
  ];

  // Specific 2-way intent subpages
  const intentSubpages = {
    news: {
      title: `${country.name} News`,
      subtitle: 'Real-time wire dispatches and press coverage',
      href: `/countries/${country.slug}/news`,
      emoji: '📰',
      badge: 'News Wire',
    },
    geography: {
      title: `${country.name} Geography`,
      subtitle: `Physical terrain, ${country.landmark}, and climate zones`,
      href: `/countries/${country.slug}/geography`,
      emoji: '🏔️',
      badge: 'Geography',
    },
    weather: {
      title: `${country.name} Weather`,
      subtitle: `Verified climate telemetry for ${country.capital}`,
      href: `/countries/${country.slug}/weather`,
      emoji: '🌤️',
      badge: 'Weather',
    },
    quiz: {
      title: `${country.name} Quiz`,
      subtitle: 'Authentic Play Earth knowledge challenge',
      href: `/countries/${country.slug}/quiz`,
      emoji: '🎮',
      badge: 'Quiz',
    },
    map: {
      title: `${country.name} 3D Map`,
      subtitle: 'WebGL orbital coordinates and borders',
      href: `/countries/${country.slug}/map`,
      emoji: '🗺️',
      badge: '3D Map',
    },
  };

  const dedicatedGame: ContextualLinkItem = {
    title: `${country.name} Geography Game`,
    subtitle: `Timed 15s challenge across ${country.name} flags and capitals`,
    href: `/games/geography/${country.slug}`,
    emoji: country.flag || '🌍',
    badge: 'Country Trial',
  };

  // Find all canonical cities located in this country
  const canonicalCities = CANONICAL_CITIES.filter(
    c => c.countrySlug === country.slug || c.country.toLowerCase() === country.name.toLowerCase()
  ).map(city => ({
    city,
    href: `/cities/${city.slug}`,
    isCapital: city.isCapital || city.name.toLowerCase() === country.capital.toLowerCase(),
  }));

  // Resolve related neighbor countries
  const relatedCountries = (country.relatedSlugs || [])
    .map(slug => getCountryBySlug(slug))
    .filter((c): c is CountryRecord => Boolean(c));

  const globalHubLinks: ContextualLinkItem[] = [
    { title: 'World Map Atlas', href: '/world-map', emoji: '🗺️' },
    { title: '3D Interactive Globe', href: '/globe', emoji: '🌍' },
    { title: `${continent.name} Continental Hub`, href: `/continents/${continent.slug}`, emoji: continent.emoji },
    { title: 'Global Weather Map', href: '/weather-map', emoji: '🌤️' },
    { title: 'World News Map', href: '/world-news-map', emoji: '📰' },
    { title: 'Play Earth Games', href: '/games', emoji: '🎮' },
  ];

  return {
    country,
    continent,
    breadcrumbs,
    intentSubpages,
    dedicatedGame,
    canonicalCities,
    relatedCountries,
    globalHubLinks,
  };
}

/**
 * Builds the complete Knowledge Graph context for a canonical city.
 */
export function getCityKnowledgeGraph(city: CityRecord): CityKnowledgeGraph {
  const parentCountry = getCountryBySlug(city.countrySlug);
  const continent = parentCountry
    ? getContinentForCountry(parentCountry)
    : (city.region ? getContinentBySlug(city.region) : null) || getContinentBySlug('asia')!;

  // Canonical breadcrumb trail: Home > World Map > Continent > Country > City
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/', position: 1 },
    { name: 'World Map', href: '/world-map', position: 2 },
    { name: continent.name, href: `/continents/${continent.slug}`, position: 3 },
  ];

  if (parentCountry) {
    breadcrumbs.push({
      name: parentCountry.name,
      href: `/countries/${parentCountry.slug}`,
      position: 4,
    });
  }

  breadcrumbs.push({
    name: city.name,
    href: `/cities/${city.slug}`,
    position: parentCountry ? 5 : 4,
  });

  // Find sister cities in the same country
  const sisterCities = CANONICAL_CITIES.filter(
    c => c.id !== city.id && (c.countrySlug === city.countrySlug || c.country === city.country)
  );

  const countrySlug = parentCountry ? parentCountry.slug : city.countrySlug;
  const countryName = parentCountry ? parentCountry.name : city.country;

  const parentCountrySubpages = {
    hub: {
      title: `${countryName} Country Atlas`,
      subtitle: 'Complete sovereign guide, coordinates and borders',
      href: `/countries/${countrySlug}`,
      emoji: parentCountry?.flag || '🏛️',
    },
    news: {
      title: `${countryName} National News`,
      subtitle: 'Wire stories and press dispatches',
      href: `/countries/${countrySlug}/news`,
      emoji: '📰',
    },
    weather: {
      title: `${countryName} National Weather`,
      subtitle: 'Regional atmospheric station telemetry',
      href: `/countries/${countrySlug}/weather`,
      emoji: '🌤️',
    },
    geography: {
      title: `${countryName} Physical Geography`,
      subtitle: 'Topography, mountains, and climate zones',
      href: `/countries/${countrySlug}/geography`,
      emoji: '🏔️',
    },
    quiz: {
      title: `${countryName} Country Quiz`,
      subtitle: '15-second timed geography trivia',
      href: `/countries/${countrySlug}/quiz`,
      emoji: '🎮',
    },
    game: {
      title: `${countryName} Geography Game`,
      subtitle: 'Interactive Play Earth challenge',
      href: `/games/geography/${countrySlug}`,
      emoji: '🌍',
    },
  };

  return {
    city,
    parentCountry,
    continent,
    breadcrumbs,
    sisterCities,
    parentCountrySubpages,
  };
}

/**
 * Builds the complete Knowledge Graph context for a continent.
 */
export function getContinentKnowledgeGraph(continent: ContinentRecord): ContinentKnowledgeGraph {
  const memberCountries = getCountriesForContinent(continent.slug);

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/', position: 1 },
    { name: 'World Map', href: '/world-map', position: 2 },
    { name: 'Continents', href: '/continents', position: 3 },
    { name: continent.name, href: `/continents/${continent.slug}`, position: 4 },
  ];

  // Find canonical cities in this continent
  const canonicalCities = CANONICAL_CITIES.filter(city => {
    const parentCountry = getCountryBySlug(city.countrySlug);
    if (parentCountry) {
      return getContinentForCountry(parentCountry).slug === continent.slug;
    }
    return (city.region || '').toLowerCase() === continent.name.toLowerCase();
  });

  const allPossibleContinents = [
    getContinentBySlug('asia'),
    getContinentBySlug('europe'),
    getContinentBySlug('africa'),
    getContinentBySlug('north-america'),
    getContinentBySlug('south-america'),
    getContinentBySlug('oceania'),
    getContinentBySlug('antarctica'),
  ];

  const siblingContinents = allPossibleContinents.filter(
    (c): c is ContinentRecord => c !== null && c.slug !== continent.slug
  );

  const featuredCountries = memberCountries.slice(0, 16);

  const relatedGames: ContextualLinkItem[] = [
    {
      title: 'World Geography Quiz',
      subtitle: 'Test your knowledge across all 7 continents',
      href: '/world-geography-quiz',
      emoji: '🧭',
    },
    {
      title: 'Country Quiz Challenge',
      subtitle: 'Identify 195 sovereign nations and territories',
      href: '/country-quiz',
      emoji: '🏛️',
    },
    {
      title: 'Flag Quiz Arena',
      subtitle: 'Visual vexillology challenges',
      href: '/flag-quiz',
      emoji: '🏁',
    },
    {
      title: 'Capital City Quiz',
      subtitle: 'Match world capitals from Tokyo to Washington',
      href: '/capital-quiz',
      emoji: '🏙️',
    },
  ];

  return {
    continent,
    breadcrumbs,
    memberCountries,
    featuredCountries,
    canonicalCities,
    siblingContinents,
    relatedGames,
  };
}
