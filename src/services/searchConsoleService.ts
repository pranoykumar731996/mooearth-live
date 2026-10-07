// ============================================================
// MooEarth Live — Google Search Console Service
// Phase 13: Real Search Console Connector & Organic Telemetry
// ============================================================

import {
  SearchConsoleQueryRecord,
  OrganicTelemetryRecord,
  SeoGrowthReport,
  generateSeoGrowthReport,
} from '@/lib/seo/searchConsoleGrowthEngine';

// In-memory buffer for real organic telemetry records captured by visitors
const TELEMETRY_CACHE: OrganicTelemetryRecord[] = [];

/**
 * Check if Search Console API credentials exist in environment variables
 */
export function isSearchConsoleConfigured(): boolean {
  return Boolean(
    (process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY) ||
    process.env.GOOGLE_SEARCH_CONSOLE_KEY ||
    process.env.NEXT_PUBLIC_GSC_API_KEY
  );
}

/**
 * Fetch real Search Analytics rows from Google Search Console API
 * (Requires Google Webmasters / Search Console API enablement)
 */
export async function fetchLiveSearchConsoleData(
  startDate?: string,
  endDate?: string
): Promise<SearchConsoleQueryRecord[] | null> {
  const siteUrl = process.env.GSC_SITE_URL || 'https://www.mooearth.live/';
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    // Return null to signal that credentials are not yet configured
    return null;
  }

  try {
    // If standard OAuth / Service Account token is exchangeable:
    // (Google Cloud Service Account authentication flow)
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    
    // Default to last 28 days if dates not passed
    const now = new Date();
    const end = endDate || now.toISOString().split('T')[0];
    const prev = new Date(now.getTime() - 28 * 86400000);
    const start = startDate || prev.toISOString().split('T')[0];

    const body = {
      startDate: start,
      endDate: end,
      dimensions: ['query', 'page', 'country', 'device'],
      rowLimit: 1000,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GOOGLE_SEARCH_CONSOLE_KEY || ''}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.warn(`[GSC Service] GSC API returned status ${response.status}`);
      return null;
    }

    const json = await response.json();
    if (!json.rows || !Array.isArray(json.rows)) {
      return [];
    }

    return json.rows.map((row: any) => ({
      query: row.keys[0] || '',
      page: row.keys[1] || '/',
      country: row.keys[2] || 'Global',
      device: (row.keys[3] || 'desktop').toLowerCase(),
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));
  } catch (error) {
    console.error('[GSC Service] Failed to fetch live Search Console data:', error);
    return null;
  }
}

/**
 * Ingest client-side organic search telemetry into storage
 */
export function recordOrganicTelemetry(record: OrganicTelemetryRecord): void {
  TELEMETRY_CACHE.unshift(record);
  // Keep cache bounded to last 1,000 organic visits
  if (TELEMETRY_CACHE.length > 1000) {
    TELEMETRY_CACHE.pop();
  }
}

/**
 * Retrieve cached organic search telemetry
 */
export function getOrganicTelemetry(): OrganicTelemetryRecord[] {
  return [...TELEMETRY_CACHE];
}

/**
 * Generate Complete Master SEO Growth Report
 * Never fabricates numbers. If GSC credentials are provided, pulls live API data.
 * Otherwise uses real verified sitemap count (921 pages) and organic visitor telemetry.
 */
export async function getMasterSeoReport(): Promise<SeoGrowthReport> {
  const liveRows = await fetchLiveSearchConsoleData();
  const telemetry = getOrganicTelemetry();

  return generateSeoGrowthReport(liveRows || undefined, telemetry);
}
