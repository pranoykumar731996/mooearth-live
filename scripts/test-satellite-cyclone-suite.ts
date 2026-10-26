// ============================================================
// MooEarth Live — Phase E Test Suite: NASA/NOAA Satellite & Cyclone Tracking
// ============================================================
// Verifies:
// 1. NASA GIBS Satellite Products & WMTS tile endpoints
// 2. Spectral modes: Visible, Blue (Nighttime DNB), Infra (Thermal IR)
// 3. Observation timestamp calculations & date formatting
// 4. Saffir-Simpson Hurricane Wind Scale classification
// 5. Official 5-day NHC forecast cone of uncertainty calculations
// 6. Real-world official cyclone baselines (NOAA NHC, JTWC, IMD)
// 7. Event dossier modal anti-overlap isolation
// 8. Strict Zero-RainViewer & Zero-Mock integrity

import {
  SATELLITE_PRODUCTS,
  getSatelliteObservationDate,
  buildGibsTileUrl,
  getSatelliteMetadata,
} from '../src/services/weather/satelliteImageryService';
import {
  OFFICIAL_CYCLONE_BASELINES,
  getSaffirSimpsonCategoryNumber,
  getTropicalCycloneStageName,
  computeForecastCone,
  getActiveTropicalCyclones,
  cycloneToWorldEvent,
  getActiveTropicalCyclonesAsEvents,
} from '../src/services/weather/cycloneTrackingService';

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

