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
        articleId: 'test-article-id',
        targetLanguage: 'es',
        title: 'MooEarth Live News',
        summary: 'MooEarth is the premium interactive 3D globe.',
        fullContent: 'MooEarth Live provides live updates, news summaries, and group standings for the World Cup.'
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

  test('should GET /api/article validate and summarize news contents', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'test-article-id',
      url: 'https://news.google.com/rss/articles/CBMi',
      title: 'Test Article Title',
      summary: 'Test summary detail'
    });
    
    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('article');
    expect(data).toHaveProperty('debug');
  });
});
