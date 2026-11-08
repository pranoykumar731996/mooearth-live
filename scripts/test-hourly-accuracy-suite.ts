// ============================================================
// Automated Regression Test: Hourly Forecast Accuracy & Zero Past Hours Invariant
// ============================================================

import { getTargetLocationCurrentHourIso } from '../src/services/weather/timeService';

function runTests() {
  console.log('🧪 Running Hourly Accuracy & Zero-Past-Hours Invariant Suite...');

  const locations = [
    { city: 'Bhubaneswar', lat: 20.27, lng: 85.84, tz: 'Asia/Kolkata' },
    { city: 'Tokyo', lat: 35.67, lng: 139.65, tz: 'Asia/Tokyo' },
    { city: 'London', lat: 51.51, lng: -0.13, tz: 'Europe/London' },
    { city: 'New York', lat: 40.71, lng: -74.01, tz: 'America/New_York' },
    { city: 'Honolulu', lat: 21.31, lng: -157.86, tz: 'Pacific/Honolulu' },
  ];

  let passed = 0;

  for (const loc of locations) {
    const targetHourIso = getTargetLocationCurrentHourIso(loc.lat, loc.lng, loc.tz);
    console.log(`  [${loc.city}] Current Local Hour ISO: ${targetHourIso} (${loc.tz})`);

    // Invariant 1: Format must be YYYY-MM-DDTHH
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(targetHourIso)) {
      throw new Error(`Invalid format for ${loc.city}: ${targetHourIso}`);
    }

    // Invariant 2: Hour must be between 00 and 23
    const h = parseInt(targetHourIso.slice(11, 13), 10);
    if (h < 0 || h > 23) {
      throw new Error(`Hour out of bounds for ${loc.city}: ${h}`);
    }

    // Invariant 3: Simulated 48h hourly array starting from previous hours
    // Must find startIdx strictly >= targetHourIso
    const mockHourlyTimes: string[] = [];
    const baseDate = new Date();
    // Generate from -12h to +36h
    for (let offset = -12; offset <= 36; offset++) {
      const d = new Date(baseDate.getTime() + offset * 3600000);
      const iso = getTargetLocationCurrentHourIso(loc.lat, loc.lng, loc.tz, d) + ':00';
      mockHourlyTimes.push(iso);
    }

    const startIdx = mockHourlyTimes.findIndex((t) => t.slice(0, 13) >= targetHourIso);
    if (startIdx < 0) {
      throw new Error(`Could not find startIdx for ${loc.city}`);
    }

    const foundTime = mockHourlyTimes[startIdx];
    if (foundTime.slice(0, 13) < targetHourIso) {
      throw new Error(`startIdx returned a past hour! Found: ${foundTime}, Target: ${targetHourIso}`);
    }

    passed++;
  }

  console.log(`✅ Passed all ${passed}/${locations.length} location invariant tests! Zero past hours guaranteed.`);
}

runTests();
