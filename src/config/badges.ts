import { GameBadge, PlayerGameState } from '@/types';

export const BADGE_DEFINITIONS: GameBadge[] = [
  {
    id: 'brazil_explorer',
    label: 'Brazil Explorer',
    emoji: '🇧🇷',
    description: 'Unlocked by exploring or completing a quiz on Brazil.'
  },
  {
    id: 'geography_master',
    label: 'Geography Master',
    emoji: '🗺️',
    description: 'Unlocked by answering at least 20 geography questions.'
  },
  {
    id: 'fifa_expert',
    label: 'FIFA Expert',
    emoji: '⚽',
    description: 'Unlocked by completing a sports or football quiz.'
  },
  {
    id: 'world_traveler',
    label: 'World Traveler',
    emoji: '✈️',
    description: 'Unlocked by exploring at least 5 different countries.'
  }
];

/**
 * Checks and updates unlocked badges based on PlayerGameState
 * @returns Array of unlocked badges
 */
export function checkUnlockBadges(state: PlayerGameState, categoryUsed?: string, lastCountrySelected?: string): GameBadge[] {
  const currentBadges = state.badges || [];
  const currentIds = new Set(currentBadges.map(b => b.id));
  const newUnlocked: GameBadge[] = [...currentBadges];
  const now = Date.now();

  // 1. Brazil Explorer
  if (!currentIds.has('brazil_explorer')) {
    const exploredBrazil = (state.countriesExplored || []).some(c => c.toLowerCase() === 'brazil') || 
                           lastCountrySelected?.toLowerCase() === 'brazil';
    if (exploredBrazil) {
      const def = BADGE_DEFINITIONS.find(b => b.id === 'brazil_explorer');
      if (def) {
        newUnlocked.push({ ...def, unlockedAt: now });
      }
    }
  }

  // 2. Geography Master
  if (!currentIds.has('geography_master')) {
    if (state.totalAnswered >= 20) {
      const def = BADGE_DEFINITIONS.find(b => b.id === 'geography_master');
      if (def) {
        newUnlocked.push({ ...def, unlockedAt: now });
      }
    }
  }

  // 3. FIFA Expert
  if (!currentIds.has('fifa_expert')) {
    const isFifa = categoryUsed === 'sports' || categoryUsed === 'football' || categoryUsed === 'worldcup';
    if (isFifa) {
      const def = BADGE_DEFINITIONS.find(b => b.id === 'fifa_expert');
      if (def) {
        newUnlocked.push({ ...def, unlockedAt: now });
      }
    }
  }

  // 4. World Traveler
  if (!currentIds.has('world_traveler')) {
    if ((state.countriesExplored || []).length >= 5) {
      const def = BADGE_DEFINITIONS.find(b => b.id === 'world_traveler');
      if (def) {
        newUnlocked.push({ ...def, unlockedAt: now });
      }
    }
  }

  return newUnlocked;
}
