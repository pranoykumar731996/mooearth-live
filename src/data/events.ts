// ============================================================
// EarthPulse AI — Demo Event Data
// ============================================================
// Replace this file's export with an API call to swap to live data.

import { WorldEvent } from '@/types';

export const demoEvents: WorldEvent[] = [
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
    publishedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
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
    publishedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
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
    publishedAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
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
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt-005',
    title: 'Brazil Announces 2030 World Cup Stadium Plans',
    summary:
      'Rio de Janeiro unveiled ambitious plans for three new sustainable stadiums ahead of the 2030 FIFA World Cup bid. The designs feature solar-powered roofs and rainwater harvesting systems, setting a new standard for sports architecture.',
    category: 'sports',
    country: 'Brazil',
    city: 'Rio de Janeiro',
    lat: -22.9068,
    lng: -43.1729,
    source: 'https://example.com/brazil-stadiums',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt-006',
    title: 'Tropical Storm Approaching Gulf of Mexico',
    summary:
      'Tropical Storm Elena has intensified to Category 2 strength as it approaches the Gulf of Mexico. Coastal communities in Mexico City and southern Texas are preparing for potential flooding and strong winds over the next 48 hours.',
    category: 'weather',
    country: 'Mexico',
    city: 'Mexico City',
    lat: 19.4326,
    lng: -99.1332,
    source: 'https://example.com/storm-elena',
    publishedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt-007',
    title: 'Real Madrid Signs Record €200M Transfer',
    summary:
      'Real Madrid has completed the most expensive transfer in football history, signing Brazilian prodigy Lucas Mendes for €200 million. The 19-year-old forward is expected to lead the club\'s new era of Galácticos.',
    category: 'sports',
    country: 'Spain',
    city: 'Madrid',
    lat: 40.4168,
    lng: -3.7038,
    source: 'https://example.com/madrid-transfer',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt-008',
    title: "Australia's First Autonomous Drone Delivery Network",
    summary:
      'Sydney has launched the Southern Hemisphere\'s first city-wide autonomous drone delivery network. The system covers 500 square kilometers and can deliver packages in under 30 minutes, transforming last-mile logistics.',
    category: 'technology',
    country: 'Australia',
    city: 'Sydney',
    lat: -33.8688,
    lng: 151.2093,
    source: 'https://example.com/sydney-drones',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'evt-009',
    title: 'South Africa Unveils Continental Free Trade Hub',
    summary:
      'Cape Town has been designated as the operational headquarters of the African Continental Free Trade Area hub. The initiative is expected to boost intra-African trade by 52% and create millions of jobs across the continent.',
    category: 'breaking',
    country: 'South Africa',
    city: 'Cape Town',
    lat: -33.9249,
    lng: 18.4241,
    source: 'https://example.com/capetown-trade',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
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
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
  },
];
