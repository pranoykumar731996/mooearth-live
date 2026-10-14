// ============================================================
// MooEarth.Live — Discovery Collections & Creator Service
// ============================================================
// Supports:
// 1. Authenticated Firestore sync & local guest draft storage.
// 2. Controlled publishing and privacy protection (drafts hidden).
// 3. Creator ownership enforcement.
// 4. Pre-configured educational templates.
// 5. Community reporting & moderation review.

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  limit,
  addDoc,
} from 'firebase/firestore';
import {
  DiscoveryCollection,
  CollectionLocationItem,
  CollectionStatus,
  CollectionTemplateId,
  CollectionReport,
} from '@/types/collections';
import { validateCollectionInput } from '@/lib/collectionValidator';

const GUEST_COLLECTIONS_STORAGE_KEY = 'mooearth_guest_collections_v1';

/** Generate clean, stable slug */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 45);
  const rand = Math.random().toString(36).substring(2, 7);
  return `${base || 'collection'}-${rand}`;
}

/** Pre-configured Educational Templates */
export const COLLECTION_TEMPLATES: Record<
  CollectionTemplateId,
  {
    title: string;
    description: string;
    category: DiscoveryCollection['category'];
    coverEmoji: string;
    sampleLocations: Omit<CollectionLocationItem, 'order'>[];
  }
