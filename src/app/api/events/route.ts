import { NextResponse } from 'next/server';
import { fetchAllEvents } from '@/services/events';

// In Next.js App Router, you can configure route segment config
export const revalidate = 60; // Revalidate every 60 seconds at the edge/server

export async function GET() {
  try {
    const events = await fetchAllEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error('API /events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
