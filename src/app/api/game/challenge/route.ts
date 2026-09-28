// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Challenge API
// ============================================================
// POST /api/game/challenge
// Returns the next EarthChallenge from the engine.

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeGameEngine,
  createSession,
  generateNextChallenge,
  type GameSessionMode,
  type GameEngineType,
  type ChallengeType,
  type ChallengeDifficulty,
  type GameSessionState,
} from '@/engines/game';

// Initialize engine on first request (idempotent)
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
    const {
      sessionId,
      mode = 'endless',
      engine,
      type,
      difficulty,
      targetCountry,
      excludeFingerprints = [],
    } = body as {
      sessionId?: string;
      mode?: GameSessionMode;
      engine?: GameEngineType;
      type?: ChallengeType;
      difficulty?: ChallengeDifficulty;
      targetCountry?: string;
      excludeFingerprints?: string[];
    };

    // Get or create session
    let session: GameSessionState | undefined;
    if (sessionId) {
      session = getSession(sessionId);
    }
    if (!session) {
      session = createSession(mode);
    }
    saveSession(session);

    // Generate next challenge
    const challenge = await generateNextChallenge(session, {
      engine,
      type,
      difficulty,
      targetCountry,
      excludeFingerprints,
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'No challenge available', sessionId: session.sessionId },
        { status: 503 }
      );
    }

    return NextResponse.json({
      challenge,
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
    console.error('[API /game/challenge] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
