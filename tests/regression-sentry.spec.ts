import { test, expect } from '@playwright/test';

test.describe('MooEarth Live — Sentry Regression & API Health Sentinel', () => {

  test('should GET /api/game/health return engine status and active providers', async ({ request }) => {
    const response = await request.get('/api/game/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('HEALTHY');
    expect(data.providers).toBeDefined();
    expect(data.providers.geography).toBe('ONLINE');
    expect(data.providers.weather).toBe('ONLINE');
    expect(data.providers.news).toBe('ONLINE');
    expect(data.providers.time).toBe('ONLINE');
    expect(data.providers.earth_events).toBe('ONLINE');
    expect(data.providers.ai_mission).toBe('ONLINE');
    expect(data.registeredChallengeTypes).toBeGreaterThanOrEqual(16);
  });

  test('should POST /api/game/challenge generate a valid challenge without schema regressions', async ({ request }) => {
    const response = await request.post('/api/game/challenge', {
      data: {
        mode: 'endless',
        engine: 'geography',
        type: 'GEO_GLOBE_HUNT',
        difficulty: 'easy',
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.challenge).toBeDefined();
    expect(data.challenge.id).toBeDefined();
    expect(data.challenge.question).toBeDefined();
    expect(data.challenge.points).toBeGreaterThan(0);
    expect(data.sessionId).toBeDefined();
  });

  test('should POST /api/game/answer validate response and calculate points correctly', async ({ request }) => {
    // 1. Get challenge
    const chalRes = await request.post('/api/game/challenge', {
      data: {
        mode: 'endless',
        engine: 'geography',
        type: 'GEO_GLOBE_HUNT',
        difficulty: 'easy',
      },
    });
    const { challenge, sessionId } = await chalRes.json();

    // 2. Submit answer
    const ansRes = await request.post('/api/game/answer', {
      data: {
        sessionId,
        response: {
          challengeId: challenge.id,
          selectedCountry: challenge.targetCountry || 'France',
          responseTimeMs: 3000,
          timestamp: Date.now(),
        },
      },
    });

    expect(ansRes.ok()).toBeTruthy();
    expect(ansRes.status()).toBe(200);

    const data = await ansRes.json();
    expect(data.validation).toBeDefined();
    expect(data.scoring).toBeDefined();
    expect(typeof data.scoring.totalPoints).toBe('number');
  });

  test('should POST /api/article/quiz return valid multiple choice comprehension questions', async ({ request }) => {
    const response = await request.post('/api/article/quiz', {
      data: {
        title: 'Global Renewable Energy Reaches Record Peak Across Continents',
        summary: 'Wind and solar production surged across Europe and Asia reaching historic high output.',
        country: 'Global',
        source: 'Reuters',
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.questions)).toBeTruthy();
    expect(data.questions.length).toBeGreaterThanOrEqual(1);

    const firstQ = data.questions[0];
    expect(firstQ.question).toBeDefined();
    expect(Array.isArray(firstQ.choices)).toBeTruthy();
    expect(firstQ.choices.length).toBe(4);
    expect(firstQ.correctIndex).toBeGreaterThanOrEqual(0);
    expect(firstQ.correctIndex).toBeLessThan(4);
  });
});
