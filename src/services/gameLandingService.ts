// ============================================================
// MooEarth Live — Play Earth Game Landing Service
// ============================================================
// Supplies SEO metadata, game descriptions, how-to-play rules,
// and authentic Play Earth questions for Google-indexed game landing pages.
// Never duplicates game engines or creates fake questions.

import { EarthQuestion } from '@/types';
import {
  generateFlagQuestion,
  generateCapitalQuestion,
  getQuestionsForCountry,
  DEDUPLICATED_STATIC_QUESTIONS,
} from '@/data/questions';
import { COUNTRY_METADATA } from '@/data/questions/countryMetadata';
import { fetchQuizForCountry } from '@/services/countryQuizService';
import { CANONICAL_COUNTRIES, CountryRecord } from '@/data/countries';

export interface GameLandingConfig {
  slug: string;
  name: string;
  emoji: string;
  badge: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  difficulty: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  timePerQuestion: number;
  questionCount: number;
  detailedDescription: string[];
  howToPlay: { step: number; title: string; text: string }[];
  scoringRules: string[];
  canonical: string;
  gameModeKey: string;
  relatedSlugs: string[];
}

export const GAME_LANDING_CONFIGS: Record<string, GameLandingConfig> = {
  'games': {
    slug: 'games',
    name: 'Play Earth Games',
    emoji: '🌍',
    badge: 'Master Games Hub',
    h1: 'Play Earth — Free Online Geography Games & Challenges',
    metaTitle: 'Earth Games & Interactive Geography Challenges | MooEarth Live',
    metaDescription: 'Play free interactive geography games on MooEarth Live. Test your world knowledge with flag quizzes, capital challenges, world map puzzles, country trivia, and 3D Earth exploration.',
    difficulty: 'Adaptive (All Skill Levels)',
    difficultyLevel: 'medium',
    timePerQuestion: 15,
    questionCount: 5,
    detailedDescription: [
      'Welcome to Play Earth on MooEarth Live, the premier interactive gaming portal for world geography, national flags, capitals, and geopolitical knowledge.',
      'From fast-paced capital matching and visual vexillology flag identification to global map positioning, each game challenges your planetary literacy with authentic, curated world data across 195 sovereign nations.',
      'Play immediately in your browser without accounts or downloads. Track your scores, build streaks, unlock spoiler-free shareable scorecards, and challenge friends to live 1v1 head-to-head battles.',
    ],
    howToPlay: [
      { step: 1, title: 'Select a Challenge', text: 'Choose from flag quizzes, capital cities, country facts, map coordinates, or play the live challenge below.' },
      { step: 2, title: 'Answer Rapidly', text: 'Read the question and select the correct answer from 4 choices within 15 seconds to earn maximum speed XP.' },
      { step: 3, title: 'Chain Streaks', text: 'Build consecutive correct answers to multiply your score and earn high accuracy ratings.' },
      { step: 4, title: 'Share & Challenge', text: 'Generate your spoiler-free scorecard, copy your 1v1 battle link, and see if friends can beat your record.' },
    ],
    scoringRules: [
      '1,000 Base XP per correct answer',
      'Up to +500 Speed Bonus XP for answering within seconds',
      'Streak multipliers for back-to-back correct answers',
      'Zero-spoiler emoji scorecard upon completion',
    ],
    canonical: 'https://www.mooearth.live/games',
    gameModeKey: 'geography',
    relatedSlugs: ['geography-games', 'flag-quiz', 'capital-quiz', 'country-quiz', 'world-map-quiz', 'world-geography-quiz', 'geography-quiz'],
  },
  'geography-games': {
    slug: 'geography-games',
    name: 'Geography Games',
    emoji: '🗺️',
    badge: 'Global Geography Arcade',
    h1: 'Geography Games — Free World Map & Country Challenges',
    metaTitle: 'Geography Games — Free World Map & Country Challenges | MooEarth Live',
    metaDescription: 'Play free online geography games. Explore interactive world maps, identify countries and flags, match capitals, and test your knowledge of continents and oceans on MooEarth Live.',
    difficulty: 'Adaptive (Easy · Medium · Hard)',
    difficultyLevel: 'medium',
    timePerQuestion: 15,
    questionCount: 5,
    detailedDescription: [
      'Sharpen your spatial awareness and global trivia mastery with our comprehensive suite of online geography games. Whether you are studying world maps or challenging friends, Play Earth offers rich, educational entertainment.',
      'Our questions test sovereign borders, international rivers, mountain peaks, island nations, and continental geography spanning all 7 continents.',
      'Every game is fully responsive and optimized for mobile and desktop screens, featuring real-time feedback, fun facts, and instant viral challenge capability.',
    ],
    howToPlay: [
      { step: 1, title: 'Inspect the Question', text: 'Read the geographic clues regarding countries, oceans, terrains, and geopolitical features.' },
      { step: 2, title: 'Lock In Your Guess', text: 'Tap your choice before the 15-second countdown expires.' },
      { step: 3, title: 'Learn the Fun Fact', text: 'Discover verified geographic trivia with immediate explanations on every question.' },
      { step: 4, title: 'Compete Worldwide', text: 'Share your scorecard and challenge friends to beat your completion time.' },
    ],
    scoringRules: [
      '1,000 Base XP per correct question',
      'Speed bonus scaling with remaining timer seconds',
      'Direct 1v1 battle link generation',
    ],
    canonical: 'https://www.mooearth.live/geography-games',
    gameModeKey: 'geography',
    relatedSlugs: ['world-geography-quiz', 'geography-quiz', 'country-quiz', 'world-map-quiz', 'capital-quiz', 'flag-quiz', 'games'],
  },
  'geography-quiz': {
    slug: 'geography-quiz',
    name: 'Geography Quiz',
    emoji: '🌐',
    badge: 'Physical & Political Geography',
    h1: 'Geography Quiz — Test Your Knowledge of World Geography',
    metaTitle: 'Geography Quiz — Test Your Knowledge of World Geography | MooEarth Live',
    metaDescription: 'Test how well you know planet Earth with our interactive geography quiz. Answer questions on rivers, mountains, continents, natural wonders, and geopolitical borders.',
    difficulty: 'Medium (Timed 15s)',
    difficultyLevel: 'medium',
    timePerQuestion: 15,
    questionCount: 5,
    detailedDescription: [
      'How well do you know world geography? The MooEarth Geography Quiz puts your planetary knowledge to the test with questions spanning major continents, physical topography, and country borders.',
      'Learn about deep ocean trenches, high mountain ranges like the Himalayas and Andes, world-famous straits, and sovereign territory facts.',
      'Engage with authentic multiple-choice questions curated directly from the Play Earth planetary database.',
    ],
    howToPlay: [
      { step: 1, title: 'Read the Prompt', text: 'Analyze physical geography and geopolitical questions from around the globe.' },
      { step: 2, title: 'Select Your Answer', text: 'Choose the correct answer among 4 choices before time runs out.' },
      { step: 3, title: 'Earn XP', text: 'Collect XP points and build up your continuous daily play streak.' },
      { step: 4, title: 'Challenge Friends', text: 'Send your score to friends via WhatsApp or X and challenge them to a 1v1 rematch.' },
    ],
    scoringRules: [
      '1,000 XP base points',
      '+500 Maximum speed bonus',
      'Zero-spoiler scorecard generation',
    ],
    canonical: 'https://www.mooearth.live/geography-quiz',
    gameModeKey: 'geography',
    relatedSlugs: ['world-geography-quiz', 'country-quiz', 'world-map-quiz', 'capital-quiz', 'flag-quiz', 'geography-games'],
  },
  'world-geography-quiz': {
    slug: 'world-geography-quiz',
    name: 'World Geography Quiz',
    emoji: '🧭',
    badge: 'Planetary Mastery',
    h1: 'World Geography Quiz — Global Geography Trivia Challenge',
    metaTitle: 'World Geography Quiz — Global Geography Trivia Challenge | MooEarth Live',
    metaDescription: 'Take on the ultimate world geography quiz. Test your planetary expertise across all 7 continents, 195 sovereign nations, oceans, straits, and geographic extremes on MooEarth Live.',
    difficulty: 'Hard / Expert Challenge',
    difficultyLevel: 'hard',
    timePerQuestion: 15,
    questionCount: 5,
    detailedDescription: [
      'The World Geography Quiz is designed for trivia enthusiasts, geography buffs, students, and competitive explorers who want an in-depth planetary challenge.',
      'Explore questions touching on landlocked nations, enclave territories, hemisphere alignments, tectonic borders, and international time zones.',
      'Every round pulls from our extensive global database to ensure varied, educational, and replayable gameplay.',
    ],
    howToPlay: [
      { step: 1, title: 'Analyze the Challenge', text: 'Tackle expert-level questions covering sovereign boundaries, climates, and natural geography.' },
      { step: 2, title: 'Think Fast', text: 'Clocking in your answer fast provides critical bonus XP needed for high leaderboard placement.' },
      { step: 3, title: 'Inspect Explanations', text: 'Review verified educational facts accompanying every question.' },
      { step: 4, title: 'Issue 1v1 Challenges', text: 'Create customized 1v1 battle URLs to challenge classmates, colleagues, and friends.' },
    ],
    scoringRules: [
      '1,000 XP Base points per question',
      'Dynamic speed bonus up to 500 XP',
      'Detailed battle statistics summary',
    ],
    canonical: 'https://www.mooearth.live/world-geography-quiz',
    gameModeKey: 'geography',
    relatedSlugs: ['geography-quiz', 'country-quiz', 'world-map-quiz', 'capital-quiz', 'flag-quiz', 'geography-games'],
  },
  'country-quiz': {
    slug: 'country-quiz',
    name: 'Country Quiz',
    emoji: '🏛️',
    badge: '195 Sovereign Nations',
    h1: 'Country Quiz — Identify Nations & World Geography',
    metaTitle: 'Country Quiz — Identify Nations & World Geography | MooEarth Live',
    metaDescription: 'Can you identify every sovereign nation? Play our free country quiz to test your knowledge of world territories, national landmarks, populations, and cultures on MooEarth Live.',
    difficulty: 'Medium (195 Sovereign Nations)',
    difficultyLevel: 'medium',
    timePerQuestion: 15,
    questionCount: 5,
    detailedDescription: [
      'Can you identify all 195 sovereign nations on Earth? The MooEarth Country Quiz tests your familiarity with world countries through their famous landmarks, capitals, populations, and geographical neighbors.',
      'From microstates like Monaco and Vatican City to continental giants like Brazil, Canada, and Australia, discover the fascinating characteristics of every corner of our planet.',
      'No registration needed — jump straight into the challenge, earn points, and share your results instantly.',
    ],
    howToPlay: [
      { step: 1, title: 'Examine National Clues', text: 'Review clues referencing country landmarks, regions, and sovereign traits.' },
      { step: 2, title: 'Select the Nation', text: 'Pick the correct sovereign country from the 4 available options.' },
      { step: 3, title: 'Earn Your Rating', text: 'Achieve a 5/5 score to earn the Flawless Knowledge Explorer badge.' },
      { step: 4, title: 'Send to Friends', text: 'Copy your challenge link and see who can identify countries faster.' },
    ],
    scoringRules: [
      '1,000 Base XP per correct question',
      'Time bonus calculated down to the second',
      'Direct link to full country atlas pages',
    ],
    canonical: 'https://www.mooearth.live/country-quiz',
    gameModeKey: 'country',
    relatedSlugs: ['capital-quiz', 'flag-quiz', 'world-map-quiz', 'geography-quiz', 'world-geography-quiz', 'geography-games'],
  },
  'capital-quiz': {
    slug: 'capital-quiz',
    name: 'Capital Quiz',
    emoji: '🏙️',
    badge: 'World Capital Challenge',
    h1: 'Capital Quiz — Guess World Capital Cities',
    metaTitle: 'Capital Quiz — Guess World Capital Cities | MooEarth Live',
    metaDescription: 'Test your knowledge of world capitals with our interactive capital city quiz. From Washington to Tokyo, Canberra to Kigali, match capital cities to countries on MooEarth Live.',
    difficulty: 'Adaptive (Easy to Expert Capitals)',
    difficultyLevel: 'medium',
    timePerQuestion: 15,
    questionCount: 5,
    detailedDescription: [
      'Do you know the capital of Australia? What about Kazakhstan, Canada, or Morocco? The MooEarth Capital Quiz is the classic test of world knowledge, challenging you to match sovereign countries to their administrative capitals.',
      'Learn the difference between largest cities and official capitals (such as Sydney vs. Canberra, or Rio de Janeiro vs. Brasília) while setting personal speed records.',
      'Every question is dynamically matched from official sovereign nation data to ensure 100% geographic accuracy.',
    ],
    howToPlay: [
      { step: 1, title: 'See the Country', text: 'Read the target sovereign nation displayed in the question card.' },
      { step: 2, title: 'Match the Capital', text: 'Choose the official capital city from 4 choices.' },
      { step: 3, title: 'Avoid Common Pitfalls', text: 'Watch out for famous economic hubs that are not official government capitals!' },
      { step: 4, title: 'Share Your Score', text: 'Copy your spoiler-free emoji scorecard and challenge friends to beat your time.' },
    ],
    scoringRules: [
      '1,000 XP per correct capital match',
      'Up to +500 XP fast-response bonus',
      'Dynamic 1v1 battle link created for every round',
    ],
    canonical: 'https://www.mooearth.live/capital-quiz',
    gameModeKey: 'capital',
    relatedSlugs: ['flag-quiz', 'country-quiz', 'world-map-quiz', 'geography-quiz', 'world-geography-quiz', 'geography-games'],
  },
  'flag-quiz': {
    slug: 'flag-quiz',
    name: 'Flag Quiz',
    emoji: '🏁',
    badge: 'Visual Vexillology Challenge',
    h1: 'Flag Quiz — Guess the Flags of the World',
    metaTitle: 'Flag Quiz — Guess the Flags of the World | MooEarth Live',
    metaDescription: 'Play the interactive world flag quiz on MooEarth Live. Identify national flags across 195 sovereign nations, test your vexillology skills, and challenge friends.',
    difficulty: 'Visual Vexillology (Easy · Medium · Hard)',
    difficultyLevel: 'medium',
    timePerQuestion: 15,
    questionCount: 5,
    detailedDescription: [
      'Can you tell the flags of Chad and Romania apart? What about Ireland and Ivory Coast? The MooEarth Flag Quiz is a visual challenge designed for vexillology fans and curious minds alike.',
      'Identify colors, tricolors, emblems, stars, and coats of arms across 195 sovereign nation flags.',
      'Our adaptive generator provides balanced distractors from matching continents and regions to give you an authentic, engaging quiz experience.',
    ],
    howToPlay: [
      { step: 1, title: 'Observe the Flag', text: 'Inspect the national flag banner, colors, and symbols shown on screen.' },
      { step: 2, title: 'Identify the Country', text: 'Select the sovereign nation that flies this flag.' },
      { step: 3, title: 'Speed Counts', text: 'Lock in your answer swiftly to capture maximum bonus points.' },
      { step: 4, title: 'Share Your Flag Streak', text: 'Export your Wordle-style flag scorecard and share via WhatsApp, X, or direct message.' },
    ],
    scoringRules: [
      '1,000 XP base points per correct flag',
      'Speed bonus scaling with remaining countdown',
      'Wordle-style emoji grid (🟩/🟥) ready for one-tap copy',
    ],
    canonical: 'https://www.mooearth.live/flag-quiz',
    gameModeKey: 'flag',
    relatedSlugs: ['capital-quiz', 'country-quiz', 'world-map-quiz', 'geography-quiz', 'world-geography-quiz', 'geography-games'],
  },
  'world-map-quiz': {
    slug: 'world-map-quiz',
    name: 'World Map Quiz',
    emoji: '🗺️',
    badge: 'Spatial Map Intelligence',
    h1: 'World Map Quiz — Interactive Map Location Challenge',
    metaTitle: 'World Map Quiz — Interactive Map Location Challenge | MooEarth Live',
    metaDescription: 'Sharpen your cartographic skills with the interactive world map quiz. Identify countries by their geographic position, bordering neighbors, oceans, and hemispheres on MooEarth Live.',
    difficulty: 'Spatial Cartography (Medium)',
    difficultyLevel: 'medium',
    timePerQuestion: 15,
    questionCount: 5,
    detailedDescription: [
      'Put your mental world map to the test! The World Map Quiz challenges your spatial reasoning with questions focused on geographic coordinates, maritime borders, neighboring states, and regional clusters.',
      'Learn which countries border the Baltic Sea, which nations cross the Equator, and how island archipelagos are situated across global oceans.',
      'Seamlessly connect from the quiz into our 3D interactive globe and world map explorer for visual verification and deeper exploration.',
    ],
    howToPlay: [
      { step: 1, title: 'Read the Map Clue', text: 'Analyze boundary relationships, bordering oceans, and hemisphere positions.' },
      { step: 2, title: 'Choose the Location', text: 'Select the corresponding sovereign nation or geographic territory.' },
      { step: 3, title: 'Boost Your Ranking', text: 'Build streaks and collect high scores to climb global rankings.' },
      { step: 4, title: 'Challenge Fellow Explorers', text: 'Issue a 1v1 challenge link to see if friends can out-navigate you on the map.' },
    ],
    scoringRules: [
      '1,000 XP Base score per map question',
      'Elapsed time bonus for quick response',
      'Seamless links to 3D Globe & Interactive World Map',
    ],
    canonical: 'https://www.mooearth.live/world-map-quiz',
    gameModeKey: 'world-map',
    relatedSlugs: ['geography-games', 'geography-quiz', 'world-geography-quiz', 'country-quiz', 'capital-quiz', 'flag-quiz'],
  },
};

