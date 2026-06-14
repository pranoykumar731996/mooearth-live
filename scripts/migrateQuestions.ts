import * as fs from 'fs';
import * as path from 'path';
import { CURATED_QUESTIONS } from '../src/data/questions/curated';
import { GENERATED_QUESTIONS } from '../src/data/questions/generatedPool';
import { getCanonicalCountryName } from '../src/data/questions/index';
import { EarthQuestion } from '../src/types';

const OUTPUT_DIR = path.resolve(process.cwd(), 'src/data/questions/questions');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function migrate() {
  console.log('Starting question migration to folder-based database...');
  ensureDir(OUTPUT_DIR);

  // Combine and deduplicate
  const seenIds = new Set<string>();
  const allQuestions: EarthQuestion[] = [];

  for (const q of [...CURATED_QUESTIONS, ...GENERATED_QUESTIONS]) {
    if (!seenIds.has(q.id)) {
      seenIds.add(q.id);
      allQuestions.push(q);
    }
  }

  console.log(`Loaded ${allQuestions.length} unique questions.`);

  // Group by country
  const countryGroups: Record<string, EarthQuestion[]> = {};
  for (const q of allQuestions) {
    const canonical = getCanonicalCountryName(q.country);
    if (!countryGroups[canonical]) {
      countryGroups[canonical] = [];
    }
    countryGroups[canonical].push(q);
  }

  const countries = Object.keys(countryGroups);
  console.log(`Found questions for ${countries.length} countries.`);

  for (const country of countries) {
    const countryDir = path.join(OUTPUT_DIR, country);
    ensureDir(countryDir);

    const questions = countryGroups[country];

    const geo: EarthQuestion[] = [];
    const sports: EarthQuestion[] = [];
    const history: EarthQuestion[] = [];
    const science: EarthQuestion[] = [];
    const currentAffairs: EarthQuestion[] = [];
    const mixed: EarthQuestion[] = [];

    for (const q of questions) {
      // Map category
      const cat = q.category;
      if (cat === 'geography') {
        geo.push(q);
      } else if (cat === 'sports') {
        sports.push(q);
      } else if (cat === 'history') {
        history.push(q);
      } else if (cat === 'science' || cat === 'technology' || cat === 'space') {
        science.push(q);
      } else if (cat === 'politics' || cat === 'current-affairs') {
        currentAffairs.push(q);
      } else {
        // nature, culture, trivia, weather, etc.
        mixed.push(q);
      }
    }

    // mixed category should intelligently mix everything for that country
    const allForCountry = [
      ...geo,
      ...sports,
      ...history,
      ...science,
      ...currentAffairs,
      ...mixed
    ];

    // Remove duplicates from mixed
    const seenMixedText = new Set<string>();
    const finalMixed: EarthQuestion[] = [];
    for (const q of allForCountry) {
      const textKey = q.question.toLowerCase().trim();
      if (!seenMixedText.has(textKey)) {
        seenMixedText.add(textKey);
        finalMixed.push(q);
      }
    }

    // Write category files
    fs.writeFileSync(path.join(countryDir, 'geography.json'), JSON.stringify(geo, null, 2), 'utf-8');
    fs.writeFileSync(path.join(countryDir, 'sports.json'), JSON.stringify(sports, null, 2), 'utf-8');
    fs.writeFileSync(path.join(countryDir, 'history.json'), JSON.stringify(history, null, 2), 'utf-8');
    fs.writeFileSync(path.join(countryDir, 'science.json'), JSON.stringify(science, null, 2), 'utf-8');
    fs.writeFileSync(path.join(countryDir, 'current-affairs.json'), JSON.stringify(currentAffairs, null, 2), 'utf-8');
    fs.writeFileSync(path.join(countryDir, 'mixed.json'), JSON.stringify(finalMixed, null, 2), 'utf-8');

    console.log(`Migrated ${questions.length} questions for: ${country}`);
  }

  console.log('Migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
