import { Metadata } from 'next';
import { generateHreflangs } from '@/lib/i18n';
import WeatherPageClient from './WeatherPageClient';

const title = 'Weather Intelligence — Live Global Weather, Air Quality & Marine Forecast | MooEarth Live';
const description = 'Explore real-time weather on a 3D globe. Current conditions, 7-day forecast, wind, air quality (AQI), elevation, flood risk, and marine data for any location worldwide. Powered by Open-Meteo.';

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
