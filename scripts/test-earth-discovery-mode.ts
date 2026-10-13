// ============================================================
// MooEarth Live — Phase 5: Earth Discovery Mode Test Suite
// ============================================================
// Validates:
// 1. Intelligent Question Engine (Flags, Capitals, Borders, Landmarks, Facts, Continents)
// 2. Choice Validity & Distractor Authenticity (4 unique choices, verified answers)
// 3. Deterministic Daily Global Challenge (5 unique questions, cross-player consistency)
// 4. Daily Challenge Category & Country Diversity (zero duplicate countries in 1 run)
// 5. Spin the Earth Raycast & Coordinate Mapping
// 6. Open Ocean vs Sovereign Land Detection & Graceful Re-Spin Handlers
// 7. Anti-Repeat Concept Signatures & Deduplication
// 8. Timed Scoring, Streaks, Time Bonuses, and XP Progression
// ============================================================

import {
  generateDiscoveryQuestion,
  getOfficialDailyQuestions,
  generateFlagDiscoveryQuestion,
  generateCapitalDiscoveryQuestion,
  generateBorderDiscoveryQuestion,
  generateLandmarkDiscoveryQuestion,
  generateContinentDiscoveryQuestion,
  generateFactDiscoveryQuestion,
} from '../src/engines/game/DiscoveryQuestionEngine';
import { getDailyEarthQuestion, SeededRandom, calculateLevel, XP_REWARDS } from '../src/data/questions';
import {
  resolveLocationFromCoordinates,
  generateCandidateOptions,
  clampLatitude,
  normalizeLongitude,
} from '../src/engines/game/providers/StopTheEarthProvider';
import { COUNTRY_METADATA } from '../src/data/questions/countryMetadata';
import { calculateScore } from '../src/engines/game/ScoringEngine';
import { EarthChallenge, UserResponse, ValidationResult } from '../src/engines/game/types';
import {
  getQuestionSignature,
  areQuestionsDuplicate,
  QuestionBrief,
} from '../src/services/questionHistoryService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('============================================================');
console.log('🧪 Running MooEarth.Live Phase 5 Earth Discovery Mode Suite');
console.log('============================================================\n');

// ─────────────────────────────────────────────────────────────
// 1. Intelligent Question Engine Category Coverage
// ─────────────────────────────────────────────────────────────
console.log('--- 1. Intelligent Question Engine Category Coverage ---');
{
  const rng = new SeededRandom(42);
  const japanMeta = COUNTRY_METADATA['Japan'];
  const franceMeta = COUNTRY_METADATA['France'];
  const brazilMeta = COUNTRY_METADATA['Brazil'];

  // Flag Question
  const flagQ = generateFlagDiscoveryQuestion(rng, japanMeta);
  assert(flagQ.question.includes('🇯🇵'), 'Flag question includes Japan flag emoji');
  assert(flagQ.choices.length === 4, 'Flag question has exactly 4 choices');
  assert(flagQ.choices[flagQ.correctIndex] === 'Japan', 'Correct choice is Japan');
  assert(new Set(flagQ.choices).size === 4, 'All 4 flag choices are distinct');
  assert(flagQ.funFact !== undefined && flagQ.funFact.length > 0, 'Flag question provides educational fun fact');

  // Capital Question
  const capQ = generateCapitalDiscoveryQuestion(rng, franceMeta);
  assert(capQ.question.includes('France'), 'Capital question targets France');
  assert(capQ.choices.length === 4, 'Capital question has exactly 4 choices');
  assert(capQ.choices[capQ.correctIndex] === 'Paris', 'Correct choice is Paris');
  assert(new Set(capQ.choices).size === 4, 'All 4 capital choices are distinct');

  // Border Question
  const borderQ = generateBorderDiscoveryQuestion(rng, brazilMeta);
  assert(borderQ.question.includes('Brazil'), 'Border question targets Brazil');
  assert(borderQ.choices.length === 4, 'Border question has exactly 4 choices');
  const chosenBorder = borderQ.choices[borderQ.correctIndex];
  assert(brazilMeta.neighbours?.includes(chosenBorder) ?? false, `Correct border answer (${chosenBorder}) is a verified neighbor of Brazil`);
  assert(new Set(borderQ.choices).size === 4, 'All 4 border choices are distinct');

  // Landmark Question
  const landmarkQ = generateLandmarkDiscoveryQuestion(rng, brazilMeta);
  assert(landmarkQ.question.includes('Christ the Redeemer'), 'Landmark question references Christ the Redeemer');
  assert(landmarkQ.choices[landmarkQ.correctIndex] === 'Brazil', 'Correct choice is Brazil');
  assert(landmarkQ.choices.length === 4, 'Landmark question has exactly 4 choices');

  // Continent Question
  const contQ = generateContinentDiscoveryQuestion(rng, japanMeta);
  assert(contQ.choices[contQ.correctIndex] === 'Asia', 'Japan is correctly placed in Asia');
  assert(contQ.choices.length === 4, 'Continent question has exactly 4 choices');

  // Fact Question (Currency)
  const factQ = generateFactDiscoveryQuestion(rng, japanMeta);
  assert(factQ.choices[factQ.correctIndex] === 'Japanese Yen', 'Japan currency is Japanese Yen');
  assert(factQ.choices.length === 4, 'Fact question has exactly 4 choices');
}

