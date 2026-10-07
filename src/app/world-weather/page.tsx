import { Metadata } from 'next';
import { fetchGlobalWeatherHighlights } from '@/services/weatherService';
import GlobalWeatherTemplate from '@/components/Weather/GlobalWeatherTemplate';
import { generateHreflangs } from '@/lib/i18n';

export const revalidate = 600; // 10 minutes cache

const title = 'World Weather — Planetary Climate Directory & Atmospheric Map | MooEarth Live';
const description = 'Explore real-world weather observations across Earth on MooEarth Live. Verified meteorological data from global capital stations, tropical latitudes, and polar climate zones.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/world-weather',
    languages: generateHreflangs('/world-weather'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/world-weather',
    type: 'website',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'World Weather - Planetary Climate Directory',
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

export default async function WorldWeatherPage() {
  const stations = await fetchGlobalWeatherHighlights();

  return (
    <GlobalWeatherTemplate
      currentPath="/world-weather"
      title="World Weather — Planetary Climate Directory & Telemetry"
      subtitle="Explore real-time atmospheric measurements from major continental hubs and sovereign capitals. High-fidelity barometric and thermal observation grids."
      badgeText="Planetary Weather Directory"
      stations={stations}
    />
  );
}
