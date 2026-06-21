import * as fs from 'fs';
import * as path from 'path';
import { EarthQuestion } from '../src/types';
import { DEDUPLICATED_STATIC_QUESTIONS, calculateLevel, generateCapitalQuestion, generateFlagQuestion, getDailyEarthQuestion, getWorldCupQuestion } from '../src/data/questions';
import { COUNTRY_METADATA } from '../src/data/questions/countryMetadata';

// Resolve artifact directory from env or use default path
const artifactDir = 'C:\\Users\\prano\\.gemini\\antigravity-ide\\brain\\7b7c1f16-8153-43c8-a182-d43c91f5f2c0';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

// Helper to recursively collect all JSON files in questions directory
function collectQuestionsFromFolderDb(dir: string): EarthQuestion[] {
  const list: EarthQuestion[] = [];
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      list.push(...collectQuestionsFromFolderDb(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'mixed.json') {
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          list.push(...parsed);
        }
      } catch (e) {
        console.error(`Error reading/parsing file: ${fullPath}`, e);
      }
    }
  }
  return list;
}

const folderDbQuestions = collectQuestionsFromFolderDb(path.resolve(__dirname, '../src/data/questions/questions'));
const worldCupQuestions: EarthQuestion[] = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../src/data/questions/worldcup.json'), 'utf-8')
);

// All database questions
const allQuestions = [...DEDUPLICATED_STATIC_QUESTIONS, ...folderDbQuestions, ...worldCupQuestions];

console.log(`Loaded ${allQuestions.length} total questions for auditing:`);
console.log(`- Curated/Static Pool: ${DEDUPLICATED_STATIC_QUESTIONS.length}`);
console.log(`- Folder DB: ${folderDbQuestions.length}`);
console.log(`- World Cup Pool: ${worldCupQuestions.length}`);

// -------------------------------------------------------------
// REPORT 1: INVALID QUESTIONS
// -------------------------------------------------------------
const invalidQuestionsReport: string[] = [];
invalidQuestionsReport.push('# Report 1: Invalid Questions Audit');
invalidQuestionsReport.push('| ID | Country | Category | Issues |');
invalidQuestionsReport.push('| --- | --- | --- | --- |');

let invalidCount = 0;
for (const q of allQuestions) {
  const issues: string[] = [];
  if (!q.id) issues.push('Missing ID');
  if (!q.country) issues.push('Missing Country');
  if (!q.category) issues.push('Missing Category');
  if (!q.difficulty) issues.push('Missing Difficulty');
  if (!q.question || q.question.trim() === '') issues.push('Empty Question Text');
  
  if (!q.choices || !Array.isArray(q.choices)) {
    issues.push('Missing or invalid choices array');
  } else {
    if (q.choices.length !== 4) {
      issues.push(`Choices count is ${q.choices.length} (expected 4)`);
    }
    const emptyChoices = q.choices.filter(c => !c || c.trim() === '');
    if (emptyChoices.length > 0) {
      issues.push(`Contains ${emptyChoices.length} empty choices`);
    }
    const uniqueChoices = new Set(q.choices.map(c => c.trim().toLowerCase()));
    if (uniqueChoices.size !== q.choices.length) {
      issues.push('Contains duplicate choices');
    }
  }

  if (q.correctIndex === undefined || q.correctIndex === null) {
    issues.push('Missing correctIndex');
  } else {
    if (q.correctIndex < 0 || q.correctIndex > 3) {
      issues.push(`correctIndex is ${q.correctIndex} (expected 0-3)`);
    }
  }

  if (issues.length > 0) {
    invalidCount++;
    invalidQuestionsReport.push(`| \`${q.id || 'N/A'}\` | ${q.country || 'N/A'} | ${q.category || 'N/A'} | ${issues.join(', ')} |`);
  }
}

invalidQuestionsReport.push(`\n**Total Invalid Questions Found:** ${invalidCount}`);
fs.writeFileSync(path.join(artifactDir, 'report_invalid_questions.md'), invalidQuestionsReport.join('\n'), 'utf-8');


