// ============================================================
// MooEarth Live — Astronomical Solar Terminator & Day/Night Engine
// ============================================================
// High-precision astronomical solar position & day/night terminator polygon generator:
// - Calculates exact sub-solar point (latitude & longitude) based on current UTC time & Julian epoch
// - Computes solar zenith angle cosine across all longitudes & latitudes
// - Generates smooth GeoJSON polygon representing the nighttime hemisphere
// - Drives the Day/Night visual blend matching Zoom Earth & Windy satellite views

export interface SubSolarPoint {
  lat: number;
  lng: number;
}

/**
 * Calculates current sub-solar point (latitude & longitude on Earth where sun is directly overhead)
 */
export function getSubSolarPoint(date: Date = new Date()): SubSolarPoint {
  const timeMs = date.getTime();
  // Days since J2000.0 epoch (2000-01-01 12:00:00 UTC)
  const d = (timeMs - 946728000000) / 86400000;

  // Mean solar longitude (degrees)
  const L = (280.460 + 0.9856474 * d) % 360;

  // Mean solar anomaly (radians)
  const g = ((357.528 + 0.9856003 * d) % 360) * (Math.PI / 180);

  // Ecliptic longitude of the sun (radians)
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * (Math.PI / 180);

  // Obliquity of the ecliptic (radians)
  const eps = (23.439 - 0.0000004 * d) * (Math.PI / 180);

  // Solar declination (latitude on Earth, degrees)
  const deltaRad = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const lat = deltaRad * (180 / Math.PI);

  // Sub-solar longitude: at solar noon (12:00 UTC), sun is at prime meridian (0°).
  // Earth rotates 15° per hour to the east.
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const lng = ((12 - utcHours) * 15 + 540) % 360 - 180;

  return { lat, lng };
}

/**
 * Computes cosine of solar zenith angle for a given location on Earth.
 * > 0.05: Daylight
 * < -0.05: Night
 * [-0.05, 0.05]: Twilight Terminator
 */
export function getSolarZenithCos(lng: number, lat: number, subSolar: SubSolarPoint): number {
  const rad = Math.PI / 180;
  const latRad = lat * rad;
  const solLatRad = subSolar.lat * rad;
  const deltaLngRad = (lng - subSolar.lng) * rad;

  return Math.sin(latRad) * Math.sin(solLatRad) + Math.cos(latRad) * Math.cos(solLatRad) * Math.cos(deltaLngRad);
}

/**
 * Generates GeoJSON polygon of the nighttime hemisphere.
 * In Northern winter (subSolar.lat < 0), the North Pole is dark.
 * In Southern winter (subSolar.lat > 0), the South Pole is dark.
 */
export function getNightTerminatorGeoJSON(date: Date = new Date()): any {
  const subSolar = getSubSolarPoint(date);
  const rad = Math.PI / 180;
  const deltaRad = subSolar.lat * rad;
  const tanDelta = Math.tan(deltaRad);
  const isNorthernNight = subSolar.lat < 0;

  const coords: [number, number][] = [];
  const step = 2.0; // 2-degree resolution yields 181 points for ultra-smooth rendering

  for (let lon = -180; lon <= 180; lon += step) {
    const lonDiffRad = (lon - subSolar.lng) * rad;
    let latRad = 0;
    if (Math.abs(tanDelta) > 1e-6) {
      latRad = Math.atan(-Math.cos(lonDiffRad) / tanDelta);
    }
    const latDeg = Math.max(-85, Math.min(85, latRad / rad));
    coords.push([lon, latDeg]);
  }

  // Close the polygon through the dark pole
  if (isNorthernNight) {
    coords.push([180, 85.0]);
    coords.push([-180, 85.0]);
  } else {
    coords.push([180, -85.0]);
    coords.push([-180, -85.0]);
  }
  coords.push(coords[0]);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        properties: {
          subSolarLat: subSolar.lat,
          subSolarLng: subSolar.lng,
          timestampMs: date.getTime(),
        },
      },
    ],
  };
}
