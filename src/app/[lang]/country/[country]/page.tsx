import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomePage from '../../../page';
import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  getTranslation,
  generateHreflangs,
  getLocalizedCountryName,
  LOCALES_META,
} from '@/lib/i18n';
import { COUNTRY_COORDINATES } from '@/lib/constants';

interface LocalizedCountryPageProps {
  params: Promise<{
    lang: string;
    country: string;
  }>;
}

const COUNTRY_INFO: Record<string, { capital: string; pop: string }> = {
  spain: { capital: 'Madrid', pop: '47.4M' },
  brazil: { capital: 'Brasília', pop: '203.1M' },
  argentina: { capital: 'Buenos Aires', pop: '46.2M' },
  'united kingdom': { capital: 'London', pop: '67.0M' },
  england: { capital: 'London', pop: '67.0M' },
  germany: { capital: 'Berlin', pop: '84.3M' },
  france: { capital: 'Paris', pop: '68.0M' },
  italy: { capital: 'Rome', pop: '58.9M' },
  portugal: { capital: 'Lisbon', pop: '10.3M' },
  netherlands: { capital: 'Amsterdam', pop: '17.7M' },
  belgium: { capital: 'Brussels', pop: '11.6M' },
  croatia: { capital: 'Zagreb', pop: '3.9M' },
  uruguay: { capital: 'Montevideo', pop: '3.4M' },
  colombia: { capital: 'Bogotá', pop: '51.5M' },
  mexico: { capital: 'Mexico City', pop: '127.5M' },
  'united states': { capital: 'Washington D.C.', pop: '333.3M' },
  usa: { capital: 'Washington D.C.', pop: '333.3M' },
  japan: { capital: 'Tokyo', pop: '125.1M' },
  'south korea': { capital: 'Seoul', pop: '51.7M' },
  morocco: { capital: 'Rabat', pop: '37.5M' },
  senegal: { capital: 'Dakar', pop: '17.3M' },
  canada: { capital: 'Ottawa', pop: '38.9M' },
  australia: { capital: 'Canberra', pop: '25.6M' },
  china: { capital: 'Beijing', pop: '1.41B' },
  india: { capital: 'New Delhi', pop: '1.43B' },
};

export async function generateMetadata({ params }: LocalizedCountryPageProps): Promise<Metadata> {
  const { lang, country: rawCountry } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const decodedCountry = decodeURIComponent(rawCountry).toLowerCase();
  const localizedName = getLocalizedCountryName(decodedCountry, lang);
  const dict = getTranslation(lang);
  const title = dict.countryHub.titleTemplate(localizedName);
  const description = dict.countryHub.descriptionTemplate(localizedName);
  const canonicalUrl = `https://www.mooearth.live/${lang}/country/${encodeURIComponent(decodedCountry)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs(`/country/${encodeURIComponent(decodedCountry)}`),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale: lang,
      type: 'website',
      siteName: 'MooEarth Live',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function LocalizedCountryPage({ params }: LocalizedCountryPageProps) {
  const { lang, country: rawCountry } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const decoded = decodeURIComponent(rawCountry);
  const key = decoded.toLowerCase();
  const capitalized = decoded.charAt(0).toUpperCase() + decoded.slice(1);
  const localizedName = getLocalizedCountryName(key, lang);
  const dict = getTranslation(lang);
  const meta = LOCALES_META[lang];
  const info = COUNTRY_INFO[key] || { capital: 'Capital City', pop: 'N/A' };

  // Localized JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: localizedName,
    alternateName: capitalized,
    description: dict.countryHub.descriptionTemplate(localizedName),
    inLanguage: lang,
    containedInPlace: {
      '@type': 'Place',
      name: 'Earth',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: localizedName,
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: dict.countryHub.capitalLabel,
        value: info.capital,
      },
      {
        '@type': 'PropertyValue',
        name: dict.countryHub.populationLabel,
        value: info.pop,
      },
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: dict.nav.home,
        item: `https://www.mooearth.live/${lang}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: localizedName,
        item: `https://www.mooearth.live/${lang}/country/${encodeURIComponent(key)}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div dir={meta.dir} lang={lang} className="contents">
        <HomePage initialCountry={capitalized} />
      </div>
    </>
  );
}
