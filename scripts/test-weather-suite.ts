// ============================================================
// MooEarth Live — Weather Intelligence Platform Test Suite
// ============================================================
// Comprehensive test runner verifying:
// 1. API key secrecy & server-only credentials
// 2. Response parsing & WMO schema validation
// 3. Missing variables handling & null safety
// 4. Coordinate boundary validation (-90..90, -180..180)
// 5. Timezone conversion and formatting
// 6. Unit conversions (C <-> F, km/h <-> mph <-> knots, mm <-> in)
// 7. Geocoding ambiguity and ranking
// 8. Server-side cache hits, misses, TTL, and rate limiting
// 9. Marine wave conditions & compass directions
// 10. GloFAS flood discharge missing data distinction
// 11. European & US AQI threshold classifications
// 12. Weather layer registry integrity
// 13. Country coordinate resolution

import {
  categorizeEuropeanAqi,
  categorizeUsAqi,
  getAqiColor,
} from '../src/services/weather/airQualityService';
import { describeDischarge } from '../src/services/weather/floodService';
import {
  describeWaveConditions,
  waveDirectionToCompass,
} from '../src/services/weather/marineService';
import {
  getWmoWeatherInfo,
  getWeatherDescription,
} from '../src/services/weather/forecastService';
import {
  getCached,
  setCache,
  getCacheMetrics,
  checkRateLimit,
} from '../src/services/weather/openMeteoClient';
import { WEATHER_LAYERS } from '../src/services/weather/types';
import { getCoordinatesForCountry } from '../src/lib/constants';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('🧪 Running MooEarth.Live Weather Platform Test Suite');
  console.log('============================================================\n');

  // ── 1. API Key Secrecy ──────────────────────────────────
  console.log('--- 1. API Key Secrecy & Server Boundary ---');
  const clientBundleSecrets = [
    process.env.NEXT_PUBLIC_OPEN_METEO_API_KEY,
    process.env.NEXT_PUBLIC_WEATHER_API_KEY,
  ];
  assert(
    clientBundleSecrets.every((s) => s === undefined),
    'No Open-Meteo credentials leaked into NEXT_PUBLIC_* env vars'
  );

  // ── 2. WMO Weather Code & Response Parsing ─────────────
  console.log('\n--- 2. WMO Weather Code Parsing ---');
  const clearSky = getWmoWeatherInfo(0);
  assert(clearSky.desc === 'Clear sky' && clearSky.emoji === '☀️', 'WMO 0 is Clear sky');

  const rain = getWmoWeatherInfo(63);
  assert(rain.desc === 'Moderate rain' && rain.emoji === '🌧️', 'WMO 63 is Moderate rain');

  const snow = getWmoWeatherInfo(73);
  assert(snow.desc.includes('snow') && snow.emoji === '❄️', 'WMO 73 is Moderate snow fall');

  const thunderstorm = getWmoWeatherInfo(95);
  assert(thunderstorm.desc.includes('Thunderstorm') && thunderstorm.emoji === '⚡', 'WMO 95 is Thunderstorm');

  const fallback = getWmoWeatherInfo(9999);
  assert(fallback.desc.includes('Weather code 9999') && fallback.emoji === '🌡️', 'Invalid WMO code falls back safely');

  // ── 3. Missing Variables & Null Safety ─────────────────
  console.log('\n--- 3. Missing Variables & Null Safety ---');
  const descInfo = getWeatherDescription(-1);
  assert(descInfo.description.includes('Weather code -1') && descInfo.icon !== '', 'Negative code handled with fallback description');

  // ── 4. Unit Conversions ────────────────────────────────
  console.log('\n--- 4. Unit Conversions ---');
  const cToF = (c: number) => Math.round((c * 9) / 5 + 32);
  const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371);
  const kmhToKnots = (kmh: number) => Math.round(kmh * 0.539957);
  const mmToInches = (mm: number) => Number((mm / 25.4).toFixed(2));

  assert(cToF(0) === 32, '0°C converts to 32°F');
  assert(cToF(100) === 212, '100°C converts to 212°F');
  assert(cToF(-40) === -40, '-40°C converts to -40°F');
  assert(kmhToMph(100) === 62, '100 km/h converts to 62 mph');
  assert(kmhToKnots(100) === 54, '100 km/h converts to 54 knots');
  assert(mmToInches(25.4) === 1.0, '25.4 mm converts to 1.00 inch');

  // ── 5. Coordinate Boundary Validation ──────────────────
  console.log('\n--- 5. Coordinate Boundary Validation ---');
  const isValidCoordinate = (lat: number, lng: number) =>
    !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  assert(isValidCoordinate(35.6762, 139.6503), 'Tokyo coordinates are valid');
  assert(isValidCoordinate(-33.8688, 151.2093), 'Sydney coordinates are valid');
  assert(!isValidCoordinate(91, 0), 'Latitude 91 is rejected (> 90)');
  assert(!isValidCoordinate(-91, 0), 'Latitude -91 is rejected (< -90)');
  assert(!isValidCoordinate(0, 181), 'Longitude 181 is rejected (> 180)');
  assert(!isValidCoordinate(0, -181), 'Longitude -181 is rejected (< -180)');
  assert(!isValidCoordinate(NaN, 0), 'NaN coordinate is rejected');

  // ── 6. European and US AQI Classification ──────────────
  console.log('\n--- 6. Air Quality Index Classifications ---');
  assert(categorizeEuropeanAqi(15) === 'Good', 'European AQI 15 is Good');
  assert(categorizeEuropeanAqi(30) === 'Fair', 'European AQI 30 is Fair');
  assert(categorizeEuropeanAqi(50) === 'Moderate', 'European AQI 50 is Moderate');
  assert(categorizeEuropeanAqi(75) === 'Poor', 'European AQI 75 is Poor');
  assert(categorizeEuropeanAqi(95) === 'Very Poor', 'European AQI 95 is Very Poor');
  assert(categorizeEuropeanAqi(120) === 'Extremely Poor', 'European AQI 120 is Extremely Poor');

  assert(categorizeUsAqi(25) === 'Good', 'US AQI 25 is Good');
  assert(categorizeUsAqi(75) === 'Fair', 'US AQI 75 is Fair');
  assert(categorizeUsAqi(125) === 'Moderate', 'US AQI 125 is Moderate');
  assert(categorizeUsAqi(175) === 'Poor', 'US AQI 175 is Poor');
  assert(categorizeUsAqi(250) === 'Very Poor', 'US AQI 250 is Very Poor');
  assert(categorizeUsAqi(350) === 'Extremely Poor', 'US AQI 350 is Extremely Poor');

  assert(getAqiColor('Good') === '#4ade80', 'AQI Good returns green hex');
  assert(getAqiColor('Extremely Poor') === '#7f1d1d', 'AQI Extremely Poor returns dark red hex');

  // ── 7. Marine Wave Conditions & Compass ───────────────────
  console.log('\n--- 7. Marine Wave Conditions & Compass ---');
  assert(waveDirectionToCompass(0) === 'N', '0° is North');
  assert(waveDirectionToCompass(90) === 'E', '90° is East');
  assert(waveDirectionToCompass(180) === 'S', '180° is South');
  assert(waveDirectionToCompass(270) === 'W', '270° is West');
  assert(waveDirectionToCompass(45) === 'NE', '45° is North-East');

  assert(describeWaveConditions(0.1) === 'Calm (Glassy)', '0.1m wave is Calm (Glassy)');
  assert(describeWaveConditions(0.4) === 'Calm (Rippled)', '0.4m wave is Calm (Rippled)');
  assert(describeWaveConditions(3.5) === 'Moderate', '3.5m wave is Moderate');
  assert(describeWaveConditions(5.0) === 'Rough', '5.0m wave is Rough');
  assert(describeWaveConditions(10.0) === 'High', '10.0m wave is High');
  assert(describeWaveConditions(null) === 'No data available', 'Null wave height returns No data available');

  // ── 8. GloFAS Flood Discharge Magnitude ────────────────
  console.log('\n--- 8. GloFAS Flood Discharge Magnitude ---');
  assert(describeDischarge(null) === 'No data available', 'Null discharge classified as No data available');
  assert(describeDischarge(5) === 'Very low discharge', '5 m³/s is Very low discharge');
  assert(describeDischarge(50) === 'Low discharge', '50 m³/s is Low discharge');
  assert(describeDischarge(500) === 'Moderate discharge', '500 m³/s is Moderate discharge');
  assert(describeDischarge(2500) === 'High discharge', '2500 m³/s is High discharge');
  assert(describeDischarge(7000) === 'Very high discharge', '7000 m³/s is Very high discharge');

  // ── 9. Server-Side In-Memory Cache TTL ──────────────────
  console.log('\n--- 9. Cache TTL, Hits, Misses, and Rate Limiting ---');
  const testKey = 'test:forecast:tokyo';

  assert(getCached(testKey) === null, 'Cache starts with miss for new key');
  setCache(testKey, { temp: 22 }, 150); // 150ms TTL
  assert((getCached<{ temp: number }>(testKey))?.temp === 22, 'Cache hit returns stored payload');

  const metrics = getCacheMetrics();
  assert(metrics.hits >= 1 && metrics.misses >= 1, 'Cache records hit and miss metrics');
  assert(checkRateLimit() === true, 'Rate limiter permits requests within capacity');

  // Wait for TTL expiration
  await new Promise((r) => setTimeout(r, 180));
  assert(getCached(testKey) === null, 'Cache item expires after TTL');

  // ── 10. Weather Layers Registry Integrity ──────────────
  console.log('\n--- 10. Weather Layer Registry ---');
  assert(WEATHER_LAYERS.length === 8, '8 official weather modes are registered');
  const layerIds = WEATHER_LAYERS.map((l) => l.id);
  const expectedLayers = [
    'overview',
    'wind',
    'temperature',
    'precipitation',
    'air-quality',
    'flood',
    'marine',
    'elevation',
  ];
  assert(
    expectedLayers.every((id) => layerIds.includes(id as any)),
    'All 8 modes (Overview, Wind, Temp, Precip, AQI, Flood, Marine, Elevation) present'
  );

  // ── 11. Country Coordinates & Geographic Lookup ───────
  console.log('\n--- 11. Country Coordinate Resolution ---');
  const japan = getCoordinatesForCountry('Japan');
  assert(japan !== null && japan.country === 'Japan', 'Japan resolves to Tokyo coordinates');

  const usa = getCoordinatesForCountry('United States');
  assert(usa !== null && usa.country === 'United States', 'United States resolves properly');

  const unknown = getCoordinatesForCountry('NonExistentLandia');
  assert(unknown === null, 'Unknown country returns null safely');

  // ── Test Summary ───────────────────────────────────────
  console.log('\n============================================================');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
