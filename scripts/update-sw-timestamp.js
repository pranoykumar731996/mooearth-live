const fs = require('fs');
const path = require('path');

const swPath = path.resolve(process.cwd(), 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  let content = fs.readFileSync(swPath, 'utf8');
  
  // Find or append the build timestamp comment
  const timestampComment = `// Build Timestamp: ${new Date().toISOString()}`;
  const regex = /\/\/ Build Timestamp: .*/;
  
  if (regex.test(content)) {
    content = content.replace(regex, timestampComment);
  } else {
    content += `\n\n${timestampComment}\n`;
  }
  
  fs.writeFileSync(swPath, content, 'utf8');
  console.log('[SW Timestamp] Updated sw.js build timestamp:', timestampComment);
} else {
  console.error('[SW Timestamp] sw.js not found at:', swPath);
}
