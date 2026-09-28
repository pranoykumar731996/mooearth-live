// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Validation Engine
// ============================================================
// Deterministic answer validation for all challenge response types.
// Includes Haversine geodesic distance calculation, border graph
// connectivity check, numeric tolerance, and multiple-choice index matching.

import {
  EarthChallenge,
  UserResponse,
  ValidationResult,
  GeoCoordinate,
} from './types';
import { COUNTRY_METADATA } from '@/data/questions/countryMetadata';
import { getCanonicalCountryName, matchCountry } from '@/data/questions';

// ---- Haversine Geodesic Distance ----

const EARTH_RADIUS_KM = 6371;

/** Convert degrees to radians */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate the great-circle distance between two points using the
 * Haversine formula. Returns distance in kilometers.
 */
export function haversineDistance(
  a: GeoCoordinate,
  b: GeoCoordinate
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfLng * sinHalfLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

// ---- Border Graph ----

/** Lazily constructed country-border adjacency graph */
let borderGraph: Map<string, Set<string>> | null = null;

function buildBorderGraph(): Map<string, Set<string>> {
  if (borderGraph) return borderGraph;

  borderGraph = new Map();
  for (const meta of Object.values(COUNTRY_METADATA)) {
    const name = meta.name.toLowerCase();
    if (!borderGraph.has(name)) {
      borderGraph.set(name, new Set());
    }
    if (meta.neighbours) {
      for (const neighbour of meta.neighbours) {
        const nName = neighbour.toLowerCase();
        borderGraph.get(name)!.add(nName);
        // Ensure bidirectional
        if (!borderGraph.has(nName)) {
          borderGraph.set(nName, new Set());
        }
        borderGraph.get(nName)!.add(name);
      }
    }
  }
  return borderGraph;
}

/** Check if two countries share a border */
export function areBorderNeighbours(a: string, b: string): boolean {
  const graph = buildBorderGraph();
  const aName = a.toLowerCase().trim();
  const bName = b.toLowerCase().trim();
  const neighbours = graph.get(aName);
  return neighbours ? neighbours.has(bName) : false;
}

/** Get all neighbours for a country */
export function getNeighbours(country: string): string[] {
  const graph = buildBorderGraph();
  const neighbours = graph.get(country.toLowerCase().trim());
  return neighbours ? Array.from(neighbours) : [];
}

/**
 * Find the shortest border path between two countries using BFS.
 * Returns the path as an array of country names, or null if no path exists.
 */
export function findBorderPath(start: string, end: string): string[] | null {
  const graph = buildBorderGraph();
  const startName = start.toLowerCase().trim();
  const endName = end.toLowerCase().trim();

  if (startName === endName) return [startName];
  if (!graph.has(startName) || !graph.has(endName)) return null;

  const visited = new Set<string>();
  const queue: { node: string; path: string[] }[] = [{ node: startName, path: [startName] }];
  visited.add(startName);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbours = graph.get(current.node);
    if (!neighbours) continue;

    for (const neighbour of neighbours) {
      if (visited.has(neighbour)) continue;

      const newPath = [...current.path, neighbour];
      if (neighbour === endName) return newPath;

      visited.add(neighbour);
      queue.push({ node: neighbour, path: newPath });
    }
  }

  return null; // No path exists
}

/**
 * Validate a user-provided border path. Every consecutive pair must
 * share a verified border.
 */
export function validateBorderPath(path: string[]): {
  valid: boolean;
  invalidStep?: number;
  invalidPair?: [string, string];
} {
  if (path.length < 2) return { valid: true };

  for (let i = 0; i < path.length - 1; i++) {
    if (!areBorderNeighbours(path[i], path[i + 1])) {
      return {
        valid: false,
        invalidStep: i,
        invalidPair: [path[i], path[i + 1]],
      };
    }
  }
  return { valid: true };
}

// ---- Unified Validation ----

/**
 * Validate a user's response to any challenge type.
 * Returns a deterministic ValidationResult.
 */
export function validateResponse(
  challenge: EarthChallenge,
  response: UserResponse
): ValidationResult {
  switch (challenge.responseType) {
    case 'multiple_choice':
      return validateMultipleChoice(challenge, response);
    case 'globe_tap':
      return validateGlobeTap(challenge, response);
    case 'globe_point':
      return validateGlobePoint(challenge, response);
    case 'numeric_input':
    case 'slider':
      return validateNumericInput(challenge, response);
    case 'path_select':
      return validatePathSelect(challenge, response);
    default:
      return {
        correct: false,
        feedback: 'Unknown challenge response type.',
      };
  }
}

// ---- Type-Specific Validators ----

function validateMultipleChoice(
  challenge: EarthChallenge,
  response: UserResponse
): ValidationResult {
  const correct = response.choiceIndex === challenge.correctIndex;
  const correctAnswer =
    challenge.choices && challenge.correctIndex !== undefined
      ? challenge.choices[challenge.correctIndex]
      : undefined;

  return {
    correct,
    accuracy: correct ? 1.0 : 0.0,
    feedback: correct ? 'Correct!' : `The correct answer was: ${correctAnswer}`,
    correctAnswer,
  };
}

