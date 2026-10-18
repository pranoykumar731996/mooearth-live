// ============================================================
// MooEarth Live — Phase F Test Suite: Extended Layers, Isobars & Touch
// ============================================================
// Verifies:
// 1. Synoptic isobar contour calculations (4 hPa steps) & H/L classifications
// 2. Global planetary pressure centers (Aleutian, Icelandic, Azores, Siberian, etc.)
// 3. Marine wave conditions & Douglas Sea State scale classification
// 4. Wave compass bearing direction conversion (16-point)
// 5. Air Quality EEA & EPA AQI categorization thresholds
// 6. Truth-in-Weather scrubber status indicators (NWP forecast, GFS MSLP, Douglas scale)
// 7. Mobile sheet touch event containment (overscroll-contain, touch-none)
// 8. Strict Zero-RainViewer & Zero-Mock integrity across extended layers

import fs from 'fs';
import path from 'path';
import {
  STANDARD_ISOBAR_STEP_HPA,
  STANDARD_SEA_LEVEL_PRESSURE_HPA,
  getIsobarLevels,
  classifyPressureSystem,
  GLOBAL_PRESSURE_CENTERS,
} from '../src/components/Globe/WeatherLayers/AtmosphericPressureLayer';
import {
  describeWaveConditions,
  waveDirectionToCompass,
} from '../src/services/weather/marineService';
import {
  categorizeEuropeanAqi,
  categorizeUsAqi,
  getAqiColor,
} from '../src/services/weather/airQualityService';

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

