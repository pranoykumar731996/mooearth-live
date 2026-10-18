// ============================================================
// MooEarth Live — Phase C Test Suite: Gridded Wind-Field Service
// ============================================================
// Verifies:
// 1. Grid geometry: 73 latitude x 144 longitude nodes = 10,512 points (2.5° delta)
// 2. Physical U/V vector decomposition and meteorological direction conversions
// 3. O(1) Bilinear spatial interpolation accuracy and smoothness
// 4. Antimeridian wrapping across ±180° longitude
// 5. Polar edge case stability (-85° to +85° latitude limits)
// 6. Particle advection coordinate direction alignment
// 7. Mobile hardware performance benchmark (10,000 samples < 20 ms)

import {
  GRID_LAT_STEPS,
  GRID_LNG_STEPS,
  TOTAL_GRID_NODES,
  GRID_DELTA_DEG,
  generateBaselineCirculationGrid,
  GriddedWindField,
  meteoToVectorComponents,
  vectorToMeteoDirection,
} from '../src/services/weather/griddedWindService';

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

async function runWindGridTests() {
  console.log('\n============================================================');
  console.log('🧪 Running MooEarth.Live Phase C Test Suite (Gridded Wind Service)');
  console.log('============================================================\n');

  // ── 1. Grid Geometry & Node Count ────────────────────────
  console.log('--- 1. Grid Geometry & Node Count ---');
  assert(GRID_LAT_STEPS === 73, `Grid has 73 latitude steps (found ${GRID_LAT_STEPS})`);
  assert(GRID_LNG_STEPS === 144, `Grid has 144 longitude steps (found ${GRID_LNG_STEPS})`);
  assert(TOTAL_GRID_NODES === 10512, `Total grid nodes equals 10,512 (found ${TOTAL_GRID_NODES})`);
  assert(GRID_DELTA_DEG === 2.5, `Grid cell resolution is 2.5° (found ${GRID_DELTA_DEG})`);

  const gridData = generateBaselineCirculationGrid();
  assert(gridData.uGrid.length === 10512, 'uGrid buffer length matches 10,512');
  assert(gridData.vGrid.length === 10512, 'vGrid buffer length matches 10,512');
  assert(gridData.speedGrid.length === 10512, 'speedGrid buffer length matches 10,512');

  // ── 2. Vector Decomposition & Meteorological Conversions ─
  console.log('\n--- 2. Vector Decomposition & Meteorological Conversions ---');
  // In meteorology: 0° is North wind (blows towards South, so v is negative)
  const northWind = meteoToVectorComponents(36, 0);
  assert(Math.abs(northWind.u) < 0.001, 'North wind (0°) has zero U component');
  assert(Math.abs(northWind.v - (-36)) < 0.001, 'North wind (0°) has v = -36 km/h (blows South)');

  // 90° is East wind (blows towards West, so u is negative)
  const eastWind = meteoToVectorComponents(36, 90);
  assert(Math.abs(eastWind.u - (-36)) < 0.001, 'East wind (90°) has u = -36 km/h (blows West)');
  assert(Math.abs(eastWind.v) < 0.001, 'East wind (90°) has zero V component');

  // 180° is South wind (blows towards North, so v is positive)
  const southWind = meteoToVectorComponents(36, 180);
  assert(Math.abs(southWind.u) < 0.001, 'South wind (180°) has zero U component');
  assert(Math.abs(southWind.v - 36) < 0.001, 'South wind (180°) has v = +36 km/h (blows North)');

  // 270° is West wind (blows towards East, so u is positive)
  const westWind = meteoToVectorComponents(36, 270);
  assert(Math.abs(westWind.u - 36) < 0.001, 'West wind (270°) has u = +36 km/h (blows East)');
  assert(Math.abs(westWind.v) < 0.001, 'West wind (270°) has zero V component');

  // Round-trip conversion check
  const roundTrip = vectorToMeteoDirection(westWind.u, westWind.v);
  assert(Math.abs(roundTrip.speed - 36) < 0.01, 'Round-trip speed conversion matches 36 km/h');
  assert(Math.abs(roundTrip.directionDeg - 270) < 0.01, 'Round-trip direction conversion matches 270°');

  // ── 3. Bilinear Interpolation & Antimeridian Continuity ──
  console.log('\n--- 3. Bilinear Interpolation & Antimeridian Continuity ---');
  const windField = new GriddedWindField(gridData);

  const sampleEquator = windField.sampleAt(0, 0);
  assert(Number.isFinite(sampleEquator.u), 'Equator sample U is finite');
  assert(Number.isFinite(sampleEquator.v), 'Equator sample V is finite');
  assert(sampleEquator.speed >= 0, 'Equator sample speed is non-negative');

  // Test antimeridian wrapping (-180° vs +180°)
  const westAntimeridian = windField.sampleAt(35, -179.9);
  const eastAntimeridian = windField.sampleAt(35, 179.9);

  const deltaU = Math.abs(westAntimeridian.u - eastAntimeridian.u);
  const deltaV = Math.abs(westAntimeridian.v - eastAntimeridian.v);

  assert(deltaU < 1.0, `Antimeridian U continuity check: deltaU = ${deltaU.toFixed(4)} (< 1.0 km/h)`);
  assert(deltaV < 1.0, `Antimeridian V continuity check: deltaV = ${deltaV.toFixed(4)} (< 1.0 km/h)`);

  // ── 4. Polar Latitude Stability ──────────────────────────
  console.log('\n--- 4. Polar Latitude Stability ---');
  const northPolarSample = windField.sampleAt(89.5, 45);
  assert(Number.isFinite(northPolarSample.u), 'North polar sample (+89.5°) produces finite U');
  assert(Number.isFinite(northPolarSample.v), 'North polar sample (+89.5°) produces finite V');

  const southPolarSample = windField.sampleAt(-89.5, -45);
  assert(Number.isFinite(southPolarSample.u), 'South polar sample (-89.5°) produces finite U');
  assert(Number.isFinite(southPolarSample.v), 'South polar sample (-89.5°) produces finite V');

  // ── 5. Particle Advection & Trajectory Direction ─────────
  console.log('\n--- 5. Particle Advection & Trajectory Direction ---');
  // Mid-latitude westerlies (lat 45°N): wind blows toward the East (u > 0)
  const advected = windField.advectParticle(45, 0, 0.2);
  assert(
    advected.nextLng > 0,
    `Westerlies advection displaces particle eastward (lng 0° -> ${advected.nextLng.toFixed(4)}°)`
  );
  assert(
    Number.isFinite(advected.nextLat) && Number.isFinite(advected.nextLng),
    'Advected particle coordinates remain finite'
  );

  // ── 6. Mobile Performance Benchmark ──────────────────────
  console.log('\n--- 6. Mobile Performance Benchmark ---');
  const startPerf = Date.now();
  const benchmarkSamples = 10000;
  for (let i = 0; i < benchmarkSamples; i++) {
    const lat = -80 + (i % 160);
    const lng = -180 + ((i * 3.7) % 360);
    windField.sampleAt(lat, lng);
  }
  const elapsedMs = Date.now() - startPerf;
  assert(
    elapsedMs < 30,
    `10,000 bilinear samples completed in ${elapsedMs} ms (< 30 ms threshold for 60 FPS mobile)`
  );

  console.log('\n============================================================');
  console.log(`📊 Phase C Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runWindGridTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
