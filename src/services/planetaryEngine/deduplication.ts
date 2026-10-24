// ============================================================
// MooEarth Live — Planetary Engine: Cross-Agency Event Deduplication
// ============================================================
// Deduplicates natural disaster events reported by multiple agencies
// (GDACS, JTWC, NHC, NASA EONET, NASA Earth Observatory) so that
// a single physical storm, wildfire, or earthquake produces exactly
// one marker on the map.
//
// Strategy:
//  1. Canonical name normalization — strip agency prefixes/suffixes,
//     cyclone designators (29W, AL18), severity labels, and produce
//     a lowercase canonical key like "champi" or "helene".
//  2. Spatial proximity clustering — events within ~400 km whose
//     canonical names match are merged into the highest-authority source.
//  3. (0,0) coordinate rejection — NASA Earth Observatory articles
//     that couldn't be geolocated are excluded from disaster markers.
// ============================================================

import { PlanetaryEvent } from './types';

/**
 * Haversine distance in km between two lat/lng coordinates.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Extracts a canonical storm/event name from title or ID for cross-agency matching.
 * Strips agency prefixes (gdacs-tc-, jtwc-, nhc-, eonet-), cyclone designators
 * (29W, AL18, 02S), severity labels, and punctuation.
 *
 * Examples:
 *   "Tropical Cyclone CHAMPI (Category 3 Major Hurricane)" → "champi"
 *   "Super Typhoon Kong-rey"                               → "kong-rey"
 *   "gdacs-tc-champi-26"                                   → "champi"
 *   "jtwc-29w--champi-"                                    → "champi"
 *   "Hurricane Helene"                                     → "helene"
 *   "Typhoon Vance"                                        → "vance"
 */
