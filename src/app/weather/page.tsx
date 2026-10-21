// ============================================================
// MooEarth Live — /weather Redirect Route
// ============================================================
// In the Two-Page Architecture, Weather Radar is the root homepage (/).
// This route permanently redirects all incoming traffic and links to /,
// preserving all query parameters (lat, lng, city, country, layer, mode).

import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import WeatherPageClient from './WeatherPageClient';

const title = 'Weather Intelligence — Live Global Weather, Radar & 7-Day Forecast | MooEarth Live';
const description = 'Explore real-time weather on an interactive 3D globe and live city radar map. Satellite spectral layers, precipitation radar, storm & cyclone tracking, wind streams, and 7-day meteorological forecasts.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/weather',
    languages: generateHreflangs('/weather'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/weather',
    type: 'website',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'MooEarth Weather Intelligence — Live Weather on 3D Globe',
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

export default function WeatherPage() {
  return <WeatherPageClient />;
}
