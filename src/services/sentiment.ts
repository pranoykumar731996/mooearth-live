import { Mood, SentimentData } from '@/types';

export async function analyzeSentiment(country: string, context: string): Promise<SentimentData> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OPENAI_API_KEY missing. Simulating sentiment.');
    return simulateSentiment(context);
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
            content: `You are an AI sentiment analyzer for the FIFA World Cup. Given a country and recent headlines/reactions, determine the national mood.
The mood MUST be exactly one of these strings: "🔥 Hype", "😄 Celebration", "😢 Sadness", "😡 Anger", "😨 Shock", "😐 Neutral".
Also provide an intensity score between 0.0 and 1.0 (e.g., 0.9 for massive celebration).
Finally, provide a concise, emotional 3-4 sentence explanation of the national mood.
Return the result strictly as JSON in this format:
{
  "mood": "🔥 Hype",
  "intensity": 0.85,
  "explanation": "..."
}`
          },
          {
            role: 'user',
            content: `Country: ${country}\nContext: ${context}`
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
    return simulateSentiment(context);
  }
}

function simulateSentiment(context: string): SentimentData {
  const text = context.toLowerCase();
  if (text.includes('win') || text.includes('victory') || text.includes('goal')) {
    return {
      mood: '😄 Celebration',
      intensity: 0.9,
      explanation: 'Fans are ecstatic after a stunning victory. Social media is flooded with celebrations as the team secures a crucial win.'
    };
  } else if (text.includes('loss') || text.includes('defeat') || text.includes('out')) {
    return {
      mood: '😢 Sadness',
      intensity: 0.8,
      explanation: 'Heartbreak across the nation as the team suffers a devastating defeat. Fans are mourning the end of their World Cup dreams.'
    };
  } else if (text.includes('shock') || text.includes('upset')) {
    return {
      mood: '😨 Shock',
      intensity: 0.85,
      explanation: 'Total disbelief as an unexpected result leaves fans stunned. The football world is reeling from this massive upset.'
    };
  } else if (text.includes('angry') || text.includes('referee') || text.includes('disgrace')) {
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
