import { WorldEvent, EventCategory } from '@/types';
import { COUNTRY_COORDINATES } from '@/lib/constants';
import { locations, LocationRecord } from '@/data/locations';
import {
  fetchLivePlanetaryEvents,
  searchPlanetaryEvents,
  planetaryEventToWorldEvent,
} from './planetaryEngine';

export interface EventsWithStatus {
  events: WorldEvent[];
  status: {
    newsActive: boolean;
    footballActive: boolean;
  };
}

export interface LocationEventsResult {
  events: WorldEvent[];
  status: {
    newsActive: boolean;
    footballActive: boolean;
  };
  resolvedLocation: LocationRecord;
  activeLocation: LocationRecord | { name: string; type: string; country: string; countryCode: string; lat: number; lng: number };
  fallbackLevel: 'city' | 'state' | 'country' | 'global';
}

function detectCountry(text: string): string | undefined {
  const t = text.toLowerCase().trim();
  for (const key of Object.keys(COUNTRY_COORDINATES)) {
    if (t.includes(key.toLowerCase())) {
      return COUNTRY_COORDINATES[key].country;
    }
  }
  return undefined;
}

export function isArticleInCategory(title: string, summary: string, category: EventCategory): boolean {
  const text = `${title} ${summary}`.toLowerCase();
  
  if (category === 'seismic') {
    return ['earthquake', 'quake', 'richter', 'tsunami', 'fault', 'tremor', 'seismic', 'volcano', 'eruption', 'magma'].some(kw => text.includes(kw));
  }
  if (category === 'wildfires') {
    return ['wildfire', 'fire', 'blaze', 'thermal', 'burn', 'forest fire', 'bushfire', 'smoke'].some(kw => text.includes(kw));
  }
  if (category === 'space_weather') {
    return ['space', 'solar', 'aurora', 'geomagnetic', 'kp', 'flare', 'cosmic', 'nasa', 'astronomy', 'orbit', 'satellite'].some(kw => text.includes(kw));
  }
  if (category === 'severe_weather') {
    return ['storm', 'cyclone', 'hurricane', 'typhoon', 'tornado', 'blizzard', 'flood', 'wind', 'hail'].some(kw => text.includes(kw));
  }
  if (category === 'climate_oceans') {
    return ['ocean', 'sea', 'ice', 'glacier', 'arctic', 'antarctic', 'marine', 'drought', 'coral', 'climate'].some(kw => text.includes(kw));
  }
  if (category === 'science_nature') {
    return ['science', 'discovery', 'species', 'biology', 'nature', 'fossil', 'research', 'satellite', 'observation'].some(kw => text.includes(kw));
  }
  if (category === 'weather') {
    return ['weather', 'climate', 'storm', 'rain', 'temperature', 'forecast', 'meteorology', 'flood', 'wind', 'atmosphere', 'heat', 'cold', 'degree', 'season', 'cyclone', 'typhoon', 'hurricane', 'drought', 'snow'].some(kw => text.includes(kw));
  }
  if (category === 'sports' || category === 'football') {
    return ['sports', 'match', 'championship', 'tournament', 'cup', 'athlete', 'coach', 'stadium', 'olympic', 'football', 'soccer', 'basketball', 'tennis', 'game', 'score', 'team'].some(kw => text.includes(kw));
  }

  return true;
}

/**
 * Categorizes an event based on title and summary keywords.
 */
export function detectCategory(title: string, summary: string): EventCategory {
  const categories: EventCategory[] = [
    'seismic',
    'wildfires',
    'space_weather',
    'severe_weather',
    'climate_oceans',
    'science_nature',
    'football',
    'weather',
  ];

  for (const cat of categories) {
    if (isArticleInCategory(title, summary, cat)) {
      return cat;
    }
  }

  return 'science_nature';
}

export async function fetchAllEvents(category?: string | null, refresh = false, _lang = 'en'): Promise<EventsWithStatus> {
  const cat = (category && category !== 'home') ? (category as EventCategory) : null;

  // 1. Fetch live planetary events
  const planetaryEvents = await fetchLivePlanetaryEvents(refresh);
  let events = planetaryEvents.map(planetaryEventToWorldEvent);

  // Filter if a specific category is requested
  if (cat) {
    events = events.filter(e => e.category === cat || isArticleInCategory(e.title, e.summary, cat));
  }

  events.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return {
    events,
    status: {
      newsActive: false,
      footballActive: events.some(e => e.category === 'football' || e.category === 'sports'),
    },
  };
}

