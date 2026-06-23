import { NextRequest, NextResponse } from 'next/server';
import { fetchWorldCupMatches } from '@/services/football';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const refresh = searchParams.get('refresh') === 'true';

    const matches = await fetchWorldCupMatches(refresh);

    return NextResponse.json(matches, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error: any) {
    console.error('API /api/worldcup/matches error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch World Cup matches' },
      { status: 500 }
    );
  }
}