export function extractCanonicalName(title: string, id: string): string {
  // Start from title — it's the most readable
  let candidate = title.toLowerCase();

  // Remove common cyclone classification prefixes
  candidate = candidate
    .replace(/^(tropical\s+cyclone\s+advisory:\s*)/i, '')
    .replace(/^(super\s+typhoon|typhoon|tropical\s+storm|tropical\s+cyclone|tropical\s+depression|hurricane|major\s+hurricane|severe\s+cyclonic\s+storm|very\s+severe\s+cyclonic\s+storm|cyclonic\s+storm|deep\s+depression)/i, '')
    .trim();

  // Remove parenthetical suffixes like "(Category 3 Major Hurricane)" or "(Tropical Storm)"
  candidate = candidate.replace(/\s*\(.*?\)\s*/g, '').trim();

  // Remove category labels that might remain
  candidate = candidate
    .replace(/category\s+\d+\s*(devastating|catastrophic|major)?\s*(hurricane|typhoon|cyclone)?/gi, '')
    .trim();

  // Remove GDACS-style alert text
  candidate = candidate
    .replace(/gdacs\s+\w+\s+alert:?\s*/gi, '')
    .trim();

  // Remove "invest" designator pattern (e.g. "INVEST 98B")
  candidate = candidate.replace(/invest\s+\w+/gi, '').trim();

  // Remove storm designator numbers that agencies use (e.g. "29W", "AL182024", "02S", "-26")
  candidate = candidate.replace(/\b\d{1,2}[WESCNP]\b/gi, '').trim();
  candidate = candidate.replace(/\b[A-Z]{2}\d{4,6}\b/gi, '').trim();
  candidate = candidate.replace(/-+\d+$/g, '').trim();

  // Remove "warning #NN" 
  candidate = candidate.replace(/warning\s+#?\d+/gi, '').trim();

  // Clean up punctuation
  candidate = candidate.replace(/[-_]+/g, '-').replace(/^[-\s]+|[-\s]+$/g, '').trim();

  // If the title extraction yielded something meaningful (>= 2 chars), use it
  if (candidate.length >= 2) {
    return candidate;
  }

  // Fallback: extract from ID
  let idCandidate = id.toLowerCase();
  // Strip agency prefixes
  idCandidate = idCandidate
    .replace(/^(gdacs-tc-|jtwc-|nhc-|eonet-|nasa-eo-|noaa-)/, '')
    .replace(/^(eonet_)/, '');
  // Strip trailing numbers
  idCandidate = idCandidate.replace(/-+\d+$/g, '').trim();
  // Strip storm designators
  idCandidate = idCandidate.replace(/\b\d{1,2}[wescnp]\b/gi, '').trim();
  idCandidate = idCandidate.replace(/[-_]+/g, '-').replace(/^[-\s]+|[-\s]+$/g, '');

  return idCandidate || id;
}

/**
 * Determines data-source priority for deduplication.
 * Higher number = higher authority. When two events are identified as
 * the same physical phenomenon, the one from the higher-authority source
 * is kept, and the other is discarded.
 *
 * Priority rationale:
 *  - NHC (NOAA) and JTWC provide the most authoritative operational cyclone data
 *  - GDACS aggregates NHC/JTWC but adds UN-level alerts
 *  - NASA EONET is authoritative for wildfires and volcanoes
 *  - NASA Earth Observatory is editorial/educational, lowest priority
 */
function getSourcePriority(event: PlanetaryEvent): number {
  const origin = event.dataOrigin || '';
  const id = event.id || '';
  
  // NHC storms come via noaaSevereStormsClient with id prefix 'nhc-' and dataOrigin 'noaa_severe'
  if (id.startsWith('nhc-')) return 90;
  if (id.startsWith('usgs-') || origin === 'usgs') return 88;
  if (id.startsWith('jtwc-') || origin === 'jtwc') return 85;
  if (id.startsWith('gdacs-') || origin === 'gdacs') return 80;
  if (id.startsWith('noaa-') || origin === 'noaa_severe') return 75;
  if (id.startsWith('eonet-') || origin === 'nasa_eonet') return 70;
  if (origin === 'noaa_swpc') return 65;
  if (origin === 'noaa_ocean') return 60;
  if (id.startsWith('nasa-eo-') || origin === 'nasa_earth_obs') return 30;
  return 50;
}

/**
 * Checks whether an event is a tropical cyclone based on its telemetry.
 */
function isCycloneEvent(event: PlanetaryEvent): boolean {
  if (event.planetaryTelemetry?.stormWarningType === 'tropical_cyclone') return true;
  const t = (event.title || '').toLowerCase();
  return (
    t.includes('cyclone') ||
    t.includes('hurricane') ||
    t.includes('typhoon') ||
    t.includes('tropical storm') ||
    t.includes('tropical depression')
  );
}

/**
 * Checks whether an event has a null-island (0, 0) coordinate,
 * indicating a failed geolocation. These should be excluded from
 * disaster map markers.
 */
function isNullIsland(event: PlanetaryEvent): boolean {
  return Math.abs(event.lat) < 0.5 && Math.abs(event.lng) < 0.5;
}

/** Maximum distance (km) for two cyclone events to be considered the same storm */
const CYCLONE_PROXIMITY_THRESHOLD_KM = 500;

/** Maximum distance (km) for two non-cyclone events of the same type */
const GENERAL_PROXIMITY_THRESHOLD_KM = 200;

/**
 * Main deduplication entry point.
 * Takes the raw merged event list from all agencies and returns
 * a deduplicated list where each physical phenomenon appears exactly once.
 */
export function deduplicatePlanetaryEvents(events: PlanetaryEvent[]): PlanetaryEvent[] {
  // Step 1: Remove null-island events from NASA Earth Observatory
  const validEvents = events.filter((e) => {
    if (isNullIsland(e) && (e.dataOrigin === 'nasa_earth_obs' || e.id.startsWith('nasa-eo-'))) {
      return false;
    }
    return true;
  });

  // Step 2: Sort by priority (highest first) so authoritative sources win
  const sorted = [...validEvents].sort((a, b) => getSourcePriority(b) - getSourcePriority(a));

  // Step 3: Cluster by canonical name + spatial proximity
  const kept: PlanetaryEvent[] = [];
  const processedCanonicalKeys = new Map<string, PlanetaryEvent>(); // canonical → best event
  const seenIds = new Set<string>();

  for (const event of sorted) {
    if (seenIds.has(event.id)) continue;

    const isThisCyclone = isCycloneEvent(event);
    const canonicalName = extractCanonicalName(event.title, event.id);

    // Check if we already have an event with the same canonical name
    if (canonicalName.length >= 2) {
      const existing = processedCanonicalKeys.get(canonicalName);
      if (existing) {
        // Same canonical name — check if same category and spatial proximity
        const bothCyclones = isThisCyclone && isCycloneEvent(existing);
        const sameCategory = event.category === existing.category;
        const thresholdKm = bothCyclones ? CYCLONE_PROXIMITY_THRESHOLD_KM : GENERAL_PROXIMITY_THRESHOLD_KM;
        const distance = haversineKm(event.lat, event.lng, existing.lat, existing.lng);

        if ((bothCyclones || sameCategory) && distance < thresholdKm) {
          // This is a duplicate — the existing one has higher priority, skip this one
          seenIds.add(event.id);
          continue;
        }
      }
    }

    // Not a duplicate — check against all kept events for close spatial matches
    // within the same canonical name family
    let isDuplicate = false;
    for (const existingEvent of kept) {
      if (event.category !== existingEvent.category) continue;

      const existCanonical = extractCanonicalName(existingEvent.title, existingEvent.id);
      
      // If canonical names don't share any significant overlap, skip
      if (!doNamesOverlap(canonicalName, existCanonical)) continue;

      const thresholdKm = (isThisCyclone && isCycloneEvent(existingEvent))
        ? CYCLONE_PROXIMITY_THRESHOLD_KM
        : GENERAL_PROXIMITY_THRESHOLD_KM;
      const distance = haversineKm(event.lat, event.lng, existingEvent.lat, existingEvent.lng);

      if (distance < thresholdKm) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      kept.push(event);
      seenIds.add(event.id);
      if (canonicalName.length >= 2) {
        processedCanonicalKeys.set(canonicalName, event);
      }
    } else {
      seenIds.add(event.id);
    }
  }

  return kept;
}

/**
 * Checks whether two canonical names refer to the same physical event.
 * Handles cases like "champi" vs "champi", "vance" vs "vance",
 * and partial matches where one is a substring of the other.
 */
function doNamesOverlap(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;
  if (nameA === nameB) return true;

  // Check if either is a significant substring of the other
  // (to handle cases like "kong-rey" vs "kong-rey typhoon")
  const shorterLen = Math.min(nameA.length, nameB.length);
  if (shorterLen < 3) return false;

  // Extract the most significant word (longest word) from each
  const wordsA = nameA.split(/[-\s]+/).filter(w => w.length >= 3);
  const wordsB = nameB.split(/[-\s]+/).filter(w => w.length >= 3);

  // Check for any shared significant word
  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wa === wb && wa.length >= 3) return true;
      // Fuzzy: one contains the other (handles "champi" vs "champis")
      if (wa.length >= 4 && wb.length >= 4 && (wa.includes(wb) || wb.includes(wa))) return true;
    }
  }

  return false;
}
