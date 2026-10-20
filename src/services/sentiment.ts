import { Mood, SentimentData } from '@/types';


export async function analyzeSentiment(country: string, context: string, category?: string | null): Promise<SentimentData> {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('API key missing. Simulating sentiment.');
    return simulateSentiment(country, context, category);
  }

  const isGroq = !!process.env.GROQ_API_KEY;
  const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const model = isGroq ? 'llama3-8b-8192' : 'gpt-3.5-turbo';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
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
      throw new Error(`API failed: ${response.statusText}`);
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
  const catLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'General';
  
  if (!cleanContext || cleanContext.length < 5) {
    return {
      mood: '😐 Neutral',
      intensity: 0.3,
      explanation: `The national mood in ${country} is calm right now. There are currently no major breaking updates or viral discussions dominating the ${catLabel} feeds.`
    };
  }


  const text = cleanContext.toLowerCase();
  
  const hasWord = (word: string) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  };
  
  const hasAnyWord = (words: string[]) => words.some(word => hasWord(word));

  if (hasAnyWord(['win', 'victory', 'goal', 'celebrate', 'celebration', 'won', 'champion', 'success'])) {
    return {
      mood: '😄 Celebration',
      intensity: 0.9,
      explanation: `The mood in ${country} is ecstatic! Viral trends and breaking news are dominated by massive celebrations and widespread joy across the country.`
    };
  } else if (hasAnyWord(['loss', 'defeat', 'out', 'lose', 'lost', 'eliminated', 'fail', 'tragedy'])) {
    return {
      mood: '😢 Sadness',
      intensity: 0.8,
      explanation: `A wave of disappointment and sadness is currently echoing through ${country} as the public processes recent setbacks and tough news.`
    };
  } else if (hasAnyWord(['shock', 'upset', 'surprise', 'stunned', 'unbelievable', 'crazy'])) {
    return {
      mood: '😨 Shock',
      intensity: 0.85,
      explanation: `Complete disbelief in ${country}. The national conversation has been entirely derailed by unexpected and stunning developments that nobody saw coming.`
    };
  } else if (hasAnyWord(['angry', 'referee', 'ref', 'disgrace', 'unfair', 'scandal', 'outrage', 'protest'])) {
    return {
      mood: '😡 Anger',
      intensity: 0.9,
      explanation: `Public outrage is surging in ${country}. Social media is ablaze with intense frustration and fiery debates over controversial recent events.`
    };
  } else if (hasAnyWord(['hype', 'excited', 'ready', 'prepare', 'starting', 'live', 'anticipation', 'upcoming'])) {
    return {
      mood: '🔥 Hype',
      intensity: 0.85,
      explanation: `The anticipation in ${country} is reaching a fever pitch! Fans and citizens are incredibly hyped up and counting down the seconds to the upcoming main event.`
    };
  }
  
  return {
    mood: '😐 Neutral',
    intensity: 0.5,
    explanation: `The national sentiment in ${country} is relatively balanced today. The public is steadily absorbing the latest news without extreme emotional swings.`
  };
}
