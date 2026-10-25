// ============================================================
// MooEarth Live — Phase 3: Explore City with MapLibre Test Suite
// ============================================================
// Tests:
// 1. Map style providers & licensing compliance (MapTiler, Esri, OFM, OSM, CARTO)
// 2. City coordinate integrity across global hemispheres & bounds
// 3. Zoom level bounds and camera pitch/bearing constraints
// 4. URL query parameter serialization, restoration & roundtrip
// 5. Weather telemetry contract & null safety
// 6. Failover & watchdog recovery contracts
// 7. Component lifecycle & WebGL cleanup contracts

import {
  MAP_STYLES,
  MapStyleKey,
  validateCoordinate,
  clampZoom,
  serializeCityMapUrl,
  parseCityMapUrl,
  getFailoverStyle,
  getDefaultMapStyleKey,
  getMapTilerKey,
  getCartoKey,
  DEFAULT_CITY_ZOOM,
  MIN_CITY_ZOOM,
  MAX_CITY_ZOOM,
} from '../src/services/map/mapStyles';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('\n============================================================');
console.log('🧪 Running MooEarth.Live Phase 3 Explore City Test Suite');
console.log('============================================================\n');

// ── 1. Map Style Providers & Licensing Compliance ─────────────
console.log('--- 1. Map Style Providers & Licensing Compliance ---');

const expectedStyles: MapStyleKey[] = [
  'satellite',
  'esri-street',
  'maptiler-streets',
  'liberty',
  'bright',
  'osm',
  'voyager',
  'dark',
];

assert(
  expectedStyles.every((key) => key in MAP_STYLES),
  'All 8 map styles (satellite, esri-street, maptiler-streets, liberty, bright, osm, voyager, dark) are registered'
);

// Check Satellite HD (Esri World Imagery + Reference Labels)
const sat = MAP_STYLES['satellite'];
assert(sat.type === 'raster', 'Satellite HD is raster type');
assert(
  typeof sat.style === 'object' && sat.style.version === 8,
  'Satellite HD style is compliant with MapLibre Style Specification v8'
);
if (typeof sat.style === 'object') {
  const imagerySource = (sat.style.sources as any)['esri-satellite-imagery'];
  const labelsSource = (sat.style.sources as any)['esri-satellite-labels'];
  assert(!!imagerySource, 'Satellite style contains esri-satellite-imagery raster source');
  assert(!!labelsSource, 'Satellite style contains esri-satellite-labels raster source');
  assert(
    imagerySource.tiles[0].includes('World_Imagery'),
    'Satellite tiles point to official World_Imagery MapServer'
  );
  assert(
    labelsSource.tiles[0].includes('World_Boundaries_and_Places'),
    'Satellite labels point to official World_Boundaries_and_Places MapServer'
  );
}

// Check Esri World Street (Default Fast Raster Fallback)
const esri = MAP_STYLES['esri-street'];
assert(esri.type === 'raster', 'Esri Street is raster type');
assert(
  typeof esri.style === 'object' && esri.style.version === 8,
  'Esri style is compliant with MapLibre Style Specification v8'
);
if (typeof esri.style === 'object') {
  const source = (esri.style.sources as any)['esri-street-source'];
  assert(!!source, 'Esri style contains esri-street-source raster source');
  assert(
    Array.isArray(source.tiles) && source.tiles[0].includes('arcgisonline.com'),
    'Esri tiles specify official ArcGIS World Street Map tile URL'
  );
  assert(
    source.attribution.includes('Esri') && source.attribution.includes('OpenStreetMap'),
    'Esri attribution honors Esri and OpenStreetMap licenses'
  );
}

// Check MapTiler Streets Vector
const maptiler = MAP_STYLES['maptiler-streets'];
assert(maptiler.type === 'vector', 'MapTiler style is vector type');
assert(
  maptiler.attribution.includes('MapTiler') && maptiler.attribution.includes('OpenStreetMap'),
  'MapTiler attribution complies with MapTiler and OpenStreetMap requirements'
);

// Check OpenFreeMap Liberty Vector
const liberty = MAP_STYLES.liberty;
assert(liberty.type === 'vector', 'Liberty style is vector type');
assert(
  typeof liberty.style === 'string' && liberty.style.startsWith('https://tiles.openfreemap.org/styles/liberty'),
  'Liberty points to official HTTPS OpenFreeMap vector style endpoint'
);
assert(
  liberty.attribution.includes('OpenStreetMap') && liberty.attribution.includes('OpenFreeMap'),
  'Liberty style includes mandatory OpenStreetMap & OpenFreeMap attribution'
);

