import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchMajorWorldEvents } from '@/services/worldEventsService';
import { shouldIndexEventPage } from '@/lib/seo/eventQualityGate';
import WorldEventsTemplate from '@/components/Events/WorldEventsTemplate';
import {
  SUPPORTED_LOCALES,
  SupportedLocale,
  isSupportedLocale,
  getTranslation,
  generateHreflangs,
  getCanonicalUrl,
} from '@/lib/i18n';

export const revalidate = 60; // 60 seconds cache

interface LocalizedWorldEventsProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedWorldEventsProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const eventsData = await fetchMajorWorldEvents();
  const gateResult = shouldIndexEventPage(eventsData.events);
  const canonicalUrl = getCanonicalUrl('/world-events', lang);
  const title = dict.worldEvents.title;
  const description = dict.worldEvents.description;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs('/world-events'),
    },
    robots: gateResult.robotsDirective,
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
          alt: `${dict.worldEvents.h1} — MooEarth Live`,
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

export default async function LocalizedWorldEventsPage({ params }: LocalizedWorldEventsProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const eventsData = await fetchMajorWorldEvents();

  return (
    <WorldEventsTemplate
      currentPath="/world-events"
      title={dict.worldEvents.h1}
      subtitle={dict.worldEvents.summary}
      badgeText={dict.worldEvents.badge}
      events={eventsData.events}
      locale={lang as SupportedLocale}
    />
  );
}
