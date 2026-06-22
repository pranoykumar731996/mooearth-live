export interface PublisherMap {
  [key: string]: {
    name: string;
    domains: string[];
    queryOperator: string;
  };
}

export const WHITELISTED_COUNTRIES = [
  'india',
  'usa',
  'united states',
  'japan',
  'brazil',
  'uk',
  'united kingdom'
];

export const COUNTRY_PUBLISHERS: PublisherMap = {
  india: {
    name: 'India',
    domains: ['thehindu.com', 'indianexpress.com', 'timesofindia.indiatimes.com', 'hindustantimes.com'],
    queryOperator: '(site:thehindu.com OR site:indianexpress.com OR site:timesofindia.indiatimes.com OR site:hindustantimes.com)'
  },
  japan: {
    name: 'Japan',
    domains: ['japantimes.co.jp', 'asahi.com', 'mainichi.jp', 'yomiuri.co.jp'],
    queryOperator: '(site:japantimes.co.jp OR site:asahi.com OR site:mainichi.jp OR site:yomiuri.co.jp)'
  },
  brazil: {
    name: 'Brazil',
    domains: ['folha.uol.com.br', 'oglobo.globo.com', 'estadao.com.br'],
    queryOperator: '(site:folha.uol.com.br OR site:oglobo.globo.com OR site:estadao.com.br)'
  },
  china: {
    name: 'China',
    domains: ['xinhuanet.com', 'chinadaily.com.cn', 'globaltimes.cn'],
    queryOperator: '(site:xinhuanet.com OR site:chinadaily.com.cn OR site:globaltimes.cn)'
  },
  usa: {
    name: 'United States',
    domains: ['nytimes.com', 'washingtonpost.com', 'wsj.com'],
    queryOperator: '(site:nytimes.com OR site:washingtonpost.com OR site:wsj.com)'
  },
  'united states': {
    name: 'United States',
    domains: ['nytimes.com', 'washingtonpost.com', 'wsj.com'],
    queryOperator: '(site:nytimes.com OR site:washingtonpost.com OR site:wsj.com)'
  },
  uk: {
    name: 'United Kingdom',
    domains: ['bbc.co.uk', 'theguardian.com', 'telegraph.co.uk'],
    queryOperator: '(site:bbc.co.uk OR site:theguardian.com OR site:telegraph.co.uk)'
  },
  'united kingdom': {
    name: 'United Kingdom',
    domains: ['bbc.co.uk', 'theguardian.com', 'telegraph.co.uk'],
    queryOperator: '(site:bbc.co.uk OR site:theguardian.com OR site:telegraph.co.uk)'
  },
  germany: {
    name: 'Germany',
    domains: ['spiegel.de', 'zeit.de', 'dw.com'],
    queryOperator: '(site:spiegel.de OR site:zeit.de OR site:dw.com)'
  }
};

export const GLOBAL_PUBLISHERS = {
  domains: ['reuters.com', 'apnews.com', 'bbc.com', 'afp.com', 'aljazeera.com', 'dw.com'],
  queryOperator: '(site:reuters.com OR site:apnews.com OR site:bbc.com OR site:afp.com OR site:aljazeera.com OR site:dw.com)'
};

/**
 * Checks if a country is enabled for the Perspective Lens feature.
 */
export function isCountryWhitelisted(countryName: string): boolean {
  if (!countryName) return false;
  return true;
}

/**
 * Returns publishers config for a country if it exists, or undefined.
 */
export function getCountryPublishers(countryName: string) {
  if (!countryName) return undefined;
  const key = countryName.trim().toLowerCase();
  return COUNTRY_PUBLISHERS[key];
}
