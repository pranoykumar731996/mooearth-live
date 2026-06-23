// ============================================================
// MooEarth Live — Root Layout
// ============================================================

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { BRANDING } from '@/config/branding';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mooearth.live'),
  title: BRANDING.name,
  description: BRANDING.description,
  keywords: [
    BRANDING.name,
    BRANDING.shortName,
    'mooearth',
    'live globe',
    '3D map',
    'football reactions',
    'celebrations',
    'world cup',
    'live events',
    'emotional earth',
  ],
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
  openGraph: {
    title: BRANDING.name,
    description: BRANDING.description,
    type: 'website',
    siteName: BRANDING.name,
    url: BRANDING.url,
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
        {children}
      </body>
    </html>
  );
}