/**
 * Fetch authentic Play Earth questions for any game landing mode.
 * Never fabricates fake questions; uses existing question engines.
 */
export function fetchQuestionsForGameMode(
  mode: string,
  countryName?: string,
  count: number = 5
): EarthQuestion[] {
  // 1. If country-specific game (e.g. /games/geography/[country])
  if (countryName) {
    const countryData = fetchQuizForCountry(countryName);
    if (countryData.questions && countryData.questions.length >= count) {
      return countryData.questions.slice(0, count);
    }
    // Pad with general country questions if needed
    const fallback = getQuestionsForCountry(countryName, 'geography', [], count);
    if (fallback.length >= count) return fallback.slice(0, count);
  }

  // 2. Flag Quiz Mode
  if (mode === 'flag-quiz') {
    const questions: EarthQuestion[] = [];
    const seenIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const q = generateFlagQuestion('medium', seenIds);
      seenIds.push(q.id);
      questions.push(q);
    }
    return questions;
  }

  // 3. Capital Quiz Mode
  if (mode === 'capital-quiz') {
    const questions: EarthQuestion[] = [];
    const seenIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const q = generateCapitalQuestion('medium', seenIds);
      seenIds.push(q.id);
      questions.push(q);
    }
    return questions;
  }

  // 4. Country Quiz Mode
  if (mode === 'country-quiz') {
    const metadataList = Object.values(COUNTRY_METADATA);
    // Shuffle and pick 5 countries
    const shuffledMeta = [...metadataList].sort(() => Math.random() - 0.5);
    const questions: EarthQuestion[] = [];

    for (let i = 0; i < Math.min(count, shuffledMeta.length); i++) {
      const target = shuffledMeta[i];
      // Generate multiple choice options from other countries
      const distractors = shuffledMeta
        .filter(m => m.name !== target.name && m.continent === target.continent)
        .slice(0, 3)
        .map(m => m.name);

      while (distractors.length < 3) {
        const extra = shuffledMeta.find(m => m.name !== target.name && !distractors.includes(m.name));
        if (extra) distractors.push(extra.name);
        else break;
      }

      const choices = [target.name, ...distractors].sort(() => Math.random() - 0.5);
      const correctIndex = choices.indexOf(target.name);

      questions.push({
        id: `country-id-${target.name.toLowerCase()}-${i}`,
        country: target.name,
        category: 'geography',
        difficulty: 'medium',
        question: `Which sovereign nation is famous for the landmark "${target.landmark}" and has its capital at ${target.capital}?`,
        choices,
        correctIndex,
        funFact: `${target.name} (${target.flag}) is located in ${target.continent}. ${target.funFact}`,
      });
    }

    if (questions.length >= count) return questions;
  }

  // 5. World Map Quiz Mode
  if (mode === 'world-map-quiz') {
    const mapPool = DEDUPLICATED_STATIC_QUESTIONS.filter(q =>
      q.category === 'geography' &&
      (q.question.toLowerCase().includes('border') ||
       q.question.toLowerCase().includes('ocean') ||
       q.question.toLowerCase().includes('continent') ||
       q.question.toLowerCase().includes('sea') ||
       q.question.toLowerCase().includes('island') ||
       q.question.toLowerCase().includes('hemisphere') ||
       q.question.toLowerCase().includes('locate'))
    );

    if (mapPool.length >= count) {
      return [...mapPool].sort(() => Math.random() - 0.5).slice(0, count);
    }
  }

  // 6. General Geography (geography-quiz, world-geography-quiz, geography-games, games)
  const geoPool = DEDUPLICATED_STATIC_QUESTIONS.filter(q => q.category === 'geography' || q.category === 'trivia');
  if (geoPool.length >= count) {
    return [...geoPool].sort(() => Math.random() - 0.5).slice(0, count);
  }

  // Ultimate fallback to deduplicated static questions
  return [...DEDUPLICATED_STATIC_QUESTIONS].slice(0, count);
}

