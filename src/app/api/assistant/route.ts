import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, events = [], trendingCountries = [], globalEnergyScore = 50 } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid or missing messages history' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      // 1. Build a rich system prompt with real live context
      const liveMatches = events.filter((e: any) => e.category === 'football');
      const breakingNews = events.filter((e: any) => e.category !== 'football').slice(0, 5);

      const matchesContext = liveMatches.length > 0
        ? liveMatches.map((e: any) => `  * ${e.title} (${e.footballData?.status || 'LIVE'}): Score ${e.footballData?.homeScore || 0}-${e.footballData?.awayScore || 0}. ${e.summary}`).join('\n')
        : '  * No live or scheduled matches reported.';

      const moodsContext = trendingCountries.length > 0
        ? trendingCountries.map((tc: any) => `  * ${tc.country} (${tc.flag}): Mood is ${tc.mood}, Activity Score ${tc.score}%, Status: "${tc.activityText}"`).join('\n')
        : '  * No trending countries calculated yet.';

      const newsContext = breakingNews.length > 0
        ? breakingNews.map((e: any) => `  * [${e.country || 'Global'}] ${e.title}: ${e.summary}`).join('\n')
        : '  * No news articles currently loaded.';

      const systemPrompt = `You are the MooEarth AI Assistant, a virtual sports analyst and live narrator of the World Cup on a futuristic 3D globe dashboard called MooEarth Live.

Current Live Application State:
- Global Pulse Energy: ${globalEnergyScore}%
- Live & Finished Matches:
${matchesContext}
- Trending Countries & Emotional Moods:
${moodsContext}
- Latest News & Stories:
${newsContext}

Guidelines:
1. Answer the user's questions directly and accurately using ONLY the live context above.
2. Keep your response extremely concise: 1 to 2 sentences (under 50 words) is preferred.
3. Be professional, engaging, and sports-journalist-focused.
4. If the user asks about a country or event not listed, explain that the dashboard hasn't received updates for it yet.`;

      // 2. Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5) // Send last 5 messages for conversation flow
          ],
          max_tokens: 100,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return NextResponse.json({ reply: text });
        }
      }
      console.warn('OpenAI Completions failed in Assistant API, using local fallback.');
    }

    // 2. Rule-Based Local Fallback Engine (Runs when API Key is missing or rate-limited)
    const query = lastUserMessage.toLowerCase();
    
    // Check greetings
    if (query.match(/\b(hello|hi|hey|greetings|welcome|yo)\b/)) {
      return NextResponse.json({
        reply: "Hello! I am your MooEarth AI Assistant. Ask me about live match scores, country sentiments, breaking news, or the overall Global Pulse Energy!"
      });
    }

    // Check Global Energy / Pulse
    if (query.includes('global pulse') || query.includes('pulse energy') || query.includes('global energy')) {
      return NextResponse.json({
        reply: `The current Global Pulse Energy across all active countries is ${globalEnergyScore}%. This reflects overall match excitement and fan reaction uploads.`
      });
    }

    // Check Most Emotional Country
    if (query.includes('most emotional') || query.includes('highest energy') || query.includes('trending')) {
      if (trendingCountries.length > 0) {
        const top = trendingCountries[0];
        return NextResponse.json({
          reply: `Currently, ${top.country} ${top.flag} is the most emotional country on the globe with an activity score of ${top.score}% and a mood of ${top.mood}.`
        });
      }
      return NextResponse.json({
        reply: "No countries are currently trending with emotional activity scores. Check back in a moment!"
      });
    }

    // Try to extract mentioned countries
    const countriesInApp = trendingCountries.map((tc: any) => tc.country);
    const matchedCountry = countriesInApp.find((c: string) => query.includes(c.toLowerCase()));

    if (matchedCountry) {
      const countryData = trendingCountries.find((tc: any) => tc.country === matchedCountry);
      const isScoreQuery = query.includes('score') || query.includes('match') || query.includes('vs') || query.includes('play') || query.includes('won') || query.includes('lost') || query.includes('result');
      const isMoodQuery = query.includes('mood') || query.includes('emotion') || query.includes('feel') || query.includes('sentiment');

      if (isScoreQuery) {
        // Find match involving this country
        const match = events.find((e: any) => 
          e.category === 'football' && 
          e.footballData && 
          (isSameCountry(e.footballData.homeTeam, matchedCountry) || isSameCountry(e.footballData.awayTeam, matchedCountry))
        );

        if (match) {
          const fd = match.footballData;
          return NextResponse.json({
            reply: `In the World Cup, the match is ${fd.homeTeam} vs ${fd.awayTeam} (${fd.status}). The score is ${fd.homeScore} - ${fd.awayScore}. ${match.summary}`
          });
        }
      }

      if (isMoodQuery && countryData) {
        return NextResponse.json({
          reply: `The current national mood in ${matchedCountry} ${countryData.flag} is ${countryData.mood} with an intensity score of ${countryData.score}%. Status: ${countryData.activityText}.`
        });
      }

      // Check for general country news
      const newsItems = events.filter((e: any) => 
        e.category !== 'football' && 
        (isSameCountry(e.country, matchedCountry) || 
         e.title.toLowerCase().includes(matchedCountry.toLowerCase()) || 
         e.summary.toLowerCase().includes(matchedCountry.toLowerCase()))
      );

      if (newsItems.length > 0) {
        return NextResponse.json({
          reply: `Latest news from ${matchedCountry}: "${newsItems[0].title}". Details: ${newsItems[0].summary}`
        });
      }

      // Default country info
      if (countryData) {
        return NextResponse.json({
          reply: `${matchedCountry} ${countryData.flag} is currently displaying a national mood of ${countryData.mood} (Score: ${countryData.score}%). Status: ${countryData.activityText}.`
        });
      }
    }

    // Try to match generic match query
    if (query.includes('score') || query.includes('match') || query.includes('vs')) {
      const liveMatches = events.filter((e: any) => e.category === 'football');
      if (liveMatches.length > 0) {
        const list = liveMatches.map((m: any) => `${m.title} (${m.footballData?.homeScore}-${m.footballData?.awayScore})`).join(', ');
        return NextResponse.json({
          reply: `Here are the latest matches on the scoreboard: ${list}. Click any country on the globe for full details.`
        });
      }
    }

    // Default fallback
    return NextResponse.json({
      reply: "I'm not sure about that. Try asking about a specific country's match (e.g. 'Mexico score'), the 'most emotional country', or check the 'global pulse' energy level."
    });

  } catch (error) {
    console.error('AI Assistant route error:', error);
    return NextResponse.json({ reply: "Sorry, I am having trouble connecting to the live narration server right now." }, { status: 500 });
  }
}
