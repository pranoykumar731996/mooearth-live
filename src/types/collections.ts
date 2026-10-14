// ============================================================
// MooEarth.Live — Discovery Collections & Creator Types
// ============================================================

export type CollectionStatus = 'draft' | 'published' | 'unlisted' | 'flagged' | 'archived';

export type CollectionCategory =
  | 'education'
  | 'journey'
  | 'landmarks'
  | 'capitals'
  | 'nature'
  | 'culture'
  | 'news_stories'
  | 'custom';

export type CollectionTemplateId =
  | 'five_countries'
  | 'landmarks'
  | 'capitals'
  | 'journey'
  | 'challenge'
  | 'custom';

export interface CollectionLocationItem {
  id: string; // Canonical identifier, e.g. "loc_tokyo" or country code "JP"
  name: string;
  country?: string;
  countryCode?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  order?: number;
  educationalNotes?: string; // Creator/Educator authored note
  notesAttribution?: 'creator' | 'educator' | 'publisher';
  articleRef?: {
    articleId: string;
    title: string;
    url: string;
    publisher: string;
  };
  quizChallengeId?: string; // Optional reference to verified question from game engine
  quizCheckpoint?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  };
}

export interface DiscoveryCollection {
  id: string; // Stable alphanumeric ID
  slug: string;
  title: string;
  description: string;
  category: CollectionCategory;
  templateId?: CollectionTemplateId;
  creatorUid: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorBadge?: 'Creator' | 'Educator' | 'Publisher Partner' | 'Explorer';
  isPublisherCurated?: boolean;
  publisherName?: string;
  status: CollectionStatus;
  locations: CollectionLocationItem[];
  totalLocations: number;
  featuredCountryCodes: string[];
  coverEmoji: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  viewsCount?: number;
  sharesCount?: number;
  reportsCount?: number;
}

export interface CollectionReport {
  id: string;
  collectionId: string;
  reporterUid?: string;
  reporterEmail?: string;
  reason: 'spam' | 'inappropriate' | 'inaccurate' | 'misleading' | 'broken_links' | 'copyright' | 'other';
  details: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  actionTaken?: 'none' | 'unpublished' | 'deleted' | 'warning_sent' | string;
}

export interface ModerationAuditLog {
  id: string;
  collectionId?: string;
  targetCollectionId?: string;
  action: 'approved' | 'unpublished' | 'removed' | 'report_dismissed' | 'approve' | 'unpublish' | 'remove' | 'dismiss' | string;
  adminUid?: string;
  moderatorUid?: string;
  reason?: string;
  timestamp: number;
}
