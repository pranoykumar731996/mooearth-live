import { Metadata } from 'next';
import { fetchGlobalWeatherHighlights } from '@/services/weatherService';
import GlobalWeatherTemplate from '@/components/Weather/GlobalWeatherTemplate';
import { generateHreflangs } from '@/lib/i18n';

export const revalidate = 600; // 10 minutes cache

const title = 'Global Weather — Live World Climate & Atmospheric Telemetry | MooEarth Live';
const description = 'Monitor verified real-time global weather on MooEarth Live. 3D climate map, atmospheric barometric pressure, wind vectors, and live telemetry from physical meteorological stations.';

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
        alt: 'Global Weather - Live Telemetry on 3D Earth Globe',
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

export default async function WeatherHubPage() {
  const stations = await fetchGlobalWeatherHighlights();

  return (
    <GlobalWeatherTemplate
      currentPath="/weather"
      title="Global Weather — Live World Climate & Atmospheric Telemetry"
      subtitle="Continuous real-world meteorological station telemetry mapped to geographic coordinates on an interactive 3D globe. Verified physical ground sensor readings with zero simulated weather."
      badgeText="Global Meteorological Desk"
      stations={stations}
    />
  );
}
