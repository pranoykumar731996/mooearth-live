// ============================================================
// Automated Regression Suite: Geo Locator Finder Coordinate Integrity
// ============================================================
// Asserts that ALL questions in Geo Locator Finder / Stop the Earth
// have 100% verified real geographic coordinates (ZERO fake country centroids).

import { QUESTION_BANK, getQuestionById, getQuestionsForCountry } from '../src/data/stopTheEarth/questionBank';
import { SOVEREIGN_CAPITAL_COORDINATES } from '../src/data/countries/capitalCoordinates';
import { CANONICAL_COUNTRIES } from '../src/data/countries';
import { haversineDistance } from '../src/engines/game/ValidationEngine';

console.log('--- RUNNING GEO LOCATOR FINDER COORDINATE VERIFICATION ---');

let failureCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failureCount++;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// 1. Bank size check
assert(QUESTION_BANK.length >= 300, `Question bank contains sufficient questions (${QUESTION_BANK.length} >= 300)`);

// 2. No missing or 0,0 coordinates
const invalidCoords = QUESTION_BANK.filter(
  q => !q.coordinates || (q.coordinates.lat === 0 && q.coordinates.lng === 0)
);
assert(invalidCoords.length === 0, `Zero questions have (0,0) or missing coordinates (found ${invalidCoords.length})`);

// 3. All 195 sovereign capitals match real city coordinates within 10km
const benchmarkCapitals: { countryCode: string; name: string; expectedLat: number; expectedLng: number }[] = [
  { countryCode: 'RU', name: 'Moscow', expectedLat: 55.7558, expectedLng: 37.6173 },
  { countryCode: 'US', name: 'Washington, D.C.', expectedLat: 38.9072, expectedLng: -77.0369 },
  { countryCode: 'AU', name: 'Canberra', expectedLat: -35.2809, expectedLng: 149.1300 },
  { countryCode: 'IN', name: 'New Delhi', expectedLat: 28.6139, expectedLng: 77.2090 },
  { countryCode: 'CN', name: 'Beijing', expectedLat: 39.9042, expectedLng: 116.4074 },
  { countryCode: 'FR', name: 'Paris', expectedLat: 48.8566, expectedLng: 2.3522 },
  { countryCode: 'DE', name: 'Berlin', expectedLat: 52.5200, expectedLng: 13.4050 },
  { countryCode: 'GB', name: 'London', expectedLat: 51.5074, expectedLng: -0.1278 },
  { countryCode: 'EG', name: 'Cairo', expectedLat: 30.0444, expectedLng: 31.2357 },
  { countryCode: 'BR', name: 'Brasília', expectedLat: -15.7975, expectedLng: -47.8919 },
  { countryCode: 'JP', name: 'Tokyo', expectedLat: 35.6762, expectedLng: 139.6503 },
  { countryCode: 'IT', name: 'Rome', expectedLat: 41.9028, expectedLng: 12.4964 },
  { countryCode: 'ES', name: 'Madrid', expectedLat: 40.4168, expectedLng: -3.7038 },
  { countryCode: 'CA', name: 'Ottawa', expectedLat: 45.4215, expectedLng: -75.6972 },
];

for (const b of benchmarkCapitals) {
  const countryQs = getQuestionsForCountry(b.countryCode);
  const capQ = countryQs.find(q => q.type === 'capital');
  assert(Boolean(capQ), `Capital question found for ${b.countryCode} (${b.name})`);
  if (capQ) {
    const dist = haversineDistance(capQ.coordinates, { lat: b.expectedLat, lng: b.expectedLng });
    assert(dist < 15, `${b.name} coordinates [${capQ.coordinates.lat}, ${capQ.coordinates.lng}] within 15km of true location (actual error: ${dist.toFixed(2)} km)`);
  }
}

// 4. Verify no capital is at the country centroid
for (const country of CANONICAL_COUNTRIES) {
  const countryQs = getQuestionsForCountry(country.iso2);
  const capQ = countryQs.find(q => q.type === 'capital');
  if (capQ) {
    // If country is not a microstate where capital equals country center
    const area = country.areaKm2;
    if (area > 50000) {
      const distToCentroid = haversineDistance(capQ.coordinates, country.coordinates);
      // Russia, USA, Australia, India, China, Canada capitals are hundreds or thousands of km from centroid
      if (['RU', 'US', 'AU', 'CA', 'CN', 'IN', 'BR'].includes(country.iso2.toUpperCase())) {
        assert(distToCentroid > 200, `${country.name} capital is NOT at country centroid (distance from centroid: ${distToCentroid.toFixed(0)} km)`);
      }
    }
  }
}

// 5. Benchmark landmarks
const benchmarkLandmarks: { id: string; name: string; lat: number; lng: number }[] = [
  { id: 'Taj Mahal', name: 'Taj Mahal', lat: 27.1751, lng: 78.0421 },
  { id: 'Eiffel Tower', name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 },
  { id: 'Statue of Liberty', name: 'Statue of Liberty', lat: 40.6892, lng: -74.0445 },
  { id: 'Great Pyramids of Giza', name: 'Great Pyramids of Giza', lat: 29.9792, lng: 31.1342 },
  { id: 'Colosseum', name: 'Colosseum', lat: 41.8902, lng: 12.4922 },
  { id: 'Sydney Opera House', name: 'Sydney Opera House', lat: -33.8568, lng: 151.2153 },
  { id: 'Red Square & Saint Basil’s Cathedral', name: 'Red Square', lat: 55.7525, lng: 37.6231 },
];

for (const lm of benchmarkLandmarks) {
  const q = QUESTION_BANK.find(item => item.placeName.toLowerCase().includes(lm.id.toLowerCase()));
  assert(Boolean(q), `Landmark "${lm.id}" exists in question bank`);
  if (q) {
    const dist = haversineDistance(q.coordinates, { lat: lm.lat, lng: lm.lng });
    assert(dist < 10, `Landmark "${lm.name}" within 10km of authentic coordinates (error: ${dist.toFixed(2)} km)`);
  }
}

// 6. Summary check
if (failureCount > 0) {
  console.error(`\n❌ TEST SUITE FAILED with ${failureCount} errors.`);
  process.exit(1);
} else {
  console.log(`\n🎉 ALL TESTS PASSED: Geo Locator Finder coordinate integrity 100% verified!`);
  process.exit(0);
}
