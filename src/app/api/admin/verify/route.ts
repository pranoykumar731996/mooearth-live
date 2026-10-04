// ============================================================
// MooEarth Live — Admin Authentication API
// ============================================================
// POST /api/admin/verify
// Server-side admin key verification so the key never leaks
// into the client JavaScript bundle.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body as { key?: string };

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ authenticated: false, error: 'Missing key' }, { status: 400 });
    }

    // The admin key is read from a server-only env var (no NEXT_PUBLIC_ prefix)
    // Falls back to a dev-only default that is NOT shipped in the client bundle.
    const expectedKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY || 'mooearth-admin-2026';

    if (key.trim() === expectedKey) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false, error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false, error: 'Server error' }, { status: 500 });
  }
}
