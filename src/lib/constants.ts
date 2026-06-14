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
  worldcup: {
    label: 'FIFA World Cup 2026',
    emoji: '⚽',
    color: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.5)',
    bgColor: 'rgba(0, 229, 255, 0.15)',
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
  globeImageUrl: '/textures/globe-night.jpg', // Optimized local night texture (698KB)
  globePlaceholderUrl: '/textures/globe-night-placeholder.jpg', // Ultra-fast low-res night globe placeholder (32.6KB)
  bumpImageUrl: '/textures/globe-topology.png', // Optimized local topology bump map (369KB)
  cloudsImageUrl: '/textures/clouds.png', // Optimized local transparent clouds layer (554KB)
  cloudsPlaceholderUrl: '/textures/clouds-placeholder.png', // Ultra-fast low-res clouds placeholder (39.7KB)
  countriesGeoJsonUrl: '/data/countries-110m.json', // Locally hosted GeoJSON to eliminate unpkg latency (105.2KB)
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
  { id: 'sports', label: 'FIFA World Cup 2026', icon: '🏆', category: 'worldcup' },
  { id: 'technology', label: 'Technology', icon: '💻', category: 'technology' },
  { id: 'weather', label: 'Weather', icon: '🌤️', category: 'weather' },
  { id: 'business', label: 'Business', icon: '📈', category: 'business' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', category: 'entertainment' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/** Geocoding coordinates for major countries to prevent random ocean points */
export const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number; country: string; city: string }> = {
  'spain': { lat: 40.4168, lng: -3.7038, country: 'Spain', city: 'Madrid' },
  'brazil': { lat: -15.7938, lng: -47.8827, country: 'Brazil', city: 'Brasília' },
  'argentina': { lat: -34.6037, lng: -58.3816, country: 'Argentina', city: 'Buenos Aires' },
  'united kingdom': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', city: 'London' },
  'england': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', city: 'London' },
  'germany': { lat: 52.5200, lng: 13.4050, country: 'Germany', city: 'Berlin' },
  'france': { lat: 48.8566, lng: 2.3522, country: 'France', city: 'Paris' },
  'italy': { lat: 41.9028, lng: 12.4964, country: 'Italy', city: 'Rome' },
  'portugal': { lat: 38.7223, lng: -9.1393, country: 'Portugal', city: 'Lisbon' },
  'netherlands': { lat: 52.3676, lng: 4.9041, country: 'Netherlands', city: 'Amsterdam' },
  'belgium': { lat: 50.8503, lng: 4.3517, country: 'Belgium', city: 'Brussels' },
  'croatia': { lat: 45.8150, lng: 15.9819, country: 'Croatia', city: 'Zagreb' },
  'uruguay': { lat: -34.9011, lng: -56.1645, country: 'Uruguay', city: 'Montevideo' },
  'colombia': { lat: 4.7110, lng: -74.0721, country: 'Colombia', city: 'Bogotá' },
  'mexico': { lat: 19.4326, lng: -99.1332, country: 'Mexico', city: 'Mexico City' },
  'united states': { lat: 38.9072, lng: -77.0369, country: 'United States', city: 'Washington D.C.' },
  'usa': { lat: 38.9072, lng: -77.0369, country: 'United States', city: 'Washington D.C.' },
  'us': { lat: 38.9072, lng: -77.0369, country: 'United States', city: 'Washington D.C.' },
  'japan': { lat: 35.6762, lng: 139.6503, country: 'Japan', city: 'Tokyo' },
  'south korea': { lat: 37.5665, lng: 126.9780, country: 'South Korea', city: 'Seoul' },
  'morocco': { lat: 34.0209, lng: -6.8416, country: 'Morocco', city: 'Rabat' },
  'senegal': { lat: 14.7167, lng: -17.4677, country: 'Senegal', city: 'Dakar' },
  'canada': { lat: 45.4215, lng: -75.6972, country: 'Canada', city: 'Ottawa' },
  'australia': { lat: -35.2809, lng: 149.1300, country: 'Australia', city: 'Canberra' },
  'china': { lat: 39.9042, lng: 116.4074, country: 'China', city: 'Beijing' },
  'india': { lat: 28.6139, lng: 77.2090, country: 'India', city: 'New Delhi' },
};

/** Helper to geocode a country string into coordinates */
export function getCoordinatesForCountry(countryName: string): { lat: number; lng: number; country: string; city: string } | null {
  if (!countryName) return null;
  const norm = countryName.toLowerCase().trim();
  for (const [key, data] of Object.entries(COUNTRY_COORDINATES)) {
    if (norm.includes(key) || key.includes(norm)) {
      return data;
    }
  }
  return null;
}

