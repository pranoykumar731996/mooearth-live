// ============================================================
// MooEarth Live — EarthCast API Route
// Server-side endpoint that handles global event scoring,
// caching, single-flight request deduplication, template fallback,
// and cost savings analytics reporting.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateAINarration, renderTemplateCommentary, EarthCastContext } from '@/services/earthcast-ai';
import { cacheEngine, CachedNarration } from '@/services/ai-event-engine';

// GET: Returns current server-side AI analytics stats
export async function GET() {
  try {
    const stats = cacheEngine.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

// POST: Triggers or retrieves narration (with caching and deduplication)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context: EarthCastContext = body.context;

    if (!context || !context.eventType) {
      return NextResponse.json(
        { error: 'Missing context or eventType' },
        { status: 400 }
      );
    }

    // Increment total request counter
    cacheEngine.increment('totalRequests');

    // 1. Generate unique cache key for the event
    const cacheKey = cacheEngine.getCacheKey(context);

    // 2. Check Cache
    const cached = cacheEngine.get(cacheKey);
    if (cached) {
      // Track cost savings for serving from cache
      cacheEngine.increment('cacheHits');
      cacheEngine.trackSavings(cached.text, true, !!cached.audioBase64);
      
      return NextResponse.json({
        narration: cached,
        stats: cacheEngine.getStats(),
      });
    }

    // 3. Request Deduplication (Single Flight): Check if a request is already generating this event
    const inFlightPromise = cacheEngine.getInFlight(cacheKey);
    if (inFlightPromise) {
      // Await the existing in-flight generation
      const result = await inFlightPromise;
      cacheEngine.increment('cacheHits'); // Serving duplicate requests counts as a cache hit
      cacheEngine.trackSavings(result.text, true, !!result.audioBase64);

      return NextResponse.json({
        narration: result,
        stats: cacheEngine.getStats(),
      });
    }

    // 4. Cache Miss: Create a new generation promise and store it as in-flight
    const apiKey = process.env.OPENAI_API_KEY;
    const importanceScore = cacheEngine.scoreEvent(context);
    const useAI = cacheEngine.isAINeeded(importanceScore);

    const generationPromise = (async (): Promise<CachedNarration> => {
      let narrationText = '';
      let emotionColor = '#06b6d4';
      let intensity = 0.5;
      let audioBase64: string | null = null;
      let isRealAICall = false;
      let isRealTTSCall = false;

      // Determine text generation strategy
      if (useAI && apiKey) {
        // High-importance: OpenAI GPT-4o-mini Hybrid Enhancement
        try {
          const aiNarration = await generateAINarration(context, apiKey);
          narrationText = aiNarration.text;
          emotionColor = aiNarration.emotionColor;
          intensity = aiNarration.intensity;
          isRealAICall = true;
        } catch {
          // Local fallback
          const local = renderTemplateCommentary(context);
          narrationText = local.text;
          emotionColor = local.emotionColor;
          intensity = local.intensity;
        }
      } else {
        // Low-importance or no API key: 100% Dynamic templates directly
        const local = renderTemplateCommentary(context);
        narrationText = local.text;
        emotionColor = local.emotionColor;
        intensity = local.intensity;
      }

      // Determine audio generation strategy:
      // Generate TTS ONLY for major moments (Goal, Penalty, Upset) and only if API key exists
      if (useAI && apiKey && narrationText) {
        try {
          const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'tts-1',
              input: narrationText,
              voice: 'onyx',
              response_format: 'mp3',
              speed: context.eventType === 'goal' || context.eventType === 'penalty' ? 1.15 : 1.08,
            }),
          });

          if (ttsResponse.ok) {
            const audioBuffer = await ttsResponse.arrayBuffer();
            audioBase64 = Buffer.from(audioBuffer).toString('base64');
            isRealTTSCall = true;
          }
        } catch (ttsError) {
          console.warn('OpenAI TTS generation failed in route:', ttsError);
        }
      }

      const entry: CachedNarration = {
        text: narrationText,
        emotionColor,
        intensity,
        audioBase64,
        eventType: context.eventType,
        country: context.country,
        timestamp: new Date().toISOString(),
      };

      // Store in global cache
      cacheEngine.set(cacheKey, entry);

      // Log server-side stats changes
      cacheEngine.increment('cacheMisses');
      if (isRealAICall) cacheEngine.increment('aiCalls');
      if (isRealTTSCall) cacheEngine.increment('voiceGenerations');

      // Track savings details
      cacheEngine.trackSavings(narrationText, false, isRealTTSCall);

      return entry;
    })();

    // Register the promise to deduplicate concurrent hits
    cacheEngine.setInFlight(cacheKey, generationPromise);

    // Wait for completion
    const finalNarration = await generationPromise;

    return NextResponse.json({
      narration: finalNarration,
      stats: cacheEngine.getStats(),
    });

  } catch (error) {
    console.error('EarthCast route error:', error);
    
    return NextResponse.json({
      error: 'Narration temporarily unavailable',
      stats: cacheEngine.getStats(),
    }, { status: 500 });
  }
}
