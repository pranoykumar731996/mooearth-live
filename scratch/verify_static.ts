
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