export async function searchAllEvents(query: string, category?: string | null, _refresh = false, _lang = 'en'): Promise<EventsWithStatus> {
  const cat = (category && category !== 'home') ? (category as EventCategory) : undefined;
  const planetaryEvents = await searchPlanetaryEvents(query, cat);
  let events = planetaryEvents.map(planetaryEventToWorldEvent);

  if (cat) {
    events = events.filter(e => e.category === cat || isArticleInCategory(e.title, e.summary, cat));
  }

  events.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return {
    events,
    status: {
      newsActive: false,
      footballActive: events.some(e => e.category === 'football' || e.category === 'sports'),
    },
  };
}

/**
 * Geographic Fallback Engine for Planetary Events
 * Fetches events specifically related to a Location:
 * City -> State -> Country -> Global
 */
export async function getLocationEvents(
  locationId: string,
  category?: string | null,
  refresh = false,
  _lang = 'en'
): Promise<LocationEventsResult> {
  const resolvedLocation = locations.find(l => l.id === locationId);
  if (!resolvedLocation) {
    throw new Error(`Location ID "${locationId}" not found in database.`);
  }

  const cat = (category && category !== 'home') ? (category as EventCategory) : undefined;
  let events: WorldEvent[] = [];
  let activeLocation: any = resolvedLocation;
  let fallbackLevel: 'city' | 'state' | 'country' | 'global' = 'city';

  // Helper to tag articles with the active location metadata and coordinates
  const tagArticles = (articles: WorldEvent[], loc: LocationRecord): WorldEvent[] => {
    return articles.map(art => ({
      ...art,
      country: loc.country,
      city: loc.type === 'city' ? loc.name : (art.city || ''),
      state: loc.type === 'city' ? (loc.state || '') : (loc.type === 'state' ? loc.name : ''),
      lat: loc.lat,
      lng: loc.lng
    }));
  };

  // 1. Try City level
  if (resolvedLocation.type === 'city') {
    const cityEvents = await searchPlanetaryEvents(resolvedLocation.name, cat);
    if (cityEvents.length > 0) {
      events = tagArticles(cityEvents.map(planetaryEventToWorldEvent), resolvedLocation);
      fallbackLevel = 'city';
    }
  }

  // 2. Try State level
  if (events.length === 0 && (resolvedLocation.type === 'city' || resolvedLocation.type === 'state')) {
    const stateName = resolvedLocation.type === 'city' ? resolvedLocation.state : resolvedLocation.name;
    const stateLoc = locations.find(l => l.name === stateName && l.type === 'state');
    if (stateName) {
      const stateEvents = await searchPlanetaryEvents(stateName, cat);
      if (stateEvents.length > 0) {
        events = tagArticles(stateEvents.map(planetaryEventToWorldEvent), stateLoc || resolvedLocation);
        fallbackLevel = 'state';
        activeLocation = stateLoc || {
          id: `state-${stateName.toLowerCase()}`,
          name: stateName,
          type: 'state',
          country: resolvedLocation.country,
          countryCode: resolvedLocation.countryCode,
          lat: resolvedLocation.lat,
          lng: resolvedLocation.lng,
          population: 0,
          timezone: resolvedLocation.timezone,
          adminLevel: 1
        };
      }
    }
  }

  // 3. Try Country level
  if (events.length === 0) {
    const countryLoc = locations.find(l => l.name === resolvedLocation.country && l.type === 'country');
    const countryEvents = await searchPlanetaryEvents(resolvedLocation.country, cat);
    if (countryEvents.length > 0) {
      events = tagArticles(countryEvents.map(planetaryEventToWorldEvent), countryLoc || resolvedLocation);
      fallbackLevel = 'country';
      activeLocation = countryLoc || resolvedLocation;
    }
  }

  // 4. Try Global level fallback
  if (events.length === 0) {
    const allPlanetary = await fetchLivePlanetaryEvents(refresh);
    events = allPlanetary.map(planetaryEventToWorldEvent);
    fallbackLevel = 'global';
    activeLocation = {
      name: 'Global',
      type: 'global',
      country: 'Global',
      countryCode: 'GL',
      lat: 20,
      lng: 0
    };
  }

  // Strict category filtering
  if (cat) {
    events = events.filter(e => isArticleInCategory(e.title, e.summary, cat));
  }

  events.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return {
    events,
    status: {
      newsActive: false,
      footballActive: events.some(e => e.category === 'football' || e.category === 'sports'),
    },
    resolvedLocation,
    activeLocation,
    fallbackLevel
  };
}
