// ============================================================
// MooEarth Live — Stop the Earth: Session API
// ============================================================
// POST /api/game/stop-the-earth/session
// Creates a new game session or retrieves an existing one.

import { NextRequest, NextResponse } from 'next/server';
import { createSteSession, getSteSession } from '@/engines/game/stopTheEarth/questionAllocator';
import { getCountryByName } from '@/data/countries';
import { getQuestionCountForCountry } from '@/data/stopTheEarth/questionBank';
import type { SteDifficulty, SteGameMode } from '@/engines/game/stopTheEarth/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      playerId,
      country,
      countryCode,
      difficulty = 'easy',
      mode = 'country-challenge',
    } = body as {
      playerId?: string;
      country: string;
      countryCode?: string;
      difficulty?: SteDifficulty;
      mode?: SteGameMode;
    };

    if (!country) {
      return NextResponse.json(
        { error: 'Country is required.' },
        { status: 400 }
      );
    }

    // Resolve country
    let resolvedCode = countryCode?.toUpperCase();
    let resolvedName = country;

    if (!resolvedCode) {
      const countryRecord = getCountryByName(country);
      if (countryRecord) {
        resolvedCode = countryRecord.iso2.toUpperCase();
        resolvedName = countryRecord.name;
      } else {
        return NextResponse.json(
          { error: `Country "${country}" not found.` },
          { status: 404 }
        );
      }
    }

    // Check question availability
    const questionCount = getQuestionCountForCountry(resolvedCode);
    if (questionCount === 0) {
      return NextResponse.json(
        { error: `No questions available for ${resolvedName}.` },
        { status: 404 }
      );
    }

    // Generate anonymous player ID if not provided
    const effectivePlayerId = playerId || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Create session
    const session = createSteSession(
      effectivePlayerId,
      resolvedName,
      resolvedCode,
      difficulty,
      mode
    );

    return NextResponse.json({
      sessionId: session.sessionId,
      playerId: effectivePlayerId,
      country: resolvedName,
      countryCode: resolvedCode,
      difficulty,
      mode,
      maxRounds: session.maxRounds,
      questionsAvailable: questionCount,
    });
  } catch (error) {
    console.error('[API /game/stop-the-earth/session] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create game session.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required.' },
        { status: 400 }
      );
    }

    const session = getSteSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      country: session.country,
      countryCode: session.countryCode,
      difficulty: session.difficulty,
      mode: session.mode,
      roundNumber: session.roundNumber,
      maxRounds: session.maxRounds,
      totalScore: session.totalScore,
      streak: session.streak,
      status: session.status,
    });
  } catch (error) {
    console.error('[API /game/stop-the-earth/session GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session.' },
      { status: 500 }
    );
  }
}
