// ============================================================
// MooEarth Live — Canonical Places & Cities Registry
// ============================================================
// Backed directly by the application's existing location database.
// Zero arbitrary or fabricated cities.

import { locations, LocationRecord } from '@/data/locations';
import { getCountryByName, CountryRecord } from '@/data/countries';
import { CityRecord, PlaceRecord, PlaceType } from '@/types/places';

/** Haversine formula to compute geodesic distance between two points in kilometers */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Canonical city slug map for cities originating in locations.ts
const CANONICAL_CITY_SLUG_MAP: Record<string, string> = {
  'city-bhubaneswar-in': 'bhubaneswar',
  'city-mumbai-in': 'mumbai',
  'city-newdelhi-in': 'new-delhi',
  'city-nyc-us': 'new-york-city',
  'city-la-us': 'los-angeles',
  'city-sf-us': 'san-francisco',
  'city-houston-us': 'houston',
  'city-paris-tx-us': 'paris-texas',
  'city-paris-fr': 'paris',
  'city-tokyo-jp': 'tokyo',
  'city-kyoto-jp': 'kyoto',
  'city-london-gb': 'london',
  'city-manchester-gb': 'manchester',
  'city-munich-de': 'munich',
  'city-saopaulo-br': 'sao-paulo',
  'city-rio-br': 'rio-de-janeiro',
};

// Aliases mapping to canonical city slugs
const CITY_ALIAS_MAP: Record<string, string> = {
  // New York City
  'nyc': 'new-york-city',
  'new-york': 'new-york-city',
  'newyork': 'new-york-city',
  'new-york-ny': 'new-york-city',

  // Los Angeles
  'la': 'los-angeles',
  'lax': 'los-angeles',

  // San Francisco
  'sf': 'san-francisco',
  'frisco': 'san-francisco',

  // Mumbai
  'bombay': 'mumbai',

  // New Delhi
  'delhi': 'new-delhi',

  // Paris
  'paris-france': 'paris',
  'paris-tx': 'paris-texas',

  // Munich
  'munchen': 'munich',

  // Rio
  'rio': 'rio-de-janeiro',

  // Sao Paulo
  'sao-paulo-city': 'sao-paulo',
  'saopaulo': 'sao-paulo',

  // Tokyo
  'edo': 'tokyo',
};

// Descriptive geographical context for the verified cities in the database
const CITY_GEOGRAPHY_DESCRIPTIONS: Record<string, string> = {
  'bhubaneswar':
    'Bhubaneswar is the capital of the eastern Indian state of Odisha, located along the Daya and Kuakhai river floodplains. Known as the Temple City, it sits within the coastal plains of eastern India with a tropical savanna climate.',
  'mumbai':
    'Mumbai is the financial capital of India and the capital of Maharashtra, situated on Salsette Island along the Arabian Sea. It features a natural deep-water harbor and tropical wet and dry climate zones.',
  'new-delhi':
    'New Delhi is the national capital of India, situated in the National Capital Territory along the Yamuna River plain. It anchors the northern Indo-Gangetic plain with a monsoon-influenced humid subtropical climate.',
  'new-york-city':
    'New York City is situated in southeastern New York state at the mouth of the Hudson River where it empties into the Atlantic Ocean. Spanning five boroughs across Manhattan, Brooklyn, Queens, the Bronx, and Staten Island, it is the most populous metropolitan area in the United States.',
  'los-angeles':
    'Los Angeles is situated in Southern California within a coastal basin flanked by the Pacific Ocean to the west and the San Gabriel Mountains to the east. It encompasses dramatic topographical transitions from beaches to mountain canyons.',
  'san-francisco':
    'San Francisco occupies the northern tip of the San Francisco Peninsula in Northern California, bounded by the Pacific Ocean and San Francisco Bay. It is renowned for its steep rolling hills, microclimates, and maritime fog.',
  'houston':
    'Houston is the most populous city in Texas, situated on the Gulf Coastal Plain along Buffalo Bayou and Galveston Bay. Its terrain is flat coastal plain with clayey soils and a humid subtropical climate.',
  'paris-texas':
    'Paris is a historic city in northeast Texas situated on the western edge of the Piney Woods region. It is the county seat of Lamar County in the Red River Valley.',
  'paris':
    'Paris is the capital of France, situated in north-central France along the Seine River in the heart of the Île-de-France region. It rests within the fertile Paris Basin, an expansive sedimentary geological depression with an oceanic climate.',
  'tokyo':
    'Tokyo is the capital of Japan, situated on the head of Tokyo Bay along the southern Kanto plain on the Pacific coast of central Honshu. It is the most populous metropolitan area in the world.',
  'kyoto':
    'Kyoto is a major cultural metropolis on central Honshu, situated in a valley between the Tamba Mountains. Formerly the imperial capital of Japan, it features a humid subtropical basin climate.',
  'london':
    'London is the capital of the United Kingdom and England, situated along the navigable River Thames in southeastern Great Britain. It sits in the London Basin, a broad geological depression with a temperate maritime climate.',
  'manchester':
    'Manchester is an industrial and cultural metropolis in North West England, situated within the Manchester Basin bordered by the Pennines hills to the north and east and the Cheshire Plain to the south.',
  'munich':
    'Munich is the capital of Bavaria in southern Germany, situated on the elevated Bavarian plateau along the Isar River, approximately 50 km north of the northern edge of the Alps.',
  'sao-paulo':
    'São Paulo is the largest city in Brazil and the Southern Hemisphere, situated on the Piratininga plateau in the Serra do Mar coastal range, approximately 760 meters above sea level with a monsoon-influenced humid subtropical climate.',
  'rio-de-janeiro':
    'Rio de Janeiro is situated along the South Atlantic Ocean on Guanabara Bay in southeastern Brazil. Renowned for its dramatic granite peaks including Sugarloaf and Corcovado, it borders the tropical Atlantic Forest biome.',
};

