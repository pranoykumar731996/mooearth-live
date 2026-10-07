// ============================================================
// MooEarth Live — Canonical Continents Registry & Knowledge Graph
// ============================================================

import { CountryRecord } from '@/data/countries/types';
import { CANONICAL_COUNTRIES } from '@/data/countries/canonicalCountries';

export interface ContinentRecord {
  slug: string;
  name: string;
  emoji: string;
  areaKm2: string;
  population: string;
  countriesCount: number;
  highestPoint: string;
  longestRiver: string;
  description: string;
  climateOverview: string;
  subregions: string[];
}

export const CANONICAL_CONTINENTS: ContinentRecord[] = [
  {
    slug: 'asia',
    name: 'Asia',
    emoji: '🌏',
    areaKm2: '44,579,000 km²',
    population: '4.75 Billion',
    countriesCount: 49,
    highestPoint: 'Mount Everest (8,848m)',
    longestRiver: 'Yangtze River (6,300 km)',
    description: 'The largest and most populous continent on Earth, spanning the Arabian Peninsula, Siberian tundra, Tibetan Plateau, and Pacific Rim archipelagos.',
    climateOverview: 'Spans all major climate zones from arctic Siberian tundra and continental plains to tropical monsoon rainforests and arid Arabian deserts.',
    subregions: ['Southern Asia', 'Western Asia', 'South-Eastern Asia', 'Eastern Asia', 'Central Asia'],
  },
  {
    slug: 'africa',
    name: 'Africa',
    emoji: '🌍',
    areaKm2: '30,370,000 km²',
    population: '1.43 Billion',
    countriesCount: 54,
    highestPoint: 'Mount Kilimanjaro (5,895m)',
    longestRiver: 'Nile River (6,650 km)',
    description: 'The second-largest continent by area and population, cradling the Sahara Desert, Congo Basin rainforest, Nile basin, and Great Rift Valley.',
    climateOverview: 'Symmetrically straddles the equator, ranging from hyper-arid subtropical deserts to equatorial tropical rainforests and Mediterranean coastal belts.',
    subregions: ['Northern Africa', 'Western Africa', 'Eastern Africa', 'Middle Africa', 'Southern Africa'],
  },
  {
    slug: 'europe',
    name: 'Europe',
    emoji: '🌍',
    areaKm2: '10,180,000 km²',
    population: '742 Million',
    countriesCount: 44,
    highestPoint: 'Mount Elbrus (5,642m)',
    longestRiver: 'Volga River (3,530 km)',
    description: 'A deeply articulated continental landmass bounded by the Atlantic, Arctic, and Mediterranean, dense with sovereign nations, historic capitals, and alpine mountain ranges.',
    climateOverview: 'Predominantly temperate maritime and continental climate, heavily moderated by the North Atlantic Drift current and Alpine topographical barriers.',
    subregions: ['Western Europe', 'Northern Europe', 'Southern Europe', 'Eastern Europe'],
  },
  {
    slug: 'north-america',
    name: 'North America',
    emoji: '🌎',
    areaKm2: '24,709,000 km²',
    population: '592 Million',
    countriesCount: 23,
    highestPoint: 'Denali (6,190m)',
    longestRiver: 'Mississippi-Missouri River (6,275 km)',
    description: 'Extending from the Canadian Arctic archipelago across the Great Plains and Rocky Mountains to the Central American isthmus and Caribbean basin.',
    climateOverview: 'Encompasses polar tundra in northern Canada and Greenland, humid continental and temperate zones in the central plains, and tropical Caribbean microclimates.',
    subregions: ['Northern America', 'Central America', 'Caribbean'],
  },
  {
    slug: 'south-america',
    name: 'South America',
    emoji: '🌎',
    areaKm2: '17,840,000 km²',
    population: '434 Million',
    countriesCount: 12,
    highestPoint: 'Aconcagua (6,961m)',
    longestRiver: 'Amazon River (6,400 km)',
    description: 'Home to the planet’s largest rainforest and freshwater drainage system (Amazon Basin) alongside the longest continental mountain chain on Earth (the Andes).',
    climateOverview: 'Dominated by equatorial and tropical rainforest climates across the Amazon, transitioning to arid coastal deserts (Atacama) and temperate subantarctic pampas.',
    subregions: ['South America'],
  },
  {
    slug: 'oceania',
    name: 'Oceania',
    emoji: '🌏',
    areaKm2: '8,525,989 km²',
    population: '45 Million',
    countriesCount: 14,
    highestPoint: 'Puncak Jaya (4,884m)',
    longestRiver: 'Murray River (2,508 km)',
    description: 'An expansive maritime realm encompassing the Australian continental landmass, the volcanic islands of New Zealand, and thousands of Pacific atolls across Polynesia, Micronesia, and Melanesia.',
    climateOverview: 'Includes arid desert Outback in central Australia, temperate maritime zones in southern New Zealand, and tropical Pacific maritime trade-wind belts.',
    subregions: ['Australia and New Zealand', 'Melanesia', 'Micronesia', 'Polynesia'],
  },
  {
    slug: 'antarctica',
    name: 'Antarctica',
    emoji: '🧊',
    areaKm2: '14,200,000 km²',
    population: '~1,000 – 5,000 (Scientific Personnel)',
    countriesCount: 0,
    highestPoint: 'Vinson Massif (4,892m)',
    longestRiver: 'Onyx River (Seasonal Meltwater, 32 km)',
    description: 'The southernmost, coldest, windiest, and driest continent on Earth. Over 98% covered by the Antarctic ice sheet, which contains approximately 70% of the world’s fresh water.',
    climateOverview: 'Extreme polar ice cap climate with temperatures descending below -89°C, katabatic wind systems, and permanent polar desert conditions.',
    subregions: ['Antarctica'],
  },
];