async function runPhaseFTests() {
  console.log('\n============================================================');
  console.log('🧪 Running MooEarth.Live Phase F Test Suite (Extended Layers & Synoptic Isobars)');
  console.log('============================================================\n');

  // ── 1. Synoptic Isobar Math & Standards ───────────────────
  console.log('--- 1. Synoptic Isobars (4 hPa Steps) & Pressure Classification ---');
  assert(STANDARD_ISOBAR_STEP_HPA === 4, 'Canonical synoptic isobar interval is exactly 4 hPa');
  assert(STANDARD_SEA_LEVEL_PRESSURE_HPA === 1013.25, 'Standard sea level pressure baseline is 1013.25 hPa');

  // Low pressure system isobars (ascending outward)
  const lowLevels = getIsobarLevels(992, 'L', 4);
  assert(lowLevels.length === 4, 'Low pressure generates requested number of isobar contours');
  assert(lowLevels[0] === 996, 'First isobar for 992 hPa Low is 996 hPa (+4 hPa)');
  assert(lowLevels[1] === 1000, 'Second isobar is 1000 hPa (+8 hPa)');
  assert(lowLevels[2] === 1004, 'Third isobar is 1004 hPa (+12 hPa)');
  assert(lowLevels[3] === 1008, 'Fourth isobar is 1008 hPa (+16 hPa)');

  // High pressure system isobars (descending outward)
  const highLevels = getIsobarLevels(1028, 'H', 4);
  assert(highLevels.length === 4, 'High pressure generates requested number of isobar contours');
  assert(highLevels[0] === 1024, 'First isobar for 1028 hPa High is 1024 hPa (-4 hPa)');
  assert(highLevels[1] === 1020, 'Second isobar is 1020 hPa (-8 hPa)');
  assert(highLevels[2] === 1016, 'Third isobar is 1016 hPa (-12 hPa)');
  assert(highLevels[3] === 1012, 'Fourth isobar is 1012 hPa (-16 hPa)');

  // Classification logic
  const lowClass = classifyPressureSystem(998);
  assert(lowClass.type === 'L', '998 hPa is categorized as Low (type L)');
  assert(lowClass.label.includes('Low Pressure'), '998 hPa label indicates Low Pressure System');

  const standardLowClass = classifyPressureSystem(1013.0);
  assert(standardLowClass.type === 'L', '1013.0 hPa is categorized as Low (< 1013.25 hPa)');

  const highClass = classifyPressureSystem(1013.25);
  assert(highClass.type === 'H', '1013.25 hPa is categorized as High (type H)');
  assert(highClass.label.includes('High Pressure'), '1013.25 hPa label indicates High Pressure System');

  const intenseHighClass = classifyPressureSystem(1034);
  assert(intenseHighClass.type === 'H', '1034 hPa is categorized as High (type H)');

  // ── 2. Planetary Pressure Centers ──────────────────────────
  console.log('\n--- 2. Planetary Synoptic Pressure Centers ---');
  assert(GLOBAL_PRESSURE_CENTERS.length >= 8, `Defined ${GLOBAL_PRESSURE_CENTERS.length} planetary pressure centers (expected >= 8)`);

  const hasAleutian = GLOBAL_PRESSURE_CENTERS.some(c => c.name.includes('Aleutian') && c.type === 'L');
  assert(hasAleutian, 'Includes Aleutian Subpolar Low (L)');

  const hasIcelandic = GLOBAL_PRESSURE_CENTERS.some(c => c.name.includes('Icelandic') && c.type === 'L');
  assert(hasIcelandic, 'Includes Icelandic Subpolar Low (L)');

  const hasAzores = GLOBAL_PRESSURE_CENTERS.some(c => c.name.includes('Azores') && c.type === 'H');
  assert(hasAzores, 'Includes Azores / Bermuda Subtropical High (H)');

  const hasSiberian = GLOBAL_PRESSURE_CENTERS.some(c => c.name.includes('Siberian') && c.type === 'H');
  assert(hasSiberian, 'Includes Siberian Continental High (H)');

  for (const center of GLOBAL_PRESSURE_CENTERS) {
    const latValid = center.lat >= -90 && center.lat <= 90;
    const lngValid = center.lng >= -180 && center.lng <= 180;
    const hpaValid = center.centralHpa >= 900 && center.centralHpa <= 1080;
    assert(latValid && lngValid && hpaValid, `Center ${center.name} has valid coordinates & pressure (${center.centralHpa} hPa)`);
    if (center.type === 'L') {
      assert(center.centralHpa < STANDARD_SEA_LEVEL_PRESSURE_HPA, `Low center ${center.name} centralHpa < 1013.25`);
    } else {
      assert(center.centralHpa >= STANDARD_SEA_LEVEL_PRESSURE_HPA, `High center ${center.name} centralHpa >= 1013.25`);
    }
  }

  // ── 3. Marine Wave Classification & Compass Bearings ──────
  console.log('\n--- 3. Marine Weather: Douglas Sea State & Compass Bearings ---');
  assert(describeWaveConditions(null) === 'No data available', 'null height returns "No data available"');
  assert(describeWaveConditions(0.1) === 'Calm (Glassy)', '0.1m corresponds to Douglas Calm (Glassy)');
  assert(describeWaveConditions(0.4) === 'Calm (Rippled)', '0.4m corresponds to Douglas Calm (Rippled)');
  assert(describeWaveConditions(1.0) === 'Smooth', '1.0m corresponds to Douglas Smooth');
  assert(describeWaveConditions(2.0) === 'Slight', '2.0m corresponds to Douglas Slight');
  assert(describeWaveConditions(3.5) === 'Moderate', '3.5m corresponds to Douglas Moderate');
  assert(describeWaveConditions(5.0) === 'Rough', '5.0m corresponds to Douglas Rough');
  assert(describeWaveConditions(7.5) === 'Very Rough', '7.5m corresponds to Douglas Very Rough');
  assert(describeWaveConditions(11.0) === 'High', '11.0m corresponds to Douglas High');
  assert(describeWaveConditions(16.0) === 'Very High', '16.0m corresponds to Douglas Very High');

  // Compass Bearings
  assert(waveDirectionToCompass(null) === '—', 'null degrees returns "—"');
  assert(waveDirectionToCompass(0) === 'N', '0° maps to North (N)');
  assert(waveDirectionToCompass(22.5) === 'NNE', '22.5° maps to North-Northeast (NNE)');
  assert(waveDirectionToCompass(45) === 'NE', '45° maps to Northeast (NE)');
  assert(waveDirectionToCompass(90) === 'E', '90° maps to East (E)');
  assert(waveDirectionToCompass(135) === 'SE', '135° maps to Southeast (SE)');
  assert(waveDirectionToCompass(180) === 'S', '180° maps to South (S)');
  assert(waveDirectionToCompass(225) === 'SW', '225° maps to Southwest (SW)');
  assert(waveDirectionToCompass(270) === 'W', '270° maps to West (W)');
  assert(waveDirectionToCompass(315) === 'NW', '315° maps to Northwest (NW)');
  assert(waveDirectionToCompass(355) === 'N', '355° wraps to North (N)');

  // ── 4. Air Quality EEA & EPA AQI Categorization ───────────
  console.log('\n--- 4. Air Quality: EEA & EPA Categorization Standards ---');
  // European AQI (EEA)
  assert(categorizeEuropeanAqi(null) === 'Unknown', 'null European AQI returns Unknown');
  assert(categorizeEuropeanAqi(15) === 'Good', '15 European AQI is Good (<= 20)');
  assert(categorizeEuropeanAqi(30) === 'Fair', '30 European AQI is Fair (<= 40)');
  assert(categorizeEuropeanAqi(50) === 'Moderate', '50 European AQI is Moderate (<= 60)');
  assert(categorizeEuropeanAqi(70) === 'Poor', '70 European AQI is Poor (<= 80)');
  assert(categorizeEuropeanAqi(90) === 'Very Poor', '90 European AQI is Very Poor (<= 100)');
  assert(categorizeEuropeanAqi(120) === 'Extremely Poor', '120 European AQI is Extremely Poor (> 100)');

  // US AQI (EPA)
  assert(categorizeUsAqi(null) === 'Unknown', 'null US AQI returns Unknown');
  assert(categorizeUsAqi(35) === 'Good', '35 US AQI is Good (<= 50)');
  assert(categorizeUsAqi(75) === 'Fair', '75 US AQI is Fair (<= 100)');
  assert(categorizeUsAqi(125) === 'Moderate', '125 US AQI is Moderate (<= 150)');
  assert(categorizeUsAqi(175) === 'Poor', '175 US AQI is Poor (<= 200)');
  assert(categorizeUsAqi(250) === 'Very Poor', '250 US AQI is Very Poor (<= 300)');
  assert(categorizeUsAqi(350) === 'Extremely Poor', '350 US AQI is Extremely Poor (> 300)');

  // AQI Colors
  assert(getAqiColor('Good') === '#4ade80', 'Good AQI uses green (#4ade80)');
  assert(getAqiColor('Fair') === '#a3e635', 'Fair AQI uses lime (#a3e635)');
  assert(getAqiColor('Moderate') === '#facc15', 'Moderate AQI uses yellow (#facc15)');
  assert(getAqiColor('Poor') === '#fb923c', 'Poor AQI uses orange (#fb923c)');
  assert(getAqiColor('Very Poor') === '#ef4444', 'Very Poor AQI uses red (#ef4444)');
  assert(getAqiColor('Extremely Poor') === '#7f1d1d', 'Extremely Poor AQI uses dark red (#7f1d1d)');

  // ── 5. Truth-in-Weather Scrubber Badging ───────────────────
  console.log('\n--- 5. Truth-in-Weather Scrubber Status Indicators ---');
  const scrubberPath = path.resolve(__dirname, '../src/components/Weather/WindyTimeScrubber.tsx');
  const scrubberContent = fs.readFileSync(scrubberPath, 'utf8');

  assert(scrubberContent.includes('Numerical NWP model forecast'), 'Scrubber contains truthful disclaimer that precipitation is NWP model forecast');
  assert(scrubberContent.includes('MSLP') && scrubberContent.includes('4 hPa isobars'), 'Scrubber describes pressure layer as MSLP with 4 hPa isobars');
  assert(scrubberContent.includes('Douglas Sea State'), 'Scrubber identifies marine wave scale as Douglas Sea State');
  assert(scrubberContent.includes('CAMS') || scrubberContent.includes('EEA'), 'Scrubber identifies air quality standards (CAMS/EEA/EPA)');

  // ── 6. Mobile Touch Containment & Zero RainViewer ─────────
  console.log('\n--- 6. Mobile Touch Containment & Zero RainViewer ---');
  const dashboardPath = path.resolve(__dirname, '../src/components/Weather/WeatherDashboard.tsx');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

  assert(dashboardContent.includes('overscroll-contain'), 'WeatherDashboard drawer contains overscroll-contain');
  assert(dashboardContent.includes('touch-pan-y'), 'WeatherDashboard drawer contains touch-pan-y');
  assert(dashboardContent.includes('touch-none'), 'WeatherDashboard drag handle contains touch-none for gesture isolation');

  // Verify Zero RainViewer across extended layers
  const filesToCheck = [
    '../src/components/Globe/WeatherLayers/AtmosphericPressureLayer.ts',
    '../src/services/weather/marineService.ts',
    '../src/services/weather/airQualityService.ts',
    '../src/components/Weather/WindyTimeScrubber.tsx',
    '../src/components/Weather/WeatherDashboard.tsx',
  ];

  for (const relFile of filesToCheck) {
    const filePath = path.resolve(__dirname, relFile);
    const content = fs.readFileSync(filePath, 'utf8');
    const hasRainViewer = /rainviewer/i.test(content);
    assert(!hasRainViewer, `Zero RainViewer mentions in ${path.basename(filePath)}`);
  }

  // ── Final Summary ──────────────────────────────────────────
  console.log('\n============================================================');
  console.log(`📊 Phase F Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhaseFTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
