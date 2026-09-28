/**
 * scripts/test-anti-repeat.ts
 *
 * Comprehensive Multi-Round Anti-Repetition Test Suite for MooEarth Live.
 * Simulates multiple rounds across all game modes for the same user and verifies:
 * 1. 0 duplicate question IDs across rounds
 * 2. 0 semantic duplicate questions (concept + country collisions)
 * 3. Immediate registration of seen questions
 * 4. Infinite Earth Game Engine anti-repeat fingerprinting
 * 5. Flag Challenge & Capital Challenge cross-round uniqueness
 * 6. Beat the Clock high-throughput uniqueness
 * 7. Seeded Daily Earth replay diversity
 */

import {
  recordSeenQuestion,
  isQuestionSeen,
  areQuestionsDuplicate,
  getSeenQuestions,
  clearSeenQuestions,
  migrateGuestSeenQuestions,
  extractConceptSignature,
  type QuestionBrief
} from '../src/services/questionHistoryService';

import {
  generateQuestions,
  generateFlagQuestion,
  generateCapitalQuestion,
  getDailyEarthQuestion
} from '../src/data/questions';

import { initializeGameEngine } from '../src/engines/game/init';
import { createSession, generateNextChallenge } from '../src/engines/game/ChallengeGenerator';
import type { EarthQuestion } from '../src/types';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (failureDetails) console.error(`     Reason: ${failureDetails}`);
    process.exitCode = 1;
  }
}

