import React from 'react';
import Link from 'next/link';
import WebGLGlobeViewer from '@/components/Globe/WebGLGlobeViewer';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import { WeatherTelemetry } from '@/services/weatherService';
import { AdUnit } from '@/components/Monetization/AdUnit';

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
  weather: WeatherTelemetry | null;
  isTemporaryError?: boolean;
  errorMessage?: string;
  nearbyOrSubLocations?: { name: string; slug: string; type: 'city' | 'country' }[];
}

interface LocationWeatherTemplateProps {
  data: LocationWeatherViewData;
}

const GLOBAL_WEATHER_HUBS = [
  { name: 'London', slug: 'london', country: 'United Kingdom' },
  { name: 'Tokyo', slug: 'tokyo', country: 'Japan' },
  { name: 'New York City', slug: 'new-york-city', country: 'United States' },
  { name: 'New Delhi', slug: 'new-delhi', country: 'India' },
  { name: 'Paris', slug: 'paris', country: 'France' },
  { name: 'Sydney', slug: 'sydney', country: 'Australia' },
  { name: 'Berlin', slug: 'berlin', country: 'Germany' },
  { name: 'Cairo', slug: 'cairo', country: 'Egypt' },
  { name: 'Dubai', slug: 'dubai', country: 'United Arab Emirates' },
  { name: 'São Paulo', slug: 'sao-paulo', country: 'Brazil' },
  { name: 'Singapore', slug: 'singapore', country: 'Singapore' },
  { name: 'Toronto', slug: 'toronto', country: 'Canada' },
];

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
    isTemporaryError,
    errorMessage,
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
      ...(type === 'city'
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: `${countryName} Weather`,
              item: `https://www.mooearth.live/weather/${countrySlug}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: `${name} Weather`,
              item: canonicalUrl,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: `${name} Weather`,
              item: canonicalUrl,
            },
          ]),
    ],
  };

  // Schema.org Place with WeatherForecast JSON-LD
  const placeJsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': type === 'country' ? 'Country' : 'City',
    name,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    },
    url: canonicalUrl,
  };

  if (weather) {
    placeJsonLd.description = `Verified real-time meteorological observation for ${name} (${countryName}): ${Math.round(weather.temperature)}°C, ${weather.weatherDescription}. Atmospheric pressure: ${Math.round(weather.surfacePressure)} hPa, wind: ${weather.windSpeed} km/h.`;
  }

  const tomorrowForecast = weather?.daily?.[1];

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
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-white/50 mb-6 flex-wrap">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/weather" className="hover:text-cyan-400 transition-colors">Weather</Link>
            {type === 'city' && (
              <>
                <span>/</span>
                <Link href={`/weather/${countrySlug}`} className="hover:text-cyan-400 transition-colors">
                  {countryName}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-white/80 font-medium">{name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold">
                  {type === 'country' ? 'Sovereign Nation Meteorological Dossier' : 'City Weather Observatory'}
                </span>
                {weather ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Live Synoptic Ground Telemetry
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Telemetry Reconnecting
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
                {name} Weather: Today&apos;s Temperature &amp; 7-Day Forecast
              </h1>

              <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
                Current atmospheric conditions, 24-hour hourly outlook, and 7-day meteorological forecast in {name}
                {state ? `, ${state}` : ''}
                {type === 'city' ? `, ${countryName}` : capital ? ` (Capital: ${capital})` : ''}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {type === 'city' && (
                <Link
                  href={`/cities/${slug}`}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                >
                  🏙️ City Guide
                </Link>
              )}
              <Link
                href={`/countries/${countrySlug}`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
              >
                🗺️ Country Profile
              </Link>
              <Link
                href={`/?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&layer=radar`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30"
              >
                🛰️ Live Radar
              </Link>
            </div>
          </div>

          {/* Quick Weather Layers Bar */}
          <div className="pt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/40 font-mono uppercase text-[11px] mr-1">3D Map Layers:</span>
            <Link
              href={`/?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&layer=radar`}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-medium transition-colors"
            >
              🌧️ Rain Radar
            </Link>
            <Link
              href={`/?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&layer=wind`}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-medium transition-colors"
            >
              💨 Wind Streamlines
            </Link>
            <Link
              href={`/?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&layer=satellite`}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-medium transition-colors"
            >
              🛰️ Cloud Satellite
            </Link>
            <Link
              href={`/?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&layer=temperature`}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-medium transition-colors"
            >
              🌡️ Thermal Heatmap
            </Link>
            <Link
              href="/weather-map"
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 font-medium transition-colors ml-auto"
            >
              🌍 Global 3D Weather Globe →
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-10 flex-1">
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

            {/* Right: Live Telemetry Card or Authentic Unavailable State */}
            <div className="lg:col-span-5 space-y-5">
              {weather ? (
                <div className="p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-white/[0.04] to-black/80 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-white/40 block">Observed Station</span>
                      <span className="text-base font-bold text-white">{name} Station</span>
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
                        <span className="text-xl">{weather.weatherEmoji}</span>
                        <span>{weather.weatherDescription}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs font-mono text-white/60 space-y-1">
                      <div className="text-sm font-bold text-cyan-300">
                        {Math.round((weather.temperature * 9) / 5 + 32)}°F
                      </div>
                      <div>Feels like {Math.round(weather.apparentTemperature)}°C ({Math.round((weather.apparentTemperature * 9) / 5 + 32)}°F)</div>
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
                      <span className="text-[10px] uppercase font-mono text-white/40 block">Sunrise / Sunset</span>
                      <span className="text-xs font-bold text-white font-mono block">
                        {weather.sunrise || '--:--'} / {weather.sunset || '--:--'}
                      </span>
                      <span className="text-[10px] text-white/40 block font-mono">Solar Ephemeris</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-white/40 block">UV Index / Timezone</span>
                      <span className="text-sm font-bold text-white font-mono">
                        {weather.uvIndex != null ? `${weather.uvIndex} UV` : timezone || 'UTC'}
                      </span>
                      <span className="text-[10px] text-white/40 block font-mono truncate">{timezone || 'UTC'}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      href={`/?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&layer=radar`}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Inspect Live 3D Weather Radar</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.05] to-black/80 shadow-2xl space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
                      📡
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Meteorological Telemetry Unavailable</h3>
                      <p className="text-xs text-white/60">Station: {name} ({coordinates.lat.toFixed(2)}°, {coordinates.lng.toFixed(2)}°)</p>
                    </div>
                  </div>

                  <p className="text-xs text-white/80 leading-relaxed">
                    Live ground station telemetry for this coordinate grid is currently synchronizing or undergoing scheduled network refresh.
                    {errorMessage ? ` (${errorMessage})` : ''}
                  </p>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70 space-y-1">
                    <div className="font-semibold text-white">Zero Synthetic Data Policy</div>
                    <div>MooEarth Live strictly refuses to fabricate or show dummy temperatures when ground station feeds are unreachable.</div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Link
                      href={`/?lat=${coordinates.lat.toFixed(4)}&lng=${coordinates.lng.toFixed(4)}&layer=radar`}
                      className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs text-center transition-colors"
                    >
                      Open Live Radar
                    </Link>
                    <Link
                      href={`/countries/${countrySlug}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs text-center transition-colors"
                    >
                      View Country Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tomorrow Weather Outlook Card */}
          {tomorrowForecast && (
            <section
              aria-label={`Tomorrow's Weather Outlook for ${name}`}
              className="p-6 sm:p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-black to-slate-900/40 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                    Target Forecast • {tomorrowForecast.dayName} ({tomorrowForecast.date})
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {name} Weather Tomorrow
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl">{tomorrowForecast.weatherEmoji}</span>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                      {tomorrowForecast.temperatureMax}°C
                      <span className="text-sm font-normal text-white/50 ml-1.5 font-sans">
                        / {tomorrowForecast.temperatureMin}°C
                      </span>
                    </div>
                    <div className="text-xs text-cyan-300 font-mono">
                      {Math.round((tomorrowForecast.temperatureMax * 9) / 5 + 32)}°F max / {Math.round((tomorrowForecast.temperatureMin * 9) / 5 + 32)}°F min
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-white/80 leading-relaxed">
                Tomorrow in <strong className="text-white">{name}</strong>, atmospheric conditions are forecast to be{' '}
                <strong className="text-cyan-300">{tomorrowForecast.weatherDescription.toLowerCase()}</strong> with a maximum daytime temperature of{' '}
                <strong className="text-white">{tomorrowForecast.temperatureMax}°C ({Math.round((tomorrowForecast.temperatureMax * 9) / 5 + 32)}°F)</strong> and nighttime low around{' '}
                <strong className="text-white">{tomorrowForecast.temperatureMin}°C ({Math.round((tomorrowForecast.temperatureMin * 9) / 5 + 32)}°F)</strong>.
                Precipitation probability is rated at <strong className="text-white">{tomorrowForecast.precipitationProbability}%</strong> with a maximum UV index of{' '}
                <strong className="text-white">{tomorrowForecast.uvIndexMax}</strong>. Sunrise is scheduled for <strong className="text-white">{tomorrowForecast.sunrise}</strong> and sunset at <strong className="text-white">{tomorrowForecast.sunset}</strong>.
              </p>
            </section>
          )}

          {/* 24-Hour Hourly Forecast Strip */}
          {weather?.hourly && weather.hourly.length > 0 && (
            <section aria-label={`24-Hour Hourly Weather Forecast for ${name}`} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>⏱️</span>
                  <span>24-Hour Hourly Forecast</span>
                </h2>
                <span className="text-xs font-mono text-white/40">Hourly Telemetry</span>
              </div>

              <div className="overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="flex items-stretch gap-2.5 min-w-max">
                  {weather.hourly.map((item, idx) => (
                    <div
                      key={item.time}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col justify-between w-24 sm:w-28 transition-colors ${
                        idx === 0
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/20 text-white/80'
                      }`}
                    >
                      <div className="text-[11px] font-mono text-white/60 mb-1">{item.hour}</div>
                      <div className="text-2xl my-1">{item.weatherEmoji}</div>
                      <div className="text-sm font-bold font-mono text-white">{item.temperature}°C</div>
                      <div className="text-[10px] text-white/50 font-mono mt-0.5">
                        {Math.round((item.temperature * 9) / 5 + 32)}°F
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-2 pt-1.5 border-t border-white/5 flex items-center justify-center gap-0.5">
                        <span>💧</span>
                        <span>{item.precipitationProbability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 7-Day Meteorological Outlook Table */}
          {weather?.daily && weather.daily.length > 0 && (
            <section aria-label={`7-Day Weather Forecast for ${name}`} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span>📅</span>
                    <span>{name} 7-Day Forecast</span>
                  </h2>
                  <p className="text-xs text-white/60">Weekly temperature trends, rain chances, and solar ephemeris</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                  Global Synoptic Forecast Model
                </span>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="divide-y divide-white/5">
                  {weather.daily.map((day) => (
                    <div
                      key={day.date}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-[160px]">
                        <span className="text-2xl sm:text-3xl">{day.weatherEmoji}</span>
                        <div>
                          <div className="text-sm font-bold text-white">{day.dayName}</div>
                          <div className="text-xs text-white/40 font-mono">{day.date}</div>
                        </div>
                      </div>

                      <div className="text-xs text-white/70 sm:max-w-xs flex-1">
                        {day.weatherDescription}
                      </div>

                      <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end text-xs font-mono">
                        <div className="text-right">
                          <span className="text-[10px] text-white/40 block">Rain Probability</span>
                          <span className="font-bold text-cyan-300">💧 {day.precipitationProbability}%</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-white/40 block">Sun Times</span>
                          <span className="text-white/70">{day.sunrise} / {day.sunset}</span>
                        </div>
                        <div className="text-right min-w-[90px]">
                          <span className="text-[10px] text-white/40 block">Temp High / Low</span>
                          <span className="text-sm font-black text-white">{day.temperatureMax}°C</span>
                          <span className="text-white/40 ml-1">/ {day.temperatureMin}°C</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Sustaining Weather Dossier Advertisement (Off by default, CLS-safe) */}
          <AdUnit placementId="weather_page_banner" className="my-8" />

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
                <p>{description}</p>
                <p>
                  MooEarth synthesizes live surface observations adhering strictly to World Meteorological Organization (WMO) atmospheric standards. Telemetry calibrated via Open-Meteo observational feeds.
                </p>
              </div>
            </div>

            {nearbyOrSubLocations.length > 0 && (
              <div className="pt-6 border-t border-white/10 space-y-2.5">
                <span className="text-xs font-mono uppercase text-white/50 block">
                  {type === 'country' ? 'Major Metropolitan Weather Stations in this Country:' : 'Nearby Regional Cities:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {nearbyOrSubLocations.map(loc => (
                    <Link
                      key={loc.slug}
                      href={`/weather/${loc.slug}`}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-cyan-300 transition-colors"
                    >
                      📍 {loc.name} Weather
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Global Weather Hubs Navigation for crawlability and discovery */}
            <div className="pt-6 border-t border-white/10 space-y-2.5">
              <span className="text-xs font-mono uppercase text-white/50 block">
                Explore Major Global Weather Hubs:
              </span>
              <div className="flex flex-wrap gap-2">
                {GLOBAL_WEATHER_HUBS.filter(h => h.slug !== slug).map(hub => (
                  <Link
                    key={hub.slug}
                    href={`/weather/${hub.slug}`}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-xs text-white/70 hover:text-cyan-200 transition-colors"
                  >
                    🌍 {hub.name} Weather
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>

        <GlobalFooter />
      </div>
    </>
  );
}
