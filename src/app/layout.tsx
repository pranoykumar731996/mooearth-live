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
  title: 'MooEarth Live — 3D Interactive World Globe & Live News Reactions',
  description: BRANDING.description,
  keywords: [
    BRANDING.name,
    BRANDING.shortName,
    'mooearth',
    'live globe',
    '3D map',
    'geography game',
    'world trivia',
    'daily earth challenge',
    'interactive globe',
    'explore earth',
    'world news',
    'football reactions',
    'celebrations',
    'world cup',
    'live events',
  ],
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://www.mooearth.live',
    languages: generateHreflangs(''),
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-512.svg',
  },
  openGraph: {
    title: 'MooEarth Live — 3D Interactive World Globe & Live News Reactions',
    description: 'Explore the Living Earth. Discover what\'s happening around the world. Play Earth.',
    type: 'website',
    siteName: BRANDING.name,
    url: BRANDING.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MooEarth Live — 3D Interactive World Globe & Live News Reactions',
    description: 'Explore the Living Earth. Discover what\'s happening around the world. Play Earth.',
    site: '@mooearth_live',
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
              url: 'https://www.mooearth.live',
              logo: 'https://www.mooearth.live/icons/icon-512.svg',
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
              url: 'https://www.mooearth.live',
              description: 'Explore the Living Earth. Discover what\'s happening around the world. Play Earth.',
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
