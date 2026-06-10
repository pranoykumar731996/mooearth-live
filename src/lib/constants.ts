// ============================================================
// EarthPulse AI — Constants & Configuration
// ============================================================

import { CategoryConfig, EventCategory, GlobePointOfView, SidebarItem } from '@/types';

/** Category visual configuration map */
export const CATEGORY_MAP: Record<EventCategory, CategoryConfig> = {
  breaking: {
    label: 'Breaking News',
    emoji: '🔴',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  sports: {
    label: 'Sports',
    emoji: '🟢',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  technology: {
    label: 'Technology',
    emoji: '🔵',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  business: {
    label: 'Business',
    emoji: '🟡',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    bgColor: 'rgba(234, 179, 8, 0.15)',
  },
  weather: {
    label: 'Weather',
    emoji: '🟠',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    bgColor: 'rgba(249, 115, 22, 0.15)',
  },
  entertainment: {
    label: 'Entertainment',
    emoji: '🟣',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    bgColor: 'rgba(168, 85, 247, 0.15)',
  },
};

/** Globe rendering configuration */
export const GLOBE_CONFIG = {
  defaultPov: { lat: 20, lng: 0, altitude: 2.5 } as GlobePointOfView,
  autoRotateSpeed: 0.35,
  transitionDuration: 1500,
  atmosphereColor: '#00e5ff',
  atmosphereAltitude: 0.22,
  globeImageUrl: '//unpkg.com/three-globe/example/img/earth-night.jpg',
  bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
  markerAltitude: 0.01,
  ringMaxRadius: 3,
  ringPropagationSpeed: 2,
  ringRepeatPeriod: 1200,
};

/** Search debounce in milliseconds */
export const SEARCH_DEBOUNCE_MS = 200;

/** Sidebar navigation items */
export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'breaking', label: 'News', icon: '📰', category: 'breaking' },
  { id: 'sports', label: 'Sports', icon: '⚽', category: 'sports' },
  { id: 'technology', label: 'Technology', icon: '💻', category: 'technology' },
  { id: 'weather', label: 'Weather', icon: '🌤️', category: 'weather' },
  { id: 'business', label: 'Business', icon: '📈', category: 'business' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', category: 'entertainment' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];
