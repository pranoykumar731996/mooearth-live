export interface TranslationResult {
  translatedTitle: string;
  translatedSummary: string;
  translatedContent: string;
  modelUsed: string;
}

// ─── Language code → full name map ─────────────────────────────────────────────
// Resolves ambiguous 2-letter codes (e.g. 'or' which an LLM may read as the
// English conjunction) into unambiguous full language names for prompting.
const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  or: 'Odia',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  zh: 'Chinese',
  ar: 'Arabic'
};

const SYSTEM_PROMPT = `You are a professional, elite translator. Translate the given article's title, summary, and detailed content into the target language.
Preserve the exact meaning, names, dates, numbers, locations, and structural formatting (like line breaks or paragraph breaks).
Do not summarize, do not add opinions, do not add headers/labels (like "Title:" or "Summary:"), and do not remove content.
Output must be in JSON format conforming strictly to this structure:
{
  "translatedTitle": "translated title here",
  "translatedSummary": "translated summary here",
  "translatedContent": "translated detailed content here"
}
CRITICAL: The entire output MUST be a valid JSON object. In JSON, literal newlines inside string values are forbidden. You MUST escape all newlines in the string values as the two-character sequence '\\n' (not literal raw newlines).`;

function buildUserPrompt(targetLang: string, title: string, summary: string, content: string): string {
  return `Target Language: ${targetLang}

Original Title to translate:
${title}

Original Summary to translate:
${summary}

Original Detailed Content to translate:
${content}`;
}

