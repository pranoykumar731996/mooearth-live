// ============================================================
// MooEarth Live — useLocationTime Hook
// ============================================================
// Real-time ticking clock hook for arbitrary planetary coordinates
// and IANA timezones. Updates smoothly every second with zero
// external dependencies.

'use client';

import { useState, useEffect } from 'react';
import { getLocationTime, type LocationTimeResult } from '@/services/weather/timeService';

export function useLocationTime(
  latitude?: number,
  longitude?: number,
  timezone?: string,
  tickIntervalMs: number = 1000
): LocationTimeResult | null {
  const [timeResult, setTimeResult] = useState<LocationTimeResult | null>(() => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
    return getLocationTime(latitude, longitude, timezone);
  });

  useEffect(() => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      setTimeResult(null);
      return;
    }

    // Immediate initial sync
    setTimeResult(getLocationTime(latitude, longitude, timezone));

    if (tickIntervalMs <= 0) return;

    const timer = setInterval(() => {
      setTimeResult(getLocationTime(latitude, longitude, timezone));
    }, tickIntervalMs);

    return () => clearInterval(timer);
  }, [latitude, longitude, timezone, tickIntervalMs]);

  return timeResult;
}
