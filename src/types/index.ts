// ============================================================
// MooEarth Live — Type Definitions
// ============================================================

/** Supported event categories */
export type EventCategory =
  | 'football'
  | 'sports'
  | 'weather'
  | 'seismic'
  | 'severe_weather'
  | 'wildfires'
  | 'space_weather'
  | 'climate_oceans'
  | 'science_nature';

export interface FootballMatchData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;      // e.g., '1H', 'HT', '2H', 'FT'
  elapsed: number;     // e.g., 45
  goals?: { team: 'home' | 'away'; player: string; time: number }[];
  cards?: { team: 'home' | 'away'; player: string; type: 'Yellow' | 'Red'; time: number }[];
  leagueId?: number;   // Competition ID for isolation
}

/** Historical coordinate observations for moving events like cyclones */
export interface EventTrackPoint {
  lat: number;
  lng: number;
  date?: string;
  windSpeedKph?: number;
  pressureHpa?: number;
}

/** Scientific telemetry for natural/planetary events */
export interface PlanetaryTelemetry {
  magnitude?: number;
  depthKm?: number;
  intensity?: string;
  tsunamiWarning?: boolean;
  windSpeedKph?: number;
  pressureHpa?: number;
  fireRadiativePowerMw?: number;
  brightnessTempKelvin?: number;
  fireConfidencePercent?: number;
  burnAreaHectares?: number;
  kpIndex?: number;
  solarWindSpeedKms?: number;
  geomagneticStormScale?: string;
  auroraVisibilityLatitude?: string;
  eventStatus?: string;
  sensorSource?: string;
  externalDataUrl?: string;
  trackPoints?: EventTrackPoint[];
  lightningStrikeRatePerMin?: number;
  peakCurrentKa?: number;
  radarReflectivityDbz?: number;
  hailSizeMm?: number;
  stormWarningType?: 'severe_thunderstorm' | 'tornado' | 'tropical_cyclone';
  oceanCurrentSpeedMs?: number;
  oceanCurrentDirectionDeg?: number;
  seaSurfaceTempC?: number;
  seaSurfaceTempAnomalyC?: number;
  significantWaveHeightM?: number;
  oceanCurrentName?: string;
  forecastCone?: {
    timeHours: number;
    centerLat: number;
    centerLng: number;
    errorRadiusKm: number;
  }[];
  cycloneAgency?: string;
  cycloneBasin?: string;
}

/** A world event displayed on the globe */
export interface WorldEvent {
  id: string;
  title: string;
  summary: string;
  category: EventCategory;
  country: string;
  city: string;
  lat: number;
  lng: number;
  source: string;
  publishedAt: string; // ISO 8601
  footballData?: FootballMatchData; // For V2 Football Engine
  stadium?: string; // Venue stadium name
  planetaryTelemetry?: PlanetaryTelemetry; // For Planetary Engine
  url?: string;
  thumbnail?: string;
}

/** Visual configuration for a category */
export interface CategoryConfig {
  label: string;
  emoji: string;
  color: string;       // Primary color (hex)
  glowColor: string;   // Glow / ring color (rgba)
  bgColor: string;     // Background tint for badges
}

/** Sidebar navigation item */
export interface SidebarItem {
  id: string;
  label: string;
  icon: string;        // Emoji or icon identifier
  category?: EventCategory; // If linked to a filter
}

/** Globe camera position */
export interface GlobePointOfView {
  lat: number;
  lng: number;
  altitude: number;
}

/** Connection arc between two events */
export interface EventArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

export type Mood = '🔥 Hype' | '😄 Celebration' | '😢 Sadness' | '😡 Anger' | '😨 Shock' | '😐 Neutral';

export interface SentimentData {
  mood: Mood;
  intensity: number; // 0 to 1
  explanation: string;
}

export interface ReactionEvent {
  id: string;
  country: string;
  headlines: WorldEvent[];
  socialPosts: { id: string; user: string; text: string; time: string; likes: number }[];
  trendingHashtags: string[];
  sentiment: SentimentData;
  query?: string;
  source?: string;
  noCategoryContent?: boolean;
  fallbackCategory?: string;
}

// ============================================================
// Play Earth — Game Mode Types
// ============================================================

