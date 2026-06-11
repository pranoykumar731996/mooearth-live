// ============================================================
// MooEarth Live — EarthCast AI Narration Engine
// Generates cinematic, emotional commentary text for live
// football events, using a hybrid Template + GPT-4o-mini system.
// ============================================================

import {
  EarthCastEventType,
  EarthCastContext,
  NarrationResult,
  renderTemplateCommentary,
} from './commentary-templates';

export type { EarthCastEventType, EarthCastContext, NarrationResult };
export { renderTemplateCommentary };

// ============================================================
// OPENAI-POWERED NARRATION GENERATOR (hybrid, optimized)
// ============================================================
export async function generateAINarration(
  context: EarthCastContext,
  apiKey: string
): Promise<NarrationResult> {
  const baseline = renderTemplateCommentary(context);

  try {
    const systemPrompt = `You are EarthCast — the cinematic live narrator of the FIFA World Cup on a futuristic 3D globe app called MooEarth Live.

Your narration style:
- Emotionally charged, never robotic.
- Cinematic, like a premium sports documentary voiceover.
- Keep it short: 1 to 2 sentences max (under 45 words).
- Reference how the world or fans react.
- Never use hashtags or emojis in the narration text.
- Do not add extra pre-text or post-text. Return only the narration itself.

You will be given a baseline event description. Enhance it to be more cinematic and emotionally resonant, but keep the core details (score, country, player name) identical.`;

    const userPrompt = `Baseline event narration: "${baseline.text}"
Global fan energy: ${context.globalEnergyScore}%
Fan uploads active: ${context.uploadCount}
Trending mood: ${context.trendingMood || 'electric'}

Enhance the baseline narration:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Optimized, low-cost model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 80,
        temperature: 0.75,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) throw new Error('Empty AI response');

    return {
      text,
      emotionColor: baseline.emotionColor,
      intensity: baseline.intensity,
    };
  } catch (error) {
    console.warn('EarthCast AI narration failed, using baseline template:', error);
    return baseline;
  }
}
