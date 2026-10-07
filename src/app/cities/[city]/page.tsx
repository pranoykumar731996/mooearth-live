import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllCities, getCityBySlug, getNearbyCities } from '@/data/places';
import { getCountryByName } from '@/data/countries';
import { getCityKnowledgeGraph } from '@/lib/seo/knowledgeGraph';
import { fetchCountryWeather } from '@/services/weatherService';
import { fetchNewsForCity } from '@/services/cityNewsService';
import { shouldIndexCityPage } from '@/lib/seo/cityQualityGate';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';
import GlobalFooter from '@/components/Layout/GlobalFooter';

interface CityPageProps {
  params: Promise<{
    city: string;
  }>;
}

export async function generateStaticParams() {
  const cities = getAllCities();
  return cities.map(c => ({
    city: c.slug,
  }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const city = getCityBySlug(decoded);

  if (!city) {
    return {
      title: 'City Not Found | MooEarth Live',
      description: 'The requested geographic city could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const gateResult = shouldIndexCityPage(decoded);

  const title = `${city.name}, ${city.country} — Weather, Map, Geography & City Guide | MooEarth Live`;
  const description = `Explore ${city.name} (${city.state ? `${city.state}, ` : ''}${city.country}). Live meteorological telemetry, 3D interactive globe, coordinates (${city.coordinates.lat.toFixed(2)}°, ${city.coordinates.lng.toFixed(2)}°), verified wire news, and nearby destinations.`;
  const canonicalUrl = `https://www.mooearth.live/cities/${city.slug}`;

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
          alt: `${city.name}, ${city.country} - MooEarth Live`,
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

export default async function CityPage({ params }: CityPageProps) {
  const { city: rawSlug } = await params;
  const decoded = decodeURIComponent(rawSlug).toLowerCase();
  const city = getCityBySlug(decoded);

  if (!city) {
    notFound();
  }

  const country = getCountryByName(city.country);
  const kg = getCityKnowledgeGraph(city);
  const canonicalUrl = `https://www.mooearth.live/cities/${city.slug}`;

  // Fetch live weather telemetry for this city's exact coordinates
  const weatherResult = await fetchCountryWeather(city.coordinates.lat, city.coordinates.lng);
  const { observation, isTemporaryError: isWeatherError } = weatherResult;

  // Fetch verified news for this city
  const newsResult = await fetchNewsForCity(city.name, city.country);
  const { articles: newsArticles } = newsResult;

  // Compute geodesic nearby places
  const nearbyPlaces = getNearbyCities(city.coordinates.lat, city.coordinates.lng, 4, city.id);

  // Breadcrumbs JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: kg.breadcrumbs.map(b => ({
      '@type': 'ListItem',
      position: b.position,
      name: b.name,
      item: `https://www.mooearth.live${b.href}`,
    })),
  };

  // City Schema.org JSON-LD
  const cityJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'City',
    name: city.name,
    description: city.description,
    url: canonicalUrl,
    containedInPlace: {
      '@type': 'Country',
      name: city.country,
      identifier: city.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.coordinates.lat,
      longitude: city.coordinates.lng,
    },
    population: city.population,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Timezone',
        value: city.timezone,
      },
      {
        '@type': 'PropertyValue',
        name: 'Administrative State',
        value: city.state || 'N/A',
      },
    ],
  };

  const latCardinal = city.coordinates.lat >= 0 ? 'N' : 'S';
  const lngCardinal = city.coordinates.lng >= 0 ? 'E' : 'W';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cityJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Header & Breadcrumbs */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/world-map" className="hover:text-cyan-400 transition-colors">World Map</Link>
            <span>/</span>
            <Link href={`/continents/${kg.continent.slug}`} className="hover:text-cyan-400 transition-colors">{kg.continent.name}</Link>
            <span>/</span>
            <Link href={`/countries/${city.countrySlug}`} className="hover:text-cyan-400 transition-colors">{city.country}</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">{city.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl" role="img" aria-label={`Flag of ${city.country}`}>{country?.flag || '🏙️'}</span>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Link
                      href={`/continents/${kg.continent.slug}`}
                      className="text-cyan-400 text-xs font-mono tracking-widest uppercase font-semibold hover:underline"
                    >
                      {kg.continent.name}
                    </Link>
                    <span className="text-xs text-white/40 font-mono">&bull; {city.state ? `${city.state}, ` : ''}{city.country}</span>
                  </div>
                  <span className="text-xs text-white/40 font-mono">
                    GPS: {Math.abs(city.coordinates.lat).toFixed(2)}°{latCardinal}, {Math.abs(city.coordinates.lng).toFixed(2)}°{lngCardinal} &bull; Timezone: {city.timezone}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {city.name}, {city.country} — City Guide & Live Telemetry
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              Detailed geographic and meteorological profile for {city.name}. Real-time satellite observations, interactive 3D globe coordinates, verified news dispatches, and nearby places.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Quick Country Links Bar */}
          <nav aria-label="Country Intent Hubs" className="flex flex-wrap items-center gap-2 text-xs border-b border-white/5 pb-4">
            <span className="text-white/40 uppercase font-mono text-[10px] mr-1">Parent Country:</span>
            <Link href={`/countries/${city.countrySlug}`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 font-semibold border border-white/10 transition-colors">
              {country?.flag} {city.country} Atlas &rarr;
            </Link>
            <Link href={`/countries/${city.countrySlug}/weather`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              National Weather
            </Link>
            <Link href={`/countries/${city.countrySlug}/news`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              National News
            </Link>
            <Link href={`/countries/${city.countrySlug}/geography`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              National Geography
            </Link>
            <Link href={`/countries/${city.countrySlug}/map`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              National 3D Map
            </Link>
            <Link href={`/countries/${city.countrySlug}/quiz`} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
              Country Quiz
            </Link>
            <Link href={`/games/geography/${city.countrySlug}`} className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium border border-purple-500/30 transition-colors">
              Play {city.country} Game
            </Link>
            <Link href={`/continents/${kg.continent.slug}`} className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium border border-emerald-500/30 transition-colors">
              {kg.continent.name} Atlas
            </Link>
          </nav>

          {/* Key Geographic Dimensions Grid */}
          <section aria-label="City Metrics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Population</span>
              <span className="text-base font-bold text-white mt-1 block">
                {city.population ? city.population.toLocaleString() : 'N/A'}
              </span>
              <span className="text-[11px] text-white/40 mt-0.5 block">Metropolitan</span>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Country</span>
              <Link href={`/countries/${city.countrySlug}`} className="text-base font-bold text-cyan-300 hover:underline mt-1 block truncate">
                {city.country}
              </Link>
              <span className="text-[11px] text-white/40 mt-0.5 block">ISO: {city.countryCode}</span>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">State / Region</span>
              <span className="text-base font-bold text-white mt-1 block truncate">
                {city.state || city.region || 'Metropolitan'}
              </span>
              <span className="text-[11px] text-white/40 mt-0.5 block">Admin Division</span>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Coordinates</span>
              <span className="text-base font-mono font-bold text-emerald-400 mt-1 block">
                {city.coordinates.lat.toFixed(2)}°, {city.coordinates.lng.toFixed(2)}°
              </span>
              <span className="text-[11px] text-white/40 mt-0.5 block">WGS84 Centroid</span>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Timezone</span>
              <span className="text-sm font-bold text-white mt-1 block truncate">
                {city.timezone}
              </span>
              <span className="text-[11px] text-white/40 mt-0.5 block">Local Clock</span>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Classification</span>
              <span className="text-sm font-bold text-white mt-1 block truncate">
                {city.isCapital ? '★ National Capital' : 'Metropolitan Center'}
              </span>
              <span className="text-[11px] text-white/40 mt-0.5 block">{city.region}</span>
            </div>
          </section>

          {/* Interactive 3D WebGL Globe Stage */}
          <section aria-label="3D Globe Viewport" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between text-xs text-white/60 gap-2 px-1">
              <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                3D Globe Orbiting: {city.name}, {city.country}
              </span>
              <span className="font-mono text-[11px] text-white/50">
                Hardware Accelerated WebGL Centered on ({city.coordinates.lat.toFixed(4)}°, {city.coordinates.lng.toFixed(4)}°)
              </span>
            </div>

            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl relative">
              <WebGLGlobeViewer
                height="560px"
                selectedCountry={city.country}
                initialView="standard"
              />
            </div>
          </section>

          {/* Live Meteorological Telemetry */}
          <section aria-label="City Weather Telemetry" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌤️</span> Live Weather & Atmosphere: {city.name}
                </h2>
                <p className="text-xs text-white/60">
                  Real-time meteorological observations for coordinates ({city.coordinates.lat.toFixed(2)}°, {city.coordinates.lng.toFixed(2)}°) powered by Open-Meteo.
                </p>
              </div>
            </div>

            {observation ? (
              <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] via-cyan-950/20 to-black relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      Live Station Reading &bull; {city.name}
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-5xl sm:text-6xl font-black text-white">
                        {Math.round(observation.temperature)}°
                        <span className="text-2xl text-cyan-400 font-normal">C</span>
                      </span>
                      <span className="text-4xl">{observation.weatherEmoji}</span>
                    </div>
                    <p className="text-sm text-white/80 font-semibold capitalize">
                      {observation.weatherDescription} &bull; Feels like {Math.round(observation.apparentTemperature)}°C
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                      <span className="text-white/40 block text-[10px] font-mono uppercase">Humidity</span>
                      <span className="text-white font-bold text-sm">{observation.relativeHumidity}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                      <span className="text-white/40 block text-[10px] font-mono uppercase">Wind Speed</span>
                      <span className="text-white font-bold text-sm">{observation.windSpeed} km/h</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                      <span className="text-white/40 block text-[10px] font-mono uppercase">Precipitation</span>
                      <span className="text-white font-bold text-sm">{observation.precipitation} mm</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                      <span className="text-white/40 block text-[10px] font-mono uppercase">Pressure</span>
                      <span className="text-white font-bold text-sm">{Math.round(observation.surfacePressure)} hPa</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01] text-center text-xs text-white/50">
                {isWeatherError ? '⚠️ Weather station feed is refreshing. Real-time data will return shortly.' : 'Atmospheric reading currently initializing.'}
              </div>
            )}
          </section>

          {/* Geography & Physical Landscape Narrative */}
          <section aria-label="City Geography" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>🏔️</span> Physical Geography & Spatial Context
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">
              {city.geography}
            </p>
            <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-white/40 block font-mono text-[10px] uppercase">Country Territory</span>
                <span className="text-white font-semibold text-sm block">{city.country} ({country?.region})</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-white/40 block font-mono text-[10px] uppercase">Climate System</span>
                <span className="text-cyan-300 font-semibold text-sm block">{country?.climate || 'Regional Subtropical'}</span>
              </div>
            </div>
          </section>

          {/* Nearby Places with Geodesic Proximity */}
          {nearbyPlaces.length > 0 && (
            <section aria-label="Nearby Places" className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>📍</span> Nearby Cities & Geodesic Proximity
                </h2>
                <p className="text-xs text-white/60">
                  Calculated straight-line Haversine geodesic distances from {city.name} to other verified metropolitan hubs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {nearbyPlaces.map(({ city: nearby, distanceKm }) => (
                  <Link
                    key={nearby.id}
                    href={`/cities/${nearby.slug}`}
                    className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all group flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                        {distanceKm.toLocaleString()} km away
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mt-1">
                        {nearby.name}
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">
                        {nearby.state ? `${nearby.state}, ` : ''}{nearby.country}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/40 font-mono">
                      <span>Pop: {nearby.population ? nearby.population.toLocaleString() : 'N/A'}</span>
                      <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Relevant News Wire Dispatches */}
          <section aria-label="City News Dispatches" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>📰</span> Relevant Wire Dispatches: {city.name}
                </h2>
                <p className="text-xs text-white/60">
                  Verified news stories directly covering events in {city.name} and {city.country}.
                </p>
              </div>
            </div>

            {newsArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsArticles.slice(0, 4).map(art => (
                  <article
                    key={art.id}
                    className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-[10px] uppercase border border-cyan-500/20 truncate">
                          {art.source}
                        </span>
                        <time dateTime={art.publishedAt} className="text-white/40 font-mono text-[11px] shrink-0">
                          {new Date(art.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </time>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {art.title}
                      </h3>
                      <p className="text-xs text-white/70 line-clamp-2">
                        {art.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-white/40 font-mono text-[10px]">📍 {art.location}</span>
                      <a
                        href={art.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        Read Source &rarr;
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01] text-center text-xs text-white/50">
                No active wire dispatches logged for {city.name}. Browse <Link href={`/countries/${city.countrySlug}/news`} className="text-cyan-400 hover:underline">{city.country} National News Desk</Link>.
              </div>
            )}
          </section>

          {/* Sister Cities in Same Country */}
          {kg.sisterCities.length > 0 && (
            <section aria-label="Sister Cities in Same Country" className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🏛️</span> Sister Metropolitan Centers in {city.country}
                </h2>
                <p className="text-xs text-white/60">
                  Other canonical urban centers and demographic hubs within {city.country}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kg.sisterCities.map(sister => (
                  <Link
                    key={sister.id}
                    href={`/cities/${sister.slug}`}
                    className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all group flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase">
                          {sister.isCapital ? '★ National Capital' : 'Metropolitan Hub'}
                        </span>
                        <span className="text-white/40 font-mono text-[10px]">{sister.countryCode}</span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {sister.name}
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">
                        {sister.state ? `${sister.state}, ` : ''}{sister.country}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/40 font-mono">
                      <span>Pop: {sister.population ? sister.population.toLocaleString() : 'N/A'}</span>
                      <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Inspect City &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Games & Quizzes */}
          <section aria-label="City & Country Games" className="p-6 sm:p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 via-black to-blue-950/20 space-y-4">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider block mb-1">Interactive Earth Gaming</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Play {city.name} & {city.country} Challenges</h2>
              <p className="text-xs text-white/60">Test your planetary knowledge with geography trivia, daily challenges, and coordinate speed runs.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <Link
                href={`/games/geography/${city.countrySlug}`}
                className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:border-purple-400 transition-all group"
              >
                <div className="text-2xl mb-1">{country?.flag || '🌍'}</div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  {city.country} Geography Game
                </h3>
                <p className="text-xs text-white/50 mt-1">Official timed country challenge covering {city.country} landmarks.</p>
              </Link>

              <Link
                href={`/countries/${city.countrySlug}/quiz`}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-400/50 transition-all group"
              >
                <div className="text-2xl mb-1">🎮</div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {city.country} Quiz Challenge
                </h3>
                <p className="text-xs text-white/50 mt-1">Authentic questions testing knowledge of {city.country} landmarks and geography.</p>
              </Link>

              <Link
                href="/daily"
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-400/50 transition-all group"
              >
                <div className="text-2xl mb-1">📅</div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Daily Global Challenge
                </h3>
                <p className="text-xs text-white/50 mt-1">Timed world quest testing planetary knowledge against players worldwide.</p>
              </Link>

              <Link
                href="/country-quiz"
                className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-sky-400/50 transition-all group"
              >
                <div className="text-2xl mb-1">🏛️</div>
                <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                  195 Country Quiz
                </h3>
                <p className="text-xs text-white/50 mt-1">Identify sovereign nations, flags, and geopolitical borders.</p>
              </Link>
            </div>
          </section>

          {/* Related Navigation */}
          <section className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/60">
            <span className="text-white font-semibold">Knowledge Graph Portals:</span>
            <Link href={`/countries/${city.countrySlug}`} className="text-cyan-400 hover:underline">{city.country} Country Atlas</Link>
            <Link href={`/continents/${kg.continent.slug}`} className="text-cyan-400 hover:underline">{kg.continent.name} Continental Hub</Link>
            <Link href="/continents" className="text-cyan-400 hover:underline">7 Continents Directory</Link>
            <Link href={`/countries/${city.countrySlug}/weather`} className="text-cyan-400 hover:underline">{city.country} Weather</Link>
            <Link href={`/weather/${city.slug}`} className="text-cyan-400 hover:underline">{city.name} Weather Station</Link>
            <Link href={`/countries/${city.countrySlug}/news`} className="text-cyan-400 hover:underline">{city.country} News Desk</Link>
            <Link href={`/countries/${city.countrySlug}/map`} className="text-cyan-400 hover:underline">{city.country} 3D Map</Link>
            <Link href={`/games/geography/${city.countrySlug}`} className="text-cyan-400 hover:underline">{city.country} Game</Link>
            <Link href="/world-map" className="text-cyan-400 hover:underline">Interactive World Map</Link>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
