import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HomePage from '../page';
import { SUPPORTED_LOCALES, isSupportedLocale, getTranslation, generateHreflangs, LOCALES_META } from '@/lib/i18n';

interface LocalizedPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  // Pre-render the 7 international locales (en is handled by root /)
  return SUPPORTED_LOCALES.filter((l) => l !== 'en').map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LocalizedPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    return {};
  }

  const dict = getTranslation(lang);
  const meta = LOCALES_META[lang];
  const title = `${dict.hero.title} — ${dict.hero.subtitle}`;
  const description = dict.hero.tagline;
  const canonicalUrl = `https://www.mooearth.live/${lang}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: generateHreflangs(''),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'MooEarth Live',
      locale: lang,
      type: 'website',
      images: [
        {
          url: 'https://www.mooearth.live/globe-preview.png',
          width: 1200,
          height: 630,
          alt: `${title} — 3D Earth Globe`,
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

export default async function LocalizedHomePage({ params }: LocalizedPageProps) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) {
    notFound();
  }

  const dict = getTranslation(lang);
  const meta = LOCALES_META[lang];

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: dict.hero.title,
    alternateName: dict.hero.subtitle,
    url: `https://www.mooearth.live/${lang}`,
    inLanguage: lang,
    description: dict.hero.tagline,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <div dir={meta.dir} lang={lang} className="contents">
        <HomePage />
      </div>
    </>
  );
}
