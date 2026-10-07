import React from 'react';
import Link from 'next/link';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { WeatherTelemetry } from '@/services/weatherService';

export interface LocationWeatherViewData {
  slug: string;
  name: string;
  type: 'country' | 'city';
  countryName: string;
  countrySlug: string;
  capital?: string;
  state?: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  population?: string | number;
  timezone?: string;
  description?: string;
  geographyContext?: string;
  weather: WeatherTelemetry;
  nearbyOrSubLocations?: { name: string; slug: string; type: 'city' | 'country' }[];
}

interface LocationWeatherTemplateProps {
  data: LocationWeatherViewData;
}

export default function LocationWeatherTemplate({ data }: LocationWeatherTemplateProps) {
  const {
    slug,
    name,
    type,
    countryName,
    countrySlug,
    capital,
    state,
    region,
    coordinates,
    timezone,
    description,
    geographyContext,
    weather,
    nearbyOrSubLocations = [],
  } = data;

  const canonicalUrl = `https://www.mooearth.live/weather/${slug}`;

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
        name: 'Weather',
        item: 'https://www.mooearth.live/weather',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${name} Weather`,
        item: canonicalUrl,
      },
    ],
  };

  // Schema.org Place with WeatherForecast JSON-LD
  const placeJsonLd = {
    '@context': 'https://schema.org',
    '@type': type === 'country' ? 'Country' : 'City',
    name,
    description: `Real-time verified meteorological telemetry for ${name} (${countryName}). Temperature: ${weather.temperature}°C, condition: ${weather.weatherDescription}, atmospheric pressure: ${weather.surfacePressure} hPa.`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    },
    url: canonicalUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/weather" className="hover:text-cyan-400 transition-colors">Weather</Link>
            <span>/</span>
            <span className="text-white/80 font-medium">{name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold">
                  {type === 'country' ? 'Sovereign Nation Weather Dossier' : 'City Meteorological Observatory'}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Verified Open-Meteo Telemetry
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {name} Weather &amp; Live Climate Telemetry
              </h1>

              <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
                Current atmospheric conditions in {name}
                {state ? `, ${state}` : ''}
                {type === 'city' ? `, ${countryName}` : capital ? ` (Capital: ${capital})` : ''}.
                Continuous ground station telemetry, barometric pressure, wind vectors, and humidity.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/countries/${countrySlug}`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
              >
                🗺️ Country Profile
              </Link>
              <Link
                href={`/countries/${countrySlug}/news`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
              >
                📰 Country News
              </Link>
              <Link
                href={`/games/geography/${countrySlug}`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
              >
                🎮 Geography Quiz
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Main Weather Telemetry & Globe Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: 3D Interactive Globe */}
            <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-white/10 bg-[#020208] shadow-2xl relative min-h-[460px]">
              <WebGLGlobeViewer
                selectedCountry={countryName}
                height="520px"
              />
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-cyan-300">
                  📍 Coordinates: {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
                </div>
                <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/60">
                  {region}
                </div>
              </div>
            </div>

            {/* Right: Live Telemetry Card */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-white/[0.04] to-black/80 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Observed Station</span>
                    <span className="text-base font-bold text-white">{name} Observatory</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Observation Timestamp</span>
                    <time dateTime={weather.timestamp} className="text-xs font-mono text-cyan-400">
                      {new Date(weather.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'UTC',
                      })} UTC
                    </time>
                  </div>
                </div>

                {/* Primary Temperature Metric */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono">
                      {Math.round(weather.temperature)}°C
                    </div>
                    <div className="text-sm font-semibold text-white/70 mt-1 capitalize flex items-center gap-1.5">
                      <span>{weather.weatherEmoji}</span>
                      <span>{weather.weatherDescription}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono text-white/60 space-y-1">
                    <div className="text-sm font-bold text-cyan-300">
                      {Math.round((weather.temperature * 9) / 5 + 32)}°F
                    </div>
                    <div>Feels like {Math.round(weather.apparentTemperature)}°C</div>
                    <div className="pt-1">{weather.isDay ? '☀️ Daytime' : '🌙 Nighttime'}</div>
                  </div>
                </div>

                {/* Detailed Sensor Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-white/10 text-xs">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Wind Velocity</span>
                    <span className="text-sm font-bold text-white font-mono">{weather.windSpeed.toFixed(1)} km/h</span>
                    <span className="text-[10px] text-white/40 block font-mono">Heading: {weather.windDirection}°</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Relative Humidity</span>
                    <span className="text-sm font-bold text-white font-mono">{weather.relativeHumidity}%</span>
                    <span className="text-[10px] text-white/40 block font-mono">Saturation</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Surface Pressure</span>
                    <span className="text-sm font-bold text-white font-mono">{weather.surfacePressure.toFixed(0)} hPa</span>
                    <span className="text-[10px] text-white/40 block font-mono">Barometric</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Precipitation</span>
                    <span className="text-sm font-bold text-white font-mono">{weather.precipitation} mm</span>
                    <span className="text-[10px] text-white/40 block font-mono">Accumulation</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Cloud Cover</span>
                    <span className="text-sm font-bold text-white font-mono">{weather.cloudCover}%</span>
                    <span className="text-[10px] text-white/40 block font-mono">Sky Obscurity</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Timezone</span>
                    <span className="text-xs font-bold text-white truncate block">{timezone || 'UTC'}</span>
                    <span className="text-[10px] text-white/40 block font-mono">Local Solar</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/weather-map"
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Global 3D Weather Map</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Geographical & Climate Explanatory Content */}
          <section
            aria-label="Geographical and Climatic Profile"
            className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6 text-white/80 text-sm leading-relaxed"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Meteorological Profile &amp; Climate Geography of {name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-cyan-300">
                  Regional Climate Characteristics
                </h3>
                <p>{geographyContext}</p>
                <p>
                  Atmospheric readings for {name} reflect local microclimatic influences, seasonal moisture circulation, and topography situated at latitude {coordinates.lat.toFixed(4)}° and longitude {coordinates.lng.toFixed(4)}°.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-cyan-300">
                  Continuous Telemetry Verification
                </h3>
                <p>
                  {description}
                </p>
                <p>
                  MooEarth synchronizes live surface observations through the Open-Meteo meteorological pipeline, adhering strictly to World Meteorological Organization (WMO) atmospheric code standards. Zero synthetic or simulated weather data is displayed.
                </p>
              </div>
            </div>

            {nearbyOrSubLocations.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <span className="text-xs font-mono uppercase text-white/50 block">
                  {type === 'country' ? 'Major Metropolitan Weather Stations:' : 'Nearby Regional Cities:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {nearbyOrSubLocations.map(loc => (
                    <Link
                      key={loc.slug}
                      href={loc.type === 'city' ? `/weather/${loc.slug}` : `/weather/${loc.slug}`}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-colors"
                    >
                      📍 {loc.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
