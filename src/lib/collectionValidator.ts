// ============================================================
// MooEarth.Live — Collection Validation & Anti-Spam Guard
// ============================================================
// Enforces:
// 1. Precise coordinate bounding (-90 <= lat <= 90, -180 <= lng <= 180).
// 2. Safe URL protocols (HTTP/HTTPS only; blocks javascript: and data: injection).
// 3. Title, description and note length constraints.
// 4. Duplicate location detection.
// 5. Spam / malicious content screening.

import { CollectionLocationItem } from '@/types/collections';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Validate latitude and longitude */
export function isValidCoordinate(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
export const validateCoordinates = isValidCoordinate;

/** Validate external article or resource URLs */
export function isValidSafeUrl(url?: string): boolean {
  if (!url) return true; // Optional field
  const trimmed = url.trim();
  if (trimmed.length === 0) return true;

  try {
    const parsed = new URL(trimmed);
    // Strictly whitelist secure protocols
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
export const validateUrl = (url: string) => {
  if (!url) return false;
  return isValidSafeUrl(url);
};

const SPAM_PATTERNS = [
  /(?:free|buy)\s*crypto/i,
  /bitcoin\s*(?:giveaway|bonus)/i,
  /\bcasino\b/i,
  /\bfree\s*money\b/i,
  /\bclick\s*here\b/i,
  /telegram\s*channel\s*@/i,
  /whatsapp\s*group\s*\+/i,
  /viagra/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/i,
  /onload\s*=/i,
  /onerror\s*=/i,
];

/** Check if text contains known spam or injection patterns */
export function containsSpamOrXSS(text?: string): boolean {
  if (!text) return false;
  return SPAM_PATTERNS.some((pattern) => pattern.test(text));
}

/** Comprehensive validator for discovery collections */
export function validateCollectionInput(input: {
  title: string;
  description: string;
  locations: CollectionLocationItem[];
}): ValidationResult {
  const errors: string[] = [];

  // 1. Title validation
  const title = (input.title || '').trim();
  if (title.length < 3) {
    errors.push('Collection title must be at least 3 characters long.');
  }
  if (title.length > 100) {
    errors.push('Collection title must not exceed 100 characters.');
  }
  if (containsSpamOrXSS(title)) {
    errors.push('Collection title contains prohibited or suspicious content.');
  }

  // 2. Description validation
  const description = (input.description || '').trim();
  if (description.length > 1000) {
    errors.push('Collection description must not exceed 1000 characters.');
  }
  if (containsSpamOrXSS(description)) {
    errors.push('Collection description contains prohibited content.');
  }

  // 3. Locations validation
  const locations = input.locations || [];
  if (locations.length < 1) {
    errors.push('Collection must contain at least 1 geographic discovery.');
  }
  if (locations.length > 25) {
    errors.push('Collection cannot exceed 25 locations.');
  }

  const seenIds = new Set<string>();

  locations.forEach((loc, idx) => {
    const itemNum = idx + 1;
    if (!loc.name || loc.name.trim().length === 0) {
      errors.push(`Location #${itemNum} is missing a place name.`);
    }

    if (!isValidCoordinate(loc.coordinates?.lat, loc.coordinates?.lng)) {
      errors.push(`Location #${itemNum} (${loc.name || 'unnamed'}) has invalid geographic coordinates.`);
    }

    if (loc.educationalNotes && loc.educationalNotes.length > 600) {
      errors.push(`Location #${itemNum} notes exceed 600 characters.`);
    }

    if (containsSpamOrXSS(loc.educationalNotes)) {
      errors.push(`Location #${itemNum} notes contain prohibited content.`);
    }

    if (loc.articleRef && !isValidSafeUrl(loc.articleRef.url)) {
      errors.push(`Location #${itemNum} article link has an unsafe or invalid URL.`);
    }

    // Check duplicate ID
    const canonicalId = (loc.id || `${loc.name}_${loc.country}`).toLowerCase();
    if (seenIds.has(canonicalId)) {
      errors.push(`Duplicate location detected: "${loc.name}". Each location in a collection should be unique.`);
    }
    seenIds.add(canonicalId);
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