// -------------------------------------------------------------
// REPORT 2: DUPLICATES
// -------------------------------------------------------------
const duplicatesReport: string[] = [];
duplicatesReport.push('# Report 2: Duplicates Audit');
duplicatesReport.push('\n### Duplicate IDs');
duplicatesReport.push('| ID | Occurrences | Locations / Countries |');
duplicatesReport.push('| --- | --- | --- |');

const idCounts: Record<string, { count: number; countries: string[] }> = {};
const textCounts: Record<string, { count: number; id: string; country: string }[]> = {};

for (const q of allQuestions) {
  if (q.id) {
    if (!idCounts[q.id]) idCounts[q.id] = { count: 0, countries: [] };
    idCounts[q.id].count++;
    if (!idCounts[q.id].countries.includes(q.country)) idCounts[q.id].countries.push(q.country);
  }

  if (q.question) {
    const normText = q.question.trim().toLowerCase();
    if (!textCounts[normText]) textCounts[normText] = [];
    textCounts[normText].push({ count: 1, id: q.id, country: q.country });
  }
}

let duplicateIdsCount = 0;
for (const [id, meta] of Object.entries(idCounts)) {
  if (meta.count > 1) {
    duplicateIdsCount++;
    duplicatesReport.push(`| \`${id}\` | ${meta.count} | ${meta.countries.join(', ')} |`);
  }
}

duplicatesReport.push(`\n**Total Duplicate IDs:** ${duplicateIdsCount}`);

duplicatesReport.push('\n### Duplicate Question Text (Same text in different questions)');
duplicatesReport.push('| Question Text | Occurrences | IDs and Countries |');
duplicatesReport.push('| --- | --- | --- |');

let duplicateTextCount = 0;
for (const [text, list] of Object.entries(textCounts)) {
  if (list.length > 1) {
    duplicateTextCount++;
    const idsString = list.map(item => `\`${item.id}\` (${item.country})`).join(', ');
    const displayQuestion = text.length > 80 ? text.slice(0, 80) + '...' : text;
    duplicatesReport.push(`| "${displayQuestion}" | ${list.length} | ${idsString} |`);
  }
}

duplicatesReport.push(`\n**Total Duplicate Question Texts:** ${duplicateTextCount}`);
fs.writeFileSync(path.join(artifactDir, 'report_duplicates.md'), duplicatesReport.join('\n'), 'utf-8');


// -------------------------------------------------------------
// REPORT 3: COUNTRY MAPPING
// -------------------------------------------------------------
const countryMappingReport: string[] = [];
countryMappingReport.push('# Report 3: Country Mapping Integrity Audit');
countryMappingReport.push('| ID | Question Text | Mapped Country | Mismatch Details / Suspected Country |');
countryMappingReport.push('| --- | --- | --- | --- |');

let countryMismatchCount = 0;

// Extract names of all countries from COUNTRY_METADATA to search in question text
const allCountryNames = Object.keys(COUNTRY_METADATA).map(name => name.trim());

for (const q of allQuestions) {
  if (!q.question || !q.country || q.country.toLowerCase() === 'global') continue;

  const textLower = q.question.toLowerCase();
  const countryLower = q.country.toLowerCase();

  // Find if any other country name is present in the question text, but the mapped country is not.
  // We check for exact word bounds.
  let mentionedOtherCountry: string | null = null;
  
  for (const cName of allCountryNames) {
    const cNameLower = cName.toLowerCase();
    if (cNameLower === countryLower) continue;

    // Check with word boundary
    const regex = new RegExp(`\\b${cNameLower}\\b`, 'i');
    if (regex.test(textLower)) {
      // Make sure the mapped country is NOT mentioned
      const mappedRegex = new RegExp(`\\b${countryLower}\\b`, 'i');
      if (!mappedRegex.test(textLower)) {
        mentionedOtherCountry = cName;
        break;
      }
    }
  }

  if (mentionedOtherCountry) {
    countryMismatchCount++;
    const displayQuestion = q.question.length > 100 ? q.question.slice(0, 100) + '...' : q.question;
    countryMappingReport.push(
      `| \`${q.id}\` | "${displayQuestion}" | **${q.country}** | Mentions **${mentionedOtherCountry}** but mapped to ${q.country} |`
    );
  }
}

