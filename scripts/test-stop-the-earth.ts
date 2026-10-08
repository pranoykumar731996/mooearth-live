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

    // Critical Requirement: Zero bare country options!
    const countryOnlyCandidates = candidates.filter(c => c.type === 'country');
    assert(countryOnlyCandidates.length === 0, `ZERO bare country options for ${resolved.name} (${diff}), found ${countryOnlyCandidates.length}`);
  }
}

// 5b. Auto-Spot Mystery Place Selection
console.log('\n🎯 Testing Auto-Spot Mystery Place Selection...');
import { getRandomMysteryPlace } from '../src/engines/game/providers/StopTheEarthProvider';

const usedNames = new Set<string>();
for (let r = 1; r <= 5; r++) {
  const mystery = getRandomMysteryPlace(r, usedNames);
  assert(Boolean(mystery && mystery.name), `Round ${r} mystery place exists: ${mystery.name}`);
  assert(mystery.type !== 'country', `Round ${r} mystery place type is NOT country (${mystery.type})`);
  assert(Boolean(mystery.coordinates?.lat && mystery.coordinates?.lng), `Round ${r} mystery place has coordinates`);
  assert(!usedNames.has(mystery.name), `Round ${r} mystery place is not duplicated`);
  usedNames.add(mystery.name);

  const mysteryCands = generateCandidateOptions(mystery, 'medium');
  assert(mysteryCands.length === 4, `Mystery candidate options count is 4 for ${mystery.name}`);
  assert(mysteryCands.some(c => c.name === mystery.name), `Mystery place is in candidate options`);
  assert(mysteryCands.every(c => c.type !== 'country'), `All mystery candidate options are places, not bare countries`);
}

// 6. Game State Machine & Interaction Simulation Tests
console.log('\n🎮 Testing Game State Machine & Globe Pointer Interaction Flow...');

type StopTheEarthState = 
  | 'IDLE' 
  | 'COUNTDOWN' 
  | 'SPINNING' 
  | 'STOPPED' 
  | 'LOCATION_SELECTION' 
  | 'RESULT' 
  | 'COMPLETE';

interface MockGlobeController {
  autoRotate: boolean;
  autoRotateSpeed: number;
  enableRotate: boolean;
  enableZoom: boolean;
  enablePan: boolean;
}

class MockStopTheEarthGame {
  public state: StopTheEarthState = 'IDLE';
  public timer: number = 5.0;
  public stopAlreadyTriggered: boolean = false;
  public stoppedCoordinate: { lat: number; lng: number } | null = null;
  public candidates: any[] = [];
  public globe: MockGlobeController = {
    autoRotate: true,
    autoRotateSpeed: 0.5,
    enableRotate: true,
    enableZoom: true,
    enablePan: true,
  };

  startGame() {
    this.state = 'COUNTDOWN';
    // Countdown completes, transition to SPINNING
    this.state = 'SPINNING';
    this.timer = 5.0;
    this.stopAlreadyTriggered = false;
    this.stoppedCoordinate = null;
    this.candidates = [];

    // Globe spins rapidly and camera rotation dragging is locked
    this.globe.autoRotate = true;
    this.globe.autoRotateSpeed = 16.0;
    this.globe.enableRotate = false;
    this.globe.enableZoom = false;
    this.globe.enablePan = false;
  }

  handleGlobePointer(clientX: number, clientY: number, hitMesh: boolean, coords?: { lat: number; lng: number }): boolean {
    // 1. Only allow interaction if SPINNING
    if (this.state !== 'SPINNING') return false;

    // 2. Section 8: Prevent double click. First valid click wins!
    if (this.stopAlreadyTriggered) return false;

    // 3. Pointer must intersect globe
    if (!hitMesh || !coords) return false;

    this.stopAlreadyTriggered = true;

    // 4. Immediately freeze globe rotation
    this.globe.autoRotate = false;
    this.globe.autoRotateSpeed = 0;

    // 5. Freeze timer and capture coordinate
    this.stoppedCoordinate = coords;

    // 6. Transition to STOPPED & LOCATION_SELECTION
    this.state = 'STOPPED';
    const loc = resolveLocationFromCoordinates(coords);
    this.candidates = generateCandidateOptions(loc, 'medium');
    this.state = 'LOCATION_SELECTION';

    return true;
  }