/**
 * Builds the canonical list of CityRecord objects from the verified location database.
 */
function buildCanonicalCities(): CityRecord[] {
  const cityLocations = locations.filter(l => l.type === 'city');

  return cityLocations.map(loc => {
    const slug = CANONICAL_CITY_SLUG_MAP[loc.id] || loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const country = getCountryByName(loc.country);

    const countrySlug = country ? country.slug : loc.country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const isCapital = country ? country.capital.toLowerCase().includes(loc.name.toLowerCase()) : false;

    return {
      id: loc.id,
      name: loc.name,
      slug,
      type: 'city',
      country: loc.country,
      countrySlug,
      countryCode: loc.countryCode,
      state: loc.state,
      stateSlug: loc.state ? loc.state.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined,
      region: country?.region || 'Global',
      coordinates: {
        lat: loc.lat,
        lng: loc.lng,
      },
      population: loc.population,
      timezone: loc.timezone,
      adminLevel: 2,
      aliases: loc.aliases || [],
      isCapital,
      majorCityOfCountry: true,
      description: `${loc.name} is a major metropolitan city located in ${loc.state ? `${loc.state}, ` : ''}${loc.country} (${loc.timezone}).`,
      geography: CITY_GEOGRAPHY_DESCRIPTIONS[slug] || `${loc.name} is situated at latitude ${loc.lat.toFixed(4)}°, longitude ${loc.lng.toFixed(4)}° in ${loc.country}.`,
    };
  });
}

export const CANONICAL_CITIES: CityRecord[] = buildCanonicalCities();

/** Retrieve all verified canonical cities */
export function getAllCities(): CityRecord[] {
  return CANONICAL_CITIES;
}

/** Retrieve all canonical city slugs */
export function getAllCitySlugs(): string[] {
  return CANONICAL_CITIES.map(c => c.slug);
}

/** Resolves an alias or canonical city slug to the single canonical slug string */
export function resolveCanonicalCitySlug(slugOrAlias: string): string | null {
  if (!slugOrAlias || typeof slugOrAlias !== 'string') return null;
  const normalized = slugOrAlias.trim().toLowerCase();

  // 1. Direct canonical match
  const direct = CANONICAL_CITIES.find(c => c.slug === normalized);
  if (direct) return direct.slug;

  // 2. Alias match
  if (CITY_ALIAS_MAP[normalized]) {
    return CITY_ALIAS_MAP[normalized];
  }

  // 3. Name or aliases match
  const nameMatch = CANONICAL_CITIES.find(
    c => c.name.toLowerCase() === normalized || (c.aliases && c.aliases.map(a => a.toLowerCase()).includes(normalized))
  );
  if (nameMatch) return nameMatch.slug;

  return null;
}

/** Retrieve a city by its canonical or alias slug */
export function getCityBySlug(slug: string): CityRecord | null {
  if (!slug || typeof slug !== 'string') return null;
  const canonicalSlug = resolveCanonicalCitySlug(slug);
  if (!canonicalSlug) return null;
  return CANONICAL_CITIES.find(c => c.slug === canonicalSlug) || null;
}

/** Retrieve a city by its exact database ID */
export function getCityById(id: string): CityRecord | null {
  if (!id) return null;
  return CANONICAL_CITIES.find(c => c.id === id) || null;
}

/**
 * Retrieve nearby geographic cities sorted by geodesic Haversine proximity.
 */
export function getNearbyCities(
  targetLat: number,
  targetLng: number,
  maxCount: number = 4,
  excludeCityId?: string
): Array<{ city: CityRecord; distanceKm: number }> {
  const withDistance = CANONICAL_CITIES.filter(c => c.id !== excludeCityId).map(city => ({
    city,
    distanceKm: calculateHaversineDistanceKm(targetLat, targetLng, city.coordinates.lat, city.coordinates.lng),
  }));

  withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  return withDistance.slice(0, maxCount);
}

// ============================================================
// ARCHITECTURE FOR OTHER PLACE TYPES
// ============================================================
// Ready for states, regions, continents, oceans, islands, mountains, landmarks

export function getPlacesByType(type: PlaceType): PlaceRecord[] {
  if (type === 'city') {
    return CANONICAL_CITIES;
  }

  if (type === 'state') {
    return locations
      .filter(l => l.type === 'state')
      .map(l => {
        const country = getCountryByName(l.country);
        return {
          id: l.id,
          name: l.name,
          slug: l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          type: 'state',
          country: l.country,
          countrySlug: country?.slug || l.country.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          countryCode: l.countryCode,
          coordinates: { lat: l.lat, lng: l.lng },
          population: l.population,
          timezone: l.timezone,
          adminLevel: 1,
          aliases: l.aliases || [],
          region: country?.region || 'Global',
          description: `${l.name} is a major state/province in ${l.country}.`,
        };
      });
  }

  // Other types are supported in the data model and will be populated as dedicated datasets are linked
  return [];
}
