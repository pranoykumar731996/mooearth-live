import { NextResponse } from 'next/server';
import { fetchCountryReactions } from '@/services/reactions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country) {
    return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 });
  }

  try {
    const reactionData = await fetchCountryReactions(country);
    return NextResponse.json({ reaction: reactionData }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error(`API /reactions error for ${country}:`, error);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}
