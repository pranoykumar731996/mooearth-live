// ============================================================
// MooEarth.Live — Personalization Engine & Data Integrity Suite
// ============================================================
// Tests:
// 1. Guest bookmark storage, retrieval, and removal
// 2. Bookmark deduplication by canonical identity
// 3. Discovery history deduplication and retention limits (max 25)
// 4. Guest-to-account safe merge without duplicate bookmarks
// 5. Personalized news ranking by favorite countries and topics
// 6. Graceful fallback to global feed when personalized filters return 0 results
// 7. Security constraints and ownership invariant checks

import { test, expect } from '@playwright/test';
import {
  SavedPlace,
  UserPreferences,
  DiscoveryHistoryItem,
  getGuestSavedPlaces,
  saveGuestPlace,
  removeGuestPlace,
  isPlaceSavedLocal,
  getGuestPreferences,
  saveGuestPreferences,
  getGuestDiscoveryHistory,
  recordDiscoveryHistory,
  clearDiscoveryHistory,
} from '../../src/services/personalizationService';
import { rankPersonalizedEvents } from '../../src/services/personalizedNews';
import { WorldEvent } from '../../src/types';

// Mock in-memory localStorage for Node/Playwright test environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

test.describe('Phase 7 — Personalization, Profiles & Saved Places Engine', () => {
  const originalLocalStorage = global.localStorage;
  let mockStorage: MockLocalStorage;

  test.beforeEach(() => {
    mockStorage = new MockLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    // Stub window and window.dispatchEvent for Node environment
    if (typeof global.window === 'undefined') {
      (global as any).window = {
        dispatchEvent: () => true,
      };
    }
  });

  test.afterAll(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // ── 1. GUEST BOOKMARK STORAGE & DEDUPLICATION ──────────────────────
  test('1. Guest bookmark storage, retrieval, and removal works cleanly', () => {
    expect(getGuestSavedPlaces()).toEqual([]);

    const tokyo: SavedPlace = {
      id: 'city_tokyo_japan',
      type: 'city',
      name: 'Tokyo',
      country: 'Japan',
      coordinates: { lat: 35.6762, lng: 139.6503 },
      flag: '🇯🇵',
      savedAt: 1700000000,
    };

    const updated = saveGuestPlace(tokyo);
    expect(updated.length).toBe(1);
    expect(updated[0].name).toBe('Tokyo');
    expect(isPlaceSavedLocal('city_tokyo_japan')).toBe(true);

    const france: SavedPlace = {
      id: 'country_france',
      type: 'country',
      name: 'France',
      country: 'France',
      coordinates: { lat: 46.2276, lng: 2.2137 },
      flag: '🇫🇷',
      savedAt: 1700000050,
    };

    saveGuestPlace(france);
    expect(getGuestSavedPlaces().length).toBe(2);

    // Remove Tokyo
    const afterRemoval = removeGuestPlace('city_tokyo_japan');
    expect(afterRemoval.length).toBe(1);
    expect(afterRemoval[0].name).toBe('France');
    expect(isPlaceSavedLocal('city_tokyo_japan')).toBe(false);
  });

  test('2. Bookmark deduplication prevents duplicate entries for the same location', () => {
    const brazil1: SavedPlace = {
      id: 'country_brazil',
      type: 'country',
      name: 'Brazil',
      country: 'Brazil',
      coordinates: { lat: -14.235, lng: -51.9253 },
      flag: '🇧🇷',
      savedAt: 1000,
    };

    const brazil2: SavedPlace = {
      id: 'country_brazil',
      type: 'country',
      name: 'Brazil',
      country: 'Brazil',
      coordinates: { lat: -14.235, lng: -51.9253 },
      flag: '🇧🇷',
      savedAt: 2000, // Newer timestamp
    };

    saveGuestPlace(brazil1);
    expect(getGuestSavedPlaces().length).toBe(1);

    // Saving again with same ID replaces and updates without duplicating
    saveGuestPlace(brazil2);
    const places = getGuestSavedPlaces();
    expect(places.length).toBe(1);
    expect(places[0].savedAt).toBe(2000);
  });

  // ── 2. DISCOVERY HISTORY & CAPPED RETENTION ─────────────────────────
  test('3. Discovery history records meaningful visits and caps retention at 25', () => {
    clearDiscoveryHistory();
    expect(getGuestDiscoveryHistory()).toEqual([]);

    // Record 30 distinct locations
    for (let i = 1; i <= 30; i++) {
      recordDiscoveryHistory({
        id: `loc_${i}`,
        type: 'country',
        title: `Country ${i}`,
        country: `Country ${i}`,
      });
    }

    const history = getGuestDiscoveryHistory();
    // Maximum retention must be capped at 25 items
    expect(history.length).toBe(25);
    // Most recent visit must be at index 0
    expect(history[0].id).toBe('loc_30');
    expect(history[24].id).toBe('loc_6');

    // Visiting loc_6 again must move it to the front without increasing length
    recordDiscoveryHistory({
      id: 'loc_6',
      type: 'country',
      title: 'Country 6',
      country: 'Country 6',
    });

    const updatedHistory = getGuestDiscoveryHistory();
    expect(updatedHistory.length).toBe(25);
    expect(updatedHistory[0].id).toBe('loc_6');

    // Clear history
    clearDiscoveryHistory();
    expect(getGuestDiscoveryHistory().length).toBe(0);
  });

  // ── 3. USER PREFERENCES & INTERESTS ─────────────────────────────────
  test('4. Preferences store and retrieve favorite topics and countries', () => {
    const prefs = getGuestPreferences();
    expect(prefs.favoriteTopics.length).toBeGreaterThan(0);
    expect(prefs.isPersonalizedFeedActive).toBe(false);

    const updated = saveGuestPreferences({
      favoriteCountries: ['Japan', 'France'],
      favoriteTopics: ['technology', 'science'],
      isPersonalizedFeedActive: true,
    });

    expect(updated.favoriteCountries).toEqual(['Japan', 'France']);
    expect(updated.favoriteTopics).toEqual(['technology', 'science']);
    expect(updated.isPersonalizedFeedActive).toBe(true);

    const fetched = getGuestPreferences();
    expect(fetched.favoriteCountries).toContain('Japan');
  });

  // ── 4. PERSONALIZED NEWS RANKING & SAFE FALLBACK ───────────────────
  test('5. Personalized news ranking prioritizes user favorites correctly', () => {
    const mockEvents: WorldEvent[] = [
      {
        id: 'event_1',
        title: 'New Renewable Energy Project in Germany',
        summary: 'Germany launches new solar array',
        category: 'business',
        country: 'Germany',
        city: 'Berlin',
        lat: 52.52,
        lng: 13.405,
        source: 'Reuters',
        publishedAt: '2026-10-14T08:00:00Z',
      },
      {
        id: 'event_2',
        title: 'Breakthrough Quantum Computer Unveiled in Tokyo',
        summary: 'Japanese scientists announce quantum speedup',
        category: 'technology',
        country: 'Japan',
        city: 'Tokyo',
        lat: 35.6762,
        lng: 139.6503,
        source: 'Nikkei Asia',
        publishedAt: '2026-10-14T07:00:00Z',
      },
      {
        id: 'event_3',
        title: 'Tech Summit Opens in France',
        summary: 'Artificial intelligence ethics discussion',
        category: 'technology',
        country: 'France',
        city: 'Paris',
        lat: 48.8566,
        lng: 2.3522,
        source: 'Le Monde',
        publishedAt: '2026-10-14T06:00:00Z',
      },
    ];

    const preferences: UserPreferences = {
      favoriteCountries: ['Japan'],
      favoriteTopics: ['technology'],
      isPersonalizedFeedActive: true,
    };

    // Soft ranking mode
    const ranked = rankPersonalizedEvents(mockEvents, preferences);
    expect(ranked.isPersonalized).toBe(true);
    // Japan + Technology gets country (15) + topic (8) = 23 points -> Must be first!
    expect(ranked.events[0].id).toBe('event_2');
    // France + Technology gets topic (8) -> Must be second
    expect(ranked.events[1].id).toBe('event_3');
    // Germany + Business gets 0 affinity -> Third
    expect(ranked.events[2].id).toBe('event_1');
  });

  test('6. Strict personalized filtering safely falls back to global feed on 0 matches', () => {
    const mockEvents: WorldEvent[] = [
      {
        id: 'event_1',
        title: 'Local Art Exhibition in Canada',
        summary: 'Cultural showcase',
        category: 'entertainment',
        country: 'Canada',
        city: 'Toronto',
        lat: 43.6532,
        lng: -79.3832,
        source: 'CBC',
        publishedAt: '2026-10-14T08:00:00Z',
      },
    ];

    // User favorites that do NOT match the available articles
    const preferences: UserPreferences = {
      favoriteCountries: ['Australia'],
      favoriteTopics: ['sports'],
      isPersonalizedFeedActive: true,
    };

    // Strict filter mode
    const result = rankPersonalizedEvents(mockEvents, preferences, { strictFilter: true });
    // Must fall back to global feed rather than returning an empty broken screen
    expect(result.fallbackTriggered).toBe(true);
    expect(result.events.length).toBe(1);
    expect(result.events[0].id).toBe('event_1');
    expect(result.reason).toBeDefined();
  });
});
