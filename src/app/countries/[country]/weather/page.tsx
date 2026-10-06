import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCountryBySlug } from '@/data/countries';
import { fetchCountryWeather } from '@/services/weatherService';
import { shouldIndexCountryIntentPage } from '@/lib/seo/countryIntentQualityGate';
import GlobalFooter from '@/components/Layout/GlobalFooter';

interface CountryWeatherPageProps {
  params: Promise<{
    country: string;
  }>;
}

export async function generateMetadata({ params }: CountryWeatherPageProps): Promise<Metadata> {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    return {
      title: 'Country Not Found | MooEarth Live',
      description: 'The requested sovereign nation could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const weatherResult = await fetchCountryWeather(country.coordinates.lat, country.coordinates.lng);
  const gateResult = shouldIndexCountryIntentPage(country.slug, 'weather', weatherResult);

  const title = `${country.name} Weather & Live Climate Telemetry | MooEarth Live`;
  const description = weatherResult.observation
    ? `Current verified weather in ${country.name} (${country.capital}): ${weatherResult.observation.temperature}°C, ${weatherResult.observation.weatherDescription}. Real-time atmospheric metrics & climate telemetry.`
    : `Real-time verified meteorological station telemetry and climate data for ${country.name} (${country.capital}).`;
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/weather`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: gateResult.robotsDirective,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: 'https://www.mooearth.live/icons/icon-512.png',
          width: 512,
          height: 512,
          alt: `${country.name} Weather - MooEarth Live`,
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
}

export default async function CountryWeatherPage({ params }: CountryWeatherPageProps) {
  const { country: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const country = getCountryBySlug(decoded);

  if (!country) {
    notFound();
  }

  const weatherResult = await fetchCountryWeather(country.coordinates.lat, country.coordinates.lng);
  const { observation, isTemporaryError, errorMessage } = weatherResult;
  const canonicalUrl = `https://www.mooearth.live/countries/${country.slug}/weather`;

  // Breadcrumbs JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.mooearth.live',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'World Map',
        item: 'https://www.mooearth.live/world-map',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: country.name,
        item: `https://www.mooearth.live/countries/${country.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Weather',
        item: canonicalUrl,
      },
    ],
  };

  // Weather Observation JSON-LD
  const weatherJsonLd = observation
    ? {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: `${country.name} Meteorological Station (${country.capital})`,
        address: {
          '@type': 'PostalAddress',
          addressCountry: country.id,
          addressLocality: country.capital,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: country.coordinates.lat,
          longitude: country.coordinates.lng,
        },
        description: `Current atmospheric observation: ${observation.temperature}°C, ${observation.weatherDescription}.`,
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {weatherJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(weatherJsonLd) }}
        />
      )}

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Header & Breadcrumb */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/world-map" className="hover:text-cyan-400 transition-colors">World Map</Link>
            <span>/</span>
            <Link href={`/countries/${country.slug}`} className="hover:text-cyan-400 transition-colors">{country.name}</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">Weather</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl" role="img" aria-label={`Flag of ${country.name}`}>{country.flag}</span>
                <div>
                  <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase font-semibold block">
                    Live Meteorological Telemetry &bull; {country.region}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    Station Centroid: {country.coordinates.lat.toFixed(2)}°, {country.coordinates.lng.toFixed(2)}° &bull; Capital: {country.capital}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {country.name} Weather & Live Atmospheric Data
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Real-world meteorological feeds provided by Open-Meteo satellites and surface observation sensors. No synthetic or fabricated weather data.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-8 flex-1">
          {/* Quick Intent Navigation Pill Bar */}
          <nav aria-label="Country Intent Navigation" className="flex flex-wrap items-center gap-2 text-xs border-b border-white/5 pb-4">
            <span className="text-white/40 uppercase font-mono text-[10px] mr-1">Explore {country.name}:</span>
            <Link href={`/countries/${country.slug}`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              Overview Atlas
            </Link>
            <Link href={`/countries/${country.slug}/news`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              📰 News
            </Link>
            <Link href={`/countries/${country.slug}/geography`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🏔️ Geography
            </Link>
            <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
              🌤️ Weather (Active)
            </span>
            <Link href={`/countries/${country.slug}/map`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🗺️ 3D Map
            </Link>
            <Link href={`/countries/${country.slug}/quiz`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              🎮 Quiz
            </Link>
          </nav>

          {/* Upstream Error / Temporary Fallback Warning */}
          {isTemporaryError && (
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">⚠️ Meteorological Telemetry Currently Refreshing</p>
                <p className="text-amber-200/80 mt-1">
                  The upstream satellite network is synchronizing or temporarily rate-limited ({errorMessage || 'upstream timeout'}). Per our strict data integrity policy, no fabricated weather values are displayed.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] uppercase shrink-0">
                Data Protected
              </span>
            </div>
          )}

          {/* Live Telemetry Display */}
          {observation ? (
            <div className="space-y-6">
              {/* Primary Weather Hero Card */}
              <div className="p-8 sm:p-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-cyan-950/20 to-black relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      Live Station Reading &bull; {country.capital}
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-6xl sm:text-7xl md:text-8xl font-black text-white tracking-tight">
                        {Math.round(observation.temperature)}°
                        <span className="text-3xl text-cyan-400 font-normal">C</span>
                      </span>
                      <span className="text-5xl sm:text-6xl">{observation.weatherEmoji}</span>
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-white capitalize">
                        {observation.weatherDescription}
                      </h2>
                      <p className="text-sm text-white/50">
                        Feels like {Math.round(observation.apparentTemperature)}°C &bull; Day/Night Cycle:{' '}
                        {observation.isDay ? 'Daytime ☀️' : 'Nighttime 🌙'}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3 min-w-[260px]">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                      Sensor Verification
                    </span>
                    <div className="text-xs space-y-2 text-white/70">
                      <div className="flex justify-between">
                        <span>WMO Code:</span>
                        <span className="font-mono text-white font-semibold">{observation.weatherCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Station Lat:</span>
                        <span className="font-mono text-white">{observation.stationLat.toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Station Lng:</span>
                        <span className="font-mono text-white">{observation.stationLng.toFixed(2)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Logged Time:</span>
                        <span className="font-mono text-cyan-300">
                          {new Date(observation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Atmospheric Instrumentation Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Relative Humidity</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {observation.relativeHumidity}%
                  </span>
                  <span className="text-[11px] text-white/40 mt-1 block">Moisture content</span>
                </div>

                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Wind Speed</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {observation.windSpeed} <span className="text-xs font-normal text-white/50">km/h</span>
                  </span>
                  <span className="text-[11px] text-white/40 mt-1 block">Direction: {observation.windDirection}°</span>
                </div>

                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Precipitation</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {observation.precipitation} <span className="text-xs font-normal text-white/50">mm</span>
                  </span>
                  <span className="text-[11px] text-white/40 mt-1 block">Rain: {observation.rain} mm</span>
                </div>

                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Cloud Cover</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {observation.cloudCover}%
                  </span>
                  <span className="text-[11px] text-white/40 mt-1 block">Sky coverage</span>
                </div>

                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Surface Pressure</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {Math.round(observation.surfacePressure)} <span className="text-xs font-normal text-white/50">hPa</span>
                  </span>
                  <span className="text-[11px] text-white/40 mt-1 block">Barometric force</span>
                </div>

                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Climate Zone</span>
                  <span className="text-sm font-bold text-cyan-300 mt-2 block truncate">
                    {country.climate}
                  </span>
                  <span className="text-[11px] text-white/40 mt-1 block">{country.region}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-4">
              <span className="text-4xl">🛰️</span>
              <h2 className="text-xl font-bold text-white">Meteorological Satellite Reading Offline</h2>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                Live sensor stations for {country.name} are momentarily inaccessible. To preserve data integrity, synthetic values will never be generated. Please retry shortly.
              </p>
            </div>
          )}

          {/* Regional Climate Context */}
          <section className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>🌍</span> Regional Climate Profile: {country.name}
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              {country.name} features a {country.climate.toLowerCase()} climate system across its {country.areaKm2.toLocaleString()} km² territory. Weather patterns are influenced by its geographical location in {country.region} ({country.subregion}), centering near coordinates {country.coordinates.lat.toFixed(2)}°N, {country.coordinates.lng.toFixed(2)}°E.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-white/40 mr-2 self-center">Compare Neighbors:</span>
              {country.relatedSlugs.map(slug => (
                <Link
                  key={slug}
                  href={`/countries/${slug}/weather`}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-colors text-xs text-white/80"
                >
                  {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Weather &rarr;
                </Link>
              ))}
            </div>
          </section>

          {/* Related Navigation */}
          <section className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">More {country.name} Links:</span>
            <Link href={`/countries/${country.slug}`} className="text-cyan-400 hover:underline">Full Country Atlas</Link>
            <Link href={`/countries/${country.slug}/news`} className="text-cyan-400 hover:underline">Live News Dispatches</Link>
            <Link href={`/countries/${country.slug}/geography`} className="text-cyan-400 hover:underline">Physical Geography</Link>
            <Link href={`/countries/${country.slug}/map`} className="text-cyan-400 hover:underline">Interactive 3D Map</Link>
            <Link href={`/countries/${country.slug}/quiz`} className="text-cyan-400 hover:underline">Geography Quiz Challenge</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
