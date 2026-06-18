const fs = require('fs');
const path = require('path');

const questionsDir = path.resolve(__dirname, '..', 'src', 'data', 'questions', 'questions');

if (!fs.existsSync(questionsDir)) {
  console.error('Questions directory not found at:', questionsDir);
  process.exit(1);
}

const countries = fs.readdirSync(questionsDir).filter(f => {
  return fs.statSync(path.join(questionsDir, f)).isDirectory();
});

console.log(`Checking ${countries.length} country folders for mismatched country fields...`);

let mismatchCount = 0;

for (const country of countries) {
  const countryDir = path.join(questionsDir, country);
  const files = fs.readdirSync(countryDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(countryDir, file), 'utf-8'));
      if (Array.isArray(content)) {
        content.forEach((q, idx) => {
          if (q.country !== country) {
            console.log(`Mismatch found in "${country}/${file}" at index ${idx}: Question country is "${q.country}" but folder is "${country}"`);
            mismatchCount++;
          }
        });
      }
    } catch (e) {
      console.error(`Error reading ${country}/${file}:`, e.message);
    }
  }
}

console.log(`Check complete. Total mismatches found: ${mismatchCount}`);
if (mismatchCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
