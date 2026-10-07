import { Metadata } from 'next';
import { fetchGlobalWeatherHighlights } from '@/services/weatherService';
import GlobalWeatherTemplate from '@/components/Weather/GlobalWeatherTemplate';
import { generateHreflangs } from '@/lib/i18n';

export const revalidate = 600; // 10 minutes cache

const title = 'Weather Map — Interactive 3D Climate Globe & Atmospheric Layers | MooEarth Live';
const description = 'Interactive 3D weather map on MooEarth Live. Explore verified temperatures, barometric pressure gradients, and dynamic wind velocities mapped to real global coordinates.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: 'https://www.mooearth.live/weather-map',
    languages: generateHreflangs('/weather-map'),
  },
  openGraph: {
    title,
    description,
    url: 'https://www.mooearth.live/weather-map',
    type: 'website',
    images: [
      {
        url: 'https://www.mooearth.live/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Weather Map - Interactive 3D Climate Globe',
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

export default async function WeatherMapPage() {
  const stations = await fetchGlobalWeatherHighlights();

  return (
    <GlobalWeatherTemplate
      currentPath="/weather-map"
      title="Weather Map — Interactive 3D Climate Globe & Surface Telemetry"
      subtitle="Interact with live atmospheric stations, pressure zones, and temperature readings across Earth on an interactive rotatable WebGL sphere."
      badgeText="3D Climate Map Engine"
      stations={stations}
    />
  );
}
