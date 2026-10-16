// ============================================================
// MooEarth Live — Planetary Science Engine: Types
// ============================================================

import { EventCategory, PlanetaryTelemetry, WorldEvent } from '@/types';

/** USGS GeoJSON Feature format */
export interface UsgsEarthquakeFeature {
  type: 'Feature';
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    updated: number;
    tz: number | null;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: 'green' | 'yellow' | 'orange' | 'red' | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number | null;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lng, lat, depthKm]
  };
}

export interface UsgsGeoJsonResponse {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: UsgsEarthquakeFeature[];
}

/** NASA EONET v3 Event format */
export interface NasaEonetCategory {
  id: string;
  title: string;
}

export interface NasaEonetSource {
  id: string;
  url: string;
}

export interface NasaEonetGeometry {
  magnitudeValue: number | null;
  magnitudeUnit: string | null;
  date: string;
  type: 'Point' | 'Polygon';
  coordinates: number[] | number[][]; // [lng, lat] for Point
}

export interface NasaEonetEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  closed: string | null;
  categories: NasaEonetCategory[];
  sources: NasaEonetSource[];
  geometry: NasaEonetGeometry[];
}

export interface NasaEonetResponse {
  title: string;
  description: string;
  link: string;
  events: NasaEonetEvent[];
}

/** NOAA SWPC Space Weather format */
export interface NoaaSwpcKpRecord {
  time_tag: string;
  kp_index: number;
  estimated_kp: number;
  kp: string;
}

/** Unified Planetary Event extending WorldEvent */
export interface PlanetaryEvent extends WorldEvent {
  planetaryTelemetry: PlanetaryTelemetry;
  dataOrigin: 'usgs' | 'nasa_eonet' | 'noaa_swpc' | 'nasa_earth_obs' | 'noaa_severe';
}

