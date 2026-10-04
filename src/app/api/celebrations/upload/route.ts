import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { uploadRateLimiter, getClientIp } from '@/lib/rate-limiter';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'audio/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.webm', '.mp3', '.wav', '.mp4', '.mov']);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 uploads per 10 minutes per IP
    const clientIp = getClientIp(request);
    if (uploadRateLimiter.isLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please wait before uploading again.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate size (limit to 20MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 20MB limit' }, { status: 400 });
    }

    // Strict MIME validation
    const mimeType = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return NextResponse.json(
        { error: 'Invalid file format. Only images, audio recordings, and videos are allowed.' },
        { status: 400 }
      );
    }

    // Determine safe extension from allowed whitelist
    const rawExt = path.extname(file.name || '').toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : ALLOWED_MIME_TYPES[mimeType];

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Ensure uploads folder exists in public/
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate cryptographically safe unique alphanumeric name
    const randomHex = Math.random().toString(36).substring(2, 10);
    const filename = `moo_${Date.now()}_${randomHex}${safeExt}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url, filename });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