async function runAntiRepeatTests() {
  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log(' 🔁 MooEarth Live Anti-Repeat Multi-Round Verification Suite');
  console.log('═════════════════════════════════════════════════════════════════\n');

  const testUser = `player_test_${Date.now()}`;
  clearSeenQuestions(testUser);

  // ─────────────────────────────────────────────────────────────
  // 1. Semantic Deduplication & Concept Signature Verification
  // ─────────────────────────────────────────────────────────────
  console.log('📋 Suite 1: Semantic Deduplication & Concept Signatures');
  {
    const q1: QuestionBrief = {
      id: 'q1',
      question: 'What is the capital of France?',
      country: 'France',
      category: 'geography'
    };
    const q2: QuestionBrief = {
      id: 'q2',
      question: 'Which of the following cities serves as the capital of France?',
      country: 'France',
      category: 'geography'
    };
    const q3: QuestionBrief = {
      id: 'q3',
      question: 'What is the official currency used in France?',
      country: 'France',
      category: 'geography'
    };
    const q4: QuestionBrief = {
      id: 'q4',
      question: 'What is the capital of Germany?',
      country: 'Germany',
      category: 'geography'
    };

    assert(areQuestionsDuplicate(q1, q2), 'Detects semantic paraphrases for the same country and concept (Capital of France)');
    assert(!areQuestionsDuplicate(q1, q3), 'Allows distinct concepts for the same country (Capital vs Currency of France)');
    assert(!areQuestionsDuplicate(q1, q4), 'Allows the same concept for different countries (Capital of France vs Germany)');
    assert(extractConceptSignature(q1.question) === 'capital', 'Extracts "capital" concept signature accurately');
    assert(extractConceptSignature(q3.question) === 'currency', 'Extracts "currency" concept signature accurately');
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Procedural Question Generation: Single Country Depth Test
  // ─────────────────────────────────────────────────────────────
  console.log('\n📋 Suite 2: Procedural Question Pool Depth (Japan - 3 Consecutive Rounds)');
  {
    const seenIds = new Set<string>();
    const seenBriefs: QuestionBrief[] = [];
    const country = 'Japan';
    const rounds = 3;
    const questionsPerRound = 4;
    let roundDuplicates = 0;

    for (let round = 1; round <= rounds; round++) {
      const generated = generateQuestions(
        country,
        'geography',
        questionsPerRound,
        Array.from(seenIds),
        seenBriefs
      );

      for (const q of generated) {
        if (seenIds.has(q.id)) {
          roundDuplicates++;
        }
        for (const prev of seenBriefs) {
          if (areQuestionsDuplicate(q, prev)) {
            roundDuplicates++;
          }
        }
        seenIds.add(q.id);
        seenBriefs.push({
          id: q.id,
          question: q.question,
          country: q.country,
          category: q.category
        });
        recordSeenQuestion(testUser, q);
      }
    }

    assert(roundDuplicates === 0, `0 duplicate questions across ${rounds} rounds for ${country}`, `Found ${roundDuplicates} duplicates`);
    assert(seenBriefs.length === rounds * questionsPerRound, `Generated full quota (${rounds * questionsPerRound} unique questions) without repeating`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Beat the Clock Multi-Round High-Throughput Test
  // ─────────────────────────────────────────────────────────────
  console.log('\n📋 Suite 3: Beat the Clock High-Throughput (3 Rounds x 15 Questions = 45 Questions)');
  {
    const seenIds = new Set<string>();
    const seenBriefs: QuestionBrief[] = [];
    const sampleCountries = ['Brazil', 'Canada', 'Egypt', 'India', 'Italy', 'Australia', 'Kenya', 'Mexico', 'Norway', 'Thailand'];
    const totalRounds = 3;
    const qPerRound = 15;
    let btcDuplicates = 0;

    for (let round = 1; round <= totalRounds; round++) {
      for (let i = 0; i < qPerRound; i++) {
        const country = sampleCountries[(round * qPerRound + i) % sampleCountries.length];
        const batch = generateQuestions(country, 'geography', 1, Array.from(seenIds), seenBriefs);
        
        const q = batch.length > 0 
          ? batch[0] 
          : generateCapitalQuestion('medium', Array.from(seenIds), country, seenBriefs);

        if (seenIds.has(q.id)) {
          btcDuplicates++;
        }
        if (seenBriefs.some(b => areQuestionsDuplicate(q, b))) {
          btcDuplicates++;
        }

        seenIds.add(q.id);
        seenBriefs.push({ id: q.id, question: q.question, country: q.country, category: q.category });
        recordSeenQuestion(testUser, q);
      }
    }

    assert(btcDuplicates === 0, `0 question repeats across 3 rounds of Beat the Clock (45 total served)`, `Duplicates found: ${btcDuplicates}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Flag Challenge Multi-Round Uniqueness Test
  // ─────────────────────────────────────────────────────────────
  console.log('\n📋 Suite 4: Flag Challenge Multi-Round Uniqueness (4 Rounds x 10 Flags = 40 Questions)');
  {
    const seenIds = new Set<string>();
    const seenBriefs: QuestionBrief[] = [];
    const flagRounds = 4;
    const flagsPerRound = 10;
    let flagDuplicates = 0;

    for (let r = 1; r <= flagRounds; r++) {
      for (let i = 0; i < flagsPerRound; i++) {
        const q = generateFlagQuestion('medium', Array.from(seenIds), undefined, seenBriefs);
        if (seenIds.has(q.id)) {
          flagDuplicates++;
        }
        if (seenBriefs.some(b => areQuestionsDuplicate(q, b))) {
          flagDuplicates++;
        }

        seenIds.add(q.id);
        seenBriefs.push({ id: q.id, question: q.question, country: q.country, category: q.category });
        recordSeenQuestion(testUser, q);
      }
    }

    assert(flagDuplicates === 0, `0 flag question repeats across ${flagRounds} consecutive rounds`, `Duplicates found: ${flagDuplicates}`);
    assert(seenBriefs.length === flagRounds * flagsPerRound, `Served ${flagRounds * flagsPerRound} distinct countries' flags`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Capital Challenge Multi-Round Uniqueness Test
  // ─────────────────────────────────────────────────────────────
  console.log('\n📋 Suite 5: Capital Challenge Multi-Round Uniqueness (4 Rounds x 10 Capitals = 40 Questions)');
  {
    const seenIds = new Set<string>();
    const seenBriefs: QuestionBrief[] = [];
    const capRounds = 4;
    const capsPerRound = 10;
    let capDuplicates = 0;

    for (let r = 1; r <= capRounds; r++) {
      for (let i = 0; i < capsPerRound; i++) {
        const q = generateCapitalQuestion('medium', Array.from(seenIds), undefined, seenBriefs);
        if (seenIds.has(q.id)) {
          capDuplicates++;
        }
        if (seenBriefs.some(b => areQuestionsDuplicate(q, b))) {
          capDuplicates++;
        }

        seenIds.add(q.id);
        seenBriefs.push({ id: q.id, question: q.question, country: q.country, category: q.category });
        recordSeenQuestion(testUser, q);
      }
    }

    assert(capDuplicates === 0, `0 capital question repeats across ${capRounds} consecutive rounds`, `Duplicates found: ${capDuplicates}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Seeded Daily Earth Challenge Replay Diversity
  // ─────────────────────────────────────────────────────────────
  console.log('\n📋 Suite 6: Daily Earth Challenge Replay Round Rotation');
  {
    const today = 'Mon Sep 28 2026';
    const round0 = [0, 1, 2, 3, 4].map(idx => getDailyEarthQuestion(today, idx, 0));
    const round1 = [0, 1, 2, 3, 4].map(idx => getDailyEarthQuestion(today, idx, 1));
    const round2 = [0, 1, 2, 3, 4].map(idx => getDailyEarthQuestion(today, idx, 2));

    const round0Ids = new Set(round0.map(q => q.id));
    const round1Matches = round1.filter(q => round0Ids.has(q.id));
    const round2Matches = round2.filter(q => round0Ids.has(q.id));

    assert(round1Matches.length === 0, 'Daily Earth replay Round 1 has 0 overlapping questions with Round 0');
    assert(round2Matches.length === 0, 'Daily Earth replay Round 2 has 0 overlapping questions with Round 0');
  }

  // ─────────────────────────────────────────────────────────────
  // 7. Infinite Earth Game Engine Anti-Repeat Verification
  // ─────────────────────────────────────────────────────────────
  console.log('\n📋 Suite 7: Infinite Earth Game Engine Anti-Repeat Fingerprints');
  {
    initializeGameEngine();
    const session = createSession('endless');
    const seenFingerprints: string[] = [];
    let engineDuplicates = 0;

    for (let round = 1; round <= 10; round++) {
      const challenge = await generateNextChallenge(session, {
        excludeFingerprints: [...seenFingerprints],
      });

      if (challenge) {
        console.log(`     Round ${round}: [${challenge.engine}] ${challenge.id} - FP: ${challenge.fingerprint}`);
        if (seenFingerprints.includes(challenge.fingerprint)) {
          engineDuplicates++;
        }
        seenFingerprints.push(challenge.fingerprint);
      }
    }

    assert(engineDuplicates === 0, '0 duplicate challenge fingerprints across 10 Infinite Earth rounds', `Duplicates: ${engineDuplicates}`);
    assert(seenFingerprints.length === 10, 'Generated 10 valid non-repeating engine challenges');
  }

  // ─────────────────────────────────────────────────────────────
  // 8. Guest-to-User History Migration
  // ─────────────────────────────────────────────────────────────
  console.log('\n📋 Suite 8: Guest-to-User Seen Questions Migration');
  {
    clearSeenQuestions('Guest');
    const guestQ: EarthQuestion = {
      id: 'guest_q_unique_1',
      question: 'Where is Mount Fuji located?',
      choices: ['Japan', 'China', 'Korea', 'Vietnam'],
      correctIndex: 0,
      funFact: 'Mount Fuji is an active stratovolcano.',
      difficulty: 'easy',
      category: 'geography',
      country: 'Japan'
    };
    recordSeenQuestion('Guest', guestQ);
    assert(isQuestionSeen('Guest', guestQ), 'Guest seen question is registered correctly');

    const signedInUser = `user_${Date.now()}`;
    migrateGuestSeenQuestions(signedInUser);
    assert(isQuestionSeen(signedInUser, guestQ), 'Guest question history migrated seamlessly to authenticated user');
  }

  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log(` 🏁 RESULT: ${passedChecks}/${totalChecks} Checks Passed (${Math.round((passedChecks / totalChecks) * 100)}%)`);
  console.log('═════════════════════════════════════════════════════════════════\n');

  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
}

runAntiRepeatTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
