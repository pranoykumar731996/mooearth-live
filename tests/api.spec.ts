import { test, expect } from '@playwright/test';

test.describe('MooEarth Live - Backend REST APIs Integration Tests', () => {

  test('should GET /api/events return live feed events list', async ({ request }) => {
    const response = await request.get('/api/events');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('events');
    expect(Array.isArray(data.events)).toBeTruthy();
  });

  test('should POST /api/translate return correct localization translations or feature disabled error', async ({ request }) => {
    const response = await request.post('/api/translate', {
      data: {
        articleId: 'test-planetary-brief-id',
        targetLanguage: 'es',
        title: 'Planetary Seismic Telemetry',
        summary: 'MooEarth Live is an interactive 3D globe platform.',
        fullContent: 'MooEarth Live provides real-time planetary events and meteorological telemetry.'
      }
    });
    
    // The route will either return 200 (success) or 403 (translation feature disabled via config flag)
    expect([200, 403]).toContain(response.status());
    
    const data = await response.json();
    if (response.status() === 200) {
      expect(data).toHaveProperty('translatedTitle');
    } else {
      expect(data).toHaveProperty('error');
    }
  });

  test('should GET /api/article validate and summarize planetary event contents', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'seismic-test-001',
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000m99z',
      title: 'M 6.1 Earthquake - Near Coast of Honshu, Japan',
      summary: 'A magnitude 6.1 seismic dislocation occurred at 24 km depth.',
      country: 'Japan',
      category: 'seismic',
      lat: '35.689',
      lng: '139.692'
    });
    
    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('article');
    expect(data.article).toHaveProperty('keyFacts');
    expect(data.article.category).toBe('seismic');
    expect(data).toHaveProperty('debug');
  });
});
