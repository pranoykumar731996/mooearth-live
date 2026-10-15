import { test, expect } from '@playwright/test';

test.describe('MooEarth Live — Sentry Regression & API Health Sentinel', () => {

  test('should GET /api/game/health return engine status and active providers', async ({ request }) => {
    const response = await request.get('/api/game/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status.toLowerCase()).toBe('healthy');
    expect(data.providers).toBeDefined();
    expect(Array.isArray(data.providers)).toBe(true);
    const providerEngines = data.providers.map((p: any) => p.engine);
    expect(providerEngines).toContain('geography');
    expect(providerEngines).toContain('weather');
    expect(providerEngines).toContain('time');
    expect(providerEngines).toContain('earth_events');
    expect(providerEngines).toContain('ai_mission');
    expect(data.challengeTypes.total).toBeGreaterThanOrEqual(16);
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
    const activeSessionId = data.sessionId || data.session?.sessionId;
    expect(activeSessionId).toBeDefined();
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
    const resData = await chalRes.json();
    const challenge = resData.challenge;
    const sessionId = resData.sessionId || resData.session?.sessionId;

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
