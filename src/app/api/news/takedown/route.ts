import { NextRequest, NextResponse } from 'next/server';
import { recordTakedown, listAllTakedowns, isTakedownActive } from '@/services/newsEngine/takedownService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');

  if (target) {
    const active = isTakedownActive(target);
    return NextResponse.json({ target, active });
  }

  const takedowns = listAllTakedowns();
  return NextResponse.json({ count: takedowns.length, takedowns });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, reason, requester, action, resolutionNotes } = body;

    if (!target || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: target and reason are mandatory.' },
        { status: 400 }
      );
    }

    const record = recordTakedown({
      target,
      reason,
      requester,
      action: action || 'tombstone',
      resolutionNotes,
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
