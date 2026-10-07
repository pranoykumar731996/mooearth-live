import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import InteractiveWorldMapAtlas from '@/components/Map/InteractiveWorldMapAtlas';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  getTranslation,
  generateHreflangs,
  getLocalizedPath,
  getCanonicalUrl,
  LOCALES_META,
} from '@/lib/i18n';

interface LocalizedWorldMapProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedWorldMapProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const title = dict.worldMap.title;
  const description = dict.worldMap.description;
  const canonicalUrl = getCanonicalUrl('/world-map', lang);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/world-map'),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'MooEarth Live',
      locale: lang,
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${dict.worldMap.h1} — MooEarth Live`,
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

export default async function LocalizedWorldMapPage({ params }: LocalizedWorldMapProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const meta = LOCALES_META[lang];
  const canonicalUrl = getCanonicalUrl('/world-map', lang);
  const homeUrl = getCanonicalUrl('/', lang);
  const homePath = getLocalizedPath('/', lang);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: dict.nav.home, item: homeUrl },
      { '@type': 'ListItem', position: 2, name: dict.worldMap.h1, item: canonicalUrl },
    ],
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: dict.worldMap.title,
    url: canonicalUrl,
    description: dict.worldMap.description,
    inLanguage: lang,
    isPartOf: {
      '@type': 'WebSite',
      name: 'MooEarth Live',
      url: homeUrl,
    },
    about: {
      '@type': 'Thing',
      name: dict.worldMap.h1,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <div dir={meta.dir} lang={lang} className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        {/* Navigation Breadcrumbs & Hero Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href={homePath} className="hover:text-emerald-400 transition-colors">{dict.nav.home}</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">{dict.worldMap.h1}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-emerald-400 text-xs font-mono tracking-widest uppercase font-semibold block mb-1">
                {dict.worldMap.badge}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-400">
                {dict.worldMap.h1}
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              {dict.worldMap.summary}
            </p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Interactive Map Atlas Component */}
          <section aria-label="Interactive World Map Explorer">
            <InteractiveWorldMapAtlas locale={lang} initialRegion="All" />
          </section>

          {/* Regional Continental Breakdown */}
          <section className="space-y-6 pt-6 border-t border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white">{dict.worldMap.regionsTitle}</h2>
              <p className="text-xs text-white/60">{dict.worldMap.regionsDesc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-2xl mb-2 block">🌍</span>
                <h3 className="text-base font-bold text-white mb-1">{dict.worldMap.regionAfricaEuropeTitle}</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {dict.worldMap.regionAfricaEuropeText}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-2xl mb-2 block">🌏</span>
                <h3 className="text-base font-bold text-white mb-1">{dict.worldMap.regionAsiaOceaniaTitle}</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {dict.worldMap.regionAsiaOceaniaText}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="text-2xl mb-2 block">🌎</span>
                <h3 className="text-base font-bold text-white mb-1">{dict.worldMap.regionAmericasTitle}</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {dict.worldMap.regionAmericasText}
                </p>
              </div>
            </div>
          </section>

          {/* Cross-Platform Navigation & 3D Globe CTA */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">{dict.worldMap.globeCtaTitle}</h3>
              <p className="text-xs text-white/60 mt-0.5">
                {dict.worldMap.globeCtaDesc}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={homePath}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
              >
                {dict.worldMap.globeCtaBtn} &rarr;
              </Link>
              <Link
                href={getLocalizedPath('/games', lang)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white/80 hover:text-white text-xs transition-colors"
              >
                {dict.nav.games} &rarr;
              </Link>
            </div>
          </section>
        </main>

        <GlobalFooter locale={lang} />
      </div>
    </>
  );
}
