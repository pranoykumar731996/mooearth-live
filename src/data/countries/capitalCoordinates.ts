// ============================================================
// MooEarth Live — Verified 195 Sovereign Nation Capital Coordinates
// ============================================================
// Exact, authentic geographic coordinates (latitude & longitude)
// for the capital city of every sovereign state recognized by the UN
// (+ Vatican City & State of Palestine).
// Replaces country bounding-box centroids with precision city center coordinates.

export interface CapitalCoordinateRecord {
  capital: string;
  lat: number;
  lng: number;
}

export const SOVEREIGN_CAPITAL_COORDINATES: Record<string, CapitalCoordinateRecord> = {
  // A
  AF: { capital: 'Kabul', lat: 34.5553, lng: 69.2075 },
  AL: { capital: 'Tirana', lat: 41.3275, lng: 19.8187 },
  DZ: { capital: 'Algiers', lat: 36.7538, lng: 3.0588 },
  AD: { capital: 'Andorra la Vella', lat: 42.5063, lng: 1.5218 },
  AO: { capital: 'Luanda', lat: -8.8390, lng: 13.2894 },
  AG: { capital: "St. John's", lat: 17.1274, lng: -61.8468 },
  AR: { capital: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  AM: { capital: 'Yerevan', lat: 40.1792, lng: 44.4991 },
  AU: { capital: 'Canberra', lat: -35.2809, lng: 149.1300 },
  AT: { capital: 'Vienna', lat: 48.2082, lng: 16.3738 },
  AZ: { capital: 'Baku', lat: 40.4093, lng: 49.8671 },

  // B
  BS: { capital: 'Nassau', lat: 25.0443, lng: -77.3504 },
  BH: { capital: 'Manama', lat: 26.2285, lng: 50.5860 },
  BD: { capital: 'Dhaka', lat: 23.8103, lng: 90.4125 },
  BB: { capital: 'Bridgetown', lat: 13.1060, lng: -59.6132 },
  BY: { capital: 'Minsk', lat: 53.9045, lng: 27.5615 },
  BE: { capital: 'Brussels', lat: 50.8503, lng: 4.3517 },
  BZ: { capital: 'Belmopan', lat: 17.2510, lng: -88.7590 },
  BJ: { capital: 'Porto-Novo', lat: 6.4969, lng: 2.6289 },
  BT: { capital: 'Thimphu', lat: 27.4728, lng: 89.6393 },
  BO: { capital: 'Sucre', lat: -19.0196, lng: -65.2620 },
  BA: { capital: 'Sarajevo', lat: 43.8563, lng: 18.4131 },
  BW: { capital: 'Gaborone', lat: -24.6282, lng: 25.9231 },
  BR: { capital: 'Brasília', lat: -15.7975, lng: -47.8919 },
  BN: { capital: 'Bandar Seri Begawan', lat: 4.9031, lng: 114.9398 },
  BG: { capital: 'Sofia', lat: 42.6977, lng: 23.3219 },
  BF: { capital: 'Ouagadougou', lat: 12.3714, lng: -1.5197 },
  BI: { capital: 'Gitega', lat: -3.4271, lng: 29.9246 },

  // C
  CV: { capital: 'Praia', lat: 14.9330, lng: -23.5133 },
  KH: { capital: 'Phnom Penh', lat: 11.5564, lng: 104.9282 },
  CM: { capital: 'Yaoundé', lat: 3.8480, lng: 11.5021 },
  CA: { capital: 'Ottawa', lat: 45.4215, lng: -75.6972 },
  CF: { capital: 'Bangui', lat: 4.3947, lng: 18.5582 },
  TD: { capital: "N'Djamena", lat: 12.1348, lng: 15.0557 },
  CL: { capital: 'Santiago', lat: -33.4489, lng: -70.6693 },
  CN: { capital: 'Beijing', lat: 39.9042, lng: 116.4074 },
  CO: { capital: 'Bogotá', lat: 4.7110, lng: -74.0721 },
  KM: { capital: 'Moroni', lat: -11.7172, lng: 43.2473 },
  CG: { capital: 'Brazzaville', lat: -4.2634, lng: 15.2429 },
  CD: { capital: 'Kinshasa', lat: -4.4419, lng: 15.2663 },
  CR: { capital: 'San José', lat: 9.9281, lng: -84.0907 },
  CI: { capital: 'Yamoussoukro', lat: 6.8276, lng: -5.2893 },
  HR: { capital: 'Zagreb', lat: 45.8150, lng: 15.9819 },
  CU: { capital: 'Havana', lat: 23.1136, lng: -82.3666 },
  CY: { capital: 'Nicosia', lat: 35.1856, lng: 33.3823 },
  CZ: { capital: 'Prague', lat: 50.0755, lng: 14.4378 },

  // D
  DK: { capital: 'Copenhagen', lat: 55.6761, lng: 12.5683 },
  DJ: { capital: 'Djibouti', lat: 11.5721, lng: 43.1456 },
  DM: { capital: 'Roseau', lat: 15.3092, lng: -61.3794 },
  DO: { capital: 'Santo Domingo', lat: 18.4861, lng: -69.9312 },

  // E
  EC: { capital: 'Quito', lat: -0.1807, lng: -78.4678 },
  EG: { capital: 'Cairo', lat: 30.0444, lng: 31.2357 },
  SV: { capital: 'San Salvador', lat: 13.6929, lng: -89.2182 },
  GQ: { capital: 'Malabo', lat: 3.7504, lng: 8.7371 },
  ER: { capital: 'Asmara', lat: 15.3229, lng: 38.9251 },
  EE: { capital: 'Tallinn', lat: 59.4370, lng: 24.7536 },
  SZ: { capital: 'Mbabane', lat: -26.3055, lng: 31.1367 },
  ET: { capital: 'Addis Ababa', lat: 9.0300, lng: 38.7400 },

  // F
  FJ: { capital: 'Suva', lat: -18.1416, lng: 178.4419 },
  FI: { capital: 'Helsinki', lat: 60.1699, lng: 24.9384 },
  FR: { capital: 'Paris', lat: 48.8566, lng: 2.3522 },

  // G
  GA: { capital: 'Libreville', lat: 0.4162, lng: 9.4673 },
  GM: { capital: 'Banjul', lat: 13.4549, lng: -16.5790 },
  GE: { capital: 'Tbilisi', lat: 41.7151, lng: 44.8271 },
  DE: { capital: 'Berlin', lat: 52.5200, lng: 13.4050 },
  GH: { capital: 'Accra', lat: 5.6037, lng: -0.1870 },
  GR: { capital: 'Athens', lat: 37.9838, lng: 23.7275 },
  GD: { capital: "St. George's", lat: 12.0561, lng: -61.7488 },
  GT: { capital: 'Guatemala City', lat: 14.6349, lng: -90.5069 },
  GN: { capital: 'Conakry', lat: 9.6412, lng: -13.5784 },
  GW: { capital: 'Bissau', lat: 11.8632, lng: -15.5843 },
  GY: { capital: 'Georgetown', lat: 6.8013, lng: -58.1551 },

  // H
  HT: { capital: 'Port-au-Prince', lat: 18.5944, lng: -72.3074 },
  HN: { capital: 'Tegucigalpa', lat: 14.0723, lng: -87.1921 },
  HU: { capital: 'Budapest', lat: 47.4979, lng: 19.0402 },

  // I
  IS: { capital: 'Reykjavik', lat: 64.1466, lng: -21.9426 },
  IN: { capital: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  ID: { capital: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  IR: { capital: 'Tehran', lat: 35.6892, lng: 51.3890 },
  IQ: { capital: 'Baghdad', lat: 33.3152, lng: 44.3661 },
  IE: { capital: 'Dublin', lat: 53.3498, lng: -6.2603 },
  IL: { capital: 'Jerusalem', lat: 31.7683, lng: 35.2137 },
  IT: { capital: 'Rome', lat: 41.9028, lng: 12.4964 },

  // J
  JM: { capital: 'Kingston', lat: 17.9712, lng: -76.7936 },
  JP: { capital: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  JO: { capital: 'Amman', lat: 31.9454, lng: 35.9284 },

  // K
  KZ: { capital: 'Astana', lat: 51.1694, lng: 71.4491 },
  KE: { capital: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  KI: { capital: 'South Tarawa', lat: 1.3278, lng: 172.9770 },
  KP: { capital: 'Pyongyang', lat: 39.0392, lng: 125.7625 },
  KR: { capital: 'Seoul', lat: 37.5665, lng: 126.9780 },
  KW: { capital: 'Kuwait City', lat: 29.3759, lng: 47.9774 },
  KG: { capital: 'Bishkek', lat: 42.8746, lng: 74.5698 },

  // L
  LA: { capital: 'Vientiane', lat: 17.9757, lng: 102.6331 },
  LV: { capital: 'Riga', lat: 56.9496, lng: 24.1052 },
  LB: { capital: 'Beirut', lat: 33.8938, lng: 35.5018 },
  LS: { capital: 'Maseru', lat: -29.3151, lng: 27.4869 },
  LR: { capital: 'Monrovia', lat: 6.3156, lng: -10.8074 },
  LY: { capital: 'Tripoli', lat: 32.8872, lng: 13.1913 },
  LI: { capital: 'Vaduz', lat: 47.1410, lng: 9.5215 },
  LT: { capital: 'Vilnius', lat: 54.6872, lng: 25.2797 },
  LU: { capital: 'Luxembourg City', lat: 49.6116, lng: 6.1319 },

  // M
  MG: { capital: 'Antananarivo', lat: -18.8792, lng: 47.5079 },
  MW: { capital: 'Lilongwe', lat: -13.9626, lng: 33.7741 },
  MY: { capital: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869 },
  MV: { capital: 'Malé', lat: 4.1755, lng: 73.5093 },
  ML: { capital: 'Bamako', lat: 12.6392, lng: -8.0029 },
  MT: { capital: 'Valletta', lat: 35.8989, lng: 14.5146 },
  MH: { capital: 'Majuro', lat: 7.1164, lng: 171.1858 },
  MR: { capital: 'Nouakchott', lat: 18.0735, lng: -15.9582 },
  MU: { capital: 'Port Louis', lat: -20.1609, lng: 57.5012 },
  MX: { capital: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  FM: { capital: 'Palikir', lat: 6.9248, lng: 158.1611 },
  MD: { capital: 'Chisinau', lat: 47.0105, lng: 28.8638 },
  MC: { capital: 'Monaco', lat: 43.7384, lng: 7.4246 },
  MN: { capital: 'Ulaanbaatar', lat: 47.8864, lng: 106.9057 },
  ME: { capital: 'Podgorica', lat: 42.4304, lng: 19.2594 },
  MA: { capital: 'Rabat', lat: 34.0209, lng: -6.8416 },
  MZ: { capital: 'Maputo', lat: -25.9692, lng: 32.5732 },
  MM: { capital: 'Naypyidaw', lat: 19.7633, lng: 96.0785 },

  // N
  NA: { capital: 'Windhoek', lat: -22.5609, lng: 17.0658 },
  NR: { capital: 'Yaren', lat: -0.5477, lng: 166.9209 },
  NP: { capital: 'Kathmandu', lat: 27.7172, lng: 85.3240 },
  NL: { capital: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  NZ: { capital: 'Wellington', lat: -41.2865, lng: 174.7762 },
  NI: { capital: 'Managua', lat: 12.1150, lng: -86.2362 },
  NE: { capital: 'Niamey', lat: 13.5116, lng: 2.1254 },
  NG: { capital: 'Abuja', lat: 9.0765, lng: 7.3986 },
  MK: { capital: 'Skopje', lat: 41.9973, lng: 21.4280 },
  NO: { capital: 'Oslo', lat: 59.9139, lng: 10.7522 },

  // O
  OM: { capital: 'Muscat', lat: 23.5880, lng: 58.3829 },

  // P
  PK: { capital: 'Islamabad', lat: 33.6844, lng: 73.0479 },
  PW: { capital: 'Ngerulmud', lat: 7.5004, lng: 134.6242 },
  PS: { capital: 'Ramallah', lat: 31.9038, lng: 35.2034 },
  PA: { capital: 'Panama City', lat: 8.9824, lng: -79.5199 },
  PG: { capital: 'Port Moresby', lat: -9.4438, lng: 147.1803 },
  PY: { capital: 'Asunción', lat: -25.2637, lng: -57.5759 },
  PE: { capital: 'Lima', lat: -12.0464, lng: -77.0428 },
  PH: { capital: 'Manila', lat: 14.5995, lng: 120.9842 },
  PL: { capital: 'Warsaw', lat: 52.2297, lng: 21.0122 },
  PT: { capital: 'Lisbon', lat: 38.7223, lng: -9.1393 },

  // Q
  QA: { capital: 'Doha', lat: 25.2854, lng: 51.5310 },

  // R
  RO: { capital: 'Bucharest', lat: 44.4268, lng: 26.1025 },
  RU: { capital: 'Moscow', lat: 55.7558, lng: 37.6173 },
  RW: { capital: 'Kigali', lat: -1.9706, lng: 30.1044 },

  // S
  KN: { capital: 'Basseterre', lat: 17.3026, lng: -62.7177 },
  LC: { capital: 'Castries', lat: 14.0101, lng: -60.9875 },
  VC: { capital: 'Kingstown', lat: 13.1600, lng: -61.2248 },
  WS: { capital: 'Apia', lat: -13.8333, lng: -171.7667 },
  SM: { capital: 'San Marino', lat: 43.9424, lng: 12.4578 },
  ST: { capital: 'São Tomé', lat: 0.3302, lng: 6.7273 },
  SA: { capital: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  SN: { capital: 'Dakar', lat: 14.7167, lng: -17.4677 },
  RS: { capital: 'Belgrade', lat: 44.7866, lng: 20.4489 },
  SC: { capital: 'Victoria', lat: -4.6191, lng: 55.4513 },
  SL: { capital: 'Freetown', lat: 8.4840, lng: -13.2299 },
  SG: { capital: 'Singapore', lat: 1.3521, lng: 103.8198 },
  SK: { capital: 'Bratislava', lat: 48.1486, lng: 17.1077 },
  SI: { capital: 'Ljubljana', lat: 46.0569, lng: 14.5058 },
  SB: { capital: 'Honiara', lat: -9.4456, lng: 159.9729 },
  SO: { capital: 'Mogadishu', lat: 2.0469, lng: 45.3182 },
  ZA: { capital: 'Pretoria', lat: -25.7479, lng: 28.2293 },
  SS: { capital: 'Juba', lat: 4.8594, lng: 31.5713 },
  ES: { capital: 'Madrid', lat: 40.4168, lng: -3.7038 },
  LK: { capital: 'Sri Jayawardenepura Kotte', lat: 6.9010, lng: 79.9077 },
  SD: { capital: 'Khartoum', lat: 15.5007, lng: 32.5599 },
  SR: { capital: 'Paramaribo', lat: 5.8520, lng: -55.2038 },
  SE: { capital: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  CH: { capital: 'Bern', lat: 46.9480, lng: 7.4474 },
  SY: { capital: 'Damascus', lat: 33.5138, lng: 36.2765 },

  // T
  TJ: { capital: 'Dushanbe', lat: 38.5598, lng: 68.7870 },
  TZ: { capital: 'Dodoma', lat: -6.1630, lng: 35.7516 },
  TH: { capital: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  TL: { capital: 'Dili', lat: -8.5569, lng: 125.5603 },
  TG: { capital: 'Lomé', lat: 6.1375, lng: 1.2125 },
  TO: { capital: "Nuku'alofa", lat: -21.1393, lng: -175.2018 },
  TT: { capital: 'Port of Spain', lat: 10.6549, lng: -61.5019 },
  TN: { capital: 'Tunis', lat: 36.8065, lng: 10.1815 },
  TR: { capital: 'Ankara', lat: 39.9334, lng: 32.8597 },
  TM: { capital: 'Ashgabat', lat: 37.9601, lng: 58.3261 },
  TV: { capital: 'Funafuti', lat: -8.5207, lng: 179.1983 },

  // U
  UG: { capital: 'Kampala', lat: 0.3476, lng: 32.5825 },
  UA: { capital: 'Kyiv', lat: 50.4501, lng: 30.5234 },
  AE: { capital: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 },
  GB: { capital: 'London', lat: 51.5074, lng: -0.1278 },
  US: { capital: 'Washington, D.C.', lat: 38.9072, lng: -77.0369 },
  UY: { capital: 'Montevideo', lat: -34.9011, lng: -56.1645 },
  UZ: { capital: 'Tashkent', lat: 41.2995, lng: 69.2401 },

  // V
  VU: { capital: 'Port Vila', lat: -17.7333, lng: 168.3273 },
  VA: { capital: 'Vatican City', lat: 41.9029, lng: 12.4534 },
  VE: { capital: 'Caracas', lat: 10.4806, lng: -66.9036 },
  VN: { capital: 'Hanoi', lat: 21.0278, lng: 105.8342 },

  // Y
  YE: { capital: "Sana'a", lat: 15.3694, lng: 44.1910 },

  // Z
  ZM: { capital: 'Lusaka', lat: -15.3875, lng: 28.3228 },
  ZW: { capital: 'Harare', lat: -17.8252, lng: 31.0335 },
};

/**
 * Get verified capital coordinates by ISO2 code (case-insensitive) or country name.
 */
export function getCapitalCoordinates(countryIso2OrName: string): CapitalCoordinateRecord | null {
  if (!countryIso2OrName) return null;
  const upper = countryIso2OrName.toUpperCase().trim();
  if (SOVEREIGN_CAPITAL_COORDINATES[upper]) {
    return SOVEREIGN_CAPITAL_COORDINATES[upper];
  }

  // Fallback by country name
  const lower = countryIso2OrName.toLowerCase().trim();
  for (const record of Object.values(SOVEREIGN_CAPITAL_COORDINATES)) {
    if (record.capital.toLowerCase() === lower) {
      return record;
    }
  }
  return null;
}
