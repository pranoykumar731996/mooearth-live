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

});
