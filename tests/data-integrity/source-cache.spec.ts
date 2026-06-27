import { test, expect } from '@playwright/test';

test.describe('Suite 8 & 9 — Source Verification & Cache Validation', () => {

  test('should match source URL in debug output to requested URL', async ({ request }) => {
    const testUrl = 'https://www.bbc.com/news/world';
    const params = new URLSearchParams({
      id: 'source-verify-001',
      url: testUrl,
      title: 'BBC World News Report',
      summary: 'Latest world news coverage from BBC.',
      country: 'United Kingdom',
      category: 'breaking',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.debug.sourceUrl).toBe(testUrl);
  });

  test('should have contentRetrieved as boolean in debug output', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'content-flag-001',
      url: 'https://www.reuters.com/business',
      title: 'Reuters Business Analysis',
      summary: 'In-depth business analysis from Reuters.',
      country: 'Global',
      category: 'business',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(typeof data.debug.contentRetrieved).toBe('boolean');
  });

  test('should return cacheHit=true on second identical request', async ({ request }) => {
    const now = new Date().toISOString();
    const params = new URLSearchParams({
      id: 'cache-test-001',
      url: 'https://www.aljazeera.com/news',
      title: 'Al Jazeera Coverage of Middle East Developments',
      summary: 'Comprehensive coverage of regional developments from Al Jazeera.',
      country: 'Qatar',
      category: 'breaking',
      publishedAt: now,
    });

    // First request — should not be cached
    const response1 = await request.get(`/api/article?${params.toString()}`);
    expect(response1.ok()).toBeTruthy();
    const data1 = await response1.json();
    expect(data1.debug.cacheHit).toBe(false);

    // Second request with identical params — should be cached
    const response2 = await request.get(`/api/article?${params.toString()}`);
    expect(response2.ok()).toBeTruthy();
    const data2 = await response2.json();
    expect(data2.debug.cacheHit).toBe(true);
  });

  test('should not share cache between different article IDs', async ({ request }) => {
    const now = new Date().toISOString();
    const suffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const params1 = new URLSearchParams({
      id: `cache-a-${suffix}`,
      url: 'https://www.cnn.com/world',
      title: 'CNN World News Report A',
      summary: 'Summary for article A.',
      country: 'United States',
      category: 'breaking',
      publishedAt: now,
    });

    const params2 = new URLSearchParams({
      id: `cache-b-${suffix}`,
      url: 'https://www.cnn.com/world',
      title: 'CNN World News Report B',
      summary: 'Summary for article B — different article.',
      country: 'United States',
      category: 'breaking',
      publishedAt: now,
    });

    // Request article A
    const response1 = await request.get(`/api/article?${params1.toString()}`);
    expect(response1.ok()).toBeTruthy();

    // Request article B — should not hit cache of A
    const response2 = await request.get(`/api/article?${params2.toString()}`);
    expect(response2.ok()).toBeTruthy();
    const data2 = await response2.json();
    expect(data2.debug.cacheHit).toBe(false);
  });

  test('should not share cache between different timestamps', async ({ request }) => {
    const testId = `cache-ts-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const params1 = new URLSearchParams({
      id: testId,
      url: 'https://www.dw.com/en',
      title: 'DW News Update',
      summary: 'German public broadcaster report.',
      country: 'Germany',
      category: 'breaking',
      publishedAt: '2026-06-25T10:00:00Z',
    });

    // First request with timestamp T1
    const response1 = await request.get(`/api/article?${params1.toString()}`);
    expect(response1.ok()).toBeTruthy();

    // Second request with different timestamp T2
    const params2 = new URLSearchParams({
      id: testId,
      url: 'https://www.dw.com/en',
      title: 'DW News Update',
      summary: 'German public broadcaster report.',
      country: 'Germany',
      category: 'breaking',
      publishedAt: '2026-06-25T12:00:00Z',
    });

    const response2 = await request.get(`/api/article?${params2.toString()}`);
    expect(response2.ok()).toBeTruthy();
    const data2 = await response2.json();
    // Different publishedAt means different cache key — should not be cached
    expect(data2.debug.cacheHit).toBe(false);
  });

  test('should flag invalid URLs with validationPassed=false', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'invalid-url-source-001',
      url: 'ftp://invalid-protocol.example',
      title: 'Article From Invalid Source',
      summary: 'Testing invalid source detection.',
      country: 'Global',
      category: 'breaking',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    // Invalid URLs should fail validation
    expect(data.debug.validationPassed).toBe(false);
  });

  test('should include summaryGenerated flag in debug output', async ({ request }) => {
    const params = new URLSearchParams({
      id: 'summary-flag-001',
      url: 'https://apnews.com/article/test',
      title: 'AP News Test Article',
      summary: 'Testing the summary generation flag in debug metadata.',
      country: 'United States',
      category: 'breaking',
      publishedAt: new Date().toISOString(),
    });

    const response = await request.get(`/api/article?${params.toString()}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(typeof data.debug.summaryGenerated).toBe('boolean');
  });
});
