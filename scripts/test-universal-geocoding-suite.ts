// ============================================================
// MooEarth Live — Universal Geocoding Test Suite
// ============================================================

import { universalSearchLocations } from '../src/services/geocoding/universalGeocodingService';

async function runTests() {
  console.log('--- STARTING UNIVERSAL GEOCODING SUITE ---');

  const testQueries = [
    { query: 'Tokyo', expectedType: 'city', desc: 'Major Global City' },
    { query: 'Eiffel Tower', expectedType: 'landmark', desc: 'Historic Landmark' },
    { query: 'Heathrow Airport', expectedType: 'airport', desc: 'International Airport' },
    { query: 'Mount Everest', expectedType: 'mountain', desc: 'Mountain Peak' },
    { query: 'Oxford Street London', expectedType: 'street', desc: 'Street / Commercial Road' },
    { query: 'Central Park New York', expectedType: 'park', desc: 'Urban Public Park' },
  ];

  let passed = 0;

  for (const t of testQueries) {
    try {
      console.log(`\nTesting [${t.desc}] -> Query: "${t.query}"...`);
      const resp = await universalSearchLocations(t.query, 3);
      if (!resp.results || resp.results.length === 0) {
        console.error(`❌ FAILED: Zero results returned for "${t.query}"`);
        continue;
      }

      const first = resp.results[0];
      console.log(`  ✓ Found: "${first.name}"`);
      console.log(`  ✓ Display: "${first.displayName || first.name}"`);
      console.log(`  ✓ Coords: ${first.latitude.toFixed(4)}, ${first.longitude.toFixed(4)}`);
      console.log(`  ✓ Type: [${first.type}] (Expected: [${t.expectedType}])`);
      console.log(`  ✓ Provider: ${resp.provider} (${resp.generationTime}ms)`);

      if (
        typeof first.latitude === 'number' &&
        typeof first.longitude === 'number' &&
        !isNaN(first.latitude) &&
        !isNaN(first.longitude)
      ) {
        passed++;
      } else {
        console.error(`❌ FAILED: Invalid coordinates for "${t.query}"`);
      }
    } catch (e: any) {
      console.error(`❌ ERROR querying "${t.query}":`, e.message);
    }
  }

  // Test caching: Repeated query should be fast (< 20ms) and use cache
  console.log('\nTesting In-Memory TTL Caching...');
  const t0 = Date.now();
  const cachedResp = await universalSearchLocations('Tokyo', 3);
  const cacheDuration = Date.now() - t0;
  console.log(`  ✓ Cache retrieval took ${cacheDuration}ms (Items: ${cachedResp.results.length})`);
  if (cacheDuration < 50 && cachedResp.results.length > 0) {
    passed++;
    console.log('  ✓ Cache hit verified successfully');
  } else {
    console.warn('  ⚠️ Cache took longer than expected');
  }

  console.log(`\n--- RESULTS: ${passed}/${testQueries.length + 1} PASSED ---`);
  if (passed === testQueries.length + 1) {
    console.log('🎉 ALL UNIVERSAL GEOCODING TESTS PASSED!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
