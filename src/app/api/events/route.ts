import { NextRequest, NextResponse } from 'next/server';
import { fetchAllEvents, searchAllEvents } from '@/services/events';
import { generateEventSummary } from '@/services/ai';

// In Next.js App Router, we force dynamic rendering since it relies on dynamic searchParams
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q') || '';

    const { events, status } = query.trim()
      ? await searchAllEvents(query.trim())
      : await fetchAllEvents();
    
    // Process summaries concurrently (up to a limit, but Promise.all is fine for a small batch)
    const processedEvents = await Promise.all(
      events.map(async (event) => {
        const aiSummary = await generateEventSummary(event);
        return { ...event, summary: aiSummary };
      })
    );

    const earthCastActive = !!process.env.OPENAI_API_KEY;

    return NextResponse.json({
      events: processedEvents,
      status: {
        newsActive: status.newsActive,
        footballActive: status.footballActive,
        earthCastActive,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error('API /events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}