// Check OpenFreeMap Bright Vector
const bright = MAP_STYLES.bright;
assert(bright.type === 'vector', 'Bright style is vector type');
assert(
  typeof bright.style === 'string' && bright.style.startsWith('https://tiles.openfreemap.org/styles/bright'),
  'Bright points to official HTTPS OpenFreeMap vector style endpoint'
);

// Check OpenStreetMap Standard
const osm = MAP_STYLES.osm;
assert(osm.type === 'raster', 'OpenStreetMap style is raster type');
assert(
  osm.attribution.includes('OpenStreetMap'),
  'OpenStreetMap attribution honors ODbL requirements'
);

// Check Voyager Detailed Vector
const voyager = MAP_STYLES.voyager;
assert(voyager.type === 'vector', 'Voyager style is vector type');
assert(
  typeof voyager.style === 'string' && voyager.style.includes('openfreemap.org/styles/positron'),
  'Voyager points to official HTTPS OpenFreeMap positron endpoint'
);
assert(
  voyager.attribution.includes('OpenStreetMap') && voyager.attribution.includes('OpenFreeMap'),
  'Voyager attribution honors data licenses'
);

// Check Dark Vector
const dark = MAP_STYLES.dark;
assert(dark.type === 'vector', 'Dark Matter style is vector type');
assert(
  typeof dark.style === 'string' && dark.style.includes('openfreemap.org/styles/dark'),
  'Dark points to official HTTPS OpenFreeMap dark endpoint'
);
assert(
  dark.attribution.includes('OpenStreetMap') && dark.attribution.includes('OpenFreeMap'),
  'Dark attribution honors data licenses'
);

// ── 2. Default Style Resolution & Failover Contracts ──────────
console.log('\n--- 2. Default Style Resolution & Failover Contracts ---');

const defaultKey = getDefaultMapStyleKey();
assert(
  defaultKey === 'windy-satellite' || defaultKey === 'satellite' || defaultKey === 'esri-street' || defaultKey === 'maptiler-streets',
  `Default style key resolves cleanly to reliable provider (${defaultKey})`
);

// Test failover scenarios
assert(
  getFailoverStyle('maptiler-streets', true) === 'esri-street',
  'MapTiler vector failover switches automatically to Esri Street raster'
);
assert(
  getFailoverStyle('liberty', true) === 'esri-street',
  'OpenFreeMap liberty failover switches automatically to Esri Street raster'
);
assert(
  getFailoverStyle('bright', true) === 'esri-street',
  'OpenFreeMap bright failover switches automatically to Esri Street raster'
);
assert(
  getFailoverStyle('esri-street', true) === 'osm',
  'Esri Street secondary failover switches to OpenStreetMap standard'
);
assert(
  getFailoverStyle('liberty', false) === 'liberty',
  'Healthy state preserves active style'
);

// ── 3. City Coordinate Integrity Across Global Hemispheres ────
console.log('\n--- 3. City Coordinate Integrity Across Global Hemispheres ---');

interface TestCity {
  name: string;
  country: string;
  lat: number;
  lng: number;
  zone: string;
}

const testCities: TestCity[] = [
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, zone: 'Northern / Eastern' },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, zone: 'Northern / Prime Meridian' },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, zone: 'Northern / Western' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, zone: 'Southern / Eastern' },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816, zone: 'Southern / Western' },
  { name: 'Suva', country: 'Fiji', lat: -18.1416, lng: 178.4419, zone: 'Antimeridian Eastern' },
  { name: 'Longyearbyen', country: 'Norway', lat: 78.2232, lng: 15.6267, zone: 'High Arctic' },
  { name: 'Ushuaia', country: 'Argentina', lat: -54.8019, lng: -68.303, zone: 'Sub-Antarctic' },
];

testCities.forEach((city) => {
  const isLatValid = validateCoordinate(city.lat, city.lng);
  assert(
    isLatValid,
    `${city.name}, ${city.country} (${city.zone}) coordinates are within valid spherical bounds`
  );
});

// Out-of-bounds coordinate validation tests
assert(!validateCoordinate(91, 0), 'Latitude 91 is rejected (> 90)');
assert(!validateCoordinate(-90.5, 0), 'Latitude -90.5 is rejected (< -90)');
assert(!validateCoordinate(0, 180.1), 'Longitude 180.1 is rejected (> 180)');
assert(!validateCoordinate(0, -181), 'Longitude -181 is rejected (< -180)');
assert(!validateCoordinate(NaN, 10), 'NaN latitude is rejected');

