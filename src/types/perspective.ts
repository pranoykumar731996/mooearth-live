export interface PerspectiveArticle {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  snippet?: string;
  geoLevel?: 'city' | 'state' | 'national' | 'international';
}

export interface PerspectiveComparison {
  commonFacts: string[];
  localFocus: string[]; // Keep for compatibility (maps to nationalFocus)
  globalFocus: string[]; // Keep for compatibility (maps to globalFocus)
  cityFocus?: string[];
  stateFocus?: string[];
  nationalFocus?: string[];
  missingContext: string[];
  similarityScore: 'Low' | 'Medium' | 'High';
}

export interface PerspectiveResult extends PerspectiveComparison {
  localArticles: PerspectiveArticle[]; // Keep for compatibility
  globalArticles: PerspectiveArticle[]; // Keep for compatibility
  cityArticles?: PerspectiveArticle[];
  stateArticles?: PerspectiveArticle[];
  nationalArticles?: PerspectiveArticle[];
  country: string;
  topic: string;
  locationId?: string;
  locationName?: string;
  locationType?: string;
}