> = {
  five_countries: {
    title: 'Five Diverse Sovereign Nations',
    description: 'A cross-continental exploration comparing five nations across distinct biomes, cultures, and geographical hemispheres.',
    category: 'education',
    coverEmoji: '🌍',
    sampleLocations: [
      {
        id: 'country_is',
        name: 'Iceland',
        country: 'Iceland',
        countryCode: 'IS',
        coordinates: { lat: 64.9631, lng: -19.0208 },
        educationalNotes: 'Land of fire and ice along the Mid-Atlantic tectonic rift zone.',
        notesAttribution: 'educator',
      },
      {
        id: 'country_jp',
        name: 'Japan',
        country: 'Japan',
        countryCode: 'JP',
        coordinates: { lat: 36.2048, lng: 138.2529 },
        educationalNotes: 'Pacific Ring of Fire island archipelago famous for volcanic topography and cultural synthesis.',
        notesAttribution: 'educator',
      },
      {
        id: 'country_mg',
        name: 'Madagascar',
        country: 'Madagascar',
        countryCode: 'MG',
        coordinates: { lat: -18.7669, lng: 46.8691 },
        educationalNotes: 'Isolated island nation with over 90% endemic floral and faunal biodiversity.',
        notesAttribution: 'educator',
      },
      {
        id: 'country_cl',
        name: 'Chile',
        country: 'Chile',
        countryCode: 'CL',
        coordinates: { lat: -35.6751, lng: -71.5430 },
        educationalNotes: 'Stretching over 4,300 km from the arid Atacama Desert to sub-Antarctic glaciers.',
        notesAttribution: 'educator',
      },
      {
        id: 'country_no',
        name: 'Norway',
        country: 'Norway',
        countryCode: 'NO',
        coordinates: { lat: 60.4720, lng: 8.4689 },
        educationalNotes: 'Famous for deep glacial fjords, boreal forests, and the Scandinavian mountain spine.',
        notesAttribution: 'educator',
      },
    ],
  },
  landmarks: {
    title: 'Wonders of World Heritage',
    description: 'A curated journey visiting remarkable archaeological, architectural, and natural monuments of our planet.',
    category: 'landmarks',
    coverEmoji: '🏛️',
    sampleLocations: [
      {
        id: 'landmark_petra',
        name: 'Petra',
        country: 'Jordan',
        countryCode: 'JO',
        coordinates: { lat: 30.3285, lng: 35.4444 },
        educationalNotes: 'Ancient Nabataean caravan city carved directly into red desert sandstone cliffs.',
        notesAttribution: 'educator',
      },
      {
        id: 'landmark_machu_picchu',
        name: 'Machu Picchu',
        country: 'Peru',
        countryCode: 'PE',
        coordinates: { lat: -13.1631, lng: -72.5450 },
        educationalNotes: '15th-century Inca citadel built atop a narrow Andean ridge with dry-stone masonry.',
        notesAttribution: 'educator',
      },
      {
        id: 'landmark_giza',
        name: 'Giza Pyramids',
        country: 'Egypt',
        countryCode: 'EG',
        coordinates: { lat: 29.9792, lng: 31.1342 },
        educationalNotes: 'The oldest of the ancient Seven Wonders, standing at the edge of the Sahara for over 4,500 years.',
        notesAttribution: 'educator',
      },
    ],
  },
  capitals: {
    title: 'Global Capital Cities Tour',
    description: 'Explore the political, cultural, and economic nerve centers of five sovereign nations.',
    category: 'capitals',
    coverEmoji: '🏙️',
    sampleLocations: [
      {
        id: 'capital_nairobi',
        name: 'Nairobi',
        country: 'Kenya',
        countryCode: 'KE',
        coordinates: { lat: -1.2921, lng: 36.8219 },
        educationalNotes: 'Known as the Green City in the Sun, featuring a national wildlife park abutting skyscrapers.',
        notesAttribution: 'educator',
      },
      {
        id: 'capital_tokyo',
        name: 'Tokyo',
        country: 'Japan',
        countryCode: 'JP',
        coordinates: { lat: 35.6762, lng: 139.6503 },
        educationalNotes: 'The world’s most populous metropolitan area, blending ancient shrines with transit innovation.',
        notesAttribution: 'educator',
      },
      {
        id: 'capital_buenos_aires',
        name: 'Buenos Aires',
        country: 'Argentina',
        countryCode: 'AR',
        coordinates: { lat: -34.6037, lng: -58.3816 },
        educationalNotes: 'Cosmopolitan capital on the Río de la Plata estuary, renowned for architecture and tango heritage.',
        notesAttribution: 'educator',
      },
    ],
  },
  journey: {
    title: 'Pacific Ring of Fire Odyssey',
    description: 'Trace the 40,000-kilometer horseshoe of intense volcanic activity and tectonic plate boundaries around the Pacific Basin.',
    category: 'journey',
    coverEmoji: '🌋',
    sampleLocations: [
      {
        id: 'loc_krakatoa',
        name: 'Sunda Strait & Krakatoa',
        country: 'Indonesia',
        countryCode: 'ID',
        coordinates: { lat: -6.1021, lng: 105.4230 },
        educationalNotes: 'Caldera formed by historical subduction of the Indo-Australian plate beneath the Eurasian plate.',
        notesAttribution: 'educator',
      },
      {
        id: 'loc_fuji',
        name: 'Mount Fuji',
        country: 'Japan',
        countryCode: 'JP',
        coordinates: { lat: 35.3606, lng: 138.7274 },
        educationalNotes: 'Active stratovolcano sitting at the triple junction of the Amurian, Okhotsk, and Filipino plates.',
        notesAttribution: 'educator',
      },
    ],
  },
  challenge: {
    title: 'Curated Geography Mastery Challenge',
    description: 'A curated educational path combining verified quiz checkpoints with interactive globe discoveries.',
    category: 'education',
    coverEmoji: '🎯',
    sampleLocations: [],
  },
  custom: {
    title: 'Custom Discovery Tour',
    description: 'A personalized curation of geographic places, stories, and educational notes.',
    category: 'custom',
    coverEmoji: '🧭',
    sampleLocations: [],
  },
};

// ============================================================
// Guest / Local Storage Helpers
// ============================================================

const inMemoryCollections = new Map<string, DiscoveryCollection>();

export function getGuestCollections(): DiscoveryCollection[] {
  const memList = Array.from(inMemoryCollections.values());
  if (typeof window === 'undefined') return memList;
  try {
    const raw = localStorage.getItem(GUEST_COLLECTIONS_STORAGE_KEY);
    const local = raw ? (JSON.parse(raw) as DiscoveryCollection[]) : [];
    const map = new Map<string, DiscoveryCollection>();
    local.forEach((c) => map.set(c.id, c));
    memList.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  } catch {
    return memList;
  }
}

