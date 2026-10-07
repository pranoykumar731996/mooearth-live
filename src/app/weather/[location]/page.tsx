import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllCountries, getCountryBySlug, resolveCanonicalSlug } from '@/data/countries';
import { getAllCities, getCityBySlug, resolveCanonicalCitySlug, getNearbyCities } from '@/data/places';
import { fetchCountryWeather } from '@/services/weatherService';
import { shouldIndexWeatherPage } from '@/lib/seo/weatherQualityGate';
import LocationWeatherTemplate, { LocationWeatherViewData } from '@/components/Weather/LocationWeatherTemplate';

export const revalidate = 600; // 10 minutes cache

interface LocationWeatherPageProps {
  params: Promise<{
    location: string;
  }>;
}

/**
 * Pre-generate static routes for all canonical sovereign countries and verified cities.
 */
export async function generateStaticParams() {
  const countryParams = getAllCountries().map(country => ({
    location: country.slug,
  }));

  const cityParams = getAllCities().map(city => ({
    location: city.slug,
  }));

  return [...countryParams, ...cityParams];
}

export async function generateMetadata({ params }: LocationWeatherPageProps): Promise<Metadata> {
  const { location: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();

  // 1. Check City Match
  const city = getCityBySlug(decoded);
  if (city) {
    const canonicalSlug = resolveCanonicalCitySlug(decoded) || city.slug;
    const weatherResult = await fetchCountryWeather(city.coordinates.lat, city.coordinates.lng);
    const gateResult = shouldIndexWeatherPage(decoded, canonicalSlug, weatherResult);

    const title = `${city.name}, ${city.country} Weather & Live Climate Telemetry | MooEarth Live`;
    const description = weatherResult.observation
      ? `Current verified weather in ${city.name} (${city.state ? `${city.state}, ` : ''}${city.country}): ${Math.round(weatherResult.observation.temperature)}°C, ${weatherResult.observation.weatherDescription}. Barometric pressure: ${Math.round(weatherResult.observation.surfacePressure)} hPa.`
      : `Real-time verified meteorological station telemetry and climate data for ${city.name}, ${city.country}.`;
    const canonicalUrl = `https://www.mooearth.live/weather/${canonicalSlug}`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      robots: gateResult.robotsDirective,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: 'website',
        images: [{ url: 'https://www.mooearth.live/icons/icon-512.png', width: 512, height: 512, alt: `${city.name} Weather` }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  }

  // 2. Check Country Match
  const country = getCountryBySlug(decoded);
  if (country) {
    const canonicalSlug = resolveCanonicalSlug(decoded) || country.slug;
    const weatherResult = await fetchCountryWeather(country.coordinates.lat, country.coordinates.lng);
    const gateResult = shouldIndexWeatherPage(decoded, canonicalSlug, weatherResult);

    const title = `${country.name} Weather & Live Climate Telemetry | MooEarth Live`;
    const description = weatherResult.observation
      ? `Current verified weather in ${country.name} (${country.capital}): ${Math.round(weatherResult.observation.temperature)}°C, ${weatherResult.observation.weatherDescription}. Wind: ${weatherResult.observation.windSpeed} km/h, pressure: ${Math.round(weatherResult.observation.surfacePressure)} hPa.`
      : `Real-time verified meteorological station telemetry and climate data for ${country.name} (${country.capital}).`;
    const canonicalUrl = `https://www.mooearth.live/weather/${canonicalSlug}`;

    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      robots: gateResult.robotsDirective,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: 'website',
        images: [{ url: 'https://www.mooearth.live/icons/icon-512.png', width: 512, height: 512, alt: `${country.name} Weather` }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  }

  // 3. Not Found
  return {
    title: 'Weather Station Not Found | MooEarth Live',
    description: 'The requested geographic location could not be found.',
    robots: { index: false, follow: false },
  };
}

export default async function LocationWeatherPage({ params }: LocationWeatherPageProps) {
  const { location: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();

  // 1. Try City
  const city = getCityBySlug(decoded);
  if (city) {
    const weatherResult = await fetchCountryWeather(city.coordinates.lat, city.coordinates.lng);
    const nearby = getNearbyCities(city.coordinates.lat, city.coordinates.lng, 4, city.id).map(item => ({
      name: item.city.name,
      slug: item.city.slug,
      type: 'city' as const,
    }));

    if (!weatherResult.observation) {
      notFound();
    }

    const viewData: LocationWeatherViewData = {
      slug: city.slug,
      name: city.name,
      type: 'city',
      countryName: city.country,
      countrySlug: city.countrySlug,
      state: city.state,
      region: city.region || 'Global',
      coordinates: city.coordinates,
      population: city.population,
      timezone: city.timezone,
      description: city.description || `${city.name} is a verified metropolitan city in ${city.country}.`,
      geographyContext: city.geography || `${city.name} is located at latitude ${city.coordinates.lat.toFixed(2)}°, longitude ${city.coordinates.lng.toFixed(2)}°.`,
      weather: weatherResult.observation,
      nearbyOrSubLocations: nearby,
    };

    return <LocationWeatherTemplate data={viewData} />;
  }

  // 2. Try Country
  const country = getCountryBySlug(decoded);
  if (country) {
    const weatherResult = await fetchCountryWeather(country.coordinates.lat, country.coordinates.lng);
    const capitalCities = getAllCities().filter(c => c.countrySlug === country.slug);

    if (!weatherResult.observation) {
      notFound();
    }

    const viewData: LocationWeatherViewData = {
      slug: country.slug,
      name: country.name,
      type: 'country',
      countryName: country.name,
      countrySlug: country.slug,
      capital: country.capital,
      region: country.region,
      coordinates: country.coordinates,
      population: country.population,
      description: `${country.name} is a sovereign nation in ${country.region} with its capital at ${country.capital}. ${country.climate}`,
      geographyContext: country.geography || `Situated across ${country.region}, ${country.name} experiences diverse climate patterns centered at latitude ${country.coordinates.lat.toFixed(2)}°, longitude ${country.coordinates.lng.toFixed(2)}°.`,
      weather: weatherResult.observation,
      nearbyOrSubLocations: capitalCities.map(c => ({ name: c.name, slug: c.slug, type: 'city' as const })),
    };

    return <LocationWeatherTemplate data={viewData} />;
  }

  // Neither city nor country
  notFound();
}
