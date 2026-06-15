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

console.log(`Auditing ${countries.length} countries...\n`);

const report = [];

for (const country of countries) {
  const countryDir = path.join(questionsDir, country);
  const files = fs.readdirSync(countryDir).filter(f => f.endsWith('.json'));
  
  const categoriesCount = {};
  let totalQuestions = 0;
  
  for (const file of files) {
    const category = file.replace('.json', '');
    try {
      const content = JSON.parse(fs.readFileSync(path.join(countryDir, file), 'utf-8'));
      if (Array.isArray(content)) {
        categoriesCount[category] = content.length;
        if (category !== 'mixed') {
          totalQuestions += content.length;
        }
      } else {
        categoriesCount[category] = 0;
      }
    } catch (e) {
      categoriesCount[category] = 'ERROR';
    }
  }
  
  report.push({
    country,
    categories: categoriesCount,
    totalQuestions,
    filesCount: files.length
  });
}

// Print summary
console.log('--- DATABASE AUDIT SUMMARY ---');
report.forEach(r => {
  console.log(`${r.country}:`);
  Object.entries(r.categories).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count}`);
  });
  console.log(`  - Total Curated/Cached Questions: ${r.totalQuestions}\n`);
});

// Save report to file
fs.writeFileSync(
  path.join(__dirname, '..', 'database_audit_report.json'),
  JSON.stringify(report, null, 2),
  'utf-8'
);
console.log('Audit completed. Saved report to database_audit_report.json');
