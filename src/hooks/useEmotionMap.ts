import { useState, useEffect } from 'react';
import { WorldEvent, ReactionEvent } from '@/types';

export type EmotionColor = string;

export interface TrendingCountry {
  rank: number;
  country: string;
  flag: string;
  score: number;
  mood: string;
  activityText: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Portugal': '🇵🇹',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇧',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'United Kingdom': '🇬🇧',
  'Colombia': '🇨🇴',
  'Mexico': '🇲🇽',
  'Japan': '🇯🇵',
  'South Korea': '🇰🇷',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Croatia': '🇭🇷',
  'Uruguay': '🇺🇾',
  'Morocco': '🇲🇦',
  'Nigeria': '🇳🇬',
  'Cameroon': '🇨🇲',
  'Senegal': '🇸🇳',
  'Australia': '🇦🇺',
  'Canada': '🇨🇦',
  'Chile': '🇨🇱',
};

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

function getCountryName(team: string): string {
  return TEAM_TO_COUNTRY[team] || team;
}

export function useEmotionMap(
  events: WorldEvent[],
  celebrations: any[],
  selectedCountry: string | null,
  activeReaction: ReactionEvent | null
) {
  const [emotionMap, setEmotionMap] = useState<Record<string, EmotionColor>>({});
  const [trendingCountries, setTrendingCountries] = useState<TrendingCountry[]>([]);
  const [globalEnergyScore, setGlobalEnergyScore] = useState<number>(0);

  useEffect(() => {
    const countryData: Record<string, {
      goals: number;
      uploads: number;
      isLive: boolean;
      isSelected: boolean;
      mood: string;
      commentCount: number;
      flicker: boolean;
    }> = {};

    // Helper to get or create country entry
    const getEntry = (country: string) => {
      const name = getCountryName(country);
      if (!countryData[name]) {
        countryData[name] = {
          goals: 0,
          uploads: 0,
          isLive: false,
          isSelected: false,
          mood: 'calm',
          commentCount: 0,
          flicker: false,
        };
      }
      return countryData[name];
    };

    // 1. Process Live Football Events
    events.forEach(event => {
      if (event.category === 'football' && event.footballData) {
        const homeCountry = getCountryName(event.footballData.homeTeam);
        const awayCountry = getCountryName(event.footballData.awayTeam);
        
        const homeEntry = getEntry(homeCountry);
        const awayEntry = getEntry(awayCountry);

        homeEntry.isLive = event.footballData.status === 'LIVE' || event.footballData.status === 'PEN';
        awayEntry.isLive = event.footballData.status === 'LIVE' || event.footballData.status === 'PEN';

        homeEntry.goals += event.footballData.homeScore || 0;
        awayEntry.goals += event.footballData.awayScore || 0;

        // Detect Penalty Shootout unstable flicker
        if (event.footballData.status === 'PEN') {
          homeEntry.flicker = true;
          awayEntry.flicker = true;
        }

        // Set baseline match mood
        if (event.footballData.homeScore > event.footballData.awayScore) {
          homeEntry.mood = 'celebration';
          awayEntry.mood = 'sadness';
        } else if (event.footballData.homeScore < event.footballData.awayScore) {
          homeEntry.mood = 'sadness';
          awayEntry.mood = 'celebration';
        } else {
          homeEntry.mood = 'tension';
          awayEntry.mood = 'tension';
        }
      } else if (event.country) {
        const entry = getEntry(event.country);
        entry.isLive = true;
        entry.mood = 'hype';
      }
    });

    // 2. Process Fan Upload Celebrations
    celebrations.forEach(c => {
      if (!c.country) return;
      const entry = getEntry(c.country);
      entry.uploads += 1;
      entry.commentCount += 1;

      // Extract mood keywords from comment
      const commentLower = (c.comment || '').toLowerCase();
      if (commentLower.includes('hype') || commentLower.includes('vamos') || commentLower.includes('win') || commentLower.includes('goal')) {
        entry.mood = 'hype';
      } else if (commentLower.includes('lost') || commentLower.includes('sad') || commentLower.includes('cry')) {
        entry.mood = 'sadness';
      } else if (commentLower.includes('referee') || commentLower.includes('angry') || commentLower.includes('furious')) {
        entry.mood = 'anger';
      } else if (commentLower.includes('shock') || commentLower.includes('tension')) {
        entry.mood = 'tension';
      } else {
        // Fallback to excitement if there are fan posts
        if (entry.mood === 'calm') {
          entry.mood = 'excitement';
        }
      }
    });

    // 3. Mark selected country
    if (selectedCountry) {
      const entry = getEntry(selectedCountry);
      entry.isSelected = true;

      // Override with live loaded reaction sentiment if available
      if (activeReaction && activeReaction.country === selectedCountry) {
        const moodText = activeReaction.sentiment.mood.toLowerCase();
        if (moodText.includes('celebration')) entry.mood = 'celebration';
        else if (moodText.includes('sadness')) entry.mood = 'sadness';
        else if (moodText.includes('anger')) entry.mood = 'anger';
        else if (moodText.includes('shock') || moodText.includes('tension')) entry.mood = 'tension';
        else if (moodText.includes('hype')) entry.mood = 'hype';
      }
    }

    // 4. Calculate dynamic color mapping and build trending list
    const newMap: Record<string, EmotionColor> = {};
    const trendingList: any[] = [];
    let totalActiveEnergy = 0;
    let activeCountriesCount = 0;

    Object.keys(countryData).forEach(country => {
      const data = countryData[country];
      
      // Energy Score Formula: Phase 10 & 5
      const baseEnergy = (data.goals * 0.35) + (data.uploads * 0.15) + (data.isLive ? 0.3 : 0.1) + (data.isSelected ? 0.2 : 0);
      const energy = Math.min(Math.max(baseEnergy, 0.1), 1.0);

      // Mood to CSS Color Mapping: Phase 4 Heatmap Colors
      let color = 'rgba(59, 130, 246, '; // Calm Blue
      let moodLabel = 'Calm';

      switch (data.mood) {
        case 'celebration':
          color = 'rgba(255, 215, 0, '; // Gold
          moodLabel = '🔥 Celebration';
          break;
        case 'sadness':
          color = 'rgba(239, 68, 68, '; // Red (defeat/sadness)
          moodLabel = '😢 Defeat';
          break;
        case 'anger':
          color = 'rgba(239, 68, 68, '; // Red (anger)
          moodLabel = '😡 Anger';
          break;
        case 'tension':
          color = 'rgba(249, 115, 22, '; // Orange
          moodLabel = '⚡ Tension';
          break;
        case 'excitement':
          color = 'rgba(16, 185, 129, '; // Green
          moodLabel = '😄 Excitement';
          break;
        case 'hype':
          color = 'rgba(16, 185, 129, '; // Green / Hype
          moodLabel = '🔥 Hype';
          break;
        default:
          color = 'rgba(59, 130, 246, '; // Blue
          moodLabel = '💙 Calm';
      }

      // Handle Penalty Shootout unstable atmosphere flicker
      const isFlickering = data.flicker;
      
      newMap[country] = `${color}${energy.toFixed(2)})`;

      totalActiveEnergy += energy;
      activeCountriesCount += 1;

      // Activity Description text
      let activityText = 'Preparing for upcoming match';
      if (data.isLive) {
        activityText = data.goals > 0 ? `Scored ${data.goals} goal(s) in live match!` : 'Locked in live match drama';
      } else if (data.uploads > 0) {
        activityText = `${data.uploads} fan reaction uploads live`;
      }

      // Add to trending calculation list
      const score = Math.round(energy * 100);
      trendingList.push({
        country,
        flag: COUNTRY_FLAGS[country] || '🏳️',
        score,
        mood: moodLabel,
        activityText,
      });
    });

    // 5. Sort trending countries
    const sortedTrending = trendingList
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    // 6. Compute global energy score
    const avgEnergy = activeCountriesCount > 0 ? (totalActiveEnergy / activeCountriesCount) : 0.2;
    // Map average energy into a nice 0-100 score, scaling with activity
    const activityModifier = Math.min(celebrations.length * 5 + events.length * 2, 40);
    const finalEnergyScore = Math.round(Math.min((avgEnergy * 60) + activityModifier, 100));

    setEmotionMap(newMap);
    setTrendingCountries(sortedTrending);
    setGlobalEnergyScore(finalEnergyScore);

  }, [events, celebrations, selectedCountry, activeReaction]);

  return { emotionMap, trendingCountries, globalEnergyScore };
}
