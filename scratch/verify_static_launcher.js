const fs = require('fs');
const path = require('path');

// Let's resolve the files: curated.ts and generatedPool.ts
// Wait, since these are TypeScript files, we can read them as text and parse or write a small typescript executor.
// Or we can just read them and extract the JSON-like data!
// Actually, it's easier to run a small tsx script using `npx tsx` that directly imports them and checks!
// Let's write a tsx script in scratch.

const runVerify = () => {
  const code = `
import { CURATED_QUESTIONS } from '../src/data/questions/curated';
import { GENERATED_QUESTIONS } from '../src/data/questions/generatedPool';

console.log("Curated Questions count:", CURATED_QUESTIONS.length);
console.log("Generated Questions count:", GENERATED_QUESTIONS.length);

let curatedMismatches = 0;
let generatedMismatches = 0;

// Since these questions are static, let's check if there are any empty questions or mismatching fields.
CURATED_QUESTIONS.forEach((q, idx) => {
  if (!q.id || !q.country || !q.category || !q.question || !q.choices || q.correctIndex === undefined) {
    console.log("Curated question has missing fields at index", idx, q);
    curatedMismatches++;
  }
});

GENERATED_QUESTIONS.forEach((q, idx) => {
  if (!q.id || !q.country || !q.category || !q.question || !q.choices || q.correctIndex === undefined) {
    console.log("Generated question has missing fields at index", idx, q);
    generatedMismatches++;
  }
});

console.log("Curated mismatches/missing:", curatedMismatches);
console.log("Generated mismatches/missing:", generatedMismatches);
`;
  return code;
};

fs.writeFileSync(path.resolve(__dirname, 'verify_static.ts'), runVerify(), 'utf-8');
console.log("verify_static.ts written");
