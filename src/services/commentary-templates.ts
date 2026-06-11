// ============================================================
// MooEarth Live — Commentary Template Engine
// 50+ cinematic dynamic templates to provide low-cost, zero-latency
// emotional narration for live football moments.
// ============================================================

export type EarthCastEventType =
  | 'goal'
  | 'red_card'
  | 'penalty'
  | 'match_end'
  | 'upset'
  | 'tension'
  | 'atmosphere_check';

export interface EarthCastContext {
  eventType: EarthCastEventType;
  country: string;
  playerName?: string;
  team?: string;
  opponentTeam?: string;
  score?: string;
  elapsed?: number;
  globalEnergyScore: number;
  uploadCount: number;
  trendingMood?: string;
  isUpset?: boolean;
}

export interface NarrationResult {
  text: string;
  emotionColor: string;
  intensity: number;
}

// 50+ premium, dramatic commentary templates

const GOAL_TEMPLATES = [
  (c: EarthCastContext) => `GOAL FOR ${c.country?.toUpperCase()}! The atmosphere across the globe erupts as ${c.playerName || 'the scorer'} sends fans into absolute delirium. ${c.score || 'The score changes'} — and the world reacts.`,
  (c: EarthCastContext) => `${c.playerName || 'A moment of brilliance'} finds the back of the net! ${c.country} fans are on their feet everywhere — from Buenos Aires to Tokyo, the celebrations have begun. ${c.score}.`,
  (c: EarthCastContext) => `The stadium explodes. ${c.country} scores through ${c.playerName || 'a stunning strike'}! Across ${c.uploadCount > 0 ? c.uploadCount + ' cities worldwide' : 'the planet'}, fans erupt in celebration.`,
  (c: EarthCastContext) => `History is written in this moment. ${c.playerName || 'The goal scorer'} delivers for ${c.country}! The energy level spikes to ${c.globalEnergyScore}% as the world watches in awe.`,
  (c: EarthCastContext) => `What a goal! ${c.country} takes the lead through ${c.playerName || 'an incredible finish'}. The emotional heartbeat of the planet just skipped a beat. ${c.score}.`,
  (c: EarthCastContext) => `Scenes of pure ecstasy! ${c.playerName || 'The match hero'} scores for ${c.country} and the celebrations stretch from continent to continent. This is what the World Cup is all about.`,
  (c: EarthCastContext) => `The beautiful game delivers again. ${c.country}'s ${c.playerName || 'star player'} converts brilliantly. Global fan energy surges to ${c.globalEnergyScore}%. The Earth itself seems to celebrate.`,
  (c: EarthCastContext) => `And there it is! ${c.country} scores! ${c.playerName || 'The hero of the hour'} writes their name into World Cup folklore. ${c.score} — the tension is unbearable.`,
  (c: EarthCastContext) => `Spectacular! ${c.country} breaches the defense, courtesy of ${c.playerName || 'a sublime effort'}. An emotional earthquake registers on the global fan network.`,
  (c: EarthCastContext) => `Unstoppable! ${c.playerName || 'A clinical finish'} puts ${c.country} in the driver's seat. Fans around the globe are screaming in unison!`,
];

const RED_CARD_TEMPLATES = [
  (c: EarthCastContext) => `RED CARD! ${c.playerName || 'A key player'} is sent off for ${c.team || c.country}. The match dynamics shift dramatically. Shock and controversy ripple across the global fan base.`,
  (c: EarthCastContext) => `Drama unfolds. ${c.playerName || 'The player'} sees red for ${c.team || c.country}. Millions of fans hold their breath as the balance of power shifts. This changes everything.`,
  (c: EarthCastContext) => `Unbelievable. ${c.team || c.country} is down to ten players after ${c.playerName || 'a controversial red card'}. The emotional temperature spikes worldwide.`,
  (c: EarthCastContext) => `The referee shows red. ${c.playerName || 'A pivotal player'} must leave the pitch. ${c.country} fans react with disbelief as the match takes a dramatic turn.`,
  (c: EarthCastContext) => `Disaster for ${c.country}! ${c.playerName || 'Their key defender'} is ordered off. The global fan chat flares up in heated debate.`,
  (c: EarthCastContext) => `A dramatic expulsion! The referee orders ${c.playerName || 'the player'} to the locker room. ${c.country} must survive with ten men!`,
];

