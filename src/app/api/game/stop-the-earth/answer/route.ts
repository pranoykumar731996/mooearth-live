// ============================================================
// MooEarth Live — Stop the Earth: Answer API
// ============================================================
// POST /api/game/stop-the-earth/answer
// Validates a player's guess and returns scoring + correct location.
// Answer coordinates are only revealed AFTER the guess is submitted.

import { NextRequest, NextResponse } from 'next/server';
import { processAnswer, getGameSummary } from '@/engines/game/stopTheEarth/questionAllocator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      questionId,
      guessLat,
      guessLng,
      responseTimeMs,
    } = body as {
      sessionId: string;
      questionId: string;
      guessLat: number;
      guessLng: number;
      responseTimeMs: number;
    };

    // Validate required fields
    if (!sessionId || !questionId) {
      return NextResponse.json(
        { error: 'sessionId and questionId are required.' },
        { status: 400 }
      );
    }

    if (typeof guessLat !== 'number' || typeof guessLng !== 'number') {
      return NextResponse.json(
        { error: 'guessLat and guessLng must be numbers.' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (guessLat < -90 || guessLat > 90 || guessLng < -180 || guessLng > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of range.' },
        { status: 400 }
      );
    }

    const result = processAnswer(
      sessionId,
      questionId,
      guessLat,
      guessLng,
      responseTimeMs || 0
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // If game is complete, include summary
    let summary = null;
    if (result.response?.gameComplete) {
      summary = getGameSummary(sessionId);
    }

    return NextResponse.json({
      ...result.response,
      summary,
    });
  } catch (error) {
    console.error('[API /game/stop-the-earth/answer] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process answer.' },
      { status: 500 }
    );
  }
}
