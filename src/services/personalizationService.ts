// ============================================================
// MooEarth.Live — Personalization, Saved Places & Profile Service
// ============================================================
// Supports:
// - Guest local persistence via localStorage
// - Authenticated sync via Firebase Auth & Firestore
// - Bookmark deduplication by canonical identity
// - Safe guest-to-account merge on login without data loss
// - Discovery history with capped retention (max 25 items)
// - Preference-based news ranking and filtering

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export interface SavedPlace {
  id: string; // e.g. "country_japan" or "city_tokyo_japan"
  type: 'country' | 'city' | 'coordinates';
  name: string;
  country?: string;
  state?: string;
  coordinates: { lat: number; lng: number };
  flag?: string;
  savedAt: number; // Unix timestamp in ms
}

export interface UserPreferences {
  favoriteCountries: string[];
  favoriteTopics: string[]; // e.g. 'breaking', 'technology', 'business', 'science', 'entertainment', 'sports'
  preferredLanguage?: string;
  isPersonalizedFeedActive: boolean;
}

export interface DiscoveryHistoryItem {
  id: string;
  type: 'country' | 'city' | 'quiz' | 'challenge';
  title: string;
  subtitle?: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
  flag?: string;
  timestamp: number;
}

export interface UserProfileData {
  uid?: string;
  username: string;
  avatar: string;
  country: string;
  email?: string;
  createdAt?: number;
  preferences: UserPreferences;
  savedPlaces: SavedPlace[];
  discoveryHistory: DiscoveryHistoryItem[];
  xp?: number;
  level?: number;
  badges?: any[];
}

const STORAGE_KEYS = {
  SAVED_PLACES: 'mooearth_saved_places',
  PREFERENCES: 'mooearth_user_preferences',
  HISTORY: 'mooearth_discovery_history',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteCountries: [],
  favoriteTopics: ['breaking', 'technology', 'science'],
  preferredLanguage: 'en',
  isPersonalizedFeedActive: false,
};

const MAX_HISTORY_ITEMS = 25;
const MAX_SAVED_PLACES = 50;

// ------------------------------------------------------------
// Local Storage (Guest) Operations
// ------------------------------------------------------------

export function getGuestSavedPlaces(): SavedPlace[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_PLACES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestPlace(place: SavedPlace): SavedPlace[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getGuestSavedPlaces();
    // Prevent duplicate bookmarks by canonical ID
    const filtered = existing.filter((p) => p.id !== place.id);
    const updated = [place, ...filtered].slice(0, MAX_SAVED_PLACES);
    localStorage.setItem(STORAGE_KEYS.SAVED_PLACES, JSON.stringify(updated));
    dispatchStorageUpdateEvent('saved_places', updated);
    return updated;
  } catch {
    return [];
  }
}

export function removeGuestPlace(placeId: string): SavedPlace[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getGuestSavedPlaces();
    const updated = existing.filter((p) => p.id !== placeId);
    localStorage.setItem(STORAGE_KEYS.SAVED_PLACES, JSON.stringify(updated));
    dispatchStorageUpdateEvent('saved_places', updated);
    return updated;
  } catch {
    return [];
  }
}

export function isPlaceSavedLocal(placeId: string): boolean {
  if (typeof window === 'undefined') return false;
  const places = getGuestSavedPlaces();
  return places.some((p) => p.id === placeId);
}

export function getGuestPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveGuestPreferences(preferences: Partial<UserPreferences>): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const current = getGuestPreferences();
    const updated: UserPreferences = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    dispatchStorageUpdateEvent('preferences', updated);
    return updated;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function getGuestDiscoveryHistory(): DiscoveryHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordDiscoveryHistory(item: Omit<DiscoveryHistoryItem, 'timestamp'>): DiscoveryHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const history = getGuestDiscoveryHistory();
    // Deduplicate repeated visits within recent items
    const filtered = history.filter((h) => h.id !== item.id);
    const newItem: DiscoveryHistoryItem = {
      ...item,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    dispatchStorageUpdateEvent('history', updated);
    return updated;
  } catch {
    return [];
  }
}

export function clearDiscoveryHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    dispatchStorageUpdateEvent('history', []);
  } catch {}
}

// ------------------------------------------------------------
// Custom Event Dispatcher for Real-time Component Sync
// ------------------------------------------------------------

function dispatchStorageUpdateEvent(key: 'saved_places' | 'preferences' | 'history', payload: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mooearth_personalization_update', {
      detail: { key, payload }
    }));
  }
}

// ------------------------------------------------------------
// Authenticated Profile Sync (Firestore)
// ------------------------------------------------------------

