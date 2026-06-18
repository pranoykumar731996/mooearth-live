const fs = require('fs');
const path = require('path');

const geojsonPath = path.resolve(__dirname, '..', 'public', 'data', 'countries-110m.json');
const metadataPath = path.resolve(__dirname, '..', 'src', 'data', 'questions', 'countryMetadata.ts');

if (!fs.existsSync(geojsonPath)) {
  console.error('GeoJSON not found');
  process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
const countryNames = geojson.features.map(f => f.properties.name || f.properties.NAME);

console.log(`Found ${countryNames.length} countries in GeoJSON.`);

// Let's read countryMetadata.ts and find the keys
const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
// Find all keys in COUNTRY_METADATA
const keys = [];
const regex = /'([^']+)': \{/g;
let match;
while ((match = regex.exec(metadataContent)) !== null) {
  keys.push(match[1]);
}

console.log(`Found ${keys.length} countries in COUNTRY_METADATA.`);

const missingInMetadata = [];
for (const name of countryNames) {
  const normalized = name.toLowerCase().trim();
  const found = keys.some(k => k.toLowerCase().trim() === normalized);
  if (!found) {
    missingInMetadata.push(name);
  }
}

console.log(`Missing in metadata (${missingInMetadata.length} countries):`);
console.log(JSON.stringify(missingInMetadata, null, 2));
