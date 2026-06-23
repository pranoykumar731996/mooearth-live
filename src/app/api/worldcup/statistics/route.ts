import { NextRequest, NextResponse } from 'next/server';
import { fetchMatchStatistics } from '@/services/football';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fixtureIdStr = searchParams.get('fixtureId');
    const refresh = searchParams.get('refresh') === 'true';

    if (!fixtureIdStr) {
      return NextResponse.json({ error: 'Missing fixtureId parameter' }, { status: 400 });
    }

    // Strip prefix if the client passes it (e.g. 'wc26-12345' -> 12345)
    const numericId = parseInt(fixtureIdStr.replace(/[^\d]/g, ''), 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid fixtureId format' }, { status: 400 });
    }

    const statistics = await fetchMatchStatistics(numericId, refresh);

    return NextResponse.json(statistics, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error: any) {
    console.error('API /api/worldcup/statistics error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch match statistics' },
      { status: 500 }
    );
  }
}
