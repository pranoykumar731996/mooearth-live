// src/services/freshness.ts

export interface FreshnessInfo {
  lastRetrieved: string;
  ageMinutes: number;
  status: 'Live' | 'Recent' | 'Stale';
  apiResponseAgeSeconds: number;
}

// Global in-memory registry for retrieval timestamps
// Note: In Next.js dev server, global variables persist across hot reloads or multiple requests.
// We initialize them to 0 (which means they are initially stale).
const globalFetchRegistry = (global as any).mooearthFetchRegistry || {
  breaking: 0,
  football: 0,
  weather: 0,
  business: 0,
  technology: 0,
  entertainment: 0,
  worldcup: 0
};
(global as any).mooearthFetchRegistry = globalFetchRegistry;

const globalApiResponseTimes = (global as any).mooearthApiResponseTimes || {
  breaking: 0,
  football: 0,
  weather: 0,
  business: 0,
  technology: 0,
  entertainment: 0,
  worldcup: 0
};
(global as any).mooearthApiResponseTimes = globalApiResponseTimes;

export function recordFetch(category: string, apiResponseTimeMs: number = Date.now()) {
  const normalized = category.toLowerCase().trim();
  globalFetchRegistry[normalized] = Date.now();
  globalApiResponseTimes[normalized] = apiResponseTimeMs;
}

export function getFreshness(category: string): FreshnessInfo {
  const normalized = category.toLowerCase().trim();
  const ts = globalFetchRegistry[normalized];
  
  if (!ts) {
    return {
      lastRetrieved: new Date(0).toISOString(),
      ageMinutes: 999,
      status: 'Stale',
      apiResponseAgeSeconds: 99999
    };
  }

  const ageMs = Date.now() - ts;
  const ageMinutes = ageMs / 60000;
  
  let status: 'Live' | 'Recent' | 'Stale' = 'Live';
  if (ageMinutes > 60) {
    status = 'Stale';
  } else if (ageMinutes > 15) {
    status = 'Recent';
  }

  const apiTs = globalApiResponseTimes[normalized] || ts;
  const apiAgeSeconds = Math.max(0, Math.round((Date.now() - apiTs) / 1000));

  return {
    lastRetrieved: new Date(ts).toISOString(),
    ageMinutes: Math.round(ageMinutes * 10) / 10,
    status,
    apiResponseAgeSeconds: apiAgeSeconds
  };
}

export function getAllFreshness(): Record<string, FreshnessInfo> {
  const categories = ['breaking', 'football', 'weather', 'business', 'technology', 'entertainment', 'worldcup'];
  const result: Record<string, FreshnessInfo> = {};
  for (const cat of categories) {
    result[cat] = getFreshness(cat);
  }
  return result;
}