countryMappingReport.push(`\n**Total Country Mismatches:** ${countryMismatchCount}`);
fs.writeFileSync(path.join(artifactDir, 'report_country_mapping.md'), countryMappingReport.join('\n'), 'utf-8');


// -------------------------------------------------------------
// REPORT 4: WRONG ANSWERS
// -------------------------------------------------------------
const wrongAnswersReport: string[] = [];
wrongAnswersReport.push('# Report 4: Wrong Answer and Trivia Fact Integrity Audit');
wrongAnswersReport.push('| ID | Question | Correct Choice | Fun Fact / Explanation | Review Analysis |');
wrongAnswersReport.push('| --- | --- | --- | --- | --- |');

let wrongAnswersCount = 0;

for (const q of allQuestions) {
  const reviews: string[] = [];
  
  if (!q.funFact || q.funFact.trim() === '') {
    reviews.push('Fun Fact is missing or empty');
  } else {
    // If it's a capital question, check that the capital matches country metadata
    if (q.question.toLowerCase().includes('capital city of')) {
      const meta = COUNTRY_METADATA[q.country];
      if (meta && meta.capital) {
        const correctChoice = q.choices[q.correctIndex];
        if (correctChoice !== meta.capital) {
          reviews.push(`Capital mismatch: choices correct answer is "${correctChoice}", but metadata capital is "${meta.capital}"`);
        }
      }
    }
  }

  if (reviews.length > 0) {
    wrongAnswersCount++;
    const displayQuestion = q.question.length > 80 ? q.question.slice(0, 80) + '...' : q.question;
    const correctOption = q.choices && q.choices[q.correctIndex] ? q.choices[q.correctIndex] : 'N/A';
    wrongAnswersReport.push(
      `| \`${q.id}\` | "${displayQuestion}" | ${correctOption} | ${q.funFact || '*None*'} | ${reviews.join('; ')} |`
    );
  }
}

wrongAnswersReport.push(`\n**Total Wrong Answer / Fact Anomalies:** ${wrongAnswersCount}`);
fs.writeFileSync(path.join(artifactDir, 'report_wrong_answers.md'), wrongAnswersReport.join('\n'), 'utf-8');


// -------------------------------------------------------------
// REPORT 5: XP SYSTEM
// -------------------------------------------------------------
const xpReport: string[] = [];
xpReport.push('# Report 5: XP System and Level Progression Validation');
xpReport.push('\n### Progression Monotonicity Validation');
xpReport.push('| Player XP | Calculated Level | Status |');
xpReport.push('| --- | --- | --- |');

const testXps = [0, 100, 499, 500, 1000, 1499, 1500, 2000, 2999, 3000, 4999, 5000, 7999, 8000, 11999, 12000, 16999, 17000, 22999, 23000, 29999, 30000, 40000, 100000];
let lastLevel = 0;
let xpValid = true;

for (const xp of testXps) {
  const level = calculateLevel(xp);
  let status = 'Pass';
  if (level < lastLevel) {
    status = 'Fail (Non-monotonic)';
    xpValid = false;
  }
  xpReport.push(`| ${xp.toLocaleString()} XP | Level ${level} | ${status} |`);
  lastLevel = level;
}

xpReport.push(`\n**XP System Validated:** ${xpValid ? '✅ Passed (All levels increase monotonically)' : '❌ Failed'}`);
fs.writeFileSync(path.join(artifactDir, 'report_xp_system.md'), xpReport.join('\n'), 'utf-8');


