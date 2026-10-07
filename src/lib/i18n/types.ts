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

export interface WorldMapTranslation {
  title: string;
  description: string;
  h1: string;
  badge: string;
  summary: string;
  regionsTitle: string;
  regionsDesc: string;
  regionAfricaEuropeTitle: string;
  regionAfricaEuropeText: string;
  regionAsiaOceaniaTitle: string;
  regionAsiaOceaniaText: string;
  regionAmericasTitle: string;
  regionAmericasText: string;
  globeCtaTitle: string;
  globeCtaDesc: string;
  globeCtaBtn: string;
  worldGeographyBtn: string;
}

export interface WeatherTranslation {
  title: string;
  description: string;
  h1: string;
  badge: string;
  summary: string;
  radarHeading: string;
  radarSubtitle: string;
  liveTelemetry: string;
  physicalSensors: string;
}

export interface WorldNewsTranslation {
  title: string;
  description: string;
  h1: string;
  badge: string;
  summary: string;
  liveMapHeading: string;
  wireDispatchesHeading: string;
}

export interface WorldEventsTranslation {
  title: string;
  description: string;
  h1: string;
  badge: string;
  summary: string;
  observatoryHeading: string;
  liveMapHeading: string;
}

export interface GameModeTranslation {
  title: string;
  description: string;
  h1: string;
  badge: string;
  summary: string;
  aboutTitle: string;
  howToPlayTitle: string;
  rulesTitle: string;
  relatedTitle: string;
  countriesTitle: string;
}

export interface NavbarTranslation {
  playEarth: string;
  modesBadge: string;
  play: string;
  signIn: string;
  search: string;
  searchPlaceholder: string;
  aboutLegal: string;
  leaderboards: string;
  muteAudio: string;
  unmuteAudio: string;
  cinematicMode: string;
  liveDataActive: string;
  partialLiveData: string;
  liveDataOffline: string;
  selectLanguage: string;
  localesCount: string;
  viewProfileStats: string;
}

export interface StatusBarTranslation {
  livingEarthNetwork: string;
  network: string;
  live: string;
  trackedCountries: string;
  activeStories: string;
  liveMatches: string;
  globalPulse: string;
  intensity: string;
}

export interface SidebarTranslation {
  home: string;
  news: string;
  football: string;
  sports: string;
  technology: string;
  weather: string;
  business: string;
  entertainment: string;
  aboutLegal: string;
  settings: string;
}

export interface LiveFeedTranslation {
  liveEvents: string;
  total: string;
  live: string;
  matches: string;
  knockout: string;
  players: string;
  stats: string;
  table: string;
  noLiveEvents: string;
  checkBackLater: string;
  homeFeed: string;
  eventsCount: string;
  justNow: string;
  ago: string;
  activeMatches: string;
  totalGoals: string;
  yellowCards: string;
  redCards: string;
  liveNow: string;
  today: string;
  tomorrow: string;
  yesterday: string;
  groupStage: string;
}

export interface PlayEarthOverlayTranslation {
  title: string;
  subtitle: string;
  modesBadge: string;
  exitMode: string;
  playNow: string;
  startGame: string;
  gameOver: string;
  score: string;
  streak: string;
  dayStreak: string;
  bestStreak: string;
  multiplier: string;
  correct: string;
  incorrect: string;
  nextQuestion: string;
  playAgain: string;
  chooseMode: string;
  dailyChallenge: string;
  geographyQuiz: string;
  flagQuiz: string;
  capitalQuiz: string;
  survivalMode: string;
  beatTheClock: string;
  countryExplorer: string;
  borderEscape: string;
}

export interface SettingsTranslation {
  title: string;
  sound: string;
  language: string;
  theme: string;
  close: string;
  save: string;
}

export interface NotificationsTranslation {
  liveDataActive: string;
  matchStarted: string;
  goalScored: string;
  newsAlert: string;
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
    worldMap: string;
    worldNews: string;
    worldEvents: string;
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
    regionLabel: string;
    liveUpdates: string;
    backToGlobe: string;
    exploreCountry: string;
    playCountryQuiz: string;
    majorCitiesLabel: string;
    weatherForecastLabel: string;
    overviewHeading: string;
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
  worldMap: WorldMapTranslation;
  weather: WeatherTranslation;
  worldNews: WorldNewsTranslation;
  worldEvents: WorldEventsTranslation;
  gamesHub: GameModeTranslation;
  geographyQuiz: GameModeTranslation;
  flagQuiz: GameModeTranslation;
  countryQuiz: GameModeTranslation;
  navbar: NavbarTranslation;
  statusBar: StatusBarTranslation;
  sidebar: SidebarTranslation;
  liveFeed: LiveFeedTranslation;
  playEarthOverlay: PlayEarthOverlayTranslation;
  settings: SettingsTranslation;
  notifications: NotificationsTranslation;
}
