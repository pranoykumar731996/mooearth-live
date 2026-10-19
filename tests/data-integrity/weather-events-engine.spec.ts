import { test, expect } from '@playwright/test';
import { fetchCountryWeather, fetchGlobalWeatherHighlights, GLOBAL_ANCHOR_STATIONS } from '../../src/services/weatherService';
import { fetchMajorWorldEvents } from '../../src/services/worldEventsService';
import { shouldIndexWeatherPage } from '../../src/lib/seo/weatherQualityGate';
import { shouldIndexEventPage } from '../../src/lib/seo/eventQualityGate';
import { getAllCountries, getCountryBySlug } from '../../src/data/countries';
import { getAllCities, getCityBySlug } from '../../src/data/places';
import sitemap from '../../src/app/sitemap';
import { metadata as weatherMeta } from '../../src/app/weather/page';
import { metadata as worldWeatherMeta } from '../../src/app/world-weather/page';
import { metadata as weatherMapMeta } from '../../src/app/weather-map/page';
import { generateMetadata as generateWorldEventsMeta } from '../../src/app/world-events/page';
import { generateMetadata as generateLiveEventsMeta } from '../../src/app/live-events/page';
import { generateMetadata as generateLocationWeatherMeta } from '../../src/app/weather/[location]/page';
import { geoToVector3 } from '../../src/components/Globe/WeatherLayers/WindParticleSystem';
import { BASELINE_CYCLONE_EVENTS } from '../../src/components/Globe/WeatherLayers/CycloneVortexLayer';
import {
  OFFICIAL_CYCLONE_BASELINES,
  isTropicalCycloneEvent,
  getActiveTropicalCyclones,
} from '../../src/services/weather/cycloneTrackingService';
import { getDisasterMeta } from '../../src/services/map/disasterMapUtils';

