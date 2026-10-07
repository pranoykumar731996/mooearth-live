import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchGlobalWeatherHighlights } from '@/services/weatherService';
import GlobalWeatherTemplate from '@/components/Weather/GlobalWeatherTemplate';
import {
  SUPPORTED_LOCALES,
  SupportedLocale,
  isSupportedLocale,
  getTranslation,
  generateHreflangs,
  getCanonicalUrl,
} from '@/lib/i18n';

export const revalidate = 600; // 10 minutes cache

interface LocalizedWeatherProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedWeatherProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const title = dict.weather.title;
  const description = dict.weather.description;
  const canonicalUrl = getCanonicalUrl('/weather', lang);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/weather'),
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
          alt: `${dict.weather.h1} — MooEarth Live`,
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

export default async function LocalizedWeatherPage({ params }: LocalizedWeatherProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const stations = await fetchGlobalWeatherHighlights();

  return (
    <GlobalWeatherTemplate
      currentPath="/weather"
      title={dict.weather.h1}
      subtitle={dict.weather.summary}
      badgeText={dict.weather.badge}
      stations={stations}
      locale={lang as SupportedLocale}
    />
  );
}
