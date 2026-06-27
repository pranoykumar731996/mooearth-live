import { test, expect } from '@playwright/test';

test.describe('Suite 1 — Article Data Integrity', () => {

  test('should return structured article with all required fields', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'integrity-test-001',
      url: 'https://www.bbc.com/news',
      title: 'Global Climate Summit Opens in Geneva',
      summary: 'World leaders gather in Geneva to discuss ambitious carbon emission targets.',
      country: 'Switzerland',
      category: 'breaking',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('article');
    expect(data).toHaveProperty('debug');

    const article = data.article;
    // Required fields must exist
    expect(article).toHaveProperty('id');
    expect(article).toHaveProperty('title');
    expect(article).toHaveProperty('source');
    expect(article).toHaveProperty('publishedAt');
    expect(article).toHaveProperty('country');
    expect(article).toHaveProperty('category');
    expect(article).toHaveProperty('aiSummary');
    expect(article).toHaveProperty('fullContent');
    expect(article).toHaveProperty('keyFacts');

    // Title must not be empty
    expect(article.title.length).toBeGreaterThan(0);
    // aiSummary must not be empty
    expect(article.aiSummary.length).toBeGreaterThan(0);
  });

  test('should preserve article ID in debug metadata', async ({ request }) => {
    const testId = `integrity-id-${Date.now()}`;
    const params = new URLSearchParams({
      id: testId,
      url: 'https://www.reuters.com/world',
      title: 'International Trade Negotiations Resume',
      summary: 'Key trading nations restart discussions on tariff reductions.',
      country: 'Global',
      category: 'business',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.debug.articleId).toBe(testId);
  });

  test('should match source URL in debug metadata', async ({ request }) => {
    const testUrl = 'https://www.nytimes.com/2026/06/25/world/example-article';
    const params = new URLSearchParams({
      id: 'url-check-001',
      url: testUrl,
      title: 'New York Times Breaking Report',
      summary: 'A major news event from the New York Times.',
      country: 'United States',
      category: 'breaking',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.debug.sourceUrl).toBe(testUrl);
  });

  test('should preserve country and category fields from request', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'country-cat-001',
      url: 'https://www.japantimes.co.jp/news/',
      title: 'Tokyo Hosts International Tech Conference',
      summary: 'Technology leaders from around the world meet in Tokyo for annual summit.',
      country: 'Japan',
      category: 'technology',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.article.country).toBe('Japan');
    expect(data.article.category).toBe('technology');
  });

  test('should reject request with missing title', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'missing-title-001',
      url: 'https://example.com',
      summary: 'Some summary',
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle invalid URL gracefully without crashing', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'bad-url-001',
      url: 'not-a-valid-url',
      title: 'Test Article With Bad URL',
      summary: 'This article has an invalid URL.',
      country: 'Global',
      category: 'breaking',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.debug.validationPassed).toBe(false);
  });

  test('should never return an aiSummary that is just the title repeated', async ({ request }) => {
    const title = 'Earthquake Strikes Southern Italy';
    const params = new URLSearchParams({
      id: 'no-title-summary-001',
      url: 'https://www.ansa.it/english/',
      title,
      summary: 'A 5.2 magnitude earthquake was felt across southern Italy early this morning.',
      country: 'Italy',
      category: 'breaking',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    // Summary should not be identical to the title
    if (data.article.aiSummary !== 'Summary unavailable. Please open the original article.') {
      expect(data.article.aiSummary.toLowerCase()).not.toBe(title.toLowerCase());
    }
  });

  test('should have debug.publisher field that is not empty', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'publisher-check-001',
      url: 'https://www.theguardian.com/world',
      title: 'Guardian Exclusive Report on Climate Policy',
      summary: 'In-depth analysis of new carbon reduction targets announced at the summit.',
      country: 'United Kingdom',
      category: 'breaking',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.debug.publisher).toBeTruthy();
    expect(data.debug.publisher.length).toBeGreaterThan(0);
  });
});
