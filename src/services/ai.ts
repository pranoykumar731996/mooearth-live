import { WorldEvent } from '@/types';

// In-memory cache for AI summaries
// Key: event ID or unique hash of the content
const summaryCache = new Map<string, string>();

export async function generateEventSummary(event: WorldEvent): Promise<string> {
  // If we already summarized this event, return the cached summary
  if (summaryCache.has(event.id)) {
    return summaryCache.get(event.id)!;
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY is missing. Falling back to original summary.');
      return event.summary;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // or gpt-4o depending on availability
        messages: [
          {
            role: 'system',
            content: 'You are an elite news summarizer. Summarize the following event in 3 to 5 factual, concise lines. Be extremely direct. No unnecessary wording. Output must be readable in under 10 seconds. Do not use bullet points, just a short paragraph.',
          },
          {
            role: 'user',
            content: `Event Title: ${event.title}\nEvent Details: ${event.summary}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json();
    const aiSummary = data.choices?.[0]?.message?.content?.trim();

    if (aiSummary) {
      summaryCache.set(event.id, aiSummary);
      return aiSummary;
    }

    return event.summary;
  } catch (error) {
    console.error('Failed to generate AI summary:', error);
    // Fallback to the raw summary if AI fails
    return event.summary;
  }
}
