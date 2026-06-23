import { Mood } from '@/types';

export interface AIAnalysisResult {
  mood: Mood;
  intensity: number;
  explanation: string;
}

export async function analyzeCelebrationSentiment(
  country: string,
  uploads: { comment: string; type: string }[]
): Promise<AIAnalysisResult> {
  const combinedComments = uploads.map((u) => `[${u.type}] ${u.comment}`).join('\n');
  const count = uploads.length;

  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key is missing');
    }

    const isGroq = !!process.env.GROQ_API_KEY;
    const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const model = isGroq ? 'llama3-8b-8192' : 'gpt-3.5-turbo';

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
            content: `You are an AI Fan Emotion Analyzer for World Cup celebrations. 
Analyze the provided comments from fan reaction uploads (video, photo, voice) for a given country.
Estimate:
1. The dominant mood (must be exactly one of: "🔥 Hype", "😄 Celebration", "😢 Sadness", "😡 Anger", "😨 Shock", "😐 Neutral").
2. The emotional intensity (float between 0.0 and 1.0).
3. A concise 2-sentence emotional summary. Example: "Massive celebrations are erupting across Buenos Aires after Argentina's victory. Uploads show street fireworks and chanting fans."

You MUST output your response in valid JSON format:
{
  "mood": "dominant mood string",
  "intensity": 0.85,
  "explanation": "explanation string"
}`,
          },
          {
            role: 'user',
            content: `Country: ${country}\nFan Uploads Count: ${count}\nFan Comments:\n${combinedComments}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.5,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned status ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    if (result.mood && typeof result.intensity === 'number' && result.explanation) {
      return {
        mood: result.mood,
        intensity: result.intensity,
        explanation: result.explanation,
      };
    }
    throw new Error('Invalid JSON format returned by AI');
  } catch (error) {
    console.warn('Celebration AI Sentiment analysis failed/skipped, using fallback simulator:', error);

    // Dynamic rule-based fallback simulator
    let mood: Mood = '😄 Celebration';
    let intensity = 0.5 + Math.min(count * 0.1, 0.45); // Higher density of uploads increases excitement level!
    let explanation = `Fans in ${country} are actively posting uploads. Live streams and photos show rising excitement levels.`;

    const lowerComments = combinedComments.toLowerCase();
    
    if (lowerComments.includes('lament') || lowerComments.includes('sad') || lowerComments.includes('lost') || lowerComments.includes('crying') || lowerComments.includes('heartbreak')) {
      mood = '😢 Sadness';
      intensity = 0.7;
      explanation = `Heartbreak in ${country} as fans post crying face reactions and quiet crowds after a disappointing result.`;
    } else if (lowerComments.includes('angry') || lowerComments.includes('referee') || lowerComments.includes('furious') || lowerComments.includes('madness') && lowerComments.includes('ref')) {
      mood = '😡 Anger';
      intensity = 0.8;
      explanation = `Anger boiling over in ${country} over controversial decisions. Fan uploads show frustration and loud arguments.`;
    } else if (lowerComments.includes('shock') || lowerComments.includes('cannot believe') || lowerComments.includes('stunned')) {
      mood = '😨 Shock';
      intensity = 0.85;
      explanation = `Stunned silence and disbelieving faces in ${country}. Fans are in shock after a dramatic turn of events.`;
    } else if (lowerComments.includes('hype') || lowerComments.includes('goal') || lowerComments.includes('vamos') || lowerComments.includes('win') || lowerComments.includes('carnival') || lowerComments.includes('excitement')) {
      mood = '🔥 Hype';
      intensity = Math.min(0.8 + (count * 0.05), 1.0);
      explanation = `Eruptions of joy across ${country}! Fan uploads show fireworks, flares, and ecstatic screams of celebration!`;
    }

    return { mood, intensity, explanation };
  }
}
