// ============================================================
// MooEarth Live — Type Definitions
// ============================================================

/** Supported event categories */
export type EventCategory =
  | 'breaking'
  | 'sports'
  | 'football'
  | 'technology'
  | 'business'
  | 'weather'
  | 'entertainment'
  | 'worldcup';

export interface FootballMatchData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;      // e.g., '1H', 'HT', '2H', 'FT'
  elapsed: number;     // e.g., 45
  goals?: { team: 'home' | 'away'; player: string; time: number }[];
  cards?: { team: 'home' | 'away'; player: string; type: 'Yellow' | 'Red'; time: number }[];
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
}

/** Badge definition */
export interface GameBadge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  unlockedAt?: number;        // Timestamp when unlocked
}

/** Phase of the Play Earth game flow */
export type PlayEarthPhase =
  | 'intro'             // Initial landing — "Tap any country"
  | 'category-select'   // Choose a quiz category
  | 'question'          // Active timed question
  | 'result'            // Showing answer result
  | 'summary';          // Post-round summary

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
}
