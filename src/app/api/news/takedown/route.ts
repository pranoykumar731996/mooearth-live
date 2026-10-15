import { NextRequest, NextResponse } from 'next/server';
import {
  recordTakedown,
  listAllTakedowns,
  isTakedownActive,
  recordPublicComplaint,
  listPublicComplaints,
} from '@/services/newsEngine/takedownService';
import {
  suspendSource,
  reinstateSource,
  listSuspendedSources,
  isSourceSuspended,
} from '@/services/newsEngine/sourceRegistry';
import { writeRateLimiter, getClientIp } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');
  const domain = searchParams.get('domain');

  if (target) {
    const active = isTakedownActive(target);
    return NextResponse.json({ target, active });
  }

  if (domain) {
    const suspended = isSourceSuspended(domain);
    return NextResponse.json({ domain, suspended });
  }

  const takedowns = listAllTakedowns();
  const suspendedSources = listSuspendedSources();
  const complaints = listPublicComplaints();

  return NextResponse.json({
    takedownsCount: takedowns.length,
    takedowns,
    suspendedSourcesCount: suspendedSources.length,
    suspendedSources,
    complaintsCount: complaints.length,
    complaints,
  });
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (writeRateLimiter.isLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before submitting additional notices.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { target, reason, requester, action, complainantName, complainantEmail, resolutionNotes } = body;

    if (!target || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: target and reason are mandatory.' },
        { status: 400 }
      );
    }

    // Check administrative authorization
    const authHeader = request.headers.get('authorization') || '';
    const adminKeyHeader = request.headers.get('x-admin-key') || '';
    const adminSecret = process.env.TAKEDOWN_ADMIN_KEY || process.env.ADMIN_SECRET || 'mooearth-editorial-sentinel-2026';
    const isAuthorized = (authHeader === `Bearer ${adminSecret}`) || (adminKeyHeader === adminSecret);

    // 1. Source Suspension / Reinstatement (Strictly requires authorization)
    if (action === 'suspend_source') {
      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Unauthorized: Administrative authorization key required for source suspension.' },
          { status: 401 }
        );
      }
      suspendSource(target, reason);
      return NextResponse.json({
        success: true,
        action: 'suspend_source',
        target,
        reason,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'reinstate_source') {
      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Unauthorized: Administrative authorization key required to reinstate a source.' },
          { status: 401 }
        );
      }
      const reinstated = reinstateSource(target);
      return NextResponse.json({
        success: reinstated,
        action: 'reinstate_source',
        target,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Executive Takedown / Retraction
    if (isAuthorized) {
      const record = recordTakedown({
        target,
        reason,
        requester: requester || 'Authorized Editorial Desk',
        action: action || 'tombstone',
        resolutionNotes,
      });
      return NextResponse.json({ success: true, authorized: true, record }, { status: 201 });
    }

    // 3. Public Complaint Queue (Safe Harbor: Unauthenticated public submissions
    // do not trigger automatic denial of service, but are queued for expedited editorial review)
    const complaint = recordPublicComplaint({
      target,
      reason,
      complainantName: complainantName || requester,
      complainantEmail,
    });

    return NextResponse.json(
      {
        success: true,
        authorized: false,
        status: 'pending_editorial_review',
        message: 'Your complaint/retraction request has been received and queued for expedited legal and editorial review.',
        complaint,
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
