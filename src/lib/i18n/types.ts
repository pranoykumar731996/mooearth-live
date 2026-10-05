// ============================================================
// MooEarth Live — Internationalization (i18n) Types
// ============================================================

export type SupportedLocale = 'en' | 'es' | 'fr' | 'pt' | 'de' | 'ja' | 'hi' | 'ar';

export interface LocaleMeta {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export interface TranslationDictionary {
  locale: SupportedLocale;
  nav: {
    home: string;
    daily: string;
    explore: string;
    trending: string;
    games: string;
    party: string;
    news: string;
    sports: string;
    weather: string;
    business: string;
    technology: string;
    about: string;
    language: string;
  };
  hero: {
    title: string;
    subtitle: string;
    tagline: string;
    liveBadge: string;
    exploreBtn: string;
    dailyBtn: string;
    partyBtn: string;
  };
  countryHub: {
    titleTemplate: (country: string) => string;
    descriptionTemplate: (country: string) => string;
    capitalLabel: string;
    populationLabel: string;
    liveUpdates: string;
    backToGlobe: string;
    exploreCountry: string;
    playCountryQuiz: string;
  };
  daily: {
    title: string;
    subtitle: string;
    dailyBadge: string;
    startBtn: string;
    questionCounter: (current: number, total: number) => string;
    streakLabel: string;
    bestStreakLabel: string;
    timeRemaining: string;
    nextChallengeIn: string;
    shareScore: string;
    copiedToast: string;
    playAgain: string;
    challengeFriend: string;
    summaryTitle: string;
    viewExplanation: string;
    socialShareText: (score: number, total: number, timeStr: string, streak: number, dateStr: string, url: string) => string;
  };
  party: {
    title: string;
    subtitle: string;
    hostRoom: string;
    joinRoom: string;
    createRoomBtn: string;
    joinRoomBtn: string;
    roomPinPlaceholder: string;
    nicknamePlaceholder: string;
    selectAvatar: string;
    lobbyTitle: string;
    waitingForHost: string;
    startGameBtn: string;
    copyRoomLink: string;
    roomLinkCopied: string;
    roundCounter: (current: number, total: number) => string;
    podiumTitle: string;
    finalRank: string;
    pointsLabel: string;
    playAnotherRound: string;
  };
  common: {
    loading: string;
    share: string;
    copied: string;
    close: string;
    back: string;
    poweredBy: string;
  };
}
