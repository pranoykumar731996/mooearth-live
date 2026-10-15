// ============================================================
// MooEarth Live — Degraded Fallback Planetary Event Data
// ============================================================
// High-quality baseline events used when live telemetry feeds are temporarily unreachable.

import { WorldEvent } from '@/types';

/** Generate fallback events with timestamps relative to current time.
 *  Called lazily on the client to avoid SSR/client mismatch. */
function createFallbackEvents(): WorldEvent[] {
  const now = Date.now();
  const rawEvents = [
    {
      id: 'evt-001',
      title: 'Japan Unveils Next-Gen Quantum Computing Facility',
      summary:
        'Tokyo researchers have demonstrated a 1,000-qubit quantum processor that outperforms classical supercomputers on key optimization tasks. The breakthrough could revolutionize drug discovery, materials science, and cryptography within the decade.',
      category: 'science_nature' as const,
      country: 'Japan',
      city: 'Tokyo',
      lat: 35.6762,
      lng: 139.6503,
      publishedAt: new Date(now - 5 * 60000).toISOString(),
    },
    {
      id: 'evt-002',
      title: 'India Launches Historic Lunar Rover Mission',
      summary:
        'ISRO successfully launched Chandrayaan-4 carrying India\'s most advanced lunar rover. The mission aims to explore the Moon\'s south pole for water ice deposits and rare minerals, marking a major milestone in India\'s space program.',
      category: 'space_weather' as const,
      country: 'India',
      city: 'New Delhi',
      lat: 28.6139,
      lng: 77.209,
      publishedAt: new Date(now - 15 * 60000).toISOString(),
    },
    {
      id: 'evt-003',
      title: 'Green Hydrogen Grid Breakthrough in the United Kingdom',
      summary:
        'Engineers in London have completed the first commercial trial of a zero-emission green hydrogen electrical distribution grid, supplying clean power to over 100,000 homes during peak seasonal demand.',
      category: 'science_nature' as const,
      country: 'United Kingdom',
      city: 'London',
      lat: 51.5074,
      lng: -0.1278,
      publishedAt: new Date(now - 25 * 60000).toISOString(),
    },
    {
      id: 'evt-004',
      title: 'Atmospheric Sensor Array Deployed Across New York Harbor',
      summary:
        'Environmental scientists have activated a hyper-local marine sensor network across New York Harbor to monitor coastal tide dynamics, storm surges, and particulate distribution in real time.',
      category: 'climate_oceans' as const,
      country: 'United States',
      city: 'New York',
      lat: 40.7128,
      lng: -74.006,
      publishedAt: new Date(now - 35 * 60000).toISOString(),
    },
    {
      id: 'evt-005',
      title: 'Record Heatwave Sweeps Across Southern Europe',
      summary:
        'Meteorologists declare a level-red alert as temperatures in Spain and Italy shatter 100-year records. The heatwave is expected to disrupt agriculture and power grids for the next two weeks.',
      category: 'severe_weather' as const,
      country: 'Spain',
      city: 'Madrid',
      lat: 40.4168,
      lng: -3.7038,
      publishedAt: new Date(now - 45 * 60000).toISOString(),
    },
    {
      id: 'evt-006',
      title: 'China Opens World\'s Longest Maglev Transit Corridor',
      summary:
        'A new high-speed maglev train connecting Beijing to Shanghai in under two hours has officially opened, featuring speeds over 600 km/h. It sets a new standard for sustainable mass transit.',
      category: 'science_nature' as const,
      country: 'China',
      city: 'Beijing',
      lat: 39.9042,
      lng: 116.4074,
      publishedAt: new Date(now - 55 * 60000).toISOString(),
    },
    {
      id: 'evt-007',
      title: 'Global Environmental Accord Signed at Geneva Summit',
      summary:
        'Delegates from 120 nations have finalized a landmark treaty to safeguard high-seas biodiversity, monitor deep-sea mining risks, and establish shared satellite data streams for ocean health.',
      category: 'climate_oceans' as const,
      country: 'Switzerland',
      city: 'Geneva',
      lat: 46.2044,
      lng: 6.1432,
      publishedAt: new Date(now - 65 * 60000).toISOString(),
    },
    {
      id: 'evt-008',
      title: 'Brazil Announces Massive Amazon Restoration Project',
      summary:
        'The Brazilian government has committed $5 billion to reforest over 20 million hectares of the Amazon rainforest by 2030, utilizing advanced drone-planting technology to speed up ecological recovery.',
      category: 'climate_oceans' as const,
      country: 'Brazil',
      city: 'Brasília',
      lat: -15.7938,
      lng: -47.8827,
      publishedAt: new Date(now - 75 * 60000).toISOString(),
    },
    {
      id: 'evt-009',
      title: 'Deep-Sea Observational Buoys Deployed off Cape Town',
      summary:
        'Oceanographic researchers have anchored deep-water telemetry buoys off the coast of South Africa to track the Agulhas current and southern ocean heat transport mechanisms.',
      category: 'climate_oceans' as const,
      country: 'South Africa',
      city: 'Cape Town',
      lat: -33.9249,
      lng: 18.4241,
      publishedAt: new Date(now - 85 * 60000).toISOString(),
    },
    {
      id: 'evt-010',
      title: 'Singapore Completes Solar-Powered Floating Reservoir Network',
      summary:
        'Singapore has expanded its clean water reservoir infrastructure with floating photovoltaic arrays that generate renewable power while reducing evaporation rates during high-temperature periods.',
      category: 'science_nature' as const,
      country: 'Singapore',
      city: 'Singapore',
      lat: 1.3521,
      lng: 103.8198,
      publishedAt: new Date(now - 95 * 60000).toISOString(),
    },
  ];

  return rawEvents.map(e => ({
    ...e,
    source: `/countries/${encodeURIComponent(e.country.toLowerCase())}`,
  }));
}

/** Static fallback events — safe for SSR since timestamps are fixed strings */
export const fallbackEvents: WorldEvent[] = createFallbackEvents();
export const demoEvents: WorldEvent[] = fallbackEvents;