/** Quiz question categories */
export type QuizCategory =
  | 'geography'
  | 'sports'
  | 'weather'
  | 'technology'
  | 'space'
  | 'history'
  | 'science'
  | 'nature'
  | 'politics'
  | 'culture'
  | 'trivia'
  | 'current-affairs'
  | 'mixed';

/** Difficulty tiers */
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

/** A single trivia question */
export interface EarthQuestion {
  id: string;
  country: string;           // Country this question relates to
  category: QuizCategory;
  difficulty: QuizDifficulty;
  question: string;
  choices: string[];          // 4 multiple-choice options
  correctIndex: number;       // Index of the correct answer in choices[]
  funFact?: string;           // Educational tidbit shown after answering
  timestamp?: number;         // Optional creation timestamp
  expirationDate?: string;    // Optional expiration ISO string
}

/** Badge definition */
export interface GameBadge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  unlockedAt?: number;        // Timestamp when unlocked
}

export type PlayEarthMode =
  | 'explorer'
  | 'survival'
  | 'clock'
  | 'flag'
  | 'capital'
  | 'daily'
  // Infinite Earth Game Engine modes
  | 'infinite'
  | 'globe-hunt'
  | 'weather-challenge'
  | 'border-escape'
  | 'earthquake-hunt'
  // Stop the Earth
  | 'stop-the-earth';

/** Phase of the Play Earth game flow */
export type PlayEarthPhase =
  | 'intro'                 // Initial landing — "Choose a Mode / Tap any country"
  | 'category-select'       // Choose a quiz category (Explorer Mode)
  | 'mode-select'           // Select game mode (Country select dashboard)
  | 'survival-start'        // Instructions for survival mode
  | 'beat-the-clock-start'  // Duration select for beat the clock
  | 'flag-challenge-start'  // Difficulty select for flag challenge
  | 'capital-challenge-start' // Difficulty select for capital city challenge
  | 'daily-earth-start'     // Daily global challenge dashboard
  | 'question'              // Active timed question
  | 'result'                // Showing answer result
  | 'summary'               // Post-round summary
  // Infinite Earth Game Engine phases
  | 'engine-loading'        // Loading next engine challenge
  | 'engine-challenge'      // Active engine challenge (globe_tap, slider, etc.)
  | 'engine-result'         // Engine challenge result with scoring breakdown
  | 'engine-summary'        // Engine session summary
  | 'demo'                  // Interactive playable onboarding demo ("Learn by Doing")
  // Stop the Earth Game Phases
  | 'stop-the-earth-start'
  | 'stop-the-earth-countdown'
  | 'stop-the-earth-spin'
  | 'stop-the-earth-stopped'
  | 'stop-the-earth-select'
  | 'stop-the-earth-result'
  | 'stop-the-earth-summary';

export interface ModeStats {
  gamesPlayed: number;
  highScore: number;
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
}

/** Persistent player game state (stored in localStorage) */
export interface PlayerGameState {
  username: string;
  xp: number;
  level: number;
  streak: number;              // Current consecutive correct answers
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  answeredIds: string[];       // IDs of answered questions (anti-repeat)
  answeredQuestionIds: string[]; // Tracked answered IDs specifically
  recentQuestions: string[];    // Recently seen question IDs
  recentCountryQuestions: string[]; // Recently seen country-specific question IDs
  countriesExplored: string[]; // Countries the player has quizzed on
  badges: GameBadge[];
  lastPlayedAt?: number;       // Timestamp
  
  // V2 Game Mode statistics
  survivalBest?: number;       // Best country streak survived
  clockBest?: Record<'30s' | '60s' | '120s', number>; // High scores per duration
  flagBest?: Record<'easy' | 'medium' | 'hard', number>; // High streaks per flag difficulty
  capitalBest?: Record<'easy' | 'medium' | 'hard', number>; // High streaks per capital difficulty
  dailyChallengeStreak?: number;
  lastDailyChallengeDate?: string; // YYYY-MM-DD
  answeredQuestions?: { id: string; question: string; country: string }[];

  // Infinite Earth Game Engine stats
  infiniteHighScore?: number;
  infiniteBestStreak?: number;
  infiniteTotalChallenges?: number;
  infiniteCorrectAnswers?: number;
  infiniteFavoriteMode?: string;
  engineFingerprints?: string[];    // Persisted anti-repeat fingerprints
}
