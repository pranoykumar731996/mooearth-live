import { FootballMatchData } from '@/types';

function getSeededRandom(seed: string, min: number, max: number, offset = 0) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const raw = Math.abs(Math.sin(hash + offset));
  return Math.floor(raw * (max - min + 1)) + min;
}

export function generateMatchStats(matchId: string) {
  const possessionHome = getSeededRandom(matchId, 30, 70, 1);
  const possessionAway = 100 - possessionHome;
  
  return {
    possession: { home: possessionHome, away: possessionAway },
    shots: { home: getSeededRandom(matchId, 5, 25, 2), away: getSeededRandom(matchId, 5, 25, 3) },
    shotsOnTarget: { home: getSeededRandom(matchId, 2, 10, 4), away: getSeededRandom(matchId, 2, 10, 5) },
    passes: { home: getSeededRandom(matchId, 300, 700, 6), away: getSeededRandom(matchId, 300, 700, 7) },
    passAccuracy: { home: getSeededRandom(matchId, 70, 95, 8), away: getSeededRandom(matchId, 70, 95, 9) },
    fouls: { home: getSeededRandom(matchId, 5, 20, 10), away: getSeededRandom(matchId, 5, 20, 11) },
    yellowCards: { home: getSeededRandom(matchId, 0, 4, 12), away: getSeededRandom(matchId, 0, 4, 13) },
    redCards: { home: getSeededRandom(matchId, 0, 1, 14), away: getSeededRandom(matchId, 0, 1, 15) },
    offsides: { home: getSeededRandom(matchId, 0, 5, 16), away: getSeededRandom(matchId, 0, 5, 17) },
    corners: { home: getSeededRandom(matchId, 2, 12, 18), away: getSeededRandom(matchId, 2, 12, 19) },
  };
}

export function generateLineups(matchId: string, homeTeam: string, awayTeam: string) {
  const commonNames = ['Smith', 'Silva', 'Gonzalez', 'Kim', 'Ali', 'Garcia', 'Singh', 'Rossi', 'Müller', 'Lopez', 'Martinez', 'Jones', 'Williams', 'Davies', 'Chen'];
  
  const getPlayer = (team: string, pos: string, index: number) => {
    const seed = `${matchId}-${team}-${pos}-${index}`;
    const nameIndex = getSeededRandom(seed, 0, commonNames.length - 1);
    const initial = String.fromCharCode(65 + getSeededRandom(seed, 0, 25));
    const number = getSeededRandom(seed, 1, 99);
    const rating = (getSeededRandom(seed, 50, 95) / 10).toFixed(1);
    return { name: `${initial}. ${commonNames[nameIndex]}`, number, pos, rating };
  };

  const generateTeam = (teamName: string) => {
    return {
      formation: '4-3-3',
      starters: [
        getPlayer(teamName, 'GK', 1),
        getPlayer(teamName, 'DEF', 2), getPlayer(teamName, 'DEF', 3), getPlayer(teamName, 'DEF', 4), getPlayer(teamName, 'DEF', 5),
        getPlayer(teamName, 'MID', 6), getPlayer(teamName, 'MID', 7), getPlayer(teamName, 'MID', 8),
        getPlayer(teamName, 'FWD', 9), getPlayer(teamName, 'FWD', 10), getPlayer(teamName, 'FWD', 11),
      ],
      bench: Array.from({length: 7}).map((_, i) => getPlayer(teamName, 'SUB', i + 12))
    };
  };

  return {
    home: generateTeam(homeTeam),
    away: generateTeam(awayTeam)
  };
}

export function generateTimeline(matchId: string, footballData: FootballMatchData) {
  const events: any[] = [];
  
  if (footballData.goals) {
    footballData.goals.forEach(g => {
      events.push({ type: 'goal', time: g.time, team: g.team, player: g.player });
    });
  }
  if (footballData.cards) {
    footballData.cards.forEach(c => {
      events.push({ type: c.type.toLowerCase(), time: c.time, team: c.team, player: c.player });
    });
  }
  
  // Add some fake substitutions
  const numSubs = getSeededRandom(matchId, 2, 6, 20);
  for (let i = 0; i < numSubs; i++) {
    const time = getSeededRandom(matchId + i, 45, 90, 21);
    const isHome = getSeededRandom(matchId + i, 0, 1, 22) === 1;
    events.push({ type: 'substitution', time, team: isHome ? 'home' : 'away', playerIn: 'Sub In', playerOut: 'Starter Out' });
  }

  events.sort((a, b) => a.time - b.time);
  return events;
}
