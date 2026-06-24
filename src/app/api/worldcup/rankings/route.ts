import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory cache
let cachedRankings: any[] | null = null;
let cachedAuditLog: any = null;
let cacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour — FIFA rankings update infrequently

/**
 * Compute the FIFA date ID (days since 1985-01-01) for a given date string.
 */
function computeDateId(dateStr: string): string {
  const start = new Date('1985-01-01').getTime();
  const current = new Date(dateStr).getTime();
  const days = Math.round((current - start) / (1000 * 60 * 60 * 24));
  return `id${days}`;
}

/**
 * Fetch the latest ranking date from inside.fifa.com by scraping __NEXT_DATA__.
 */
async function fetchLatestRankingDate(): Promise<string | null> {
  try {
    const res = await fetch('https://inside.fifa.com/fifa-world-ranking/men', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(/<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return null;

    const nextData = JSON.parse(match[1]);
    const latestDate = nextData?.props?.pageProps?.pageData?.ranking?.allAvailableDates?.[0]?.date;
    return latestDate || null;
  } catch {
    return null;
  }
}

/**
 * Fetch official FIFA rankings from the ranking-overview API.
 */
async function fetchFifaRankings(dateId: string): Promise<any[]> {
  const url = `https://inside.fifa.com/api/ranking-overview?locale=en&dateId=${dateId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`FIFA ranking API returned ${res.status}`);
  }

  const data = await res.json();
  if (!data.rankings || !Array.isArray(data.rankings) || data.rankings.length === 0) {
    throw new Error('FIFA ranking API returned empty rankings');
  }

  return data.rankings;
}

/**
 * Validate that the rankings data is authentic:
 * Argentina must be ranked #1 as of the latest 2026-06-11 update.
 */
function validateRankings(rankings: any[]): boolean {
  const argentina = rankings.find(
    (r: any) => r.rankingItem?.name === 'Argentina'
  );
  return argentina?.rankingItem?.rank === 1;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const refresh = searchParams.get('refresh') === 'true';
  const now = Date.now();

  // Return cache if valid
  if (!refresh && cachedRankings && cachedAuditLog && (now - cacheTime < CACHE_TTL)) {
    return NextResponse.json({
      rankings: cachedRankings,
      audit: cachedAuditLog,
      cached: true,
    });
  }

  const auditLog: any = {
    sourceApi: 'inside.fifa.com/api/ranking-overview',
    lastSync: new Date().toISOString(),
    totalTeamsLoaded: 0,
    errors: [] as string[],
    status: 'pending',
  };

  try {
    // Step 1: Get the latest ranking date
    const latestDate = await fetchLatestRankingDate();
    if (!latestDate) {
      auditLog.errors.push('Failed to extract latest ranking date from inside.fifa.com');
      auditLog.status = 'failed';
      return NextResponse.json({
        rankings: null,
        audit: auditLog,
        error: 'Ranking unavailable',
      }, { status: 503 });
    }

    auditLog.latestDate = latestDate;

    // Step 2: Compute date ID and fetch rankings
    const dateId = computeDateId(latestDate);
    auditLog.dateId = dateId;

    const rankings = await fetchFifaRankings(dateId);
    auditLog.totalTeamsLoaded = rankings.length;

    // Step 3: Validate rankings
    const isValid = validateRankings(rankings);
    if (!isValid) {
      auditLog.errors.push('Validation failed: Argentina is not ranked #1. Data may be stale or corrupt.');
      auditLog.status = 'validation_failed';
      return NextResponse.json({
        rankings: null,
        audit: auditLog,
        error: 'Ranking unavailable',
      }, { status: 503 });
    }

    // Step 4: Format for client consumption
    const formattedRankings = rankings.map((r: any) => ({
      rank: r.rankingItem.rank,
      name: r.rankingItem.name,
      countryCode: r.rankingItem.countryCode,
      totalPoints: r.rankingItem.totalPoints,
      previousRank: r.rankingItem.previousRank,
      confederation: r.tag?.text || 'N/A',
      flagUrl: r.rankingItem.flag?.src || null,
      lastUpdateDate: r.lastUpdateDate,
    }));

    auditLog.status = 'success';

    // Cache the results
    cachedRankings = formattedRankings;
    cachedAuditLog = auditLog;
    cacheTime = now;

    return NextResponse.json({
      rankings: formattedRankings,
      audit: auditLog,
      cached: false,
    });
  } catch (error: any) {
    console.error('[FIFA Rankings API] Error:', error);
    auditLog.errors.push(error?.message || 'Unknown error');
    auditLog.status = 'error';

    // Return cache if available even on error
    if (cachedRankings) {
      return NextResponse.json({
        rankings: cachedRankings,
        audit: { ...auditLog, note: 'Returning stale cache due to fetch error' },
        cached: true,
      });
    }

    return NextResponse.json({
      rankings: null,
      audit: auditLog,
      error: 'Ranking unavailable',
    }, { status: 503 });
  }
}
