const fs = require('fs');
const path = require('path');

async function download(url, destName) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const dir = path.join(process.cwd(), 'public', 'textures');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(dir, destName), buffer);
    console.log(`Saved ${url} -> public/textures/${destName} (${(buffer.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`Failed to download ${url}:`, err);
  }
}

async function main() {
  await Promise.all([
    download('https://unpkg.com/three-globe/example/img/earth-night.jpg', 'globe-night.jpg'),
    download('https://unpkg.com/three-globe/example/img/earth-topology.png', 'globe-topology.png')
  ]);
}
main();
