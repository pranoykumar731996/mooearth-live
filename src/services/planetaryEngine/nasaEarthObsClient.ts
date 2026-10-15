// ============================================================
// MooEarth Live — Planetary Engine: NASA Earth Observatory Client
// ============================================================

import { PlanetaryEvent } from './types';
import { EventCategory } from '@/types';
import { CANONICAL_COUNTRIES } from '@/data/countries';
import { COUNTRY_COORDINATES } from '@/lib/constants';

const NASA_EARTH_OBS_FEED = 'https://earthobservatory.nasa.gov/feeds/earth-observatory.rss';

function stripXmlTags(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function resolveCoordinates(text: string): { country: string; city: string; lat: number; lng: number } {
  const lower = text.toLowerCase();

  // Keyword geographic overrides for prominent natural regions
  if (lower.includes('amazon') || lower.includes('brazil')) {
    return { country: 'Brazil', city: 'Amazon Basin', lat: -3.4653, lng: -62.2159 };
  }
  if (lower.includes('antarctic') || lower.includes('ice shelf') || lower.includes('iceberg a-')) {
    return { country: 'Antarctica', city: 'Polar Region', lat: -75.2509, lng: -0.0713 };
  }
  if (lower.includes('arctic') || lower.includes('greenland')) {
    return { country: 'Greenland', city: 'Arctic Ocean Basin', lat: 71.7069, lng: -42.6043 };
  }
  if (lower.includes('sahara') || lower.includes('sahel')) {
    return { country: 'Chad', city: 'Sahara Desert', lat: 20.0, lng: 18.0 };
  }

  // Canonical country match
  for (const c of CANONICAL_COUNTRIES) {
    if (lower.includes(c.name.toLowerCase())) {
      return {
        country: c.name,
        city: c.name,
        lat: c.coordinates.lat,
        lng: c.coordinates.lng,
      };
    }
  }

  // Coordinate map lookup
  for (const [name, coord] of Object.entries(COUNTRY_COORDINATES)) {
    if (lower.includes(name.toLowerCase())) {
      return {
        country: coord.country,
        city: coord.city,
        lat: coord.lat,
        lng: coord.lng,
      };
    }
  }

  // Global default
  return { country: 'Global Earth', city: 'Planetary Biosphere', lat: 0.0, lng: 0.0 };
}

function mapNasaCategory(catText: string): EventCategory {
  const lower = catText.toLowerCase();
  if (lower.includes('fire')) return 'wildfires';
  if (lower.includes('volcano') || lower.includes('earthquake')) return 'seismic';
  if (lower.includes('storm') || lower.includes('atmosphere') || lower.includes('dust')) return 'severe_weather';
  if (lower.includes('ice') || lower.includes('snow') || lower.includes('water') || lower.includes('ocean')) return 'climate_oceans';
  return 'science_nature';
}

/**
 * Fetches natural event & earth science publications from NASA Earth Observatory
 */
export async function fetchNasaEarthObservatory(timeoutMs = 7000): Promise<PlanetaryEvent[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(NASA_EARTH_OBS_FEED, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/rss+xml, text/xml',
        'User-Agent': 'MooEarthLivePlanetaryEngine/1.0',
      },
      next: { revalidate: 3600 }, // 1-hour Next.js caching
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[Planetary NASA Earth Obs] Feed returned HTTP ${res.status}`);
      return [];
    }

    const xmlText = await res.text();
    const items: PlanetaryEvent[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 25) {
      const itemContent = match[1];

      const getTag = (tag: string) => {
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const m = regex.exec(itemContent);
        return m ? stripXmlTags(m[1]) : '';
      };

      const title = getTag('title');
      const link = getTag('link');
      const pubDate = getTag('pubDate');
      const description = getTag('description');
      const rawCategory = getTag('category');

      if (!title || !link) continue;

      const dateIso = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
      const combinedText = `${title} ${description}`;
      const { country, city, lat, lng } = resolveCoordinates(combinedText);
      const category = mapNasaCategory(`${rawCategory} ${title}`);

      // Strip trailing boilerplates or HTML previews
      const cleanSummary = description.substring(0, 240).replace(/\s+[^\s]*$/, '...');

      items.push({
        id: `nasa-eo-${Math.abs(hashString(link))}`,
        title,
        summary: cleanSummary || `Satellite observation release from NASA Earth Observatory: ${title}`,
        category,
        country,
        city,
        lat,
        lng,
        source: 'NASA Earth Observatory',
        publishedAt: dateIso,
        url: link,
        dataOrigin: 'nasa_earth_obs',
        planetaryTelemetry: {
          eventStatus: 'published',
          sensorSource: 'NASA Terra / Aqua / Landsat Satellite Fleet',
          externalDataUrl: link,
        },
      });
    }

    return items;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[Planetary NASA Earth Obs] Fetch notice: ${err?.message || err}`);
    return [];
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
