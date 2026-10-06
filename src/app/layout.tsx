// ============================================================
// MooEarth Live — Root Layout
// ============================================================

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { BRANDING } from '@/config/branding';
import { generateHreflangs } from '@/lib/i18n';
import SentryInitializer from '@/components/UI/SentryInitializer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mooearth.live'),
  title: {
    default: BRANDING.title,
    template: '%s | MooEarth Live',
  },
  description: BRANDING.description,
  keywords: [
    BRANDING.name,
    BRANDING.shortName,
    'Moo Earth',
    'mooearth',
    'live globe',
    '3D map',
    'world explorer',
    'geography game',
    'world trivia',
    'daily earth challenge',
    'interactive globe',
    'explore earth',
    'world news',
    'world map',
    'live events',
  ],
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://www.mooearth.live',
    languages: generateHreflangs(''),
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-512.png',
  },
  openGraph: {
    title: BRANDING.title,
    description: BRANDING.description,
    type: 'website',
    siteName: BRANDING.name,
    url: BRANDING.url,
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Live — Interactive 3D Globe & World Explorer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: BRANDING.title,
    description: BRANDING.description,
    site: '@mooearth_live',
    images: ['https://www.mooearth.live/icons/icon-512.png'],
  },
};


export const viewport: Viewport = {
  themeColor: BRANDING.themeColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX';

  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-[#0a0a0f] text-white antialiased">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'MooEarth Live',
              alternateName: BRANDING.alternateNames,
              url: 'https://www.mooearth.live',
              logo: 'https://www.mooearth.live/icons/icon-512.png',
              sameAs: [
                'https://twitter.com/mooearth_live',
                'https://facebook.com/mooearth.live',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'MooEarth Live',
              alternateName: BRANDING.alternateNames,
              url: 'https://www.mooearth.live',
              description: BRANDING.description,
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://www.mooearth.live/?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <SentryInitializer />
        {children}
      </body>
    </html>
  );
}