export function saveGuestCollection(collectionItem: DiscoveryCollection): void {
  inMemoryCollections.set(collectionItem.id, collectionItem);
  if (typeof window === 'undefined') return;
  const current = getGuestCollections();
  const existingIdx = current.findIndex((c) => c.id === collectionItem.id);
  let updated: DiscoveryCollection[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = collectionItem;
  } else {
    updated = [collectionItem, ...current];
  }

  localStorage.setItem(GUEST_COLLECTIONS_STORAGE_KEY, JSON.stringify(updated.slice(0, 20)));
}

export function deleteGuestCollection(id: string): void {
  inMemoryCollections.delete(id);
  if (typeof window === 'undefined') return;
  const current = getGuestCollections();
  const filtered = current.filter((c) => c.id !== id);
  localStorage.setItem(GUEST_COLLECTIONS_STORAGE_KEY, JSON.stringify(filtered));
}

// ============================================================
// Database & Unified Operations
// ============================================================

/** Create a new Discovery Collection */
export async function createCollection(
  input: {
    title: string;
    description: string;
    category?: DiscoveryCollection['category'];
    templateId?: CollectionTemplateId;
    locations: CollectionLocationItem[];
    coverEmoji?: string;
    isPublic?: boolean;
  },
  user?: { uid?: string; displayName?: string | null; photoURL?: string | null } | null
): Promise<{ success: boolean; collection?: DiscoveryCollection; error?: string }> {
  // 1. Validation check
  const validation = validateCollectionInput({
    title: input.title,
    description: input.description,
    locations: input.locations,
  });

  if (!validation.isValid) {
    return { success: false, error: validation.errors[0] };
  }

  const id = `col_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const slug = generateSlug(input.title);
  const now = Date.now();
  const status: CollectionStatus = input.isPublic ? 'published' : 'draft';

  const orderedLocations = input.locations.map((loc, idx) => ({
    ...loc,
    order: idx + 1,
  }));

  const countryCodes = Array.from(
    new Set(orderedLocations.map((l) => l.countryCode || '').filter(Boolean))
  );

  const newCollection: DiscoveryCollection = {
    id,
    slug,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category || 'custom',
    templateId: input.templateId || 'custom',
    creatorUid: user?.uid || 'guest',
    creatorName: user?.displayName || 'Explorer',
    creatorAvatar: user?.photoURL || '🌍',
    creatorBadge: user?.uid ? 'Creator' : 'Explorer',
    status,
    locations: orderedLocations,
    totalLocations: orderedLocations.length,
    featuredCountryCodes: countryCodes,
    coverEmoji: input.coverEmoji || '🌍',
    createdAt: now,
    updatedAt: now,
    ...(status === 'published' ? { publishedAt: now } : {}),
    viewsCount: 0,
    sharesCount: 0,
    reportsCount: 0,
  };

  // 2. Persist to Firestore if user is authenticated and DB is available
  if (user?.uid && db) {
    try {
      await setDoc(doc(db, 'collections', id), newCollection);
    } catch (e: any) {
      console.warn('[CollectionService] Firestore save failed, fallback to local:', e);
      saveGuestCollection(newCollection);
    }
  } else {
    // Save in client storage for guest
    saveGuestCollection(newCollection);
  }

  return { success: true, collection: newCollection };
}

/** Update an existing collection (Creator Ownership Guarded) */
export async function updateCollection(
  id: string,
  updates: Partial<DiscoveryCollection>,
  user?: { uid?: string } | null
): Promise<{ success: boolean; error?: string }> {
  if (updates.title || updates.locations) {
    const validation = validateCollectionInput({
      title: updates.title || 'Existing Title',
      description: updates.description || '',
      locations: updates.locations || [],
    });
    if (!validation.isValid && updates.locations) {
      return { success: false, error: validation.errors[0] };
    }
  }

  const payload: Partial<DiscoveryCollection> = {
    ...updates,
    updatedAt: Date.now(),
  };

  if (updates.locations) {
    payload.totalLocations = updates.locations.length;
    payload.featuredCountryCodes = Array.from(
      new Set(updates.locations.map((l) => l.countryCode || '').filter(Boolean))
    );
  }

  if (user?.uid && db) {
    try {
      const docRef = doc(db, 'collections', id);
      const existing = await getDoc(docRef);
      if (!existing.exists()) {
        return { success: false, error: 'Collection not found.' };
      }
      const data = existing.data() as DiscoveryCollection;
      if (data.creatorUid !== user.uid) {
        return { success: false, error: 'Unauthorized: You can only edit your own collections.' };
      }
      await updateDoc(docRef, payload);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update collection.' };
    }
  } else {
    const guestCols = getGuestCollections();
    const found = guestCols.find((c) => c.id === id);
    if (!found) return { success: false, error: 'Collection not found locally.' };
    saveGuestCollection({ ...found, ...payload });
    return { success: true };
  }
}

/** Delete a collection (Creator Guarded) */
export async function deleteCollection(
  id: string,
  user?: { uid?: string } | null
): Promise<{ success: boolean; error?: string }> {
  if (user?.uid && db) {
    try {
      const docRef = doc(db, 'collections', id);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        const data = existing.data() as DiscoveryCollection;
        if (data.creatorUid !== user.uid) {
          return { success: false, error: 'Unauthorized: You can only delete your own collections.' };
        }
        await deleteDoc(docRef);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to delete collection.' };
    }
  } else {
    deleteGuestCollection(id);
    return { success: true };
  }
}

/** Fetch user's collections (both drafts and published) */
export async function getUserCollections(
  userId?: string
): Promise<DiscoveryCollection[]> {
  const list: DiscoveryCollection[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch from Firestore if authenticated
  if (userId && db) {
    try {
      const q = query(
        collection(db, 'collections'),
        where('creatorUid', '==', userId),
        limit(50)
      );
      const snaps = await getDocs(q);
      snaps.forEach((d) => {
        const item = d.data() as DiscoveryCollection;
        list.push(item);
        seenIds.add(item.id);
      });
    } catch (e) {
      console.warn('[CollectionService] Firestore getUserCollections failed:', e);
    }
  }

  // 2. Add local guest collections (for unauthenticated or local drafts)
  const guest = getGuestCollections();
  guest.forEach((g) => {
    if (!seenIds.has(g.id)) {
      if (!userId || g.creatorUid === userId || g.creatorUid === 'guest') {
        list.push(g);
        seenIds.add(g.id);
      }
    }
  });

  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Publish a collection (Creator Guarded) */
export async function publishCollection(
  id: string,
  user?: { uid?: string } | null
): Promise<{ success: boolean; error?: string }> {
  return updateCollection(id, { status: 'published', publishedAt: Date.now() }, user);
}

/** Unpublish a collection back to draft (Creator Guarded) */
export async function unpublishCollection(
  id: string,
  user?: { uid?: string } | null
): Promise<{ success: boolean; error?: string }> {
  return updateCollection(id, { status: 'draft' }, user);
}

/** Record collection opening/viewing */
export async function recordCollectionOpen(id: string): Promise<void> {
  if (id.startsWith('tmpl_')) return;
  if (db) {
    try {
      const docRef = doc(db, 'collections', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const current = snap.data()?.viewsCount || 0;
        await updateDoc(docRef, { viewsCount: current + 1 });
      }
    } catch {
      // Fire-and-forget telemetry
    }
  }
}

/** Record collection sharing */
export async function recordCollectionShare(id: string): Promise<void> {
  if (id.startsWith('tmpl_')) return;
  if (db) {
    try {
      const docRef = doc(db, 'collections', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const current = snap.data()?.sharesCount || 0;
        await updateDoc(docRef, { sharesCount: current + 1 });
      }
    } catch {
      // Fire-and-forget telemetry
    }
  }
}

/** Retrieve collection by ID (Respecting Draft / Privacy Boundaries) */
export async function getCollectionById(
  id: string,
  requesterUid?: string
): Promise<DiscoveryCollection | null> {
  // 1. Try Firestore
  if (db) {
    try {
      const docRef = doc(db, 'collections', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as DiscoveryCollection;
        // Privacy Guard: If it's a draft or archived, only creator can view
        if (data.status === 'draft' || data.status === 'archived') {
          if (!requesterUid || requesterUid !== data.creatorUid) {
            return null; // Hidden from unauthorized visitors
          }
        }
        return data;
      }
    } catch (e) {
      console.warn('[CollectionService] Firestore get failed:', e);
    }
  }

  // 2. Try Guest local storage / in-memory cache
  const guest = getGuestCollections().find((c) => c.id === id);
  if (guest) {
    if (guest.status === 'draft' || guest.status === 'archived') {
      if (!requesterUid || requesterUid !== guest.creatorUid) {
        return null; // Hidden from unauthorized visitors
      }
    }
    return guest;
  }

  // 3. Fallback check for built-in template previews
  const templateKey = id.replace('tmpl_', '') as CollectionTemplateId;
  if (COLLECTION_TEMPLATES[templateKey]) {
    const tmpl = COLLECTION_TEMPLATES[templateKey];
    return {
      id: `tmpl_${templateKey}`,
      slug: templateKey,
      title: tmpl.title,
      description: tmpl.description,
      category: tmpl.category,
      templateId: templateKey,
      creatorUid: 'system',
      creatorName: 'MooEarth Education',
      creatorBadge: 'Educator',
      status: 'published',
      locations: tmpl.sampleLocations.map((l, i) => ({ ...l, order: i + 1 })),
      totalLocations: tmpl.sampleLocations.length,
      featuredCountryCodes: tmpl.sampleLocations.map((l) => l.countryCode || '').filter(Boolean),
      coverEmoji: tmpl.coverEmoji,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      publishedAt: Date.now() - 86400000,
    };
  }

  return null;
}

/** Fetch public collections for discovery feed */
export async function getPublicCollections(maxItems = 12): Promise<DiscoveryCollection[]> {
  const results: DiscoveryCollection[] = [];

  if (db) {
    try {
      const q = query(
        collection(db, 'collections'),
        where('status', '==', 'published'),
        limit(maxItems)
      );
      const snaps = await getDocs(q);
      snaps.forEach((docSnap) => results.push(docSnap.data() as DiscoveryCollection));
    } catch (e) {
      console.warn('[CollectionService] Public collections query fallback:', e);
    }
  }

  // If no DB collections, seed with official templates
  if (results.length === 0) {
    Object.entries(COLLECTION_TEMPLATES).forEach(([key, tmpl]) => {
      if (tmpl.sampleLocations.length > 0) {
        results.push({
          id: `tmpl_${key}`,
          slug: key,
          title: tmpl.title,
          description: tmpl.description,
          category: tmpl.category,
          templateId: key as CollectionTemplateId,
          creatorUid: 'system',
          creatorName: 'MooEarth Education',
          creatorBadge: 'Educator',
          status: 'published',
          locations: tmpl.sampleLocations.map((l, i) => ({ ...l, order: i + 1 })),
          totalLocations: tmpl.sampleLocations.length,
          featuredCountryCodes: tmpl.sampleLocations.map((l) => l.countryCode || '').filter(Boolean),
          coverEmoji: tmpl.coverEmoji,
          createdAt: 1770000000000,
          updatedAt: 1770000000000,
          publishedAt: 1770000000000,
        });
      }
    });
  }

  return results;
}

/** Submit a content moderation report */
export async function submitCollectionReport(input: {
  collectionId: string;
  reason: CollectionReport['reason'];
  details: string;
  user?: { uid: string; email?: string | null } | null;
}): Promise<{ success: boolean; error?: string }> {
  const report: CollectionReport = {
    id: `rep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    collectionId: input.collectionId,
    reporterUid: input.user?.uid,
    reporterEmail: input.user?.email || undefined,
    reason: input.reason,
    details: (input.details || '').slice(0, 500),
    status: 'pending',
    createdAt: Date.now(),
  };

  if (db) {
    try {
      await addDoc(collection(db, 'collection_reports'), report);
      // Increment report count on target collection
      const colRef = doc(db, 'collections', input.collectionId);
      const colSnap = await getDoc(colRef);
      if (colSnap.exists()) {
        const cur = (colSnap.data()?.reportsCount || 0) + 1;
        await updateDoc(colRef, {
          reportsCount: cur,
          status: cur >= 3 ? 'flagged' : colSnap.data()?.status,
        });
      }
      return { success: true };
    } catch (e: any) {
      console.warn('[CollectionService] Report submission fallback:', e);
      return { success: true }; // Soft-fail to user
    }
  }

  return { success: true };
}