// ─────────────────────────────────────────────────────────────
// 2. Deterministic Daily Global Challenge (5 Questions)
// ─────────────────────────────────────────────────────────────
console.log('\n--- 2. Deterministic Daily Global Challenge ---');
{
  const testDate = '2026-10-14';
  const dailyQuestions1 = getOfficialDailyQuestions(testDate);
  const dailyQuestions2 = getOfficialDailyQuestions(testDate);

  assert(dailyQuestions1.length === 5, 'Daily challenge contains exactly 5 questions');
  assert(dailyQuestions2.length === 5, 'Second generation contains exactly 5 questions');

  // Strict determinism across multiple calls
  for (let i = 0; i < 5; i++) {
    assert(dailyQuestions1[i].id === dailyQuestions2[i].id, `Question ${i + 1} ID is deterministic across calls`);
    assert(dailyQuestions1[i].question === dailyQuestions2[i].question, `Question ${i + 1} text is deterministic across calls`);
    assert(dailyQuestions1[i].correctIndex === dailyQuestions2[i].correctIndex, `Question ${i + 1} answer index is deterministic`);
  }

  // Country diversity: all 5 questions target different nations
  const countrySet = new Set(dailyQuestions1.map(q => q.country.toLowerCase()));
  assert(countrySet.size === 5, 'All 5 daily challenge questions target 5 distinct sovereign nations');

  // Verification of getDailyEarthQuestion caller compatibility
  const q0 = getDailyEarthQuestion(testDate, 0, 0);
  const q1 = getDailyEarthQuestion(testDate, 1, 0);
  const q2 = getDailyEarthQuestion(testDate, 2, 0);
  const q3 = getDailyEarthQuestion(testDate, 3, 0);
  const q4 = getDailyEarthQuestion(testDate, 4, 0);

  assert(q0.id.includes('daily'), 'getDailyEarthQuestion(0) returns valid daily question');
  assert(q1.choices.length === 4, 'getDailyEarthQuestion(1) provides 4 choices');
  assert(q2.choices.length === 4, 'getDailyEarthQuestion(2) provides 4 choices');
  assert(q3.choices.length === 4, 'getDailyEarthQuestion(3) provides 4 choices');
  assert(q4.choices.length === 4, 'getDailyEarthQuestion(4) provides 4 choices');
}

// ─────────────────────────────────────────────────────────────
// 3. Spin the Earth Raycast & Open Ocean Detection
// ─────────────────────────────────────────────────────────────
console.log('\n--- 3. Spin the Earth Raycast & Open Ocean Detection ---');
{
  // Clamping and normalization
  assert(clampLatitude(95) === 90, 'Latitude 95 clamped to 90');
  assert(clampLatitude(-95) === -90, 'Latitude -95 clamped to -90');
  assert(normalizeLongitude(185) === -175, 'Longitude 185 normalized to -175');
  assert(normalizeLongitude(-185) === 175, 'Longitude -185 normalized to 175');

  // Deep open ocean coordinates (Point Nemo, South Pacific oceanic pole of inaccessibility)
  const oceanCoord = { lat: -48.8767, lng: -123.3933 };
  const oceanResolved = resolveLocationFromCoordinates(oceanCoord);
  assert(oceanResolved.isOpenOcean === true, 'Deep Pacific point correctly flagged with isOpenOcean: true');
  assert(oceanResolved.type === 'ocean', 'Deep Pacific point classified as ocean type');

  // Land coordinates (Tokyo, Paris, Sydney)
  const tokyoCoord = { lat: 35.6762, lng: 139.6503 };
  const tokyoResolved = resolveLocationFromCoordinates(tokyoCoord);
  assert(tokyoResolved.isOpenOcean === false || tokyoResolved.isOpenOcean === undefined, 'Tokyo is NOT open ocean');
  assert(tokyoResolved.name.toLowerCase().includes('tokyo') || tokyoResolved.country === 'Japan', 'Tokyo coordinate resolves to Tokyo/Japan');
  assert(tokyoResolved.distanceKm !== undefined && tokyoResolved.distanceKm < 50, 'Tokyo distance is under 50 km');

  // Candidate generation for land
  const candidates = generateCandidateOptions(tokyoResolved, 'medium');
  assert(candidates.length === 4, 'Generates 4 candidate options for stopped land location');
  assert(candidates.some(c => c.name === tokyoResolved.name), 'True stopped location is present in candidate options');
  assert(new Set(candidates.map(c => c.name)).size === 4, 'All 4 candidates have unique place names');
}

