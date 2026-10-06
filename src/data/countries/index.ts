// ============================================================
// MooEarth Live — Country Hub Engine (Canonical Query API)
// ============================================================

import { CANONICAL_COUNTRIES } from './canonicalCountries';
import { CountryRecord } from './types';

export * from './types';
export { CANONICAL_COUNTRIES };

// Pre-indexed map by slug for O(1) lookups
const COUNTRY_BY_SLUG = new Map<string, CountryRecord>();
// Pre-indexed map by ID (ISO2 code lowercase) for O(1) lookups
const COUNTRY_BY_ID = new Map<string, CountryRecord>();
// Pre-indexed map by normalized country name
const COUNTRY_BY_NAME = new Map<string, CountryRecord>();

for (const country of CANONICAL_COUNTRIES) {
  COUNTRY_BY_SLUG.set(country.slug.toLowerCase(), country);
  COUNTRY_BY_ID.set(country.id.toLowerCase(), country);
  COUNTRY_BY_ID.set(country.iso2.toLowerCase(), country);
  COUNTRY_BY_ID.set(country.iso3.toLowerCase(), country);
  COUNTRY_BY_NAME.set(country.name.toLowerCase(), country);
}

// Common aliases mapping to canonical slugs
const SLUG_ALIASES: Record<string, string> = {
  'usa': 'united-states',
  'us': 'united-states',
  'united-states-of-america': 'united-states',
  'america': 'united-states',
  'uk': 'united-kingdom',
  'great-britain': 'united-kingdom',
  'england': 'united-kingdom',
  'britain': 'united-kingdom',
  'uae': 'united-arab-emirates',
  'emirates': 'united-arab-emirates',
  'russia': 'russia',
  'russian-federation': 'russia',
  'south-korea': 'south-korea',
  'republic-of-korea': 'south-korea',
  'korea': 'south-korea',
  'north-korea': 'north-korea',
  'dprk': 'north-korea',
  'czechia': 'czech-republic',
  'dr-congo': 'democratic-republic-of-the-congo',
  'drc': 'democratic-republic-of-the-congo',
  'congo-kinshasa': 'democratic-republic-of-the-congo',
  'republic-of-the-congo': 'congo',
  'congo-brazzaville': 'congo',
  'ivory-coast': 'ivory-coast',
  'cote-divoire': 'ivory-coast',
  'côte-d-ivoire': 'ivory-coast',
  'cote-d-ivoire': 'ivory-coast',
  'cape-verde': 'cabo-verde',
  'holy-see': 'vatican-city',
  'vatican': 'vatican-city',
  'swaziland': 'eswatini',
  'east-timor': 'timor-leste',
  'burma': 'myanmar',
  'macedonia': 'north-macedonia',
  'syrian-arab-republic': 'syria',
  'lao-pdr': 'laos',
  'tanzania-united-republic': 'tanzania',
};

/**
 * Retrieve a country record by its exact URL slug.
 */
export function getCountryBySlug(slug: string): CountryRecord | null {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  
  // Direct match
  if (COUNTRY_BY_SLUG.has(normalized)) {
    return COUNTRY_BY_SLUG.get(normalized)!;
  }
  
  // Alias match
  if (SLUG_ALIASES[normalized]) {
    const canonical = SLUG_ALIASES[normalized];
    return COUNTRY_BY_SLUG.get(canonical) || null;
  }
  
  return null;
}

/**
 * Retrieve a country record by its ISO ID (alpha-2 or alpha-3, case-insensitive).
 */
export function getCountryById(id: string): CountryRecord | null {
  if (!id) return null;
  return COUNTRY_BY_ID.get(id.trim().toLowerCase()) || null;
}

/**
 * Retrieve a country record by its common or official name.
 */
export function getCountryByName(name: string): CountryRecord | null {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  if (COUNTRY_BY_NAME.has(normalized)) {
    return COUNTRY_BY_NAME.get(normalized)!;
  }
  
  // Fallback slugify match
  const slugified = normalized.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return getCountryBySlug(slugified);
}

/**
 * Return all 195 canonical countries.
 */
export function getAllCountries(): CountryRecord[] {
  return CANONICAL_COUNTRIES;
}

/**
 * Return all 195 canonical country URL slugs.
 */
export function getAllCountrySlugs(): string[] {
  return CANONICAL_COUNTRIES.map(c => c.slug);
}

/**
 * Resolve an arbitrary country string (slug, name, alias, code) to its canonical slug.
 */
export function resolveCanonicalSlug(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  const slugified = trimmed.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const bySlug = getCountryBySlug(slugified);
  if (bySlug) return bySlug.slug;

  const byName = getCountryByName(trimmed);
  if (byName) return byName.slug;

  const byId = getCountryById(trimmed);
  if (byId) return byId.slug;

  return null;
}