const PENALTY_TEMPLATES = [
  (c: EarthCastContext) => `PENALTY! The entire world holds its breath. ${c.country} steps up from twelve yards. This is the moment that defines legacies. The tension is unbearable.`,
  (c: EarthCastContext) => `The referee points to the spot. ${c.country} has a penalty. Billions of hearts are pounding simultaneously. This is peak World Cup drama.`,
  (c: EarthCastContext) => `Penalty kick for ${c.country}! ${c.playerName || 'The designated taker'} places the ball on the spot. The silence before the storm — the entire planet watching one kick.`,
  (c: EarthCastContext) => `The biggest moment of the tournament so far. ${c.country} has a penalty. From twelve yards, a nation's dreams rest on one kick. Global energy at ${c.globalEnergyScore}%.`,
  (c: EarthCastContext) => `Spot kick awarded! ${c.country} has a chance to change history. Every single screen on the planet is locked onto the penalty box.`,
  (c: EarthCastContext) => `Tension you can cut with a knife. A penalty is given. ${c.country} fans cover their eyes in anticipation.`,
];

const MATCH_END_TEMPLATES = [
  (c: EarthCastContext) => `FULL TIME! The final whistle blows. ${c.score}. ${c.country} ${c.isUpset ? 'pulls off the upset of the tournament' : 'emerges victorious'}! The emotional wave washes over every continent.`,
  (c: EarthCastContext) => `It's over! The match ends ${c.score}. ${c.country} fans celebrate as the final whistle echoes around the world. Global energy holds at ${c.globalEnergyScore}%.`,
  (c: EarthCastContext) => `The referee signals the end. ${c.score} — ${c.country} writes another chapter in World Cup history. The emotional aftershock will reverberate for hours.`,
  (c: EarthCastContext) => `Full time. ${c.score}. The dust settles on an incredible encounter. ${c.country}'s journey continues as the world processes what just happened.`,
  (c: EarthCastContext) => `The final whistle sounds! Drama, tears, and triumph as the tie ends ${c.score}. The global fan map illuminates in victory and heartbreak.`,
  (c: EarthCastContext) => `Full-time whistle! The stadium erupts, and ${c.country} fans celebrate a legacy-defining performance. ${c.score}.`,
];

const UPSET_TEMPLATES = [
  (c: EarthCastContext) => `UPSET! ${c.country} defeats ${c.opponentTeam || 'the favorites'} in one of the tournament's most stunning results! The world watches in disbelief. ${c.score}.`,
  (c: EarthCastContext) => `Nobody predicted this. ${c.country} has done the impossible against ${c.opponentTeam || 'the giants'}. Global shock registers at unprecedented levels. ${c.score}.`,
  (c: EarthCastContext) => `The beautiful game humbles the mighty once again. ${c.country} topples ${c.opponentTeam || 'the tournament favorites'}. The emotional seismograph goes off the charts.`,
  (c: EarthCastContext) => `Football has no script. ${c.country} stuns the world by beating ${c.opponentTeam || 'a powerhouse'}. ${c.score}. This is why we love the World Cup.`,
  (c: EarthCastContext) => `David slays Goliath! ${c.country} pulls off a miraculous victory against ${c.opponentTeam}. Delirious reactions are pouring into the globe network.`,
  (c: EarthCastContext) => `A historic upset! ${c.country} leaves ${c.opponentTeam} in shock as they secure a hard-fought ${c.score} win. The world is stunned.`,
];

