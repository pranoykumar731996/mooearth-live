// ============================================================
// MooEarth Live — Question History & Universal Anti-Repeat Service
// ============================================================
// Guarantees that questions do not repeat across rounds, sessions,
// or game modes for the same user. Supports Guest and authenticated users.

import { getCanonicalCountryName } from '@/data/questions';

export interface QuestionBrief {
  id: string;
  question: string;
  country: string;
  category?: string;
  signature?: string;
  timestamp?: number;
}

const STORAGE_PREFIX = 'mooearth_seen_questions_v2_';
const MAX_PERSISTED_HISTORY = 1500;

// Universal stop words for semantic deduplication
const STOP_WORDS = new Set([
  'what', 'which', 'the', 'is', 'are', 'was', 'were', 'of', 'in', 'and', 'or',
  'belong', 'belongs', 'located', 'city', 'country', 'nation', 'to', 'for',
  'with', 'on', 'at', 'by', 'from', 'this', 'that', 'these', 'those', 'an', 'a'
]);

/**
 * Normalizes question text for uniform string matching:
 * lowercase, stripped punctuation, normalized whitespace.
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts a high-level conceptual topic signature from a question.
 * If two questions for the same country share a signature, they are duplicates.
 */
export function getQuestionSignature(text: string): string {
  const norm = normalizeQuestionText(text);
  const keywords: [string, string][] = [
    ['capital', 'capital'],
    ['flag', 'flag'],
    ['currency', 'currency'],
    ['money', 'currency'],
    ['dollar', 'currency'],
    ['peso', 'currency'],
    ['euro', 'currency'],
    ['language', 'language'],
    ['speak', 'language'],
    ['continent', 'continent'],
    ['landmark', 'landmark'],
    ['monument', 'landmark'],
    ['border', 'border'],
    ['neighbour', 'border'],
    ['neighbor', 'border'],
    ['population', 'population'],
    ['inhabitants', 'population'],
    ['independence', 'independence'],
    ['unif', 'independence'],
    ['dish', 'cuisine'],
    ['food', 'cuisine'],
    ['cuisine', 'cuisine'],
    ['person', 'famous_figure'],
    ['figure', 'famous_figure'],
    ['leader', 'famous_figure'],
    ['athlete', 'famous_figure'],
    ['sport', 'sport'],
    ['football', 'sport'],
    ['soccer', 'sport'],
    ['climate', 'climate'],
    ['weather', 'climate'],
    ['ocean', 'geography_feature'],
    ['sea', 'geography_feature'],
    ['mountain', 'geography_feature'],
    ['peak', 'geography_feature'],
    ['river', 'geography_feature'],
  ];

  for (const [kw, sig] of keywords) {
    if (norm.includes(kw)) return sig;
  }
  return '';
}

export const extractConceptSignature = getQuestionSignature;

/**
 * Clears seen questions history for a user (useful for test resets).
 */
