import { NextRequest, NextResponse } from 'next/server';
import { fetchOrGenerateArticleDetails } from '@/services/article';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    const url = searchParams.get('url') || '';
    const title = searchParams.get('title') || '';
    const summary = searchParams.get('summary') || '';
    const country = searchParams.get('country') || 'Global';
    const category = searchParams.get('category') || 'breaking';
    const publishedAt = searchParams.get('publishedAt') || new Date().toISOString();

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
      publishedAt
    );

    return NextResponse.json({ article });
  } catch (error: any) {
    console.error('Error in /api/article route:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
