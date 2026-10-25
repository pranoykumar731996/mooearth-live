// ============================================================
// MooEarth Live — Coastline Proximity & Landfall Intelligence
// ============================================================
// Calculates:
// 1. Great-circle distance from cyclone eye to nearest coastline
// 2. Forecast track coastline intersections and estimated impact time windows
// 3. Transparent disclaimers adhering to Truth-in-Weather standards:
//    Strictly never presents proximity estimates as official government landfall declarations.

import type { TropicalCyclone, LandfallOutlook } from './cycloneTrackingService';

export interface CoastlineNode {
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * High-value coastline reference points across global tropical cyclone basins
 * (Bay of Bengal, Arabian Sea, Gulf of Mexico, US Atlantic, Caribbean, West Pacific, Australia).
 */
export const GLOBAL_COASTLINE_POINTS: CoastlineNode[] = [
  // --- North Indian Ocean: Bay of Bengal ---
  { name: 'Puri - Paradip Sector', region: 'Odisha Coast', country: 'India', lat: 19.8, lng: 85.8 },
  { name: 'Dhamra - Chandbali Sector', region: 'Odisha Coast', country: 'India', lat: 20.8, lng: 86.9 },
  { name: 'Digha - Sagar Island', region: 'West Bengal Coast', country: 'India', lat: 21.6, lng: 87.5 },
  { name: 'Sundarbans Biosphere', region: 'West Bengal / Bangladesh Delta', country: 'India', lat: 21.8, lng: 88.9 },
  { name: 'Khepupara - Barisal Delta', region: 'Barisal Coast', country: 'Bangladesh', lat: 21.9, lng: 90.2 },
  { name: 'Chittagong - Cox\'s Bazar', region: 'Chittagong Coast', country: 'Bangladesh', lat: 22.3, lng: 91.8 },
  { name: 'Visakhapatnam - Kakinada', region: 'Andhra Pradesh Coast', country: 'India', lat: 17.7, lng: 83.3 },
  { name: 'Machilipatnam - Nizampatnam', region: 'Andhra Pradesh Coast', country: 'India', lat: 16.1, lng: 81.2 },
  { name: 'Chennai - Ennore Port', region: 'Tamil Nadu Coast', country: 'India', lat: 13.1, lng: 80.3 },
  { name: 'Nagapattinam - Cuddalore', region: 'Tamil Nadu Coast', country: 'India', lat: 10.7, lng: 79.8 },
  { name: 'Rakhine - Sittwe Coastal Sector', region: 'Rakhine Coast', country: 'Myanmar', lat: 20.1, lng: 92.9 },
  { name: 'Ayeyarwady River Delta', region: 'Ayeyarwady Coast', country: 'Myanmar', lat: 15.8, lng: 95.2 },

  // --- North Indian Ocean: Arabian Sea ---
  { name: 'Veraval - Somnath Sector', region: 'Saurashtra Coast', country: 'India', lat: 20.9, lng: 70.4 },
  { name: 'Dwarka - Porbandar Sector', region: 'Gujarat Coast', country: 'India', lat: 22.2, lng: 68.9 },
  { name: 'Kandla - Mandvi Gulf of Kutch', region: 'Kutch Coast', country: 'India', lat: 23.0, lng: 70.2 },
  { name: 'Mumbai Metropolitan Coast', region: 'Konkan Coast', country: 'India', lat: 18.9, lng: 72.8 },
  { name: 'Ratnagiri - Sindhudurg', region: 'Konkan Coast', country: 'India', lat: 16.9, lng: 73.3 },
  { name: 'Goa Coastal Sector', region: 'Goa Coast', country: 'India', lat: 15.3, lng: 73.8 },
  { name: 'Karachi Coastal Belt', region: 'Sindh Coast', country: 'Pakistan', lat: 24.8, lng: 67.0 },
  { name: 'Gwadar - Pasni Sector', region: 'Makran Coast', country: 'Pakistan', lat: 25.1, lng: 62.3 },
  { name: 'Muscat - Sur Peninsula', region: 'Oman Coast', country: 'Oman', lat: 22.6, lng: 59.5 },
  { name: 'Salalah Maritime Belt', region: 'Dhofar Coast', country: 'Oman', lat: 17.0, lng: 54.1 },

  // --- North Atlantic / Gulf of Mexico / US Coast ---
  { name: 'Tampa Bay - St Petersburg', region: 'Florida Gulf Coast', country: 'United States', lat: 27.8, lng: -82.6 },
  { name: 'Fort Myers - Naples', region: 'Southwest Florida', country: 'United States', lat: 26.4, lng: -81.8 },
  { name: 'Florida Big Bend Sector', region: 'Florida Big Bend', country: 'United States', lat: 29.8, lng: -83.8 },
  { name: 'Panama City - Pensacola', region: 'Florida Panhandle', country: 'United States', lat: 30.2, lng: -85.7 },
  { name: 'New Orleans - Barataria', region: 'Louisiana Delta', country: 'United States', lat: 29.5, lng: -89.9 },
  { name: 'Galveston - Houston Ship Channel', region: 'Texas Upper Coast', country: 'United States', lat: 29.3, lng: -94.8 },
  { name: 'Corpus Christi - Padre Island', region: 'Texas Coastal Bend', country: 'United States', lat: 27.8, lng: -97.4 },
  { name: 'Miami Beach - Biscayne Bay', region: 'Southeast Florida', country: 'United States', lat: 25.8, lng: -80.1 },
  { name: 'Cape Hatteras Outer Banks', region: 'North Carolina Outer Banks', country: 'United States', lat: 35.2, lng: -75.5 },
  { name: 'Charleston - Hilton Head', region: 'South Carolina Lowcountry', country: 'United States', lat: 32.7, lng: -79.9 },
  { name: 'Cancun - Cozumel Peninsula', region: 'Quintana Roo', country: 'Mexico', lat: 21.1, lng: -86.8 },
  { name: 'Havana Coastal Belt', region: 'Western Cuba', country: 'Cuba', lat: 23.1, lng: -82.4 },

  // --- Western Pacific ---
  { name: 'Cagayan - Isabela Coast', region: 'Northern Luzon', country: 'Philippines', lat: 18.2, lng: 122.1 },
  { name: 'Aurora - Polillo Island', region: 'Eastern Luzon', country: 'Philippines', lat: 15.8, lng: 121.6 },
  { name: 'Samar - Leyte Coastal Belt', region: 'Eastern Visayas', country: 'Philippines', lat: 11.8, lng: 125.4 },
  { name: 'Taitung - Hualien Coast', region: 'Eastern Taiwan', country: 'Taiwan', lat: 23.5, lng: 121.5 },
  { name: 'Kenting Peninsula', region: 'Southern Taiwan', country: 'Taiwan', lat: 21.9, lng: 120.8 },
  { name: 'Okinawa Main Island', region: 'Ryukyu Islands', country: 'Japan', lat: 26.3, lng: 127.8 },
  { name: 'Kagoshima - Miyazaki', region: 'Southern Kyushu', country: 'Japan', lat: 31.6, lng: 130.6 },
  { name: 'Guangdong - Shenzhen Bay', region: 'Pearl River Delta', country: 'China', lat: 22.5, lng: 114.0 },
  { name: 'Zhanjiang - Leizhou Peninsula', region: 'Western Guangdong', country: 'China', lat: 21.2, lng: 110.4 },
  { name: 'Hainan Island Eastern Coast', region: 'Hainan Coast', country: 'China', lat: 19.3, lng: 110.8 },
  { name: 'Da Nang - Hue Sector', region: 'Central Vietnam Coast', country: 'Vietnam', lat: 16.1, lng: 108.2 },

  // --- South Pacific / Australia ---
  { name: 'Cairns - Port Douglas', region: 'Far North Queensland', country: 'Australia', lat: -16.9, lng: 145.8 },
  { name: 'Townsville - Ayr', region: 'North Queensland', country: 'Australia', lat: -19.3, lng: 146.8 },
  { name: 'Mackay - Whitsundays', region: 'Central Queensland', country: 'Australia', lat: -21.1, lng: 149.2 },
  { name: 'Broome - Dampier Peninsula', region: 'Kimberley Coast', country: 'Australia', lat: -17.9, lng: 122.2 },
  { name: 'Port Hedland - Karratha', region: 'Pilbara Coast', country: 'Australia', lat: -20.3, lng: 118.6 },
];

/**
 * Calculates Haversine distance in km between two lat/lng coordinates.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Finds the nearest coastline point and its distance from the given storm location.
 */
export function findNearestCoastline(
  lat: number,
  lng: number
): {
  distanceKm: number;
  nearestPoint: CoastlineNode;
} {
  let minDistance = Infinity;
  let closest = GLOBAL_COASTLINE_POINTS[0];

  for (const pt of GLOBAL_COASTLINE_POINTS) {
    const dist = calculateHaversineDistanceKm(lat, lng, pt.lat, pt.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = pt;
    }
  }

  return {
    distanceKm: minDistance,
    nearestPoint: closest,
  };
}

/**
 * Computes transparent Landfall Outlook from official forecast track points.
 * Explicitly adheres to Truth-in-Weather standards:
 * Never declares an official government landfall; marks it transparently as an estimated proximity window.
 */
export function computeLandfallOutlook(cyclone: TropicalCyclone): LandfallOutlook | undefined {
  const currentProximity = findNearestCoastline(cyclone.lat, cyclone.lng);

  const forecastPoints = cyclone.forecastPoints && cyclone.forecastPoints.length > 0
    ? cyclone.forecastPoints
    : cyclone.forecastCone.map((fc) => ({
        timestamp: new Date(Date.now() + fc.hoursAhead * 3600000).toISOString(),
        lat: fc.lat,
        lng: fc.lng,
        windSpeedKph: fc.predictedWindKph,
        windSpeedKnots: Math.round(fc.predictedWindKph / 1.852),
        stageName: fc.predictedCategory,
        isForecast: true,
        leadHours: fc.hoursAhead,
      }));

  if (forecastPoints.length === 0) {
    return {
      estimatedTimeWindow: 'No forecast track points published',
      estimatedCoastlineName: `${currentProximity.nearestPoint.name} (${currentProximity.nearestPoint.country})`,
      coastlineDistanceKm: currentProximity.distanceKm,
      isCoastlineIntersecting: false,
      disclaimer: `Estimated from observed position. Distance to nearest coast: ${currentProximity.distanceKm} km. Not an official landfall declaration.`,
    };
  }

  // Check each forecast node for close coastal intersection (threshold <= 65 km)
  let closestForecastNode = forecastPoints[0];
  let minCoastDist = Infinity;
  let intersectingCoastNode: CoastlineNode = currentProximity.nearestPoint;
  let isIntersecting = false;
  let boundingWindowStart = cyclone.lastUpdated;
  let boundingWindowEnd = forecastPoints[0].timestamp;

  for (let i = 0; i < forecastPoints.length; i++) {
    const pt = forecastPoints[i];
    const coast = findNearestCoastline(pt.lat, pt.lng);

    if (coast.distanceKm < minCoastDist) {
      minCoastDist = coast.distanceKm;
      closestForecastNode = pt;
      intersectingCoastNode = coast.nearestPoint;
    }

    if (coast.distanceKm <= 65 && !isIntersecting) {
      isIntersecting = true;
      const prev = i === 0 ? null : forecastPoints[i - 1];
      boundingWindowStart = prev ? prev.timestamp : cyclone.lastUpdated;
      boundingWindowEnd = pt.timestamp;
    }
  }

  // Format human-readable UTC time window
  const startTimeUtc = new Date(boundingWindowStart).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  const endTimeUtc = new Date(boundingWindowEnd).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  const timeWindow = isIntersecting
    ? `${startTimeUtc} UTC – ${endTimeUtc} UTC`
    : `Open Waters (Closest Approach: +${closestForecastNode.leadHours ?? 48}h, ~${minCoastDist} km off ${intersectingCoastNode.name})`;

  const advisoryTag = cyclone.advisoryNumber || 'Latest Official Advisory';

  return {
    estimatedTimeWindow: timeWindow,
    estimatedCoastlineName: `${intersectingCoastNode.name}, ${intersectingCoastNode.country}`,
    coastlineDistanceKm: currentProximity.distanceKm,
    isCoastlineIntersecting: isIntersecting,
    disclaimer: `Estimated from forecast track (${advisoryTag}, ${cyclone.agency}). This is a mathematical track proximity estimate, NOT an official government landfall declaration or evacuation order. Refer to ${cyclone.agency} and national emergency authorities for public safety directives.`,
  };
}
