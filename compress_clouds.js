const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function main() {
  const src = path.join(process.cwd(), 'public', 'textures', 'clouds.png');
  const dest = path.join(process.cwd(), 'public', 'textures', 'clouds-optimized.png');
  
  if (!fs.existsSync(src)) {
    console.error('Source clouds.png does not exist at:', src);
    return;
  }
  
  console.log('Optimizing clouds.png...');
  try {
    const image = await Jimp.read(src);
    await image
      .resize({ w: 1024, h: 512 })
      .write(dest);
      
    const srcSize = fs.statSync(src).size;
    const destSize = fs.statSync(dest).size;
    console.log(`Original Size: ${(srcSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Optimized Size: ${(destSize / 1024).toFixed(1)} KB`);
    console.log(`Saved successfully to ${dest}`);
  } catch (err) {
    console.error('Optimization failed:', err);
  }
}
main();
