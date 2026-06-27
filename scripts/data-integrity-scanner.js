/**
 * MooEarth Live — Mock / Fake Data Detector (Suite 6)
 * 
 * Scans the src/ directory for mock data, placeholders, hardcoded matches,
 * fake statistics, and test records that should not appear in production.
 * 
 * Usage: node scripts/data-integrity-scanner.js
 * Output: test-results/mock-data-audit.json
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'test-results');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'mock-data-audit.json');

// Patterns to scan for
const PATTERNS = [
  { regex: /\bdemo\s*(?:events?|data|match|score|result)/gi, label: 'Demo Data Reference', severity: 'warning' },
  { regex: /\bmock\s*(?:data|event|match|score|article|news)/gi, label: 'Mock Data Reference', severity: 'error' },
  { regex: /\bplaceholder\s+(?:data|content|text|image|article|news|event)/gi, label: 'Placeholder Data Reference', severity: 'error' },
  { regex: /\bsample\s*(?:data|event|match|article)/gi, label: 'Sample Data Reference', severity: 'warning' },
  { regex: /\bfake\s*(?:data|score|news|event|statistic)/gi, label: 'Fake Data Reference', severity: 'error' },
  { regex: /\bdummy\s*(?:data|event|match|article)/gi, label: 'Dummy Data Reference', severity: 'error' },
  { regex: /\bhardcoded?\s*(?:match|score|standing|result|fixture)/gi, label: 'Hardcoded Match Data', severity: 'warning' },
  { regex: /\btest\s*record/gi, label: 'Test Record Reference', severity: 'warning' },
  { regex: /\bsimulat(?:e|ed|ion)\s*(?:mode|data|score|match)/gi, label: 'Simulation Mode Reference', severity: 'warning' },
];

// Lines to exclude from scanning (HTML attributes, CSS classes, import/comment lines)
const EXCLUDE_LINE_PATTERNS = [
  /placeholder="/i,               // HTML placeholder= attributes
  /placeholder-/i,               // CSS placeholder- classes (e.g., placeholder-white/20)
  /globe-night-placeholder/i,    // Texture asset filenames
  /clouds-placeholder/i,         // Texture asset filenames
  /\{\/\*.*Placeholder.*\*\/\}/i, // JSX comments like {/* Animated Placeholder */}
];

// Files/directories to exclude from scanning
const EXCLUDE_DIRS = ['node_modules', '.next', '.git', 'test-results', 'playwright-report', 'scripts'];
const EXCLUDE_FILES = ['data-integrity-scanner.js'];

// Known acceptable files (fallback data that is acceptable with justification)
const ACCEPTABLE_FILES = {
  'src/data/events.ts': 'Fallback demo events used when Google News RSS is unavailable — acceptable as degraded mode',
  'src/services/news.ts': 'References to generateLocalFallbackEvents — returns empty array, no fake data generated',
  'src/app/admin/health/page.tsx': 'Health dashboard page — references "mock data" in UI labels for detection display',
  'src/app/admin/analytics/page.tsx': 'Analytics dashboard — simulation mode label for admin-only display',
};

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(path.resolve(__dirname, '..'), fullPath);
    
    // Skip excluded directories
    if (EXCLUDE_DIRS.some(ex => relativePath.includes(ex))) continue;
    if (EXCLUDE_FILES.includes(file)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (/\.(ts|tsx|js|jsx|json)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/');
  const findings = [];

  for (const pattern of PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments in test files
      if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) continue;
      // Skip lines matching exclusion patterns (HTML attributes, CSS classes, etc.)
      if (EXCLUDE_LINE_PATTERNS.some(ep => ep.test(line))) continue;

      const matches = line.match(pattern.regex);
      if (matches) {
        const isAcceptable = ACCEPTABLE_FILES[relativePath];
        findings.push({
          file: relativePath,
          line: i + 1,
          pattern: pattern.label,
          severity: isAcceptable ? 'acceptable' : pattern.severity,
          match: matches[0],
          context: line.trim().substring(0, 120),
          justification: isAcceptable || null,
        });
      }
    }
  }

  return findings;
}

function generateReport() {
  console.log('🔍 MooEarth Live — Mock/Fake Data Scanner');
  console.log('==========================================');
  console.log(`Scanning: ${SRC_DIR}`);
  console.log('');

  const files = getAllFiles(SRC_DIR);
  console.log(`Found ${files.length} source files to scan.`);

  const allFindings = [];
  for (const file of files) {
    const findings = scanFile(file);
    allFindings.push(...findings);
  }

  // Categorize findings
  const errors = allFindings.filter(f => f.severity === 'error');
  const warnings = allFindings.filter(f => f.severity === 'warning');
  const acceptable = allFindings.filter(f => f.severity === 'acceptable');

  // Print summary
  console.log('');
  console.log('📊 Scan Results:');
  console.log(`   ❌ Errors:     ${errors.length}`);
  console.log(`   ⚠️  Warnings:   ${warnings.length}`);
  console.log(`   ✅ Acceptable: ${acceptable.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('❌ ERRORS (must be fixed before production):');
    for (const e of errors) {
      console.log(`   ${e.file}:${e.line} — ${e.pattern}: "${e.match}"`);
      console.log(`     Context: ${e.context}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (review recommended):');
    for (const w of warnings) {
      console.log(`   ${w.file}:${w.line} — ${w.pattern}: "${w.match}"`);
      console.log(`     Context: ${w.context}`);
    }
    console.log('');
  }

  if (acceptable.length > 0) {
    console.log('✅ ACCEPTABLE (justified fallback data):');
    for (const a of acceptable) {
      console.log(`   ${a.file}:${a.line} — ${a.pattern}: "${a.match}"`);
      console.log(`     Justification: ${a.justification}`);
    }
    console.log('');
  }

  // Calculate production score
  const errorWeight = 10;
  const warningWeight = 2;
  const totalPenalty = (errors.length * errorWeight) + (warnings.length * warningWeight);
  const rawScore = Math.max(0, 100 - totalPenalty);

  const report = {
    timestamp: new Date().toISOString(),
    scanner: 'MooEarth Live Mock/Fake Data Detector v1.0',
    filesScanned: files.length,
    summary: {
      errors: errors.length,
      warnings: warnings.length,
      acceptable: acceptable.length,
      total: allFindings.length,
      productionScore: rawScore,
      verdict: errors.length === 0 ? 'PASS' : 'FAIL',
    },
    findings: allFindings,
    acceptableJustifications: ACCEPTABLE_FILES,
  };

  // Write report
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));

  console.log('==========================================');
  console.log(`📁 Report saved to: ${OUTPUT_FILE}`);
  console.log(`🏆 Production Score: ${rawScore}/100`);
  console.log(`📋 Verdict: ${report.summary.verdict}`);
  console.log('');

  // Exit with error code if there are critical errors
  if (errors.length > 0) {
    console.log('⛔ CRITICAL: Fix all errors before deploying to production!');
    process.exit(1);
  } else {
    console.log('✅ No critical mock/fake data detected in production code.');
    process.exit(0);
  }
}

generateReport();
