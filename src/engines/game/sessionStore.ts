// ============================================================
// MooEarth Live — Infinite Earth Game Engine: Shared Session Store
// ============================================================
// Memory store for active game sessions, supporting serverless
// and fast local lookups. Attaches to globalThis in Node environments
// to prevent session loss across hot-reloads and route splits.

import { GameSessionState } from './types';

const GLOBAL_SESSION_KEY = '__MOOEARTH_GAME_SESSIONS__';

interface GlobalWithSessions {
  [GLOBAL_SESSION_KEY]?: Map<string, GameSessionState>;
}

const g = globalThis as unknown as GlobalWithSessions;

if (!g[GLOBAL_SESSION_KEY]) {
  g[GLOBAL_SESSION_KEY] = new Map<string, GameSessionState>();
}

const sessions: Map<string, GameSessionState> = g[GLOBAL_SESSION_KEY]!;

export function getSession(sessionId: string): GameSessionState | undefined {
  return sessions.get(sessionId);
}

export function saveSession(session: GameSessionState): void {
  sessions.set(session.sessionId, session);

  // Evict old sessions if map exceeds 200 items (FIFO)
  if (sessions.size > 200) {
    const oldestKey = sessions.keys().next().value;
    if (oldestKey) {
      sessions.delete(oldestKey);
    }
  }
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

export function getAllSessions(): Map<string, GameSessionState> {
  return sessions;
}