  handleTimeout() {
    if (this.state !== 'SPINNING') return;
    this.stopAlreadyTriggered = true;
    this.globe.autoRotate = false;
    this.globe.autoRotateSpeed = 0;
    this.stoppedCoordinate = { lat: 0, lng: 0 }; // Current POV center
    this.state = 'STOPPED';
    const loc = resolveLocationFromCoordinates(this.stoppedCoordinate);
    this.candidates = generateCandidateOptions(loc, 'medium');
    this.state = 'LOCATION_SELECTION';
  }

  exitGame() {
    this.state = 'IDLE';
    this.stopAlreadyTriggered = false;
    // Restore normal globe controls
    this.globe.autoRotate = true;
    this.globe.autoRotateSpeed = 0.5;
    this.globe.enableRotate = true;
    this.globe.enableZoom = true;
    this.globe.enablePan = true;
  }
}

// Test Flow: Start -> Spin -> Click at 4.5s -> Freeze -> Options
const game = new MockStopTheEarthGame();
assert(game.state === 'IDLE', 'Initial state is IDLE');

game.startGame();
assert(game.state === 'SPINNING', 'State transitions to SPINNING after start');
assert(game.globe.autoRotate === true && game.globe.autoRotateSpeed === 16.0, 'Globe is rotating rapidly at speed 16');
assert(game.globe.enableRotate === false, 'Camera drag controls are disabled during spin so click is pure stop');

// Simulate click off the globe (miss)
const missResult = game.handleGlobePointer(10, 10, false);
assert(!missResult, 'Pointer outside globe is ignored');
assert(game.state === 'SPINNING', 'State remains SPINNING after miss');
assert(game.globe.autoRotateSpeed === 16.0, 'Globe continues rotating after miss');

// Simulate valid globe click at 4.5s (hit)
const hitCoord = { lat: 35.6762, lng: 139.6503 }; // Tokyo
game.timer = 4.5;
const hitResult = game.handleGlobePointer(500, 300, true, hitCoord);
assert(hitResult, 'First valid globe click is accepted');
assert(game.state === 'LOCATION_SELECTION', 'State transitions to LOCATION_SELECTION');
assert(game.globe.autoRotate === false && game.globe.autoRotateSpeed === 0, 'Globe immediately frozen at current orientation');
assert(game.stoppedCoordinate?.lat === 35.6762, 'Exact clicked coordinate (lat) preserved');
assert(game.candidates.length === 4, '4 location options generated immediately');

// Section 8: Prevent Double-Click
const secondClickCoord = { lat: 51.5074, lng: -0.1278 }; // London
const secondResult = game.handleGlobePointer(400, 200, true, secondClickCoord);
assert(!secondResult, 'Second click is ignored (prevent double click)');
assert(game.stoppedCoordinate?.lat === 35.6762, 'Original coordinate is retained, second click did not overwrite');
assert(game.globe.autoRotateSpeed === 0, 'Globe remains frozen');

// Test Exit: Restores normal globe
game.exitGame();
assert(game.state === 'IDLE', 'Game exited to IDLE');
assert(game.globe.enableRotate === true && game.globe.enableZoom === true, 'Normal globe interaction controls fully restored');

// Test 5-Second Timeout auto-stop
const timeoutGame = new MockStopTheEarthGame();
timeoutGame.startGame();
assert(timeoutGame.state === 'SPINNING', 'Timeout test game starts spinning');
timeoutGame.timer = 0.0;
timeoutGame.handleTimeout();
assert(timeoutGame.state === 'LOCATION_SELECTION', 'Auto-stop on timeout transitions to LOCATION_SELECTION');
assert(timeoutGame.globe.autoRotateSpeed === 0, 'Globe is frozen on timeout');
assert(timeoutGame.candidates.length === 4, 'Candidates generated on timeout');

console.log('\n========================================');
if (failures === 0) {
  console.log('🎉 ALL STOP THE EARTH RESOLVER & INTERACTION TESTS PASSED!');
  process.exit(0);
} else {
  console.error(`💥 ${failures} TESTS FAILED.`);
  process.exit(1);
}

