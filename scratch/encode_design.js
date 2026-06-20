const fs = require('fs');
const path = require('path');

try {
  const mdPath = path.join(__dirname, 'DESIGN.md');
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  const base64Content = Buffer.from(mdContent).toString('base64');
  
  const outputPath = path.join(__dirname, 'design_base64.txt');
  fs.writeFileSync(outputPath, base64Content, 'utf8');
  console.log('Successfully base64 encoded DESIGN.md to design_base64.txt!');
} catch (err) {
  console.error('Error base64 encoding DESIGN.md:', err);
}
