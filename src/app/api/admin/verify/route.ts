// ============================================================
// MooEarth Live — Admin Authentication API
// ============================================================
// POST /api/admin/verify
// Server-side admin key verification so the key never leaks
// into the client JavaScript bundle.

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body as { key?: string };

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ authenticated: false, error: 'Missing key' }, { status: 400 });
    }

    if (validateAdminKey(key)) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false, error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false, error: 'Server error' }, { status: 500 });
  }
}