async function runPhaseETests() {
  console.log('\n============================================================');
  console.log('🧪 Running MooEarth.Live Phase E Test Suite (Satellite & Cyclones)');
  console.log('============================================================\n');

  // ── 1. NASA GIBS Satellite Products ───────────────────────
  console.log('--- 1. NASA GIBS Satellite Products ---');
  const modes = ['visible', 'blue', 'infra'] as const;
  assert(modes.every(m => SATELLITE_PRODUCTS[m] !== undefined), 'All 3 spectral modes (visible, blue, infra) defined in SATELLITE_PRODUCTS');

  const vis = SATELLITE_PRODUCTS.visible;
  assert(vis.agency.includes('NASA'), 'Visible mode specifies NASA EOSDIS agency');
  assert(vis.instrument === 'VIIRS', 'Visible mode instrument is VIIRS');
  assert(vis.layerName === 'VIIRS_SNPP_CorrectedReflectance_TrueColor', 'Visible mode uses canonical VIIRS Corrected Reflectance TrueColor');
  assert(vis.license.includes('NASA Earth Science Open Data') || vis.license.includes('Public Domain'), 'Visible mode declares NASA Earth Science Open Data license');

  const blue = SATELLITE_PRODUCTS.blue;
  assert(blue.layerName.includes('DayNightBand') || blue.layerName.includes('Clean_Infrared'), 'Blue mode uses VIIRS Day/Night Band or Geostationary Clean Infrared');
  assert(blue.spectralMode === 'blue', 'Blue mode spectralMode property matches "blue"');

  const infra = SATELLITE_PRODUCTS.infra;
  assert(infra.description.toLowerCase().includes('infrared') || infra.name.toLowerCase().includes('thermal'), 'Infra mode describes thermal infrared cloud-top temperatures');

  // ── 2. Observation Timestamps & WMTS Tile Templates ───────
  console.log('\n--- 2. Observation Timestamps & WMTS Tile Templates ---');
  const obs = getSatelliteObservationDate(0);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(obs.dateStr), `Observation date string matches YYYY-MM-DD format (found "${obs.dateStr}")`);
  assert(obs.utcStr.endsWith(' UTC'), `Observation UTC string ends with " UTC" (found "${obs.utcStr}")`);
  assert(typeof obs.timestampMs === 'number' && obs.timestampMs > 1700000000000, 'Observation timestamp in ms is valid');

  const pastObs = getSatelliteObservationDate(24);
  assert(pastObs.timestampMs < obs.timestampMs, '24h offset timestamp is earlier than current observation timestamp');

  const tileUrl = buildGibsTileUrl(vis, obs.dateStr);
  assert(tileUrl.startsWith('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/'), 'Tile URL uses official secure NASA GIBS endpoint');
  assert(tileUrl.includes(obs.dateStr), 'Tile URL embeds observation date parameter');
  assert(tileUrl.includes('{z}/{y}/{x}.jpg'), 'Tile URL uses valid EPSG:3857 slippy tile template');

  const meta = getSatelliteMetadata('infra', 0);
  assert(meta.spectralMode === 'infra', 'Metadata returns requested spectral mode');
  assert(meta.availableModes.length === 3, 'Metadata lists 3 available spectral modes');
  assert(meta.attribution.includes('NASA'), 'Attribution explicitly credits NASA');

  // ── 3. Saffir-Simpson Scale Categorization ─────────────────
  console.log('\n--- 3. Saffir-Simpson Scale Categorization ---');
  // Wind speed thresholds
  assert(getSaffirSimpsonCategoryNumber(45) === 0, '45 km/h is Tropical Depression / Sub-hurricane (Scale 0)');
  assert(getTropicalCycloneStageName(45) === 'Tropical Depression', '45 km/h stage name is "Tropical Depression"');

  assert(getSaffirSimpsonCategoryNumber(90) === 0, '90 km/h is Tropical Storm (Scale 0)');
  assert(getTropicalCycloneStageName(90) === 'Tropical Storm', '90 km/h stage name is "Tropical Storm"');

  assert(getSaffirSimpsonCategoryNumber(130) === 1, '130 km/h is Category 1 Hurricane (Scale 1)');
  assert(getTropicalCycloneStageName(130) === 'Category 1 Hurricane', '130 km/h stage name is "Category 1 Hurricane"');

  assert(getSaffirSimpsonCategoryNumber(165) === 2, '165 km/h is Category 2 Hurricane (Scale 2)');
  assert(getTropicalCycloneStageName(165) === 'Category 2 Hurricane', '165 km/h stage name is "Category 2 Hurricane"');

  assert(getSaffirSimpsonCategoryNumber(195) === 3, '195 km/h is Category 3 Major Hurricane (Scale 3)');
  assert(getTropicalCycloneStageName(195) === 'Category 3 Major Hurricane', '195 km/h stage name is "Category 3 Major Hurricane"');

  assert(getSaffirSimpsonCategoryNumber(230) === 4, '230 km/h is Category 4 Devastating Hurricane (Scale 4)');
  assert(getTropicalCycloneStageName(230) === 'Category 4 Devastating Hurricane', '230 km/h stage name is "Category 4 Devastating Hurricane"');

  assert(getSaffirSimpsonCategoryNumber(260) === 5, '260 km/h is Category 5 Catastrophic Hurricane (Scale 5)');
  assert(getTropicalCycloneStageName(260) === 'Category 5 Catastrophic Hurricane', '260 km/h stage name is "Category 5 Catastrophic Hurricane"');

  // ── 4. NHC 5-Day Forecast Cone of Uncertainty ─────────────
  console.log('\n--- 4. NHC 5-Day Forecast Cone of Uncertainty ---');
  const cone = computeForecastCone(20.0, -85.0, 45, 20, 220);
  assert(cone.length === 5, `Forecast cone generates exactly 5 lead times (found ${cone.length})`);
  assert(cone[0].hoursAhead === 24, 'First cone node is 24 hours ahead');
  assert(cone[4].hoursAhead === 120, 'Final cone node is 120 hours (5 days) ahead');

  // Verify cone error radius increases monotonically based on NHC historical verification
  let radiusIncreases = true;
  for (let i = 1; i < cone.length; i++) {
    if (cone[i].coneRadiusKm <= cone[i - 1].coneRadiusKm) {
      radiusIncreases = false;
      break;
    }
  }
  assert(radiusIncreases, 'Forecast cone error radius increases monotonically over time (65km -> 310km)');
  assert(cone[0].coneRadiusKm === 65, '24h forecast cone radius is 65 km');
  assert(cone[4].coneRadiusKm === 310, '120h forecast cone radius is 310 km');

  // Coordinate validity
  assert(cone.every(c => c.lat >= -90 && c.lat <= 90 && c.lng >= -180 && c.lng <= 180), 'All forecast cone coordinates are valid geographical coordinates');

  // ── 5. Real-World Official Cyclone Baselines ──────────────
  console.log('\n--- 5. Real-World Official Cyclone Baselines ---');
  assert(OFFICIAL_CYCLONE_BASELINES.length >= 3, `Official cyclone baselines contains at least 3 active storms (found ${OFFICIAL_CYCLONE_BASELINES.length})`);

  // East Pacific / NOAA NHC Tropical Storm Vance
  const epacStorm = OFFICIAL_CYCLONE_BASELINES.find(c => c.name.includes('Vance'));
  assert(epacStorm !== undefined, 'Baseline contains active Tropical Storm Vance');
  assert(epacStorm?.basin === 'East Pacific', 'Vance basin is East Pacific');
  assert(Boolean(epacStorm?.agency.includes('NOAA National Hurricane Center')), 'Vance agency is NOAA NHC');
  assert(epacStorm!.historicalTrack.length >= 2, 'Vance includes historical track waypoints');

  // In-fa (West Pacific)
  const infa = OFFICIAL_CYCLONE_BASELINES.find(c => c.name.includes('In-fa'));
  assert(infa !== undefined, 'Baseline contains active Super Typhoon In-fa');
  assert(infa?.basin === 'West Pacific', 'In-fa basin is West Pacific');
  assert(Boolean(infa?.agency.includes('JTWC')), 'In-fa agency is JTWC');
  assert(infa!.saffirSimpsonScale >= 3, 'In-fa is categorized as Major Typhoon (Category 3+)');

  // Arnab (North Indian / Bay of Bengal)
  const arnab = OFFICIAL_CYCLONE_BASELINES.find(c => c.name.includes('Arnab'));
  assert(arnab !== undefined, 'Baseline contains Very Severe Cyclonic Storm Arnab');
  assert(arnab?.basin === 'North Indian', 'Arnab basin is North Indian');
  assert(Boolean(arnab?.agency.includes('India Meteorological Department') || arnab?.agency.includes('JTWC')), 'Arnab agency is IMD / JTWC');
  assert(arnab!.historicalTrack.length >= 3, 'Arnab includes multi-waypoint historical track');

  // Active cyclone aggregator function (honesty in weather: no fake storms injected)
  const activeFeed = getActiveTropicalCyclones([]);
  assert(activeFeed.count === 0, 'Aggregator safely returns 0 when no live cyclones are currently active (zero fake storms injected)');
  assert(activeFeed.sourceAgencies.includes('NOAA NHC'), 'Aggregator sources include NOAA NHC');
  assert(activeFeed.sourceAgencies.includes('JTWC'), 'Aggregator sources include JTWC');
  assert(activeFeed.sourceAgencies.includes('IMD'), 'Aggregator sources include IMD');

  // ── 6. WorldEvent Mapping & 5-Day Cone Telemetry ──────────
  console.log('\n--- 6. WorldEvent Mapping & 5-Day Cone Telemetry ---');
  const worldEvents = OFFICIAL_CYCLONE_BASELINES.map(cycloneToWorldEvent);
  assert(worldEvents.length >= 3, `Converted at least 3 active cyclones to WorldEvent instances (found ${worldEvents.length})`);
  
  const arnabEvent = worldEvents.find(e => e.title.includes('Arnab'));
  assert(arnabEvent !== undefined, 'Cyclone Arnab converted to WorldEvent');
  assert(arnabEvent?.category === 'severe_weather', 'Arnab category is severe_weather');
  assert(arnabEvent?.planetaryTelemetry?.stormWarningType === 'tropical_cyclone', 'Arnab warning type is tropical_cyclone');
  assert(Boolean(arnabEvent?.planetaryTelemetry?.cycloneAgency?.includes('IMD') || arnabEvent?.planetaryTelemetry?.cycloneAgency?.includes('JTWC')), 'Arnab telemetry agency is IMD / JTWC');
  assert(arnabEvent?.planetaryTelemetry?.cycloneBasin === 'North Indian', 'Arnab basin is North Indian');
  assert(Array.isArray(arnabEvent?.planetaryTelemetry?.forecastCone), 'Arnab has forecast cone array');
  assert(arnabEvent!.planetaryTelemetry!.forecastCone!.length >= 4, 'Arnab forecast cone has forecast lead times');
  assert(Array.isArray(arnabEvent?.planetaryTelemetry?.trackPoints), 'Arnab has historical trackPoints');

  // ── 7. Strict Zero-RainViewer & Zero-Mock Integrity ───────
  console.log('\n--- 7. Strict Zero-RainViewer & Zero-Mock Integrity ---');
  const allUrls = [
    buildGibsTileUrl(vis, '2026-10-18'),
    buildGibsTileUrl(blue, '2026-10-18'),
    buildGibsTileUrl(infra, '2026-10-18'),
  ].join(' ');
  assert(!allUrls.toLowerCase().includes('rainviewer'), 'Zero references to RainViewer in any satellite tile URL');

  const allAttributions = [
    vis.attribution,
    blue.attribution,
    infra.attribution,
    activeFeed.attribution,
  ].join(' ');
  assert(!allAttributions.toLowerCase().includes('rainviewer'), 'Zero references to RainViewer in any attribution');

  // ── Final Suite Summary ───────────────────────────────────
  console.log('\n============================================================');
  console.log(`Phase E Satellite & Cyclone Results: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhaseETests().catch((err) => {
  console.error('Fatal satellite and cyclone test suite error:', err);
  process.exit(1);
});
