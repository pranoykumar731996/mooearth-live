// ============================================================
// MooEarth Live — Geophysical AI Briefing Test Suite (Phase 3)
// ============================================================

import {
  calculateSeismicEnergyJoules,
  formatTntEquivalent,
  resolveTectonicSetting,
  analyzeSpaceWeather,
  analyzeWildfireTelemetry,
  generateDeterministicPlanetaryBriefing,
  generatePlanetaryBriefing,
} from '../src/services/planetaryEngine/briefingGenerator';

import { fetchOrGenerateArticleDetails } from '../src/services/article';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✔ PASS: ${msg}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failCount++;
  }
}

async function runSuite() {
  console.log('\n======================================================');
  console.log('🌋 MooEarth Live Geophysical AI Briefing Suite (Phase 3)');
  console.log('======================================================\n');

  // 1. Gutenberg-Richter Seismic Energetics Formula
  console.log('--- 1. Seismic Energy & TNT Equivalence ---');
  const energyM5 = calculateSeismicEnergyJoules(5.0);
  assert(Math.abs(Math.log10(energyM5) - 12.3) < 0.01, 'M 5.0 yields 10^12.3 Joules (~2.0e12 J)');
  
  const energyM6 = calculateSeismicEnergyJoules(6.0);
  assert(Math.abs(Math.log10(energyM6) - 13.8) < 0.01, 'M 6.0 yields 10^13.8 Joules (~6.3e13 J)');

  const tntM5 = formatTntEquivalent(energyM5);
  assert(tntM5.includes('Tons TNT') || tntM5.includes('Kilotons TNT'), `TNT equivalent formatted: ${tntM5}`);

  const energyM9 = calculateSeismicEnergyJoules(9.0);
  const tntM9 = formatTntEquivalent(energyM9);
  assert(tntM9.includes('Megatons TNT'), `M 9.0 correctly scales to Megatons TNT: ${tntM9}`);

  // 2. Tectonic Plate Boundary Resolution
  console.log('\n--- 2. Tectonic Plate Boundary Identification ---');
  const tokyoTectonic = resolveTectonicSetting(35.676, 139.65, 'Japan');
  assert(tokyoTectonic.plateBoundary.includes('Pacific Plate') || tokyoTectonic.plateBoundary.includes('Japan Trench'), 'Tokyo resolved to Pacific Subduction / Japan Trench');

  const indonesiaTectonic = resolveTectonicSetting(-6.2, 106.8, 'Indonesia');
  assert(indonesiaTectonic.plateBoundary.includes('Sunda') || indonesiaTectonic.plateBoundary.includes('Indo-Australian'), 'Jakarta resolved to Indo-Australian / Sunda Megathrust');

  const caliTectonic = resolveTectonicSetting(37.77, -122.41, 'United States');
  assert(caliTectonic.plateBoundary.includes('San Andreas') || caliTectonic.plateBoundary.includes('North American'), 'California resolved to San Andreas Fault system');

  const chileTectonic = resolveTectonicSetting(-33.44, -70.66, 'Chile');
  assert(chileTectonic.plateBoundary.includes('Nazca') || chileTectonic.plateBoundary.includes('South American'), 'Santiago resolved to Nazca / South American subduction');

  const himalayaTectonic = resolveTectonicSetting(27.71, 85.32, 'Nepal');
  assert(himalayaTectonic.plateBoundary.includes('Indian') && himalayaTectonic.plateBoundary.includes('Eurasian'), 'Nepal resolved to Indian-Eurasian collision zone');

  const icelandTectonic = resolveTectonicSetting(64.14, -21.94, 'Iceland');
  assert(icelandTectonic.plateBoundary.includes('Mid-Atlantic') || icelandTectonic.plateBoundary.includes('Divergent'), 'Reykjavik resolved to Mid-Atlantic Ridge');

  // 3. Space Weather Kp Index Classification
  console.log('\n--- 3. Space Weather Kp Index Dynamics ---');
  const swQuiet = analyzeSpaceWeather(2);
  assert(swQuiet.stormLevel.includes('Quiet'), 'Kp 2 maps to Quiet geomagnetic field');

  const swG1 = analyzeSpaceWeather(5);
  assert(swG1.stormLevel.includes('G1'), 'Kp 5 maps to G1 Minor Geomagnetic Storm');

  const swG3 = analyzeSpaceWeather(7);
  assert(swG3.stormLevel.includes('G3'), 'Kp 7 maps to G3 Strong Geomagnetic Storm');

  const swG5 = analyzeSpaceWeather(9);
  assert(swG5.stormLevel.includes('G5') && swG5.stormLevel.includes('Extreme'), 'Kp 9 maps to G5 Extreme Geomagnetic Storm');
  assert(swG5.auroraVisibility.includes('40°'), 'G5 aurora visibility reaches mid-to-low latitudes (40°)');

  // 4. Wildfire Radiative Power Analysis
  console.log('\n--- 4. Wildfire Thermal FRP Dynamics ---');
  const fireExtreme = analyzeWildfireTelemetry(650);
  assert(fireExtreme.intensityTier.includes('Extreme'), '650 MW classified as Extreme Convective Firestorm');
  assert(fireExtreme.atmosphericEmissions.includes('PyroCb'), 'Extreme fire indicates Pyrocumulonimbus cloud risk');

  const fireModerate = analyzeWildfireTelemetry(120);
  assert(fireModerate.intensityTier.includes('Moderate'), '120 MW classified as Moderate Thermal Anomaly');

  // 5. Deterministic Planetary Briefing Generator
  console.log('\n--- 5. Deterministic Planetary Briefing Synthesis ---');
  const quakeBriefing = generateDeterministicPlanetaryBriefing({
    id: 'usgs-test-6000abc',
    title: 'M 6.3 Earthquake — 54 km SW of Sendai, Japan',
    summary: 'A strong earthquake occurred at a depth of 42.0 km.',
    country: 'Japan',
    category: 'seismic',
    publishedAt: new Date().toISOString(),
    lat: 37.8,
    lng: 140.5,
    telemetry: {
      magnitude: 6.3,
      depthKm: 42.0,
      tsunamiWarning: false,
      sensorSource: 'USGS NEIC Real-Time Broadband Seismic Network',
      externalDataUrl: 'https://earthquake.usgs.gov/earthquakes/eventpage/test'
    }
  });

  assert(quakeBriefing.title.includes('M 6.3'), 'Title retains magnitude 6.3');
  assert(quakeBriefing.accessLabel === 'OFFICIAL SCIENTIFIC TELEMETRY', 'Access label marked OFFICIAL SCIENTIFIC TELEMETRY');
  assert(quakeBriefing.fullContent.includes('## Geophysical Event Overview'), 'Full content includes Geophysical Event Overview heading');
  assert(quakeBriefing.fullContent.includes('## Tectonic & Fault Dynamics'), 'Full content includes Tectonic & Fault Dynamics heading');
  assert(quakeBriefing.keyFacts.length >= 4, `Generated ${quakeBriefing.keyFacts.length} structured scientific key facts`);
  assert(quakeBriefing.keyFacts[0].includes('Tectonic Setting:'), 'Key fact 0 outlines tectonic setting');
  assert(quakeBriefing.depthMode === 'deep_dive', 'Depth mode classified as deep_dive');

  // 6. Space Weather Deterministic Briefing
  console.log('\n--- 6. Space Weather Deterministic Synthesis ---');
  const spaceBriefing = generateDeterministicPlanetaryBriefing({
    id: 'noaa-test-swpc',
    title: 'Space Weather: Planetary Kp Index 6 (G2 Moderate Storm)',
    summary: 'Coronal mass ejection impact elevates geomagnetic activity.',
    country: 'Global Magnetosphere',
    category: 'space_weather',
    publishedAt: new Date().toISOString(),
    telemetry: {
      kpIndex: 6,
      sensorSource: 'NOAA SWPC Magnetometer Array'
    }
  });

  assert(spaceBriefing.category === 'space_weather', 'Category is space_weather');
  assert(spaceBriefing.fullContent.includes('G2 — Moderate Geomagnetic Storm'), 'Briefing body details G2 moderate storm');
  assert(spaceBriefing.accessLabel === 'OFFICIAL SPACE TELEMETRY', 'Access label marked OFFICIAL SPACE TELEMETRY');

  // 7. Full Article Service Integration Test
  console.log('\n--- 7. Article Service Integration with Planetary Routing ---');
  const serviceQuakeResult = await fetchOrGenerateArticleDetails(
    'usgs-us7000live',
    'https://earthquake.usgs.gov/earthquakes/eventpage/us7000live',
    'M 5.9 Earthquake — Off the coast of Valparaiso, Chile',
    'Offshore earthquake registered along Peru-Chile Trench.',
    'Chile',
    'seismic',
    new Date().toISOString(),
    -33.0,
    -71.8,
    {
      magnitude: 5.9,
      depthKm: 24,
      tsunamiWarning: false,
      sensorSource: 'USGS NEIC'
    }
  );

  assert(serviceQuakeResult.category === 'seismic', 'fetchOrGenerateArticleDetails preserved category seismic');
  assert(serviceQuakeResult.accessLabel === 'OFFICIAL SCIENTIFIC TELEMETRY', 'Integrated service stamped OFFICIAL SCIENTIFIC TELEMETRY');
  assert(serviceQuakeResult.fullContent.includes('Nazca Plate'), 'Chile quake synthesized Nazca Plate subduction dynamics');
  assert(serviceQuakeResult.debug?.summaryGenerated === true, 'Debug confirms briefing generated');

  // Summary
  console.log('\n======================================================');
  if (failCount === 0) {
    console.log(`✅ All Planetary Briefing Tests Passed: ${passCount}/${passCount}`);
  } else {
    console.error(`❌ Some Tests Failed: ${failCount} failed, ${passCount} passed`);
    process.exit(1);
  }
  console.log('======================================================\n');
}

runSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
