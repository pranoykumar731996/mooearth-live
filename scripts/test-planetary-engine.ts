// ============================================================
// MooEarth Live — Planetary Engine Test Suite (Phase 1)
// ============================================================

import {
  fetchUsgsEarthquakes,
  parseUsgsFeature,
  resolveUsgsLocation,
} from '../src/services/planetaryEngine/usgsClient';
import {
  fetchNasaEonetEvents,
  parseNasaEonetEvent,
} from '../src/services/planetaryEngine/nasaEonetClient';
import { fetchNoaaSpaceWeather } from '../src/services/planetaryEngine/noaaSpaceWeatherClient';
import { fetchNasaEarthObservatory } from '../src/services/planetaryEngine/nasaEarthObsClient';
import {
  fetchLivePlanetaryEvents,
  searchPlanetaryEvents,
  fetchPlanetaryEventsForCountry,
  planetaryEventToWorldEvent,
} from '../src/services/planetaryEngine';
import { UsgsEarthquakeFeature, NasaEonetEvent } from '../src/services/planetaryEngine/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🪐 MooEarth Live Planetary Engine Test Suite (Phase 1)');
  console.log('======================================================\n');

  // ----------------------------------------------------------------
  // 1. USGS Earthquake Client Tests
  // ----------------------------------------------------------------
  console.log('--- 1. USGS Earthquake Ingestion & Geolocation ---');

  const loc1 = resolveUsgsLocation('15 km SW of Tokyo, Japan', 35.67, 139.65);
  assert(loc1.country.toLowerCase() === 'japan', `Tokyo resolved to Japan (got ${loc1.country})`);
  assert(loc1.city === 'Tokyo', `City extracted as Tokyo (got ${loc1.city})`);

  const loc2 = resolveUsgsLocation('4 km NW of San Francisco, CA', 37.77, -122.41);
  assert(loc2.country === 'United States', `CA code resolved to United States (got ${loc2.country})`);

  const mockFeature: UsgsEarthquakeFeature = {
    type: 'Feature',
    id: 'us7000test',
    properties: {
      mag: 5.6,
      place: '45 km ENE of Sendai, Japan',
      time: 1729000000000,
      updated: 1729000100000,
      tz: null,
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000test',
      detail: '',
      felt: 25,
      cdi: 4.2,
      mmi: 5.5,
      alert: 'green',
      status: 'reviewed',
      tsunami: 0,
      sig: 450,
      net: 'us',
      code: '7000test',
      ids: ',us7000test,',
      sources: ',us,',
      types: ',origin,phase-data,',
      nst: 45,
      dmin: 1.2,
      rms: 0.85,
      gap: 65,
      magType: 'mww',
      type: 'earthquake',
      title: 'M 5.6 - 45 km ENE of Sendai, Japan',
    },
    geometry: {
      type: 'Point',
      coordinates: [141.25, 38.35, 25.4],
    },
  };

  const parsedQuake = parseUsgsFeature(mockFeature);
  assert(parsedQuake !== null, 'parseUsgsFeature generated a valid PlanetaryEvent');
  assert(parsedQuake?.category === 'seismic', 'Quake assigned category seismic');
  assert(parsedQuake?.planetaryTelemetry.magnitude === 5.6, 'Telemetry magnitude preserved (5.6)');
  assert(parsedQuake?.planetaryTelemetry.depthKm === 25.4, 'Telemetry depth preserved (25.4 km)');
  assert(parsedQuake?.lat === 38.35 && parsedQuake?.lng === 141.25, 'Lat/Lng mapped accurately');

  console.log('Testing live fetchUsgsEarthquakes()...');
  const liveQuakes = await fetchUsgsEarthquakes(8000);
  assert(Array.isArray(liveQuakes), 'fetchUsgsEarthquakes returned an array');
  assert(liveQuakes.length > 0, `Live USGS stream returned ${liveQuakes.length} events`);
  if (liveQuakes.length > 0) {
    const q1 = liveQuakes[0];
    assert(q1.category === 'seismic', 'Live event category is seismic');
    assert(typeof q1.lat === 'number' && typeof q1.lng === 'number', 'Live event has numeric coordinates');
    assert(q1.source.includes('USGS'), 'Source attribution identifies USGS');
  }

  // ----------------------------------------------------------------
  // 2. NASA EONET v3 Client Tests
  // ----------------------------------------------------------------
  console.log('\n--- 2. NASA EONET v3 Natural Events Ingestion ---');

  const mockEonetEvent: NasaEonetEvent = {
    id: 'EONET_1234',
    title: 'Wildfire - Sierra National Forest, California',
    description: 'Active forest fire observed by MODIS',
    link: 'https://eonet.gsfc.nasa.gov/api/v3/events/EONET_1234',
    closed: null,
    categories: [{ id: 'wildfires', title: 'Wildfires' }],
    sources: [{ id: 'InciWeb', url: 'https://inciweb.wildfire.gov/' }],
    geometry: [
      {
        magnitudeValue: 450,
        magnitudeUnit: 'MW',
        date: new Date(Date.now() - 3600000).toISOString(),
        type: 'Point',
        coordinates: [-119.25, 37.15],
      },
    ],
  };

  const parsedEonet = parseNasaEonetEvent(mockEonetEvent);
  assert(parsedEonet !== null, 'parseNasaEonetEvent generated a valid PlanetaryEvent');
  assert(parsedEonet?.category === 'wildfires', 'EONET event assigned category wildfires');
  assert(parsedEonet?.lat === 37.15 && parsedEonet?.lng === -119.25, 'Lat/Lng mapped correctly from [lng, lat]');
  assert(parsedEonet?.planetaryTelemetry.fireRadiativePowerMw === 450, 'Fire Radiative Power mapped to 450 MW');

  console.log('Testing live fetchNasaEonetEvents()...');
  const liveEonet = await fetchNasaEonetEvents(8000);
  assert(Array.isArray(liveEonet), 'fetchNasaEonetEvents returned an array');
  assert(liveEonet.length > 0, `Live NASA EONET returned ${liveEonet.length} active events`);
  if (liveEonet.length > 0) {
    const e1 = liveEonet[0];
    assert(['wildfires', 'severe_weather', 'seismic', 'climate_oceans', 'science_nature'].includes(e1.category), `Valid planetary category assigned (${e1.category})`);
    assert(e1.source.includes('NASA'), 'Source attribution identifies NASA');
  }

  // ----------------------------------------------------------------
  // 3. NOAA Space Weather Client Tests
  // ----------------------------------------------------------------
  console.log('\n--- 3. NOAA Space Weather Client Tests ---');

  console.log('Testing live fetchNoaaSpaceWeather()...');
  const liveSpace = await fetchNoaaSpaceWeather(8000);
  assert(Array.isArray(liveSpace), 'fetchNoaaSpaceWeather returned an array');
  assert(liveSpace.length > 0, `Live NOAA SWPC returned ${liveSpace.length} space events`);
  if (liveSpace.length > 0) {
    const s1 = liveSpace[0];
    assert(s1.category === 'space_weather', 'Space event assigned category space_weather');
    assert(Boolean(s1.planetaryTelemetry.kpIndex !== undefined || s1.planetaryTelemetry.sensorSource?.includes('NOAA')), 'Telemetry contains Kp index or sensor source');
  }

  // ----------------------------------------------------------------
  // 4. NASA Earth Observatory Client Tests
  // ----------------------------------------------------------------
  console.log('\n--- 4. NASA Earth Observatory Natural Imagery Client ---');

  console.log('Testing live fetchNasaEarthObservatory()...');
  const liveNasaObs = await fetchNasaEarthObservatory(8000);
  assert(Array.isArray(liveNasaObs), 'fetchNasaEarthObservatory returned an array');
  assert(liveNasaObs.length > 0, `Live NASA Earth Observatory returned ${liveNasaObs.length} publications`);
  if (liveNasaObs.length > 0) {
    const o1 = liveNasaObs[0];
    assert(o1.source === 'NASA Earth Observatory', 'Source attribution matches NASA Earth Observatory');
    assert(typeof o1.lat === 'number' && typeof o1.lng === 'number', 'Observation has valid coordinates');
  }

  // ----------------------------------------------------------------
  // 5. Planetary Engine Central Coordinator Tests
  // ----------------------------------------------------------------
  console.log('\n--- 5. Planetary Engine Coordinator & Query Filters ---');

  const combinedStream = await fetchLivePlanetaryEvents(true);
  assert(Array.isArray(combinedStream), 'fetchLivePlanetaryEvents returned an array');
  assert(combinedStream.length >= 20, `Combined stream returned ${combinedStream.length} planetary events`);

  // Verify coordinates integrity
  let validCoords = true;
  for (const e of combinedStream) {
    if (e.lat < -90 || e.lat > 90 || e.lng < -180 || e.lng > 180) {
      validCoords = false;
      break;
    }
  }
  assert(validCoords, 'All planetary event coordinates fall within valid [-90, 90] and [-180, 180] bounds');

  // Verify search
  const quakeSearch = await searchPlanetaryEvents('', 'seismic');
  assert(quakeSearch.length > 0, `searchPlanetaryEvents(seismic) returned ${quakeSearch.length} seismic events`);
  assert(quakeSearch.every((e) => e.category === 'seismic'), 'All filtered search items have category seismic');

  // Verify WorldEvent conversion
  if (combinedStream.length > 0) {
    const worldEvent = planetaryEventToWorldEvent(combinedStream[0]);
    assert(Boolean(worldEvent.id), 'WorldEvent has id');
    assert(Boolean(worldEvent.title), 'WorldEvent has title');
    assert(Boolean(worldEvent.category), 'WorldEvent has category');
    assert(worldEvent.planetaryTelemetry !== undefined, 'WorldEvent retains planetaryTelemetry');
  }

  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------
  console.log('\n======================================================');
  if (failedTests === 0) {
    console.log(`✅ All Planetary Engine Tests Passed: ${passedTests}/${totalTests}`);
  } else {
    console.error(`❌ Planetary Engine Tests Finished with Failures: ${passedTests} passed, ${failedTests} failed`);
  }
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