// -------------------------------------------------------------
// REPORT 6: DAILY CHALLENGE
// -------------------------------------------------------------
const dailyReport: string[] = [];
dailyReport.push('# Report 6: Daily Challenge Seeding and Layout Audits');
dailyReport.push('\n### Seeded Daily Question Layout (Next 3 Days)');
dailyReport.push('| Date String | Q Index | Target Country | Question text | Choice A | Choice B | Choice C | Choice D | Correct Choice |');
dailyReport.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');

const dates = ['Mon Jun 22 2026', 'Tue Jun 23 2026', 'Wed Jun 24 2026'];
let dailyValid = true;

for (const date of dates) {
  for (let idx = 0; idx < 5; idx++) {
    // Generate twice to check determinism
    const q1 = getDailyEarthQuestion(date, idx);
    const q2 = getDailyEarthQuestion(date, idx);

    if (q1.id !== q2.id || q1.question !== q2.question || q1.choices.join(',') !== q2.choices.join(',') || q1.correctIndex !== q2.correctIndex) {
      dailyValid = false;
    }

    dailyReport.push(
      `| ${date} | #${idx + 1} | ${q1.country} | "${q1.question}" | ${q1.choices[0]} | ${q1.choices[1]} | ${q1.choices[2]} | ${q1.choices[3]} | ${q1.choices[q1.correctIndex]} |`
    );
  }
}

dailyReport.push(`\n**Daily Determinism Test:** ${dailyValid ? '✅ Passed (Seeded random matches identically on repeated runs)' : '❌ Failed'}`);
fs.writeFileSync(path.join(artifactDir, 'report_daily_challenge.md'), dailyReport.join('\n'), 'utf-8');


// -------------------------------------------------------------
// REPORT 7: GAME MODE VALIDATION
// -------------------------------------------------------------
const gameModeReport: string[] = [];
gameModeReport.push('# Report 7: Game Mode Generators Verification');
gameModeReport.push('\n### Flag Question Generator Test');
gameModeReport.push('| Difficulty | Question ID | Target Country | Question text | Choices | Correct Choice |');
gameModeReport.push('| --- | --- | --- | --- | --- | --- |');

const diffs = ['easy', 'medium', 'hard'] as const;
for (const diff of diffs) {
  const q = generateFlagQuestion(diff, []);
  gameModeReport.push(
    `| ${diff} | \`${q.id}\` | ${q.country} | "${q.question.replace(/\n/g, ' ')}" | ${q.choices.join(', ')} | ${q.choices[q.correctIndex]} |`
  );
}

gameModeReport.push('\n### Capital Question Generator Test');
gameModeReport.push('| Difficulty | Question ID | Target Country | Question text | Choices | Correct Choice |');
gameModeReport.push('| --- | --- | --- | --- | --- | --- |');

for (const diff of diffs) {
  const q = generateCapitalQuestion(diff, []);
  gameModeReport.push(
    `| ${diff} | \`${q.id}\` | ${q.country} | "${q.question}" | ${q.choices.join(', ')} | ${q.choices[q.correctIndex]} |`
  );
}

gameModeReport.push('\n### World Cup Trivia Generator Test (5 Calls)');
gameModeReport.push('| Call Index | Question ID | Country | Question | Choices | Correct Choice |');
gameModeReport.push('| --- | --- | --- | --- | --- | --- |');

const wcAnsweredIds: string[] = [];
for (let i = 0; i < 5; i++) {
  const q = getWorldCupQuestion(wcAnsweredIds);
  wcAnsweredIds.push(q.id);
  gameModeReport.push(
    `| #${i + 1} | \`${q.id}\` | ${q.country} | "${q.question}" | ${q.choices.join(', ')} | ${q.choices[q.correctIndex]} |`
  );
}

fs.writeFileSync(path.join(artifactDir, 'report_game_mode_validation.md'), gameModeReport.join('\n'), 'utf-8');

console.log('All 7 validation reports have been successfully generated in the artifacts directory.');
