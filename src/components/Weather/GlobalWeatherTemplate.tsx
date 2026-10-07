import React from 'react';
import Link from 'next/link';
import WeatherGlobeClient from './WeatherGlobeClient';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { WeatherStationHighlight } from '@/services/weatherService';

interface GlobalWeatherTemplateProps {
  currentPath: '/weather' | '/world-weather' | '/weather-map';
  title: string;
  subtitle: string;
  badgeText: string;
  stations: WeatherStationHighlight[];
}

export default function GlobalWeatherTemplate({
  currentPath,
  title,
  subtitle,
  badgeText,
  stations,
}: GlobalWeatherTemplateProps) {
  const canonicalUrl = `https://www.mooearth.live${currentPath}`;

  // Breadcrumbs JSON-LD
  const breadcrumbsJsonLd = {
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
        name: title,
        item: canonicalUrl,
      },
    ],
  };

  // Structured Data ItemList of Weather Stations
  const stationsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description: subtitle,
    url: canonicalUrl,
    numberOfItems: stations.length,
    itemListElement: stations.map((station, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Place',
        name: `${station.name}, ${station.country}`,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: station.lat,
          longitude: station.lng,
        },
        description: station.telemetry
          ? `Current meteorological conditions: ${station.telemetry.temperature}°C, ${station.telemetry.weatherDescription}. Wind speed: ${station.telemetry.windSpeed} km/h, humidity: ${station.telemetry.relativeHumidity}%.`
          : `Meteorological observation station in ${station.name}, ${station.country}.`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(stationsJsonLd) }}
      />

      <div className="min-h-screen bg-[#030308] text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Navigation & Header */}
        <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-cyan-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80 font-medium">World Meteorological Observatory</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold">
                  {badgeText}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Live Open-Meteo Telemetry • {stations.length} Anchor Stations
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {title}
              </h1>

              <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            </div>

            {/* Quick Switcher Between Weather Routes */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/weather"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  currentPath === '/weather'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                🌡️ Global Weather Hub
              </Link>
              <Link
                href="/world-weather"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  currentPath === '/world-weather'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                🌐 World Weather
              </Link>
              <Link
                href="/weather-map"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  currentPath === '/weather-map'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                }`}
              >
                🗺️ 3D Weather Map
              </Link>
              <Link
                href="/world-events"
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white/5 hover:bg-white/10 text-white/70 border-white/10"
              >
                🌍 World Events
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-12 flex-1">
          {/* Section 1: Interactive 3D WebGL Globe & Weather Client */}
          <section aria-label="Interactive 3D Weather Globe & Telemetry" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🌍</span> Interactive Globe & Real-Time Weather Stations
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Explore planetary temperatures, atmospheric barometric pressure, and live weather conditions.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 hidden sm:inline-block">
                Atmospheric Model: Open-Meteo Telemetry
              </span>
            </div>

            <WeatherGlobeClient stations={stations} />
          </section>

          {/* Section 2: Server-Rendered Prerendered Telemetry Articles (For Search Crawlers) */}
          <section
            aria-label="Server-Rendered Global Weather Station Telemetry"
            className="space-y-6 pt-8 border-t border-white/10"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">
                Live Global Atmospheric Telemetry by Region
              </h2>
              <p className="text-sm text-white/60">
                Verified meteorological readings synchronized from physical weather sensor networks across sovereign capitals and metropolitan centers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map(station => (
                <article
                  key={station.id}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      📍 {station.name}, {station.country}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">
                      {station.lat.toFixed(2)}°, {station.lng.toFixed(2)}°
                    </span>
                  </div>

                  {station.telemetry ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-white font-mono">
                          {Math.round(station.telemetry.temperature)}°C
                        </span>
                        <span className="text-xs text-white/70 font-medium capitalize">
                          {station.telemetry.weatherEmoji} {station.telemetry.weatherDescription}
                        </span>
                      </div>
                      <div className="text-xs text-white/60 flex items-center justify-between font-mono">
                        <span>Wind: {station.telemetry.windSpeed.toFixed(1)} km/h</span>
                        <span>Humidity: {station.telemetry.relativeHumidity}%</span>
                        <span>Pressure: {station.telemetry.surfacePressure.toFixed(0)} hPa</span>
                      </div>
                      <div className="pt-2 flex items-center justify-between text-xs">
                        <Link
                          href={`/weather/${station.countrySlug}`}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          View {station.name} Weather Dossier →
                        </Link>
                        <time
                          dateTime={station.telemetry.timestamp}
                          className="text-[10px] text-white/40"
                        >
                          {new Date(station.telemetry.timestamp).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            timeZone: 'UTC',
                          })}{' '}
                          UTC
                        </time>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/50">
                      Atmospheric sensors currently calibrating satellite uplink...
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>

          {/* Section 3: Server-Rendered Editorial Explanatory Content (SEO Depth) */}
          <section
            aria-label="Global Meteorology and Atmospheric Dynamics Guide"
            className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 space-y-6 text-white/80 text-sm leading-relaxed"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Planetary Atmospheric Dynamics & Real-Time Weather Mapping
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-cyan-300">
                  Global Tropospheric Systems & Weather Observation
                </h3>
                <p>
                  Earth’s troposphere sustains dynamic thermodynamics shaped by solar irradiance gradients between the equator and polar regions. MooEarth Live maps these planetary shifts through high-frequency meteorological sensor telemetry, tracking surface pressure ridges, maritime moisture fluxes, and jet stream meanders across all continents.
                </p>
                <p>
                  By standardizing WMO atmospheric codes alongside live barometric and wind vectors, MooEarth provides researchers, travelers, and geography enthusiasts with a singular interactive lens into the living planet’s climate.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-cyan-300">
                  Zero-Fabrication Data Integrity Guarantee
                </h3>
                <p>
                  Every temperature reading, relative humidity percentage, and wind velocity metric presented on MooEarth originates strictly from verified ground stations and numerical atmospheric models via Open-Meteo.
                </p>
                <p>
                  MooEarth enforces strict indexing quality gates: if meteorological sensors experience communication downtime or temporary anomalies, pages are quarantined from search engine indexing to prevent false climate reporting.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/60">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-white">Explore Meteorological Dossiers:</span>
                <Link href="/weather/japan" className="hover:text-cyan-400 underline">Japan Weather</Link>
                <Link href="/weather/united-kingdom" className="hover:text-cyan-400 underline">UK Weather</Link>
                <Link href="/weather/france" className="hover:text-cyan-400 underline">France Weather</Link>
                <Link href="/weather/united-states" className="hover:text-cyan-400 underline">USA Weather</Link>
                <Link href="/weather/india" className="hover:text-cyan-400 underline">India Weather</Link>
                <Link href="/weather/brazil" className="hover:text-cyan-400 underline">Brazil Weather</Link>
              </div>
              <Link href="/world-news-map" className="text-cyan-400 hover:text-cyan-300 font-medium">
                View 3D World News Map →
              </Link>
            </div>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
