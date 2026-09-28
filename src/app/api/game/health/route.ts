// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Health API
// ============================================================
// GET /api/game/health
// Returns diagnostic status for all providers.

import { NextResponse } from 'next/server';
import {
  initializeGameEngine,
  getEngineHealth,
  getAllRegisteredTypes,
  getActiveEngines,
} from '@/engines/game';

let engineReady = false;
function ensureEngine() {
  if (!engineReady) {
    initializeGameEngine();
    engineReady = true;
  }
}

export async function GET() {
  try {
    ensureEngine();

    const health = getEngineHealth();
    const registeredTypes = getAllRegisteredTypes();
    const activeEngines = getActiveEngines();

    return NextResponse.json({
      status: health.totalAvailable > 0 ? 'healthy' : 'degraded',
      engines: {
        total: activeEngines.length,
        active: activeEngines,
      },
      challengeTypes: {
        total: registeredTypes.length,
        enabled: registeredTypes.filter(t => t.enabled).length,
        liveDataRequired: registeredTypes.filter(t => t.requiresLiveData).length,
        offlineSafe: registeredTypes.filter(t => !t.requiresLiveData).length,
      },
      providers: health.providers,
      antiRepeat: {
        tracked: health.antiRepeatTracked,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /game/health] Error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Health check failed' },
      { status: 500 }
    );
  }
}
