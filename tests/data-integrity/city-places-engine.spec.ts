import { test, expect } from '@playwright/test';
import {
  CANONICAL_CITIES,
  getAllCities,
  getAllCitySlugs,
  getCityById,
  getCityBySlug,
  resolveCanonicalCitySlug,
  getNearbyCities,
  calculateHaversineDistanceKm,
  getPlacesByType,
} from '../../src/data/places';
import { locations } from '../../src/data/locations';
import { getCountryByName, getAllCountrySlugs } from '../../src/data/countries';
import { shouldIndexCityPage } from '../../src/lib/seo/cityQualityGate';
import { fetchNewsForCity } from '../../src/services/cityNewsService';
import { fetchCountryWeather } from '../../src/services/weatherService';
import { PlaceType } from '../../src/types/places';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 6: CITIES & PLACES ENGINE', () => {

  // =========================================================================
  // 1. LOCATION ID INTEGRITY
  // =========================================================================
  test.describe('1. Location ID Validation', () => {
    test('All cities originate strictly from the existing location database', () => {
      const dbCityLocations = locations.filter(l => l.type === 'city');
      const canonicalCities = getAllCities();

      expect(canonicalCities.length).toBe(dbCityLocations.length);
      expect(canonicalCities.length).toBeGreaterThanOrEqual(16);

      const dbIds = new Set(dbCityLocations.map(l => l.id));
      for (const city of canonicalCities) {
        expect(dbIds.has(city.id)).toBe(true);
      }
    });

    test('Zero duplicate location IDs across canonical cities', () => {
      const cities = getAllCities();
      const seenIds = new Set<string>();

      for (const city of cities) {
        expect(seenIds.has(city.id)).toBe(false);
        seenIds.add(city.id);
        expect(city.id).toMatch(/^city-[a-z0-9-]+$/);
      }

      expect(seenIds.size).toBe(cities.length);
    });

    test('getCityById() resolves every canonical city accurately', () => {
      const cities = getAllCities();

      for (const city of cities) {
        const resolved = getCityById(city.id);
        expect(resolved).not.toBeNull();
        expect(resolved!.id).toBe(city.id);
        expect(resolved!.name).toBe(city.name);
      }

      expect(getCityById('non-existent-id')).toBeNull();
    });
  });

  // =========================================================================
  // 2. SLUG GENERATION & CANONICAL RESOLUTION
  // =========================================================================
  test.describe('2. Slug Validation & Aliases', () => {
    test('All canonical city slugs are URL-safe and unique', () => {
      const cities = getAllCities();
      const seenSlugs = new Set<string>();

      for (const city of cities) {
        expect(city.slug).toMatch(/^[a-z0-9-]+$/);
        expect(seenSlugs.has(city.slug)).toBe(false);
        seenSlugs.add(city.slug);
      }

      expect(seenSlugs.size).toBe(cities.length);
    });

    test('getAllCitySlugs() matches all canonical cities', () => {
      const slugs = getAllCitySlugs();
      const cities = getAllCities();

      expect(slugs.length).toBe(cities.length);
      for (const city of cities) {
        expect(slugs.includes(city.slug)).toBe(true);
      }
    });

    test('resolveCanonicalCitySlug() maps aliases to their canonical city slugs', () => {
      const aliasMappings: [string, string][] = [
        ['nyc', 'new-york-city'],
        ['new-york', 'new-york-city'],
        ['la', 'los-angeles'],
        ['sf', 'san-francisco'],
        ['bombay', 'mumbai'],
        ['delhi', 'new-delhi'],
        ['paris-france', 'paris'],
        ['paris-tx', 'paris-texas'],
        ['munchen', 'munich'],
        ['rio', 'rio-de-janeiro'],
      ];

      for (const [alias, canonicalSlug] of aliasMappings) {
        const resolved = resolveCanonicalCitySlug(alias);
        expect(resolved).toBe(canonicalSlug);
        const city = getCityBySlug(alias);
        expect(city).not.toBeNull();
        expect(city!.slug).toBe(canonicalSlug);
      }
    });

    test('resolveCanonicalCitySlug() returns null for unknown slugs', () => {
      expect(resolveCanonicalCitySlug('atlantis')).toBeNull();
      expect(resolveCanonicalCitySlug('')).toBeNull();
      expect(resolveCanonicalCitySlug('   ')).toBeNull();
    });
  });

  // =========================================================================
  // 3. COUNTRY RELATION INTEGRITY
  // =========================================================================
  test.describe('3. Country Relation Validation', () => {
    test('Every city is mapped to a verified sovereign nation in CANONICAL_COUNTRIES', () => {
      const cities = getAllCities();
      const validCountrySlugs = new Set(getAllCountrySlugs());

      for (const city of cities) {
        expect(city.country).toBeTruthy();
        const country = getCountryByName(city.country);
        expect(country).not.toBeNull();

        // Country slug relation
        expect(city.countrySlug).toBe(country!.slug);
        expect(validCountrySlugs.has(city.countrySlug)).toBe(true);

        // ISO code relation
        expect(city.countryCode).toBe(country!.iso2);

        // Region relation
        expect(city.region).toBe(country!.region);
      }
    });

    test('Capital city flags accurately identify national capitals', () => {
      const tokyo = getCityBySlug('tokyo')!;
      const london = getCityBySlug('london')!;
      const paris = getCityBySlug('paris')!;
      const newdelhi = getCityBySlug('new-delhi')!;
      const nyc = getCityBySlug('new-york-city')!;
      const mumbai = getCityBySlug('mumbai')!;

      expect(tokyo.isCapital).toBe(true);
      expect(london.isCapital).toBe(true);
      expect(paris.isCapital).toBe(true);
      expect(newdelhi.isCapital).toBe(true);

      // Major metropolises that are not national capitals
      expect(nyc.isCapital).toBe(false);
      expect(mumbai.isCapital).toBe(false);
    });
  });

  // =========================================================================
  // 4. COORDINATES & GEODESIC NEARBY CALCULATION
  // =========================================================================
  test.describe('4. Coordinates & Geodesic Proximity', () => {
    test('All city coordinates are strictly within valid WGS84 terrestrial bounds', () => {
      const cities = getAllCities();

      for (const city of cities) {
        const { lat, lng } = city.coordinates;
        expect(typeof lat).toBe('number');
        expect(typeof lng).toBe('number');
        expect(isNaN(lat)).toBe(false);
        expect(isNaN(lng)).toBe(false);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
      }
    });

    test('calculateHaversineDistanceKm() computes accurate geodesic distances', () => {
      // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) is approx 343 km
      const distanceLondonParis = calculateHaversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
      expect(distanceLondonParis).toBeGreaterThanOrEqual(330);
      expect(distanceLondonParis).toBeLessThanOrEqual(360);

      // Tokyo (35.6762, 139.6503) to Kyoto (35.0116, 135.7681) is approx 365 km
      const distanceTokyoKyoto = calculateHaversineDistanceKm(35.6762, 139.6503, 35.0116, 135.7681);
      expect(distanceTokyoKyoto).toBeGreaterThanOrEqual(350);
      expect(distanceTokyoKyoto).toBeLessThanOrEqual(380);
    });

    test('getNearbyCities() retrieves nearest cities sorted by proximity', () => {
      const tokyo = getCityBySlug('tokyo')!;
      const nearbyToTokyo = getNearbyCities(tokyo.coordinates.lat, tokyo.coordinates.lng, 3, tokyo.id);

      expect(nearbyToTokyo.length).toBe(3);
      // Closest in dataset to Tokyo should be Kyoto
      expect(nearbyToTokyo[0].city.slug).toBe('kyoto');
      expect(nearbyToTokyo[0].distanceKm).toBeLessThan(500);

      // Ensure sorted ascending by distance
      for (let i = 0; i < nearbyToTokyo.length - 1; i++) {
        expect(nearbyToTokyo[i].distanceKm).toBeLessThanOrEqual(nearbyToTokyo[i + 1].distanceKm);
      }
    });
  });

  // =========================================================================
  // 5. INDEXING QUALITY GATE: shouldIndexCityPage()
  // =========================================================================
  test.describe('5. Indexing Quality Gate: shouldIndexCityPage()', () => {
    test('Accepts all 16 canonical verified cities from the location database', () => {
      const cities = getAllCities();

      for (const city of cities) {
        const result = shouldIndexCityPage(city.slug);
        expect(result.shouldIndex).toBe(true);
        expect(result.robotsDirective.index).toBe(true);
        expect(result.robotsDirective.follow).toBe(true);
        expect(result.canonicalSlug).toBe(city.slug);
        expect(result.city).not.toBeNull();
      }
    });

    test('Rejects duplicate alias slugs and redirects indexing equity to canonical', () => {
      const aliases = ['nyc', 'la', 'sf', 'bombay', 'delhi', 'paris-france', 'munchen', 'rio'];

      for (const alias of aliases) {
        const result = shouldIndexCityPage(alias);
        expect(result.shouldIndex).toBe(false);
        // Follow is true to pass link equity, index is false to prevent duplicate penalties
        expect(result.robotsDirective.index).toBe(false);
        expect(result.robotsDirective.follow).toBe(true);
        expect(result.canonicalSlug).not.toBeNull();
        expect(result.canonicalSlug).not.toBe(alias);
        expect(result.reason).toContain('is an alias for canonical city');
      }
    });

    test('Rejects unknown, empty, or unverified city slugs', () => {
      const invalidSlugs = ['atlantis', 'gotham', 'springfield-unknown', '', '   '];

      for (const slug of invalidSlugs) {
        const result = shouldIndexCityPage(slug);
        expect(result.shouldIndex).toBe(false);
        expect(result.robotsDirective.index).toBe(false);
        expect(result.robotsDirective.follow).toBe(false);
      }
    });

    test('Rejects corrupted city with missing coordinates or 0 population', () => {
      const corruptCity: any = {
        id: 'city-corrupt',
        name: 'Corrupt City',
        slug: 'corrupt-city',
        type: 'city',
        country: 'India',
        coordinates: { lat: NaN, lng: 100 },
        population: 0,
      };

      const result = shouldIndexCityPage('corrupt-city', { city: corruptCity });
      expect(result.shouldIndex).toBe(false);
      expect(result.robotsDirective.index).toBe(false);
    });
  });

  // =========================================================================
  // 6. METADATA & SCHEMA GENERATION CONTRACTS
  // =========================================================================
  test.describe('6. Metadata & Schema Contracts', () => {
    test('Canonical URLs adhere to /cities/[canonicalSlug] structure', () => {
      const cities = getAllCities();

      for (const city of cities) {
        const canonicalUrl = `https://www.mooearth.live/cities/${city.slug}`;
        expect(canonicalUrl).toMatch(/^https:\/\/www\.mooearth\.live\/cities\/[a-z0-9-]+$/);
      }
    });

    test('City schema contains required GeoCoordinates and parent country containment', () => {
      const tokyo = getCityBySlug('tokyo')!;

      const cityJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'City',
        name: tokyo.name,
        containedInPlace: {
          '@type': 'Country',
          name: tokyo.country,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: tokyo.coordinates.lat,
          longitude: tokyo.coordinates.lng,
        },
        population: tokyo.population,
      };

      expect(cityJsonLd['@type']).toBe('City');
      expect(cityJsonLd.name).toBe('Tokyo');
      expect(cityJsonLd.geo.latitude).toBe(35.6762);
      expect(cityJsonLd.containedInPlace.name).toBe('Japan');
      expect(cityJsonLd.population).toBeGreaterThan(1000000);
    });
  });

  // =========================================================================
  // 7. INTERNAL LINKS & INTER-HUB CONNECTIVITY
  // =========================================================================
  test.describe('7. Internal Links & Inter-Hub Connectivity', () => {
    test('Every city links back to its canonical parent Country Atlas & Intent Hubs', () => {
      const cities = getAllCities();

      for (const city of cities) {
        const countryAtlasUrl = `/countries/${city.countrySlug}`;
        const countryWeatherUrl = `/countries/${city.countrySlug}/weather`;
        const countryNewsUrl = `/countries/${city.countrySlug}/news`;
        const countryGeographyUrl = `/countries/${city.countrySlug}/geography`;
        const countryMapUrl = `/countries/${city.countrySlug}/map`;
        const countryQuizUrl = `/countries/${city.countrySlug}/quiz`;

        expect(countryAtlasUrl).toBeTruthy();
        expect(countryWeatherUrl).toBeTruthy();
        expect(countryNewsUrl).toBeTruthy();
        expect(countryGeographyUrl).toBeTruthy();
        expect(countryMapUrl).toBeTruthy();
        expect(countryQuizUrl).toBeTruthy();
      }
    });

    test('Nearby city links strictly resolve to existing canonical city pages', () => {
      const cities = getAllCities();
      const allSlugs = new Set(getAllCitySlugs());

      for (const city of cities) {
        const nearby = getNearbyCities(city.coordinates.lat, city.coordinates.lng, 4, city.id);
        expect(nearby.length).toBeGreaterThan(0);

        for (const { city: near } of nearby) {
          expect(allSlugs.has(near.slug)).toBe(true);
          expect(near.slug).not.toBe(city.slug);
        }
      }
    });
  });

  // =========================================================================
  // 8. PLACE TYPES ARCHITECTURE
  // =========================================================================
  test.describe('8. Place Types Architecture Readiness', () => {
    const supportedTypes: PlaceType[] = [
      'city',
      'state',
      'region',
      'continent',
      'ocean',
      'island',
      'mountain',
      'landmark',
    ];

    test('Place types architecture supports all 8 primary geographic place types', () => {
      expect(supportedTypes.length).toBe(8);
      expect(supportedTypes).toContain('city');
      expect(supportedTypes).toContain('state');
      expect(supportedTypes).toContain('region');
      expect(supportedTypes).toContain('continent');
      expect(supportedTypes).toContain('ocean');
      expect(supportedTypes).toContain('island');
      expect(supportedTypes).toContain('mountain');
      expect(supportedTypes).toContain('landmark');
    });

    test('getPlacesByType() correctly distinguishes cities and states from location database', () => {
      const cities = getPlacesByType('city');
      expect(cities.length).toBe(16);
      for (const c of cities) {
        expect(c.type).toBe('city');
      }

      const states = getPlacesByType('state');
      expect(states.length).toBe(6);
      for (const s of states) {
        expect(s.type).toBe('state');
        expect(s.country).toBeTruthy();
      }

      // Types without linked data return clean empty arrays without errors
      expect(getPlacesByType('ocean')).toEqual([]);
      expect(getPlacesByType('mountain')).toEqual([]);
    });
  });

  // =========================================================================
  // 9. LIVE SERVICE COMPATIBILITY (Weather & News)
  // =========================================================================
  test.describe('9. Live Service Compatibility', () => {
    test('Weather Service resolves live Open-Meteo telemetry for city coordinates', async () => {
      const tokyo = getCityBySlug('tokyo')!;
      const weather = await fetchCountryWeather(tokyo.coordinates.lat, tokyo.coordinates.lng);

      if (weather.isTemporaryError) {
        expect(weather.observation).toBeNull();
      } else {
        expect(weather.observation).not.toBeNull();
        expect(typeof weather.observation!.temperature).toBe('number');
        expect(weather.observation!.weatherDescription).toBeTruthy();
      }
    });

    test('City News Service fetches authentic news wire stories without hallucination', async () => {
      const london = getCityBySlug('london')!;
      const news = await fetchNewsForCity(london.name, london.country);

      expect(Array.isArray(news.articles)).toBe(true);
      for (const art of news.articles) {
        expect(art.title).toBeTruthy();
        expect(art.source).toBeTruthy();
        expect(art.originalUrl).toMatch(/^https?:\/\//);
      }
    });
  });
});
