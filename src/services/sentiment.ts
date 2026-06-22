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
  const cleanContext = context.replace(/No live events currently reported for.*/gi, '').trim();
  if (!cleanContext || cleanContext.length < 5) {
    return {
      mood: '😐 Neutral',
      intensity: 0.5,
      explanation: `No active headlines or live match updates are currently reported for ${country}.`
    };
  }

  // 1. Try to parse a football match involving this country from the context
  const matchMatch = cleanContext.match(/([A-Za-z\s]+)\s+vs\s+([A-Za-z\s]+)/i);
  if (matchMatch) {
    const teamA = matchMatch[1].trim();
    const teamB = matchMatch[2].trim();
    const isTeamA = isSameCountry(teamA, country);
    const isTeamB = isSameCountry(teamB, country);

    if (isTeamA || isTeamB) {
      // Find the score pattern (e.g. 2 - 0)
      const scoreMatch = cleanContext.match(/(\d+)\s*-\s*(\d+)/);
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

  const text = cleanContext.toLowerCase();
  
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
      explanation: `Fans in ${country} are celebrating after recent sports victories and positive achievements reported in the region.`
    };
  } else if (hasAnyWord(['loss', 'defeat', 'out', 'lose', 'lost'])) {
    return {
      mood: '😢 Sadness',
      intensity: 0.8,
      explanation: `Disappointment observed in ${country} following recent losses or setbacks in local activities.`
    };
  } else if (hasAnyWord(['shock', 'upset', 'surprise', 'stunned'])) {
    return {
      mood: '😨 Shock',
      intensity: 0.85,
      explanation: `A sense of surprise and disbelief is circulating in ${country} following recent unexpected announcements.`
    };
  } else if (hasAnyWord(['angry', 'referee', 'ref', 'disgrace', 'unfair'])) {
    return {
      mood: '😡 Anger',
      intensity: 0.9,
      explanation: `Frustrated discussions and public anger are rising in ${country} over recent controversial rulings or updates.`
    };
  }
  
  return {
    mood: '😐 Neutral',
    intensity: 0.5,
    explanation: `Recent news and updates from ${country} indicate a stable and neutral social sentiment.`
  };
}