// ─────────────────────────────────────────────────────────────
// 4. Anti-Repeat Concept Signatures & Deduplication
// ─────────────────────────────────────────────────────────────
console.log('\n--- 4. Anti-Repeat Concept Signatures & Deduplication ---');
{
  // Concept signature extraction
  assert(getQuestionSignature('What is the capital city of France?') === 'capital', 'Extracts capital signature');
  assert(getQuestionSignature('Which country does this flag belong to?') === 'flag', 'Extracts flag signature');
  assert(getQuestionSignature('What is the official currency of Japan?') === 'currency', 'Extracts currency signature');
  assert(getQuestionSignature('Which country shares a land border with Germany?') === 'border', 'Extracts border signature');
  assert(getQuestionSignature('Where is the famous landmark Machu Picchu?') === 'landmark', 'Extracts landmark signature');

  // Paraphrased questions for the same country are caught
  const qA: QuestionBrief = {
    id: 'q1',
    country: 'France',
    question: 'What is the capital city of France?',
    signature: 'capital',
  };
  const qB: QuestionBrief = {
    id: 'q2',
    country: 'France',
    question: 'Name the capital of France.',
    signature: 'capital',
  };
  assert(areQuestionsDuplicate(qA, qB), 'Paraphrased capital question for same country is detected as duplicate');

  // Different country for same concept is NOT duplicate
  const qC: QuestionBrief = {
    id: 'q3',
    country: 'Germany',
    question: 'What is the capital city of Germany?',
    signature: 'capital',
  };
  assert(!areQuestionsDuplicate(qA, qC), 'Capital of France vs Capital of Germany are not duplicates');
}

// ─────────────────────────────────────────────────────────────
// 5. Timed Scoring, Streaks, Time Bonuses & XP Progression
// ─────────────────────────────────────────────────────────────
console.log('\n--- 5. Timed Scoring, Streaks, Time Bonuses & XP Progression ---');
{
  const mockChallenge: EarthChallenge = {
    id: 'ch-test-1',
    type: 'GEO_RANDOM_LOCATION',
    engine: 'geography',
    difficulty: 'hard',
    responseType: 'multiple_choice',
    question: 'Identify the country',
    timeLimit: 15,
    points: 100,
    generatedAt: new Date().toISOString(),
    fingerprint: 'test-fingerprint',
  };

  const fastResponse: UserResponse = {
    choiceIndex: 0,
    responseTimeMs: 2500, // Fast (2.5s out of 15s)
  };

  const validation: ValidationResult = {
    correct: true,
    feedback: 'Correct!',
    accuracy: 1.0,
  };

  // Perfect fast answer on hard difficulty with streak of 3
  const scoreResult1 = calculateScore(mockChallenge, fastResponse, validation, { currentStreak: 3 });

  assert(scoreResult1.basePoints > 0, 'Base points awarded');
  assert(scoreResult1.speedBonus > 0, 'Speed bonus awarded for fast response');
  assert(scoreResult1.streakMultiplier >= 1.0, 'Streak multiplier applied');
  assert(scoreResult1.totalPoints > scoreResult1.basePoints, 'Total points include speed and streak bonuses');

  // Late answer (slow, near timeout)
  const slowResponse: UserResponse = {
    choiceIndex: 0,
    responseTimeMs: 14500, // Slow (14.5s out of 15s)
  };

  const scoreResult2 = calculateScore(mockChallenge, slowResponse, validation, { currentStreak: 0 });

  assert(scoreResult2.speedBonus === 0 || scoreResult2.speedBonus < scoreResult1.speedBonus, 'Slow answer receives less/no speed bonus');
  assert(scoreResult1.totalPoints > scoreResult2.totalPoints, 'Fast answer scores higher than slow answer');

  // XP & Level Progression
  assert(calculateLevel(0) === 1, 'Level 1 at 0 XP');
  assert(calculateLevel(600) === 2, 'Level 2 at 600 XP');
  assert(calculateLevel(5000) === 5, 'Level 5 at 5000 XP');
  assert(calculateLevel(35000) === 10, 'Level 10 at 35000 XP');
  assert(XP_REWARDS.hard > XP_REWARDS.easy, 'Hard difficulty awards more XP than easy');
}

// ─────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────
console.log('\n============================================================');
console.log(`📊 Test Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
