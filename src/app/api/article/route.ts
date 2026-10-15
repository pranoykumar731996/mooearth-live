import { NextRequest, NextResponse } from 'next/server';
import { fetchOrGenerateArticleDetails } from '@/services/article';
import { aiRateLimiter, getClientIp } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 15 requests per minute per IP
    const clientIp = getClientIp(request);
    if (aiRateLimiter.isLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before requesting another article.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    const url = searchParams.get('url') || '';
    const title = searchParams.get('title') || '';
    const summary = searchParams.get('summary') || '';
    const country = searchParams.get('country') || 'Global';
    const category = searchParams.get('category') || 'breaking';
    const publishedAt = searchParams.get('publishedAt') || new Date().toISOString();
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const lat = latParam ? parseFloat(latParam) : undefined;
    const lng = lngParam ? parseFloat(lngParam) : undefined;

    let telemetry = undefined;
    const telemetryRaw = searchParams.get('telemetry');
    if (telemetryRaw) {
      try {
        telemetry = JSON.parse(telemetryRaw);
      } catch (e) {
        // Ignore malformed JSON
      }
    }

    if (!title) {
      return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
    }

    const article = await fetchOrGenerateArticleDetails(
      id,
      url,
      title,
      summary,
      country,
      category,
      publishedAt,
      lat,
      lng,
      telemetry
    );

    return NextResponse.json({ article, debug: article.debug || {} });
  } catch (error: any) {
    console.error('Error in /api/article route:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