function validateGlobeTap(
  challenge: EarthChallenge,
  response: UserResponse
): ValidationResult {
  if (!challenge.targetCountry || !response.tappedCountry) {
    return {
      correct: false,
      feedback: 'No country selected.',
      correctAnswer: challenge.targetCountry,
    };
  }

  const correct = matchCountry(response.tappedCountry, challenge.targetCountry);

  // If the user tapped a wrong country, compute approximate distance for feedback
  let distanceKm: number | undefined;
  if (!correct && challenge.targetCoordinates && response.tappedCoordinate) {
    distanceKm = Math.round(haversineDistance(response.tappedCoordinate, challenge.targetCoordinates));
  }

  return {
    correct,
    distanceKm,
    accuracy: correct ? 1.0 : 0.0,
    feedback: correct
      ? `Correct! That's ${challenge.targetCountry}!`
      : distanceKm
        ? `Not quite — ${challenge.targetCountry} is about ${distanceKm.toLocaleString()} km away.`
        : `The correct answer was ${challenge.targetCountry}.`,
    correctAnswer: challenge.targetCountry,
  };
}

function validateGlobePoint(
  challenge: EarthChallenge,
  response: UserResponse
): ValidationResult {
  if (!challenge.targetCoordinates || !response.tappedCoordinate) {
    return {
      correct: false,
      feedback: 'No location selected.',
    };
  }

  const distanceKm = Math.round(
    haversineDistance(response.tappedCoordinate, challenge.targetCoordinates)
  );
  const tolerance = challenge.toleranceRadius ?? 500; // Default 500 km tolerance
  const correct = distanceKm <= tolerance;

  // Calculate accuracy: 1.0 at 0 km, 0.0 at 2x tolerance
  const accuracy = Math.max(0, 1 - distanceKm / (tolerance * 2));

  let feedback: string;
  if (distanceKm < 50) {
    feedback = `🎯 Incredible! Only ${distanceKm} km away!`;
  } else if (distanceKm < 200) {
    feedback = `🎯 Very close! ${distanceKm} km away.`;
  } else if (correct) {
    feedback = `✅ Within range — ${distanceKm} km from the target.`;
  } else {
    feedback = `${distanceKm.toLocaleString()} km away from the target location.`;
  }

  return {
    correct,
    distanceKm,
    accuracy,
    feedback,
    correctAnswer: challenge.targetCity
      ? `${challenge.targetCity}, ${challenge.targetCountry}`
      : challenge.targetCountry,
  };
}

function validateNumericInput(
  challenge: EarthChallenge,
  response: UserResponse
): ValidationResult {
  if (response.numericValue === undefined || challenge.correctValue === undefined) {
    return {
      correct: false,
      feedback: 'No value provided.',
      correctAnswer: challenge.correctValue !== undefined
        ? String(challenge.correctValue)
        : undefined,
    };
  }

  const difference = Math.abs(response.numericValue - challenge.correctValue);
  const tolerance = challenge.toleranceRadius ?? challenge.correctValue * 0.15; // 15% default tolerance
  const correct = difference <= tolerance;

  // Accuracy scales from 1.0 (exact) to 0.0 (at 2x tolerance)
  const accuracy = Math.max(0, 1 - difference / (tolerance * 2));

  return {
    correct,
    accuracy,
    feedback: correct
      ? `Correct! The answer is ${Math.round(challenge.correctValue).toLocaleString()}.`
      : `The correct answer was ${Math.round(challenge.correctValue).toLocaleString()} (you guessed ${Math.round(response.numericValue).toLocaleString()}).`,
    correctAnswer: String(Math.round(challenge.correctValue)),
  };
}

function validatePathSelect(
  challenge: EarthChallenge,
  response: UserResponse
): ValidationResult {
  if (!response.selectedPath || response.selectedPath.length === 0) {
    return {
      correct: false,
      feedback: 'No path selected.',
    };
  }

  // Validate every step shares a border
  const pathValidation = validateBorderPath(response.selectedPath);
  if (!pathValidation.valid) {
    return {
      correct: false,
      feedback: `Invalid move: ${pathValidation.invalidPair?.[0]} does not border ${pathValidation.invalidPair?.[1]}.`,
    };
  }

  // For Border Escape: check if the path reaches the target
  if (challenge.correctPath && challenge.correctPath.length > 0) {
    const targetCountry = challenge.correctPath[challenge.correctPath.length - 1];
    const playerEnd = response.selectedPath[response.selectedPath.length - 1];
    const reached = matchCountry(playerEnd, targetCountry);

    if (!reached) {
      return {
        correct: false,
        feedback: `You haven't reached ${targetCountry} yet.`,
        correctAnswer: challenge.correctPath.join(' → '),
      };
    }

    // Bonus accuracy for efficiency (shorter = better)
    const optimalLength = challenge.correctPath.length;
    const playerLength = response.selectedPath.length;
    const accuracy = Math.max(0, Math.min(1, optimalLength / playerLength));

    return {
      correct: true,
      accuracy,
      feedback: playerLength <= optimalLength
        ? `🏆 Optimal route! ${playerLength} moves.`
        : `Reached ${targetCountry} in ${playerLength} moves (shortest: ${optimalLength}).`,
      correctAnswer: challenge.correctPath.join(' → '),
    };
  }

  // For Country Chain: path is valid, score by length
  return {
    correct: true,
    accuracy: 1.0,
    feedback: `Chain of ${response.selectedPath.length} countries!`,
  };
}