const TENSION_TEMPLATES = [
  (c: EarthCastContext) => `${c.country} holds its breath. Minute ${c.elapsed || '90'} — the tension is electric. Billions are glued to their screens. The planet's heartbeat accelerates.`,
  (c: EarthCastContext) => `We are in the dying minutes. ${c.score}. Every second stretches into eternity for ${c.country} fans. Global anxiety levels peak.`,
  (c: EarthCastContext) => `The final minutes tick away. ${c.country} clings on as the world watches through fingers. This is pure, unfiltered World Cup agony and ecstasy.`,
  (c: EarthCastContext) => `Stoppage time. Hearts racing worldwide. ${c.country}'s fate hangs by a thread. The emotional intensity across the globe has never been higher.`,
  (c: EarthCastContext) => `A frantic final charge. Every pass in this ${c.score} battle sends shockwaves through ${c.country} fan bases globally.`,
  (c: EarthCastContext) => `Absolute nail-biter at minute ${c.elapsed || '88'}. Any mistake now is fatal. The emotional maps are glowing bright orange.`,
];

const ATMOSPHERE_TEMPLATES = [
  (c: EarthCastContext) => `Across the planet, the emotional pulse reads ${c.globalEnergyScore}%. ${c.country || 'Multiple nations'} ${c.trendingMood === '🔥 Hype' ? 'burns with excitement' : 'reacts with intensity'}. ${c.uploadCount} fan reactions are flooding in from around the world.`,
  (c: EarthCastContext) => `The living Earth breathes with emotion. ${c.uploadCount} celebrations are streaming live as ${c.country || 'the world'} ${c.trendingMood === '😢 Defeat' ? 'processes heartbreak' : 'radiates energy'}. Global pulse at ${c.globalEnergyScore}%.`,
  (c: EarthCastContext) => `This is the emotional heartbeat of humanity right now. ${c.country || 'Nations worldwide'} pulsing at ${c.globalEnergyScore}% energy. ${c.uploadCount} live reactions painting the globe with raw emotion.`,
  (c: EarthCastContext) => `EarthCast scanning the planet. The dominant mood is ${c.trendingMood || 'electric'}. ${c.country || 'Fan networks everywhere'} streaming ${c.uploadCount} live reactions. The world has never been more connected.`,
  (c: EarthCastContext) => `Global fan activity spikes. ${c.uploadCount} media posts uploaded in the last few minutes. ${c.country || 'The fans'} are driving the emotional index to ${c.globalEnergyScore}%.`,
  (c: EarthCastContext) => `Earth's emotional energy sits at a steady ${c.globalEnergyScore}%. Trending mood is ${c.trendingMood || 'vibrant'} with stadium uploads rising.`,
];

const TEMPLATE_MAP: Record<EarthCastEventType, ((c: EarthCastContext) => string)[]> = {
  goal: GOAL_TEMPLATES,
  red_card: RED_CARD_TEMPLATES,
  penalty: PENALTY_TEMPLATES,
  match_end: MATCH_END_TEMPLATES,
  upset: UPSET_TEMPLATES,
  tension: TENSION_TEMPLATES,
  atmosphere_check: ATMOSPHERE_TEMPLATES,
};

const EMOTION_COLORS: Record<EarthCastEventType, string> = {
  goal: '#ffd700',
  red_card: '#ef4444',
  penalty: '#f97316',
  match_end: '#06b6d4',
  upset: '#e040fb',
  tension: '#f97316',
  atmosphere_check: '#06b6d4',
};

const EMOTION_INTENSITY: Record<EarthCastEventType, number> = {
  goal: 0.95,
  red_card: 0.85,
  penalty: 0.9,
  match_end: 0.8,
  upset: 1.0,
  tension: 0.75,
  atmosphere_check: 0.5,
};

// Pick a random template for variety
export function pickTemplate(eventType: EarthCastEventType): (c: EarthCastContext) => string {
  const templates = TEMPLATE_MAP[eventType] || ATMOSPHERE_TEMPLATES;
  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate template commentary
export function renderTemplateCommentary(context: EarthCastContext): NarrationResult {
  const template = pickTemplate(context.eventType);
  return {
    text: template(context),
    emotionColor: EMOTION_COLORS[context.eventType] || '#06b6d4',
    intensity: EMOTION_INTENSITY[context.eventType] || 0.5,
  };
}
