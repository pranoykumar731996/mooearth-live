import { NextRequest, NextResponse } from 'next/server';
import { locations, LocationRecord } from '@/data/locations';
import { isFuzzyMatch, resolveAbbreviation, removeDiacritics } from '@/utils/fuzzySearch';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const queryParam = searchParams.get('q') || '';
    
    if (!queryParam.trim()) {
      return NextResponse.json({ locations: [] });
    }

    const query = queryParam.trim();
    // Resolve abbreviations (e.g. NYC -> New York City)
    const resolvedQuery = resolveAbbreviation(query);
    const qLower = removeDiacritics(resolvedQuery.toLowerCase());

    const matches: { location: LocationRecord; score: number }[] = [];

    for (const loc of locations) {
      const nameLower = removeDiacritics(loc.name.toLowerCase());
      const countryLower = removeDiacritics(loc.country.toLowerCase());
      const stateLower = loc.state ? removeDiacritics(loc.state.toLowerCase()) : '';
      
      // Calculate match score (lower is better/higher priority)
      let matched = false;
      let score = 100;

      // 1. Exact Name match (Score 0)
      if (nameLower === qLower) {
        matched = true;
        score = 0;
      }
      // 2. Exact Alias match (Score 1)
      else if (loc.aliases?.some(a => removeDiacritics(a.toLowerCase()) === qLower)) {
        matched = true;
        score = 1;
      }
      // 3. Name starts with query (Score 2)
      else if (nameLower.startsWith(qLower)) {
        matched = true;
        score = 2;
      }
      // 4. Substring Name match (Score 3)
      else if (nameLower.includes(qLower)) {
        matched = true;
        score = 3;
      }
      // 5. State match (Score 4)
      else if (stateLower && (stateLower === qLower || stateLower.startsWith(qLower))) {
        matched = true;
        score = 4;
      }
      // 6. Country match (Score 5)
      else if (countryLower === qLower || countryLower.startsWith(qLower)) {
        matched = true;
        score = 5;
      }
      // 7. Fuzzy match (Score 6)
      else if (isFuzzyMatch(resolvedQuery, loc.name)) {
        matched = true;
        score = 6;
      }
      // 8. Alias fuzzy match (Score 7)
      else if (loc.aliases?.some(a => isFuzzyMatch(resolvedQuery, a))) {
        matched = true;
        score = 7;
      }

      if (matched) {
        matches.push({ location: loc, score });
      }
    }

    // Sort by:
    // 1. Score ascending (exact matches first)
    // 2. Population descending (larger/more notable places first)
    const sorted = matches
      .sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }
        return (b.location.population || 0) - (a.location.population || 0);
      })
      .map(m => m.location);

    return NextResponse.json({ locations: sorted.slice(0, 10) });

  } catch (error) {
    console.error('API /api/locations error:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
