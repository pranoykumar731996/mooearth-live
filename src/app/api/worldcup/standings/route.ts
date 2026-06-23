import { NextRequest, NextResponse } from 'next/server';
import { fetchWorldCupStandings } from '@/services/football';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const refresh = searchParams.get('refresh') === 'true';

    const standings = await fetchWorldCupStandings(refresh);

    return NextResponse.json(standings, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error: any) {
    console.error('API /api/worldcup/standings error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch World Cup standings' },
      { status: 500 }
    );
  }
}