export async function fetchUserProfile(uid: string): Promise<UserProfileData | null> {
  if (!uid || typeof window === 'undefined') return null;

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const profile: UserProfileData = {
        uid,
        username: data.username || 'Global Explorer',
        avatar: data.avatar || '🌍',
        country: data.country || 'Global',
        email: data.email || '',
        createdAt: data.createdAt || Date.now(),
        preferences: data.preferences ? { ...DEFAULT_PREFERENCES, ...data.preferences } : getGuestPreferences(),
        savedPlaces: Array.isArray(data.savedPlaces) ? data.savedPlaces : getGuestSavedPlaces(),
        discoveryHistory: Array.isArray(data.discoveryHistory) ? data.discoveryHistory : getGuestDiscoveryHistory(),
        xp: data.xp || 0,
        level: data.level || 1,
        badges: Array.isArray(data.badges) ? data.badges : [],
      };

      // Synchronize local cache for offline/instant availability
      try {
        localStorage.setItem(STORAGE_KEYS.SAVED_PLACES, JSON.stringify(profile.savedPlaces));
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(profile.preferences));
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(profile.discoveryHistory));
      } catch {}

      return profile;
    }
  } catch (err) {
    console.warn('[Personalization] Failed to fetch profile from Firestore, using local fallback:', err);
  }

  return null;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfileData>
): Promise<boolean> {
  if (!uid) return false;

  try {
    const userDocRef = doc(db, 'users', uid);
    const payload: Record<string, any> = {};

    if (updates.username !== undefined) payload.username = updates.username.trim().slice(0, 60);
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;
    if (updates.country !== undefined) payload.country = updates.country;
    if (updates.preferences !== undefined) {
      payload.preferences = updates.preferences;
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updates.preferences));
    }
    if (updates.savedPlaces !== undefined) {
      payload.savedPlaces = updates.savedPlaces.slice(0, MAX_SAVED_PLACES);
      localStorage.setItem(STORAGE_KEYS.SAVED_PLACES, JSON.stringify(payload.savedPlaces));
    }
    if (updates.discoveryHistory !== undefined) {
      payload.discoveryHistory = updates.discoveryHistory.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(payload.discoveryHistory));
    }

    await setDoc(userDocRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Personalization] Failed to update profile in Firestore:', err);
    return false;
  }
}

/**
 * Merge guest bookmarks and preferences with authenticated account.
 * Deduplicates by place ID to prevent duplicate bookmarks.
 * Never overwrites existing account bookmarks unexpectedly.
 */
export async function mergeGuestDataToAccount(uid: string): Promise<UserProfileData | null> {
  if (!uid) return null;

  try {
    const guestPlaces = getGuestSavedPlaces();
    const guestPrefs = getGuestPreferences();
    const guestHistory = getGuestDiscoveryHistory();

    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    let accountPlaces: SavedPlace[] = [];
    let accountPrefs: UserPreferences = DEFAULT_PREFERENCES;
    let accountHistory: DiscoveryHistoryItem[] = [];
    let username = 'Global Explorer';
    let avatar = '🌍';
    let country = 'Global';
    let xp = 0;
    let level = 1;
    let badges: any[] = [];

    if (snap.exists()) {
      const data = snap.data();
      username = data.username || username;
      avatar = data.avatar || avatar;
      country = data.country || country;
      xp = data.xp || xp;
      level = data.level || level;
      badges = Array.isArray(data.badges) ? data.badges : badges;
      accountPlaces = Array.isArray(data.savedPlaces) ? data.savedPlaces : [];
      accountPrefs = data.preferences ? { ...DEFAULT_PREFERENCES, ...data.preferences } : DEFAULT_PREFERENCES;
      accountHistory = Array.isArray(data.discoveryHistory) ? data.discoveryHistory : [];
    }

    // Deduplicated merge of bookmarks
    const placeMap = new Map<string, SavedPlace>();
    // Existing account bookmarks take precedence
    accountPlaces.forEach((p) => placeMap.set(p.id, p));
    // Add guest bookmarks that are not already saved
    guestPlaces.forEach((p) => {
      if (!placeMap.has(p.id)) {
        placeMap.set(p.id, p);
      }
    });

    const mergedPlaces = Array.from(placeMap.values()).slice(0, MAX_SAVED_PLACES);

    // Merge preferences: combine favorite countries and topics without duplicates
    const mergedCountries = Array.from(new Set([
      ...accountPrefs.favoriteCountries,
      ...guestPrefs.favoriteCountries
    ]));
    const mergedTopics = Array.from(new Set([
      ...accountPrefs.favoriteTopics,
      ...guestPrefs.favoriteTopics
    ]));

    const mergedPrefs: UserPreferences = {
      favoriteCountries: mergedCountries,
      favoriteTopics: mergedTopics,
      preferredLanguage: accountPrefs.preferredLanguage || guestPrefs.preferredLanguage || 'en',
      isPersonalizedFeedActive: accountPrefs.isPersonalizedFeedActive || guestPrefs.isPersonalizedFeedActive,
    };

    // Deduplicated merge of history
    const historyMap = new Map<string, DiscoveryHistoryItem>();
    accountHistory.forEach((h) => historyMap.set(h.id, h));
    guestHistory.forEach((h) => {
      if (!historyMap.has(h.id)) {
        historyMap.set(h.id, h);
      }
    });
    const mergedHistory = Array.from(historyMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY_ITEMS);

    const mergedProfile: UserProfileData = {
      uid,
      username,
      avatar,
      country,
      xp,
      level,
      badges,
      preferences: mergedPrefs,
      savedPlaces: mergedPlaces,
      discoveryHistory: mergedHistory,
    };

    // Save merged profile to Firestore
    await setDoc(userDocRef, {
      preferences: mergedPrefs,
      savedPlaces: mergedPlaces,
      discoveryHistory: mergedHistory,
    }, { merge: true });

    // Update local cache
    localStorage.setItem(STORAGE_KEYS.SAVED_PLACES, JSON.stringify(mergedPlaces));
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(mergedPrefs));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(mergedHistory));

    return mergedProfile;
  } catch (err) {
    console.error('[Personalization] Error merging guest data into account:', err);
    return null;
  }
}

/**
 * Permanently delete user data from Firestore and clear local state.
 */
export async function deleteUserData(uid: string): Promise<boolean> {
  if (!uid) return false;

  try {
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);

    // Clear local cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SAVED_PLACES);
      localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    }
    return true;
  } catch (err) {
    console.error('[Personalization] Failed to delete user data:', err);
    return false;
  }
}