const CONTINENT_BY_SLUG = new Map<string, ContinentRecord>();
const CONTINENT_ALIASES: Record<string, string> = {
  'americas': 'north-america',
  'australia': 'oceania',
  'australia-oceania': 'oceania',
  'australia-and-oceania': 'oceania',
  'south-asia': 'asia',
  'east-asia': 'asia',
  'middle-east': 'asia',
};

for (const continent of CANONICAL_CONTINENTS) {
  CONTINENT_BY_SLUG.set(continent.slug.toLowerCase(), continent);
  CONTINENT_BY_SLUG.set(continent.name.toLowerCase(), continent);
}

/** Retrieve all 7 canonical continents */
export function getAllContinents(): ContinentRecord[] {
  return CANONICAL_CONTINENTS;
}

/** Retrieve all continent slugs */
export function getAllContinentSlugs(): string[] {
  return CANONICAL_CONTINENTS.map(c => c.slug);
}

/** Retrieve a continent by slug or alias */
export function getContinentBySlug(slugOrName: string): ContinentRecord | null {
  if (!slugOrName || typeof slugOrName !== 'string') return null;
  const normalized = slugOrName.trim().toLowerCase();

  if (CONTINENT_BY_SLUG.has(normalized)) {
    return CONTINENT_BY_SLUG.get(normalized)!;
  }

  if (CONTINENT_ALIASES[normalized]) {
    const canonical = CONTINENT_ALIASES[normalized];
    return CONTINENT_BY_SLUG.get(canonical) || null;
  }

  return null;
}

/** Resolve the canonical continent for a given sovereign CountryRecord */
export function getContinentForCountry(country: CountryRecord): ContinentRecord {
  if (country.region === 'Americas') {
    if (country.subregion === 'South America') {
      return CONTINENT_BY_SLUG.get('south-america')!;
    }
    return CONTINENT_BY_SLUG.get('north-america')!;
  }

  const normalizedRegion = country.region.toLowerCase();
  if (CONTINENT_BY_SLUG.has(normalizedRegion)) {
    return CONTINENT_BY_SLUG.get(normalizedRegion)!;
  }

  return CONTINENT_BY_SLUG.get('asia')!; // Fallback
}

/** Get all countries belonging to a specific continent */
export function getCountriesForContinent(continentSlug: string): CountryRecord[] {
  const continent = getContinentBySlug(continentSlug);
  if (!continent) return [];

  return CANONICAL_COUNTRIES.filter(country => {
    const countryContinent = getContinentForCountry(country);
    return countryContinent.slug === continent.slug;
  });
}
