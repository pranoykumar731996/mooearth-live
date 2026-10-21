/**
 * scripts/test-stop-the-earth.ts
 *
 * Comprehensive Verification Suite for Stop the Earth Game Engine:
 * 1. Question Bank Integrity & Distribution (>500 questions, valid coords)
 * 2. Country Bounding Boxes (coverage, geometry sanity)
 * 3. Distance & Speed Scoring Engine
 * 4. Anti-Repeat Question Allocator & Session Lifecycle
 */

import {
  QUESTION_BANK,
  getEligibleQuestions,
  getEligibleQuestionsWithFallback,
  getQuestionById,
  getQuestionsForCountry,
  getQuestionCountForCountry,
  getQuestionBankStats,
  selectRandomQuestion,
} from '../src/data/stopTheEarth/questionBank';

import {
  getCountryBounds,
  getCountryBoundsByName,
  getAllCountryBounds,
  isWithinCountryBounds,
} from '../src/data/stopTheEarth/countryBounds';

import {
  calculateDistanceScore,
  calculateAccuracy,
  isGuessCorrect,
  getDistanceFeedback,
  formatDistance,
} from '../src/engines/game/stopTheEarth/scoring';

import {
  createSteSession,
  allocateNextQuestion,
  processAnswer,
  getSteSession,
  getGameSummary,
} from '../src/engines/game/stopTheEarth/questionAllocator';

import { CANONICAL_COUNTRIES } from '../src/data/countries';
import { STE_DIFFICULTY_CONFIG, SteDifficulty } from '../src/engines/game/stopTheEarth/types';

let passed = 0;
let total = 0;

