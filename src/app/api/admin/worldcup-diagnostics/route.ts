import { NextRequest, NextResponse } from 'next/server';
import { getWorldCupDiagnostics } from '@/services/football';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const diagnostics = getWorldCupDiagnostics();

    return NextResponse.json(diagnostics, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error: any) {
    console.error('API /api/admin/worldcup-diagnostics error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch diagnostics' },
      { status: 500 }
    );
  }
}
