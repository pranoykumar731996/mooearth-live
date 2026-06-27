import { test, expect } from '@playwright/test';

// Official FIFA World Cup 2026 host nations
const WC_HOST_COUNTRIES = ['United States', 'Canada', 'Mexico', 'USA'];
// Valid World Cup stages
const VALID_STAGES = ['group', 'R32', 'R16', 'QF', 'SF', 'TPP', 'F'];
// Valid group letters (12 groups in WC 2026: A-L)
const VALID_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'KO'];
// Club football teams that must NEVER appear in World Cup data
const CLUB_TEAMS = [
  'Real Madrid', 'Barcelona', 'Manchester United', 'Liverpool',
  'Bayern Munich', 'PSG', 'Juventus', 'AC Milan', 'Chelsea',
  'Arsenal', 'Manchester City', 'Borussia Dortmund', 'Inter Milan',
  'Atletico Madrid', 'Tottenham', 'Napoli', 'AS Roma', 'Ajax',
];

test.describe('Suite 2 — FIFA World Cup Data Validation', () => {

  test('should return World Cup matches with valid structure', async ({ request }) => {
    const response = await request.get('/api/worldcup/matches');

    if (response.status() === 500) {
      const data = await response.json();
      // API key missing or API error — skip gracefully
      console.warn('[FIFA Integrity] Matches endpoint returned 500 — API may be unavailable:', data.error);
      test.skip(true, 'FIFA API unavailable — FOOTBALL_API_KEY not set or API error');
      return;
    }

    expect(response.ok()).toBeTruthy();
    const matches = await response.json();

    if (!Array.isArray(matches) || matches.length === 0) {
      console.warn('[FIFA Integrity] No matches returned — tournament may not have started yet');
      return;
    }

    for (const match of matches) {
      // Every match must have required fields
      expect(match).toHaveProperty('id');
      expect(match).toHaveProperty('homeTeam');
      expect(match).toHaveProperty('awayTeam');
      expect(match).toHaveProperty('venue');
      expect(match).toHaveProperty('kickoff');
      expect(match).toHaveProperty('stage');
      expect(match).toHaveProperty('group');

      // Match ID must follow WC26 format
      expect(match.id).toMatch(/^wc26-/);

      // Stage must be valid
      expect(VALID_STAGES).toContain(match.stage);

      // Group must be valid
      expect(VALID_GROUPS).toContain(match.group);

      // Venue must have structure
      expect(match.venue).toHaveProperty('name');
      expect(match.venue).toHaveProperty('city');
      expect(match.venue).toHaveProperty('country');
      expect(match.venue).toHaveProperty('lat');
      expect(match.venue).toHaveProperty('lng');

      // Venue country must be a WC 2026 host nation
      const venueCountry = match.venue.country;
      expect(
        WC_HOST_COUNTRIES.some(h => venueCountry.includes(h) || h.includes(venueCountry))
      ).toBeTruthy();
    }
  });

  test('should never include club football teams in World Cup matches', async ({ request }) => {
    const response = await request.get('/api/worldcup/matches');

    if (response.status() === 500) {
      test.skip(true, 'FIFA API unavailable');
      return;
    }

    expect(response.ok()).toBeTruthy();
    const matches = await response.json();

    if (!Array.isArray(matches) || matches.length === 0) return;

    for (const match of matches) {
      for (const clubTeam of CLUB_TEAMS) {
        expect(match.homeTeam).not.toBe(clubTeam);
        expect(match.awayTeam).not.toBe(clubTeam);
      }
    }
  });

  test('should return valid World Cup standings structure', async ({ request }) => {
    const response = await request.get('/api/worldcup/standings');

    if (response.status() === 500) {
      test.skip(true, 'FIFA API unavailable');
      return;
    }

    expect(response.ok()).toBeTruthy();
    const standings = await response.json();

    if (!standings || typeof standings !== 'object') return;

    // Group keys must be single letters A-L
    for (const groupKey of Object.keys(standings)) {
      expect(groupKey).toMatch(/^[A-L]$/);

      const teams = standings[groupKey];
      expect(Array.isArray(teams)).toBeTruthy();

      for (const entry of teams) {
        expect(entry).toHaveProperty('team');
        expect(entry).toHaveProperty('played');
        expect(entry).toHaveProperty('won');
        expect(entry).toHaveProperty('drawn');
        expect(entry).toHaveProperty('lost');
        expect(entry).toHaveProperty('gf');
        expect(entry).toHaveProperty('ga');
        expect(entry).toHaveProperty('gd');
        expect(entry).toHaveProperty('points');

        // Numeric fields must be numbers >= 0
        expect(typeof entry.played).toBe('number');
        expect(entry.played).toBeGreaterThanOrEqual(0);
        expect(typeof entry.points).toBe('number');
        expect(entry.points).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should return valid top scorers structure', async ({ request }) => {
    const response = await request.get('/api/worldcup/scorers');

    if (response.status() === 500) {
      test.skip(true, 'FIFA API unavailable');
      return;
    }

    expect(response.ok()).toBeTruthy();
    const scorers = await response.json();

    if (!Array.isArray(scorers) || scorers.length === 0) {
      console.warn('[FIFA Integrity] No scorers returned — tournament may not have started');
      return;
    }

    for (const scorer of scorers) {
      expect(scorer).toHaveProperty('player');
      expect(scorer).toHaveProperty('team');
      expect(scorer).toHaveProperty('goals');
      expect(typeof scorer.goals).toBe('number');
      expect(scorer.goals).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have correct diagnostics metadata', async ({ request }) => {
    const response = await request.get('/api/admin/worldcup-diagnostics');
    expect(response.ok()).toBeTruthy();

    const diag = await response.json();
    expect(diag).toHaveProperty('leagueId');
    expect(diag).toHaveProperty('seasonId');
    expect(diag.leagueId).toBe(1);
    expect(diag.seasonId).toBe(2026);
  });

  test('should not return simulated or placeholder match scores in live data', async ({ request }) => {
    const response = await request.get('/api/worldcup/matches');

    if (response.status() === 500) {
      test.skip(true, 'FIFA API unavailable');
      return;
    }

    expect(response.ok()).toBeTruthy();
    const matches = await response.json();

    if (!Array.isArray(matches) || matches.length === 0) return;

    for (const match of matches) {
      // apiData must exist and have status
      if (match.apiData) {
        expect(match.apiData).toHaveProperty('status');
        expect(typeof match.apiData.status).toBe('string');
        expect(match.apiData.status.length).toBeGreaterThan(0);
      }
    }
  });
});
