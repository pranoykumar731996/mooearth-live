import { Mood, SentimentData } from '@/types';

function isSameCountry(c1?: string | null, c2?: string | null): boolean {
  if (!c1 || !c2) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const n1 = norm(c1);
  const n2 = norm(c2);
  if (n1 === n2) return true;
  if (n1 === 'unitedstates' && n2 === 'unitedstatesofamerica') return true;
  if (n1 === 'unitedstatesofamerica' && n2 === 'unitedstates') return true;
  if (n1 === 'usa' && (n2 === 'unitedstates' || n2 === 'unitedstatesofamerica')) return true;
  if (n1 === 'unitedkingdom' && (n2 === 'england' || n2 === 'uk' || n2 === 'greatbritain')) return true;
  if ((n1 === 'england' || n1 === 'uk' || n1 === 'greatbritain') && n2 === 'unitedkingdom') return true;
  return false;
}

export async function analyzeSentiment(country: string, context: string, category?: string | null): Promise<SentimentData> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OPENAI_API_KEY missing. Simulating sentiment.');
    return simulateSentiment(country, context, category);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI sentiment analyzer for MooEarth Live. Given a country, a selected category, and recent headlines/reactions, determine the national mood.
The mood MUST be exactly one of these strings: "🔥 Hype", "😄 Celebration", "😢 Sadness", "😡 Anger", "😨 Shock", "😐 Neutral".
Also provide an intensity score between 0.0 and 1.0 (e.g., 0.9 for massive celebration).
Finally, provide a concise, emotional 3-4 sentence explanation of the national mood in the context of the selected category: ${category || 'general'}.
Return the result strictly as JSON in this format:
{
  "mood": "🔥 Hype",
  "intensity": 0.85,
  "explanation": "..."
}`
          },
          {
            role: 'user',
            content: `Country: ${country}\nCategory: ${category || 'general'}\nContext: ${context}`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

  if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      mood: result.mood as Mood,
      intensity: result.intensity || 0.5,
      explanation: result.explanation || 'The nation is waiting in anticipation.'
    };
  } catch (error) {
    console.error('Sentiment analysis failed:', error);
    return simulateSentiment(country, context, category);
  }
}

function simulateSentiment(country: string, context: string, category?: string | null): SentimentData {
  const cat = category || 'home';

  if (cat === 'technology') {
    return {
      mood: '🔥 Hype',
      intensity: 0.85,
      explanation: `Excitement is surging in ${country} following key technology breakthroughs and startup innovations. Social discussions are highly positive, highlighting scientific research and engineering talent driving national pride.`
    };
  } else if (cat === 'weather') {
    return {
      mood: '😐 Neutral',
      intensity: 0.6,
      explanation: `Residents in ${country} are actively tracking current weather conditions and climate updates. Discussions are moderate, focusing on shifting temperatures and localized rainfall predictions for the week.`
    };
  } else if (cat === 'business') {
    return {
      mood: '🔥 Hype',
      intensity: 0.75,
      explanation: `Business sentiment in ${country} is optimistic amid strong market indices and trade reports. Investors and local analysts are monitoring commercial expansions and economic growth metrics closely.`
    };
  } else if (cat === 'entertainment') {
    return {
      mood: '😄 Celebration',
      intensity: 0.8,
      explanation: `A vibrant pop culture wave is spreading across ${country} as new movies and music releases go viral. Fan channels are celebrating celebrity announcements and global streaming chart success.`
    };
  } else if (cat === 'breaking') {
    return {
      mood: '😐 Neutral',
      intensity: 0.65,
      explanation: `Major headlines and breaking news reports are circulating in ${country}. Public interest is highly active as community leaders and citizens analyze the local societal impacts of the latest announcements.`
    };
  }

  // 1. Try to parse a football match involving this country from the context
  const matchMatch = context.match(/([A-Za-z\s]+)\s+vs\s+([A-Za-z\s]+)/i);
  if (matchMatch) {
    const teamA = matchMatch[1].trim();
    const teamB = matchMatch[2].trim();
    const isTeamA = isSameCountry(teamA, country);
    const isTeamB = isSameCountry(teamB, country);

    if (isTeamA || isTeamB) {
      // Find the score pattern (e.g. 2 - 0)
      const scoreMatch = context.match(/(\d+)\s*-\s*(\d+)/);
      if (scoreMatch) {
        const scoreA = parseInt(scoreMatch[1], 10);
        const scoreB = parseInt(scoreMatch[2], 10);
        
        const countryScore = isTeamA ? scoreA : scoreB;
        const opponentScore = isTeamA ? scoreB : scoreA;
        const opponentName = isTeamA ? teamB : teamA;
        
        if (countryScore > opponentScore) {
          return {
            mood: '😄 Celebration',
            intensity: 0.9,
            explanation: `Fans in ${country} are ecstatic after a stunning ${countryScore}-${opponentScore} victory over ${opponentName}. Social media is flooded with celebrations as the team secures a crucial win.`
          };
        } else if (countryScore < opponentScore) {
          return {
            mood: '😢 Sadness',
            intensity: 0.8,
            explanation: `Heartbreak across ${country} as the team suffers a devastating ${opponentScore}-${countryScore} defeat to ${opponentName}. Fans are mourning the end of their World Cup dreams.`
          };
        } else {
          return {
            mood: '😐 Neutral',
            intensity: 0.6,
            explanation: `A tense match ends in a ${countryScore}-${opponentScore} draw between ${country} and ${opponentName}. Fans are left anxious but hopeful for the next fixture.`
          };
        }
      }
    }
  }

  const text = context.toLowerCase();
  
  // Helper to check for a whole word match
  const hasWord = (word: string) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  };
  
  const hasAnyWord = (words: string[]) => {
    return words.some(word => hasWord(word));
  };

  if (hasAnyWord(['win', 'victory', 'goal', 'celebrate', 'celebration', 'won'])) {
    return {
      mood: '😄 Celebration',
      intensity: 0.9,
      explanation: 'Fans are ecstatic after a stunning victory. Social media is flooded with celebrations as the team secures a crucial win.'
    };
  } else if (hasAnyWord(['loss', 'defeat', 'out', 'lose', 'lost'])) {
    return {
      mood: '😢 Sadness',
      intensity: 0.8,
      explanation: 'Heartbreak across the nation as the team suffers a devastating defeat. Fans are mourning the end of their World Cup dreams.'
    };
  } else if (hasAnyWord(['shock', 'upset', 'surprise', 'stunned'])) {
    return {
      mood: '😨 Shock',
      intensity: 0.85,
      explanation: 'Total disbelief as an unexpected result leaves fans stunned. The football world is reeling from this massive upset.'
    };
  } else if (hasAnyWord(['angry', 'referee', 'ref', 'disgrace', 'unfair'])) {
    return {
      mood: '😡 Anger',
      intensity: 0.9,
      explanation: 'Furious reactions from supporters directing their anger at poor decisions and tactics. Demands for immediate changes are trending.'
    };
  }
  
  return {
    mood: '🔥 Hype',
    intensity: 0.7,
    explanation: 'Anticipation is building ahead of the crucial fixture. Fans are tense but optimistic about their team\'s chances.'
  };
}
