// ============================================================
// MooEarth Live — Stop The Earth Planetary Resolver Test Suite
// ============================================================

import {
  resolveLocationFromCoordinates,
  generateCandidateOptions,
  findNearestCountry,
  findNearestWaterBody,
  normalizeLongitude,
  clampLatitude,
  VERIFIED_WATER_BODIES,
  VERIFIED_TERRITORIES,
} from '../src/engines/game/providers/StopTheEarthProvider';
import { haversineDistance } from '../src/engines/game/ValidationEngine';
import { CANONICAL_COUNTRIES } from '../src/data/countries';

let failures = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('🧪 Starting Stop The Earth Planetary Resolver Tests...\n');

// 1. Basic coordinate normalization & clamping
assert(normalizeLongitude(190) === -170, 'normalizeLongitude(190) should be -170');
assert(normalizeLongitude(-190) === 170, 'normalizeLongitude(-190) should be 170');
assert(clampLatitude(95) === 90, 'clampLatitude(95) should be clamped to 90');
assert(clampLatitude(-95) === -90, 'clampLatitude(-95) should be clamped to -90');

// 2. Giant countries inland resolution (prevents being called ocean)
const testInlandPoints = [
  { name: 'Siberia, Russia', coord: { lat: 62.0, lng: 129.7 }, expectedCountry: 'Russia' },
  { name: 'Central Australia', coord: { lat: -23.7, lng: 133.8 }, expectedCountry: 'Australia' },
  { name: 'Canadian Yukon', coord: { lat: 60.7, lng: -135.0 }, expectedCountry: 'Canada' },
  { name: 'Amazon, Brazil', coord: { lat: -3.1, lng: -60.0 }, expectedCountry: 'Brazil' },
  { name: 'Kansas, USA', coord: { lat: 38.5, lng: -98.0 }, expectedCountry: 'United States' },
  { name: 'Central China (Shaanxi)', coord: { lat: 34.34, lng: 108.93 }, expectedCountry: 'China' },
  { name: 'Madhya Pradesh, India', coord: { lat: 23.0, lng: 77.0 }, expectedCountry: 'India' },
];

for (const p of testInlandPoints) {
  const resolved = resolveLocationFromCoordinates(p.coord);
  assert(
    Boolean(
      resolved.name.toLowerCase().includes(p.expectedCountry.toLowerCase()) ||
      (resolved.country && resolved.country.toLowerCase().includes(p.expectedCountry.toLowerCase()))
    ),
    `Inland ${p.name} resolved to ${resolved.name} (type: ${resolved.type}), expected ${p.expectedCountry}`
  );
}

// 3. Polar & Remote Territories
const testTerritories = [
  { name: 'South Pole, Antarctica', coord: { lat: -85.0, lng: 0.0 }, expected: 'Antarctica' },
  { name: 'Nuuk, Greenland', coord: { lat: 64.18, lng: -51.72 }, expected: 'Greenland' },
  { name: 'Honolulu, Hawaii', coord: { lat: 21.3, lng: -157.8 }, expected: 'Hawaii' },
  { name: 'Svalbard Arctic', coord: { lat: 78.2, lng: 15.6 }, expected: 'Svalbard' },
];

for (const t of testTerritories) {
  const resolved = resolveLocationFromCoordinates(t.coord);
  assert(
    resolved.name.toLowerCase().includes(t.expected.toLowerCase()),
    `Territory ${t.name} resolved to ${resolved.name}, expected ${t.expected}`
  );
}

// 4. Oceans & Regional Seas
const testWaters = [
  { name: 'Mid Atlantic', coord: { lat: 30.0, lng: -45.0 }, expectedTypes: ['ocean', 'sea'] },
  { name: 'South Pacific Deep', coord: { lat: -35.0, lng: -130.0 }, expectedTypes: ['ocean', 'sea'] },
  { name: 'Indian Ocean Mid', coord: { lat: -25.0, lng: 80.0 }, expectedTypes: ['ocean', 'sea'] },
  { name: 'Mediterranean Sea', coord: { lat: 35.5, lng: 18.0 }, expectedTypes: ['sea', 'ocean', 'country'] },
];

for (const w of testWaters) {
  const resolved = resolveLocationFromCoordinates(w.coord);
  assert(
    w.expectedTypes.includes(resolved.type),
    `Water point ${w.name} resolved to ${resolved.name} (type: ${resolved.type})`
  );
}

// 5. Candidate Generation Guarantee
console.log('\n🔍 Testing Candidate Options Generation...');
const testCandidateCoords = [
  { lat: 48.8566, lng: 2.3522 },    // Paris
  { lat: 35.6762, lng: 139.6503 },  // Tokyo
  { lat: -33.8688, lng: 151.2093 }, // Sydney
  { lat: 0.0, lng: -140.0 },        // Deep Pacific
  { lat: 71.7, lng: -42.6 },        // Greenland
  { lat: -78.0, lng: 0.0 },         // Antarctica
  { lat: 25.0, lng: -90.0 },        // Gulf of Mexico
];

for (const coord of testCandidateCoords) {
  const resolved = resolveLocationFromCoordinates(coord);
  for (const diff of ['easy', 'medium', 'hard'] as const) {
    const candidates = generateCandidateOptions(resolved, diff);
    
    assert(candidates.length === 4, `Candidates length is 4 for ${resolved.name} (${diff})`);
    
    const trueLocationIncluded = candidates.some(c => c.name === resolved.name);
    assert(trueLocationIncluded, `TRUE LOCATION (${resolved.name}) is present in candidate options for ${diff}`);

    const uniqueIds = new Set(candidates.map(c => c.id));
    assert(uniqueIds.size === 4, `All 4 candidate options are distinct (no duplicates) for ${resolved.name}`);
  }
}

console.log('\n========================================');
if (failures === 0) {
  console.log('🎉 ALL STOP THE EARTH RESOLVER TESTS PASSED!');
  process.exit(0);
} else {
  console.error(`💥 ${failures} TESTS FAILED.`);
  process.exit(1);
}
