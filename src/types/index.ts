// ============================================================
// EarthPulse AI — Type Definitions
// ============================================================

/** Supported event categories */
export type EventCategory =
  | 'breaking'
  | 'sports'
  | 'football'
  | 'technology'
  | 'business'
  | 'weather'
  | 'entertainment';

/** A world event displayed on the globe */
export interface WorldEvent {
  id: string;
  title: string;
  summary: string;
  category: EventCategory;
  country: string;
  city: string;
  lat: number;
  lng: number;
  source: string;
  publishedAt: string; // ISO 8601
}

/** Visual configuration for a category */
export interface CategoryConfig {
  label: string;
  emoji: string;
  color: string;       // Primary color (hex)
  glowColor: string;   // Glow / ring color (rgba)
  bgColor: string;     // Background tint for badges
}

/** Sidebar navigation item */
export interface SidebarItem {
  id: string;
  label: string;
  icon: string;        // Emoji or icon identifier
  category?: EventCategory; // If linked to a filter
}

/** Globe camera position */
export interface GlobePointOfView {
  lat: number;
  lng: number;
  altitude: number;
}

/** Connection arc between two events */
export interface EventArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}
