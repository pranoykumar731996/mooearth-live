import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DailyChallengeClient from '@/components/Daily/DailyChallengeClient';
import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  getTranslation,
  generateHreflangs,
  getCanonicalUrl,
  LOCALES_META,
} from '@/lib/i18n';

interface LocalizedDailyPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedDailyPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const title = `${dict.daily.title} | MooEarth Live`;
  const description = dict.daily.subtitle;
  const canonicalUrl = getCanonicalUrl('/daily', lang);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/daily'),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale: lang,
      siteName: 'MooEarth Live',
      type: 'website',
      images: [
        {
          url: 'https://www.mooearth.live/globe-preview.png',
          width: 1200,
          height: 630,
          alt: `${title} — World News & Geography Trivia`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.mooearth.live/globe-preview.png'],
    },
  };
}

export default async function LocalizedDailyPage({ params }: LocalizedDailyPageProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const meta = LOCALES_META[lang];
  const canonicalUrl = getCanonicalUrl('/daily', lang);
  const homeUrl = getCanonicalUrl('/', lang);

  const breadcrumbsJsonLd = {
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
        name: dict.daily.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <div dir={meta.dir} lang={lang} className="min-h-screen bg-[#060814] text-white">
        <DailyChallengeClient locale={lang} />
      </div>
    </>
  );
}
