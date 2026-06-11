// ============================================================
// MooEarth Live — Root Layout
// ============================================================

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BRANDING } from '@/config/branding';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
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
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-[#0a0a0f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
