// ============================================================
// MooEarth Live — Phase B Test Suite: Layer Registry & Decontamination
// ============================================================
// Verifies:
// 1. Zero RainViewer endpoints, references, or assumptions across src/
// 2. Weather Layer Registry integrity and completeness (all 12 layers)
// 3. Temporal classifications (historical observations vs forecast models)
// 4. Geographic coverage boundaries & regional radar validation
// 5. Unit system and legend color stops validity

import * as fs from 'fs';
import * as path from 'path';
import {
  WEATHER_LAYER_REGISTRY,
  getWeatherLayerDefinition,
  getAllWeatherLayers,
  isCoordinateWithinLayerCoverage,
} from '../src/services/weather/layerRegistry';
import type { WeatherLayerMode } from '../src/services/weather/types';

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

function scanForForbiddenWord(dir: string, forbidden: string): string[] {
  const matches: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
        matches.push(...scanForForbiddenWord(fullPath, forbidden));
      }
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.toLowerCase().includes(forbidden.toLowerCase())) {
        matches.push(fullPath);
      }
    }
  }

  return matches;
}

async function runPhaseBTests() {
  console.log('\n============================================================');
  console.log('🧪 Running MooEarth.Live Phase B Test Suite (Registry & Decontamination)');
  console.log('============================================================\n');

  // ── 1. RainViewer Complete Decontamination ───────────────
  console.log('--- 1. RainViewer Complete Decontamination ---');
  const srcDir = path.resolve(__dirname, '../src');
  const rainViewerMatches = scanForForbiddenWord(srcDir, 'rainviewer');
  assert(
    rainViewerMatches.length === 0,
    'Zero references to RainViewer found in src/',
    rainViewerMatches.join(', ')
  );

  // ── 2. Layer Registry Completeness ───────────────────────
  console.log('\n--- 2. Layer Registry Completeness ---');
  const allLayers = getAllWeatherLayers();
  assert(allLayers.length >= 12, `Registry contains ${allLayers.length} layers (expected >= 12)`);

  const requiredModes: WeatherLayerMode[] = [
    'wind',
    'satellite',
    'radar',
    'precipitation',
    'temperature',
    'hurricane',
    'clouds',
    'marine',
    'air-quality',
    'overview',
    'flood',
    'elevation',
  ];

  for (const mode of requiredModes) {
    const def = getWeatherLayerDefinition(mode);
    assert(def.id === mode, `Layer '${mode}' properly registered with ID matching key`);
    assert(def.name.length > 0, `Layer '${mode}' has non-empty display name`);
    assert(def.provider.length > 0, `Layer '${mode}' specifies data provider (${def.provider})`);
    assert(def.license.length > 0, `Layer '${mode}' specifies data license (${def.license})`);
    assert(
      def.legend.stops.length > 0,
      `Layer '${mode}' contains at least 1 legend stop (${def.legend.stops.length} stops)`
    );
  }

  // ── 3. Temporal Mode Classification (Truth in Weather) ───
  console.log('\n--- 3. Temporal Mode Classification ---');
  const satelliteDef = getWeatherLayerDefinition('satellite');
  const radarDef = getWeatherLayerDefinition('radar');
  const windDef = getWeatherLayerDefinition('wind');
  const precipDef = getWeatherLayerDefinition('precipitation');

  assert(
    satelliteDef.temporalMode === 'historical_observation',
    'Satellite is classified as historical_observation'
  );
  assert(
    radarDef.temporalMode === 'historical_observation',
    'Radar is classified as historical_observation'
  );
  assert(
    windDef.temporalMode === 'forecast_model',
    'Wind is classified as forecast_model'
  );
  assert(
    precipDef.temporalMode === 'forecast_model',
    'Precipitation is classified as forecast_model (Never fake observed radar)'
  );

  // ── 4. Geographic Coverage & Regional Radar Limits ───────
  console.log('\n--- 4. Geographic Coverage & Regional Radar Limits ---');
  assert(
    radarDef.coverage === 'regional_conus',
    'Radar is explicitly classified as regional_conus'
  );

  // Test coverage checker for radar
  const newYork = { lat: 40.7128, lng: -74.006 }; // Inside CONUS
  const midAtlanticOcean = { lat: 30.0, lng: -40.0 }; // Open Atlantic ocean
  const centralPacific = { lat: 10.0, lng: -160.0 }; // Open Pacific ocean

  assert(
    isCoordinateWithinLayerCoverage('radar', newYork.lat, newYork.lng) === true,
    'New York (CONUS) is within radar coverage'
  );
  assert(
    isCoordinateWithinLayerCoverage('radar', midAtlanticOcean.lat, midAtlanticOcean.lng) === false,
    'Mid-Atlantic Ocean is correctly identified as outside radar coverage'
  );
  assert(
    isCoordinateWithinLayerCoverage('radar', centralPacific.lat, centralPacific.lng) === false,
    'Central Pacific Ocean is correctly identified as outside radar coverage'
  );

  // Global layers should return true everywhere
  assert(
    isCoordinateWithinLayerCoverage('wind', midAtlanticOcean.lat, midAtlanticOcean.lng) === true,
    'Global wind layer is active over open ocean'
  );
  assert(
    isCoordinateWithinLayerCoverage('satellite', centralPacific.lat, centralPacific.lng) === true,
    'Global satellite layer is active over open ocean'
  );

  // ── 5. Units & Time Horizons ─────────────────────────────
  console.log('\n--- 5. Units & Time Horizons ---');
  assert(
    windDef.units.available.includes('kmh') && windDef.units.available.includes('kn'),
    'Wind layer supports both km/h and knots'
  );
  assert(
    radarDef.units.default === 'dBZ',
    'Radar units default to dBZ'
  );
  assert(
    satelliteDef.timeHorizon.pastHours === 2 && satelliteDef.timeHorizon.stepMinutes === 10,
    'Satellite scrubber spans past 2 hours in 10-minute steps'
  );
  assert(
    windDef.timeHorizon.futureHours >= 120,
    'Wind forecast scrubber spans at least 120 hours (5+ days)'
  );

  console.log('\n============================================================');
  console.log(`📊 Phase B Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhaseBTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
