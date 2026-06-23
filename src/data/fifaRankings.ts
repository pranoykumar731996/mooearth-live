export const FIFA_RANKINGS: Record<string, number> = {
  'Argentina': 1,
  'Spain': 2,
  'France': 3,
  'England': 4,
  'Portugal': 5,
  'Brazil': 6,
  'Morocco': 7,
  'Netherlands': 8,
  'Belgium': 9,
  'Germany': 10,
  'Croatia': 11,
  'Italy': 12,
  'Colombia': 13,
  'Mexico': 14,
  'Senegal': 15,
  'Uruguay': 16,
  'United States': 17,
  'USA': 17,
  'Japan': 18,
  'Switzerland': 19,
  'Iran': 20,
  'Denmark': 21,
  'Türkiye': 22,
  'Turkey': 22,
  'Ecuador': 23,
  'Austria': 24,
  'South Korea': 25,
  'Nigeria': 26,
  'Australia': 27,
  'Algeria': 28,
  'Egypt': 29,
  'Canada': 30,
  'Norway': 31,
  'Ukraine': 32,
  'Ivory Coast': 33,
  "Cote d'Ivoire": 33,
  'Panama': 34,
  'Russia': 35,
  'Poland': 36,
  'Wales': 37,
  'Sweden': 38,
  'Hungary': 39,
  'Czechia': 40,
  'Paraguay': 41,
  'Scotland': 42,
  'Serbia': 43,
  'Cameroon': 44,
  'Tunisia': 45,
  'Democratic Republic of the Congo': 46,
  'Slovakia': 47,
  'Greece': 48,
  'Venezuela': 49,
  'Uzbekistan': 50,
  'Costa Rica': 53,
  'Qatar': 56,
  'South Africa': 60,
  'Saudi Arabia': 61,
  'Bosnia and Herzegovina': 64,
  'Honduras': 65,
  'Jamaica': 71,
  'Ghana': 73,
  'Haiti': 83,
  'New Zealand': 85
};

export function getRealFifaRank(country: string): number {
  return FIFA_RANKINGS[country] || 99; // Fallback for unknown teams
}

export function getRealWinRatio(rank: number): number {
  const maxWinRatio = 75;
  const minWinRatio = 35;
  const ratio = Math.max(minWinRatio, maxWinRatio - (rank * 0.4));
  return Math.floor(ratio);
}

export function getRealGoalsScored(rank: number): number {
  const maxGoals = 85;
  const minGoals = 20;
  const goals = Math.max(minGoals, maxGoals - Math.floor(rank * 0.6));
  return Math.floor(goals);
}
