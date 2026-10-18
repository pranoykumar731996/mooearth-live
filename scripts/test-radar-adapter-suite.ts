// ============================================================
// MooEarth Live — Phase D Test Suite: Regional Radar Adapter & Honest Unavailable State
// ============================================================
// Verifies:
// 1. Radar provider registration and retrieval from RadarManager
// 2. NOAA MRMS provider metadata, agency, and public domain license (17 U.S.C. § 105)
// 3. Geolocation coverage testing (CONUS, Alaska, Hawaii, Puerto Rico vs Uninstrumented continents/oceans)
// 4. Antimeridian wrapping and coordinate boundary stability
// 5. Bounding box intersection logic
// 6. 120-minute chronological frame generation (12 frames in 10-minute intervals)
// 7. Slippy tile URL templates and parameter substitution
// 8. High-level getActiveRadarMetadata() helper
// 9. Strict "Truth in Weather" & Zero-RainViewer validation

import {
  radarManager,
  NoaaMrmsRadarProvider,
  getActiveRadarMetadata,
  isLocationCoveredByRadar,
  IRadarProvider,
} from '../src/services/weather/radarAdapter';

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

async function runRadarAdapterTests() {
  console.log('\n============================================================');
  console.log('🧪 Running MooEarth.Live Phase D Test Suite (Regional Radar Adapter)');
  console.log('============================================================\n');

  // ── 1. Provider Registration & Metadata ───────────────────
  console.log('--- 1. Provider Registration & Metadata ---');
  const activeProvider = radarManager.getActiveProvider();
  assert(activeProvider !== undefined, 'Active radar provider is registered and resolved');
  assert(activeProvider.id === 'noaa-mrms', `Active provider ID is "noaa-mrms" (found: ${activeProvider?.id})`);
  assert(activeProvider.name.includes('NOAA') && activeProvider.name.includes('NEXRAD'), 'Provider name identifies NOAA NEXRAD');
  assert(activeProvider.agency.includes('National Oceanic and Atmospheric Administration'), 'Agency correctly states NOAA / NWS');
  assert(activeProvider.license.includes('17 U.S.C. § 105') || activeProvider.license.includes('Public Domain'), 'License strictly declares US Public Domain (17 U.S.C. § 105)');
  assert(activeProvider.licenseUrl.includes('weather.gov'), 'License URL points to official weather.gov disclaimer');
  assert(activeProvider.coverageAreas.length >= 4, `Coverage areas defined for CONUS, Alaska, Hawaii, Puerto Rico (found ${activeProvider.coverageAreas.length})`);

  // Verify custom provider registration
  class DummyTestRadarProvider implements IRadarProvider {
    id = 'custom-test';
    name = 'Custom Test Doppler';
    agency = 'National Met Service';
    license = 'Open Data';
    licenseUrl = 'https://example.com/license';
    coverageAreas = [{ name: 'Test Box', bounds: [0, 0, 10, 10] as [number, number, number, number] }];
    attribution = 'Custom Test';
    async getFrames() { return []; }
    getTileUrl(z: number, x: number, y: number) { return `https://example.com/${z}/${x}/${y}.png`; }
    isPointCovered(lat: number, lng: number) { return lat >= 0 && lat <= 10 && lng >= 0 && lng <= 10; }
    isBoundsIntersecting() { return false; }
  }
  radarManager.registerProvider(new DummyTestRadarProvider());
  assert(radarManager.getProvider('custom-test') !== undefined, 'RadarManager supports registering additional authorized national providers');
  // Revert active back to noaa-mrms
  radarManager.setActiveProvider('noaa-mrms');
  assert(radarManager.getActiveProvider().id === 'noaa-mrms', 'RadarManager maintains NOAA MRMS as canonical active provider');

  // ── 2. Geolocation Coverage Logic (Truth in Weather) ──────
  console.log('\n--- 2. Geolocation Coverage Logic (Truth in Weather) ---');
  // Ground Doppler radar only exists within terrestrial radar towers.
  // CONUS Locations (Must be TRUE)
  assert(isLocationCoveredByRadar(40.7128, -74.0060), 'New York City (CONUS) has Doppler radar coverage');
  assert(isLocationCoveredByRadar(34.0522, -118.2437), 'Los Angeles (CONUS) has Doppler radar coverage');
  assert(isLocationCoveredByRadar(41.8781, -87.6298), 'Chicago (CONUS) has Doppler radar coverage');
  assert(isLocationCoveredByRadar(25.7617, -80.1918), 'Miami (CONUS) has Doppler radar coverage');
  assert(isLocationCoveredByRadar(47.6062, -122.3321), 'Seattle (CONUS) has Doppler radar coverage');
  assert(isLocationCoveredByRadar(32.7767, -96.7970), 'Dallas (CONUS) has Doppler radar coverage');

  // Alaska, Hawaii, Puerto Rico (Must be TRUE)
  assert(isLocationCoveredByRadar(61.2181, -149.9003), 'Anchorage, Alaska has Doppler radar coverage');
  assert(isLocationCoveredByRadar(21.3069, -157.8583), 'Honolulu, Hawaii has Doppler radar coverage');
  assert(isLocationCoveredByRadar(18.4655, -66.1057), 'San Juan, Puerto Rico has Doppler radar coverage');

  // Uninstrumented regions outside North American ground radar (Must be FALSE - Honest Unavailable)
  assert(!isLocationCoveredByRadar(51.5074, -0.1278), 'London, UK honestly returns unavailable (no NOAA terrestrial radar)');
  assert(!isLocationCoveredByRadar(48.8566, 2.3522), 'Paris, France honestly returns unavailable');
  assert(!isLocationCoveredByRadar(35.6762, 139.6503), 'Tokyo, Japan honestly returns unavailable');
  assert(!isLocationCoveredByRadar(-33.8688, 151.2093), 'Sydney, Australia honestly returns unavailable');
  assert(!isLocationCoveredByRadar(19.0760, 72.8777), 'Mumbai, India honestly returns unavailable');
  assert(!isLocationCoveredByRadar(30.0, -40.0), 'Mid-Atlantic Ocean honestly returns unavailable (zero ocean Doppler towers)');
  assert(!isLocationCoveredByRadar(-85.0, 0.0), 'Antarctica honestly returns unavailable');

  // Antimeridian coordinate normalization test
  // Lng 190° should normalize to -170° (Alaska corridor range: [-170, 52, -130, 72])
  assert(isLocationCoveredByRadar(60.0, 190.0), 'Antimeridian longitude (190° normalized to -170°) is correctly tested');

  // ── 3. Bounding Box Intersection ──────────────────────────
  console.log('\n--- 3. Bounding Box Intersection ---');
  const provider = new NoaaMrmsRadarProvider();
  assert(provider.isBoundsIntersecting(-100, 30, -90, 40), 'CONUS bounding box intersects radar coverage');
  assert(provider.isBoundsIntersecting(-170, 55, -140, 65), 'Alaska bounding box intersects radar coverage');
  assert(!provider.isBoundsIntersecting(0, 45, 15, 55), 'Central Europe bounding box does not intersect NOAA radar');
  assert(!provider.isBoundsIntersecting(-140, -40, -110, -20), 'South Pacific bounding box does not intersect NOAA radar');

  // ── 4. Chronological Frame Generation ─────────────────────
  console.log('\n--- 4. Chronological Frame Generation ---');
  const frames = await provider.getFrames();
  assert(frames.length === 12, `Generates exactly 12 chronological frames for 120m history (found ${frames.length})`);

  // Verify monotonic chronological ordering
  let isChronological = true;
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].timestamp <= frames[i - 1].timestamp) {
      isChronological = false;
      break;
    }
  }
  assert(isChronological, 'Radar frames are strictly monotonically chronological (oldest to newest)');

  // Verify labels
  const oldestFrame = frames[0];
  const liveFrame = frames[frames.length - 1];
  assert(liveFrame.label === 'LIVE', `Latest frame is labeled "LIVE" (found "${liveFrame.label}")`);
  assert(oldestFrame.label === '-110m', `Oldest frame is labeled "-110m" (found "${oldestFrame.label}")`);

  // Verify timestamp formatting
  assert(liveFrame.formattedUtc.endsWith(' UTC'), `Formatted UTC ends with " UTC" (found "${liveFrame.formattedUtc}")`);
  assert(typeof liveFrame.timestamp === 'number' && liveFrame.timestamp > 1700000000, 'Unix timestamp in seconds is valid');
  assert(!isNaN(Date.parse(liveFrame.isoTime)), 'isoTime is a valid ISO 8601 string');

  // ── 5. Slippy Tile URL Construction ───────────────────────
  console.log('\n--- 5. Slippy Tile URL Construction ---');
  assert(liveFrame.tileUrl.includes('{z}/{x}/{y}'), 'Live frame tileUrl is a valid slippy tile template');
  assert(liveFrame.tileUrl.includes('nexrad-n0q-900913'), 'Live frame uses canonical N0Q real-time composite endpoint');
  assert(oldestFrame.tileUrl.includes('USCOMP-N0Q-'), 'Historical frame uses time-stamped USCOMP-N0Q archive endpoint');

  const renderedTileUrl = provider.getTileUrl(6, 15, 24, liveFrame);
  assert(renderedTileUrl.includes('/6/15/24.png'), `getTileUrl correctly interpolates coordinates (found: ${renderedTileUrl})`);

  // ── 6. getActiveRadarMetadata Helper ──────────────────────
  console.log('\n--- 6. getActiveRadarMetadata Helper ---');
  const meta = await getActiveRadarMetadata();
  assert(meta.providerId === 'noaa-mrms', 'Metadata returns providerId "noaa-mrms"');
  assert(meta.frames.length === 12, 'Metadata contains 12 active frames');
  assert(meta.activeFrameIndex === 11, 'Default active frame index points to latest live frame (11)');
  assert(meta.attribution.includes('NEXRAD'), 'Metadata attribution gives credit to NOAA NEXRAD');

  // ── 7. Strict Zero-RainViewer Integrity Verification ──────
  console.log('\n--- 7. Strict Zero-RainViewer Integrity Verification ---');
  const allTileUrls = frames.map(f => f.tileUrl).join(' ');
  assert(!allTileUrls.toLowerCase().includes('rainviewer'), 'Zero references to RainViewer in any radar frame tile URL');
  assert(!meta.agency.toLowerCase().includes('rainviewer'), 'Agency contains zero RainViewer branding');
  assert(!meta.attribution.toLowerCase().includes('rainviewer'), 'Attribution contains zero RainViewer references');

  // ── Final Suite Summary ───────────────────────────────────
  console.log('\n============================================================');
  console.log(`Phase D Radar Adapter Results: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRadarAdapterTests().catch((err) => {
  console.error('Fatal radar adapter test suite error:', err);
  process.exit(1);
});
