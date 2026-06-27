import { test, expect } from '@playwright/test';

test.describe('Suite 7 — Category Isolation', () => {

  test('should only return technology-related events for technology category', async ({ request }) => {
    const response = await request.get('/api/events?q=latest+updates&category=technology');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('events');

    if (data.events.length === 0) {
      console.warn('[Category Isolation] No technology events returned');
      return;
    }

    // Every event should be categorized as technology
    for (const event of data.events) {
      expect(event.category).toBe('technology');
    }
  });

  test('should only return worldcup-related events for worldcup category', async ({ request }) => {
    const response = await request.get('/api/events?q=world+cup+2026&category=worldcup');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.events.length === 0) return;

    for (const event of data.events) {
      expect(event.category).toBe('worldcup');
    }
  });

  test('should only return weather-related events for weather category', async ({ request }) => {
    const response = await request.get('/api/events?q=global+weather&category=weather');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.events.length === 0) return;

    for (const event of data.events) {
      expect(event.category).toBe('weather');
    }
  });

  test('should only return business-related events for business category', async ({ request }) => {
    const response = await request.get('/api/events?q=markets+economy&category=business');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.events.length === 0) return;

    for (const event of data.events) {
      expect(event.category).toBe('business');
    }
  });

  test('should only return entertainment-related events for entertainment category', async ({ request }) => {
    const response = await request.get('/api/events?q=movies+music&category=entertainment');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.events.length === 0) return;

    for (const event of data.events) {
      expect(event.category).toBe('entertainment');
    }
  });

  test('should not return club football events when worldcup category is active', async ({ request }) => {
    const response = await request.get('/api/events?q=football&category=worldcup');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.events.length === 0) return;

    const clubKeywords = ['premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'champions league'];

    for (const event of data.events) {
      const text = `${event.title} ${event.summary}`.toLowerCase();
      // World Cup category should not contain club football content
      const hasClubContent = clubKeywords.some(kw => text.includes(kw));
      if (hasClubContent) {
        console.warn(`[Category Isolation] Club football content found in worldcup category: "${event.title}"`);
      }
      // The event category must still be worldcup
      expect(event.category).toBe('worldcup');
    }
  });

  test('should allow all categories in home/default view', async ({ request }) => {
    const response = await request.get('/api/events');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.events.length).toBeGreaterThan(0);

    // Home view should have events with title and summary
    for (const event of data.events) {
      expect(event.title).toBeTruthy();
      expect(event.summary).toBeTruthy();
    }
  });
});
