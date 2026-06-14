// ============================================================
// MooEarth Live — World Goal Celebration Mode
// The signature experience: when a goal is scored, the
// ENTIRE EARTH transforms into the scoring nation's colors.
// ============================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WorldEvent } from '@/types';

// Country flag colors for atmosphere transformation
const COUNTRY_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  'Brazil':         { primary: '#009c3b', secondary: '#ffdf00', glow: 'rgba(255, 223, 0, 0.6)' },
  'Argentina':      { primary: '#75aadb', secondary: '#ffffff', glow: 'rgba(117, 170, 219, 0.6)' },
  'France':         { primary: '#002395', secondary: '#ed2939', glow: 'rgba(0, 35, 149, 0.6)' },
  'Germany':        { primary: '#ffcc00', secondary: '#dd0000', glow: 'rgba(255, 204, 0, 0.6)' },
  'Spain':          { primary: '#c60b1e', secondary: '#ffc400', glow: 'rgba(255, 196, 0, 0.6)' },
  'Italy':          { primary: '#008c45', secondary: '#ffffff', glow: 'rgba(0, 140, 69, 0.6)' },
  'Portugal':       { primary: '#006600', secondary: '#ff0000', glow: 'rgba(255, 0, 0, 0.5)' },
  'Netherlands':    { primary: '#ff6600', secondary: '#ffffff', glow: 'rgba(255, 102, 0, 0.6)' },
  'Belgium':        { primary: '#fdda24', secondary: '#ef3340', glow: 'rgba(253, 218, 36, 0.6)' },
  'England':        { primary: '#ffffff', secondary: '#cf081f', glow: 'rgba(207, 8, 31, 0.5)' },
  'United Kingdom': { primary: '#ffffff', secondary: '#cf081f', glow: 'rgba(207, 8, 31, 0.5)' },
  'Colombia':       { primary: '#fcd116', secondary: '#003893', glow: 'rgba(252, 209, 22, 0.6)' },
  'Mexico':         { primary: '#006847', secondary: '#ce1126', glow: 'rgba(0, 104, 71, 0.6)' },
  'Japan':          { primary: '#ffffff', secondary: '#bc002d', glow: 'rgba(188, 0, 45, 0.5)' },
  'South Korea':    { primary: '#ffffff', secondary: '#cd2e3a', glow: 'rgba(205, 46, 58, 0.5)' },
  'USA':            { primary: '#3c3b6e', secondary: '#b22234', glow: 'rgba(178, 34, 52, 0.5)' },
  'United States':  { primary: '#3c3b6e', secondary: '#b22234', glow: 'rgba(178, 34, 52, 0.5)' },
  'Croatia':        { primary: '#ff0000', secondary: '#ffffff', glow: 'rgba(255, 0, 0, 0.5)' },
  'Uruguay':        { primary: '#001489', secondary: '#ffffff', glow: 'rgba(0, 20, 137, 0.5)' },
  'Morocco':        { primary: '#c1272d', secondary: '#006233', glow: 'rgba(193, 39, 45, 0.5)' },
  'Nigeria':        { primary: '#008751', secondary: '#ffffff', glow: 'rgba(0, 135, 81, 0.6)' },
  'Cameroon':       { primary: '#007a5e', secondary: '#ce1126', glow: 'rgba(0, 122, 94, 0.6)' },
  'Senegal':        { primary: '#009639', secondary: '#fdef42', glow: 'rgba(0, 150, 57, 0.6)' },
  'Australia':      { primary: '#00843d', secondary: '#ffcd00', glow: 'rgba(255, 205, 0, 0.6)' },
  'Canada':         { primary: '#ff0000', secondary: '#ffffff', glow: 'rgba(255, 0, 0, 0.5)' },
  'Chile':          { primary: '#d52b1e', secondary: '#ffffff', glow: 'rgba(213, 43, 30, 0.5)' },
};

const DEFAULT_COLORS = { primary: '#ffd700', secondary: '#ffffff', glow: 'rgba(255, 215, 0, 0.6)' };

export interface GoalCelebration {
  active: boolean;
  country: string;
  team: string;
  player: string;
  goalTime: number;
  matchTitle: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  colors: { primary: string; secondary: string; glow: string };
  lat: number;
  lng: number;
}

