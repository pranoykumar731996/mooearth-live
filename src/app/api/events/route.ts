import { NextResponse } from 'next/server';
import { fetchAllEvents } from '@/services/events';
import { generateEventSummary } from '@/services/ai';

// In Next.js App Router, you can configure route segment config
export const revalidate = 60; // Revalidate every 60 seconds at the edge/server

export async function GET() {
  try {
    const events = await fetchAllEvents();
    
    // Process summaries concurrently (up to a limit, but Promise.all is fine for a small batch)
    const processedEvents = await Promise.all(
      events.map(async (event) => {
        const aiSummary = await generateEventSummary(event);
        return { ...event, summary: aiSummary };
      })
    );

    return NextResponse.json({ events: processedEvents });
  } catch (error) {
    console.error('API /events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