export function clearSeenQuestions(username: string = 'Guest'): void {
  const userKey = username || 'Guest';
  memorySeenBriefs.delete(userKey);
  memorySeenIds.delete(userKey);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${userKey}`);
    } catch (e) {}
  }
}

/**
 * Robust semantic deduplication between two questions.
 * Handles ID match, country alias normalization, concept signatures,
 * and Jaccard token overlap.
 */
export function areQuestionsDuplicate(q1: QuestionBrief, q2: QuestionBrief): boolean {
  if (!q1 || !q2) return false;
  if (q1.id && q2.id && q1.id === q2.id) return true;

  const c1 = getCanonicalCountryName(q1.country || 'Global');
  const c2 = getCanonicalCountryName(q2.country || 'Global');

  // If both questions explicitly target different countries (and neither is Global),
  // they are NEVER duplicates of each other, even if templates share identical wording.
  // e.g., "Which country does this flag belong to?" for France vs Germany.
  // e.g., "What is the capital of France?" vs "What is the capital of Germany?".
  if (c1 !== 'Global' && c2 !== 'Global' && c1.toLowerCase() !== c2.toLowerCase()) {
    return false;
  }

  const text1 = normalizeQuestionText(q1.question);
  const text2 = normalizeQuestionText(q2.question);
  if (text1 && text2 && text1 === text2) return true;

  // Both questions relate to the same country
  if (c1.toLowerCase() === c2.toLowerCase()) {
    const sig1 = q1.signature || getQuestionSignature(q1.question);
    const sig2 = q2.signature || getQuestionSignature(q2.question);

    // If both ask about the same concept for the same country (e.g. both ask capital or currency), it's a duplicate!
    if (sig1 && sig2 && sig1 === sig2) {
      return true;
    }

    // Token set overlap (Jaccard similarity)
    const getWords = (text: string) => {
      return new Set(
        text.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w))
      );
    };

    const w1 = getWords(text1);
    const w2 = getWords(text2);
    if (w1.size > 0 && w2.size > 0) {
      let intersection = 0;
      for (const w of w1) {
        if (w2.has(w)) intersection++;
      }
      const union = w1.size + w2.size - intersection;
      if (union > 0 && (intersection / union) > 0.45) {
        return true;
      }
    }
  } else if (c1 === 'Global' || c2 === 'Global') {
    // One or both is global: compare question text similarity
    const getWords = (text: string) => {
      return new Set(text.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w)));
    };
    const w1 = getWords(text1);
    const w2 = getWords(text2);
    if (w1.size > 0 && w2.size > 0) {
      let intersection = 0;
      for (const w of w1) {
        if (w2.has(w)) intersection++;
      }
      const union = w1.size + w2.size - intersection;
      if (union > 0 && (intersection / union) > 0.55) {
        return true;
      }
    }
  }

  return false;
}

// In-memory runtime cache for the active browser session
const memorySeenBriefs: Map<string, QuestionBrief[]> = new Map();
const memorySeenIds: Map<string, Set<string>> = new Map();

/**
 * Loads persistent seen questions for a username.
 */
export function getSeenQuestions(username: string = 'Guest'): QuestionBrief[] {
  const userKey = username || 'Guest';
  if (memorySeenBriefs.has(userKey)) {
    return memorySeenBriefs.get(userKey)!;
  }

  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userKey}`);
    if (raw) {
      const parsed: QuestionBrief[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memorySeenBriefs.set(userKey, parsed);
        const ids = new Set(parsed.map(q => q.id).filter(Boolean));
        memorySeenIds.set(userKey, ids);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[questionHistoryService] Failed to load from localStorage:', e);
  }

  memorySeenBriefs.set(userKey, []);
  memorySeenIds.set(userKey, new Set());
  return [];
}

/**
 * Gets a set of seen question IDs for fast lookup.
 */
export function getSeenQuestionIds(username: string = 'Guest'): string[] {
  const userKey = username || 'Guest';
  if (!memorySeenIds.has(userKey)) {
    getSeenQuestions(userKey);
  }
  return Array.from(memorySeenIds.get(userKey) || []);
}

/**
 * Persists seen questions to localStorage.
 */
function persistSeenQuestions(username: string = 'Guest'): void {
  if (typeof window === 'undefined') return;
  const userKey = username || 'Guest';
  const list = memorySeenBriefs.get(userKey) || [];

  try {
    // Keep within reasonable capacity
    const capped = list.length > MAX_PERSISTED_HISTORY
      ? list.slice(list.length - MAX_PERSISTED_HISTORY)
      : list;
    localStorage.setItem(`${STORAGE_PREFIX}${userKey}`, JSON.stringify(capped));
  } catch (e) {
    console.warn('[questionHistoryService] Failed to save to localStorage:', e);
  }
}

/**
 * Checks if a question has already been seen by this user.
 */
export function isQuestionSeen(username: string = 'Guest', question: QuestionBrief): boolean {
  if (!question) return false;
  const userKey = username || 'Guest';
  const seenList = getSeenQuestions(userKey);
  const seenIds = memorySeenIds.get(userKey);

  if (question.id && seenIds && seenIds.has(question.id)) {
    return true;
  }

  return seenList.some(sq => areQuestionsDuplicate(question, sq));
}