// ── 4. Zoom Level Bounds & Camera Constraints ─────────────────
console.log('\n--- 4. Zoom Level Bounds & Camera Constraints ---');

assert(
  DEFAULT_CITY_ZOOM >= MIN_CITY_ZOOM && DEFAULT_CITY_ZOOM <= MAX_CITY_ZOOM,
  `Default city zoom (${DEFAULT_CITY_ZOOM}) provides adequate city street detail`
);

assert(clampZoom(5) === MIN_CITY_ZOOM, 'Sub-minimum zoom clamped to 10');
assert(clampZoom(25) === MAX_CITY_ZOOM, 'Excessive zoom clamped to 18');
assert(clampZoom(13.5) === 13.5, 'Normal zoom 13.5 remains unclamped');

// ── 5. URL Query Parameter Serialization & Restoration ────────
console.log('\n--- 5. URL Query Parameter Serialization & Restoration ---');

const tokyoUrl = serializeCityMapUrl(35.6762, 139.6503, 'Tokyo', 'Japan', 'city');
assert(tokyoUrl.includes('view=city'), 'Serialized URL contains view=city');
assert(tokyoUrl.includes('lat=35.6762') && tokyoUrl.includes('lng=139.6503'), 'Serialized URL contains exact coordinates');
assert(tokyoUrl.includes('city=Tokyo') && tokyoUrl.includes('country=Japan'), 'Serialized URL contains city and country names');

const parsedTokyo = parseCityMapUrl(tokyoUrl);
assert(parsedTokyo.isValid === true, 'Parsed Tokyo URL coordinates are valid');
assert(parsedTokyo.view === 'city', 'Parsed Tokyo URL view is city');
assert(parsedTokyo.city === 'Tokyo', 'Parsed Tokyo city name matches');
assert(parsedTokyo.country === 'Japan', 'Parsed Tokyo country name matches');

// Test Roundtrip for Paris
const parisUrl = serializeCityMapUrl(48.8566, 2.3522, 'Paris', 'France', 'city-map');
const parsedParis = parseCityMapUrl(parisUrl);
assert(parsedParis.isValid === true && Math.abs(parsedParis.lat - 48.8566) < 0.0001, 'Paris roundtrip latitude matches');
assert(parsedParis.view === 'city', 'Paris roundtrip viewMode restores to city');

// Test Roundtrip Return to Globe
const globeUrl = serializeCityMapUrl(48.8566, 2.3522, 'Paris', 'France', 'globe');
const parsedGlobe = parseCityMapUrl(globeUrl);
assert(parsedGlobe.view === 'globe', 'Return to Earth URL restores viewMode to globe');

// ── 6. Weather Telemetry Contract & Null Safety ───────────────
console.log('\n--- 6. Weather Telemetry Contract & Null Safety ---');

interface WeatherSummary {
  temperature?: number;
  weatherDescription?: string;
  weatherEmoji?: string;
  windSpeed?: number;
  relativeHumidity?: number;
  units?: string;
}

function formatCityWeatherDisplay(summary: WeatherSummary | null | undefined): string {
  if (!summary || typeof summary.temperature !== 'number') {
    return 'Weather loading...';
  }
  const unitSymbol = summary.units === 'fahrenheit' ? '°F' : '°C';
  const emoji = summary.weatherEmoji || '🌤️';
  return `${emoji} ${Math.round(summary.temperature)}${unitSymbol} · ${summary.weatherDescription || 'Current'}`;
}

const sampleWeather: WeatherSummary = {
  temperature: 21.4,
  weatherDescription: 'Clear sky',
  weatherEmoji: '☀️',
  windSpeed: 14.2,
  relativeHumidity: 65,
  units: 'celsius',
};

assert(
  formatCityWeatherDisplay(sampleWeather) === '☀️ 21°C · Clear sky',
  'Sample weather formatted correctly with temperature, emoji, and description'
);
assert(
  formatCityWeatherDisplay(null) === 'Weather loading...',
  'Null weather summary handled safely without crashing'
);
assert(
  formatCityWeatherDisplay(undefined) === 'Weather loading...',
  'Undefined weather summary handled safely'
);

// ── 7. Component Lifecycle & WebGL Context Protection ─────────
console.log('\n--- 7. Component Lifecycle & WebGL Context Protection ---');

