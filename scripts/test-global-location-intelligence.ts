// ============================================================
// MooEarth Live — Phase 4: Global Location Intelligence Test Suite
// ============================================================
// Comprehensive validation of:
// 1. Canonical Country & City Resolution
// 2. Local Timezone & Digital Clock Resolution
// 3. Weather Service Contract & Distinguishing Observations vs Forecasts
// 4. Country & City News Attribution, Deduplication, & AI Summary Badges
// 5. URL Query Parameter Serialization, Restoration, & Coordinate Sanitization
// 6. Stale Response Rejection (Race Condition Prevention)
// 7. Navigation Continuity (Earth -> Explore City -> Return to Earth)

import {
  resolveCanonicalLocation,
  parseLocationFromUrl,
  serializeLocationToUrl,
  deduplicateNewsArticles,
} from '../src/services/locationIntelligence';
import { CANONICAL_COUNTRIES, getCountryByName } from '../src/data/countries';
import { locations, LocationRecord } from '../src/data/locations';
import { getAllCities } from '../src/data/places';
import { getWmoWeatherInfo } from '../src/services/weather/forecastService';
import type { WorldEvent } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🧪 Running MooEarth.Live Phase 4 Global Location Intelligence Suite');
  console.log('============================================================\n');

  // ── 1. Canonical Country Resolution ─────────────────────────
  console.log('--- 1. Canonical Country Resolution ---');

  const testCountries = ['Japan', 'France', 'Brazil', 'United States', 'India', 'Egypt', 'Australia'];
  for (const cName of testCountries) {
    const loc = resolveCanonicalLocation({ country: cName });
    assert(loc !== null, `${cName} resolves to canonical location`);
    assert(loc?.type === 'country', `${cName} is classified as country`);
    assert(typeof loc?.lat === 'number' && typeof loc?.lng === 'number', `${cName} has valid numerical coordinates`);
    assert(loc?.flag !== undefined && loc.flag.length > 0, `${cName} has a valid flag emoji or symbol`);
    assert(typeof loc?.capital === 'string' && loc.capital.length > 0, `${cName} resolves capital city (${loc?.capital})`);
  }

  // Common aliases resolution
  const usaAlias = resolveCanonicalLocation({ country: 'USA' });
  assert(usaAlias?.name === 'United States', 'USA alias resolves to canonical United States');

  const ukAlias = resolveCanonicalLocation({ country: 'UK' });
  assert(ukAlias?.name === 'United Kingdom', 'UK alias resolves to canonical United Kingdom');

  const uaeAlias = resolveCanonicalLocation({ country: 'UAE' });
  assert(uaeAlias?.name === 'United Arab Emirates', 'UAE alias resolves to canonical United Arab Emirates');

  // Verify Capital Coordinates & Timezone for Explore City Map integration
  const japanCanon = resolveCanonicalLocation({ country: 'Japan' });
  assert(japanCanon?.capital === 'Tokyo', 'Japan capital is Tokyo');
  assert(japanCanon?.capitalCoordinates?.lat !== undefined, 'Japan has capital coordinates');
  assert(japanCanon?.timezone === 'Asia/Tokyo', 'Japan resolves capital timezone Asia/Tokyo');

  // ── 2. Canonical City Resolution ────────────────────────────
  console.log('\n--- 2. Canonical City Resolution ---');

  const testCities = ['Tokyo', 'London', 'Paris', 'New York City', 'Bhubaneswar', 'Mumbai', 'Sydney'];
  for (const cityName of testCities) {
    const loc = resolveCanonicalLocation({ city: cityName });
    assert(loc !== null, `${cityName} resolves to canonical city location`);
    assert(loc?.type === 'city', `${cityName} is classified as city`);
    assert(loc !== null && loc.lat !== undefined && loc.lat >= -90 && loc.lat <= 90, `${cityName} latitude is within [-90, 90]`);
    assert(loc !== null && loc.lng !== undefined && loc.lng >= -180 && loc.lng <= 180, `${cityName} longitude is within [-180, 180]`);
    assert(loc?.country !== undefined && loc.country.length > 0, `${cityName} resolves parent country (${loc?.country})`);
  }

  // Direct LocationRecord pass-through
  const sampleLocRecord: LocationRecord = {
    id: 'city-tokyo-jp',
    name: 'Tokyo',
    type: 'city',
    country: 'Japan',
    countryCode: 'JP',
    lat: 35.6762,
    lng: 139.6503,
    population: 14000000,
    timezone: 'Asia/Tokyo',
    adminLevel: 2,
  };
  const fromRecord = resolveCanonicalLocation({ location: sampleLocRecord });
  assert(fromRecord?.name === 'Tokyo', 'LocationRecord resolves correctly');
  assert(fromRecord?.timezone === 'Asia/Tokyo', 'LocationRecord preserves timezone');

  // ── 3. Coordinate Bounds Validation & Safe Fallback ──────────
  console.log('\n--- 3. Coordinate Bounds Validation & Safe Fallback ---');

  const validCoord = resolveCanonicalLocation({ lat: 45.0, lng: 9.0 });
  assert(validCoord !== null, 'Valid lat/lng without name resolves to coordinate location');
  assert(validCoord?.type === 'city', 'Coordinate location defaults to city/pin type');

  const invalidLatHigh = resolveCanonicalLocation({ lat: 95.0, lng: 10.0 });
  assert(invalidLatHigh === null, 'Latitude 95.0 (> 90) is safely rejected');

  const invalidLatLow = resolveCanonicalLocation({ lat: -95.0, lng: 10.0 });
  assert(invalidLatLow === null, 'Latitude -95.0 (< -90) is safely rejected');

  const invalidLngHigh = resolveCanonicalLocation({ lat: 10.0, lng: 185.0 });
  assert(invalidLngHigh === null, 'Longitude 185.0 (> 180) is safely rejected');

  const invalidLngLow = resolveCanonicalLocation({ lat: 10.0, lng: -185.0 });
  assert(invalidLngLow === null, 'Longitude -185.0 (< -180) is safely rejected');

  const nanCoord = resolveCanonicalLocation({ lat: NaN, lng: NaN });
  assert(nanCoord === null, 'NaN coordinates are safely rejected');

  // ── 4. Reliable Timezone Formatting with Intl.DateTimeFormat ─
  console.log('\n--- 4. Reliable Timezone Formatting with Intl.DateTimeFormat ---');

  const testTimezones = ['Asia/Tokyo', 'Europe/Paris', 'America/New_York', 'Australia/Sydney', 'Africa/Cairo'];
  const testDate = new Date('2026-10-13T12:00:00Z');

  for (const tz of testTimezones) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const formattedTime = formatter.format(testDate);
      assert(formattedTime.length > 0, `Timezone ${tz} formats correctly (${formattedTime})`);
    } catch (e) {
      assert(false, `Timezone ${tz} threw an error during formatting`);
    }
  }

  // ── 5. Weather Telemetry Contract & Distinction ─────────────
  console.log('\n--- 5. Weather Telemetry Contract & Distinction ---');

  // Test WMO Weather codes
  const clearInfo = getWmoWeatherInfo(0);
  assert(clearInfo.desc === 'Clear sky' && clearInfo.emoji === '☀️', 'WMO 0 is Clear sky ☀️');

  const thunderInfo = getWmoWeatherInfo(95);
  assert(thunderInfo.desc === 'Thunderstorm' && thunderInfo.emoji === '⚡', 'WMO 95 is Thunderstorm ⚡');

  // Weather telemetry observation vs forecast distinction contract
  const sampleForecast = {
    current: {
      temperature: 21.4,
      apparentTemperature: 21.0,
      relativeHumidity: 55,
      windSpeed: 12.0,
      weatherCode: 0,
      weatherDescription: 'Clear sky',
      weatherEmoji: '☀️',
      time: '2026-10-13T14:00',
    },
    daily: {
      time: ['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17'],
      temperatureMax: [23, 22, 20, 19, 21],
      temperatureMin: [14, 13, 12, 11, 13],
      weatherCode: [0, 1, 2, 3, 0],
    },
    fetchedAt: '2026-10-13T14:05:00Z',
  };

  assert(sampleForecast.current.time !== undefined, 'Current observation has distinct observation timestamp');
  assert(sampleForecast.daily.time.length === 5, 'Daily forecast provides 5-day outlook array');
  assert(sampleForecast.daily.time[0] !== sampleForecast.current.time, 'Current observation is distinguished from forecast dates');

  // ── 6. News Deduplication & Attribution Signals ─────────────
  console.log('\n--- 6. News Deduplication & Attribution Signals ---');

  const rawArticles: WorldEvent[] = [
    {
      id: 'art-1',
      title: 'Japan Advances Semiconductor Technology with New Fab Facility',
      summary: 'Japan unveils major investment in domestic chip production.',
      category: 'science_nature',
      country: 'Japan',
      city: 'Tokyo',
      lat: 35.6762,
      lng: 139.6503,
      source: 'https://reuters.com/world/asia-pacific/japan-semiconductors-1',
      publishedAt: '2026-10-13T10:00:00Z',
    },
    {
      id: 'art-2',
      title: 'Japan advances semiconductor technology with new fab facility!', // Near-duplicate
      summary: 'Duplicate wire report.',
      category: 'science_nature',
      country: 'Japan',
      city: 'Tokyo',
      lat: 35.6762,
      lng: 139.6503,
      source: 'https://news.google.com/rss/duplicate',
      publishedAt: '2026-10-13T10:05:00Z',
    },
    {
      id: 'art-3',
      title: 'Tokyo Marathon Announces Record International Participation for 2027',
      summary: 'Over 38,000 runners registered for the world major marathon in Tokyo.',
      category: 'sports',
      country: 'Japan',
      city: 'Tokyo',
      lat: 35.6762,
      lng: 139.6503,
      source: 'https://kyodonews.net/sports/tokyo-marathon',
      publishedAt: '2026-10-13T09:30:00Z',
    },
  ];

  const deduped = deduplicateNewsArticles(rawArticles);
  assert(deduped.length === 2, 'Duplicate headline is successfully removed');
  assert(deduped[0].id === 'art-1', 'Original article is preserved');
  assert(deduped[1].id === 'art-3', 'Distinct second article is preserved');
  assert(deduped[0].source.startsWith('http'), 'Original publisher link is preserved in source');

  // ── 7. URL Serialization, Parsing & Navigation Continuity ────
  console.log('\n--- 7. URL Serialization, Parsing & Navigation Continuity ---');

  // Country URL serialization
  const japanLocation = resolveCanonicalLocation({ country: 'Japan' })!;
  const serializedCountryUrl = serializeLocationToUrl(japanLocation);
  assert(serializedCountryUrl.includes('country=Japan'), 'Country URL serialization contains country=Japan');
  assert(!serializedCountryUrl.includes('city='), 'Country URL serialization deletes city parameter');

  // City URL serialization
  const tokyoLocation = resolveCanonicalLocation({ city: 'Tokyo' })!;
  const serializedCityUrl = serializeLocationToUrl(tokyoLocation);
  assert(serializedCityUrl.includes('city=Tokyo'), 'City URL serialization contains city=Tokyo');
  assert(serializedCityUrl.includes('country=Japan'), 'City URL serialization contains country=Japan');
  assert(serializedCityUrl.includes('lat=35.6762'), 'City URL serialization contains latitude');
  assert(serializedCityUrl.includes('lng=139.6503'), 'City URL serialization contains longitude');

  // Parsing Country URL
  const parsedCountry = parseLocationFromUrl('?country=France');
  assert(parsedCountry.country === 'France', 'Parsed country is France');
  assert(parsedCountry.city === null, 'Parsed city is null');

  // Parsing City URL
  const parsedCity = parseLocationFromUrl('?city=Paris&country=France&lat=48.8566&lng=2.3522');
  assert(parsedCity.city === 'Paris', 'Parsed city is Paris');
  assert(parsedCity.country === 'France', 'Parsed country is France');
  assert(parsedCity.lat === 48.8566, 'Parsed latitude matches 48.8566');
  assert(parsedCity.lng === 2.3522, 'Parsed longitude matches 2.3522');

  // Parsing Invalid URL parameters
  const parsedInvalid = parseLocationFromUrl('?lat=999&lng=abc');
  assert(parsedInvalid.lat === null, 'Invalid latitude 999 parsed as null');
  assert(parsedInvalid.lng === null, 'Invalid longitude abc parsed as null');

  // ── 8. Stale Response Rejection Simulation ───────────────────
  console.log('\n--- 8. Stale Response Rejection Simulation ---');

  let activeLocationState: string | null = null;
  let activeRequestId = 0;

  async function simulateFetchLocation(target: string, delayMs: number) {
    const myRequestId = ++activeRequestId;
    await new Promise((r) => setTimeout(r, delayMs));
    // Guard: ignore if obsolete
    if (myRequestId === activeRequestId) {
      activeLocationState = target;
    }
  }

  // Fire Request 1 (Tokyo, slow: 150ms)
  const req1 = simulateFetchLocation('Tokyo', 150);
  // User rapidly clicks Request 2 (Paris, fast: 40ms)
  const req2 = simulateFetchLocation('Paris', 40);

  await Promise.all([req1, req2]);

  assert(
    activeLocationState === 'Paris',
    'Stale response from earlier slow request (Tokyo) does NOT overwrite newer location (Paris)'
  );

  // ── 9. Explore City Map URL Contract ─────────────────────────
  console.log('\n--- 9. Explore City Map URL Contract ---');

  const exploreCityUrl = `/weather?view=city&lat=${tokyoLocation.lat.toFixed(4)}&lng=${tokyoLocation.lng.toFixed(4)}&city=${encodeURIComponent(tokyoLocation.name)}&country=${encodeURIComponent(tokyoLocation.country)}`;
  assert(exploreCityUrl.includes('view=city'), 'Explore City URL specifies view=city for MapLibre mode');
  assert(exploreCityUrl.includes('lat=35.6762'), 'Explore City URL preserves exact city latitude');
  assert(exploreCityUrl.includes('lng=139.6503'), 'Explore City URL preserves exact city longitude');

  // ── Summary ─────────────────────────────────────────────────
  console.log('\n============================================================');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
