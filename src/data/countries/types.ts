// ============================================================
// MooEarth Live — Canonical Country Hub Engine Data Types
// ============================================================

export interface CountryCoordinates {
  lat: number;
  lng: number;
}

export interface CountryRecord {
  /** Unique normalized ID (ISO2 code lowercase, e.g. "in", "us", "jp") */
  id: string;
  /** Official common name (e.g. "India", "United States", "Japan") */
  name: string;
  /** SEO URL slug (e.g. "india", "united-states", "japan") */
  slug: string;
  /** ISO 3166-1 alpha-2 code uppercase (e.g. "IN", "US", "JP") */
  iso2: string;
  /** ISO 3166-1 alpha-3 code uppercase (e.g. "IND", "USA", "JPN") */
  iso3: string;
  /** Capital city (e.g. "New Delhi", "Washington D.C.", "Tokyo") */
  capital: string;
  /** Continent / Region (e.g. "Asia", "North America", "Europe") */
  region: string;
  /** Subregion (e.g. "Southern Asia", "Western Europe") */
  subregion: string;
  /** Geographic centroid coordinates */
  coordinates: CountryCoordinates;
  /** Population estimate (e.g. "1.43 billion", "333 million") */
  population: string;
  /** Area in square kilometers */
  areaKm2: number;
  /** Currency name and symbol */
  currency: string;
  /** Official / primary languages */
  languages: string;
  /** Emoji flag */
  flag: string;
  /** Real major cities (at least 2-5 real cities) */
  majorCities: string[];
  /** Factual geography & terrain summary */
  geography: string;
  /** Prominent physical or cultural landmark */
  landmark: string;
  /** Climate classification */
  climate: string;
  /** Factual interesting geographical or cultural fact */
  funFact: string;
  /** Neighboring or regional countries */
  neighbours: string[];
  /** Related country slugs for internal linking */
  relatedSlugs: string[];
}