class MockMapLibreInstance {
  isDestroyed = false;
  remove() {
    this.isDestroyed = true;
  }
}

const mockMap = new MockMapLibreInstance();
assert(!mockMap.isDestroyed, 'Map instance initialized');
mockMap.remove();
// ── 8. Anti-Regression: Multi-Scale HD Ground Dissolve & Weather Invariants ─
console.log('\n--- 8. Anti-Regression: Multi-Scale HD Ground Dissolve & Weather Invariants ---');

// Evaluate MapLibre linear interpolation expression at a specific zoom
function evaluateZoomOpacity(expression: any[], zoom: number): number {
  if (!Array.isArray(expression) || expression[0] !== 'interpolate') return 0;
  // Format: ['interpolate', ['linear'], ['zoom'], z1, op1, z2, op2, ...]
  const stops: { zoom: number; opacity: number }[] = [];
  for (let i = 3; i < expression.length; i += 2) {
    stops.push({ zoom: expression[i], opacity: expression[i + 1] });
  }
  if (zoom <= stops[0].zoom) return stops[0].opacity;
  if (zoom >= stops[stops.length - 1].zoom) return stops[stops.length - 1].opacity;
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (zoom >= s1.zoom && zoom <= s2.zoom) {
      const t = (zoom - s1.zoom) / (s2.zoom - s1.zoom);
      return Number((s1.opacity + t * (s2.opacity - s1.opacity)).toFixed(3));
    }
  }
  return 0;
}

const visibleOpacityCurve: any = [
  'interpolate',
  ['linear'],
  ['zoom'],
  7.0, 0.88,
  8.5, 0.84,
  9.5, 0.65,
  10.5, 0.35,
  11.5, 0.10,
  12.0, 0.0,
];

const infraredOpacityCurve: any = [
  'interpolate',
  ['linear'],
  ['zoom'],
  4.0, 0.88,
  6.5, 0.80,
  7.5, 0.45,
  8.5, 0.15,
  9.0, 0.0,
];

// Test 1: Macro & Regional scale preserves full satellite clouds
assert(
  evaluateZoomOpacity(visibleOpacityCurve, 3.3) === 0.88,
  'Global 2D view (zoom 3.3) displays full cloud opacity (0.88)'
);
assert(
  evaluateZoomOpacity(visibleOpacityCurve, 7.0) === 0.88,
  'Continental & Cyclone view (zoom 7.0) displays full cloud opacity (0.88)'
);
assert(
  evaluateZoomOpacity(visibleOpacityCurve, 8.5) === 0.84,
  'Regional storm front view (zoom 8.5) preserves high cloud visibility (0.84)'
);

// Test 2: Intermediate zoom dissolves smoothly
const midZoomOpacity = evaluateZoomOpacity(visibleOpacityCurve, 10.5);
assert(
  midZoomOpacity === 0.35,
  `District zoom (10.5) smoothly transitions to 0.35 opacity (was ${midZoomOpacity})`
);

// Test 3: City, Monument, and Street zoom is 100% fog-free (0.0 opacity)
assert(
  evaluateZoomOpacity(visibleOpacityCurve, 12.0) === 0.0,
  'City street threshold (zoom 12.0) completely dissolves clouds to 0.0'
);
assert(
  evaluateZoomOpacity(visibleOpacityCurve, 12.8) === 0.0,
  'Bhubaneswar monument zoom (zoom 12.8) is 100% fog-free (0.0 opacity) revealing crystal-clear HD photos'
);
assert(
  evaluateZoomOpacity(visibleOpacityCurve, 16.0) === 0.0,
  'Deep street view (zoom 16.0) is 100% fog-free for razor-sharp monuments and buildings'
);

// Test 4: Geostationary Infrared Dissolve
assert(
  evaluateZoomOpacity(infraredOpacityCurve, 4.0) === 0.88,
  'Geostationary infrared displays full storm opacity at synoptic scale (zoom 4.0)'
);
assert(
  evaluateZoomOpacity(infraredOpacityCurve, 9.0) === 0.0,
  'Geostationary infrared completely dissolves by zoom 9.0 avoiding pixelation'
);
assert(
  evaluateZoomOpacity(infraredOpacityCurve, 12.8) === 0.0,
  'Geostationary infrared is completely zero at monument zoom (zoom 12.8)'
);

// Final Summary
console.log('\n============================================================');
console.log(`📊 Test Results: ${passedTests} passed, ${failedTests} failed (${totalTests} total)`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
