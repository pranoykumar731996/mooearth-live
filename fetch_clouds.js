const fs = require('fs');
const path = require('path');

async function download() {
  const url = 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/clouds/clouds.png';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const size = res.headers.get('content-length');
    console.log('GitHub clouds.png size:', size ? (size / 1024).toFixed(1) + ' KB' : 'unknown');
    
    // Ensure dir exists
    const dir = path.join(process.cwd(), 'public', 'textures');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(dir, 'clouds.png'), buffer);
    console.log('Successfully saved to public/textures/clouds.png');
  } catch (err) {
    console.error('Download failed:', err);
  }
}
download();
