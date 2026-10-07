// ============================================================
// MooEarth Live — SEO Growth Report API
// GET  /api/admin/seo-report -> Returns structured SEO Report
// POST /api/admin/seo-report -> Ingests organic search telemetry
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getMasterSeoReport, recordOrganicTelemetry } from '@/services/searchConsoleService';
import { OrganicTelemetryRecord } from '@/lib/seo/searchConsoleGrowthEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await getMasterSeoReport();
    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[SEO Report API] Failed to generate report:', error);
    return NextResponse.json(
      { error: 'Failed to generate SEO growth report' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const telemetry = body as OrganicTelemetryRecord;

    if (!telemetry.landingPage || !telemetry.searchEngine) {
      return NextResponse.json({ error: 'Invalid telemetry record' }, { status: 400 });
    }

    recordOrganicTelemetry(telemetry);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record telemetry' }, { status: 500 });
  }
}
