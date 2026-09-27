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

  test('should only return sports-related events for sports category', async ({ request }) => {
    const response = await request.get('/api/events?q=sports&category=sports');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.events.length === 0) return;

    for (const event of data.events) {
      expect(event.category).toBe('sports');
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
