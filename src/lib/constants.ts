// ============================================================
// MooEarth Live — Constants & Configuration
// ============================================================

import { CategoryConfig, EventCategory, GlobePointOfView, SidebarItem } from '@/types';

/** Category visual configuration map */
export const CATEGORY_MAP: Record<EventCategory, CategoryConfig> = {
  breaking: {
    label: 'Breaking News',
    emoji: '📰',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  sports: {
    label: 'Sports',
    emoji: '🏅',
    color: '#8b5cf6', // Purple to differentiate from football
    glowColor: 'rgba(139, 92, 246, 0.5)',
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  football: {
    label: 'Football',
    emoji: '⚽',
    color: '#10b981', // Emerald green
    glowColor: 'rgba(16, 185, 129, 0.5)',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  technology: {
    label: 'Technology',
    emoji: '💻',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  business: {
    label: 'Business',
    emoji: '💰',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    bgColor: 'rgba(234, 179, 8, 0.15)',
  },
  weather: {
    label: 'Weather',
    emoji: '🌦',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    bgColor: 'rgba(249, 115, 22, 0.15)',
  },
  entertainment: {
    label: 'Entertainment',
    emoji: '🎬',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    bgColor: 'rgba(168, 85, 247, 0.15)',
  },
};

/** Globe rendering configuration */
export const GLOBE_CONFIG = {
  defaultPov: { lat: 20, lng: 0, altitude: 1.5 } as GlobePointOfView, // Closer default
  introPov: { lat: 20, lng: 0, altitude: 5.0 } as GlobePointOfView,   // Intro distance
  autoRotateSpeed: 0.25, // Slower, more cinematic
  transitionDuration: 2500, // Longer transitions
  atmosphereColor: '#3a228a', // Deeper, more realistic glow
  atmosphereAltitude: 0.25, // Stronger glow
  globeImageUrl: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg', // Sharper textures, brighter oceans
  bumpImageUrl: '//unpkg.com/three-globe/example/img/earth-topology.png',
  cloudsImageUrl: '//unpkg.com/three-globe/example/img/earth-clouds10k.png', // Add clouds
  countriesGeoJsonUrl: 'https://unpkg.com/world-atlas@2/countries-110m.json',
  markerAltitude: 0.05,
  ringMaxRadius: 5,
  ringPropagationSpeed: 1.5,
  ringRepeatPeriod: 1500,
  arcDashLength: 0.4,
  arcDashGap: 0.2,
  arcDashInitialGap: () => Math.random(),
  arcDashAnimateTime: 4000,
  arcAltitude: 0.2,
};

/** Search debounce in milliseconds */
export const SEARCH_DEBOUNCE_MS = 200;

/** Sidebar navigation items */
export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'breaking', label: 'News', icon: '📰', category: 'breaking' },
  { id: 'football', label: 'Football', icon: '⚽', category: 'football' },
  { id: 'sports', label: 'Sports', icon: '🏅', category: 'sports' },
  { id: 'technology', label: 'Technology', icon: '💻', category: 'technology' },
  { id: 'weather', label: 'Weather', icon: '🌤️', category: 'weather' },
  { id: 'business', label: 'Business', icon: '📈', category: 'business' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', category: 'entertainment' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];
