// ============================================================
// MooEarth Live — Phase 2 Weather Layers Test Suite
// ============================================================
// Automated verification for:
// 1. Global grid station network & coordinate coverage
// 2. Spherical IDW interpolation & vector decomposition (u, v)
// 3. Longitude wrapping (-180..+180) and polar edge cases
// 4. Wind particle color scales & 3D coordinate projection
// 5. Temperature thermal color palette (-40°C..+45°C)
// 6. Precipitation model forecast color scale & snow detection
// 7. Timeline index boundary handling and safety

import {
  GLOBAL_GRID_STATIONS,
  interpolateGridWeatherAt,
  type GlobalGridPointData,
} from '../src/services/weather/globalGridService';
import {
  geoToVector3,
  getWindColor,
} from '../src/components/Globe/WeatherLayers/WindParticleSystem';
import { getThermalColorRgb } from '../src/components/Globe/WeatherLayers/TemperatureHeatmapLayer';
import { getPrecipitationColorRgb } from '../src/components/Globe/WeatherLayers/PrecipitationLayer';

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

async function runWeatherLayersTests() {
  console.log('\n============================================================');
  console.log('🧪 Running MooEarth.Live Phase 2 3D Weather Layers Test Suite');
  console.log('============================================================\n');

  // ── 1. Planetary Grid Station Coverage ───────────────────
  console.log('--- 1. Planetary Grid Station Coverage ---');
  assert(GLOBAL_GRID_STATIONS.length === 70, 'Network contains exactly 70 planetary reference stations');
  
  const uniqueIds = new Set(GLOBAL_GRID_STATIONS.map((s) => s.id));
  assert(uniqueIds.size === 70, 'All station IDs are globally unique');

  let allCoordsValid = true;
  for (const st of GLOBAL_GRID_STATIONS) {
    if (st.lat < -90 || st.lat > 90 || st.lng < -180 || st.lng > 180) {
      allCoordsValid = false;
      break;
    }
  }
  assert(allCoordsValid, 'All station latitudes (-90..90) and longitudes (-180..180) are valid');

  const northPolarStations = GLOBAL_GRID_STATIONS.filter((s) => s.lat >= 60);
  const tropicalStations = GLOBAL_GRID_STATIONS.filter((s) => Math.abs(s.lat) <= 20);
  const southPolarStations = GLOBAL_GRID_STATIONS.filter((s) => s.lat <= -60);
  assert(northPolarStations.length >= 10, 'Sub-arctic and Arctic belts adequately covered (>= 10 stations)');
  assert(tropicalStations.length >= 20, 'Equatorial and tropical belts adequately covered (>= 20 stations)');
  assert(southPolarStations.length >= 6, 'Southern Ocean and Antarctic belts covered (>= 6 stations)');

  // ── 2. Vector Field & Spherical IDW Interpolation ────────
  console.log('\n--- 2. Vector Field & Spherical IDW Interpolation ---');
  
  // Create mock station telemetry for interpolation tests
  const mockStations: GlobalGridPointData[] = [
    {
      id: 'st-tokyo',
      lat: 35.67,
      lng: 139.65,
      name: 'Tokyo',
      current: { temperature: 20, windSpeed: 25, windDirection: 90, precipitation: 1.5 },
      hourly: {
        temperature: [20, 22, 18],
        windSpeed: [25, 30, 20],
        windDirection: [90, 180, 270],
        precipitation: [1.5, 0.0, 5.0],
      },
    },
    {
      id: 'st-osaka',
      lat: 34.69,
      lng: 135.50,
      name: 'Osaka',
      current: { temperature: 24, windSpeed: 15, windDirection: 90, precipitation: 0.0 },
      hourly: {
        temperature: [24, 25, 21],
        windSpeed: [15, 20, 10],
        windDirection: [90, 90, 180],
        precipitation: [0.0, 0.2, 0.0],
      },
    },
  ];

  // Exact station query
  const exact = interpolateGridWeatherAt(35.67, 139.65, mockStations);
  assert(Math.abs(exact.temperature - 20) < 0.1, 'Exact station match returns station temperature');
  assert(Math.abs(exact.windSpeed - 25) < 0.1, 'Exact station match returns station wind speed');

  // Mid-point interpolation
  const mid = interpolateGridWeatherAt(35.18, 137.58, mockStations);
  assert(mid.temperature >= 20 && mid.temperature <= 24, 'Mid-point temperature is smoothly bounded (20..24°C)');
  assert(mid.windSpeed >= 15 && mid.windSpeed <= 25, 'Mid-point wind speed is smoothly bounded (15..25 km/h)');
  assert(typeof mid.u === 'number' && typeof mid.v === 'number', 'Interpolation yields valid (u, v) velocity vectors');

  // Longitude wrapping check across antimeridian (-180 / +180)
  const wrappingStations: GlobalGridPointData[] = [
    {
      id: 'st-west-meridian',
      lat: 0,
      lng: -179,
      name: 'West Meridian',
      current: { temperature: 28, windSpeed: 20, windDirection: 90, precipitation: 0 },
      hourly: { temperature: [28], windSpeed: [20], windDirection: [90], precipitation: [0] },
    },
    {
      id: 'st-east-meridian',
      lat: 0,
      lng: 179,
      name: 'East Meridian',
      current: { temperature: 30, windSpeed: 20, windDirection: 90, precipitation: 0 },
      hourly: { temperature: [30], windSpeed: [20], windDirection: [90], precipitation: [0] },
    },
  ];
  const antimeridian = interpolateGridWeatherAt(0, 180, wrappingStations);
  assert(antimeridian.temperature >= 28 && antimeridian.temperature <= 30, 'Antimeridian interpolation correctly wraps across ±180° longitude');

  // Hourly index scrubbing
  const hourlyT0 = interpolateGridWeatherAt(35.67, 139.65, mockStations, 0);
  const hourlyT1 = interpolateGridWeatherAt(35.67, 139.65, mockStations, 1);
  const hourlyT2 = interpolateGridWeatherAt(35.67, 139.65, mockStations, 2);
  assert(hourlyT0.temperature === 20, 'Hourly index 0 returns correct timeline temperature');
  assert(hourlyT1.temperature === 22, 'Hourly index 1 returns correct timeline temperature');
  assert(hourlyT2.precipitation === 5.0, 'Hourly index 2 returns correct timeline precipitation');

  // Empty stations graceful fallback
  const fallback = interpolateGridWeatherAt(0, 0, []);
  assert(fallback.temperature === 15 && fallback.windSpeed === 10, 'Empty station list falls back safely without throwing');

  // ── 3. 3D Globe Coordinate Conversion ────────────────────
  console.log('\n--- 3. 3D Globe Coordinate Conversion ---');
  const R = 100;
  const pNorth = geoToVector3(90, 0, R);
  assert(Math.abs(pNorth.y - R) < 0.001, 'North Pole (90°N) projects to +Y axis');
  assert(Math.abs(pNorth.x) < 0.001 && Math.abs(pNorth.z) < 0.001, 'North Pole X and Z coordinates are near zero');

  const pSouth = geoToVector3(-90, 0, R);
  assert(Math.abs(pSouth.y - (-R)) < 0.001, 'South Pole (90°S) projects to -Y axis');

  const pEquator = geoToVector3(0, 0, R);
  const distEquator = Math.sqrt(pEquator.x * pEquator.x + pEquator.y * pEquator.y + pEquator.z * pEquator.z);
  assert(Math.abs(distEquator - R) < 0.001, 'Equator vector lies exactly on the sphere surface of radius R');

  // ── 4. Wind Speed Palette ────────────────────────────────
  console.log('\n--- 4. Wind Speed Palette ---');
  const cCalm = getWindColor(10);
  assert(cCalm.g > cCalm.r, 'Calm wind (<15 km/h) is cyan / greenish-blue');

  const cBreeze = getWindColor(25);
  assert(cBreeze.g > cBreeze.b, 'Breeze (15-30 km/h) is emerald / green');

  const cModerate = getWindColor(40);
  assert(cModerate.r > 0.9 && cModerate.g > 0.5 && cModerate.b < 0.1, 'Moderate wind (30-50 km/h) is yellow / amber');

  const cGale = getWindColor(60);
  assert(cGale.r > cGale.g && cGale.g > cGale.b, 'Gale (50-70 km/h) is orange');

  const cStorm = getWindColor(85);
  assert(cStorm.r > 0.8 && cStorm.g < 0.4, 'Storm (>70 km/h) is red / crimson');

  // ── 5. Temperature Thermal Palette ───────────────────────
  console.log('\n--- 5. Temperature Thermal Palette ---');
  const cDeepFreeze = getThermalColorRgb(-30);
  assert(cDeepFreeze[0] > 0 && cDeepFreeze[2] > 200, 'Deep freeze (-30°C) is violet / purple');

  const cFreezing = getThermalColorRgb(-5);
  assert(cFreezing[1] > 150 && cFreezing[2] > 200, 'Freezing (-5°C) is ice blue / cyan');

  const cMild = getThermalColorRgb(18);
  assert(cMild[0] > 100 && cMild[1] > 180, 'Mild / comfortable (18°C) is lime / green-yellow');

  const cWarm = getThermalColorRgb(25);
  assert(cWarm[0] > 200 && cWarm[1] > 140, 'Warm (25°C) is amber / golden yellow');

  const cExtremeHeat = getThermalColorRgb(42);
  assert(cExtremeHeat[0] > 200 && cExtremeHeat[1] < 100, 'Extreme heat (42°C) is deep red / crimson');

  // ── 6. Precipitation Palette & Snow Detection ────────────
  console.log('\n--- 6. Precipitation Palette & Snow Detection ---');
  const cDry = getPrecipitationColorRgb(0.0, 20);
  assert(cDry[3] === 0, 'Zero precipitation (0 mm) is 100% transparent (alpha = 0)');

  const cDrizzle = getPrecipitationColorRgb(0.3, 18);
  assert(cDrizzle[3] > 0 && cDrizzle[1] > 150, 'Light drizzle (0.3 mm, 18°C) is visible mint green');

  const cRain = getPrecipitationColorRgb(4.0, 15);
  assert(cRain[2] > 200, 'Moderate rain (4.0 mm) is royal blue');

  const cTorrential = getPrecipitationColorRgb(20.0, 25);
  assert(cTorrential[0] > 200, 'Torrential storm cell (20 mm) is bright magenta / red');

  // Snow detection: sub-zero temperatures with precipitation
  const cLightSnow = getPrecipitationColorRgb(0.8, -5);
  assert(cLightSnow[0] > 200 && cLightSnow[1] > 220 && cLightSnow[2] > 240, 'Light snow (-5°C, 0.8 mm) is light icy white');

  const cHeavySnow = getPrecipitationColorRgb(5.0, -10);
  assert(cHeavySnow[0] > 230 && cHeavySnow[1] > 230 && cHeavySnow[2] > 240, 'Heavy snow (-10°C, 5.0 mm) is brilliant snow white');

  console.log('\n============================================================');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runWeatherLayersTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
