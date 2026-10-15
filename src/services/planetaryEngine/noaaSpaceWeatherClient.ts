// ============================================================
// MooEarth Live — Planetary Engine: NOAA Space Weather Client
// ============================================================

import { NoaaSwpcKpRecord, PlanetaryEvent } from './types';

const NOAA_SWPC_KP_ENDPOINT = 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json';
const NOAA_SWPC_ALERTS_ENDPOINT = 'https://services.swpc.noaa.gov/products/alerts.json';

interface NoaaAlertItem {
  product_id: string;
  issue_datetime: string;
  message: string;
}

/**
 * Returns geomagnetic storm scale description based on Kp index
 */
function getKpScaleDescription(kp: number): { scale: string; activity: string; auroraLat: string } {
  if (kp >= 9) return { scale: 'G5 Extreme Storm', activity: 'Widespread power grid and HF radio blackouts', auroraLat: 'down to 40° latitude' };
  if (kp >= 8) return { scale: 'G4 Severe Storm', activity: 'Major geomagnetic disturbance', auroraLat: 'down to 45° latitude' };
  if (kp >= 7) return { scale: 'G3 Strong Storm', activity: 'Power system voltage irregularities', auroraLat: 'down to 50° latitude' };
  if (kp >= 6) return { scale: 'G2 Moderate Storm', activity: 'High-latitude power grid alerts', auroraLat: 'down to 55° latitude' };
  if (kp >= 5) return { scale: 'G1 Minor Storm', activity: 'Weak power grid fluctuations', auroraLat: 'down to 60° latitude' };
  if (kp >= 4) return { scale: 'Active Conditions', activity: 'Unsettled geomagnetic field', auroraLat: 'poleward of 65° latitude' };
  return { scale: 'Quiet / Normal', activity: 'Stable geomagnetic conditions', auroraLat: 'auroral oval regions only' };
}

/**
 * Fetches real-time Space Weather from NOAA SWPC
 */
export async function fetchNoaaSpaceWeather(timeoutMs = 6000): Promise<PlanetaryEvent[]> {
  const events: PlanetaryEvent[] = [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const [kpRes, alertRes] = await Promise.allSettled([
      fetch(NOAA_SWPC_KP_ENDPOINT, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'MooEarthLivePlanetaryEngine/1.0' },
        next: { revalidate: 300 },
      }),
      fetch(NOAA_SWPC_ALERTS_ENDPOINT, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'User-Agent': 'MooEarthLivePlanetaryEngine/1.0' },
        next: { revalidate: 300 },
      }),
    ]);

    clearTimeout(timer);

    // 1. Process latest Kp index reading
    if (kpRes.status === 'fulfilled' && kpRes.value.ok) {
      const records: NoaaSwpcKpRecord[] = await kpRes.value.json();
      if (Array.isArray(records) && records.length > 0) {
        const latest = records[records.length - 1];
        const kp = latest.kp_index ?? Math.round(latest.estimated_kp);
        const { scale, activity, auroraLat } = getKpScaleDescription(kp);

        const dateIso = latest.time_tag ? new Date(latest.time_tag + 'Z').toISOString() : new Date().toISOString();

        // Place marker at northern auroral research zone (Tromsø, Norway)
        events.push({
          id: `noaa-swpc-kp-${latest.time_tag.replace(/[^0-9]/g, '')}`,
          title: `Space Weather: Planetary Kp Index ${kp} (${scale})`,
          summary: `NOAA Space Weather Prediction Center reports planetary K-index at ${kp} (${scale}). ${activity}. Aurora visibility expected ${auroraLat}.`,
          category: 'space_weather',
          country: 'Norway',
          city: 'Arctic Auroral Zone',
          lat: 69.6492,
          lng: 18.9553,
          source: 'NOAA Space Weather Prediction Center (SWPC)',
          publishedAt: dateIso,
          url: 'https://www.swpc.noaa.gov/',
          dataOrigin: 'noaa_swpc',
          planetaryTelemetry: {
            kpIndex: kp,
            eventStatus: 'active',
            sensorSource: 'NOAA SWPC Ground Magnetometer Network',
            externalDataUrl: 'https://www.swpc.noaa.gov/',
          },
        });
      }
    }

    // 2. Process latest official alerts/warnings if available
    if (alertRes.status === 'fulfilled' && alertRes.value.ok) {
      const alerts: NoaaAlertItem[] = await alertRes.value.json();
      if (Array.isArray(alerts) && alerts.length > 0) {
        // Take the most recent alert bulletin
        const topAlert = alerts[0];
        const lines = (topAlert.message || '').split('\n').map((l) => l.trim()).filter(Boolean);
        const headline = lines.find((l) => l.startsWith('WARNING:') || l.startsWith('WATCH:') || l.startsWith('ALERT:') || l.startsWith('SUMMARY:')) || lines[0] || 'Space Weather Bulletin';

        // Extract potential Kp from message if mentioned
        const kpMatch = topAlert.message.match(/K-index of (\d+)/i);
        const alertKp = kpMatch ? parseInt(kpMatch[1], 10) : undefined;

        const cleanSummary = lines.slice(0, 4).join(' ');

        events.push({
          id: `noaa-swpc-alert-${topAlert.product_id}-${topAlert.issue_datetime.replace(/[^0-9]/g, '')}`,
          title: `NOAA Space Weather Alert: ${headline}`,
          summary: `Official bulletin from NOAA SWPC: ${cleanSummary.substring(0, 220)}...`,
          category: 'space_weather',
          country: 'United States',
          city: 'Fairbanks Aurora Zone, Alaska',
          lat: 64.8378,
          lng: -147.7164,
          source: 'NOAA Space Weather Prediction Center (SWPC)',
          publishedAt: new Date(topAlert.issue_datetime + ' UTC').toISOString(),
          url: 'https://www.swpc.noaa.gov/products/alerts-watches-and-warnings',
          dataOrigin: 'noaa_swpc',
          planetaryTelemetry: {
            kpIndex: alertKp,
            eventStatus: 'alert',
            sensorSource: 'NOAA Space Weather Prediction Center',
            externalDataUrl: 'https://www.swpc.noaa.gov/products/alerts-watches-and-warnings',
          },
        });
      }
    }

    return events;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[Planetary NOAA Space] Fetch notice: ${err?.message || err}`);
    return [];
  }
}