/**
 * Top featured sovereign countries for high-intent internal linking
 */
export const FEATURED_COUNTRY_SELECTION: Array<{
  name: string;
  slug: string;
  flag: string;
  capital: string;
  landmark: string;
  region: string;
}> = [
  { name: 'United States', slug: 'united-states', flag: '🇺🇸', capital: 'Washington, D.C.', landmark: 'Statue of Liberty', region: 'Americas' },
  { name: 'United Kingdom', slug: 'united-kingdom', flag: '🇬🇧', capital: 'London', landmark: 'Big Ben', region: 'Europe' },
  { name: 'Japan', slug: 'japan', flag: '🇯🇵', capital: 'Tokyo', landmark: 'Mount Fuji', region: 'Asia' },
  { name: 'France', slug: 'france', flag: '🇫🇷', capital: 'Paris', landmark: 'Eiffel Tower', region: 'Europe' },
  { name: 'Germany', slug: 'germany', flag: '🇩🇪', capital: 'Berlin', landmark: 'Brandenburg Gate', region: 'Europe' },
  { name: 'Brazil', slug: 'brazil', flag: '🇧🇷', capital: 'Brasília', landmark: 'Christ the Redeemer', region: 'Americas' },
  { name: 'India', slug: 'india', flag: '🇮🇳', capital: 'New Delhi', landmark: 'Taj Mahal', region: 'Asia' },
  { name: 'Australia', slug: 'australia', flag: '🇦🇺', capital: 'Canberra', landmark: 'Sydney Opera House', region: 'Oceania' },
  { name: 'Canada', slug: 'canada', flag: '🇨🇦', capital: 'Ottawa', landmark: 'CN Tower', region: 'Americas' },
  { name: 'Italy', slug: 'italy', flag: '🇮🇹', capital: 'Rome', landmark: 'Colosseum', region: 'Europe' },
  { name: 'Spain', slug: 'spain', flag: '🇪🇸', capital: 'Madrid', landmark: 'Sagrada Família', region: 'Europe' },
  { name: 'South Africa', slug: 'south-africa', flag: '🇿🇦', capital: 'Pretoria', landmark: 'Table Mountain', region: 'Africa' },
  { name: 'Egypt', slug: 'egypt', flag: '🇪🇬', capital: 'Cairo', landmark: 'Pyramids of Giza', region: 'Africa' },
  { name: 'Mexico', slug: 'mexico', flag: '🇲🇽', capital: 'Mexico City', landmark: 'Chichen Itza', region: 'Americas' },
  { name: 'Argentina', slug: 'argentina', flag: '🇦🇷', capital: 'Buenos Aires', landmark: 'Iguazu Falls', region: 'Americas' },
  { name: 'South Korea', slug: 'south-korea', flag: '🇰🇷', capital: 'Seoul', landmark: 'Gyeongbokgung Palace', region: 'Asia' },
];

