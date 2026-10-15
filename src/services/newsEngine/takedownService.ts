// ============================================================
// MooEarth Live — Editorial Correction & Takedown Service
// ============================================================
// Provides a fast, compliant, auditable workflow for legal takedowns,
// publisher retractions, copyright notices, and factual corrections.
// Retracted stories are instantly evicted from all caches and replaced
// with an immutable, transparent tombstone notice.
// ============================================================

import { ArticleDetails, CATEGORY_IMAGES } from '../article';

export interface TakedownRecord {
  id: string;
  target: string; // URL, canonical slug, or headline substring
  normalizedTarget: string;
  reason: string;
  action: 'retract' | 'tombstone' | 'delete';
  requester?: string;
  timestamp: string;
  resolutionNotes?: string;
}

// In-memory bounded takedown registry
const takedownRegistry = new Map<string, TakedownRecord>();

function normalizeTarget(target: string): string {
  if (!target) return '';
  return target.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Register a legal takedown, publisher retraction, or editorial removal
 */
export function recordTakedown(params: {
  target: string;
  reason: string;
  action?: 'retract' | 'tombstone' | 'delete';
  requester?: string;
  resolutionNotes?: string;
}): TakedownRecord {
  const { target, reason, action = 'tombstone', requester, resolutionNotes } = params;
  const normalized = normalizeTarget(target);
  const id = `td-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const record: TakedownRecord = {
    id,
    target,
    normalizedTarget: normalized,
    reason,
    action,
    requester,
    timestamp: new Date().toISOString(),
    resolutionNotes,
  };

  takedownRegistry.set(normalized, record);
  console.log(`[TakedownService] Registered ${action.toUpperCase()} for target: "${target}". Reason: ${reason}`);

  return record;
}

/**
 * Checks if a URL, headline, or article ID matches an active takedown
 */
export function isTakedownActive(targetUrlOrTitleOrId: string): boolean {
  if (!targetUrlOrTitleOrId) return false;
  const normalized = normalizeTarget(targetUrlOrTitleOrId);

  // Exact normalized match
  if (takedownRegistry.has(normalized)) return true;

  // Substring or URL parameter matching
  for (const [key, record] of takedownRegistry.entries()) {
    if (key.length > 8 && (normalized.includes(key) || key.includes(normalized))) {
      return true;
    }
  }

  return false;
}

/**
 * Retrieve takedown details if active
 */
export function getTakedownDetails(targetUrlOrTitleOrId: string): TakedownRecord | null {
  if (!targetUrlOrTitleOrId) return null;
  const normalized = normalizeTarget(targetUrlOrTitleOrId);

  if (takedownRegistry.has(normalized)) {
    return takedownRegistry.get(normalized)!;
  }

  for (const [key, record] of takedownRegistry.entries()) {
    if (key.length > 8 && (normalized.includes(key) || key.includes(normalized))) {
      return record;
    }
  }

  return null;
}

/**
 * Generates a dignified, transparent tombstone article when an item is retracted
 */
export function generateTombstoneArticle(
  id: string,
  title: string,
  sourceUrl: string,
  reason: string
): ArticleDetails {
  return {
    id: id || `tombstone-${Date.now()}`,
    title: `[Notice] Content Retracted / Removed: ${title}`,
    source: sourceUrl,
    publishedAt: new Date().toISOString(),
    country: 'International',
    category: 'breaking',
    publicationStatus: 'under_review',
    depthMode: 'briefing',
    accessLevel: 'dispatch',
    accessLabel: 'Retraction Notice',
    aiSummary: `This news briefing has been removed from active distribution following an editorial correction or legal notice. Reason: ${reason}.`,
    fullContent: `### Notice of Editorial Retraction and Content Removal\n\nThis article has been retracted or removed from MooEarth.Live following an editorial review, verified factual correction, or formal legal takedown notice.\n\n• **Status**: Retracted / Restricted\n• **Reason for Action**: ${reason}\n• **Action Taken**: Article text, summaries, and synthetic reporting have been permanently taken down from public reading.\n• **Timestamp**: ${new Date().toUTCString()}\n\nMooEarth is committed to rigorous factual integrity, transparency, and honoring publisher access controls and correction requests. For questions or editorial inquiries, please visit our contact desk.`,
    keyFacts: [
      'Content Retracted: Removed following legal or editorial review.',
      `Reason: ${reason}`,
      'Transparency: Publicly noted in accordance with MooEarth Takedown & Correction Policy.'
    ],
    author: 'MooEarth Standards & Legal Compliance Desk',
    image: CATEGORY_IMAGES.breaking,
    description: 'This news briefing has been removed following an editorial correction or legal notice.',
    sourceTransparency: {
      sourcesConsulted: 0,
      independentOutlets: 0,
      hasPaywalledOriginal: false,
      paywalledPublishers: [],
      lastCheckedAt: new Date().toISOString(),
      aiDisclosure: 'Content removed from distribution.',
      evidenceLimitations: ['Article has been retracted and is no longer available.'],
      sourcesList: [],
    },
    debug: {
      articleId: id,
      publisher: 'MooEarth Legal Desk',
      sourceUrl,
      contentRetrieved: false,
      summaryGenerated: false,
      cacheHit: false,
      validationPassed: false,
      takedownActive: true,
      reason,
    },
  };
}

/**
 * List all active takedown notices for administrative auditing
 */
export function listAllTakedowns(): TakedownRecord[] {
  return Array.from(takedownRegistry.values());
}

export interface PublicComplaintRecord {
  id: string;
  target: string;
  reason: string;
  complainantName?: string;
  complainantEmail?: string;
  timestamp: string;
  status: 'pending_editorial_review' | 'resolved' | 'dismissed';
}

const publicComplaintsRegistry = new Map<string, PublicComplaintRecord>();

/**
 * Registers an unauthenticated public correction/copyright complaint for human review
 */
export function recordPublicComplaint(params: {
  target: string;
  reason: string;
  complainantName?: string;
  complainantEmail?: string;
}): PublicComplaintRecord {
  const id = `cpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const record: PublicComplaintRecord = {
    id,
    target: params.target,
    reason: params.reason,
    complainantName: params.complainantName,
    complainantEmail: params.complainantEmail,
    timestamp: new Date().toISOString(),
    status: 'pending_editorial_review',
  };
  publicComplaintsRegistry.set(id, record);
  console.log(`[TakedownService] Registered PUBLIC COMPLAINT ${id} for target: "${params.target}"`);
  return record;
}

/**
 * List all submitted public complaints
 */
export function listPublicComplaints(): PublicComplaintRecord[] {
  return Array.from(publicComplaintsRegistry.values());
}
