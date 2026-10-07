import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchWorldNewsMapData } from '@/services/worldNewsService';
import WorldNewsMapTemplate, { WorldNewsTemplateConfig } from '@/components/News/WorldNewsMapTemplate';
import {
  SUPPORTED_LOCALES,
  SupportedLocale,
  isSupportedLocale,
  getTranslation,
  generateHreflangs,
  getCanonicalUrl,
} from '@/lib/i18n';

export const revalidate = 60; // 1 minute cache for live wire freshness

interface LocalizedWorldNewsProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedWorldNewsProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const title = dict.worldNews.title;
  const description = dict.worldNews.description;
  const canonicalUrl = getCanonicalUrl('/world-news', lang);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/world-news'),
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
          alt: `${dict.worldNews.h1} — MooEarth Live`,
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

export default async function LocalizedWorldNewsPage({ params }: LocalizedWorldNewsProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const data = await fetchWorldNewsMapData();
  const canonicalUrl = getCanonicalUrl('/world-news', lang);

  const config: WorldNewsTemplateConfig = {
    title: dict.worldNews.title,
    metaDescription: dict.worldNews.description,
    h1: dict.worldNews.h1,
    badge: dict.worldNews.badge,
    canonicalUrl,
    currentRouteSlug: 'world-news',
    heroSummary: dict.worldNews.summary,
  };

  return (
    <WorldNewsMapTemplate
      config={config}
      data={data}
      locale={lang as SupportedLocale}
    />
  );
}
