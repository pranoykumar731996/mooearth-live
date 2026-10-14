import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

import { writeRateLimiter, getClientIp } from '@/lib/rate-limiter';

const dbPath = path.join(process.cwd(), 'src/data/celebrations.json');

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      return [];
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading celebrations database:', error);
    return [];
  }
}

function writeDb(data: any) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing celebrations database:', error);
    return false;
  }
}

export async function GET() {
  const db = readDb();
  // Filter out flagged posts (reports >= 3)
  const active = db.filter((c: any) => !c.reports || c.reports < 3);
  return NextResponse.json({ celebrations: active }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    }
  });
}

// Reaction upload is permanently disabled
export async function POST() {
  return NextResponse.json(
    { error: 'Upload reaction feature has been permanently disabled' },
    { status: 410 }
  );
}

// Support reporting a celebration (PUT /api/celebrations)
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting: 30 writes per minute per IP
    const clientIp = getClientIp(request);
    if (writeRateLimiter.isLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before reporting again.' },
        { status: 429 }
      );
    }

    const { id, action } = await request.json();
    if (!id || action !== 'report') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const db = readDb();
    const item = db.find((c: any) => c.id === id);
    if (item) {
      item.reports = (item.reports || 0) + 1;
      writeDb(db);
      return NextResponse.json({ success: true, reports: item.reports });
    } else {
      return NextResponse.json({ error: 'Celebration not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error reporting celebration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
