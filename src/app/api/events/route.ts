import { NextRequest, NextResponse } from 'next/server';
import { fetchAllEvents, searchAllEvents, getLocationEvents } from '@/services/events';
import { generateEventSummary } from '@/services/ai';
import { getAllFreshness } from '@/services/freshness';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const locationId = searchParams.get('locationId') || '';
    const refresh = searchParams.get('refresh') === 'true';
    const simulateError = searchParams.get('simulateError');
    
    if (simulateError) {
      if (simulateError === '500') {
        return NextResponse.json({ error: 'Simulated Internal Server Error' }, { status: 500 });
      }
      if (simulateError === '429') {
        return NextResponse.json({ error: 'Simulated Rate Limit Exceeded' }, { status: 429 });
      }
      if (simulateError === 'badjson') {
        return new Response('{"invalid": json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (simulateError === 'empty') {
        return NextResponse.json({ events: [], status: {} });
      }
      if (simulateError === 'delay') {
        const delayMs = parseInt(searchParams.get('delayMs') || '2000', 10);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    let result;

    if (locationId.trim()) {
      // Fetch events specifically for this Location ID (City / State / Country)
      result = await getLocationEvents(locationId.trim(), category, refresh);
    } else if (query.trim()) {
      // Normal search query fallback
      result = await searchAllEvents(query.trim(), category, refresh);
    } else {
      // Default homepage events
      result = await fetchAllEvents(refresh);
    }

    const { events, status } = result;
    
    // Process summaries concurrently
    const processedEvents = await Promise.all(
      events.map(async (event) => {
        const aiSummary = await generateEventSummary(event);
        return { ...event, summary: aiSummary };
      })
    );

    const earthCastActive = !!process.env.OPENAI_API_KEY;

    const responsePayload: any = {
      events: processedEvents,
      status: {
        newsActive: status.newsActive,
        footballActive: status.footballActive,
        earthCastActive,
        freshness: getAllFreshness(),
      }
    };

    // If a specific location was resolved, include diagnostic details
    if ('resolvedLocation' in result) {
      responsePayload.resolvedLocation = result.resolvedLocation;
      responsePayload.activeLocation = result.activeLocation;
      responsePayload.fallbackLevel = result.fallbackLevel;
    }

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error('API /events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
