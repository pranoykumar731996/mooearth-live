// ============================================================
// MooEarth Live — Public Health Status API
// ============================================================
// Returns real-time health telemetry of all core platform features,
// time since last 24h verification, and countdown to next run.
// ============================================================

import { NextRequest } from 'next/server';
import { getLatestHealthState } from '@/app/api/cron/daily-health-check/route';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin || 'https://www.mooearth.live';
  const state = getLatestHealthState();

  const lastCheckedDate = new Date(state.lastChecked);
  const nextCheckDate = new Date(lastCheckedDate.getTime() + 24 * 3600 * 1000);
  const now = new Date();
  const msUntilNext = Math.max(0, nextCheckDate.getTime() - now.getTime());

  return Response.json(
    {
      status: state.status,
      lastChecked: state.lastChecked,
      nextScheduledCheck: nextCheckDate.toISOString(),
      countdownMinutes: Math.round(msUntilNext / 60000),
      durationMs: state.durationMs,
      summary: {
        totalChecks: state.checks.length,
        passedChecks: state.checks.filter((c) => c.passed).length,
        failedChecks: state.checks.filter((c) => !c.passed).length,
      },
      system: {
        uptime: process.uptime ? Math.round(process.uptime()) : 86400,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'production',
        origin,
      },
      checks: state.checks,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    }
  );
}

// POST: Trigger immediate on-demand diagnostic probe
export async function POST(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin || 'https://www.mooearth.live';
    const cronUrl = `${origin}/api/cron/daily-health-check`;
    const res = await fetch(cronUrl, {
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err: any) {
    return Response.json(
      { error: 'Failed to run on-demand diagnostics', detail: err.message },
      { status: 502 }
    );
  }
}
