// ============================================================
// MooEarth Live — Geographic Places Architecture
// ============================================================
// Scalable hierarchy for world geographic entities beyond countries.

export type PlaceType =
  | 'city'
  | 'state'
  | 'region'
  | 'continent'
  | 'ocean'
  | 'island'
  | 'mountain'
  | 'landmark';

export interface PlaceCoordinates {
  lat: number;
  lng: number;
}

export interface PlaceRecord {
  id: string;
  name: string;
  slug: string;
  type: PlaceType;
  country: string;
  countrySlug: string;
  countryCode: string;
  state?: string;
  stateSlug?: string;
  region?: string;
  coordinates: PlaceCoordinates;
  population?: number;
  elevationMeters?: number;
  areaKm2?: number;
  timezone?: string;
  adminLevel: 0 | 1 | 2; // 0 = country/supranational, 1 = state/province/region, 2 = city/landmark
  aliases?: string[];
  description?: string;
  geography?: string;
}

export interface CityRecord extends PlaceRecord {
  type: 'city';
  isCapital?: boolean;
  majorCityOfCountry?: boolean;
}

export interface StateRecord extends PlaceRecord {
  type: 'state';
  capitalCity?: string;
}

export interface LandmarkRecord extends PlaceRecord {
  type: 'landmark';
  designatedYear?: number;
  landmarkType?: 'natural' | 'cultural' | 'historical';
}

export interface MountainRecord extends PlaceRecord {
  type: 'mountain';
  elevationMeters: number;
  mountainRange?: string;
}
