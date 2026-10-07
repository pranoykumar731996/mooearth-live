import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import HomePage from '../../../page';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import {
  SUPPORTED_LOCALES,
  SupportedLocale,
  isSupportedLocale,
  getTranslation,
  generateHreflangs,
  getLocalizedPath,
  getCanonicalUrl,
  getLocalizedCountryName,
  LOCALES_META,
} from '@/lib/i18n';
import { getCountryBySlug } from '@/data/countries';

interface LocalizedCountryPageProps {
  params: Promise<{
    lang: string;
    country: string;
  }>;
}

const TOP_FEATURED_COUNTRIES = [
  'spain',
  'brazil',
  'argentina',
  'united-kingdom',
  'germany',
  'france',
  'italy',
  'portugal',
  'japan',
  'india',
  'united-states',
  'egypt',
  'saudi-arabia',
  'mexico',
  'canada',
  'australia',
];

export async function generateStaticParams() {
  const params: Array<{ lang: string; country: string }> = [];
  for (const lang of SUPPORTED_LOCALES) {
    for (const country of TOP_FEATURED_COUNTRIES) {
      params.push({ lang, country });
    }
  }
  return params;
}

export async function generateMetadata({ params }: LocalizedCountryPageProps): Promise<Metadata> {
  const { lang, country: rawCountry } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const decodedCountry = decodeURIComponent(rawCountry).toLowerCase().replace(/\s+/g, '-');
  const localizedName = getLocalizedCountryName(decodedCountry, lang);
  const dict = getTranslation(lang);
  const title = dict.countryHub.titleTemplate(localizedName);
  const description = dict.countryHub.descriptionTemplate(localizedName);
  const canonicalUrl = getCanonicalUrl(`/country/${encodeURIComponent(decodedCountry)}`, lang);

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
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${localizedName} — MooEarth Live`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.mooearth.live/icons/icon-512.png'],
    },
  };
}

export default async function LocalizedCountryPage({ params }: LocalizedCountryPageProps) {
  const { lang, country: rawCountry } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const decoded = decodeURIComponent(rawCountry).toLowerCase().replace(/\s+/g, '-');
  const countryRecord = getCountryBySlug(decoded);
  const localizedName = getLocalizedCountryName(decoded, lang);
  const dict = getTranslation(lang);
  const meta = LOCALES_META[lang];

  const capital = countryRecord?.capital || 'Capital City';
  const population = countryRecord?.population || 'N/A';
  const region = countryRecord?.region || 'Global';
  const flag = countryRecord?.flag || '🌍';

  const canonicalUrl = getCanonicalUrl(`/country/${encodeURIComponent(decoded)}`, lang);
  const homeUrl = getCanonicalUrl('/', lang);
  const worldMapUrl = getCanonicalUrl('/world-map', lang);

  // Localized JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: localizedName,
    alternateName: countryRecord?.name || decoded,
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
        value: capital,
      },
      {
        '@type': 'PropertyValue',
        name: dict.countryHub.populationLabel,
        value: population,
      },
      {
        '@type': 'PropertyValue',
        name: dict.countryHub.regionLabel,
        value: region,
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
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: dict.nav.worldMap,
        item: worldMapUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: localizedName,
        item: canonicalUrl,
      },
    ],
  };

  const capitalizedForGlobe = decoded.charAt(0).toUpperCase() + decoded.slice(1);

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

      <div dir={meta.dir} lang={lang} className="min-h-screen bg-[#030308] text-white flex flex-col font-sans">
        {/* Localized Header & Breadcrumbs */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href={getLocalizedPath('/', lang)} className="hover:text-emerald-400 transition-colors">
              {dict.nav.home}
            </Link>
            <span>/</span>
            <Link href={getLocalizedPath('/world-map', lang)} className="hover:text-emerald-400 transition-colors">
              {dict.nav.worldMap}
            </Link>
            <span>/</span>
            <span className="text-white/80 font-medium">{localizedName}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl" role="img" aria-label={localizedName}>
                  {flag}
                </span>
                <span className="text-emerald-400 text-xs font-mono tracking-widest uppercase font-semibold">
                  {region}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-400">
                {localizedName}
              </h1>
            </div>

            {/* Quick Country Stats Grid */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/70">
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/40 block text-[10px] uppercase">{dict.countryHub.capitalLabel}</span>
                <span className="font-semibold text-white">{capital}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/40 block text-[10px] uppercase">{dict.countryHub.populationLabel}</span>
                <span className="font-semibold text-white">{population}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={getLocalizedPath(`/weather/${decoded}`, lang)}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-semibold transition-colors"
                >
                  {dict.countryHub.weatherForecastLabel} &rarr;
                </Link>
                <Link
                  href={getLocalizedPath('/country-quiz', lang)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                >
                  {dict.countryHub.playCountryQuiz} &rarr;
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* 3D Interactive Globe Orbit */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 space-y-8">
          <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
            <HomePage initialCountry={capitalizedForGlobe} />
          </div>
        </main>

        <GlobalFooter locale={lang} />
      </div>
    </>
  );
}
