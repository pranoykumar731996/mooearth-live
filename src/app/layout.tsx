// ============================================================
// EarthPulse AI — Root Layout
// ============================================================

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'EarthPulse AI — See the World Come Alive',
  description:
    'Explore real-world events on a stunning interactive 3D globe. Breaking news, sports, technology, business, weather, and entertainment — all visualized in real time.',
  keywords: [
    'EarthPulse AI',
    'globe',
    '3D map',
    'world events',
    'breaking news',
    'live events',
    'interactive globe',
  ],
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
  openGraph: {
    title: 'EarthPulse AI — See the World Come Alive',
    description: 'Explore real-world events on a stunning interactive 3D globe.',
    type: 'website',
    siteName: 'EarthPulse AI',
  },
};

export const viewport: Viewport = {
  themeColor: '#00e5ff',
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
