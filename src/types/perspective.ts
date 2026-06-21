export interface PerspectiveArticle {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  snippet?: string;
}

export interface PerspectiveComparison {
  commonFacts: string[];
  localFocus: string[];
  globalFocus: string[];
  missingContext: string[];
  similarityScore: 'Low' | 'Medium' | 'High';
}

export interface PerspectiveResult extends PerspectiveComparison {
  localArticles: PerspectiveArticle[];
  globalArticles: PerspectiveArticle[];
  country: string;
  topic: string;
}
