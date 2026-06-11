import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  return NextResponse.json({ celebrations: active });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, avatar, country, match, type, url, comment, lat, lng } = body;

    if (!username || !country || !type || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Profanity Filter for comments
    const profaneWords = ['spam', 'abuse', 'nsfw', 'fuck', 'shit', 'asshole', 'bitch'];
    let filteredComment = comment || '';
    profaneWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredComment = filteredComment.replace(regex, '***');
    });

    const db = readDb();
    const newCelebration = {
      id: `celeb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      avatar: avatar || '👤',
      country,
      match: match || 'Global Fan Reaction',
      type,
      url,
      comment: filteredComment,
      lat: Number(lat) || 0,
      lng: Number(lng) || 0,
      timestamp: Date.now(),
      reports: 0
    };

    db.push(newCelebration);
    writeDb(db);

    return NextResponse.json({ success: true, celebration: newCelebration });
  } catch (error) {
    console.error('Error creating celebration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Support reporting a celebration (PUT /api/celebrations)
export async function PUT(request: Request) {
  try {
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
