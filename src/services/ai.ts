import { WorldEvent } from '@/types';
import { BoundedMap } from '@/lib/rate-limiter';

// Bounded in-memory cache for AI summaries (max 500 entries, FIFO eviction)
// Key: event ID or unique hash of the content
const summaryCache = new BoundedMap<string, string>(500);

// Circuit breaker for OpenAI API during 429 quota exhaustion or network downtime
let lastOpenAIFailure = 0;
const OPENAI_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown

export async function generateEventSummary(event: WorldEvent): Promise<string> {
  // If we already summarized this event, return the cached summary
  if (summaryCache.has(event.id)) {
    return summaryCache.get(event.id)!;
  }

  // If currently in cooldown after a 429 / network error, immediately return event summary
  if (Date.now() - lastOpenAIFailure < OPENAI_COOLDOWN_MS) {
    summaryCache.set(event.id, event.summary);
    return event.summary;
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      summaryCache.set(event.id, event.summary);
      return event.summary;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // or gpt-4o depending on availability
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
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        lastOpenAIFailure = Date.now();
        console.warn('[AI Service] OpenAI rate limited (429). Activating 60s cooldown and falling back to direct summary.');
      }
      summaryCache.set(event.id, event.summary);
      return event.summary;
    }

    const data = await response.json();
    const aiSummary = data.choices?.[0]?.message?.content?.trim();

    if (aiSummary) {
      summaryCache.set(event.id, aiSummary);
      return aiSummary;
    }

    summaryCache.set(event.id, event.summary);
    return event.summary;
  } catch {
    lastOpenAIFailure = Date.now();
    summaryCache.set(event.id, event.summary);
    return event.summary;
  }
}