/**
 * Immediately records a question as seen by the user.
 */
export function recordSeenQuestion(username: string = 'Guest', question: QuestionBrief): void {
  if (!question || !question.question) return;
  const userKey = username || 'Guest';
  const seenList = getSeenQuestions(userKey);
  const seenIds = memorySeenIds.get(userKey) || new Set<string>();

  // Check if already in list
  if (question.id && seenIds.has(question.id)) return;
  if (seenList.some(sq => areQuestionsDuplicate(question, sq))) return;

  const brief: QuestionBrief = {
    id: question.id,
    question: question.question,
    country: getCanonicalCountryName(question.country || 'Global'),
    category: question.category,
    signature: question.signature || getQuestionSignature(question.question),
    timestamp: Date.now()
  };

  seenList.push(brief);
  if (brief.id) seenIds.add(brief.id);
  memorySeenBriefs.set(userKey, seenList);
  memorySeenIds.set(userKey, seenIds);

  persistSeenQuestions(userKey);
}

/**
 * Batch records multiple questions as seen.
 */
export function recordSeenQuestions(username: string = 'Guest', questions: QuestionBrief[]): void {
  if (!Array.isArray(questions) || questions.length === 0) return;
  const userKey = username || 'Guest';
  const seenList = getSeenQuestions(userKey);
  const seenIds = memorySeenIds.get(userKey) || new Set<string>();

  let changed = false;
  for (const q of questions) {
    if (!q || !q.question) continue;
    if (q.id && seenIds.has(q.id)) continue;
    if (seenList.some(sq => areQuestionsDuplicate(q, sq))) continue;

    const brief: QuestionBrief = {
      id: q.id,
      question: q.question,
      country: getCanonicalCountryName(q.country || 'Global'),
      category: q.category,
      signature: q.signature || getQuestionSignature(q.question),
      timestamp: Date.now()
    };
    seenList.push(brief);
    if (brief.id) seenIds.add(brief.id);
    changed = true;
  }

  if (changed) {
    memorySeenBriefs.set(userKey, seenList);
    memorySeenIds.set(userKey, seenIds);
    persistSeenQuestions(userKey);
  }
}

/**
 * Filter an array of candidate questions to only those not yet seen by the user.
 */
export function filterUnseenQuestions<T extends QuestionBrief>(
  username: string = 'Guest',
  candidates: T[]
): T[] {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  const userKey = username || 'Guest';
  return candidates.filter(c => !isQuestionSeen(userKey, c));
}

/**
 * Migrates questions seen while playing as 'Guest' into the authenticated user's history.
 */
export function migrateGuestSeenQuestions(toUsername: string): void {
  if (!toUsername || toUsername === 'Guest') return;
  const guestQuestions = getSeenQuestions('Guest');
  if (guestQuestions.length > 0) {
    recordSeenQuestions(toUsername, guestQuestions);
  }
}

/**
 * Engine fingerprints anti-repeat helpers.
 */
const ENGINE_FP_PREFIX = 'mooearth_engine_seen_fps_';

export function getSeenEngineFingerprints(username: string = 'Guest'): string[] {
  if (typeof window === 'undefined') return [];
  const userKey = username || 'Guest';
  try {
    const raw = sessionStorage.getItem(`${ENGINE_FP_PREFIX}${userKey}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function recordSeenEngineFingerprint(username: string = 'Guest', fingerprint: string): void {
  if (typeof window === 'undefined' || !fingerprint) return;
  const userKey = username || 'Guest';
  try {
    const existing = getSeenEngineFingerprints(userKey);
    if (!existing.includes(fingerprint)) {
      existing.push(fingerprint);
      const capped = existing.slice(-200);
      sessionStorage.setItem(`${ENGINE_FP_PREFIX}${userKey}`, JSON.stringify(capped));
    }
  } catch (e) {}
}