function assert(condition: boolean, name: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    if (detail) console.error(`     Reason: ${detail}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log(' 🌍 Stop the Earth: Comprehensive Test Suite');
  console.log('=============================================================\n');

  // ----------------------------------------------------------------
  // 1. QUESTION BANK INTEGRITY
  // ----------------------------------------------------------------
  console.log('--- 1. Question Bank Integrity ---');
  
  assert(QUESTION_BANK.length >= 500, `Question bank size >= 500 (found ${QUESTION_BANK.length})`);

  const seenIds = new Set<string>();
  const seenFp = new Set<string>();
  let duplicateIds = 0;
  let duplicateFps = 0;
  let invalidCoords = 0;
  let invalidTolerances = 0;

  for (const q of QUESTION_BANK) {
    if (seenIds.has(q.id)) duplicateIds++;
    seenIds.add(q.id);

    if (seenFp.has(q.fingerprint)) duplicateFps++;
    seenFp.add(q.fingerprint);

    if (
      typeof q.coordinates.lat !== 'number' ||
      typeof q.coordinates.lng !== 'number' ||
      q.coordinates.lat < -90 ||
      q.coordinates.lat > 90 ||
      q.coordinates.lng < -180 ||
      q.coordinates.lng > 180
    ) {
      invalidCoords++;
    }

    if (q.toleranceKm <= 0 || q.toleranceKm > 200) {
      invalidTolerances++;
    }
  }

  assert(duplicateIds === 0, 'No duplicate question IDs');
  assert(duplicateFps === 0, 'No duplicate question fingerprints');
  assert(invalidCoords === 0, 'All coordinates in valid latitude/longitude ranges');
  assert(invalidTolerances === 0, 'All tolerance radii within reasonable ranges');

  // Difficulty distribution
  const stats = getQuestionBankStats();
  const easyCount = stats.byDifficulty.easy;
  const medCount = stats.byDifficulty.medium;
  const hardCount = stats.byDifficulty.hard;
  console.log(`  📊 Distribution: Easy=${easyCount}, Medium=${medCount}, Hard=${hardCount}`);
  assert(easyCount > 50, `Substantial easy pool (${easyCount})`);
  assert(medCount > 50, `Substantial medium pool (${medCount})`);
  assert(hardCount > 50, `Substantial hard pool (${hardCount})`);

  // ----------------------------------------------------------------
  // 2. COUNTRY BOUNDS COVERAGE
  // ----------------------------------------------------------------
  console.log('\n--- 2. Country Bounding Boxes ---');
  const allBounds = getAllCountryBounds();
  assert(allBounds.length >= 195, `All 195 sovereign countries covered (found ${allBounds.length})`);

  let invalidGeometry = 0;
  for (const b of allBounds) {
    if (b.sw.lat > b.ne.lat || b.zoom < 1 || b.zoom > 15) {
      invalidGeometry++;
    }
  }
  assert(invalidGeometry === 0, 'All bounding boxes have valid geometry (sw.lat <= ne.lat)');

  // Known override check (US, RU, FR, JP)
  const usBounds = getCountryBounds('US');
  assert(!!usBounds && usBounds.countryCode === 'US' && usBounds.zoom === 4, 'US override bounds present');

  const frByName = getCountryBoundsByName('France');
  assert(!!frByName && frByName.countryCode === 'FR', 'getCountryBoundsByName resolves "France"');

  // Test within bounds helper
  const parisInFrance = isWithinCountryBounds({ lat: 48.8566, lng: 2.3522 }, 'FR');
  assert(parisInFrance, 'Paris (48.85, 2.35) detected within France bounds');

  // ----------------------------------------------------------------
  // 3. SCORING ENGINE ACCURACY & LOGIC
  // ----------------------------------------------------------------
  console.log('\n--- 3. Distance & Speed Scoring ---');

  // Bullseye (0km): should be maximum base score
  const perfectScore = calculateDistanceScore(0, 'easy', 30000, 0);
  assert(perfectScore.baseScore === 1000, `0km distance earns 1000 base points (got ${perfectScore.baseScore})`);

  // Accuracy helper
  const acc100 = calculateAccuracy(0, 'easy');
  assert(acc100 === 100, `0km accuracy is 100% (got ${acc100}%)`);

  // Guess at edge of max distance (1000km for easy): 0 distance points
  const farScore = calculateDistanceScore(1200, 'easy', 5000, 0);
  assert(farScore.baseScore === 0, `Guess beyond max distance gives 0 base points (got ${farScore.baseScore})`);

  // Speed bonus: answering in 2s (out of 30s) gives bonus
  const speedBonus = calculateDistanceScore(20, 'easy', 2000, 0);
  assert(speedBonus.speedBonus > 0, `Speed bonus awarded when answering quickly (${speedBonus.speedBonus} pts)`);

  // Streak multiplier (streak = 3 -> 1.3x)
  const streakScore = calculateDistanceScore(10, 'easy', 5000, 3);
  assert(streakScore.streakMultiplier === 1.3, `Streak multiplier correctly set to 1.3 (got ${streakScore.streakMultiplier})`);
  assert(streakScore.totalScore > streakScore.baseScore, 'Streak multiplier scales total score above base');

  // Feedback strings
  const fb1 = getDistanceFeedback(5, 50);
  assert(fb1.tier === 'perfect' && fb1.label === 'Bullseye!', 'Bullseye feedback matches perfect tier');
  const fb2 = getDistanceFeedback(80, 50);
  assert(fb2.tier === 'excellent' && fb2.label === 'Very close!', '80km / 50km feedback matches excellent tier');
  assert(formatDistance(12.34) === '12 km', `Distance formats correctly (got ${formatDistance(12.34)})`);

  // ----------------------------------------------------------------
  // 4. ANTI-REPEAT ALLOCATOR & SESSION LIFECYCLE
  // ----------------------------------------------------------------
  console.log('\n--- 4. Anti-Repeat Session Lifecycle ---');

  const testPlayerId = `ste_test_player_${Date.now()}`;
  const session = createSteSession(testPlayerId, 'United States', 'US', 'easy', 'country-challenge');

  assert(!!session.sessionId, 'Session created successfully with UUID');
  assert(session.countryCode === 'US', 'Session country code set to US');
  assert(session.maxRounds === 5, 'Easy difficulty configures 5 rounds');

  // Verify adaptive round capping for smaller question pools (e.g. France with 4 questions)
  const frSession = createSteSession(`fr_${testPlayerId}`, 'France', 'FR', 'easy', 'country-challenge');
  assert(frSession.maxRounds === 4, `Adaptive rounds caps to available pool for France (${frSession.maxRounds} rounds)`);

  // Allocate questions across all rounds and test uniqueness
  const servedQuestionIds: string[] = [];
  let noRepeats = true;

  for (let round = 1; round <= session.maxRounds; round++) {
    const qRes = allocateNextQuestion(session.sessionId);
    assert(qRes.success && !!qRes.response, `Question allocated for round ${round}`);
    if (!qRes.response) break;

    const q = qRes.response;
    if (servedQuestionIds.includes(q.questionId)) {
      noRepeats = false;
    }
    servedQuestionIds.push(q.questionId);

    // Verify question has NO answer coordinates exposed to client
    const hasCoordinates = 'coordinates' in q;
    assert(!hasCoordinates, `Round ${round}: Answer coordinates NOT sent to client (server-authoritative)`);

    // Submit a mock answer (close to target)
    const actualQ = getQuestionById(q.questionId);
    if (!actualQ) {
      assert(false, `Found question ${q.questionId} in bank`);
      continue;
    }

    // Guess slightly offset (within 5-10km)
    const guessLat = actualQ.coordinates.lat + 0.02;
    const guessLng = actualQ.coordinates.lng + 0.02;

    const ansRes = processAnswer(
      session.sessionId,
      q.questionId,
      guessLat,
      guessLng,
      2000 // 2 seconds
    );

    assert(ansRes.success && !!ansRes.response, `Round ${round}: Processed answer successfully`);
    if (ansRes.response) {
      assert(ansRes.response.correctCoordinates.lat === actualQ.coordinates.lat, `Round ${round}: Actual answer coordinates returned after guess`);
      assert(ansRes.response.scoring.totalScore > 0, `Round ${round}: Score awarded (${ansRes.response.scoring.totalScore} pts)`);
      assert(ansRes.response.correct, `Round ${round}: Recognized as correct hit within tolerance`);

      if (round === session.maxRounds) {
        assert(ansRes.response.gameComplete, 'Final round marks game as complete');
        const summary = getGameSummary(session.sessionId);
        assert(!!summary, 'Final round returns comprehensive game summary');
        assert(summary?.questionsAnswered === 5, 'Summary reports 5 rounds answered');
        assert((summary?.totalScore ?? 0) > 0, `Summary reports non-zero score (${summary?.totalScore})`);
      }
    }
  }

  assert(noRepeats, `0 duplicate questions across all ${servedQuestionIds.length} rounds`);

  // Start a second session immediately for the same player in the same country
  // Should NOT repeat any questions already seen in session 1 if eligible pool has more
  const session2 = createSteSession(testPlayerId, 'United States', 'US', 'easy', 'country-challenge');
  const q2Res = allocateNextQuestion(session2.sessionId);
  if (q2Res.response && getQuestionCountForCountry('US') > servedQuestionIds.length) {
    const isRepeatedAcrossSessions = servedQuestionIds.includes(q2Res.response.questionId);
    assert(!isRepeatedAcrossSessions, 'Anti-repeat guarantees questions not repeated across sessions for same player');
  }

  // ----------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------
  console.log('\n=============================================================');
  console.log(` 🏁 Result: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
  console.log('=============================================================\n');

  if (passed === total) {
    console.log('🎉 ALL STOP THE EARTH VERIFICATION CHECKS PASSED!\n');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