function sanitizeJsonControlChars(str: string): string {
  let result = '';
  let inString = false;
  let i = 0;

  function isValidEscape(nextChar: string, subsequent: string): boolean {
    if (['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(nextChar)) {
      return true;
    }
    if (nextChar === 'u') {
      return /^[0-9a-fA-F]{4}/.test(subsequent);
    }
    return false;
  }

  while (i < str.length) {
    const char = str[i];
    if (char === '"') {
      inString = !inString;
      result += char;
      i++;
    } else if (char === '\\' && inString) {
      const nextChar = str[i + 1] || '';
      const subsequent = str.slice(i + 2, i + 6);
      if (isValidEscape(nextChar, subsequent)) {
        result += char + nextChar;
        i += 2;
      } else {
        result += '\\\\';
        i++;
      }
    } else {
      if (inString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else {
          const code = char.charCodeAt(0);
          if (code < 32) {
            result += ' ';
          } else {
            result += char;
          }
        }
      } else {
        result += char;
      }
      i++;
    }
  }
  return result;
}

function unescapeString(str: string): string {
  try {
    return JSON.parse(`"${str}"`);
  } catch (e) {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

function parseTranslationFallbackRegex(text: string): TranslationResult | null {
  try {
    const titleMatch = text.match(/"translatedTitle"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const summaryMatch = text.match(/"translatedSummary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const contentMatch = text.match(/"translatedContent"\s*:\s*"((?:[^"\\]|\\.)*)"/);

    const translatedTitle = titleMatch ? unescapeString(titleMatch[1]) : '';
    const translatedSummary = summaryMatch ? unescapeString(summaryMatch[1]) : '';
    const translatedContent = contentMatch ? unescapeString(contentMatch[1]) : '';

    if (translatedTitle && translatedSummary) {
      return {
        translatedTitle: translatedTitle.trim(),
        translatedSummary: translatedSummary.trim(),
        translatedContent: (translatedContent || translatedSummary).trim(),
        modelUsed: ''
      };
    }
  } catch (e) {
    console.error('[TranslateService] Fallback regex parsing error:', e);
  }
  return null;
}

function parseTranslationJson(text: string): TranslationResult | null {
  try {
    let jsonStr = text.trim();
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    const sanitized = sanitizeJsonControlChars(jsonStr);
    const parsed = JSON.parse(sanitized);
    if (parsed.translatedTitle && parsed.translatedSummary && parsed.translatedContent) {
      return {
        translatedTitle: parsed.translatedTitle.trim(),
        translatedSummary: parsed.translatedSummary.trim(),
        translatedContent: parsed.translatedContent.trim(),
        modelUsed: ''
      };
    }
    console.warn('[TranslateService] JSON parsed but missing required fields. Keys:', Object.keys(parsed));
  } catch (err: any) {
    console.warn('[TranslateService] JSON.parse failed, attempting regex recovery... Error:', err.message);
  }

  const regexResult = parseTranslationFallbackRegex(text);
  if (regexResult) {
    console.log('[TranslateService] ✅ Regex recovery parsed fields successfully.');
    return regexResult;
  }

  return null;
}

// ─── Circuit Breakers for Models ────────────────────────────────────────────────
// Prevent wasting API time when a model has hit rate/quota limits (returns 429).
class ModelCircuitBreaker {
  private open = false;
  private openedAt = 0;
  private durationMs = 0;
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  isOpen(): boolean {
    if (!this.open) return false;
    if (Date.now() - this.openedAt > this.durationMs) {
      console.log(`[TranslateService] Circuit breaker for ${this.name} reset — will retry.`);
      this.open = false;
      return false;
    }
    return true;
  }

  openCircuit(durationMs: number) {
    this.open = true;
    this.openedAt = Date.now();
    this.durationMs = durationMs;
    console.warn(`[TranslateService] Circuit breaker for ${this.name} OPENED — skipping for ${durationMs / 1000}s.`);
  }
}

const breakers = {
  groqVersatile: new ModelCircuitBreaker('Groq Llama 3.3 70B'),
  groqInstant: new ModelCircuitBreaker('Groq Llama 3.1 8B'),
  geminiLatest: new ModelCircuitBreaker('Gemini Flash Latest'),
  gemini20: new ModelCircuitBreaker('Gemini 2.0 Flash')
};

// ─── Groq API Request Implementation ───────────────────────────────────────────
async function tryGroqSingle(
  model: string,
  apiKey: string,
  userPrompt: string,
  breaker: ModelCircuitBreaker
): Promise<TranslationResult | null> {
  if (breaker.isOpen()) {
    console.log(`[TranslateService] Skipping Groq ${model} because its circuit breaker is open.`);
    return null;
  }

  try {
    console.log(`[TranslateService] Trying Groq ${model}...`);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4096
      }),
      signal: AbortSignal.timeout(30000) // 30s timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[TranslateService] Groq ${model} returned ${response.status}: ${errText.substring(0, 200)}`);
      if (response.status === 429) {
        // Distinguish between permanent daily limits (TPD/RPD) and transient minute limits (TPM/RPM)
        const isDaily = errText.toLowerCase().includes('per day') || errText.toLowerCase().includes('tpd') || errText.toLowerCase().includes('rpd');
        if (isDaily) {
          breaker.openCircuit(10 * 60 * 1000); // 10 minutes
        } else {
          breaker.openCircuit(15 * 1000); // 15 seconds for transient TPM/RPM
        }
      }
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      console.error(`[TranslateService] Groq ${model} returned empty content`);
      return null;
    }

    console.log(`[TranslateService] Groq ${model} raw response length: ${content.length} chars`);
    const parsed = parseTranslationJson(content);
    if (parsed) {
      parsed.modelUsed = model;
      console.log(`[TranslateService] ✅ Groq ${model} translation SUCCESS`);
      return parsed;
    }
    console.error(`[TranslateService] Groq ${model} returned content but JSON parsing failed`);
    return null;
  } catch (err: any) {
    console.error(`[TranslateService] Groq ${model} failed:`, err.message);
    return null;
  }
}

async function tryGroq(
  model: string,
  apiKey: string,
  userPrompt: string,
  breaker: ModelCircuitBreaker
): Promise<TranslationResult | null> {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await tryGroqSingle(model, apiKey, userPrompt, breaker);
    if (result) return result;
    if (breaker.isOpen()) return null; // do not retry if circuit breaker was opened
    if (attempt < maxAttempts) {
      console.warn(`[TranslateService] Groq ${model} attempt ${attempt} failed. Retrying in 1.5s...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  return null;
}

// ─── Gemini API Request Implementation ─────────────────────────────────────────
async function tryGemini(
  model: string,
  apiKey: string,
  userPrompt: string,
  breaker: ModelCircuitBreaker
): Promise<TranslationResult | null> {
  if (breaker.isOpen()) {
    console.log(`[TranslateService] Skipping Gemini ${model} because its circuit breaker is open.`);
    return null;
  }

  try {
    console.log(`[TranslateService] Trying Gemini ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
      signal: AbortSignal.timeout(15000) // 15s timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[TranslateService] Gemini ${model} returned ${response.status}: ${errText.substring(0, 150)}`);
      if (response.status === 429) {
        // Check if it's a transient free tier limit (e.g. limit: 20 or limit: 15) vs permanent / zero quota limit (limit: 0)
        const isTransient = errText.includes('limit: 20') || errText.includes('limit: 15') || errText.includes('Please retry in') || errText.includes('RESOURCE_EXHAUSTED');
        if (isTransient) {
          breaker.openCircuit(15 * 1000); // 15 seconds
        } else {
          breaker.openCircuit(10 * 60 * 1000); // 10 minutes
        }
      }
      return null;
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      console.error(`[TranslateService] Gemini ${model} returned empty content`);
      return null;
    }

    console.log(`[TranslateService] Gemini ${model} raw response length: ${content.length} chars`);
    const parsed = parseTranslationJson(content);
    if (parsed) {
      parsed.modelUsed = model;
      console.log(`[TranslateService] ✅ Gemini ${model} translation SUCCESS`);
      return parsed;
    }
    console.error(`[TranslateService] Gemini ${model} returned content but JSON parsing failed`);
    return null;
  } catch (err: any) {
    console.error(`[TranslateService] Gemini ${model} failed:`, err.message);
    return null;
  }
}

/**
 * Translates article title, summary, and content into a target language.
 * 
 * Model priority:
 *   1. Groq Llama 3.3 70B   — PRIMARY (highest quality translation)
 *   2. Groq Llama 3.1 8B    — SECONDARY (fast, separate rate limits)
 *   3. Gemini Flash Latest  — BACKUP PRIMARY (1.5 Flash, works under 2.0 Flash 429)
 *   4. Gemini 2.0 Flash     — BACKUP SECONDARY (often quota-exhausted)
 *   5. Simulated fallback   — LAST RESORT (never a real translation)
 */
export async function translateArticle(
  targetLang: string,
  title: string,
  summary: string,
  content: string
): Promise<TranslationResult> {
  // Resolve short code to full language name for unambiguous LLM prompting
  const resolvedLang = LANGUAGE_MAP[targetLang] || targetLang;
  console.log(`[TranslateService] translateArticle called — code="${targetLang}" resolved="${resolvedLang}"`);
  const userPrompt = buildUserPrompt(resolvedLang, title, summary, content);
  
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // ── 1. Try Groq Llama 3.3 70B ──
  if (groqKey) {
    const r1 = await tryGroq('llama-3.3-70b-versatile', groqKey, userPrompt, breakers.groqVersatile);
    if (r1) return r1;
  }

  // ── 2. Try Groq Llama 3.1 8B ──
  if (groqKey) {
    const r2 = await tryGroq('llama-3.1-8b-instant', groqKey, userPrompt, breakers.groqInstant);
    if (r2) return r2;
  }

  // ── 3. Try Gemini Flash Latest ──
  if (geminiKey) {
    const r3 = await tryGemini('gemini-flash-latest', geminiKey, userPrompt, breakers.geminiLatest);
    if (r3) return r3;
  }

  // ── 4. Try Gemini 2.0 Flash ──
  if (geminiKey) {
    const r4 = await tryGemini('gemini-2.0-flash', geminiKey, userPrompt, breakers.gemini20);
    if (r4) return r4;
  }

  // ── 5. Simulated fallback (never a real translation) ──
  console.warn('[TranslateService] ⚠️ ALL API providers failed or circuit broken. Reverting to simulated fallback.');
  return {
    translatedTitle: `[${targetLang}] ${title}`,
    translatedSummary: `[Translated to ${targetLang}]: ${summary}`,
    translatedContent: `[Translated to ${targetLang}]:\n\n${content}`,
    modelUsed: 'simulated-fallback'
  };
}
