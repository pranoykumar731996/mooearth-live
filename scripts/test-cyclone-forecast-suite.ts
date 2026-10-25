/**
 * scripts/test-cyclone-forecast-suite.ts
 *
 * Comprehensive Automated Verification Suite for MooEarth Live:
 * Tropical Cyclone Forecast Timeline, Track Animation & Landfall Intelligence
 *
 * Verifies:
 * 1. Data contracts & geometric invariants (coordinate validation, cone GeoJSON generation).
 * 2. Forecast interpolation engine (0h live, exact node matches, intermediate hours, historical frames).
 * 3. Coastline proximity and transparent Landfall Outlook with non-governmental disclaimers.
 * 4. Multi-provider ingestion adapter (NOAA NHC, IMD, JTWC) and 10-minute caching.
 * 5. Timeline scrubber steps (-24h to +120h) and layer registry naming ('Cyclone Tracker').
 */

import {
  validateCycloneCoordinates,
  getDestinationPoint,
  buildUncertaintyConeGeoJson,
  interpolateForecastPosition,
  OFFICIAL_CYCLONE_BASELINES,
  TropicalCyclone,
  CycloneForecastConeNode,
} from '../src/services/weather/cycloneTrackingService';

import {
  calculateHaversineDistanceKm,
  findNearestCoastline,
  computeLandfallOutlook,
} from '../src/services/weather/coastlineProximity';

import { getOfficialActiveCyclones } from '../src/services/weather/cycloneForecastAdapter';
import { CYCLONE_TIMELINE_STEPS, CYCLONE_LIVE_STEP_INDEX } from '../src/components/Weather/WindyTimeScrubber';
import { WEATHER_LAYERS } from '../src/services/weather/types';
import { WEATHER_LAYER_REGISTRY } from '../src/services/weather/layerRegistry';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (failureDetails) console.error(`     Reason: ${failureDetails}`);
    process.exitCode = 1;
  }
}

