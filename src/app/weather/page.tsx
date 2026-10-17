// ============================================================
// MooEarth Live — /weather Redirect Route
// ============================================================
// In the Two-Page Architecture, Weather Radar is the root homepage (/).
// This route permanently redirects all incoming traffic and links to /,
// preserving all query parameters (lat, lng, city, country, layer, mode).

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { generateHreflangs } from '@/lib/i18n';

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

export default async function WeatherPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (value != null) {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else {
        query.append(key, value);
      }
    }
  }
  const queryString = query.toString();
  redirect(queryString ? `/?${queryString}` : '/');
}
