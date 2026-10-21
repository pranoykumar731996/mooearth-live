// ============================================================
// MooEarth Live — Stop the Earth: Question API
// ============================================================
// POST /api/game/stop-the-earth/question
// Allocates the next question for an active game session.
// Returns question text without answer coordinates.

import { NextRequest, NextResponse } from 'next/server';
import { allocateNextQuestion } from '@/engines/game/stopTheEarth/questionAllocator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body as { sessionId: string };

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required.' },
        { status: 400 }
      );
    }

    const result = allocateNextQuestion(sessionId);

    if (!result.success) {
      const status = result.exhausted ? 410 : 400;
      return NextResponse.json(
        {
          error: result.error,
          exhausted: result.exhausted || false,
        },
        { status }
      );
    }

    return NextResponse.json(result.response);
  } catch (error) {
    console.error('[API /game/stop-the-earth/question] Error:', error);
    return NextResponse.json(
      { error: 'Failed to allocate question.' },
      { status: 500 }
    );
  }
}