/**
 * Standard Geography Discovery Links for rich internal cross-linking
 */
export const GEOGRAPHY_NAVIGATION_LINKS = [
  { href: '/world-map', label: 'Interactive World Map', emoji: '🗺️', desc: 'Browse borders, coordinates, and regional topology.' },
  { href: '/geography', label: 'World Geography Atlas', emoji: '🏔️', desc: 'Comprehensive global landforms, rivers, and mountains.' },
  { href: '/interactive-globe', label: '3D Interactive Globe', emoji: '🌍', desc: 'Rotate planet Earth in full cinematic 3D.' },
  { href: '/world-geography', label: 'Continents & Hemispheres', emoji: '🌐', desc: 'Explore continental divisions and climate zones.' },
  { href: '/cities', label: 'Cities & Places Directory', emoji: '🏙️', desc: 'Major metropolitan areas and geographic coordinates.' },
  { href: '/play-earth', label: 'Play Earth 3D Game', emoji: '🎮', desc: 'The full 3D interactive globe trivia experience.' },
  { href: '/daily', label: 'Daily Earth Challenge', emoji: '📅', desc: 'Synchronized 5-question daily challenge with global streaks.' },
  { href: '/challenges', label: 'All Challenges', emoji: '🏆', desc: 'Compare scores and compete in multiplayer challenges.' },
];