async function runCycloneForecastSuite() {
  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log(' 🌀 MooEarth Live — Cyclone Forecast & Tracking Test Suite');
  console.log('═════════════════════════════════════════════════════════════════\n');

  // ─────────────────────────────────────────────────────────────
  // Section 1: Data Contract & Geometric Invariants
  // ─────────────────────────────────────────────────────────────
  console.log('── Section 1: Data Contract & Geometric Invariants ──');

  assert(
    validateCycloneCoordinates(20.5, 87.2) === true &&
    validateCycloneCoordinates(0, 0) === true &&
    validateCycloneCoordinates(-35.2, 149.1) === true,
    'validateCycloneCoordinates accepts valid geographic coordinates'
  );

  assert(
    validateCycloneCoordinates(95.0, 50.0) === false &&
    validateCycloneCoordinates(20.0, 190.0) === false &&
    validateCycloneCoordinates(NaN, 50.0) === false &&
    validateCycloneCoordinates(20.0, Infinity) === false,
    'validateCycloneCoordinates rejects invalid, out-of-range, and NaN coordinates'
  );

  // Destination point test: moving 111 km North from equator should yield ~1 degree latitude
  // Note: getDestinationPoint returns [finalLng, finalLat] in GeoJSON coordinate order
  const destNorth = getDestinationPoint(0, 0, 0, 111.195);
  assert(
    Math.abs(destNorth[1] - 1.0) < 0.05 && Math.abs(destNorth[0] - 0.0) < 0.05,
    'getDestinationPoint accurately computes spherical coordinates (North displacement)'
  );

  // Build uncertainty cone GeoJSON polygon test
  const testConeNodes: CycloneForecastConeNode[] = [
    { hoursAhead: 12, lat: 21.0, lng: 87.0, coneRadiusKm: 50, predictedWindKph: 120, predictedCategory: 'Cyclone' },
    { hoursAhead: 24, lat: 22.0, lng: 86.5, coneRadiusKm: 85, predictedWindKph: 140, predictedCategory: 'Severe Cyclone' },
    { hoursAhead: 48, lat: 23.5, lng: 85.8, coneRadiusKm: 140, predictedWindKph: 90, predictedCategory: 'Deep Depression' },
  ];
  const coneGeoJson = buildUncertaintyConeGeoJson(20.0, 87.5, testConeNodes);
  assert(
    coneGeoJson.type === 'Polygon' &&
    Array.isArray(coneGeoJson.coordinates) &&
    coneGeoJson.coordinates[0].length >= 4,
    'buildUncertaintyConeGeoJson returns a valid GeoJSON Polygon with closed ring'
  );

  const ring = coneGeoJson.coordinates[0];
  const firstCoord = ring[0];
  const lastCoord = ring[ring.length - 1];
  assert(
    firstCoord[0] === lastCoord[0] && firstCoord[1] === lastCoord[1],
    'Uncertainty cone GeoJSON boundary forms a strictly closed topological ring'
  );

  // Baseline cyclones verification
  assert(
    OFFICIAL_CYCLONE_BASELINES.length >= 4,
    'Official baseline cyclone registry includes all required verification systems'
  );

  const allBaselinesValid = OFFICIAL_CYCLONE_BASELINES.every((c) =>
    c.forecastPoints && c.forecastPoints.length > 0 &&
    c.historicalTrack && c.historicalTrack.length > 0 &&
    c.uncertaintyConeGeoJson && c.uncertaintyConeGeoJson.type === 'Polygon'
  );
  assert(
    allBaselinesValid,
    'All baseline cyclones possess official forecastPoints, historicalTrack, and uncertaintyConeGeoJson'
  );

  // ─────────────────────────────────────────────────────────────
  // Section 2: Timeline Interpolation Engine
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Section 2: Timeline Interpolation Engine ──');

  const testCyclone = OFFICIAL_CYCLONE_BASELINES[0]; // Super Typhoon Kong-rey

  // 0 hours ahead (Live observation)
  const pos0h = interpolateForecastPosition(testCyclone, 0);
  assert(
    pos0h.lat === testCyclone.lat &&
    pos0h.lng === testCyclone.lng &&
    pos0h.isForecast === false &&
    pos0h.isInterpolated === false &&
    pos0h.leadHours === 0,
    'interpolateForecastPosition(cyclone, 0) returns exact live storm eye coordinates'
  );

  // Exact forecast node match (e.g., node 2 hoursAhead)
  const node2 = testCyclone.forecastCone[1]; // e.g. 24h
  const posExact = interpolateForecastPosition(testCyclone, node2.hoursAhead);
  assert(
    Math.abs(posExact.lat - node2.lat) < 0.001 &&
    Math.abs(posExact.lng - node2.lng) < 0.001 &&
    posExact.isForecast === true &&
    posExact.isInterpolated === false &&
    posExact.leadHours === node2.hoursAhead,
    `interpolateForecastPosition matches exact forecast node at +${node2.hoursAhead}h`
  );

  // Intermediate forecast hour (interpolation between nodes)
  const midHour = Math.floor((testCyclone.forecastCone[0].hoursAhead + testCyclone.forecastCone[1].hoursAhead) / 2);
  const posInterp = interpolateForecastPosition(testCyclone, midHour);
  assert(
    posInterp.isForecast === true &&
    posInterp.isInterpolated === true &&
    posInterp.leadHours === midHour &&
    typeof posInterp.lat === 'number' && !isNaN(posInterp.lat) &&
    typeof posInterp.lng === 'number' && !isNaN(posInterp.lng),
    `interpolateForecastPosition computes smooth intermediate position at +${midHour}h`
  );

  // Historical frame (negative hours ahead)
  const posPast = interpolateForecastPosition(testCyclone, -12);
  assert(
    posPast.isForecast === false &&
    typeof posPast.lat === 'number' &&
    typeof posPast.lng === 'number',
    'interpolateForecastPosition resolves historical position for negative timeline offsets'
  );

  // Beyond forecast range (> 120h)
  const posBeyond = interpolateForecastPosition(testCyclone, 150);
  const lastNode = testCyclone.forecastCone[testCyclone.forecastCone.length - 1];
  assert(
    posBeyond.lat === lastNode.lat && posBeyond.lng === lastNode.lng,
    'interpolateForecastPosition safely clamps beyond final forecast point without throwing'
  );

  // ─────────────────────────────────────────────────────────────
  // Section 3: Coastline Proximity & Landfall Intelligence
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Section 3: Coastline Proximity & Landfall Intelligence ──');

  // Distance between Mumbai (18.922, 72.834) and Pune (18.520, 73.856) is ~120 km
  const testDist = calculateHaversineDistanceKm(18.922, 72.834, 18.520, 73.856);
  assert(
    testDist > 110 && testDist < 130,
    'calculateHaversineDistanceKm calculates accurate geodesic distances'
  );

  // Coastline proximity for Severe Cyclonic Storm Dana (Bay of Bengal / Odisha coast)
  const danaCyclone = OFFICIAL_CYCLONE_BASELINES.find((c) => c.name.includes('Dana')) || OFFICIAL_CYCLONE_BASELINES[2];
  const danaCoast = findNearestCoastline(danaCyclone.lat, danaCyclone.lng);
  assert(
    danaCoast.distanceKm < 400 &&
    (danaCoast.nearestPoint.name.includes('Odisha') || danaCoast.nearestPoint.country.includes('India')),
    'findNearestCoastline identifies Bay of Bengal / Odisha coast for Cyclone Dana'
  );

  // Landfall outlook calculation and disclaimer verification
  const outlook = computeLandfallOutlook(danaCyclone);

  assert(
    outlook !== undefined && typeof outlook.coastlineDistanceKm === 'number',
    'computeLandfallOutlook produces structured coastal impact assessment'
  );

  assert(
    outlook !== undefined && outlook.disclaimer.includes('NOT an official government landfall declaration'),
    'Landfall Outlook contains mandatory non-governmental disclaimer protecting user safety'
  );

  // ─────────────────────────────────────────────────────────────
  // Section 4: Multi-Provider Ingestion Adapter
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Section 4: Multi-Provider Ingestion Adapter ──');

  const providerFeed = await getOfficialActiveCyclones();
  assert(
    providerFeed.count >= 1 && Array.isArray(providerFeed.cyclones),
    'getOfficialActiveCyclones returns active cyclones from official meteorological feeds'
  );

  assert(
    providerFeed.sourceAgencies.includes('NOAA NHC') || providerFeed.sourceAgencies.includes('IMD'),
    'Cyclone feed attributions cite official meteorological agencies (NOAA NHC, IMD, JTWC)'
  );

  // SWR cache deduplication test
  const startCacheTime = Date.now();
  const cachedFeed = await getOfficialActiveCyclones();
  const elapsedCacheTime = Date.now() - startCacheTime;
  assert(
    elapsedCacheTime < 100 && cachedFeed.fetchedAt === providerFeed.fetchedAt,
    'getOfficialActiveCyclones serves immediate cached response with request deduplication'
  );

  // ─────────────────────────────────────────────────────────────
  // Section 5: Timeline Scrubber & Layer Registry
  // ─────────────────────────────────────────────────────────────
  console.log('\n── Section 5: Timeline Scrubber & Layer Registry ──');

  assert(
    Array.isArray(CYCLONE_TIMELINE_STEPS) && CYCLONE_TIMELINE_STEPS.length === 19,
    'CYCLONE_TIMELINE_STEPS defines 19 precise steps spanning -24h to +120h'
  );

  assert(
    CYCLONE_TIMELINE_STEPS[CYCLONE_LIVE_STEP_INDEX] === 0,
    `CYCLONE_LIVE_STEP_INDEX (${CYCLONE_LIVE_STEP_INDEX}) maps exactly to 0h (Live Now)`
  );

  assert(
    CYCLONE_TIMELINE_STEPS[CYCLONE_TIMELINE_STEPS.length - 1] === 120,
    'CYCLONE_TIMELINE_STEPS extends up to the official 5-day (+120h) forecast horizon'
  );

  // Layer naming verification
  const hurricaneConfig = WEATHER_LAYERS.find((l) => l.id === 'hurricane');
  assert(
    hurricaneConfig !== undefined && hurricaneConfig.name === 'Cyclone Tracker',
    'WEATHER_LAYERS contains hurricane layer with name "Cyclone Tracker"'
  );

  assert(
    WEATHER_LAYER_REGISTRY.hurricane !== undefined && WEATHER_LAYER_REGISTRY.hurricane.shortName === 'Cyclone Tracker',
    'WEATHER_LAYER_REGISTRY contains hurricane layer with shortName "Cyclone Tracker"'
  );

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log(` 🌀 Cyclone Forecast Suite: ${passedChecks}/${totalChecks} assertions passed`);
  console.log('═════════════════════════════════════════════════════════════════\n');

  if (passedChecks === totalChecks) {
    console.log('🎉 ALL CYCLONE FORECAST & TRACKING INVARIANTS VERIFIED!\n');
    process.exitCode = 0;
  } else {
    console.error(`💥 ${totalChecks - passedChecks} assertions failed!\n`);
    process.exitCode = 1;
  }
}

runCycloneForecastSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
});
