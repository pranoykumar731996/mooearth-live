// ============================================================
// MooEarth Live — Demo Event Data
// ============================================================
// Replace this file's export with an API call to swap to live data.

import { WorldEvent } from '@/types';

/** Generate demo events with timestamps relative to current time.
 *  Called lazily on the client to avoid SSR/client mismatch. */
function createDemoEvents(): WorldEvent[] {
  const now = Date.now();
  return [
    {
      id: 'evt-001',
      title: 'Japan Unveils Next-Gen Quantum Computer',
      summary:
        'Tokyo researchers have demonstrated a 1,000-qubit quantum processor that outperforms classical supercomputers on key optimization tasks. The breakthrough could revolutionize drug discovery, materials science, and cryptography within the decade.',
      category: 'technology',
      country: 'Japan',
      city: 'Tokyo',
      lat: 35.6762,
      lng: 139.6503,
      source: 'https://example.com/japan-quantum',
      publishedAt: new Date(now - 5 * 60000).toISOString(),
    },
    {
      id: 'evt-002',
      title: 'India Launches Historic Lunar Rover Mission',
      summary:
        'ISRO successfully launched Chandrayaan-4 carrying India\'s most advanced lunar rover. The mission aims to explore the Moon\'s south pole for water ice deposits and rare minerals, marking a major milestone in India\'s space program.',
      category: 'breaking',
      country: 'India',
      city: 'New Delhi',
      lat: 28.6139,
      lng: 77.209,
      source: 'https://example.com/india-lunar',
      publishedAt: new Date(now - 15 * 60000).toISOString(),
    },
    {
      id: 'evt-003',
      title: 'London Stock Exchange Hits Record Trading Volume',
      summary:
        'The London Stock Exchange recorded its highest single-day trading volume in history, driven by a surge in AI and green energy stocks. Analysts attribute the boom to renewed investor confidence in European tech innovation.',
      category: 'business',
      country: 'United Kingdom',
      city: 'London',
      lat: 51.5074,
      lng: -0.1278,
      source: 'https://example.com/lse-record',
      publishedAt: new Date(now - 25 * 60000).toISOString(),
    },
    {
      id: 'evt-004',
      title: "Broadway's AI-Generated Musical Sells Out Opening Night",
      summary:
        'The first fully AI-composed Broadway musical premiered to a sold-out audience in New York. Critics praised the innovative score while sparking debate about the future of human creativity in the performing arts.',
      category: 'entertainment',
      country: 'United States',
      city: 'New York',
      lat: 40.7128,
      lng: -74.006,
      source: 'https://example.com/broadway-ai',
      publishedAt: new Date(now - 35 * 60000).toISOString(),
    },
    {
      id: 'evt-005',
      title: 'Record Heatwave Sweeps Across Southern Europe',
      summary:
        'Meteorologists declare a level-red alert as temperatures in Spain and Italy shatter 100-year records. The heatwave is expected to disrupt agriculture and power grids for the next two weeks.',
      category: 'weather',
      country: 'Spain',
      city: 'Madrid',
      lat: 40.4168,
      lng: -3.7038,
      source: 'https://example.com/europe-heatwave',
      publishedAt: new Date(now - 45 * 60000).toISOString(),
    },
    {
      id: 'evt-006',
      title: 'China Opens World\'s Longest Maglev Train Network',
      summary:
        'A new high-speed maglev train connecting Beijing to Shanghai in under two hours has officially opened, featuring speeds over 600 km/h. It sets a new standard for sustainable mass transit.',
      category: 'technology',
      country: 'China',
      city: 'Beijing',
      lat: 39.9042,
      lng: 116.4074,
      source: 'https://example.com/china-maglev',
      publishedAt: new Date(now - 55 * 60000).toISOString(),
    },
    {
      id: 'evt-007',
      title: 'Global Summit on AI Ethics Concludes with Landmark Treaty',
      summary:
        '120 nations have signed the Geneva AI Accord, establishing the first comprehensive international framework for regulating artificial general intelligence, autonomous weapons, and data privacy.',
      category: 'breaking',
      country: 'Switzerland',
      city: 'Geneva',
      lat: 46.2044,
      lng: 6.1432,
      source: 'https://example.com/ai-treaty',
      publishedAt: new Date(now - 65 * 60000).toISOString(),
    },
    {
      id: 'evt-008',
      title: 'Brazil Announces Massive Amazon Restoration Project',
      summary:
        'The Brazilian government has committed $5 billion to reforest over 20 million hectares of the Amazon rainforest by 2030, utilizing advanced drone-planting technology to speed up ecological recovery.',
      category: 'weather',
      country: 'Brazil',
      city: 'Brasília',
      lat: -15.7938,
      lng: -47.8827,
      source: 'https://example.com/amazon-restoration',
      publishedAt: new Date(now - 75 * 60000).toISOString(),
    },
    {
      id: 'evt-009',
      title: 'Cape Town Selected as African Tech Hub Headquarters',
      summary:
        'Cape Town has been designated as the operational headquarters of the African Continental Free Trade Area hub. The initiative is expected to boost intra-African trade by 52% and create millions of jobs across the continent.',
      category: 'breaking',
      country: 'South Africa',
      city: 'Cape Town',
      lat: -33.9249,
      lng: 18.4241,
      source: 'https://example.com/capetown-trade',
      publishedAt: new Date(now - 85 * 60000).toISOString(),
    },
    {
      id: 'evt-010',
      title: "Singapore Becomes Asia's Top Fintech Capital",
      summary:
        'Singapore has officially surpassed Hong Kong as Asia\'s leading fintech hub, attracting $12 billion in investments this quarter alone. The city-state\'s progressive regulation and talent pool continue to draw global financial innovators.',
      category: 'business',
      country: 'Singapore',
      city: 'Singapore',
      lat: 1.3521,
      lng: 103.8198,
      source: 'https://example.com/singapore-fintech',
      publishedAt: new Date(now - 95 * 60000).toISOString(),
    },
  ];
}

/** Static demo events — safe for SSR since timestamps are fixed strings */
export const demoEvents: WorldEvent[] = createDemoEvents();