export function useGoalCelebration(events: WorldEvent[]) {
  const [celebration, setCelebration] = useState<GoalCelebration | null>(null);
  const processedGoalIds = useRef<Set<string>>(new Set());
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  const dismiss = useCallback(() => {
    setCelebration(null);
  }, []);

  useEffect(() => {
    if (isFirstRun.current) {
      // On initial load, mark all currently existing goals as processed so we don't celebrate past goals.
      for (const event of events) {
        if (event.footballData?.goals) {
          for (const goal of event.footballData.goals) {
            const goalId = `${event.id}-${goal.player}-${goal.time}`;
            processedGoalIds.current.add(goalId);
          }
        }
      }
      isFirstRun.current = false;
      return;
    }

    for (const event of events) {
      if (!event.footballData?.goals?.length) continue;

      const matchStatus = event.footballData.status;

      for (const goal of event.footballData.goals) {
        const goalId = `${event.id}-${goal.player}-${goal.time}`;

        // If match is NOT live, just mark goals as seen — never celebrate them
        if (matchStatus !== 'LIVE' && matchStatus !== 'HT') {
          processedGoalIds.current.add(goalId);
          continue;
        }

        // Already celebrated this goal
        if (processedGoalIds.current.has(goalId)) continue;

        processedGoalIds.current.add(goalId);

        // Determine which country scored
        const scoringTeam = goal.team === 'home'
          ? event.footballData.homeTeam
          : event.footballData.awayTeam;

        // Map club or variant team names to real country names
        const TEAM_TO_COUNTRY: Record<string, string> = {
          'Real Madrid': 'Spain',
          'Barcelona': 'Spain',
          'Manchester United': 'United Kingdom',
          'Liverpool': 'United Kingdom',
          'Bayern Munich': 'Germany',
          'PSG': 'France',
          'Juventus': 'Italy',
          'AC Milan': 'Italy',
          'United States': 'United States',
          'USA': 'United States',
          'England': 'United Kingdom',
        };

        const scoringCountry = TEAM_TO_COUNTRY[scoringTeam] || scoringTeam;

        // Country center coordinates for camera flying and rings positioning
        const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
          'Brazil':         { lat: -14.2350, lng: -51.9253 },
          'Argentina':      { lat: -38.4161, lng: -63.6167 },
          'France':         { lat: 46.2276,  lng: 2.2137 },
          'Germany':        { lat: 51.1657,  lng: 10.4515 },
          'Spain':          { lat: 40.4637,  lng: -3.7492 },
          'Italy':          { lat: 41.8719,  lng: 12.5674 },
          'Portugal':       { lat: 39.3999,  lng: -8.2245 },
          'Netherlands':    { lat: 52.1326,  lng: 5.2913 },
          'Belgium':        { lat: 50.5039,  lng: 4.4699 },
          'England':        { lat: 52.3555,  lng: -1.1743 },
          'United Kingdom': { lat: 55.3781,  lng: -3.4360 },
          'Colombia':       { lat: 4.5709,   lng: -74.2973 },
          'Mexico':         { lat: 23.6345,  lng: -102.5528 },
          'Japan':          { lat: 36.2048,  lng: 138.2529 },
          'South Korea':    { lat: 35.9078,  lng: 127.7669 },
          'USA':            { lat: 37.0902,  lng: -95.7129 },
          'United States':  { lat: 37.0902,  lng: -95.7129 },
          'Croatia':        { lat: 45.1000,  lng: 15.2000 },
          'Uruguay':        { lat: -32.5228, lng: -55.7658 },
          'Morocco':        { lat: 31.7917,  lng: -7.0926 },
          'Nigeria':        { lat: 9.0820,   lng: 8.6753 },
          'Cameroon':       { lat: 7.3697,   lng: 12.3547 },
          'Senegal':        { lat: 14.4974,  lng: -14.4524 },
          'Australia':      { lat: -25.2744, lng: 133.7751 },
          'Canada':         { lat: 56.1304,  lng: -106.3468 },
          'Chile':          { lat: -35.6751, lng: -71.5430 },
        };

        const resolvedCoords = COUNTRY_COORDINATES[scoringCountry] || { lat: event.lat, lng: event.lng };
        const colors = COUNTRY_COLORS[scoringCountry] || COUNTRY_COLORS[scoringTeam] || DEFAULT_COLORS;

        const newCelebration: GoalCelebration = {
          active: true,
          country: scoringCountry,
          team: scoringTeam,
          player: goal.player,
          goalTime: goal.time,
          matchTitle: event.title,
          homeTeam: event.footballData.homeTeam,
          awayTeam: event.footballData.awayTeam,
          homeScore: event.footballData.homeScore,
          awayScore: event.footballData.awayScore,
          colors,
          lat: resolvedCoords.lat,
          lng: resolvedCoords.lng,
        };

        setCelebration(newCelebration);

        // Clear any existing timer
        if (dismissTimer.current) clearTimeout(dismissTimer.current);

        // Auto-dismiss after 10 seconds
        dismissTimer.current = setTimeout(() => {
          setCelebration(null);
        }, 10000);

        // Only trigger for the first new goal found this cycle
        return;
      }
    }
  }, [events]);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  return { celebration, dismiss };
}
