/**
 * Utility function to remove diacritics/accents from a string.
 * Example: "São Paulo" -> "Sao Paulo"
 */
export function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Standard Levenshtein Distance implementation for spelling tolerance.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Checks if a search query is a spelling-tolerant match for a target string.
 */
export function isFuzzyMatch(query: string, target: string, threshold = 2): boolean {
  const q = removeDiacritics(query.toLowerCase().trim());
  const t = removeDiacritics(target.toLowerCase().trim());

  if (q === t) return true;
  if (t.includes(q)) return true;

  // For very short queries, don't allow Levenshtein distance matching to avoid noise
  if (q.length < 4) return false;

  const distance = getLevenshteinDistance(q, t);
  
  // Dynamic threshold based on length
  const maxDistance = q.length > 6 ? threshold + 1 : threshold;
  return distance <= maxDistance;
}

/**
 * Maps standard location abbreviations to their full names.
 */
export function resolveAbbreviation(query: string): string {
  const q = query.toUpperCase().trim().replace(/[^A-Z]/g, '');
  const abbrevMap: Record<string, string> = {
    'NYC': 'New York City',
    'LA': 'Los Angeles',
    'SF': 'San Francisco',
    'UK': 'United Kingdom',
    'USA': 'United States',
    'US': 'United States',
    'JP': 'Japan',
    'IN': 'India',
    'BR': 'Brazil',
    'DE': 'Germany',
    'FR': 'France',
    'BBSR': 'Bhubaneswar'
  };
  return abbrevMap[q] || query;
}
