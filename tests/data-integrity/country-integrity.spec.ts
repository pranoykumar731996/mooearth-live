import { test, expect } from '@playwright/test';

// Approximate lat/lng bounds for countries to validate coordinate mapping
const COUNTRY_BOUNDS: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  'Japan': { latMin: 24, latMax: 46, lngMin: 122, lngMax: 154 },
  'Brazil': { latMin: -34, latMax: 6, lngMin: -74, lngMax: -35 },
  'India': { latMin: 6, latMax: 36, lngMin: 68, lngMax: 98 },
  'United States': { latMin: 24, latMax: 72, lngMin: -180, lngMax: -66 },
  'United Kingdom': { latMin: 49, latMax: 61, lngMin: -11, lngMax: 2 },
};

test.describe('Suite 3 — Country Data Validation', () => {

  test('should return events with matching country when querying Japan', async ({ request }) => {
    const response = await request.get('/api/events?q=Japan&category=breaking');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('events');

    if (data.events.length === 0) {
      console.warn('[Country Integrity] No events returned for Japan query');
      return;
    }

    // At least some events should reference Japan
    const japanEvents = data.events.filter((e: any) =>
      e.country === 'Japan' ||
      e.title.toLowerCase().includes('japan') ||
      e.summary.toLowerCase().includes('japan')
    );

    expect(japanEvents.length).toBeGreaterThan(0);
  });

  test('should return events with matching country when querying Brazil', async ({ request }) => {
    const response = await request.get('/api/events?q=Brazil&category=breaking');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('events');

    if (data.events.length === 0) return;

    const brazilEvents = data.events.filter((e: any) =>
      e.country === 'Brazil' ||
      e.title.toLowerCase().includes('brazil') ||
      e.summary.toLowerCase().includes('brazil')
    );

    expect(brazilEvents.length).toBeGreaterThan(0);
  });

  test('should never assign Japan coordinates to a Brazil-specific query', async ({ request }) => {
    const response = await request.get('/api/events?q=Brazil+news&category=breaking');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.events.length === 0) return;

    // If an event explicitly has country=Brazil, its lat should be in Brazil's bounds
    const brazilEvents = data.events.filter((e: any) => e.country === 'Brazil');
    const japanBounds = COUNTRY_BOUNDS['Japan'];

    for (const evt of brazilEvents) {
      const inJapan = evt.lat >= japanBounds.latMin && evt.lat <= japanBounds.latMax &&
                      evt.lng >= japanBounds.lngMin && evt.lng <= japanBounds.lngMax;
      expect(inJapan).toBe(false);
    }
  });

  test('should return events with valid coordinate ranges', async ({ request }) => {
    const response = await request.get('/api/events');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('events');

    for (const event of data.events) {
      // Latitude must be between -90 and 90
      expect(event.lat).toBeGreaterThanOrEqual(-90);
      expect(event.lat).toBeLessThanOrEqual(90);
      // Longitude must be between -180 and 180
      expect(event.lng).toBeGreaterThanOrEqual(-180);
      expect(event.lng).toBeLessThanOrEqual(180);
    }
  });

  test('should return events with non-empty country field', async ({ request }) => {
    const response = await request.get('/api/events');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    for (const event of data.events) {
      expect(event.country).toBeTruthy();
      expect(event.country.length).toBeGreaterThan(0);
    }
  });

  test('should return events with valid publishedAt ISO timestamps', async ({ request }) => {
    const response = await request.get('/api/events');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    for (const event of data.events) {
      expect(event.publishedAt).toBeTruthy();
      const parsed = new Date(event.publishedAt);
      expect(parsed.getTime()).not.toBeNaN();
    }
  });

  test('should have status metadata about data sources', async ({ request }) => {
    const response = await request.get('/api/events');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toHaveProperty('newsActive');
    expect(data.status).toHaveProperty('footballActive');
    expect(typeof data.status.newsActive).toBe('boolean');
    expect(typeof data.status.footballActive).toBe('boolean');
  });
});
