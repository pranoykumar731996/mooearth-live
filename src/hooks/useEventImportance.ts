// ============================================================
// MooEarth Live — useEventImportance Hook
// Scores live football events (1-100) on the client side and
// maps them to priority badges, glow colors, and AI trigger states.
// ============================================================

'use client';

import { EarthCastEventType } from '@/services/commentary-templates';

export interface EventImportanceDetails {
  score: number;
  badge: string;
  color: string;
  isHighImportance: boolean;
}

export function useEventImportance() {
  const getEventImportance = (
    eventType: EarthCastEventType,
    scoreStr?: string,
    elapsed?: number,
    isUpset?: boolean
  ): EventImportanceDetails => {
    let score = 30;
    let badge = 'ATMOSPHERE';
    let color = 'text-cyan-400 border-cyan-500/20 bg-cyan-950/25';

    switch (eventType) {
      case 'goal':
        score = 100;
        badge = '⚽ GOAL';
        color = 'text-yellow-400 border-yellow-500/30 bg-yellow-950/30 shadow-[0_0_15px_rgba(253,224,71,0.15)]';
        break;
      case 'upset':
        score = 100;
        badge = '🌌 UPSET';
        color = 'text-purple-400 border-purple-500/30 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]';
        break;
      case 'penalty':
        const isShootout = scoreStr?.includes('PEN') || elapsed === 120;
        score = isShootout ? 95 : 80;
        badge = isShootout ? '🥅 SHOOTOUT' : '🥅 PENALTY';
        color = 'text-orange-400 border-orange-500/30 bg-orange-950/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]';
        break;
      case 'red_card':
        score = 70;
        badge = '🟥 RED CARD';
        color = 'text-red-400 border-red-500/30 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
        break;
      case 'match_end':
        score = isUpset ? 90 : 45;
        badge = '🏁 MATCH END';
        color = isUpset 
          ? 'text-purple-400 border-purple-500/30 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
          : 'text-sky-400 border-sky-500/20 bg-sky-950/20';
        break;
      case 'tension':
        score = 50;
        badge = '⏳ TENSION';
        color = 'text-amber-400 border-amber-500/20 bg-amber-950/20';
        break;
      case 'atmosphere_check':
      default:
        score = 20;
        badge = '🌍 ATMOSPHERE';
        color = 'text-cyan-400 border-cyan-500/20 bg-cyan-950/15';
        break;
    }

    return {
      score,
      badge,
      color,
      isHighImportance: score >= 75,
    };
  };

  return { getEventImportance };
}
