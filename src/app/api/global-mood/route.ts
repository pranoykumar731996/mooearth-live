import { NextResponse } from 'next/server';
import { fetchAllEvents } from '@/services/events';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { events } = await fetchAllEvents();
    
    // Simulate global mood intensities based on event count per country
    const countryCounts: Record<string, number> = {};
    events.forEach(e => {
      countryCounts[e.country] = (countryCounts[e.country] || 0) + 1;
    });

    const maxCount = Math.max(1, ...Object.values(countryCounts));

    // Map to 0-1 intensity
    const globalMood: Record<string, number> = {};
    for (const [country, count] of Object.entries(countryCounts)) {
      globalMood[country] = count / maxCount; // Normalized intensity
    }

    return NextResponse.json({ globalMood }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error('API /global-mood error:', error);
    return NextResponse.json({ error: 'Failed to fetch global mood' }, { status: 500 });
  }
}
