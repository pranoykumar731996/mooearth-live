import { NextRequest, NextResponse } from 'next/server';
import { fetchWorldCupScorers } from '@/services/football';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const refresh = searchParams.get('refresh') === 'true';

    const scorers = await fetchWorldCupScorers(refresh);

    return NextResponse.json(scorers, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error: any) {
    console.error('API /api/worldcup/scorers error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch World Cup top scorers' },
      { status: 500 }
    );
  }
}
