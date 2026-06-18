'use client';

import { useState, useEffect } from 'react';

interface StreakData {
  currentStreak: number;
  lastActiveAt: number; // timestamp
}

export function useStreaks(username: string | null) {
  const [streak, setStreak] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!username || typeof window === 'undefined') return;

    try {
      const storageKey = `mooearth_visit_streak_${username}`;
      const raw = localStorage.getItem(storageKey);
      const now = Date.now();
      const todayStart = new Date().setHours(0, 0, 0, 0);
      
      let currentData: StreakData = {
        currentStreak: 1,
        lastActiveAt: now
      };

      if (raw) {
        const parsed: StreakData = JSON.parse(raw);
        const lastActiveStart = new Date(parsed.lastActiveAt).setHours(0, 0, 0, 0);
        const diffDays = Math.floor((todayStart - lastActiveStart) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day! Increment streak
          currentData = {
            currentStreak: parsed.currentStreak + 1,
            lastActiveAt: now
          };
          setStreak(currentData.currentStreak);
          setShowCelebration(true);
        } else if (diffDays > 1) {
          // Missed a day! Reset to 1
          currentData = {
            currentStreak: 1,
            lastActiveAt: now
          };
          setStreak(1);
        } else {
          // Already visited today, keep current streak
          currentData = {
            currentStreak: parsed.currentStreak,
            lastActiveAt: now // Update timestamp to latest
          };
          setStreak(parsed.currentStreak);
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(currentData));
    } catch (err) {
      console.error('[useStreaks] Error tracking visit streaks:', err);
    }
  }, [username]);

  return {
    streak,
    showCelebration,
    dismissCelebration: () => setShowCelebration(false)
  };
}
