import { NextRequest, NextResponse } from 'next/server';
import { isCountryWhitelisted } from '@/config/publishers';
import { generateCacheKey, getCachedPerspective, setCachedPerspective } from '@/lib/perspective-cache';
import { getPerspective } from '@/services/perspective';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const locationId = searchParams.get('locationId') || '';
    const country = searchParams.get('country') || '';
    const topic = searchParams.get('topic') || '';
    const category = searchParams.get('category') || 'news';

    const locationIdOrCountry = locationId || country;

    if (!locationIdOrCountry || !topic) {
      return NextResponse.json(
        { error: 'Missing location/country or topic parameter' },
        { status: 400 }
      );
    }

    // Check Whitelist (failsafe check)
    if (!isCountryWhitelisted(locationIdOrCountry)) {
      return NextResponse.json(
        { 
          error: 'Perspective Lens is currently only enabled for India, USA, Japan, Brazil, and UK.', 
          notWhitelisted: true 
        },
        { status: 403 }
      );
    }

    // Caching layer lookup
    const cacheKey = generateCacheKey(locationIdOrCountry, topic, category);
    const cachedData = getCachedPerspective(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Fetch and process comparisons
    const result = await getPerspective(locationIdOrCountry, topic, category);

    // Only cache results that have AI comparison data — don't cache failed/empty comparisons
    if (result.commonFacts && result.commonFacts.length > 0) {
      setCachedPerspective(cacheKey, result);
    }

    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error: any) {
    console.error('API /api/perspective error:', error);
    
    if (error.message && error.message.includes('No coverage articles found')) {
      return NextResponse.json(
        { error: 'Perspective comparison temporarily unavailable.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Perspective comparison temporarily unavailable.' },
      { status: 500 }
    );
  }
}
