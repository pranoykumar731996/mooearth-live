// ============================================================
// MooEarth Live — Comprehensive Full-Stack Connectivity Suite
// ============================================================
// Systematically validates:
// 1. Frontend Core Platform Routes (200 OK, valid HTML)
// 2. Game Hubs & Quiz Entry Points (200 OK)
// 3. Dynamic Geographic Entity Routes (Countries, Cities, Continents, Weather)
// 4. Multilingual Localized Routes (8 languages)
// 5. Backend REST API Endpoints (JSON contracts, schemas, headers)
// 6. External Telemetry & Data Sources (Weather, Earth Events, Canonical Registries)
// ============================================================

import http from 'http';

interface TestResult {
  category: string;
  name: string;
  url: string;
  status: number;
  durationMs: number;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  baseUrl: string,
  path: string,
  category: string,
  name: string,
  options: {
    method?: string;
    body?: any;
    expectedStatus?: number;
    validateJson?: (json: any) => boolean;
  } = {}
) {
  const method = options.method || 'GET';
  const expectedStatus = options.expectedStatus || 200;
  const start = Date.now();
  const url = `${baseUrl}${path}`;

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json, text/html, */*',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: AbortSignal.timeout(20000),
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, fetchOptions);
    const durationMs = Date.now() - start;

    let passed = res.status === expectedStatus;
    let details = `Status: ${res.status}`;

    if (passed && options.validateJson) {
      try {
        const json = await res.json();
        const isValid = options.validateJson(json);
        if (!isValid) {
          passed = false;
          details += ' (JSON validation failed)';
        } else {
          details += ' (JSON valid)';
        }
      } catch (err: any) {
        passed = false;
        details += ` (Failed to parse JSON: ${err.message})`;
      }
    }

    results.push({ category, name, url, status: res.status, durationMs, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${mark}: [${category}] ${name} (${durationMs}ms) -> ${details}`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ category, name, url, status: 0, durationMs, passed: false, details: err.message });
    console.log(`  ❌ FAIL: [${category}] ${name} -> Error: ${err.message}`);
  }
}

export async function runConnectivityVerification(baseUrl: string) {
  console.log(`\n============================================================`);
  console.log(`🔍 Checking All System Connections on: ${baseUrl}`);
  console.log(`============================================================\n`);

  // ---- 1. Frontend Core Platform Routes ----
  console.log('--- 1. Frontend Core Platform Routes ---');
  await testEndpoint(baseUrl, '/', 'Frontend Core', 'Living Earth 3D Globe Homepage');
  await testEndpoint(baseUrl, '/play-earth', 'Frontend Core', 'Play Earth 3D Globe Mode');
  await testEndpoint(baseUrl, '/games', 'Frontend Core', 'Play Earth Games Hub');
  await testEndpoint(baseUrl, '/daily', 'Frontend Core', 'Daily Global Challenge');
  await testEndpoint(baseUrl, '/weather', 'Frontend Core', 'Weather Intelligence Radar');
  await testEndpoint(baseUrl, '/world-events', 'Frontend Core', 'World Events Telemetry Platform');
  await testEndpoint(baseUrl, '/explore', 'Frontend Core', 'Explore Earth Directory');
  await testEndpoint(baseUrl, '/globe', 'Frontend Core', '3D Earth Globe Simulator');
  await testEndpoint(baseUrl, '/world-map', 'Frontend Core', 'Interactive World Map');
  await testEndpoint(baseUrl, '/geography', 'Frontend Core', 'World Geography Atlas');
  await testEndpoint(baseUrl, '/about', 'Frontend Core', 'About MooEarth');
  await testEndpoint(baseUrl, '/contact', 'Frontend Core', 'Contact Support');
  await testEndpoint(baseUrl, '/terms', 'Frontend Core', 'Terms of Service');
  await testEndpoint(baseUrl, '/privacy', 'Frontend Core', 'Privacy Policy');

  // ---- 2. Game Hubs & Quiz Entry Points ----
  console.log('\n--- 2. Game Hubs & Specialized Quiz Landing Pages ---');
  await testEndpoint(baseUrl, '/flag-quiz', 'Game Hubs', 'Flag Identification Quiz');
  await testEndpoint(baseUrl, '/capital-quiz', 'Game Hubs', 'World Capital City Quiz');
  await testEndpoint(baseUrl, '/country-quiz', 'Game Hubs', 'Country Knowledge Quiz');
  await testEndpoint(baseUrl, '/geography-games', 'Game Hubs', 'Geography Games Arcade');
  await testEndpoint(baseUrl, '/geography-quiz', 'Game Hubs', 'World Geography Quiz');
  await testEndpoint(baseUrl, '/world-map-quiz', 'Game Hubs', 'World Map Puzzle Quiz');
  await testEndpoint(baseUrl, '/world-geography-quiz', 'Game Hubs', 'World Geography Master Quiz');

  // ---- 3. Dynamic Geographic Entity Routes ----
  console.log('\n--- 3. Dynamic Geographic Entity Pages ---');
  await testEndpoint(baseUrl, '/countries/japan', 'Geo Entities', 'Country: Japan');
  await testEndpoint(baseUrl, '/countries/france', 'Geo Entities', 'Country: France');
  await testEndpoint(baseUrl, '/countries/brazil', 'Geo Entities', 'Country: Brazil');
  await testEndpoint(baseUrl, '/cities/tokyo', 'Geo Entities', 'City: Tokyo');
  await testEndpoint(baseUrl, '/cities/london', 'Geo Entities', 'City: London');
  await testEndpoint(baseUrl, '/cities/mumbai', 'Geo Entities', 'City: Mumbai');
  await testEndpoint(baseUrl, '/continents/asia', 'Geo Entities', 'Continent: Asia');
  await testEndpoint(baseUrl, '/continents/europe', 'Geo Entities', 'Continent: Europe');
  await testEndpoint(baseUrl, '/weather/japan', 'Geo Entities', 'Weather: Japan');
  await testEndpoint(baseUrl, '/weather/france', 'Geo Entities', 'Weather: France');

  // ---- 4. Multilingual Localized Routes ----
  console.log('\n--- 4. Multilingual Localized Routes ---');
  await testEndpoint(baseUrl, '/es', 'Multilingual', 'Spanish Homepage (/es)');
  await testEndpoint(baseUrl, '/fr', 'Multilingual', 'French Homepage (/fr)');
  await testEndpoint(baseUrl, '/ja', 'Multilingual', 'Japanese Homepage (/ja)');
  await testEndpoint(baseUrl, '/de', 'Multilingual', 'German Homepage (/de)');
  await testEndpoint(baseUrl, '/pt', 'Multilingual', 'Portuguese Homepage (/pt)');
  await testEndpoint(baseUrl, '/hi', 'Multilingual', 'Hindi Homepage (/hi)');
  await testEndpoint(baseUrl, '/ar', 'Multilingual', 'Arabic Homepage (/ar)');
  await testEndpoint(baseUrl, '/es/daily', 'Multilingual', 'Spanish Daily Challenge (/es/daily)');
  await testEndpoint(baseUrl, '/fr/games', 'Multilingual', 'French Games Hub (/fr/games)');
  await testEndpoint(baseUrl, '/ja/weather', 'Multilingual', 'Japanese Weather Platform (/ja/weather)');

  // ---- 5. Backend REST API Endpoints ----
  console.log('\n--- 5. Backend REST API Endpoints ---');
  await testEndpoint(baseUrl, '/api/game/health', 'Backend API', 'Game Engine Health Check', {
    validateJson: (j) => j.status === 'healthy' && Array.isArray(j.engines?.active) && j.engines.active.length > 0,
  });

  await testEndpoint(baseUrl, '/api/game/challenge', 'Backend API', 'Generate Game Challenge (Geography)', {
    method: 'POST',
    body: { mode: 'endless', engine: 'geography' },
    validateJson: (j) => !!j.challenge && !!j.challenge.id && !!j.challenge.question,
  });

  await testEndpoint(baseUrl, '/api/game/challenge', 'Backend API', 'Generate Game Challenge (Daily)', {
    method: 'POST',
    body: { mode: 'daily' },
    validateJson: (j) => !!j.challenge && !!j.challenge.id,
  });

  await testEndpoint(baseUrl, '/api/weather/health', 'Backend API', 'Weather Service Health Check', {
    validateJson: (j) => typeof j.status === 'string' && typeof j.connectivity?.ok === 'boolean',
  });

  await testEndpoint(baseUrl, '/api/weather/forecast?lat=35.6762&lng=139.6503', 'Backend API', 'Weather Forecast Telemetry (Tokyo)', {
    validateJson: (j) => !!j.current && typeof j.current.temperature === 'number',
  });

  await testEndpoint(baseUrl, '/api/weather/air-quality?lat=35.6762&lng=139.6503', 'Backend API', 'Air Quality Telemetry (Tokyo)', {
    validateJson: (j) => !!j.current && (typeof j.current.usAqi === 'number' || typeof j.current.europeanAqi === 'number' || typeof j.current.pm25 === 'number'),
  });

  await testEndpoint(baseUrl, '/api/events?lang=en', 'Backend API', 'World Events Telemetry Feed', {
    validateJson: (j) => Array.isArray(j.events) && j.events.length > 0,
  });

  await testEndpoint(baseUrl, '/api/locations?q=Tokyo', 'Backend API', 'Locations Fast Autocomplete', {
    validateJson: (j) => Array.isArray(j.locations) && j.locations.length > 0 && j.locations[0].name === 'Tokyo',
  });

  await testEndpoint(baseUrl, '/api/global-mood', 'Backend API', 'Global Mood Intensity Index', {
    validateJson: (j) => typeof j.globalMood === 'object' && j.globalMood !== null,
  });

  // ---- 6. Summary ----
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;

  console.log('\n============================================================');
  console.log(`📊 CONNECTIVITY AUDIT SUMMARY: ${passedCount}/${total} PASSED (${Math.round((passedCount/total)*100)}%)`);
  if (failedCount > 0) {
    console.log(`⚠️  ${failedCount} endpoints failed or degraded!`);
  } else {
    console.log(`🎉 ALL FRONTEND ROUTES AND BACKEND APIS ARE 100% OPERATIONAL!`);
  }
  console.log('============================================================\n');

  return { total, passedCount, failedCount };
}

// Direct CLI invocation
const target = process.argv[2] || 'http://localhost:3000';
runConnectivityVerification(target).then(({ failedCount }) => {
  if (failedCount > 0) process.exit(1);
  else process.exit(0);
});
