// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Answer API
// ============================================================
// POST /api/game/answer
// Validates a user's response and returns scoring.

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeGameEngine,
  processAnswer,
  type UserResponse,
  type GameSessionState,
} from '@/engines/game';

let engineReady = false;
function ensureEngine() {
  if (!engineReady) {
    initializeGameEngine();
    engineReady = true;
  }
}

import { getSession, saveSession } from '@/engines/game/sessionStore';

export async function POST(request: NextRequest) {
  try {
    ensureEngine();

    const body = await request.json();
    const { sessionId, response: userResponse } = body as {
      sessionId: string;
      response: UserResponse;
    };

    if (!sessionId || !userResponse) {
      return NextResponse.json(
        { error: 'Missing sessionId or response' },
        { status: 400 }
      );
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found. Start a new game.' },
        { status: 404 }
      );
    }

    if (!session.activeChallenge) {
      return NextResponse.json(
        { error: 'No active challenge in this session.' },
        { status: 400 }
      );
    }

    const result = processAnswer(session, userResponse);
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to process answer' },
        { status: 500 }
      );
    }
    saveSession(session);

    return NextResponse.json({
      validation: result.validation,
      scoring: result.scoring,
      session: {
        sessionId: session.sessionId,
        mode: session.mode,
        currentStreak: session.currentStreak,
        totalScore: session.totalScore,
        challengesCompleted: session.challengesCompleted,
        challengesFailed: session.challengesFailed,
      },
    });
  } catch (error) {
    console.error('[API /game/answer] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process answer' },
      { status: 500 }
    );
  }
}
