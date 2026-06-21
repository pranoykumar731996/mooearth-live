export interface TranslationResult {
  translatedTitle: string;
  translatedSummary: string;
  translatedContent: string;
  modelUsed: string;
}

const SYSTEM_PROMPT = `You are a professional, elite translator. Translate the given article's title, summary, and detailed content into the target language.
Preserve the exact meaning, names, dates, numbers, locations, and structural formatting (like line breaks or paragraph breaks).
Do not summarize, do not add opinions, do not add headers/labels (like "Title:" or "Summary:"), and do not remove content.
Output must be in JSON format conforming strictly to this structure:
{
  "translatedTitle": "translated title here",
  "translatedSummary": "translated summary here",
  "translatedContent": "translated detailed content here"
}`;

function buildUserPrompt(targetLang: string, title: string, summary: string, content: string): string {
  return `Target Language: ${targetLang}

Original Title to translate:
${title}

Original Summary to translate:
${summary}

Original Detailed Content to translate:
${content}`;
}

function parseTranslationJson(text: string): TranslationResult | null {
  try {
    let jsonStr = text.trim();
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    const parsed = JSON.parse(jsonStr);
    if (parsed.translatedTitle && parsed.translatedSummary && parsed.translatedContent) {
      return {
        translatedTitle: parsed.translatedTitle.trim(),
        translatedSummary: parsed.translatedSummary.trim(),
        translatedContent: parsed.translatedContent.trim(),
        modelUsed: ''
      };
    }
    return null;
  } catch (err: any) {
    console.error('[TranslateService] JSON parse error:', err.message, 'Raw response head:', text.substring(0, 150));
    return null;
  }
}

// ─── Model 1: Gemini 2.0 Flash ───────────────────────────────────────────────
async function tryGemini20(apiKey: string, userPrompt: string): Promise<TranslationResult | null> {
  try {
    console.log('[TranslateService] Trying Gemini 2.0 Flash...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[TranslateService] Gemini 2.0 returned ${response.status}: ${errText.substring(0, 150)}`);
      return null;
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;

    const parsed = parseTranslationJson(content);
    if (parsed) {
      parsed.modelUsed = 'gemini-2.0-flash';
      return parsed;
    }
    return null;
  } catch (err: any) {
    console.error('[TranslateService] Gemini 2.0 failed:', err.message);
    return null;
  }
}

// ─── Model 2: Gemini Flash Latest ──────────────────────────────────────────────
async function tryGeminiLatest(apiKey: string, userPrompt: string): Promise<TranslationResult | null> {
  try {
    console.log('[TranslateService] Trying Gemini Flash Latest...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[TranslateService] Gemini Latest returned ${response.status}: ${errText.substring(0, 150)}`);
      return null;
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;

    const parsed = parseTranslationJson(content);
    if (parsed) {
      parsed.modelUsed = 'gemini-flash-latest';
      return parsed;
    }
    return null;
  } catch (err: any) {
    console.error('[TranslateService] Gemini Latest failed:', err.message);
    return null;
  }
}

// ─── Model 3: Groq Llama 3.3 70B ─────────────────────────────────────────────
async function tryGroq(apiKey: string, userPrompt: string): Promise<TranslationResult | null> {
  try {
    console.log('[TranslateService] Trying Groq Llama-3.3-70b-versatile...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2048
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[TranslateService] Groq returned ${response.status}: ${errText.substring(0, 150)}`);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = parseTranslationJson(content);
    if (parsed) {
      parsed.modelUsed = 'llama-3.3-70b-versatile';
      return parsed;
    }
    return null;
  } catch (err: any) {
    console.error('[TranslateService] Groq failed:', err.message);
    return null;
  }
}

/**
 * Translates article title, summary, and content into a target language using cascading models.
 */
export async function translateArticle(
  targetLang: string,
  title: string,
  summary: string,
  content: string
): Promise<TranslationResult> {
  const userPrompt = buildUserPrompt(targetLang, title, summary, content);
  
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (geminiKey) {
    // 1. Try Gemini 2.0 Flash
    const r1 = await tryGemini20(geminiKey, userPrompt);
    if (r1) return r1;

    // 2. Try Gemini Flash Latest (verified backup)
    const r2 = await tryGeminiLatest(geminiKey, userPrompt);
    if (r2) return r2;
  } else {
    console.warn('[TranslateService] No GEMINI_API_KEY found in env');
  }

  if (groqKey) {
    // 3. Try Groq Llama 3.3
    const r3 = await tryGroq(groqKey, userPrompt);
    if (r3) return r3;
  } else {
    console.warn('[TranslateService] No GROQ_API_KEY found in env');
  }

  // 4. Return Simulated Translator Output if all APIs failed to ensure 0 crashes
  console.warn('[TranslateService] All API providers failed. Reverting to Simulated fallback translation.');
  return {
    translatedTitle: `[${targetLang}] ${title}`,
    translatedSummary: `[Translated to ${targetLang}]: ${summary}`,
    translatedContent: `[Translated to ${targetLang}]:\n\n${content}`,
    modelUsed: 'simulated-fallback'
  };
}