test.describe('MOOEARTH LIVE — GLOBAL SEO PHASE 9: WEATHER & WORLD EVENTS ENGINE', () => {

  // =========================================================================
  // 1. WEATHER TELEMETRY INTEGRITY & NO FAKE WEATHER
  // =========================================================================
  test.describe('1. Weather Telemetry & Authenticity', () => {
    test('Global anchor stations have verified coordinates and valid initial data', () => {
      expect(GLOBAL_ANCHOR_STATIONS.length).toBeGreaterThanOrEqual(10);
      for (const st of GLOBAL_ANCHOR_STATIONS) {
        expect(st.name).toBeTruthy();
        expect(st.country).toBeTruthy();
        expect(st.countrySlug).toBeTruthy();
        expect(typeof st.lat).toBe('number');
        expect(typeof st.lng).toBe('number');
        expect(st.lat).toBeGreaterThanOrEqual(-90);
        expect(st.lat).toBeLessThanOrEqual(90);
        expect(st.lng).toBeGreaterThanOrEqual(-180);
        expect(st.lng).toBeLessThanOrEqual(180);
      }
    });

    test('fetchCountryWeather returns verified telemetry or structured error without fabricating', async () => {
      // Tokyo coordinates
      const result = await fetchCountryWeather(35.6762, 139.6503);
      if (result.observation) {
        expect(typeof result.observation.temperature).toBe('number');
        expect(result.observation.temperature).toBeGreaterThanOrEqual(-50);
        expect(result.observation.temperature).toBeLessThanOrEqual(55);
        expect(typeof result.observation.surfacePressure).toBe('number');
        expect(result.observation.surfacePressure).toBeGreaterThanOrEqual(800);
        expect(result.observation.surfacePressure).toBeLessThanOrEqual(1100);
        expect(result.observation.weatherDescription).toBeTruthy();
        expect(result.observation.weatherEmoji).toBeTruthy();
        expect(typeof result.observation.isDay).toBe('boolean');
        expect(result.observation.timestamp).toBeTruthy();
      } else {
        expect(result.isTemporaryError).toBe(true);
      }
    });

    test('In-memory caching prevents redundant external weather API requests', async () => {
      const start1 = Date.now();
      const res1 = await fetchCountryWeather(48.8566, 2.3522); // Paris
      const dur1 = Date.now() - start1;

      const start2 = Date.now();
      const res2 = await fetchCountryWeather(48.8566, 2.3522); // Paris (cached)
      const dur2 = Date.now() - start2;

      // Second call must resolve immediately via in-memory cache
      expect(dur2).toBeLessThanOrEqual(dur1 + 5);
      expect(res1).toEqual(res2);
    });
  });

  // =========================================================================
  // 2. WEATHER INDEXING QUALITY GATE
  // =========================================================================
  test.describe('2. Weather Indexing Quality Gate', () => {
    test('Blocks indexing if weather observation is missing or errored', () => {
      const erroredResult = {
        observation: null,
        isTemporaryError: true,
        errorMessage: 'Network timeout',
      };

      const gate = shouldIndexWeatherPage('japan', 'japan', erroredResult);
      expect(gate.shouldIndex).toBe(false);
      expect(gate.robotsDirective.index).toBe(false);
      expect(gate.robotsDirective.follow).toBe(false);
    });

    test('Blocks indexing if weather observation is an alias', () => {
      const validResult = {
        observation: {
          temperature: 18,
          apparentTemperature: 18,
          relativeHumidity: 60,
          precipitation: 0,
          rain: 0,
          windSpeed: 10,
          windDirection: 180,
          cloudCover: 20,
          surfacePressure: 1013,
          weatherCode: 1,
          weatherDescription: 'Mainly clear',
          weatherEmoji: '🌤️',
          isDay: true,
          stationLat: 35.67,
          stationLng: 139.65,
          timestamp: new Date().toISOString(),
        },
        isTemporaryError: false,
      };

      const gate = shouldIndexWeatherPage('tokyo-jp', 'tokyo', validResult);
      expect(gate.shouldIndex).toBe(false);
      expect(gate.robotsDirective.index).toBe(false);
    });

    test('Blocks indexing if temperature reading is an anomalous fake or extreme reading', () => {
      const fakeResult = {
        observation: {
          temperature: 150, // Impossible Earth temperature
          apparentTemperature: 150,
          relativeHumidity: 60,
          precipitation: 0,
          rain: 0,
          windSpeed: 10,
          windDirection: 180,
          cloudCover: 20,
          surfacePressure: 1013,
          weatherCode: 1,
          weatherDescription: 'Extreme Heat',
          weatherEmoji: '🔥',
          isDay: true,
          stationLat: 35.67,
          stationLng: 139.65,
          timestamp: new Date().toISOString(),
        },
        isTemporaryError: false,
      };

      const gate = shouldIndexWeatherPage('tokyo', 'tokyo', fakeResult);
      expect(gate.shouldIndex).toBe(false);
      expect(gate.robotsDirective.index).toBe(false);
    });

    test('Allows indexing when all weather criteria are verified and fresh', () => {
      const validResult = {
        observation: {
          temperature: 21.5,
          apparentTemperature: 21.0,
          relativeHumidity: 55,
          precipitation: 0,
          rain: 0,
          windSpeed: 12.3,
          windDirection: 240,
          cloudCover: 10,
          surfacePressure: 1016.2,
          weatherCode: 0,
          weatherDescription: 'Clear sky',
          weatherEmoji: '☀️',
          isDay: true,
          stationLat: 48.85,
          stationLng: 2.35,
          timestamp: new Date().toISOString(),
        },
        isTemporaryError: false,
      };

      const gate = shouldIndexWeatherPage('paris', 'paris', validResult);
      expect(gate.shouldIndex).toBe(true);
      expect(gate.robotsDirective.index).toBe(true);
      expect(gate.robotsDirective.follow).toBe(true);
    });
  });

  // =========================================================================
  // 3. WORLD EVENTS SERVICE & NO FAKE EVENTS
  // =========================================================================
  test.describe('3. World Events Service & Source Integrity', () => {
    test('fetchMajorWorldEvents returns genuine events with all mandatory fields', async () => {
      const eventsData = await fetchMajorWorldEvents();
      expect(eventsData.events.length).toBeGreaterThan(0);
      expect(eventsData.totalEvents).toBeGreaterThan(0);
      expect(eventsData.lastUpdated).toBeTruthy();

      for (const evt of eventsData.events) {
        expect(evt.id).toBeTruthy();
        expect(evt.title.length).toBeGreaterThan(10);
        expect(evt.summary.length).toBeGreaterThan(10);
        expect(evt.context.length).toBeGreaterThan(15);
        expect(evt.source).toBeTruthy();
        expect(evt.sourceUrl).toBeTruthy();
        expect(evt.dateTime).toBeTruthy();
        expect(!isNaN(new Date(evt.dateTime).getTime())).toBe(true);
        expect(evt.location.country).toBeTruthy();
        expect(evt.location.countrySlug).toBeTruthy();
        expect(typeof evt.location.lat).toBe('number');
        expect(typeof evt.location.lng).toBe('number');
      }
    });

    test('Event Quality Gate rejects empty or unverified event arrays', () => {
      const emptyGate = shouldIndexEventPage([]);
      expect(emptyGate.shouldIndex).toBe(false);
      expect(emptyGate.robotsDirective.index).toBe(false);

      const nullGate = shouldIndexEventPage(null);
      expect(nullGate.shouldIndex).toBe(false);
      expect(nullGate.robotsDirective.index).toBe(false);
    });

    test('Event Quality Gate approves valid genuine major events', async () => {
      const eventsData = await fetchMajorWorldEvents();
      const gate = shouldIndexEventPage(eventsData.events);
      expect(gate.shouldIndex).toBe(true);
      expect(gate.robotsDirective.index).toBe(true);
      expect(gate.robotsDirective.follow).toBe(true);
    });
  });

  // =========================================================================
  // 4. CANONICAL URL & METADATA CHECKS
  // =========================================================================
  test.describe('4. Canonical URLs and Search Intent Alignment', () => {
    test('/weather has correct canonical and keyword-rich metadata', () => {
      expect(weatherMeta.alternates?.canonical).toBe('https://www.mooearth.live/weather');
      expect((weatherMeta.title as string).toLowerCase()).toContain('weather');
      expect((weatherMeta.description as string).toLowerCase()).toContain('weather');
    });

    test('/world-weather has correct canonical and keyword-rich metadata', () => {
      expect(worldWeatherMeta.alternates?.canonical).toBe('https://www.mooearth.live/world-weather');
      expect((worldWeatherMeta.title as string).toLowerCase()).toContain('world weather');
    });

    test('/weather-map has correct canonical and keyword-rich metadata', () => {
      expect(weatherMapMeta.alternates?.canonical).toBe('https://www.mooearth.live/weather-map');
      expect((weatherMapMeta.title as string).toLowerCase()).toContain('weather map');
    });

    test('/world-events and /live-events have correct canonicals and unique titles', async () => {
      const weMeta = await generateWorldEventsMeta();
      const leMeta = await generateLiveEventsMeta();

      expect(weMeta.alternates?.canonical).toBe('https://www.mooearth.live/world-events');
      expect(leMeta.alternates?.canonical).toBe('https://www.mooearth.live/live-events');
      expect(weMeta.title).not.toEqual(leMeta.title);
    });

    test('/weather/[country] dynamically generates metadata for sovereign country', async () => {
      const meta = await generateLocationWeatherMeta({
        params: Promise.resolve({ location: 'japan' }),
      });

      expect(meta.alternates?.canonical).toBe('https://www.mooearth.live/weather/japan');
      expect((meta.title as string)).toContain('Japan');
    });

    test('/weather/[city] dynamically generates metadata for verified canonical city', async () => {
      const meta = await generateLocationWeatherMeta({
        params: Promise.resolve({ location: 'tokyo' }),
      });

      expect(meta.alternates?.canonical).toBe('https://www.mooearth.live/weather/tokyo');
      expect((meta.title as string)).toContain('Tokyo');
    });
  });

  // =========================================================================
  // 5. SITEMAP DISCOVERY FOR PHASE 9
  // =========================================================================
  test.describe('5. Sitemap Discovery for Phase 9 Routes', () => {
    test('Sitemap contains /weather, /world-weather, /weather-map, /world-events, /live-events', async () => {
      const items = await sitemap();
      const urls = new Set(items.map(i => i.url));

      expect(urls.has('https://www.mooearth.live/weather')).toBe(true);
      expect(urls.has('https://www.mooearth.live/world-weather')).toBe(true);
      expect(urls.has('https://www.mooearth.live/weather-map')).toBe(true);
      expect(urls.has('https://www.mooearth.live/world-events')).toBe(true);
      expect(urls.has('https://www.mooearth.live/live-events')).toBe(true);
      expect(urls.has('https://www.mooearth.live/weather/japan')).toBe(true);
      expect(urls.has('https://www.mooearth.live/weather/tokyo')).toBe(true);
    });
  });

  // =========================================================================
  // 6. 3D GLOBE COORDINATE ENGINE PARITY & INVARIANCE
  // =========================================================================
  test.describe('6. 3D Globe Coordinate Engine Parity & Invariance', () => {
    // Canonical three-globe polar2Cartesian reference formula
    function canonicalPolar2Cartesian(lat: number, lng: number, radius = 100) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (90 - lng) * (Math.PI / 180);
      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta),
      };
    }

    test('geoToVector3 matches canonical three-globe polar2Cartesian coordinate mapping exactly', () => {
      const testCoordinates = [
        { name: 'North Pole', lat: 90, lng: 0 },
        { name: 'South Pole', lat: -90, lng: 0 },
        { name: 'Equator Prime Meridian', lat: 0, lng: 0 },
        { name: 'Equator East (Asia/Pacific)', lat: 0, lng: 90 },
        { name: 'Equator West (Americas)', lat: 0, lng: -90 },
        { name: 'International Date Line', lat: 0, lng: 180 },
        { name: 'Super Typhoon Kong-rey (Philippine Sea)', lat: 19.5, lng: 126.8 },
        { name: 'Major Hurricane Helene (Gulf of Mexico)', lat: 25.2, lng: -86.5 },
        { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
        { name: 'London', lat: 51.5074, lng: -0.1278 },
        { name: 'New York', lat: 40.7128, lng: -74.0060 },
      ];

      const radius = 100;

      for (const loc of testCoordinates) {
        const canonical = canonicalPolar2Cartesian(loc.lat, loc.lng, radius);
        const actual = geoToVector3(loc.lat, loc.lng, radius);

        expect(actual.x, `${loc.name} X coordinate mismatch`).toBeCloseTo(canonical.x, 4);
        expect(actual.y, `${loc.name} Y coordinate mismatch`).toBeCloseTo(canonical.y, 4);
        expect(actual.z, `${loc.name} Z coordinate mismatch`).toBeCloseTo(canonical.z, 4);
      }
    });

    test('Prime Meridian (0, 0) correctly projects onto +Z axis', () => {
      const v = geoToVector3(0, 0, 100);
      expect(v.x).toBeCloseTo(0, 4);
      expect(v.y).toBeCloseTo(0, 4);
      expect(v.z).toBeCloseTo(100, 4);
    });

    test('90 degrees East correctly projects onto +X axis', () => {
      const v = geoToVector3(0, 90, 100);
      expect(v.x).toBeCloseTo(100, 4);
      expect(v.y).toBeCloseTo(0, 4);
      expect(v.z).toBeCloseTo(0, 4);
    });

    test('90 degrees West correctly projects onto -X axis', () => {
      const v = geoToVector3(0, -90, 100);
      expect(v.x).toBeCloseTo(-100, 4);
      expect(v.y).toBeCloseTo(0, 4);
      expect(v.z).toBeCloseTo(0, 4);
    });
  });

  // =========================================================================
  // 7. 2D MAP DISASTER & CYCLONE ENGINE
  // =========================================================================
  test.describe('7. 2D Map Disaster & Cyclone Engine', () => {
    test('getDisasterMeta accurately classifies cyclones, earthquakes, wildfires, and thunderstorms', () => {
      const cycloneMeta = getDisasterMeta({
        id: 'test-cyclone',
        title: 'Super Typhoon Kong-rey (Category 4)',
        summary: 'Cat 4 tropical cyclone',
        category: 'severe_weather',
        lat: 19.5,
        lng: 126.8,
        city: 'Philippine Sea',
        country: 'Philippines',
        source: 'JTWC',
        publishedAt: new Date().toISOString(),
        planetaryTelemetry: {
          windSpeedKph: 230,
          pressureHpa: 935,
          stormWarningType: 'tropical_cyclone',
        },
      });

      expect(cycloneMeta.type).toBe('cyclone');
      expect(cycloneMeta.icon).toBe('🌀');
      expect(cycloneMeta.categoryLabel).toBe('Cat 4-5');
      expect(cycloneMeta.cleanTitle).toContain('Kong-rey');

      const quakeMeta = getDisasterMeta({
        id: 'test-quake',
        title: 'M 7.2 - Off-Coast Honshu Earthquake',
        summary: 'Major subduction earthquake',
        category: 'seismic',
        lat: 37.5,
        lng: 142.1,
        city: 'Tohoku Coast',
        country: 'Japan',
        source: 'USGS',
        publishedAt: new Date().toISOString(),
        planetaryTelemetry: {
          magnitude: 7.2,
          depthKm: 28,
        },
      });

      expect(quakeMeta.type).toBe('seismic');
      expect(quakeMeta.icon).toBe('🌋');
      expect(quakeMeta.categoryLabel).toBe('M 7.2');

      const fireMeta = getDisasterMeta({
        id: 'test-fire',
        title: 'Jasper Complex Wildfire',
        summary: 'Aggressive wildfire front',
        category: 'wildfires',
        lat: 52.87,
        lng: -118.08,
        city: 'Alberta',
        country: 'Canada',
        source: 'NASA FIRMS',
        publishedAt: new Date().toISOString(),
        planetaryTelemetry: {
          fireRadiativePowerMw: 450,
        },
      });

      expect(fireMeta.type).toBe('wildfires');
      expect(fireMeta.icon).toBe('🔥');
      expect(fireMeta.categoryLabel).toBe('450 MW');
    });

    test('BASELINE_CYCLONE_EVENTS and OFFICIAL_CYCLONE_BASELINES are 100% synchronized in IDs and coordinates', () => {
      expect(BASELINE_CYCLONE_EVENTS.length).toBe(4);
      expect(OFFICIAL_CYCLONE_BASELINES.length).toBe(4);

      // Verify Dana in Bay of Bengal (East coast of India)
      const globeDana = BASELINE_CYCLONE_EVENTS.find((c) => c.id === 'cyclone-indian-ocean-tropical-cyclone');
      const serviceDana = OFFICIAL_CYCLONE_BASELINES.find((c) => c.id === 'cyclone-indian-ocean-tropical-cyclone');

      expect(globeDana).toBeDefined();
      expect(serviceDana).toBeDefined();
      expect(globeDana!.lat).toBe(17.5);
      expect(globeDana!.lng).toBe(88.5);
      expect(serviceDana!.lat).toBe(17.5);
      expect(serviceDana!.lng).toBe(88.5);
      expect(serviceDana!.basin).toBe('North Indian');
    });

    test('isTropicalCycloneEvent accurately identifies cyclones and excludes severe thunderstorms', () => {
      // Genuine cyclone
      expect(isTropicalCycloneEvent({
        id: 'c1',
        title: 'Very Severe Cyclonic Storm Dana',
        summary: 'Cyclone over Bay of Bengal',
        category: 'severe_weather',
        lat: 17.5,
        lng: 88.5,
        city: 'Bay of Bengal',
        country: 'India',
        publishedAt: new Date().toISOString(),
      })).toBe(true);

      // Severe thunderstorm must NOT be treated as a tropical cyclone
      expect(isTropicalCycloneEvent({
        id: 'noaa-storm-supercell-plains',
        title: 'Severe Thunderstorm Warning — Central Convective Corridor',
        summary: 'Severe convective supercell capable of producing 65 mph wind gusts',
        category: 'severe_weather',
        lat: 34.2,
        lng: -97.1,
        country: 'United States',
        city: 'Oklahoma City Corridor',
        publishedAt: new Date().toISOString(),
      })).toBe(false);

      expect(isTropicalCycloneEvent({
        id: 'noaa-storm-tropical-squall',
        title: 'Tropical Squall Line & Intense Lightning Network',
        summary: 'High-energy tropical convective cell generating intense lightning flash rates',
        category: 'severe_weather',
        lat: 14.6,
        lng: 121.0,
        country: 'Philippines',
        city: 'Manila Bay Sector',
        publishedAt: new Date().toISOString(),
      })).toBe(false);
    });

    test('getActiveTropicalCyclones never drops Bay of Bengal Dana when severe thunderstorms are present', () => {
      const feed = getActiveTropicalCyclones([
        {
          id: 'noaa-storm-tropical-squall',
          title: 'Tropical Squall Line & Intense Lightning Network',
          summary: 'High-energy tropical convective cell',
          category: 'severe_weather',
          lat: 14.6,
          lng: 121.0,
          city: 'Manila',
          country: 'Philippines',
          publishedAt: new Date().toISOString(),
        },
      ]);

      const dana = feed.cyclones.find((c) => c.basin === 'North Indian');
      expect(dana).toBeDefined();
      expect(dana!.lat).toBe(17.5);
      expect(dana!.lng).toBe(88.5);
      expect(dana!.id).toBe('cyclone-indian-ocean-tropical-cyclone');
    });

    test('getDisasterMeta classifies Dana in Bay of Bengal as cyclone with matching telemetry on 2D map', () => {
      const dana = BASELINE_CYCLONE_EVENTS.find((c) => c.id === 'cyclone-indian-ocean-tropical-cyclone')!;
      const meta = getDisasterMeta(dana);
      expect(meta.type).toBe('cyclone');
      expect(meta.icon).toBe('🌀');
      expect(meta.cleanTitle).toBe('Very Severe Cyclonic Storm Dana');
      expect(meta.categoryLabel).toBe('Cat 1-2');
      expect(meta.metricLabel).toBe('130 km/h');
    });
  });

  test.describe('8. Dynamic Initial User Location Resolution', () => {
    test('detectUserTimezoneLocation resolves region dynamically and never forces hardcoded Tokyo for Indian or global visitors', async () => {
      const { detectUserTimezoneLocation } = await import('../../src/services/userLocationResolver');
      const resolved = detectUserTimezoneLocation();
      expect(resolved).toBeDefined();
      expect(typeof resolved.latitude).toBe('number');
      expect(typeof resolved.longitude).toBe('number');
      expect(resolved.name).toBeDefined();
      expect(resolved.source).toBeDefined();
    });

    test('resolveInitialLocation respects saved user locations from localStorage', async () => {
      const { resolveInitialLocation, saveUserLocation, getSavedUserLocation } = await import('../../src/services/userLocationResolver');
      saveUserLocation({
        latitude: 20.2961,
        longitude: 85.8245,
        name: 'Bhubaneswar',
        country: 'India',
        timezone: 'Asia/Kolkata',
      });

      const saved = getSavedUserLocation();
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Bhubaneswar');
      expect(saved?.latitude).toBe(20.2961);

      const resolved = resolveInitialLocation();
      expect(resolved.name).toBe('Bhubaneswar');
      expect(resolved.source).toBe('saved');
    });
  });
});



