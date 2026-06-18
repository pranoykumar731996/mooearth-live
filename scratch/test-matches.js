const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'data', 'countries-110m.json');

const COUNTRY_COORDINATES = {
  'spain': { lat: 40.4168, lng: -3.7038, country: 'Spain', city: 'Madrid' },
  'brazil': { lat: -15.7938, lng: -47.8827, country: 'Brazil', city: 'Brasília' },
  'argentina': { lat: -34.6037, lng: -58.3816, country: 'Argentina', city: 'Buenos Aires' },
  'united kingdom': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', city: 'London' },
  'england': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', city: 'London' },
  'germany': { lat: 52.5200, lng: 13.4050, country: 'Germany', city: 'Berlin' },
  'france': { lat: 48.8566, lng: 2.3522, country: 'France', city: 'Paris' },
  'italy': { lat: 41.9028, lng: 12.4964, country: 'Italy', city: 'Rome' },
  'portugal': { lat: 38.7223, lng: -9.1393, country: 'Portugal', city: 'Lisbon' },
  'netherlands': { lat: 52.3676, lng: 4.9041, country: 'Netherlands', city: 'Amsterdam' },
  'belgium': { lat: 50.8503, lng: 4.3517, country: 'Belgium', city: 'Brussels' },
  'croatia': { lat: 45.8150, lng: 15.9819, country: 'Croatia', city: 'Zagreb' },
  'uruguay': { lat: -34.9011, lng: -56.1645, country: 'Uruguay', city: 'Montevideo' },
  'colombia': { lat: 4.7110, lng: -74.0721, country: 'Colombia', city: 'Bogotá' },
  'mexico': { lat: 19.4326, lng: -99.1332, country: 'Mexico', city: 'Mexico City' },
  'united states': { lat: 38.9072, lng: -77.0369, country: 'United States', city: 'Washington D.C.' },
  'usa': { lat: 38.9072, lng: -77.0369, country: 'United States', city: 'Washington D.C.' },
  'us': { lat: 38.9072, lng: -77.0369, country: 'United States', city: 'Washington D.C.' },
  'japan': { lat: 35.6762, lng: 139.6503, country: 'Japan', city: 'Tokyo' },
  'south korea': { lat: 37.5665, lng: 126.9780, country: 'South Korea', city: 'Seoul' },
  'morocco': { lat: 34.0209, lng: -6.8416, country: 'Morocco', city: 'Rabat' },
  'senegal': { lat: 14.7167, lng: -17.4677, country: 'Senegal', city: 'Dakar' },
  'canada': { lat: 45.4215, lng: -75.6972, country: 'Canada', city: 'Ottawa' },
  'australia': { lat: -35.2809, lng: 149.1300, country: 'Australia', city: 'Canberra' },
  'china': { lat: 39.9042, lng: 116.4074, country: 'China', city: 'Beijing' },
  'india': { lat: 28.6139, lng: 77.2090, country: 'India', city: 'New Delhi' },
};

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(content);
  const countries = parsed.features;
  
  countries.forEach((feat) => {
    const name = feat.properties.NAME;
    const normCountry = name.toLowerCase().trim();
    const geoKeys = Object.keys(COUNTRY_COORDINATES);
    const matchedKey = geoKeys.find(k => normCountry.includes(k) || k.includes(normCountry));
    if (matchedKey) {
      console.log(`Country: "${name}" matched to key: "${matchedKey}"`);
    }
  });
} catch (e) {
  console.error(e);
}
